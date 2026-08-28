import type { Request, Response, NextFunction } from "express";
import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import multer from "multer";
import crypto from "crypto";
import { db } from "./db";
import { adminUsers, customers, customRequests, orderStatuses } from "@shared/schema";
import { and, eq, isNull, or } from "drizzle-orm";
import { supabase, getStorageBucket, ensureUploadBucket } from "./supabase";

const JWT_SECRET = process.env.SESSION_SECRET || "fallback_secret_for_development";

// Multer: keep file in memory for uploading to Supabase Storage
const upload = multer({ storage: multer.memoryStorage() });

declare global {
  namespace Express {
    interface Request {
      user?: { id: number; username: string; role: string };
      customer?: { id: number; email: string };
    }
  }
}

// Auth Middleware
const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      req.user = user as { id: number; username: string; role: string };
      next();
    });
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
};

// Super admin only
const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== "super_admin") {
    return res.status(403).json({ message: "Forbidden: Super admin only" });
  }
  next();
};

// Customer auth (JWT with type 'customer')
const authenticateCustomer = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Unauthorized" });
  const token = authHeader.split(" ")[1];
  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (err || decoded?.type !== "customer") return res.status(401).json({ message: "Unauthorized" });
    req.customer = { id: decoded.id, email: decoded.email };
    next();
  });
};

const getOptionalCustomerFromAuth = (req: Request) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.split(" ")[1];
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded?.type !== "customer" || !decoded?.id) return null;
    return { id: Number(decoded.id), email: String(decoded.email ?? "") };
  } catch {
    return null;
  }
};

// Admin or customer — sets req.user (admin) or req.customer (customer)
const authenticateAdminOrCustomer = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Unauthorized" });
  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded?.type === "customer" && decoded?.id) {
      req.customer = { id: decoded.id, email: decoded.email ?? "" };
      return next();
    }
    if (decoded?.id && decoded?.username) {
      req.user = { id: decoded.id, username: decoded.username, role: decoded.role ?? "admin" };
      return next();
    }
  } catch {
    // fallthrough
  }
  res.status(401).json({ message: "Unauthorized" });
};

type TimelineEntry = {
  at: string;
  type: string;
  message: string;
  actor?: string;
  meta?: Record<string, unknown>;
};

const appendTimeline = (
  current: unknown,
  entry: TimelineEntry,
): TimelineEntry[] => {
  const existing = Array.isArray(current) ? current : [];
  return [...existing, entry];
};

const sanitizeUploadPathSegment = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const sanitizeUploadFolder = (value: unknown): string => {
  if (typeof value !== "string") return "";
  return value
    .split("/")
    .map((segment) => sanitizeUploadPathSegment(segment))
    .filter(Boolean)
    .slice(0, 5)
    .join("/");
};

const getPathInUploadBucketFromUrl = (
  url: string,
  bucket: string,
): string | null => {
  try {
    const parsed = new URL(url);
    const marker = `/storage/v1/object/public/${bucket}/`;
    const idx = parsed.pathname.indexOf(marker);
    if (idx < 0) return null;
    const pathInBucket = decodeURIComponent(
      parsed.pathname.slice(idx + marker.length),
    );
    return pathInBucket || null;
  } catch {
    return null;
  }
};

const deleteUploadUrlsFromBucket = async (urls: string[]): Promise<void> => {
  if (!supabase || urls.length === 0) return;
  const bucket = getStorageBucket();
  const paths = Array.from(
    new Set(
      urls
        .map((url) => getPathInUploadBucketFromUrl(url, bucket))
        .filter((path): path is string => !!path),
    ),
  );
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from(bucket).remove(paths);
  if (error) {
    console.warn("Supabase storage cleanup error:", error.message);
  }
};

const normalizeOptionName = (value: string): string =>
  value
    .trim()
    .replace(/\s+/g, " ");

const normalizeColorValue = (value: string): string => {
  const normalized = normalizeOptionName(value).toLowerCase();
  const rawHex = normalized.startsWith("#") ? normalized.slice(1) : normalized;
  if (/^[0-9a-f]{3}$/i.test(rawHex)) {
    return `#${rawHex
      .split("")
      .map((ch) => `${ch}${ch}`)
      .join("")}`;
  }
  if (/^[0-9a-f]{6}$/i.test(rawHex)) {
    return `#${rawHex}`;
  }
  return normalized;
};

const isValidColorInput = (value: string): boolean => {
  const normalized = normalizeOptionName(value);
  if (!normalized) return false;
  if (!normalized.startsWith("#")) return true;
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(normalized);
};

const isSameOptionValue = (a: string, b: string): boolean =>
  normalizeOptionName(a).toLowerCase() === normalizeOptionName(b).toLowerCase();

const rangesOverlap = (
  aMin: number,
  aMax: number,
  bMin: number,
  bMax: number,
): boolean => aMin <= bMax && aMax >= bMin;

const normalizePincode = (value: string): string => value.trim().replace(/\s+/g, "");

const coordinateCache = new Map<string, { lat: number; lon: number }>();

const getCoordinatesForPincode = async (
  pincode: string,
): Promise<{ lat: number; lon: number } | null> => {
  const normalized = normalizePincode(pincode);
  if (!normalized) return null;
  if (coordinateCache.has(normalized)) return coordinateCache.get(normalized)!;
  const url = `https://nominatim.openstreetmap.org/search?country=India&postalcode=${encodeURIComponent(
    normalized,
  )}&format=json&limit=1`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "SOZOLEN-3D/1.0 (shipping quote)",
      "Accept-Language": "en",
    },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as Array<{ lat?: string; lon?: string }>;
  const first = data?.[0];
  if (!first?.lat || !first?.lon) return null;
  const lat = Number(first.lat);
  const lon = Number(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const coords = { lat, lon };
  coordinateCache.set(normalized, coords);
  return coords;
};

