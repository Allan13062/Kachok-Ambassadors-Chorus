import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import fs from "fs";
import http from "http";
import https from "https";
import url from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

import { db } from "./src/db/index.ts";
import { activities, itinerary, leaders, inquiries, musicConfig, adminConfig } from "./src/db/schema.ts";
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
app.use(express.json({ limit: "150mb" }));
app.use(express.urlencoded({ limit: "150mb", extended: true }));

// Enable CORS for all routes (to support preview iframe canvas drawing and cropping)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-admin-passcode");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Serve uploads folder statically with proper CORS headers
app.use("/uploads", (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
}, express.static(uploadsDir));

// Fast In-Memory Passcode Cache to prevent Database slowness
let cachedPasscode: string | null = null;
let passcodeCacheTime: number = 0;

async function getAdminPasscode(): Promise<string> {
  // Ultra-fast response: If cached in memory, return instantly.
  if (cachedPasscode) {
    return cachedPasscode;
  }
  
  if (!process.env.SQL_HOST) {
    return "SDA2026";
  }
  
  try {
    const passcodeRecords = await db.select().from(adminConfig).where(eq(adminConfig.key, "passcode")).limit(1);
    const dbPasscode = passcodeRecords && passcodeRecords.length > 0 ? passcodeRecords[0].value : "SDA2026";
    
    cachedPasscode = dbPasscode;
    passcodeCacheTime = Date.now();
    return dbPasscode;
  } catch (error) {
    // Silently fallback if DB is not configured or reachable.
    return "SDA2026"; // Return fallback but do NOT cache it permanently!
  }
}

// Authentication middleware using Cloud SQL Configuration with Caching
async function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const code = req.headers["x-admin-passcode"] as string;
  try {
    const dbPasscode = await getAdminPasscode();
    if (code && code === dbPasscode) {
      next();
    } else {
      res.status(401).json({ error: "Unauthorized: Invalid admin passcode" });
    }
  } catch (error) {
    res.status(500).json({ error: "Authentication database query failed." });
  }
}

// Lazy load Gemini AI to prevent crash if key is missing on startup
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === "MY_GEMINI_API_KEY") {
    return null;
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
}

// -------------- CLOUD SQL SEEDER --------------

async function seedCloudSqlFromLocalDb() {
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
      if (fs.existsSync(DB_PATH)) {
        const localData = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));

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
  } catch (error) {
    console.error("[Kachamba Cloud SQL] Failed to seed/validate Cloud SQL tables:", error);
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

    // Fast-fail if DB is fully down to maintain high performance
    const dbPromise = Promise.all([
      db.select().from(activities),
      db.select().from(itinerary),
      db.select().from(leaders),
      db.select().from(musicConfig).where(eq(musicConfig.id, 1)).limit(1)
    ]);

    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("DB Load Timeout")), 12000));
    
    // @ts-ignore
    const [allActs, allIti, allLdr, musicRecs] = await Promise.race([dbPromise, timeoutPromise]);

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
    if (isAdmin) {
      inquiriesList = await db.select().from(inquiries);
      inquiriesList.sort((a, b) => (b.id || "").localeCompare(a.id || ""));
    }

    res.json({
      activities: allActs,
      itinerary: allIti,
      music,
      leaders: allLdr,
      inquiries: inquiriesList
    });
  } catch (error: any) {
    if (fs.existsSync(DB_PATH)) {
      try {
        const localData = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
        
        // Populate missing sections with empty arrays just in case
        localData.activities = localData.activities || [];
        localData.itinerary = localData.itinerary || [];
        localData.leaders = localData.leaders || [];
        localData.inquiries = localData.inquiries || [];
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
      res.json({ success: true, message: "Welcome Elder/Ambassador Director!" });
    } else {
      res.status(401).json({ error: "Incorrect passcode. Please try again." });
    }
  } catch (error: any) {
    res.status(500).json({ error: "Authentication failed: " + error.message });
  }
});

