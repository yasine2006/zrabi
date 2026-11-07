import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALES, isRtl, type Locale } from "./i18n";

/**
 * Locale of the current request, read from the cookie the storefront writes
 * whenever the visitor switches language.
 *
 * Keeping a cookie (in addition to localStorage) lets server-rendered pieces —
 * `<html lang dir>`, metadata, structured data, the 404 page — speak the same
 * language as the visible UI. Without it crawlers and the first paint always
 * saw French.
 */
export const LOCALE_COOKIE = "zarbia.locale.v1";

export function getServerLocale(): Locale {
  const value = cookies().get(LOCALE_COOKIE)?.value;
  return (LOCALES as readonly string[]).includes(value ?? "")
    ? (value as Locale)
    : DEFAULT_LOCALE;
}

export function htmlLang(locale: Locale): string {
  return locale === "ar" ? "ar" : locale;
}

export function htmlDir(locale: Locale): "ltr" | "rtl" {
  return isRtl(locale) ? "rtl" : "ltr";
}
