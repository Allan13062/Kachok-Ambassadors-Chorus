import { collection, doc, getDocs, getDoc, setDoc, deleteDoc } from 'firebase/firestore/lite';
import { firestore } from './src/lib/firebaseLite.ts';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), "data", "db.json");

// Helper to read local baseline JSON
function getLocalJson() {
  try {
    if (fs.existsSync(DB_PATH)) {
      return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    }
  } catch (err) {
    console.warn("Error reading local db.json:", err);
  }
  return {
    passcode: process.env.ADMIN_PASSCODE || "CHANGE_ME_SET_ADMIN_PASSCODE_ENV_VAR", 
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
}

// Helper to write local JSON
function saveLocalJson(data: any) {
  try {
    const parentDir = path.dirname(DB_PATH);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error("Error writing to local db.json:", err);
  }
}

// Shared in-memory sessions cache for extreme speed and fallback
const inMemorySessions: Record<string, any> = {};

let cachedDb: any = null;
let lastCacheFetchTime = 0;
const CACHE_TTL_MS = 5000; // 5 seconds TTL

export function invalidateDbCache() {
  cachedDb = null;
  lastCacheFetchTime = 0;
}

export async function getLocalDb() {
  const now = Date.now();
  if (cachedDb && (now - lastCacheFetchTime < CACHE_TTL_MS)) {
    return cachedDb;
  }

  // Load local JSON as the robust base offline data
  const result = getLocalJson();

  try {
    console.log("[Firestore] Fetching fresh synchronized state from Firestore...");
    const fetchCol = async (colName: string) => {
      const snapshot = await getDocs(collection(firestore, colName));
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    };

    const fetchDoc = async (colName: string, docId: string) => {
      const d = await getDoc(doc(firestore, colName, docId));
      return d.exists() ? d.data() : null;
    };

    // Accelerate DB fetch by firing all queries in parallel and waiting up to 5 seconds.
    const promises = [
      fetchCol('activities').then(data => data.length ? (result.activities = data) : null).catch(e => console.warn(`[Firestore] activities: ${e.message}`)),
      fetchCol('itinerary').then(data => data.length ? (result.itinerary = data) : null).catch(e => console.warn(`[Firestore] itinerary: ${e.message}`)),
      fetchCol('leaders').then(data => data.length ? (result.leaders = data) : null).catch(e => console.warn(`[Firestore] leaders: ${e.message}`)),
      fetchCol('inquiries').then(data => data.length ? (result.inquiries = data) : null).catch(e => console.warn(`[Firestore] inquiries: ${e.message}`)),
      fetchCol('users').then(data => data.length ? (result.users = data) : null).catch(e => console.warn(`[Firestore] users: ${e.message}`)),
      fetchCol('subscribers').then(data => data.length ? (result.subscribers = data) : null).catch(e => console.warn(`[Firestore] subscribers: ${e.message}`)),
      fetchCol('broadcasts').then(data => data.length ? (result.broadcasts = data) : null).catch(e => console.warn(`[Firestore] broadcasts: ${e.message}`)),
      fetchCol('memberSpotlights').then(data => data.length ? (result.memberSpotlights = data) : null).catch(e => console.warn(`[Firestore] memberSpotlights: ${e.message}`)),
      fetchDoc('configs', 'music').then(data => data ? (result.music = data) : null).catch(e => console.warn(`[Firestore] music: ${e.message}`)),
      fetchDoc('configs', 'admin').then(data => {
        if (data) {
          result.passcode = data.passcode || result.passcode;
          result.adminEmail = data.adminEmail || result.adminEmail || process.env.ADMIN_EMAIL || "";
          result.recoveryCode = data.recoveryCode || result.recoveryCode;
          result.recoveryCodeExp = data.recoveryCodeExp || result.recoveryCodeExp;
        }
      }).catch(e => console.warn(`[Firestore] admin: ${e.message}`)),
      fetchDoc('configs', 'mpesa').then(data => data ? (result.mpesa = data) : null).catch(e => console.warn(`[Firestore] mpesa: ${e.message}`))
    ];

    await Promise.allSettled(promises);
    
    // Save merged remote state locally so future reads have a fast offline fallback
    saveLocalJson(result);
    cachedDb = result;
    lastCacheFetchTime = now;
    console.log("[Firestore] Database synchronization complete and cached successfully.");
  } catch (e: any) {
    console.warn("[Firestore getLocalDb] Global error during fetch:", e.message || e);
  }

  return result;
}

export async function saveLocalDb(data: any) {
  // Invalidate in-memory database cache
  invalidateDbCache();

  // Save to the local json baseline first
  saveLocalJson(data);

  // Try to write backup to Firestore
  try {
    await setDoc(doc(firestore, "kachamba", "state_backup"), { updated: new Date().toISOString() });
  } catch (e: any) {
    console.warn("[Firestore saveLocalDb] Failed to save state backup:", e.message || e);
  }
}

export async function insertItem(colName: string, id: string, data: any) {
  // Invalidate cache on write
  invalidateDbCache();

  // Write key-value update to the local json db file first
  const dbData = getLocalJson();
  
  if (colName === "configs") {
    if (id === "music") dbData.music = data;
    else if (id === "admin") {
      dbData.passcode = data.passcode || dbData.passcode;
      dbData.adminEmail = data.adminEmail || dbData.adminEmail || process.env.ADMIN_EMAIL || "";
      dbData.recoveryCode = data.recoveryCode || dbData.recoveryCode;
      dbData.recoveryCodeExp = data.recoveryCodeExp || dbData.recoveryCodeExp;
    }
    else if (id === "mpesa") dbData.mpesa = data;
  } else if (colName === "sessions") {
    inMemorySessions[id] = data;
    if (!dbData.sessions) dbData.sessions = [];
    const idx = dbData.sessions.findIndex((s: any) => s.id === id);
    const newSessionItem = { id, ...data };
    if (idx >= 0) {
      dbData.sessions[idx] = newSessionItem;
    } else {
      dbData.sessions.push(newSessionItem);
    }
  } else {
    const list = dbData[colName] || [];
    const idx = list.findIndex((item: any) => item.id === id);
    const newItem = { id, ...data };
    if (idx >= 0) {
      list[idx] = newItem;
    } else {
      list.push(newItem);
    }
    dbData[colName] = list;
  }
  
  saveLocalJson(dbData);

  // Then replicate to remote Firestore
  try {
    await setDoc(doc(firestore, colName, id), data);
  } catch (e: any) {
    console.warn(`[Firestore insert] Error inserting/updating document in ${colName}/${id}:`, e.message || e);
  }
}

export async function deleteItem(colName: string, id: string) {
  // Invalidate cache on write
  invalidateDbCache();

  // Delete from local json file database first
  const dbData = getLocalJson();
  if (dbData[colName]) {
    dbData[colName] = dbData[colName].filter((item: any) => item.id !== id);
    saveLocalJson(dbData);
  }

  // Then delete from remote Firestore
  try {
    await deleteDoc(doc(firestore, colName, id));
  } catch (e: any) {
    console.warn(`[Firestore delete] Error deleting document ${colName}/${id}:`, e.message || e);
  }
}

export async function getSession(token: string) {
  // Try in-memory first for speed
  if (inMemorySessions[token]) {
    return inMemorySessions[token];
  }

  // Check local json DB
  const dbData = getLocalJson();
  const sessions = dbData.sessions || [];
  const found = sessions.find((s: any) => s.id === token);
  if (found) {
    inMemorySessions[token] = found;
    return found;
  }

  // Then query remote Firestore
  try {
    const sessionDoc = await getDoc(doc(firestore, "sessions", token));
    if (sessionDoc.exists()) {
      const data = sessionDoc.data();
      inMemorySessions[token] = data;
      return data;
    }
  } catch (e: any) {
    console.warn("[dbStorage getSession] Error reading remote:", e.message || e);
  }
  return null;
}

export async function deleteSession(token: string) {
  // Invalidate cache on write
  invalidateDbCache();

  try {
    delete inMemorySessions[token];
  } catch (e) {}

  const dbData = getLocalJson();
  if (dbData.sessions) {
    dbData.sessions = dbData.sessions.filter((s: any) => s.id !== token);
    saveLocalJson(dbData);
  }

  try {
    await deleteDoc(doc(firestore, "sessions", token));
  } catch (e: any) {
    console.warn("[dbStorage deleteSession] Error deleting remote:", e.message || e);
  }
}
