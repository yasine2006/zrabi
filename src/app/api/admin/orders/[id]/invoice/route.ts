import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api/admin";
import { ApiError, handleApiError } from "@/lib/api/errors";
import { buildInvoicePdf } from "@/lib/admin/invoice";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/orders/[id]/invoice
 *
 * Streams a PDF built from the stored order snapshot. Available to every admin
 * role, including READONLY.
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    requireAdmin(request);

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { items: { orderBy: { createdAt: "asc" } } },
    });

    if (!order) {
      throw new ApiError(404, "Order not found.", "NOT_FOUND");
    }

    const pdf = await buildInvoicePdf(order);
    const filename = `facture-${order.orderNumber}.pdf`;

    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
