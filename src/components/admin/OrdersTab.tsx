"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/context/StoreContext";
import {
  ChevronDown,
  FileText,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Search,
  Truck,
} from "lucide-react";
import type {
  AdminOrder,
  AdminOrderUpdateResponse,
  TrackingNotificationResult,
} from "@/lib/admin/types";
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

const FILTERS = [
  { value: "ALL", label: "Toutes", labelEn: "All", labelAr: "الكل" },
  { value: "PENDING_COD", label: "COD en attente", labelEn: "COD pending", labelAr: "دفع عند الاستلام معلّق" },
  { value: "PAID", label: "Payées", labelEn: "Paid", labelAr: "مدفوعة" },
  { value: "PREPARING", label: "Préparation", labelEn: "Preparing", labelAr: "قيد التحضير" },
  { value: "SHIPPED", label: "Expédiées", labelEn: "Shipped", labelAr: "مشحونة" },
  { value: "DELIVERED", label: "Livrées", labelEn: "Delivered", labelAr: "مُسلَّمة" },
] as const;

const ORDER_STATUS_DETAILS: Record<
  string,
  {
    step: number;
    fr: string;
    en: string;
    ar: string;
  }
> = {
  PENDING: {
    step: 1,
    fr: "1. En attente (Nouvelle commande)",
    en: "1. Pending (New Order)",
    ar: "1. قيد الانتظار (طلب جديد)",
  },
  PENDING_COD: {
    step: 1,
    fr: "1. Commande reçue (À confirmer)",
    en: "1. Order Placed (To Confirm)",
    ar: "1. تم الطلب (في انتظار التأكيد)",
  },
  CONFIRMED_COD: {
    step: 2,
    fr: "2. Confirmée & Acompte convenu",
    en: "2. Confirmed & Deposit Agreed",
    ar: "2. مؤكد مع الاتفاق على التسبيق",
  },
  PAID: {
    step: 2,
    fr: "2. Payée intégralement par carte",
    en: "2. Paid in Full by Card",
    ar: "2. مدفوع بالكامل بالبطاقة",
  },
  PREPARING: {
    step: 3,
    fr: "3. En atelier & Lavage de montagne",
    en: "3. In Workshop & Mountain Wash",
    ar: "3. في الورشة والغسيل الجبلي",
  },
  SHIPPED: {
    step: 4,
    fr: "4. Expédiée & En cours de livraison",
    en: "4. Shipped & In Transit",
    ar: "4. تم الشحن وقيد التوصيل",
  },
  DELIVERED: {
    step: 5,
    fr: "5. Livrée au client",
    en: "5. Delivered to Client",
    ar: "5. تم التسليم للعميل",
  },
  CASH_COLLECTED: {
    step: 6,
    fr: "6. Livrée & Solde entièrement encaissé",
    en: "6. Delivered & Balance Collected",
    ar: "6. مسلّمة وتم تحصيل الباقي بالكامل",
  },
  CANCELLED: {
    step: 0,
    fr: "Annulée",
    en: "Cancelled",
    ar: "ملغاة",
  },
  REFUNDED: {
    step: 0,
    fr: "Remboursée",
    en: "Refunded",
    ar: "مُسترجعة",
  },
  FAILED: {
    step: 0,
    fr: "Échouée",
    en: "Failed",
    ar: "فاشلة",
  },
};

const STATUSES = [
  "PENDING",
  "PENDING_COD",
  "CONFIRMED_COD",
  "PAID",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
  "CASH_COLLECTED",
  "FAILED",
  "CANCELLED",
  "REFUNDED",
] as const;

interface OrdersTabProps {
  orders: AdminOrder[];
  canWrite: boolean;
  onMutated: (message: string) => void;
}

