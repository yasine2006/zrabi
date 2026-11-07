"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Clock3,
  Layers,
  Loader2,
  Mail,
  MapPin,
  Palette,
  PencilRuler,
  Phone,
  Ruler,
  Scissors,
  Sparkles,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { useStore } from "@/context/StoreContext";
import {
  CUSTOM_LENGTH_STEP_CM,
  CUSTOM_MAX_LENGTH_CM,
  CUSTOM_MAX_WIDTH_CM,
  CUSTOM_MIN_LENGTH_CM,
  CUSTOM_MIN_WIDTH_CM,
  CUSTOM_PRICE_PER_M2,
  CUSTOM_WIDTH_STEP_CM,
  MAX_WOOL_COLOURS,
  WOOL_SWATCHES,
  customAreaM2,
  customBudgetMad,
  customDepositMad,
  customLeadTimeWeeks,
} from "@/lib/custom";
import { RUG_TYPES, type RugTypeValue, type Locale } from "@/lib/i18n";
import { FALLBACK_RATES, convertFromMad, formatPrice } from "@/lib/money";
import { cn } from "@/lib/utils";
import { getSupportWhatsAppLink } from "@/lib/whatsapp";

const PATTERNS = [
  {
    id: "diamonds",
    labelFr: "Losanges",
    labelEn: "Diamonds",
    hintFr: "Le répertoire berbère classique, rythmé et symétrique.",
    hintEn: "The classic Berber repertoire, rhythmic and symmetrical.",
  },
  {
    id: "frieze",
    labelFr: "Frises géométriques",
    labelEn: "Geometric friezes",
    hintFr: "Des bandes horizontales, comme un tissage de passage.",
    hintEn: "Horizontal bands, like a threshold weaving.",
  },
  {
    id: "floral",
    labelFr: "Motifs floraux",
    labelEn: "Floral motifs",
    hintFr: "Plus libre, inspiré des jardins de l’Atlas.",
    hintEn: "Freer, inspired by Atlas gardens.",
  },
  {
    id: "free",
    labelFr: "Composition libre",
    labelEn: "Free composition",
    hintFr: "Nous dessinons ensemble à partir de vos références.",
    hintEn: "We sketch together from your references.",
  },
] as const;

const TYPE_HINTS: Record<RugTypeValue, { fr: string; en: string; ar?: string }> = {
  BENI_OURAIN: {
    fr: "Laine épaisse, fond clair, dessin en relief.",
    en: "Thick wool, pale ground, raised linework.",
  },
  AZILAL: {
    fr: "Laine vive, motifs naïfs, couleurs végétales.",
    en: "Bright wool, naive motifs, plant dyes.",
  },
  BOUCHEROUITE: {
    fr: "Textile recyclé, matière dense et colorée.",
    en: "Recycled textile, dense and colourful.",
  },
  KILIM: {
    fr: "Tissage plat, motif reversé, plus léger.",
    en: "Flat weave, reversible motif, lighter.",
  },
  HANBEL: {
    fr: "Trame lourde, bandes sobres, usage quotidien.",
    en: "Heavy weft, quiet bands, everyday use.",
  },
};

interface Errors {
  fullName?: string;
  email?: string;
  phone?: string;
  colours?: string;
}

interface CustomOrderResponse {
  customOrder: {
    id: string;
    reference: string;
    status: string;
    budgetMad: number;
    deposit: {
      percent: number;
      amountMad: number;
      amount: number;
      currency: string;
      formatted: string;
    };
    woolColors: string[];
    pattern: string | null;
    createdAt: string;
  };
}

function typeLabel(type: RugTypeValue, locale: Locale): string {
  const found = RUG_TYPES.find((item) => item.value === type);
  if (!found) return type;
  return locale === "ar" ? found.labelFr : locale === "en" ? found.labelEn : found.labelFr;
}

