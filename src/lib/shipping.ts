import { prisma } from "./db";

/**
 * Shipping helpers.
 *
 * `ShippingRate` rows are keyed by a coarse zone plus a half-open weight
 * bracket: [minWeightKg, maxWeightKg). A parcel that weighs exactly 2 kg uses
 * the 2–5 kg bracket, never the 0–2 kg one.
 */

export const SHIPPING_ZONES = [
  "MOROCCO",
  "EUROPE",
  "USA_CANADA",
  "MIDDLE_EAST",
] as const;

export type ShippingZone = (typeof SHIPPING_ZONES)[number];

export type ShippingErrorCode =
  | "INVALID_WEIGHT"
  | "UNSUPPORTED_COUNTRY"
  | "NO_RATE";

export class ShippingError extends Error {
  constructor(
    message: string,
    public readonly code: ShippingErrorCode,
  ) {
    super(message);
    this.name = "ShippingError";
  }
}

const EUROPE_COUNTRY_CODES = new Set([
  "AD", "AL", "AT", "BA", "BE", "BG", "CH", "CY", "CZ", "DE", "DK",
  "EE", "ES", "FI", "FR", "GB", "GR", "HR", "HU", "IE", "IS", "IT",
  "LI", "LT", "LU", "LV", "MC", "MD", "ME", "MK", "MT", "NL", "NO",
  "PL", "PT", "RO", "RS", "SE", "SI", "SK", "SM", "UA", "VA", "XK",
]);

const USA_CANADA_COUNTRY_CODES = new Set(["US", "CA", "PR"]);

const MIDDLE_EAST_COUNTRY_CODES = new Set([
  "AE", "BH", "EG", "IL", "IQ", "IR", "JO", "KW", "LB", "OM", "PS",
  "QA", "SA", "SY", "TR", "YE",
]);

/**
 * Map an ISO 3166-1 alpha-2 country code to a shipping zone.
 * Returns null for destinations Zarbia Atlas does not ship to yet.
 */
export function resolveShippingZone(
  countryCode: string,
): ShippingZone | null {
  const code = countryCode.trim().toUpperCase();

  if (!code) return null;
  if (code === "MA" || code === "EH") return "MOROCCO";
  if (EUROPE_COUNTRY_CODES.has(code)) return "EUROPE";
  if (USA_CANADA_COUNTRY_CODES.has(code)) return "USA_CANADA";
  if (MIDDLE_EAST_COUNTRY_CODES.has(code)) return "MIDDLE_EAST";

  return null;
}

export interface ShippingQuote {
  rateId: string;
  zone: ShippingZone;
  countryCode: string;
  weightKg: number;
  minWeightKg: number;
  maxWeightKg: number;
  priceMad: number;
  priceEur: number;
  priceUsd: number;
  carrier: string | null;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
}

/**
 * Resolve the active shipping bracket for a destination and parcel weight.
 *
 * @throws {ShippingError} when the country is unsupported, the weight is not
 * positive, or no bracket covers the weight.
 */
export async function calculateShipping(
  countryCode: string,
  totalWeightKg: number,
): Promise<ShippingQuote> {
  if (!Number.isFinite(totalWeightKg) || totalWeightKg <= 0) {
    throw new ShippingError(
      `totalWeightKg must be a positive number, received: ${totalWeightKg}`,
      "INVALID_WEIGHT",
    );
  }

  const normalizedCountry = countryCode.trim().toUpperCase();
  const zone = resolveShippingZone(normalizedCountry);

  if (!zone) {
    throw new ShippingError(
      `Shipping is not available for country code "${countryCode}".`,
      "UNSUPPORTED_COUNTRY",
    );
  }

  const weight = Math.round(totalWeightKg * 1000) / 1000;

  const rate = await prisma.shippingRate.findFirst({
    where: {
      zone,
      isActive: true,
      minWeightKg: { lte: weight },
      maxWeightKg: { gt: weight },
    },
    orderBy: { minWeightKg: "asc" },
  });

  if (!rate) {
    throw new ShippingError(
      `No shipping rate configured for ${weight} kg to ${zone}.`,
      "NO_RATE",
    );
  }

  return {
    rateId: rate.id,
    zone,
    countryCode: normalizedCountry,
    weightKg: weight,
    minWeightKg: Number(rate.minWeightKg),
    maxWeightKg: Number(rate.maxWeightKg),
    priceMad: Number(rate.priceMad),
    priceEur: Number(rate.priceEur),
    priceUsd: Number(rate.priceUsd),
    carrier: rate.carrier,
    estimatedDaysMin: rate.estimatedDaysMin,
    estimatedDaysMax: rate.estimatedDaysMax,
  };
}
