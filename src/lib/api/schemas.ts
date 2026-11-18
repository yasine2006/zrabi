import {
  Currency,
  CustomOrderStatus,
  OrderStatus,
  PaymentMethod,
  RugStatus,
  RugType,
} from "@prisma/client";
import { z } from "zod";

/**
 * Shared request schemas.
 *
 * Bodies are JSON; query strings arrive as strings and are coerced where
 * appropriate. Every route validates before touching the database.
 */

const money = z.coerce
  .number()
  .finite()
  .positive("Amount must be positive.")
  .max(100_000_000);

const countryCode = z
  .string()
  .trim()
  .regex(/^[A-Za-z]{2}$/, "Country must be a 2-letter ISO code.")
  .transform((value) => value.toUpperCase());

const email = z.string().trim().toLowerCase().email().max(200);

const phone = z
  .string()
  .trim()
  .regex(
    /^\+?[0-9][0-9\s().-]{5,24}$/,
    "Phone number must contain between 6 and 25 digits.",
  );

const fullName = z.string().trim().min(2).max(160);

const optionalUrl = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.string().trim().url().max(2048).optional(),
);

/** ------------------------------------------------------------------ rugs */

export const rugListQuerySchema = z
  .object({
    type: z.nativeEnum(RugType).optional(),
    region: z.string().trim().min(1).max(160).optional(),
    status: z.nativeEnum(RugStatus).optional(),
    isMadeToOrder: z.enum(["true", "false"]).optional(),
    minPrice: z.coerce.number().nonnegative().optional(),
    maxPrice: z.coerce.number().nonnegative().optional(),
    sort: z
      .enum([
        "newest",
        "oldest",
        "price_asc",
        "price_desc",
        "name_asc",
        "name_desc",
      ])
      .default("newest"),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(24),
  })
  .refine(
    (query) =>
      query.minPrice === undefined ||
      query.maxPrice === undefined ||
      query.minPrice <= query.maxPrice,
    {
      message: "minPrice must be lower than or equal to maxPrice.",
      path: ["minPrice"],
    },
  );

export type RugListQuery = z.infer<typeof rugListQuerySchema>;

const rugPhotos = z
  .array(z.string().trim().min(1).max(2048))
  .max(20)
  .default([]);

export const rugCreateSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(3)
    .max(120)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase words separated by dashes.",
    )
    .optional(),
  sku: z.string().trim().min(3).max(60).optional(),
  nameFr: z.string().trim().min(2).max(160),
  nameEn: z.string().trim().min(2).max(160),
  nameAr: z.string().trim().max(160).optional().nullable(),
  type: z.nativeEnum(RugType),
  widthCm: z.coerce.number().int().min(20).max(2000),
  lengthCm: z.coerce.number().int().min(20).max(2000),
  weightKg: z.coerce.number().positive().max(500),
  materialFr: z.string().trim().min(2).max(200),
  materialEn: z.string().trim().min(2).max(200),
  materialAr: z.string().trim().max(200).optional().nullable(),
  originVillage: z.string().trim().min(2).max(160),
  originRegion: z.string().trim().min(2).max(160),
  originAr: z.string().trim().max(160).optional().nullable(),
  craftingDays: z.coerce.number().int().min(1).max(3650),
  storyFr: z.string().trim().min(20).max(10_000),
  storyEn: z.string().trim().min(20).max(10_000),
  storyAr: z.string().trim().max(10_000).optional().nullable(),
  priceMad: money,
  priceEur: money.optional(),
  priceUsd: money.optional(),
  stock: z.coerce.number().int().min(0).max(10_000).default(1),
  status: z.nativeEnum(RugStatus).default(RugStatus.AVAILABLE),
  isMadeToOrder: z.boolean().default(false),
  photos: rugPhotos,
  videoUrl: optionalUrl,
  certificateId: z.string().trim().min(1).max(120).optional(),
  artisanId: z.string().trim().min(1, "An artisan id is required."),
});

export type RugCreateInput = z.infer<typeof rugCreateSchema>;

/** -------------------------------------------------------------- shipping */

export const shippingQuoteSchema = z.object({
  country: countryCode,
  items: z
    .array(
      z.object({
        rugId: z.string().trim().min(1),
        quantity: z.coerce.number().int().min(1).max(20).default(1),
      }),
    )
    .min(1, "At least one rug is required.")
    .max(50),
});

export type ShippingQuoteInput = z.infer<typeof shippingQuoteSchema>;

/** ---------------------------------------------------------------- orders */

const customerSchema = z.object({
  email,
  phone,
  fullName,
  addressLine1: z.string().trim().min(5).max(300),
  addressLine2: z.string().trim().max(300).optional(),
  city: z.string().trim().min(2).max(120),
  postalCode: z.string().trim().max(20).optional(),
  country: countryCode,
});

