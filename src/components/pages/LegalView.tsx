"use client";

import Link from "next/link";
import { ArrowRight, FileText, Scale } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import {
  LEGAL_DOCUMENTS,
  LEGAL_SLUGS,
  LEGAL_UPDATED_AT,
  type LegalDocument,
} from "@/lib/legal";

function formatUpdated(locale: string): string {
  const tag =
    locale === "ar" ? "ar-MA" : locale === "en" ? "en-GB" : "fr-MA";

  try {
    return new Intl.DateTimeFormat(tag, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(`${LEGAL_UPDATED_AT}T12:00:00Z`));
  } catch {
    return LEGAL_UPDATED_AT;
  }
}

export function LegalView({ document }: { document: LegalDocument }) {
  const { locale, t } = useStore();
  const updated = formatUpdated(locale);

  return (
    <article className="container-page py-14 sm:py-20 lg:py-24">
      <nav
        aria-label={t("Fil d’Ariane", "Breadcrumb", "مسار التنقل")}
        className="flex items-center gap-2 text-[0.66rem] uppercase tracking-[0.16em] text-muted"
      >
        <Link href="/" className="transition hover:text-terracotta">
          {t("Accueil", "Home", "الرئيسية")}
        </Link>
        <span aria-hidden>·</span>
        <span className="text-ink/70">{document.title[locale]}</span>
      </nav>

      <header className="mt-8 max-w-3xl">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-surface text-terracotta">
          <Scale className="h-5 w-5" />
        </span>
        <p className="eyebrow mt-5">
          {t("Informations légales", "Legal information", "معلومات قانونية")}
        </p>
        <h1 className="mt-2 text-balance font-serif text-4xl font-semibold leading-[1.03] sm:text-5xl">
          {document.title[locale]}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
          {document.intro[locale]}
        </p>
        <p className="mt-4 text-[0.68rem] uppercase tracking-[0.14em] text-muted">
          {t("Dernière mise à jour", "Last updated", "آخر تحديث")} · {updated}
        </p>
      </header>

      <div className="mt-12 grid gap-10 lg:grid-cols-[16rem_1fr] lg:gap-16">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <p className="flex items-center gap-2 text-[0.64rem] font-bold uppercase tracking-[0.2em] text-ink/60">
            <FileText className="h-3.5 w-3.5 text-terracotta" />
            {t("Documents", "Documents", "الوثائق")}
          </p>
          <ul className="mt-4 space-y-2 border-l border-line pl-4">
            {LEGAL_SLUGS.map((slug) => {
              const item = LEGAL_DOCUMENTS[slug];
              const active = slug === document.slug;

              return (
                <li key={slug}>
                  <Link
                    href={`/legal/${slug}`}
                    aria-current={active ? "page" : undefined}
                    className={
                      active
                        ? "text-sm font-semibold text-terracotta"
                        : "text-sm text-ink/65 transition hover:text-terracotta"
                    }
                  >
                    {item.title[locale]}
                  </Link>
                </li>
              );
            })}
          </ul>
        </aside>

        <div className="max-w-3xl space-y-10">
          {document.sections.map((section, index) => (
            <section key={index} id={`section-${index + 1}`}>
              <h2 className="font-serif text-2xl font-semibold leading-tight text-ink">
                {section.heading[locale]}
              </h2>

              {section.paragraphs?.map((paragraph, pIndex) => (
                <div key={pIndex} className="mt-3 space-y-3">
                  {paragraph[locale].map((text, textIndex) => (
                    <p
                      key={textIndex}
                      className="text-[0.92rem] leading-[1.85] text-ink/75"
                    >
                      {text}
                    </p>
                  ))}
                </div>
              ))}

              {section.bullets?.map((list, listIndex) => (
                <ul key={listIndex} className="mt-4 space-y-2.5">
                  {list[locale].map((text, textIndex) => (
                    <li
                      key={textIndex}
                      className="flex gap-3 text-[0.92rem] leading-[1.8] text-ink/75"
                    >
                      <span
                        aria-hidden
                        className="mt-[0.65rem] h-1.5 w-1.5 shrink-0 rounded-full bg-terracotta"
                      />
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              ))}
            </section>
          ))}

          <div className="rounded-2xl border border-line bg-surface/60 p-5">
            <p className="text-sm leading-relaxed text-ink/75">
              {t(
                "Une question sur un point précis ? Écrivez-nous à bonjour@zarbia-atlas.ma — nous répondons personnellement.",
                "A question about a specific point? Write to bonjour@zarbia-atlas.ma — we answer personally.",
                "هل لديك سؤال حول نقطة معينة؟ اكتب إلى bonjour@zarbia-atlas.ma — نجيب شخصياً.",
              )}
            </p>
            <Link
              href="/faq"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-terracotta transition hover:gap-2.5"
            >
              {t("Consulter la FAQ", "Read the FAQ", "اطّلع على الأسئلة الشائعة")}
              <ArrowRight className="h-4 w-4 rtl-flip" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
