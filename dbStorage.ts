// Site data storage.
//
// All site content (activities, itinerary, leaders, gallery, music, M-Pesa
// settings, sessions, receipts, ...) is stored as ONE JSON document in your
// Postgres database (the same SQL_* settings the project already uses), in a
// table called app_state. Postgres survives Vercel redeploys and serverless
// restarts, so saved changes stay saved.
//
// Writes are never silently dropped: if the database can't be reached or the
// write fails, the error is thrown so the admin sees it and nothing pretends to
// have saved.

import fs from "fs";
import path from "path";
import { pool } from "./src/db/index.ts";

const STATE_ID = "main";
const SEED_PATH = path.join(process.cwd(), "data", "db.json");
const CACHE_TTL_MS = 5000;

function defaultState(): any {
  return {
    passcode: process.env.ADMIN_PASSCODE || "CHANGE_ME_SET_ADMIN_PASSCODE_ENV_VAR",
    adminEmail: process.env.ADMIN_EMAIL || "",
    activities: [],
    itinerary: [],
    leaders: [],
    inquiries: [],
    music: {},
    users: [],
    subscribers: [],
    broadcasts: [],
    memberSpotlights: [],
    gallery: [],
    receipts: [],
    sessions: [],
    mpesa: {},
  };
}

// Used only the first time, to copy the existing data/db.json into the database.
function readSeedFile(): any {
  try {
    if (fs.existsSync(SEED_PATH)) return JSON.parse(fs.readFileSync(SEED_PATH, "utf8"));
  } catch (err: any) {
    console.warn("[DB] Could not read seed file:", err?.message || err);
  }
  return {};
}

let tableReady: Promise<void> | null = null;

function ensureTable(): Promise<void> {
  if (!tableReady) {
    tableReady = (async () => {
      await pool.query(
        `CREATE TABLE IF NOT EXISTS app_state (
           id text PRIMARY KEY,
           data jsonb NOT NULL,
           updated_at timestamptz NOT NULL DEFAULT now()
         )`
      );
      const { rows } = await pool.query(`SELECT 1 FROM app_state WHERE id = $1`, [STATE_ID]);
      if (rows.length === 0) {
        const seed = { ...defaultState(), ...readSeedFile() };
        await pool.query(
          `INSERT INTO app_state (id, data) VALUES ($1, $2::jsonb) ON CONFLICT (id) DO NOTHING`,
          [STATE_ID, JSON.stringify(seed)]
        );
      }
    })().catch((err) => {
      tableReady = null; // try again on the next request
      throw err;
    });
  }
  return tableReady;
}

async function readState(): Promise<any> {
  await ensureTable();
  const { rows } = await pool.query(`SELECT data FROM app_state WHERE id = $1`, [STATE_ID]);
  return { ...defaultState(), ...(rows[0]?.data || {}) };
}

