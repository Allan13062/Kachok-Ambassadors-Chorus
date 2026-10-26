// Cleans up secrets pasted into Vercel / GitHub / .env settings, so they work
// even when copied with extra characters:
//   - spaces or line breaks at the start or end
//   - surrounding quotes:  "abc123"  or  'abc123'
//   - the name repeated:   MPESA_PASSKEY=abc123
//   - private keys with literal \n instead of real line breaks
// Import this file first, before anything reads process.env.

function cleanValue(raw: string, key: string): string {
  let value = raw.trim();
  if (value.startsWith(`${key}=`)) value = value.slice(key.length + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1).trim();
  }
  if (key.includes("PRIVATE_KEY")) value = value.replace(/\\n/g, "\n");
  return value;
}

for (const key of Object.keys(process.env)) {
  const value = process.env[key];
  if (typeof value === "string") process.env[key] = cleanValue(value, key);
}

export {};
