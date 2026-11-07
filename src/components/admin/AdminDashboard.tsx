"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Boxes,
  ClipboardList,
  Globe2,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  Ruler,
  Settings,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import type {
  AdminDashboardData,
  AdminSessionView,
} from "@/lib/admin/types";
import { cn } from "@/lib/utils";
import { apiRequest } from "./admin-ui";
import { OverviewTab } from "./OverviewTab";
import { RugsTab } from "./RugsTab";
import { OrdersTab } from "./OrdersTab";
import { CustomOrdersTab } from "./CustomOrdersTab";
import { SettingsTab } from "./SettingsTab";

type TabId = "overview" | "rugs" | "orders" | "custom" | "settings";

interface AdminDashboardProps {
  session: AdminSessionView;
  data: AdminDashboardData;
}

/** Multi-tab back-office shell. Mutations use router.refresh() to reload. */
export function AdminDashboard({ session, data }: AdminDashboardProps) {
  const router = useRouter();
  const { locale, setLocale, t } = useStore();
  const [tab, setTab] = useState<TabId>("overview");
  const [toast, setToast] = useState<{ id: number; text: string } | null>(
    null,
  );
  const [loggingOut, setLoggingOut] = useState(false);
  const [refreshing, startTransition] = useTransition();

  const roleLabel =
    session.role === "ADMIN"
      ? t("Administrateur", "Administrator", "مدير النظام")
      : session.role === "MANAGER"
        ? t("Gestionnaire", "Manager", "مسير")
        : t("Lecture seule", "Read-only", "قراءة فقط");

  const canWrite = session.role !== "READONLY";
  const isAdmin = session.role === "ADMIN";

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timeout);
  }, [toast]);

  function onMutated(message: string) {
    setToast({ id: Date.now(), text: message });
    startTransition(() => router.refresh());
  }

  async function logout() {
    setLoggingOut(true);

    try {
      await apiRequest("/api/admin/auth/logout", { method: "POST" });
    } finally {
      window.location.reload();
    }
  }

  const tabs: Array<{
    id: TabId;
    label: string;
    icon: typeof LayoutDashboard;
    badge?: number;
  }> = [
    {
      id: "overview",
      label: t("Vue d’ensemble", "Overview", "نظرة عامة"),
      icon: LayoutDashboard,
    },
    {
      id: "rugs",
      label: t("Tapis & stock", "Rugs & stock", "الزرابي والمخزون"),
      icon: Boxes,
      badge: data.kpis.reservedRugs || undefined,
    },
    {
      id: "orders",
      label: t("Commandes", "Orders", "الطلبات"),
      icon: ClipboardList,
      badge: data.kpis.ordersToProcess || undefined,
    },
    {
      id: "custom",
      label: t("Sur-mesure", "Bespoke", "حسب الطلب"),
      icon: Ruler,
      badge:
        data.customOrders.filter(
          (order) =>
            order.status !== "COMPLETED" && order.status !== "CANCELLED",
        ).length || undefined,
    },
    {
      id: "settings",
      label: t("Réglages", "Settings", "الإعدادات"),
      icon: Settings,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-line/80 bg-background/90 backdrop-blur">
        <div className="container-page flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-terracotta/25 bg-terracotta/10 text-terracotta">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <p className="eyebrow">Zarbia Atlas</p>
              <h1 className="text-lg font-semibold text-ink">
                {t("Espace administration", "Admin area", "لوحة الإدارة")}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-full border border-line bg-surface/60 p-0.5">
              {(["fr", "en", "ar"] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLocale(code)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-wider transition",
                    locale === code
                      ? "bg-ink text-background"
                      : "text-ink/60 hover:text-ink",
                  )}
                >
                  {code}
                </button>
              ))}
            </div>

            <span className="pill">
              <ShieldCheck className="h-3 w-3 text-emerald-700" />
              {roleLabel}
            </span>
            <span className="hidden text-xs text-muted sm:block">
              {session.name} · {session.email}
            </span>
            <button
              type="button"
              onClick={() => startTransition(() => router.refresh())}
              disabled={refreshing}
              className="btn-outline px-3 py-2 text-[0.68rem] disabled:opacity-60"
              title={t("Recharger les données", "Reload data", "تحديث البيانات")}
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", refreshing && "animate-spin")}
              />
              {t("Actualiser", "Refresh", "تحديث")}
            </button>
            <button
              type="button"
              onClick={logout}
              disabled={loggingOut}
              className="btn-ghost px-3 py-2 text-[0.68rem] disabled:opacity-60"
            >
              <LogOut className="h-3.5 w-3.5" />
              {loggingOut
                ? t("Déconnexion…", "Signing out…", "تسجيل الخروج…")
                : t("Déconnexion", "Sign out", "تسجيل الخروج")}
            </button>
          </div>
        </div>

        <div className="container-page">
          <nav className="no-scrollbar flex gap-1 overflow-x-auto pb-3">
            {tabs.map((item) => {
              const active = tab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition",
                    active
                      ? "border-terracotta bg-terracotta text-background"
                      : "border-line bg-surface/60 text-ink/70 hover:border-terracotta hover:text-terracotta",
                  )}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                  {item.badge ? (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[0.58rem] font-bold",
                        active
                          ? "bg-background/20 text-background"
                          : "bg-terracotta/15 text-terracotta",
                      )}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="container-page py-6">
        {tab === "overview" ? <OverviewTab data={data} /> : null}

        {tab === "rugs" ? (
          <RugsTab
            rugs={data.rugs}
            artisans={data.artisans}
            rates={data.rates}
            canWrite={canWrite}
            onMutated={onMutated}
          />
        ) : null}

        {tab === "orders" ? (
          <OrdersTab
            orders={data.orders}
            canWrite={canWrite}
            onMutated={onMutated}
          />
        ) : null}

        {tab === "custom" ? (
          <CustomOrdersTab
            customOrders={data.customOrders}
            canWrite={canWrite}
            onMutated={onMutated}
          />
        ) : null}

        {tab === "settings" ? (
          <SettingsTab
            rates={data.rates}
            currencyRates={data.currencyRates}
            shippingRates={data.shippingRates}
            isAdmin={isAdmin}
            onMutated={onMutated}
          />
        ) : null}
      </main>

      {toast ? (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 z-40 w-[min(92vw,26rem)] -translate-x-1/2 rounded-2xl border border-emerald-700/25 bg-emerald-900 px-4 py-3 text-center text-xs font-medium text-background shadow-xl"
        >
          {toast.text}
        </div>
      ) : null}
    </div>
  );
}
