/**
 * Contract implemented by every payment provider.
 *
 * `createPayment` receives the persisted order (or a minimal `{ id }`) and
 * returns the URL the customer must be redirected to.
 *
 * `handleWebhook` verifies the provider signature (Stripe signature or CMI
 * HMAC-SHA512) and returns a normalized result. It must not mutate the order:
 * the `/api/payments/[provider]/webhook` route owns idempotency and updates the
 * order + reserved rugs in a single transaction.
 */
export interface PaymentProvider {
  createPayment(order: any): Promise<{ redirectUrl: string }>;
  handleWebhook(
    req: Request,
  ): Promise<{
    orderId: string;
    transactionId?: string;
    status: "paid" | "failed";
  }>;
}
