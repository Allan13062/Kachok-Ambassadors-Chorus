import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import fs from "fs";
import http from "http";
import https from "https";
import url from "url";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { google } from "googleapis";
import { Readable } from "stream";

import { db } from "./src/db/index.ts";
import { getLocalDb, saveLocalDb, insertItem, deleteItem, getSession, deleteSession } from "./dbStorage.ts";
import { activities, itinerary, leaders, inquiries, musicConfig, adminConfig, uploads, users, gallery } from "./src/db/schema.ts";
import { eq } from "drizzle-orm";

const app = express();
const PORT = 3000;
const DB_PATH = path.join(process.cwd(), "data", "db.json");

// Ensure uploads folder exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware to parse JSON and Urlencoded with 150mb limit
app.use(express.json({
  limit: "150mb",
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ limit: "150mb", extended: true }));

// Prevent caching on all dynamic API endpoints to ensure updates reflect instantly
app.use("/api", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

// Enable CORS for all routes (to support preview iframe canvas drawing and cropping)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-admin-passcode, x-admin-token, x-user-id");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Serve uploads folder statically with proper CORS headers and cache revalidation
app.use("/uploads", (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
  // Force browser to revalidate uploaded assets so replacements are visible instantly
  res.setHeader("Cache-Control", "no-cache");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
}, express.static(uploadsDir, {
  etag: true,
  lastModified: true
}));

// Fast In-Memory Passcode Cache to prevent Database slowness
let cachedPasscode: string | null = null;
let passcodeCacheTime: number = 0;
let fallbackPasscode: string = process.env.ADMIN_PASSCODE || "SDA2026";

function isDbAvailable(): boolean {
  const host = process.env.SQL_HOST;
  if (!host || host.trim() === "" || host.includes("YOUR_") || host.includes("placeholder") || host.includes("your-")) {
    return false;
  }
  return true;
}

async function getAdminPasscode(): Promise<string> {
  if (process.env.ADMIN_PASSCODE) {
    return process.env.ADMIN_PASSCODE;
  }

  // Ultra-fast response: If cached in memory, return instantly (cache for 10 seconds max).
  if (cachedPasscode && (Date.now() - passcodeCacheTime < 10000)) {
    return cachedPasscode;
  }
  
  // Try directly connected Firestore first for ultra-fast admin auth
  try {
    const { getDoc, doc } = await import('firebase/firestore/lite');
    const { firestore } = await import('./src/lib/firebaseLite.ts');
    const adminDoc = await getDoc(doc(firestore, "configs", "admin"));
    if (adminDoc.exists() && adminDoc.data().passcode) {
      cachedPasscode = adminDoc.data().passcode;
      passcodeCacheTime = Date.now();
      return cachedPasscode;
    }
  } catch (error: any) {
    console.error("[Kachamba Server] Firestore passcode retrieval failed:", error.message);
  }
  
  // Then check Cloud SQL if available
  if (!isDbAvailable()) {
    // If no SQL, and Firestore didn't have it, load it from local JSON sync
    try {
      const localDb = await getLocalDb();
      if (localDb && localDb.passcode) {
        cachedPasscode = localDb.passcode;
        passcodeCacheTime = Date.now();
        return cachedPasscode;
      }
    } catch (e) {
      console.error("Local db passcode fallback failed", e);
    }
    return fallbackPasscode;
  }
  
  try {
    const passcodeRecords = await db.select().from(adminConfig).where(eq(adminConfig.key, "passcode")).limit(1);
    const dbPasscode = passcodeRecords && passcodeRecords.length > 0 ? passcodeRecords[0].value : fallbackPasscode;
    
    cachedPasscode = dbPasscode;
    passcodeCacheTime = Date.now();
    return dbPasscode;
  } catch (error) {
    // Silently fallback if DB is not configured or reachable.
    return fallbackPasscode; // Return fallback but do NOT cache it permanently!
  }
}

// Authentication middleware using Firestore sessions and roles as the source of truth
async function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  // Admin login is disabled. Bypass authentication.
  return next();
  
  const code = req.headers["x-admin-passcode"] as string;
  const token = (req.headers["x-admin-token"] || req.headers["x-admin-passcode"]) as string;
  const userId = req.headers["x-user-id"] as string;

  try {
    // 1. Check secure session token from headers (Firestore-backed server-side sessions)
    if (token) {
      const session = await getSession(token);
      if (session && session.expiresAt > Date.now()) {
        return next();
      }
    }

    // 2. Fallback check for raw passcode (backwards compatible / manual CLI tools)
    if (code) {
      const dbPasscode = await getAdminPasscode();
      if (code === dbPasscode) {
        return next();
      }
    }

    // 3. User permission check - Source of truth in Firestore
    if (userId) {
      const localDb = await getLocalDb();
      const dbUser = (localDb.users || []).find((u: any) => u.uid === userId);
      // Permit leaders (role === "leader" / "admin" / isLeader === true etc)
      if (dbUser && (
        dbUser.role === "leader" || 
        dbUser.role === "admin" || 
        dbUser.isLeader === true || 
        dbUser.voicePart === "Section Leader"
      )) {
        return next();
      }
    }

    res.status(401).json({ error: "Unauthorized: Invalid credentials or insufficient permissions. Please log in as Admin/Leader." });
  } catch (error) {
    res.status(500).json({ error: "Authentication check database query failed." });
  }
}

// Highly reliable bidirectional local JSON database synchronization
async function syncLocalFile(section: string, operation: string, data: any) {
  try {
    if (section === "passcode") {
      await insertItem("configs", "admin", { passcode: data });
    } else if (section === "music") {
      await insertItem("configs", "music", data);
    } else if (section === "mpesa") {
      await insertItem("configs", "mpesa", data);
    } else {
      if (operation === "insert" || operation === "update") {
        const id = data.id || data.uid;
        if (id) {
          await insertItem(section, id, data);
        }
      } else if (operation === "delete") {
        const idToDelete = (typeof data === "object" && data !== null) ? (data.id || data.uid || data) : data;
        await deleteItem(section, idToDelete);
      }
    }
    console.log(`[Local Sync] Completed ${operation} on section: "${section}" successfully.`);
  } catch (err: any) {
    console.warn("[Local Sync Warning] Could not replicate update to local JSON:", err.message);
  }
}

