import express from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const dataDir = path.join(rootDir, "data");
const dataFile = path.join(dataDir, "spotfreeze-db.json");
const port = Number(process.env.PORT || 5000);
const adminUsername = process.env.ADMIN_USERNAME || "admin";
const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
const sessionSecret = process.env.SESSION_SECRET || "spotfreeze-local-secret";
const frontendOrigin = process.env.FRONTEND_ORIGIN || "";

const seed = {
  settings: {
    studioName: "Spot Freeze Photography",
    tagline: "Transforming genuine happiness into eternal imagery",
    email: "hello@spotfreeze.in",
    phone: "+91 98765 43210",
    instagram: "https://www.instagram.com/",
    heroImage: "/images/portfolio.jpeg",
  },
  services: [
    { id: "svc-wedding", title: "Wedding Photography", description: "Full-day ritual, candid, portrait, and reception coverage.", price: "Custom quote", active: true },
    { id: "svc-prewedding", title: "Pre-Wedding Films", description: "Location planning, cinematic couple portraits, reels, and highlight films.", price: "From Rs. 25,000", active: true },
    { id: "svc-baby", title: "Baby & Family Shoots", description: "Baby shower, newborn, birthday, and family milestone sessions.", price: "From Rs. 12,000", active: true },
  ],
  packages: [
    { id: "pkg-classic", title: "Classic Wedding", price: "Rs. 55,000", features: "1 photographer, 1 videographer, edited photos, highlight reel", active: true },
    { id: "pkg-premium", title: "Premium Wedding", price: "Rs. 95,000", features: "Candid team, traditional team, teaser, album design, drone add-on ready", active: true },
    { id: "pkg-family", title: "Family Moments", price: "Rs. 18,000", features: "2-hour session, edited gallery, print-ready portraits", active: true },
  ],
  galleries: [
    { id: "gal-wedding", title: "Wedding Stories", image: "/images/portfolio.jpeg", category: "Wedding", featured: true },
    { id: "gal-shower", title: "Baby Shower", image: "/images/babyshower.jpeg", category: "Family", featured: true },
    { id: "gal-baby", title: "Baby Shoot", image: "/images/babyshoot.jpeg", category: "Portrait", featured: true },
  ],
  testimonials: [
    { id: "t-1", name: "Varalakshmi & Karthik", event: "Wedding Album", quote: "The pictures turned out beautiful. We are so glad we chose Spot Freeze.", active: true },
    { id: "t-2", name: "Ashikha & Surya", event: "Pre-Wedding Shoot", quote: "There were so many stunning photos to choose from. The team made it effortless.", active: true },
  ],
  enquiries: [],
  bookings: [],
  customers: [],
};

function ensureStore() {
  fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify(seed, null, 2));
  }
}

function readStore() {
  ensureStore();
  return JSON.parse(fs.readFileSync(dataFile, "utf8"));
}

function writeStore(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

function id(prefix) {
  return `${prefix}-${crypto.randomBytes(5).toString("hex")}`;
}

function signToken(payload) {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 1000 * 60 * 60 * 12 })).toString("base64url");
  const sig = crypto.createHmac("sha256", sessionSecret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function verifyToken(token) {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  const expected = crypto.createHmac("sha256", sessionSecret).update(body).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  if (payload.exp < Date.now()) return null;
  return payload;
}

function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const payload = verifyToken(token);
  if (!payload || payload.role !== "admin") return res.status(401).json({ message: "Unauthorized" });
  req.admin = payload;
  next();
}

function publicData(data) {
  return {
    settings: data.settings,
    services: data.services.filter((item) => item.active),
    packages: data.packages.filter((item) => item.active),
    galleries: data.galleries,
    testimonials: data.testimonials.filter((item) => item.active),
  };
}

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const origin = req.headers.origin || "";
  if (!frontendOrigin || frontendOrigin === origin) {
    res.header("Access-Control-Allow-Origin", frontendOrigin || origin || "*");
  }
  res.header("Vary", "Origin");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "spotfreeze-api" });
});

