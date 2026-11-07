"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/context/StoreContext";
import {
  ChevronDown,
  CreditCard,
  Mail,
  MessageCircle,
  Palette,
  Phone,
  Search,
  Ruler,
} from "lucide-react";
import type { AdminCustomOrder } from "@/lib/admin/types";
import type { CustomOrderStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import {
  AdminCard,
  apiRequest,
  BusyLabel,
  ErrorNote,
  formatDate,
  formatMoney,
  StatusPill,
} from "./admin-ui";

const STATUSES: CustomOrderStatus[] = [
  "NEW",
  "QUOTED",
  "DEPOSIT_PENDING",
  "DEPOSIT_RECEIVED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

const DEPOSIT_PERCENT = 30;

interface CustomOrdersTabProps {
  customOrders: AdminCustomOrder[];
  canWrite: boolean;
  onMutated: (message: string) => void;
}

/** Bespoke commissions: quote, 30% deposit and production status. */
export function CustomOrdersTab({
  customOrders,
  canWrite,
  onMutated,
}: CustomOrdersTabProps) {
  const { t } = useStore();
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [form, setForm] = useState({
    status: "NEW" as CustomOrderStatus,
    quotedPriceMad: "",
    depositMad: "",
    adminNote: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    if (!needle) return customOrders;

    return customOrders.filter((order) =>
      [
        order.reference,
        order.fullName,
        order.email,
        order.phone,
        order.description,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [customOrders, query]);

  const openCount = customOrders.filter(
    (order) => order.status !== "COMPLETED" && order.status !== "CANCELLED",
  ).length;
  const depositTotal = customOrders
    .filter((order) => order.status === "DEPOSIT_RECEIVED")
    .reduce((sum, order) => sum + (order.depositMad ?? 0), 0);

  function toggle(order: AdminCustomOrder) {
    if (openId === order.id) {
      setOpenId(null);
      return;
    }

    setOpenId(order.id);
    setForm({
      status: order.status,
      quotedPriceMad:
        order.quotedPriceMad === null ? "" : String(order.quotedPriceMad),
      depositMad:
        order.depositMad === null ? "" : String(order.depositMad),
      adminNote: order.adminNote ?? "",
    });
    setError(null);
  }

  async function save(order: AdminCustomOrder) {
    setBusy(true);
    setError(null);

    try {
      await apiRequest(`/api/admin/custom-orders/${order.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: form.status,
          quotedPriceMad: form.quotedPriceMad
            ? Number(form.quotedPriceMad)
            : null,
          depositMad: form.depositMad ? Number(form.depositMad) : null,
          adminNote: form.adminNote.trim(),
        }),
      });
      onMutated(`${order.reference} mis à jour.`);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Mise à jour impossible.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <AdminCard>
          <p className="field-label">{t("Demandes ouvertes", "Open requests", "طلبات مفتوحة")}</p>
          <p className="font-serif text-2xl text-ink">{openCount}</p>
        </AdminCard>
        <AdminCard>
          <p className="field-label">{t("Acomptes reçus", "Deposits received", "دفعات مستلمة")}</p>
          <p className="font-serif text-2xl text-ink">
            {formatMoney(depositTotal, "MAD")}
          </p>
        </AdminCard>
        <AdminCard className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/60" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="field pl-10"
              placeholder="Référence, client…"
            />
          </div>
        </AdminCard>
      </div>

      <ErrorNote message={error} />

      {filtered.length === 0 ? (
        <AdminCard>
          <p className="py-10 text-center text-sm text-muted">
            {t("Aucune demande de sur-mesure.", "No bespoke requests.", "لا توجد طلبات خاصة.")}
          </p>
        </AdminCard>
      ) : (
        <ul className="space-y-3">
          {filtered.map((order) => {
            const expanded = openId === order.id;

            return (
              <li
                key={order.id}
                className="overflow-hidden rounded-2xl border border-line/80 bg-background/70"
              >
                <div className="flex items-center gap-3 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggle(order)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-terracotta">
                      <Palette className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-mono text-[0.7rem] font-semibold text-ink">
                        {order.reference}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {order.fullName} · {formatDate(order.createdAt)}
                        {order.widthCm && order.lengthCm
                          ? ` · ${order.widthCm} × ${order.lengthCm} cm`
                          : ""}
                      </span>
                    </span>
                    <span className="hidden shrink-0 text-right sm:block">
                      <span className="block text-sm font-semibold text-ink">
                        {formatMoney(order.budgetMad, "MAD")}
                      </span>
                      <span className="block text-[0.62rem] text-muted">
                        {t("Budget", "Budget", "الميزانية")}
                      </span>
                    </span>
                  </button>

                  <StatusPill value={order.status} />

                  <button
                    type="button"
                    onClick={() => toggle(order)}
                    className="rounded-lg border border-line p-2 text-muted transition hover:border-terracotta hover:text-terracotta"
                    aria-label="Détails"
                  >
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 transition-transform",
                        expanded && "rotate-180",
                      )}
                    />
                  </button>
                </div>

                {expanded ? (
                  <div className="border-t border-line/70 bg-surface/40 px-4 py-4">
                    <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
                      <div className="space-y-3 text-xs">
                        <div>
                          <p className="field-label">{t("Client", "Customer", "العميل")}</p>
                          <p className="font-medium text-ink">
                            {order.fullName}
                          </p>
                          <p className="mt-1 flex items-center gap-1.5 text-muted">
                            <Mail className="h-3 w-3" />
                            <a
                              href={`mailto:${order.email}`}
                              className="hover:text-terracotta"
                            >
                              {order.email}
                            </a>
                          </p>
                          <p className="mt-1 flex items-center gap-1.5 text-muted">
                            <Phone className="h-3 w-3" />
                            <a
                              href={`tel:${order.phone}`}
                              className="hover:text-terracotta"
                            >
                              {order.phone}
                            </a>
                          </p>
                        </div>

                        <div>
                          <p className="field-label">{t("Cahier des charges", "Brief", "المواصفات")}</p>
                          <div className="space-y-1 text-muted">
                            <p className="flex items-center gap-1.5">
                              <Ruler className="h-3 w-3" />
                              {order.rugType ?? "Type libre"} ·{" "}
                              {order.widthCm ?? "?"} × {order.lengthCm ?? "?"} cm
                            </p>
                            {order.woolColors.length > 0 ? (
                              <p>
                                {t("Couleurs", "Colors", "الألوان")} : {order.woolColors.join(", ")}
                              </p>
                            ) : null}
                            {order.pattern ? (
                              <p>{t("Motif", "Pattern", "النقش")} : {order.pattern}</p>
                            ) : null}
                          </div>
                          <p className="mt-2 rounded-lg bg-background/80 px-3 py-2 text-muted">
                            {order.description}
                          </p>
                        </div>

                        {order.inspirationPhotos.length > 0 ? (
                          <div>
                            <p className="field-label">
                              {t("Photos d’inspiration", "Inspiration photos", "صور الإلهام")}
                            </p>
                            <div className="flex gap-2 overflow-x-auto pb-1">
                              {order.inspirationPhotos.map((photo, index) => (
                                <a
                                  key={`${photo}-${index}`}
                                  href={photo}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-line bg-surface"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={photo}
                                    alt=""
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                  />
                                </a>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-lg bg-background/80 px-3 py-2">
                            <p className="text-[0.62rem] uppercase tracking-[0.1em] text-muted">
                              {t("Devis", "Quote", "عرض سعر")}
                            </p>
                            <p className="mt-0.5 font-semibold text-ink">
                              {formatMoney(order.quotedPriceMad, "MAD")}
                            </p>
                          </div>
                          <div className="rounded-lg bg-background/80 px-3 py-2">
                            <p className="text-[0.62rem] uppercase tracking-[0.1em] text-muted">
                              {t("Acompte 30 %", "Deposit 30%", "تسبيق 30%")}
                            </p>
                            <p className="mt-0.5 font-semibold text-ink">
                              {formatMoney(order.depositMad, "MAD")}
                            </p>
                          </div>
                        </div>

                        <p className="text-[0.66rem] text-muted">
                          {t("Acompte reçu :", "Deposit received:", "دفعة مستلمة:")}{" "}
                          {order.depositPaidAt
                            ? formatDate(order.depositPaidAt)
                            : "non"}{" "}
                          · {t("Réponse :", "Response:", "الرد:")}{" "}
                          {order.respondedAt
                            ? formatDate(order.respondedAt)
                            : "en attente"}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <p className="field-label mb-0">{t("Traitement", "Processing", "المعالجة")}</p>

                        {canWrite ? (
                          <>
                            <label className="block">
                              <span className="field-label">{t("Statut", "Status", "الوضع")}</span>
                              <select
                                value={form.status}
                                onChange={(event) =>
                                  setForm((current) => ({
                                    ...current,
                                    status: event.target
                                      .value as CustomOrderStatus,
                                  }))
                                }
                                className="field"
                              >
                                {STATUSES.map((value) => (
                                  <option key={value} value={value}>
                                    {value}
                                  </option>
                                ))}
                              </select>
                            </label>

                            <div className="grid gap-3 sm:grid-cols-2">
                              <label className="block">
                                <span className="field-label">
                                  {t("Devis", "Quote", "عرض سعر")} (MAD)
                                </span>
                                <input
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  value={form.quotedPriceMad}
                                  onChange={(event) => {
                                    const value = event.target.value;
                                    setForm((current) => ({
                                      ...current,
                                      quotedPriceMad: value,
                                      depositMad:
                                        current.depositMad ||
                                        !value
                                          ? current.depositMad
                                          : String(
                                              Math.round(
                                                Number(value) *
                                                  (DEPOSIT_PERCENT / 100) *
                                                  100,
                                              ) / 100,
                                            ),
                                    }));
                                  }}
                                  className="field"
                                />
                              </label>
                              <label className="block">
                                <span className="field-label">
                                  {t("Acompte (MAD)", "Deposit (MAD)", "دفعة (MAD)")}
                                </span>
                                <input
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  value={form.depositMad}
                                  onChange={(event) =>
                                    setForm((current) => ({
                                      ...current,
                                      depositMad: event.target.value,
                                    }))
                                  }
                                  className="field"
                                />
                              </label>
                            </div>

                            <p className="flex items-center gap-1.5 text-[0.64rem] text-muted">
                              <CreditCard className="h-3 w-3" />
                              Le passage en DEPOSIT_RECEIVED horodate
                              l’acompte.
                            </p>

                            <label className="block">
                              <span className="field-label">
                                {t("Note interne", "Internal note", "ملاحظة داخلية")}
                              </span>
                              <textarea
                                value={form.adminNote}
                                onChange={(event) =>
                                  setForm((current) => ({
                                    ...current,
                                    adminNote: event.target.value,
                                  }))
                                }
                                className="field-textarea min-h-[4.5rem]"
                                placeholder="Fil, délai, échange client…"
                              />
                            </label>

                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => save(order)}
                              className="btn-primary w-full px-4 py-2.5 text-xs disabled:opacity-60"
                            >
                              <BusyLabel busy={busy} label={t("Enregistrer", "Save", "حفظ")} />
                            </button>
                          </>
                        ) : (
                          <div className="rounded-xl border border-line bg-background/70 px-3 py-3 text-xs text-muted">
                            {t("Compte en lecture seule.", "Read-only account.", "حساب للقراءة فقط.")}
                          </div>
                        )}

                        <a
                          href={`https://wa.me/${order.phone.replace(
                            /\D/g,
                            "",
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/30 bg-emerald-600/10 px-3 py-1.5 text-[0.66rem] font-semibold text-emerald-800"
                        >
                          <MessageCircle className="h-3 w-3" />
                          Contacter sur WhatsApp
                        </a>
                      </div>
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
