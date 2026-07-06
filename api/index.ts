import express from "express";

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// Diagnostic: test which specific package fails to load in this Vercel environment
app.get("/api/diag", async (_req, res) => {
  const results: Record<string, string> = {};
  const test = async (name: string, fn: () => Promise<any>) => {
    try { await fn(); results[name] = "ok"; }
    catch (e: any) { results[name] = `FAIL: ${e.message?.substring(0, 120)}`; }
  };

  await test("@google/genai",           () => import("@google/genai"));
  await test("firebase/app",            () => import("firebase/app"));
  await test("firebase/firestore/lite", () => import("firebase/firestore/lite"));
  await test("pg",                      () => import("pg"));
  await test("drizzle-orm",             () => import("drizzle-orm"));
  await test("drizzle-orm/node-postgres", () => import("drizzle-orm/node-postgres"));
  await test("googleapis",              () => import("googleapis"));

  res.json(results);
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.use((_req, res) => {
  res.status(503).json({ error: "Diagnostics in progress — full server temporarily offline" });
});

export default app;
