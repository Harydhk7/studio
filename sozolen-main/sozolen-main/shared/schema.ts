import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  doublePrecision,
  json,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const adminUserRoles = ["super_admin", "admin"] as const;
export type AdminUserRole = (typeof adminUserRoles)[number];

export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("admin"), // "super_admin" | "admin"
  createdAt: timestamp("created_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  imageUrl: text("image_url").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const colorOptions = pgTable("color_options", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sizeOptions = pgTable("size_options", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const otherOptions = pgTable("other_options", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const shippingSettings = pgTable("shipping_settings", {
  id: serial("id").primaryKey(),
  warehousePincode: text("warehouse_pincode").notNull().default(""),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const shippingRanges = pgTable("shipping_ranges", {
  id: serial("id").primaryKey(),
  minKm: integer("min_km").notNull(),
  maxKm: integer("max_km").notNull(),
  price: doublePrecision("price").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => categories.id),
  sku: text("sku").unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: doublePrecision("price").notNull(),
  imageUrl: text("image_url").notNull(),
  model3dUrl: text("model3d_url"),
  hasVariants: boolean("has_variants").notNull().default(false),
  variants: json("variants")
    .$type<
      {
        id: string;
        name: string;
        price: number;
        images: string[];
        isDefault: boolean;
        isActive: boolean;
        sortOrder: number;
      }[]
    >()
    .notNull()
    .default([]),
  productImages: json("product_images").$type<string[]>().notNull().default([]),
  customerCanChooseColor: boolean("customer_can_choose_color")
    .notNull()
    .default(false),
  availableColors: json("available_colors")
    .$type<string[]>()
    .notNull()
    .default([]),
  customerCanChooseSize: boolean("customer_can_choose_size")
    .notNull()
    .default(false),
  sizeSelectionMode: text("size_selection_mode").notNull().default("inherit"),
  overallSize: text("overall_size"),
  availableSizes: json("available_sizes")
    .$type<string[]>()
    .notNull()
    .default([]),
  sizePrices: json("size_prices")
    .$type<Record<string, number>>()
    .notNull()
    .default({}),
  defaultSize: text("default_size"),
  customerCanChooseOther: boolean("customer_can_choose_other")
    .notNull()
    .default(false),
  availableOthers: json("available_others")
    .$type<string[]>()
    .notNull()
    .default([]),
  // Price calculation: (filamentWeightGrams * perGramCost) + (printingTimeMinutes * perMinuteCost) + othersCost + extraProfitCost
  filamentWeightGrams: integer("filament_weight_grams"),
  perGramCost: doublePrecision("per_gram_cost"),
  printingTimeMinutes: integer("printing_time_minutes"),
  perMinuteCost: doublePrecision("per_minute_cost"),
  othersCost: doublePrecision("others_cost"),
  extraProfitCost: doublePrecision("extra_profit_cost"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull(), // Mobile Number - required
  createdAt: timestamp("created_at").defaultNow(),
});

export const verificationCodes = pgTable("verification_codes", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  code: text("code").notNull(),
  type: text("type").notNull(), // 'signup' | 'forgot_password'
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const customerAddresses = pgTable("customer_addresses", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customers.id),
  label: text("label"), // e.g. "Home", "Work"
  addressLine1: text("address_line1").notNull(),
  addressLine2: text("address_line2"),
  city: text("city").notNull(),
  state: text("state"),
  pincode: text("pincode"),
  phone: text("phone"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const customRequests = pgTable("custom_requests", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address"), // Delivery/service address for the request
  addressLine1: text("address_line1"),
  addressLine2: text("address_line2"),
  city: text("city"),
  state: text("state"),
  pincode: text("pincode"),
  description: text("description").notNull(),
  imageUrls: json("image_urls").$type<string[]>().notNull().default([]),
  quotedPrice: doublePrecision("quoted_price"),
  quoteNotes: text("quote_notes"),
  quoteEta: text("quote_eta"),
  quoteSentAt: timestamp("quote_sent_at"),
  quoteStatus: text("quote_status").notNull().default("pending"), // pending | sent | accepted | rejected
  convertedOrderId: integer("converted_order_id"),
  timeline: json("timeline")
    .$type<
      {
        at: string;
        type: string;
        message: string;
        actor?: string;
        meta?: Record<string, unknown>;
      }[]
    >()
    .notNull()
    .default([]),
  status: text("status").notNull().default("pending"), // pending, in_progress, completed
  createdAt: timestamp("created_at").defaultNow(),
});

export const orderStatuses = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
] as const;
export type OrderStatus = (typeof orderStatuses)[number];
export const paymentStatuses = [
  "not_paid",
  "paid",
  "failed",
  "refunded",
] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];
export const paymentModes = [
  "cash_on_delivery",
  "upi",
  "card",
  "net_banking",
  "wallet",
  "bank_transfer",
] as const;
export type PaymentMode = (typeof paymentModes)[number];

