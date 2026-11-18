"use client";

import { ArrowRight, ArrowUpRight, Clock3, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { type Locale } from "@/lib/i18n";
import {
  BLOG_POSTS,
  formatBlogDate,
  normalizeBlogPosts,
  type NormalizedBlogPost,
} from "@/lib/blog";
import { useEffect, useState } from "react";

function nbTitle(p: NormalizedBlogPost, locale: Locale): string {
  return locale === "ar" ? p.titleAr : locale === "en" ? p.titleEn : p.titleFr;
}
function nbExcerpt(p: NormalizedBlogPost, locale: Locale): string {
  return locale === "ar" ? p.excerptAr : locale === "en" ? p.excerptEn : p.excerptFr;
}
function nbCategory(p: NormalizedBlogPost, locale: Locale): string {
  return locale === "ar" ? p.categoryAr : locale === "en" ? p.categoryEn : p.categoryFr;
}

function PostMeta({
  post,
  locale,
}: {
  post: NormalizedBlogPost;
  locale: Locale;
}) {
  return (
    <span className="flex flex-wrap items-center gap-2 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-muted">
      <span className="text-terracotta">{nbCategory(post, locale)}</span>
      <span className="h-1 w-1 rounded-full bg-line" />
      <span>{formatBlogDate(post.publishedAt, locale)}</span>
      <span className="h-1 w-1 rounded-full bg-line" />
      <span className="flex items-center gap-1">
        <Clock3 className="h-3 w-3" />
        {post.readingMinutes} min
      </span>
    </span>
  );
}

export function BlogIndexView() {
  const { locale, t } = useStore();
  const [posts, setPosts] = useState<NormalizedBlogPost[]>(() =>
    normalizeBlogPosts(BLOG_POSTS as any[]),
  );

  useEffect(() => {
    fetch("/api/blog?limit=100")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.posts) && data.posts.length > 0) {
          const db = normalizeBlogPosts(data.posts);
          // Merge DB posts with hardcoded, dedup by slug (DB wins).
          const map = new Map<string, NormalizedBlogPost>();
          for (const p of db) map.set(p.slug, p);
          for (const p of normalizeBlogPosts(BLOG_POSTS as any[])) {
            if (!map.has(p.slug)) map.set(p.slug, p);
          }
          setPosts(Array.from(map.values()));
        }
      })
      .catch(() => {});
  }, []);

  const [featured, ...rest] = posts;

  return (
    <div className="min-h-screen">
      {/* Header Hero */}
      <section className="relative overflow-hidden border-b border-line/70 bg-ink text-white">
        <Image
          src="https://images.unsplash.com/photo-1539020140153-e479b8c22e70?auto=format&fit=crop&w=2000&q=85"
          alt="Architecture et artisanat marocain"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/92 via-black/75 to-black/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40" />
        <div className="container-page relative z-10 py-16 sm:py-24">
          <nav
            aria-label={t("Fil d’Ariane", "Breadcrumb", "مسار التنقل")}
            className="flex items-center gap-2 text-[0.66rem] uppercase tracking-[0.2em] text-white/60"
          >
            <Link href="/" className="transition hover:text-gold">
              {t("Accueil", "Home", "الرئيسية")}
            </Link>
            <span>/</span>
            <span className="text-gold">{t("Journal", "Journal", "المدونة")}</span>
          </nav>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1 text-[0.7rem] font-medium tracking-[0.2em] text-gold uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                {t("Le journal de l’Atlas", "The Atlas journal", "مدونة الأطلس")}
              </span>
              <h1 className="mt-5 max-w-2xl text-balance font-serif text-[2.9rem] font-semibold leading-[1.02] tracking-[-0.035em] text-white sm:text-[4.2rem]">
                {t(
                  "Comprendre ce que l’on pose sous ses pieds.",
                  "Understanding what you put underfoot.",
                  "فهم ما تضعه تحت قدميك.",
                )}
              </h1>
            </div>
            <p className="max-w-md text-sm leading-[1.8] text-white/80 lg:justify-self-end">
              {t(
                "Des guides précis sur les traditions, l’entretien et les dimensions. Écrits avec les artisanes, pas avec un catalogue.",
                "Precise guides on traditions, care and dimensions. Written with the artisans, not with a catalogue.",
                "أدلة دقيقة حول التقاليد والعناية والمقاسات. كُتبت مع الحرفيات، لا مع كتالوج.",
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="container-page py-14 sm:py-20">
        <Link
          href={`/blog/${featured.slug}`}
          className="group grid overflow-hidden rounded-[2rem] border border-line/80 bg-background ring-1 ring-transparent transition duration-500 hover:border-terracotta/30 hover:shadow-card hover:ring-gold/25 lg:grid-cols-[1.05fr_0.95fr]"
        >
          <div className="relative aspect-[16/11] overflow-hidden bg-wool lg:aspect-auto lg:min-h-[24rem]">
            <Image
              src={featured.coverImage}
              alt={nbTitle(featured, locale)}
              fill
              priority
              sizes="(min-width: 1024px) 52vw, 100vw"
              className="object-cover transition duration-700 group-hover:scale-[1.03]"
            />
            <span className="absolute left-4 top-4 rounded-full bg-background/90 px-3 py-1.5 text-[0.58rem] font-bold uppercase tracking-[0.16em] text-ink backdrop-blur">
              {t("À la une", "Featured", "مميز")}
            </span>
          </div>

          <div className="flex flex-col justify-center p-6 sm:p-9">
            <PostMeta post={featured} locale={locale} />
            <h2 className="mt-4 text-balance font-serif text-3xl font-semibold leading-[1.05] tracking-[-0.02em] transition group-hover:text-terracotta sm:text-4xl">
              {nbTitle(featured, locale)}
            </h2>
            <p className="mt-3 text-pretty text-sm leading-relaxed text-muted">
              {nbExcerpt(featured, locale)}
            </p>
            <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-terracotta">
              {t("Lire l’article", "Read the article", "اقرأ المقال")}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </Link>
      </section>

      {/* Grid */}
      <section className="container-page pb-4">
        <div className="flex items-end justify-between gap-4 border-t border-line/70 pt-8">
          <div>
            <p className="eyebrow-line">{t("Tous les articles", "All articles", "كل المقالات")}</p>
            <h2 className="mt-3 font-serif text-3xl font-semibold">
              {t("À lire avant d’acheter.", "Read before buying.", "اقرأ قبل الشراء.")}
            </h2>
          </div>
          <span className="text-[0.64rem] uppercase tracking-[0.14em] text-muted">
            {BLOG_POSTS.length} {t("articles", "articles", "مقالات")}
          </span>
        </div>

        <div className="mt-7 grid gap-6 sm:grid-cols-2">
          {rest.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col overflow-hidden rounded-[1.6rem] border border-line/80 bg-background ring-1 ring-transparent transition duration-500 hover:-translate-y-1 hover:border-terracotta/40 hover:shadow-card hover:ring-gold/30"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-wool">
                <Image
                  src={post.coverImage}
                  alt={nbTitle(post, locale)}
                  fill
                  sizes="(min-width: 640px) 50vw, 100vw"
                  className="object-cover transition duration-700 group-hover:scale-[1.04]"
                />
              </div>
              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <PostMeta post={post} locale={locale} />
                <h3 className="mt-3 font-serif text-2xl font-semibold leading-tight transition group-hover:text-terracotta">
                  {nbTitle(post, locale)}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                  {nbExcerpt(post, locale)}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-terracotta">
                  {t("Lire", "Read", "اقرأ")}
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-page py-12 sm:py-16">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-line bg-gradient-to-br from-surface via-background to-surface p-8 shadow-soft sm:p-12">
          <div className="pointer-events-none absolute inset-0 bg-zellige opacity-15" />
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gold/15 blur-3xl" />
          <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <p className="flex items-center gap-2 text-[0.62rem] font-bold uppercase tracking-[0.28em] text-terracotta">
                <Sparkles className="h-3.5 w-3.5" />
                {t("Passer de la lecture à la laine", "From reading to wool", "من القراءة إلى الصوف")}
              </p>
              <h2 className="mt-3 font-serif text-3xl font-semibold text-ink sm:text-4xl">
                {t(
                  "Les pièces racontent le reste.",
                  "The pieces tell the rest.",
                  "القطع تحكي الباقي.",
                )}
              </h2>
            </div>
            <Link
              href="/shop"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-terracotta px-7 py-3.5 text-sm font-semibold text-background transition hover:bg-terracottaDark hover:shadow-soft"
            >
              {t("Voir la collection", "See the collection", "عرض المجموعة")}
              <ArrowRight className="h-4 w-4 rtl-flip" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
