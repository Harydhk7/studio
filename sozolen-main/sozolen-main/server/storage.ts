import { db } from "./db";
import {
  products, categories, colorOptions, sizeOptions, otherOptions, shippingSettings, shippingRanges, customRequests, orders, reviews, adminUsers, customers, verificationCodes, customerAddresses, invoiceTemplate, siteConfig,
  type Product, type Category, type ColorOption, type SizeOption, type OtherOption, type ShippingSettings, type ShippingRange, type CustomRequest, type Order, type Review, type AdminUser, type Customer, type CustomerAddress, type InvoiceTemplate, type SiteConfig
} from "@shared/schema";
import { eq, asc, desc, and, gt, isNull, or } from "drizzle-orm";
import type { z } from "zod";
import { insertProductSchema, insertCategorySchema, insertCustomRequestSchema, insertOrderSchema, insertAdminSchema, insertShippingRangeSchema, insertSiteConfigSchema } from "@shared/schema";

type InsertProduct = z.infer<typeof insertProductSchema>;
type InsertCategory = z.infer<typeof insertCategorySchema>;
type InsertCustomRequest = z.infer<typeof insertCustomRequestSchema>;
type InsertOrder = z.infer<typeof insertOrderSchema>;
type InsertAdmin = z.infer<typeof insertAdminSchema>;
type InsertShippingRange = z.infer<typeof insertShippingRangeSchema>;
type InsertSiteConfig = z.infer<typeof insertSiteConfigSchema>;
type ProductVariant = {
  id: string;
  name: string;
  price: number;
  images: string[];
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
};
type OrderItem = {
  productId: number;
  quantity: number;
  price: number;
  name: string;
  variantId?: string | null;
  variantName?: string | null;
  selectedColor?: string | null;
  selectedSize?: string | null;
  selectedOther?: string | null;
};
type TimelineEntry = {
  at: string;
  type: string;
  message: string;
  actor?: string;
  meta?: Record<string, unknown>;
};

const escapeHtml = (s: string): string =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const normalizeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry) => entry.length > 0);
};

const normalizeOrderItems = (value: unknown): OrderItem[] => {
  if (!Array.isArray(value)) return [];
  const normalized: OrderItem[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const candidate = item as Record<string, unknown>;
    const productId = Number(candidate.productId);
    const quantity = Number(candidate.quantity);
    const price = Number(candidate.price);
    const name = typeof candidate.name === "string" ? candidate.name.trim() : "";
    if (!Number.isFinite(productId) || !Number.isFinite(quantity) || !Number.isFinite(price) || !name) {
      continue;
    }
    const selectedColor =
      typeof candidate.selectedColor === "string" && candidate.selectedColor.trim().length > 0
        ? candidate.selectedColor.trim()
        : null;
    const variantId =
      typeof candidate.variantId === "string" && candidate.variantId.trim().length > 0
        ? candidate.variantId.trim()
        : null;
    const variantName =
      typeof candidate.variantName === "string" && candidate.variantName.trim().length > 0
        ? candidate.variantName.trim()
        : null;
    const selectedSize =
      typeof candidate.selectedSize === "string" && candidate.selectedSize.trim().length > 0
        ? candidate.selectedSize.trim()
        : null;
    const selectedOther =
      typeof candidate.selectedOther === "string" && candidate.selectedOther.trim().length > 0
        ? candidate.selectedOther.trim()
        : null;
    normalized.push({
      productId,
      quantity,
      price,
      name,
      variantId,
      variantName,
      selectedColor,
      selectedSize,
      selectedOther,
    });
  }
  return normalized;
};

const normalizeTimeline = (value: unknown): TimelineEntry[] => {
  if (!Array.isArray(value)) return [];
  const entries: TimelineEntry[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const candidate = item as Record<string, unknown>;
    const at = typeof candidate.at === "string" ? candidate.at : "";
    const type = typeof candidate.type === "string" ? candidate.type : "";
    const message = typeof candidate.message === "string" ? candidate.message : "";
    if (!at || !type || !message) continue;
    entries.push({
      at,
      type,
      message,
      actor: typeof candidate.actor === "string" ? candidate.actor : undefined,
      meta:
        candidate.meta && typeof candidate.meta === "object" && !Array.isArray(candidate.meta)
          ? (candidate.meta as Record<string, unknown>)
          : undefined,
    });
  }
  return entries;
};

const roundMoney = (value: unknown): number => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.round(num * 100) / 100;
};

const normalizeSizePriceMap = (value: unknown): Record<string, number> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const source = value as Record<string, unknown>;
  const normalized: Record<string, number> = {};
  for (const [rawKey, rawValue] of Object.entries(source)) {
    const key = rawKey.trim();
    const amount = Number(rawValue);
    if (!key || !Number.isFinite(amount) || amount < 0) continue;
    normalized[key] = roundMoney(amount);
  }
  return normalized;
};

