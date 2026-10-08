import {
  ref,
  uploadString,
  getDownloadURL,
  type UploadMetadata,
} from "firebase/storage";
import { storage } from "./firebase";

/**
 * Uploads a Base64 data URL to Firebase Storage
 * and returns the publicly accessible download URL.
 *
 * @param dataUrl - Base64 data URL, e.g. data:image/jpeg;base64,...
 * @param filename - Desired filename/path in Firebase Storage
 */
export async function uploadToFirebaseStorage(
  dataUrl: string,
  filename: string
): Promise<string> {
  if (!dataUrl) {
    throw new Error("No file data was provided for upload.");
  }

  if (!dataUrl.startsWith("data:")) {
    throw new Error("The upload data must be a valid Base64 data URL.");
  }

  /*
   * Keep uploaded files inside a controlled application directory.
   * Replace unsafe characters so filenames cannot create unexpected paths.
   */
  const safeFilename = filename
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_");

  const timestamp = Date.now();
  const storagePath = `kachok-ambassadors/${timestamp}-${safeFilename}`;

  const storageRef = ref(storage, storagePath);

  /*
   * Extract MIME type from the Base64 data URL.
   *
   * Example:
   * data:image/jpeg;base64,...
   *              ^^^^^^^^^^
   */
  const mimeMatch = dataUrl.match(/^data:([^;]+);base64,/i);
  const contentType = mimeMatch?.[1] || "application/octet-stream";

  const metadata: UploadMetadata = {
    contentType,
    cacheControl: "public,max-age=31536000",
  };

  await uploadString(
    storageRef,
    dataUrl,
    "data_url",
    metadata
  );

  const downloadUrl = await getDownloadURL(storageRef);

  return downloadUrl;
}
