import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore/lite';
import fs from 'fs';
import path from 'path';

let firebaseConfig: any = {
  projectId: "kachamba-chorus",
  appId: "1:580701086694:web:6e21a96cc0c14aab79ec27",
  apiKey: "AIzaSyCF9fVpu2IpylJhNlbsgRFeBADsOLzuF_w",
  authDomain: "kachamba-chorus.firebaseapp.com",
  firestoreDatabaseId: "(default)",
  storageBucket: "kachamba-chorus.firebasestorage.app",
  messagingSenderId: "580701086694",
  measurementId: "G-VR865RS96R"
};

try {
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch {
  // Use fallback defaults
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const firestore = (firebaseConfig as any).firestoreDatabaseId && (firebaseConfig as any).firestoreDatabaseId !== '(default)'
  ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId)
  : getFirestore(app);

export const db = firestore;
export { app };
export default firestore;
