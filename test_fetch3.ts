import { doc, getDoc } from 'firebase/firestore/lite';
import { firestore } from './src/lib/firebaseLite.ts';

async function test() {
  try {
    const d = await getDoc(doc(firestore, "configs", "admin"));
    console.log("config admin exists?", d.exists());
  } catch(e) {
    console.error("config admin error", e.message);
  }
}
test();
