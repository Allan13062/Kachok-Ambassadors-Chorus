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

// Uploaded files table for persistent binary/base64 storage (Neon Postgres)
export const uploads = pgTable("uploads", {
  id: text("id").primaryKey(),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  base64: text("base64").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

// Users table to store login credentials, roles, and profiles in Neon Postgres
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
