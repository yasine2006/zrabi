"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Clock3,
  Loader2,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Tag,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/context/StoreContext";
import { COUNTRY_OPTIONS } from "@/lib/i18n";
import { roundMoney } from "@/lib/money";
// promo removed
import { cn } from "@/lib/utils";

interface ShippingQuote {
  country: string;
  zone: string;
  totalWeightKg: number;
  priceMad: number;
  priceEur: number;
  priceUsd: number;
  carrier: string | null;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
}

function countdown(expiresAt: number | null, now: number): string {
  if (!expiresAt) return "15:00";

  const remaining = Math.max(0, expiresAt - now);
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function CartDrawer() {
  const {
    cart,
    cartOpen,
    closeCart,
    removeItem,
    refreshHold,
    now,
    holdExpiresAt,
    holdExpired,
    currency,
    format,
    formatRug,
    t,
    locale,
  } = useStore();

  const [country, setCountry] = useState("MA");
  const [quote, setQuote] = useState<ShippingQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  // promo removed

  const cartKey = cart.map((item) => item.id).join(",");

  useEffect(() => {
    if (!cartOpen) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") closeCart();
    }

    document.addEventListener("keydown", onEscape);

    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onEscape);
    };
  }, [cartOpen, closeCart]);

  useEffect(() => {
    if (!cart.length) {
      setQuote(null);
      setQuoteError(null);
      return;
    }

    const controller = new AbortController();
    setQuoteLoading(true);
    setQuoteError(null);

    fetch("/api/shipping/quote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        country,
        items: cart.map((item) => ({ rugId: item.id, quantity: 1 })),
      }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error?.message ?? "Shipping unavailable.");
        }
        return payload as ShippingQuote;
      })
      .then((payload) => setQuote(payload))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setQuote(null);
        setQuoteError(
          error instanceof Error
            ? error.message
            : t(
                "Impossible d’estimer la livraison.",
                "Could not estimate shipping.",
              ),
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setQuoteLoading(false);
      });

    return () => controller.abort();
  }, [cart, cart.length, cartKey, country, t]);

  const subtotal = useMemo(
    () =>
      roundMoney(
        cart.reduce(
          (sum, item) =>
            sum +
            (currency === "MAD"
              ? item.priceMad
              : currency === "EUR"
                ? item.priceEur
                : item.priceUsd),
          0,
        ),
      ),
    [cart, currency],
  );

  const discount = 0;

  const shipping = quote
    ? currency === "MAD"
      ? quote.priceMad
      : currency === "EUR"
        ? quote.priceEur
        : quote.priceUsd
    : 0;

  const total = roundMoney(subtotal - discount + shipping);
  const totalWeight = cart.reduce((sum, item) => sum + item.weightKg, 0);

  // promo removed

  return (
    <AnimatePresence>
      {cartOpen ? (
        <div className="fixed inset-0 z-[80]">
          <motion.button
            type="button"
            aria-label={t("Fermer le panier", "Close cart")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeCart}
            className="absolute inset-0 bg-ink/35 backdrop-blur-[3px]"
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={t("Votre panier", "Your cart")}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="absolute right-0 top-0 flex h-full w-full max-w-[31rem] flex-col border-l border-line bg-background shadow-lift"
          >
            <div className="flex items-center justify-between border-b border-line/80 px-5 py-4 sm:px-6">
              <div>
                <p className="eyebrow">{t("Pièces uniques", "One-of-a-kind")}</p>
                <h2 className="mt-0.5 font-serif text-2xl font-semibold">
                  {t("Votre panier", "Your cart")}
                  {cart.length ? (
                    <span className="ml-2 align-middle text-sm font-sans font-medium text-muted">
                      ({cart.length})
                    </span>
                  ) : null}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeCart}
                className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink/60 transition hover:border-terracotta hover:text-terracotta"
                aria-label={t("Fermer", "Close")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain">
              {cart.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-surface">
                    <Tag className="h-7 w-7 text-terracotta/70" />
                  </span>
                  <h3 className="mt-5 font-serif text-2xl">
                    {t("Le panier est encore vide", "Your cart is still empty")}
                  </h3>
                  <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
                    {t(
                      "Chaque tapis est unique. Prenez le temps de trouver la pièce qui racontera votre histoire.",
                      "Every rug is unique. Take your time finding the piece that will tell your story.",
                    )}
                  </p>
                  <Link
                    href="/shop"
                    onClick={closeCart}
                    className="btn-primary mt-6"
                  >
                    {t("Découvrir la collection", "Explore the collection")}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-5 px-5 py-5 sm:px-6">
                  <div
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border px-4 py-3 text-xs",
                      holdExpired
                        ? "border-red-300 bg-red-50 text-red-700"
                        : "border-gold/30 bg-gold/[0.08] text-ink/75",
                    )}
                  >
                    <Clock3 className="h-4 w-4 shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold">
                        {holdExpired
                          ? t("Votre réservation a expiré", "Your hold has expired")
                          : t(
                              "Pièce mise de côté pour vous",
                              "Piece held for you",
                            )}
                      </p>
                      <p className="mt-0.5 text-[0.7rem] opacity-75">
                        {t(
                          "Nous gardons votre sélection 15 minutes.",
                          "We keep your selection for 15 minutes.",
                        )}
                      </p>
                    </div>
                    <span className="font-mono text-sm font-bold tabular-nums">
                      {countdown(holdExpiresAt, now)}
                    </span>
                  </div>

                  {holdExpired ? (
                    <button
                      type="button"
                      onClick={refreshHold}
                      className="flex w-full items-center justify-center gap-2 rounded-full border border-red-300 bg-white px-4 py-2.5 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      {t(
                        "Renouveler la réservation",
                        "Refresh the hold",
                      )}
                    </button>
                  ) : null}

                  <div className="space-y-3">
                    {cart.map((item) => (
                      <motion.article
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 24 }}
                        className="flex gap-3 rounded-2xl border border-line/80 bg-surface/45 p-3"
                      >
                        <Link
                          href={`/rugs/${item.slug}`}
                          onClick={closeCart}
                          className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-wool"
                        >
                          {item.photo ? (
                            <Image
                              src={item.photo}
                              alt={locale === "ar" ? (item.nameAr ?? item.nameFr) : locale === "en" ? item.nameEn : item.nameFr}
                              fill
                              sizes="80px"
                              className="object-cover"
                            />
                          ) : null}
                        </Link>

                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <Link
                                href={`/rugs/${item.slug}`}
                                onClick={closeCart}
                                className="block truncate font-serif text-lg font-semibold leading-tight hover:text-terracotta"
                              >
                                {locale === "ar" ? (item.nameAr ?? item.nameFr) : locale === "en" ? item.nameEn : item.nameFr}
                              </Link>
                              <p className="mt-0.5 text-[0.63rem] uppercase tracking-[0.16em] text-muted">
                                {item.sku}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted transition hover:bg-background hover:text-terracotta"
                              aria-label={t("Retirer du panier", "Remove from cart")}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <p className="mt-1 text-xs text-muted">
                            {item.isMadeToOrder
                              ? t("Sur commande · 6–10 semaines", "Made to order · 6–10 weeks")
                              : t("En stock · expédié sous 48 h", "In stock · ships in 48 h")}
                          </p>

                          <div className="mt-auto flex items-end justify-between gap-2 pt-2">
                            <span className="rounded-full bg-background px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-muted">
                              {t("Quantité 1 · pièce unique", "Qty 1 · unique piece")}
                            </span>
                            <span className="font-serif text-lg font-semibold">
                              {formatRug(item)}
                            </span>
                          </div>
                        </div>
                      </motion.article>
                    ))}
                  </div>

                  <section className="rounded-2xl border border-line/80 bg-background/60 p-4">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-terracotta" />
                      <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-ink/70">
                        {t("Estimation de livraison", "Shipping estimator")}
                      </h3>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <label className="sr-only" htmlFor="cart-country">
                        {t("Pays de livraison", "Delivery country")}
                      </label>
                      <div className="relative flex-1">
                        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
                        <select
                          id="cart-country"
                          value={country}
                          onChange={(event) => setCountry(event.target.value)}
                          className="h-10 w-full appearance-none rounded-xl border border-line bg-surface/60 pl-8 pr-8 text-xs font-medium text-ink outline-none focus:border-terracotta"
                        >
                          {COUNTRY_OPTIONS.map((option) => (
                            <option key={option.code} value={option.code}>
                              {locale === "ar" ? option.nameFr : locale === "en" ? option.nameEn : option.nameFr}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid h-10 min-w-[4.5rem] place-items-center rounded-xl bg-surface px-2 text-[0.65rem] font-semibold text-muted">
                        {totalWeight.toFixed(1)} kg
                      </div>
                    </div>

                    <div className="mt-3 min-h-[2.6rem] text-xs">
                      {quoteLoading ? (
                        <span className="flex items-center gap-2 text-muted">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          {t("Calcul en cours…", "Calculating…")}
                        </span>
                      ) : quoteError ? (
                        <span className="text-red-600">{quoteError}</span>
                      ) : quote ? (
                        <div className="flex items-start justify-between gap-3">
                          <span className="text-muted">
                            {quote.carrier ?? "DHL"}
                            <span className="block text-[0.65rem]">
                              {quote.estimatedDaysMin}–{quote.estimatedDaysMax}{" "}
                              {t("jours ouvrés", "business days")}
                            </span>
                          </span>
                          <span className="font-semibold text-ink">
                            {format(
                              currency === "MAD"
                                ? quote.priceMad
                                : currency === "EUR"
                                  ? quote.priceEur
                                  : quote.priceUsd,
                            )}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted">
                          {t(
                            "Sélectionnez un pays pour estimer.",
                            "Choose a country to estimate.",
                          )}
                        </span>
                      )}
                    </div>
                  </section>

                  {/* promo removed */}
                </div>
              )}
            </div>

            {cart.length > 0 ? (
              <div className="border-t border-line bg-surface/45 px-5 py-4 sm:px-6">
                <dl className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-muted">
                    <dt>{t("Sous-total", "Subtotal")}</dt>
                    <dd>{format(subtotal)}</dd>
                  </div>
                  {discount > 0 ? (
                    <div className="flex justify-between text-emerald-700">
                      <dt>{t("Remise", "Discount")}</dt>
                      <dd>−{format(discount)}</dd>
                    </div>
                  ) : null}
                  <div className="flex justify-between text-muted">
                    <dt>{t("Livraison estimée", "Estimated shipping")}</dt>
                    <dd>
                      {quote ? format(shipping) : t("Calculée à l’étape suivante", "Calculated next")}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between border-t border-line/70 pt-2.5 text-ink">
                    <dt className="text-sm font-semibold">
                      {t("Total", "Total")}
                    </dt>
                    <dd className="font-serif text-2xl font-semibold">
                      {format(total)}
                    </dd>
                  </div>
                </dl>

                <Link
                  href="/checkout"
                  onClick={closeCart}
                  aria-disabled={holdExpired}
                  className={cn(
                    "mt-3 flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-semibold transition",
                    holdExpired
                      ? "pointer-events-none bg-ink/20 text-ink/40"
                      : "bg-terracotta text-background hover:bg-terracottaDark hover:shadow-soft",
                  )}
                >
                  {t("Passer commande", "Proceed to checkout")}
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <p className="mt-2.5 flex items-center justify-center gap-1.5 text-center text-[0.63rem] text-muted">
                  <ShieldCheck className="h-3.5 w-3.5 text-terracotta" />
                  {t(
                    "Paiement sécurisé CMI · Stripe · ou à la livraison",
                    "Secure CMI · Stripe · or cash on delivery",
                  )}
                </p>
              </div>
            ) : null}
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
