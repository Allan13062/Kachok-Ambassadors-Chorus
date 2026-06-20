import { collection, getDocs } from 'firebase/firestore/lite';
import { firestore } from './src/lib/firebaseLite.ts';

async function test() {
  const collections = ['itinerary', 'leaders', 'inquiries', 'users', 'subscribers', 'broadcasts', 'memberSpotlights'];
  for (const c of collections) {
    try {
      console.log(`Trying ${c}...`);
      const snap = await getDocs(collection(firestore, c));
      console.log(`${c} snap size:`, snap.size);
    } catch(e) { console.error(`${c} error:`, e.message); }
  }
}
test();
