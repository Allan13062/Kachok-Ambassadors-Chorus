import { collection, getDocs, doc, setDoc } from 'firebase/firestore/lite';
import { firestore } from './src/lib/firebaseLite.ts';

async function test() {
  try {
    console.log("Trying kachamba...");
    const snap1 = await getDocs(collection(firestore, "kachamba"));
    console.log("kachamba snap size:", snap1.size);
  } catch(e) { console.error("Kachamba error:", e.message); }

  try {
    console.log("Trying configs...");
    const snap2 = await getDocs(collection(firestore, "configs"));
    console.log("configs snap size:", snap2.size);
  } catch(e) { console.error("Configs error:", e.message); }
  
  try {
    console.log("Trying activities...");
    const snap3 = await getDocs(collection(firestore, "activities"));
    console.log("activities snap size:", snap3.size);
  } catch(e) { console.error("Activities error:", e.message); }
}

test();
