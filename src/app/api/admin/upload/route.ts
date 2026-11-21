import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { requireAdminSession } from "@/lib/admin/auth";
import { ApiError, handleApiError } from "@/lib/api/errors";
import {
  allowedTypesForMediaPath,
  createMediaPathname,
  isAllowedMediaPath,
  isVideoMediaPath,
  localMediaFilename,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  maxBytesForMediaPath,
  mediaPublicUrl,
  mimeFromMediaPath,
} from "@/lib/blob-media";

export const dynamic = "force-dynamic";

function blobToken(): string | undefined {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  return token && token.trim() ? token.trim() : undefined;
}

/**
 * GET /api/admin/upload
 *
 * Tells the admin UI whether files should be sent directly to Vercel Blob
 * (client upload, no 4.5 MB serverless body limit) or to the local disk.
 */
export async function GET(request: Request) {
  try {
    await requireAdminSession(request);
    return NextResponse.json({ mode: blobToken() ? "blob" : "local" });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/admin/upload
 *
 * Two shapes are accepted, both admin-only:
 *  - JSON `{ type: "blob.generate-client-token", ... }` from @vercel/blob/client
 *    (browser -> Blob, used on Vercel; handles videos larger than 4.5 MB).
 *  - multipart `file` (local dev and server-side fallback).
 *
 * Private stores require `access: "private"` on every operation. The raw Blob
 * URL is never returned to the client; media is served via `/api/media/...`.
 */
export async function POST(request: Request) {
  try {
    await requireAdminSession(request);

    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      return await handleClientUpload(request);
    }

    return await handleMultipartUpload(request);
  } catch (error) {
    return handleApiError(error);
  }
}

async function handleClientUpload(request: Request) {
  const token = blobToken();
  if (!token) {
    throw new ApiError(
      400,
      "Client uploads are only available when a Blob token is configured.",
      "UPLOAD_MODE_UNAVAILABLE",
    );
  }

  const body = (await request.json()) as HandleUploadBody;
  const result = await handleUpload({
    body,
    request,
    token,
    onBeforeGenerateToken: async (pathname) => {
      if (!isAllowedMediaPath(pathname)) {
        throw new ApiError(
          400,
          "Invalid media path.",
          "INVALID_UPLOAD_PATH",
        );
      }

      return {
        allowedContentTypes: [...allowedTypesForMediaPath(pathname)],
        maximumSizeInBytes: maxBytesForMediaPath(pathname),
        addRandomSuffix: false,
        allowOverwrite: false,
        cacheControlMaxAge: 31536000,
      };
    },
  });

  return NextResponse.json(result);
}

async function handleMultipartUpload(request: Request) {
  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    throw new ApiError(400, "No file provided.", "NO_FILE");
  }

  const pathname = createMediaPathname(file);
  if (!pathname) {
    throw new ApiError(415, "Unsupported file type.", "UNSUPPORTED_MEDIA_TYPE");
  }

  const isVideo = isVideoMediaPath(pathname);
  const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > maxBytes) {
    throw new ApiError(
      413,
      isVideo
        ? "File too large (max 18 MB for videos)."
        : "File too large (max 2.5 MB for images).",
      "FILE_TOO_LARGE",
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const contentType = file.type || mimeFromMediaPath(pathname);
  const token = blobToken();

  if (token) {
    // Server-side fallback (small files only — the admin UI uses client
    // uploads on Vercel so 15-30s videos are not blocked by the body limit).
    const blob = await put(pathname, buffer, {
      access: "private",
      contentType,
      token,
      addRandomSuffix: false,
      allowOverwrite: false,
    });

    return NextResponse.json({
      url: mediaPublicUrl(blob.pathname),
      pathname: blob.pathname,
    });
  }

  // Local dev / Docker: keep serving from public/uploads.
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  const filename = localMediaFilename(pathname);
  await writeFile(path.join(uploadDir, filename), buffer);

  return NextResponse.json({
    url: `/uploads/${filename}`,
    pathname: filename,
  });
}
