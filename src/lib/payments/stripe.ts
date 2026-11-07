import Stripe from "stripe";
import { Currency, PaymentMethod } from "@prisma/client";
import { prisma } from "../db";
import { convertFromMad, getCurrencyRates } from "../currency";
import { appendOrderToken } from "../orders/access";
import type { PaymentProvider } from "./types";

/**
 * Stripe Checkout.
 *
 * Stripe does not settle in MAD, so Moroccan orders priced in MAD are charged
 * in EUR using the live CurrencyRate table. Orders already priced in EUR/USD
 * are charged in their own currency.
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

let stripeClient: Stripe | undefined;

/** Lazily instantiate the SDK so builds do not require live secrets. */
export function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || secretKey === "sk_test_..." || secretKey.startsWith("sk_test_...")) {
    throw new Error(
      "Stripe payment gateway is not configured with live credentials. Please select Cash on Delivery (COD) for testing or provide STRIPE_SECRET_KEY in .env.",
    );
  }
  if (!stripeClient) {
    stripeClient = new Stripe(secretKey);
  }
  return stripeClient;
}

function objectId(
  value: string | { id: string } | null | undefined,
): string | undefined {
  if (!value) return undefined;
  return typeof value === "string" ? value : value.id;
}

function appBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
    /\/+$/,
    "",
  );
}

export class StripePaymentProvider implements PaymentProvider {
  async createPayment(order: any): Promise<{ redirectUrl: string }> {
    const orderId = order?.id;
    if (!orderId || typeof orderId !== "string") {
      throw new Error("Stripe checkout requires a persisted order with an id.");
    }

    const dbOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!dbOrder) {
      throw new Error(`Order ${orderId} was not found.`);
    }

    const isMad = dbOrder.currency === Currency.MAD;
    const chargeCurrency = isMad ? "eur" : dbOrder.currency.toLowerCase();
    const rates = isMad ? await getCurrencyRates() : undefined;

    const toMinorUnits = (amount: number): number => {
      if (!isMad) return Math.round(amount * 100);
      return Math.round(convertFromMad(amount, "EUR", rates) * 100);
    };

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      dbOrder.items.length > 0
        ? dbOrder.items.map((item) => ({
            quantity: item.quantity,
            price_data: {
              currency: chargeCurrency,
              unit_amount: toMinorUnits(Number(item.unitPrice)),
              product_data: {
                name: item.nameSnapshot,
                metadata: { sku: item.sku },
              },
            },
          }))
        : [
            {
              quantity: 1,
              price_data: {
                currency: chargeCurrency,
                unit_amount: toMinorUnits(Number(dbOrder.totalAmount)),
                product_data: {
                  name: `Commande ${dbOrder.orderNumber}`,
                },
              },
            },
          ];

    if (Number(dbOrder.shippingCost) > 0) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: chargeCurrency,
          unit_amount: toMinorUnits(Number(dbOrder.shippingCost)),
          product_data: { name: "Livraison — Zarbia Atlas" },
        },
      });
    }

    const baseUrl = appBaseUrl();
    const metadata = {
      orderId: dbOrder.id,
      orderNumber: dbOrder.orderNumber,
    };

    const session = await getStripeClient().checkout.sessions.create({
      mode: "payment",
      customer_email: dbOrder.email,
      client_reference_id: dbOrder.orderNumber,
      line_items: lineItems,
      metadata,
      payment_intent_data: { metadata },
      allow_promotion_codes: true,
      success_url: `${appendOrderToken(
        `${baseUrl}/order/${dbOrder.id}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        dbOrder,
      )}`,
      cancel_url: appendOrderToken(
        `${baseUrl}/order/${dbOrder.id}?payment=cancelled`,
        dbOrder,
      ),
    });

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL.");
    }

    await prisma.order.update({
      where: { id: dbOrder.id },
      data: {
        paymentMethod: PaymentMethod.STRIPE,
        paymentReference: session.id,
      },
    });

    return { redirectUrl: session.url };
  }

  async handleWebhook(req: Request): Promise<{
    orderId: string;
    transactionId?: string;
    status: "paid" | "failed";
  }> {
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("Missing Stripe-Signature header.");
    }

    const payload = await req.text();
    const webhookSecret = requireEnv("STRIPE_WEBHOOK_SECRET");

    let event: Stripe.Event;
    try {
      event = getStripeClient().webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );
    } catch (error) {
      throw new Error(
        `Invalid Stripe webhook signature: ${
          error instanceof Error ? error.message : "unknown error"
        }`,
      );
    }

    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId =
          session.metadata?.orderId ?? session.client_reference_id ?? "";
        const transactionId =
          objectId(session.payment_intent) ?? session.id;
        const paid = session.payment_status === "paid";

        // `checkout.session.completed` can arrive before an asynchronous
        // method (e.g. bank transfer) settles. Return an empty orderId so the
        // webhook route acknowledges the event without releasing the rug.
        if (!paid) {
          return { orderId: "", status: "failed" };
        }

        return { orderId, transactionId, status: "paid" };
      }

      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId =
          session.metadata?.orderId ?? session.client_reference_id ?? "";

        return {
          orderId,
          transactionId: objectId(session.payment_intent) ?? session.id,
          status: "failed",
        };
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId =
          session.metadata?.orderId ?? session.client_reference_id ?? "";

        return { orderId, transactionId: session.id, status: "failed" };
      }

      case "payment_intent.payment_failed": {
        const intent = event.data.object as Stripe.PaymentIntent;
        const orderId = intent.metadata?.orderId ?? "";

        return { orderId, transactionId: intent.id, status: "failed" };
      }

      default:
        // Acknowledge unrelated events without touching any order.
        return { orderId: "", status: "failed" };
    }
  }
}

export const stripeProvider = new StripePaymentProvider();
