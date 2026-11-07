import nodemailer from "nodemailer";
import { formatPrice, type CurrencyCode } from "./money";
import { buildWhatsAppLink } from "./whatsapp";
import type {
  NotificationChannelResult,
  TrackingNotificationResult,
} from "./admin/types";

/**
 * Order-tracking notifications.
 *
 * Email uses SMTP when the four SMTP variables are present. WhatsApp uses the
 * Meta Cloud API when a token and phone-number id are configured. When either
 * channel is missing the function degrades gracefully: the email is marked
 * "skipped" and a pre-filled wa.me link is returned so an operator can send the
 * message by hand.
 *
 * Nothing in this module may throw: a failed notification must never prevent an
 * order update from being stored.
 */

export interface TrackingOrder {
  orderNumber: string;
  fullName: string;
  email: string;
  phone: string;
  trackingNumber: string;
  carrier: string | null;
  currency: CurrencyCode;
  totalAmount: number;
  items: Array<{ nameSnapshot: string; sku: string; quantity: number }>;
}

function normalizeDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  // Moroccan local numbers (06 12 34 56 78) lack the country code.
  if (digits.length === 10 && digits.startsWith("0")) {
    return `212${digits.slice(1)}`;
  }

  return digits;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildTrackingMessage(order: TrackingOrder): string {
  const amount = formatPrice(order.totalAmount, order.currency);
  const carrier = order.carrier?.trim();

  return [
    `Bonjour ${order.fullName},`,
    `Votre commande ${order.orderNumber} a été expédiée.`,
    carrier ? `Transporteur : ${carrier}` : null,
    `Numéro de suivi : ${order.trackingNumber}`,
    `Montant : ${amount}`,
    "",
    `Hello ${order.fullName}, your order ${order.orderNumber} is on its way.`,
    carrier ? `Carrier: ${carrier}` : null,
    `Tracking number: ${order.trackingNumber}`,
    `Total: ${amount}`,
    "",
    "Merci de votre confiance — Zarbia Atlas",
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

function buildTrackingEmail(order: TrackingOrder): {
  subject: string;
  text: string;
  html: string;
} {
  const message = buildTrackingMessage(order);
  const amount = formatPrice(order.totalAmount, order.currency);
  const carrier = order.carrier?.trim();

  const rows = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee4d6;color:#2a211b">
            ${escapeHtml(item.nameSnapshot)}
          </td>
          <td style="padding:8px 0;border-bottom:1px solid #eee4d6;color:#7a6a5c;font-family:monospace">
            ${escapeHtml(item.sku)}
          </td>
          <td style="padding:8px 0;border-bottom:1px solid #eee4d6;color:#2a211b;text-align:right">
            × ${item.quantity}
          </td>
        </tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html lang="fr">
  <body style="margin:0;padding:24px;background:#faf6f0;font-family:Arial,Helvetica,sans-serif">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e4d8c8;border-radius:16px;overflow:hidden">
      <div style="padding:28px 28px 20px;border-bottom:1px solid #eee4d6">
        <p style="margin:0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#8c583a">Zarbia Atlas</p>
        <h1 style="margin:10px 0 0;font-size:24px;color:#2a211b">Votre commande est en route</h1>
        <p style="margin:8px 0 0;font-size:14px;color:#7a6a5c">
          Commande <strong style="color:#2a211b">${escapeHtml(order.orderNumber)}</strong>
        </p>
      </div>
      <div style="padding:24px 28px">
        <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#2a211b">
          Bonjour ${escapeHtml(order.fullName)}, votre pièce a quitté notre atelier.
        </p>
        <table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px">
          <tr>
            <td style="padding:8px 0;color:#7a6a5c">Transporteur</td>
            <td style="padding:8px 0;text-align:right;color:#2a211b">${escapeHtml(carrier || "—")}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#7a6a5c">Numéro de suivi</td>
            <td style="padding:8px 0;text-align:right;font-family:monospace;color:#2a211b">${escapeHtml(order.trackingNumber)}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#7a6a5c">Montant</td>
            <td style="padding:8px 0;text-align:right;color:#2a211b">${escapeHtml(amount)}</td>
          </tr>
        </table>
        <table role="presentation" style="width:100%;border-collapse:collapse;margin-top:18px;font-size:13px">
          ${rows}
        </table>
      </div>
      <div style="padding:18px 28px;background:#f3ece1;color:#7a6a5c;font-size:12px">
        Merci de votre confiance — Zarbia Atlas · Tapis marocains faits main
      </div>
    </div>
    <pre style="display:none">${escapeHtml(message)}</pre>
  </body>
</html>`;

  return {
    subject: `Votre commande ${order.orderNumber} est en route — Zarbia Atlas`,
    text: message,
    html,
  };
}

async function sendEmail(
  order: TrackingOrder,
): Promise<NotificationChannelResult> {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 0);

  if (!host || !Number.isFinite(port) || port <= 0) {
    return {
      status: "skipped",
      detail: "SMTP_HOST / SMTP_PORT are not configured.",
    };
  }

  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;

  try {
    const transport = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user && password ? { user, pass: password } : undefined,
    });

    const email = buildTrackingEmail(order);

    await transport.sendMail({
      from:
        process.env.SMTP_FROM ??
        "Zarbia Atlas <hello@zarbia-atlas.ma>",
      to: order.email,
      subject: email.subject,
      text: email.text,
      html: email.html,
    });

    return { status: "sent" };
  } catch (error) {
    console.error("[notifications] SMTP send failed:", error);
    return {
      status: "failed",
      detail: error instanceof Error ? error.message : "Unknown SMTP error.",
    };
  }
}

async function sendWhatsApp(
  order: TrackingOrder,
  message: string,
): Promise<NotificationChannelResult> {
  const token = process.env.WHATSAPP_CLOUD_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    return {
      status: "skipped",
      detail: "WhatsApp Cloud API is not configured.",
    };
  }

  const to = normalizeDigits(order.phone);

  if (!to) {
    return { status: "failed", detail: "The customer phone number is empty." };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v20.0/${encodeURIComponent(
        phoneNumberId,
      )}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { preview_url: false, body: message },
        }),
      },
    );

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      return {
        status: "failed",
        detail: `Meta API returned ${response.status}: ${detail.slice(0, 300)}`,
      };
    }

    return { status: "sent" };
  } catch (error) {
    console.error("[notifications] WhatsApp send failed:", error);
    return {
      status: "failed",
      detail:
        error instanceof Error ? error.message : "Unknown WhatsApp error.",
    };
  }
}

/** Notify a customer that their order now carries a tracking number. */
export async function sendTrackingNotifications(
  order: TrackingOrder,
): Promise<TrackingNotificationResult> {
  const message = buildTrackingMessage(order);

  const [email, whatsapp] = await Promise.all([
    sendEmail(order),
    sendWhatsApp(order, message),
  ]);

  let whatsappLink: string | null = null;

  try {
    whatsappLink = buildWhatsAppLink(message, order.phone);
  } catch {
    whatsappLink = null;
  }

  return { email, whatsapp, whatsappLink };
}
