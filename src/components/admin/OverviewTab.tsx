"use client";

import {
  ArrowUpRight,
  Banknote,
  CalendarDays,
  Eye,
  PackageCheck,
  Palette,
  ShoppingBag,
  Sparkles,
  Timer,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import type { AdminDashboardData } from "@/lib/admin/types";
import { cn } from "@/lib/utils";
import {
  AdminCard,
  formatDateTime,
  formatMoney,
  StatusPill,
} from "./admin-ui";

/** Today/month sales, operational counters and the most-viewed rugs. */
export function OverviewTab({ data }: { data: AdminDashboardData }) {
  const { t, locale } = useStore();
  const { kpis, rates } = data;
  const openCustom = data.customOrders.filter(
    (order) =>
      order.status !== "COMPLETED" && order.status !== "CANCELLED",
  ).length;
  const deposits = data.customOrders.filter(
    (order) => order.status === "DEPOSIT_RECEIVED",
  ).length;

  const ordersUnit = t("commande(s)", "order(s)", "طلب/طلبات");

  const cards = [
    {
      icon: Banknote,
      label: t("Ventes du jour", "Today’s sales", "مبيعات اليوم"),
      value: formatMoney(kpis.today.mad, "MAD"),
      detail: `${kpis.today.orders} ${ordersUnit} · ${formatMoney(
        kpis.today.eur,
        "EUR",
      )} · ${formatMoney(kpis.today.usd, "USD")}`,
    },
    {
      icon: TrendingUp,
      label: t("Ventes du mois", "This month’s sales", "مبيعات الشهر"),
      value: formatMoney(kpis.month.mad, "MAD"),
      detail: `${kpis.month.orders} ${ordersUnit} · ${formatMoney(
        kpis.month.eur,
        "EUR",
      )} · ${formatMoney(kpis.month.usd, "USD")}`,
    },
    {
      icon: ShoppingBag,
      label: t("Commandes à traiter", "Orders to process", "طلبات للمعالجة"),
      value: String(kpis.ordersToProcess),
      detail: t(
        "COD, payées ou en préparation",
        "COD, paid or being prepared",
        "الدفع عند الاستلام، مدفوعة أو قيد التحضير",
      ),
    },
    {
      icon: Timer,
      label: t("Tapis réservés", "Reserved rugs", "زرابي محجوزة"),
      value: String(kpis.reservedRugs),
      detail: t(
        "Verrous de 15 minutes en cours",
        "Active 15-minute holds",
        "حجوزات 15 دقيقة جارية",
      ),
    },
  ];

  const counters = [
    {
      icon: PackageCheck,
      label: t("Disponibles", "Available", "متوفرة"),
      value: kpis.availableRugs,
    },
    {
      icon: Sparkles,
      label: t("Vendus", "Sold", "مباعة"),
      value: kpis.soldRugs,
    },
    {
      icon: Palette,
      label: t("Sur-mesure ouverts", "Open bespoke", "طلبات خاصة مفتوحة"),
      value: openCustom,
    },
    {
      icon: CalendarDays,
      label: t("Acomptes reçus", "Deposits received", "دفعات مستلمة"),
      value: deposits,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <AdminCard key={card.label} className="relative overflow-hidden">
            <card.icon className="mb-4 h-5 w-5 text-terracotta" />
            <p className="text-[0.64rem] font-bold uppercase tracking-[0.16em] text-muted">
              {card.label}
            </p>
            <p className="tabular mt-2 font-serif text-2xl text-ink">
              {card.value}
            </p>
            <p className="mt-1 text-[0.7rem] leading-snug text-muted">
              {card.detail}
            </p>
          </AdminCard>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {counters.map((counter) => (
          <div
            key={counter.label}
            className="flex items-center justify-between rounded-2xl border border-line/70 bg-background/70 px-4 py-3"
          >
            <span className="flex items-center gap-2 text-xs text-muted">
              <counter.icon className="h-4 w-4 text-terracotta" />
              {counter.label}
            </span>
            <span className="tabular font-serif text-xl text-ink">
              {counter.value}
            </span>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <AdminCard className="p-0">
          <div className="flex items-center justify-between gap-4 border-b border-line/80 px-5 py-4">
            <div>
              <p className="eyebrow-line">{t("Vitrine", "Storefront", "الواجهة")}</p>
              <h2 className="mt-2 text-lg text-ink">
                {t(
                  "Tapis les plus consultés",
                  "Most viewed rugs",
                  "الزرابي الأكثر مشاهدة",
                )}
              </h2>
            </div>
            <span className="pill">
              <Eye className="h-3 w-3" />
              {data.mostViewed.reduce((sum, rug) => sum + rug.viewCount, 0)}{" "}
              {t("vues", "views", "مشاهدة")}
            </span>
          </div>

          {data.mostViewed.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted">
              {t(
                "Aucune vue enregistrée pour le moment.",
                "No views recorded yet.",
                "لا توجد مشاهدات مسجلة بعد.",
              )}
            </p>
          ) : (
            <ul className="divide-y divide-line/70">
              {data.mostViewed.map((rug, index) => (
                <li key={rug.id}>
                  <Link
                    href={`/rugs/${rug.slug}`}
                    target="_blank"
                    className="flex items-center gap-4 px-5 py-3 transition hover:bg-background/70"
                  >
                    <span className="w-5 text-center font-serif text-lg text-muted">
                      {index + 1}
                    </span>
                    <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-line bg-surface">
                      {rug.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={rug.photo}
                          alt={rug.nameFr}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">
                        {rug.nameAr && locale === "ar" ? rug.nameAr : rug.nameFr}
                      </span>
                      <span className="mt-0.5 block font-mono text-[0.64rem] text-muted">
                        {rug.sku}
                      </span>
                    </span>
                    <StatusPill value={rug.status} />
                    <span className="tabular w-16 text-right text-sm font-semibold text-terracotta">
                      {rug.viewCount}
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>

        <div className="space-y-4">
          <AdminCard>
            <p className="eyebrow-line">{t("Change", "Exchange", "الصرف")}</p>
            <h2 className="mt-2 text-lg text-ink">
              {t("Taux appliqués", "Applied rates", "الأسعار المطبقة")}
            </h2>
            <dl className="mt-4 space-y-2 text-sm">
              {(
                [
                  ["1 EUR =", `${Math.round((1 / rates.EUR) * 100) / 100} MAD`],
                  ["1 USD =", `${Math.round((1 / rates.USD) * 100) / 100} MAD`],
                ] as const
              ).map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-xl bg-background/70 px-3 py-2"
                >
                  <dt className="text-muted">{label}</dt>
                  <dd className="font-semibold text-ink">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-[0.66rem] leading-relaxed text-muted">
              {t(
                "Les prix EUR/USD du catalogue sont recalculés depuis le MAD à chaque mise à jour.",
                "Catalogue EUR/USD prices are recalculated from MAD on every update.",
                "تُعاد أسعار الكتالوج باليورو والدولار من الدرهم عند كل تحديث.",
              )}
            </p>
          </AdminCard>

          <AdminCard>
            <p className="eyebrow-line">{t("Activité", "Activity", "النشاط")}</p>
            <h2 className="mt-2 text-lg text-ink">
              {t("Dernières commandes", "Latest orders", "أحدث الطلبات")}
            </h2>
            {data.orders.length === 0 ? (
              <p className="mt-4 text-sm text-muted">
                {t(
                  "Aucune commande enregistrée.",
                  "No orders recorded.",
                  "لا توجد طلبات مسجلة.",
                )}
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {data.orders.slice(0, 5).map((order) => (
                  <li
                    key={order.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-background/70 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-mono text-[0.68rem] text-ink">
                        {order.orderNumber}
                      </p>
                      <p className="truncate text-[0.66rem] text-muted">
                        {order.fullName}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="tabular text-xs font-semibold text-ink">
                        {formatMoney(order.totalAmount, order.currency)}
                      </p>
                      <StatusPill
                        value={order.status}
                        className={cn(
                          "mt-1 scale-90",
                          "origin-right",
                        )}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 text-[0.66rem] text-muted">
              {t("Données générées le", "Data generated on", "بيانات مُنشأة في")}{" "}
              {formatDateTime(data.generatedAt)}
            </p>
          </AdminCard>
        </div>
      </div>
    </div>
  );
}
