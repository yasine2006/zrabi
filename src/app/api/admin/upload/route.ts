import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { requireAdminSession } from "@/lib/admin/auth";
import { handleApiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

const MAX_IMAGE_BYTES = 2.5 * 1024 * 1024; // 2.5 MB max on server (client auto-compresses to ~200-350 KB)
const MAX_VIDEO_BYTES = 18 * 1024 * 1024; // 18 MB max (optimal for 15-30s showcase clips)
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-matroska",
]);

/**
 * POST /api/admin/upload
 *
 * Accepts a multipart form with a single `file` field and stores it under
 * /public/uploads. Returns { url } pointing at the served file. Requires an
 * authenticated admin session.
 */
export async function POST(request: Request) {
  try {
    await requireAdminSession(request);

    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: { message: "No file provided." } },
        { status: 400 },
      );
    }

    if (!ALLOWED.has(file.type)) {
      return NextResponse.json(
        { error: { message: "Unsupported file type." } },
        { status: 415 },
      );
    }

    const isVideo = file.type.startsWith("video/");
    const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (file.size > maxBytes) {
      return NextResponse.json(
        {
          error: {
            message: isVideo
              ? "File too large (max 18 MB for videos)."
              : "File too large (max 2.5 MB for images).",
          },
        },
        { status: 413 },
      );
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeExts = [
      "jpg", "jpeg", "png", "webp", "avif",
      "mp4", "webm", "mov", "mkv",
    ];
    const safeExt = safeExts.includes(ext) ? ext : isVideo ? "mp4" : "jpg";
    const filename = `${randomUUID()}.${safeExt}`;

    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

    // Vercel / serverless: store in Vercel Blob when a token is configured.
    if (blobToken) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const response = await fetch(
        `https://blob.vercel-storage.com/${filename}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${blobToken}`,
            "Content-Type": file.type,
            "x-content-type": file.type,
          },
          body: buffer,
        },
      );

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        return NextResponse.json(
          { error: { message: `Blob upload failed: ${text || response.status}` } },
          { status: 502 },
        );
      }

      const data = (await response.json()) as { url?: string };
      if (!data.url) {
        return NextResponse.json(
          { error: { message: "Blob upload returned no URL." } },
          { status: 502 },
        );
      }

      return NextResponse.json({ url: data.url });
    }

    // Local dev / Docker: store on disk.
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, filename), buffer);

    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (error) {
    return handleApiError(error);
  }
}
