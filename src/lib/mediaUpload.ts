/**
 * Media upload utility that attempts direct client-side upload to Cloudinary (bypassing Vercel's 4.5MB payload limit)
 * and falls back to standard server-side /api/upload if direct upload is unavailable or fails.
 */
export async function uploadMedia(
  base64Data: string,
  adminPasscode: string | null,
  filename: string
): Promise<string> {
  try {
    // 1. Attempt to get a secure signed signature from the server for direct Cloudinary upload
    const signatureRes = await fetch("/api/cloudinary-signature", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-passcode": adminPasscode || "",
      },
      body: JSON.stringify({ folder: "kachamba_sync" }),
    });

    if (signatureRes.ok) {
      const sigData = await signatureRes.json();
      if (sigData.success && sigData.signature) {
        console.log("[Direct Upload] Cloudinary credentials found. Uploading directly from client to Cloudinary...");
        
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

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          if (uploadResult.secure_url) {
            console.log("[Direct Upload] Successfully uploaded directly to Cloudinary:", uploadResult.secure_url);
            return uploadResult.secure_url;
          }
        } else {
          const errText = await uploadResponse.text();
          console.warn("[Direct Upload] Cloudinary API direct upload failed. Falling back to server upload.", errText);
        }
      }
    } else {
      console.warn("[Direct Upload] Could not generate Cloudinary signature. Falling back to server upload.");
    }
  } catch (err: any) {
    console.warn("[Direct Upload] Error during Cloudinary direct upload path. Falling back to server upload:", err.message);
  }

  // 2. Fallback to server-side /api/upload endpoint
  console.log("[Direct Upload] Uploading via server fallback `/api/upload`...");
  const response = await fetch("/api/upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-passcode": adminPasscode || "",
    },
    body: JSON.stringify({
      filename,
      base64: base64Data,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    let errMsg = "Upload failed";
    try {
      const parsed = JSON.parse(errText);
      errMsg = parsed.error || errMsg;
    } catch {
      errMsg = errText || errMsg;
    }
    throw new Error(errMsg);
  }

  const result = await response.json();
  if (!result.success || !result.url) {
    throw new Error(result.error || "Upload failed without a file URL");
  }

  return result.url;
}
