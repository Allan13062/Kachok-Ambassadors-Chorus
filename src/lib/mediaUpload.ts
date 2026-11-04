/**
 * The single media upload path for the whole app. Every image/video goes through this function:
 *   1. Asks the server for a short-lived signed Cloudinary upload (POST /api/cloudinary-signature -
 *      requires admin sign-in, so the Cloudinary API secret never reaches the browser).
 *   2. Uploads the file directly from the browser to Cloudinary using that signature.
 *
 * Every network step has a time limit so the "Uploading..." spinner can never hang forever:
 * if something is wrong, this throws a clear error message instead.
 */

async function fetchWithTimeout(url: string, options: RequestInit, ms: number, what: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw new Error(`${what} took longer than ${Math.round(ms / 1000)} seconds. Check your internet connection and try again. If the site was idle, wait a minute for the server to wake up.`);
    }
    throw new Error(`${what} failed: ${err?.message || "network error"}`);
  } finally {
    clearTimeout(timer);
  }
}

export async function uploadMedia(
  base64Data: string,
  adminToken: string | null,
  filename: string
): Promise<string> {
  const signatureRes = await fetchWithTimeout(
    "/api/cloudinary-signature",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-passcode": adminToken || "",
        "x-admin-token": adminToken || "",
      },
      body: JSON.stringify({ folder: "kachamba_sync" }),
    },
    40000,
    "Asking the server for upload permission"
  );

  if (!signatureRes.ok) {
    const errText = await signatureRes.text();
    let errMsg = "Could not get a Cloudinary upload signature from the server.";
    try {
      errMsg = JSON.parse(errText).error || errMsg;
    } catch {
      if (errText) errMsg = errText.slice(0, 200);
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

  const uploadResponse = await fetchWithTimeout(
    `https://api.cloudinary.com/v1_1/${sigData.cloudName}/auto/upload`,
    { method: "POST", body: formData },
    120000,
    "Sending the file to Cloudinary"
  );

  if (!uploadResponse.ok) {
    const errText = await uploadResponse.text();
    throw new Error(`Cloudinary upload failed: ${errText.slice(0, 200) || uploadResponse.statusText}`);
  }

  const uploadResult = await uploadResponse.json();
  if (!uploadResult.secure_url) {
    throw new Error("Cloudinary did not return a file URL.");
  }

  return uploadResult.secure_url;
}