const normalizeProductVariants = (value: unknown): ProductVariant[] => {
  if (!Array.isArray(value)) return [];
  const normalized: ProductVariant[] = [];
  for (let index = 0; index < value.length; index += 1) {
    const item = value[index];
    if (!item || typeof item !== "object") continue;
    const candidate = item as Record<string, unknown>;
    const name = typeof candidate.name === "string" ? candidate.name.trim() : "";
    const price = Number(candidate.price);
    const images = normalizeStringArray(candidate.images);
    if (!name || !Number.isFinite(price) || price < 0 || images.length === 0) continue;
    const rawId = typeof candidate.id === "string" ? candidate.id.trim() : "";
    const id = rawId || `variant-${index + 1}`;
    normalized.push({
      id,
      name,
      price: roundMoney(price),
      images,
      isDefault: !!candidate.isDefault,
      isActive: candidate.isActive !== false,
      sortOrder:
        Number.isFinite(Number(candidate.sortOrder)) && Number(candidate.sortOrder) >= 0
          ? Math.floor(Number(candidate.sortOrder))
          : index,
    });
  }
  if (normalized.length === 0) return [];
  const hasDefault = normalized.some((variant) => variant.isDefault);
  if (!hasDefault) normalized[0].isDefault = true;
  let defaultAssigned = false;
  for (const variant of normalized) {
    if (variant.isDefault && !defaultAssigned) {
      defaultAssigned = true;
    } else if (variant.isDefault && defaultAssigned) {
      variant.isDefault = false;
    }
  }
  return normalized.sort((a, b) => a.sortOrder - b.sortOrder);
};

const applyVariantDisplayFields = (product: Product): Product => {
  const variants = normalizeProductVariants((product as { variants?: unknown }).variants);
  if (!product.hasVariants || variants.length === 0) {
    return { ...product, hasVariants: false, variants };
  }
  const defaultVariant = variants.find((variant) => variant.isDefault) ?? variants[0];
  return {
    ...product,
    variants,
    price: defaultVariant.price,
    imageUrl: defaultVariant.images[0] ?? product.imageUrl,
    productImages: defaultVariant.images.length > 0 ? defaultVariant.images : product.productImages,
  };
};

