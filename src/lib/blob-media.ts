/**
 * Shared helpers for catalog media (images + showcase videos).
 *
 * On Vercel the Blob store is PRIVATE: every write and read must explicitly
 * use `access: "private"`. Blobs are never exposed through their raw Blob URL;
 * the browser always goes through `/api/media/[...path]`, which authenticates
 * with the server token and supports HTTP Range requests for video seeking.
 *
 * In local dev (no `BLOB_READ_WRITE_TOKEN`) the exact same URLs still work:
 * files are written to `public/uploads` and served by `/api/uploads/[...path]`.
 */

export const MEDIA_PREFIX = "catalog/";

export const MAX_IMAGE_BYTES = 2.5 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 18 * 1024 * 1024;

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "video/x-matroska": "mkv",
};

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  mkv: "video/x-matroska",
};

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

export const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-matroska",
] as const;

const ALLOWED_EXTS = new Set(Object.keys(MIME_BY_EXT));
const VIDEO_EXTS = new Set(["mp4", "webm", "mov", "mkv"]);

/** Only narrowly-shaped paths under catalog/ are accepted (no traversal). */
const SAFE_MEDIA_PATH =
  /^catalog\/[A-Za-z0-9_-]{6,80}\.(jpg|jpeg|png|webp|avif|mp4|webm|mov|mkv)$/i;

export function isAllowedMediaType(type: string): boolean {
  return (
    (ALLOWED_IMAGE_TYPES as readonly string[]).includes(type) ||
    (ALLOWED_VIDEO_TYPES as readonly string[]).includes(type)
  );
}

export function isVideoMediaType(type: string): boolean {
  return type.startsWith("video/");
}

export function isAllowedMediaPath(pathname: string): boolean {
  return SAFE_MEDIA_PATH.test(pathname);
}

export function isVideoMediaPath(pathname: string): boolean {
  return VIDEO_EXTS.has(pathname.split(".").pop()?.toLowerCase() ?? "");
}

export function mimeFromMediaPath(pathname: string): string {
  const ext = pathname.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXT[ext] ?? "application/octet-stream";
}

export function maxBytesForMediaPath(pathname: string): number {
  return isVideoMediaPath(pathname) ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
}

export function allowedTypesForMediaPath(pathname: string): readonly string[] {
  return isVideoMediaPath(pathname) ? ALLOWED_VIDEO_TYPES : ALLOWED_IMAGE_TYPES;
}

/**
 * Build the opaque, collision-free pathname used as the Blob key.
 * Returns null for unsupported files so callers can answer 415.
 */
export function createMediaPathname(file: { name: string; type: string }): string | null {
  const mime = file.type.toLowerCase();
  let ext = EXT_BY_MIME[mime];

  if (!ext) {
    // Some phones send an empty MIME type for .mov / .mkv files.
    const fromName = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (ALLOWED_EXTS.has(fromName)) ext = fromName;
  }

  if (!ext) return null;

  const id =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

  return `${MEDIA_PREFIX}${id}.${ext}`;
}

/** Public, same-origin URL stored in the database and rendered by the site. */
export function mediaPublicUrl(pathname: string): string {
  return `/api/media/${pathname}`;
}

/** Local-dev counterpart (disk-backed) for the same pathname. */
export function localMediaFilename(pathname: string): string {
  return pathname.startsWith(MEDIA_PREFIX)
    ? pathname.slice(MEDIA_PREFIX.length)
    : pathname.split("/").pop() ?? "media";
}
