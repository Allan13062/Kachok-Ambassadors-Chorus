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

let app: App | null = null;
let initAttempted = false;
let lastInitError: string | null = null;

function loadServiceAccount(): any | null {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    } catch {
      lastInitError = "FIREBASE_SERVICE_ACCOUNT_KEY is set but is not valid JSON.";
      return null;
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
  const auth = getAdminAuth();
  const firestore = getAdminFirestore();
  if (!auth || !firestore) return false;

  try {
    const decoded = await auth.verifyIdToken(idToken);

    // Hardcoded super-admin bootstrap account - mirrors useAdminAuth.ts.
    // Recommend replacing this with a proper `admins` doc and removing the hardcode (see recommendations).
    if (decoded.email === "allangeorge566@gmail.com") return true;

    const byUid = await firestore.collection("admins").doc(decoded.uid).get();
    if (byUid.exists) return true;

    if (decoded.email) {
      const byEmail = await firestore.collection("admins").doc(decoded.email).get();
      if (byEmail.exists) return true;
    }

    return false;
  } catch (err: any) {
    console.warn("[Firebase Admin] ID token verification failed:", err.message);
    return false;
  }
}
