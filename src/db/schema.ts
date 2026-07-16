import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

// Activities Table
export const activities = pgTable("activities", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  date: text("date").notNull(),
  location: text("location").notNull(),
  description: text("description").notNull(),
  category: text("category"),
  image: text("image"),
  mediaType: text("media_type").default("image"),
  createdAt: timestamp("created_at").defaultNow()
});

// Itinerary Table
export const itinerary = pgTable("itinerary", {
  id: text("id").primaryKey(),
  event: text("event").notNull(),
  date: text("date").notNull(),
  time: text("time"),
  location: text("location").notNull(),
  host: text("host"),
  status: text("status").default("Confirmed"),
  notes: text("notes"),
  mediaUrl: text("media_url"),
  mediaType: text("media_type"),
  createdAt: timestamp("created_at").defaultNow()
});

// Leaders Table
export const leaders = pgTable("leaders", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  image: text("image"),
  bio: text("bio"),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow()
});

// Inquiries Table
export const inquiries = pgTable("inquiries", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject"),
  message: text("message").notNull(),
  date: text("date").notNull(),
  status: text("status").default("Unread"),
  createdAt: timestamp("created_at").defaultNow()
});

// Music Table (Single row configuration)
export const musicConfig = pgTable("music_config", {
  id: integer("id").primaryKey().default(1),
  songTitle: text("song_title").notNull(),
  artistName: text("artist_name").notNull(),
  albumName: text("album_name").notNull(),
  audioUrl: text("audio_url"),
  coverUrl: text("cover_url"),
  quoteText: text("quote_text"),
  label: text("label"),
  lyrics: text("lyrics"),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Admin config/passcode Table
export const adminConfig = pgTable("admin_config", {
  key: text("key").primaryKey(), // e.g. "passcode"
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// DEPRECATED: base64-in-Postgres file storage. All media now uploads directly
// to Cloudinary (see src/lib/mediaUpload.ts + POST /api/cloudinary-signature).
// Table kept only so old rows aren't silently orphaned - safe to drop once you've
// confirmed nothing references /api/uploads/:id anymore (run a migration to remove it).
export const uploads = pgTable("uploads", {
  id: text("id").primaryKey(),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  base64: text("base64").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

// Gallery Table - photo/video metadata; the `url` column always points at Cloudinary
export const gallery = pgTable("gallery", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").default("General"),
  description: text("description"),
  url: text("url").notNull(),
  mediaType: text("media_type").default("image"),
  createdAt: timestamp("created_at").defaultNow()
});

// Newsletter subscribers
export const subscribers = pgTable("subscribers", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

// Admin broadcast emails sent to subscribers
export const broadcasts = pgTable("broadcasts", {
  id: text("id").primaryKey(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  sentCount: integer("sent_count").default(0),
  sentTo: text("sent_to"), // JSON-stringified array of recipient emails
  createdAt: timestamp("created_at").defaultNow()
});

// Member spotlight entries
export const memberSpotlights = pgTable("member_spotlights", {
  id: text("id").primaryKey(),
  memberName: text("member_name").notNull(),
  roleOrVoicePart: text("role_or_voice_part").default("Chorus Member"),
  quoteOrHighlight: text("quote_or_highlight").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow()
});

// DEPRECATED: login credentials and roles are now stored exclusively in Firestore
// (the "users" collection, written via the Firebase Admin SDK - see dbStorage.ts).
// Table kept only so old rows aren't silently orphaned; safe to drop after confirming
// Firestore has everything (see the one-time migration that runs on server startup).
export const users = pgTable("users", {
  uid: text("uid").primaryKey(),
  email: text("email").notNull(),
  displayName: text("display_name"),
  photoURL: text("photo_url"),
  voicePart: text("voice_part"),
  providerId: text("provider_id"),
  password: text("password"),
  role: text("role"),
  isLeader: text("is_leader"),
  createdAt: text("created_at")
});

// Donations Table
export const donations = pgTable("donations", {
  id: text("id").primaryKey(),
  checkoutRequestId: text("checkout_request_id").notNull(),
  merchantRequestId: text("merchant_request_id"),
  phone: text("phone").notNull(),
  amount: integer("amount").notNull(),
  status: text("status").default("pending"),
  simulated: text("simulated").default("false"),
  mpesaReceiptNumber: text("mpesa_receipt_number"),
  resultDesc: text("result_desc"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at")
});
