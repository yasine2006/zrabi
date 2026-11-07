import type { RugTypeValue } from "./i18n";
import { roundMoney } from "./money";

/**
 * Bespoke commission pricing.
 *
 * A custom rug is priced by the square metre, per weaving tradition. The rate
 * includes the raw wool, the plant dyes, the loom time and the finishing
 * (washing, brushing, fringe). The atelier confirms the final quote after it
 * has seen the sketch; the 30% deposit locks the loom slot.
 */

export const CUSTOM_DEPOSIT_PERCENT = 30;

export const CUSTOM_MIN_WIDTH_CM = 80;
export const CUSTOM_MAX_WIDTH_CM = 400;
export const CUSTOM_MIN_LENGTH_CM = 100;
export const CUSTOM_MAX_LENGTH_CM = 600;

export const CUSTOM_WIDTH_STEP_CM = 10;
export const CUSTOM_LENGTH_STEP_CM = 10;

/** Indicative atelier rate in MAD per square metre. */
export const CUSTOM_PRICE_PER_M2: Record<RugTypeValue, number> = {
  BENI_OURAIN: 2400,
  AZILAL: 2100,
  BOUCHEROUITE: 1500,
  KILIM: 1800,
  HANBEL: 1300,
};

export interface WoolSwatch {
  id: string;
  nameFr: string;
  nameEn: string;
  hex: string;
}

export const WOOL_SWATCHES: readonly WoolSwatch[] = [
  { id: "ecru", nameFr: "Écru", nameEn: "Undyed ivory", hex: "#EFE7D8" },
  { id: "sable", nameFr: "Sable", nameEn: "Sand", hex: "#D8C3A5" },
  { id: "argile", nameFr: "Argile", nameEn: "Clay", hex: "#C08552" },
  { id: "safran", nameFr: "Safran", nameEn: "Saffron", hex: "#D9A93B" },
  { id: "grenat", nameFr: "Grenat", nameEn: "Pomegranate", hex: "#7C3B3B" },
  { id: "indigo", nameFr: "Indigo", nameEn: "Indigo", hex: "#3D4C63" },
  { id: "olive", nameFr: "Olive", nameEn: "Olive", hex: "#6E6B3A" },
  { id: "encre", nameFr: "Encre", nameEn: "Ink", hex: "#2A211B" },
  { id: "rose", nameFr: "Rose de sel", nameEn: "Salt rose", hex: "#D9A7A0" },
];

export const MAX_WOOL_COLOURS = 4;

/** Rounded area of a bespoke rug, in square metres. */
export function customAreaM2(widthCm: number, lengthCm: number): number {
  return roundMoney((widthCm * lengthCm) / 10_000);
}

/** Indicative budget in MAD, rounded to the nearest 10 dirhams. */
export function customBudgetMad(
  widthCm: number,
  lengthCm: number,
  type: RugTypeValue,
): number {
  const area = (widthCm * lengthCm) / 10_000;
  const raw = area * CUSTOM_PRICE_PER_M2[type];
  return Math.round(raw / 10) * 10;
}

/** 30% deposit in MAD, rounded to the nearest dirham. */
export function customDepositMad(budgetMad: number): number {
  return Math.round((budgetMad * CUSTOM_DEPOSIT_PERCENT) / 100);
}

/** Rough weaving time, in weeks, communicated to the client. */
export function customLeadTimeWeeks(
  widthCm: number,
  lengthCm: number,
): { min: number; max: number } {
  const area = (widthCm * lengthCm) / 10_000;
  const base = Math.ceil(6 + area * 0.7);
  return { min: base, max: base + 3 };
}

/** Human-readable dimensions, e.g. "200 × 300 cm". */
export function customDimensionsLabel(widthCm: number, lengthCm: number): string {
  return `${widthCm} × ${lengthCm} cm`;
}