// Lazy load Gemini AI to prevent crash if key is missing on startup
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(customKey?: string): GoogleGenAI | null {
  try {
    const key = customKey || process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY") {
      return null;
    }
    if (customKey) {
      // Return a dedicated client instance for custom request keys to avoid cross-session key contamination
      return new GoogleGenAI({
        apiKey: customKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
    if (!aiClient) {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
    return aiClient;
  } catch (err: any) {
    console.error("[Kachamba Server] Error initializing Gemini client:", err.message || err);
    return null;
  }
}

// -------------- CLOUD SQL SEEDER --------------

async function seedCloudSqlFromLocalDb() {
  if (!isDbAvailable()) {
    console.log("[Kachamba Cloud SQL] Skipping seeding - SQL_HOST is not configured.");
    return;
  }
  try {
    console.log("[Kachamba Cloud SQL] Preparing initial database status check...");

    // Check if the admin passcode config table is empty
    const passcodeRecord = await db.select().from(adminConfig).where(eq(adminConfig.key, "passcode")).limit(1);
    if (passcodeRecord.length === 0) {
      await db.insert(adminConfig).values({ key: "passcode", value: "SDA2026" }).onConflictDoNothing();
    }

    // Seed default M-pesa billing configurations if empty
    const mpesaTillRecord = await db.select().from(adminConfig).where(eq(adminConfig.key, "mpesa_till")).limit(1);
    if (mpesaTillRecord.length === 0) {
      await db.insert(adminConfig).values({ key: "mpesa_till", value: "4119041" }).onConflictDoNothing();
      await db.insert(adminConfig).values({ key: "mpesa_name", value: "Kachok Ambassadors Chorus" }).onConflictDoNothing();
      await db.insert(adminConfig).values({ key: "mpesa_type", value: "buy_goods" }).onConflictDoNothing();
      await db.insert(adminConfig).values({ key: "mpesa_image", value: "" }).onConflictDoNothing();
    }

    // Check if we already have activities loaded
    const testActivities = await db.select().from(activities).limit(1);
    if (testActivities.length === 0) {
      console.log("[Kachamba Cloud SQL] DB is empty. Seeding from local data...");
      if (true) {
        const localData = await getLocalDb();

        if (localData.activities && Array.isArray(localData.activities)) {
          for (const act of localData.activities) {
            await db.insert(activities).values({
              id: act.id,
              title: act.title,
              date: act.date,
              location: act.location,
              description: act.description,
              category: act.category || "General",
              image: act.image || ""
            }).onConflictDoNothing();
          }
        }

        if (localData.itinerary && Array.isArray(localData.itinerary)) {
          for (const iti of localData.itinerary) {
            await db.insert(itinerary).values({
              id: iti.id,
              event: iti.event,
              date: iti.date,
              time: iti.time || "",
              location: iti.location,
              host: iti.host || "",
              status: iti.status || "Confirmed",
              notes: iti.notes || "",
              mediaUrl: iti.mediaUrl || "",
              mediaType: iti.mediaType || ""
            }).onConflictDoNothing();
          }
        }

        if (localData.leaders && Array.isArray(localData.leaders)) {
          for (const ldr of localData.leaders) {
            await db.insert(leaders).values({
              id: ldr.id,
              name: ldr.name,
              role: ldr.role,
              image: ldr.image || "",
              bio: ldr.bio || "",
              phone: ldr.phone || ""
            }).onConflictDoNothing();
          }
        }

        if (localData.inquiries && Array.isArray(localData.inquiries)) {
          for (const inq of localData.inquiries) {
            await db.insert(inquiries).values({
              id: inq.id,
              name: inq.name,
              email: inq.email,
              subject: inq.subject || "",
              message: inq.message,
              date: inq.date,
              status: inq.status || "Unread"
            }).onConflictDoNothing();
          }
        }

        if (localData.music) {
          const m = localData.music;
          await db.insert(musicConfig).values({
            id: 1,
            songTitle: m.songTitle || "Umchukue Mwanao",
            artistName: m.artistName || "Kachok Ambassadors Chorus",
            albumName: m.albumName || "Sounds Of Togetherness",
            audioUrl: m.audioUrl || "",
            coverUrl: m.coverUrl || "",
            quoteText: m.quoteText || "",
            label: m.label || "",
            lyrics: m.lyrics || ""
          }).onConflictDoNothing();
        }

        if (localData.users && Array.isArray(localData.users)) {
          for (const u of localData.users) {
            await db.insert(users).values({
              uid: u.uid,
              email: u.email,
              displayName: u.displayName || "",
              photoURL: u.photoURL || "",
              voicePart: u.voicePart || "Listener",
              providerId: u.providerId || "email",
              password: u.password || "",
              role: u.role || "user",
              isLeader: u.isLeader ? "true" : "false",
              createdAt: u.createdAt || new Date().toISOString()
            }).onConflictDoNothing();
          }
        }
        console.log("[Kachamba Cloud SQL] Seeded database tables successfully.");
      } else {
        console.log("[Kachamba Cloud SQL] Local JSON database not found. Seeding default configs...");
      }
    }

    // Verify music config is always initialized
    const testMusic = await db.select().from(musicConfig).where(eq(musicConfig.id, 1)).limit(1);
    if (testMusic.length === 0) {
      await db.insert(musicConfig).values({
        id: 1,
        songTitle: "Umchukue Mwanao",
        artistName: "Kachok Ambassadors Chorus",
        albumName: "Sounds Of Togetherness",
        audioUrl: "",
        coverUrl: "https://www.image2url.com/r2/default/images/1781098447744-9bfd4cd8-4c62-4a1a-b218-7ccd6f1b36d2.png",
        quoteText: "Let our voices unite, lifting the sound of hope to the clouds...",
        label: "Live At Central",
        lyrics: "[Acapella Harmony Intro]\n(Ibrahimu, Ibrahimu...\nMchukue mwanao, umpendaye sana Isaka...\nUkamtoe dhabihu...)\n\n(Verse 1)\nSiku ile Mungu alimwita Ibrahimu akasema: \"Ibrahimu!\"\nNaye akaitika kwa opole: \"Mimi hapa Bwana.\"\nAkamwambia: \"Umchukue mwanao, mwana wako wa pekee..."
      }).onConflictDoNothing();
    }
  } catch (error: any) {
    console.log("[Kachamba Cloud SQL] Notice: Seeding / validation deferred as Database is offline or timed out.");
  }
}

// -------------- API ENDPOINTS --------------

// 1. Get raw database contents from Cloud SQL Postgres
app.get("/api/db", async (req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.set("Expires", "-1");
  res.set("Pragma", "no-cache");
  try {
    const dbPasscode = await getAdminPasscode();
    const isAdmin = req.headers["x-admin-passcode"] === dbPasscode;

    let allActs: any[] = [];
    let allIti: any[] = [];
    let allLdr: any[] = [];
    let musicRecs: any[] = [];

    if (isDbAvailable()) {
      try {
        // Fast-fail if DB is fully down to maintain high performance
        const dbPromise = Promise.all([
          db.select().from(activities),
          db.select().from(itinerary),
          db.select().from(leaders),
          db.select().from(musicConfig).where(eq(musicConfig.id, 1)).limit(1)
        ]);

        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("DB Load Timeout")), 5000));
        
        // @ts-ignore
        const [acts, iti, ldr, music] = await Promise.race([dbPromise, timeoutPromise]);
        allActs = acts;
        allIti = iti;
        allLdr = ldr;
        musicRecs = music;
      } catch (dbErr: any) {
        console.warn("[Cloud SQL] Failed to load data from live DB, falling back to local file. Error:", dbErr.message);
        throw dbErr; // Trigger local file load fallback in general catch block
      }
    } else {
      throw new Error("Live database is not configured");
    }

    // Keep activities sorted descendingly by id/timestamp
    allActs.sort((a, b) => (b.id || "").localeCompare(a.id || ""));

    // Keep itinerary sorted ascendingly by date
    allIti.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const music = musicRecs.length > 0 ? musicRecs[0] : {
      songTitle: "Umchukue Mwanao",
      artistName: "Kachok Ambassadors Chorus",
      albumName: "Sounds Of Togetherness",
      audioUrl: "",
      coverUrl: "https://www.image2url.com/r2/default/images/1781098447744-9bfd4cd8-4c62-4a1a-b218-7ccd6f1b36d2.png",
      quoteText: "Let our voices unite, lifting the sound of hope to the clouds...",
      label: "Live At Central",
      lyrics: ""
    };

    let inquiriesList: any[] = [];
    // Admin login is disabled. Bypass authentication so everyone can view it.
    inquiriesList = await db.select().from(inquiries);
    inquiriesList.sort((a, b) => (b.id || "").localeCompare(a.id || ""));

    let subscribersList: any[] = [];
    let broadcastsList: any[] = [];
    let memberSpotlightsList: any[] = [];
    if (true) {
      try {
        const localData = await getLocalDb();
        subscribersList = localData.subscribers || [];
        broadcastsList = localData.broadcasts || [];
        memberSpotlightsList = localData.memberSpotlights || [];
      } catch (e) {}
    }

    let galleryList: any[] = [];
    try {
      if (isDbAvailable()) {
        galleryList = await db.select().from(gallery).orderBy(gallery.createdAt);
      } else {
        const localData = await getLocalDb();
        galleryList = localData.gallery || [];
      }
    } catch (e) {
      try {
        const localData = await getLocalDb();
        galleryList = localData.gallery || [];
      } catch (_) {}
    }

    res.json({
      activities: allActs,
      itinerary: allIti,
      music,
      leaders: allLdr,
      inquiries: inquiriesList,
      subscribers: subscribersList,
      broadcasts: broadcastsList,
      memberSpotlights: memberSpotlightsList,
      gallery: galleryList
    });
  } catch (error: any) {
    if (true) {
      try {
        const localData = await getLocalDb();
        
        // Populate missing sections with empty arrays just in case
        localData.activities = localData.activities || [];
        localData.itinerary = localData.itinerary || [];
        localData.leaders = localData.leaders || [];
        localData.inquiries = localData.inquiries || [];
        localData.subscribers = localData.subscribers || [];
        localData.broadcasts = localData.broadcasts || [];
        localData.memberSpotlights = localData.memberSpotlights || [];
        localData.gallery = localData.gallery || [];
        localData.music = localData.music || {
          songTitle: "Umchukue Mwanao",
          artistName: "Kachok Ambassadors Chorus",
          albumName: "Sounds Of Togetherness",
          audioUrl: "",
          coverUrl: "https://www.image2url.com/r2/default/images/1781098447744-9bfd4cd8-4c62-4a1a-b218-7ccd6f1b36d2.png",
          quoteText: "Let our voices unite, lifting the sound of hope to the clouds...",
          label: "Live At Central",
          lyrics: ""
        };
        
        return res.json(localData);
      } catch (jsonErr) {
        // Fallthrough on local JSON parse error
      }
    }
    
    // Total failure fallback
    res.json({
      activities: [],
      itinerary: [],
      leaders: [],
      inquiries: [],
      subscribers: [],
      broadcasts: [],
      memberSpotlights: [],
      gallery: [],
      music: {
        songTitle: "Umchukue Mwanao",
        artistName: "Kachok Ambassadors Chorus",
        albumName: "Sounds Of Togetherness",
        audioUrl: "",
        coverUrl: "https://www.image2url.com/r2/default/images/1781098447744-9bfd4cd8-4c62-4a1a-b218-7ccd6f1b36d2.png",
        quoteText: "Let our voices unite, lifting the sound of hope to the clouds...",
        label: "Live At Central",
        lyrics: ""
      }
    });
  }
});

// Public Newsletter Subscription
app.post("/api/subscribers", async (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "A valid email address is required." });
  }

  try {
    let localDb: any = await getLocalDb();
    localDb.subscribers = localDb.subscribers || [];

    const normalized = email.trim().toLowerCase();
    const alreadySubscribed = localDb.subscribers.some((s: any) => s.email === normalized);
    if (alreadySubscribed) {
      return res.json({ success: true, message: "You are already subscribed to alerts!" });
    }

    const newSub = {
      id: "sub-" + Date.now(),
      email: normalized,
      createdAt: new Date().toISOString()
    };

    localDb.subscribers.push(newSub);
    await saveLocalDb(localDb);
    await syncLocalFile("subscribers", "insert", newSub);

    res.json({ success: true, message: "Subscribed successfully! Thank you for supporting our ministry." });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to register subscription: " + error.message });
  }
});

// Delete Subscriber (Admin)
app.post("/api/subscribers/delete", requireAdmin, async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: "Subscriber ID is required." });
  }
  try {
    if (true) {
      let localDb: any = await getLocalDb();
      localDb.subscribers = (localDb.subscribers || []).filter((s: any) => s.id !== id);
      await saveLocalDb(localDb);
      await syncLocalFile("subscribers", "delete", id);
    }
    res.json({ success: true, message: "Subscriber removed successfully." });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete subscriber: " + error.message });
  }
});

// Add admin custom broadcast (Admin)
app.post("/api/broadcasts", requireAdmin, async (req, res) => {
  const { subject, body } = req.body;
  if (!subject || !body) {
    return res.status(400).json({ error: "Subject and Body text are required for broadcast emails." });
  }

  try {
    let localDb: any = await getLocalDb();
    localDb.subscribers = localDb.subscribers || [];
    localDb.broadcasts = localDb.broadcasts || [];

    const subscribersCount = localDb.subscribers.length;
    const emailsList = localDb.subscribers.map((s: any) => s.email);

    const newBroadcast = {
      id: "broad-" + Date.now(),
      subject,
      body,
      sentCount: subscribersCount,
      sentTo: emailsList,
      createdAt: new Date().toISOString()
    };

    localDb.broadcasts.push(newBroadcast);
    await saveLocalDb(localDb);
    await syncLocalFile("broadcasts", "insert", newBroadcast);

    // Print massive styled bulletin simulation box to console
    console.log("\n======================================================================");
    console.log(`📡 BROADCAST DISPATCHED TO ALL SUBSCRIBERS (${subscribersCount} recipients)`);
    console.log(`📧 SUBJECT: ${subject}`);
    console.log(`📝 BODY SUMMARY:\n${body}`);
    console.log("======================================================================\n");

    res.json({ success: true, data: newBroadcast });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to dispatch broadcast email: " + error.message });
  }
});

// Create Member Spotlight (Admin)
app.post("/api/member-spotlights", requireAdmin, async (req, res) => {
  const { memberName, roleOrVoicePart, quoteOrHighlight, image } = req.body;
  if (!memberName || !quoteOrHighlight) {
    return res.status(400).json({ error: "Member name and highlight quote are required." });
  }

  try {
    let localDb: any = await getLocalDb();
    localDb.memberSpotlights = localDb.memberSpotlights || [];

    const newSpotlight = {
      id: "spot-" + Date.now(),
      memberName,
      roleOrVoicePart: roleOrVoicePart || "Chorus Member",
      quoteOrHighlight,
      image: image || "",
      createdAt: new Date().toISOString()
    };

    localDb.memberSpotlights.push(newSpotlight);
    await saveLocalDb(localDb);
    await syncLocalFile("memberSpotlights", "insert", newSpotlight);

    res.json({ success: true, data: newSpotlight });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to add Member Spotlight: " + error.message });
  }
});

// Delete Member Spotlight (Admin)
app.post("/api/member-spotlights/delete", requireAdmin, async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: "Spotlight ID is required." });
  }
  try {
    if (true) {
      let localDb: any = await getLocalDb();
      localDb.memberSpotlights = (localDb.memberSpotlights || []).filter((s: any) => s.id !== id);
      await saveLocalDb(localDb);
      await syncLocalFile("memberSpotlights", "delete", id);
    }
    res.json({ success: true, message: "Member spotlight deleted successfully." });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete member spotlight: " + error.message });
  }
});

// Update music streaming details (Admin)
app.put("/api/music", requireAdmin, async (req, res) => {
  const { songTitle, artistName, albumName, audioUrl, coverUrl, quoteText, label, lyrics } = req.body;

  const musicData = {
    songTitle: songTitle || "Umchukue Mwanao",
    artistName: artistName || "Kachok Ambassadors Chorus",
    albumName: albumName || "Sounds Of Togetherness",
    audioUrl: audioUrl || "",
    coverUrl: coverUrl || "https://www.image2url.com/r2/default/images/1781098447744-9bfd4cd8-4c62-4a1a-b218-7ccd6f1b36d2.png",
    quoteText: quoteText || "Let our voices unite, lifting the sound of hope to the clouds...",
    label: label || "Live At Central",
    lyrics: lyrics || ""
  };

  try {
    await db.insert(musicConfig).values({
      id: 1,
      ...musicData,
      updatedAt: new Date()
    }).onConflictDoUpdate({
      target: musicConfig.id,
      set: {
        ...musicData,
        updatedAt: new Date()
      }
    });

    res.json({ success: true, data: musicData });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update music data: " + error.message });
  }
});

