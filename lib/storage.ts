import { promises as fs } from "node:fs";
import path from "node:path";

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);
const MAX_BYTES = 10 * 1024 * 1024;

export type StoreResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

// Stores a screenshot and returns its URL. Uses Vercel Blob in production
// (when BLOB_READ_WRITE_TOKEN is set), falls back to public/uploads/ for
// local dev.
export async function storeScreenshot(
  file: File,
  prefix: string
): Promise<StoreResult> {
  if (file.size === 0) return { ok: false, error: "No file selected" };
  if (!ALLOWED_MIME.has(file.type)) {
    return { ok: false, error: "Only PNG, JPEG, WebP, or GIF" };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "File too large (max 10MB)" };
  }

  const ext =
    file.type.split("/")[1] === "jpeg"
      ? "jpg"
      : file.type.split("/")[1] ?? "png";
  const rand = Math.random().toString(36).slice(2, 8);
  const filename = `${prefix}-${Date.now()}-${rand}.${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const result = await put(`screenshots/${filename}`, file, {
      access: "public",
      addRandomSuffix: false,
    });
    return { ok: true, url: result.url };
  }

  const dir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(dir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(dir, filename), buffer);
  return { ok: true, url: `/uploads/${filename}` };
}
