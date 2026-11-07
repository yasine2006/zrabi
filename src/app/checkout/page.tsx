import type { Metadata } from "next";
import { CheckoutView } from "@/components/pages/CheckoutView";

export const metadata: Metadata = {
  title: "Commande — livraison et paiement",
  description:
    "Finalisez votre commande Zarbia Atlas : livraison suivie dans 60+ pays, paiement à la livraison au Maroc, CMI ou Stripe à l’international.",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return <CheckoutView />;
}