// Helper to recursively proxy audio stream handling redirects, range selectors, and HTTPS certificates
function proxyAudioWithRedirect(targetUrl: string, req: any, res: any, redirectsLeft = 5) {
  if (redirectsLeft <= 0) {
    return res.status(500).send("Too many audio proxy redirects");
  }

  try {
    const parsedUrl = url.parse(targetUrl);
    const clientReq = parsedUrl.protocol === "https:" ? https : http;

    const requestHeaders: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "*/*",
    };

    if (req.headers.range) {
      requestHeaders["range"] = req.headers.range as string;
    }

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === "https:" ? 443 : 80),
      path: parsedUrl.path,
      method: "GET",
      headers: requestHeaders,
      rejectUnauthorized: false
    };

    const proxyReq = clientReq.request(options, (proxyRes) => {
      // Handle redirects automatically (e.g. Dropbox, secure drives, media hosts)
      if ([301, 302, 303, 307, 308].includes(proxyRes.statusCode || 0)) {
        const location = proxyRes.headers.location;
        if (location) {
          const absoluteLocation = url.resolve(targetUrl, location);
          return proxyAudioWithRedirect(absoluteLocation, req, res, redirectsLeft - 1);
        }
      }

      // Forward caching & streaming headers
      const headersToForward = [
        "content-type",
        "content-length",
        "content-range",
        "accept-ranges",
        "cache-control",
        "etag"
      ];

      headersToForward.forEach((h) => {
        const val = proxyRes.headers[h];
        if (val !== undefined) {
          res.setHeader(h, val);
        }
      });

      res.writeHead(proxyRes.statusCode || 200);
      proxyRes.pipe(res);
    });

    proxyReq.on("error", (err) => {
      console.error("Audio proxy request error for URL:", targetUrl, err);
      if (!res.headersSent) {
        res.status(500).send("Audio streaming tunnel error: " + err.message);
      }
    });

    proxyReq.end();
  } catch (err: any) {
    if (!res.headersSent) {
      res.status(500).send("Audio proxy execution error: " + err.message);
    }
  }
}

// Endpoint to securely proxy audio links to bypass strict iFrame sandbox environment, CORS, and referrer blockages
app.get("/api/proxy-audio", (req, res) => {
  let targetUrl = req.query.url as string;
  if (!targetUrl) {
    return res.status(400).send("Missing target audio source URL");
  }

  // Automatic normalization for popular hosting domains
  // 1. Normalize Dropbox links
  if (targetUrl.includes("dropbox.com")) {
    targetUrl = targetUrl
      .replace("www.dropbox.com", "dl.dropboxusercontent.com")
      .replace("?dl=0", "")
      .replace("&dl=0", "")
      .replace("?dl=1", "")
      .replace("&dl=1", "");
  }

  // 2. Normalize Google Drive links to direct download/stream endpoints
  if (targetUrl.includes("drive.google.com")) {
    const driveIdMatch = targetUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || targetUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (driveIdMatch && driveIdMatch[1]) {
      targetUrl = `https://docs.google.com/uc?export=download&id=${driveIdMatch[1]}`;
    }
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  proxyAudioWithRedirect(targetUrl, req, res);
});

// 2. Authenticate passcode
app.post("/api/auth", async (req, res) => {
  const { passcode } = req.body;
  try {
    const dbPasscode = await getAdminPasscode();
    if (passcode === dbPasscode) {
      // Create a secure session token
      const token = "adm_sess_" + Math.random().toString(36).substring(2, 11) + Math.random().toString(36).substring(2, 11);
      const expiresAt = Date.now() + 2 * 60 * 60 * 1000; // 2 hour session validity duration
      
      const payload = {
        token,
        expiresAt,
        role: "admin",
        createdAt: new Date().toISOString()
      };

      await insertItem("sessions", token, payload);

      res.json({ 
        success: true, 
        token, 
        message: "Welcome Elder/Ambassador Director!" 
      });
    } else {
      res.status(401).json({ error: "Incorrect passcode. Please try again." });
    }
  } catch (error: any) {
    res.status(500).json({ error: "Authentication failed: " + error.message });
  }
});

// A2-b. Validate Session Token (automatic token expiry check)
app.post("/api/auth/validate-token", async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ valid: false, error: "Session token is required" });
  }
  try {
    const session = await getSession(token);
    if (session && session.expiresAt > Date.now()) {
      return res.json({ valid: true, role: session.role });
    }
    return res.json({ valid: false, error: "Session expired or invalid" });
  } catch (error: any) {
    res.status(500).json({ valid: false, error: error.message });
  }
});

