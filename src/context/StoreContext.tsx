"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AdminRugCreateInput } from "@/lib/api/schemas";
import type { SerializedRug } from "@/lib/api/serializers";
import { INITIAL_STORE_RUGS, MOCK_RATES } from "@/lib/initial-data";
import { DEFAULT_LOCALE, pick, type Locale } from "@/lib/i18n";
import { formatPrice as formatMoney, type CurrencyCode } from "@/lib/money";
import {
  getPromo,
  normalizePromoCode,
  type AppliedPromo,
} from "@/lib/promo";

export const CART_HOLD_MINUTES = 15;
export const CART_HOLD_MS = CART_HOLD_MINUTES * 60 * 1000;

const STORAGE = {
  cart: "zarbia.cart.v1",
  currency: "zarbia.currency.v1",
  locale: "zarbia.locale.v1",
  promo: "zarbia.promo.v1",
  favorites: "zarbia.favorites.v1",
  orders: "zarbia.orders.v1",
  paymentSettings: "zarbia.paymentSettings.v1",
  shippingSettings: "zarbia.shippingSettings.v1",
} as const;

export type StoreRug = SerializedRug;
export type RugStatusValue = "AVAILABLE" | "RESERVED" | "SOLD";
export type PaymentMethodValue = "COD" | "STRIPE" | "CMI" | "PAYPAL";

export interface CartItem {
  id: string;
  slug: string;
  sku: string;
  nameFr: string;
  nameEn: string;
  nameAr?: string | null;
  priceMad: number;
  priceEur: number;
  priceUsd: number;
  weightKg: number;
  photo: string | null;
  isMadeToOrder: boolean;
  status: RugStatusValue;
  certificateId: string | null;
  addedAt: number;
  expiresAt: number;
}

export interface OrderCustomer {
  email: string;
  phone: string;
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode?: string;
  country: string;
}

export interface CreateOrderInput {
  customer: OrderCustomer;
  items?: Array<{ rugId: string; quantity?: number }>;
  paymentMethod?: PaymentMethodValue;
  currency?: CurrencyCode;
  promoCode?: string;
  customerNote?: string;
}

export interface CreatedOrder {
  orderId: string;
  orderNumber: string;
  redirectUrl: string;
  reservedUntil: string | null;
  status: "PENDING" | "PENDING_COD";
  paymentMethod: PaymentMethodValue;
  currency: CurrencyCode;
  items: number;
  createdAt: string;
}

interface PriceShape {
  priceMad: number;
  priceEur: number;
  priceUsd: number;
}

export interface StoreContextValue {
  rugs: StoreRug[];
  addRug: (input: AdminRugCreateInput) => Promise<StoreRug>;
  updateRugStatus: (rugId: string, status: RugStatusValue) => Promise<StoreRug>;
  duplicateRug: (rugId: string) => Promise<StoreRug>;
  toggleMadeToOrder: (rugId: string) => Promise<StoreRug>;
  favorites: string[];
  toggleFavorite: (rugId: string) => void;

  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  formatPrice: (priceMad: number) => string;
  locale: Locale;
  setLocale: (locale: Locale) => void;
  isRtl: boolean;
  t: (fr: string, en: string, ar?: string) => string;

  cart: CartItem[];
  cartCount: number;
  addToCart: (rug: StoreRug) => void;
  removeFromCart: (id?: string) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  cartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  reservationExpiry: number | null;
  holdExpiresAt: number | null;
  holdExpired: boolean;
  now: number;
  refreshHold: () => void;

  orders: CreatedOrder[];
  createOrder: (input: CreateOrderInput) => Promise<CreatedOrder>;

  promo: AppliedPromo | null;
  applyPromo: (code: string) => { ok: boolean; message: string };
  removePromo: () => void;
  hydrated: boolean;

  format: (amount: number, code?: CurrencyCode) => string;
  formatRug: (rug: PriceShape, code?: CurrencyCode) => string;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function readString(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function readCart(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is CartItem => {
        if (!item || typeof item !== "object") return false;
        const value = item as Partial<CartItem>;
        return (
          typeof value.id === "string" &&
          typeof value.slug === "string" &&
          typeof value.nameFr === "string" &&
          typeof value.priceMad === "number" &&
          typeof value.priceEur === "number" &&
          typeof value.priceUsd === "number" &&
          typeof value.weightKg === "number" &&
          typeof value.expiresAt === "number" &&
          typeof value.addedAt === "number"
        );
      })
      .filter(
        (item, index, list) =>
          list.findIndex((candidate) => candidate.id === item.id) === index,
      )
      .slice(0, 20);
  } catch {
    return [];
  }
}

