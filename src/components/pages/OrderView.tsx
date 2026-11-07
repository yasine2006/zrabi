"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Check,
  CheckCircle2,
  CircleDashed,
  Clock3,
  Copy,
  CreditCard,
  MapPin,
  Package,
  Printer,
  ReceiptText,
  ShieldCheck,
  Truck,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/context/StoreContext";
import { formatPrice, type CurrencyCode } from "@/lib/money";
import type { StorefrontOrder } from "@/lib/orders";
import { countryName, type Locale } from "@/lib/i18n";
import { getSupportWhatsAppLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

interface OrderViewProps {
  order: StorefrontOrder;
  /** `?payment=success` is a hint from the gateway, never proof of payment. */
  paymentFlag: string | null;
}

interface TimelineStep {
  key: string;
  labelFr: string;
  labelEn: string;
  hintFr: string;
  hintEn: string;
}

const COD_TIMELINE: TimelineStep[] = [
  {
    key: "placed",
    labelFr: "Commande reçue",
    labelEn: "Order received",
    hintFr: "Votre pièce est bloquée à votre nom.",
    hintEn: "Your piece is held in your name.",
  },
  {
    key: "confirmed",
    labelFr: "Confirmée par téléphone",
    labelEn: "Confirmed by phone",
    hintFr: "Nous vous appelons sous 24 h ouvrées.",
    hintEn: "We call you within one business day.",
  },
  {
    key: "preparing",
    labelFr: "Préparation à l’atelier",
    labelEn: "Prepared at the atelier",
    hintFr: "Contrôle, brossage et emballage roulé.",
    hintEn: "Inspection, brushing and rolled packing.",
  },
  {
    key: "shipped",
    labelFr: "Expédiée",
    labelEn: "Shipped",
    hintFr: "Numéro de suivi envoyé par e-mail.",
    hintEn: "Tracking number sent by email.",
  },
  {
    key: "delivered",
    labelFr: "Livrée",
    labelEn: "Delivered",
    hintFr: "Le transporteur vous contacte avant passage.",
    hintEn: "The carrier contacts you before delivery.",
  },
  {
    key: "collected",
    labelFr: "Paiement encaissé",
    labelEn: "Cash collected",
    hintFr: "Règlement en espèces à la remise.",
    hintEn: "Cash paid on handover.",
  },
];

const CARD_TIMELINE: TimelineStep[] = [
  {
    key: "placed",
    labelFr: "Commande enregistrée",
    labelEn: "Order recorded",
    hintFr: "En attente de la confirmation du paiement.",
    hintEn: "Awaiting payment confirmation.",
  },
  {
    key: "paid",
    labelFr: "Paiement confirmé",
    labelEn: "Payment confirmed",
    hintFr: "Validé par le prestataire, jamais par cette page.",
    hintEn: "Validated by the provider, never by this page.",
  },
  {
    key: "preparing",
    labelFr: "Préparation à l’atelier",
    labelEn: "Prepared at the atelier",
    hintFr: "Contrôle, brossage et emballage roulé.",
    hintEn: "Inspection, brushing and rolled packing.",
  },
  {
    key: "shipped",
    labelFr: "Expédiée",
    labelEn: "Shipped",
    hintFr: "Numéro de suivi envoyé par e-mail.",
    hintEn: "Tracking number sent by email.",
  },
  {
    key: "delivered",
    labelFr: "Livrée",
    labelEn: "Delivered",
    hintFr: "Signature requise à la remise.",
    hintEn: "Signature required on delivery.",
  },
];

const COD_STATUS_INDEX: Record<string, number> = {
  PENDING_COD: 0,
  CONFIRMED_COD: 1,
  PREPARING: 2,
  SHIPPED: 3,
  DELIVERED: 4,
  CASH_COLLECTED: 5,
};

const CARD_STATUS_INDEX: Record<string, number> = {
  PENDING: 0,
  PAID: 1,
  PREPARING: 2,
  SHIPPED: 3,
  DELIVERED: 4,
  CASH_COLLECTED: 4,
};

const TERMINAL_STATUSES = new Set(["FAILED", "CANCELLED", "REFUNDED"]);

function formatDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-MA" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function statusMeta(status: string, locale: Locale) {
  const map: Record<
    string,
    { fr: string; en: string; tone: "neutral" | "gold" | "green" | "red" }
  > = {
    PENDING: { fr: "En attente de paiement", en: "Awaiting payment", tone: "gold" },
    PENDING_COD: { fr: "En attente de confirmation", en: "Awaiting confirmation", tone: "gold" },
    CONFIRMED_COD: { fr: "Confirmée", en: "Confirmed", tone: "green" },
    PAID: { fr: "Payée", en: "Paid", tone: "green" },
    PREPARING: { fr: "En préparation", en: "Preparing", tone: "gold" },
    SHIPPED: { fr: "Expédiée", en: "Shipped", tone: "gold" },
    DELIVERED: { fr: "Livrée", en: "Delivered", tone: "green" },
    CASH_COLLECTED: { fr: "Réglée", en: "Settled", tone: "green" },
    FAILED: { fr: "Paiement échoué", en: "Payment failed", tone: "red" },
    CANCELLED: { fr: "Annulée", en: "Cancelled", tone: "red" },
    REFUNDED: { fr: "Remboursée", en: "Refunded", tone: "neutral" },
  };

  const found = map[status] ?? {
    fr: status,
    en: status,
    tone: "neutral" as const,
  };

  return { label: locale === "fr" ? found.fr : found.en, tone: found.tone };
}