// Update passcode (Requires Admin or Recovery Key)
app.post("/api/auth/reset", async (req, res) => {
  const { newPasscode, recoveryKey, currentPasscode } = req.body;
  
  try {
    const dbPasscode = await getAdminPasscode();

    // Allow reset if they know the current passcode OR a recovery key ("KACHAMBA2026")
    if (currentPasscode === dbPasscode || recoveryKey === "KACHAMBA2026") {
      if (!newPasscode || newPasscode.length < 4) {
        return res.status(400).json({ error: "New passcode must be at least 4 characters." });
      }

      await db.insert(adminConfig)
        .values({ key: "passcode", value: newPasscode, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: adminConfig.key,
          set: { value: newPasscode, updatedAt: new Date() }
        });

      // Crucial: Update memory cache so next request is instantly validated
      cachedPasscode = newPasscode;
      passcodeCacheTime = Date.now();

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
    const configs = await db.select().from(adminConfig);
    const configMap = configs.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);

    res.json({
      tillNumber: configMap["mpesa_till"] || "4119041",
      tillName: configMap["mpesa_name"] || "Kachok Ambassadors Chorus",
      tillImage: configMap["mpesa_image"] || "",
      tillType: configMap["mpesa_type"] || "buy_goods"
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to load M-pesa billing configurations: " + error.message });
  }
});

// PUT M-Pesa Config (Requires Admin)
app.put("/api/mpesa/config", requireAdmin, async (req, res) => {
  const { tillNumber, tillName, tillImage, tillType } = req.body;
  try {
    const upsertConfig = async (key: string, value: string) => {
      await db.insert(adminConfig)
        .values({ key, value, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: adminConfig.key,
          set: { value, updatedAt: new Date() }
        });
    };

    if (tillNumber !== undefined) await upsertConfig("mpesa_till", String(tillNumber));
    if (tillName !== undefined) await upsertConfig("mpesa_name", String(tillName));
    if (tillImage !== undefined) await upsertConfig("mpesa_image", String(tillImage));
    if (tillType !== undefined) await upsertConfig("mpesa_type", String(tillType));

    res.json({ success: true, message: "M-pesa billing configuration updated successfully." });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to save M-pesa billing configurations: " + error.message });
  }
});

// POST M-Pesa STK Push Request
app.post("/api/mpesa/stkpush", async (req, res) => {
  let { phone, amount } = req.body;
  if (!phone || !amount) {
    return res.status(400).json({ error: "Phone number and amount are required." });
  }

  // Standardize phone number format: must be 2547XXXXXXXX or 2541XXXXXXXX
  let formattedPhone = phone.trim().replace(/\+/g, "");
  if (formattedPhone.startsWith("0")) {
    formattedPhone = "254" + formattedPhone.substring(1);
  } else if (formattedPhone.startsWith("7") || formattedPhone.startsWith("1")) {
    formattedPhone = "254" + formattedPhone;
  }

  // Validate phone number format (2547... or 2541...)
  if (!/^254(7|1)\d{8}$/.test(formattedPhone)) {
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
  
  // Read till details from database
  let databaseTill = "4119041";
  let databaseType = "buy_goods";
  try {
    const records = await db.select().from(adminConfig);
    const tillRecord = records.find(r => r.key === "mpesa_till");
    const typeRecord = records.find(r => r.key === "mpesa_type");
    if (tillRecord) databaseTill = tillRecord.value;
    if (typeRecord) databaseType = typeRecord.value;
  } catch (e) {
    console.log("Could not read till config from DB, using fallback", e);
  }

  const mpesaShortCode = process.env.MPESA_SHORTCODE || databaseTill;

  // Check if real keys are supplied to execute authentic request
  const useRealMpesa = mpesaConsumerKey && mpesaConsumerKey !== "MY_MPESA_KEY" && mpesaConsumerSecret && mpesaPasskey;

  if (useRealMpesa) {
    try {
      console.log(`[STK Push] Initiating real STK push for ${formattedPhone}, amount: KES ${numericAmount}`);
      
      // Step 1: Generate Access Token
      const isProd = process.env.MPESA_ENV === "production";
      const baseUrl = isProd ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";
      
      const auth = Buffer.from(`${mpesaConsumerKey}:${mpesaConsumerSecret}`).toString("base64");
      
      const tokenResponse = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
        method: "GET",
        headers: {
          "Authorization": `Basic ${auth}`
        }
      });

      if (!tokenResponse.ok) {
        const errMsg = await tokenResponse.text();
        throw new Error("Failed Safaricom OAuth generation request: " + errMsg);
      }

      const tokenData = await tokenResponse.json() as any;
      const accessToken = tokenData.access_token;

      // Step 2: Trigger STK Push
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
      const password = Buffer.from(`${mpesaShortCode}${mpesaPasskey}${timestamp}`).toString("base64");
      
      // Paybill uses CustomerPayBillOnline (4887), Buy Goods (Till) uses CustomerBuyGoodsOnline (112)
      const transactionType = databaseType === "paybill" ? "CustomerPayBillOnline" : "CustomerBuyGoodsOnline";
      
      const mpesaAppUrl = process.env.APP_URL || "https://example.com";
      const callbackUrl = `${mpesaAppUrl.replace(/\/$/, "")}/api/mpesa/callback`;

      const stkPayload = {
        BusinessShortCode: mpesaShortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: transactionType,
        Amount: numericAmount,
        PartyA: formattedPhone,
        PartyB: mpesaShortCode,
        PhoneNumber: formattedPhone,
        CallBackURL: callbackUrl,
        AccountReference: "Kachamba Chorus",
        TransactionDesc: "Choir Support Contribution"
      };

      const pushResponse = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(stkPayload)
      });

      if (!pushResponse.ok) {
        const pushErr = await pushResponse.text();
        throw new Error("Safaricom processRequest failure: " + pushErr);
      }

      const pushResult = await pushResponse.json() as any;
      console.log("[STK Push] Real push successfully executed:", pushResult);

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
      return res.status(502).json({
        error: "Safaricom M-Pesa Link Error: " + err.message,
        clarification: "Check if your MPESA Consumer Key, Secret, and Passkey are correct in Cloud environment variables."
      });
    }
  } else {
    // Graceful local/sandbox simulator (returns mock structure for immediate UI preview)
    console.log(`[STK Push] Simulating Daraja STK Push for ${formattedPhone}, amount: KES ${numericAmount}`);
    
    return res.json({
      success: true,
      realApi: false,
      message: "STK push stimulated successfully! A simulated STK push prompt of KES " + numericAmount + " has been sent to " + formattedPhone + ". (Since no API keys are configured, this is simulated).",
      merchantRequestId: "ws_CO_" + Date.now().toString().slice(3),
      checkoutRequestId: "ws_CH_" + Math.random().toString(36).substring(2, 10).toUpperCase(),
      responseDescription: "Success. Request accepted for processing"
    });
  }
});

