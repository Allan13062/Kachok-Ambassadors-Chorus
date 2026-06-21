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

export async function getLocalDb() {
  // Load local JSON as the robust base offline data
  const result = getLocalJson();

  // Try to enrich from remote Firestore with individual try-catch blocks to prevent cascading failures
  try {
    const fetchCol = async (colName: string) => {
      const snapshot = await getDocs(collection(firestore, colName));
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    };

    try {
      const remoteAct = await fetchCol('activities');
      if (remoteAct && remoteAct.length > 0) {
        result.activities = remoteAct;
      }
    } catch (e: any) {
      console.warn(`[Firestore getLocalDb] Could not load 'activities' from remote: ${e.message || e}. Using local seeded data.`);
    }

    try {
      const remoteIti = await fetchCol('itinerary');
      if (remoteIti && remoteIti.length > 0) {
        result.itinerary = remoteIti;
      }
    } catch (e: any) {
      console.warn(`[Firestore getLocalDb] Could not load 'itinerary' from remote: ${e.message || e}. Using local seeded data.`);
    }

    try {
      const remoteLeaders = await fetchCol('leaders');
      if (remoteLeaders && remoteLeaders.length > 0) {
        result.leaders = remoteLeaders;
      }
    } catch (e: any) {
      console.warn(`[Firestore getLocalDb] Could not load 'leaders' from remote: ${e.message || e}. Using local seeded data.`);
    }

    try {
      const remoteInq = await fetchCol('inquiries');
      if (remoteInq && remoteInq.length > 0) {
        result.inquiries = remoteInq;
      }
    } catch (e: any) {
      console.warn(`[Firestore getLocalDb] Could not load 'inquiries' from remote: ${e.message || e}. Using local seeded data.`);
    }

    try {
      const remoteUsers = await fetchCol('users');
      if (remoteUsers && remoteUsers.length > 0) {
        result.users = remoteUsers;
      }
    } catch (e: any) {
      console.warn(`[Firestore getLocalDb] Could not load 'users' from remote: ${e.message || e}. Using local seeded data.`);
    }

    try {
      const remoteSubscribers = await fetchCol('subscribers');
      if (remoteSubscribers && remoteSubscribers.length > 0) {
        result.subscribers = remoteSubscribers;
      }
    } catch (e: any) {
      console.warn(`[Firestore getLocalDb] Could not load 'subscribers' from remote: ${e.message || e}. Using local seeded data.`);
    }

    try {
      const remoteBroadcasts = await fetchCol('broadcasts');
      if (remoteBroadcasts && remoteBroadcasts.length > 0) {
        result.broadcasts = remoteBroadcasts;
      }
    } catch (e: any) {
      console.warn(`[Firestore getLocalDb] Could not load 'broadcasts' from remote: ${e.message || e}. Using local seeded data.`);
    }

    try {
      const remoteMemberSpotlights = await fetchCol('memberSpotlights');
      if (remoteMemberSpotlights && remoteMemberSpotlights.length > 0) {
        result.memberSpotlights = remoteMemberSpotlights;
      }
    } catch (e: any) {
      console.warn(`[Firestore getLocalDb] Could not load 'memberSpotlights' from remote: ${e.message || e}. Using local seeded data.`);
    }

    // Load configurations from remote with try-catch
    try {
      const musicDoc = await getDoc(doc(firestore, "configs", "music"));
      if (musicDoc.exists()) {
        result.music = musicDoc.data();
      }
    } catch (e: any) {
      console.warn(`[Firestore getLocalDb] Could not load config 'music': ${e.message || e}. Using local.`);
    }

    try {
      const adminDoc = await getDoc(doc(firestore, "configs", "admin"));
      if (adminDoc.exists()) {
        result.passcode = adminDoc.data().passcode || result.passcode;
      }
    } catch (e: any) {
      console.warn(`[Firestore getLocalDb] Could not load config 'admin': ${e.message || e}. Using local.`);
    }

    try {
      const mpesaDoc = await getDoc(doc(firestore, "configs", "mpesa"));
      if (mpesaDoc.exists()) {
        result.mpesa = mpesaDoc.data() || {};
      }
    } catch (e: any) {
      console.warn(`[Firestore getLocalDb] Could not load config 'mpesa': ${e.message || e}. Using local.`);
    }

  } catch (e: any) {
    console.warn("[Firestore getLocalDb] Global error during fetch:", e.message || e);
  }

  return result;
}

export async function saveLocalDb(data: any) {
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
  // Write key-value update to the local json db file first
  const dbData = getLocalJson();
  
  if (colName === "configs") {
    if (id === "music") dbData.music = data;
    else if (id === "admin") dbData.passcode = data.passcode || dbData.passcode;
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
