const CLOUDINARY_CLOUD_NAME = "epd4yag0";
const CLOUDINARY_UPLOAD_PRESET = "kachamba_unsigned";

/**
 * Uploads a base64 data URL to Cloudinary and returns a permanent public URL.
 * Supports both images and videos via the 'auto' resource type.
 *
 * IMPORTANT: The Cloudinary upload preset must be set to "Unsigned" in the
 * Cloudinary dashboard (Settings → Upload → Upload Presets → kachamba_unsigned).
 */
export async function uploadToFirebaseStorage(
  base64DataUrl: string,
  filename: string
): Promise<string> {
  const response = await fetch(base64DataUrl);
  const blob = await response.blob();

  const formData = new FormData();
  formData.append("file", blob, filename);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Cloudinary upload failed (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.secure_url as string;
}