const haversineKm = (
  from: { lat: number; lon: number },
  to: { lat: number; lon: number },
): number => {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const earthKm = 6371;
  const dLat = toRad(to.lat - from.lat);
  const dLon = toRad(to.lon - from.lon);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(from.lat)) *
      Math.cos(toRad(to.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthKm * c;
};

const computeShippingQuote = async (deliveryPincode: string) => {
  const settings = await storage.getOrCreateShippingSettings();
  const warehousePincode = normalizePincode(settings.warehousePincode);
  const normalizedDeliveryPincode = normalizePincode(deliveryPincode);
  if (!warehousePincode) {
    throw new Error("Warehouse pincode is not configured");
  }
  if (!normalizedDeliveryPincode) {
    throw new Error("Delivery pincode is required");
  }
  const [warehouseCoords, deliveryCoords] = await Promise.all([
    getCoordinatesForPincode(warehousePincode),
    getCoordinatesForPincode(normalizedDeliveryPincode),
  ]);
  if (!warehouseCoords || !deliveryCoords) {
    throw new Error("Unable to resolve pincode location for shipping calculation");
  }
  const distanceKm = haversineKm(warehouseCoords, deliveryCoords);
  const roundedDistanceKm = Math.ceil(distanceKm);
  const ranges = await storage.getShippingRanges();
  const matchedRange = ranges.find(
    (r) => roundedDistanceKm >= r.minKm && roundedDistanceKm <= r.maxKm,
  );
  if (!matchedRange) {
    throw new Error("Shipping range not configured for this delivery distance");
  }
  return {
    warehousePincode,
    deliveryPincode: normalizedDeliveryPincode,
    distanceKm: roundedDistanceKm,
    shippingCharge: matchedRange.price,
    matchedRange: {
      id: matchedRange.id,
      minKm: matchedRange.minKm,
      maxKm: matchedRange.maxKm,
      price: matchedRange.price,
    },
  };
};

const siteConfigStreamClients = new Set<Response>();

const broadcastSiteConfigUpdate = (payload: unknown) => {
  const event = `event: site-config\ndata: ${JSON.stringify(payload)}\n\n`;
  siteConfigStreamClients.forEach((client) => {
    try {
      client.write(event);
    } catch {
      siteConfigStreamClients.delete(client);
    }
  });
};

const resolveThemePreviewStatus = (value: unknown): "live" | "draft" =>
  value === "draft" ? "draft" : "live";

const mapSiteConfigByStatus = (
  config: Awaited<ReturnType<typeof storage.getOrCreateSiteConfig>>,
  status: "live" | "draft",
) => {
  if (status === "draft") {
    return {
      ...config,
      bannerEnabled: !!config.draftBannerImageUrl,
      bannerImageUrl: config.draftBannerImageUrl ?? null,
      bannerLinkUrl: config.draftBannerLinkUrl ?? null,
      theme: config.draftTheme ?? config.theme,
    };
  }
  return config;
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await ensureUploadBucket();

  // --- Auth Routes ---
  app.post(api.auth.login.path, async (req, res) => {
    try {
      const { username, password } = api.auth.login.input.parse(req.body);
      const user = await storage.getAdminUserByUsername(username);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const role = (user as { role?: string }).role ?? "admin";
      const token = jwt.sign({ id: user.id, username: user.username, role }, JWT_SECRET, { expiresIn: '1d' });
      res.json({ message: "Logged in successfully", token });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.post(api.auth.logout.path, (req, res) => {
    res.json({ message: "Logged out" });
  });

  app.get(api.auth.me.path, authenticateJWT, (req, res) => {
    if (req.user) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  });

  // --- Admins (super_admin only) ---
  app.get(api.admins.list.path, authenticateJWT, requireSuperAdmin, async (req, res) => {
    try {
      const list = await storage.getAdminUsers();
      res.json(list);
    } catch (e) {
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.post(api.admins.create.path, authenticateJWT, requireSuperAdmin, async (req, res) => {
    try {
      const { username, password } = api.admins.create.input.parse(req.body);
      const existing = await storage.getAdminUserByUsername(username);
      if (existing) return res.status(400).json({ message: "Username already exists" });
      const passwordHash = await bcrypt.hash(password, 10);
      const created = await storage.createAdminUser({ username, passwordHash, role: "admin" });
      res.status(201).json({ id: created.id, username: created.username, role: created.role });
    } catch (err) {
      if (err instanceof z.ZodError) res.status(400).json({ message: err.errors[0].message });
      else res.status(500).json({ message: "Internal error" });
    }
  });

  app.patch(api.admins.updatePassword.path, authenticateJWT, requireSuperAdmin, async (req, res) => {
    try {
      const { password } = api.admins.updatePassword.input.parse(req.body);
      const id = Number(req.params.id);
      const passwordHash = await bcrypt.hash(password, 10);
      const updated = await storage.updateAdminPassword(id, passwordHash);
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json({ id: updated.id, username: updated.username });
    } catch (err) {
      if (err instanceof z.ZodError) res.status(400).json({ message: err.errors[0].message });
      else res.status(500).json({ message: "Internal error" });
    }
  });

  // --- Categories ---
  app.get(api.categories.list.path, async (req, res) => {
    const list = await storage.getCategories();
    res.json(list);
  });

  app.get(api.categories.get.path, async (req, res) => {
    const category = await storage.getCategory(Number(req.params.id));
    if (!category) return res.status(404).json({ message: "Not found" });
    res.json(category);
  });

  app.get(api.categories.products.path, async (req, res) => {
    const list = await storage.getProducts(Number(req.params.id));
    res.json(list);
  });

  app.post(api.categories.create.path, authenticateJWT, async (req, res) => {
    try {
      const input = api.categories.create.input.parse(req.body);
      const category = await storage.createCategory(input);
      res.status(201).json(category);
    } catch (err) {
      if (err instanceof z.ZodError) res.status(400).json({ message: err.errors[0].message });
      else res.status(500).json({ message: "Internal error" });
    }
  });

  app.patch(api.categories.update.path, authenticateJWT, async (req, res) => {
    try {
      const input = api.categories.update.input.parse(req.body);
      const category = await storage.updateCategory(Number(req.params.id), input);
      if (!category) return res.status(404).json({ message: "Not found" });
      res.json(category);
    } catch (err) {
      if (err instanceof z.ZodError) res.status(400).json({ message: err.errors[0].message });
      else res.status(500).json({ message: "Internal error" });
    }
  });

  app.delete(api.categories.delete.path, authenticateJWT, async (req, res) => {
    const id = Number(req.params.id);
    const existing = await storage.getCategory(id);
    if (!existing) return res.status(404).json({ message: "Not found" });
    const deleted = await storage.deleteCategory(id);
    if (!deleted) return res.status(404).json({ message: "Not found" });
    await deleteUploadUrlsFromBucket(
      existing.imageUrl ? [existing.imageUrl] : [],
    );
    res.status(204).send();
  });

  // --- Option masters ---
  app.get(api.options.colors.list.path, async (req, res) => {
    const list = await storage.getColorOptions();
    res.json(list);
  });

  app.post(api.options.colors.create.path, authenticateJWT, async (req, res) => {
    try {
      const input = api.options.colors.create.input.parse(req.body);
      const name = normalizeOptionName(input.name);
      if (!name) return res.status(400).json({ message: "Color name is required" });
      if (!isValidColorInput(name)) {
        return res.status(400).json({ message: "Invalid color code. Use #RGB or #RRGGBB format." });
      }
      const existing = await storage.getColorOptions();
      const normalizedName = normalizeColorValue(name);
      if (existing.some((item) => normalizeColorValue(item.name) === normalizedName)) {
        return res.status(400).json({ message: "Color already exists" });
      }
      const valueToStore = normalizedName.startsWith("#") ? normalizedName : name;
      const created = await storage.createColorOption({ name: valueToStore });
      res.status(201).json(created);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.patch(api.options.colors.update.path, authenticateJWT, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.options.colors.update.input.parse(req.body);
      const name = input.name != null ? normalizeOptionName(input.name) : undefined;
      if (name === "") return res.status(400).json({ message: "Color name is required" });
      if (name != null && !isValidColorInput(name)) {
        return res.status(400).json({ message: "Invalid color code. Use #RGB or #RRGGBB format." });
      }
      if (name) {
        const existing = await storage.getColorOptions();
        const normalizedName = normalizeColorValue(name);
        if (existing.some((item) => item.id !== id && normalizeColorValue(item.name) === normalizedName)) {
          return res.status(400).json({ message: "Color already exists" });
        }
      }
      const updatedValue =
        name != null
          ? (normalizeColorValue(name).startsWith("#")
              ? normalizeColorValue(name)
              : name)
          : undefined;
      const updated = await storage.updateColorOption(id, { ...(updatedValue != null ? { name: updatedValue } : {}) });
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.delete(api.options.colors.delete.path, authenticateJWT, async (req, res) => {
    const deleted = await storage.deleteColorOption(Number(req.params.id));
    if (!deleted) return res.status(404).json({ message: "Not found" });
    res.status(204).send();
  });

  app.get(api.options.sizes.list.path, async (req, res) => {
    const list = await storage.getSizeOptions();
    res.json(list);
  });

  app.post(api.options.sizes.create.path, authenticateJWT, async (req, res) => {
    try {
      const input = api.options.sizes.create.input.parse(req.body);
      const name = normalizeOptionName(input.name);
      if (!name) return res.status(400).json({ message: "Size name is required" });
      const existing = await storage.getSizeOptions();
      if (existing.some((item) => isSameOptionValue(item.name, name))) {
        return res.status(400).json({ message: "Size already exists" });
      }
      const created = await storage.createSizeOption({ name });
      res.status(201).json(created);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.patch(api.options.sizes.update.path, authenticateJWT, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.options.sizes.update.input.parse(req.body);
      const name = input.name != null ? normalizeOptionName(input.name) : undefined;
      if (name === "") return res.status(400).json({ message: "Size name is required" });
      if (name) {
        const existing = await storage.getSizeOptions();
        if (existing.some((item) => item.id !== id && isSameOptionValue(item.name, name))) {
          return res.status(400).json({ message: "Size already exists" });
        }
      }
      const updated = await storage.updateSizeOption(id, { ...(name != null ? { name } : {}) });
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.delete(api.options.sizes.delete.path, authenticateJWT, async (req, res) => {
    const deleted = await storage.deleteSizeOption(Number(req.params.id));
    if (!deleted) return res.status(404).json({ message: "Not found" });
    res.status(204).send();
  });

  app.get(api.options.others.list.path, async (req, res) => {
    const list = await storage.getOtherOptions();
    res.json(list);
  });

  app.post(api.options.others.create.path, authenticateJWT, async (req, res) => {
    try {
      const input = api.options.others.create.input.parse(req.body);
      const name = normalizeOptionName(input.name);
      if (!name) return res.status(400).json({ message: "Option name is required" });
      const existing = await storage.getOtherOptions();
      if (existing.some((item) => isSameOptionValue(item.name, name))) {
        return res.status(400).json({ message: "Option already exists" });
      }
      const created = await storage.createOtherOption({ name });
      res.status(201).json(created);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.patch(api.options.others.update.path, authenticateJWT, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.options.others.update.input.parse(req.body);
      const name = input.name != null ? normalizeOptionName(input.name) : undefined;
      if (name === "") return res.status(400).json({ message: "Option name is required" });
      if (name) {
        const existing = await storage.getOtherOptions();
        if (existing.some((item) => item.id !== id && isSameOptionValue(item.name, name))) {
          return res.status(400).json({ message: "Option already exists" });
        }
      }
      const updated = await storage.updateOtherOption(id, { ...(name != null ? { name } : {}) });
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.delete(api.options.others.delete.path, authenticateJWT, async (req, res) => {
    const deleted = await storage.deleteOtherOption(Number(req.params.id));
    if (!deleted) return res.status(404).json({ message: "Not found" });
    res.status(204).send();
  });

  // --- Shipping pricing ---
  app.get(api.shipping.quote.get.path, async (req, res) => {
    try {
      const deliveryPincodeRaw =
        typeof req.query.deliveryPincode === "string" ? req.query.deliveryPincode : "";
      const deliveryPincode = normalizePincode(deliveryPincodeRaw);
      if (!deliveryPincode) {
        return res.status(400).json({ message: "Delivery pincode is required" });
      }
      const quote = await computeShippingQuote(deliveryPincode);
      res.json(quote);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Internal error";
      if (
        message.includes("required") ||
        message.includes("not configured") ||
        message.includes("Unable to resolve") ||
        message.includes("range")
      ) {
        return res.status(400).json({ message });
      }
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.get(api.shipping.settings.get.path, authenticateJWT, async (req, res) => {
    try {
      const settings = await storage.getOrCreateShippingSettings();
      res.json(settings);
    } catch {
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.put(api.shipping.settings.update.path, authenticateJWT, async (req, res) => {
    try {
      const input = api.shipping.settings.update.input.parse(req.body);
      const warehousePincode = input.warehousePincode.trim();
      if (!warehousePincode) return res.status(400).json({ message: "Warehouse pincode is required" });
      const updated = await storage.updateShippingSettings({ warehousePincode });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.get(api.shipping.ranges.list.path, authenticateJWT, async (req, res) => {
    try {
      const list = await storage.getShippingRanges();
      res.json(list);
    } catch {
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.post(api.shipping.ranges.create.path, authenticateJWT, async (req, res) => {
    try {
      const input = api.shipping.ranges.create.input.parse(req.body);
      const minKm = Number(input.minKm);
      const maxKm = Number(input.maxKm);
      const price = Number(input.price);
      if (minKm < 0 || maxKm < 0 || price < 0) {
        return res.status(400).json({ message: "KM and price must be non-negative numbers" });
      }
      if (minKm > maxKm) {
        return res.status(400).json({ message: "Min KM must be less than or equal to Max KM" });
      }
      const existing = await storage.getShippingRanges();
      const overlap = existing.find((row) => rangesOverlap(minKm, maxKm, row.minKm, row.maxKm));
      if (overlap) {
        return res.status(400).json({
          message:
            "Already in the between KM range is created, check and create a right KM range",
        });
      }
      const created = await storage.createShippingRange({ minKm, maxKm, price });
      res.status(201).json(created);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.patch(api.shipping.ranges.update.path, authenticateJWT, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.shipping.ranges.update.input.parse(req.body);
      const current = await storage.getShippingRange(id);
      if (!current) return res.status(404).json({ message: "Not found" });

      const minKm = input.minKm != null ? Number(input.minKm) : current.minKm;
      const maxKm = input.maxKm != null ? Number(input.maxKm) : current.maxKm;
      const price = input.price != null ? Number(input.price) : current.price;
      if (minKm < 0 || maxKm < 0 || price < 0) {
        return res.status(400).json({ message: "KM and price must be non-negative numbers" });
      }
      if (minKm > maxKm) {
        return res.status(400).json({ message: "Min KM must be less than or equal to Max KM" });
      }

      const existing = await storage.getShippingRanges();
      const overlap = existing.find(
        (row) => row.id !== id && rangesOverlap(minKm, maxKm, row.minKm, row.maxKm),
      );
      if (overlap) {
        return res.status(400).json({
          message:
            "Already in the between KM range is created, check and create a right KM range",
        });
      }
      const updated = await storage.updateShippingRange(id, { minKm, maxKm, price });
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.delete(api.shipping.ranges.delete.path, authenticateJWT, async (req, res) => {
    const deleted = await storage.deleteShippingRange(Number(req.params.id));
    if (!deleted) return res.status(404).json({ message: "Not found" });
    res.status(204).send();
  });

  // --- Products ---
  app.get(api.products.list.path, async (req, res) => {
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
    const productList = await storage.getProducts(categoryId);
    res.json(productList);
  });

  app.get(api.products.homeSlider.path, async (req, res) => {
    const requestedLimit = Number(req.query.limit);
    const limit = Number.isFinite(requestedLimit)
      ? Math.max(1, Math.min(15, Math.floor(requestedLimit)))
      : 12;
    const [productList, orderList] = await Promise.all([
      storage.getProducts(),
      storage.getOrders(),
    ]);
    const recent = [...productList]
      .sort((a, b) => {
        const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bt - at;
      })
      .slice(0, limit);

    const productById = new Map(productList.map((product) => [product.id, product]));
    const orderCountByProductId = new Map<number, number>();
    for (const order of orderList) {
      for (const item of order.items) {
        const productId = Number(item.productId);
        if (!Number.isInteger(productId) || productId <= 0) continue;
        const quantity = Number(item.quantity);
        const normalizedQuantity =
          Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
        orderCountByProductId.set(
          productId,
          (orderCountByProductId.get(productId) ?? 0) + normalizedQuantity,
        );
      }
    }

    const topOrdered = Array.from(orderCountByProductId.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([productId]) => productById.get(productId))
      .filter((product): product is NonNullable<typeof product> => !!product)
      .slice(0, limit);

    if (topOrdered.length < limit) {
      const selected = new Set(topOrdered.map((product) => product.id));
      for (const product of recent) {
        if (selected.has(product.id)) continue;
        topOrdered.push(product);
        selected.add(product.id);
        if (topOrdered.length >= limit) break;
      }
    }

    res.json({ topOrdered, recent });
  });

  // Register /api/products/:id/reviews and /api/products/:id/rating before /api/products/:id so they match first
  app.get(api.reviews.listByProduct.path, async (req, res) => {
    const productId = Number(req.params.id);
    if (!Number.isInteger(productId) || productId < 1) {
      return res.status(400).json({ message: "Invalid product id" });
    }
    const list = await storage.getReviewsByProduct(productId);
    res.json(list.map((r) => ({
      id: r.id,
      productId: r.productId,
      customerId: r.customerId,
      orderId: r.orderId,
      rating: r.rating,
      comment: r.comment,
      imageUrl: r.imageUrl ?? undefined,
      createdAt: r.createdAt?.toISOString?.() ?? null,
      customerName: r.customerName ?? undefined,
    })));
  });

  app.get(api.reviews.productRating.path, async (req, res) => {
    const productId = Number(req.params.id);
    if (!Number.isInteger(productId) || productId < 1) {
      return res.status(400).json({ message: "Invalid product id" });
    }
    const rating = await storage.getProductRating(productId);
    res.json(rating);
  });

  app.get(api.products.get.path, async (req, res) => {
    const productId = Number(req.params.id);
    if (!Number.isInteger(productId) || productId < 1) {
      return res.status(404).json({ message: "Not found" });
    }
    const product = await storage.getProduct(productId);
    if (!product) return res.status(404).json({ message: "Not found" });
    res.json(product);
  });

  app.post(api.products.create.path, authenticateJWT, async (req, res) => {
    try {
      const input = api.products.create.input.parse(req.body);
      if (input.hasVariants) {
        const variants = Array.isArray(input.variants) ? input.variants : [];
        if (variants.length === 0) {
          return res.status(400).json({ message: "At least one variant is required when variants are enabled" });
        }
        const defaultCount = variants.filter((variant) => variant.isDefault).length;
        if (defaultCount !== 1) {
          return res.status(400).json({ message: "Exactly one default variant is required" });
        }
      }
      const product = await storage.createProduct(input);
      res.status(201).json(product);
    } catch (err) {
      if (err instanceof z.ZodError) res.status(400).json({ message: err.errors[0].message });
      else res.status(500).json({ message: "Internal error" });
    }
  });

  app.patch(api.products.update.path, authenticateJWT, async (req, res) => {
    try {
      const input = api.products.update.input.parse(req.body);
      if (input.hasVariants) {
        const variants = Array.isArray(input.variants) ? input.variants : [];
        if (variants.length === 0) {
          return res.status(400).json({ message: "At least one variant is required when variants are enabled" });
        }
        const defaultCount = variants.filter((variant) => variant.isDefault).length;
        if (defaultCount !== 1) {
          return res.status(400).json({ message: "Exactly one default variant is required" });
        }
      }
      const product = await storage.updateProduct(Number(req.params.id), input);
      if (!product) return res.status(404).json({ message: "Not found" });
      res.json(product);
    } catch (err) {
      if (err instanceof z.ZodError) res.status(400).json({ message: err.errors[0].message });
      else res.status(500).json({ message: "Internal error" });
    }
  });

  app.delete(api.products.delete.path, authenticateJWT, async (req, res) => {
    const id = Number(req.params.id);
    const existing = await storage.getProduct(id);
    if (!existing) return res.status(404).json({ message: "Not found" });
    const deleted = await storage.deleteProduct(id);
    if (!deleted) return res.status(404).json({ message: "Not found" });
    await deleteUploadUrlsFromBucket([
      ...(existing.imageUrl ? [existing.imageUrl] : []),
      ...(Array.isArray(existing.productImages) ? existing.productImages : []),
      ...(
        Array.isArray((existing as { variants?: Array<{ images?: string[] }> }).variants)
          ? (existing as { variants?: Array<{ images?: string[] }> }).variants!.flatMap((variant) =>
              Array.isArray(variant.images) ? variant.images : [],
            )
          : []
      ),
    ]);
    res.status(204).send();
  });

  // --- Custom Requests ---
  app.get(api.customRequests.list.path, authenticateJWT, async (req, res) => {
    const reqs = await storage.getCustomRequests();
    res.json(reqs);
  });

  app.post(api.customRequests.create.path, async (req, res) => {
    try {
      const input = api.customRequests.create.input.parse(req.body);
      if (!input.phone?.trim()) {
        return res.status(400).json({ message: "Mobile number is required" });
      }
      if (!input.addressLine1?.trim()) {
        return res.status(400).json({ message: "Address line 1 is required" });
      }
      if (!input.city?.trim()) {
        return res.status(400).json({ message: "City is required" });
      }
      if (!input.state?.trim()) {
        return res.status(400).json({ message: "State is required" });
      }
      if (!input.pincode?.trim()) {
        return res.status(400).json({ message: "Pincode is required" });
      }
      const authCustomer = getOptionalCustomerFromAuth(req);
      let mappedCustomerId: number | null = null;
      let mappedEmail = input.email;
      let mappedPhone = input.phone;

      if (authCustomer?.id) {
        const customer = await storage.getCustomer(authCustomer.id);
        if (customer) {
          mappedCustomerId = customer.id;
          mappedEmail = customer.email;
          mappedPhone = customer.phone;
        }
      }

      const composedAddress = [
        input.addressLine1.trim(),
        input.addressLine2?.trim() || "",
        [input.city.trim(), input.state.trim(), input.pincode.trim()]
          .filter(Boolean)
          .join(", "),
      ]
        .filter(Boolean)
        .join(", ");

      const customReq = await storage.createCustomRequest({
        ...input,
        customerId: mappedCustomerId ?? undefined,
        email: mappedEmail,
        phone: mappedPhone,
        address: composedAddress,
        addressLine1: input.addressLine1.trim(),
        addressLine2: input.addressLine2?.trim() || null,
        city: input.city.trim(),
        state: input.state.trim(),
        pincode: input.pincode.trim(),
        quoteStatus: "pending",
        timeline: [
          {
            at: new Date().toISOString(),
            type: "request_submitted",
            message: "Custom request submitted.",
            actor: mappedCustomerId ? "customer" : "guest",
          },
        ],
      } as any);
      const trackingId = `SOZOLEN3D-${customReq.id}`;
      const { sendCustomRequestConfirmationEmail, sendAdminCustomFormEmail } = await import("./email");
      const confirmResult = await sendCustomRequestConfirmationEmail(
        mappedEmail,
        input.name,
        trackingId
      );
      if (!confirmResult.ok) {
        console.warn("[custom-request] Confirmation email not sent:", confirmResult.error);
      }
      // Notify admins about new custom form submission
      sendAdminCustomFormEmail({
        requestId: customReq.id,
        customerName: input.name,
        customerEmail: mappedEmail,
        description: input.description,
      }).catch((e) => console.error("[email] Admin custom form notification failed:", e));
      res.status(201).json(customReq);
    } catch (err) {
      if (err instanceof z.ZodError) res.status(400).json({ message: err.errors[0].message });
      else res.status(500).json({ message: "Internal error" });
    }
  });

  app.get(api.track.get.path, async (req, res) => {
    try {
      const raw = req.params.trackingId?.trim() ?? "";
      const match = /^SOZOLEN3D-(\d+)$/i.exec(raw);
      if (!match) {
        return res.status(400).json({ message: "Invalid tracking ID format. Use SOZOLEN3D- followed by your request number (e.g. SOZOLEN3D-1)." });
      }
      const id = parseInt(match[1], 10);
      const req_ = await storage.getCustomRequest(id);
      if (!req_) {
        return res.status(404).json({ message: "No request found for this tracking ID. Please check and try again." });
      }
      const trackingId = `SOZOLEN3D-${req_.id}`;
      res.json({
        trackingId,
        id: req_.id,
        customerId: req_.customerId ?? null,
        name: req_.name,
        email: req_.email,
        phone: req_.phone,
        address: req_.address ?? null,
        addressLine1: req_.addressLine1 ?? null,
        addressLine2: req_.addressLine2 ?? null,
        city: req_.city ?? null,
        state: req_.state ?? null,
        pincode: req_.pincode ?? null,
        description: req_.description,
        status: req_.status,
        quotedPrice: req_.quotedPrice ?? null,
        quoteNotes: req_.quoteNotes ?? null,
        quoteEta: req_.quoteEta ?? null,
        quoteStatus: req_.quoteStatus,
        quoteSentAt: req_.quoteSentAt ? req_.quoteSentAt.toISOString() : null,
        convertedOrderId: req_.convertedOrderId ?? null,
        timeline: req_.timeline ?? [],
        imageUrls: req_.imageUrls ?? [],
        createdAt: req_.createdAt,
      });
    } catch (err) {
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.patch(api.customRequests.updateStatus.path, authenticateJWT, async (req, res) => {
    try {
      const input = api.customRequests.updateStatus.input.parse(req.body);
      const updated = await storage.updateCustomRequestStatus(Number(req.params.id), input.status);
      if (!updated) return res.status(404).json({ message: "Not found" });
      const { sendCustomRequestStatusEmail } = await import("./email");
      const emailResult = await sendCustomRequestStatusEmail(
        updated.email,
        updated.id,
        updated.status,
        updated.name
      );
      if (!emailResult.ok) {
        console.warn("[custom-request] Status email not sent:", emailResult.error);
      }
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) res.status(400).json({ message: err.errors[0].message });
      else res.status(500).json({ message: "Internal error" });
    }
  });

  app.patch(api.customRequests.sendQuote.path, authenticateJWT, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.customRequests.sendQuote.input.parse(req.body);
      const existing = await storage.getCustomRequest(id);
      if (!existing) return res.status(404).json({ message: "Not found" });
      const timeline = appendTimeline(existing.timeline, {
        at: new Date().toISOString(),
        type: "quote_sent",
        message: `Quote sent for INR ${input.quotedPrice}.`,
        actor: req.user?.username ?? "admin",
        meta: { quotedPrice: input.quotedPrice, quoteEta: input.quoteEta ?? null },
      });
      const [updated] = await db
        .update(customRequests)
        .set({
          quotedPrice: input.quotedPrice,
          quoteNotes: input.quoteNotes ?? null,
          quoteEta: input.quoteEta ?? null,
          quoteStatus: "sent",
          quoteSentAt: new Date(),
          status: "in_progress",
          timeline,
        })
        .where(eq(customRequests.id, id))
        .returning();
      const { sendCustomRequestQuoteEmail } = await import("./email");
      const trackingId = `SOZOLEN3D-${updated.id}`;
      const quoteEmailResult = await sendCustomRequestQuoteEmail({
        to: updated.email,
        customerName: updated.name,
        trackingId,
        quotedPrice: updated.quotedPrice ?? 0,
        quoteNotes: updated.quoteNotes ?? undefined,
        quoteEta: updated.quoteEta ?? undefined,
      });
      if (!quoteEmailResult.ok) {
        console.warn("[custom-request] Quote email not sent:", quoteEmailResult.error);
      }
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.post(api.customRequests.convertToOrder.path, authenticateJWT, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { adminOverride, shippingPincode } = api.customRequests.convertToOrder.input.parse(req.body ?? {});
      const request = await storage.getCustomRequest(id);
      if (!request) return res.status(404).json({ message: "Not found" });
      if (request.convertedOrderId) {
        return res.status(400).json({ message: "Request already converted to order" });
      }
      if (
        typeof request.quotedPrice !== "number" ||
        !Number.isFinite(request.quotedPrice) ||
        request.quotedPrice < 0.01
      ) {
        return res.status(400).json({ message: "Quoted price is required before conversion" });
      }
      if (request.quoteStatus !== "accepted" && !adminOverride) {
        return res.status(400).json({ message: "Quote must be accepted before conversion" });
      }

      let customerId = request.customerId ?? null;
      if (!customerId) {
        const byEmail = await storage.getCustomerByEmail(request.email);
        const byPhone = request.phone ? await storage.getCustomerByPhone(request.phone) : undefined;
        customerId = byEmail?.id ?? byPhone?.id ?? null;
      }

      let shippingCharge = 0;
      const fallbackAddressPincode =
        typeof request.address === "string"
          ? request.address.match(/\b\d{6}\b/)?.[0]
          : "";
      const candidatePincode =
        shippingPincode?.trim() ||
        request.pincode?.trim() ||
        fallbackAddressPincode ||
        "";
      if (candidatePincode) {
        try {
          const shipping = await computeShippingQuote(candidatePincode);
          shippingCharge = shipping.shippingCharge;
        } catch {
          // Do not block conversion when pincode geocoding fails.
          // Keep shipping as 0 so admin can proceed and adjust order later if needed.
          shippingCharge = 0;
        }
      }

      const createdOrder = await storage.createOrder({
        customerId: customerId ?? undefined,
        name: request.name,
        phone: request.phone,
        email: request.email,
        address: (() => {
          const structuredAddress = [
            request.addressLine1,
            request.addressLine2,
            [request.city, request.state, request.pincode].filter(Boolean).join(", "),
          ]
            .filter(Boolean)
            .join(", ");
          return (request.address ?? structuredAddress) || "Address not provided";
        })(),
        items: [
          {
            productId: 0,
            quantity: 1,
            price: request.quotedPrice,
            name: `Custom Request #${request.id}`,
          },
        ],
        subtotalPrice: request.quotedPrice,
        shippingCharge,
        totalPrice: request.quotedPrice + shippingCharge,
        additionalNotes: request.description,
        paymentStatus: "not_paid",
      } as any);

      const timeline = appendTimeline(request.timeline, {
        at: new Date().toISOString(),
        type: "converted_to_order",
        message: `Converted to order #${createdOrder.id}.`,
        actor: req.user?.username ?? "admin",
        meta: { orderId: createdOrder.id },
      });

      const [updatedRequest] = await db
        .update(customRequests)
        .set({
          customerId: customerId ?? request.customerId ?? null,
          convertedOrderId: createdOrder.id,
          status: "completed",
          timeline,
        })
        .where(eq(customRequests.id, request.id))
        .returning();

      res.status(201).json({ request: updatedRequest, order: createdOrder });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal error" });
    }
  });

  // --- Orders ---
  app.get(api.orders.list.path, authenticateJWT, async (req, res) => {
    const orderList = await storage.getOrders();
    res.json(orderList);
  });

  app.post(api.orders.create.path, async (req, res) => {
    try {
      const input = api.orders.create.input.parse(req.body);
      const computedSubtotal = input.items.reduce(
        (sum, item) => sum + Number(item.price) * Number(item.quantity),
        0,
      );
      const deliveryPincode =
        input.shippingPincode?.trim() ||
        (input.address.match(/\b\d{6}\b/)?.[0] ?? "");

      let computedShippingCharge = 0;
      if (deliveryPincode) {
        const quote = await computeShippingQuote(deliveryPincode);
        computedShippingCharge = quote.shippingCharge;
      }

      const payload = {
        ...input,
        subtotalPrice: computedSubtotal,
        shippingCharge: computedShippingCharge,
        totalPrice: computedSubtotal + computedShippingCharge,
      };
      const order = await storage.createOrder(payload);
      // Notify admins about new online order
      const { sendAdminNewOrderEmail } = await import("./email");
      sendAdminNewOrderEmail({
        orderId: order.id,
        customerName: order.name,
        customerEmail: order.email,
        total: order.totalPrice,
        isOffline: false,
        items: order.items.map((i: any) => ({ name: i.name, quantity: i.quantity })),
      }).catch((e) => console.error("[email] Admin online order notification failed:", e));

      res.status(201).json(order);
    } catch (err) {
      if (err instanceof z.ZodError) res.status(400).json({ message: err.errors[0].message });
      else {
        const message = err instanceof Error ? err.message : "Internal error";
        if (
          message.includes("required") ||
          message.includes("not configured") ||
          message.includes("Unable to resolve") ||
          message.includes("range")
        ) {
          res.status(400).json({ message });
        } else {
          res.status(500).json({ message: "Internal error" });
        }
      }
    }
  });

  app.get(api.orders.get.path, authenticateJWT, async (req, res) => {
    const order = await storage.getOrder(Number(req.params.id));
    if (!order) return res.status(404).json({ message: "Not found" });
    res.json(order);
  });

  app.patch(api.orders.updateStatus.path, authenticateJWT, async (req, res) => {
    try {
      const { status } = api.orders.updateStatus.input.parse(req.body);
      const id = Number(req.params.id);
      const updated = await storage.updateOrderStatus(id, status);
      if (!updated) return res.status(404).json({ message: "Not found" });
      // Notify customer of status change; notify admins on cancellation
      const { sendOrderStatusChangeEmail, sendAdminOrderCancelledEmail } = await import("./email");
      sendOrderStatusChangeEmail({
        to: updated.email,
        customerName: updated.name,
        orderId: updated.id,
        newStatus: status,
      }).catch((e) => console.error("[email] Order status change email failed:", e));
      if (status === "cancelled") {
        sendAdminOrderCancelledEmail({
          orderId: updated.id,
          customerName: updated.name,
          customerEmail: updated.email,
        }).catch((e) => console.error("[email] Admin order cancelled notification failed:", e));
      }
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) res.status(400).json({ message: err.errors[0].message });
      else res.status(500).json({ message: "Internal error" });
    }
  });

  app.patch(api.orders.update.path, authenticateJWT, async (req, res) => {
    try {
      const input = api.orders.update.input.parse(req.body);
      const id = Number(req.params.id);
      const updated = await storage.updateOrder(id, input);
      if (!updated) return res.status(404).json({ message: "Not found" });
      if (input.paymentStatus === "paid" && !updated.invoiceHtml) {
        const html = await storage.generateInvoiceHtml(id);
        if (html) await storage.updateOrder(id, { invoiceHtml: html });
        const withInvoice = await storage.getOrder(id);
        return res.json(withInvoice ?? updated);
      }
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) res.status(400).json({ message: err.errors[0].message });
      else res.status(500).json({ message: "Internal error" });
    }
  });

  app.get(api.orders.getInvoice.path, authenticateAdminOrCustomer, async (req, res) => {
    const orderId = Number(req.params.id);
    if (!Number.isInteger(orderId) || orderId < 1) return res.status(404).json({ message: "Not found" });
    const order = await storage.getOrder(orderId);
    if (!order) return res.status(404).json({ message: "Not found" });
    if (order.paymentStatus !== "paid") return res.status(403).json({ message: "Invoice available only for paid orders" });
    const isAdmin = !!req.user;
    const isCustomer = !!req.customer;
    if (isAdmin) {
      // admin can view any paid order
    } else if (isCustomer && order.customerId === req.customer!.id) {
      // customer can view own order
    } else {
      return res.status(403).json({ message: "Forbidden" });
    }
    let html = order.invoiceHtml;
    if (!html) {
      html = await storage.generateInvoiceHtml(orderId);
      if (html) await storage.updateOrder(orderId, { invoiceHtml: html });
    }
    if (!html) return res.status(500).json({ message: "Could not generate invoice" });
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  });

  app.get(api.invoiceTemplate.get.path, authenticateJWT, async (req, res) => {
    try {
      const template = await storage.getOrCreateInvoiceTemplate();
      res.json({
        id: template.id,
        companyName: template.companyName,
        logoUrl: template.logoUrl,
        address: template.address,
        phone: template.phone,
        email: template.email,
        footerText: template.footerText,
        updatedAt: template.updatedAt?.toISOString?.() ?? null,
      });
    } catch {
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.put(api.invoiceTemplate.update.path, authenticateJWT, async (req, res) => {
    try {
      const input = api.invoiceTemplate.update.input.parse(req.body);
      const template = await storage.saveInvoiceTemplate(input);
      res.json({
        id: template.id,
        companyName: template.companyName,
        logoUrl: template.logoUrl,
        address: template.address,
        phone: template.phone,
        email: template.email,
        footerText: template.footerText,
        updatedAt: template.updatedAt?.toISOString?.() ?? null,
      });
    } catch (err) {
      if (err instanceof z.ZodError) res.status(400).json({ message: err.errors[0].message });
      else res.status(500).json({ message: "Internal error" });
    }
  });

  // --- Reviews (list/rating registered above before products.get) ---
  app.get(api.reviews.ratingsBatch.path, async (req, res) => {
    const raw = req.query.productIds;
    const productIds = (typeof raw === "string" ? raw.split(",") : Array.isArray(raw) ? raw : [])
      .map((id) => Number(id))
      .filter((id) => !isNaN(id) && id > 0);
    const ratings = await storage.getProductRatingsBatch(productIds);
    res.json(ratings);
  });

  app.post(api.reviews.createAdmin.path, authenticateJWT, async (req, res) => {
    try {
      const productId = Number(req.params.id);
      if (!Number.isInteger(productId) || productId < 1) {
        return res.status(400).json({ message: "Invalid product id" });
      }
      const body = req.body && typeof req.body === "object" ? req.body : {};
      const { rating, comment, imageUrl } = api.reviews.createAdmin.input.parse({
        rating: body.rating,
        comment: body.comment ?? undefined,
        imageUrl: body.imageUrl ?? undefined,
      });
      const review = await storage.createReview({
        productId,
        customerId: null,
        orderId: null,
        rating,
        comment: comment ?? null,
        imageUrl: imageUrl ?? null,
      });
      res.status(201).json({
        id: review.id,
        productId: review.productId,
        customerId: review.customerId,
        orderId: review.orderId,
        rating: review.rating,
        comment: review.comment,
        imageUrl: review.imageUrl ?? undefined,
        createdAt: review.createdAt?.toISOString?.() ?? null,
      });
    } catch (err) {
      if (err instanceof z.ZodError) res.status(400).json({ message: err.errors[0].message });
      else res.status(500).json({ message: "Internal error" });
    }
  });

  app.post(api.reviews.create.path, authenticateCustomer, async (req, res) => {
    try {
      const { productId, orderId, rating, comment } = api.reviews.create.input.parse(req.body);
      const order = await storage.getOrder(orderId);
      if (!order || order.customerId !== req.customer!.id) return res.status(404).json({ message: "Order not found" });
      if (order.status !== "delivered") return res.status(400).json({ message: "Can only review after order is delivered" });
      const hasItem = order.items.some((i) => i.productId === productId);
      if (!hasItem) return res.status(400).json({ message: "Product not in this order" });
      const already = await storage.hasCustomerReviewedOrderProduct(req.customer!.id, orderId, productId);
      if (already) return res.status(400).json({ message: "You already reviewed this product for this order" });
      const review = await storage.createReview({
        productId,
        customerId: req.customer!.id,
        orderId,
        rating,
        comment: comment ?? null,
      });
      res.status(201).json(review);
    } catch (err) {
      if (err instanceof z.ZodError) res.status(400).json({ message: err.errors[0].message });
      else res.status(500).json({ message: "Internal error" });
    }
  });

  // --- Customer auth: send OTP (signup or forgot password) ---
  app.post(api.customer.sendOtp.path, async (req, res) => {
    try {
      const { email, type } = api.customer.sendOtp.input.parse(req.body);
      if (type === "signup") {
        const existing = await storage.getCustomerByEmail(email);
        if (existing) return res.status(400).json({ message: "Email already registered" });
      } else {
        const existing = await storage.getCustomerByEmail(email);
        if (!existing) return res.status(400).json({ message: "No account found with this email" });
      }
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      await storage.createVerificationCode(email, code, type);

      const { sendVerificationEmail } = await import("./email");
      const emailResult = await sendVerificationEmail(email, code, type);

      if (!emailResult.ok) {
        if (process.env.NODE_ENV === "production") {
          return res.status(503).json({
            message: "Could not send verification email. Please try again or contact support.",
            error: emailResult.error,
          });
        }
        return res.status(503).json({
          message: "Email not configured. Set RESEND_API_KEY in .env. For dev, OTP is below.",
          otp: code,
        });
      }

      const payload: { message: string; otp?: string } = {
        message: type === "signup" ? "Verification code sent to your email" : "Reset code sent to your email",
      };
      if (process.env.NODE_ENV !== "production") payload.otp = code;
      res.json(payload);
    } catch (err) {
      if (err instanceof z.ZodError) res.status(400).json({ message: err.errors[0].message });
      else res.status(500).json({ message: "Internal error" });
    }
  });

  app.post(api.customer.verifyAndRegister.path, async (req, res) => {
    try {
      const { email, code, name, phone, password } = api.customer.verifyAndRegister.input.parse(req.body);
      const valid = await storage.getValidVerificationCode(email, code, "signup");
      if (!valid) return res.status(401).json({ message: "Invalid or expired code" });
      const passwordHash = await bcrypt.hash(password, 10);
      const customer = await storage.createCustomer({ email, passwordHash, name, phone });
      await storage.linkGuestOrdersToCustomer(customer.id, customer.email, customer.phone);
      await storage.deleteVerificationCode(email, "signup");
      const token = jwt.sign(
        { id: customer.id, type: "customer", email: customer.email },
        JWT_SECRET,
        { expiresIn: "7d" }
      );
      res.status(201).json({ message: "Account created successfully", token });
    } catch (err) {
      if (err instanceof z.ZodError) res.status(400).json({ message: err.errors[0].message });
      else res.status(500).json({ message: "Internal error" });
    }
  });

  app.post(api.customer.verifyAndResetPassword.path, async (req, res) => {
    try {
      const { email, code, newPassword } = api.customer.verifyAndResetPassword.input.parse(req.body);
      const valid = await storage.getValidVerificationCode(email, code, "forgot_password");
      if (!valid) return res.status(401).json({ message: "Invalid or expired code" });
      const customer = await storage.getCustomerByEmail(email);
      if (!customer) return res.status(401).json({ message: "Invalid or expired code" });
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await db.update(customers).set({ passwordHash }).where(eq(customers.id, customer.id));
      await storage.deleteVerificationCode(email, "forgot_password");
      res.json({ message: "Password reset successfully" });
    } catch (err) {
      if (err instanceof z.ZodError) res.status(400).json({ message: err.errors[0].message });
      else res.status(500).json({ message: "Internal error" });
    }
  });

  app.post(api.customer.login.path, async (req, res) => {
    try {
      const { email, password } = api.customer.login.input.parse(req.body);
      const customer = await storage.getCustomerByEmail(email);
      if (!customer) return res.status(401).json({ message: "Invalid credentials" });
      const isMatch = await bcrypt.compare(password, customer.passwordHash);
      if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });
      await storage.linkGuestOrdersToCustomer(customer.id, customer.email, customer.phone);
      const token = jwt.sign(
        { id: customer.id, type: "customer", email: customer.email },
        JWT_SECRET,
        { expiresIn: "7d" }
      );
      res.json({ message: "Logged in successfully", token });
    } catch (err) {
      if (err instanceof z.ZodError) res.status(400).json({ message: err.errors[0].message });
      else res.status(500).json({ message: "Internal error" });
    }
  });

  app.get(api.customer.me.path, authenticateCustomer, async (req, res) => {
    const customer = await storage.getCustomer(req.customer!.id);
    if (!customer) return res.status(404).json({ message: "Not found" });
    res.json({ id: customer.id, email: customer.email, name: customer.name, phone: customer.phone ?? null });
  });

  app.post(api.customer.customRequestQuoteResponse.path, authenticateCustomer, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { action } = api.customer.customRequestQuoteResponse.input.parse(req.body);
      const customer = await storage.getCustomer(req.customer!.id);
      if (!customer) return res.status(404).json({ message: "Customer not found" });
      const request = await storage.getCustomRequest(id);
      if (!request) return res.status(404).json({ message: "Custom request not found" });

      const belongsToCustomer =
        (request.customerId != null && request.customerId === customer.id) ||
        request.email.toLowerCase() === customer.email.toLowerCase();
      if (!belongsToCustomer) return res.status(404).json({ message: "Custom request not found" });

      if (request.quoteStatus !== "sent") {
        return res.status(400).json({ message: "Quote response is only allowed when status is sent" });
      }

      const timeline = appendTimeline(request.timeline, {
        at: new Date().toISOString(),
        type: action === "accepted" ? "quote_accepted" : "quote_rejected",
        message: action === "accepted" ? "Customer accepted the quote." : "Customer rejected the quote.",
        actor: "customer",
      });

      const [updated] = await db
        .update(customRequests)
        .set({
          customerId: request.customerId ?? customer.id,
          quoteStatus: action,
          status: action === "accepted" ? "in_progress" : "pending",
          timeline,
        })
        .where(eq(customRequests.id, id))
        .returning();

      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.get(api.customer.orders.path, authenticateCustomer, async (req, res) => {
    const customer = await storage.getCustomer(req.customer!.id);
    if (customer) {
      await storage.linkGuestOrdersToCustomer(customer.id, customer.email, customer.phone);
    }
    const orderList = await storage.getOrdersByCustomerId(req.customer!.id);
    res.json(orderList);
  });

  app.get(api.customer.addresses.path, authenticateCustomer, async (req, res) => {
    const list = await storage.getCustomerAddresses(req.customer!.id);
    res.json(list);
  });

  app.post(api.customer.addressCreate.path, authenticateCustomer, async (req, res) => {
    try {
      const input = api.customer.addressCreate.input.parse(req.body);
      const addr = await storage.createCustomerAddress({
        customerId: req.customer!.id,
        ...input,
      });
      res.status(201).json(addr);
    } catch (err) {
      if (err instanceof z.ZodError) res.status(400).json({ message: err.errors[0].message });
      else res.status(500).json({ message: "Internal error" });
    }
  });

  app.patch(api.customer.addressSetDefault.path, authenticateCustomer, async (req, res) => {
    const id = Number(req.params.id);
    const addr = await storage.getCustomerAddress(id, req.customer!.id);
    if (!addr) return res.status(404).json({ message: "Not found" });
    await storage.setDefaultAddress(id, req.customer!.id);
    res.json({ message: "Default address updated" });
  });

  app.patch(api.customer.addressUpdate.path, authenticateCustomer, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.customer.addressUpdate.input.parse(req.body);
      const updated = await storage.updateCustomerAddress(id, req.customer!.id, input);
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) res.status(400).json({ message: err.errors[0].message });
      else res.status(500).json({ message: "Internal error" });
    }
  });

  app.delete(api.customer.addressDelete.path, authenticateCustomer, async (req, res) => {
    const id = Number(req.params.id);
    const addr = await storage.getCustomerAddress(id, req.customer!.id);
    if (!addr) return res.status(404).json({ message: "Not found" });
    if (addr.isDefault) {
      return res.status(400).json({ message: "Default address cannot be deleted" });
    }
    const deleted = await storage.deleteCustomerAddress(id, req.customer!.id);
    if (!deleted) return res.status(404).json({ message: "Not found" });
    res.status(204).send();
  });

  // --- Customers list (admin) ---
  app.get(api.customers.list.path, authenticateJWT, async (req, res) => {
    try {
      const list = await storage.getCustomers();
      res.json(list.map((c) => ({ ...c, createdAt: c.createdAt?.toISOString() })));
    } catch (e) {
      res.status(500).json({ message: "Internal error" });
    }
  });

  // --- Admin create customer ---
  app.post(api.customers.create.path, authenticateJWT, async (req, res) => {
    try {
      const input = api.customers.create.input.parse(req.body);
      const existing = await storage.getCustomerByEmail(input.email);
      if (existing) return res.status(409).json({ message: "A customer with this email already exists" });
      const passwordHash = await bcrypt.hash(input.password, 10);
      const customer = await storage.createCustomer({
        email: input.email,
        name: input.name,
        phone: input.phone,
        passwordHash,
      });
      // Generate OTP so customer can set/reset their password
      const otp = Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join("");
      await storage.createVerificationCode(input.email, otp, "forgot_password");
      const { sendAdminCreatedCustomerEmail } = await import("./email");
      sendAdminCreatedCustomerEmail({ to: input.email, customerName: input.name, otp }).catch((e) =>
        console.error("[email] Admin-created customer welcome email failed:", e),
      );
      res.status(201).json({ ...customer, createdAt: customer.createdAt?.toISOString() });
    } catch (err) {
      if (err instanceof z.ZodError) res.status(400).json({ message: err.errors[0].message });
      else res.status(500).json({ message: "Internal error" });
    }
  });

  // --- Admin create offline order ---
  app.post(api.orders.adminCreate.path, authenticateJWT, async (req, res) => {
    try {
      const input = api.orders.adminCreate.input.parse(req.body);
      const order = await storage.createOrder({
        name: input.name,
        phone: input.phone,
        email: input.email,
        address: input.address,
        additionalNotes: input.additionalNotes,
        adminNotes: input.adminNotes,
        customerId: input.customerId,
        status: input.status ?? "pending",
        paymentStatus: input.paymentStatus ?? "not_paid",
        paymentMode: input.paymentMode ?? null,
        subtotalPrice: input.subtotalPrice,
        shippingCharge: input.shippingCharge,
        totalPrice: input.totalPrice,
        items: input.items,
        isOfflineOrder: true,
      } as any);
      // Notify admins about new offline order
      const { sendAdminNewOrderEmail } = await import("./email");
      sendAdminNewOrderEmail({
        orderId: order.id,
        customerName: order.name,
        customerEmail: order.email,
        total: order.totalPrice,
        isOffline: true,
        items: order.items.map((i: any) => ({ name: i.name, quantity: i.quantity })),
      }).catch((e) => console.error("[email] Admin offline order notification failed:", e));

      if (input.paymentStatus === "paid" && !order.invoiceHtml) {
        const html = await storage.generateInvoiceHtml(order.id);
        if (html) await storage.updateOrder(order.id, { invoiceHtml: html });
        const withInvoice = await storage.getOrder(order.id);
        return res.status(201).json(withInvoice ?? order);
      }
      res.status(201).json(order);
    } catch (err) {
      if (err instanceof z.ZodError) res.status(400).json({ message: err.errors[0].message });
      else res.status(500).json({ message: "Internal error" });
    }
  });

  app.get(api.customers.orders.path, authenticateJWT, async (req, res) => {
    try {
      const ordersByCustomer = await storage.getOrdersByCustomerId(Number(req.params.id));
      res.json(ordersByCustomer);
    } catch (e) {
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.get(api.customers.customRequests.path, authenticateJWT, async (req, res) => {
    try {
      const customerId = Number(req.params.id);
      const customer = await storage.getCustomer(customerId);
      if (!customer) return res.status(404).json({ message: "Customer not found" });
      const requests = await storage.getCustomRequests();
      const normalizedEmail = customer.email.trim().toLowerCase();
      const filtered = requests
        .filter(
          (r) =>
            r.customerId === customerId ||
            (typeof r.email === "string" && r.email.trim().toLowerCase() === normalizedEmail),
        )
        .sort((a, b) => {
          const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bt - at;
        });
      res.json(filtered);
    } catch {
      res.status(500).json({ message: "Internal error" });
    }
  });

  // --- Site config (banner + theme) ---
  app.get(api.siteConfig.get.path, async (_req, res) => {
    try {
      const status = resolveThemePreviewStatus(_req.query.status);
      const config = await storage.getOrCreateSiteConfig();
      res.json(mapSiteConfigByStatus(config, status));
    } catch {
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.get(api.siteConfig.stream.path, async (req, res) => {
    const status = resolveThemePreviewStatus(req.query.status);
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();
    siteConfigStreamClients.add(res);
    const config = await storage.getOrCreateSiteConfig();
    res.write(`event: site-config\ndata: ${JSON.stringify(mapSiteConfigByStatus(config, status))}\n\n`);
    const keepAlive = setInterval(() => {
      res.write(": keep-alive\n\n");
    }, 25000);
    req.on("close", () => {
      clearInterval(keepAlive);
      siteConfigStreamClients.delete(res);
    });
  });

  app.get(api.siteConfig.adminGet.path, authenticateJWT, async (_req, res) => {
    try {
      const config = await storage.getOrCreateSiteConfig();
      res.json(config);
    } catch {
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.put(api.siteConfig.adminUpdate.path, authenticateJWT, async (req, res) => {
    try {
      const input = api.siteConfig.adminUpdate.input.parse(req.body ?? {});
      const updated = await storage.updateSiteConfig(input);
      broadcastSiteConfigUpdate(updated);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.put(api.siteConfig.adminSaveDraft.path, authenticateJWT, async (req, res) => {
    try {
      const input = api.siteConfig.adminSaveDraft.input.parse(req.body ?? {});
      const updated = await storage.updateSiteConfigDraft({
        bannerImageUrl: input.bannerImageUrl ?? null,
        bannerLinkUrl: input.bannerLinkUrl ?? null,
        theme: input.theme,
      });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.post(api.siteConfig.adminPublishLiveFromDraft.path, authenticateJWT, async (_req, res) => {
    try {
      const updated = await storage.publishDraftToLiveSiteConfig();
      broadcastSiteConfigUpdate(updated);
      res.json(updated);
    } catch {
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.post(api.siteConfig.adminRetrievePreviousLive.path, authenticateJWT, async (_req, res) => {
    try {
      const updated = await storage.restorePreviousLiveSiteConfig();
      broadcastSiteConfigUpdate(updated);
      res.json(updated);
    } catch {
      res.status(500).json({ message: "Internal error" });
    }
  });

  // --- Uploads (Supabase Storage) ---
  app.post(api.uploads.create.path, upload.single("image"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    if (!supabase) {
      return res
        .status(503)
        .json({ message: "File storage not configured (missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)" });
    }
    const ext = req.file.originalname?.replace(/^.*\./, "") || "bin";
    const safeExt = /^[a-z0-9]+$/i.test(ext) ? ext : "bin";
    const fileName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}.${safeExt}`;
    const folder = sanitizeUploadFolder(req.body?.folder);
    const filePath = folder ? `${folder}/${fileName}` : fileName;
    const bucket = getStorageBucket();
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype || "application/octet-stream",
        upsert: false,
      });
    if (error) {
      console.error("Supabase storage upload error:", error);
      return res.status(500).json({ message: "Upload failed", error: error.message });
    }
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    res.status(201).json({ url: urlData.publicUrl });
  });

  app.post(api.uploads.delete.path, authenticateJWT, async (req, res) => {
    try {
      const { url } = api.uploads.delete.input.parse(req.body);
      if (!supabase) {
        return res
          .status(503)
          .json({ message: "File storage not configured (missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)" });
      }
      const bucket = getStorageBucket();
      const pathInBucket = getPathInUploadBucketFromUrl(url, bucket);
      if (!pathInBucket) {
        return res.json({ deleted: false });
      }
      const { error } = await supabase.storage.from(bucket).remove([pathInBucket]);
      if (error) {
        console.error("Supabase storage delete error:", error);
        return res.json({ deleted: false });
      }
      res.json({ deleted: true });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal error" });
    }
  });

  // Database Seed
  setTimeout(async () => {
    try {
      const existingAdmins = await db.select().from(adminUsers);
      if (existingAdmins.length === 0) {
        const passwordHash = await bcrypt.hash("admin123", 10);
        await storage.createAdminUser({ username: "superadmin", passwordHash, role: "super_admin" });
      } else {
        const hasSuperAdmin = existingAdmins.some((a: { role?: string }) => a.role === "super_admin");
        if (!hasSuperAdmin) {
          await db.update(adminUsers).set({ role: "super_admin" }).where(eq(adminUsers.id, existingAdmins[0].id));
        }
      }

      const existingCategories = await storage.getCategories();
      let defaultCategoryId: number | null = null;
      if (existingCategories.length === 0) {
        const cat = await storage.createCategory({
          name: "3D Models",
          imageUrl: "https://images.unsplash.com/photo-1616499370260-c002f635d5c4?auto=format&fit=crop&q=80&w=800",
        });
        defaultCategoryId = cat.id;
      }

      const existingProducts = await storage.getProducts();
      for (const p of existingProducts) {
        if (!p.sku) {
          const sku = `SOL-${String(p.id).padStart(4, "0")}`;
          await storage.updateProduct(p.id, { sku });
        }
      }
      if (existingProducts.length === 0) {
        await storage.createProduct({
          categoryId: defaultCategoryId ?? null,
          title: "Custom Mini Car",
          description: "A beautifully detailed 3D model of a miniature classic car.",
          price: 1500,
          imageUrl: "https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?auto=format&fit=crop&q=80&w=800",
        });
        await storage.createProduct({
          categoryId: defaultCategoryId ?? null,
          title: "Personalized Figure",
          description: "Your photo turned into a 3D printable stylized figure.",
          price: 3000,
          imageUrl: "https://images.unsplash.com/photo-1544256718-3bcf237f3974?auto=format&fit=crop&q=80&w=800",
        });
      }

      await storage.getOrCreateSiteConfig();
    } catch (e) {
      console.error("Failed to seed database", e);
    }
  }, 1000);

  return httpServer;
}