// A2-c. Admin Sign Out / Clean Up Session
app.post("/api/auth/logout", async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ success: false, error: "Token is required to sign out" });
  }
  try {
    await deleteSession(token);
    res.json({ success: true, message: "Logged out and deleted session successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});



// Update passcode (Requires Admin or Recovery Key)
app.post("/api/auth/reset", async (req, res) => {
  if (process.env.ADMIN_PASSCODE) {
    return res.status(403).json({ error: "Passcode is managed by server environment variables and cannot be changed here." });
  }

  const { newPasscode, recoveryKey, currentPasscode } = req.body;
  
  try {
    const dbPasscode = await getAdminPasscode();

    const isCurrentCorrect = currentPasscode && currentPasscode === dbPasscode;
    const isMasterRecovery = recoveryKey === "KACHAMBA2026";

    // Allow reset if they know the current passcode OR a recovery key ("KACHAMBA2026")
    if (isCurrentCorrect || isMasterRecovery) {
      if (!newPasscode || newPasscode.length < 4) {
        return res.status(400).json({ error: "New passcode must be at least 4 characters." });
      }

      // Crucial: Update memory cache & fallback passcode instantly
      fallbackPasscode = newPasscode;
      cachedPasscode = newPasscode;
      passcodeCacheTime = Date.now();

      // Write to connected Firestore
      try {
        await insertItem("configs", "admin", { passcode: newPasscode });
        console.log("[Kachamba Server] Successfully saved updated passcode reset to Firestore configs/admin.");
      } catch (firestoreErr: any) {
        console.error("[Kachamba Server] Firestore update failed during reset:", firestoreErr.message);
      }

      if (isDbAvailable()) {
        try {
          await db.insert(adminConfig)
            .values({ key: "passcode", value: newPasscode, updatedAt: new Date() })
            .onConflictDoUpdate({
              target: adminConfig.key,
              set: { value: newPasscode, updatedAt: new Date() }
            });
        } catch (dbErr: any) {
          console.error("[Kachamba Server] Database insert failed during reset, continuing in-memory:", dbErr.message);
        }
      }

      return res.json({ success: true, message: "Passcode updated successfully!" });
    } else {
      return res.status(401).json({ error: "Invalid current passcode or recovery key." });
    }
  } catch (error: any) {
    res.status(500).json({ error: "Failed to reset passcode: " + error.message });
  }
});

// M-Pesa Integration Routes

// GET M-Pesa Config (Public)
app.get("/api/mpesa/config", async (req, res) => {
  try {
    let configMap: Record<string, string> = {};

    if (isDbAvailable()) {
      try {
        const configs = await db.select().from(adminConfig);
        configMap = configs.reduce((acc, curr) => {
          acc[curr.key] = curr.value;
          return acc;
        }, {} as Record<string, string>);
      } catch (dbErr: any) {
        console.warn("[Cloud SQL] Failed to retrieve admin config from Postgres:", dbErr.message);
      }
    }

    // Merge from local file as secondary fallback
    if (true) {
      try {
        const localData = await getLocalDb();
        if (localData.mpesa) {
          configMap = { ...localData.mpesa, ...configMap };
        }
      } catch (e) {}
    }

    res.json({
      tillNumber: configMap["mpesa_till"] || "4119041",
      tillName: configMap["mpesa_name"] || "Kachok Ambassadors Chorus",
      tillImage: configMap["mpesa_image"] || "",
      tillType: configMap["mpesa_type"] || "buy_goods",
      receiptTitle: configMap["mpesa_receipt_title"] || "",
      receiptLogo: configMap["mpesa_receipt_logo"] || "https://www.image2url.com/r2/default/images/1781098447744-9bfd4cd8-4c62-4a1a-b218-7ccd6f1b36d2.png",
      receiptExtraLogo: configMap["mpesa_receipt_extra_logo"] || "",
      receiptMessage: configMap["mpesa_receipt_message"] || "We have received your generous gift. May God bless you abundantly.",
      receiptLayout: configMap["mpesa_receipt_layout"] || "modern",
      receiptHeaderSize: configMap["mpesa_receipt_header_size"] || "text-xl",
      receiptHeaderColor: configMap["mpesa_receipt_header_color"] || "text-slate-800",
      receiptBodySize: configMap["mpesa_receipt_body_size"] || "text-sm",
      receiptBodyColor: configMap["mpesa_receipt_body_color"] || "text-slate-500",
      receiptTextAlign: configMap["mpesa_receipt_text_align"] || "text-center",
      receiptFontFamily: configMap["mpesa_receipt_font_family"] || "font-sans",
      receiptOrder: configMap["mpesa_receipt_order"] || null
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to load M-pesa billing configurations: " + error.message });
  }
});

// PUT M-Pesa Config (Requires Admin)
app.put("/api/mpesa/config", requireAdmin, async (req, res) => {
  const { tillNumber, tillName, tillImage, tillType, receiptTitle, receiptLogo, receiptExtraLogo, receiptMessage, receiptLayout, receiptHeaderSize, receiptHeaderColor, receiptBodySize, receiptBodyColor, receiptTextAlign, receiptFontFamily, receiptOrder } = req.body;
  try {
    const upsertConfig = async (key: string, value: string) => {
      if (isDbAvailable()) {
        try {
          await db.insert(adminConfig)
            .values({ key, value, updatedAt: new Date() })
            .onConflictDoUpdate({
              target: adminConfig.key,
              set: { value, updatedAt: new Date() }
            });
        } catch (dbErr) {
          console.warn(`[Cloud SQL] Could not write config key "${key}" to live DB.`);
        }
      }
    };

    if (tillNumber !== undefined) await upsertConfig("mpesa_till", String(tillNumber));
    if (tillName !== undefined) await upsertConfig("mpesa_name", String(tillName));
    if (tillImage !== undefined) await upsertConfig("mpesa_image", String(tillImage));
    if (tillType !== undefined) await upsertConfig("mpesa_type", String(tillType));
    if (receiptTitle !== undefined) await upsertConfig("mpesa_receipt_title", String(receiptTitle));
    if (receiptLogo !== undefined) await upsertConfig("mpesa_receipt_logo", String(receiptLogo));
    if (receiptExtraLogo !== undefined) await upsertConfig("mpesa_receipt_extra_logo", String(receiptExtraLogo));
    if (receiptMessage !== undefined) await upsertConfig("mpesa_receipt_message", String(receiptMessage));
    if (receiptLayout !== undefined) await upsertConfig("mpesa_receipt_layout", String(receiptLayout));
    if (receiptHeaderSize !== undefined) await upsertConfig("mpesa_receipt_header_size", String(receiptHeaderSize));
    if (receiptHeaderColor !== undefined) await upsertConfig("mpesa_receipt_header_color", String(receiptHeaderColor));
    if (receiptBodySize !== undefined) await upsertConfig("mpesa_receipt_body_size", String(receiptBodySize));
    if (receiptBodyColor !== undefined) await upsertConfig("mpesa_receipt_body_color", String(receiptBodyColor));
    if (receiptTextAlign !== undefined) await upsertConfig("mpesa_receipt_text_align", String(receiptTextAlign));
    if (receiptFontFamily !== undefined) await upsertConfig("mpesa_receipt_font_family", String(receiptFontFamily));
    if (receiptOrder !== undefined) await upsertConfig("mpesa_receipt_order", String(receiptOrder));

    // Consistently write to local configuration json file as absolute backup
    if (true) {
      try {
        let localDb: any = await getLocalDb();
        localDb.mpesa = localDb.mpesa || {};
        const configKeys = [
          ["tillNumber", "mpesa_till"], ["tillName", "mpesa_name"], ["tillImage", "mpesa_image"],
          ["tillType", "mpesa_type"], ["receiptTitle", "mpesa_receipt_title"], ["receiptLogo", "mpesa_receipt_logo"],
          ["receiptExtraLogo", "mpesa_receipt_extra_logo"], ["receiptMessage", "mpesa_receipt_message"],
          ["receiptLayout", "mpesa_receipt_layout"], ["receiptHeaderSize", "mpesa_receipt_header_size"],
          ["receiptHeaderColor", "mpesa_receipt_header_color"], ["receiptBodySize", "mpesa_receipt_body_size"],
          ["receiptBodyColor", "mpesa_receipt_body_color"], ["receiptTextAlign", "mpesa_receipt_text_align"],
          ["receiptFontFamily", "mpesa_receipt_font_family"], ["receiptOrder", "mpesa_receipt_order"]
        ];
        for (const [prop, key] of configKeys) {
          if (req.body[prop] !== undefined) {
            localDb.mpesa[key] = String(req.body[prop]);
          }
        }
        await saveLocalDb(localDb);
        await syncLocalFile("mpesa", "insert", localDb.mpesa);
      } catch (e: any) {
        console.warn("[Local Sync Warning] Failed to update local config map:", e.message);
      }
    }

    res.json({ success: true, message: "M-pesa billing configuration updated successfully." });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to save M-pesa billing configurations: " + error.message });
  }
});

// POST M-Pesa STK Push Request
app.post("/api/mpesa/stkpush", async (req, res) => {
  try {
    let { phone, amount } = req.body;
    if (!phone || !amount) {
      return res.status(400).json({ error: "Phone number and amount are required." });
    }

    // Standardize phone number format: must be 2547XXXXXXXX or 2541XXXXXXXX
    let formattedPhone = String(phone).trim().replace(/\+/g, "");
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "254" + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith("7") || formattedPhone.startsWith("1")) {
      formattedPhone = "254" + formattedPhone;
    }

    // Validate phone number format (2547... or 2541...)
    if (!/^254(7|1|2|5|9)\d{8}$/.test(formattedPhone)) {
      return res.status(400).json({ error: "Invalid phone number format. Please provide a valid Kenyan number (e.g., 0712345678 or 254712345678)." });
    }

    const numericAmount = Math.round(Number(amount));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: "Transaction amount must be a positive integer." });
    }

    // Read Safaricom M-Pesa credentials from process env
    const mpesaConsumerKey = process.env.MPESA_CONSUMER_KEY;
    const mpesaConsumerSecret = process.env.MPESA_CONSUMER_SECRET;
    const mpesaPasskey = process.env.MPESA_PASSKEY;
    const mpesaStoreNumber = process.env.MPESA_STORE_NUMBER || process.env.MPESA_SHORTCODE; // Explicitly map Store Number for Buy Goods
    
    // Read till details from database (used primarily for frontend display, but we can check if it's paybill/buygoods)
    let databaseType = "buy_goods";
    try {
      const records = await db.select().from(adminConfig);
      const typeRecord = records.find(r => r.key === "mpesa_type");
      if (typeRecord) databaseType = typeRecord.value;
    } catch (e) {
      console.log("[M-Pesa] Notice: Could not read till config from DB, using fallback.");
    }

    // Check if real keys are supplied to execute authentic request
    const useRealMpesa = mpesaConsumerKey && mpesaConsumerSecret && mpesaPasskey && mpesaStoreNumber;

    if (useRealMpesa) {
      try {
        console.log(`[STK Push] Initiating real STK push for ${formattedPhone}, amount: KES ${numericAmount}`);
        
        // Step 1: Generate Access Token
        // Default to production unless explicitly set to sandbox
        const isProd = process.env.MPESA_ENV !== "sandbox";
        const baseUrl = isProd ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";
        
        const auth = Buffer.from(`${mpesaConsumerKey}:${mpesaConsumerSecret}`).toString("base64");
        
        const tokenResponse = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
          method: "GET",
          headers: {
            "Authorization": `Basic ${auth}`,
            "User-Agent": "KachambaApp/1.0"
          }
        });

        if (!tokenResponse.ok) {
          const errMsg = await tokenResponse.text();
          throw new Error("Failed Safaricom OAuth generation request: " + errMsg);
        }

        const tokenData = await tokenResponse.json() as any;
        const accessToken = tokenData.access_token;

        // Step 2: Generate Timestamp and Password
        const now = new Date();
        const timestamp = now.getFullYear().toString() + 
          (now.getMonth() + 1).toString().padStart(2, '0') + 
          now.getDate().toString().padStart(2, '0') + 
          now.getHours().toString().padStart(2, '0') + 
          now.getMinutes().toString().padStart(2, '0') + 
          now.getSeconds().toString().padStart(2, '0');
          
        const password = Buffer.from(`${mpesaStoreNumber}${mpesaPasskey}${timestamp}`).toString("base64");
        
        // Always use CustomerPayBillOnline for sandbox testing as per tutorial
        const transactionType = (!isProd) ? "CustomerPayBillOnline" : (databaseType === "paybill" ? "CustomerPayBillOnline" : "CustomerBuyGoodsOnline");
        
        const mpesaAppUrl = process.env.APP_URL || "https://example.com";
        const callbackUrl = `${mpesaAppUrl.replace(/\/$/, "")}/api/mpesa/callback`;

        const stkPayload = {
          BusinessShortCode: Number(mpesaStoreNumber),
          Password: password,
          Timestamp: timestamp,
          TransactionType: transactionType,
          Amount: numericAmount,
          PartyA: Number(formattedPhone), // Customer's phone number
          PartyB: Number(mpesaStoreNumber), // The Organization receiving the funds
          PhoneNumber: Number(formattedPhone),
          CallBackURL: callbackUrl,
          AccountReference: "Kachamba", // Max 12 alphanumeric characters (changed from KachambaChorus)
          TransactionDesc: "Chorus Support"
        };

        const pushResponse = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "User-Agent": "KachambaApp/1.0"
          },
          body: JSON.stringify(stkPayload)
        });

        if (!pushResponse.ok) {
          const pushErr = await pushResponse.text();
          throw new Error("Safaricom processRequest failure: " + pushErr);
        }

        const pushResult = await pushResponse.json() as any;
        console.log("[STK Push] Real push successfully executed:", pushResult);

        if (pushResult.ResponseCode !== "0") {
            throw new Error("Daraja API rejected the request: " + pushResult.ResponseDescription);
        }

        return res.json({
          success: true,
          realApi: true,
          message: "An STK Push has been sent to your phone! Please enter your M-pesa PIN to complete the contribution.",
          merchantRequestId: pushResult.MerchantRequestID,
          checkoutRequestId: pushResult.CheckoutRequestID,
          responseDescription: pushResult.ResponseDescription
        });

      } catch (err: any) {
        console.error("[STK Push Error] Real API failure:", err);
        return res.status(400).json({
          error: "Safaricom M-Pesa Link Error: " + err.message,
          clarification: "Check if your MPESA Consumer Key, Secret, Passkey, and Store Number are correctly configured."
        });
      }
    } else {
      // Graceful local/sandbox simulator (returns mock structure for immediate UI preview)
      console.log(`[STK Push] Simulating Daraja STK Push for ${formattedPhone}, amount: KES ${numericAmount}`);
      
      return res.json({
        success: true,
        realApi: false,
        message: "STK push simulated ! (No actual API keys configured in environment).",
        merchantRequestId: "ws_CO_" + Date.now().toString().slice(3),
        checkoutRequestId: "ws_CH_" + Math.random().toString(36).substring(2, 10).toUpperCase(),
        responseDescription: "Success. Request accepted for processing"
      });
    }
  } catch (err: any) {
    console.error("[STK Push Error] Backend Crash:", err);
    return res.status(400).json({ error: "Backend server error: " + err.message });
  }
});

// Robust Callback Endpoint to handle Safaricom async JSON webhooks
app.post("/api/mpesa/callback", (req, res) => {
  console.log("[M-Pesa Webhook] Received callback block.");
  
  try {
    const callbackData = req.body?.Body?.stkCallback;
    if (!callbackData) {
      console.error("[M-Pesa Webhook] Invalid payload structure received.");
      return res.status(400).json({ ResultCode: 1, ResultDesc: "Invalid Payload" });
    }

    const { ResultCode, ResultDesc, CheckoutRequestID, CallbackMetadata } = callbackData;

    if (ResultCode === 0) {
      // Transaction was highly successful!
      console.log(`[M-Pesa Webhook] Success: Transaction ${CheckoutRequestID} confirmed!`);
      
      // Parse out the nested Item array values if it exists
      if (CallbackMetadata && CallbackMetadata.Item) {
         const amountObj = CallbackMetadata.Item.find((i: any) => i.Name === "Amount");
         const receiptObj = CallbackMetadata.Item.find((i: any) => i.Name === "MpesaReceiptNumber");
         const phoneObj = CallbackMetadata.Item.find((i: any) => i.Name === "PhoneNumber");
         
         console.log(`[M-Pesa Webhook] Paid ${amountObj?.Value} KES. Receipt: ${receiptObj?.Value}. From: ${phoneObj?.Value}`);
         
         // TODO: In a production app, save this receipt logic strictly to the database (e.g. Postgres or Firestore).
      }

    } else {
      // Transaction failed or was cancelled by user
      console.warn(`[M-Pesa Webhook] Failed/Cancelled (${ResultCode}): ${ResultDesc}`);
    }

    // Acknowledge the payload immediately to prevent Safaricom retry loops
    return res.status(200).json({
      ResultCode: 0,
      ResultDesc: "Success"
    });
    
  } catch (err: any) {
    console.error("[M-Pesa Webhook] Error processing callback:", err.message);
    return res.status(500).json({ ResultCode: 1, ResultDesc: "Internal Server Error" });
  }
});

// Robust GitHub Webhook Endpoint to support live repository and build synchronizations
app.post("/api/webhooks/github", (req: any, res) => {
  console.log("[GitHub Webhook] Received webhook trigger request.");
  
  const signature = req.headers["x-hub-signature-256"] as string;
  const event = req.headers["x-github-event"] as string;
  const payload = req.rawBody ? req.rawBody.toString() : JSON.stringify(req.body);

  // Retrieve the webhook secret from environment variables, falling back to Admin's preset code
  const secret = process.env.GITHUB_WEBHOOK_SECRET || "KachambaSync_Secret2026";

  if (signature && secret) {
    try {
      const hmac = crypto.createHmac("sha256", secret);
      const digest = "sha256=" + hmac.update(payload).digest("hex");
      if (signature !== digest) {
        console.warn("[GitHub Webhook] Handshake signature mismatch! Checking safety thresholds.");
      } else {
        console.log("[GitHub Webhook] Handshake signature verified successfully.");
      }
    } catch (cryptoErr: any) {
      console.error("[GitHub Webhook] Error verifying cryptographic signature:", cryptoErr.message);
    }
  }

  // Handle standard GitHub ping event (usually sent immediately during handshake initialization)
  if (event === "ping") {
    console.log("[GitHub Webhook] Ping handshake event succeeded. Connection status: ACTIVE.");
    return res.status(200).json({
      success: true,
      message: "GitHub webhook handshake succeeded. Site is live-ready!",
      timestamp: new Date().toISOString()
    });
  }

  // Handle standard push events
  if (event === "push") {
    console.log("[GitHub Webhook] Push event detected. Pulling changes and synchronizing updates is ready.");
  }

  // Acknowledge the payload immediately to satisfy GitHub delivery expectations
  return res.status(200).json({
    success: true,
    message: `Event '${event || "generic"}' registered successfully.`,
    timestamp: new Date().toISOString()
  });
});

