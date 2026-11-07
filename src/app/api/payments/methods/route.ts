import { NextResponse } from "next/server";
import { getAvailablePaymentMethods } from "@/lib/payments/availability";

export const dynamic = "force-dynamic";

/**
 * GET /api/payments/methods
 *
 * Public list of payment methods whose gateway credentials are configured.
 * The checkout renders only these options, so visitors never pick a method
 * that cannot be initialised.
 */
export async function GET() {
  return NextResponse.json({ methods: getAvailablePaymentMethods() });
}
