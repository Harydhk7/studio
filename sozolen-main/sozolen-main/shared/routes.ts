import { z } from "zod";
import {
  insertProductSchema,
  insertCategorySchema,
  insertColorOptionSchema,
  insertSizeOptionSchema,
  insertOtherOptionSchema,
  insertCustomRequestSchema,
  insertOrderSchema,
  insertSiteConfigSchema,
  insertCustomerSchema,
  insertReviewSchema,
  insertShippingRangeSchema,
  products,
  categories,
  colorOptions,
  sizeOptions,
  otherOptions,
  shippingSettings,
  shippingRanges,
  customRequests,
  orders,
  reviews,
  adminUsers,
  customers,
  orderStatuses,
  paymentStatuses,
  paymentModes,
  customerAddresses,
  siteConfig,
} from "./schema";

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
  unauthorized: z.object({ message: z.string() }),
};

export const api = {
  auth: {
    login: {
      method: "POST" as const,
      path: "/api/auth/login" as const,
      input: z.object({ username: z.string(), password: z.string() }),
      responses: {
        200: z.object({ message: z.string(), token: z.string().optional() }),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: "POST" as const,
      path: "/api/auth/logout" as const,
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
    me: {
      method: "GET" as const,
      path: "/api/auth/me" as const,
      responses: {
        200: z.object({
          id: z.number(),
          username: z.string(),
          role: z.string().optional(),
        }),
        401: errorSchemas.unauthorized,
      },
    },
  },
  admins: {
    list: {
      method: "GET" as const,
      path: "/api/admins" as const,
      responses: {
        200: z.array(
          z.object({
            id: z.number(),
            username: z.string(),
            role: z.string(),
            createdAt: z.string().optional(),
          }),
        ),
        401: errorSchemas.unauthorized,
        403: errorSchemas.unauthorized,
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/admins" as const,
      input: z.object({
        username: z.string().min(1),
        password: z.string().min(1),
      }),
      responses: {
        201: z.object({
          id: z.number(),
          username: z.string(),
          role: z.string(),
        }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        403: errorSchemas.unauthorized,
      },
    },
    updatePassword: {
      method: "PATCH" as const,
      path: "/api/admins/:id/password" as const,
      input: z.object({ password: z.string().min(1) }),
      responses: {
        200: z.object({ id: z.number(), username: z.string() }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        403: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
  },
  categories: {
    list: {
      method: "GET" as const,
      path: "/api/categories" as const,
      responses: {
        200: z.array(z.custom<typeof categories.$inferSelect>()),
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/categories/:id" as const,
      responses: {
        200: z.custom<typeof categories.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/categories" as const,
      input: insertCategorySchema,
      responses: {
        201: z.custom<typeof categories.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    update: {
      method: "PATCH" as const,
      path: "/api/categories/:id" as const,
      input: insertCategorySchema.partial(),
      responses: {
        200: z.custom<typeof categories.$inferSelect>(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/categories/:id" as const,
      responses: {
        204: z.void(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    products: {
      method: "GET" as const,
      path: "/api/categories/:id/products" as const,
      responses: {
        200: z.array(z.custom<typeof products.$inferSelect>()),
      },
    },
  },
  options: {
    colors: {
      list: {
        method: "GET" as const,
        path: "/api/options/colors" as const,
        responses: {
          200: z.array(z.custom<typeof colorOptions.$inferSelect>()),
        },
      },
      create: {
        method: "POST" as const,
        path: "/api/options/colors" as const,
        input: insertColorOptionSchema,
        responses: {
          201: z.custom<typeof colorOptions.$inferSelect>(),
          400: errorSchemas.validation,
          401: errorSchemas.unauthorized,
        },
      },
      update: {
        method: "PATCH" as const,
        path: "/api/options/colors/:id" as const,
        input: insertColorOptionSchema.partial(),
        responses: {
          200: z.custom<typeof colorOptions.$inferSelect>(),
          400: errorSchemas.validation,
          401: errorSchemas.unauthorized,
          404: errorSchemas.notFound,
        },
      },
      delete: {
        method: "DELETE" as const,
        path: "/api/options/colors/:id" as const,
        responses: {
          204: z.void(),
          401: errorSchemas.unauthorized,
          404: errorSchemas.notFound,
        },
      },
    },
    sizes: {
      list: {
        method: "GET" as const,
        path: "/api/options/sizes" as const,
        responses: {
          200: z.array(z.custom<typeof sizeOptions.$inferSelect>()),
        },
      },
      create: {
        method: "POST" as const,
        path: "/api/options/sizes" as const,
        input: insertSizeOptionSchema,
        responses: {
          201: z.custom<typeof sizeOptions.$inferSelect>(),
          400: errorSchemas.validation,
          401: errorSchemas.unauthorized,
        },
      },
      update: {
        method: "PATCH" as const,
        path: "/api/options/sizes/:id" as const,
        input: insertSizeOptionSchema.partial(),
        responses: {
          200: z.custom<typeof sizeOptions.$inferSelect>(),
          400: errorSchemas.validation,
          401: errorSchemas.unauthorized,
          404: errorSchemas.notFound,
        },
      },
      delete: {
        method: "DELETE" as const,
        path: "/api/options/sizes/:id" as const,
        responses: {
          204: z.void(),
          401: errorSchemas.unauthorized,
          404: errorSchemas.notFound,
        },
      },
    },
    others: {
      list: {
        method: "GET" as const,
        path: "/api/options/others" as const,
        responses: {
          200: z.array(z.custom<typeof otherOptions.$inferSelect>()),
        },
      },
      create: {
        method: "POST" as const,
        path: "/api/options/others" as const,
        input: insertOtherOptionSchema,
        responses: {
          201: z.custom<typeof otherOptions.$inferSelect>(),
          400: errorSchemas.validation,
          401: errorSchemas.unauthorized,
        },
      },
      update: {
        method: "PATCH" as const,
        path: "/api/options/others/:id" as const,
        input: insertOtherOptionSchema.partial(),
        responses: {
          200: z.custom<typeof otherOptions.$inferSelect>(),
          400: errorSchemas.validation,
          401: errorSchemas.unauthorized,
          404: errorSchemas.notFound,
        },
      },
      delete: {
        method: "DELETE" as const,
        path: "/api/options/others/:id" as const,
        responses: {
          204: z.void(),
          401: errorSchemas.unauthorized,
          404: errorSchemas.notFound,
        },
      },
    },
  },
  shipping: {
    quote: {
      get: {
        method: "GET" as const,
        path: "/api/shipping/quote" as const,
        responses: {
          200: z.object({
            warehousePincode: z.string(),
            deliveryPincode: z.string(),
            distanceKm: z.number(),
            shippingCharge: z.number(),
            matchedRange: z.object({
              id: z.number(),
              minKm: z.number(),
              maxKm: z.number(),
              price: z.number(),
            }),
          }),
          400: errorSchemas.validation,
          404: errorSchemas.notFound,
        },
      },
    },
    settings: {
      get: {
        method: "GET" as const,
        path: "/api/admin/shipping/settings" as const,
        responses: {
          200: z.custom<typeof shippingSettings.$inferSelect>(),
          401: errorSchemas.unauthorized,
        },
      },
      update: {
        method: "PUT" as const,
        path: "/api/admin/shipping/settings" as const,
        input: z.object({ warehousePincode: z.string().min(1) }),
        responses: {
          200: z.custom<typeof shippingSettings.$inferSelect>(),
          400: errorSchemas.validation,
          401: errorSchemas.unauthorized,
        },
      },
    },
    ranges: {
      list: {
        method: "GET" as const,
        path: "/api/admin/shipping/ranges" as const,
        responses: {
          200: z.array(z.custom<typeof shippingRanges.$inferSelect>()),
          401: errorSchemas.unauthorized,
        },
      },
      create: {
        method: "POST" as const,
        path: "/api/admin/shipping/ranges" as const,
        input: insertShippingRangeSchema.extend({
          minKm: z.number().int().min(0),
          maxKm: z.number().int().min(0),
          price: z.number().int().min(0),
        }),
        responses: {
          201: z.custom<typeof shippingRanges.$inferSelect>(),
          400: errorSchemas.validation,
          401: errorSchemas.unauthorized,
        },
      },
      update: {
        method: "PATCH" as const,
        path: "/api/admin/shipping/ranges/:id" as const,
        input: insertShippingRangeSchema
          .partial()
          .extend({
            minKm: z.number().int().min(0).optional(),
            maxKm: z.number().int().min(0).optional(),
            price: z.number().int().min(0).optional(),
          }),
        responses: {
          200: z.custom<typeof shippingRanges.$inferSelect>(),
          400: errorSchemas.validation,
          401: errorSchemas.unauthorized,
          404: errorSchemas.notFound,
        },
      },
      delete: {
        method: "DELETE" as const,
        path: "/api/admin/shipping/ranges/:id" as const,
        responses: {
          204: z.void(),
          401: errorSchemas.unauthorized,
          404: errorSchemas.notFound,
        },
      },
    },
  },
  products: {
    list: {
      method: "GET" as const,
      path: "/api/products" as const,
      responses: {
        200: z.array(z.custom<typeof products.$inferSelect>()),
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/products/:id" as const,
      responses: {
        200: z.custom<typeof products.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    homeSlider: {
      method: "GET" as const,
      path: "/api/products/home-slider" as const,
      responses: {
        200: z.object({
          topOrdered: z.array(z.custom<typeof products.$inferSelect>()),
          recent: z.array(z.custom<typeof products.$inferSelect>()),
        }),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/products" as const,
      input: insertProductSchema.extend({
        categoryId: z.number().nullable().optional(),
        customerCanChooseColor: z.boolean().optional(),
        availableColors: z.array(z.string().min(1)).optional(),
        hasVariants: z.boolean().optional(),
        variants: z
          .array(
            z.object({
              id: z.string().min(1),
              name: z.string().min(1),
              price: z.number().min(0),
              images: z.array(z.string().url()).min(1),
              isDefault: z.boolean(),
              isActive: z.boolean(),
              sortOrder: z.number().int().min(0),
            }),
          )
          .optional(),
        customerCanChooseSize: z.boolean().optional(),
        sizeSelectionMode: z.enum(["inherit", "add", "override"]).optional(),
        overallSize: z.string().optional().nullable(),
        availableSizes: z.array(z.string().min(1)).optional(),
        sizePrices: z.record(z.number().min(0)).optional(),
        defaultSize: z.string().min(1).optional().nullable(),
        customerCanChooseOther: z.boolean().optional(),
        availableOthers: z.array(z.string().min(1)).optional(),
        filamentWeightGrams: z.number().int().min(0).optional().nullable(),
        perGramCost: z.number().min(0).optional().nullable(),
        printingTimeMinutes: z.number().int().min(0).optional().nullable(),
        perMinuteCost: z.number().min(0).optional().nullable(),
        othersCost: z.number().min(0).optional().nullable(),
        extraProfitCost: z.number().min(0).optional().nullable(),
        productImages: z.array(z.string().url()).optional(),
      }),
      responses: {
        201: z.custom<typeof products.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    update: {
      method: "PATCH" as const,
      path: "/api/products/:id" as const,
      input: insertProductSchema.partial().extend({
        categoryId: z.number().nullable().optional(),
        customerCanChooseColor: z.boolean().optional(),
        availableColors: z.array(z.string().min(1)).optional(),
        hasVariants: z.boolean().optional(),
        variants: z
          .array(
            z.object({
              id: z.string().min(1),
              name: z.string().min(1),
              price: z.number().min(0),
              images: z.array(z.string().url()).min(1),
              isDefault: z.boolean(),
              isActive: z.boolean(),
              sortOrder: z.number().int().min(0),
            }),
          )
          .optional(),
        customerCanChooseSize: z.boolean().optional(),
        sizeSelectionMode: z.enum(["inherit", "add", "override"]).optional(),
        overallSize: z.string().optional().nullable(),
        availableSizes: z.array(z.string().min(1)).optional(),
        sizePrices: z.record(z.number().min(0)).optional(),
        defaultSize: z.string().min(1).optional().nullable(),
        customerCanChooseOther: z.boolean().optional(),
        availableOthers: z.array(z.string().min(1)).optional(),
        filamentWeightGrams: z.number().int().min(0).optional().nullable(),
        perGramCost: z.number().min(0).optional().nullable(),
        printingTimeMinutes: z.number().int().min(0).optional().nullable(),
        perMinuteCost: z.number().min(0).optional().nullable(),
        othersCost: z.number().min(0).optional().nullable(),
        extraProfitCost: z.number().min(0).optional().nullable(),
        productImages: z.array(z.string().url()).optional(),
      }),
      responses: {
        200: z.custom<typeof products.$inferSelect>(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/products/:id" as const,
      responses: {
        204: z.void(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
  },
  customRequests: {
    list: {
      method: "GET" as const,
      path: "/api/custom-requests" as const,
      responses: {
        200: z.array(z.custom<typeof customRequests.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/custom-requests" as const,
      input: insertCustomRequestSchema.extend({
        customerId: z.number().optional(),
        addressLine1: z.string().min(1, "Address line 1 is required"),
        addressLine2: z.string().optional(),
        city: z.string().min(1, "City is required"),
        state: z.string().min(1, "State is required"),
        pincode: z.string().min(1, "Pincode is required"),
      }),
      responses: {
        201: z.custom<typeof customRequests.$inferSelect>(),
      },
    },
    updateStatus: {
      method: "PATCH" as const,
      path: "/api/custom-requests/:id/status" as const,
      input: z.object({ status: z.string() }),
      responses: {
        200: z.custom<typeof customRequests.$inferSelect>(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    sendQuote: {
      method: "PATCH" as const,
      path: "/api/custom-requests/:id/quote" as const,
      input: z.object({
        quotedPrice: z.number().min(0.01),
        quoteNotes: z.string().optional(),
        quoteEta: z.string().optional(),
      }),
      responses: {
        200: z.custom<typeof customRequests.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    convertToOrder: {
      method: "POST" as const,
      path: "/api/custom-requests/:id/convert-to-order" as const,
      input: z.object({
        adminOverride: z.boolean().optional(),
        shippingPincode: z.string().min(1).optional(),
      }),
      responses: {
        201: z.object({
          request: z.custom<typeof customRequests.$inferSelect>(),
          order: z.custom<typeof orders.$inferSelect>(),
        }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
  },
  track: {
    get: {
      method: "GET" as const,
      path: "/api/track/:trackingId" as const,
      responses: {
        200: z.object({
          trackingId: z.string(),
          id: z.number(),
          customerId: z.number().nullable().optional(),
          name: z.string(),
          email: z.string(),
          phone: z.string(),
          address: z.string().nullable(),
          addressLine1: z.string().nullable().optional(),
          addressLine2: z.string().nullable().optional(),
          city: z.string().nullable().optional(),
          state: z.string().nullable().optional(),
          pincode: z.string().nullable().optional(),
          description: z.string(),
          status: z.string(),
          quotedPrice: z.number().nullable().optional(),
          quoteNotes: z.string().nullable().optional(),
          quoteEta: z.string().nullable().optional(),
          quoteStatus: z.string().optional(),
          quoteSentAt: z.string().nullable().optional(),
          convertedOrderId: z.number().nullable().optional(),
          timeline: z.array(
            z.object({
              at: z.string(),
              type: z.string(),
              message: z.string(),
              actor: z.string().optional(),
              meta: z.record(z.unknown()).optional(),
            }),
          ),
          imageUrls: z.array(z.string()),
          createdAt: z.string().nullable(),
        }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
  },
  orders: {
    list: {
      method: "GET" as const,
      path: "/api/orders" as const,
      responses: {
        200: z.array(z.custom<typeof orders.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/orders/:id" as const,
      responses: {
        200: z.custom<typeof orders.$inferSelect>(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/orders" as const,
      input: insertOrderSchema.extend({
        customerId: z.number().optional(),
        subtotalPrice: z.number().min(0).optional(),
        shippingCharge: z.number().min(0).optional(),
        shippingPincode: z.string().min(1).optional(),
        items: z.array(
          z.object({
            productId: z.number(),
            quantity: z.number().int().min(1),
            price: z.number().min(0),
            name: z.string().min(1),
            variantId: z.string().min(1).optional().nullable(),
            variantName: z.string().min(1).optional().nullable(),
            selectedColor: z.string().min(1).optional().nullable(),
            selectedSize: z.string().min(1).optional().nullable(),
            selectedOther: z.string().min(1).optional().nullable(),
          }),
        ),
      }),
      responses: {
        201: z.custom<typeof orders.$inferSelect>(),
      },
    },
    updateStatus: {
      method: "PATCH" as const,
      path: "/api/orders/:id/status" as const,
      input: z.object({ status: z.enum(orderStatuses) }),
      responses: {
        200: z.custom<typeof orders.$inferSelect>(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: "PATCH" as const,
      path: "/api/orders/:id" as const,
      input: z.object({
        status: z.enum(orderStatuses).optional(),
        paymentStatus: z.enum(paymentStatuses).optional(),
        paymentMode: z.enum(paymentModes).optional(),
        totalPrice: z.number().min(0).optional(),
        adminNotes: z.string().nullable().optional(),
      }),
      responses: {
        200: z.custom<typeof orders.$inferSelect>(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    adminCreate: {
      method: "POST" as const,
      path: "/api/admin/orders" as const,
      input: z.object({
        name: z.string().min(1, "Customer name required"),
        phone: z.string().min(10, "Phone required"),
        email: z.string().email("Valid email required"),
        address: z.string().min(5, "Address required"),
        shippingPincode: z.string().min(1).optional(),
        additionalNotes: z.string().optional(),
        adminNotes: z.string().optional(),
        customerId: z.number().optional(),
        status: z.enum(orderStatuses).optional(),
        paymentStatus: z.enum(paymentStatuses).optional(),
        paymentMode: z.enum(paymentModes).optional(),
        subtotalPrice: z.number().min(0),
        shippingCharge: z.number().min(0),
        totalPrice: z.number().min(0),
        items: z.array(
          z.object({
            productId: z.number(),
            quantity: z.number().int().min(1),
            price: z.number().min(0),
            name: z.string().min(1),
            variantId: z.string().min(1).optional().nullable(),
            variantName: z.string().min(1).optional().nullable(),
            selectedColor: z.string().min(1).optional().nullable(),
            selectedSize: z.string().min(1).optional().nullable(),
            selectedOther: z.string().min(1).optional().nullable(),
          }),
        ),
      }),
      responses: {
        201: z.custom<typeof orders.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    getInvoice: {
      method: "GET" as const,
      path: "/api/orders/:id/invoice" as const,
      responses: {
        200: z.string(),
        401: errorSchemas.unauthorized,
        403: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
  },
  invoiceTemplate: {
    get: {
      method: "GET" as const,
      path: "/api/admin/invoice-template" as const,
      responses: {
        200: z.object({
          id: z.number(),
          companyName: z.string(),
          logoUrl: z.string().nullable(),
          address: z.string(),
          phone: z.string(),
          email: z.string(),
          footerText: z.string(),
          updatedAt: z.string().nullable(),
        }),
        401: errorSchemas.unauthorized,
      },
    },
    update: {
      method: "PUT" as const,
      path: "/api/admin/invoice-template" as const,
      input: z.object({
        companyName: z.string().optional(),
        logoUrl: z.string().nullable().optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        footerText: z.string().optional(),
      }),
      responses: {
        200: z.object({
          id: z.number(),
          companyName: z.string(),
          logoUrl: z.string().nullable(),
          address: z.string(),
          phone: z.string(),
          email: z.string(),
          footerText: z.string(),
          updatedAt: z.string().nullable(),
        }),
        401: errorSchemas.unauthorized,
      },
    },
  },
  reviews: {
    listByProduct: {
      method: "GET" as const,
      path: "/api/products/:id/reviews" as const,
      responses: {
        200: z.array(
          z.object({
            id: z.number(),
            productId: z.number(),
            customerId: z.number().nullable(),
            orderId: z.number().nullable(),
            rating: z.number(),
            comment: z.string().nullable(),
            imageUrl: z.string().nullable().optional(),
            createdAt: z.string().nullable(),
            customerName: z.string().optional(),
          }),
        ),
      },
    },
    productRating: {
      method: "GET" as const,
      path: "/api/products/:id/rating" as const,
      responses: {
        200: z.object({ average: z.number(), count: z.number() }),
      },
    },
    ratingsBatch: {
      method: "GET" as const,
      path: "/api/reviews/ratings" as const,
      responses: {
        200: z.array(
          z.object({
            productId: z.number(),
            average: z.number(),
            count: z.number(),
          }),
        ),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/reviews" as const,
      input: z.object({
        productId: z.number(),
        orderId: z.number(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
      }),
      responses: {
        201: z.custom<typeof reviews.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    createAdmin: {
      method: "POST" as const,
      path: "/api/admin/products/:id/review" as const,
      input: z.object({
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
        imageUrl: z.string().url().optional().nullable(),
      }),
      responses: {
        201: z.custom<typeof reviews.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
  },
  customer: {
    sendOtp: {
      method: "POST" as const,
      path: "/api/customer/send-otp" as const,
      input: z.object({
        email: z.string().email(),
        type: z.enum(["signup", "forgot_password"]),
      }),
      responses: {
        200: z.object({ message: z.string(), otp: z.string().optional() }),
        400: errorSchemas.validation,
      },
    },
    verifyAndRegister: {
      method: "POST" as const,
      path: "/api/customer/verify-and-register" as const,
      input: z.object({
        email: z.string().email(),
        code: z.string().length(6),
        name: z.string().min(1),
        phone: z.string().min(10, "Mobile number required"),
        password: z.string().min(6),
      }),
      responses: {
        201: z.object({ message: z.string(), token: z.string() }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    verifyAndResetPassword: {
      method: "POST" as const,
      path: "/api/customer/verify-and-reset-password" as const,
      input: z.object({
        email: z.string().email(),
        code: z.string().length(6),
        newPassword: z.string().min(6),
      }),
      responses: {
        200: z.object({ message: z.string() }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    login: {
      method: "POST" as const,
      path: "/api/customer/login" as const,
      input: z.object({ email: z.string().email(), password: z.string() }),
      responses: {
        200: z.object({ message: z.string(), token: z.string() }),
        401: errorSchemas.unauthorized,
      },
    },
    me: {
      method: "GET" as const,
      path: "/api/customer/me" as const,
      responses: {
        200: z.object({
          id: z.number(),
          email: z.string(),
          name: z.string(),
          phone: z.string().nullable(),
        }),
        401: errorSchemas.unauthorized,
      },
    },
    orders: {
      method: "GET" as const,
      path: "/api/customer/orders" as const,
      responses: {
        200: z.array(z.custom<typeof orders.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    customRequestQuoteResponse: {
      method: "POST" as const,
      path: "/api/customer/custom-requests/:id/quote-response" as const,
      input: z.object({ action: z.enum(["accepted", "rejected"]) }),
      responses: {
        200: z.custom<typeof customRequests.$inferSelect>(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    addresses: {
      method: "GET" as const,
      path: "/api/customer/addresses" as const,
      responses: {
        200: z.array(z.custom<typeof customerAddresses.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    addressCreate: {
      method: "POST" as const,
      path: "/api/customer/addresses" as const,
      input: z.object({
        label: z.string().optional(),
        addressLine1: z.string().min(1, "Address line 1 required"),
        addressLine2: z.string().optional(),
        city: z.string().min(1, "City required"),
        state: z.string().min(1, "State required"),
        pincode: z.string().min(1, "Pincode required"),
        phone: z.string().min(1, "Phone required"),
        isDefault: z.boolean().optional(),
      }),
      responses: {
        201: z.custom<typeof customerAddresses.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    addressUpdate: {
      method: "PATCH" as const,
      path: "/api/customer/addresses/:id" as const,
      input: z.object({
        label: z.string().optional(),
        addressLine1: z.string().optional(),
        addressLine2: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        pincode: z.string().optional(),
        phone: z.string().optional(),
        isDefault: z.boolean().optional(),
      }),
      responses: {
        200: z.custom<typeof customerAddresses.$inferSelect>(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    addressSetDefault: {
      method: "PATCH" as const,
      path: "/api/customer/addresses/:id/default" as const,
      responses: {
        200: z.object({ message: z.string() }),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    addressDelete: {
      method: "DELETE" as const,
      path: "/api/customer/addresses/:id" as const,
      responses: {
        204: z.void(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
  },
  customers: {
    list: {
      method: "GET" as const,
      path: "/api/customers" as const,
      responses: {
        200: z.array(
          z.object({
            id: z.number(),
            email: z.string(),
            name: z.string(),
            phone: z.string().nullable(),
            createdAt: z.string().optional(),
          }),
        ),
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/customers" as const,
      input: z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Valid email required"),
        phone: z.string().min(10, "Phone number required"),
        password: z.string().min(6, "Password must be at least 6 characters"),
      }),
      responses: {
        201: z.object({
          id: z.number(),
          email: z.string(),
          name: z.string(),
          phone: z.string(),
          createdAt: z.string().optional(),
        }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        409: z.object({ message: z.string() }),
      },
    },
    orders: {
      method: "GET" as const,
      path: "/api/customers/:id/orders" as const,
      responses: {
        200: z.array(z.custom<typeof orders.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    customRequests: {
      method: "GET" as const,
      path: "/api/customers/:id/custom-requests" as const,
      responses: {
        200: z.array(z.custom<typeof customRequests.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
  },
  uploads: {
    create: {
      method: "POST" as const,
      path: "/api/uploads" as const,
      responses: {
        201: z.object({ url: z.string() }),
      },
    },
    delete: {
      method: "POST" as const,
      path: "/api/uploads/delete" as const,
      input: z.object({ url: z.string().url() }),
      responses: {
        200: z.object({ deleted: z.boolean() }),
      },
    },
  },
  siteConfig: {
    get: {
      method: "GET" as const,
      path: "/api/site-config" as const,
      responses: {
        200: z.custom<typeof siteConfig.$inferSelect>(),
      },
    },
    stream: {
      method: "GET" as const,
      path: "/api/site-config/stream" as const,
      responses: {
        200: z.any(),
      },
    },
    adminGet: {
      method: "GET" as const,
      path: "/api/admin/site-config" as const,
      responses: {
        200: z.custom<typeof siteConfig.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    adminUpdate: {
      method: "PUT" as const,
      path: "/api/admin/site-config" as const,
      input: insertSiteConfigSchema.partial().extend({
        bannerEnabled: z.boolean().optional(),
        bannerImageUrl: z.string().url().nullable().optional(),
        bannerLinkUrl: z.string().url().nullable().optional(),
        theme: z
          .object({
            light: z.object({
              primary: z.string(),
              primaryForeground: z.string(),
              background: z.string(),
              foreground: z.string(),
              card: z.string(),
              muted: z.string(),
              border: z.string(),
            }),
            dark: z.object({
              primary: z.string(),
              primaryForeground: z.string(),
              background: z.string(),
              foreground: z.string(),
              card: z.string(),
              muted: z.string(),
              border: z.string(),
            }),
          })
          .optional(),
      }),
      responses: {
        200: z.custom<typeof siteConfig.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    adminSaveDraft: {
      method: "PUT" as const,
      path: "/api/admin/site-config/draft" as const,
      input: z.object({
        bannerImageUrl: z.string().url().nullable().optional(),
        bannerLinkUrl: z.string().url().nullable().optional(),
        theme: z.object({
          light: z.object({
            primary: z.string(),
            primaryForeground: z.string(),
            background: z.string(),
            foreground: z.string(),
            card: z.string(),
            muted: z.string(),
            border: z.string(),
          }),
          dark: z.object({
            primary: z.string(),
            primaryForeground: z.string(),
            background: z.string(),
            foreground: z.string(),
            card: z.string(),
            muted: z.string(),
            border: z.string(),
          }),
        }),
      }),
      responses: {
        200: z.custom<typeof siteConfig.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    adminPublishLiveFromDraft: {
      method: "POST" as const,
      path: "/api/admin/site-config/publish-live" as const,
      responses: {
        200: z.custom<typeof siteConfig.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    adminRetrievePreviousLive: {
      method: "POST" as const,
      path: "/api/admin/site-config/retrieve-previous-live" as const,
      responses: {
        200: z.custom<typeof siteConfig.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
  },
};

export function buildUrl(
  path: string,
  params?: Record<string, string | number>,
): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
