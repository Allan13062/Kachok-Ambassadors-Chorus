import { doc, getDoc, setDoc } from 'firebase/firestore/lite';
import { firestore } from './src/lib/firebaseLite.ts';

export async function getLocalDb() {
  try {
    const d = await getDoc(doc(firestore, "kachamba", "state"));
    if (d.exists()) {
      return d.data();
    }
  } catch (e) {
    console.warn("[Firestore getLocalDb] Error fetching state:", e);
  }
  return { 
    passcode: "SDA2026", 
    activities: [], 
    itinerary: [], 
    leaders: [], 
    inquiries: [], 
    music: {}, 
    users: [], 
    subscribers: [], 
    broadcasts: [], 
    memberSpotlights: [] 
  };
}

export async function saveLocalDb(data: any) {
  try {
    await setDoc(doc(firestore, "kachamba", "state"), data);
  } catch(e) {
    console.error("[Firestore saveLocalDb] Error saving state:", e);
  }
}
