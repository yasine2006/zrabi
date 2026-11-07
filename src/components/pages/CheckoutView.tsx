"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Check,
  ChevronDown,
  Clock3,
  CreditCard,
  Loader2,
  LockKeyhole,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Tag,
  Truck,
  UserRound,
  Wallet,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/context/StoreContext";
import { COUNTRY_OPTIONS } from "@/lib/i18n";
import { roundMoney } from "@/lib/money";
import { promoDiscount } from "@/lib/promo";
import { cn } from "@/lib/utils";
import { getSupportWhatsAppLink } from "@/lib/whatsapp";

type PaymentChoice = "COD" | "STRIPE" | "CMI";
type Mode = "guest" | "account";

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

interface CheckoutForm {
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postalCode: string;
  country: string;
  note: string;
}

interface SavedProfile {
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postalCode: string;
  country: string;
}

const PROFILE_KEY = "zarbia.profile.v1";

const EMPTY_FORM: CheckoutForm = {
  fullName: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  postalCode: "",
  country: "MA",
  note: "",
};

function countdown(expiresAt: number | null, now: number): string {
  if (!expiresAt) return "15:00";

  const remaining = Math.max(0, expiresAt - now);
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function CheckoutView() {
  const {
    hydrated,
    cart,
    createOrder,
    format,
    formatRug,
    now,
    holdExpiresAt,
    holdExpired,
    refreshHold,
    t,
    locale,
    currency,
    promo,
    applyPromo,
    removePromo,
  } = useStore();

  const [mode, setMode] = useState<Mode>("guest");
  const [form, setForm] = useState<CheckoutForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [quote, setQuote] = useState<ShippingQuote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [payment, setPayment] = useState<PaymentChoice>("COD");
  const [availablePayments, setAvailablePayments] = useState<PaymentChoice[]>([
    "COD",
  ]);
  const [promoInput, setPromoInput] = useState("");
  const [promoMessage, setPromoMessage] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  const cartKey = cart.map((item) => item.id).join(",");
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

  const discount = promo ? promoDiscount(subtotal, promo.code) : 0;
  const shipping = quote
    ? currency === "MAD"
      ? quote.priceMad
      : currency === "EUR"
        ? quote.priceEur
        : quote.priceUsd
    : 0;
  const total = roundMoney(subtotal - discount + shipping);
  const totalWeight = cart.reduce((sum, item) => sum + item.weightKg, 0);

  /* Restore the local profile once, without ever blocking the form. */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PROFILE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<SavedProfile>;
      if (parsed.email) {
        setMode("account");
      }
    } catch {
      /* A corrupt profile is simply ignored. */
    }
  }, []);

  /* Only offer gateways whose credentials are configured on the server. */
  useEffect(() => {
    let cancelled = false;

    fetch("/api/payments/methods")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { methods?: PaymentChoice[] } | null) => {
        if (cancelled || !Array.isArray(payload?.methods)) return;

        const methods = payload.methods.filter((method): method is PaymentChoice =>
          method === "COD" || method === "STRIPE" || method === "CMI",
        );
        if (methods.length === 0) return;

        setAvailablePayments(methods);
        setPayment((current) =>
          methods.includes(current)
            ? current
            : methods.includes("STRIPE")
              ? "STRIPE"
              : methods.includes("CMI")
                ? "CMI"
                : "COD",
        );
      })
      .catch(() => {
        /* Keep the safe default (COD only) if the probe fails. */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /* International destinations always use a card gateway; Morocco defaults to COD. */
  useEffect(() => {
    setPayment((current) => {
      if (form.country !== "MA") {
        if (availablePayments.includes("STRIPE")) return "STRIPE";
        if (availablePayments.includes("CMI")) return "CMI";
        return current;
      }
      return current === "STRIPE" || current === "CMI" ? current : "COD";
    });
  }, [form.country, availablePayments]);

  useEffect(() => {
    if (!hydrated || cart.length === 0) {
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
        country: form.country,
        items: cart.map((item) => ({ rugId: item.id, quantity: 1 })),
      }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(
            payload?.error?.message ??
              t("Livraison indisponible.", "Shipping unavailable."),
          );
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
  }, [cart, cart.length, cartKey, form.country, hydrated, t]);

  function setField(field: keyof CheckoutForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    setServerError(null);
  }

  function loadProfile() {
    try {
      const raw = window.localStorage.getItem(PROFILE_KEY);
      if (!raw) {
        setProfileMessage(
          t(
            "Aucun profil enregistré sur cet appareil. Renseignez vos coordonnées ci-dessous.",
            "No profile saved on this device. Fill in your details below.",
          ),
        );
        return;
      }

      const parsed = JSON.parse(raw) as Partial<SavedProfile>;
      setForm((current) => ({
        ...current,
        fullName: parsed.fullName ?? current.fullName,
        email: parsed.email ?? current.email,
        phone: parsed.phone ?? current.phone,
        addressLine1: parsed.addressLine1 ?? current.addressLine1,
        addressLine2: parsed.addressLine2 ?? current.addressLine2,
        city: parsed.city ?? current.city,
        postalCode: parsed.postalCode ?? current.postalCode,
        country: parsed.country ?? current.country,
      }));
      setProfileMessage(
        t(
          "Vos informations ont été retrouvées sur cet appareil.",
          "Your details were restored from this device.",
        ),
      );
    } catch {
      setProfileMessage(
        t(
          "Le profil enregistré est illisible. Renseignez vos coordonnées.",
          "The saved profile could not be read. Please enter your details.",
        ),
      );
    }
  }

  function validate(): Record<string, string> {
    const next: Record<string, string> = {};

    if (form.fullName.trim().length < 2) {
      next.fullName = t("Indiquez votre nom complet.", "Enter your full name.");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) {
      next.email = t(
        "Indiquez une adresse e-mail valide.",
        "Enter a valid email address.",
      );
    }

    if (!/^\+?[0-9][0-9\s().-]{5,24}$/.test(form.phone.trim())) {
      next.phone = t(
        "Indiquez un numéro joignable (6 à 25 chiffres).",
        "Enter a reachable phone number (6–25 digits).",
      );
    }

    if (form.addressLine1.trim().length < 5) {
      next.addressLine1 = t(
        "Indiquez l’adresse complète.",
        "Enter the full street address.",
      );
    }

    if (form.city.trim().length < 2) {
      next.city = t("Indiquez votre ville.", "Enter your city.");
    }

    if (!/^[A-Za-z]{2}$/.test(form.country)) {
      next.country = t("Choisissez un pays.", "Choose a country.");
    }

    return next;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);

    if (cart.length === 0) {
      setServerError(
        t(
          "Votre panier est vide. Ajoutez une pièce avant de commander.",
          "Your cart is empty. Add a piece before checking out.",
        ),
      );
      return;
    }

    if (holdExpired) {
      setServerError(
        t(
          "Votre réservation de 15 minutes a expiré. Renouvelez-la avant de commander.",
          "Your 15-minute hold has expired. Refresh it before checking out.",
        ),
      );
      return;
    }

    if (paymentBlocked) {
      setServerError(
        t(
          "Le paiement par carte internationale est en cours d’activation. Contactez-nous sur WhatsApp pour finaliser votre commande.",
          "International card payment is being activated. Contact us on WhatsApp to complete your order.",
          "الدفع الدولي بالبطاقة قيد التفعيل. تواصلوا معنا عبر واتساب لإتمام طلبكم.",
        ),
      );
      return;
    }

    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      const first = Object.keys(nextErrors)[0];
      document.getElementById(`checkout-${first}`)?.focus();
      return;
    }

    setSubmitting(true);

    try {
      const payload = await createOrder({
        customer: {
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          fullName: form.fullName.trim(),
          addressLine1: form.addressLine1.trim(),
          addressLine2: form.addressLine2.trim() || undefined,
          city: form.city.trim(),
          postalCode: form.postalCode.trim() || undefined,
          country: form.country.toUpperCase(),
        },
        items: cart.map((item) => ({ rugId: item.id, quantity: 1 })),
        paymentMethod: payment,
        currency,
        promoCode: promo?.code,
        customerNote: form.note.trim() || undefined,
      });

      try {
        const profile: SavedProfile = {
          fullName: form.fullName.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          addressLine1: form.addressLine1.trim(),
          addressLine2: form.addressLine2.trim(),
          city: form.city.trim(),
          postalCode: form.postalCode.trim(),
          country: form.country,
        };
        window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      } catch {
        /* Saving a convenience profile must never block the order. */
      }

      const destination = payload.redirectUrl || `/order/${payload.orderId}`;

      window.location.assign(destination);
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : t(
              "Une erreur est survenue. Réessayez.",
              "Something went wrong. Please try again.",
            ),
      );
      setSubmitting(false);
    }
  }

  function handleApplyPromo() {
    if (!promoInput.trim()) return;
    const result = applyPromo(promoInput);
    setPromoMessage({ ok: result.ok, text: result.message });
    if (result.ok) setPromoInput("");
  }

  const isMorocco = form.country === "MA";
  const canPayByCard =
    availablePayments.includes("STRIPE") || availablePayments.includes("CMI");
  const paymentBlocked = !isMorocco && !canPayByCard;
  const whatsappSupport = getSupportWhatsAppLink({
    locale,
    message: t(
      "Bonjour, je souhaite finaliser une commande internationale Zarbia Atlas.",
      "Hello, I would like to complete an international Zarbia Atlas order.",
      "مرحباً، أود إتمام طلب دولي من زربيا أطلس.",
    ),
  });

  if (!hydrated) {
    return (
      <div className="container-page py-16">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="h-8 w-52 animate-pulse rounded-full bg-surface" />
            <div className="h-64 animate-pulse rounded-[1.6rem] bg-surface/70" />
            <div className="h-64 animate-pulse rounded-[1.6rem] bg-surface/70" />
          </div>
          <div className="h-96 animate-pulse rounded-[1.6rem] bg-surface/70" />
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="container-page py-20">
        <div className="mx-auto flex max-w-lg flex-col items-center text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-surface text-terracotta">
            <Tag className="h-7 w-7" />
          </span>
          <h1 className="mt-6 font-serif text-4xl font-semibold">
            {t("Votre panier est vide.", "Your cart is empty.")}
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
            {t(
              "Chaque tapis est une pièce unique. Explorez la collection et trouvez celle qui racontera votre histoire.",
              "Every rug is one of a kind. Explore the collection and find the piece that will tell your story.",
            )}
          </p>
          <Link href="/shop" className="btn-primary mt-7">
            {t("Découvrir la collection", "Explore the collection")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container-page py-8 sm:py-10">
        <nav
          aria-label={t("Fil d’Ariane", "Breadcrumb")}
          className="flex flex-wrap items-center gap-2 text-[0.64rem] uppercase tracking-[0.16em] text-muted"
        >
          <Link href="/shop" className="transition hover:text-terracotta">
            {t("Boutique", "Shop")}
          </Link>
          <span>/</span>
          <span className="text-ink/65">
            {t("Commande", "Checkout")}
          </span>
        </nav>

        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">{t("Dernière étape", "Final step")}</p>
            <h1 className="mt-2 font-serif text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">
              {t("Votre commande.", "Your order.")}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-[0.64rem] uppercase tracking-[0.14em] text-muted">
            <span className="text-terracotta">01 {t("Panier", "Cart")}</span>
            <span className="h-px w-5 bg-line" />
            <span className="font-semibold text-ink">02 {t("Livraison", "Delivery")}</span>
            <span className="h-px w-5 bg-line" />
            <span>03 {t("Paiement", "Payment")}</span>
          </div>
        </div>

        {/* Reservation banner */}
        <div
          className={cn(
            "mt-6 flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3 text-xs",
            holdExpired
              ? "border-red-300 bg-red-50 text-red-700"
              : "border-gold/30 bg-gold/[0.08] text-ink/75",
          )}
        >
          <Clock3 className="h-4 w-4 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">
              {holdExpired
                ? t(
                    "Votre réservation a expiré.",
                    "Your hold has expired.",
                  )
                : t(
                    "Vos pièces sont mises de côté pendant 15 minutes.",
                    "Your pieces are held for 15 minutes.",
                  )}
            </p>
            <p className="mt-0.5 text-[0.68rem] opacity-75">
              {t(
                "La commande finalise la réservation côté atelier.",
                "Placing the order finalises the reservation with the atelier.",
              )}
            </p>
          </div>
          <span className="font-mono text-sm font-bold tabular-nums">
            {countdown(holdExpiresAt, now)}
          </span>
          {holdExpired ? (
            <button
              type="button"
              onClick={refreshHold}
              className="flex items-center gap-1.5 rounded-full border border-red-300 bg-white px-3 py-1.5 text-[0.65rem] font-semibold text-red-700"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {t("Renouveler", "Refresh")}
            </button>
          ) : null}
        </div>

        {serverError ? (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        ) : null}

        <form
          onSubmit={handleSubmit}
          className="mt-7 grid gap-8 lg:grid-cols-[1.12fr_0.88fr] lg:items-start lg:gap-10"
          noValidate
        >
          <div className="space-y-5">
            {/* Contact */}
            <section className="rounded-[1.6rem] border border-line/80 bg-background p-5 sm:p-6">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-surface text-terracotta">
                  <UserRound className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="font-serif text-2xl font-semibold leading-none">
                    {t("Vos coordonnées", "Your details")}
                  </h2>
                  <p className="mt-1 text-[0.68rem] text-muted">
                    {t(
                      "Pour le suivi et le certificat nominatif.",
                      "For tracking and the named certificate.",
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex rounded-full border border-line bg-surface/50 p-0.5 text-[0.66rem] font-semibold">
                {(
                  [
                    ["guest", t("Commande invité", "Guest checkout")],
                    ["account", t("Mon compte", "My account")],
                  ] as Array<[Mode, string]>
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setMode(value);
                      setProfileMessage(null);
                    }}
                    aria-pressed={mode === value}
                    className={cn(
                      "flex-1 rounded-full px-3 py-2 transition",
                      mode === value
                        ? "bg-ink text-background shadow-sm"
                        : "text-ink/60 hover:text-ink",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <AnimatePresence initial={false}>
                {mode === "account" ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line/80 bg-surface/40 px-3.5 py-3">
                      <p className="text-[0.68rem] leading-relaxed text-muted">
                        {t(
                          "Retrouvez les coordonnées enregistrées sur cet appareil.",
                          "Restore the details saved on this device.",
                        )}
                      </p>
                      <button
                        type="button"
                        onClick={loadProfile}
                        className="rounded-full bg-ink px-3.5 py-1.5 text-[0.64rem] font-semibold text-background transition hover:bg-terracotta"
                      >
                        {t("Retrouver mon profil", "Restore my profile")}
                      </button>
                    </div>
                    {profileMessage ? (
                      <p className="mt-2 text-[0.68rem] text-muted">
                        {profileMessage}
                      </p>
                    ) : null}
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="checkout-fullName" className="field-label">
                    {t("Nom complet", "Full name")}
                  </label>
                  <input
                    id="checkout-fullName"
                    value={form.fullName}
                    onChange={(event) =>
                      setField("fullName", event.target.value)
                    }
                    autoComplete="name"
                    placeholder={t("Amina El Fassi", "Amina El Fassi", "أمينة الفاسي")}
                    aria-invalid={Boolean(errors.fullName)}
                    className={cn(
                      "field",
                      errors.fullName && "border-red-400",
                    )}
                  />
                  {errors.fullName ? (
                    <p className="mt-1 text-[0.65rem] text-red-600">
                      {errors.fullName}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="checkout-email" className="field-label">
                    {t("E-mail", "Email")}
                  </label>
                  <input
                    id="checkout-email"
                    type="email"
                    value={form.email}
                    onChange={(event) => setField("email", event.target.value)}
                    autoComplete="email"
                    placeholder={t(
                      "vous@exemple.com",
                      "you@example.com",
                      "you@example.com",
                    )}
                    aria-invalid={Boolean(errors.email)}
                    className={cn("field", errors.email && "border-red-400")}
                  />
                  {errors.email ? (
                    <p className="mt-1 text-[0.65rem] text-red-600">
                      {errors.email}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="checkout-phone" className="field-label">
                    {t("Téléphone / WhatsApp", "Phone / WhatsApp")}
                  </label>
                  <input
                    id="checkout-phone"
                    type="tel"
                    value={form.phone}
                    onChange={(event) => setField("phone", event.target.value)}
                    autoComplete="tel"
                    placeholder="+212 6 00 00 00 00"
                    aria-invalid={Boolean(errors.phone)}
                    className={cn("field", errors.phone && "border-red-400")}
                  />
                  {errors.phone ? (
                    <p className="mt-1 text-[0.65rem] text-red-600">
                      {errors.phone}
                    </p>
                  ) : null}
                </div>
              </div>
            </section>

            {/* Address */}
            <section className="rounded-[1.6rem] border border-line/80 bg-background p-5 sm:p-6">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-surface text-terracotta">
                  <MapPin className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="font-serif text-2xl font-semibold leading-none">
                    {t("Adresse de livraison", "Delivery address")}
                  </h2>
                  <p className="mt-1 text-[0.68rem] text-muted">
                    {t(
                      "Nous expédions vers 60+ destinations.",
                      "We ship to 60+ destinations.",
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="checkout-country" className="field-label">
                    {t("Pays", "Country")}
                  </label>
                  <div className="relative">
                    <select
                      id="checkout-country"
                      value={form.country}
                      onChange={(event) =>
                        setField("country", event.target.value)
                      }
                      autoComplete="country"
                      className="field appearance-none pr-9"
                    >
                      {COUNTRY_OPTIONS.map((option) => (
                        <option key={option.code} value={option.code}>
                          {locale === "ar" ? option.nameFr : locale === "en" ? option.nameEn : option.nameFr}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="checkout-addressLine1"
                    className="field-label"
                  >
                    {t("Adresse", "Street address")}
                  </label>
                  <input
                    id="checkout-addressLine1"
                    value={form.addressLine1}
                    onChange={(event) =>
                      setField("addressLine1", event.target.value)
                    }
                    autoComplete="address-line1"
                    placeholder={t(
                      "12 rue des Orangers",
                      "12 Orchard Street",
                    )}
                    aria-invalid={Boolean(errors.addressLine1)}
                    className={cn(
                      "field",
                      errors.addressLine1 && "border-red-400",
                    )}
                  />
                  {errors.addressLine1 ? (
                    <p className="mt-1 text-[0.65rem] text-red-600">
                      {errors.addressLine1}
                    </p>
                  ) : null}
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="checkout-addressLine2"
                    className="field-label"
                  >
                    {t(
                      "Complément (optionnel)",
                      "Apartment, suite (optional)",
                    )}
                  </label>
                  <input
                    id="checkout-addressLine2"
                    value={form.addressLine2}
                    onChange={(event) =>
                      setField("addressLine2", event.target.value)
                    }
                    autoComplete="address-line2"
                    placeholder={t(
                      "Appartement, étage, repère",
                      "Apartment, floor, landmark",
                    )}
                    className="field"
                  />
                </div>

                <div>
                  <label htmlFor="checkout-city" className="field-label">
                    {t("Ville", "City")}
                  </label>
                  <input
                    id="checkout-city"
                    value={form.city}
                    onChange={(event) => setField("city", event.target.value)}
                    autoComplete="address-level2"
                    placeholder={t("Marrakech", "Marrakech")}
                    aria-invalid={Boolean(errors.city)}
                    className={cn("field", errors.city && "border-red-400")}
                  />
                  {errors.city ? (
                    <p className="mt-1 text-[0.65rem] text-red-600">
                      {errors.city}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="checkout-postalCode" className="field-label">
                    {t("Code postal (optionnel)", "Postal code (optional)")}
                  </label>
                  <input
                    id="checkout-postalCode"
                    value={form.postalCode}
                    onChange={(event) =>
                      setField("postalCode", event.target.value)
                    }
                    autoComplete="postal-code"
                    placeholder="40000"
                    className="field"
                  />
                </div>
              </div>
            </section>

            {/* Payment */}
            <section className="rounded-[1.6rem] border border-line/80 bg-background p-5 sm:p-6">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-surface text-terracotta">
                  <LockKeyhole className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="font-serif text-2xl font-semibold leading-none">
                    {t("Paiement", "Payment")}
                  </h2>
                  <p className="mt-1 text-[0.68rem] text-muted">
                    {t(
                      "Aucun numéro de carte n’est stocké par Zarbia.",
                      "Zarbia never stores your card number.",
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2.5">
                <button
                  type="button"
                  disabled={!isMorocco}
                  onClick={() => setPayment("COD")}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition",
                    payment === "COD"
                      ? "border-terracotta bg-surface/60 ring-1 ring-terracotta/30"
                      : "border-line bg-background hover:border-terracotta/40",
                    !isMorocco && "cursor-not-allowed opacity-45",
                  )}
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-background text-terracotta">
                    <Banknote className="h-4 w-4" />
                  </span>
                  <span className="flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold">
                        {t("Paiement à la livraison", "Cash on delivery")}
                      </span>
                      {payment === "COD" ? (
                        <Check className="h-4 w-4 text-terracotta" />
                      ) : null}
                    </span>
                    <span className="mt-0.5 block text-[0.68rem] leading-relaxed text-muted">
                      {t(
                        "Maroc uniquement. Notre équipe vous appelle pour confirmer avant l’expédition.",
                        "Morocco only. Our team calls to confirm before dispatch.",
                      )}
                    </span>
                  </span>
                </button>

                {availablePayments.includes("CMI") ? (
                  <button
                    type="button"
                    onClick={() => setPayment("CMI")}
                    disabled={!isMorocco}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition",
                      payment === "CMI"
                        ? "border-terracotta bg-surface/60 ring-1 ring-terracotta/30"
                        : "border-line bg-background hover:border-terracotta/40",
                      !isMorocco && "cursor-not-allowed opacity-45",
                    )}
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-background text-terracotta">
                      <CreditCard className="h-4 w-4" />
                    </span>
                    <span className="flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold">
                          CMI — {t("cartes marocaines", "Moroccan cards")}
                        </span>
                        {payment === "CMI" ? (
                          <Check className="h-4 w-4 text-terracotta" />
                        ) : null}
                      </span>
                      <span className="mt-0.5 block text-[0.68rem] leading-relaxed text-muted">
                        {t(
                          "Paiement 3-D Secure via le Centre Monétique Interbancaire, en dirhams.",
                          "3-D Secure payment through the Centre Monétique Interbancaire, in dirhams.",
                        )}
                      </span>
                    </span>
                  </button>
                ) : null}

                {availablePayments.includes("STRIPE") ? (
                  <button
                    type="button"
                    onClick={() => setPayment("STRIPE")}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition",
                      payment === "STRIPE"
                        ? "border-terracotta bg-surface/60 ring-1 ring-terracotta/30"
                        : "border-line bg-background hover:border-terracotta/40",
                    )}
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-background text-terracotta">
                      <Wallet className="h-4 w-4" />
                    </span>
                    <span className="flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold">
                          Stripe — {t("cartes internationales", "international cards")}
                        </span>
                        {payment === "STRIPE" ? (
                          <Check className="h-4 w-4 text-terracotta" />
                        ) : null}
                      </span>
                      <span className="mt-0.5 block text-[0.68rem] leading-relaxed text-muted">
                        {t(
                          "Visa, Mastercard, Amex. Paiement sécurisé en EUR ou USD.",
                          "Visa, Mastercard, Amex. Secure payment in EUR or USD.",
                          "فيزا، ماستركارد، أميكس. دفع إلكتروني آمن باليورو أو الدولار.",
                        )}
                      </span>
                    </span>
                  </button>
                ) : null}

                <div className="flex w-full items-start gap-3 rounded-2xl border border-line/60 bg-surface/30 p-4 text-left opacity-80">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-background/80 text-muted">
                    <Wallet className="h-4 w-4" />
                  </span>
                  <span className="flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-ink/75">
                        PayPal
                      </span>
                      <span className="rounded-full bg-gold/20 px-2.5 py-0.5 text-[0.62rem] font-bold text-ink">
                        {t("Bientôt disponible", "Coming soon", "قريباً")}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-[0.68rem] leading-relaxed text-muted">
                      {t(
                        "Paiement par compte PayPal bientôt disponible. En attendant, choisissez une autre méthode ci-dessus.",
                        "PayPal account payments are coming soon. In the meantime, choose another method above.",
                        "الدفع بحساب PayPal سيتوفر قريباً. في انتظار ذلك، اختاروا طريقة أخرى أعلاه.",
                      )}
                    </span>
                  </span>
                </div>
              </div>

              {paymentBlocked ? (
                <p className="mt-3 flex items-start gap-2 rounded-xl bg-gold/15 px-3.5 py-2.5 text-[0.66rem] leading-relaxed text-ink/80">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-terracotta" />
                  <span>
                    {t(
                      "Le paiement par carte internationale est en cours d’activation. Contactez-nous sur WhatsApp pour finaliser votre commande.",
                      "International card payment is being activated. Contact us on WhatsApp to complete your order.",
                      "الدفع الدولي بالبطاقة قيد التفعيل. تواصلوا معنا عبر واتساب لإتمام طلبكم.",
                    )}{" "}
                    <a
                      href={whatsappSupport}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-terracotta underline"
                    >
                      WhatsApp
                    </a>
                  </span>
                </p>
              ) : !isMorocco ? (
                <p className="mt-3 flex items-start gap-2 rounded-xl bg-surface/60 px-3.5 py-2.5 text-[0.66rem] leading-relaxed text-muted">
                  <Truck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-terracotta" />
                  {t(
                    "Pour les livraisons internationales, le paiement par carte est requis. Le change est calculé au moment de la commande.",
                    "International deliveries require card payment. The exchange rate is locked when you place the order.",
                  )}
                </p>
              ) : null}

              <div className="mt-4">
                <label htmlFor="checkout-note" className="field-label">
                  {t(
                    "Note pour l’atelier (optionnel)",
                    "Note for the atelier (optional)",
                  )}
                </label>
                <textarea
                  id="checkout-note"
                  value={form.note}
                  onChange={(event) => setField("note", event.target.value)}
                  rows={3}
                  placeholder={t(
                    "Un cadeau, une date de livraison, une question…",
                    "A gift, a delivery date, a question…",
                  )}
                  className="field-textarea"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || holdExpired || quoteLoading || paymentBlocked}
                className={cn(
                  "mt-5 flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold transition",
                  submitting || holdExpired || quoteLoading || paymentBlocked
                    ? "cursor-not-allowed bg-ink/15 text-ink/45"
                    : "bg-terracotta text-background hover:bg-terracottaDark hover:shadow-soft",
                )}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("Enregistrement…", "Placing order…")}
                  </>
                ) : (
                  <>
                    <LockKeyhole className="h-4 w-4" />
                    {t(
                      `Confirmer la commande · ${format(total)}`,
                      `Place order · ${format(total)}`,
                    )}
                  </>
                )}
              </button>

              <p className="mt-2.5 flex items-center justify-center gap-1.5 text-center text-[0.62rem] text-muted">
                <ShieldCheck className="h-3.5 w-3.5 text-terracotta" />
                {t(
                  "En confirmant, vous acceptez nos conditions de vente et de retour.",
                  "By confirming, you accept our terms of sale and returns.",
                )}
              </p>
            </section>
          </div>

          {/* Summary */}
          <aside className="lg:sticky lg:top-[5.6rem]">
            <div className="overflow-hidden rounded-[1.6rem] border border-line/80 bg-surface/40">
              <div className="border-b border-line/70 px-5 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-2xl font-semibold">
                    {t("Votre sélection", "Your selection")}
                  </h2>
                  <span className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-muted">
                    {cart.length} {cart.length === 1 ? t("pièce", "piece") : t("pièces", "pieces")}
                  </span>
                </div>
              </div>

              <div className="max-h-[22rem] space-y-3 overflow-y-auto p-4 scrollbar-soft">
                {cart.map((item) => (
                  <article key={item.id} className="flex gap-3">
                    <Link
                      href={`/rugs/${item.slug}`}
                      className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-wool"
                    >
                      {item.photo ? (
                        <Image
                          src={item.photo}
                          alt=""
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : null}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/rugs/${item.slug}`}
                        className="block truncate font-serif text-base font-semibold leading-tight hover:text-terracotta"
                      >
                        {locale === "ar" ? (item.nameAr ?? item.nameFr) : locale === "en" ? item.nameEn : item.nameFr}
                      </Link>
                      <p className="mt-0.5 text-[0.6rem] uppercase tracking-[0.14em] text-muted">
                        {item.sku}
                      </p>
                      <div className="mt-1.5 flex items-end justify-between gap-2">
                        <span className="text-[0.62rem] text-muted">
                          {t("Quantité 1", "Qty 1")}
                        </span>
                        <span className="font-serif text-base font-semibold">
                          {formatRug(item)}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="border-t border-line/70 px-5 py-4">
                <div className="flex gap-2">
                  <input
                    value={promoInput}
                    onChange={(event) => setPromoInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleApplyPromo();
                      }
                    }}
                    placeholder={t("Code promo", "Promo code")}
                    className="h-9 min-w-0 flex-1 rounded-xl border border-line bg-background px-3 text-[0.7rem] uppercase tracking-[0.06em] outline-none focus:border-terracotta"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    className="h-9 rounded-xl bg-ink px-3.5 text-[0.64rem] font-semibold text-background transition hover:bg-terracotta"
                  >
                    {t("Appliquer", "Apply")}
                  </button>
                </div>

                {promo ? (
                  <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-[0.68rem] text-emerald-800">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <Check className="h-3.5 w-3.5" />
                      {promo.code} · −{promo.percent}%
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        removePromo();
                        setPromoMessage(null);
                      }}
                      className="grid h-5 w-5 place-items-center rounded-full hover:bg-emerald-100"
                      aria-label={t("Retirer le code", "Remove code")}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : promoMessage ? (
                  <p
                    className={cn(
                      "mt-2 text-[0.66rem]",
                      promoMessage.ok ? "text-emerald-700" : "text-red-600",
                    )}
                  >
                    {promoMessage.text}
                  </p>
                ) : null}

                <dl className="mt-4 space-y-2 text-[0.75rem]">
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
                    <dt className="flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5 text-terracotta" />
                      {t("Livraison", "Shipping")}
                    </dt>
                    <dd>
                      {quoteLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : quote ? (
                        format(shipping)
                      ) : quoteError ? (
                        <span className="text-red-600">{t("Indisponible", "Unavailable")}</span>
                      ) : (
                        "—"
                      )}
                    </dd>
                  </div>
                  {quote ? (
                    <div className="flex justify-between text-[0.65rem] text-muted/80">
                      <dt>
                        {quote.carrier ?? "DHL"} · {totalWeight.toFixed(1)} kg
                      </dt>
                      <dd>
                        {quote.estimatedDaysMin}–{quote.estimatedDaysMax}{" "}
                        {t("jours", "days")}
                      </dd>
                    </div>
                  ) : null}
                  <div className="flex items-baseline justify-between border-t border-line/70 pt-2.5">
                    <dt className="text-sm font-semibold text-ink">
                      {t("Total", "Total")}
                    </dt>
                    <dd className="font-serif text-2xl font-semibold text-ink">
                      {format(total)}
                    </dd>
                  </div>
                </dl>

                {quoteError ? (
                  <p className="mt-2 text-[0.66rem] leading-relaxed text-red-600">
                    {quoteError}
                  </p>
                ) : null}

                <div className="mt-3 flex flex-wrap gap-1.5 text-[0.56rem] font-semibold uppercase tracking-[0.12em] text-muted">
                  <span className="rounded-full border border-line bg-background px-2.5 py-1">
                    CMI
                  </span>
                  <span className="rounded-full border border-line bg-background px-2.5 py-1">
                    Stripe
                  </span>
                  <span className="rounded-full border border-line bg-background px-2.5 py-1">
                    Visa
                  </span>
                  <span className="rounded-full border border-line bg-background px-2.5 py-1">
                    Mastercard
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-start gap-2.5 rounded-2xl border border-line/70 bg-background px-4 py-3 text-[0.66rem] leading-relaxed text-muted">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" />
              <span>
                {t(
                  "Paiement chiffré. Si une pièce venait à être réservée entre-temps, la commande serait annulée et vous seriez remboursé intégralement.",
                  "Encrypted payment. If a piece is reserved in the meantime, the order is cancelled and fully refunded.",
                )}
              </span>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}