export function OrderView({ order, paymentFlag }: OrderViewProps) {
  const { locale, t } = useStore();
  const reduceMotion = useReducedMotion();
  const [copied, setCopied] = useState(false);

  const currency = order.currency as CurrencyCode;
  const money = (amount: number) => formatPrice(amount, currency);

  const isCod = order.paymentMethod === "COD";
  const terminal = TERMINAL_STATUSES.has(order.status);
  const timeline = isCod ? COD_TIMELINE : CARD_TIMELINE;
  const currentIndex = terminal
    ? -1
    : (isCod ? COD_STATUS_INDEX : CARD_STATUS_INDEX)[order.status] ?? 0;

  const meta = statusMeta(order.status, locale);

  const isPaymentPending =
    order.status === "PENDING" || order.status === "PENDING_COD";

  const whatsapp = getSupportWhatsAppLink({
    locale,
    message:
      locale === "ar"
        ? `مرحباً زربية أطلس، لدي سؤال حول الطلب ${order.orderNumber}.`
        : locale === "en"
          ? `Hello Zarbia Atlas, I have a question about order ${order.orderNumber}.`
          : `Bonjour Zarbia Atlas, j’ai une question sur la commande ${order.orderNumber}.`,
  });

  const fullAddress = useMemo(
    () =>
      [
        order.addressLine1,
        order.addressLine2,
        `${order.postalCode ? `${order.postalCode} ` : ""}${order.city}`,
        countryName(order.country, locale),
      ]
        .filter(Boolean)
        .join(", "),
    [locale, order],
  );

  async function copyNumber() {
    try {
      await navigator.clipboard.writeText(order.orderNumber);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* Clipboard access can be denied; the number stays visible. */
    }
  }

  return (
    <div className="min-h-screen">
      <div className="border-b border-line/70 bg-surface/35">
        <div className="container-page py-8 sm:py-10">
          <nav
            aria-label={t("Fil d’Ariane", "Breadcrumb")}
            className="flex flex-wrap items-center gap-2 text-[0.64rem] uppercase tracking-[0.16em] text-muted"
          >
            <Link href="/" className="transition hover:text-terracotta">
              {t("Accueil", "Home")}
            </Link>
            <span>/</span>
            <Link href="/shop" className="transition hover:text-terracotta">
              {t("Boutique", "Shop")}
            </Link>
            <span>/</span>
            <span className="text-ink/65">
              {t("Confirmation", "Confirmation")}
            </span>
          </nav>

          <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">{t("Merci pour votre confiance", "Thank you")}</p>
              <h1 className="mt-2 font-serif text-[2.6rem] font-semibold leading-[0.98] tracking-[-0.025em] sm:text-5xl">
                {terminal && order.status === "CANCELLED"
                  ? t("Commande annulée.", "Order cancelled.")
                  : t("Votre commande est enregistrée.", "Your order is recorded.")}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-2.5 text-sm text-muted">
                <span className="font-mono text-[0.78rem] font-semibold text-ink">
                  {order.orderNumber}
                </span>
                <button
                  type="button"
                  onClick={copyNumber}
                  className="inline-flex items-center gap-1 rounded-full border border-line bg-background px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-muted transition hover:border-terracotta hover:text-terracotta"
                >
                  {copied ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  {copied ? t("Copié", "Copied") : t("Copier", "Copy")}
                </button>
                <span className="text-[0.66rem]">
                  {formatDate(order.createdAt, locale)}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.62rem] font-bold uppercase tracking-[0.14em]",
                  meta.tone === "green" && "bg-emerald-100 text-emerald-800",
                  meta.tone === "gold" && "bg-gold/15 text-ink/75",
                  meta.tone === "red" && "bg-red-100 text-red-700",
                  meta.tone === "neutral" && "bg-ink/10 text-ink/65",
                )}
              >
                <span className="status-dot" />
                {meta.label}
              </span>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-background px-3 py-1.5 text-[0.62rem] font-semibold text-ink/70 transition hover:border-terracotta hover:text-terracotta"
              >
                <Printer className="h-3.5 w-3.5" />
                {t("Imprimer", "Print")}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-page py-8 sm:py-10">
        {/* Gateway hint — deliberately neutral. The gateway redirect is never
            treated as proof that money was captured. */}
        {paymentFlag === "success" && isPaymentPending ? (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-gold/35 bg-gold/[0.08] px-4 py-3.5 text-xs leading-relaxed text-ink/75">
            <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            <div>
              <p className="font-semibold">
                {t(
                  "Vérification du paiement en cours.",
                  "Payment verification in progress.",
                )}
              </p>
              <p className="mt-0.5 text-muted">
                {t(
                  "Votre banque nous a renvoyé vers cette page, mais le paiement n’est confirmé qu’à la réception du signal sécurisé du prestataire. Ne relancez pas le paiement : nous vous écrivons dès validation.",
                  "Your bank redirected you here, but the payment is only confirmed when the provider’s secure signal reaches us. Do not pay again: we will email you as soon as it clears.",
                )}
              </p>
            </div>
          </div>
        ) : null}

        {terminal ? (
          <div
            className={cn(
              "mb-5 flex items-start gap-3 rounded-2xl border px-4 py-3.5 text-xs leading-relaxed",
              order.status === "REFUNDED"
                ? "border-line bg-surface/60 text-ink/75"
                : "border-red-200 bg-red-50 text-red-700",
            )}
          >
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">
                {order.status === "CANCELLED"
                  ? t("Cette commande a été annulée.", "This order was cancelled.")
                  : order.status === "REFUNDED"
                    ? t(
                        "Cette commande a été remboursée.",
                        "This order was refunded.",
                      )
                    : t(
                        "Le paiement n’a pas abouti.",
                        "The payment did not go through.",
                      )}
              </p>
              <p className="mt-0.5 opacity-80">
                {t(
                  "Aucun montant supplémentaire ne sera prélevé. Écrivez-nous sur WhatsApp si vous souhaitez réserver une autre pièce.",
                  "No further amount will be charged. Message us on WhatsApp if you would like to reserve another piece.",
                )}
              </p>
            </div>
          </div>
        ) : null}

        <div className="grid gap-7 lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:gap-9">
          <div className="space-y-5">
            {/* Timeline */}
            <section className="rounded-[1.6rem] border border-line/80 bg-background p-5 sm:p-6">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-surface text-terracotta">
                  <Package className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="font-serif text-2xl font-semibold leading-none">
                    {t("Suivi de la commande", "Order tracking")}
                  </h2>
                  <p className="mt-1 text-[0.68rem] text-muted">
                    {isCod
                      ? t(
                          "Paiement en espèces à la livraison, au Maroc.",
                          "Cash on delivery, Morocco only.",
                        )
                      : t(
                          "Paiement par carte, confirmation par le prestataire.",
                          "Card payment, confirmed by the provider.",
                        )}
                  </p>
                </div>
              </div>

              <ol className="mt-6 space-y-0">
                {timeline.map((step, index) => {
                  const complete = currentIndex >= 0 && index < currentIndex;
                  const active = currentIndex === index;
                  const last = index === timeline.length - 1;

                  return (
                    <li key={step.key} className="relative flex gap-3.5">
                      {!last ? (
                        <span
                          aria-hidden
                          className={cn(
                            "absolute left-[0.78rem] top-7 h-[calc(100%-0.9rem)] w-px",
                            complete ? "bg-terracotta/50" : "bg-line",
                          )}
                        />
                      ) : null}

                      <span
                        className={cn(
                          "relative z-10 mt-0.5 grid h-[1.6rem] w-[1.6rem] shrink-0 place-items-center rounded-full border transition",
                          complete &&
                            "border-terracotta bg-terracotta text-background",
                          active &&
                            "border-terracotta bg-background text-terracotta ring-4 ring-terracotta/10",
                          !complete &&
                            !active &&
                            "border-line bg-background text-muted/50",
                        )}
                      >
                        {complete ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : active ? (
                          <motion.span
                            animate={
                              reduceMotion
                                ? undefined
                                : { scale: [1, 1.25, 1], opacity: [1, 0.6, 1] }
                            }
                            transition={{
                              duration: 1.8,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                            className="h-2 w-2 rounded-full bg-terracotta"
                          />
                        ) : (
                          <CircleDashed className="h-3.5 w-3.5" />
                        )}
                      </span>

                      <div className={cn("pb-6", last && "pb-0")}>
                        <p
                          className={cn(
                            "text-sm font-semibold leading-tight",
                            complete || active ? "text-ink" : "text-muted/70",
                          )}
                        >
                          {locale === "ar" ? step.labelFr : locale === "en" ? step.labelEn : step.labelFr}
                        </p>
                        <p className="mt-1 text-[0.7rem] leading-relaxed text-muted">
                          {locale === "ar" ? step.hintFr : locale === "en" ? step.hintEn : step.hintFr}
                        </p>
                        {active ? (
                          <p className="mt-1 inline-flex items-center gap-1 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-terracotta">
                            <Clock3 className="h-3 w-3" />
                            {t("Étape en cours", "Current step")}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ol>

              <div className="mt-2 flex flex-col gap-2 border-t border-line/70 pt-4 text-[0.68rem] sm:flex-row sm:items-center sm:justify-between">
                <span className="flex items-center gap-1.5 text-muted">
                  <Truck className="h-3.5 w-3.5 text-terracotta" />
                  {order.trackingNumber ? (
                    <span>
                      {order.carrier ?? "DHL"} ·{" "}
                      <span className="font-mono font-semibold text-ink">
                        {order.trackingNumber}
                      </span>
                    </span>
                  ) : (
                    t(
                      "Le numéro de suivi apparaîtra ici après expédition.",
                      "The tracking number appears here once shipped.",
                    )
                  )}
                </span>
                {order.shippedAt ? (
                  <span className="text-muted">
                    {t("Expédiée le", "Shipped on")}{" "}
                    {formatDate(order.shippedAt, locale)}
                  </span>
                ) : null}
              </div>
            </section>

            {/* Payment instructions */}
            <section className="rounded-[1.6rem] border border-line/80 bg-background p-5 sm:p-6">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-surface text-terracotta">
                  {isCod ? (
                    <Banknote className="h-4 w-4" />
                  ) : (
                    <CreditCard className="h-4 w-4" />
                  )}
                </span>
                <div>
                  <h2 className="font-serif text-2xl font-semibold leading-none">
                    {t("Paiement", "Payment")}
                  </h2>
                  <p className="mt-1 text-[0.68rem] text-muted">
                    {isCod
                      ? t("Paiement à la livraison", "Cash on delivery")
                      : order.paymentMethod === "CMI"
                        ? "CMI — cartes marocaines"
                        : "Stripe — cartes internationales"}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2.5 text-[0.76rem] leading-relaxed text-muted">
                {isCod ? (
                  <>
                    <p>
                      {t(
                        "Aucun paiement n’est demandé maintenant. Notre équipe vous appelle au numéro indiqué pour confirmer la commande, puis le transporteur encaisse le montant total en dirhams à la remise.",
                        "No payment is taken now. Our team calls the number you provided to confirm the order, then the carrier collects the full amount in dirhams on handover.",
                      )}
                    </p>
                    <p className="flex items-start gap-2 rounded-xl bg-surface/60 px-3.5 py-2.5 text-[0.7rem]">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-terracotta" />
                      {t(
                        "Préparez l’appoint : le transporteur ne dispose pas toujours de monnaie.",
                        "Have the exact amount ready: the carrier may not carry change.",
                      )}
                    </p>
                  </>
                ) : isPaymentPending ? (
                  <p>
                    {t(
                      "La commande est enregistrée et la pièce reste bloquée le temps de la vérification. Tant que le prestataire n’a pas confirmé le paiement, le statut reste « en attente ». Vous recevrez un e-mail de confirmation.",
                      "The order is recorded and the piece stays held while verification runs. Until the provider confirms the payment the status remains “awaiting”. You will receive a confirmation email.",
                    )}
                  </p>
                ) : (
                  <p>
                    {t(
                      "Le paiement a été confirmé par le prestataire. Votre relevé bancaire fait foi ; cette page ne traite aucune donnée de carte.",
                      "The payment was confirmed by the provider. Your bank statement is authoritative; this page never handles card data.",
                    )}
                  </p>
                )}

                {order.paymentReference ? (
                  <p className="flex flex-wrap items-center gap-2 text-[0.68rem]">
                    <span className="font-semibold text-ink/70">
                      {t("Référence", "Reference")}:
                    </span>
                    <span className="font-mono text-ink/75">
                      {order.paymentReference}
                    </span>
                  </p>
                ) : null}

                {terminal ? (
                  <p className="text-[0.7rem] text-red-600">
                    {t(
                      "Aucun débit supplémentaire ne sera effectué sur cette commande.",
                      "No further charge will be made on this order.",
                    )}
                  </p>
                ) : null}
              </div>
            </section>

            {/* Delivery */}
            <section className="rounded-[1.6rem] border border-line/80 bg-background p-5 sm:p-6">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-surface text-terracotta">
                  <MapPin className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="font-serif text-2xl font-semibold leading-none">
                    {t("Livraison", "Delivery")}
                  </h2>
                  <p className="mt-1 text-[0.68rem] text-muted">
                    {order.shippingZone.replaceAll("_", " ")} ·{" "}
                    {t("suivi inclus", "tracking included")}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 text-[0.76rem] sm:grid-cols-2">
                <div>
                  <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-muted">
                    {t("Destinataire", "Recipient")}
                  </p>
                  <p className="mt-1 font-semibold text-ink">{order.fullName}</p>
                  <p className="mt-0.5 text-muted">{order.phone}</p>
                  <p className="text-muted">{order.email}</p>
                </div>
                <div>
                  <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-muted">
                    {t("Adresse", "Address")}
                  </p>
                  <p className="mt-1 leading-relaxed text-muted">{fullAddress}</p>
                </div>
              </div>

              {order.customerNote ? (
                <p className="mt-4 rounded-xl border border-line/70 bg-surface/40 px-3.5 py-2.5 text-[0.7rem] leading-relaxed text-muted">
                  <span className="font-semibold text-ink/70">
                    {t("Votre note", "Your note")}:
                  </span>{" "}
                  {order.customerNote}
                </p>
              ) : null}
            </section>
          </div>

          {/* Summary */}
          <aside className="lg:sticky lg:top-[5.6rem]">
            <div className="overflow-hidden rounded-[1.6rem] border border-line/80 bg-surface/40">
              <div className="flex items-center justify-between border-b border-line/70 px-5 py-4">
                <h2 className="font-serif text-2xl font-semibold">
                  {t("Récapitulatif", "Summary")}
                </h2>
                <ReceiptText className="h-4 w-4 text-terracotta" />
              </div>

              <div className="space-y-3 p-4">
                {order.items.map((item) => (
                  <article key={item.id} className="flex gap-3">
                    <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-wool">
                      {item.photo ? (
                        <Image
                          src={item.photo}
                          alt=""
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-serif text-base font-semibold leading-tight">
                        {item.slug ? (
                          <Link
                            href={`/rugs/${item.slug}`}
                            className="transition hover:text-terracotta"
                          >
                            {item.nameSnapshot}
                          </Link>
                        ) : (
                          item.nameSnapshot
                        )}
                      </p>
                      <p className="mt-0.5 text-[0.6rem] uppercase tracking-[0.14em] text-muted">
                        {item.sku} · {t("Quantité", "Qty")} {item.quantity}
                      </p>
                      <p className="mt-1.5 text-right font-serif text-base font-semibold">
                        {money(item.lineTotal)}
                      </p>
                    </div>
                  </article>
                ))}
              </div>

              <div className="border-t border-line/70 px-5 py-4">
                <dl className="space-y-2 text-[0.75rem]">
                  <div className="flex justify-between text-muted">
                    <dt>{t("Sous-total", "Subtotal")}</dt>
                    <dd>{money(order.subtotal)}</dd>
                  </div>
                  {order.discount > 0 ? (
                    <div className="flex justify-between text-emerald-700">
                      <dt>
                        {t("Remise", "Discount")}
                        {order.promoCode ? ` · ${order.promoCode}` : ""}
                      </dt>
                      <dd>−{money(order.discount)}</dd>
                    </div>
                  ) : null}
                  <div className="flex justify-between text-muted">
                    <dt className="flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5 text-terracotta" />
                      {t("Livraison", "Shipping")}
                    </dt>
                    <dd>{money(order.shippingCost)}</dd>
                  </div>
                  <div className="flex items-baseline justify-between border-t border-line/70 pt-2.5">
                    <dt className="text-sm font-semibold text-ink">
                      {t("Total", "Total")}
                    </dt>
                    <dd className="font-serif text-2xl font-semibold text-ink">
                      {money(order.totalAmount)}
                    </dd>
                  </div>
                </dl>

                <p className="mt-2 text-[0.62rem] text-muted">
                  {t("Montants exprimés en", "Amounts in")} {currency} ·{" "}
                  {t("TVA incluse", "VAT included")}
                </p>

                <div className="mt-3 flex items-start gap-2 rounded-xl bg-background px-3 py-2.5 text-[0.64rem] leading-relaxed text-muted">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-terracotta" />
                  <span>
                    {t(
                      "Le certificat nominatif est imprimé au nom du destinataire et glissé dans la housse.",
                      "The named certificate is printed for the recipient and slipped into the sleeve.",
                    )}
                  </span>
                </div>
              </div>
            </div>

            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-[#1f7a53]/30 bg-[#1f7a53]/[0.06] px-5 py-3 text-sm font-semibold text-[#1f7a53] transition hover:bg-[#1f7a53] hover:text-white"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12.04 2.001a9.84 9.84 0 0 0-8.42 14.94L2.1 21.9l5.08-1.49A9.84 9.84 0 1 0 12.04 2Zm0 1.67a8.17 8.17 0 1 1-4.17 15.22l-.3-.18-3.01.88.9-2.94-.2-.31A8.17 8.17 0 0 1 12.04 3.67Zm-2.8 4.02c-.15 0-.39.06-.59.28-.2.22-.77.75-.77 1.83s.79 2.12.9 2.27c.11.15 1.53 2.44 3.78 3.32 1.87.73 2.25.59 2.66.55.41-.04 1.32-.54 1.51-1.06.19-.52.19-.97.13-1.06-.06-.09-.22-.15-.46-.27-.24-.12-1.4-.69-1.62-.77-.22-.08-.38-.12-.54.12-.16.24-.62.77-.76.93-.14.16-.28.18-.52.06-.24-.12-1.01-.37-1.92-1.18-.71-.63-1.19-1.4-1.33-1.64-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.19-.47-.39-.4-.54-.41l-.46-.01Z" />
              </svg>
              {t("Une question sur cette commande ?", "A question about this order?")}
            </a>

            <div className="mt-3 flex items-center justify-center gap-1.5 text-[0.62rem] text-muted">
              <BadgeCheck className="h-3.5 w-3.5 text-gold" />
              {t(
                "Certificat d’authenticité nominatif inclus",
                "Named certificate of authenticity included",
              )}
            </div>

            <Link
              href="/shop"
              className="mt-5 flex items-center justify-center gap-2 rounded-full border border-line bg-background px-5 py-3 text-sm font-semibold text-ink transition hover:border-terracotta hover:text-terracotta"
            >
              {t("Continuer la découverte", "Continue exploring")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
