import { formatPrice } from "./money";

/**
 * WhatsApp helpers — "Reserve on WhatsApp" and customer support links.
 *
 * The support number is read from NEXT_PUBLIC_WHATSAPP_NUMBER (international
 * format without the leading "+", e.g. 212600000000).
 */

const DEFAULT_APP_URL = "http://localhost:3000";
const DEFAULT_WHATSAPP_NUMBER = "212600000000";

export type WhatsAppLocale = "fr" | "en" | "ar";
export type WhatsAppIntent = "reserve" | "support";

export interface WhatsAppRug {
  slug: string;
  sku: string;
  nameFr: string;
  nameEn: string;
  widthCm: number;
  lengthCm: number;
  priceMad: number | string | { toString(): string };
}

export interface WhatsAppLinkOptions {
  intent?: WhatsAppIntent;
  locale?: WhatsAppLocale;
  /** Overrides NEXT_PUBLIC_WHATSAPP_NUMBER. */
  phone?: string;
  /** Overrides the generated product URL. */
  productUrl?: string;
  /** Overrides NEXT_PUBLIC_APP_URL. */
  appUrl?: string;
}

export interface SupportWhatsAppOptions {
  locale?: WhatsAppLocale;
  phone?: string;
  /** Custom message; takes precedence over the generated one. */
  message?: string;
  /** Optional rug context for a pre-filled support message. */
  rug?: WhatsAppRug;
  productUrl?: string;
}

function normalizePhone(phone?: string): string {
  const raw =
    phone ??
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ??
    DEFAULT_WHATSAPP_NUMBER;
  const digits = raw.replace(/\D/g, "");

  if (!digits) {
    throw new Error("A WhatsApp phone number is required.");
  }

  return digits;
}

function resolveAppUrl(appUrl?: string): string {
  const base =
    appUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? DEFAULT_APP_URL;
  return base.replace(/\/+$/, "");
}

export function getProductUrl(
  rug: WhatsAppRug,
  options: Pick<WhatsAppLinkOptions, "locale" | "productUrl" | "appUrl"> = {},
): string {
  if (options.productUrl) return options.productUrl;

  return `${resolveAppUrl(options.appUrl)}/rugs/${rug.slug}`;
}

/**
 * Pre-filled WhatsApp message including rug name, SKU, dimensions, price and
 * product URL.
 */
export function buildRugWhatsAppMessage(
  rug: WhatsAppRug,
  options: WhatsAppLinkOptions = {},
): string {
  const locale = options.locale ?? "fr";
  const intent = options.intent ?? "reserve";
  const name = locale === "en" ? rug.nameEn : rug.nameFr;
  const price = formatPrice(Number(rug.priceMad), "MAD");
  const dimensions = `${rug.widthCm} × ${rug.lengthCm} cm`;
  const url = getProductUrl(rug, options);

  if (locale === "en") {
    const opening =
      intent === "reserve"
        ? "Hello Zarbia Atlas, I would like to reserve this rug:"
        : "Hello Zarbia Atlas, I have a question about this rug:";

    return [
      opening,
      `• ${name} — SKU ${rug.sku}`,
      `• Dimensions: ${dimensions}`,
      `• Price: ${price}`,
      `• Link: ${url}`,
      "",
      "Thank you!",
    ].join("\n");
  }

  const opening =
    intent === "reserve"
      ? "Bonjour Zarbia Atlas, je souhaite réserver ce tapis :"
      : "Bonjour Zarbia Atlas, j’ai une question à propos de ce tapis :";

  return [
    opening,
    `• ${name} — SKU ${rug.sku}`,
    `• Dimensions : ${dimensions}`,
    `• Prix : ${price}`,
    `• Lien : ${url}`,
    "",
    "Merci !",
  ].join("\n");
}

/** Build a wa.me link from an arbitrary message. */
export function buildWhatsAppLink(message: string, phone?: string): string {
  const number = normalizePhone(phone);
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/** "Reserve on WhatsApp" link for a specific rug. */
export function getRugWhatsAppLink(
  rug: WhatsAppRug,
  options: WhatsAppLinkOptions = {},
): string {
  const message = buildRugWhatsAppMessage(rug, {
    ...options,
    intent: "reserve",
  });
  return buildWhatsAppLink(message, options.phone);
}

/** Customer-support link, optionally pre-filled with rug context. */
export function getSupportWhatsAppLink(
  options: SupportWhatsAppOptions = {},
): string {
  const locale = options.locale ?? "fr";

  let message = options.message;

  if (!message && options.rug) {
    message = buildRugWhatsAppMessage(options.rug, {
      locale,
      intent: "support",
      productUrl: options.productUrl,
    });
  }

  if (!message) {
    message =
      locale === "en"
        ? "Hello Zarbia Atlas, I need help with my order."
        : "Bonjour Zarbia Atlas, j’ai besoin d’aide pour ma commande.";
  }

  return buildWhatsAppLink(message, options.phone);
}
