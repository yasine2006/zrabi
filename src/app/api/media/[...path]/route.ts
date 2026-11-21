import { get } from "@vercel/blob";
import { NextResponse } from "next/server";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import {
  isAllowedMediaPath,
  localMediaFilename,
  mimeFromMediaPath,
} from "@/lib/blob-media";

export const dynamic = "force-dynamic";

/**
 * GET /api/media/catalog/<id>.<ext>
 *
 * Public site route, private Blob underneath: the read-write token stays on
 * the server. Range/206 is forwarded so HTML5 video can seek on desktop and
 * mobile, and ETags let returning visitors use their browser cache.
 */
export async function GET(
  request: Request,
  { params }: { params: { path: string[] } },
) {
  const pathname = params.path.join("/");
  if (!isAllowedMediaPath(pathname)) {
    return new NextResponse("Bad request", { status: 400 });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    return serveLocalFile(request, pathname);
  }

  const rangeHeader = request.headers.get("range");
  const ifNoneMatch = request.headers.get("if-none-match");

  let result;
  try {
    result = await get(pathname, {
      access: "private",
      token,
      ...(ifNoneMatch ? { ifNoneMatch } : {}),
      ...(rangeHeader ? { headers: { Range: rangeHeader } } : {}),
    });
  } catch {
    return new NextResponse("Media service unavailable", { status: 502 });
  }

  if (!result) {
    return new NextResponse("Not found", { status: 404 });
  }

  const etag = result.blob.etag || result.headers.get("etag") || undefined;
  const baseHeaders: Record<string, string> = {
    "Content-Type":
      result.blob.contentType && result.blob.contentType !== "application/octet-stream"
        ? result.blob.contentType
        : mimeFromMediaPath(pathname),
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
    Vary: "Range",
    "X-Content-Type-Options": "nosniff",
    ...(etag ? { ETag: etag } : {}),
  };

  if (result.statusCode === 304) {
    return new NextResponse(null, { status: 304, headers: baseHeaders });
  }

  // The SDK reports 200 even when the upstream answered 206, so the raw
  // Content-Range header is the source of truth for partial responses.
  const upstreamRange = result.headers.get("content-range");
  const totalFromRange = upstreamRange
    ? Number(upstreamRange.split("/").pop())
    : NaN;
  const totalSize =
    Number.isFinite(totalFromRange) && totalFromRange > 0
      ? totalFromRange
      : result.blob.size;

  if (upstreamRange) {
    const headers = new Headers(baseHeaders);
    headers.set("Content-Range", upstreamRange);
    const contentLength = result.headers.get("content-length");
    if (contentLength) {
      headers.set("Content-Length", contentLength);
    } else {
      const match = /bytes (\d+)-(\d+)\//.exec(upstreamRange);
      if (match) {
        headers.set(
          "Content-Length",
          String(Number(match[2]) - Number(match[1]) + 1),
        );
      }
    }
    return new NextResponse(result.stream as unknown as BodyInit, {
      status: 206,
      headers,
    });
  }

  if (rangeHeader && totalSize > 0) {
    const range = parseByteRange(rangeHeader, totalSize);
    if (!range) {
      return new NextResponse("Range not satisfiable", {
        status: 416,
        headers: {
          "Content-Range": `bytes */${totalSize}`,
          "Accept-Ranges": "bytes",
        },
      });
    }

    // Defensive fallback: if a CDN stripped the Range header upstream, slice
    // the full stream ourselves so seeking still works.
    const headers = new Headers(baseHeaders);
    headers.set(
      "Content-Range",
      `bytes ${range.start}-${range.end}/${totalSize}`,
    );
    headers.set("Content-Length", String(range.end - range.start + 1));

    return new NextResponse(
      sliceStream(result.stream, range.start, range.end) as unknown as BodyInit,
      { status: 206, headers },
    );
  }

  const headers = new Headers(baseHeaders);
  if (totalSize > 0) headers.set("Content-Length", String(totalSize));

  return new NextResponse(result.stream as unknown as BodyInit, {
    status: 200,
    headers,
  });
}

function parseByteRange(
  header: string,
  size: number,
): { start: number; end: number } | null {
  if (size <= 0) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match || (!match[1] && !match[2])) return null;

  let start: number;
  let end: number;

  if (!match[1]) {
    const suffix = Number(match[2]);
    if (!Number.isFinite(suffix) || suffix <= 0) return null;
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Number(match[2]) : size - 1;
  }

  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    start > end ||
    start >= size
  ) {
    return null;
  }

  return { start, end: Math.min(end, size - 1) };
}

function sliceStream(
  stream: ReadableStream<Uint8Array>,
  start: number,
  end: number,
): ReadableStream<Uint8Array> {
  const reader = stream.getReader();
  let position = 0;

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      while (position <= end) {
        const { done, value } = await reader.read();
        if (done) break;

        const from = Math.max(0, start - position);
        const to = Math.min(value.length, end - position + 1);
        if (to > from) controller.enqueue(value.subarray(from, to));

        position += value.length;
      }

      controller.close();
      await reader.cancel().catch(() => undefined);
    },
    cancel(reason) {
      return reader.cancel(reason);
    },
  });
}

/** Local dev: public/uploads is still the source of truth without a token. */
async function serveLocalFile(request: Request, pathname: string) {
  const filename = localMediaFilename(pathname);
  if (filename.includes("..") || filename.startsWith("/")) {
    return new NextResponse("Bad request", { status: 400 });
  }

  const filePath = path.join(process.cwd(), "public", "uploads", filename);
  let size = 0;
  let mtimeMs = 0;
  try {
    const fileStat = await stat(filePath);
    size = fileStat.size;
    mtimeMs = fileStat.mtimeMs;
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }

  const contentType = mimeFromMediaPath(pathname);
  const etag = `"${size}-${Math.floor(mtimeMs)}"`;
  const baseHeaders: Record<string, string> = {
    "Content-Type": contentType,
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
    Vary: "Range",
    ETag: etag,
    "X-Content-Type-Options": "nosniff",
  };

  if (request.headers.get("if-none-match") === etag) {
    return new NextResponse(null, { status: 304, headers: baseHeaders });
  }

  const rangeHeader = request.headers.get("range");
  if (rangeHeader) {
    const range = parseByteRange(rangeHeader, size);
    if (!range) {
      return new NextResponse("Range not satisfiable", {
        status: 416,
        headers: {
          "Content-Range": `bytes */${size}`,
          "Accept-Ranges": "bytes",
        },
      });
    }

    const buffer = await readFile(filePath);
    const chunk = buffer.subarray(range.start, range.end + 1);
    return new NextResponse(chunk, {
      status: 206,
      headers: {
        ...baseHeaders,
        "Content-Length": String(chunk.length),
        "Content-Range": `bytes ${range.start}-${range.end}/${size}`,
      },
    });
  }

  const buffer = await readFile(filePath);
  return new NextResponse(buffer, {
    status: 200,
    headers: { ...baseHeaders, "Content-Length": String(size) },
  });
}