// dummy callback endpoint
app.post("/api/mpesa/callback", (req, res) => {
  console.log("[M-Pesa Callback Receipt]:", JSON.stringify(req.body));
  res.json({ ResultCode: 0, ResultDesc: "Callback accepted successfully" });
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
    await db.insert(inquiries).values(newInq);
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
    const existing = await db.select().from(inquiries).where(eq(inquiries.id, id)).limit(1);
    if (existing.length === 0) {
      return res.status(404).json({ error: "Inquiry not found" });
    }

    const updated = {
      ...existing[0],
      status: status || "Read"
    };

    await db.update(inquiries).set({ status: status || "Read" }).where(eq(inquiries.id, id));
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update inquiry status: " + error.message });
  }
});

// 5. Delete an inquiry (Admin)
app.delete("/api/inquiries/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await db.delete(inquiries).where(eq(inquiries.id, id));
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
    await db.insert(activities).values(newAct);
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
    const existing = await db.select().from(activities).where(eq(activities.id, id)).limit(1);
    if (existing.length === 0) {
      return res.status(404).json({ error: "Activity not found" });
    }

    const updated = {
      ...existing[0],
      title: title ?? existing[0].title,
      date: date ?? existing[0].date,
      location: location ?? existing[0].location,
      description: description ?? existing[0].description,
      category: category ?? existing[0].category,
      image: image ?? existing[0].image,
      mediaType: mediaType ?? existing[0].mediaType ?? "image"
    };

    await db.update(activities).set({
      title: title ?? existing[0].title,
      date: date ?? existing[0].date,
      location: location ?? existing[0].location,
      description: description ?? existing[0].description,
      category: category ?? existing[0].category,
      image: image ?? existing[0].image,
      mediaType: mediaType ?? existing[0].mediaType ?? "image"
    }).where(eq(activities.id, id));

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update activity: " + error.message });
  }
});

