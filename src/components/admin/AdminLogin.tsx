"use client";

import { useState } from "react";
import { Loader2, LockKeyhole } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { apiRequest, ErrorNote } from "./admin-ui";

/**
 * Admin sign-in.
 *
 * The screen never reveals whether the email exists: wrong password and wrong
 * credentials both return the same message from the API.
 */
export function AdminLogin() {
  const { t } = useStore();
  const [email, setEmail] = useState(
    process.env.NEXT_PUBLIC_SEED_ADMIN_EMAIL ??
      "admin@zarbia-atlas.ma",
  );
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      await apiRequest("/api/admin/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      window.location.reload();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : t(
              "Connexion impossible.",
              "Sign-in failed.",
              "تعذّر تسجيل الدخول.",
            ),
      );
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="eyebrow-line justify-center">Zarbia Atlas</p>
          <h1 className="mt-3 text-3xl text-ink">
            {t("Administration", "Administration", "الإدارة")}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {t(
              "Accès réservé. Connexion par e-mail et mot de passe.",
              "Restricted access. Sign in with your email and password.",
              "دخول محصور. سجّل الدخول بالبريد الإلكتروني وكلمة المرور.",
            )}
          </p>
        </div>

        <form
          onSubmit={submit}
          className="rounded-3xl border border-line bg-surface/70 p-6 shadow-soft sm:p-8"
        >
          <div className="space-y-4">
            <label className="block">
              <span className="field-label">
                {t("Adresse e-mail", "Email address", "البريد الإلكتروني")}
              </span>
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="field"
                placeholder="admin@zarbia-atlas.ma"
              />
            </label>

            <label className="block">
              <span className="field-label">
                {t("Mot de passe", "Password", "كلمة المرور")}
              </span>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/60 rtl:left-auto rtl:right-3.5" />
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="field pl-10 rtl:pl-4 rtl:pr-10"
                  placeholder="••••••••"
                />
              </div>
            </label>
          </div>

          <div className="mt-5">
            <ErrorNote message={error} />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="btn-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {busy
              ? t("Vérification…", "Checking…", "جارٍ التحقق…")
              : t("Se connecter", "Sign in", "تسجيل الدخول")}
          </button>

          <p className="mt-5 text-center text-[0.68rem] leading-relaxed text-muted">
            {t(
              "Session sécurisée · expire après 8 heures",
              "Secure session · expires after 8 hours",
              "جلسة آمنة · تنتهي بعد 8 ساعات",
            )}
          </p>
        </form>
      </div>
    </main>
  );
}
