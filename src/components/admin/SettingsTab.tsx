"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/context/StoreContext";
import {
  BadgeDollarSign,
  Check,
  Download,
  Info,
  Mail,
  RefreshCw,
  Save,
  Truck,
} from "lucide-react";
import type {
  AdminCurrencyRate,
  AdminCurrencyRates,
  AdminShippingRate,
} from "@/lib/admin/types";
import {
  AdminCard,
  apiRequest,
  BusyLabel,
  ErrorNote,
  formatDateTime,
  formatMoney,
} from "./admin-ui";

const ZONE_LABELS: Record<string, string> = {
  MOROCCO: "Maroc",
  EUROPE: "Europe",
  USA_CANADA: "États-Unis / Canada",
  MIDDLE_EAST: "Moyen-Orient",
};

const ZONE_ORDER = ["MOROCCO", "EUROPE", "USA_CANADA", "MIDDLE_EAST"];

interface ShippingDraft {
  id: string;
  zone: string;
  minWeightKg: number;
  maxWeightKg: number;
  priceMad: string;
  carrier: string;
  estimatedDaysMin: string;
  estimatedDaysMax: string;
  isActive: boolean;
}

function toDraft(rates: AdminShippingRate[]): ShippingDraft[] {
  return rates.map((rate) => ({
    id: rate.id,
    zone: rate.zone,
    minWeightKg: rate.minWeightKg,
    maxWeightKg: rate.maxWeightKg,
    priceMad: String(rate.priceMad),
    carrier: rate.carrier ?? "",
    estimatedDaysMin: String(rate.estimatedDaysMin),
    estimatedDaysMax: String(rate.estimatedDaysMax),
    isActive: rate.isActive,
  }));
}

interface SettingsTabProps {
  rates: AdminCurrencyRates;
  currencyRates: AdminCurrencyRate[];
  shippingRates: AdminShippingRate[];
  isAdmin: boolean;
  onMutated: (message: string) => void;
}

