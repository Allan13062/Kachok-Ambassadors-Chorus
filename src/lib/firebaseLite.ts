/**
 * The single media upload path for the whole app. Every image/video (activities, itinerary,
 * leaders, gallery, music cover, posters, etc.) goes through this function, which:
 *   1. Asks the server for a short-lived signed Cloudinary upload (POST /api/cloudinary-signature -
 *      requires admin auth, so the Cloudinary API secret never reaches the browser).
 *   2. Uploads the file directly from the browser to Cloudinary using that signature.
 *
 * There is no server-side fallback anymore (the old /api/upload base64-into-Postgres/Firestore
 * route has been removed) - all media lives in Cloudinary now. If this throws, surface the error
 * to the admin rather than silently degrading to something that won't persist.
 */
export async function uploadMedia(
  base64Data: string,
  adminToken: string | null,
  filename: string
): Promise<string> {
  const signatureRes = await fetch("/api/cloudinary-signature", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-passcode": adminToken || "",
      "x-admin-token": adminToken || "",
    },
    body: JSON.stringify({ folder: "kachamba_sync" }),
  });

  if (!signatureRes.ok) {
    const errText = await signatureRes.text();
    let errMsg = "Could not get a Cloudinary upload signature from the server.";
    try {
      errMsg = JSON.parse(errText).error || errMsg;
    } catch {
      if (errText) errMsg = errText;
    }
    throw new Error(errMsg);
  }

  const sigData = await signatureRes.json();
  if (!sigData.success || !sigData.signature) {
    throw new Error(sigData.error || "Server did not return a valid Cloudinary signature.");
  }

  const formData = new FormData();
  formData.append("file", base64Data);
  formData.append("api_key", sigData.apiKey);
  formData.append("timestamp", sigData.timestamp.toString());
  formData.append("signature", sigData.signature);
  if (sigData.folder) {
    formData.append("folder", sigData.folder);
  }

  const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${sigData.cloudName}/auto/upload`, {
    method: "POST",
    body: formData,
  });

  if (!uploadResponse.ok) {
    const errText = await uploadResponse.text();
    throw new Error(`Cloudinary upload failed: ${errText || uploadResponse.statusText}`);
  }

  const uploadResult = await uploadResponse.json();
  if (!uploadResult.secure_url) {
    throw new Error("Cloudinary did not return a file URL.");
  }

  return uploadResult.secure_url;
}
