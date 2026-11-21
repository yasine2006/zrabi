"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/context/StoreContext";
import {
  Check,
  Copy,
  Globe2,
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type {
  AdminArtisanOption,
  AdminCurrencyRates,
} from "@/lib/admin/types";
import type { RugStatus, RugType } from "@prisma/client";
import type { SerializedRug } from "@/lib/api/serializers";
import { cn } from "@/lib/utils";
import { upload as uploadToBlob } from "@vercel/blob/client";
import { compressImage } from "@/lib/image-compress";
import { createMediaPathname, mediaPublicUrl } from "@/lib/blob-media";
import {
  AdminCard,
  apiRequest,
  BusyLabel,
  ErrorNote,
  formatMoney,
  Modal,
  StatusPill,
} from "./admin-ui";

const RUG_TYPES: Array<{ value: RugType; label: string }> = [
  { value: "BENI_OURAIN", label: "Beni Ourain" },
  { value: "AZILAL", label: "Azilal" },
  { value: "BOUCHEROUITE", label: "Boucherouite" },
  { value: "KILIM", label: "Kilim" },
  { value: "HANBEL", label: "Hanbel" },
];

const RUG_STATUSES: RugStatus[] = ["AVAILABLE", "RESERVED", "SOLD"];

interface RugsTabProps {
  rugs: SerializedRug[];
  artisans: AdminArtisanOption[];
  rates: AdminCurrencyRates;
  canWrite: boolean;
  onMutated: (message: string) => void;
}

/** Catalogue table, quick status switch, duplicate and full editor. */
export function RugsTab({
  rugs,
  artisans,
  rates,
  canWrite,
  onMutated,
}: RugsTabProps) {
  const { t } = useStore();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"ALL" | RugStatus>("ALL");
  const [editing, setEditing] = useState<SerializedRug | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return rugs.filter((rug) => {
      if (status !== "ALL" && rug.status !== status) return false;
      if (!needle) return true;

      return [rug.nameFr, rug.nameEn, rug.sku, rug.slug, rug.originVillage]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [query, rugs, status]);

  async function patchRug(id: string, data: Record<string, unknown>) {
    setBusyId(id);
    setError(null);

    try {
      await apiRequest(`/api/admin/rugs/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      onMutated(t("Tapis mis à jour.", "Rug updated.", "تم تحديث الزربية."));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : t("Mise à jour impossible.", "Update failed.", "تعذّر التحديث."),
      );
    } finally {
      setBusyId(null);
    }
  }

  async function duplicate(rug: SerializedRug) {
    setBusyId(rug.id);
    setError(null);

    try {
      await apiRequest(`/api/admin/rugs/${rug.id}/duplicate`, {
        method: "POST",
      });
      onMutated(
        t(
          `Copie de ${rug.sku} créée.`,
          `Copy of ${rug.sku} created.`,
          `تم إنشاء نسخة من ${rug.sku}.`,
        ),
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : t("Duplication impossible.", "Duplication failed.", "تعذر النسخ."),
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <AdminCard className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/60 rtl:left-auto rtl:right-3.5" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t(
                "Rechercher un tapis, un SKU, un village…",
                "Search a rug, a SKU, a village…",
                "ابحث عن زربية أو رمز SKU أو قرية…",
              )}
              className="field pl-10 rtl:pl-4 rtl:pr-10"
            />
          </div>
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as "ALL" | RugStatus)
            }
            className="field sm:w-44"
            aria-label={t("Filtrer par statut", "Filter by status", "تصفية حسب الحالة")}
          >
            <option value="ALL">
              {t("Tous les statuts", "All statuses", "كل الحالات")}
            </option>
            {RUG_STATUSES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        {canWrite ? (
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setEditorOpen(true);
            }}
            className="btn-primary shrink-0 px-5 py-2.5 text-xs"
          >
            <Plus className="h-4 w-4" />
            {t("Nouveau tapis", "New rug", "زربية جديدة")}
          </button>
        ) : null}
      </AdminCard>

      <ErrorNote message={error} />

      <div className="overflow-hidden rounded-2xl border border-line/80 bg-background/60">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-surface/80 text-[0.62rem] uppercase tracking-[0.14em] text-muted">
                <th className="px-4 py-3 font-semibold">
                  {t("Tapis", "Rug", "الزربية")}
                </th>
                <th className="px-4 py-3 font-semibold">
                  {t("Dimensions", "Dimensions", "الأبعاد")}
                </th>
                <th className="px-4 py-3 font-semibold">
                  {t("Prix", "Price", "السعر")}
                </th>
                <th className="px-4 py-3 font-semibold">
                  {t("Statut", "Status", "الحالة")}
                </th>
                <th className="px-4 py-3 font-semibold">
                  {t("Sur-mesure", "Bespoke", "حسب الطلب")}
                </th>
                <th className="px-4 py-3 text-right font-semibold rtl:text-left">
                  {t("Actions", "Actions", "الإجراءات")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {filtered.map((rug) => (
                <tr key={rug.id} className="align-middle hover:bg-surface/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-line bg-surface">
                        {rug.photos[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={rug.photos[0]}
                            alt={rug.nameFr}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <ImageIcon className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-muted/40" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="max-w-[210px] truncate font-medium text-ink">
                          {rug.nameFr}
                        </p>
                        <p className="font-mono text-[0.64rem] text-muted">
                          {rug.sku}
                        </p>
                        <p className="text-[0.62rem] text-muted/80">
                          {rug.artisan?.nameFr ?? "—"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink/80">
                    {rug.widthCm} × {rug.lengthCm} cm
                    <span className="mt-0.5 block text-[0.64rem] text-muted">
                      {rug.weightKg} kg · {rug.craftingDays}{" "}
                      {t("j", "d", "يوم")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <p className="font-semibold text-ink">
                      {formatMoney(rug.priceMad, "MAD")}
                    </p>
                    <p className="text-muted">
                      {formatMoney(rug.priceEur, "EUR")} ·{" "}
                      {formatMoney(rug.priceUsd, "USD")}
                    </p>
                    <p className="mt-0.5 text-[0.62rem] text-muted/80">
                      {rug.viewCount} {t("vue(s)", "view(s)", "مشاهدة")}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    {canWrite ? (
                      <select
                        value={rug.status}
                        disabled={busyId === rug.id}
                        onChange={(event) =>
                          patchRug(rug.id, { status: event.target.value })
                        }
                        className="rounded-full border border-line bg-background px-2.5 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.08em] text-ink"
                        aria-label={t(
                          `Statut de ${rug.nameFr}`,
                          `Status of ${rug.nameFr}`,
                          `حالة ${rug.nameFr}`,
                        )}
                      >
                        {RUG_STATUSES.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <StatusPill value={rug.status} />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={!canWrite || busyId === rug.id}
                      onClick={() =>
                        patchRug(rug.id, {
                          isMadeToOrder: !rug.isMadeToOrder,
                        })
                      }
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.62rem] font-semibold transition",
                        rug.isMadeToOrder
                          ? "border-emerald-600/30 bg-emerald-600/10 text-emerald-800"
                          : "border-line bg-background text-muted",
                        !canWrite && "cursor-not-allowed opacity-60",
                      )}
                    >
                      {rug.isMadeToOrder ? (
                        <Check className="h-3 w-3" />
                      ) : null}
                      {rug.isMadeToOrder
                        ? t("Oui", "Yes", "نعم")
                        : t("Non", "No", "لا")}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <a
                        href={`/rugs/${rug.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-line p-2 text-muted transition hover:border-terracotta hover:text-terracotta"
                        aria-label={t("Voir la fiche", "View listing", "عرض البطاقة")}
                        title={t("Voir la fiche", "View listing", "عرض البطاقة")}
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                      </a>
                      {canWrite ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditing(rug);
                              setEditorOpen(true);
                            }}
                            className="rounded-lg border border-line p-2 text-muted transition hover:border-terracotta hover:text-terracotta"
                            aria-label={t("Modifier", "Edit", "تعديل")}
                            title={t("Modifier", "Edit", "تعديل")}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={busyId === rug.id}
                            onClick={() => duplicate(rug)}
                            className="rounded-lg border border-line p-2 text-muted transition hover:border-terracotta hover:text-terracotta disabled:opacity-50"
                            aria-label={t("Dupliquer", "Duplicate", "نسخ")}
                            title={t("Dupliquer", "Duplicate", "نسخ")}
                          >
                            {busyId === rug.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-muted">
            {t(
              "Aucun tapis ne correspond à ces filtres.",
              "No rug matches these filters.",
              "لا توجد زربية تطابق هذه الفلاتر.",
            )}
          </p>
        ) : null}
      </div>

      <p className="px-1 text-[0.68rem] text-muted">
        {t(
          `${filtered.length} tapis affiché(s) sur ${rugs.length}. Le stock est unique par pièce : un tapis réservé reste verrouillé 15 minutes au checkout.`,
          `${filtered.length} of ${rugs.length} rugs shown. Each piece is one of a kind: a reserved rug stays locked for 15 minutes at checkout.`,
          `عرض ${filtered.length} من ${rugs.length} زربية. المخزون فريد لكل قطعة: تبقى الزربية المحجوزة مقفلة لمدة 15 دقيقة عند إتمام الطلب.`,
        )}
      </p>

      <RugEditorModal
        open={editorOpen}
        rug={editing}
        artisans={artisans}
        rates={rates}
        onClose={() => setEditorOpen(false)}
        onSaved={(message) => {
          setEditorOpen(false);
          onMutated(message);
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ editor */

interface EditorState {
  nameFr: string;
  nameEn: string;
  nameAr: string;
  type: RugType;
  artisanId: string;
  widthCm: string;
  lengthCm: string;
  weightKg: string;
  materialFr: string;
  materialEn: string;
  materialAr: string;
  originVillage: string;
  originRegion: string;
  originAr: string;
  craftingDays: string;
  storyFr: string;
  storyEn: string;
  storyAr: string;
  priceMad: string;
  priceEur: string;
  priceUsd: string;
  stock: string;
  status: RugStatus;
  isMadeToOrder: boolean;
  photos: string[];
  photosText: string;
  videoUrl: string;
  certificateId: string;
}

function emptyState(artisans: AdminArtisanOption[]): EditorState {
  return {
    nameFr: "",
    nameEn: "",
    nameAr: "",
    type: "BENI_OURAIN",
    artisanId: artisans[0]?.id ?? "",
    widthCm: "200",
    lengthCm: "300",
    weightKg: "8",
    materialFr: "Laine de mouton",
    materialEn: "Sheep wool",
    materialAr: "صوف خروف طبيعي",
    originVillage: "",
    originRegion: "",
    originAr: "",
    craftingDays: "21",
    storyFr: "",
    storyEn: "",
    storyAr: "",
    priceMad: "",
    priceEur: "",
    priceUsd: "",
    stock: "1",
    status: "AVAILABLE",
    isMadeToOrder: false,
    photos: [],
    photosText: "",
    videoUrl: "",
    certificateId: "",
  };
}

function stateFromRug(rug: SerializedRug): EditorState {
  return {
    nameFr: rug.nameFr,
    nameEn: rug.nameEn,
    nameAr: rug.nameAr ?? "",
    type: rug.type,
    artisanId: rug.artisanId,
    widthCm: String(rug.widthCm),
    lengthCm: String(rug.lengthCm),
    weightKg: String(rug.weightKg),
    materialFr: rug.materialFr,
    materialEn: rug.materialEn,
    materialAr: rug.materialAr ?? "",
    originVillage: rug.originVillage,
    originRegion: rug.originRegion,
    originAr: rug.originAr ?? "",
    craftingDays: String(rug.craftingDays),
    storyFr: rug.storyFr,
    storyEn: rug.storyEn,
    storyAr: rug.storyAr ?? "",
    priceMad: String(rug.priceMad),
    priceEur: "",
    priceUsd: "",
    stock: String(rug.stock),
    status: rug.status,
    isMadeToOrder: rug.isMadeToOrder,
    photos: [...rug.photos],
    photosText: rug.photos.join("\n"),
    videoUrl: rug.videoUrl ?? "",
    certificateId: rug.certificateId ?? "",
  };
}

/**
 * Uploads one catalog file and returns a URL that works in both local dev and
 * production. On Vercel the browser talks directly to the private Blob store
 * (client upload) — this avoids the 4.5 MB serverless request body limit, so
 * 15-30s showcase videos upload reliably from any PC or phone.
 */
async function uploadCatalogFile(original: File): Promise<string> {
  const file = original.type.startsWith("image/")
    ? await compressImage(original, 1920, 0.82)
    : original;

  let mode: "blob" | "local" = "local";
  try {
    const modeResponse = await fetch("/api/admin/upload", {
      credentials: "include",
      cache: "no-store",
    });
    if (modeResponse.ok) {
      const info = (await modeResponse.json()) as { mode?: string };
      if (info.mode === "blob") mode = "blob";
    }
  } catch {
    // Keep the local fallback if the mode check fails.
  }

  if (mode === "blob") {
    const pathname = createMediaPathname(file);
    if (!pathname) throw new Error("Unsupported file type.");

    const blob = await uploadToBlob(pathname, file, {
      access: "private",
      handleUploadUrl: "/api/admin/upload",
      ...(file.type ? { contentType: file.type } : {}),
    });

    return mediaPublicUrl(blob.pathname);
  }

  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch("/api/admin/upload", {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as {
      error?: { message?: string };
    };
    throw new Error(data?.error?.message ?? "Upload failed");
  }

  const data = (await response.json()) as { url: string };
  return data.url;
}

function RugEditorModal({
  open,
  rug,
  artisans,
  rates,
  onClose,
  onSaved,
}: {
  open: boolean;
  rug: SerializedRug | null;
  artisans: AdminArtisanOption[];
  rates: AdminCurrencyRates;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const { t } = useStore();
  const [form, setForm] = useState<EditorState>(() => emptyState(artisans));
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [tab, setTab] = useState<"general" | "arabic" | "media">("general");

  useEffect(() => {
    if (!open) return;
    setError(null);
    setBusy(false);
    setUploading(false);
    setUrlInput("");
    setTab("general");
    setForm(rug ? stateFromRug(rug) : emptyState(artisans));
  }, [artisans, open, rug]);

  function set<K extends keyof EditorState>(key: K, value: EditorState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleAddUrl() {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (form.photos.length >= 10) {
      setError("Un tapis peut avoir au maximum 10 photos.");
      return;
    }
    setForm((curr) => {
      const next = [...curr.photos, trimmed];
      return { ...curr, photos: next, photosText: next.join("\n") };
    });
    setUrlInput("");
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 10 - form.photos.length;
    if (remainingSlots <= 0) {
      setError(t("Un tapis peut avoir au maximum 10 photos.", "A rug can have at most 10 photos.", "يمكن أن يكون للزربية 10 صور كحد أقصى."));
      return;
    }

    setUploading(true);
    try {
      const filesToUpload = Array.from(files).slice(0, remainingSlots);
      for (const file of filesToUpload) {
        try {
          // Compression + private Blob upload (or local disk in dev).
          const url = await uploadCatalogFile(file);
          setForm((curr) => {
            if (curr.photos.length >= 10) return curr;
            const next = [...curr.photos, url];
            return { ...curr, photos: next, photosText: next.join("\n") };
          });
        } catch (cause) {
          setError(
            cause instanceof Error ? cause.message : t("Échec de l'envoi.", "Upload failed.", "فشل الرفع."),
          );
        }
      }
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function handleVideoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Strict limit: max 18 MB to ensure hundreds of rugs can be stored safely
    if (file.size > 18 * 1024 * 1024) {
      setError(
        t(
          `La vidéo dépasse 18 MB (${(file.size / (1024 * 1024)).toFixed(1)} MB). Pour garder votre base légère et ajouter +100 tapis, choisissez une courte vidéo de 15 à 30 secondes ou utilisez un lien YouTube/Vimeo.`,
          `Video exceeds 18 MB (${(file.size / (1024 * 1024)).toFixed(1)} MB). Please pick a 15-30s video or use a YouTube/Vimeo link to save storage.`,
          `حجم الفيديو يتجاوز 18 ميغابايت (${(file.size / (1024 * 1024)).toFixed(1)} ميغابايت). للحفاظ على مساحة التخزين وإضافة +100 زربية، يرجى اختيار فيديو قصير (15-30 ثانية) أو وضع رابط YouTube / Vimeo.`,
        ),
      );
      event.target.value = "";
      return;
    }

    setUploading(true);
    try {
      const url = await uploadCatalogFile(file);
      setForm((curr) => ({ ...curr, videoUrl: url }));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : t("Échec de l'envoi.", "Upload failed.", "فشل الرفع."),
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  function handleRemovePhoto(index: number) {
    setForm((curr) => {
      const next = curr.photos.filter((_, i) => i !== index);
      return { ...curr, photos: next, photosText: next.join("\n") };
    });
  }

  function handleSetCover(index: number) {
    if (index === 0) return;
    setForm((curr) => {
      const target = curr.photos[index];
      const rest = curr.photos.filter((_, i) => i !== index);
      const next = [target, ...rest];
      return { ...curr, photos: next, photosText: next.join("\n") };
    });
  }

  const photos = form.photos;

  const suggestedEur = Number(form.priceMad)
    ? Math.round(Number(form.priceMad) * rates.EUR * 100) / 100
    : 0;
  const suggestedUsd = Number(form.priceMad)
    ? Math.round(Number(form.priceMad) * rates.USD * 100) / 100
    : 0;

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    if (photos.length > 10) {
      setError("Un tapis peut avoir au maximum 10 photos.");
      return;
    }

    setBusy(true);
    setError(null);

    const payload = {
      nameFr: form.nameFr,
      nameEn: form.nameEn,
      nameAr: form.nameAr.trim() || null,
      type: form.type,
      artisanId: form.artisanId,
      widthCm: Number(form.widthCm),
      lengthCm: Number(form.lengthCm),
      weightKg: Number(form.weightKg),
      materialFr: form.materialFr,
      materialEn: form.materialEn,
      materialAr: form.materialAr.trim() || null,
      originVillage: form.originVillage,
      originRegion: form.originRegion,
      originAr: form.originAr.trim() || null,
      craftingDays: Number(form.craftingDays),
      storyFr: form.storyFr,
      storyEn: form.storyEn,
      storyAr: form.storyAr.trim() || null,
      priceMad: Number(form.priceMad),
      ...(form.priceEur.trim()
        ? { priceEur: Number(form.priceEur) }
        : {}),
      ...(form.priceUsd.trim()
        ? { priceUsd: Number(form.priceUsd) }
        : {}),
      stock: Number(form.stock),
      status: form.status,
      isMadeToOrder: form.isMadeToOrder,
      photos,
      videoUrl: form.videoUrl.trim(),
      ...(form.certificateId.trim()
        ? { certificateId: form.certificateId.trim() }
        : {}),
    };

    try {
      if (rug) {
        await apiRequest(`/api/admin/rugs/${rug.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        onSaved(t(`${form.nameFr} mis à jour.`, `${form.nameFr} updated.`, `${form.nameFr} تم تحديثه.`));
      } else {
        await apiRequest("/api/admin/rugs", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        onSaved(t(`${form.nameFr} ajouté au catalogue.`, `${form.nameFr} added to catalogue.`, `${form.nameFr} أُضيف إلى الكتالوج.`));
      }
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Enregistrement impossible.",
      );
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      wide
      title={rug ? "Modifier le tapis" : "Nouveau tapis"}
      subtitle={
        rug
          ? `${rug.sku} · ${rug.slug}`
          : "Les prix EUR/USD sont calculés depuis le MAD si vous les laissez vides."
      }
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="flex flex-wrap items-center gap-2 border-b border-line/70 pb-3">
          <button
            type="button"
            onClick={() => setTab("general")}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-semibold transition",
              tab === "general"
                ? "bg-ink text-background shadow-sm"
                : "bg-surface text-ink/70 hover:text-ink",
            )}
          >
            {t("Détails & Dimensions", "Details & dimensions", "التفاصيل والأبعاد")}
          </button>
          <button
            type="button"
            onClick={() => setTab("arabic")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition",
              tab === "arabic"
                ? "bg-terracotta text-background shadow-sm"
                : "bg-surface text-ink/70 hover:text-ink",
            )}
          >
            <Globe2 className="h-3.5 w-3.5" />
            المحتوى بالعربية (Arabe)
            {form.nameAr ? (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => setTab("media")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition",
              tab === "media"
                ? "bg-ink text-background shadow-sm"
                : "bg-surface text-ink/70 hover:text-ink",
            )}
          >
            <ImageIcon className="h-3.5 w-3.5" />
            {t("Photos & Médias", "Photos & media", "الصور والوسائط")} ({photos.length}/10)
          </button>
        </div>

        {tab === "general" && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="field-label">Nom (FR)</span>
                <input
                  required
                  minLength={2}
                  value={form.nameFr}
                  onChange={(event) => set("nameFr", event.target.value)}
                  className="field"
                />
              </label>
              <label className="block">
                <span className="field-label">Nom (EN)</span>
                <input
                  required
                  minLength={2}
                  value={form.nameEn}
                  onChange={(event) => set("nameEn", event.target.value)}
                  className="field"
                />
              </label>

              <label className="block">
                <span className="field-label">Type</span>
                <select
                  value={form.type}
                  onChange={(event) =>
                    set("type", event.target.value as RugType)
                  }
                  className="field"
                >
                  {RUG_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="field-label">Artisan</span>
                <select
                  required
                  value={form.artisanId}
                  onChange={(event) => set("artisanId", event.target.value)}
                  className="field"
                >
                  {artisans.map((artisan) => (
                    <option key={artisan.id} value={artisan.id}>
                      {artisan.nameFr} — {artisan.village}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="field-label">Largeur (cm)</span>
                <input
                  required
                  type="number"
                  min={20}
                  max={2000}
                  value={form.widthCm}
                  onChange={(event) => set("widthCm", event.target.value)}
                  className="field"
                />
              </label>
              <label className="block">
                <span className="field-label">Longueur (cm)</span>
                <input
                  required
                  type="number"
                  min={20}
                  max={2000}
                  value={form.lengthCm}
                  onChange={(event) => set("lengthCm", event.target.value)}
                  className="field"
                />
              </label>

              <label className="block">
                <span className="field-label">Poids (kg)</span>
                <input
                  required
                  type="number"
                  step="0.1"
                  min={0.1}
                  max={500}
                  value={form.weightKg}
                  onChange={(event) => set("weightKg", event.target.value)}
                  className="field"
                />
              </label>
              <label className="block">
                <span className="field-label">Jours de tissage</span>
                <input
                  required
                  type="number"
                  min={1}
                  max={3650}
                  value={form.craftingDays}
                  onChange={(event) => set("craftingDays", event.target.value)}
                  className="field"
                />
              </label>

              <label className="block">
                <span className="field-label">{t("Matière (FR)", "Material (FR)", "المادة (FR)")}</span>
                <input
                  required
                  minLength={2}
                  value={form.materialFr}
                  onChange={(event) => set("materialFr", event.target.value)}
                  className="field"
                />
              </label>
              <label className="block">
                <span className="field-label">{t("Matière (EN)", "Material (EN)", "المادة (EN)")}</span>
                <input
                  required
                  minLength={2}
                  value={form.materialEn}
                  onChange={(event) => set("materialEn", event.target.value)}
                  className="field"
                />
              </label>

              <label className="block">
                <span className="field-label">Village d’origine</span>
                <input
                  required
                  minLength={2}
                  value={form.originVillage}
                  onChange={(event) => set("originVillage", event.target.value)}
                  className="field"
                />
              </label>
              <label className="block">
                <span className="field-label">{t("Région d’origine", "Origin region", "منطقة المنشأ")}</span>
                <input
                  required
                  minLength={2}
                  value={form.originRegion}
                  onChange={(event) => set("originRegion", event.target.value)}
                  className="field"
                />
              </label>
            </div>

            <div className="rounded-2xl border border-line/80 bg-surface/50 p-4">
              <p className="field-label">Prix</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block">
                  <span className="text-[0.66rem] text-muted">MAD (base)</span>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min={1}
                    value={form.priceMad}
                    onChange={(event) => set("priceMad", event.target.value)}
                    className="field mt-1"
                  />
                </label>
                <label className="block">
                  <span className="text-[0.66rem] text-muted">
                    EUR (auto si vide)
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.priceEur}
                    onChange={(event) => set("priceEur", event.target.value)}
                    placeholder={suggestedEur ? String(suggestedEur) : "—"}
                    className="field mt-1"
                  />
                </label>
                <label className="block">
                  <span className="text-[0.66rem] text-muted">
                    USD (auto si vide)
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.priceUsd}
                    onChange={(event) => set("priceUsd", event.target.value)}
                    placeholder={suggestedUsd ? String(suggestedUsd) : "—"}
                    className="field mt-1"
                  />
                </label>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block">
                <span className="field-label">Statut</span>
                <select
                  value={form.status}
                  onChange={(event) =>
                    set("status", event.target.value as RugStatus)
                  }
                  className="field"
                >
                  {RUG_STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="field-label">Stock</span>
                <input
                  type="number"
                  min={0}
                  max={10000}
                  value={form.stock}
                  onChange={(event) => set("stock", event.target.value)}
                  className="field"
                />
              </label>
              <label className="flex items-end gap-2 pb-2.5">
                <input
                  type="checkbox"
                  checked={form.isMadeToOrder}
                  onChange={(event) =>
                    set("isMadeToOrder", event.target.checked)
                  }
                  className="h-4 w-4 rounded border-line accent-terracotta"
                />
                <span className="text-xs text-ink">Sur-mesure possible</span>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="field-label">Histoire (FR)</span>
                <textarea
                  required
                  minLength={20}
                  value={form.storyFr}
                  onChange={(event) => set("storyFr", event.target.value)}
                  className="field-textarea"
                />
              </label>
              <label className="block">
                <span className="field-label">Histoire (EN)</span>
                <textarea
                  required
                  minLength={20}
                  value={form.storyEn}
                  onChange={(event) => set("storyEn", event.target.value)}
                  className="field-textarea"
                />
              </label>
            </div>
          </div>
        )}

        {tab === "arabic" && (
          <div className="space-y-4 rounded-2xl border border-terracotta/20 bg-surface/30 p-5">
            <div className="flex items-center gap-2 border-b border-line/60 pb-3 text-right">
              <Globe2 className="h-4 w-4 text-terracotta" />
              <div>
                <h4 className="text-sm font-semibold text-ink">
                  المحتوى باللغة العربية (Arabic Translation)
                </h4>
                <p className="text-[0.68rem] text-muted">
                  هذه الحقول تظهر للزبائن عند تصفح المتجر باللغة العربية.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2" dir="rtl">
              <label className="block text-right">
                <span className="field-label">اسم الزربية (بالعربية)</span>
                <input
                  value={form.nameAr}
                  onChange={(event) => set("nameAr", event.target.value)}
                  placeholder="مثال: ثلج الأطلس، قمر أمازيغي..."
                  className="field text-right"
                  dir="rtl"
                />
              </label>
              <label className="block text-right">
                <span className="field-label">المادة والمكونات (بالعربية)</span>
                <input
                  value={form.materialAr}
                  onChange={(event) => set("materialAr", event.target.value)}
                  placeholder="مثال: صوف خروف طبيعي غير مصبوغ..."
                  className="field text-right"
                  dir="rtl"
                />
              </label>
              <label className="block text-right sm:col-span-2">
                <span className="field-label">المنطقة أو القرية (بالعربية)</span>
                <input
                  value={form.originAr}
                  onChange={(event) => set("originAr", event.target.value)}
                  placeholder="مثال: الأطلس المتوسط — آيت بوكماز"
                  className="field text-right"
                  dir="rtl"
                />
              </label>
              <label className="block text-right sm:col-span-2">
                <span className="field-label">قصة وتاريخ الزربية (بالعربية)</span>
                <textarea
                  rows={4}
                  value={form.storyAr}
                  onChange={(event) => set("storyAr", event.target.value)}
                  placeholder="اكتب نبذة أو قصة عن القطعة وطريقة نسجها ورموزها..."
                  className="field-textarea text-right"
                  dir="rtl"
                />
              </label>
            </div>
          </div>
        )}

        {tab === "media" && (
          <div className="space-y-4">
            <div
              className="rounded-2xl border-2 border-dashed border-line bg-surface/30 p-5 text-center transition hover:border-terracotta/50"
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const dt = e.dataTransfer;
                if (dt?.files?.length) {
                  const fakeEvent = {
                    target: { files: dt.files, value: "" },
                  } as unknown as React.ChangeEvent<HTMLInputElement>;
                  handleFileUpload(fakeEvent);
                }
              }}
            >
              <Upload className="mx-auto h-8 w-8 text-terracotta/70" />
              <p className="mt-2 text-xs font-semibold text-ink">
                Importer des photos depuis votre ordinateur
              </p>
              <p className="mt-1 text-[0.66rem] text-muted">
                {t("Glissez-déposez ou sélectionnez jusqu'à 10 photos (JPEG, PNG, WebP)", "Drag and drop or select up to 10 photos (JPEG, PNG, WebP)", "اسحب وأفلت أو اختر حتى 10 صور (JPEG, PNG, WebP)")}
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[0.64rem] font-medium text-emerald-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                {t(
                  "Optimisation automatique active (< 350 KB par photo)",
                  "Automatic compression enabled (< 350 KB per photo)",
                  "الضغط التلقائي مفعل (< 350 كيلوبايت للصورة لتوفير المساحة)",
                )}
              </div>
              <br />
              <label className="btn-secondary mt-3 inline-flex cursor-pointer items-center gap-2 px-4 py-2 text-xs">
                {uploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                <span>
                  {uploading
                    ? t("Envoi en cours…", "Uploading…", "جارٍ الرفع…")
                    : t("Choisir des fichiers", "Choose files", "اختر الملفات")}
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  disabled={uploading}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="rounded-2xl border border-line bg-surface/30 p-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-ink/70">
                  {t("Vidéo (optionnel)", "Video (optional)", "فيديو (اختياري)")}
                </span>
              </div>
              {form.videoUrl ? (
                <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                  <span className="truncate font-mono">{form.videoUrl}</span>
                  <button
                    type="button"
                    onClick={() => setForm((curr) => ({ ...curr, videoUrl: "" }))}
                    className="text-[0.65rem] underline underline-offset-2"
                  >
                    {t("Retirer", "Remove", "إزالة")}
                  </button>
                </div>
              ) : (
                <label className="btn-secondary mt-3 inline-flex cursor-pointer items-center gap-2 px-4 py-2 text-xs">
                  {uploading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {uploading
                      ? t("Envoi en cours…", "Uploading…", "جارٍ الرفع…")
                      : t("Importer une vidéo", "Import a video", "استيراد فيديو")}
                  </span>
                  <input
                    type="file"
                    accept="video/*"
                    disabled={uploading}
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                </label>
              )}
              <p className="mt-2 text-[0.62rem] text-muted">
                {t(
                  "MP4, WebM — max 18 MB (conseillé : 15 à 30 secondes). Vous pouvez aussi utiliser un lien YouTube/Vimeo ci-dessous.",
                  "MP4, WebM — max 18 MB (recommended: 15-30s). You can also use a YouTube/Vimeo link below.",
                  "MP4, WebM — 18 MB كحد أقصى (المفضل: 15 إلى 30 ثانية). يمكنك أيضاً وضع رابط YouTube / Vimeo مجاني.",
                )}
              </p>
            </div>

            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Ou collez une URL d'image (ex: https://images.unsplash.com/...)"
                className="field flex-1 text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddUrl();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddUrl}
                className="btn-primary shrink-0 px-4 py-2 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Ajouter URL
              </button>
            </div>

            {photos.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-ink/75">
                  <span>Galerie ({photos.length}/10 photos)</span>
                  <span className="text-[0.65rem] text-muted">
                    {t("La 1ère photo est la couverture principale", "The 1st photo is the main cover", "الصورة الأولى هي الغلاف الرئيسي")}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
                  {photos.map((src, index) => (
                    <div
                      key={`${src.slice(0, 32)}-${index}`}
                      className="group relative aspect-square overflow-hidden rounded-xl border border-line bg-surface"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                      {index === 0 ? (
                        <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-terracotta px-2 py-0.5 text-[0.55rem] font-bold text-white shadow-sm">
                          <Star className="h-2.5 w-2.5 fill-white" />
                          Couverture
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetCover(index)}
                          className="absolute left-1.5 top-1.5 hidden rounded-full bg-background/90 px-2 py-0.5 text-[0.55rem] font-semibold text-ink opacity-90 shadow transition hover:bg-terracotta hover:text-white group-hover:block"
                          title="Définir comme couverture"
                        >
                          Mettre en 1er
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(index)}
                        className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-ink/75 text-white transition hover:bg-red-600"
                        title="Supprimer la photo"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="rounded-xl border border-line/60 bg-surface/40 p-4 text-center text-xs text-muted">
                {t("Aucune photo ajoutée pour l'instant. Importez au moins une photo pour le catalogue.", "No photos added yet. Import at least one photo for the catalogue.", "لم تُضف أي صورة بعد. استورد صورة واحدة على الأقل للكتالوج.")}
              </p>
            )}

            <div className="grid gap-4 pt-2 sm:grid-cols-2">
              <label className="block">
                <span className="field-label">{t("Vidéo (URL ou chemin, optionnel)", "Video (URL or path, optional)", "فيديو (رابط أو مسار، اختياري)")}</span>
                <input
                  type="text"
                  value={form.videoUrl}
                  onChange={(event) => set("videoUrl", event.target.value)}
                  className="field"
                  placeholder="https://…/video.mp4 ou /api/media/catalog/…"
                />
                {form.videoUrl && /\.(jpe?g|png|webp|avif|gif)(\?.*)?$/i.test(form.videoUrl.trim()) ? (
                  <p className="mt-1 text-[0.7rem] font-medium text-amber-700">
                    ⚠️ {t(
                      "Attention : ce lien semble pointer vers une image, pas une vidéo.",
                      "Warning: this URL seems to be an image, not a video.",
                      "تنبيه: هذا الرابط يبدو كرابط صورة وليس فيديو.",
                    )}
                  </p>
                ) : null}
              </label>
              <label className="block">
                <span className="field-label">Certificat (optionnel)</span>
                <input
                  value={form.certificateId}
                  onChange={(event) => set("certificateId", event.target.value)}
                  className="field"
                  placeholder="ZA-CERT-2026-0001"
                />
              </label>
            </div>
          </div>
        )}

        <ErrorNote message={error} />

        <div className="flex flex-col-reverse gap-3 border-t border-line/80 pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost px-5 py-2.5 text-xs"
            disabled={busy}
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={busy}
            className="btn-primary px-5 py-2.5 text-xs disabled:opacity-60"
          >
            <BusyLabel
              busy={busy}
              label={rug ? t("Enregistrer", "Save", "حفظ") : t("Créer le tapis", "Create rug", "إنشاء زربية")}
            />
          </button>
        </div>
      </form>
    </Modal>
  );
}
