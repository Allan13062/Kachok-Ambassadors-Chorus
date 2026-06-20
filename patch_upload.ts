import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /app\.post\("\/api\/upload", requireAdmin, async \(req, res\) => \{[\s\S]*?res\.status\(500\)\.json\(\{ error: "Failed to upload file locally\." \}\);\s*\}\s*\}\);/g;

const newUpload = `app.post("/api/upload", requireAdmin, async (req, res) => {
  const { filename, base64 } = req.body;
  if (!base64) {
    return res.status(400).json({ error: "No file content specified under base64 parameter." });
  }

  // Always return the Base64 Data URI directly to be stored persistently in Firestore.
  // This bypasses local ephemeral filesystem storage which gets wiped on Cloud Run container restarts.
  return res.json({ 
    success: true, 
    url: base64, // The UI will store this Data URI directly in the database
    filename: filename,
    mimeType: ""
  });
});`;

code = code.replace(regex, newUpload);

// Since I have modified some files, I just write it back
fs.writeFileSync('server.ts', code);