export const invoiceTemplate = pgTable("invoice_template", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull().default(""),
  logoUrl: text("logo_url"),
  address: text("address").notNull().default(""),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull().default(""),
  footerText: text("footer_text").notNull().default(""),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const siteConfig = pgTable("site_config", {
  id: serial("id").primaryKey(),
  bannerEnabled: boolean("banner_enabled").notNull().default(false),
  bannerImageUrl: text("banner_image_url"),
  bannerLinkUrl: text("banner_link_url"),
  theme: json("theme")
    .$type<{
      light: {
        primary: string;
        primaryForeground: string;
        background: string;
        foreground: string;
        card: string;
        muted: string;
        border: string;
      };
      dark: {
        primary: string;
        primaryForeground: string;
        background: string;
        foreground: string;
        card: string;
        muted: string;
        border: string;
      };
    }>()
    .notNull()
    .default({
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
    }),
  draftBannerImageUrl: text("draft_banner_image_url"),
  draftBannerLinkUrl: text("draft_banner_link_url"),
  draftTheme: json("draft_theme")
    .$type<{
      light: {
        primary: string;
        primaryForeground: string;
        background: string;
        foreground: string;
        card: string;
        muted: string;
        border: string;
      };
      dark: {
        primary: string;
        primaryForeground: string;
        background: string;
        foreground: string;
        card: string;
        muted: string;
        border: string;
      };
    }>()
    .notNull()
    .default({
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
    }),
  previousLiveBannerImageUrl: text("previous_live_banner_image_url"),
  previousLiveBannerLinkUrl: text("previous_live_banner_link_url"),
  previousLiveTheme: json("previous_live_theme").$type<{
    light: {
      primary: string;
      primaryForeground: string;
      background: string;
      foreground: string;
      card: string;
      muted: string;
      border: string;
    };
    dark: {
      primary: string;
      primaryForeground: string;
      background: string;
      foreground: string;
      card: string;
      muted: string;
      border: string;
    };
  }>(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  address: text("address").notNull(),
  invoiceHtml: text("invoice_html"),
  items: json("items")
    .$type<
      {
        productId: number;
        quantity: number;
        price: number;
        name: string;
        variantId?: string | null;
        variantName?: string | null;
        selectedColor?: string | null;
        selectedSize?: string | null;
        selectedOther?: string | null;
      }[]
    >()
    .notNull(),
  subtotalPrice: doublePrecision("subtotal_price").notNull().default(0),
  shippingCharge: doublePrecision("shipping_charge").notNull().default(0),
  totalPrice: doublePrecision("total_price").notNull(),
  additionalNotes: text("additional_notes"),
  adminNotes: text("admin_notes"), // Admin review/notes for the order
  status: text("status").notNull().default("pending"), // pending | confirmed | shipped | delivered | cancelled
  paymentStatus: text("payment_status").notNull().default("not_paid"), // not_paid | paid | failed | refunded
  paymentMode: text("payment_mode"), // admin can set later
  isOfflineOrder: boolean("is_offline_order").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  customerId: integer("customer_id").references(() => customers.id), // null = admin review
  orderId: integer("order_id").references(() => orders.id), // Order this review is from (delivered); null for admin
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  imageUrl: text("image_url"), // optional review image (e.g. admin or customer upload)
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAdminSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
});
export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});
export const insertColorOptionSchema = createInsertSchema(colorOptions).omit({
  id: true,
  createdAt: true,
});
export const insertSizeOptionSchema = createInsertSchema(sizeOptions).omit({
  id: true,
  createdAt: true,
});
export const insertOtherOptionSchema = createInsertSchema(otherOptions).omit({
  id: true,
  createdAt: true,
});
export const insertShippingSettingsSchema = createInsertSchema(shippingSettings).omit({
  id: true,
  updatedAt: true,
});
export const insertShippingRangeSchema = createInsertSchema(shippingRanges).omit({
  id: true,
  createdAt: true,
});
export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});
export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
});
export const insertCustomerAddressSchema = createInsertSchema(
  customerAddresses,
).omit({ id: true, createdAt: true });
export const insertCustomRequestSchema = createInsertSchema(
  customRequests,
).omit({ id: true, createdAt: true });
export const insertInvoiceTemplateSchema = createInsertSchema(
  invoiceTemplate,
).omit({ id: true, updatedAt: true });
export const insertSiteConfigSchema = createInsertSchema(siteConfig).omit({
  id: true,
  updatedAt: true,
});
export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
});
export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export type Category = typeof categories.$inferSelect;
export type ColorOption = typeof colorOptions.$inferSelect;
export type SizeOption = typeof sizeOptions.$inferSelect;
export type OtherOption = typeof otherOptions.$inferSelect;
export type ShippingSettings = typeof shippingSettings.$inferSelect;
export type ShippingRange = typeof shippingRanges.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type VerificationCode = typeof verificationCodes.$inferSelect;
export type CustomerAddress = typeof customerAddresses.$inferSelect;
export type CustomRequest = typeof customRequests.$inferSelect;
export type InvoiceTemplate = typeof invoiceTemplate.$inferSelect;
export type SiteConfig = typeof siteConfig.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type AdminUser = typeof adminUsers.$inferSelect;
