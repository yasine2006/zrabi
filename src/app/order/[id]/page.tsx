import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderAccessGate } from "@/components/pages/OrderAccessGate";
import { OrderView } from "@/components/pages/OrderView";
import { getOrderById } from "@/lib/orders";
import { verifyOrderAccessToken } from "@/lib/orders/access";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Confirmation de commande",
  description:
    "Suivi en lecture seule de votre commande Zarbia Atlas : statut, livraison et instructions de paiement.",
  robots: { index: false, follow: false },
};

interface OrderPageProps {
  params: { id: string };
  searchParams: { payment?: string | string[]; token?: string | string[] };
}

function first(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export default async function OrderPage({ params, searchParams }: OrderPageProps) {
  const order = await getOrderById(params.id);

  if (!order) notFound();

  // Personal data (name, phone, address, e-mail) is only rendered when the
  // visitor holds the signed link issued at checkout or by /api/orders/lookup.
  if (!verifyOrderAccessToken(order, first(searchParams.token))) {
    return <OrderAccessGate orderId={order.id} />;
  }

  return (
    <OrderView order={order} paymentFlag={first(searchParams.payment)} />
  );
}