/** Live exchange rates and the per-zone / per-weight shipping table. */
export function SettingsTab({
  rates,
  currencyRates,
  shippingRates,
  isAdmin,
  onMutated,
}: SettingsTabProps) {
  const { t } = useStore();
  const [eur, setEur] = useState(String(rates.EUR));
  const [usd, setUsd] = useState(String(rates.USD));
  const [draft, setDraft] = useState<ShippingDraft[]>(() =>
    toDraft(shippingRates),
  );
  const [currencyBusy, setCurrencyBusy] = useState(false);
  const [shippingBusy, setShippingBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [newsletterTotal, setNewsletterTotal] = useState<number | null>(null);
  const [newsletterError, setNewsletterError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    apiRequest<{ total: number }>("/api/admin/newsletter?limit=1")
      .then((payload) => {
        if (!cancelled) setNewsletterTotal(payload.total);
      })
      .catch(() => {
        if (!cancelled) setNewsletterError(t("Indisponible", "Unavailable", "غير متاح"));
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setEur(String(rates.EUR));
    setUsd(String(rates.USD));
  }, [rates]);

  useEffect(() => {
    setDraft(toDraft(shippingRates));
  }, [shippingRates]);

  const grouped = useMemo(() => {
    const groups = new Map<string, ShippingDraft[]>();

    for (const rate of draft) {
      const list = groups.get(rate.zone) ?? [];
      list.push(rate);
      groups.set(rate.zone, list);
    }

    return [...groups.entries()].sort(
      (a, b) => ZONE_ORDER.indexOf(a[0]) - ZONE_ORDER.indexOf(b[0]),
    );
  }, [draft]);

  const eurUpdated = currencyRates.find((rate) => rate.currency === "EUR");
  const usdUpdated = currencyRates.find((rate) => rate.currency === "USD");

  async function saveCurrency(event: React.FormEvent) {
    event.preventDefault();
    setCurrencyBusy(true);
    setError(null);

    try {
      await apiRequest("/api/admin/settings/currency", {
        method: "PUT",
        body: JSON.stringify({
          eurPerMad: Number(eur),
          usdPerMad: Number(usd),
        }),
      });
      onMutated(t("Taux de change mis à jour et prix recalculés.", "Exchange rates updated and prices recalculated.", "تم تحديث أسعار الصرف وإعادة حساب الأسعار."));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : t("Mise à jour impossible.", "Update failed.", "تعذّر التحديث."),
      );
    } finally {
      setCurrencyBusy(false);
    }
  }

  async function saveShipping(event: React.FormEvent) {
    event.preventDefault();
    setShippingBusy(true);
    setShippingError(null);

    try {
      await apiRequest("/api/admin/settings/shipping", {
        method: "PUT",
        body: JSON.stringify({
          rates: draft.map((rate) => ({
            id: rate.id,
            priceMad: Number(rate.priceMad),
            carrier: rate.carrier.trim(),
            estimatedDaysMin: Number(rate.estimatedDaysMin),
            estimatedDaysMax: Number(rate.estimatedDaysMax),
            isActive: rate.isActive,
          })),
        }),
      });
      onMutated(t("Tarifs de livraison mis à jour.", "Shipping rates updated.", "تم تحديث أسعار التوصيل."));
    } catch (cause) {
      setShippingError(
        cause instanceof Error ? cause.message : t("Mise à jour impossible.", "Update failed.", "تعذّر التحديث."),
      );
    } finally {
      setShippingBusy(false);
    }
  }

  function updateRate(id: string, patch: Partial<ShippingDraft>) {
    setDraft((current) =>
      current.map((rate) =>
        rate.id === id ? { ...rate, ...patch } : rate,
      ),
    );
  }

  return (
    <div className="space-y-5">
      {!isAdmin ? (
        <div className="flex items-start gap-2 rounded-2xl border border-amber-600/25 bg-amber-500/10 px-4 py-3 text-xs text-amber-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          {t(
            "Seul un compte ADMIN peut modifier les taux et les tarifs de livraison. Vous pouvez consulter les valeurs ci-dessous.",
            "Only an ADMIN account can edit rates and shipping fees. You can review the values below.",
            "يمكن لحساب ADMIN فقط تعديل الأسعار ورسوم التوصيل. يمكنك الاطلاع على القيم أدناه.",
          )}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1fr_1.2fr]">
        <AdminCard>
          <div className="flex items-center gap-2">
            <BadgeDollarSign className="h-5 w-5 text-terracotta" />
            <div>
              <p className="eyebrow">{t("Change", "Exchange", "الصرف")}</p>
              <h2 className="text-lg text-ink">{t("Taux EUR / USD vs MAD", "EUR / USD vs MAD rates", "أسعار EUR / USD مقابل MAD")}</h2>
            </div>
          </div>

          <form onSubmit={saveCurrency} className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="field-label">{t("1 MAD = … EUR", "1 MAD = … EUR", "1 MAD = … EUR")}</span>
                <input
                  required
                  type="number"
                  step="0.000001"
                  min={0.000001}
                  disabled={!isAdmin}
                  value={eur}
                  onChange={(event) => setEur(event.target.value)}
                  className="field disabled:opacity-70"
                />
              </label>
              <label className="block">
                <span className="field-label">{t("1 MAD = … USD", "1 MAD = … USD", "1 MAD = … USD")}</span>
                <input
                  required
                  type="number"
                  step="0.000001"
                  min={0.000001}
                  disabled={!isAdmin}
                  value={usd}
                  onChange={(event) => setUsd(event.target.value)}
                  className="field disabled:opacity-70"
                />
              </label>
            </div>

            <div className="grid gap-2 rounded-xl bg-background/70 p-3 text-xs text-muted">
              <p className="flex justify-between gap-3">
                <span>1 EUR</span>
                <span className="font-semibold text-ink">
                  {Number(eur) > 0
                    ? `${(1 / Number(eur)).toFixed(2)} MAD`
                    : "—"}
                </span>
              </p>
              <p className="flex justify-between gap-3">
                <span>1 USD</span>
                <span className="font-semibold text-ink">
                  {Number(usd) > 0
                    ? `${(1 / Number(usd)).toFixed(2)} MAD`
                    : "—"}
                </span>
              </p>
            </div>

            <p className="text-[0.66rem] leading-relaxed text-muted">
              {t(
                "Enregistrer recalcule immédiatement les prix EUR/USD de tous les tapis et de tous les tarifs de livraison.",
                "Saving immediately recalculates EUR/USD prices for all rugs and shipping rates.",
                "يُعيد الحفظ فوراً حساب أسعار EUR/USD لجميع الزرابي وأسعار التوصيل.",
              )}
            </p>

            <div className="flex items-center justify-between gap-3">
              <p className="text-[0.62rem] text-muted">
                EUR : {formatDateTime(eurUpdated?.updatedAt)} · USD :{" "}
                {formatDateTime(usdUpdated?.updatedAt)}
              </p>
              {isAdmin ? (
                <button
                  type="submit"
                  disabled={currencyBusy}
                  className="btn-primary px-4 py-2.5 text-xs disabled:opacity-60"
                >
                  <BusyLabel busy={currencyBusy} label={t("Appliquer", "Apply", "تطبيق")} />
                </button>
              ) : null}
            </div>

            <ErrorNote message={error} />
          </form>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-terracotta" />
            <div>
              <p className="eyebrow">{t("Logistique", "Logistics", "اللوجستيك")}</p>
              <h2 className="text-lg text-ink">{t("Grille de livraison", "Shipping grid", "شبكة التوصيل")}</h2>
            </div>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            Les tranches sont semi-ouvertes : un colis de 2 kg utilise la
            tranche 2–5 kg. Les prix EUR/USD sont recalculés depuis le MAD.
          </p>

          <form onSubmit={saveShipping} className="mt-4 space-y-4">
            {grouped.map(([zone, rows]) => (
              <div key={zone}>
                <p className="mb-2 text-[0.66rem] font-bold uppercase tracking-[0.14em] text-terracotta">
                  {ZONE_LABELS[zone] ?? zone}
                </p>
                <div className="space-y-2">
                  {rows.map((rate) => (
                    <div
                      key={rate.id}
                      className="rounded-xl border border-line/80 bg-background/70 p-2.5"
                    >
                      <div className="mb-2 flex items-center justify-between gap-2 text-[0.66rem] text-muted">
                        <span>
                          {rate.minWeightKg}–{rate.maxWeightKg} kg
                        </span>
                        <label className="flex items-center gap-1.5">
                          <input
                            type="checkbox"
                            disabled={!isAdmin}
                            checked={rate.isActive}
                            onChange={(event) =>
                              updateRate(rate.id, {
                                isActive: event.target.checked,
                              })
                            }
                            className="h-3.5 w-3.5 accent-terracotta"
                          />
                          Active
                        </label>
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                        <label className="col-span-2 sm:col-span-1">
                          <span className="mb-1 block text-[0.58rem] uppercase tracking-[0.1em] text-muted">
                            MAD
                          </span>
                          <input
                            required
                            type="number"
                            min={0.01}
                            step="0.01"
                            disabled={!isAdmin}
                            value={rate.priceMad}
                            onChange={(event) =>
                              updateRate(rate.id, {
                                priceMad: event.target.value,
                              })
                            }
                            className="field h-9 px-2 text-xs disabled:opacity-70"
                          />
                        </label>
                        <label>
                          <span className="mb-1 block text-[0.58rem] uppercase tracking-[0.1em] text-muted">
                            Jours min
                          </span>
                          <input
                            required
                            type="number"
                            min={0}
                            max={120}
                            disabled={!isAdmin}
                            value={rate.estimatedDaysMin}
                            onChange={(event) =>
                              updateRate(rate.id, {
                                estimatedDaysMin: event.target.value,
                              })
                            }
                            className="field h-9 px-2 text-xs disabled:opacity-70"
                          />
                        </label>
                        <label>
                          <span className="mb-1 block text-[0.58rem] uppercase tracking-[0.1em] text-muted">
                            Jours max
                          </span>
                          <input
                            required
                            type="number"
                            min={0}
                            max={120}
                            disabled={!isAdmin}
                            value={rate.estimatedDaysMax}
                            onChange={(event) =>
                              updateRate(rate.id, {
                                estimatedDaysMax: event.target.value,
                              })
                            }
                            className="field h-9 px-2 text-xs disabled:opacity-70"
                          />
                        </label>
                        <label className="col-span-2 sm:col-span-1">
                          <span className="mb-1 block text-[0.58rem] uppercase tracking-[0.1em] text-muted">
                            Transporteur
                          </span>
                          <input
                            disabled={!isAdmin}
                            value={rate.carrier}
                            onChange={(event) =>
                              updateRate(rate.id, {
                                carrier: event.target.value,
                              })
                            }
                            placeholder="Amana"
                            className="field h-9 px-2 text-xs disabled:opacity-70"
                          />
                        </label>
                      </div>

                      <div className="mt-1.5 flex gap-3 text-[0.6rem] text-muted">
                        <span>
                          ≈ {formatMoney(Number(rate.priceMad) * rates.EUR, "EUR")}
                        </span>
                        <span>
                          ≈ {formatMoney(Number(rate.priceMad) * rates.USD, "USD")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <ErrorNote message={shippingError} />

            <div className="flex items-center justify-between gap-3 border-t border-line/80 pt-3">
              <p className="flex items-center gap-1.5 text-[0.62rem] text-muted">
                <RefreshCw className="h-3 w-3" />
                {draft.length} tranches
              </p>
              {isAdmin ? (
                <button
                  type="submit"
                  disabled={shippingBusy}
                  className="btn-primary px-4 py-2.5 text-xs disabled:opacity-60"
                >
                  {shippingBusy ? (
                    <BusyLabel busy label="Enregistrement…" />
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" />
                      Enregistrer la grille
                    </>
                  )}
                </button>
              ) : null}
            </div>
          </form>
        </AdminCard>
      </div>

      <AdminCard>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-terracotta" />
            <div>
              <p className="eyebrow">{t("Audience", "Audience", "الجمهور")}</p>
              <h2 className="text-lg text-ink">
                {t("Lettre de l’Atlas", "Atlas letter", "رسائل الأطلس")}
              </h2>
            </div>
          </div>

          <a
            href="/api/admin/newsletter?format=csv"
            className="btn-ghost px-4 py-2.5 text-xs"
          >
            <Download className="h-3.5 w-3.5" />
            {t("Exporter en CSV", "Export CSV", "تصدير CSV")}
          </a>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-line bg-background/70 p-4">
            <p className="text-[0.62rem] uppercase tracking-[0.16em] text-muted">
              {t("Abonnés actifs", "Active subscribers", "المشتركون النشطون")}
            </p>
            <p className="mt-1 font-serif text-3xl font-semibold text-ink tabular">
              {newsletterTotal === null ? "—" : newsletterTotal}
            </p>
          </div>
          <div className="rounded-xl border border-line bg-background/70 p-4">
            <p className="text-[0.62rem] uppercase tracking-[0.16em] text-muted">
              {t("Inscriptions", "Sign-ups", "الاشتراكات")}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {t(
                "Les adresses sont collectées depuis le formulaire d’accueil et exportables à tout moment.",
                "Addresses are collected from the home form and can be exported at any time.",
                "تُجمع العناوين من نموذج الصفحة الرئيسية ويمكن تصديرها في أي وقت.",
              )}
            </p>
          </div>
        </div>

        <ErrorNote message={newsletterError} />
      </AdminCard>

      <div className="flex items-center gap-2 text-[0.66rem] text-muted">
        <Check className="h-3.5 w-3.5 text-emerald-700" />
        Les modifications de réglages sont réservées au rôle ADMIN et
        journalisées par la base (updatedAt).
      </div>
    </div>
  );
}
