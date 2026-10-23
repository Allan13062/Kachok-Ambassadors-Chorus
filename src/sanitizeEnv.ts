import dotenv from "dotenv";
dotenv.config();

function sanitizeVar(val: string | undefined, keyName: string): string | undefined {
  if (!val) return val;
  let cleaned = val.trim();
  if (cleaned.startsWith(`${keyName}=`)) {
    cleaned = cleaned.substring(`${keyName}=`.length).trim();
  }
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.slice(1, -1);
  } else if (cleaned.startsWith("'") && cleaned.endsWith("'")) {
    cleaned = cleaned.slice(1, -1);
  }
  return cleaned;
}

if (process.env.CLOUDINARY_URL) {
  process.env.CLOUDINARY_URL = sanitizeVar(process.env.CLOUDINARY_URL, "CLOUDINARY_URL");
}
if (process.env.CLOUDINARY_CLOUD_NAME) {
  process.env.CLOUDINARY_CLOUD_NAME = sanitizeVar(process.env.CLOUDINARY_CLOUD_NAME, "CLOUDINARY_CLOUD_NAME");
}
if (process.env.CLOUDINARY_API_KEY) {
  process.env.CLOUDINARY_API_KEY = sanitizeVar(process.env.CLOUDINARY_API_KEY, "CLOUDINARY_API_KEY");
}
if (process.env.CLOUDINARY_API_SECRET) {
  process.env.CLOUDINARY_API_SECRET = sanitizeVar(process.env.CLOUDINARY_API_SECRET, "CLOUDINARY_API_SECRET");
}