app.get("/api/public", (_req, res) => {
  res.json(publicData(readStore()));
});

app.post("/api/enquiries", (req, res) => {
  const data = readStore();
  const enquiry = {
    id: id("enq"),
    name: String(req.body.name || "").trim(),
    phone: String(req.body.phone || "").trim(),
    email: String(req.body.email || "").trim(),
    eventType: String(req.body.eventType || "Wedding"),
    eventDate: String(req.body.eventDate || ""),
    venue: String(req.body.venue || ""),
    message: String(req.body.message || ""),
    status: "new",
    createdAt: new Date().toISOString(),
  };
  if (!enquiry.name || !enquiry.phone) return res.status(400).json({ message: "Name and phone are required" });
  data.enquiries.unshift(enquiry);
  const existingCustomer = data.customers.find((customer) => customer.phone === enquiry.phone || (enquiry.email && customer.email === enquiry.email));
  if (!existingCustomer) {
    data.customers.unshift({ id: id("cus"), name: enquiry.name, phone: enquiry.phone, email: enquiry.email, notes: "", createdAt: enquiry.createdAt });
  }
  writeStore(data);
  res.status(201).json(enquiry);
});

app.post("/api/admin/login", (req, res) => {
  if (req.body.username !== adminUsername || req.body.password !== adminPassword) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  res.json({ token: signToken({ username: adminUsername, role: "admin" }), user: { username: adminUsername, role: "admin" } });
});

app.get("/api/admin/dashboard", requireAdmin, (_req, res) => {
  const data = readStore();
  res.json({
    counts: {
      enquiries: data.enquiries.length,
      bookings: data.bookings.length,
      customers: data.customers.length,
      galleries: data.galleries.length,
    },
    recentEnquiries: data.enquiries.slice(0, 5),
    upcomingBookings: data.bookings.filter((booking) => booking.status !== "completed").slice(0, 5),
  });
});

app.get("/api/admin/:collection", requireAdmin, (req, res) => {
  const data = readStore();
  const collection = req.params.collection;
  if (!Array.isArray(data[collection])) return res.status(404).json({ message: "Unknown collection" });
  res.json(data[collection]);
});

app.post("/api/admin/:collection", requireAdmin, (req, res) => {
  const data = readStore();
  const collection = req.params.collection;
  if (!Array.isArray(data[collection])) return res.status(404).json({ message: "Unknown collection" });
  const item = { id: id(collection.slice(0, 3)), ...req.body, createdAt: new Date().toISOString() };
  data[collection].unshift(item);
  writeStore(data);
  res.status(201).json(item);
});

app.put("/api/admin/:collection/:itemId", requireAdmin, (req, res) => {
  const data = readStore();
  const collection = req.params.collection;
  if (!Array.isArray(data[collection])) return res.status(404).json({ message: "Unknown collection" });
  const index = data[collection].findIndex((item) => item.id === req.params.itemId);
  if (index < 0) return res.status(404).json({ message: "Not found" });
  data[collection][index] = { ...data[collection][index], ...req.body, updatedAt: new Date().toISOString() };
  writeStore(data);
  res.json(data[collection][index]);
});

app.delete("/api/admin/:collection/:itemId", requireAdmin, (req, res) => {
  const data = readStore();
  const collection = req.params.collection;
  if (!Array.isArray(data[collection])) return res.status(404).json({ message: "Unknown collection" });
  const next = data[collection].filter((item) => item.id !== req.params.itemId);
  data[collection] = next;
  writeStore(data);
  res.status(204).send();
});

app.put("/api/admin/settings", requireAdmin, (req, res) => {
  const data = readStore();
  data.settings = { ...data.settings, ...req.body, updatedAt: new Date().toISOString() };
  writeStore(data);
  res.json(data.settings);
});

const distDir = path.join(rootDir, "dist");
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/.*/, (_req, res) => res.sendFile(path.join(distDir, "index.html")));
}

app.listen(port, "0.0.0.0", () => {
  console.log(`Spot Freeze full-stack server running on http://localhost:${port}`);
});
