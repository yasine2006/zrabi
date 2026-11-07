import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";
import type { Order, OrderItem } from "@prisma/client";
import { formatPrice, type CurrencyCode } from "../money";

/**
 * Server-side PDF invoices.
 *
 * The document is generated from the stored order snapshot, never from the
 * live catalogue: prices, discount, shipping and the currency are exactly what
 * the customer accepted at checkout.
 */

type OrderForInvoice = Order & { items: OrderItem[] };

const PAGE_WIDTH = 595.28; // A4 portrait, points
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;
const INK = rgb(0.165, 0.129, 0.106);
const MUTED = rgb(0.478, 0.416, 0.361);
const TERRACOTTA = rgb(0.549, 0.345, 0.227);
const LINE = rgb(0.894, 0.847, 0.784);
const SURFACE = rgb(0.953, 0.925, 0.882);

/**
 * Moroccan & Arabic to Latin transliteration.
 * Converts Arabic Unicode text into clean, phonetic Latin characters so that
 * standard WinAnsi PDF engines (Helvetica, Times, Courier) never render
 * question marks ("???") for Arabic customer names, cities, or addresses.
 */
function transliterateArabic(input: string): string {
  if (!input) return "";

  // Common Moroccan words & cities
  const commonWords: Record<string, string> = {
    "شارع": "Avenue",
    "زنقة": "Rue",
    "حي": "Quartier",
    "درب": "Derb",
    "طريق": "Route",
    "المغرب": "Maroc",
    "الدار البيضاء": "Casablanca",
    "الرباط": "Rabat",
    "مراكش": "Marrakech",
    "فاس": "Fes",
    "طنجة": "Tanger",
    "أكادير": "Agadir",
    "مكناس": "Meknes",
    "وجدة": "Oujda",
    "تطوان": "Tetouan",
    "القنيطرة": "Kenitra",
    "سلا": "Sale",
    "ورزازات": "Ouarzazate",
    "العيون": "Laayoune",
    "الداخلة": "Dakhla",
    "بني ملال": "Beni Mellal",
    "الصويرة": "Essaouira",
    "شفشاون": "Chefchaouen",
    "آيت بوكماز": "Ait Bouguemez",
    "تحناوت": "Tahannaout",
    "شيشاوة": "Chichaoua",
  };

  let text = input;
  for (const [ar, lat] of Object.entries(commonWords)) {
    text = text.replace(new RegExp(ar, "g"), lat);
  }

  // Character mapping
  const charMap: Record<string, string> = {
    "ا": "a", "أ": "A", "إ": "I", "آ": "Aa", "ء": "'", "ؤ": "Ou", "ئ": "I",
    "ب": "b", "ت": "t", "ث": "th", "ج": "j", "ح": "h", "خ": "kh",
    "د": "d", "ذ": "dh", "ر": "r", "ز": "z", "س": "s", "ش": "ch",
    "ص": "s", "ض": "d", "ط": "t", "ظ": "z", "ع": "a", "غ": "gh",
    "ف": "f", "ق": "q", "ك": "k", "ل": "l", "م": "m", "ن": "n",
    "ه": "h", "و": "ou", "ي": "y", "ى": "a", "ة": "a",
    "گ": "g", "پ": "p", "ڤ": "v",
    // Numerals
    "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
    "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
    "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4",
    "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
  };

  // Strip diacritics / tashkeel
  text = text.replace(/[\u064B-\u065F\u0670]/g, "");

  let result = "";
  for (const char of text) {
    result += char in charMap ? charMap[char] : char;
  }

  return result;
}