// 8. Delete activity (Admin)
app.delete("/api/activities/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await db.delete(activities).where(eq(activities.id, id));
    res.json({ success: true, message: "Activity deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete activity: " + error.message });
  }
});

// 9. Create itinerary item (Admin)
app.post("/api/itinerary", requireAdmin, async (req, res) => {
  const { event, date, time, location, host, status, notes, mediaUrl, mediaType } = req.body;
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
    await db.insert(itinerary).values(newIti);
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
    const existing = await db.select().from(itinerary).where(eq(itinerary.id, id)).limit(1);
    if (existing.length === 0) {
      return res.status(404).json({ error: "Itinerary item not found" });
    }

    const updated = {
      ...existing[0],
      event: event ?? existing[0].event,
      date: date ?? existing[0].date,
      time: time ?? existing[0].time,
      location: location ?? existing[0].location,
      host: host ?? existing[0].host,
      status: status ?? existing[0].status,
      notes: notes ?? existing[0].notes,
      mediaUrl: mediaUrl !== undefined ? mediaUrl : existing[0].mediaUrl,
      mediaType: mediaType !== undefined ? mediaType : existing[0].mediaType
    };

    await db.update(itinerary).set({
      event: event ?? existing[0].event,
      date: date ?? existing[0].date,
      time: time ?? existing[0].time,
      location: location ?? existing[0].location,
      host: host ?? existing[0].host,
      status: status ?? existing[0].status,
      notes: notes ?? existing[0].notes,
      mediaUrl: mediaUrl !== undefined ? mediaUrl : existing[0].mediaUrl,
      mediaType: mediaType !== undefined ? mediaType : existing[0].mediaType
    }).where(eq(itinerary.id, id));

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update itinerary item: " + error.message });
  }
});

// 11. Delete itinerary item (Admin)
app.delete("/api/itinerary/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await db.delete(itinerary).where(eq(itinerary.id, id));
    res.json({ success: true, message: "Itinerary item deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete itinerary item: " + error.message });
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

  const ai = getGeminiClient();

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
      modelStr = "gemini-3.1-flash-lite";
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
    console.error("Gemini production API error:", error);
    res.status(500).json({ error: "Failed to query Ambassador AI. " + error.message });
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
    await db.insert(leaders).values(newLeader);
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
    const existing = await db.select().from(leaders).where(eq(leaders.id, id)).limit(1);
    if (existing.length === 0) {
      return res.status(404).json({ error: "Leader not found" });
    }

    const updated = {
      ...existing[0],
      name: name ?? existing[0].name,
      role: role ?? existing[0].role,
      image: image ?? existing[0].image,
      bio: bio ?? existing[0].bio,
      phone: phone ?? existing[0].phone
    };

    await db.update(leaders).set({
      name: name ?? existing[0].name,
      role: role ?? existing[0].role,
      image: image ?? existing[0].image,
      bio: bio ?? existing[0].bio,
      phone: phone ?? existing[0].phone
    }).where(eq(leaders.id, id));

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update leader: " + error.message });
  }
});

