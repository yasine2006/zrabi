import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalView } from "@/components/pages/LegalView";
import {
  LEGAL_DOCUMENTS,
  LEGAL_SLUGS,
  getLegalDocument,
} from "@/lib/legal";
import { getServerLocale } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

interface LegalPageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  return LEGAL_SLUGS.map((slug) => ({ slug }));
}

export function generateMetadata({ params }: LegalPageProps): Metadata {
  const locale = getServerLocale();
  const document = getLegalDocument(params.slug);

  if (!document) {
    return { title: "Page introuvable" };
  }

  return {
    title: document.title[locale],
    description: document.intro[locale],
    openGraph: {
      title: document.title[locale],
      description: document.intro[locale],
      type: "article",
    },
  };
}

export default function LegalPage({ params }: LegalPageProps) {
  const document = LEGAL_DOCUMENTS[params.slug as keyof typeof LEGAL_DOCUMENTS];

  if (!document) notFound();

  return <LegalView document={document} />;
}
