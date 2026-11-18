"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Loader2, Package } from "lucide-react";
import { useStore } from "@/context/StoreContext";

export function TrackView() {
  const { t } = useStore();
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderNumber, email }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { orderId?: string; token?: string; error?: { message?: string } }
        | null;
      if (!response.ok || !payload?.orderId || !payload.token) {
        setError(
          payload?.error?.message ??
            t(
              "Aucune commande ne correspond à ces informations.",
              "No order matches these details.",
              "لا يوجد طلب يطابق هذه المعلومات.",
            ),
        );
        return;
      }
      window.location.href = `/order/${payload.orderId}?token=${encodeURIComponent(payload.token)}`;
    } catch {
      setError(
        t(
          "Connexion impossible. Réessayez.",
          "Connection failed. Try again.",
          "تعذّر الاتصال. حاول مرة أخرى.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header Hero */}
      <section className="relative overflow-hidden border-b border-line/70 bg-ink text-white">
        <Image
          src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=2000&q=85"
          alt="Expédition et soin artisanal"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/92 via-black/75 to-black/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40" />
        <div className="container-page relative z-10 py-16 sm:py-24">
          <nav
            aria-label={t("Fil d’Ariane", "Breadcrumb", "مسار التنقل")}
            className="flex items-center gap-2 text-[0.66rem] uppercase tracking-[0.2em] text-white/60"
          >
            <Link href="/" className="transition hover:text-gold">
              {t("Accueil", "Home", "الرئيسية")}
            </Link>
            <span>/</span>
            <span className="text-gold">{t("Suivi", "Track", "تتبع الطلب")}</span>
          </nav>

          <div className="mt-8 max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1 text-[0.7rem] font-medium tracking-[0.2em] text-gold uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              {t("Suivi de commande", "Order tracking", "تتبّع الطلب")}
            </span>
            <h1 className="mt-5 font-serif text-4xl font-semibold text-white sm:text-5xl">
              {t("Où en est votre pièce ?", "Where is your rug?", "أين وصلت قطعتك؟")}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-white/80">
              {t(
                "Suivez chaque étape : tissage, lavage en montagne, finitions et expédition sécurisée.",
                "Track every stage: weaving, mountain wash, finishing and secure shipping.",
                "تابع كل مرحلة: النسيج، الغسيل الجبلي، اللمسات الأخيرة والشحن الآمن.",
              )}
            </p>
          </div>
        </div>
      </section>

      <div className="container-page flex items-center justify-center py-14 sm:py-20">
        <div className="w-full max-w-md rounded-[2.5rem] border border-line bg-background p-7 shadow-luxury sm:p-9">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-surface text-terracotta">
            <Package className="h-5 w-5" />
          </span>
          <p className="eyebrow mt-6">
            {t("Espace Client", "Client Portal", "فضاء الزبون")}
          </p>
          <h2 className="mt-2 font-serif text-2xl font-semibold">
            {t("Retrouver ma commande", "Find my order", "ابحث عن طلبي")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {t(
              "Indiquez la référence reçue par e-mail et l'adresse utilisée.",
              "Enter the reference from your e-mail and the address used.",
              "أدخل المرجع الوارد في بريدك والعنوان المستعمل.",
            )}
          </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block">
            <span className="field-label">
              {t("Référence de commande", "Order reference", "مرجع الطلب")}
            </span>
            <input
              required
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="ZA-2026-XXXXXXXX"
              className="field"
            />
          </label>
          <label className="block">
            <span className="field-label">
              {t("Adresse e-mail", "Email address", "البريد الإلكتروني")}
            </span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field"
            />
          </label>
          {error ? (
            <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-[0.72rem] text-red-700">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-terracotta px-5 py-3 text-sm font-semibold text-background transition hover:bg-terracottaDark"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("Recherche…", "Searching…", "جارٍ البحث…")}
              </>
            ) : (
              <>
                {t("Accéder", "Open", "فتح")}
                <ArrowRight className="h-4 w-4 rtl-flip" />
              </>
            )}
          </button>
        </form>
      </div>
      </div>
    </div>
  );
}
