import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/JsonLd";
import { ProductView } from "@/components/pages/ProductView";
import { getRugBySlug, getStorefrontRugs } from "@/lib/storefront";
import { getServerLocale } from "@/lib/i18n-server";
import type { Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

interface RugPageProps {
  params: { slug: string };
}

function rugName(rug: Awaited<ReturnType<typeof getRugBySlug>>, locale: Locale) {
  if (!rug) return "";
  if (locale === "ar") return rug.nameAr ?? rug.nameEn ?? rug.nameFr;
  if (locale === "en") return rug.nameEn ?? rug.nameFr;
  return rug.nameFr;
}

export async function generateMetadata({
  params,
}: RugPageProps): Promise<Metadata> {
  const locale = getServerLocale();
  const rug = await getRugBySlug(params.slug);

  if (!rug) {
    return { title: "Pièce introuvable" };
  }

  const name = rugName(rug, locale);
  const story =
    locale === "ar"
      ? rug.storyAr ?? rug.storyEn ?? rug.storyFr
      : locale === "en"
        ? rug.storyEn ?? rug.storyFr
        : rug.storyFr;
  const title = `${name} — ${rug.widthCm} × ${rug.lengthCm} cm`;
  const description = `${story.slice(0, 150)}… ${locale === "ar" ? "قطعة فريدة منسوجة في" : locale === "en" ? "One-of-a-kind piece woven in" : "Pièce unique tissée à"} ${rug.originVillage}, ${locale === "ar" ? "شهادة أصل مرفقة" : locale === "en" ? "certificate of origin included" : "certificat d’authenticité inclus"}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: rug.photos[0] ? [{ url: rug.photos[0] }] : undefined,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: rug.photos[0] ? [rug.photos[0]] : undefined,
    },
  };
}

export default async function RugPage({ params }: RugPageProps) {
  const locale = getServerLocale();
  const [rug, allRugs] = await Promise.all([
    getRugBySlug(params.slug),
    getStorefrontRugs(),
  ]);

  if (!rug) notFound();

  const sameFamily = allRugs.filter(
    (item) => item.id !== rug.id && item.type === rug.type,
  );
  const others = allRugs.filter(
    (item) => item.id !== rug.id && item.type !== rug.type,
  );
  const related = [...sameFamily, ...others].slice(0, 4);

  const rawBase = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const base = rawBase.endsWith("/") ? rawBase.slice(0, -1) : rawBase;
  const name = rugName(rug, locale);

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description: locale === "ar"
      ? rug.storyAr ?? rug.storyEn ?? rug.storyFr
      : locale === "en"
        ? rug.storyEn ?? rug.storyFr
        : rug.storyFr,
    image: rug.photos,
    sku: rug.sku,
    brand: { "@type": "Brand", name: "Zarbia Atlas" },
    material:
      locale === "ar"
        ? rug.materialAr ?? rug.materialEn ?? rug.materialFr
        : locale === "en"
          ? rug.materialEn ?? rug.materialFr
          : rug.materialFr,
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "Dimensions",
        value: `${rug.widthCm} × ${rug.lengthCm} cm`,
      },
      {
        "@type": "PropertyValue",
        name: "Origin",
        value: `${rug.originVillage}, ${rug.originRegion}`,
      },
    ],
    offers: {
      "@type": "Offer",
      priceCurrency: "MAD",
      price: rug.priceMad,
      availability:
        rug.status === "SOLD"
          ? "https://schema.org/SoldOut"
          : "https://schema.org/InStock",
      url: `${base}/rugs/${rug.slug}`,
      itemCondition: "https://schema.org/NewCondition",
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "MA" },
      },
    },
  };

  const breadcrumb = breadcrumbJsonLd(base, [
    { name: "Home", path: "/" },
    { name: "Shop", path: "/shop" },
    { name, path: `/rugs/${rug.slug}` },
  ]);

  return (
    <>
      <JsonLd data={productJsonLd} />
      <JsonLd data={breadcrumb} />
      <ProductView rug={rug} related={related} />
    </>
  );
}
