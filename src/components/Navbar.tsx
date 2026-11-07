"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Globe2,
  LockKeyhole,
  Menu,
  ShoppingBag,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/context/StoreContext";
import { cn } from "@/lib/utils";
import type { CurrencyCode } from "@/lib/money";

const CURRENCIES: CurrencyCode[] = ["MAD", "EUR", "USD"];

export function Navbar() {
  const pathname = usePathname();
  const { cartCount, openCart, currency, setCurrency, locale, setLocale, t } =
    useStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const currencyRef = useRef<HTMLDivElement>(null);

  const links = [
    { href: "/shop", label: t("Boutique", "Shop", "المتجر") },
    { href: "/custom-order", label: t("Tapis sur mesure", "Custom Rug", "حسب الطلب") },
    { href: "/our-story", label: t("Notre histoire", "Our Story", "قصتنا") },
    { href: "/blog", label: t("Journal", "Blog", "المدونة") },
    { href: "/faq", label: "FAQ" },
  ];

  useEffect(() => {
    setMobileOpen(false);
    setCurrencyOpen(false);
  }, [pathname]);

  useEffect(() => {
    function closeOnOutside(event: MouseEvent) {
      if (
        currencyRef.current &&
        !currencyRef.current.contains(event.target as Node)
      ) {
        setCurrencyOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutside);
    return () => document.removeEventListener("mousedown", closeOnOutside);
  }, []);

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  return (
    <header className="sticky top-0 z-50 border-b border-line/40 bg-background/85 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/70">
      <div className="container-page flex h-[5rem] items-center justify-between gap-4">
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-3"
          aria-label={t("Zarbia Atlas — accueil", "Zarbia Atlas — home", "زربية أطلس — الرئيسية")}
        >
          <span className="relative grid h-10 w-10 place-items-center rounded-full border border-terracotta/25 bg-surface text-terracotta transition group-hover:border-terracotta/60">
            <svg
              viewBox="0 0 32 32"
              className="h-5 w-5"
              fill="none"
              aria-hidden="true"
            >
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
              <circle cx="16" cy="16" r="1.4" fill="currentColor" />
            </svg>
          </span>
          <span className="leading-none">
            <span className="block font-serif text-[1.45rem] font-semibold tracking-[0.02em] text-ink">
              Zarbia
            </span>
            <span className="mt-0.5 block text-[0.57rem] font-semibold uppercase tracking-[0.42em] text-muted">
              Atlas
            </span>
          </span>
        </Link>

        <nav
          className="hidden items-center gap-7 lg:flex"
          aria-label={t("Navigation principale", "Main navigation", "التنقل الرئيسي")}
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative text-[0.82rem] font-medium text-ink/75 transition-colors hover:text-terracotta",
                isActive(link.href) && "text-terracotta",
              )}
            >
              {link.label}
              {isActive(link.href) ? (
                <motion.span
                  layoutId="nav-underline"
                  className="absolute -bottom-1.5 left-0 h-px w-full bg-terracotta"
                />
              ) : null}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <div ref={currencyRef} className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => setCurrencyOpen((open) => !open)}
              className="flex h-9 items-center gap-1 rounded-full border border-line/90 px-3 text-[0.68rem] font-semibold tracking-[0.12em] text-ink/75 transition hover:border-terracotta/50 hover:text-terracotta"
              aria-haspopup="listbox"
              aria-expanded={currencyOpen}
            >
              {currency}
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform",
                  currencyOpen && "rotate-180",
                )}
              />
            </button>

            <AnimatePresence>
              {currencyOpen ? (
                <motion.ul
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.16 }}
                  role="listbox"
                  className="absolute right-0 top-11 w-28 overflow-hidden rounded-2xl border border-line bg-background p-1.5 shadow-card"
                >
                  {CURRENCIES.map((code) => (
                    <li key={code}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={currency === code}
                        onClick={() => {
                          setCurrency(code);
                          setCurrencyOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold transition",
                          currency === code
                            ? "bg-terracotta text-background"
                            : "text-ink/75 hover:bg-surface hover:text-ink",
                        )}
                      >
                        {code}
                        <span className="text-[0.62rem] opacity-70">
                          {code === "MAD"
                            ? "د.م."
                            : code === "EUR"
                              ? "€"
                              : "$"}
                        </span>
                      </button>
                    </li>
                  ))}
                </motion.ul>
              ) : null}
            </AnimatePresence>
          </div>

          <div
            className="hidden h-8 items-center rounded-full border border-line/90 p-0.5 md:flex"
            aria-label={t("Langue", "Language", "اللغة")}
          >
            {(["fr", "en", "ar"] as const).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLocale(code)}
                aria-pressed={locale === code}
                className={cn(
                  "h-7 rounded-full px-2.5 text-[0.62rem] font-bold uppercase tracking-[0.12em] transition",
                  locale === code
                    ? "bg-ink text-background"
                    : "text-ink/55 hover:text-ink",
                )}
              >
                {code}
              </button>
            ))}
          </div>

          <Link
            href="/admin"
            className="hidden h-9 items-center gap-1.5 rounded-full px-2.5 text-[0.68rem] font-semibold text-ink/55 transition hover:text-terracotta xl:flex"
            title={t("Administration", "Admin", "الإدارة")}
          >
            <LockKeyhole className="h-3.5 w-3.5" />
            Admin
          </Link>

          <button
            type="button"
            onClick={openCart}
            className="relative grid h-10 w-10 place-items-center rounded-full border border-line/90 bg-background/60 text-ink transition hover:border-terracotta/50 hover:text-terracotta"
            aria-label={t(
              `Panier, ${cartCount} article${cartCount > 1 ? "s" : ""}`,
              `Cart, ${cartCount} item${cartCount === 1 ? "" : "s"}`,
              `السلة، ${cartCount} ${cartCount > 1 ? "عناصر" : "عنصر"}`,
            )}
          >
            <ShoppingBag className="h-[1.05rem] w-[1.05rem]" />
            <AnimatePresence>
              {cartCount > 0 ? (
                <motion.span
                  key={cartCount}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  className="absolute -right-1 -top-1 grid h-[1.15rem] min-w-[1.15rem] place-items-center rounded-full bg-terracotta px-1 text-[0.6rem] font-bold text-background"
                >
                  {cartCount}
                </motion.span>
              ) : null}
            </AnimatePresence>
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="grid h-10 w-10 place-items-center rounded-full border border-line/90 text-ink lg:hidden"
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            aria-label={mobileOpen ? t("Fermer le menu", "Close menu", "إغلاق القائمة") : t("Ouvrir le menu", "Open menu", "فتح القائمة")}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            id="mobile-navigation"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-line/60 bg-background lg:hidden"
          >
            <div className="container-page space-y-1 py-5">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition",
                    isActive(link.href)
                      ? "bg-surface text-terracotta"
                      : "text-ink/75 hover:bg-surface/70",
                  )}
                >
                  {link.label}
                  <span className="text-[0.65rem] uppercase tracking-[0.2em] text-muted">
                    0{links.indexOf(link) + 1}
                  </span>
                </Link>
              ))}

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-line/70 pt-4">
                <div className="flex items-center gap-2">
                  <Globe2 className="h-4 w-4 text-muted" />
                  <div className="flex rounded-full border border-line p-0.5">
                    {(["fr", "en", "ar"] as const).map((code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setLocale(code)}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.12em]",
                          locale === code
                            ? "bg-ink text-background"
                            : "text-ink/60",
                        )}
                      >
                        {code}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1 rounded-full border border-line p-0.5">
                  {CURRENCIES.map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setCurrency(code)}
                      className={cn(
                        "rounded-full px-2.5 py-1.5 text-[0.62rem] font-bold transition",
                        currency === code
                          ? "bg-terracotta text-background"
                          : "text-ink/60",
                      )}
                    >
                      {code}
                    </button>
                  ))}
                </div>
              </div>

              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className="mt-2 flex items-center gap-2 rounded-2xl px-4 py-3 text-xs font-semibold text-muted hover:bg-surface"
              >
                <LockKeyhole className="h-4 w-4" />
                {t("Espace administration", "Admin area", "منطقة الإدارة")}
              </Link>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
