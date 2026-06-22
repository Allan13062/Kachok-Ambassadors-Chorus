import { initializeApp } from 'firebase/app';
import { getFirestore, setLogLevel } from 'firebase/firestore/lite';
import fs from 'fs';
import path from 'path';

let firebaseConfig: any = {};
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
if (fs.existsSync(configPath)) {
  firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

const app = initializeApp(firebaseConfig);
setLogLevel('silent');
export const firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

