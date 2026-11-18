"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Filter,
  Heart,
  RotateCcw,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { RugCard } from "@/components/RugCard";
import { useStore } from "@/context/StoreContext";
import type { SerializedRug } from "@/lib/api/serializers";
import { RUG_TYPES, rugTypeLabel, type Locale, type RugTypeValue } from "@/lib/i18n";
import { formatPrice } from "@/lib/money";
import { cn } from "@/lib/utils";

type AvailabilityFilter = "ALL" | "IN_STOCK" | "MADE_TO_ORDER" | "SOLD";
type SortKey = "newest" | "price_asc" | "price_desc" | "name_asc";

interface ShopViewProps {
  rugs: SerializedRug[];
  initialType: RugTypeValue | null;
}

function macroRegion(region: string): string {
  const value = region.toLowerCase();
  if (value.includes("moyen atlas") || value.includes("middle atlas")) {
    return "Moyen Atlas";
  }
  if (value.includes("haut atlas") || value.includes("high atlas")) {
    return "Haut Atlas";
  }
  if (value.includes("haouz")) return "Haouz";
  return region;
}

function regionLabel(region: string, locale: Locale): string {
  if (locale === "fr") return region;
  if (region === "Moyen Atlas" || region === "Middle Atlas") {
    return "Middle Atlas";
  }
  if (region === "Haut Atlas" || region === "High Atlas") return "High Atlas";
  if (region === "Haouz") return "Haouz plain";
  return region;
}

const SORT_OPTIONS: Array<{
  value: SortKey;
  labelFr: string;
  labelEn: string;
  labelAr: string;
}> = [
  { value: "newest", labelFr: "Nouveautés", labelEn: "Newest", labelAr: "الأحدث" },
  { value: "price_asc", labelFr: "Prix croissant", labelEn: "Price: low to high", labelAr: "السعر: من الأقل للأعلى" },
  {
    value: "price_desc",
    labelFr: "Prix décroissant",
    labelEn: "Price: high to low",
    labelAr: "السعر: من الأعلى للأقل",
  },
  { value: "name_asc", labelFr: "Ordre alphabétique", labelEn: "Alphabetical", labelAr: "أبجدي" },
];

