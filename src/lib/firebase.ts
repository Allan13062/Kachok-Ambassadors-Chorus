import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, setLogLevel } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
setLogLevel('silent');
// @ts-ignore
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); // In case it throws if undefined 
export const auth = getAuth(app);
export const storage = getStorage(app);
