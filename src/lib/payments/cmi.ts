import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { Currency, PaymentMethod } from "@prisma/client";
import { prisma } from "../db";
import { appendOrderToken } from "../orders/access";
import type { PaymentProvider } from "./types";

/**
 * CMI — Centre Monétique Interbancaire (Morocco).
 *
 * The gateway expects a form POST whose `hash` field is an HMAC-SHA512,
 * base64-encoded, computed over the clientid + oid + amount + currency + rnd
 * values. CMI's 3-D Secure contract may add fields over time; if your merchant
 * contract does, extend CMI_HASH_FIELDS accordingly.
 *
 * `createPayment` returns the gateway URL with signed parameters appended.
 * Production checkout pages should POST these fields from a hidden form
 * (CMI does not officially document GET submissions), but the URL remains
 * useful for redirects and testing.
 */

export const CMI_GATEWAY_URL =
  process.env.CMI_GATEWAY_URL ??
  "https://testpayment.cmi.co.ma/fim/est3Dgate";

/** ISO 4217 numeric code for Moroccan dirham. */
export const CMI_MAD_CURRENCY_CODE = "504";

/** Values concatenated (in this order, no separators) before signing. */
export const CMI_HASH_FIELDS = [
  "clientid",
  "oid",
  "amount",
  "currency",
  "rnd",
] as const;

export type CmiHashInput = Record<
  string,
  string | number | null | undefined
>;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function appBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
    /\/+$/,
    "",
  );
}

/** Lowercase all keys so CMI's uppercase callback fields can be verified too. */
export function normalizeCmiParams(
  input: CmiHashInput,
): Record<string, string> {
  const normalized: Record<string, string> = {};

  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null) continue;
    normalized[key.toLowerCase()] = String(value);
  }

  return normalized;
}

/** HMAC-SHA512 of the CMI hash fields, base64-encoded. */
export function computeCmiHash(
  input: CmiHashInput,
  storeKey: string,
): string {
  if (!storeKey) {
    throw new Error("A CMI store key is required to compute the hash.");
  }

  const params = normalizeCmiParams(input);
  const payload = CMI_HASH_FIELDS.map((field) => params[field] ?? "").join("");

  return createHmac("sha512", storeKey)
    .update(payload, "utf8")
    .digest("base64");
}

/** Constant-time verification of the `hash`/`HASH` field. */
export function verifyCmiHash(
  input: CmiHashInput,
  storeKey: string,
): boolean {
  const params = normalizeCmiParams(input);
  const received = params.hash;

  if (!received) return false;

  const expected = computeCmiHash(params, storeKey);

  const receivedBuffer = Buffer.from(received, "base64");
  const expectedBuffer = Buffer.from(expected, "base64");

  return (
    receivedBuffer.length === expectedBuffer.length &&
    receivedBuffer.length > 0 &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

/** Parse CMI's POST form, JSON payload or GET query-string callback. */
async function extractRequestParams(
  req: Request,
): Promise<Record<string, string>> {
  const params: Record<string, string> = {};

  // Query parameters are always merged in (okurl/failurl redirects).
  const url = new URL(req.url);
  url.searchParams.forEach((value, key) => {
    params[key.toLowerCase()] = value;
  });

  if (req.method === "GET" || req.method === "HEAD") {
    return params;
  }

  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await req.json()) as Record<string, unknown>;
    for (const [key, value] of Object.entries(body)) {
      if (value === undefined || value === null) continue;
      params[key.toLowerCase()] = String(value);
    }
    return params;
  }

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    form.forEach((value, key) => {
      if (typeof value === "string") {
        params[key.toLowerCase()] = value;
      }
    });
    return params;
  }

  const text = await req.text();
  if (text) {
    new URLSearchParams(text).forEach((value, key) => {
      params[key.toLowerCase()] = value;
    });
  }

  return params;
}

