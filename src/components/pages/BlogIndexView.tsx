"use client";

import { ArrowRight, ArrowUpRight, Clock3, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { type Locale } from "@/lib/i18n";
import {
  BLOG_POSTS,
  blogCategory,
  blogCoverAlt,
  blogExcerpt,
  blogTitle,
  formatBlogDate,
  type BlogPost,
} from "@/lib/blog";

function PostMeta({
  post,
  locale,
}: {
  post: BlogPost;
  locale: Locale;
}) {
  return (
    <span className="flex flex-wrap items-center gap-2 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-muted">
      <span className="text-terracotta">{blogCategory(post, locale)}</span>
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
  const [featured, ...rest] = BLOG_POSTS;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="relative overflow-hidden border-b border-line/70 bg-surface/35">
        <div className="pointer-events-none absolute inset-0 bg-zellige opacity-50" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold/[0.06] blur-3xl" />
        <div className="container-page relative py-14 sm:py-20 lg:py-24">
          <nav
            aria-label={t("Fil d’Ariane", "Breadcrumb", "مسار التنقل")}
            className="flex items-center gap-2 text-[0.64rem] uppercase tracking-[0.18em] text-muted"
          >
            <Link href="/" className="transition hover:text-terracotta">
              {t("Accueil", "Home", "الرئيسية")}
            </Link>
            <span>/</span>
            <span className="text-ink/65">{t("Journal", "Journal", "المدونة")}</span>
          </nav>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <p className="eyebrow-line">
                {t("Le journal de l’Atlas", "The Atlas journal", "مدونة الأطلس")}
              </p>
              <h1 className="mt-4 max-w-2xl text-balance font-serif text-[2.9rem] font-semibold leading-[0.96] tracking-[-0.035em] sm:text-[4.2rem]">
                {t(
                  "Comprendre ce que l’on pose sous ses pieds.",
                  "Understanding what you put underfoot.",
                  "فهم ما تضعه تحت قدميك.",
                )}
              </h1>
            </div>
            <p className="max-w-md text-sm leading-[1.75] text-muted lg:justify-self-end">
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
              alt={blogCoverAlt(featured, locale)}
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
              {blogTitle(featured, locale)}
            </h2>
            <p className="mt-3 text-pretty text-sm leading-relaxed text-muted">
              {blogExcerpt(featured, locale)}
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
                  alt={blogCoverAlt(post, locale)}
                  fill
                  sizes="(min-width: 640px) 50vw, 100vw"
                  className="object-cover transition duration-700 group-hover:scale-[1.04]"
                />
              </div>
              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <PostMeta post={post} locale={locale} />
                <h3 className="mt-3 font-serif text-2xl font-semibold leading-tight transition group-hover:text-terracotta">
                  {blogTitle(post, locale)}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                  {blogExcerpt(post, locale)}
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
