"use client";

import { useState } from "react";
import { ArrowRight, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { cn } from "@/lib/utils";

/**
 * Shown when an order link is opened without a valid access token.
 *
 * The customer proves ownership with the order number (sent by e-mail) and
 * the e-mail address used at checkout. On success the API returns a signed
 * link and the browser navigates to the real confirmation page.
 */
export function OrderAccessGate({ orderId }: { orderId: string }) {
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
      const response = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId, orderNumber, email }),
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

      window.location.href = `/order/${payload.orderId}?token=${encodeURIComponent(
        payload.token,
      )}`;
    } catch {
      setError(
        t(
          "Connexion impossible. Vérifiez votre réseau et réessayez.",
          "Connection failed. Check your network and try again.",
          "تعذّر الاتصال. تحقّق من شبكتك وحاول مرة أخرى.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-md rounded-[2rem] border border-line bg-background p-7 shadow-luxury sm:p-9">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-surface text-terracotta">
          <LockKeyhole className="h-5 w-5" />
        </span>

        <p className="eyebrow mt-6">
          {t("Commande protégée", "Protected order", "طلب محمي")}
        </p>
        <h1 className="mt-2 font-serif text-3xl font-semibold leading-tight">
          {t(
            "Confirmez votre identité",
            "Confirm your identity",
            "أكّد هويتك",
          )}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {t(
            "Pour protéger vos coordonnées, indiquez la référence de commande reçue par e-mail et l’adresse utilisée lors de l’achat.",
            "To protect your details, enter the order reference from your e-mail and the address used at checkout.",
            "لحماية بياناتك، أدخل مرجع الطلب الوارد في بريدك والعنوان المستعمل عند الشراء.",
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
              onChange={(event) => setOrderNumber(event.target.value)}
              placeholder="ZA-2026-XXXXXXXX"
              autoComplete="off"
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
              onChange={(event) => setEmail(event.target.value)}
              placeholder="vous@exemple.com"
              autoComplete="email"
              className="field"
            />
          </label>

          {error ? (
            <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-[0.72rem] leading-relaxed text-red-700">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition",
              busy
                ? "cursor-wait bg-ink/15 text-ink/45"
                : "bg-terracotta text-background hover:bg-terracottaDark hover:shadow-soft",
            )}
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("Vérification…", "Checking…", "جارٍ التحقّق…")}
              </>
            ) : (
              <>
                {t("Accéder à ma commande", "Open my order", "فتح طلبي")}
                <ArrowRight className="h-4 w-4 rtl-flip" />
              </>
            )}
          </button>
        </form>

        <p className="mt-5 flex items-start gap-2 text-[0.68rem] leading-relaxed text-muted">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-terracotta" />
          {t(
            "Vos coordonnées ne sont jamais affichées sans cette vérification. Besoin d’aide ? Écrivez-nous sur WhatsApp.",
            "Your details are never shown without this check. Need help? Message us on WhatsApp.",
            "لا تُعرض بياناتك أبداً دون هذا التحقق. تحتاج مساعدة؟ راسلنا على واتساب.",
          )}
        </p>
      </div>
    </div>
  );
}