export function CustomOrderView() {
  const { locale, t, currency } = useStore();
  const reduceMotion = useReducedMotion();

  const [type, setType] = useState<RugTypeValue>("BENI_OURAIN");
  const [widthCm, setWidthCm] = useState(200);
  const [lengthCm, setLengthCm] = useState(300);
  const [colours, setColours] = useState<string[]>(["ecru", "argile"]);
  const [pattern, setPattern] = useState<string>("diamonds");
  const [brief, setBrief] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CustomOrderResponse["customOrder"] | null>(
    null,
  );

  const area = customAreaM2(widthCm, lengthCm);
  const budgetMad = customBudgetMad(widthCm, lengthCm, type);
  const depositMad = customDepositMad(budgetMad);
  const lead = customLeadTimeWeeks(widthCm, lengthCm);
  const selectedPattern = PATTERNS.find((item) => item.id === pattern) ?? PATTERNS[0];

  const displayMad = (amount: number) =>
    currency === "MAD"
      ? formatPrice(amount, "MAD")
      : formatPrice(convertFromMad(amount, currency, FALLBACK_RATES), currency);

  const rateDisplay = displayMad(CUSTOM_PRICE_PER_M2[type]);

  const selectedWoolLabels = useMemo(
    () =>
      colours
        .map((id) => WOOL_SWATCHES.find((swatch) => swatch.id === id))
        .filter((swatch): swatch is (typeof WOOL_SWATCHES)[number] => Boolean(swatch))
        .map((swatch) => (locale === "ar" ? swatch.nameFr : locale === "en" ? swatch.nameEn : swatch.nameFr)),
    [colours, locale],
  );

  const whatsapp = getSupportWhatsAppLink({
    locale,
    message:
      locale === "ar"
        ? "مرحباً زربية أطلس، أصمم زربية حسب الطلب وأود نصيحة."
        : locale === "en"
          ? "Hello Zarbia Atlas, I am designing a bespoke rug and would like some advice."
          : "Bonjour Zarbia Atlas, je dessine un tapis sur mesure et j’aimerais un conseil.",
  });

  function toggleColour(id: string) {
    setColours((current) => {
      if (current.includes(id)) {
        return current.length === 1
          ? current
          : current.filter((item) => item !== id);
      }
      if (current.length >= MAX_WOOL_COLOURS) return current;
      return [...current, id];
    });
    setErrors((current) => ({ ...current, colours: undefined }));
  }

  function validate(): Errors {
    const next: Errors = {};

    if (fullName.trim().length < 2) {
      next.fullName = t("Indiquez votre nom complet.", "Enter your full name.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      next.email = t(
        "Indiquez une adresse e-mail valide.",
        "Enter a valid email address.",
      );
    }
    if (!/^\+?[0-9][0-9\s().-]{5,24}$/.test(phone.trim())) {
      next.phone = t(
        "Indiquez un numéro joignable (6 à 25 chiffres).",
        "Enter a reachable phone number (6–25 digits).",
      );
    }
    if (colours.length === 0) {
      next.colours = t(
        "Choisissez au moins une laine.",
        "Choose at least one wool colour.",
      );
    }

    return next;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      const first = Object.keys(nextErrors)[0];
      document.getElementById(`custom-${first}`)?.focus();
      return;
    }

    setSubmitting(true);

    const composedDescription = [
      `${typeLabel(type, "fr")} — ${widthCm} × ${lengthCm} cm (${area.toFixed(2)} m²).`,
      `Laines : ${selectedWoolLabels.join(", ")}.`,
      `Motif : ${selectedPattern.labelFr}.`,
      brief.trim(),
    ]
      .filter(Boolean)
      .join(" ");

    try {
      const response = await fetch("/api/custom-orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          rugType: type,
          widthCm,
          lengthCm,
          woolColors: colours,
          pattern: selectedPattern.labelFr,
          description: composedDescription,
          budgetMad,
          currency,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload?.error?.message ??
            t(
              "La demande n’a pas pu être envoyée.",
              "The request could not be sent.",
            ),
        );
      }

      setResult((payload as CustomOrderResponse).customOrder);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : t("Une erreur est survenue. Réessayez.", "Something went wrong."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="min-h-screen">
        <div className="container-page py-12 sm:py-16">
          <div className="mx-auto max-w-3xl">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="rounded-[2rem] border border-line/80 bg-surface/40 p-6 sm:p-10"
            >
              <span className="grid h-14 w-14 place-items-center rounded-full bg-background text-terracotta shadow-sm">
                <BadgeCheck className="h-7 w-7" />
              </span>
              <p className="eyebrow mt-5">
                {t("Demande enregistrée", "Request received")}
              </p>
              <h1 className="mt-2 text-balance font-serif text-4xl font-semibold sm:text-5xl">
                {t(
                  "Votre projet part à l’atelier.",
                  "Your project is on its way to the atelier.",
                )}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
                {t(
                  "Une artisane étudie vos dimensions et vos couleurs. Nous revenons vers vous sous 48 heures ouvrées avec un dessin, un devis ferme et la date de mise sur métier.",
                  "An artisan is reviewing your dimensions and colours. We will come back within two business days with a sketch, a firm quote and a loom date.",
                )}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-line/80 bg-background p-4">
                  <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-muted">
                    {t("Référence", "Reference")}
                  </p>
                  <p className="mt-1.5 font-mono text-sm font-semibold text-ink">
                    {result.reference}
                  </p>
                </div>
                <div className="rounded-2xl border border-line/80 bg-background p-4">
                  <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-muted">
                    {t("Budget indicatif", "Indicative budget")}
                  </p>
                  <p className="mt-1.5 font-serif text-xl font-semibold text-ink">
                    {displayMad(result.budgetMad)}
                  </p>
                </div>
                <div className="rounded-2xl border border-gold/40 bg-gold/[0.08] p-4">
                  <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-ink/60">
                    {t("Acompte 30 %", "30% deposit")}
                  </p>
                  <p className="mt-1.5 font-serif text-xl font-semibold text-ink">
                    {result.deposit.formatted}
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-line/70 bg-background px-4 py-4 text-[0.76rem] leading-relaxed text-muted">
                <p className="flex items-start gap-2">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" />
                  {t(
                    "Un récapitulatif part vers l’adresse indiquée. Aucun acompte n’est prélevé avant votre accord écrit sur le devis.",
                    "A summary is on its way to the email you gave. No deposit is taken before you approve the quote in writing.",
                  )}
                </p>
                <p className="mt-2 flex items-start gap-2">
                  <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" />
                  {t(
                    `Délai de tissage estimé : ${lead.min} à ${lead.max} semaines après validation.`,
                    `Estimated weaving time: ${lead.min} to ${lead.max} weeks after approval.`,
                  )}
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                >
                  {t("Parler à l’atelier", "Talk to the atelier")}
                  <ArrowRight className="h-4 w-4" />
                </a>
                <Link href="/shop" className="btn-ghost">
                  {t("Voir les pièces disponibles", "See available pieces")}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setResult(null);
                    setBrief("");
                  }}
                  className="text-xs font-semibold text-muted underline underline-offset-4 transition hover:text-terracotta"
                >
                  {t("Créer un autre projet", "Start another project")}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="relative overflow-hidden border-b border-line/70 bg-surface/35">
        <div className="pointer-events-none absolute inset-0 bg-zellige opacity-50" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold/[0.06] blur-3xl" />
        <div className="container-page relative py-14 sm:py-20">
          <nav
            aria-label={t("Fil d’Ariane", "Breadcrumb", "مسار التنقل")}
            className="flex items-center gap-2 text-[0.64rem] uppercase tracking-[0.18em] text-muted"
          >
            <Link href="/" className="transition hover:text-terracotta">
              {t("Accueil", "Home", "الرئيسية")}
            </Link>
            <span>/</span>
            <span className="text-ink/65">{t("Sur mesure", "Bespoke", "حسب الطلب")}</span>
          </nav>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <p className="eyebrow-line">
                {t("Commande sur mesure", "Bespoke commission", "طلب خاص")}
              </p>
              <h1 className="mt-4 max-w-2xl text-balance font-serif text-[2.9rem] font-semibold leading-[0.96] tracking-[-0.035em] sm:text-[4.2rem]">
                {t(
                  "Un tapis dessiné pour votre pièce.",
                  "A rug drawn for your room.",
                  "زربية مرسومة لغرفتك.",
                )}
              </h1>
            </div>
            <p className="max-w-md text-sm leading-[1.75] text-muted lg:justify-self-end">
              {t(
                "Choisissez la tradition, les dimensions et les laines. Le prix se calcule au mètre carré, en direct avec l’atelier, et un acompte de 30 % réserve votre place sur le métier.",
                "Choose the tradition, the dimensions and the wools. The price is calculated per square metre, directly with the atelier, and a 30% deposit reserves your place on the loom.",
                "اختر التقليد والمقاسات والصوف. يُحسب السعر بالمتر المربع، مباشرة مع الورشة، ودفعة مقدمة 30% تحجز مكانك على النول.",
              )}
            </p>
          </div>
        </div>
      </section>

      <div className="container-page grid gap-8 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:gap-12 lg:py-14">
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Tradition */}
          <section className="rounded-[1.6rem] border border-line/80 bg-background p-5 sm:p-6">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-surface text-terracotta">
                <Layers className="h-4 w-4" />
              </span>
              <div>
                <h2 className="font-serif text-2xl font-semibold leading-none">
                  01 · {t("La tradition", "The tradition")}
                </h2>
                <p className="mt-1 text-[0.68rem] text-muted">
                  {t(
                    "Chaque geste a un prix et un temps différents.",
                    "Each technique has its own price and pace.",
                  )}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {RUG_TYPES.map((option) => {
                const active = type === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setType(option.value)}
                    aria-pressed={active}
                    className={cn(
                      "flex flex-col items-start rounded-2xl border p-4 text-left transition",
                      active
                        ? "border-terracotta bg-surface/70 ring-1 ring-terracotta/30"
                        : "border-line bg-background hover:border-terracotta/40",
                    )}
                  >
                    <span className="flex w-full items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-ink">
                        {locale === "ar" ? option.labelFr : locale === "en" ? option.labelEn : option.labelFr}
                      </span>
                      <span
                        className={cn(
                          "grid h-4 w-4 place-items-center rounded-full border",
                          active
                            ? "border-terracotta bg-terracotta text-background"
                            : "border-line",
                        )}
                      >
                        {active ? <Check className="h-2.5 w-2.5" /> : null}
                      </span>
                    </span>
                    <span className="mt-1 text-[0.68rem] leading-relaxed text-muted">
                      {locale === "ar"
                        ? TYPE_HINTS[option.value].ar ?? TYPE_HINTS[option.value].fr
                        : locale === "en"
                          ? TYPE_HINTS[option.value].en
                          : TYPE_HINTS[option.value].fr}
                    </span>
                    <span className="mt-2 text-[0.66rem] font-semibold text-terracotta">
                      {displayMad(CUSTOM_PRICE_PER_M2[option.value])} / m²
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Dimensions */}
          <section className="rounded-[1.6rem] border border-line/80 bg-background p-5 sm:p-6">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-surface text-terracotta">
                <Ruler className="h-4 w-4" />
              </span>
              <div>
                <h2 className="font-serif text-2xl font-semibold leading-none">
                  02 · {t("Les dimensions", "The dimensions")}
                </h2>
                <p className="mt-1 text-[0.68rem] text-muted">
                  {t(
                    "Mesurez l’espace meublé, pas le mur nu.",
                    "Measure the furnished space, not the bare wall.",
                  )}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-5">
              <label className="block">
                <span className="flex items-baseline justify-between gap-3 text-[0.7rem] text-muted">
                  {t("Largeur", "Width")}
                  <span className="font-serif text-xl font-semibold text-ink">
                    {widthCm} cm
                  </span>
                </span>
                <input
                  type="range"
                  min={CUSTOM_MIN_WIDTH_CM}
                  max={CUSTOM_MAX_WIDTH_CM}
                  step={CUSTOM_WIDTH_STEP_CM}
                  value={widthCm}
                  onChange={(event) => setWidthCm(Number(event.target.value))}
                  className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-line accent-terracotta"
                  aria-label={t("Largeur en centimètres", "Width in centimetres")}
                />
                <span className="mt-1 flex justify-between text-[0.58rem] text-muted/70">
                  <span>{CUSTOM_MIN_WIDTH_CM} cm</span>
                  <span>{CUSTOM_MAX_WIDTH_CM} cm</span>
                </span>
              </label>

              <label className="block">
                <span className="flex items-baseline justify-between gap-3 text-[0.7rem] text-muted">
                  {t("Longueur", "Length")}
                  <span className="font-serif text-xl font-semibold text-ink">
                    {lengthCm} cm
                  </span>
                </span>
                <input
                  type="range"
                  min={CUSTOM_MIN_LENGTH_CM}
                  max={CUSTOM_MAX_LENGTH_CM}
                  step={CUSTOM_LENGTH_STEP_CM}
                  value={lengthCm}
                  onChange={(event) => setLengthCm(Number(event.target.value))}
                  className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-line accent-terracotta"
                  aria-label={t("Longueur en centimètres", "Length in centimetres")}
                />
                <span className="mt-1 flex justify-between text-[0.58rem] text-muted/70">
                  <span>{CUSTOM_MIN_LENGTH_CM} cm</span>
                  <span>{CUSTOM_MAX_LENGTH_CM} cm</span>
                </span>
              </label>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-surface/50 px-3.5 py-2.5 text-[0.68rem] text-muted">
              <Ruler className="h-3.5 w-3.5 text-terracotta" />
              <span>
                {t("Surface", "Area")}:{" "}
                <strong className="font-semibold text-ink">
                  {area.toFixed(2)} m²
                </strong>
              </span>
              <span className="h-3 w-px bg-line" />
              <span>
                {t("Tissage", "Weaving")}:{" "}
                <strong className="font-semibold text-ink">
                  {lead.min}–{lead.max} {t("semaines", "weeks")}
                </strong>
              </span>
            </div>
          </section>

          {/* Wool */}
          <section className="rounded-[1.6rem] border border-line/80 bg-background p-5 sm:p-6">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-surface text-terracotta">
                <Palette className="h-4 w-4" />
              </span>
              <div>
                <h2 className="font-serif text-2xl font-semibold leading-none">
                  03 · {t("Les laines", "The wools")}
                </h2>
                <p className="mt-1 text-[0.68rem] text-muted">
                  {t(
                    `Jusqu’à ${MAX_WOOL_COLOURS} teintes végétales. Les nuances réelles varient légèrement.`,
                    `Up to ${MAX_WOOL_COLOURS} plant-dyed shades. Real tones vary slightly.`,
                  )}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {WOOL_SWATCHES.map((swatch) => {
                const active = colours.includes(swatch.id);
                return (
                  <button
                    key={swatch.id}
                    type="button"
                    onClick={() => toggleColour(swatch.id)}
                    aria-pressed={active}
                    aria-label={
                      locale === "ar" ? swatch.nameFr : locale === "en" ? swatch.nameEn : swatch.nameFr
                    }
                    className={cn(
                      "group flex flex-col items-center gap-1.5 rounded-xl border p-2 transition",
                      active
                        ? "border-terracotta bg-surface/60"
                        : "border-line/70 bg-background hover:border-terracotta/40",
                    )}
                  >
                    <span
                      className="relative grid h-9 w-9 place-items-center rounded-full border border-ink/10 shadow-inner"
                      style={{ backgroundColor: swatch.hex }}
                    >
                      {active ? (
                        <Check
                          className={cn(
                            "h-4 w-4",
                            swatch.hex === "#2A211B" ||
                              swatch.hex === "#3D4C63" ||
                              swatch.hex === "#7C3B3B"
                              ? "text-background"
                              : "text-ink",
                          )}
                        />
                      ) : null}
                    </span>
                    <span className="text-[0.58rem] font-semibold text-ink/70">
                      {locale === "ar" ? swatch.nameFr : locale === "en" ? swatch.nameEn : swatch.nameFr}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="mt-3 text-[0.64rem] text-muted">
              {t("Sélection", "Selection")}:{" "}
              <span className="font-semibold text-ink/75">
                {selectedWoolLabels.join(" · ")}
              </span>
            </p>
            {errors.colours ? (
              <p className="mt-1 text-[0.65rem] text-red-600">{errors.colours}</p>
            ) : null}
          </section>

          {/* Pattern */}
          <section className="rounded-[1.6rem] border border-line/80 bg-background p-5 sm:p-6">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-surface text-terracotta">
                <Scissors className="h-4 w-4" />
              </span>
              <div>
                <h2 className="font-serif text-2xl font-semibold leading-none">
                  04 · {t("Le dessin", "The drawing")}
                </h2>
                <p className="mt-1 text-[0.68rem] text-muted">
                  {t(
                    "Une intention suffit ; l’atelier précise le motif.",
                    "An intention is enough; the atelier refines the motif.",
                  )}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {PATTERNS.map((option) => {
                const active = pattern === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setPattern(option.id)}
                    aria-pressed={active}
                    className={cn(
                      "rounded-xl border p-3 text-left transition",
                      active
                        ? "border-terracotta bg-surface/60"
                        : "border-line/70 bg-background hover:border-terracotta/40",
                    )}
                  >
                    <span className="flex items-center justify-between gap-2 text-[0.78rem] font-semibold text-ink">
                      {locale === "ar" ? option.labelFr : locale === "en" ? option.labelEn : option.labelFr}
                      {active ? (
                        <Check className="h-3.5 w-3.5 text-terracotta" />
                      ) : null}
                    </span>
                    <span className="mt-0.5 block text-[0.62rem] leading-relaxed text-muted">
                      {locale === "ar" ? option.hintFr : locale === "en" ? option.hintEn : option.hintFr}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4">
              <label htmlFor="custom-brief" className="field-label">
                {t(
                  "Votre intention (optionnel)",
                  "Your intention (optional)",
                )}
              </label>
              <textarea
                id="custom-brief"
                value={brief}
                onChange={(event) => setBrief(event.target.value)}
                rows={3}
                placeholder={t(
                  "Une pièce pour un salon lumineux, des tons chauds, un rappel du tapis de ma grand-mère…",
                  "A piece for a bright living room, warm tones, an echo of my grandmother’s rug…",
                )}
                className="field-textarea"
              />
            </div>
          </section>

          {/* Contact */}
          <section className="rounded-[1.6rem] border border-line/80 bg-background p-5 sm:p-6">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-surface text-terracotta">
                <UserRound className="h-4 w-4" />
              </span>
              <div>
                <h2 className="font-serif text-2xl font-semibold leading-none">
                  05 · {t("Vous joindre", "How to reach you")}
                </h2>
                <p className="mt-1 text-[0.68rem] text-muted">
                  {t(
                    "Aucun acompte avant validation du devis.",
                    "No deposit before the quote is approved.",
                  )}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="custom-fullName" className="field-label">
                  {t("Nom complet", "Full name")}
                </label>
                <input
                  id="custom-fullName"
                  value={fullName}
                  onChange={(event) => {
                    setFullName(event.target.value);
                    setErrors((current) => ({ ...current, fullName: undefined }));
                  }}
                  autoComplete="name"
                  placeholder={t(
                    "Amina El Fassi",
                    "Amina El Fassi",
                    "أمينة الفاسي",
                  )}
                  aria-invalid={Boolean(errors.fullName)}
                  className={cn("field", errors.fullName && "border-red-400")}
                />
                {errors.fullName ? (
                  <p className="mt-1 text-[0.65rem] text-red-600">
                    {errors.fullName}
                  </p>
                ) : null}
              </div>

              <div>
                <label htmlFor="custom-email" className="field-label">
                  {t("E-mail", "Email")}
                </label>
                <input
                  id="custom-email"
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setErrors((current) => ({ ...current, email: undefined }));
                  }}
                  autoComplete="email"
                  placeholder="vous@exemple.com"
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
                <label htmlFor="custom-phone" className="field-label">
                  {t("Téléphone / WhatsApp", "Phone / WhatsApp")}
                </label>
                <input
                  id="custom-phone"
                  type="tel"
                  value={phone}
                  onChange={(event) => {
                    setPhone(event.target.value);
                    setErrors((current) => ({ ...current, phone: undefined }));
                  }}
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

            {submitError ? (
              <p
                role="alert"
                className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[0.7rem] text-red-700"
              >
                {submitError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className={cn(
                "mt-4 flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold transition",
                submitting
                  ? "cursor-not-allowed bg-ink/15 text-ink/45"
                  : "bg-terracotta text-background hover:bg-terracottaDark hover:shadow-soft",
              )}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("Envoi à l’atelier…", "Sending to the atelier…")}
                </>
              ) : (
                <>
                  <PencilRuler className="h-4 w-4" />
                  {t("Envoyer le projet", "Send the project")}
                </>
              )}
            </button>
          </section>
        </form>

        {/* Live quote */}
        <aside className="lg:sticky lg:top-[5.6rem]">
          <div className="overflow-hidden rounded-[1.6rem] border border-line/80 bg-ink text-background shadow-lift">
            <div className="border-b border-white/10 px-5 py-4">
              <p className="flex items-center gap-1.5 text-[0.58rem] font-bold uppercase tracking-[0.2em] text-gold">
                <Sparkles className="h-3 w-3" />
                {t("Estimation en direct", "Live estimate")}
              </p>
              <p className="mt-1 font-serif text-2xl font-semibold">
                {typeLabel(type, locale)} · {widthCm} × {lengthCm}
              </p>
              <p className="mt-0.5 text-[0.66rem] text-background/55">
                {rateDisplay} / m² · {area.toFixed(2)} m²
              </p>
            </div>

            <div className="space-y-3 px-5 py-5">
              <div className="flex items-baseline justify-between">
                <span className="text-[0.68rem] uppercase tracking-[0.14em] text-background/55">
                  {t("Budget indicatif", "Indicative budget")}
                </span>
                <motion.span
                  key={budgetMad}
                  initial={reduceMotion ? false : { opacity: 0.35, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="font-serif text-3xl font-semibold text-background"
                >
                  {displayMad(budgetMad)}
                </motion.span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-gold/15 px-3.5 py-2.5">
                <span className="text-[0.64rem] font-semibold uppercase tracking-[0.12em] text-gold">
                  {t("Acompte 30 %", "30% deposit")}
                </span>
                <span className="font-serif text-xl font-semibold text-gold">
                  {displayMad(depositMad)}
                </span>
              </div>

              <dl className="space-y-2 border-t border-white/10 pt-3 text-[0.7rem] text-background/65">
                <div className="flex justify-between">
                  <dt>{t("Tradition", "Tradition")}</dt>
                  <dd className="text-background/85">{typeLabel(type, locale)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>{t("Surface", "Area")}</dt>
                  <dd className="text-background/85">{area.toFixed(2)} m²</dd>
                </div>
                <div className="flex justify-between">
                  <dt>{t("Laines", "Wools")}</dt>
                  <dd className="text-right text-background/85">
                    {colours.length}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>{t("Motif", "Pattern")}</dt>
                  <dd className="text-background/85">
                    {locale === "ar"
                      ? selectedPattern.labelFr
                      : locale === "en"
                        ? selectedPattern.labelEn
                        : selectedPattern.labelFr}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>{t("Tissage estimé", "Estimated weaving")}</dt>
                  <dd className="text-background/85">
                    {lead.min}–{lead.max} {t("sem.", "wks")}
                  </dd>
                </div>
              </dl>

              <p className="border-t border-white/10 pt-3 text-[0.62rem] leading-relaxed text-background/45">
                {t(
                  "Estimation indicative. Le devis ferme est établi après étude du dessin et du métrage exact. Le solde est réglé à l’expédition.",
                  "Indicative estimate. The firm quote follows a review of the drawing and exact yardage. The balance is paid before shipping.",
                )}
              </p>
            </div>
          </div>

          <div className="mt-3 grid gap-2 text-[0.66rem] leading-relaxed text-muted">
            <p className="flex items-start gap-2 rounded-xl border border-line/70 bg-background px-3.5 py-2.5">
              <BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
              {t(
                "Certificat nominatif et signature de l’artisane inclus.",
                "Named certificate and the artisan’s signature included.",
              )}
            </p>
            <p className="flex items-start gap-2 rounded-xl border border-line/70 bg-background px-3.5 py-2.5">
              <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-terracotta" />
              {t(
                "Un appel de 15 minutes pour caler les couleurs avant de monter le métier.",
                "A 15-minute call to settle the colours before the loom is set.",
              )}
            </p>
            <p className="flex items-start gap-2 rounded-xl border border-line/70 bg-background px-3.5 py-2.5">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-terracotta" />
              {t(
                "Tissé à Aït Bouguemez, expédié depuis Marrakech.",
                "Woven in Aït Bouguemez, shipped from Marrakech.",
              )}
            </p>
          </div>

          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center justify-center gap-2 rounded-full border border-line bg-background px-5 py-3 text-sm font-semibold text-ink/75 transition hover:border-terracotta hover:text-terracotta"
          >
            {t("Un doute ? Écrivez-nous", "Unsure? Message us")}
            <ArrowRight className="h-4 w-4" />
          </a>
        </aside>
      </div>
    </div>
  );
}