// 15. Delete leader (Admin)
app.delete("/api/leaders/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await db.delete(leaders).where(eq(leaders.id, id));
    res.json({ success: true, message: "Leader deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete leader: " + error.message });
  }
});

// 16. Local File Upload Route (Admin)
app.post("/api/upload", requireAdmin, async (req, res) => {
  const { filename, base64 } = req.body;
  if (!base64) {
    return res.status(400).json({ error: "No file content specified under base64 parameter." });
  }

  // SERVERLESS OPTIMIZATION: On Vercel, the filesystem is read-only.
  // Instead of saving to disk, we return the Base64 Data URI directly to be stored in the Postgres database.
  if (process.env.VERCEL) {
    return res.json({ 
      success: true, 
      url: base64, // The UI will store this Data URI directly in the database
      filename: filename,
      mimeType: ""
    });
  }

  try {
    let mimeType = "";
    let base64Data = base64;

    if (base64.startsWith("data:")) {
      const matches = base64.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        mimeType = matches[1];
        base64Data = matches[2];
      } else {
        return res.status(400).json({ error: "Invalid data URL base64 format." });
      }
    }

    const buffer = Buffer.from(base64Data, "base64");

    // Standard extensions detection
    let ext = "bin";
    if (mimeType) {
      if (mimeType.includes("image/jpeg") || mimeType.includes("image/jpg")) ext = "jpg";
      else if (mimeType.includes("image/png")) ext = "png";
      else if (mimeType.includes("image/gif")) ext = "gif";
      else if (mimeType.includes("image/webp")) ext = "webp";
      else if (mimeType.includes("video/mp4")) ext = "mp4";
      else if (mimeType.includes("video/webm")) ext = "webm";
      else if (mimeType.includes("video/quicktime") || mimeType.includes("video/mov")) ext = "mov";
    }

    // Fallback detection from original filename
    if (ext === "bin" && filename) {
      const parts = filename.split(".");
      if (parts.length > 1) {
        ext = parts[parts.length - 1].toLowerCase();
      }
    }

    // Generate neat, unique timestamped filename on the disk
    const uniqueId = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const diskFilename = `upload_${uniqueId}.${ext}`;
    const filePath = path.join(process.cwd(), "uploads", diskFilename);

    await fs.promises.writeFile(filePath, buffer);

    res.json({ 
      success: true, 
      url: `/uploads/${diskFilename}`,
      filename: diskFilename,
      mimeType: mimeType
    });
  } catch (error: any) {
    console.error("Local file writing failure:", error);
    res.status(500).json({ error: "Internal server failed to write uploaded file resource: " + error.message });
  }
});


// -------------- VITE & PRODUCTION HANDLER --------------

async function startServer() {
  // Gracefully seed / migrate JSON entries to Cloud SQL Postgres on container boot
  await seedCloudSqlFromLocalDb();

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
    app.use(express.static(distPath));
  app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  
  // WARM UP DATABASE CACHE: Fetch the passcode once before taking traffic
  // This prevents the expensive DB connection cold start on the first user action
  try {
    console.log("[Kachamba Server] Warming up Database connection and Passcode Cache...");
    await getAdminPasscode();
    console.log("[Kachamba Server] Cache warm up complete. Lightning fast Mode Active.");
  } catch (err: any) {
    console.error("[Kachamba Server] Cache warm up skipped:", err.message);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Kachamba Server] Standalone running on http://localhost:${PORT}`);
  });
}

// Only start the standalone server if we're not running in a Serverless environment (like Vercel)
if (!process.env.VERCEL && process.env.NODE_ENV !== "test") {
  startServer();
}

// Export the Express app as a module for Vercel Serverless Functions
export default app;