export const orderCreateSchema = z.object({
  customer: customerSchema,
  items: z
    .array(
      z.object({
        rugId: z.string().trim().min(1),
        quantity: z.coerce
          .number()
          .int()
          .min(1)
          .max(1, "Each unique rug can only be ordered once.")
          .default(1),
      }),
    )
    .min(1, "At least one rug is required.")
    .max(20),
  paymentMethod: z.nativeEnum(PaymentMethod).default(PaymentMethod.COD),
  currency: z.nativeEnum(Currency).default(Currency.MAD),
  customerNote: z.string().trim().max(2000).optional(),
});

export type OrderCreateInput = z.infer<typeof orderCreateSchema>;

/** ---------------------------------------------------------- custom orders */

export const customOrderCreateSchema = z
  .object({
    fullName,
    email,
    phone,
    rugType: z.nativeEnum(RugType).optional(),
    widthCm: z.coerce.number().int().min(20).max(2000),
    lengthCm: z.coerce.number().int().min(20).max(2000),
    woolColors: z
      .array(z.string().trim().min(1).max(60))
      .max(12)
      .default([]),
    pattern: z.string().trim().max(200).optional(),
    description: z.string().trim().min(10).max(5000),
    budgetMad: money.optional(),
    // Convenience alias for clients that send `budget` instead of `budgetMad`.
    budget: money.optional(),
    currency: z.nativeEnum(Currency).default(Currency.MAD),
    inspirationPhotos: z
      .array(z.string().trim().min(1).max(2048))
      .max(10)
      .default([]),
  })
  .refine(
    (input) => input.budgetMad !== undefined || input.budget !== undefined,
    {
      message: "A budget in MAD is required.",
      path: ["budgetMad"],
    },
  );

export type CustomOrderCreateInput = z.infer<typeof customOrderCreateSchema>;

/** ------------------------------------------------------------ admin auth */

export const adminLoginSchema = z.object({
  email,
  password: z.string().min(1, "A password is required.").max(200),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "The verification code must contain 6 digits.")
    .optional(),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

/** ------------------------------------------------------------- admin rugs */

const photoUrl = z.string().trim().min(1).max(2048);

const adminPhotos = z
  .array(photoUrl)
  .max(10, "A rug can have at most 10 photos.")
  .default([]);

export const adminRugCreateSchema = rugCreateSchema.extend({
  photos: adminPhotos,
});

export const adminRugUpdateSchema = rugCreateSchema.partial().extend({
  photos: z.array(photoUrl).max(10).optional(),
  // An empty string clears the column instead of silently keeping the old URL.
  videoUrl: z.preprocess(
    (value) => (value === "" ? null : value),
    z.string().trim().url().max(2048).nullable().optional(),
  ),
  certificateId: z.string().trim().max(120).nullable().optional(),
});

export type AdminRugCreateInput = z.infer<typeof adminRugCreateSchema>;
export type AdminRugUpdateInput = z.infer<typeof adminRugUpdateSchema>;

/** ----------------------------------------------------------- admin orders */

export const adminOrderUpdateSchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  trackingNumber: z.string().trim().max(120).optional().nullable(),
  carrier: z.string().trim().max(120).optional().nullable(),
  adminNote: z.string().trim().max(2000).optional().nullable(),
});

export type AdminOrderUpdateInput = z.infer<typeof adminOrderUpdateSchema>;

/** ---------------------------------------------------- admin custom orders */

export const adminCustomOrderUpdateSchema = z.object({
  status: z.nativeEnum(CustomOrderStatus).optional(),
  quotedPriceMad: money.optional().nullable(),
  depositMad: money.optional().nullable(),
  adminNote: z.string().trim().max(2000).optional().nullable(),
});

export type AdminCustomOrderUpdateInput = z.infer<
  typeof adminCustomOrderUpdateSchema
>;

/** ------------------------------------------------------- admin settings */

export const adminCurrencySettingsSchema = z.object({
  // Units of the foreign currency obtained for 1 MAD (e.g. 0.096 EUR).
  eurPerMad: z.coerce.number().positive().max(1000),
  usdPerMad: z.coerce.number().positive().max(1000),
});

export type AdminCurrencySettingsInput = z.infer<
  typeof adminCurrencySettingsSchema
>;

export const adminShippingSettingsSchema = z.object({
  rates: z
    .array(
      z.object({
        id: z.string().trim().min(1),
        priceMad: money,
        carrier: z.string().trim().max(120).optional().nullable(),
        estimatedDaysMin: z.coerce.number().int().min(0).max(120),
        estimatedDaysMax: z.coerce.number().int().min(0).max(120),
        isActive: z.boolean().default(true),
      }),
    )
    .min(1)
    .max(200),
});

export type AdminShippingSettingsInput = z.infer<
  typeof adminShippingSettingsSchema
>;