const formatMoney = (value: number): string =>
  value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export interface IStorage {
  // Admin Users
  getAdminUser(id: number): Promise<AdminUser | undefined>;
  getAdminUserByUsername(username: string): Promise<AdminUser | undefined>;
  getAdminUsers(): Promise<{ id: number; username: string; role: string; createdAt: Date | null }[]>;
  createAdminUser(user: InsertAdmin): Promise<AdminUser>;
  updateAdminPassword(id: number, passwordHash: string): Promise<{ id: number; username: string } | undefined>;

  // Categories
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;

  // Option masters
  getColorOptions(): Promise<ColorOption[]>;
  createColorOption(data: { name: string }): Promise<ColorOption>;
  updateColorOption(id: number, data: { name?: string }): Promise<ColorOption | undefined>;
  deleteColorOption(id: number): Promise<boolean>;
  getSizeOptions(): Promise<SizeOption[]>;
  createSizeOption(data: { name: string }): Promise<SizeOption>;
  updateSizeOption(id: number, data: { name?: string }): Promise<SizeOption | undefined>;
  deleteSizeOption(id: number): Promise<boolean>;
  getOtherOptions(): Promise<OtherOption[]>;
  createOtherOption(data: { name: string }): Promise<OtherOption>;
  updateOtherOption(id: number, data: { name?: string }): Promise<OtherOption | undefined>;
  deleteOtherOption(id: number): Promise<boolean>;

  // Shipping master
  getOrCreateShippingSettings(): Promise<ShippingSettings>;
  updateShippingSettings(data: { warehousePincode: string }): Promise<ShippingSettings>;
  getShippingRanges(): Promise<ShippingRange[]>;
  getShippingRange(id: number): Promise<ShippingRange | undefined>;
  createShippingRange(data: InsertShippingRange): Promise<ShippingRange>;
  updateShippingRange(id: number, data: Partial<InsertShippingRange>): Promise<ShippingRange | undefined>;
  deleteShippingRange(id: number): Promise<boolean>;

  // Products
  getProducts(categoryId?: number): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;

  // Custom Requests
  getCustomRequests(): Promise<CustomRequest[]>;
  getCustomRequest(id: number): Promise<CustomRequest | undefined>;
  createCustomRequest(request: InsertCustomRequest): Promise<CustomRequest>;
  updateCustomRequestStatus(id: number, status: string): Promise<CustomRequest | undefined>;

  // Orders
  getOrders(): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  updateOrder(
    id: number,
    data: {
      status?: string;
      paymentStatus?: string;
      paymentMode?: string;
      subtotalPrice?: number;
      shippingCharge?: number;
      totalPrice?: number;
      adminNotes?: string | null;
      invoiceHtml?: string | null;
    },
  ): Promise<Order | undefined>;

  getInvoiceTemplate(): Promise<InvoiceTemplate | undefined>;
  getOrCreateInvoiceTemplate(): Promise<InvoiceTemplate>;
  saveInvoiceTemplate(data: { companyName?: string; logoUrl?: string | null; address?: string; phone?: string; email?: string; footerText?: string }): Promise<InvoiceTemplate>;
  generateInvoiceHtml(orderId: number): Promise<string | null>;
  getSiteConfig(): Promise<SiteConfig | undefined>;
  getOrCreateSiteConfig(): Promise<SiteConfig>;
  updateSiteConfig(data: Partial<InsertSiteConfig>): Promise<SiteConfig>;
  updateSiteConfigDraft(data: { bannerImageUrl?: string | null; bannerLinkUrl?: string | null; theme?: SiteConfig["theme"] }): Promise<SiteConfig>;
  publishDraftToLiveSiteConfig(): Promise<SiteConfig>;
  restorePreviousLiveSiteConfig(): Promise<SiteConfig>;

  // Reviews
  createReview(data: { productId: number; customerId: number | null; orderId: number | null; rating: number; comment?: string | null; imageUrl?: string | null }): Promise<Review>;
  getReviewsByProduct(productId: number): Promise<(Review & { customerName?: string })[]>;
  getProductRating(productId: number): Promise<{ average: number; count: number }>;
  getProductRatingsBatch(productIds: number[]): Promise<{ productId: number; average: number; count: number }[]>;
  hasCustomerReviewedOrderProduct(customerId: number, orderId: number, productId: number): Promise<boolean>;

  // Customers
  getCustomers(): Promise<{ id: number; email: string; name: string; phone: string; createdAt: Date | null }[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  getCustomerByEmail(email: string): Promise<Customer | undefined>;
  getCustomerByPhone(phone: string): Promise<Customer | undefined>;
  createCustomer(data: { email: string; passwordHash: string; name: string; phone: string }): Promise<Customer>;
  getOrdersByCustomerId(customerId: number): Promise<Order[]>;
  linkGuestOrdersToCustomer(customerId: number, email: string, phone?: string | null): Promise<number>;

  // Verification codes (OTP)
  createVerificationCode(email: string, code: string, type: "signup" | "forgot_password"): Promise<void>;
  getValidVerificationCode(email: string, code: string, type: string): Promise<boolean>;
  deleteVerificationCode(email: string, type: string): Promise<void>;

  // Customer addresses
  getCustomerAddresses(customerId: number): Promise<CustomerAddress[]>;
  getDefaultAddress(customerId: number): Promise<CustomerAddress | undefined>;
  getCustomerAddress(id: number, customerId: number): Promise<CustomerAddress | undefined>;
  createCustomerAddress(data: { customerId: number; label?: string; addressLine1: string; addressLine2?: string; city: string; state?: string; pincode?: string; phone?: string; isDefault?: boolean }): Promise<CustomerAddress>;
  updateCustomerAddress(id: number, customerId: number, data: Partial<{ label: string; addressLine1: string; addressLine2: string; city: string; state: string; pincode: string; phone: string; isDefault: boolean }>): Promise<CustomerAddress | undefined>;
  setDefaultAddress(id: number, customerId: number): Promise<void>;
  deleteCustomerAddress(id: number, customerId: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getAdminUser(id: number): Promise<AdminUser | undefined> {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
    return user;
  }

  async getAdminUserByUsername(username: string): Promise<AdminUser | undefined> {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
    return user;
  }

  async getAdminUsers(): Promise<{ id: number; username: string; role: string; createdAt: Date | null }[]> {
    const rows = await db.select({ id: adminUsers.id, username: adminUsers.username, role: adminUsers.role, createdAt: adminUsers.createdAt })
      .from(adminUsers)
      .orderBy(asc(adminUsers.id));
    return rows.map((r) => ({ ...r, role: r.role ?? "admin" }));
  }

  async createAdminUser(user: InsertAdmin): Promise<AdminUser> {
    const [newUser] = await db.insert(adminUsers).values(user).returning();
    return newUser;
  }

  async updateAdminPassword(id: number, passwordHash: string): Promise<{ id: number; username: string } | undefined> {
    const [updated] = await db.update(adminUsers).set({ passwordHash }).where(eq(adminUsers.id, id)).returning({ id: adminUsers.id, username: adminUsers.username });
    return updated;
  }

  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(asc(categories.id));
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [cat] = await db.select().from(categories).where(eq(categories.id, id));
    return cat;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCat] = await db.insert(categories).values(category).returning();
    return newCat!;
  }

  async updateCategory(id: number, updateData: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updated] = await db.update(categories).set(updateData).where(eq(categories.id, id)).returning();
    return updated;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const [deleted] = await db.delete(categories).where(eq(categories.id, id)).returning();
    return !!deleted;
  }

  async getColorOptions(): Promise<ColorOption[]> {
    return await db.select().from(colorOptions).orderBy(asc(colorOptions.name), asc(colorOptions.id));
  }

  async createColorOption(data: { name: string }): Promise<ColorOption> {
    const [created] = await db.insert(colorOptions).values({ name: data.name }).returning();
    return created!;
  }

  async updateColorOption(id: number, data: { name?: string }): Promise<ColorOption | undefined> {
    const [updated] = await db.update(colorOptions).set(data).where(eq(colorOptions.id, id)).returning();
    return updated;
  }

  async deleteColorOption(id: number): Promise<boolean> {
    const [deleted] = await db.delete(colorOptions).where(eq(colorOptions.id, id)).returning();
    return !!deleted;
  }

  async getSizeOptions(): Promise<SizeOption[]> {
    return await db.select().from(sizeOptions).orderBy(asc(sizeOptions.name), asc(sizeOptions.id));
  }

  async createSizeOption(data: { name: string }): Promise<SizeOption> {
    const [created] = await db.insert(sizeOptions).values({ name: data.name }).returning();
    return created!;
  }

  async updateSizeOption(id: number, data: { name?: string }): Promise<SizeOption | undefined> {
    const [updated] = await db.update(sizeOptions).set(data).where(eq(sizeOptions.id, id)).returning();
    return updated;
  }

  async deleteSizeOption(id: number): Promise<boolean> {
    const [deleted] = await db.delete(sizeOptions).where(eq(sizeOptions.id, id)).returning();
    return !!deleted;
  }

  async getOtherOptions(): Promise<OtherOption[]> {
    return await db.select().from(otherOptions).orderBy(asc(otherOptions.name), asc(otherOptions.id));
  }

  async createOtherOption(data: { name: string }): Promise<OtherOption> {
    const [created] = await db.insert(otherOptions).values({ name: data.name }).returning();
    return created!;
  }

  async updateOtherOption(id: number, data: { name?: string }): Promise<OtherOption | undefined> {
    const [updated] = await db.update(otherOptions).set(data).where(eq(otherOptions.id, id)).returning();
    return updated;
  }

  async deleteOtherOption(id: number): Promise<boolean> {
    const [deleted] = await db.delete(otherOptions).where(eq(otherOptions.id, id)).returning();
    return !!deleted;
  }

  async getOrCreateShippingSettings(): Promise<ShippingSettings> {
    const [existing] = await db.select().from(shippingSettings).limit(1);
    if (existing) return existing;
    const [created] = await db.insert(shippingSettings).values({ warehousePincode: "" }).returning();
    return created!;
  }

  async updateShippingSettings(data: { warehousePincode: string }): Promise<ShippingSettings> {
    const existing = await this.getOrCreateShippingSettings();
    const [updated] = await db
      .update(shippingSettings)
      .set({ warehousePincode: data.warehousePincode, updatedAt: new Date() })
      .where(eq(shippingSettings.id, existing.id))
      .returning();
    return updated!;
  }

  async getShippingRanges(): Promise<ShippingRange[]> {
    return await db.select().from(shippingRanges).orderBy(asc(shippingRanges.minKm), asc(shippingRanges.id));
  }

  async getShippingRange(id: number): Promise<ShippingRange | undefined> {
    const [row] = await db.select().from(shippingRanges).where(eq(shippingRanges.id, id));
    return row;
  }

  async createShippingRange(data: InsertShippingRange): Promise<ShippingRange> {
    const [created] = await db
      .insert(shippingRanges)
      .values({
        minKm: Number(data.minKm),
        maxKm: Number(data.maxKm),
        price: Number(data.price),
      })
      .returning();
    return created!;
  }

  async updateShippingRange(id: number, data: Partial<InsertShippingRange>): Promise<ShippingRange | undefined> {
    const payload: Record<string, unknown> = {};
    if (data.minKm != null) payload.minKm = Number(data.minKm);
    if (data.maxKm != null) payload.maxKm = Number(data.maxKm);
    if (data.price != null) payload.price = Number(data.price);
    const [updated] = await db.update(shippingRanges).set(payload).where(eq(shippingRanges.id, id)).returning();
    return updated;
  }

  async deleteShippingRange(id: number): Promise<boolean> {
    const [deleted] = await db.delete(shippingRanges).where(eq(shippingRanges.id, id)).returning();
    return !!deleted;
  }

  async getProducts(categoryId?: number): Promise<Product[]> {
    if (categoryId != null) {
      const rows = await db
        .select()
        .from(products)
        .where(eq(products.categoryId, categoryId))
        .orderBy(asc(products.id));
      return rows.map((row) => applyVariantDisplayFields(row));
    }
    const rows = await db.select().from(products).orderBy(asc(products.id));
    return rows.map((row) => applyVariantDisplayFields(row));
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    if (!product) return undefined;
    return applyVariantDisplayFields(product);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const hasVariants = !!(product as { hasVariants?: unknown }).hasVariants;
    const variants = normalizeProductVariants((product as { variants?: unknown }).variants);
    const defaultVariant = variants.find((variant) => variant.isDefault) ?? variants[0];
    const productImages = hasVariants ? [] : normalizeStringArray(product.productImages);
    const primaryImageUrl = hasVariants
      ? defaultVariant?.images[0] ?? product.imageUrl
      : productImages[0] ?? product.imageUrl;
    const [newProduct] = await db
      .insert(products)
      .values({
        ...product,
        hasVariants: hasVariants && variants.length > 0,
        variants: hasVariants ? variants : [],
        price: hasVariants && defaultVariant ? defaultVariant.price : product.price,
        imageUrl: primaryImageUrl,
        productImages: hasVariants ? [] : productImages,
        availableColors: normalizeStringArray(product.availableColors),
        availableSizes: normalizeStringArray(product.availableSizes),
        sizePrices: normalizeSizePriceMap(product.sizePrices),
        defaultSize:
          typeof product.defaultSize === "string" && product.defaultSize.trim().length > 0
            ? product.defaultSize.trim()
            : null,
        availableOthers: normalizeStringArray(product.availableOthers),
      })
      .returning();
    if (newProduct && !newProduct.sku) {
      const sku = await this.generateSku(newProduct.id, newProduct.categoryId, newProduct.title);
      const [updated] = await db.update(products).set({ sku }).where(eq(products.id, newProduct.id)).returning();
      return applyVariantDisplayFields(updated ?? newProduct);
    }
    return applyVariantDisplayFields(newProduct!);
  }

  private async generateSku(productId: number, categoryId: number | null, title: string): Promise<string> {
    let prefix = "GEN";
    if (categoryId) {
      const [cat] = await db.select({ name: categories.name }).from(categories).where(eq(categories.id, categoryId));
      if (cat?.name) {
        prefix = cat.name
          .replace(/\s+/g, " ")
          .split(" ")
          .map((w) => w.replace(/[^a-zA-Z0-9]/g, "").slice(0, 2))
          .join("")
          .toUpperCase()
          .slice(0, 6) || "CAT";
      }
    }
    const productSlug = title
      .replace(/\s+/g, " ")
      .split(" ")
      .map((w) => w.replace(/[^a-zA-Z0-9]/g, "").slice(0, 2))
      .join("")
      .toUpperCase()
      .slice(0, 8) || "PRD";
    return `${prefix}-${productSlug}-${String(productId).padStart(4, "0")}`;
  }

  async updateProduct(id: number, updateData: Partial<InsertProduct>): Promise<Product | undefined> {
    const payload: Record<string, unknown> = { ...updateData };
    const hasVariantsInput =
      "hasVariants" in updateData
        ? !!(updateData as { hasVariants?: unknown }).hasVariants
        : undefined;
    if (hasVariantsInput !== undefined) payload.hasVariants = hasVariantsInput;
    if ("variants" in updateData) {
      const normalizedVariants = normalizeProductVariants((updateData as { variants?: unknown }).variants);
      payload.variants = normalizedVariants;
      const effectiveHasVariants = (hasVariantsInput ?? false) && normalizedVariants.length > 0;
      if (effectiveHasVariants) {
        const defaultVariant =
          normalizedVariants.find((variant) => variant.isDefault) ?? normalizedVariants[0];
        payload.price = defaultVariant.price;
        payload.imageUrl = defaultVariant.images[0];
        payload.productImages = [];
      } else if (hasVariantsInput === false) {
        payload.variants = [];
      }
    }
    let normalizedProductImages: string[] | null = null;
    if ("productImages" in updateData) {
      normalizedProductImages = normalizeStringArray(updateData.productImages);
      const isVariantPayload =
        payload.hasVariants === true &&
        Array.isArray(payload.variants) &&
        payload.variants.length > 0;
      if (!isVariantPayload) {
        payload.productImages = normalizedProductImages;
        if (normalizedProductImages.length > 0) {
          payload.imageUrl = normalizedProductImages[0];
        }
      }
    }
    if (!("productImages" in updateData) && "imageUrl" in updateData && typeof updateData.imageUrl === "string") {
      payload.productImages = normalizeStringArray([updateData.imageUrl]);
    }
    if ("availableColors" in updateData) {
      payload.availableColors = normalizeStringArray(updateData.availableColors);
    }
    if ("availableSizes" in updateData) {
      payload.availableSizes = normalizeStringArray(updateData.availableSizes);
    }
    if ("sizePrices" in updateData) {
      payload.sizePrices = normalizeSizePriceMap(updateData.sizePrices);
    }
    if ("defaultSize" in updateData) {
      payload.defaultSize =
        typeof updateData.defaultSize === "string" && updateData.defaultSize.trim().length > 0
          ? updateData.defaultSize.trim()
          : null;
    }
    if ("availableOthers" in updateData) {
      payload.availableOthers = normalizeStringArray(updateData.availableOthers);
    }
    const [updated] = await db.update(products).set(payload).where(eq(products.id, id)).returning();
    if (!updated) return undefined;
    return applyVariantDisplayFields(updated);
  }

  async deleteProduct(id: number): Promise<boolean> {
    const [deleted] = await db.delete(products).where(eq(products.id, id)).returning();
    return !!deleted;
  }

  async getCustomRequests(): Promise<CustomRequest[]> {
    return await db.select().from(customRequests);
  }

  async getCustomRequest(id: number): Promise<CustomRequest | undefined> {
    const [req] = await db.select().from(customRequests).where(eq(customRequests.id, id));
    return req;
  }

  async createCustomRequest(request: InsertCustomRequest): Promise<CustomRequest> {
    const [newReq] = await db
      .insert(customRequests)
      .values({
        ...request,
        imageUrls: normalizeStringArray(request.imageUrls),
        timeline: normalizeTimeline(request.timeline),
      })
      .returning();
    return newReq;
  }

  async updateCustomRequestStatus(id: number, status: string): Promise<CustomRequest | undefined> {
    const [updated] = await db.update(customRequests).set({ status }).where(eq(customRequests.id, id)).returning();
    return updated;
  }

  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders);
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const subtotalPrice =
      typeof order.subtotalPrice === "number" && Number.isFinite(order.subtotalPrice)
        ? Math.max(0, roundMoney(order.subtotalPrice))
        : Math.max(0, roundMoney(order.totalPrice));
    const shippingCharge =
      typeof order.shippingCharge === "number" && Number.isFinite(order.shippingCharge)
        ? Math.max(0, roundMoney(order.shippingCharge))
        : Math.max(0, roundMoney(roundMoney(order.totalPrice) - subtotalPrice));
    const totalPrice =
      typeof order.totalPrice === "number" && Number.isFinite(order.totalPrice)
        ? Math.max(0, roundMoney(order.totalPrice))
        : roundMoney(subtotalPrice + shippingCharge);

    const [newOrder] = await db
      .insert(orders)
      .values({
        ...order,
        items: normalizeOrderItems(order.items),
        subtotalPrice,
        shippingCharge,
        totalPrice,
        paymentStatus: typeof order.paymentStatus === "string" ? order.paymentStatus : "not_paid",
        paymentMode: typeof order.paymentMode === "string" && order.paymentMode.trim().length > 0
          ? order.paymentMode
          : null,
      })
      .returning();
    return newOrder!;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [updated] = await db.update(orders).set({ status }).where(eq(orders.id, id)).returning();
    return updated;
  }

  async updateOrder(
    id: number,
    data: {
      status?: string;
      paymentStatus?: string;
      paymentMode?: string;
      subtotalPrice?: number;
      shippingCharge?: number;
      totalPrice?: number;
      adminNotes?: string | null;
      invoiceHtml?: string | null;
    },
  ): Promise<Order | undefined> {
    const [updated] = await db.update(orders).set(data).where(eq(orders.id, id)).returning();
    return updated;
  }

  async getInvoiceTemplate(): Promise<InvoiceTemplate | undefined> {
    const [row] = await db.select().from(invoiceTemplate).limit(1);
    return row;
  }

  async getOrCreateInvoiceTemplate(): Promise<InvoiceTemplate> {
    const existing = await this.getInvoiceTemplate();
    if (existing) return existing;
    const [inserted] = await db.insert(invoiceTemplate).values({
      companyName: "SOZOLEN 3D",
      logoUrl: null,
      address: "",
      phone: "",
      email: "",
      footerText: "Thank you for your order!",
    }).returning();
    return inserted!;
  }

  async saveInvoiceTemplate(data: {
    companyName?: string;
    logoUrl?: string | null;
    address?: string;
    phone?: string;
    email?: string;
    footerText?: string;
  }): Promise<InvoiceTemplate> {
    const existing = await this.getInvoiceTemplate();
    const payload = {
      ...(data.companyName !== undefined && { companyName: data.companyName }),
      ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.footerText !== undefined && { footerText: data.footerText }),
      updatedAt: new Date(),
    };
    if (existing) {
      const [updated] = await db.update(invoiceTemplate).set(payload).where(eq(invoiceTemplate.id, existing.id)).returning();
      return updated!;
    }
    const [inserted] = await db.insert(invoiceTemplate).values({
      companyName: data.companyName ?? "SOZOLEN 3D",
      logoUrl: data.logoUrl ?? null,
      address: data.address ?? "",
      phone: data.phone ?? "",
      email: data.email ?? "",
      footerText: data.footerText ?? "Thank you for your order!",
    }).returning();
    return inserted!;
  }

  async generateInvoiceHtml(orderId: number): Promise<string | null> {
    const order = await this.getOrder(orderId);
    if (!order) return null;
    const template = await this.getOrCreateInvoiceTemplate();
    const items = Array.isArray(order.items) ? order.items : [];
    const rows = items
      .map(
        (item) =>
          `<tr><td>${escapeHtml(item.name)}${item.variantName ? ` (Variant: ${escapeHtml(item.variantName)})` : ""}${item.selectedColor ? ` (Color: ${escapeHtml(item.selectedColor)})` : ""}${item.selectedSize ? ` (Size: ${escapeHtml(item.selectedSize)})` : ""}${item.selectedOther ? ` (${escapeHtml(item.selectedOther)})` : ""}</td><td>${item.quantity}</td><td>₹${formatMoney(item.price)}</td><td>₹${formatMoney(item.quantity * item.price)}</td></tr>`,
      )
      .join("");
    const dateStr = order.createdAt ? new Date(order.createdAt).toISOString().slice(0, 10) : "";
    const logoHtml = `<img src="/website-logo.png" alt="Logo" style="max-height: 60px;" />`;
    const companyNameHtml = template.companyName ? `<h1>${escapeHtml(template.companyName)}</h1>` : "";
    const companyLines: string[] = [];
    if (template.address && template.address.trim().length > 0) companyLines.push(escapeHtml(template.address));
    if (template.phone && template.phone.trim().length > 0) companyLines.push(`Phone: ${escapeHtml(template.phone)}`);
    if (template.email && template.email.trim().length > 0) companyLines.push(`Email: ${escapeHtml(template.email)}`);
    const companyInfoHtml = companyLines.length > 0 ? `<p>${companyLines.join("<br/>")}</p>` : "";
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Invoice #${order.id}</title><style>body{font-family:system-ui,sans-serif;max-width:800px;margin:2rem auto;padding:1rem;} table{width:100%;border-collapse:collapse;} th,td{border:1px solid #ddd;padding:8px;text-align:left;} th{background:#f5f5f5;} .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:2rem;} .footer{margin-top:2rem;font-size:0.9em;color:#666;}</style></head><body>
<div class="header"><div>${logoHtml}${companyNameHtml}${companyInfoHtml}</div><div><h2>INVOICE</h2><p><strong>#${order.id}</strong><br/>Date: ${dateStr}</p></div></div>
<p><strong>Bill To</strong><br/>${escapeHtml(order.name)}<br/>${escapeHtml(order.email)}<br/>${escapeHtml(order.phone)}<br/>${escapeHtml(order.address).replace(/\n/g, "<br/>")}</p>
<table><thead><tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table>
<p style="text-align:right;font-size:1.1em;"><strong>Total: ₹${formatMoney(order.totalPrice)}</strong></p>
${template.footerText && template.footerText.trim().length > 0 ? `<div class="footer">${escapeHtml(template.footerText)}</div>` : ""}
</body></html>`;
    return html;
  }

  async getSiteConfig(): Promise<SiteConfig | undefined> {
    const [row] = await db.select().from(siteConfig).limit(1);
    return row;
  }

  async getOrCreateSiteConfig(): Promise<SiteConfig> {
    const existing = await this.getSiteConfig();
    if (existing) return existing;
    const defaultTheme: SiteConfig["theme"] = {
      light: {
        primary: "#0071e3",
        primaryForeground: "#ffffff",
        background: "#fbfbfd",
        foreground: "#1d1d1f",
        card: "#ffffff",
        muted: "#ececf0",
        border: "#e5e5eb",
      },
      dark: {
        primary: "#1f8fff",
        primaryForeground: "#ffffff",
        background: "#000000",
        foreground: "#fafafa",
        card: "#1a1a1c",
        muted: "#242429",
        border: "#30303a",
      },
    };
    const [inserted] = await db
      .insert(siteConfig)
      .values({
        bannerEnabled: false,
        bannerImageUrl: null,
        bannerLinkUrl: null,
        theme: defaultTheme,
        draftBannerImageUrl: null,
        draftBannerLinkUrl: null,
        draftTheme: defaultTheme,
        previousLiveBannerImageUrl: null,
        previousLiveBannerLinkUrl: null,
        previousLiveTheme: null,
      })
      .returning();
    return inserted!;
  }

  async updateSiteConfig(data: Partial<InsertSiteConfig>): Promise<SiteConfig> {
    const existing = await this.getOrCreateSiteConfig();
    const payload: Record<string, unknown> = { updatedAt: new Date() };
    if (data.bannerEnabled !== undefined) payload.bannerEnabled = !!data.bannerEnabled;
    if (data.bannerImageUrl !== undefined) payload.bannerImageUrl = data.bannerImageUrl ?? null;
    if (data.bannerLinkUrl !== undefined) payload.bannerLinkUrl = data.bannerLinkUrl ?? null;
    if (data.theme !== undefined && data.theme) payload.theme = data.theme;
    const [updated] = await db
      .update(siteConfig)
      .set(payload)
      .where(eq(siteConfig.id, existing.id))
      .returning();
    return updated!;
  }

  async updateSiteConfigDraft(data: {
    bannerImageUrl?: string | null;
    bannerLinkUrl?: string | null;
    theme?: SiteConfig["theme"];
  }): Promise<SiteConfig> {
    const existing = await this.getOrCreateSiteConfig();
    const payload: Record<string, unknown> = { updatedAt: new Date() };
    if (data.bannerImageUrl !== undefined) payload.draftBannerImageUrl = data.bannerImageUrl ?? null;
    if (data.bannerLinkUrl !== undefined) payload.draftBannerLinkUrl = data.bannerLinkUrl ?? null;
    if (data.theme !== undefined && data.theme) payload.draftTheme = data.theme;
    const [updated] = await db
      .update(siteConfig)
      .set(payload)
      .where(eq(siteConfig.id, existing.id))
      .returning();
    return updated!;
  }

  async publishDraftToLiveSiteConfig(): Promise<SiteConfig> {
    const existing = await this.getOrCreateSiteConfig();
    const [updated] = await db
      .update(siteConfig)
      .set({
        previousLiveBannerImageUrl: existing.bannerImageUrl ?? null,
        previousLiveBannerLinkUrl: existing.bannerLinkUrl ?? null,
        previousLiveTheme: existing.theme,
        bannerImageUrl: existing.draftBannerImageUrl ?? null,
        bannerLinkUrl: existing.draftBannerLinkUrl ?? null,
        bannerEnabled: !!existing.draftBannerImageUrl,
        theme: existing.draftTheme,
        updatedAt: new Date(),
      })
      .where(eq(siteConfig.id, existing.id))
      .returning();
    return updated!;
  }

  async restorePreviousLiveSiteConfig(): Promise<SiteConfig> {
    const existing = await this.getOrCreateSiteConfig();
    if (!existing.previousLiveTheme) return existing;
    const [updated] = await db
      .update(siteConfig)
      .set({
        bannerImageUrl: existing.previousLiveBannerImageUrl ?? null,
        bannerLinkUrl: existing.previousLiveBannerLinkUrl ?? null,
        bannerEnabled: !!existing.previousLiveBannerImageUrl,
        theme: existing.previousLiveTheme,
        updatedAt: new Date(),
      })
      .where(eq(siteConfig.id, existing.id))
      .returning();
    return updated!;
  }

  async createReview(data: { productId: number; customerId: number | null; orderId: number | null; rating: number; comment?: string | null; imageUrl?: string | null }): Promise<Review> {
    const [r] = await db.insert(reviews).values(data).returning();
    return r!;
  }

  async getReviewsByProduct(productId: number): Promise<(Review & { customerName?: string })[]> {
    const rows = await db.select({
      id: reviews.id,
      productId: reviews.productId,
      customerId: reviews.customerId,
      orderId: reviews.orderId,
      rating: reviews.rating,
      comment: reviews.comment,
      imageUrl: reviews.imageUrl,
      createdAt: reviews.createdAt,
      customerName: customers.name,
    })
      .from(reviews)
      .leftJoin(customers, eq(reviews.customerId, customers.id))
      .where(eq(reviews.productId, productId))
      .orderBy(desc(reviews.createdAt));
    return rows as (Review & { customerName?: string })[];
  }

  async getProductRating(productId: number): Promise<{ average: number; count: number }> {
    const rows = await db.select({ rating: reviews.rating }).from(reviews).where(eq(reviews.productId, productId));
    const count = rows.length;
    if (count === 0) return { average: 0, count: 0 };
    const sum = rows.reduce((a, r) => a + r.rating, 0);
    return { average: Math.round((sum / count) * 10) / 10, count };
  }

  async getProductRatingsBatch(productIds: number[]): Promise<{ productId: number; average: number; count: number }[]> {
    if (productIds.length === 0) return [];
    const rows = await db.select({ productId: reviews.productId, rating: reviews.rating }).from(reviews);
    const byProduct = new Map<number, number[]>();
    for (const r of rows) {
      if (!byProduct.has(r.productId)) byProduct.set(r.productId, []);
      byProduct.get(r.productId)!.push(r.rating);
    }
    return productIds.map((id) => {
      const ratings = byProduct.get(id) ?? [];
      const count = ratings.length;
      const average = count === 0 ? 0 : Math.round((ratings.reduce((a, b) => a + b, 0) / count) * 10) / 10;
      return { productId: id, average, count };
    });
  }

  async hasCustomerReviewedOrderProduct(customerId: number, orderId: number, productId: number): Promise<boolean> {
    const [r] = await db.select().from(reviews).where(
      and(eq(reviews.customerId, customerId), eq(reviews.orderId, orderId), eq(reviews.productId, productId))
    );
    return !!r;
  }

  async getCustomers(): Promise<{ id: number; email: string; name: string; phone: string; createdAt: Date | null }[]> {
    return db.select({
      id: customers.id,
      email: customers.email,
      name: customers.name,
      phone: customers.phone,
      createdAt: customers.createdAt,
    }).from(customers).orderBy(asc(customers.id));
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const [c] = await db.select().from(customers).where(eq(customers.id, id));
    return c;
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    const [c] = await db.select().from(customers).where(eq(customers.email, email));
    return c;
  }

  async getCustomerByPhone(phone: string): Promise<Customer | undefined> {
    const [c] = await db.select().from(customers).where(eq(customers.phone, phone));
    return c;
  }

  async createCustomer(data: { email: string; passwordHash: string; name: string; phone: string }): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values(data).returning();
    return newCustomer!;
  }

  async getOrdersByCustomerId(customerId: number): Promise<Order[]> {
    return db.select().from(orders).where(eq(orders.customerId, customerId)).orderBy(desc(orders.id));
  }

  async linkGuestOrdersToCustomer(customerId: number, email: string, phone?: string | null): Promise<number> {
    const normalizedEmail = email.trim();
    const normalizedPhone = phone?.trim() || null;
    const matchByIdentity = normalizedPhone
      ? or(eq(orders.email, normalizedEmail), eq(orders.phone, normalizedPhone))
      : eq(orders.email, normalizedEmail);
    const updated = await db
      .update(orders)
      .set({ customerId })
      .where(and(isNull(orders.customerId), matchByIdentity))
      .returning({ id: orders.id });
    return updated.length;
  }

  async createVerificationCode(email: string, code: string, type: "signup" | "forgot_password"): Promise<void> {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    await db.delete(verificationCodes).where(and(eq(verificationCodes.email, email), eq(verificationCodes.type, type)));
    await db.insert(verificationCodes).values({ email, code, type, expiresAt });
  }

  async getValidVerificationCode(email: string, code: string, type: string): Promise<boolean> {
    const now = new Date();
    const [row] = await db.select().from(verificationCodes).where(
      and(eq(verificationCodes.email, email), eq(verificationCodes.code, code), eq(verificationCodes.type, type), gt(verificationCodes.expiresAt, now))
    );
    return !!row;
  }

  async deleteVerificationCode(email: string, type: string): Promise<void> {
    await db.delete(verificationCodes).where(and(eq(verificationCodes.email, email), eq(verificationCodes.type, type)));
  }

  async getCustomerAddresses(customerId: number): Promise<CustomerAddress[]> {
    return db.select().from(customerAddresses).where(eq(customerAddresses.customerId, customerId)).orderBy(asc(customerAddresses.id));
  }

  async getDefaultAddress(customerId: number): Promise<CustomerAddress | undefined> {
    const [row] = await db.select().from(customerAddresses).where(
      and(eq(customerAddresses.customerId, customerId), eq(customerAddresses.isDefault, true))
    );
    return row;
  }

  async getCustomerAddress(id: number, customerId: number): Promise<CustomerAddress | undefined> {
    const [row] = await db.select().from(customerAddresses).where(
      and(eq(customerAddresses.id, id), eq(customerAddresses.customerId, customerId))
    );
    return row;
  }

  async createCustomerAddress(data: { customerId: number; label?: string; addressLine1: string; addressLine2?: string; city: string; state?: string; pincode?: string; phone?: string; isDefault?: boolean }): Promise<CustomerAddress> {
    if (data.isDefault) {
      await db.update(customerAddresses).set({ isDefault: false }).where(eq(customerAddresses.customerId, data.customerId));
    }
    const [addr] = await db.insert(customerAddresses).values({
      customerId: data.customerId,
      label: data.label ?? null,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2 ?? null,
      city: data.city,
      state: data.state ?? null,
      pincode: data.pincode ?? null,
      phone: data.phone ?? null,
      isDefault: data.isDefault ?? false,
    }).returning();
    return addr!;
  }

  async updateCustomerAddress(id: number, customerId: number, data: Partial<{ label: string; addressLine1: string; addressLine2: string; city: string; state: string; pincode: string; phone: string; isDefault: boolean }>): Promise<CustomerAddress | undefined> {
    if (data.isDefault === true) {
      await db.update(customerAddresses).set({ isDefault: false }).where(eq(customerAddresses.customerId, customerId));
    }
    const [updated] = await db.update(customerAddresses).set(data as Record<string, unknown>).where(
      and(eq(customerAddresses.id, id), eq(customerAddresses.customerId, customerId))
    ).returning();
    return updated;
  }

  async setDefaultAddress(id: number, customerId: number): Promise<void> {
    await db.update(customerAddresses).set({ isDefault: false }).where(eq(customerAddresses.customerId, customerId));
    await db.update(customerAddresses).set({ isDefault: true }).where(
      and(eq(customerAddresses.id, id), eq(customerAddresses.customerId, customerId))
    );
  }

  async deleteCustomerAddress(id: number, customerId: number): Promise<boolean> {
    const [deleted] = await db.delete(customerAddresses).where(
      and(eq(customerAddresses.id, id), eq(customerAddresses.customerId, customerId))
    ).returning();
    return !!deleted;
  }
}

export const storage = new DatabaseStorage();
