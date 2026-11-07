"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Check,
  ChevronDown,
  Clock3,
  Heart,
  Leaf,
  MapPin,
  Maximize2,
  Package,
  Play,
  Ruler,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  Weight,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { RugCard } from "@/components/RugCard";
import { useStore } from "@/context/StoreContext";
import type { SerializedRug } from "@/lib/api/serializers";
import { rugTypeLabel } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { getRugWhatsAppLink } from "@/lib/whatsapp";

interface ProductViewProps {
  rug: SerializedRug;
  related: SerializedRug[];
}

const VIDEO_SECONDS = 20;

export function ProductView({ rug, related }: ProductViewProps) {
  const {
    addToCart,
    formatRug,
    t,
    locale,
    favorites,
    toggleFavorite,
  } = useStore();
  const reduceMotion = useReducedMotion();
  const isFavorite = favorites.includes(rug.id);

  const [activePhoto, setActivePhoto] = useState(0);
  const [lens, setLens] = useState({
    active: false,
    x: 0,
    y: 0,
    bgX: 50,
    bgY: 50,
  });
  const [videoOpen, setVideoOpen] = useState(false);
  const [videoSeconds, setVideoSeconds] = useState(VIDEO_SECONDS);
  const [videoError, setVideoError] = useState(false);
  const [added, setAdded] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);

  // Count one product view per browser session. The API increments atomically
  // and failures are ignored: analytics must never block the storefront.
  useEffect(() => {
    const key = `zarbia.viewed.${rug.id}`;

    try {
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, "1");
    } catch {
      return;
    }

    void fetch(`/api/rugs/${encodeURIComponent(rug.slug)}/view`, {
      method: "POST",
      keepalive: true,
    }).catch(() => undefined);
  }, [rug.id, rug.slug]);

  const photo = rug.photos[activePhoto] ?? rug.photos[0] ?? null;
  const sold = rug.status === "SOLD";
  const reserved =
    rug.status === "RESERVED" &&
    Boolean(
      rug.reservedUntil &&
        new Date(rug.reservedUntil).getTime() > Date.now(),
    );
  const available = !sold && !reserved;

  const areaM2 = useMemo(
    () => (rug.widthCm * rug.lengthCm) / 10_000,
    [rug.lengthCm, rug.widthCm],
  );

  const whatsappLink = useMemo(
    () =>
      getRugWhatsAppLink(
        {
          slug: rug.slug,
          sku: rug.sku,
          nameFr: rug.nameFr,
          nameEn: rug.nameEn,
          widthCm: rug.widthCm,
          lengthCm: rug.lengthCm,
          priceMad: rug.priceMad,
        },
        { locale },
      ),
    [locale, rug],
  );

  useEffect(() => {
    if (!videoOpen) {
      setVideoSeconds(VIDEO_SECONDS);
      return;
    }

    const started = Date.now();
    const timer = window.setInterval(() => {
      const remaining = Math.max(
        0,
        VIDEO_SECONDS - Math.floor((Date.now() - started) / 1000),
      );
      setVideoSeconds(remaining);

      if (remaining === 0) {
        window.clearInterval(timer);
        setVideoOpen(false);
      }
    }, 250);

    return () => window.clearInterval(timer);
  }, [videoOpen]);

  useEffect(() => {
    if (!videoOpen) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setVideoOpen(false);
    }

    document.addEventListener("keydown", onEscape);

    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onEscape);
    };
  }, [videoOpen]);

  function handleAddToCart() {
    if (!available) return;
    addToCart(rug);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);
  }

  function handleLensMove(event: MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setLens({
      active: true,
      x,
      y,
      bgX: Math.max(0, Math.min(100, (x / rect.width) * 100)),
      bgY: Math.max(0, Math.min(100, (y / rect.height) * 100)),
    });
  }

  const availabilityLabel = sold
    ? t("Vendue — pièce unique", "Sold — one of a kind")
    : reserved
      ? t("Réservée pour un autre client", "Reserved for another client")
      : rug.isMadeToOrder
        ? t("Sur commande — 6 à 10 semaines", "Made to order — 6 to 10 weeks")
        : t("En stock — expédiée sous 48 h", "In stock — ships within 48 h");

  return (
    <div className="min-h-screen">
      <div className="container-page pt-6">
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
          <Link
            href={`/shop?type=${rug.type}`}
            className="transition hover:text-terracotta"
          >
            {rugTypeLabel(rug.type, locale)}
          </Link>
          <span>/</span>
          <span className="text-ink/65">
            {locale === "ar" ? (rug.nameAr ?? rug.nameFr) : locale === "en" ? rug.nameEn : rug.nameFr}
          </span>
        </nav>
      </div>

      <section className="container-page grid gap-10 py-8 lg:grid-cols-[1.08fr_0.92fr] lg:gap-14 lg:py-12">
        {/* Gallery */}
        <div className="grid gap-3 sm:grid-cols-[5rem_1fr] lg:sticky lg:top-[5.6rem] lg:self-start">
          <div className="order-2 flex gap-2 overflow-x-auto pb-1 no-scrollbar sm:order-1 sm:max-h-[42rem] sm:flex-col sm:overflow-y-auto sm:pr-1 scrollbar-soft">
            {rug.photos.map((src, index) => (
              <button
                key={`${src}-${index}`}
                type="button"
                onClick={() => setActivePhoto(index)}
                aria-label={t(
                  `Voir la photo ${index + 1}`,
                  `View photo ${index + 1}`,
                )}
                aria-pressed={activePhoto === index}
                className={cn(
                  "relative h-20 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-wool transition sm:h-[5.4rem] sm:w-full",
                  activePhoto === index
                    ? "border-terracotta"
                    : "border-transparent opacity-65 hover:opacity-100",
                )}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>

          <div
            ref={galleryRef}
            className="group relative order-1 overflow-hidden rounded-[1.6rem] bg-wool ring-1 ring-line/70 transition duration-500 hover:ring-gold/50 sm:order-2 sm:rounded-[2rem]"
            onMouseMove={handleLensMove}
            onMouseLeave={() =>
              setLens((current) => ({ ...current, active: false }))
            }
          >
            <div className="relative aspect-[4/5] w-full">
              {photo ? (
                <Image
                  src={photo}
                  alt={
                    locale === "ar"
                      ? `${rug.nameAr ?? rug.nameFr} — ${rugTypeLabel(rug.type, locale)}`
                      : locale === "en"
                        ? `${rug.nameAr ?? rug.nameEn} — ${rugTypeLabel(rug.type, locale)}`
                        : `${rug.nameFr} — ${rugTypeLabel(rug.type, locale)}`
                  }
                  fill
                  priority
                  sizes="(min-width: 1024px) 52vw, 100vw"
                  className="object-cover transition duration-500"
                />
              ) : null}

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/18 via-transparent to-transparent" />

              <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                <span
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[0.58rem] font-bold uppercase tracking-[0.16em] shadow-sm backdrop-blur",
                    sold
                      ? "bg-ink/85 text-background"
                      : reserved
                        ? "bg-gold/90 text-ink"
                        : "bg-background/90 text-ink",
                  )}
                >
                  {sold
                    ? t("Vendue", "Sold")
                    : reserved
                      ? t("Réservée", "Reserved")
                      : rug.isMadeToOrder
                        ? t("Sur commande", "Made to order")
                        : t("1 en stock", "1 in stock")}
                </span>
                {rug.certificateId ? (
                  <span className="flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1.5 text-[0.58rem] font-bold uppercase tracking-[0.12em] text-ink shadow-sm backdrop-blur">
                    <BadgeCheck className="h-3 w-3 text-gold" />
                    {t("Certifiée", "Certified", "معتمدة")}
                  </span>
                ) : null}
              </div>

              {rug.videoUrl ? (
                <button
                  type="button"
                  onClick={() => {
                    setVideoError(false);
                    setVideoOpen(true);
                  }}
                  className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full border border-white/20 bg-ink/65 py-2 pl-2 pr-4 text-[0.64rem] font-semibold text-background backdrop-blur transition hover:bg-terracotta"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-background text-ink">
                    <Play className="ml-0.5 h-3 w-3 fill-current" />
                  </span>
                  {t("Voir le film 20 s", "Watch the 20s film")}
                </button>
              ) : null}

              <span className="absolute bottom-4 right-4 rounded-full bg-background/85 px-3 py-1.5 font-mono text-[0.62rem] font-semibold text-ink backdrop-blur">
                {activePhoto + 1} / {rug.photos.length}
              </span>

              <span className="pointer-events-none absolute right-4 top-4 hidden items-center gap-1.5 rounded-full bg-background/80 px-2.5 py-1.5 text-[0.55rem] font-bold uppercase tracking-[0.12em] text-ink/70 backdrop-blur lg:flex">
                <Maximize2 className="h-3 w-3" />
                {t("Survolez pour zoomer", "Hover to zoom")}
              </span>

              {lens.active && photo ? (
                <div
                  aria-hidden
                  className="pointer-events-none absolute hidden h-40 w-40 rounded-full border-2 border-background/80 shadow-lift lg:block"
                  style={{
                    left: lens.x - 80,
                    top: lens.y - 80,
                    backgroundImage: `url(${photo})`,
                    backgroundSize: "230%",
                    backgroundPosition: `${lens.bgX}% ${lens.bgY}%`,
                  }}
                />
              ) : null}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="lg:py-2">
          <div className="flex items-center justify-between gap-3">
            <p className="eyebrow flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5" />
              {rugTypeLabel(rug.type, locale)} · {rug.sku}
            </p>
            <button
              type="button"
              onClick={() => toggleFavorite(rug.id)}
              aria-pressed={isFavorite}
              aria-label={
                isFavorite
                  ? t("Retirer des favoris", "Remove from favourites")
                  : t("Ajouter aux favoris", "Add to favourites")
              }
              className={cn(
                "grid h-9 w-9 shrink-0 place-items-center rounded-full border transition",
                isFavorite
                  ? "border-terracotta bg-terracotta text-background"
                  : "border-line text-ink/55 hover:border-terracotta hover:text-terracotta",
              )}
            >
              <Heart
                className={cn("h-4 w-4", isFavorite && "fill-current")}
              />
            </button>
          </div>
          <h1 className="mt-3 text-balance font-serif text-[2.6rem] font-semibold leading-[0.98] tracking-[-0.025em] sm:text-5xl">
            {locale === "ar" ? (rug.nameAr ?? rug.nameFr) : locale === "en" ? rug.nameEn : rug.nameFr}
          </h1>
          <p className="mt-3 flex items-center gap-1.5 text-sm text-muted">
            <MapPin className="h-4 w-4 text-terracotta" />
            {rug.originVillage} · {locale === "ar" ? (rug.originAr ?? rug.originRegion) : rug.originRegion}
          </p>

          <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-y border-line/80 py-5">
            <div>
              <p className="font-serif text-4xl font-semibold leading-none">
                {formatRug(rug)}
              </p>
              <p className="mt-1.5 text-[0.68rem] text-muted">
                {formatRug(rug, "EUR")} · {formatRug(rug, "USD")}
              </p>
            </div>
            <div className="text-right">
              <p
                className={cn(
                  "flex items-center justify-end gap-1.5 text-[0.68rem] font-semibold",
                  sold
                    ? "text-muted"
                    : reserved
                      ? "text-gold"
                      : "text-emerald-700",
                )}
              >
                <span className="status-dot" />
                {availabilityLabel}
              </p>
              <p className="mt-1 text-[0.62rem] uppercase tracking-[0.12em] text-muted">
                {t("Certificat nominatif inclus", "Named certificate included")}
              </p>
            </div>
          </div>

          <p className="mt-5 text-pretty text-sm leading-relaxed text-ink/70">
            {locale === "ar" ? (rug.storyAr ?? rug.storyFr) : locale === "en" ? rug.storyEn : rug.storyFr}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {[
              {
                icon: Ruler,
                label: t("Dimensions", "Dimensions"),
                value: `${rug.widthCm} × ${rug.lengthCm} cm`,
                sub: `${areaM2.toFixed(1)} m²`,
              },
              {
                icon: Weight,
                label: t("Poids", "Weight"),
                value: `${rug.weightKg.toFixed(1)} kg`,
                sub: t("Laine et trame", "Wool and warp"),
              },
              {
                icon: Clock3,
                label: t("Tissage", "Weaving"),
                value: `${rug.craftingDays} ${t("jours", "days")}`,
                sub: t("Temps de métier", "Hands-on time"),
              },
              {
                icon: Leaf,
                label: t("Matière", "Material"),
                value: locale === "ar" ? rug.materialFr : locale === "en" ? "Natural wool" : "Laine naturelle",
                sub: locale === "ar" ? "Teinture végétale" : locale === "en" ? "Plant-dyed" : "Teinture végétale",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-line/80 bg-surface/35 p-3.5"
              >
                <item.icon className="h-4 w-4 text-terracotta" />
                <p className="mt-2.5 text-[0.56rem] font-bold uppercase tracking-[0.14em] text-muted">
                  {item.label}
                </p>
                <p className="mt-1 text-[0.82rem] font-semibold text-ink">
                  {item.value}
                </p>
                <p className="mt-0.5 text-[0.6rem] text-muted">{item.sub}</p>
              </div>
            ))}
          </div>

          <p className="mt-4 text-[0.72rem] leading-relaxed text-muted">
            <span className="font-semibold text-ink/75">
              {t("Matières :", "Materials:")}
            </span>{" "}
            {locale === "ar" ? (rug.materialAr ?? rug.materialFr) : locale === "en" ? rug.materialEn : rug.materialFr}
          </p>

          <div className="mt-6 space-y-2.5">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!available}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold transition",
                available
                  ? added
                    ? "bg-emerald-700 text-white"
                    : "bg-terracotta text-background hover:bg-terracottaDark hover:shadow-soft"
                  : "cursor-not-allowed bg-ink/10 text-ink/40",
              )}
            >
              {added ? (
                <>
                  <Check className="h-4 w-4" />
                  {t("Ajoutée au panier", "Added to cart")}
                </>
              ) : sold ? (
                <>
                  <ShoppingBag className="h-4 w-4" />
                  {t("Pièce vendue", "Sold piece")}
                </>
              ) : reserved ? (
                <>
                  <Clock3 className="h-4 w-4" />
                  {t("Réservée pour 15 minutes", "Reserved for 15 minutes")}
                </>
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4" />
                  {t("Ajouter au panier", "Add to cart")}
                </>
              )}
            </button>

            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-full border border-[#1f7a53]/30 bg-[#1f7a53]/[0.06] px-6 py-3.5 text-sm font-semibold text-[#1f7a53] transition hover:bg-[#1f7a53] hover:text-white"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12.04 2.001a9.84 9.84 0 0 0-8.42 14.94L2.1 21.9l5.08-1.49A9.84 9.84 0 1 0 12.04 2Zm0 1.67a8.17 8.17 0 1 1-4.17 15.22l-.3-.18-3.01.88.9-2.94-.2-.31A8.17 8.17 0 0 1 12.04 3.67Zm-2.8 4.02c-.15 0-.39.06-.59.28-.2.22-.77.75-.77 1.83s.79 2.12.9 2.27c.11.15 1.53 2.44 3.78 3.32 1.87.73 2.25.59 2.66.55.41-.04 1.32-.54 1.51-1.06.19-.52.19-.97.13-1.06-.06-.09-.22-.15-.46-.27-.24-.12-1.4-.69-1.62-.77-.22-.08-.38-.12-.54.12-.16.24-.62.77-.76.93-.14.16-.28.18-.52.06-.24-.12-1.01-.37-1.92-1.18-.71-.63-1.19-1.4-1.33-1.64-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.19-.47-.39-.4-.54-.41l-.46-.01Z" />
              </svg>
              {sold
                ? t("Demander une pièce similaire", "Request a similar piece")
                : t("Réserver sur WhatsApp", "Reserve on WhatsApp")}
            </a>

            <p className="flex items-center justify-center gap-1.5 pt-1 text-center text-[0.63rem] text-muted">
              <ShieldCheck className="h-3.5 w-3.5 text-terracotta" />
              {t(
                "Paiement CMI, Stripe ou à la livraison au Maroc",
                "CMI, Stripe or cash on delivery in Morocco",
              )}
            </p>
          </div>

          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-gold/30 bg-gold/[0.07] p-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-background text-gold shadow-sm">
              <BadgeCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink/80">
                {t("Certificat d’authenticité", "Certificate of authenticity")}
              </p>
              <p className="mt-0.5 text-[0.7rem] leading-relaxed text-muted">
                {rug.certificateId
                  ? `${rug.certificateId} · `
                  : ""}
                {t(
                  "Signé par l’artisane et numéroté, remis avec le tapis.",
                  "Signed by the artisan and numbered, delivered with the rug.",
                )}
              </p>
            </div>
          </div>

          <div className="mt-6">
            {[
              {
                title: t("Histoire de la pièce", "Story of the piece"),
                icon: Sparkles,
                content: locale === "ar" ? (rug.storyAr ?? rug.storyFr) : locale === "en" ? rug.storyEn : rug.storyFr,
              },
              {
                title: t("Entretien de la laine", "Caring for the wool"),
                icon: Leaf,
                content: t(
                  "Aspirez sans brosse rotative, une fois par semaine. Pour une tache, tamponnez à l’eau froide avec un savon neutre, puis séchez à plat à l’ombre. Un nettoyage professionnel tous les trois à cinq ans suffit. Ne jamais brosser à sec ni utiliser d’eau de Javel.",
                  "Vacuum without a rotating brush once a week. For a stain, blot with cold water and a mild soap, then dry flat in the shade. A professional clean every three to five years is enough. Never dry-brush or use bleach.",
                ),
              },
              {
                title: t("Livraison & retours", "Shipping & returns"),
                icon: Truck,
                content: t(
                  "Emballage roulé sous housse protectrice, expédié par DHL ou Aramex avec suivi. Maroc : 1 à 3 jours ouvrés. Europe : 4 à 7 jours. Amérique du Nord : 6 à 10 jours. Retour accepté sous 14 jours si la pièce n’a pas été utilisée ; les frais de retour restent à votre charge.",
                  "Rolled in a protective sleeve and shipped with DHL or Aramex tracking. Morocco: 1–3 business days. Europe: 4–7 days. North America: 6–10 days. Returns accepted within 14 days if the piece is unused; return shipping is at your cost.",
                ),
              },
            ].map((section) => (
              <details
                key={section.title}
                className="group border-t border-line/80 py-4 last:border-b"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-ink/80 transition hover:text-terracotta">
                  <span className="flex items-center gap-2.5">
                    <section.icon className="h-4 w-4 text-terracotta" />
                    {section.title}
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted transition group-open:rotate-180" />
                </summary>
                <p className="mt-3 pl-6 text-[0.78rem] leading-relaxed text-muted">
                  {section.content}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Artisan */}
      {rug.artisan ? (
        <section className="border-y border-line/70 bg-surface/40">
          <div className="container-page grid gap-8 py-14 lg:grid-cols-[0.55fr_1.45fr] lg:items-center lg:gap-14">
            <div className="flex items-center gap-4 lg:block">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-wool lg:h-56 lg:w-full lg:rounded-[1.6rem]">
                {rug.artisan.photoUrl ? (
                  <Image
                    src={rug.artisan.photoUrl}
                    alt={
                      locale === "ar"
                        ? rug.artisan.nameFr
                        : locale === "en"
                          ? rug.artisan.nameEn
                          : rug.artisan.nameFr
                    }
                    fill
                    sizes="(min-width: 1024px) 26vw, 96px"
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="lg:mt-4">
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-terracotta">
                  {t("L’artisane", "The artisan")}
                </p>
                <p className="mt-1 font-serif text-2xl font-semibold">
                  {locale === "ar"
                    ? rug.artisan.nameFr
                    : locale === "en"
                      ? rug.artisan.nameEn
                      : rug.artisan.nameFr}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {rug.artisan.village} · {rug.artisan.region}
                </p>
              </div>
            </div>

            <div>
              <p className="eyebrow flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5" />
                {t("Derrière le métier", "Behind the craft")}
              </p>
              <blockquote className="mt-4 max-w-2xl font-serif text-2xl font-medium leading-[1.3] sm:text-3xl">
                {locale === "ar"
                  ? `« ${rug.artisan.bioFr} »`
                  : locale === "en"
                    ? `“${rug.artisan.bioEn}”`
                    : `« ${rug.artisan.bioFr} »`}
              </blockquote>
              <Link
                href="/our-story"
                className="mt-5 inline-flex items-center gap-1.5 border-b border-terracotta/30 pb-1 text-xs font-semibold text-terracotta transition hover:border-terracotta"
              >
                {t("Découvrir nos ateliers", "Discover our ateliers")}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {/* Related */}
      {related.length > 0 ? (
        <section className="container-page py-16 sm:py-20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">{t("Même famille", "Same family")}</p>
              <h2 className="mt-2 font-serif text-3xl font-semibold sm:text-4xl">
                {t(
                  "D’autres pièces à découvrir.",
                  "Other pieces to discover.",
                )}
              </h2>
            </div>
            <Link
              href={`/shop?type=${rug.type}`}
              className="group inline-flex items-center gap-2 text-sm font-semibold text-terracotta"
            >
              {t("Voir la collection", "See the collection")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item, index) => (
              <RugCard key={item.id} rug={item} index={index} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Video modal */}
      <AnimatePresence>
        {videoOpen ? (
          <div className="fixed inset-0 z-[90] grid place-items-center p-4">
            <motion.button
              type="button"
              aria-label={t("Fermer la vidéo", "Close video")}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setVideoOpen(false)}
              className="absolute inset-0 bg-ink/80 backdrop-blur-md"
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={t(
                "Film de l’atelier — 20 secondes",
                "Atelier film — 20 seconds",
              )}
              initial={reduceMotion ? false : { opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, scale: 0.97, y: 10 }}
              transition={{ duration: 0.3 }}
              className="relative w-full max-w-3xl overflow-hidden rounded-[1.6rem] border border-white/10 bg-ink shadow-lift"
            >
              <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 text-background">
                <div>
                  <p className="text-[0.56rem] font-bold uppercase tracking-[0.2em] text-gold">
                    {t("Film d’atelier", "Atelier film")}
                  </p>
                  <p className="mt-0.5 text-xs text-background/60">
                    {locale === "ar" ? (rug.nameAr ?? rug.nameFr) : locale === "en" ? rug.nameEn : rug.nameFr} ·{" "}
                    {rug.originVillage}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-background/10 px-2.5 py-1 font-mono text-[0.65rem] text-background/75">
                    00:{String(videoSeconds).padStart(2, "0")}
                  </span>
                  <button
                    type="button"
                    onClick={() => setVideoOpen(false)}
                    className="grid h-8 w-8 place-items-center rounded-full border border-background/20 text-background/75 transition hover:bg-background hover:text-ink"
                    aria-label={t("Fermer", "Close")}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="relative aspect-video bg-ink">
                {rug.videoUrl && !videoError ? (
                  <video
                    key={rug.videoUrl}
                    src={rug.videoUrl}
                    poster={rug.photos[0]}
                    autoPlay
                    muted
                    loop
                    playsInline
                    onError={() => setVideoError(true)}
                    className="h-full w-full object-cover"
                  />
                ) : rug.photos[0] ? (
                  <Image
                    src={rug.photos[0]}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 48rem, 100vw"
                    className="object-cover opacity-80"
                  />
                ) : null}

                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 to-transparent p-4 pt-12">
                  <div className="h-0.5 w-full overflow-hidden rounded-full bg-background/20">
                    <motion.div
                      className="h-full bg-gold"
                      initial={{ width: "0%" }}
                      animate={{
                        width: `${((VIDEO_SECONDS - videoSeconds) / VIDEO_SECONDS) * 100}%`,
                      }}
                      transition={{ ease: "linear", duration: 0.25 }}
                    />
                  </div>
                  <p className="mt-2 text-[0.62rem] text-background/65">
                    {videoError
                      ? t(
                          "Le film arrive bientôt. En attendant, voici la pièce dans son contexte.",
                          "The film is coming soon. Meanwhile, here is the piece in context.",
                        )
                      : t(
                          "Lecture automatique · 20 secondes · sans son",
                          "Autoplay · 20 seconds · muted",
                        )}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 px-4 py-3 text-[0.63rem] text-background/55">
                <span className="flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 text-gold" />
                  {t(
                    "Nouée à la main, sans gabarit.",
                    "Knotted by hand, without a template.",
                  )}
                </span>
                <Link
                  href="/our-story"
                  onClick={() => setVideoOpen(false)}
                  className="flex items-center gap-1.5 font-semibold text-background transition hover:text-gold"
                >
                  {t("Voir l’atelier", "Visit the atelier")}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