function readIdList(raw: string | null, limit = 200): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return Array.from(
      new Set(parsed.filter((value): value is string => typeof value === "string")),
    ).slice(0, limit);
  } catch {
    return [];
  }
}

function readOrders(raw: string | null): CreatedOrder[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((order): order is CreatedOrder => {
        if (!order || typeof order !== "object") return false;
        const value = order as Partial<CreatedOrder>;
        return (
          typeof value.orderId === "string" &&
          typeof value.orderNumber === "string" &&
          typeof value.createdAt === "string"
        );
      })
      .slice(0, 50);
  } catch {
    return [];
  }
}

function toCartItem(rug: StoreRug, now: number): CartItem {
  return {
    id: rug.id,
    slug: rug.slug,
    sku: rug.sku,
    nameFr: rug.nameFr,
    nameEn: rug.nameEn,
    nameAr: rug.nameAr,
    priceMad: rug.priceMad,
    priceEur: rug.priceEur,
    priceUsd: rug.priceUsd,
    weightKg: rug.weightKg,
    photo: rug.photos[0] ?? null,
    isMadeToOrder: rug.isMadeToOrder,
    status: rug.status,
    certificateId: rug.certificateId,
    addedAt: now,
    expiresAt: now + CART_HOLD_MS,
  };
}

