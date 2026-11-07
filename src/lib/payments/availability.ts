export type PublicPaymentMethod = "COD" | "STRIPE" | "CMI";

/**
 * A gateway is considered available only when its credentials are actually
 * present in the environment. Checkout uses this list to hide methods that
 * would otherwise fail at payment initialisation.
 */
function isStripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return false;
  // Ignore the placeholder values shipped in `.env.example`.
  if (key.includes("...")) return false;
  return /^sk_(test|live)_/.test(key);
}

function isCmiConfigured(): boolean {
  return Boolean(process.env.CMI_MERCHANT_ID && process.env.CMI_STORE_KEY);
}

export function getAvailablePaymentMethods(): PublicPaymentMethod[] {
  // Cash on delivery is handled internally and always works for Morocco.
  const methods: PublicPaymentMethod[] = ["COD"];

  if (isStripeConfigured()) methods.push("STRIPE");
  if (isCmiConfigured()) methods.push("CMI");

  return methods;
}

export function isPaymentMethodAvailable(method: string): boolean {
  return getAvailablePaymentMethods().includes(method as PublicPaymentMethod);
}