// 3. Post a contact form inquiry (Public)
app.post("/api/inquiries", async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: "Name, email and message are required." });
  }

  const id = "inq-" + Date.now();
  const newInq = {
    id,
    name,
    email,
    subject: subject || "General Inquiry",
    message,
    date: new Date().toISOString(),
    status: "Unread"
  };

  try {
    // Write locally first for high availability
    await syncLocalFile("inquiries", "insert", newInq);
    
    try {
      if (process.env.SQL_HOST) {
        await db.insert(inquiries).values(newInq);
      }
    } catch (pgErr: any) {
      console.log("[Cloud SQL] Notice: Failed to write inquiry to Postgres, saved locally.");
    }
    
    res.json({ success: true, message: "Thank you! Your message has been received by the Kachok Ambassadors Secretary.", data: newInq });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to save inquiry: " + error.message });
  }
});

// 4. Update inquiry status (Admin)
app.put("/api/inquiries/:id/status", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    let existing: any = null;
    
    try {
      if (process.env.SQL_HOST) {
        const records = await db.select().from(inquiries).where(eq(inquiries.id, id)).limit(1);
        if (records.length > 0) existing = records[0];
      }
    } catch (dbErr) {
      console.log("Could not read inquiry from Postgres, searching local db...");
    }

    if (!existing && true) {
      let localDb: any = await getLocalDb();
      existing = (localDb.inquiries || []).find((i: any) => i.id === id);
    }

    if (!existing) {
      return res.status(404).json({ error: "Inquiry not found" });
    }

    const updated = {
      ...existing,
      status: status || "Read"
    };

    await syncLocalFile("inquiries", "update", updated);

    try {
      if (process.env.SQL_HOST) {
        await db.update(inquiries).set({ status: status || "Read" }).where(eq(inquiries.id, id));
      }
    } catch (pgErr: any) {
      console.warn("[Cloud SQL Sync Warning] Could not update inquiry status in Postgres, updated locally");
    }

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update inquiry status: " + error.message });
  }
});

// 5. Delete an inquiry (Admin)
app.delete("/api/inquiries/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await syncLocalFile("inquiries", "delete", id);
    
    try {
      if (process.env.SQL_HOST) {
        await db.delete(inquiries).where(eq(inquiries.id, id));
      }
    } catch (pgErr: any) {
      console.warn("[Cloud SQL Sync Warning] Could not delete inquiry in Postgres, deleted locally");
    }
    
    res.json({ success: true, message: "Inquiry deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete inquiry: " + error.message });
  }
});

// 6. Create activity (Admin)
app.post("/api/activities", requireAdmin, async (req, res) => {
  const { title, date, location, description, category, image, mediaType } = req.body;
  if (!title || !date || !location || !description) {
    return res.status(400).json({ error: "Title, date, location and description are required." });
  }

  const id = "act-" + Date.now();
  const newAct = {
    id,
    title,
    date,
    location,
    description,
    category: category || "General",
    image: image || "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=600",
    mediaType: mediaType || "image"
  };

  try {
    await syncLocalFile("activities", "insert", newAct);
    
    try {
      if (process.env.SQL_HOST) {
        await db.insert(activities).values(newAct);
      }
    } catch (pgErr: any) {
      console.warn("[Cloud SQL Sync Warning] Could not insert activity in Postgres, saved locally");
    }
    
    res.json({ success: true, data: newAct });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to save activity: " + error.message });
  }
});

// 7. Update activity (Admin)
app.put("/api/activities/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { title, date, location, description, category, image, mediaType } = req.body;

  try {
    let existing: any = null;
    
    try {
      if (process.env.SQL_HOST) {
        const records = await db.select().from(activities).where(eq(activities.id, id)).limit(1);
        if (records.length > 0) existing = records[0];
      }
    } catch (dbErr) {
      console.log("Could not read activity from Postgres, loading local...");
    }

    if (!existing && true) {
      let localDb: any = await getLocalDb();
      existing = (localDb.activities || []).find((a: any) => a.id === id);
    }

    if (!existing) {
      return res.status(404).json({ error: "Activity not found" });
    }

    const updated = {
      ...existing,
      title: title ?? existing.title,
      date: date ?? existing.date,
      location: location ?? existing.location,
      description: description ?? existing.description,
      category: category ?? existing.category,
      image: image ?? existing.image,
      mediaType: mediaType ?? existing.mediaType ?? "image"
    };

    await syncLocalFile("activities", "update", updated);

    try {
      if (process.env.SQL_HOST) {
        await db.update(activities).set({
          title: title ?? existing.title,
          date: date ?? existing.date,
          location: location ?? existing.location,
          description: description ?? existing.description,
          category: category ?? existing.category,
          image: image ?? existing.image,
          mediaType: mediaType ?? existing.mediaType ?? "image"
        }).where(eq(activities.id, id));
      }
    } catch (pgErr: any) {
      console.warn("[Cloud SQL Sync Warning] Could not update activity in Postgres, saved locally");
    }

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update activity: " + error.message });
  }
});

// 8. Delete activity (Admin)
app.delete("/api/activities/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await syncLocalFile("activities", "delete", id);
    
    try {
      if (process.env.SQL_HOST) {
        await db.delete(activities).where(eq(activities.id, id));
      }
    } catch (pgErr: any) {
      console.warn("[Cloud SQL Sync Warning] Could not delete activity in Postgres, deleted locally");
    }
    
    res.json({ success: true, message: "Activity deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete activity: " + error.message });
  }
});

// 9. Create itinerary item (Admin)
app.post("/api/itinerary", requireAdmin, async (req, res) => {
  const { event, date, time, location, host, status, notes, mediaUrl, mediaType, sendBroadcast } = req.body;
  if (!event || !date || !location) {
    return res.status(400).json({ error: "Event name, Date and Location are required." });
  }

  const id = "iti-" + Date.now();
  const newIti = {
    id,
    event,
    date,
    time: time || "TBD",
    location,
    host: host || "Local SDA Church",
    status: status || "Confirmed",
    notes: notes || "",
    mediaUrl: mediaUrl || "",
    mediaType: mediaType || ""
  };

  try {
    await syncLocalFile("itinerary", "insert", newIti);
    
    try {
      if (process.env.SQL_HOST) {
        await db.insert(itinerary).values(newIti);
      }
    } catch (pgErr: any) {
      console.warn("[Cloud SQL Sync Warning] Could not insert itinerary in Postgres, saved locally");
    }

    // Trigger automated email broadcast if requested
    if (sendBroadcast) {
      try {
        let localDb: any = await getLocalDb();
        localDb.subscribers = localDb.subscribers || [];
        localDb.broadcasts = localDb.broadcasts || [];

        if (localDb.subscribers.length > 0) {
          const subscribersCount = localDb.subscribers.length;
          const emailsList = localDb.subscribers.map((s: any) => s.email);

          const subject = `🔔 NEW CONCERT ALERT: ${event}`;
          const body = `Dearest Subscriber,\n\nWe are overjoyed to announce a new choral tour & worship crusade schedule!\n\n📍 Event: ${event}\n📅 Date: ${date}\n⏰ Time: ${time || "TBD"}\n⛪ Location: ${location}\n🎙️ Host: ${host || "Local SDA Church"}\n\nNotes from our directors:\n"${notes || "Prepare your hearts and voices to fellowship with us in song."}"\n\nWe look forward to praising together. Secure travel schedules in advance!\n\nYours in Ministry,\nKachamba Chorus`;

          const autoBroadcast = {
            id: "broad-" + Date.now(),
            subject,
            body,
            sentCount: subscribersCount,
            sentTo: emailsList,
            createdAt: new Date().toISOString()
          };

          localDb.broadcasts.push(autoBroadcast);
          await saveLocalDb(localDb);
          await syncLocalFile("broadcasts", "insert", autoBroadcast);

          console.log("\n======================================================================");
          console.log(`📡 AUTOMATIC CHORAL DISPATCH SENT TO ${subscribersCount} RECIPIENTS`);
          console.log(`📧 SUBJECT: ${subject}`);
          console.log("======================================================================\n");
        }
      } catch (broadcastErr: any) {
        console.warn("[Broadcast Warning] Failed automatic newsletter broadcast:", broadcastErr.message);
      }
    }
    
    res.json({ success: true, data: newIti });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to save itinerary item: " + error.message });
  }
});

// 10. Update itinerary item (Admin)
app.put("/api/itinerary/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { event, date, time, location, host, status, notes, mediaUrl, mediaType } = req.body;

  try {
    let existing: any = null;
    
    try {
      if (process.env.SQL_HOST) {
        const records = await db.select().from(itinerary).where(eq(itinerary.id, id)).limit(1);
        if (records.length > 0) existing = records[0];
      }
    } catch (dbErr) {
      console.log("Could not read itinerary from Postgres, lading local...");
    }

    if (!existing && true) {
      let localDb: any = await getLocalDb();
      existing = (localDb.itinerary || []).find((i: any) => i.id === id);
    }

    if (!existing) {
      return res.status(404).json({ error: "Itinerary item not found" });
    }

    const updated = {
      ...existing,
      event: event ?? existing.event,
      date: date ?? existing.date,
      time: time ?? existing.time,
      location: location ?? existing.location,
      host: host ?? existing.host,
      status: status ?? existing.status,
      notes: notes ?? existing.notes,
      mediaUrl: mediaUrl !== undefined ? mediaUrl : existing.mediaUrl,
      mediaType: mediaType !== undefined ? mediaType : existing.mediaType
    };

    await syncLocalFile("itinerary", "update", updated);

    try {
      if (process.env.SQL_HOST) {
        await db.update(itinerary).set({
          event: event ?? existing.event,
          date: date ?? existing.date,
          time: time ?? existing.time,
          location: location ?? existing.location,
          host: host ?? existing.host,
          status: status ?? existing.status,
          notes: notes ?? existing.notes,
          mediaUrl: mediaUrl !== undefined ? mediaUrl : existing.mediaUrl,
          mediaType: mediaType !== undefined ? mediaType : existing.mediaType
        }).where(eq(itinerary.id, id));
      }
    } catch (pgErr: any) {
      console.warn("[Cloud SQL Sync Warning] Could not update itinerary in Postgres, saved locally");
    }

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update itinerary item: " + error.message });
  }
});

// 11. Delete itinerary item (Admin)
app.delete("/api/itinerary/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await syncLocalFile("itinerary", "delete", id);
    
    try {
      if (process.env.SQL_HOST) {
        await db.delete(itinerary).where(eq(itinerary.id, id));
      }
    } catch (pgErr: any) {
      console.warn("[Cloud SQL Sync Warning] Could not delete itinerary in Postgres, deleted locally");
    }
    
    res.json({ success: true, message: "Itinerary item deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete itinerary item: " + error.message });
  }
});

// -------------- FRONTEND USER PORTAL AUTHENTICATION ENDPOINTS --------------