async function writeState(state: any): Promise<void> {
  await ensureTable();
  await pool.query(
    `INSERT INTO app_state (id, data, updated_at) VALUES ($1, $2::jsonb, now())
     ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
    [STATE_ID, JSON.stringify(state)]
  );
  cachedDb = state;
  lastCacheFetchTime = Date.now();
}

// Run read-modify-write operations one at a time inside this server instance,
// so two quick edits can't overwrite each other.
let queue: Promise<unknown> = Promise.resolve();
function serialize<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => undefined);
  return run;
}

// Shared in-memory sessions cache for speed
const inMemorySessions: Record<string, any> = {};

let cachedDb: any = null;
let lastCacheFetchTime = 0;

export function invalidateDbCache() {
  cachedDb = null;
  lastCacheFetchTime = 0;
}

/** Read the full site state. Throws only if the database is unreachable and there is no cached copy. */
export async function getLocalDb(): Promise<any> {
  if (cachedDb && Date.now() - lastCacheFetchTime < CACHE_TTL_MS) {
    return cachedDb;
  }
  try {
    const state = await readState();
    cachedDb = state;
    lastCacheFetchTime = Date.now();
    return state;
  } catch (err: any) {
    console.error("[DB] Could not read site data:", err?.message || err);
    if (cachedDb) return cachedDb;
    throw err;
  }
}

/** Save the whole state object. Throws if the save fails. */
export async function saveLocalDb(data: any): Promise<void> {
  await serialize(() => writeState({ ...defaultState(), ...data }));
}

export async function insertItem(colName: string, id: string, data: any): Promise<void> {
  await serialize(async () => {
    const state = await readState();

    if (colName === "configs") {
      if (id === "music") {
        state.music = data;
      } else if (id === "admin") {
        state.passcode = data.passcode || state.passcode;
        state.adminEmail = data.adminEmail || state.adminEmail || process.env.ADMIN_EMAIL || "";
        state.recoveryCode = data.recoveryCode || state.recoveryCode;
        state.recoveryCodeExp = data.recoveryCodeExp || state.recoveryCodeExp;
      } else if (id === "mpesa") {
        state.mpesa = data;
      }
    } else if (colName === "sessions") {
      inMemorySessions[id] = data;
      state.sessions = (state.sessions || []).filter((s: any) => s.id !== id);
      state.sessions.push({ id, ...data });
    } else {
      const list: any[] = Array.isArray(state[colName]) ? state[colName] : [];
      const idx = list.findIndex((item: any) => item.id === id);
      const newItem = { id, ...data };
      if (idx >= 0) list[idx] = newItem;
      else list.push(newItem);
      state[colName] = list;
    }

    await writeState(state);
  });
}

export async function deleteItem(colName: string, id: string): Promise<void> {
  await serialize(async () => {
    const state = await readState();
    if (Array.isArray(state[colName])) {
      state[colName] = state[colName].filter((item: any) => item.id !== id);
      await writeState(state);
    }
  });
}

export async function getSession(token: string): Promise<any> {
  if (inMemorySessions[token]) return inMemorySessions[token];
  const state = await readState();
  const found = (state.sessions || []).find((s: any) => s.id === token);
  if (found) {
    inMemorySessions[token] = found;
    return found;
  }
  return null;
}

export async function deleteSession(token: string): Promise<void> {
  delete inMemorySessions[token];
  await serialize(async () => {
    const state = await readState();
    if (Array.isArray(state.sessions)) {
      state.sessions = state.sessions.filter((s: any) => s.id !== token);
      await writeState(state);
    }
  });
}

// ---------------------------------------------------------------------------
// Uploaded files (legacy/fallback uploads). Stored in their own table so the
// big base64 payloads don't get rewritten every time site content is saved.
// ---------------------------------------------------------------------------
let filesTableReady: Promise<void> | null = null;

function ensureFilesTable(): Promise<void> {
  if (!filesTableReady) {
    filesTableReady = pool
      .query(
        `CREATE TABLE IF NOT EXISTS app_files (
           id text PRIMARY KEY,
           filename text,
           mime_type text,
           data text NOT NULL,
           created_at timestamptz NOT NULL DEFAULT now()
         )`
      )
      .then(() => undefined)
      .catch((err) => {
        filesTableReady = null;
        throw err;
      });
  }
  return filesTableReady;
}

export async function saveFile(file: { id: string; filename: string; mimeType: string; data: string }): Promise<void> {
  await ensureFilesTable();
  await pool.query(
    `INSERT INTO app_files (id, filename, mime_type, data) VALUES ($1, $2, $3, $4)
     ON CONFLICT (id) DO UPDATE SET filename = EXCLUDED.filename, mime_type = EXCLUDED.mime_type, data = EXCLUDED.data`,
    [file.id, file.filename, file.mimeType, file.data]
  );
}

export async function getFile(id: string): Promise<{ base64: string; mimeType: string; filename: string } | null> {
  await ensureFilesTable();
  const { rows } = await pool.query(`SELECT filename, mime_type, data FROM app_files WHERE id = $1`, [id]);
  if (!rows[0]) return null;
  return { base64: rows[0].data, mimeType: rows[0].mime_type, filename: rows[0].filename };
}
