// Shared media upload helper for images, audio, and video.
//
// WHY THIS FILE EXISTS:
// Vercel serverless functions reject any request body over 4.5MB
// (see https://vercel.com/docs/functions/limitations). The previous
// approach read files into base64 and POSTed them as JSON straight to
// our own /api/upload function, which works locally (no such limit)
// but fails in production for anything beyond a small compressed photo —
// and fails silently for audio/video, which are almost always bigger.
//
// This helper instead asks our server for a short-lived signature
// (a tiny JSON payload, well under any limit), then uploads the actual
// file bytes directly from the browser to Cloudinary. The media never
// passes through our serverless function at all.
//
// IMPORTANT: uploadMedia() throws on failure. Callers must catch that
// and show the error to the admin — never fall back to silently saving
// the raw base64 string as if it were a real URL. That silent fallback
// was the root cause of uploads appearing to save and then vanishing on
// refresh: the UI looked successful, but nothing was actually persisted.

/**
 * Compresses an image data URL client-side before upload. Non-image
 * data URLs (audio/video) are returned unchanged — compression only
 * makes sense for images.
 */
export function compressImage(base64Str: string, maxWidth = 800): Promise<string> {
  return new Promise((resolve) => {
    if (!base64Str.startsWith("data:image/")) {
      resolve(base64Str);
      return;
    }
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ratio = Math.min(maxWidth / img.width, 1);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(base64Str);
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    // If the browser can't decode this image (e.g. HEIC from an iPhone),
    // fall back to the original bytes rather than hanging forever.
    img.onerror = () => resolve(base64Str);
    img.src = base64Str;
  });
}

interface UploadSignature {
  signature: string;
  timestamp: number;
  folder: string;
  apiKey: string;
  cloudName: string;
}

async function getUploadSignature(adminPasscode: string): Promise<UploadSignature> {
  const res = await fetch("/api/upload/signature", {
    method: "POST",
    headers: { "x-admin-passcode": adminPasscode }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({} as any));
    throw new Error(err.error || `Could not get an upload signature (status ${res.status}).`);
  }
  return res.json();
}

/**
 * Uploads a base64 data URL (image, audio, or video) directly to Cloudinary.
 * Returns the final public URL. Throws on any failure — callers are
 * responsible for surfacing that to the user and NOT treating it as success.
 */
export async function uploadMedia(
  base64Str: string,
  adminPasscode: string,
  filename = "upload"
): Promise<string> {
  if (!base64Str || !base64Str.startsWith("data:")) {
    // Not a data URL (e.g. already an https:// URL, or empty) — nothing to upload.
    return base64Str;
  }

  const { signature, timestamp, folder, apiKey, cloudName } = await getUploadSignature(adminPasscode);

  const blob = await (await fetch(base64Str)).blob();
  const form = new FormData();
  form.append("file", blob, filename);
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);
  form.append("folder", folder);

  const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: "POST",
    body: form
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.json().catch(() => ({} as any));
    throw new Error(err.error?.message || `Cloudinary rejected the upload (status ${uploadRes.status}).`);
  }

  const data = await uploadRes.json();
  return data.secure_url as string;
}