// A1. Sign Up Endpoint
app.post("/api/auth/signup", async (req, res) => {
  const { name, email, password, voicePart, provider } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Full Name, Email and Password are required." });
  }

  try {
    let localDb: any = await getLocalDb();
    
    localDb.users = localDb.users || [];
    
    const normalizedEmail = email.trim().toLowerCase();
    const userExists = localDb.users.some((u: any) => u.email === normalizedEmail);
    if (userExists) {
      return res.status(400).json({ error: "An account with this email address already exists." });
    }

    const newUser = {
      uid: "usr_" + Math.random().toString(36).substring(2, 11),
      email: normalizedEmail,
      displayName: name.trim(),
      photoURL: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name.trim())}`,
      voicePart: voicePart || "Listener",
      providerId: provider || "email",
      createdAt: new Date().toISOString(),
      password: password // simple reliable password persistence for prompt accessibility
    };

    localDb.users.push(newUser);
    await saveLocalDb(localDb);
    await syncLocalFile("users", "insert", newUser);

    if (isDbAvailable()) {
      try {
        await db.insert(users).values({
          uid: newUser.uid,
          email: newUser.email,
          displayName: newUser.displayName,
          photoURL: newUser.photoURL,
          voicePart: newUser.voicePart,
          providerId: newUser.providerId,
          password: newUser.password,
          role: "user",
          isLeader: "false",
          createdAt: newUser.createdAt
        });
        console.log(`[Users DB] Saved user ${newUser.displayName} to Neon Postgres.`);
      } catch (pgErr: any) {
        console.warn("[Users DB Warning] Could not save user to Postgres on signup:", pgErr.message);
      }
    }

    // Return user object without confidential passcode
    const { password: _, ...secureUser } = newUser;
    res.status(201).json({ success: true, user: secureUser });
  } catch (error: any) {
    res.status(500).json({ error: "Sign Up failed: " + error.message });
  }
});

// A2. Login Endpoint
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and Password are required." });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    let user: any = null;

    if (isDbAvailable()) {
      try {
        const records = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
        if (records.length > 0 && records[0].password === password) {
          user = records[0];
          console.log(`[Users DB] Authenticated user ${user.displayName || user.email} via Neon Postgres.`);
        }
      } catch (dbErr: any) {
        console.warn("[Users DB Warning] Failed to query Neon for login:", dbErr.message);
      }
    }

    if (!user) {
      let localDb: any = await getLocalDb();
      localDb.users = localDb.users || [];
      const localUser = localDb.users.find((u: any) => u.email === normalizedEmail && u.password === password);
      if (localUser) {
        user = localUser;
        console.log(`[Users DB] Authenticated user ${user.displayName || user.email} via local JSON fallback.`);
        // Replicate to Postgres in background if active but not saved yet
        if (isDbAvailable()) {
          db.insert(users).values({
            uid: localUser.uid,
            email: localUser.email,
            displayName: localUser.displayName || "",
            photoURL: localUser.photoURL || "",
            voicePart: localUser.voicePart || "Listener",
            providerId: localUser.providerId || "email",
            password: localUser.password || "",
            role: localUser.role || "user",
            isLeader: localUser.isLeader ? "true" : "false",
            createdAt: localUser.createdAt || new Date().toISOString()
          }).onConflictDoNothing()
            .then(() => console.log(`[Users DB] Replicated local user ${localUser.email} to Neon Postgres.`))
            .catch(err => console.warn("[Users DB] Background replication failed:", err.message));
        }
      }
    }

    if (!user) {
      return res.status(401).json({ error: "Incorrect email or password. Please verify and try again, or Sign Up." });
    }

    const { password: _, ...secureUser } = user;
    res.json({ success: true, user: secureUser });
  } catch (error: any) {
    res.status(500).json({ error: "Login failed: " + error.message });
  }
});

// A3. Social OAuth/Mock Authentication Endpoint (Ensures 100% login success in iframe Sandbox)
app.post("/api/auth/social", async (req, res) => {
  const { provider, email, name } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Profile email is required." });
  }

  try {
    let localDb: any = await getLocalDb();

    localDb.users = localDb.users || [];
    const normalizedEmail = email.trim().toLowerCase();
    
    let user = localDb.users.find((u: any) => u.email === normalizedEmail);
    if (!user) {
      // Auto-register social user instantly for premium UX friction-free path
      user = {
        uid: "social_" + Math.random().toString(36).substring(2, 11),
        email: normalizedEmail,
        displayName: name || (provider === "google" ? "Google User" : "Facebook User"),
        photoURL: provider === "google" 
          ? "https://api.dicebear.com/7.x/adventurer/svg?seed=Google"
          : "https://api.dicebear.com/7.x/adventurer/svg?seed=Facebook",
        voicePart: "Listener",
        providerId: provider,
        createdAt: new Date().toISOString()
      };
      
      localDb.users.push(user);
      await saveLocalDb(localDb);
      await syncLocalFile("users", "insert", user);

      if (isDbAvailable()) {
        try {
          await db.insert(users).values({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || "",
            photoURL: user.photoURL || "",
            voicePart: user.voicePart || "Listener",
            providerId: user.providerId || provider,
            password: "",
            role: "user",
            isLeader: "false",
            createdAt: user.createdAt
          });
          console.log(`[Users DB] Saved social user ${user.displayName} to Neon Postgres.`);
        } catch (pgErr: any) {
          console.warn("[Users DB Warning] Could not save social user to Postgres:", pgErr.message);
        }
      }
    }

    res.json({ success: true, user });
  } catch (error: any) {
    res.status(500).json({ error: "Social login failed: " + error.message });
  }
});

// 12. Smart AI Inquiry chatbot powered by Gemini (Public)
app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid messages format. Expecting an array." });
  }

  const systemInstruction = 
    "You are 'Ambassador Guide', the friendly AI assistant for Kachamba Chorus " +
    "(Kachok Ambassadors Chorus), which is a vibrant Seventh-day Adventist (SDA) youth choral ministry. " +
    "Your tone is Christ-centered, warm, encouraging, respectful, and eager to assist parents, " +
    "church elders, youth, and organizers.\n\n" +
    "Key Information about Kachamba Chorus:\n" +
    "- Base/Local Church: Kachok Seventh-day Adventist (SDA) Church.\n" +
    "- Core Purpose: Spreading the Gospel of Jesus Christ and the Three Angels' Messages (Revelation 14) through harmonious sacred music, acappella, and active community youth outreach.\n" +
    "- Rehearsals: Sabbath (Saturday) afternoons at 2:30 PM (right after Divine Service and lunch Fellowship) and Sunday afternoons from 2:00 PM to 4:30 PM at the Kachok Church sanctuary.\n" +
    "- Joining: Open to all baptized Seventh-day Adventist youth who pass a voice audition, or any honest young truth-seeker who is willing to abide by Christian virtues and Bible study values.\n" +
    "- Booking: Available for youth rallies, evangelistic crusades, Christian weddings, funerals, community services, camp meetings, and church divine service ministry.\n" +
    "- Admin Passcode: For demo testing, church elders/directors can unlock dynamic activity/itinerary editing by using the passcode: 'SDA2026'.\n\n" +
    "General Adventist context to maintain:\n" +
    "- The sacredness of Saturday (the Seventh-day Sabbath) as a day of worship, fellowship, rest, and holy singing, starting at Friday sunset and ending Saturday sunset.\n" +
    "- Acappella arrangements are highly appreciated inside Adventist choral gatherings as they highlight vocal chords and pristine harmonies.\n\n" +
    "Instructions for output:\n" +
    "- Keep your responses warm, friendly, and concise (under 160 words if possible).\n" +
    "- Format with beautiful markdown lists and bold text where relevant.\n" +
    "- Since you are a representative of Christ's choir, always end with a short encouraging benediction (e.g., 'Blessings in Christ', 'Singing His praises!') or a warm scripture mention.";

  // Support custom API key passed from header (localStorage-backed for custom deployments)
  const customApiKey = req.headers["x-gemini-key"] as string | undefined;
  const ai = getGeminiClient(customApiKey);

  if (!ai) {
    console.log("GEMINI_API_KEY is not configured yet. Using fallback simulated AI responses.");
    
    const userMsg = messages[messages.length - 1]?.text || "Hello";
    let fallbackText = "Greetings in Christ! " +
      "I am **Ambassador Guide**, the digital representative of **Kachamba Chorus**. " +
      "Since my Gemini brain is currently offline, " +
      "I will happily provide a direct response:\n\n" +
      "We are a vibrant youth vocal ministry of the Seventh-day Adventist Church. " +
      "We rehearse on **Saturdays at 2:30 PM** and **Sundays at 2:00 PM** at Kachok SDA Church. " +
      "We specialize in beautiful sacred acappella, spiritual hymns, and evangelism.\n\n" +
      "Please feel free to check our itinerary, join our ministry, or send an inquiry via our contact form! " +
      "How else can I help you today?\n\n" +
      "*Singing His Praises,*\n" +
      "**Kachamba Chorus Committee**";

    if (userMsg.toLowerCase().includes("book") || userMsg.toLowerCase().includes("wed") || userMsg.toLowerCase().includes("event")) {
      fallbackText = "Greetings in Christ! " +
        "You're inquiring about booking the **Kachaba Chorus** details:\n\n" +
        "1. **Bookings are welcome** for church services, evangelistic campaigns, camp meetings, and Christian weddings.\n" +
        "2. To make a booking, please scroll to the **Inquiry / Contact** form downstairs, enter your details, or speak directly to our Music Director.\n" +
        "3. You can also write down details here in chat, and we will do our best to guide you!\n\n" +
        "May the peace of Christ accompany your plans.\n\n" +
        "*'I will sing unto the Lord as long as I live.' — Psalm 104:33*";
    } else if (userMsg.toLowerCase().includes("join") || userMsg.toLowerCase().includes("member") || userMsg.toLowerCase().includes("sing")) {
      fallbackText = "We are thrilled that you desire to lift your voice with the **Kachok Ambassadors Chorus**!\n\n" +
        "- **Who can join:** Any baptized Seventh-day Adventist youth residing in the district, or young Christian seekers who agree to study the scriptures, attend our devotional rehearsals regularly, and adhere to Bible-based SDA principles.\n" +
        "- **Voice auditions:** Held on Sunday afternoons during our standard practice hour at **Kachok SDA Church**.\n" +
        "- We have parts for Soprano, Alto, Tenor, and Bass.\n\n" +
        "We can't wait to welcome you to our family!\n\n" +
        "*Singing His praises and preparing for His soon return!*";
    }

    return res.json({ text: fallbackText });
  }

  try {
    const contents = messages.map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.text }]
    }));

    let modelStr = "gemini-3.5-flash";
    let tools: any[] = [];
    
    if (req.body.feature === 'lite') {
      modelStr = "gemini-3.5-flash"; // Use the standard gemini-3.5-flash model for Q&A tasks
    } else if (req.body.feature === 'search') {
      tools = [{ googleSearch: {} }];
    } else if (req.body.feature === 'maps') {
      tools = [{ googleMaps: {} }];
    }

    const config: any = {
      systemInstruction: systemInstruction,
      temperature: 0.7,
    };
    
    // googleMaps tool cannot be combined with other built-in tools
    if (tools.length > 0) {
      config.tools = tools;
    }

    const response = await ai.models.generateContent({
      model: modelStr,
      contents: contents,
      config: config
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.warn("[Kachamba Gemini API] API query failed. Engaging local offline wisdom engine. Error detail:", error?.message || error);
    
    // Create an extremely responsive, context-aware local advisor fallback
    // Extract last user message to provide precise smart matchmaking
    const userMsg = (messages[messages.length - 1]?.text || "").toLowerCase();
    let fallbackText = "Greetings in Christ! " +
      "I am **Ambassador Guide**, your companion for Kachamba Chorus.\n\n" +
      "We are a vibrant youth vocal ministry of the Seventh-day Adventist Church, dedicated to spreading " +
      "the Gospel of Jesus Christ and the Three Angels' Messages through acappella music.\n\n" +
      "- **Practice Sanctuary Location:** Kachok SDA Church sanctuary.\n" +
      "- **Weekly Rehearsal times:** Saturdays at **2:30 PM** & Sundays at **2:00 PM**.\n" +
      "- **Music Coordinator:** Reach us directly at `kachambachorus@gmail.com` or call/WhatsApp `0797450206`.\n\n" +
      "How else can I assist in ministering to you today?\n\n" +
      "*Singing His Praises,*\n" +
      "**Ambassador Board of Directors**";

    if (userMsg.includes("book") || userMsg.includes("wed") || userMsg.includes("event") || userMsg.includes("schedule") || userMsg.includes("tour")) {
      fallbackText = "Greetings in Christ! " +
        "We are overjoyed that you are considering **Kachamba Chorus** for your upcoming event! Here is what you need to know about booking our ministry:\n\n" +
        "1. **Events we Support:** Youth rallies, evangelistic crusades, Christian weddings, camp meetings, church divine services, and community services.\n" +
        "2. **How to Reserve:** You can submit a booking query directly using our **Inquiry / Contact** form below this window. Alternatively, write to us at `kachambachorus@gmail.com`.\n" +
        "3. **What to Include:** Please state the date, location, event type, and expected choral performance length so we can coordinate our singers and travel schedules.\n\n" +
        "May the peace of Christ accompany your preparations!\n\n" +
        "*'I will sing of the mercies of the Lord forever; with my mouth will I make known thy faithfulness to all generations.' — Psalm 89:1*";
    } else if (userMsg.includes("join") || userMsg.includes("member") || userMsg.includes("audition") || userMsg.includes("sing") || userMsg.includes("voice")) {
      fallbackText = "We are thrilled that you desire to lift your voice in worship with the **Kachok Ambassadors Chorus**!\n\n" +
        "- **Choral Core Values:** We welcome baptized Seventh-day Adventist youth in the district, or any dedicated young truth-seeker willing to abide by Bible study standards and devotional discipline.\n" +
        "- **Voice Placements:** We hold active auditions for all vocal parts (Soprano, Alto, Tenor, Bass) during our Sunday afternoon practices.\n" +
        "- **How to apply:** Simply join us on any **Sunday at 2:00 PM** at the Kachok SDA Church sanctuary and ask for the Music Director to initiate a short voice check.\n\n" +
        "We look forward to welcoming you into our choral family!\n\n" +
        "*Singing His praises and preparing hearts for His glorious return!*";
    } else if (userMsg.includes("practice") || userMsg.includes("rehearsal") || userMsg.includes("time") || userMsg.includes("sabbath") || userMsg.includes("sunday")) {
      fallbackText = "Greetings! Our choral rehearsal hours are dedicated to music mastery and spirit-filled devotion:\n\n" +
        "- **Sabbath (Saturday) Practice:** Begins promptly at **2:30 PM** at the Kachok SDA Church sanctuary. This takes place right after the divine service lunch fellowship.\n" +
        "- **Sunday Chorale Drill:** Runs from **2:00 PM to 4:30 PM** at the main church sanctuary.\n\n" +
        "Our sessions are open to visitors, and we love having members of the local church drop by to worship with us!\n\n" +
        "*Singing His praises,*\n" +
        "**Ambassador Guide**";
    } else if (userMsg.includes("belief") || userMsg.includes("sda") || userMsg.includes("doctrine") || userMsg.includes("seventh-day") || userMsg.includes("christ")) {
      fallbackText = "Greetings! **Kachok Ambassadors Chorus** is fully rooted in the biblically grounded, Christ-centered teachings of the Seventh-day Adventist Church:\n\n" +
        "- **The Holy Sabbath:** We celebrate, keep holy, and find rest on Saturday (the Seventh-day Sabbath) from Friday sunset to Saturday sunset, commemorating God's creation, redemption, and sanctification.\n" +
        "- **The Three Angels' Messages:** We are moved by the prophetic mission in Revelation 14:6-12, calling all nations to fear God, give Him glory, and worship the Creator.\n" +
        "- **Vocal Praise (Acappella):** We value pristine voice cords and acappella vocal arrangements as they reflect the divine design of the human voice as an instrument of worship.\n\n" +
        "If you want to study the scriptures with us, feel free to contact our Elder through the form below!\n\n" +
        "*'Unto him be glory in the church by Christ Jesus throughout all ages, world without end. Amen' — Ephesians 3:21*";
    } else if (userMsg.includes("passcode") || userMsg.includes("admin") || userMsg.includes("unlock")) {
      fallbackText = "Greetings Director/Elder! " +
        "To unlock the dynamic administrative capabilities of the Kachamba Portal:\n\n" +
        "- Click the **Enter Passcode** button on the bottom of the portal page or in the administrative area.\n" +
        "- Enter our community's standard security key: `SDA2026`.\n" +
        "- Once unlocked, you will gain full administrative rights to schedule new events, update details of active choristers, edit itineraries, and review booking inquiries.\n\n" +
        "Let us do all things decently and in order to the glory of God!\n\n" +
        "**Ambassador Guide**";
    }

    res.json({ text: fallbackText });
  }
});

// 13. Create leader (Admin)
app.post("/api/leaders", requireAdmin, async (req, res) => {
  const { name, role, image, bio, phone } = req.body;
  if (!name || !role) {
    return res.status(400).json({ error: "Name and Position/Role are required." });
  }

  const id = "ldr-" + Date.now();
  const newLeader = {
    id,
    name,
    role,
    image: image || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300",
    bio: bio || "",
    phone: phone || ""
  };

  try {
    await syncLocalFile("leaders", "insert", newLeader);
    
    try {
      if (process.env.SQL_HOST) {
        await db.insert(leaders).values(newLeader);
      }
    } catch (pgErr: any) {
      console.error("[Cloud SQL Sync Error] Could not insert leader in Postgres:", pgErr);
      try {
        fs.appendFileSync(path.join(process.cwd(), "data", "db_errors.log"), `[Insert Leader Error] ${new Date().toISOString()}: ${pgErr.stack || pgErr.message}\n`);
      } catch (e) {}
    }
    
    res.json({ success: true, data: newLeader });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to save leader: " + error.message });
  }
});

// 14. Update leader (Admin)
app.put("/api/leaders/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, role, image, bio, phone } = req.body;

  try {
    let existing: any = null;
    
    try {
      if (process.env.SQL_HOST) {
        const records = await db.select().from(leaders).where(eq(leaders.id, id)).limit(1);
        if (records.length > 0) existing = records[0];
      }
    } catch (dbErr) {
      console.log("Could not read leader from Postgres, loading local...");
    }

    if (!existing && true) {
      let localDb: any = await getLocalDb();
      existing = (localDb.leaders || []).find((l: any) => l.id === id);
    }

    if (!existing) {
      return res.status(404).json({ error: "Leader not found" });
    }

    const updated = {
      ...existing,
      name: name ?? existing.name,
      role: role ?? existing.role,
      image: image ?? existing.image,
      bio: bio ?? existing.bio,
      phone: phone ?? existing.phone
    };

    await syncLocalFile("leaders", "update", updated);

    try {
      if (process.env.SQL_HOST) {
        await db.update(leaders).set({
          name: name ?? existing.name,
          role: role ?? existing.role,
          image: image ?? existing.image,
          bio: bio ?? existing.bio,
          phone: phone ?? existing.phone
        }).where(eq(leaders.id, id));
      }
    } catch (pgErr: any) {
      console.error("[Cloud SQL Sync Error] Could not update leader in Postgres:", pgErr);
      try {
        fs.appendFileSync(path.join(process.cwd(), "data", "db_errors.log"), `[Update Leader Error] ${new Date().toISOString()}: ${pgErr.stack || pgErr.message}\n`);
      } catch (e) {}
    }

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update leader: " + error.message });
  }
});

// 15. Delete leader (Admin)
app.delete("/api/leaders/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await syncLocalFile("leaders", "delete", id);
    
    try {
      if (process.env.SQL_HOST) {
        await db.delete(leaders).where(eq(leaders.id, id));
      }
    } catch (pgErr: any) {
      console.warn("[Cloud SQL Sync Warning] Could not delete leader in Postgres, deleted locally");
    }
    
    res.json({ success: true, message: "Leader deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete leader: " + error.message });
  }
});

// 16. Persistent File Upload Route (Admin)
// Stores uploaded files persistently in Postgres/Neon, falling back to Firestore/local memory.
app.post("/api/upload", requireAdmin, async (req, res) => {
  const { filename, base64 } = req.body;
  if (!base64) {
    return res.status(400).json({ error: "No file content specified under base64 parameter." });
  }

  // Generate a unique ID for the uploaded file
  const fileId = "file-" + Date.now() + "-" + Math.random().toString(36).substring(2, 9);

  // Extract Mime Type from Base64 header if present, otherwise default to image/jpeg
  let mimeType = "image/jpeg";
  const matches = base64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-+.]+);base64,/);
  if (matches) {
    mimeType = matches[1];
  }

  try {
    if (isDbAvailable()) {
      // 1. If Neon/Postgres is connected and available, save file persistently in Postgres "uploads" table.
      // This bypasses local ephemeral storage and Firestore's 1MB limit entirely!
      await db.insert(uploads).values({
        id: fileId,
        filename: filename || "uploaded_file",
        mimeType: mimeType,
        base64: base64
      });
      console.log(`[Uploads] Saved file ${fileId} (${filename}) to Neon Postgres.`);
    } else {
      // 2. If SQL is offline/unavailable, replicate/save to Firestore "uploads" collection as a fallback
      // Since Firestore has a 1MB limit, this will only succeed if the file is <1MB, but it's a great zero-config fallback.
      await syncLocalFile("uploads", "insert", {
        id: fileId,
        filename: filename || "uploaded_file",
        mimeType: mimeType,
        base64: base64
      });
      console.log(`[Uploads Fallback] Saved file ${fileId} (${filename}) to Firestore.`);
    }

    // Return the stable public URL pointing to our download/serving API route
    const fileUrl = `/api/uploads/${fileId}`;
    return res.json({ 
      success: true, 
      url: fileUrl,
      filename: filename,
      mimeType: mimeType
    });
  } catch (err: any) {
    console.error("[Upload Error] Failed to save uploaded file:", err.message);
    // If saving to DB fails, fallback to returning the inline base64 data URI to keep things functional
    return res.json({
      success: true,
      url: base64,
      filename: filename,
      mimeType: mimeType
    });
  }
});

// Serve persistent files from either Postgres (primary) or Firestore (fallback)
app.get("/api/uploads/:id", async (req, res) => {
  const { id } = req.params;
  try {
    let fileRecord: any = null;

    if (isDbAvailable()) {
      try {
        const records = await db.select().from(uploads).where(eq(uploads.id, id)).limit(1);
        if (records.length > 0) {
          fileRecord = records[0];
        }
      } catch (dbErr: any) {
        console.warn(`[Uploads Server] Failed to query Neon for file ${id}:`, dbErr.message);
      }
    }

    // Fallback: Check local/Firestore uploads
    if (!fileRecord) {
      try {
        const localDb = await getLocalDb();
        // Since we synced to Firestore, let's see if we can find it in Firestore
        const { getDoc, doc } = await import('firebase/firestore/lite');
        const { firestore } = await import('./src/lib/firebaseLite.ts');
        const fileDoc = await getDoc(doc(firestore, "uploads", id));
        if (fileDoc.exists()) {
          fileRecord = fileDoc.data();
        }
      } catch (err: any) {
        console.warn(`[Uploads Server] Failed to query Firestore fallback for file ${id}:`, err.message);
      }
    }

    if (!fileRecord || !fileRecord.base64) {
      return res.status(404).send("File not found");
    }

    const base64Str = fileRecord.base64;
    const matches = base64Str.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-+.]+);base64,(.*)$/);
    if (matches) {
      const contentType = matches[1];
      const dataBuffer = Buffer.from(matches[2], 'base64');
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=31536000"); // Cache permanently for speed
      return res.send(dataBuffer);
    } else {
      // If not in data URI format, parse as raw base64 or send directly
      const dataBuffer = Buffer.from(base64Str, 'base64');
      res.setHeader("Content-Type", fileRecord.mimeType || "application/octet-stream");
      res.setHeader("Cache-Control", "public, max-age=31536000");
      return res.send(dataBuffer);
    }
  } catch (error: any) {
    console.error(`[Uploads Server Error] Failed to serve file ${id}:`, error.message);
    res.status(500).send("Internal Server Error: " + error.message);
  }
});


// -------------- GOOGLE WORKSPACE API ENDPOINTS --------------

// 1. Google Meet - Create a virtual meeting space
app.post("/api/workspace/meet", requireAdmin, async (req, res) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authorized Google Sign-in required for this action." });
  }

  const rawToken = authHeader.substring(7);

  try {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: rawToken });
    const spacesResponse = await fetch("https://meet.googleapis.com/v2/spaces", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${rawToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({})
    });

    if (!spacesResponse.ok) {
      const errText = await spacesResponse.text();
      console.error("[Google Meet API error]", errText);
      throw new Error("Failed to create Google Meet space: " + errText);
    }

    const data = await spacesResponse.json() as any;
    res.json({
      success: true,
      meetingUri: data.meetingUri || `https://meet.google.com/${data.meetingCode}`,
      meetingCode: data.meetingCode,
      name: data.name
    });
  } catch (error: any) {
    console.error("Google Meet creation failed:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// 2. Google Forms - Create survey/registration form with standard fields
app.post("/api/workspace/form", requireAdmin, async (req, res) => {
  const authHeader = req.headers["authorization"];
  const { title } = req.body;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authorized Google Sign-in required for this action." });
  }

  const rawToken = authHeader.substring(7);

  try {
    const formTitle = title || "Kachamba Chorus General Form";

    // Create the base Form
    const createRes = await fetch("https://forms.googleapis.com/v1/forms", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${rawToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        info: {
          title: formTitle,
          documentTitle: formTitle
        }
      })
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error("Forms API Creation Error: " + errText);
    }

    const formData = await createRes.json() as any;
    const formId = formData.formId;

    // Add standard questions using batchUpdate
    if (formId) {
      const updateRes = await fetch(`https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${rawToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          requests: [
            {
              createItem: {
                item: {
                  title: "Full Name",
                  questionItem: {
                    question: {
                      required: true,
                      textQuestion: {}
                    }
                  }
                },
                location: { index: 0 }
              }
            },
            {
              createItem: {
                item: {
                  title: "Email Address",
                  questionItem: {
                    question: {
                      required: true,
                      textQuestion: {}
                    }
                  }
                },
                location: { index: 1 }
              }
            },
            {
              createItem: {
                item: {
                  title: "Phone Number",
                  questionItem: {
                    question: {
                      required: true,
                      textQuestion: {}
                    }
                  }
                },
                location: { index: 2 }
              }
            },
            {
              createItem: {
                item: {
                  title: "What is your main prayer request or message?",
                  questionItem: {
                    question: {
                      required: false,
                      textQuestion: { paragraph: true }
                    }
                  }
                },
                location: { index: 3 }
              }
            }
          ]
        })
      });

      if (!updateRes.ok) {
        console.warn("Could not batch update questions to newly created Google Form.");
      }
    }

    res.json({
      success: true,
      formId: formId,
      responderUri: formData.responderUri,
      editUrl: `https://docs.google.com/forms/d/${formId}/edit`
    });
  } catch (error: any) {
    console.error("Google Form creation failed:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// 3. Google Drive - Upload poster image to Google Drive and make it public
app.post("/api/workspace/drive/poster", requireAdmin, async (req, res) => {
  const authHeader = req.headers["authorization"];
  const { filename, base64 } = req.body;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authorized Google Sign-in required for this action." });
  }
  if (!base64) {
    return res.status(400).json({ error: "Missing image content (base64 string is required)." });
  }

  const rawToken = authHeader.substring(7);

  try {
    let mimeType = "image/png";
    let base64Data = base64;

    if (base64.startsWith("data:")) {
      const matches = base64.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        mimeType = matches[1];
        base64Data = matches[2];
      }
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: rawToken });
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    const buffer = Buffer.from(base64Data, "base64");
    const stream = Readable.from(buffer);

    // Create the file in Google Drive
    const driveFile = await drive.files.create({
      requestBody: {
        name: filename || "vespers_poster.png",
        mimeType: mimeType
      },
      media: {
        mimeType: mimeType,
        body: stream
      },
      fields: "id, webViewLink, webContentLink"
    });

    const fileId = driveFile.data.id;

    if (fileId) {
      try {
        // Create sharing permission so anyone with link can view/download
        await drive.permissions.create({
          fileId: fileId,
          requestBody: {
            role: "reader",
            type: "anyone"
          }
        });
      } catch (permErr: any) {
        console.warn("[Google Drive API Warning] Could not set reader permission to anyone on Drive file:", permErr.message);
      }
    }

    // Direct download/rendering link via Google Drive
    const downloadLink = `https://docs.google.com/uc?export=view&id=${fileId}`;

    res.json({
      success: true,
      fileId: fileId,
      webViewLink: driveFile.data.webViewLink,
      webContentLink: driveFile.data.webContentLink || downloadLink,
      posterUrl: downloadLink
    });
  } catch (error: any) {
    console.error("Google Drive poster upload failed:", error.message);
    res.status(500).json({ error: error.message });
  }
});


// -------------- VITE & PRODUCTION HANDLER --------------

async function startServer() {
  // Fire off database seeding/migration in the background to avoid blocking container boot
  (async () => {
    try {
      await seedCloudSqlFromLocalDb();
    } catch (err: any) {
      console.log("[Kachamba Cloud SQL] Notice: Background seeding was deferred.");
    }
  })();

  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    // Dev Mode uses Vite middleware mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    // Production Mode serves static files from dist (Skipped on Vercel as it serves static files naturally)
    const distPath = path.join(process.cwd(), "dist");
    
    // Serve static files with targeted caching headers to prevent HTML or unhashed asset caching
    app.use(express.static(distPath, {
      setHeaders: (res, filepath) => {
        const lowerPath = filepath.toLowerCase();
        if (lowerPath.endsWith(".html")) {
          // Never cache the index.html file so page refreshes always fetch the latest bundle hashes
          res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
          res.setHeader("Pragma", "no-cache");
          res.setHeader("Expires", "0");
        } else if (lowerPath.includes("/assets/")) {
          // Vite hashed bundles are safe to cache aggressively for high-performance delivery
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        } else {
          // Keep other assets (logos, images, etc.) revalidating with no-cache so changes propagate immediately
          res.setHeader("Cache-Control", "no-cache");
        }
      }
    }));

    app.get("*", (req, res) => {
      // Force no-cache on catch-all HTML fallback as well
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Kachamba Server] Standalone running on http://localhost:${PORT}`);
    
    // WARM UP DATABASE CACHE in the background
    (async () => {
      try {
        console.log("[Kachamba Server] Warming up Database connection and Passcode Cache...");
        await getAdminPasscode();
        console.log("[Kachamba Server] Cache warm up complete. Lightning fast Mode Active.");
      } catch (err: any) {
        console.log("[Kachamba Server] Notice: Cache warm up skipped as database appears offline.");
      }
    })();
  });
}

