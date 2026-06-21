import { collection, doc, getDocs, getDoc, setDoc, deleteDoc } from 'firebase/firestore/lite';
import { firestore } from './src/lib/firebaseLite.ts';

export async function getLocalDb() {
  const result: any = { 
    passcode: "SDA2026", 
    activities: [], 
    itinerary: [], 
    leaders: [], 
    inquiries: [], 
    music: {}, 
    users: [], 
    subscribers: [], 
    broadcasts: [], 
    memberSpotlights: [],
    mpesa: {} 
  };

  try {
    const fetchCol = async (colName: string) => {
      const snapshot = await getDocs(collection(firestore, colName));
      return snapshot.docs.map(d => ({id: d.id, ...d.data()}));
    };

    result.activities = await fetchCol('activities');
    result.itinerary = await fetchCol('itinerary');
    result.leaders = await fetchCol('leaders');
    result.inquiries = await fetchCol('inquiries');
    result.users = await fetchCol('users');
    result.subscribers = await fetchCol('subscribers');
    result.broadcasts = await fetchCol('broadcasts');
    result.memberSpotlights = await fetchCol('memberSpotlights');

    try {
      const musicDoc = await getDoc(doc(firestore, "configs", "music"));
      if (musicDoc.exists()) {
        result.music = musicDoc.data();
      }
    } catch(e) {}

    try {
      const adminDoc = await getDoc(doc(firestore, "configs", "admin"));
      if (adminDoc.exists()) {
        result.passcode = adminDoc.data().passcode || result.passcode;
      }
    } catch(e) {}

    try {
      const mpesaDoc = await getDoc(doc(firestore, "configs", "mpesa"));
      if (mpesaDoc.exists()) {
        result.mpesa = mpesaDoc.data() || {};
      }
    } catch(e) {}

  } catch (e) {
    console.warn("[Firestore getLocalDb] Error fetching collections:", e);
  }

  return result;
}

export async function saveLocalDb(data: any) {
  // This function is still called, but we don't want to overwrite all collections from here if possible.
  // Instead, we should modify syncLocalFile in server.ts to update individual documents.
  // As a fallback, we can try to save the entire state in the monolithic doc, but ideally we don't.
  try {
    await setDoc(doc(firestore, "kachamba", "state_backup"), { updated: new Date().toISOString() });
  } catch(e) {
    console.error("[Firestore saveLocalDb] Error saving state:", e);
  }
}

export async function insertItem(colName: string, id: string, data: any) {
  try {
    await setDoc(doc(firestore, colName, id), data);
  } catch(e) { console.error(`Error inserting into ${colName}:`, e); }
}

export async function deleteItem(colName: string, id: string) {
  try {
    await deleteDoc(doc(firestore, colName, id));
  } catch(e) { console.error(`Error deleting from ${colName}:`, e); }
}