/** Replace glyphs that the WinAnsi standard fonts cannot encode without question marks. */
function safe(value: string | null | undefined): string {
  if (!value) return "";
  const transliterated = transliterateArabic(value);
  return transliterated
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u00D7/g, "x")
    .replace(/\u00A0/g, " ")
    .replace(/[^\x20-\x7E\xA0-\xFF\u20AC]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function amount(value: number, currency: CurrencyCode): string {
  return safe(formatPrice(value, currency, { showDecimals: true }));
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number) {
  const words = safe(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function drawLabel(
  page: PDFPage,
  font: PDFFont,
  text: string,
  x: number,
  y: number,
) {
  page.drawText(safe(text).toUpperCase(), {
    x,
    y,
    size: 7.5,
    font,
    color: MUTED,
  });
}

export async function buildInvoicePdf(
  order: OrderForInvoice,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const mono = await doc.embedFont(StandardFonts.Courier);

  const currency = order.currency as CurrencyCode;
  let y = PAGE_HEIGHT - MARGIN;

  // Header -----------------------------------------------------------------
  page.drawText("ZARBIA ATLAS", {
    x: MARGIN,
    y,
    size: 20,
    font: bold,
    color: INK,
  });
  page.drawText("Tapis marocains faits main", {
    x: MARGIN,
    y: y - 16,
    size: 9,
    font,
    color: MUTED,
  });
  page.drawText("FACTURE / INVOICE", {
    x: PAGE_WIDTH - MARGIN - bold.widthOfTextAtSize("FACTURE / INVOICE", 14),
    y,
    size: 14,
    font: bold,
    color: TERRACOTTA,
  });

  y -= 34;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_WIDTH - MARGIN, y },
    thickness: 1,
    color: LINE,
  });

  // Reference block --------------------------------------------------------
  y -= 26;
  drawLabel(page, bold, "Facture", MARGIN, y);
  page.drawText(safe(order.orderNumber), {
    x: MARGIN,
    y: y - 15,
    size: 11,
    font,
    color: INK,
  });

  const rightX = PAGE_WIDTH / 2 + 40;
  drawLabel(page, bold, "Date", rightX, y);
  page.drawText(
    new Intl.DateTimeFormat("fr-MA", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(order.createdAt),
    { x: rightX, y: y - 15, size: 11, font, color: INK },
  );

  y -= 34;
  drawLabel(page, bold, "Statut", rightX, y);
  page.drawText(safe(order.status.replace(/_/g, " ")), {
    x: rightX,
    y: y - 15,
    size: 11,
    font,
    color: INK,
  });

  // Customer ---------------------------------------------------------------
  y -= 38;
  drawLabel(page, bold, "Facture a", MARGIN, y);
  const customerLines = [
    order.fullName,
    order.addressLine1,
    order.addressLine2,
    `${order.postalCode ?? ""} ${order.city}`.trim(),
    order.country,
    order.email,
    order.phone,
  ].filter(Boolean) as string[];

  customerLines.forEach((line, index) => {
    page.drawText(safe(line), {
      x: MARGIN,
      y: y - 15 - index * 13,
      size: 9.5,
      font,
      color: index === 0 ? INK : MUTED,
    });
  });

  drawLabel(page, bold, "Paiement", rightX, y);
  page.drawText(safe(order.paymentMethod.replace(/_/g, " ")), {
    x: rightX,
    y: y - 15,
    size: 9.5,
    font,
    color: INK,
  });

  // Items table ------------------------------------------------------------
  y -= Math.max(customerLines.length * 13, 30) + 30;
  page.drawRectangle({
    x: MARGIN,
    y: y - 6,
    width: PAGE_WIDTH - MARGIN * 2,
    height: 22,
    color: SURFACE,
  });

  const columns = {
    description: MARGIN + 10,
    sku: 300,
    quantity: 410,
    unit: 465,
    total: PAGE_WIDTH - MARGIN - 10,
  };

  drawLabel(page, bold, "Piece", columns.description, y);
  drawLabel(page, bold, "SKU", columns.sku, y);
  drawLabel(page, bold, "Qte", columns.quantity, y);
  drawLabel(page, bold, "Prix unit.", columns.unit, y);
  drawLabel(page, bold, "Total", columns.total - 30, y);

  y -= 26;

  for (const item of order.items) {
    const descriptionLines = wrap(
      item.nameSnapshot,
      font,
      9.5,
      columns.sku - columns.description - 16,
    );

    descriptionLines.slice(0, 2).forEach((line, index) => {
      page.drawText(line, {
        x: columns.description,
        y: y - index * 12,
        size: 9.5,
        font,
        color: INK,
      });
    });

    page.drawText(safe(item.sku), {
      x: columns.sku,
      y,
      size: 9,
      font: mono,
      color: MUTED,
    });
    page.drawText(String(item.quantity), {
      x: columns.quantity,
      y,
      size: 9.5,
      font,
      color: INK,
    });
    page.drawText(amount(Number(item.unitPrice), currency), {
      x: columns.unit,
      y,
      size: 9,
      font,
      color: MUTED,
    });
    page.drawText(amount(Number(item.lineTotal), currency), {
      x:
        columns.total -
        font.widthOfTextAtSize(amount(Number(item.lineTotal), currency), 9),
      y,
      size: 9,
      font,
      color: INK,
    });

    y -= Math.max(descriptionLines.length * 12, 12) + 10;

    page.drawLine({
      start: { x: MARGIN, y: y + 4 },
      end: { x: PAGE_WIDTH - MARGIN, y: y + 4 },
      thickness: 0.5,
      color: LINE,
    });
  }

  // Totals ----------------------------------------------------------------
  y -= 16;
  const totalsX = PAGE_WIDTH - MARGIN - 190;
  const totalsValueX = PAGE_WIDTH - MARGIN;

  const totalRows: Array<[string, string, boolean]> = [
    ["Sous-total", amount(Number(order.subtotal), currency), false],
  ];

  if (Number(order.discount) > 0) {
    totalRows.push([
      `Remise${order.promoCode ? ` (${order.promoCode})` : ""}`,
      `-${amount(Number(order.discount), currency)}`,
      false,
    ]);
  }

  totalRows.push([
    "Livraison",
    amount(Number(order.shippingCost), currency),
    false,
  ]);
  totalRows.push([
    "Total",
    amount(Number(order.totalAmount), currency),
    true,
  ]);

  for (const [label, value, strong] of totalRows) {
    page.drawText(safe(label), {
      x: totalsX,
      y,
      size: strong ? 11 : 9.5,
      font: strong ? bold : font,
      color: strong ? INK : MUTED,
    });
    page.drawText(value, {
      x: totalsValueX - (strong ? bold : font).widthOfTextAtSize(
        value,
        strong ? 11 : 9.5,
      ),
      y,
      size: strong ? 11 : 9.5,
      font: strong ? bold : font,
      color: INK,
    });
    y -= strong ? 20 : 15;
  }

  // Tracking --------------------------------------------------------------
  if (order.trackingNumber || order.carrier) {
    y -= 10;
    page.drawRectangle({
      x: MARGIN,
      y: y - 44,
      width: PAGE_WIDTH - MARGIN * 2,
      height: 58,
      color: SURFACE,
      borderColor: LINE,
      borderWidth: 0.5,
    });
    drawLabel(page, bold, "Suivi de livraison", MARGIN + 12, y - 6);
    page.drawText(
      safe(
        [
          order.carrier ? `Transporteur : ${order.carrier}` : null,
          order.trackingNumber
            ? `Numero : ${order.trackingNumber}`
            : null,
        ]
          .filter(Boolean)
          .join("   ·   "),
      ),
      {
        x: MARGIN + 12,
        y: y - 25,
        size: 9.5,
        font,
        color: INK,
      },
    );
    y -= 56;
  }

  // Footer ----------------------------------------------------------------
  page.drawLine({
    start: { x: MARGIN, y: 70 },
    end: { x: PAGE_WIDTH - MARGIN, y: 70 },
    thickness: 0.5,
    color: LINE,
  });
  page.drawText(
    "Merci de votre confiance. Chaque piece est unique, tissee a la main dans l'Atlas.",
    { x: MARGIN, y: 54, size: 8.5, font, color: MUTED },
  );
  page.drawText(
    "Zarbia Atlas · Marrakech, Maroc · hello@zarbia-atlas.ma · zarbia-atlas.ma",
    { x: MARGIN, y: 40, size: 8, font, color: MUTED },
  );

  const pageNumber = `Page 1 / 1`;
  page.drawText(pageNumber, {
    x: PAGE_WIDTH - MARGIN - font.widthOfTextAtSize(pageNumber, 8),
    y: 40,
    size: 8,
    font,
    color: MUTED,
  });

  return doc.save();
}