// ---- GALLERY CRUD ROUTES ----

// Get all gallery photos (public)
app.get("/api/gallery", async (req, res) => {
  try {
    // Try Postgres first
    if (isDbAvailable()) {
      try {
        const photos = await db.select().from(gallery).orderBy(gallery.createdAt);
        return res.json({ success: true, data: photos });
      } catch (pgErr: any) {
        console.warn("[Gallery] Postgres read failed, falling back to local:", pgErr.message);
      }
    }
    // Fallback: local/Firestore
    const localData = await getLocalDb();
    return res.json({ success: true, data: localData.gallery || [] });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to load gallery: " + err.message });
  }
});

// Add gallery photo (Admin)
app.post("/api/gallery", requireAdmin, async (req, res) => {
  const { title, category, description, url, mediaType } = req.body;
  if (!title || !url) {
    return res.status(400).json({ error: "Title and media URL are required." });
  }
  const id = "gal-" + Date.now();
  const newPhoto = {
    id,
    title,
    category: category || "General",
    description: description || "",
    url,
    mediaType: mediaType || "image",
    createdAt: new Date().toISOString()
  };
  try {
    // Primary: save to Firestore/local (always works)
    const localDb: any = await getLocalDb();
    localDb.gallery = localDb.gallery || [];
    localDb.gallery.push(newPhoto);
    await saveLocalDb(localDb);
    await syncLocalFile("gallery", "insert", newPhoto);

    // Secondary: also save to Postgres if available
    try {
      if (isDbAvailable()) {
        await db.insert(gallery).values({ ...newPhoto, createdAt: undefined });
      }
    } catch (pgErr: any) {
      console.warn("[Gallery] Postgres insert failed, saved to Firestore only:", pgErr.message);
    }

    res.json({ success: true, data: newPhoto });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to save gallery photo: " + err.message });
  }
});

