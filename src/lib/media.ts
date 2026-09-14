import "server-only";
import path from "node:path";
import { randomUUID } from "node:crypto";

// Shared validation for the generic Media Library upload route — same
// magic-number-sniffing approach already used by the Hero background-image
// upload (src/app/api/admin/hero/background-image/route.ts), factored out
// here since the Media Library is a second, independent upload surface
// rather than a replacement for that one.
export const MEDIA_MAX_BYTES = 8 * 1024 * 1024; // 8MB
export const MEDIA_ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};
export const MEDIA_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "media");
export const MEDIA_URL_PREFIX = "/uploads/media/";

export interface MediaValidationError {
  error: string;
}

export function extensionForMimeType(mimeType: string): string | null {
  return MEDIA_ALLOWED_TYPES[mimeType] ?? null;
}

/** Sniffs the actual file bytes against the claimed extension rather than
 *  trusting the client-supplied Content-Type/filename alone. */
export function bytesMatchExtension(bytes: Buffer, ext: string): boolean {
  const isPng = bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const isJpg = bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isWebp =
    bytes.length > 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50;
  const isGif = bytes.length > 5 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38;
  return (ext === "png" && isPng) || (ext === "jpg" && isJpg) || (ext === "webp" && isWebp) || (ext === "gif" && isGif);
}

/** Never derived from the client-supplied filename — always a fresh
 *  generated name, so there is no path-traversal surface (no user input
 *  ever reaches a filesystem path) and no collision between uploads. */
export function generateMediaFileName(ext: string): string {
  return `media-${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
}

export function validateUploadedFile(file: File, bytes: Buffer): MediaValidationError | null {
  if (file.size === 0) return { error: "File is empty." };
  if (file.size > MEDIA_MAX_BYTES) return { error: "File is too large. Maximum size is 8MB." };
  const ext = extensionForMimeType(file.type);
  if (!ext) return { error: "Unsupported file type. Use PNG, JPG, WebP, or GIF." };
  if (!bytesMatchExtension(bytes, ext)) return { error: "File content does not match its declared type." };
  return null;
}
