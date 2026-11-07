"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { RugCard } from "@/components/RugCard";
import { useStore } from "@/context/StoreContext";
import type { SerializedRug } from "@/lib/api/serializers";

export default function FavoritesPage() {
  const { locale, favorites, t } = useStore();
  const [rugs, setRugs] = useState<SerializedRug[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/rugs?limit=200")
      .then((r) => r.json())
      .then((data) => setRugs(data?.rugs ?? []))
      .catch(() => setRugs([]))
      .finally(() => setLoading(false));
  }, []);

  const favRugs = rugs.filter((rug) => favorites.includes(rug.id));

  return (
    <div className="container-page py-14 sm:py-20">
      <div className="max-w-2xl">
        <p className="eyebrow">{t("Mémoire", "Saved", "محفوظ")}</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold sm:text-5xl">
          {t("Mes favoris", "My favourites", "مفضلتي")}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          {t(
            "Les pièces que vous avez gardées, sur cet appareil.",
            "The pieces you saved, on this device.",
            "القطع التي حفظتها، على هذا الجهاز.",
          )}
        </p>
      </div>

      {loading ? (
        <p className="mt-10 text-sm text-muted">
          {t("Chargement…", "Loading…", "جارٍ التحميل…")}
        </p>
      ) : favRugs.length === 0 ? (
        <div className="mt-12 flex flex-col items-center gap-4 rounded-[2rem] border border-line bg-surface/50 py-16 text-center">
          <Heart className="h-8 w-8 text-terracotta/60" />
          <p className="max-w-sm text-sm text-muted">
            {t(
              "Aucun favori pour le moment. Parcourez la collection et touchez le cœur.",
              "No favourites yet. Browse the collection and tap the heart.",
              "لا توجد مفضلات بعد. تصفّح المجموعة واضغط على القلب.",
            )}
          </p>
          <Link href="/shop" className="btn-primary">
            {t("Voir la collection", "See the collection", "عرض المجموعة")}
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {favRugs.map((rug) => (
            <RugCard key={rug.id} rug={rug} />
          ))}
        </div>
      )}
    </div>
  );
}
