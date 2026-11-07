"use client";

import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { getSupportWhatsAppLink } from "@/lib/whatsapp";

export function Footer() {
  const { locale, t } = useStore();
  const whatsapp = getSupportWhatsAppLink({
    locale,
    message:
      locale === "ar"
        ? "مرحباً زربية أطلس، أود معرفة المزيد عن زرابيكم."
        : locale === "en"
          ? "Hello Zarbia Atlas, I would like to know more about your rugs."
          : "Bonjour Zarbia Atlas, je souhaite en savoir plus sur vos tapis.",
  });

  return (
    <footer className="relative mt-28 overflow-hidden border-t border-line/70 bg-surface/45">
      <div className="pointer-events-none absolute inset-0 bg-zellige opacity-35" />
      <div className="rule-gold absolute inset-x-0 top-0" />
      <div className="container-page relative py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_0.7fr_0.7fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full border border-terracotta/25 bg-background text-terracotta">
                <svg viewBox="0 0 32 32" className="h-5 w-5" fill="none">
                  <path
                    d="M16 3 27 16 16 29 5 16 16 3Z"
                    stroke="currentColor"
                    strokeWidth="1.3"
                  />
                  <path
                    d="M16 8.5 22.5 16 16 23.5 9.5 16 16 8.5Z"
                    stroke="currentColor"
                    strokeWidth="0.9"
                    opacity="0.7"
                  />
                </svg>
              </span>
              <span className="leading-none">
                <span className="block font-serif text-2xl font-semibold">
                  Zarbia
                </span>
                <span className="mt-0.5 block text-[0.57rem] font-semibold uppercase tracking-[0.42em] text-muted">
                  Atlas
                </span>
              </span>
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted">
              {t(
                "Des tapis marocains authentiques, achetés directement auprès des artisanes de l’Atlas. Chaque pièce est unique et porte sa propre histoire.",
                "Authentic Moroccan rugs bought directly from Atlas artisans. Every piece is one of a kind and carries its own story.",
                "زرابي مغربية أصيلة، مقتناة مباشرة من حرفيات الأطلس. كل قطعة فريدة وتحمل قصتها الخاصة.",
              )}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2 text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-muted">
              {["CMI", "Stripe", "Visa", "Mastercard"].map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-line bg-background/80 px-3 py-1.5 backdrop-blur-sm"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-ink/60">
              {t("Boutique", "Shop", "المتجر")}
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-ink/70">
              {[
                ["/shop", t("Tous les tapis", "All rugs", "جميع الزرابي")],
                ["/shop?type=BENI_OURAIN", "Beni Ourain"],
                ["/shop?type=AZILAL", "Azilal"],
                ["/shop?type=BOUCHEROUITE", "Boucherouite"],
                ["/shop?type=KILIM", "Kilim"],
                ["/shop?type=HANBEL", "Hanbel"],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="link-underline transition hover:text-terracotta">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-ink/60">
              {t("La maison", "The house", "عن زربية أطلس")}
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-ink/70">
              {[
                ["/our-story", t("Notre histoire", "Our story", "قصتنا ورؤيتنا")],
                ["/custom-order", t("Tapis sur mesure", "Custom rug", "طلب على المقاس")],
                ["/blog", t("Le journal", "Journal", "مدونة الزربية")],
                ["/faq", "FAQ"],
                ["/contact", t("Contact", "Contact", "تواصل")],
                ["/track", t("Suivi de commande", "Order tracking", "تتبّع الطلب")],
                ["/favorites", t("Favoris", "Favourites", "المفضلة")],
                ["/legal/terms", t("CGV", "Terms", "الشروط العامة")],
                ["/admin", t("Administration", "Admin", "الإدارة")],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="link-underline transition hover:text-terracotta">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-ink/60">
              {t("Nous joindre", "Get in touch", "اتصل بنا")}
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-ink/70">
              <li className="flex gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" />
                <span>
                  {t(
                    "Atelier, Aït Bouguemez — Moyen Atlas, Maroc",
                    "Atelier, Aït Bouguemez — Middle Atlas, Morocco",
                    "الورشة، آيت بوكماز — الأطلس المتوسط، المغرب",
                  )}
                </span>
              </li>
              <li>
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex gap-2.5 transition hover:text-terracotta"
                >
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" />
                  WhatsApp
                </a>
              </li>
              <li>
                <a
                  href="mailto:bonjour@zarbia-atlas.ma"
                  className="flex gap-2.5 transition hover:text-terracotta"
                >
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" />
                  bonjour@zarbia-atlas.ma
                </a>
              </li>
            </ul>

            <div className="mt-5 flex items-center gap-3">
              <a
                href="https://www.instagram.com/zarbia.atlas"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="grid h-9 w-9 place-items-center rounded-full border border-line bg-background/80 text-ink/70 transition hover:border-terracotta hover:text-terracotta"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
                </svg>
              </a>
              <a
                href="https://www.pinterest.com/zarbiaatlas"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Pinterest"
                className="grid h-9 w-9 place-items-center rounded-full border border-line bg-background/80 text-ink/70 transition hover:border-terracotta hover:text-terracotta"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.5-.1-.82-.19-2.08.04-2.98.21-.83 1.38-5.84 1.38-5.84s-.35-.71-.35-1.76c0-1.65.96-2.88 2.15-2.88 1.01 0 1.5.76 1.5 1.67 0 1.02-.65 2.54-.98 3.95-.28 1.18.59 2.14 1.75 2.14 2.1 0 3.72-2.22 3.72-5.42 0-2.83-2.04-4.81-4.95-4.81-3.37 0-5.35 2.53-5.35 5.15 0 1.02.39 2.11.88 2.71.1.12.11.22.08.34-.09.37-.29 1.18-.33 1.35-.05.21-.17.26-.39.16-1.45-.68-2.36-2.8-2.36-4.51 0-3.67 2.67-7.04 7.7-7.04 4.04 0 7.19 2.89 7.19 6.75 0 4.03-2.54 7.27-6.07 7.27-1.19 0-2.3-.62-2.68-1.35l-.73 2.79c-.26 1.01-.97 2.27-1.45 3.04A10 10 0 0 0 22 12c0-5.52-4.48-10-10-10z" />
                </svg>
              </a>
              <a
                href="https://www.facebook.com/zarbia.atlas"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="grid h-9 w-9 place-items-center rounded-full border border-line bg-background/80 text-ink/70 transition hover:border-terracotta hover:text-terracotta"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.99 3.66 9.13 8.44 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99C18.34 21.13 22 16.99 22 12z" />
                </svg>
              </a>
            </div>

            <Link
              href="/custom-order"
              className="mt-5 inline-flex items-center gap-1.5 border-b border-terracotta/30 pb-1 text-xs font-semibold text-terracotta transition hover:border-terracotta"
            >
              {t("Imaginer votre tapis", "Imagine your rug", "صمم زربيتك الخاصة")}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-line/70 pt-7 text-[0.68rem] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Zarbia Atlas.{" "}
            {t(
              "Tissé avec soin, entre l’Atlas et vous.",
              "Woven with care, between the Atlas and you.",
              "نُسج بعناية، من قمم الأطلس إليكم.",
            )}
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/legal/terms" className="transition hover:text-terracotta">
              {t("CGV", "Terms", "الشروط العامة")}
            </Link>
            <Link href="/legal/returns" className="transition hover:text-terracotta">
              {t("Livraison & retours", "Shipping & returns", "الشحن والإرجاع")}
            </Link>
            <Link href="/legal/privacy" className="transition hover:text-terracotta">
              {t("Confidentialité", "Privacy", "سياسة الخصوصية")}
            </Link>
            <Link href="/legal/notices" className="transition hover:text-terracotta">
              {t("Mentions légales", "Legal notices", "الإشعارات القانونية")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
