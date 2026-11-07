import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { CartDrawer } from "@/components/CartDrawer";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { StoreProvider } from "@/context/StoreContext";
import {
  JsonLd,
  organizationJsonLd,
  websiteJsonLd,
} from "@/components/seo/JsonLd";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { htmlDir, htmlLang, getServerLocale } from "@/lib/i18n-server";
import type { Locale } from "@/lib/i18n";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

const BASE_URL = (
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

const COPY: Record<
  Locale,
  { title: string; description: string; ogDescription: string }
> = {
  fr: {
    title: "Zarbia Atlas — Tapis marocains faits main",
    description:
      "Tapis marocains authentiques, tissés à la main dans le Moyen Atlas, le Haut Atlas et le Haouz. Pièces uniques, certificat d’origine et livraison internationale.",
    ogDescription:
      "Des tapis qui portent une histoire. Pièces uniques tissées main par des artisanes de l’Atlas.",
  },
  en: {
    title: "Zarbia Atlas — Handmade Moroccan rugs",
    description:
      "Authentic Moroccan rugs handwoven in the Middle Atlas, High Atlas and Haouz. One-of-a-kind pieces, certificate of origin and worldwide shipping.",
    ogDescription:
      "Rugs that carry a story. One-of-a-kind pieces handwoven by the artisans of the Atlas.",
  },
  ar: {
    title: "زربية أطلس — زرابي مغربية منسوجة يدوياً",
    description:
      "زرابي مغربية أصيلة تُنسج يدوياً في الأطلس المتوسط والأطلس الكبير والحوز. قطع فريدة، شهادة أصل، وتوصيل دولي.",
    ogDescription:
      "زرابي تحمل حكاية. قطع فريدة تنسجها يدوياً حرفيات الأطلس.",
  },
};

const OG_LOCALE: Record<Locale, string> = {
  fr: "fr_MA",
  en: "en_GB",
  ar: "ar_MA",
};

export function generateMetadata(): Metadata {
  const locale = getServerLocale();
  const copy = COPY[locale];

  return {
    metadataBase: new URL(BASE_URL),
    title: {
      default: copy.title,
      template: "%s · Zarbia Atlas",
    },
    description: copy.description,
    applicationName: "Zarbia Atlas",
    keywords: [
      "tapis marocain",
      "tapis berbère",
      "زربية مغربية",
      "Beni Ourain",
      "Azilal",
      "Boucherouite",
      "Kilim",
      "Hanbel",
      "artisanat marocain",
      "handmade rugs",
    ],
    alternates: { canonical: "/" },
    openGraph: {
      title: copy.title,
      description: copy.ogDescription,
      type: "website",
      locale: OG_LOCALE[locale],
      alternateLocale: (["fr", "en", "ar"] as Locale[])
        .filter((item) => item !== locale)
        .map((item) => OG_LOCALE[item]),
      siteName: "Zarbia Atlas",
      url: "/",
    },
    twitter: {
      card: "summary_large_image",
      title: copy.title,
      description: copy.ogDescription,
    },
    icons: {
      icon: "/icon.svg",
      apple: "/icon.svg",
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = getServerLocale();

  return (
    <html
      lang={htmlLang(locale)}
      dir={htmlDir(locale)}
      className={`${cormorant.variable} ${jakarta.variable}`}
    >
      <body className="bg-[#FAF6F0] text-[#2A211B] antialiased">
        <JsonLd data={organizationJsonLd(BASE_URL)} />
        <JsonLd data={websiteJsonLd(BASE_URL)} />
        <StoreProvider>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <CartDrawer />
          <WhatsAppButton />
        </StoreProvider>
      </body>
    </html>
  );
}