export function ShopView({ rugs, initialType }: ShopViewProps) {
  const { t, locale, favorites } = useStore();
  const reduceMotion = useReducedMotion();

  const priceCeiling = useMemo(() => {
    const highest = rugs.reduce(
      (max, rug) => Math.max(max, rug.priceMad),
      0,
    );
    return Math.max(1000, Math.ceil(highest / 500) * 500);
  }, [rugs]);

  const [query, setQuery] = useState("");
  const [type, setType] = useState<RugTypeValue | "ALL">(initialType ?? "ALL");
  const [regions, setRegions] = useState<string[]>([]);
  const [availability, setAvailability] =
    useState<AvailabilityFilter>("ALL");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(priceCeiling);
  const [sort, setSort] = useState<SortKey>("newest");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const regionOptions = useMemo(() => {
    const unique = new Set(rugs.map((rug) => macroRegion(rug.originRegion)));
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [rugs]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const result = rugs.filter((rug) => {
      if (needle) {
        const haystack = [
          rug.nameFr,
          rug.nameEn,
          rug.nameAr ?? "",
          rug.sku,
          rug.storyFr,
          rug.storyEn,
          rug.materialFr,
          rug.materialEn,
          rug.originVillage,
          rug.originRegion,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(needle)) return false;
      }

      if (type !== "ALL" && rug.type !== type) return false;

      if (favoritesOnly && !favorites.includes(rug.id)) return false;

      if (
        regions.length > 0 &&
        !regions.includes(macroRegion(rug.originRegion))
      ) {
        return false;
      }

      if (availability === "IN_STOCK") {
        if (rug.status !== "AVAILABLE" || rug.isMadeToOrder) return false;
      } else if (availability === "MADE_TO_ORDER") {
        if (!rug.isMadeToOrder || rug.status === "SOLD") return false;
      } else if (availability === "SOLD") {
        if (rug.status !== "SOLD") return false;
      }

      if (rug.priceMad < minPrice || rug.priceMad > maxPrice) return false;

      return true;
    });

    return result.sort((a, b) => {
      switch (sort) {
        case "price_asc":
          return a.priceMad - b.priceMad;
        case "price_desc":
          return b.priceMad - a.priceMad;
        case "name_asc":
          return (locale === "ar" ? (a.nameAr ?? a.nameFr) : locale === "en" ? a.nameEn : a.nameFr).localeCompare(
            locale === "ar" ? (b.nameAr ?? b.nameFr) : locale === "en" ? b.nameEn : b.nameFr,
          );
        default:
          return (
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
          );
      }
    });
  }, [
    availability,
    favorites,
    favoritesOnly,
    locale,
    maxPrice,
    minPrice,
    query,
    regions,
    rugs,
    sort,
    type,
  ]);

  const activeFilterCount =
    (type === "ALL" ? 0 : 1) +
    regions.length +
    (availability === "ALL" ? 0 : 1) +
    (favoritesOnly ? 1 : 0) +
    (minPrice > 0 || maxPrice < priceCeiling ? 1 : 0);

  function toggleRegion(region: string) {
    setRegions((current) =>
      current.includes(region)
        ? current.filter((item) => item !== region)
        : [...current, region],
    );
  }

  function resetFilters() {
    setType("ALL");
    setRegions([]);
    setAvailability("ALL");
    setFavoritesOnly(false);
    setMinPrice(0);
    setMaxPrice(priceCeiling);
    setSort("newest");
  }

  const priceFormatter = (value: number) => formatPrice(value, "MAD");

  const filterPanel = (
    <div className="space-y-7">
      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-[0.66rem] font-bold uppercase tracking-[0.2em] text-ink/55">
            {t("Tradition", "Tradition")}
          </h2>
          {type !== "ALL" ? (
            <button
              type="button"
              onClick={() => setType("ALL")}
              className="text-[0.62rem] font-semibold text-terracotta underline underline-offset-2"
            >
              {t("Effacer", "Clear")}
            </button>
          ) : null}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setType("ALL")}
            className={cn("pill", type === "ALL" && "pill-active")}
          >
            {t("Toutes", "All")}
          </button>
          {RUG_TYPES.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setType(option.value)}
              className={cn("pill", type === option.value && "pill-active")}
            >
              {rugTypeLabel(option.value, locale)}
            </button>
          ))}
        </div>
      </section>

      <section className="border-t border-line/70 pt-6">
        <h2 className="text-[0.66rem] font-bold uppercase tracking-[0.2em] text-ink/55">
          {t("Région de l’Atlas", "Atlas region")}
        </h2>
        <div className="mt-3 space-y-2">
          {regionOptions.map((region) => {
            const checked = regions.includes(region);
            return (
              <button
                key={region}
                type="button"
                onClick={() => toggleRegion(region)}
                className="flex w-full items-center justify-between rounded-xl px-1 py-1.5 text-left text-sm text-ink/75 transition hover:text-terracotta"
                aria-pressed={checked}
              >
                <span className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "grid h-4 w-4 place-items-center rounded border transition",
                      checked
                        ? "border-terracotta bg-terracotta text-background"
                        : "border-line bg-background",
                    )}
                  >
                    {checked ? <Check className="h-3 w-3" /> : null}
                  </span>
                  {regionLabel(region, locale)}
                </span>
                <span className="text-[0.62rem] text-muted">
                  {rugs.filter((rug) => macroRegion(rug.originRegion) === region).length}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="border-t border-line/70 pt-6">
        <h2 className="text-[0.66rem] font-bold uppercase tracking-[0.2em] text-ink/55">
          {t("Disponibilité", "Availability")}
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {(
            [
              ["ALL", t("Toutes", "All")],
              ["IN_STOCK", t("En stock", "In stock")],
              ["MADE_TO_ORDER", t("Sur commande", "Made to order")],
              ["SOLD", t("Vendues", "Sold")],
            ] as Array<[AvailabilityFilter, string]>
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setAvailability(value)}
              className={cn("pill", availability === value && "pill-active")}
            >
              {label}
            </button>
          ))}

          {favorites.length > 0 ? (
            <button
              type="button"
              onClick={() => setFavoritesOnly((value) => !value)}
              className={cn(
                "pill flex items-center gap-1.5",
                favoritesOnly && "pill-active",
              )}
              aria-pressed={favoritesOnly}
            >
              <Heart
                className={cn(
                  "h-3 w-3",
                  favoritesOnly && "fill-current",
                )}
              />
              {t(
                `Favoris (${favorites.length})`,
                `Favourites (${favorites.length})`,
              )}
            </button>
          ) : null}
        </div>
      </section>

      <section className="border-t border-line/70 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[0.66rem] font-bold uppercase tracking-[0.2em] text-ink/55">
            {t("Budget", "Budget")}
          </h2>
          <span className="text-[0.62rem] text-muted">
            {priceFormatter(minPrice)} – {priceFormatter(maxPrice)}
          </span>
        </div>

        <div className="mt-4 space-y-4">
          <label className="block">
            <span className="flex items-center justify-between text-[0.64rem] text-muted">
              {t("Minimum", "Minimum")}
              <span className="font-semibold text-ink/70">
                {priceFormatter(minPrice)}
              </span>
            </span>
            <input
              type="range"
              min={0}
              max={priceCeiling}
              step={100}
              value={minPrice}
              onChange={(event) =>
                setMinPrice(
                  Math.min(Number(event.target.value), maxPrice),
                )
              }
              className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-line accent-terracotta"
            />
          </label>

          <label className="block">
            <span className="flex items-center justify-between text-[0.64rem] text-muted">
              {t("Maximum", "Maximum")}
              <span className="font-semibold text-ink/70">
                {priceFormatter(maxPrice)}
              </span>
            </span>
            <input
              type="range"
              min={0}
              max={priceCeiling}
              step={100}
              value={maxPrice}
              onChange={(event) =>
                setMaxPrice(
                  Math.max(Number(event.target.value), minPrice),
                )
              }
              className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-line accent-terracotta"
            />
          </label>
        </div>
      </section>

      <button
        type="button"
        onClick={resetFilters}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-line bg-background px-4 py-2.5 text-[0.68rem] font-semibold text-ink/70 transition hover:border-terracotta hover:text-terracotta"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        {t("Réinitialiser les filtres", "Reset all filters")}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="relative overflow-hidden border-b border-line/70">
        <Image
          src="https://images.unsplash.com/photo-1600166898405-da9535204843?auto=format&fit=crop&w=2560&q=90"
          alt={t("Galerie des tapis marocains authentiques", "Authentic Moroccan rugs gallery", "معرض الزرابي المغربية الأصيلة")}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/92 via-black/75 to-black/45" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30" />
        <div className="pointer-events-none absolute inset-0 bg-zellige opacity-20 mix-blend-overlay" />

        <div className="container-page relative z-10 py-16 sm:py-24 lg:py-28">
          <nav
            aria-label={t("Fil d’Ariane", "Breadcrumb", "مسار التنقل")}
            className="flex items-center gap-2 text-[0.66rem] uppercase tracking-[0.2em] text-white/70"
          >
            <Link href="/" className="transition hover:text-gold">
              {t("Accueil", "Home", "الرئيسية")}
            </Link>
            <span>/</span>
            <span className="text-gold font-semibold">{t("Boutique", "Shop", "المتجر")}</span>
          </nav>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-black/40 px-3.5 py-1 text-[0.64rem] font-bold uppercase tracking-[0.22em] text-gold shadow-sm backdrop-blur-md">
                <Sparkles className="h-3 w-3 text-gold" />
                {t("Collection permanente", "Permanent collection", "المجموعة الدائمة")}
              </span>
              <h1 className="mt-5 max-w-2xl text-balance font-serif text-[3.2rem] font-semibold leading-[0.96] tracking-[-0.035em] text-white drop-shadow-md sm:text-[4.4rem]">
                {t(
                  "Chaque pièce est une archive.",
                  "Every piece is an archive.",
                  "كل قطعة أرشيف بحد ذاتها.",
                )}
              </h1>
            </div>
            <p className="max-w-md text-base leading-[1.8] text-white/85 drop-shadow-sm lg:justify-self-end">
              {t(
                "Nous ne produisons pas de séries. Les tapis présentés ici ont été noués une seule fois, dans un village précis, par une artisane dont le nom figure sur le certificat.",
                "We do not produce collections. The rugs shown here were knotted once, in a specific village, by an artisan whose name appears on the certificate.",
                "نحن لا ننتج سلاسل. الزرابي المعروضة هنا نُسجت مرة واحدة، في قرية محددة، على يد حرفية يظهر اسمها على الشهادة.",
              )}
            </p>
          </div>

          <div className="mt-12 flex flex-wrap gap-x-12 gap-y-5 border-t border-white/20 pt-7 text-[0.66rem] uppercase tracking-[0.2em] text-white/80">
            <span>
              <strong className="stat-num mr-2 font-serif text-3xl font-bold text-gold drop-shadow-sm">
                {rugs.length}
              </strong>{" "}
              {t("pièces au catalogue", "pieces in the catalogue", "قطعة في الكتالوج")}
            </span>
            <span>
              <strong className="stat-num mr-2 font-serif text-3xl font-bold text-gold drop-shadow-sm">
                {regionOptions.length}
              </strong>{" "}
              {t("régions représentées", "regions represented", "منطقة ممثلة")}
            </span>
            <span>
              <strong className="stat-num mr-2 font-serif text-3xl font-bold text-gold drop-shadow-sm">
                5
              </strong>{" "}
              {t("traditions tissées", "woven traditions", "تقاليد منسوجة")}
            </span>
          </div>
        </div>
      </section>

      {/* Toolbar */}
      <div className="sticky top-[5rem] z-30 border-b border-line/70 bg-background/85 backdrop-blur-lg">
        <div className="container-page flex h-14 items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted rtl:left-auto rtl:right-3" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("Rechercher un tapis…", "Search rugs…", "ابحث عن زربية…")}
                className="h-9 w-44 rounded-full border border-line bg-background pl-9 pr-3 text-[0.7rem] text-ink outline-none transition placeholder:text-muted focus:border-terracotta sm:w-60 rtl:pl-3 rtl:pr-9"
              />
            </div>
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="flex items-center gap-2 rounded-full border border-line bg-background px-3.5 py-2 text-[0.68rem] font-semibold text-ink/75 transition hover:border-terracotta hover:text-terracotta lg:hidden"
            >
              <Filter className="h-3.5 w-3.5" />
              {t("Filtres", "Filters")}
              {activeFilterCount > 0 ? (
                <span className="grid h-4 min-w-4 place-items-center rounded-full bg-terracotta px-1 text-[0.55rem] text-background">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>

            <p className="hidden text-[0.68rem] font-medium text-muted sm:block">
              <span className="font-semibold text-ink">{filtered.length}</span>{" "}
              {filtered.length === 1
                ? t("pièce affichée", "piece shown")
                : t("pièces affichées", "pieces shown")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden text-[0.64rem] uppercase tracking-[0.14em] text-muted sm:inline">
              {t("Trier", "Sort")}
            </span>
            <div className="relative">
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as SortKey)}
                aria-label={t("Trier les tapis", "Sort rugs")}
                className="h-9 appearance-none rounded-full border border-line bg-background pl-3.5 pr-8 text-[0.66rem] font-semibold text-ink/75 outline-none transition focus:border-terracotta"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {locale === "ar" ? option.labelAr : locale === "en" ? option.labelEn : option.labelFr}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container-page grid gap-10 py-10 lg:grid-cols-[16rem_1fr] lg:gap-12 lg:py-14">
        <aside className="hidden lg:block">
          <div className="sticky top-[6.75rem] max-h-[calc(100vh-7.5rem)] overflow-y-auto pb-8 pr-2 scrollbar-soft">
            {filterPanel}
          </div>
        </aside>

        <div>
          {filtered.length === 0 ? (
            <div className="flex min-h-[26rem] flex-col items-center justify-center rounded-[2rem] border border-dashed border-line bg-surface/30 px-8 text-center">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-background text-terracotta shadow-sm">
                <Filter className="h-6 w-6" />
              </span>
              <h2 className="mt-5 font-serif text-3xl font-semibold">
                {t("Aucune pièce ne correspond.", "No piece matches.")}
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
                {t(
                  "Élargissez le budget ou retirez un filtre. La pièce que vous cherchez est peut-être encore sur le métier.",
                  "Widen the budget or remove a filter. The piece you are looking for may still be on the loom.",
                )}
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="btn-primary mt-6"
              >
                {t("Voir toutes les pièces", "See all pieces")}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <motion.div
              layout={!reduceMotion}
              className="grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 xl:grid-cols-3"
            >
              <AnimatePresence mode="popLayout" initial={false}>
                {filtered.map((rug, index) => (
                  <RugCard key={rug.id} rug={rug} index={index} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          <div className="mt-12 flex flex-col items-start justify-between gap-4 rounded-[1.6rem] border border-line/80 bg-surface/40 p-6 sm:flex-row sm:items-center">
            <div>
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-terracotta">
                {t("Vous ne trouvez pas ?", "Nothing quite right?")}
              </p>
              <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted">
                {t(
                  "Nous pouvons commander une pièce sur mesure à l’une de nos artisanes, dans vos dimensions et vos couleurs.",
                  "We can commission a bespoke piece from one of our artisans, in your dimensions and colours.",
                )}
              </p>
            </div>
            <Link href="/custom-order" className="btn-ghost shrink-0">
              {t("Créer sur mesure", "Create bespoke")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile filters */}
      <AnimatePresence>
        {mobileFiltersOpen ? (
          <div className="fixed inset-0 z-[75] lg:hidden">
            <motion.button
              type="button"
              aria-label={t("Fermer les filtres", "Close filters")}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileFiltersOpen(false)}
              className="absolute inset-0 bg-ink/35 backdrop-blur-[2px]"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={t("Filtres", "Filters")}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-[2rem] border-t border-line bg-background p-5 pb-8 shadow-lift scrollbar-soft"
            >
              <div className="flex items-center justify-between border-b border-line/70 pb-4">
                <div>
                  <p className="eyebrow">{t("Affiner", "Refine")}</p>
                  <h2 className="mt-1 font-serif text-2xl font-semibold">
                    {t("Filtres", "Filters")}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink/60"
                  aria-label={t("Fermer", "Close")}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5">{filterPanel}</div>

              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="btn-primary mt-6 w-full"
              >
                {t(
                  `Voir ${filtered.length} pièce${filtered.length > 1 ? "s" : ""}`,
                  `View ${filtered.length} piece${filtered.length === 1 ? "" : "s"}`,
                )}
                <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
