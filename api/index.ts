import express from "express";

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString(), env: process.env.NODE_ENV || "unknown" });
});

app.use((_req, res) => {
  res.status(503).json({ error: "Full server temporarily offline for diagnostics. Please wait." });
});

export default app;
