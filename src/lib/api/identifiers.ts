import { randomInt } from "node:crypto";
import type { RugType } from "@prisma/client";

/**
 * Human-readable identifiers.
 *
 * Random suffixes keep creation safe under concurrency without an extra
 * sequence table. Collisions are handled by retrying on Prisma P2002.
 */

const SKU_PREFIX: Record<RugType, string> = {
  BENI_OURAIN: "BO",
  AZILAL: "AZ",
  BOUCHEROUITE: "BC",
  KILIM: "KL",
  HANBEL: "HB",
};

function randomDigits(length: number): string {
  return randomInt(0, 10 ** length)
    .toString()
    .padStart(length, "0");
}

/** e.g. ZA-2026-48192073 */
export function generateOrderNumber(now: Date = new Date()): string {
  return `ZA-${now.getFullYear()}-${randomDigits(8)}`;
}

/** e.g. ZA-CUSTOM-730418 */
export function generateCustomOrderReference(): string {
  return `ZA-CUSTOM-${randomDigits(6)}`;
}

/** e.g. ZA-BO-4821 */
export function generateRugSku(type: RugType): string {
  return `ZA-${SKU_PREFIX[type]}-${randomDigits(4)}`;
}

/** Lowercase, accent-free, dash-separated slug. */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}
