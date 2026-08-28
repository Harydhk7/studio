import express from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import multer from "multer";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const dataDir = path.join(rootDir, "data");
const dataFile = path.join(dataDir, "spotfreeze-db.json");
const uploadDir = path.join(dataDir, "uploads");
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
    { id: "svc-prewedding", title: "Pre-Wedding Shoots", description: "Location planning and relaxed couple portraits with a cinematic finish.", price: "Custom quote", active: true },
    { id: "svc-engagement", title: "Engagement Shoot", description: "Celebrate your promise with expressive portraits and intimate details.", price: "Custom quote", active: true },
    { id: "svc-candid-video", title: "Candid Videography", description: "Natural, story-led coverage of the laughter, rituals, and in-between moments.", price: "Custom quote", active: true },
    { id: "svc-maternity", title: "Maternity Shoot", description: "Warm, graceful portraits that celebrate this beautiful chapter.", price: "Custom quote", active: true },
    { id: "svc-puberty", title: "Puberty Shoot", description: "Thoughtful portraits for a meaningful family milestone.", price: "Custom quote", active: true },
    { id: "svc-birthday", title: "Birthday Party Shoot", description: "Joyful birthday coverage for candid memories and family portraits.", price: "Custom quote", active: true },
    { id: "svc-model", title: "Model Photography", description: "Editorial, portfolio, and personal-brand photography with direction.", price: "Custom quote", active: true },
    { id: "svc-podcast", title: "Podcast Shoot", description: "Professional photo and video coverage for podcast episodes and content.", price: "Custom quote", active: true },
    { id: "svc-newborn", title: "Newborn Baby Shoot", description: "Gentle, carefully planned portraits for your newest family member.", price: "Custom quote", active: true },
    { id: "svc-corporate", title: "Corporate Events", description: "Polished photography for conferences, launches, teams, and company events.", price: "Custom quote", active: true },
    { id: "svc-video-editing", title: "Candid Video Editing", description: "Cinematic editing, colour, sound, and story shaping for event footage.", price: "Custom quote", active: true },
    { id: "svc-album", title: "Album Design", description: "Beautifully sequenced album layouts designed around your story.", price: "Custom quote", active: true },
    { id: "svc-reels", title: "Reels Editing", description: "Short-form edits crafted for celebrations, announcements, and social media.", price: "Custom quote", active: true },
    { id: "svc-frames", title: "Photo Frames", description: "Print and frame your favourite memories for a lasting display.", price: "Custom quote", active: true },
    { id: "svc-gifts", title: "Wedding Gifts", description: "Thoughtful wedding keepsakes and personalised gifts for your celebrations.", price: "Custom quote", active: true },
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
  fs.mkdirSync(uploadDir, { recursive: true });
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
const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (_req, file, callback) => {
      const requestedName = String(_req.body.name || path.parse(file.originalname).name)
        .trim()
        .replace(/[^a-zA-Z0-9_-]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase();
      callback(null, `${requestedName || `image-${Date.now()}`}${path.extname(file.originalname).toLowerCase()}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => callback(null, ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)),
});
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

app.post("/api/admin/uploads", requireAdmin, upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Choose a JPG, PNG, or WebP image under 5 MB" });
  res.status(201).json({ image: `/uploads/${req.file.filename}`, name: req.file.filename });
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
app.use("/uploads", express.static(uploadDir));
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/.*/, (_req, res) => res.sendFile(path.join(distDir, "index.html")));
}

app.listen(port, "0.0.0.0", () => {
  console.log(`Spot Freeze full-stack server running on http://localhost:${port}`);
});
