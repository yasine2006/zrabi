"use client";

import { useState } from "react";
import { BookOpen, Plus, Trash2 } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { apiRequest } from "./admin-ui";
import { AdminCard } from "./admin-ui";

interface BlogPost {
  id: string;
  slug: string;
  titleFr: string;
  titleEn: string;
  titleAr?: string | null;
  excerptFr: string;
  excerptEn: string;
  contentFr: string;
  contentEn: string;
  coverImage: string;
  category: string;
  readingMinutes: number;
  isPublished: boolean;
  publishedAt: string;
}

interface BlogTabProps {
  posts: BlogPost[];
  canWrite: boolean;
  onMutated: (message: string) => void;
}

const EMPTY_FORM = {
  slug: "",
  titleFr: "",
  titleEn: "",
  titleAr: "",
  excerptFr: "",
  excerptEn: "",
  contentFr: "",
  contentEn: "",
  coverImage: "",
  category: "guide",
  readingMinutes: 5,
  isPublished: true,
};

export function BlogTab({ posts, canWrite, onMutated }: BlogTabProps) {
  const { t } = useStore();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await apiRequest("/api/admin/blog", {
        method: "POST",
        body: JSON.stringify({
          slug: form.slug,
          titleFr: form.titleFr,
          titleEn: form.titleEn,
          titleAr: form.titleAr || undefined,
          excerptFr: form.excerptFr,
          excerptEn: form.excerptEn,
          contentFr: form.contentFr,
          contentEn: form.contentEn,
          category: form.category,
          coverImage: form.coverImage,
          readingMinutes: form.readingMinutes,
          isPublished: form.isPublished,
        }),
      });
      setForm(EMPTY_FORM);
      setCreating(false);
      onMutated(t("Article créé.", "Article created.", "تم إنشاء المقال."));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm(t("Supprimer cet article ?", "Delete this article?", "حذف هذا المقال؟"))) return;
    try {
      await apiRequest(`/api/admin/blog/${id}`, { method: "DELETE" });
      onMutated(t("Article supprimé.", "Article deleted.", "تم حذف المقال."));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Error");
    }
  }

  return (
    <div className="space-y-6">
      <AdminCard>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-terracotta" />
            <div>
              <p className="eyebrow">{t("Journal", "Journal", "المدونة")}</p>
              <h2 className="text-lg text-ink">
                {t("Articles", "Articles", "المقالات")} ({posts.length})
              </h2>
            </div>
          </div>
          {canWrite ? (
            <button
              type="button"
              onClick={() => setCreating((v) => !v)}
              className="btn-primary px-4 py-2 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              {t("Nouvel article", "New article", "مقال جديد")}
            </button>
          ) : null}
        </div>

        {error ? (
          <p className="mt-3 rounded-xl bg-red-50 px-3.5 py-2.5 text-[0.72rem] text-red-700">
            {error}
          </p>
        ) : null}

        {creating ? (
          <form onSubmit={create} className="mt-5 space-y-3 border-t border-line pt-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="field-label">Slug</span>
                <input
                  required
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="mon-article"
                  className="field"
                />
              </label>
              <label className="block">
                <span className="field-label">
                  {t("Catégorie", "Category", "الفئة")}
                </span>
                <input
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="field"
                />
              </label>
            </div>
            <label className="block">
              <span className="field-label">Titre FR</span>
              <input
                required
                value={form.titleFr}
                onChange={(e) => setForm({ ...form, titleFr: e.target.value })}
                className="field"
              />
            </label>
            <label className="block">
              <span className="field-label">Titre EN</span>
              <input
                required
                value={form.titleEn}
                onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
                className="field"
              />
            </label>
            <label className="block">
              <span className="field-label">Titre AR (optionnel)</span>
              <input
                value={form.titleAr}
                onChange={(e) => setForm({ ...form, titleAr: e.target.value })}
                className="field"
              />
            </label>
            <label className="block">
              <span className="field-label">Extrait FR</span>
              <textarea
                required
                rows={2}
                value={form.excerptFr}
                onChange={(e) => setForm({ ...form, excerptFr: e.target.value })}
                className="field-textarea"
              />
            </label>
            <label className="block">
              <span className="field-label">Extrait EN</span>
              <textarea
                required
                rows={2}
                value={form.excerptEn}
                onChange={(e) => setForm({ ...form, excerptEn: e.target.value })}
                className="field-textarea"
              />
            </label>
            <label className="block">
              <span className="field-label">Contenu FR (markdown)</span>
              <textarea
                required
                rows={6}
                value={form.contentFr}
                onChange={(e) => setForm({ ...form, contentFr: e.target.value })}
                className="field-textarea"
              />
            </label>
            <label className="block">
              <span className="field-label">Contenu EN (markdown)</span>
              <textarea
                required
                rows={6}
                value={form.contentEn}
                onChange={(e) => setForm({ ...form, contentEn: e.target.value })}
                className="field-textarea"
              />
            </label>
            <label className="block">
              <span className="field-label">
                {t("Image de couverture (URL)", "Cover image (URL)", "صورة الغلاف (رابط)")}
              </span>
              <input
                required
                value={form.coverImage}
                onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
                placeholder="https://..."
                className="field"
              />
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                />
                {t("Publié", "Published", "منشور")}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <span>{t("Temps de lecture (min)", "Reading time (min)", "وقت القراءة (د)")}</span>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={form.readingMinutes}
                  onChange={(e) =>
                    setForm({ ...form, readingMinutes: Number(e.target.value) })
                  }
                  className="field w-20"
                />
              </label>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={busy} className="btn-primary px-4 py-2 text-xs">
                {busy ? "…" : t("Créer", "Create", "إنشاء")}
              </button>
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="btn-ghost px-4 py-2 text-xs"
              >
                {t("Annuler", "Cancel", "إلغاء")}
              </button>
            </div>
          </form>
        ) : null}

        <div className="mt-5 space-y-2">
          {posts.length === 0 ? (
            <p className="text-sm text-muted">
              {t("Aucun article.", "No articles.", "لا توجد مقالات.")}
            </p>
          ) : (
            posts.map((post) => (
              <div
                key={post.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-line bg-background/70 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">
                    {post.titleFr}
                  </p>
                  <p className="text-[0.62rem] text-muted">
                    {post.slug} · {post.isPublished ? "✓" : "draft"} ·{" "}
                    {new Date(post.publishedAt).toLocaleDateString()}
                  </p>
                </div>
                {canWrite ? (
                  <button
                    type="button"
                    onClick={() => remove(post.id)}
                    className="grid h-8 w-8 place-items-center rounded-full border border-line text-red-600 transition hover:border-red-300 hover:bg-red-50"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
            ))
          )}
        </div>
      </AdminCard>
    </div>
  );
}
