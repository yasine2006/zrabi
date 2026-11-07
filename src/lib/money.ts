/**
 * Pure money helpers — safe to import from client components.
 *
 * The database-backed helpers live in `currency.ts`; keeping the formatting
 * and conversion functions here prevents Prisma from leaking into the browser
 * bundle.
 */

export type CurrencyCode = "MAD" | "EUR" | "USD";

export type CurrencyRates = Record<CurrencyCode, number>;

export const SUPPORTED_CURRENCIES = [
  "MAD",
  "EUR",
  "USD",
] as const satisfies readonly CurrencyCode[];

/** Safe defaults matching prisma/seed.ts, used when the table is empty. */
export const FALLBACK_RATES: CurrencyRates = {
  MAD: 1,
  EUR: 0.096,
  USD: 0.105,
};

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  MAD: "MAD",
  EUR: "€",
  USD: "$",
};

export function isCurrencyCode(value: string): value is CurrencyCode {
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(value);
}

function assertAmount(amount: number, label = "amount"): void {
  if (!Number.isFinite(amount)) {
    throw new TypeError(`${label} must be a finite number, received: ${amount}`);
  }
}

/**
 * Convert a base MAD amount into the target currency.
 * The result is rounded to two decimals.
 */
export function convertFromMad(
  amountMad: number,
  target: CurrencyCode,
  rates: CurrencyRates = FALLBACK_RATES,
): number {
  assertAmount(amountMad, "amountMad");

  const rate = rates[target];
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error(`Missing exchange rate for ${target}.`);
  }

  return Math.round(amountMad * rate * 100) / 100;
}

/** Convert an amount expressed in a foreign currency back to MAD. */
export function convertToMad(
  amount: number,
  source: CurrencyCode,
  rates: CurrencyRates = FALLBACK_RATES,
): number {
  assertAmount(amount, "amount");

  const rate = rates[source];
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error(`Missing exchange rate for ${source}.`);
  }

  return Math.round((amount / rate) * 100) / 100;
}

/** Round a monetary amount to two decimals without floating-point drift. */
export function roundMoney(amount: number): number {
  assertAmount(amount);
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Exchange rate stored on an order: how many MAD one unit of `currency` is
 * worth. `CurrencyRate` stores the inverse (units per 1 MAD), so EUR at 0.096
 * becomes 10.416667 MAD per EUR.
 */
export function getExchangeRateToMad(
  currency: CurrencyCode,
  rates: CurrencyRates = FALLBACK_RATES,
): number {
  if (currency === "MAD") return 1;

  const rate = rates[currency];
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error(`Missing exchange rate for ${currency}.`);
  }

  return Math.round((1 / rate) * 1_000_000) / 1_000_000;
}

/**
 * Format a price for display:
 *   4000  -> "4 000 MAD"
 *   384   -> "€384"
 *   420   -> "$420"
 *
 * Prices are rounded to the nearest unit by default for a clean, luxury
 * storefront. Pass `showDecimals` for accounting views.
 */
export function formatPrice(
  amount: number,
  currency: CurrencyCode,
  options: { showDecimals?: boolean } = {},
): string {
  assertAmount(amount);
  if (!isCurrencyCode(currency)) {
    throw new Error(`Unsupported currency: ${currency}`);
  }

  const rounded = options.showDecimals
    ? Math.round(amount * 100) / 100
    : Math.round(amount);

  const negative = rounded < 0;
  const [integerPart, decimalPart = ""] = Math.abs(rounded)
    .toFixed(options.showDecimals ? 2 : 0)
    .split(".");

  const grouped = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const hasDecimals = options.showDecimals && Number(decimalPart) > 0;
  const number = hasDecimals ? `${grouped},${decimalPart}` : grouped;

  if (currency === "MAD") {
    return `${negative ? "-" : ""}${number} MAD`;
  }
  if (currency === "EUR") {
    return `${negative ? "-" : ""}€${number}`;
  }
  return `${negative ? "-" : ""}$${number}`;
}

/** Convert a MAD amount then format it in the target currency. */
export function formatPriceFromMad(
  amountMad: number,
  currency: CurrencyCode,
  rates: CurrencyRates = FALLBACK_RATES,
): string {
  return formatPrice(convertFromMad(amountMad, currency, rates), currency);
}
