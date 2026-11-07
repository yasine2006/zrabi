import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/JsonLd";
import { BlogPostView } from "@/components/pages/BlogPostView";
import {
  BLOG_POSTS,
  blogExcerpt,
  blogTitle,
  getBlogPost,
  getRelatedPosts,
} from "@/lib/blog";
import { getServerLocale } from "@/lib/i18n-server";

interface BlogPostPageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export function generateMetadata({ params }: BlogPostPageProps): Metadata {
  const locale = getServerLocale();
  const post = getBlogPost(params.slug);

  if (!post) {
    return { title: "Article introuvable" };
  }

  const title = blogTitle(post, locale);
  const description = blogExcerpt(post, locale);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: post.publishedAt,
      images: [{ url: post.coverImage }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [post.coverImage],
    },
  };
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const locale = getServerLocale();
  const post = getBlogPost(params.slug);

  if (!post) notFound();

  const rawBase = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const base = rawBase.endsWith("/") ? rawBase.slice(0, -1) : rawBase;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: blogTitle(post, locale),
    description: blogExcerpt(post, locale),
    image: post.coverImage,
    datePublished: post.publishedAt,
    author: { "@type": "Organization", name: "Zarbia Atlas" },
    publisher: {
      "@type": "Organization",
      name: "Zarbia Atlas",
      logo: { "@type": "ImageObject", url: `${base}/icon.svg` },
    },
    mainEntityOfPage: `${base}/blog/${post.slug}`,
  };

  const breadcrumb = breadcrumbJsonLd(base, [
    { name: "Home", path: "/" },
    { name: "Journal", path: "/blog" },
    { name: blogTitle(post, locale), path: `/blog/${post.slug}` },
  ]);

  return (
    <>
      <JsonLd data={articleJsonLd} />
      <JsonLd data={breadcrumb} />
      <BlogPostView post={post} related={getRelatedPosts(post.slug)} />
    </>
  );
}
