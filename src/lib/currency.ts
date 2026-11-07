import { Currency } from "@prisma/client";
import { prisma } from "./db";
import {
  convertFromMad,
  formatPrice,
  formatPriceFromMad,
  getExchangeRateToMad,
  FALLBACK_RATES,
  isCurrencyCode,
  SUPPORTED_CURRENCIES,
  type CurrencyCode,
  type CurrencyRates,
} from "./money";

/**
 * Database-backed currency helpers.
 *
 * All rug prices are authored in MAD (the base currency). The `CurrencyRate`
 * table stores how many units of each currency one MAD buys, e.g.
 * EUR = 0.096 means 1 MAD = 0.096 EUR.
 *
 * Pure formatting/conversion functions are re-exported from `money.ts`, which
 * is safe to import from client components.
 */

export * from "./money";

/** Snapshot the selected currency → MAD rate from the database. */
export async function getExchangeRateSnapshot(
  currency: CurrencyCode,
): Promise<number> {
  const rates = await getCurrencyRates();
  return getExchangeRateToMad(currency, rates);
}

/**
 * Load current rates from the database, falling back to seeded defaults for
 * any currency that has no row yet. MAD is always the base (rate = 1).
 */
export async function getCurrencyRates(): Promise<CurrencyRates> {
  const rows = await prisma.currencyRate.findMany({
    where: {
      currency: { in: [Currency.MAD, Currency.EUR, Currency.USD] },
    },
    select: { currency: true, rate: true },
  });

  const rates: CurrencyRates = { ...FALLBACK_RATES };

  for (const row of rows) {
    if (!isCurrencyCode(row.currency)) continue;
    const rate = Number(row.rate);
    if (Number.isFinite(rate) && rate > 0) {
      rates[row.currency] = rate;
    }
  }

  rates.MAD = 1;
  return rates;
}

/** Convert a MAD amount using the live rates stored in PostgreSQL. */
export async function convertPrice(
  amountMad: number,
  target: CurrencyCode,
): Promise<number> {
  const rates = await getCurrencyRates();
  return convertFromMad(amountMad, target, rates);
}

/** Format a MAD amount in another currency using live database rates. */
export async function formatMadPrice(
  amountMad: number,
  target: CurrencyCode,
): Promise<string> {
  const rates = await getCurrencyRates();
  return formatPriceFromMad(amountMad, target, rates);
}

export interface PriceBreakdown {
  currency: CurrencyCode;
  amount: number;
  formatted: string;
}

/** All three storefront prices for a base MAD amount, loaded in one query. */
export async function getPriceBreakdown(
  amountMad: number,
): Promise<Record<CurrencyCode, PriceBreakdown>> {
  const rates = await getCurrencyRates();

  return SUPPORTED_CURRENCIES.reduce(
    (prices, currency) => {
      const amount = convertFromMad(amountMad, currency, rates);
      prices[currency] = {
        currency,
        amount,
        formatted: formatPrice(amount, currency),
      };
      return prices;
    },
    {} as Record<CurrencyCode, PriceBreakdown>,
  );
}
