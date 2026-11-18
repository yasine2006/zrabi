import { prisma } from "../src/lib/db";
import {
  BLOG_POSTS,
  blogTitle,
  blogExcerpt,
  blogCategory,
} from "../src/lib/blog";
import type { Locale } from "../src/lib/i18n";

function pickLocale<T>(fr: T, en: T, ar: T | undefined, locale: Locale): T {
  if (locale === "ar" && ar !== undefined) return ar;
  if (locale === "en") return en;
  return fr;
}

function buildContent(post: (typeof BLOG_POSTS)[number], locale: Locale): string {
  const lines: string[] = [];
  for (const section of post.sections) {
    const heading = pickLocale(section.headingFr, section.headingEn, section.headingAr, locale);
    lines.push(`## ${heading}`);
    const paragraphs = pickLocale(section.paragraphsFr, section.paragraphsEn, section.paragraphsAr, locale);
    if (paragraphs) {
      for (const p of paragraphs) lines.push(p);
    }
    const bullets = pickLocale(section.bulletsFr, section.bulletsEn, section.bulletsAr, locale);
    if (bullets) {
      for (const item of bullets) lines.push(`- ${item}`);
    }
    const quote = pickLocale(section.quoteFr, section.quoteEn, section.quoteAr, locale);
    if (quote) lines.push(`> ${quote}`);
    lines.push("");
  }
  return lines.join("\n").trim();
}

async function main() {
  for (const post of BLOG_POSTS) {
    const existing = await prisma.blogPost.findUnique({ where: { slug: post.slug } });
    if (existing) {
      console.log(`skip (exists): ${post.slug}`);
      continue;
    }
    await prisma.blogPost.create({
      data: {
        slug: post.slug,
        titleFr: blogTitle(post, "fr"),
        titleEn: blogTitle(post, "en"),
        titleAr: blogTitle(post, "ar"),
        excerptFr: blogExcerpt(post, "fr"),
        excerptEn: blogExcerpt(post, "en"),
        excerptAr: blogExcerpt(post, "ar"),
        contentFr: buildContent(post, "fr"),
        contentEn: buildContent(post, "en"),
        contentAr: buildContent(post, "ar"),
        category: blogCategory(post, "fr"),
        coverImage: post.coverImage,
        readingMinutes: post.readingMinutes,
        publishedAt: new Date(post.publishedAt),
        isPublished: true,
      },
    });
    console.log(`seeded: ${post.slug}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
