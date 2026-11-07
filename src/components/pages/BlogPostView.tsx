"use client";

import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Clock3,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import {
  blogCategory,
  blogCoverAlt,
  blogExcerpt,
  blogSectionBullets,
  blogSectionHeading,
  blogSectionParagraphs,
  blogSectionQuote,
  blogTitle,
  formatBlogDate,
  type BlogPost,
} from "@/lib/blog";

interface BlogPostViewProps {
  post: BlogPost;
  related: BlogPost[];
}

export function BlogPostView({ post, related }: BlogPostViewProps) {
  const { locale, t } = useStore();
  const title = blogTitle(post, locale);

  return (
    <article className="min-h-screen">
      {/* Header */}
      <header className="relative overflow-hidden border-b border-line/70 bg-surface/35">
        <div className="pointer-events-none absolute inset-0 bg-zellige opacity-50" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold/[0.06] blur-3xl" />
        <div className="container-page relative py-10 sm:py-14">
          <nav
            aria-label={t("Fil d’Ariane", "Breadcrumb", "مسار التنقل")}
            className="flex flex-wrap items-center gap-2 text-[0.64rem] uppercase tracking-[0.18em] text-muted"
          >
            <Link href="/" className="transition hover:text-terracotta">
              {t("Accueil", "Home", "الرئيسية")}
            </Link>
            <span>/</span>
            <Link href="/blog" className="transition hover:text-terracotta">
              {t("Journal", "Journal", "المدونة")}
            </Link>
            <span>/</span>
            <span className="text-ink/65">{blogCategory(post, locale)}</span>
          </nav>

          <div className="mt-8 grid gap-7 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <p className="eyebrow-line">
                {blogCategory(post, locale)}
              </p>
              <h1 className="mt-4 max-w-3xl text-balance font-serif text-[2.8rem] font-semibold leading-[0.97] tracking-[-0.035em] sm:text-[3.9rem]">
                {title}
              </h1>
              <p className="mt-5 max-w-2xl text-pretty text-sm leading-[1.8] text-muted">
                {blogExcerpt(post, locale)}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-muted">
                <span>{formatBlogDate(post.publishedAt, locale)}</span>
                <span className="h-1 w-1 rounded-full bg-line" />
                <span className="flex items-center gap-1">
                  <Clock3 className="h-3 w-3" />
                  {post.readingMinutes} min
                </span>
                <span className="h-1 w-1 rounded-full bg-line" />
                <span>Zarbia Atlas</span>
              </div>
            </div>

            <div className="relative aspect-[16/11] overflow-hidden rounded-[1.6rem] bg-wool ring-1 ring-line/70 lg:aspect-[4/3]">
              <Image
                src={post.coverImage}
                alt={blogCoverAlt(post, locale)}
                fill
                priority
                sizes="(min-width: 1024px) 42vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="container-page py-10 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-[15rem_1fr] lg:gap-14">
          <aside className="hidden lg:block">
            <div className="sticky top-[5.8rem] space-y-6">
              <div>
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-muted">
                  {t("Dans cet article", "In this article", "في هذا المقال")}
                </p>
                <ol className="mt-3 space-y-2 border-l border-line pl-3.5">
                  {post.sections.map((section, index) => (
                    <li key={section.headingFr}>
                      <a
                        href={`#section-${index}`}
                        className="block text-[0.72rem] leading-snug text-muted transition hover:text-terracotta"
                      >
                        {String(index + 1).padStart(2, "0")} ·{" "}
                        {blogSectionHeading(section, locale)}
                      </a>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="rounded-2xl border border-line/80 bg-surface/50 p-4">
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-terracotta">
                  {t("Une pièce, une histoire", "One piece, one story", "قطعة واحدة، حكاية واحدة")}
                </p>
                <p className="mt-1.5 text-[0.72rem] leading-relaxed text-muted">
                  {t(
                    "Chaque tapis de la collection est unique, certifié et tissé main.",
                    "Every rug in the collection is unique, certified and hand-woven.",
                    "كل زربية في المجموعة فريدة ومعتمدة ومنسوجة يدوياً.",
                  )}
                </p>
                <Link
                  href="/shop"
                  className="mt-3 inline-flex items-center gap-1.5 text-[0.68rem] font-semibold text-terracotta"
                >
                  {t("Voir la collection", "See the collection", "عرض المجموعة")}
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </aside>

          <div className="mx-auto w-full max-w-3xl">
            {post.sections.map((section, index) => (
              <section
                key={section.headingFr}
                id={`section-${index}`}
                className="scroll-mt-28 border-t border-line/70 py-7 first:border-t-0 first:pt-0"
              >
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.2em] text-terracotta">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h2 className="mt-2 text-balance font-serif text-3xl font-semibold leading-[1.1]">
                  {blogSectionHeading(section, locale)}
                </h2>

                <div className="mt-4 space-y-4">
                  {blogSectionParagraphs(section, locale).map((paragraph) => (
                    <p
                      key={paragraph.slice(0, 40)}
                      className="text-pretty text-[0.92rem] leading-[1.8] text-ink/75"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>

                {blogSectionBullets(section, locale).length > 0 ? (
                  <ul className="mt-5 space-y-2.5 rounded-2xl border border-line/80 bg-surface/40 p-4 sm:p-5">
                    {blogSectionBullets(section, locale).map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2.5 text-[0.84rem] leading-relaxed text-ink/75"
                      >
                        <span className="mt-[0.42rem] h-1.5 w-1.5 shrink-0 rounded-full bg-terracotta" />
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : null}

                {blogSectionQuote(section, locale) ? (
                  <blockquote className="mt-5 border-l-2 border-gold pl-4 font-serif text-xl italic leading-relaxed text-ink/80 sm:text-2xl">
                    {blogSectionQuote(section, locale)}
                  </blockquote>
                ) : null}
              </section>
            ))}

            <div className="mt-4 flex flex-col gap-4 rounded-[1.6rem] border border-line/80 bg-ink p-6 text-background sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="flex items-center gap-2 text-[0.58rem] font-bold uppercase tracking-[0.2em] text-gold">
                  <Sparkles className="h-3 w-3" />
                  {t("La suite logique", "The natural next step", "الخطوة الطبيعية التالية")}
                </p>
                <p className="mt-1.5 font-serif text-2xl font-semibold">
                  {t("Trouver la pièce juste.", "Find the right piece.", "اعثر على القطعة المناسبة.")}
                </p>
              </div>
              <Link
                href="/shop"
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-background px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-gold"
              >
                {t("Voir les tapis", "See the rugs", "عرض الزرابي")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <Link
              href="/blog"
              className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-muted transition hover:text-terracotta"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t("Retour au journal", "Back to the journal", "العودة إلى المدونة")}
            </Link>
          </div>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 ? (
        <section className="border-t border-line/70 bg-surface/30">
          <div className="container-page py-12 sm:py-14">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow-line">{t("À lire ensuite", "Read next", "اقرأ بعدها")}</p>
                <h2 className="mt-3 font-serif text-3xl font-semibold">
                  {t("Poursuivre la lecture.", "Keep reading.", "واصل القراءة.")}
                </h2>
              </div>
              <Link
                href="/blog"
                className="hidden items-center gap-1.5 text-xs font-semibold text-terracotta sm:flex"
              >
                {t("Tout le journal", "All articles", "كل المقالات")}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {related.map((item) => (
                <Link
                  key={item.slug}
                  href={`/blog/${item.slug}`}
                  className="group flex gap-4 rounded-[1.4rem] border border-line/80 bg-background p-3.5 transition hover:border-terracotta/40 hover:shadow-soft"
                >
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-wool sm:h-28 sm:w-28">
                    <Image
                      src={item.coverImage}
                      alt={blogCoverAlt(item, locale)}
                      fill
                      sizes="112px"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="min-w-0 flex-1 py-0.5">
                    <p className="text-[0.56rem] font-bold uppercase tracking-[0.16em] text-terracotta">
                      {blogCategory(item, locale)}
                    </p>
                    <h3 className="mt-1 font-serif text-xl font-semibold leading-tight transition group-hover:text-terracotta">
                      {blogTitle(item, locale)}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-[0.72rem] leading-relaxed text-muted">
                      {blogExcerpt(item, locale)}
                    </p>
                    <p className="mt-1.5 flex items-center gap-1 text-[0.58rem] uppercase tracking-[0.12em] text-muted">
                      <Clock3 className="h-3 w-3" />
                      {item.readingMinutes} min
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </article>
  );
}