function buildCmiRedirectUrl(fields: Record<string, string>): string {
  const url = new URL(CMI_GATEWAY_URL);
  for (const [key, value] of Object.entries(fields)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

export class CmiPaymentProvider implements PaymentProvider {
  async createPayment(order: any): Promise<{ redirectUrl: string }> {
    const orderId = order?.id;
    if (!orderId || typeof orderId !== "string") {
      throw new Error("CMI payment requires a persisted order with an id.");
    }

    const dbOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        email: true,
        totalAmount: true,
        currency: true,
        exchangeRate: true,
        createdAt: true,
      },
    });

    if (!dbOrder) {
      throw new Error(`Order ${orderId} was not found.`);
    }

    // CMI always charges in MAD. `exchangeRate` converts a foreign-currency
    // order total back into MAD.
    const total = Number(dbOrder.totalAmount);
    const totalMad =
      dbOrder.currency === Currency.MAD
        ? total
        : total * Number(dbOrder.exchangeRate);
    const amountCentimes = Math.round(totalMad * 100);

    if (!Number.isFinite(amountCentimes) || amountCentimes <= 0) {
      throw new Error(
        `Order ${dbOrder.orderNumber} has an invalid chargeable amount.`,
      );
    }

    const clientId = requireEnv("CMI_MERCHANT_ID");
    const storeKey = requireEnv("CMI_STORE_KEY");
    const baseUrl = appBaseUrl();
    const oid = dbOrder.orderNumber;
    const rnd = randomBytes(8).toString("hex");

    const fields: Record<string, string> = {
      clientid: clientId,
      oid,
      amount: String(amountCentimes),
      currency: CMI_MAD_CURRENCY_CODE,
      rnd,
      storetype: "3D_PAY_HOSTING",
      trantype: "PreAuth",
      hashAlgorithm: "ver3",
      encoding: "UTF-8",
      lang: "fr",
      email: dbOrder.email,
      shopurl: `${baseUrl}/checkout`,
      okurl: appendOrderToken(
        `${baseUrl}/order/${dbOrder.id}?payment=success`,
        dbOrder,
      ),
      failurl: appendOrderToken(
        `${baseUrl}/order/${dbOrder.id}?payment=failed`,
        dbOrder,
      ),
      callbackUrl: `${baseUrl}/api/payments/cmi/webhook`,
    };

    fields.hash = computeCmiHash(fields, storeKey);

    await prisma.order.update({
      where: { id: dbOrder.id },
      data: {
        paymentMethod: PaymentMethod.CMI,
        paymentReference: oid,
      },
    });

    return { redirectUrl: buildCmiRedirectUrl(fields) };
  }

  async handleWebhook(req: Request): Promise<{
    orderId: string;
    transactionId?: string;
    status: "paid" | "failed";
  }> {
    const storeKey = requireEnv("CMI_STORE_KEY");
    const params = await extractRequestParams(req);

    if (!verifyCmiHash(params, storeKey)) {
      throw new Error("Invalid CMI hash signature.");
    }

    const oid = params.oid;
    if (!oid) {
      throw new Error("CMI callback is missing the order id (oid).");
    }

    const procReturnCode = params.procreturncode ?? "";
    const response = params.response ?? "";
    const mdStatus = params.mdstatus ?? "";

    // mdStatus 1–4 means 3-D Secure authentication succeeded.
    const mdApproved =
      !mdStatus || ["1", "2", "3", "4"].includes(mdStatus);
    const approved =
      mdApproved &&
      (procReturnCode === "00" || /^approved$/i.test(response.trim()));

    const transactionId =
      params.transid || params.paymentid || undefined;

    // The webhook route owns order and stock mutations so that it can apply
    // idempotency and update the reserved rugs atomically.
    return {
      orderId: oid,
      transactionId,
      status: approved ? "paid" : "failed",
    };
  }
}

export const cmiProvider = new CmiPaymentProvider();
