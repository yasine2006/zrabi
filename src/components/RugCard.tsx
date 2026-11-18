"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Heart, Plus, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/context/StoreContext";
import type { SerializedRug } from "@/lib/api/serializers";
import { rugTypeLabel } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface RugCardProps {
  rug: SerializedRug;
  priority?: boolean;
  index?: number;
}

export function RugCard({ rug, priority = false, index = 0 }: RugCardProps) {
  const {
    addToCart,
    formatRug,
    t,
    locale,
    favorites,
    toggleFavorite,
  } = useStore();
  const [hovered, setHovered] = useState(false);
  const reduceMotion = useReducedMotion();
  const isFavorite = favorites.includes(rug.id);

  const primary = rug.photos[0];
  const secondary = rug.photos[1] ?? primary;
  const sold = rug.status === "SOLD";
  const reserved =
    rug.status === "RESERVED" &&
    Boolean(rug.reservedUntil && new Date(rug.reservedUntil).getTime() > Date.now());
  const unavailable = sold || reserved;

  const availability = sold
    ? t("Vendu", "Sold", "مباع")
    : reserved
      ? t("Réservé", "Reserved", "محجوز")
      : rug.isMadeToOrder
        ? t("Sur commande", "Made to Order", "حسب الطلب")
        : t(
            `${Math.max(rug.stock, 1)} en stock`,
            `${Math.max(rug.stock, 1)} in stock`,
            `${Math.max(rug.stock, 1)} في المخزون`,
          );

  return (
    <motion.article
      layout
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.04, 0.2) }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="group relative flex h-full flex-col rounded-3xl transition-all duration-500 ease-out hover:-translate-y-2"
    >
      <Link
        href={`/rugs/${rug.slug}`}
        className="relative block overflow-hidden rounded-[1.6rem] bg-wool ring-1 ring-line/70 transition-all duration-500 ease-out group-hover:ring-gold/60 group-hover:shadow-card"
        aria-label={
          locale === "ar"
            ? `عرض ${rug.nameAr ?? rug.nameFr}`
            : locale === "en"
              ? `View ${rug.nameEn}`
              : `Découvrir ${rug.nameFr}`
        }
      >
        <div className="relative aspect-[4/5] w-full">
          {primary ? (
            <motion.div
              className="absolute inset-0"
              animate={{ scale: hovered && !reduceMotion ? 1.055 : 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <Image
                src={primary}
                alt={locale === "ar" ? (rug.nameAr ?? rug.nameFr) : locale === "en" ? rug.nameEn : rug.nameFr}
                fill
                priority={priority}
                unoptimized
                sizes="(min-width: 1280px) 24vw, (min-width: 768px) 45vw, 90vw"
                className="object-cover"
              />
            </motion.div>
          ) : null}

          {secondary && secondary !== primary ? (
            <motion.div
              className="absolute inset-0"
              initial={false}
              animate={{ opacity: hovered && !reduceMotion ? 1 : 0 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
            >
              <Image
                src={secondary}
                alt=""
                fill
                unoptimized
                sizes="(min-width: 1280px) 24vw, (min-width: 768px) 45vw, 90vw"
                className="object-cover"
              />
            </motion.div>
          ) : null}

          <div className="absolute inset-0 bg-gradient-to-t from-ink/24 via-transparent to-transparent opacity-60" />
          <div className="pointer-events-none absolute inset-0 rounded-[1.6rem] ring-1 ring-inset ring-white/10" />

          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5 pr-12">
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[0.58rem] font-bold uppercase tracking-[0.14em] shadow-sm backdrop-blur",
                sold
                  ? "bg-ink/80 text-background"
                  : reserved
                    ? "bg-gold/90 text-ink"
                    : "bg-background/90 text-ink",
              )}
            >
              {availability}
            </span>
            {rug.isMadeToOrder && !sold ? (
              <span className="rounded-full bg-terracotta/90 px-2.5 py-1 text-[0.58rem] font-bold uppercase tracking-[0.14em] text-background shadow-sm backdrop-blur">
                {t("Atelier", "Atelier", "الورشة")}
              </span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              toggleFavorite(rug.id);
            }}
            aria-pressed={isFavorite}
            aria-label={
              isFavorite
                ? t("Retirer des favoris", "Remove from favourites", "إزالة من المفضلة")
                : t("Ajouter aux favoris", "Add to favourites", "إضافة إلى المفضلة")
            }
            className={cn(
              "absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full shadow-sm backdrop-blur transition",
              isFavorite
                ? "bg-terracotta text-background"
                : "bg-background/85 text-ink/60 hover:bg-background hover:text-terracotta",
            )}
          >
            <Heart
              className={cn("h-4 w-4", isFavorite && "fill-current")}
            />
          </button>

          <motion.div
            initial={false}
            animate={{
              opacity: hovered && !unavailable ? 1 : 0,
              y: hovered && !unavailable ? 0 : 8,
            }}
            transition={{ duration: 0.25 }}
            className="absolute bottom-3 right-3"
          >
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                addToCart(rug);
              }}
              className="flex items-center gap-1.5 rounded-full bg-background px-3.5 py-2 text-[0.68rem] font-semibold text-ink shadow-soft transition hover:bg-terracotta hover:text-background"
              aria-label={t("Ajouter au panier", "Add to cart", "أضف إلى السلة")}
            >
              <Plus className="h-3.5 w-3.5" />
              {t("Ajouter", "Add", "أضف")}
            </button>
          </motion.div>

          {sold ? (
            <div className="absolute inset-0 grid place-items-center bg-background/30 backdrop-blur-[1px]">
              <span className="rounded-full border border-background/60 bg-ink/70 px-4 py-2 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-background">
                {t("Pièce vendue", "Sold piece", "قطعة مباعة")}
              </span>
            </div>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col px-1 pt-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-terracotta/85">
              {rugTypeLabel(rug.type, locale)}
            </p>
            <h3 className="mt-1.5 font-serif text-[1.45rem] font-semibold leading-[1.1] tracking-[-0.02em]">
              <Link
                href={`/rugs/${rug.slug}`}
                className="transition hover:text-terracotta"
              >
                {locale === "ar" ? (rug.nameAr ?? rug.nameFr) : locale === "en" ? rug.nameEn : rug.nameFr}
              </Link>
            </h3>
          </div>
          <Link
            href={`/rugs/${rug.slug}`}
            className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line/80 text-ink/45 transition hover:border-terracotta hover:text-terracotta"
            aria-label={t("Voir la pièce", "View piece", "عرض القطعة")}
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <p className="mt-2 flex items-center gap-1.5 text-[0.7rem] text-muted">
          <span className="tabular">{rug.widthCm} × {rug.lengthCm} cm</span>
          <span className="h-1 w-1 rounded-full bg-line" />
          <span>
            {locale === "ar"
              ? (rug.originAr ?? rug.originVillage)
              : rug.originVillage}
          </span>
        </p>

        <div className="mt-4 h-px w-full bg-gradient-to-r from-line/80 via-line/40 to-transparent" />

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div>
            <p className="tabular font-serif text-[1.35rem] font-semibold leading-none">
              {formatRug(rug)}
            </p>
            <p className="tabular mt-1.5 text-[0.64rem] tracking-wide text-muted">
              {formatRug(rug, "EUR")} · {formatRug(rug, "USD")}
            </p>
          </div>

          <button
            type="button"
            onClick={() => addToCart(rug)}
            disabled={unavailable}
            className={cn(
              "grid h-9 w-9 place-items-center rounded-full border transition",
              unavailable
                ? "cursor-not-allowed border-line text-muted/40"
                : "border-line text-ink/60 hover:border-terracotta hover:bg-terracotta hover:text-background",
            )}
            aria-label={t("Ajouter au panier", "Add to cart", "أضف إلى السلة")}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </motion.article>
  );
}
