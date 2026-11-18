"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Film,
  Heart,
  Leaf,
  MapPin,
  Maximize2,
  Minimize2,
  Package,
  Play,
  RotateCcw,
  Ruler,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  Weight,
  X,
  ZoomIn,
  ZoomOut,
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

function parseVideoSource(url: string | null | undefined): {
  type: "youtube" | "vimeo" | "video";
  src: string;
} | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Ignore accidental image URLs
  if (
    /\.(jpe?g|png|webp|avif|gif)(\?.*)?$/i.test(trimmed) ||
    trimmed.includes("bing.net") ||
    trimmed.includes("images.unsplash.com")
  ) {
    return null;
  }

  // YouTube
  const ytMatch = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i,
  );
  if (ytMatch) {
    return {
      type: "youtube",
      src: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&rel=0`,
    };
  }

  // Vimeo
  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeoMatch) {
    return {
      type: "vimeo",
      src: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`,
    };
  }

  return { type: "video", src: trimmed };
}

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

  const videoSource = useMemo(() => parseVideoSource(rug.videoUrl), [rug.videoUrl]);
  const [mediaMode, setMediaMode] = useState<"photo" | "video">("photo");
  const [activePhoto, setActivePhoto] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [lens, setLens] = useState({
    active: false,
    x: 0,
    y: 0,
    bgX: 50,
    bgY: 50,
  });
  const [videoOpen, setVideoOpen] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [videoExpanded, setVideoExpanded] = useState(false);
  const [added, setAdded] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Count one product view per browser session.
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

  // Lock scroll and handle escape/arrow navigation when zoom or video modal is open
  useEffect(() => {
    if (!zoomOpen && !videoOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setZoomOpen(false);
        setVideoOpen(false);
      } else if (zoomOpen && (e.key === "ArrowRight" || e.key === "ArrowDown")) {
        setActivePhoto((prev) => (prev + 1) % rug.photos.length);
        setZoomLevel(1);
      } else if (zoomOpen && (e.key === "ArrowLeft" || e.key === "ArrowUp")) {
        setActivePhoto((prev) => (prev - 1 + rug.photos.length) % rug.photos.length);
        setZoomLevel(1);
      }
    }

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [zoomOpen, videoOpen, rug.photos.length]);

  useEffect(() => {
    if (!videoOpen && mediaMode !== "video") return;
    const video = videoRef.current;
    if (!video) return;
    setVideoError(false);
    const play = () => {
      const promise = video.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch(() => {
          // Autoplay can be blocked in some browsers; controls are visible.
        });
      }
    };
    if (video.readyState >= 2) {
      play();
    } else {
      video.addEventListener("canplay", play, { once: true });
    }
    return () => {
      video.removeEventListener("canplay", play);
    };
  }, [videoOpen, mediaMode, videoSource]);

  function selectPhoto(index: number) {
    setActivePhoto(index);
    setMediaMode("photo");
    setZoomLevel(1);
  }

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
        <div className="grid gap-3 sm:grid-cols-[5.5rem_1fr] lg:sticky lg:top-[5.6rem] lg:self-start">
          {/* Thumbnails strip */}
          <div className="order-2 flex gap-2.5 overflow-x-auto pb-1 no-scrollbar sm:order-1 sm:max-h-[44rem] sm:flex-col sm:overflow-y-auto sm:pr-1 scrollbar-soft">
            {rug.photos.map((src, index) => (
              <button
                key={`${src}-${index}`}
                type="button"
                onClick={() => selectPhoto(index)}
                aria-label={t(
                  `Voir la photo ${index + 1}`,
                  `View photo ${index + 1}`,
                  `عرض الصورة ${index + 1}`,
                )}
                aria-pressed={mediaMode === "photo" && activePhoto === index}
                className={cn(
                  "group relative h-20 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-wool transition sm:h-[5.4rem] sm:w-full",
                  mediaMode === "photo" && activePhoto === index
                    ? "border-terracotta ring-2 ring-terracotta/30"
                    : "border-transparent opacity-70 hover:opacity-100",
                )}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  unoptimized
                  sizes="90px"
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
              </button>
            ))}

            {videoSource ? (
              <button
                type="button"
                onClick={() => {
                  setMediaMode("video");
                  setVideoError(false);
                }}
                aria-label={t("Voir la vidéo", "Watch video", "مشاهدة الفيديو")}
                aria-pressed={mediaMode === "video"}
                className={cn(
                  "group relative h-20 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-ink transition sm:h-[5.4rem] sm:w-full",
                  mediaMode === "video"
                    ? "border-gold ring-2 ring-gold/40 shadow-luxury"
                    : "border-transparent opacity-80 hover:opacity-100",
                )}
              >
                {rug.photos[0] ? (
                  <Image
                    src={rug.photos[0]}
                    alt=""
                    fill
                    unoptimized
                    sizes="90px"
                    className="object-cover opacity-40 transition duration-300 group-hover:opacity-60"
                  />
                ) : null}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-gradient-to-t from-black/80 via-black/40 to-black/20 p-1 text-center">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-gold text-ink shadow-md transition group-hover:scale-110">
                    <Play className="ml-0.5 h-3 w-3 fill-current" />
                  </span>
                  <span className="text-[0.55rem] font-bold uppercase tracking-wider text-gold">
                    {t("Vidéo", "Video", "فيديو")}
                  </span>
                </div>
              </button>
            ) : null}
          </div>

          {/* Main viewer */}
          <div
            ref={galleryRef}
            className="group relative order-1 overflow-hidden rounded-[1.6rem] bg-wool ring-1 ring-line/70 transition duration-500 hover:ring-gold/50 sm:order-2 sm:rounded-[2rem]"
            onMouseMove={mediaMode === "photo" ? handleLensMove : undefined}
            onMouseLeave={() =>
              setLens((current) => ({ ...current, active: false }))
            }
          >
            <div className="relative aspect-[4/5] w-full bg-ink">
              {mediaMode === "video" && videoSource ? (
                /* Inline Video Player */
                <div className="relative h-full w-full bg-black">
                  <div className="absolute left-3 right-3 top-3 z-20 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-black/75 px-3 py-1 text-[0.68rem] font-semibold text-gold backdrop-blur">
                      <Film className="h-3 w-3" />
                      {t("Vidéo d'atelier", "Atelier video", "فيديو من الورشة")}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setVideoExpanded(true);
                          setVideoOpen(true);
                        }}
                        className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/70 px-3 py-1 text-[0.68rem] font-semibold text-white backdrop-blur transition hover:bg-white/20"
                      >
                        <Maximize2 className="h-3 w-3" />
                        <span className="hidden sm:inline">
                          {t("Plein écran", "Full screen", "ملء الشاشة")}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMediaMode("photo")}
                        className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/70 px-3 py-1 text-[0.68rem] font-semibold text-white backdrop-blur transition hover:bg-white/20"
                      >
                        <X className="h-3 w-3" />
                        <span className="hidden sm:inline">
                          {t("Fermer", "Close", "إغلاق")}
                        </span>
                      </button>
                    </div>
                  </div>

                  {videoSource.type === "youtube" || videoSource.type === "vimeo" ? (
                    <iframe
                      src={videoSource.src}
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                      className="h-full w-full border-0"
                    />
                  ) : !videoError ? (
                    <video
                      key={videoSource.src}
                      ref={videoRef}
                      src={videoSource.src}
                      poster={rug.photos[0]}
                      controls
                      autoPlay
                      loop
                      playsInline
                      onError={() => setVideoError(true)}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="grid h-full place-items-center p-6 text-center text-xs text-white/70">
                      <p>
                        {t(
                          "La vidéo est en cours de traitement ou introuvable.",
                          "The video is processing or unavailable.",
                          "الفيديو غير متوفر حالياً.",
                        )}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* Photo Mode with Zoom trigger */
                <>
                  {photo ? (
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setZoomLevel(1);
                        setZoomOpen(true);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setZoomLevel(1);
                          setZoomOpen(true);
                        }
                      }}
                      className="relative h-full w-full cursor-zoom-in"
                      aria-label={t(
                        "Cliquer pour agrandir la photo en plein écran",
                        "Click to view full screen zoom",
                        "اضغط لتكبير الصورة في شاشة كاملة",
                      )}
                    >
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
                        unoptimized
                        sizes="(min-width: 1024px) 52vw, 100vw"
                        className="object-cover transition duration-500"
                      />
                    </div>
                  ) : null}

                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/20 via-transparent to-transparent" />

                  {/* Stock & certified badges */}
                  <div className="absolute left-4 top-4 flex flex-wrap gap-2 z-10 pointer-events-none">
                    <span
                      className={cn(
                        "rounded-full px-3 py-1.5 text-[0.6rem] font-bold uppercase tracking-[0.16em] shadow-sm backdrop-blur",
                        sold
                          ? "bg-ink/85 text-background"
                          : reserved
                            ? "bg-gold/90 text-ink"
                            : "bg-background/90 text-ink",
                      )}
                    >
                      {sold
                        ? t("Vendue", "Sold", "مباعة")
                        : reserved
                          ? t("Réservée", "Reserved", "محجوزة")
                          : rug.isMadeToOrder
                            ? t("Sur commande", "Made to order", "حسب الطلب")
                            : t("1 en stock", "1 in stock", "1 في المخزن")}
                    </span>
                    {rug.certificateId ? (
                      <span className="flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1.5 text-[0.6rem] font-bold uppercase tracking-[0.12em] text-ink shadow-sm backdrop-blur">
                        <BadgeCheck className="h-3.5 w-3.5 text-gold" />
                        {t("Certifiée", "Certified", "معتمدة")}
                      </span>
                    ) : null}
                  </div>

                  {/* Zoom button on mobile & PC */}
                  <button
                    type="button"
                    onClick={() => {
                      setZoomLevel(1.5);
                      setZoomOpen(true);
                    }}
                    className="absolute right-4 top-4 z-10 flex items-center gap-1.5 rounded-full border border-black/10 bg-background/90 px-3.5 py-1.5 text-xs font-semibold text-ink shadow-md backdrop-blur transition hover:scale-105 hover:bg-gold hover:text-ink active:scale-95"
                    aria-label={t("Zoomer sur la laine", "Zoom in on wool", "تكبير تفاصيل الصوف")}
                  >
                    <ZoomIn className="h-3.5 w-3.5 text-terracotta" />
                    <span>{t("Zoomer", "Zoom", "تكبير")}</span>
                  </button>

                  {/* Watch Video button (if video is available) */}
                  {videoSource ? (
                    <button
                      type="button"
                      onClick={() => {
                        setMediaMode("video");
                        setVideoError(false);
                      }}
                      className="group/vbtn absolute bottom-4 left-4 z-10 flex items-center gap-2.5 rounded-full border border-gold/40 bg-ink/90 py-2 pl-2.5 pr-4 text-xs font-semibold text-gold shadow-luxury backdrop-blur transition hover:scale-105 hover:bg-gold hover:text-ink"
                    >
                      <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-gold text-ink shadow">
                        <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
                        <span className="absolute -inset-1 animate-ping rounded-full bg-gold/40 opacity-75" />
                      </span>
                      <span>
                        {t("Regarder la vidéo", "Watch the video", "مشاهدة الفيديو")}
                      </span>
                    </button>
                  ) : null}

                  {/* Photo counter */}
                  <span className="absolute bottom-4 right-4 z-10 rounded-full bg-background/85 px-3 py-1.5 font-mono text-[0.65rem] font-semibold text-ink shadow-sm backdrop-blur">
                    {activePhoto + 1} / {rug.photos.length}
                  </span>

                  {/* Desktop hover magnifying lens */}
                  {lens.active && photo ? (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute hidden h-44 w-44 rounded-full border-2 border-background/90 shadow-lift lg:block"
                      style={{
                        left: lens.x - 88,
                        top: lens.y - 88,
                        backgroundImage: `url(${photo})`,
                        backgroundSize: "260%",
                        backgroundPosition: `${lens.bgX}% ${lens.bgY}%`,
                      }}
                    />
                  ) : null}
                </>
              )}
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
                  {t("Ajoutée au panier", "Added to cart", "تمت الإضافة للسلة")}
                </>
              ) : sold ? (
                <>
                  <ShoppingBag className="h-4 w-4" />
                  {t("Pièce vendue", "Sold piece", "قطعة مباعة")}
                </>
              ) : reserved ? (
                <>
                  <Clock3 className="h-4 w-4" />
                  {t("Réservée pour 15 minutes", "Reserved for 15 minutes", "محجوزة لمدة 15 دقيقة")}
                </>
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4" />
                  {t("Ajouter au panier", "Add to cart", "أضف إلى السلة")}
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
                ? t("Demander une pièce similaire", "Request a similar piece", "طلب قطعة مشابهة")
                : t("Commander sur WhatsApp", "Order on WhatsApp", "الطلب عبر واتساب")}
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

      {/* Fullscreen Zoom Lightbox Modal (Mobile & PC) */}
      <AnimatePresence>
        {zoomOpen ? (
          <div className="fixed inset-0 z-[100] flex flex-col bg-black/95 text-white backdrop-blur-xl">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6">
              <div>
                <p className="font-serif text-sm font-medium sm:text-base text-gold">
                  {locale === "ar" ? (rug.nameAr ?? rug.nameFr) : locale === "en" ? rug.nameEn : rug.nameFr}
                </p>
                <p className="text-[0.68rem] text-white/60">
                  {t("Photo", "Photo", "صورة")} {activePhoto + 1} / {rug.photos.length} · {t("Détail du tissage & laine", "Weaving & wool detail", "تفاصيل النسيج والصوف")}
                </p>
              </div>

              {/* Zoom controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoomLevel((lvl) => Math.max(1, lvl - 0.5))}
                  disabled={zoomLevel <= 1}
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/25 disabled:opacity-30 disabled:hover:bg-white/10"
                  aria-label={t("Dézoomer", "Zoom out", "تصغير")}
                  title={t("Dézoomer", "Zoom out", "تصغير")}
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(1)}
                  className="rounded-full border border-white/20 bg-white/10 px-3 py-1 font-mono text-xs text-white transition hover:bg-white/25"
                  title={t("Taille réelle", "Reset zoom", "الحجم الطبيعي")}
                >
                  {Math.round(zoomLevel * 100)}%
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel((lvl) => Math.min(3, lvl + 0.5))}
                  disabled={zoomLevel >= 3}
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/25 disabled:opacity-30 disabled:hover:bg-white/10"
                  aria-label={t("Zoomer", "Zoom in", "تكبير")}
                  title={t("Zoomer", "Zoom in", "تكبير")}
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomOpen(false)}
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-white/15 text-white transition hover:bg-terracotta"
                  aria-label={t("Fermer", "Close", "إغلاق")}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Main Zoom Area */}
            <div className="relative flex-1 overflow-auto p-4 sm:p-8 flex items-center justify-center select-none">
              {/* Prev / Next buttons */}
              {rug.photos.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePhoto((prev) => (prev - 1 + rug.photos.length) % rug.photos.length);
                      setZoomLevel(1);
                    }}
                    className="absolute left-3 sm:left-6 z-30 grid h-12 w-12 place-items-center rounded-full border border-white/20 bg-black/60 text-white shadow-lift backdrop-blur transition hover:scale-110 hover:bg-gold hover:text-black"
                    aria-label={t("Photo précédente", "Previous photo", "الصورة السابقة")}
                  >
                    <ChevronLeft className="h-6 w-6 rtl-flip" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePhoto((prev) => (prev + 1) % rug.photos.length);
                      setZoomLevel(1);
                    }}
                    className="absolute right-3 sm:right-6 z-30 grid h-12 w-12 place-items-center rounded-full border border-white/20 bg-black/60 text-white shadow-lift backdrop-blur transition hover:scale-110 hover:bg-gold hover:text-black"
                    aria-label={t("Photo suivante", "Next photo", "الصورة التالية")}
                  >
                    <ChevronRight className="h-6 w-6 rtl-flip" />
                  </button>
                </>
              ) : null}

              {/* Scalable Image Container */}
              <div
                className="relative max-h-[75vh] max-w-[90vw] cursor-pointer transition-transform duration-200 ease-out"
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: "center center",
                }}
                onClick={() => setZoomLevel((lvl) => (lvl === 1 ? 2 : 1))}
              >
                {photo ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={photo}
                    alt={rug.nameFr}
                    className="max-h-[75vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
                    draggable={false}
                  />
                ) : null}
              </div>
            </div>

            {/* Bottom thumbnail strip in zoom modal */}
            {rug.photos.length > 1 ? (
              <div className="flex items-center justify-center gap-2 overflow-x-auto border-t border-white/10 p-3 no-scrollbar">
                {rug.photos.map((src, idx) => (
                  <button
                    key={`zoom-thumb-${src}-${idx}`}
                    type="button"
                    onClick={() => {
                      setActivePhoto(idx);
                      setZoomLevel(1);
                    }}
                    className={cn(
                      "relative h-14 w-12 shrink-0 overflow-hidden rounded-lg border-2 transition",
                      activePhoto === idx
                        ? "border-gold ring-2 ring-gold/40 scale-105"
                        : "border-transparent opacity-50 hover:opacity-100",
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </AnimatePresence>

      {/* Fullscreen Video Modal */}
      <AnimatePresence>
        {videoOpen && videoSource ? (
          <div className="fixed inset-0 z-[100] grid place-items-center p-4">
            <motion.button
              type="button"
              aria-label={t("Fermer la vidéo", "Close video", "إغلاق الفيديو")}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setVideoOpen(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, scale: 0.97, y: 10 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "relative w-full overflow-hidden rounded-[1.8rem] border border-white/15 bg-ink shadow-2xl transition-[max-width] duration-300",
                videoExpanded ? "max-w-[96vw]" : "max-w-4xl",
              )}
            >
              <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-3.5 text-white">
                <div>
                  <p className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-gold">
                    {t("Vidéo d’atelier", "Atelier film", "فيديو أصيل من الورشة")}
                  </p>
                  <p className="mt-0.5 font-serif text-sm text-white/90">
                    {locale === "ar" ? (rug.nameAr ?? rug.nameFr) : locale === "en" ? rug.nameEn : rug.nameFr} ·{" "}
                    {rug.originVillage}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setVideoExpanded((v) => !v)}
                    className="grid h-9 w-9 place-items-center rounded-full border border-white/20 text-white/80 transition hover:bg-white/20 hover:text-white"
                    aria-label={videoExpanded ? t("Réduire", "Shrink", "تصغير") : t("Agrandir", "Expand", "تكبير")}
                    title={videoExpanded ? t("Réduire", "Shrink", "تصغير") : t("Agrandir", "Expand", "تكبير")}
                  >
                    {videoExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoOpen(false)}
                    className="grid h-9 w-9 place-items-center rounded-full border border-white/20 text-white/80 transition hover:bg-terracotta hover:text-white"
                    aria-label={t("Fermer", "Close", "إغلاق")}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div
                className={cn(
                  "relative bg-black flex items-center justify-center",
                  videoExpanded ? "h-[80vh]" : "aspect-video",
                )}
              >
                {videoSource.type === "youtube" || videoSource.type === "vimeo" ? (
                  <iframe
                    src={videoSource.src}
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full border-0"
                  />
                ) : !videoError ? (
                  <video
                    key={videoSource.src}
                    ref={videoRef}
                    src={videoSource.src}
                    poster={rug.photos[0]}
                    autoPlay
                    controls
                    loop
                    playsInline
                    preload="auto"
                    onError={() => setVideoError(true)}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="grid h-full place-items-center p-6 text-center text-xs text-white/70">
                    <p>
                      {t(
                        "La vidéo est en cours de traitement ou indisponible.",
                        "The video is processing or unavailable.",
                        "الفيديو غير متوفر حالياً.",
                      )}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 px-5 py-3 text-xs text-white/70 bg-ink/90 border-t border-white/10">
                <span className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gold" />
                  {t(
                    "Nouée à la main par nos maîtresses artisanes de l'Atlas.",
                    "Knotted by hand by our Atlas master artisans.",
                    "منسوجة يدوياً بواسطة معلمات الأطلس.",
                  )}
                </span>
                <Link
                  href="/our-story"
                  onClick={() => setVideoOpen(false)}
                  className="flex items-center gap-1.5 font-semibold text-gold transition hover:underline"
                >
                  {t("Découvrir l’atelier", "Visit atelier", "زيارة الورشة")}
                  <ArrowRight className="h-3.5 w-3.5 rtl-flip" />
                </Link>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
