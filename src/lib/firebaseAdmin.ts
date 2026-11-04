// Server-only Firebase Admin SDK wiring.
//
// This is what actually lets the Express server verify a Firebase ID token and
// read/write Firestore as an authenticated backend - bypassing firestore.rules
// the way the rules file's own comments always assumed it would ("written
// exclusively by the Express server via the Firebase Admin SDK"). Previously
// `firebase-admin` was installed but never imported anywhere, so that never
// actually happened; every server write went through the *client* SDK instead,
// which the rules reject.
//
// Firestore is now used ONLY for auth-related data from this app: the admin
// passcode/config doc, login sessions, and the user accounts collection. Every
// other collection (activities, itinerary, gallery, etc.) lives in Neon/Postgres.
//
// REQUIRED ENV VAR (set this in Vercel -> Project -> Settings -> Environment Variables):
//   FIREBASE_SERVICE_ACCOUNT_KEY = the full JSON contents of a service account key,
//   downloaded from Firebase Console -> Project Settings -> Service Accounts ->
//   "Generate new private key". Paste the whole JSON file as the value.
//
// Alternative (if your platform dislikes multi-line JSON secrets), set these three instead:
//   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
//
// Until one of those is set, admin-token verification and Firestore auth storage
// fail closed (return null/false) and the app falls back to the legacy shared
// passcode (ADMIN_PASSCODE env var) for admin access - see requireAdmin in server.ts.

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import crypto from "crypto";

let app: App | null = null;
let initAttempted = false;
let lastInitError: string | null = null;

let cachedGoogleCerts: Record<string, string> | null = null;
let googleCertsExpiry = 0;

async function getGooglePublicCerts(): Promise<Record<string, string>> {
  if (cachedGoogleCerts && Date.now() < googleCertsExpiry) {
    return cachedGoogleCerts;
  }
  const res = await fetch("https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com");
  if (!res.ok) throw new Error(`Failed to fetch Google certs: HTTP ${res.status}`);
  const certs = (await res.json()) as Record<string, string>;
  cachedGoogleCerts = certs;
  googleCertsExpiry = Date.now() + 6 * 60 * 60 * 1000;
  return certs;
}

export async function verifyFirebaseTokenWithPublicKeys(idToken: string): Promise<any | null> {
  if (!idToken || typeof idToken !== "string") return null;
  const parts = idToken.split(".");
  if (parts.length !== 3) return null;

  try {
    const header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));

    if (header.alg !== "RS256" || !header.kid) return null;

    const projectId = process.env.FIREBASE_PROJECT_ID || "kachamba-chorus";
    const nowSec = Math.floor(Date.now() / 1000);

    // Validate token expiry, audience and issuer
    if (payload.exp && payload.exp < nowSec) return null;
    if (payload.aud !== projectId) return null;
    if (payload.iss !== `https://securetoken.google.com/${projectId}`) return null;

    const certs = await getGooglePublicCerts();
    const cert = certs[header.kid];
    if (!cert) return null;

    const verifier = crypto.createVerify("RSA-SHA256");
    verifier.update(`${parts[0]}.${parts[1]}`);
    const isValid = verifier.verify(cert, parts[2], "base64url");

    return isValid ? payload : null;
  } catch (err: any) {
    console.warn("[Firebase Token Public Verify] Error:", err?.message || err);
    return null;
  }
}

function loadServiceAccount(): any | null {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    try {
      return JSON.parse(raw);
    } catch {
      // Common paste problem: the private key has real line breaks inside it. Escape them and retry.
      try {
        const repaired = raw.replace(
          /-----BEGIN PRIVATE KEY-----[\s\S]*?-----END PRIVATE KEY-----\r?\n?/g,
          (block) => block.replace(/\r?\n/g, "\\n")
        );
        return JSON.parse(repaired);
      } catch {
        lastInitError = "FIREBASE_SERVICE_ACCOUNT_KEY is set but is not valid JSON. Paste the whole downloaded file unchanged.";
        return null;
      }
    }
  }

  if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID || "kachamba-chorus",
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Env vars usually can't hold real newlines, so keys are pasted with literal "\n".
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    };
  }

  return null;
}

function getAdminApp(): App | null {
  if (app) return app;
  if (initAttempted) return null;
  initAttempted = true;

  const serviceAccount = loadServiceAccount();
  if (!serviceAccount) {
    lastInitError = lastInitError || "No Firebase service account credentials configured (set FIREBASE_SERVICE_ACCOUNT_KEY).";
    console.warn(`[Firebase Admin] Not initialized: ${lastInitError}`);
    return null;
  }

  try {
    const existing = getApps();
    app = existing.length > 0 ? existing[0] : initializeApp({ credential: cert(serviceAccount) });
    console.log("[Firebase Admin] Initialized successfully.");
    return app;
  } catch (err: any) {
    lastInitError = err.message;
    console.error("[Firebase Admin] Initialization failed:", err.message);
    return null;
  }
}

export function getAdminAuth(): Auth | null {
  const a = getAdminApp();
  return a ? getAuth(a) : null;
}

export function getAdminFirestore(): Firestore | null {
  const a = getAdminApp();
  return a ? getFirestore(a) : null;
}

export function firebaseAdminStatus(): { ready: boolean; error: string | null } {
  const ready = !!getAdminApp();
  return { ready, error: ready ? null : lastInitError };
}

// Verifies a Firebase ID token (issued client-side by useAdminAuth.ts on login) and
// checks it against the same "admins" collection convention the client already used
// for its own (non-authoritative) check in useAdminAuth.ts's verifyAdmin().
export async function verifyAdminIdToken(idToken: string): Promise<boolean> {
  const bootstrapEmail = (process.env.ADMIN_EMAIL || "allangeorge566@gmail.com").toLowerCase();
  const auth = getAdminAuth();
  const firestore = getAdminFirestore();

  // Primary path: Firebase Admin SDK with service account credentials
  if (auth && firestore) {
    try {
      const decoded = await auth.verifyIdToken(idToken);
      if (decoded.email && decoded.email.toLowerCase() === bootstrapEmail) return true;

      const isAdminRole = (snap: any) => snap.exists && ["admin", "super_admin"].includes(snap.data()?.role);
      if (isAdminRole(await firestore.collection("admins").doc(decoded.uid).get())) return true;
      if (decoded.email && isAdminRole(await firestore.collection("admins").doc(decoded.email).get())) return true;

      return false;
    } catch (err: any) {
      console.warn("[Firebase Admin] ID token verification failed with SDK:", err.message);
    }
  }

  // Resilient Fallback: Verify ID token cryptographically using Google public certs
  // This allows admin verification on platforms like Render without needing a service account file
  try {
    const verifiedPayload = await verifyFirebaseTokenWithPublicKeys(idToken);
    if (verifiedPayload && verifiedPayload.email) {
      if (verifiedPayload.email.toLowerCase() === bootstrapEmail) {
        return true;
      }
    }
  } catch (err: any) {
    console.warn("[Firebase Public Key Verification] Failed:", err?.message || err);
  }

  return false;
}