/** Fulfilment queue: status filters, tracking entry, PDF invoice. */
export function OrdersTab({ orders, canWrite, onMutated }: OrdersTabProps) {
  const { t, locale } = useStore();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("ALL");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [form, setForm] = useState({
    status: "PENDING_COD",
    trackingNumber: "",
    carrier: "",
    adminNote: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{
    orderId: string;
    notifications: TrackingNotificationResult;
  } | null>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return orders.filter((order) => {
      if (filter !== "ALL" && order.status !== filter) return false;
      if (!needle) return true;

      return [
        order.orderNumber,
        order.fullName,
        order.email,
        order.phone,
        order.city,
        order.country,
        order.trackingNumber ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [filter, orders, query]);

  function toggle(order: AdminOrder) {
    if (openId === order.id) {
      setOpenId(null);
      return;
    }

    setOpenId(order.id);
    setForm({
      status: order.status,
      trackingNumber: order.trackingNumber ?? "",
      carrier: order.carrier ?? "",
      adminNote: order.adminNote ?? "",
    });
    setNotice(null);
    setError(null);
  }

  async function save(order: AdminOrder) {
    setBusy(true);
    setError(null);

    try {
      const result = await apiRequest<AdminOrderUpdateResponse>(
        `/api/admin/orders/${order.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status: form.status,
            trackingNumber: form.trackingNumber.trim(),
            carrier: form.carrier.trim(),
            adminNote: form.adminNote.trim(),
          }),
        },
      );

      if (result.notifications) {
        setNotice({ orderId: order.id, notifications: result.notifications });
      }

      onMutated(t(`${order.orderNumber} mis à jour.`, `${order.orderNumber} updated.`, `${order.orderNumber} تم تحديثه.`));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : t("Mise à jour impossible.", "Update failed.", "تعذّر التحديث."),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <AdminCard className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/60" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="field pl-10"
              placeholder={t("N° de commande, client, e-mail, ville, suivi…", "Order no., customer, email, city, tracking…", "رقم الطلب، العميل، البريد، المدينة، التتبع…")}
            />
          </div>
          <span className="pill shrink-0">{filtered.length} {t("commande(s)", "order(s)", "طلب/طلبات")}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className={cn("pill transition", filter === item.value && "pill-active")}
            >
              {locale === "ar"
                ? item.labelAr
                : locale === "en"
                  ? item.labelEn
                  : item.label}
            </button>
          ))}
        </div>
      </AdminCard>

      <ErrorNote message={error} />

      {filtered.length === 0 ? (
        <AdminCard>
          <p className="py-10 text-center text-sm text-muted">
            {t("Aucune commande ne correspond à ces filtres.", "No orders match these filters.", "لا توجد طلبات مطابقة لهذه الفلاتر.")}
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
                      <Package className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-mono text-[0.7rem] font-semibold text-ink">
                        {order.orderNumber}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {order.fullName} · {formatDate(order.createdAt)} ·{" "}
                        {order.items.length} {t("Pièce(s)", "Piece(s)", "قطعة/قطع")}
                      </span>
                    </span>
                    <span className="hidden shrink-0 text-right sm:block">
                      <span className="block text-sm font-semibold text-ink">
                        {formatMoney(order.totalAmount, order.currency)}
                      </span>
                      <span className="block text-[0.62rem] uppercase tracking-[0.1em] text-muted">
                        {order.paymentMethod}
                      </span>
                    </span>
                  </button>

                  <StatusPill value={order.status} className="shrink-0" />

                  <a
                    href={`/api/admin/orders/${order.id}/invoice`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-line p-2 text-muted transition hover:border-terracotta hover:text-terracotta"
                    title={t("Télécharger la facture PDF", "Download PDF invoice", "تحميل فاتورة PDF")}
                    aria-label={t("Facture PDF", "PDF invoice", "فاتورة PDF")}
                  >
                    <FileText className="h-3.5 w-3.5" />
                  </a>

                  <button
                    type="button"
                    onClick={() => toggle(order)}
                    className="rounded-lg border border-line p-2 text-muted transition hover:border-terracotta hover:text-terracotta"
                    aria-label={t("Détails", "Details", "التفاصيل")}
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
                    <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
                      <div className="space-y-4 text-xs">
                        <div>
                          <p className="field-label">{t("Client", "Customer", "العميل")}</p>
                          <p className="font-medium text-ink">
                            {order.fullName}
                          </p>
                          <div className="mt-1 space-y-1 text-muted">
                            <p className="flex items-center gap-1.5">
                              <Mail className="h-3 w-3" />
                              <a
                                href={`mailto:${order.email}`}
                                className="hover:text-terracotta"
                              >
                                {order.email}
                              </a>
                            </p>
                            <p className="flex items-center gap-1.5">
                              <Phone className="h-3 w-3" />
                              <a
                                href={`tel:${order.phone}`}
                                className="hover:text-terracotta"
                              >
                                {order.phone}
                              </a>
                            </p>
                            <p className="flex items-start gap-1.5">
                              <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                              <span>
                                {order.addressLine1}
                                {order.addressLine2
                                  ? `, ${order.addressLine2}`
                                  : ""}
                                <br />
                                {order.postalCode ? `${order.postalCode} ` : ""}
                                {order.city}, {order.country} ·{" "}
                                {order.shippingZone}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="field-label">{t("Pièces", "Pieces", "القطع")}</p>
                          <ul className="space-y-1.5">
                            {order.items.map((item) => (
                              <li
                                key={item.id}
                                className="flex items-center justify-between gap-3 rounded-lg bg-background/80 px-2.5 py-1.5"
                              >
                                <span className="min-w-0">
                                  <span className="block truncate text-ink">
                                    {item.nameSnapshot}
                                  </span>
                                  <span className="font-mono text-[0.6rem] text-muted">
                                    {item.sku} × {item.quantity}
                                  </span>
                                </span>
                                <span className="shrink-0 font-medium text-ink">
                                  {formatMoney(item.lineTotal, order.currency)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="rounded-xl bg-background/80 px-3 py-2">
                          <div className="flex justify-between text-muted">
                            <span>{t("Sous-total", "Subtotal", "المجموع الفرعي")}</span>
                            <span>
                              {formatMoney(order.subtotal, order.currency)}
                            </span>
                          </div>
                          {order.discount > 0 ? (
                            <div className="flex justify-between text-muted">
                              <span>
                                {t("Remise", "Discount", "خصم")}
                              </span>
                              <span>
                                −{formatMoney(order.discount, order.currency)}
                              </span>
                            </div>
                          ) : null}
                          <div className="flex justify-between text-muted">
                            <span>{t("Livraison", "Shipping", "التوصيل")}</span>
                            <span>
                              {formatMoney(
                                order.shippingCost,
                                order.currency,
                              )}
                            </span>
                          </div>
                          <div className="mt-1 flex justify-between border-t border-line/80 pt-1 font-semibold text-ink">
                            <span>{t("Total", "Total", "المجموع")}</span>
                            <span>
                              {formatMoney(
                                order.totalAmount,
                                order.currency,
                              )}
                            </span>
                          </div>
                        </div>

                        {order.customerNote ? (
                          <div>
                            <p className="field-label">{t("Note du client", "Customer note", "ملاحظة العميل")}</p>
                            <p className="rounded-lg bg-background/80 px-3 py-2 text-muted">
                              {order.customerNote}
                            </p>
                          </div>
                        ) : null}
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="field-label mb-0">{t("Suivi & statut", "Tracking & status", "التتبع والوضع")}</p>
                          <a
                            href={`/api/admin/orders/${order.id}/invoice`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-outline px-3 py-1.5 text-[0.66rem]"
                          >
                            <FileText className="h-3 w-3" />
                            {t("Facture PDF", "PDF invoice", "فاتورة PDF")}
                          </a>
                        </div>

                        {/* 5-Step Visual Progress Stepper */}
                        <div className="rounded-2xl border border-line bg-surface/40 p-3.5">
                          <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-gold mb-2.5">
                            {t("Étapes de la commande", "Order Milestones", "مراحل تنفيذ الطلب")}
                          </p>
                          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5 text-center text-[0.62rem]">
                            {[
                              { num: "1", key: "PENDING_COD", fr: "1. Reçue", en: "1. Placed", ar: "1. استلام الطلب" },
                              { num: "2", key: "CONFIRMED_COD", fr: "2. Acompte convenu", en: "2. Deposit", ar: "2. تسبيق الحجز" },
                              { num: "3", key: "PREPARING", fr: "3. En atelier", en: "3. Workshop", ar: "3. في الورشة" },
                              { num: "4", key: "SHIPPED", fr: "4. Expédiée", en: "4. Shipped", ar: "4. جاري التوصيل" },
                              { num: "5", key: "CASH_COLLECTED", fr: "5. Livré & Soldé", en: "5. Delivered & Paid", ar: "5. تم التسليم واستلام الباقي" },
                            ].map((st) => {
                              const active =
                                form.status === st.key ||
                                (st.key === "CONFIRMED_COD" && (form.status === "PAID" || form.status === "CONFIRMED_COD")) ||
                                (st.key === "CASH_COLLECTED" && (form.status === "DELIVERED" || form.status === "CASH_COLLECTED"));

                              return (
                                <button
                                  key={st.num}
                                  type="button"
                                  onClick={() => canWrite && setForm((curr) => ({ ...curr, status: st.key }))}
                                  className={cn(
                                    "p-2 rounded-xl border text-center transition",
                                    active
                                      ? "border-gold bg-gold/15 text-ink font-bold shadow-sm ring-1 ring-gold/30"
                                      : "border-line/60 bg-background/60 text-muted hover:border-terracotta/40",
                                  )}
                                >
                                  <span className="block font-bold">{st.num}</span>
                                  <span className="block mt-0.5 truncate">
                                    {locale === "ar" ? st.ar : locale === "en" ? st.en : st.fr}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {canWrite ? (
                          <>
                            <label className="block">
                              <span className="field-label">{t("Statut de la commande", "Order Status", "حالة الطلب")}</span>
                              <select
                                value={form.status}
                                onChange={(event) =>
                                  setForm((current) => ({
                                    ...current,
                                    status: event.target.value,
                                  }))
                                }
                                className="field font-medium"
                              >
                                {STATUSES.map((value) => {
                                  const details = ORDER_STATUS_DETAILS[value];
                                  const label = details
                                    ? locale === "ar"
                                      ? details.ar
                                      : locale === "en"
                                        ? details.en
                                        : details.fr
                                    : value;

                                  return (
                                    <option key={value} value={value}>
                                      {label}
                                    </option>
                                  );
                                })}
                              </select>
                            </label>

                            <div className="grid gap-3 sm:grid-cols-2">
                              <label className="block">
                                <span className="field-label">
                                  {t("Transporteur", "Carrier", "الناقل")}
                                </span>
                                <div className="relative">
                                  <Truck className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted/60" />
                                  <input
                                    value={form.carrier}
                                    onChange={(event) =>
                                      setForm((current) => ({
                                        ...current,
                                        carrier: event.target.value,
                                      }))
                                    }
                                    className="field pl-9"
                                    placeholder="Amana, DHL…"
                                  />
                                </div>
                              </label>
                              <label className="block">
                                <span className="field-label">
                                  {t("N° de suivi", "Tracking no.", "رقم التتبع")}
                                </span>
                                <input
                                  value={form.trackingNumber}
                                  onChange={(event) =>
                                    setForm((current) => ({
                                      ...current,
                                      trackingNumber: event.target.value,
                                    }))
                                  }
                                  className="field font-mono"
                                  placeholder="ZA123456789MA"
                                />
                              </label>
                            </div>

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
                                placeholder="Visible uniquement dans le back-office."
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

                            <p className="text-[0.64rem] leading-relaxed text-muted">
                              {t("Ajouter un numéro de suivi (ou passer la commande en SHIPPED) envoie automatiquement l’e-mail et le", "Adding a tracking number (or moving the order to SHIPPED) automatically sends the email and", "إضافة رقم تتبع (أو نقل الطلب إلى SHIPPED) يرسل تلقائياً البريد الإلكتروني و")} {t("WhatsApp", "WhatsApp", "واتساب")} {t("si les canaux sont configurés.", "WhatsApp if the channels are configured.", "إن كانت القنوات مهيأة.")}
                            </p>
                          </>
                        ) : (
                          <div className="rounded-xl border border-line bg-background/70 px-3 py-3 text-xs text-muted">
                            {t("Compte en lecture seule : le suivi ne peut pas être modifié.", "Read-only account: tracking cannot be edited.", "حساب للقراءة فقط: لا يمكن تعديل التتبع.")}
                            {order.trackingNumber ? (
                              <p className="mt-2 font-mono text-ink">
                                {order.carrier ?? t("Transporteur", "Carrier", "الناقل")} ·{" "}
                                {order.trackingNumber}
                              </p>
                            ) : null}
                          </div>
                        )}

                        {notice && notice.orderId === order.id ? (
                          <NotificationNote
                            notifications={notice.notifications}
                          />
                        ) : null}

                        {busy ? (
                          <p className="flex items-center gap-2 text-[0.66rem] text-muted">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            {t("Enregistrement…", "Saving…", "جارٍ الحفظ…")}
                          </p>
                        ) : null}
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

function NotificationNote({
  notifications,
}: {
  notifications: TrackingNotificationResult;
}) {
  const { t } = useStore();
  const label = (status: "sent" | "skipped" | "failed") =>
    status === "sent"
      ? t("envoyé", "sent", "مُرسل")
      : status === "skipped"
        ? t("ignoré", "skipped", "مُتجاهل")
        : t("échec", "failed", "فاشل");

  return (
    <div className="space-y-2 rounded-xl border border-line bg-background/80 px-3 py-3 text-[0.68rem]">
      <p className="field-label mb-0">{t("Notifications", "Notifications", "الإشعارات")}</p>
      <p className="flex items-center gap-1.5 text-muted">
        <Mail className="h-3 w-3" />
        {t("E-mail", "Email", "البريد")} : {label(notifications.email.status)}
        {notifications.email.detail
          ? ` — ${notifications.email.detail}`
          : ""}
      </p>
      <p className="flex items-center gap-1.5 text-muted">
        <MessageCircle className="h-3 w-3" />
        {t("WhatsApp", "WhatsApp", "واتساب")} : {label(notifications.whatsapp.status)}
        {notifications.whatsapp.detail
          ? ` — ${notifications.whatsapp.detail}`
          : ""}
      </p>
      {notifications.whatsappLink ? (
        <a
          href={notifications.whatsappLink}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/30 bg-emerald-600/10 px-3 py-1.5 font-semibold text-emerald-800"
        >
          <MessageCircle className="h-3 w-3" />
          Envoyer le message {t("WhatsApp", "WhatsApp", "واتساب")}
        </a>
      ) : null}
    </div>
  );
}
