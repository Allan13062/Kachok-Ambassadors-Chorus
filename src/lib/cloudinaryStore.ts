// Stores site data in Cloudinary, as "raw" files (plain JSON text).
//   kachamba/site-state.json   - all site content, settings, sessions and payment records
//   kachamba/files/<id>.json   - uploaded files kept as a fallback
//
// Reads for public pages use the Cloudinary CDN (fast, may lag a few seconds after a save).
// Saves read the latest version through the Cloudinary Admin API first, so an
// older cached copy can never overwrite newer changes.

import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

export const STATE_FILE = "kachamba/site-state.json";
const FILE_FOLDER = "kachamba/files/";

function cloudName(): string {
  const name = cloudinary.config().cloud_name;
  if (!name) {
    throw new Error("Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in Vercel.");
  }
  return String(name);
}

function rawUrl(publicId: string, version?: number): string {
  const versionPart = version ? `v${version}/` : "";
  return `https://res.cloudinary.com/${cloudName()}/raw/upload/${versionPart}${publicId}`;
}

// Fast read from the CDN (public pages)
export async function readRawCdn(publicId: string): Promise<string | null> {
  const response = await fetch(`${rawUrl(publicId)}?nocache=${Date.now()}`, { cache: "no-store" });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Could not read ${publicId} from Cloudinary (HTTP ${response.status}).`);
  return response.text();
}

// Latest version (saves). Falls back to the CDN if the Admin API is unavailable.
export async function readRawLatest(publicId: string): Promise<string | null> {
  try {
    const info: any = await cloudinary.api.resource(publicId, { resource_type: "raw" });
    const response = await fetch(rawUrl(publicId, info.version), { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.text();
  } catch (err: any) {
    if (err?.http_code === 404 || err?.error?.http_code === 404) return null;
    console.warn(`[Storage] Admin read unavailable for ${publicId}, using CDN:`, err?.message || err);
    return readRawCdn(publicId);
  }
}

export async function writeRaw(publicId: string, text: string): Promise<void> {
  cloudName(); // fails clearly if Cloudinary is not configured
  await new Promise<void>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        public_id: publicId,
        overwrite: true,
        invalidate: true,
        use_filename: false,
        unique_filename: false,
      },
      (error, result) => (error || !result ? reject(error || new Error("Upload returned no result")) : resolve())
    );
    Readable.from(Buffer.from(text, "utf8")).pipe(stream);
  });
}

export function fileId(id: string): string {
  return `${FILE_FOLDER}${id.replace(/[^A-Za-z0-9_-]/g, "_")}.json`;
}
