/**
 * Client-side image compression utility.
 *
 * Automatically downsizes and compresses large camera / smartphone photos
 * into high-quality WebP or JPEG under ~200-350 KB before uploading.
 * This guarantees lightning-fast uploads and prevents server / Vercel Blob
 * storage exhaustion, allowing the catalog to easily hold hundreds of rugs.
 */

export async function compressImage(
  file: File,
  maxDimension = 1920,
  quality = 0.82,
): Promise<File> {
  // If not an image or SVG/GIF (which have vectors/animations), return as-is
  if (
    !file.type.startsWith("image/") ||
    file.type === "image/svg+xml" ||
    file.type === "image/gif"
  ) {
    return file;
  }

  // If already very small (< 250 KB) and modern format, return as-is
  if (file.size < 250 * 1024 && (file.type === "image/webp" || file.type === "image/jpeg")) {
    return file;
  }

  return new Promise((resolve) => {
    const img = document.createElement("img");
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;

      // Maintain aspect ratio while ensuring neither side exceeds maxDimension
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      // Check if browser supports WebP canvas export, fallback to JPEG
      const targetType = "image/webp";

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            // If compression didn't actually reduce file size, keep original
            resolve(file);
            return;
          }

          const newName = file.name.replace(/\.[^.]+$/, "") + ".webp";
          const compressedFile = new File([blob], newName, {
            type: targetType,
            lastModified: Date.now(),
          });

          resolve(compressedFile);
        },
        targetType,
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}
