import type { MetadataRoute } from "next";
import { BLOG_POSTS } from "@/lib/blog";
import { LEGAL_SLUGS } from "@/lib/legal";
import { getStorefrontRugs } from "@/lib/storefront";

export const dynamic = "force-dynamic";

function baseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

/**
 * Sitemap generated from the live catalogue and the journal, so new rugs and
 * articles enter Google without a redeploy.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = baseUrl();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/our-story`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/custom-order`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/blog`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/faq`, changeFrequency: "monthly", priority: 0.5 },
  ];

  const legalRoutes: MetadataRoute.Sitemap = LEGAL_SLUGS.map((slug) => ({
    url: `${base}/legal/${slug}`,
    changeFrequency: "yearly",
    priority: 0.3,
  }));

  const blogRoutes: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  let rugRoutes: MetadataRoute.Sitemap = [];

  try {
    const rugs = await getStorefrontRugs();
    rugRoutes = rugs
      .filter((rug) => rug.status !== "SOLD")
      .map((rug) => ({
        url: `${base}/rugs/${rug.slug}`,
        lastModified: new Date(rug.updatedAt),
        changeFrequency: "weekly",
        priority: 0.8,
      }));
  } catch {
    rugRoutes = [];
  }

  return [...staticRoutes, ...rugRoutes, ...blogRoutes, ...legalRoutes].map(
    (entry) => ({
      ...entry,
      lastModified: entry.lastModified ?? now,
    }),
  );
}
