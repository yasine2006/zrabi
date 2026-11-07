"use client";

import { useEffect, type ReactNode } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import type { Locale } from "@/lib/i18n";
import { formatPrice, type CurrencyCode } from "@/lib/money";
import { cn } from "@/lib/utils";

/** Small shared building blocks for the admin back-office. */

/**
 * Dates are formatted manually in UTC. `Intl` with a named timezone can
 * disagree between the Node server and the browser (different tzdata
 * versions), which breaks hydration; UTC getters are identical everywhere.
 */
const FRENCH_MONTHS = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
];

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function formatMoney(
  amount: number | null | undefined,
  currency: CurrencyCode = "MAD",
  showDecimals = false,
): string {
  if (amount === null || amount === undefined || !Number.isFinite(amount)) {
    return "—";
  }

  try {
    return formatPrice(amount, currency, { showDecimals });
  } catch {
    return "—";
  }
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return `${pad2(date.getUTCDate())} ${
    FRENCH_MONTHS[date.getUTCMonth()]
  } ${date.getUTCFullYear()}`;
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return `${formatDate(value)}, ${pad2(date.getUTCHours())}:${pad2(
    date.getUTCMinutes(),
  )}`;
}

const TONES: Record<string, string> = {
  AVAILABLE: "border-emerald-600/25 bg-emerald-600/10 text-emerald-800",
  RESERVED: "border-amber-600/25 bg-amber-500/10 text-amber-800",
  SOLD: "border-ink/20 bg-ink/10 text-ink/70",
  PENDING: "border-amber-600/25 bg-amber-500/10 text-amber-800",
  PENDING_COD: "border-amber-600/25 bg-amber-500/10 text-amber-800",
  CONFIRMED_COD: "border-sky-600/25 bg-sky-500/10 text-sky-800",
  PAID: "border-emerald-600/25 bg-emerald-600/10 text-emerald-800",
  PREPARING: "border-terracotta/30 bg-terracotta/10 text-terracotta",
  SHIPPED: "border-indigo-600/25 bg-indigo-500/10 text-indigo-800",
  DELIVERED: "border-emerald-700/25 bg-emerald-700/10 text-emerald-900",
  CASH_COLLECTED: "border-emerald-700/25 bg-emerald-700/10 text-emerald-900",
  FAILED: "border-red-600/25 bg-red-500/10 text-red-800",
  CANCELLED: "border-red-600/25 bg-red-500/10 text-red-800",
  REFUNDED: "border-red-600/25 bg-red-500/10 text-red-800",
  NEW: "border-sky-600/25 bg-sky-500/10 text-sky-800",
  QUOTED: "border-terracotta/30 bg-terracotta/10 text-terracotta",
  DEPOSIT_PENDING: "border-amber-600/25 bg-amber-500/10 text-amber-800",
  DEPOSIT_RECEIVED: "border-emerald-600/25 bg-emerald-600/10 text-emerald-800",
  IN_PROGRESS: "border-indigo-600/25 bg-indigo-500/10 text-indigo-800",
  COMPLETED: "border-emerald-700/25 bg-emerald-700/10 text-emerald-900",
};

export function statusLabel(value: string): string {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

const STATUS_LABELS: Record<string, { fr: string; en: string; ar: string }> = {
  AVAILABLE: { fr: "Disponible", en: "Available", ar: "متوفرة" },
  RESERVED: { fr: "Réservée", en: "Reserved", ar: "محجوزة" },
  SOLD: { fr: "Vendue", en: "Sold", ar: "مباعة" },
  PENDING: { fr: "En attente", en: "Pending", ar: "قيد الانتظار" },
  PENDING_COD: { fr: "COD en attente", en: "COD pending", ar: "دفع عند الاستلام معلّق" },
  CONFIRMED_COD: { fr: "COD confirmé", en: "COD confirmed", ar: "دفع عند الاستلام مؤكد" },
  PAID: { fr: "Payée", en: "Paid", ar: "مدفوعة" },
  PREPARING: { fr: "En préparation", en: "Preparing", ar: "قيد التحضير" },
  SHIPPED: { fr: "Expédiée", en: "Shipped", ar: "مشحونة" },
  DELIVERED: { fr: "Livrée", en: "Delivered", ar: "مُسلَّمة" },
  CASH_COLLECTED: { fr: "Espèces encaissées", en: "Cash collected", ar: "نُقد محصّل" },
  FAILED: { fr: "Échouée", en: "Failed", ar: "فاشلة" },
  CANCELLED: { fr: "Annulée", en: "Cancelled", ar: "ملغاة" },
  REFUNDED: { fr: "Remboursée", en: "Refunded", ar: "مُسترجعة" },
  NEW: { fr: "Nouveau", en: "New", ar: "جديد" },
  QUOTED: { fr: "Devisé", en: "Quoted", ar: "مُسعَّر" },
  DEPOSIT_PENDING: { fr: "Acompte en attente", en: "Deposit pending", ar: "دفعة معلّقة" },
  DEPOSIT_RECEIVED: { fr: "Acompte reçu", en: "Deposit received", ar: "دفعة مستلمة" },
  IN_PROGRESS: { fr: "En cours", en: "In progress", ar: "قيد التنفيذ" },
  COMPLETED: { fr: "Terminée", en: "Completed", ar: "مكتملة" },
};

export function localizedStatusLabel(value: string, locale: Locale): string {
  const entry = STATUS_LABELS[value];
  if (entry) return entry[locale];
  return statusLabel(value);
}

export function StatusPill({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const { locale } = useStore();

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.12em]",
        TONES[value] ?? "border-line bg-background text-ink/70",
        className,
      )}
    >
      <span className="status-dot" />
      {localizedStatusLabel(value, locale)}
    </span>
  );
}

export function AdminCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-line/80 bg-surface/60 p-5 shadow-soft",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <p className="flex items-start gap-2 rounded-xl border border-red-600/20 bg-red-500/10 px-3 py-2 text-xs text-red-800">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      {message}
    </p>
  );
}

export function BusyLabel({ busy, label }: { busy: boolean; label: string }) {
  return (
    <>
      {busy ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : null}
      {label}
    </>
  );
}

export function Modal({
  open,
  title,
  subtitle,
  onClose,
  children,
  wide = false,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const { t } = useStore();

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/45 p-4 backdrop-blur-sm sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          "my-auto w-full rounded-3xl border border-line bg-background shadow-2xl",
          wide ? "max-w-5xl" : "max-w-2xl",
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line/80 px-6 py-5">
          <div>
            <p className="eyebrow">{t("Administration", "Administration", "الإدارة")}</p>
            <h2 className="mt-1 text-xl text-ink">{title}</h2>
            {subtitle ? (
              <p className="mt-1 text-xs text-muted">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-line p-2 text-muted transition hover:border-terracotta hover:text-terracotta"
            aria-label={t("Fermer", "Close", "إغلاق")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

/** Uniform JSON fetch with the API's error envelope unwrapped. */
export async function apiRequest<T>(
  url: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  const text = await response.text();
  let payload: unknown = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const error = (payload as {
      error?: { message?: string; details?: unknown };
    } | null)?.error;
    const details = error?.details;

    const suffix = Array.isArray(details)
      ? ` (${details
          .map((detail) =>
            typeof detail === "object" &&
            detail !== null &&
            "message" in detail
              ? String((detail as { message: unknown }).message)
              : String(detail),
          )
          .join(", ")})`
      : "";

    throw new Error(
      `${error?.message ?? `Requête échouée (${response.status}).`}${suffix}`,
    );
  }

  return payload as T;
}