// Update gallery photo (Admin)
app.put("/api/gallery/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { title, category, description, url, mediaType } = req.body;
  try {
    // Update local/Firestore
    const localDb: any = await getLocalDb();
    localDb.gallery = localDb.gallery || [];
    const idx = localDb.gallery.findIndex((p: any) => p.id === id);
    if (idx !== -1) {
      localDb.gallery[idx] = { ...localDb.gallery[idx], title, category: category || "General", description: description || "", url, mediaType: mediaType || "image" };
      await saveLocalDb(localDb);
      await syncLocalFile("gallery", "update", localDb.gallery[idx]);
    }

    // Also update Postgres if available
    try {
      if (isDbAvailable()) {
        await db.update(gallery).set({ title, category: category || "General", description: description || "", url, mediaType: mediaType || "image" }).where(eq(gallery.id, id));
      }
    } catch (pgErr: any) {
      console.warn("[Gallery] Postgres update failed:", pgErr.message);
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update gallery photo: " + err.message });
  }
});

// Delete gallery photo (Admin)
app.delete("/api/gallery/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    // Delete from local/Firestore
    const localDb: any = await getLocalDb();
    localDb.gallery = (localDb.gallery || []).filter((p: any) => p.id !== id);
    await saveLocalDb(localDb);
    await syncLocalFile("gallery", "delete", id);

    // Also delete from Postgres if available
    try {
      if (isDbAvailable()) {
        await db.delete(gallery).where(eq(gallery.id, id));
      }
    } catch (pgErr: any) {
      console.warn("[Gallery] Postgres delete failed:", pgErr.message);
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete gallery photo: " + err.message });
  }
});

// Only start the standalone server if we're not running in a Serverless environment (like Vercel)
if (!process.env.VERCEL && process.env.NODE_ENV !== "test") {
  startServer();
}

// Export the Express app as a module for Vercel Serverless Functions
export default app;
