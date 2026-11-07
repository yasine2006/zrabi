/**
 * Storefront promo codes.
 *
 * Keeping the catalogue in one module means the cart, checkout summary and
 * `/api/orders` all apply exactly the same percentage to the merchandise
 * subtotal (shipping is never discounted).
 */

export const PROMO_CODES = {
  ATLAS10: {
    percent: 10,
    labelFr: "Merci de votre confiance — 10 % sur les tapis",
    labelEn: "A thank-you from the Atlas — 10% off rugs",
  },
  WELCOME5: {
    percent: 5,
    labelFr: "Bienvenue chez Zarbia — 5 % sur votre première pièce",
    labelEn: "Welcome to Zarbia — 5% off your first piece",
  },
} as const;

export type PromoCode = keyof typeof PROMO_CODES;

export interface AppliedPromo {
  code: PromoCode;
  percent: number;
  labelFr: string;
  labelEn: string;
}

export function normalizePromoCode(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

export function getPromo(value: string | null | undefined): AppliedPromo | null {
  if (!value) return null;

  const code = normalizePromoCode(value) as PromoCode;

  if (!Object.prototype.hasOwnProperty.call(PROMO_CODES, code)) {
    return null;
  }

  return { code, ...PROMO_CODES[code] };
}

/** Discount in the same currency as the subtotal, rounded to two decimals. */
export function promoDiscount(subtotal: number, code: string | null): number {
  const promo = getPromo(code);
  if (!promo) return 0;

  return Math.round(subtotal * promo.percent) / 100;
}
