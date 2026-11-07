import type {
  Currency,
  CustomOrderStatus,
  OrderStatus,
  PaymentMethod,
  RugStatus,
  RugType,
} from "@prisma/client";
import type { SerializedRug } from "@/lib/api/serializers";

/**
 * JSON-safe types shared by the admin server page and its client components.
 *
 * This module deliberately imports only types so it can be pulled into a
 * browser bundle without dragging Prisma or the database client along.
 */

export type AdminRole = "ADMIN" | "MANAGER" | "READONLY";

export interface AdminSessionView {
  userId: string;
  email: string;
  name: string;
  role: AdminRole;
}

export interface AdminSalesKpi {
  orders: number;
  mad: number;
  eur: number;
  usd: number;
}

export interface AdminKpis {
  today: AdminSalesKpi;
  month: AdminSalesKpi;
  ordersToProcess: number;
  reservedRugs: number;
  availableRugs: number;
  soldRugs: number;
  totalRugs: number;
}

export interface AdminMostViewed {
  id: string;
  slug: string;
  sku: string;
  nameFr: string;
  nameEn: string;
  nameAr?: string | null;
  status: RugStatus;
  viewCount: number;
  photo: string | null;
}

export interface AdminOrderItem {
  id: string;
  nameSnapshot: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  slug: string | null;
  photo: string | null;
  type: RugType | null;
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  email: string;
  phone: string;
  fullName: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  postalCode: string | null;
  country: string;
  shippingZone: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  currency: Currency;
  exchangeRate: number;
  subtotal: number;
  discount: number;
  promoCode: string | null;
  shippingCost: number;
  totalAmount: number;
  trackingNumber: string | null;
  carrier: string | null;
  customerNote: string | null;
  adminNote: string | null;
  paymentReference: string | null;
  paidAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: AdminOrderItem[];
}

export interface AdminCustomOrder {
  id: string;
  reference: string;
  fullName: string;
  email: string;
  phone: string;
  rugType: RugType | null;
  widthCm: number | null;
  lengthCm: number | null;
  budgetMad: number | null;
  woolColors: string[];
  pattern: string | null;
  description: string;
  inspirationPhotos: string[];
  status: CustomOrderStatus;
  quotedPriceMad: number | null;
  depositMad: number | null;
  depositPaidAt: string | null;
  currency: Currency;
  adminNote: string | null;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCurrencyRate {
  currency: Currency;
  rate: number;
  updatedAt: string;
}

export interface AdminShippingRate {
  id: string;
  zone: string;
  minWeightKg: number;
  maxWeightKg: number;
  priceMad: number;
  priceEur: number;
  priceUsd: number;
  carrier: string | null;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  isActive: boolean;
}

export interface AdminArtisanOption {
  id: string;
  nameFr: string;
  nameEn: string;
  village: string;
  region: string;
}

export interface AdminCurrencyRates {
  MAD: number;
  EUR: number;
  USD: number;
}

export interface AdminDashboardData {
  generatedAt: string;
  rates: AdminCurrencyRates;
  kpis: AdminKpis;
  mostViewed: AdminMostViewed[];
  rugs: SerializedRug[];
  orders: AdminOrder[];
  customOrders: AdminCustomOrder[];
  shippingRates: AdminShippingRate[];
  currencyRates: AdminCurrencyRate[];
  artisans: AdminArtisanOption[];
}

export interface NotificationChannelResult {
  status: "sent" | "skipped" | "failed";
  detail?: string;
}

export interface TrackingNotificationResult {
  email: NotificationChannelResult;
  whatsapp: NotificationChannelResult;
  /** Pre-filled wa.me link, always available as a manual fallback. */
  whatsappLink: string | null;
}

export interface AdminOrderUpdateResponse {
  order: AdminOrder;
  notifications: TrackingNotificationResult | null;
}
