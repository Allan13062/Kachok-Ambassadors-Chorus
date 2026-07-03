import { storage } from './firebase';
  import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

  /**
   * Uploads a base64 data URL to Firebase Storage and returns a permanent public download URL.
   * Files are stored under uploads/<timestamp>-<random>.<ext>
   */
  export async function uploadToFirebaseStorage(
    base64DataUrl: string,
    filename: string
  ): Promise<string> {
    const response = await fetch(base64DataUrl);
    const blob = await response.blob();

    const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const ext = filename.split('.').pop()?.split('?')[0] || 'jpg';
    const storagePath = `uploads/${fileId}.${ext}`;

    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, blob, { contentType: blob.type });

    return await getDownloadURL(storageRef);
  }
  