import { PaymentMethod } from "@prisma/client";
import type { PaymentProvider } from "./types";
import { codProvider } from "./cod";
import { stripeProvider } from "./stripe";
import { cmiProvider } from "./cmi";

/**
 * PayPal is part of the PaymentMethod enum but its provider has not been
 * implemented yet. Return a provider that fails clearly instead of undefined,
 * so checkout code always receives the same contract.
 */
function unavailableProvider(method: PaymentMethod): PaymentProvider {
  return {
    async createPayment(_order: any) {
      throw new Error(
        `Le paiement par ${method} est en cours d'activation finale. Pour finaliser votre commande dès maintenant, veuillez choisir Carte Bancaire (Stripe/CMI) ou Paiement à la livraison.`,
      );
    },
    async handleWebhook(_req: Request) {
      throw new Error(`${method} webhooks are not supported yet.`);
    },
  };
}

/**
 * Resolve the payment provider for a method stored on an order.
 *
 * @throws {Error} when the method is unknown or not implemented.
 */
export function getPaymentProvider(method: PaymentMethod): PaymentProvider {
  switch (method) {
    case PaymentMethod.COD:
      return codProvider;
    case PaymentMethod.STRIPE:
      return stripeProvider;
    case PaymentMethod.CMI:
      return cmiProvider;
    case PaymentMethod.PAYPAL:
      return unavailableProvider(PaymentMethod.PAYPAL);
    default: {
      const exhaustive: never = method;
      throw new Error(`Unsupported payment method: ${exhaustive}`);
    }
  }
}

export { codProvider, stripeProvider, cmiProvider };