async function adminRequest<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    credentials: "same-origin",
    headers: {
      "content-type": "application/json",
      ...(init.headers as Record<string, string> | undefined),
    },
  });
  const payload = (await response.json().catch(() => null)) as
    | { error?: { message?: string } }
    | T
    | null;
  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      payload.error?.message
        ? payload.error.message
        : `Request failed with status ${response.status}.`;
    throw new Error(message);
  }
  return payload as T;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [rugs, setRugs] = useState<StoreRug[]>(() => INITIAL_STORE_RUGS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [currency, setCurrencyState] = useState<CurrencyCode>("MAD");
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [promo, setPromo] = useState<AppliedPromo | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [orders, setOrders] = useState<CreatedOrder[]>([]);
  const [reservationExpiry, setReservationExpiry] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [hydrated, setHydrated] = useState(false);
  const promoRef = useRef<AppliedPromo | null>(null);

  useEffect(() => {
    const savedCart = readCart(readString(STORAGE.cart));
    const savedCurrency = readString(STORAGE.currency);
    const savedLocale = readString(STORAGE.locale);
    const savedPromo = getPromo(readString(STORAGE.promo));
    const savedFavorites = readIdList(readString(STORAGE.favorites));
    const savedOrders = readOrders(readString(STORAGE.orders));

    setCart(savedCart);
    setFavorites(savedFavorites);
    setOrders(savedOrders);

    if (savedCart.length > 0) {
      setReservationExpiry(Math.min(...savedCart.map((item) => item.expiresAt)));
    }
    if (savedCurrency === "MAD" || savedCurrency === "EUR" || savedCurrency === "USD") {
      setCurrencyState(savedCurrency);
    }
    if (savedLocale === "fr" || savedLocale === "en" || savedLocale === "ar") {
      setLocaleState(savedLocale);
    }
    if (savedPromo) {
      setPromo(savedPromo);
      promoRef.current = savedPromo;
    }
    setNow(Date.now());
    setHydrated(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function syncCatalogue() {
      try {
        const response = await fetch("/api/rugs?limit=100&sort=newest", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as { rugs?: SerializedRug[] };
        const list = Array.isArray(payload.rugs) ? payload.rugs : [];
        if (cancelled || list.length === 0) return;
        setRugs(list);
        const bySku = new Map(list.map((rug) => [rug.sku, rug]));
        setCart((current) =>
          current.map((item) => {
            const match = bySku.get(item.sku);
            if (!match) return item;
            return {
              ...item,
              id: match.id,
              slug: match.slug,
              nameFr: match.nameFr,
              nameEn: match.nameEn,
              priceMad: match.priceMad,
              priceEur: match.priceEur,
              priceUsd: match.priceUsd,
              weightKg: match.weightKg,
              photo: match.photos[0] ?? item.photo,
              isMadeToOrder: match.isMadeToOrder,
              status: match.status,
              certificateId: match.certificateId,
            };
          }),
        );
      } catch {
        /* keep fallback */
      }
    }
    void syncCatalogue();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE.cart, JSON.stringify(cart));
    } catch {
      /* ignore */
    }
  }, [cart, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE.currency, currency);
    } catch {
      /* ignore */
    }
  }, [currency, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE.locale, locale);
    } catch {
      /* ignore */
    }

    // Mirror the choice to a cookie so server rendering (`<html lang dir>`,
    // metadata, 404 page) speaks the same language as the visible UI.
    try {
      document.cookie = `${STORAGE.locale}=${locale}; path=/; max-age=31536000; samesite=lax`;
    } catch {
      /* ignore */
    }

    document.documentElement.lang = locale === "ar" ? "ar" : locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE.favorites, JSON.stringify(favorites));
    } catch {
      /* ignore */
    }
  }, [favorites, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE.orders, JSON.stringify(orders));
    } catch {
      /* ignore */
    }
  }, [orders, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      if (promoRef.current) {
        window.localStorage.setItem(STORAGE.promo, promoRef.current.code);
      } else {
        window.localStorage.removeItem(STORAGE.promo);
      }
    } catch {
      /* ignore */
    }
  }, [promo, hydrated]);

  useEffect(() => {
    if (cart.length === 0 && reservationExpiry === null) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [cart.length, reservationExpiry]);

  useEffect(() => {
    if (cart.length === 0) setReservationExpiry(null);
  }, [cart.length]);

  const holdExpiresAt = reservationExpiry;
  const holdExpired = holdExpiresAt !== null && holdExpiresAt <= now;

  const upsertRug = useCallback((rug: StoreRug) => {
    setRugs((current) => {
      const index = current.findIndex((item) => item.id === rug.id);
      if (index === -1) return [rug, ...current];
      const next = [...current];
      next[index] = rug;
      return next;
    });
  }, []);

  const addRug = useCallback(
    async (input: AdminRugCreateInput): Promise<StoreRug> => {
      const payload = await adminRequest<{ rug: StoreRug }>("/api/admin/rugs", {
        method: "POST",
        body: JSON.stringify(input),
      });
      upsertRug(payload.rug);
      return payload.rug;
    },
    [upsertRug],
  );

  const updateRugStatus = useCallback(
    async (rugId: string, status: RugStatusValue): Promise<StoreRug> => {
      const payload = await adminRequest<{ rug: StoreRug }>(
        `/api/admin/rugs/${encodeURIComponent(rugId)}`,
        { method: "PATCH", body: JSON.stringify({ status }) },
      );
      upsertRug(payload.rug);
      return payload.rug;
    },
    [upsertRug],
  );

  const duplicateRug = useCallback(
    async (rugId: string): Promise<StoreRug> => {
      const payload = await adminRequest<{ rug: StoreRug }>(
        `/api/admin/rugs/${encodeURIComponent(rugId)}/duplicate`,
        { method: "POST" },
      );
      upsertRug(payload.rug);
      return payload.rug;
    },
    [upsertRug],
  );

  const toggleMadeToOrder = useCallback(
    async (rugId: string): Promise<StoreRug> => {
      const current = rugs.find((rug) => rug.id === rugId);
      if (!current) throw new Error("This rug is not part of the catalogue.");
      const payload = await adminRequest<{ rug: StoreRug }>(
        `/api/admin/rugs/${encodeURIComponent(rugId)}`,
        {
          method: "PATCH",
          body: JSON.stringify({ isMadeToOrder: !current.isMadeToOrder }),
        },
      );
      upsertRug(payload.rug);
      return payload.rug;
    },
    [rugs, upsertRug],
  );

  const toggleFavorite = useCallback((rugId: string) => {
    setFavorites((current) =>
      current.includes(rugId)
        ? current.filter((id) => id !== rugId)
        : [...current, rugId],
    );
  }, []);

  const addToCart = useCallback((rug: StoreRug) => {
    const addedAt = Date.now();
    setCart((current) => {
      if (current.some((item) => item.id === rug.id)) return current;
      return [...current, toCartItem(rug, addedAt)];
    });
    setReservationExpiry(addedAt + CART_HOLD_MS);
    setNow(addedAt);
    setIsCartOpen(true);
  }, []);

  const removeFromCart = useCallback((id?: string) => {
    setCart((current) =>
      id
        ? current.filter((item) => item.id !== id)
        : current.slice(0, Math.max(0, current.length - 1)),
    );
  }, []);

  const removeItem = useCallback((id: string) => removeFromCart(id), [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
    setReservationExpiry(null);
  }, []);

  const refreshHold = useCallback(() => {
    const expiry = Date.now() + CART_HOLD_MS;
    setCart((current) =>
      current.map((item) => ({ ...item, expiresAt: expiry })),
    );
    setReservationExpiry(expiry);
    setNow(Date.now());
  }, []);

  const setCurrency = useCallback((next: CurrencyCode) => setCurrencyState(next), []);
  const setLocale = useCallback((next: Locale) => setLocaleState(next), []);
  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  const createOrder = useCallback(
    async (input: CreateOrderInput): Promise<CreatedOrder> => {
      const items =
        input.items && input.items.length > 0
          ? input.items
          : cart.map((item) => ({ rugId: item.id, quantity: 1 }));
      if (items.length === 0) {
        throw new Error(
          pick(locale, "Votre panier est vide.", "Your cart is empty.", "سلتك فارغة."),
        );
      }
      const paymentMethod: PaymentMethodValue = input.paymentMethod ?? "COD";
      const orderCurrency = input.currency ?? currency;
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          customer: input.customer,
          items,
          paymentMethod,
          currency: orderCurrency,
          promoCode: input.promoCode,
          customerNote: input.customerNote,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            orderId?: string;
            orderNumber?: string;
            redirectUrl?: string;
            reservedUntil?: string;
            error?: { message?: string };
          }
        | null;
      if (!response.ok || !payload?.orderId) {
        throw new Error(
          payload?.error?.message ??
            pick(locale, "La commande n’a pas pu être enregistrée.", "The order could not be placed.", "تعذر تسجيل الطلب."),
        );
      }
      const created: CreatedOrder = {
        orderId: payload.orderId,
        orderNumber: payload.orderNumber ?? payload.orderId,
        redirectUrl: payload.redirectUrl ?? `/order/${payload.orderId}`,
        reservedUntil: payload.reservedUntil ?? null,
        status: paymentMethod === "COD" ? "PENDING_COD" : "PENDING",
        paymentMethod,
        currency: orderCurrency,
        items: items.length,
        createdAt: new Date().toISOString(),
      };
      setOrders((current) => [created, ...current].slice(0, 50));
      const orderedIds = new Set(items.map((item) => item.rugId));
      setRugs((current) =>
        current.map((rug) =>
          orderedIds.has(rug.id)
            ? { ...rug, status: "RESERVED" as RugStatusValue, reservedUntil: created.reservedUntil }
            : rug,
        ),
      );
      setCart([]);
      setReservationExpiry(null);
      setIsCartOpen(false);
      promoRef.current = null;
      setPromo(null);
      return created;
    },
    [cart, currency, locale],
  );

  const formatPrice = useCallback(
    (priceMad: number) => formatMoney(priceMad * MOCK_RATES[currency], currency),
    [currency],
  );

  const format = useCallback(
    (amount: number, code: CurrencyCode = currency) => formatMoney(amount, code),
    [currency],
  );

  const formatRug = useCallback(
    (rug: PriceShape, code: CurrencyCode = currency) => {
      const amount =
        code === "MAD" ? rug.priceMad : code === "EUR" ? rug.priceEur : rug.priceUsd;
      return formatMoney(amount, code);
    },
    [currency],
  );

  const t = useCallback(
    (fr: string, en: string, ar?: string) => pick(locale, fr, en, ar),
    [locale],
  );

  const applyPromo = useCallback(
    (code: string) => {
      const normalized = normalizePromoCode(code);
      const found = getPromo(normalized);
      if (!found) {
        return {
          ok: false,
          message: pick(
            locale,
            "Ce code n’est pas reconnu. Essayez ATLAS10.",
            "That code is not recognised. Try ATLAS10.",
            "هذا الكود غير معروف. جرّب ATLAS10.",
          ),
        };
      }
      promoRef.current = found;
      setPromo(found);
      return { ok: true, message: pick(locale, found.labelFr, found.labelEn) };
    },
    [locale],
  );

  const removePromo = useCallback(() => {
    promoRef.current = null;
    setPromo(null);
  }, []);

  const value = useMemo<StoreContextValue>(
    () => ({
      rugs,
      addRug,
      updateRugStatus,
      duplicateRug,
      toggleMadeToOrder,
      favorites,
      toggleFavorite,

      currency,
      setCurrency,
      formatPrice,
      locale,
      setLocale,
      isRtl: locale === "ar",
      t,

      cart,
      cartCount: cart.length,
      addToCart,
      removeFromCart,
      removeItem,
      clearCart,
      isCartOpen,
      setIsCartOpen,
      cartOpen: isCartOpen,
      openCart,
      closeCart,
      reservationExpiry,
      holdExpiresAt,
      holdExpired,
      now,
      refreshHold,

      orders,
      createOrder,

      promo,
      applyPromo,
      removePromo,
      hydrated,

      format,
      formatRug,
    }),
    [
      addRug,
      addToCart,
      applyPromo,
      cart,
      clearCart,
      closeCart,
      createOrder,
      currency,
      duplicateRug,
      favorites,
      format,
      formatPrice,
      formatRug,
      holdExpired,
      holdExpiresAt,
      hydrated,
      isCartOpen,
      locale,
      now,
      openCart,
      orders,
      promo,
      refreshHold,
      removeFromCart,
      removeItem,
      removePromo,
      reservationExpiry,
      rugs,
      setCurrency,
      setLocale,
      t,
      toggleFavorite,
      toggleMadeToOrder,
      updateRugStatus,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used inside <StoreProvider>.");
  return context;
}