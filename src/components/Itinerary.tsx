import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Bell,
  BellRing,
  CalendarDays,
  CalendarPlus,
  Check,
  Download,
  Link2,
  MapPin,
  MessageCircle,
  Pencil,
  Play,
  Plus,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { User as FirebaseUser } from "firebase/auth";
import { arrayRemove, arrayUnion, doc, getDoc, setDoc } from "firebase/firestore";
import { jsPDF } from "jspdf";
import { db } from "../lib/firebase";
import type { ItineraryItem } from "../types";

interface ItineraryProps {
  items: ItineraryItem[];
  isAdmin: boolean;
  adminPasscode?: string | null;
  onRefresh?: () => void;
  onAdd: () => void;
  onEdit: (item: ItineraryItem) => void;
  onDelete: (id: string) => void;
  onBookSelect: (eventName: string) => void;
  user?: FirebaseUser | null;
  onGoogleLogin?: () => void;
  theme?: string;
}

type Tab = "all" | "upcoming" | "charity" | "revival" | "past";
type Category = "charity" | "revival" | "worship";

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "upcoming", label: "Upcoming" },
  { id: "charity", label: "Charity" },
  { id: "revival", label: "Revivals" },
  { id: "past", label: "Past" },
];

const CATEGORY_LABEL: Record<Category, string> = {
  charity: "Charity",
  revival: "Revival",
  worship: "Worship",
};

/* ───────── helpers (pure) ───────── */

const pad = (n: number) => String(n).padStart(2, "0");

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? `${dateStr}T00:00:00` : dateStr);
  return Number.isNaN(d.getTime()) ? null : d;
}

// Understands "16:30", "4:30 PM", "4.30pm"; ignores ranges by reading the first time only.
function parseTime(timeStr: string): { h: number; m: number } | null {
  if (!timeStr) return null;
  const first = timeStr.split(/\s*(?:-|–|to)\s*/i)[0].trim();
  const match = first.match(/^(\d{1,2})(?:[.:](\d{2}))?\s*([ap])?\.?\s*m?\.?$/i);
  if (!match) return null;
  let h = parseInt(match[1], 10);
  const m = match[2] ? parseInt(match[2], 10) : 0;
  const suffix = match[3]?.toLowerCase();
  if (suffix === "p" && h < 12) h += 12;
  if (suffix === "a" && h === 12) h = 0;
  if (h > 23 || m > 59) return null;
  return { h, m };
}

function eventWindow(item: ItineraryItem): { start: Date; end: Date } | null {
  const day = parseDate(item.date);
  if (!day) return null;
  const t = parseTime(item.time) ?? { h: 9, m: 0 };
  const start = new Date(day);
  start.setHours(t.h, t.m, 0, 0);
  const end = new Date(start);
  end.setHours(start.getHours() + 2);
  return { start, end };
}

const isPast = (item: ItineraryItem, now: number) => {
  if (item.status === "Past") return true;
  const w = eventWindow(item);
  return w ? w.end.getTime() < now : false;
};

function categoryOf(item: ItineraryItem): Category {
  const text = `${item.event} ${item.notes || ""} ${item.host || ""}`.toLowerCase();
  if (/bullet|brighter|surgery|fund|charity|outreach|victim|police|donat/.test(text)) return "charity";
  if (/revival|camp|vesper|crusade|joint|combined|sabbath/.test(text)) return "revival";
  return "worship";
}

function formatDate(dateStr: string): string {
  const d = parseDate(dateStr);
  if (!d) return dateStr || "Date to be announced";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function toIcsLocal(d: Date): string {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
}

function escapeIcs(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

function eventDescription(item: ItineraryItem): string {
  return item.notes || `Choral mission by ${item.host || "Kachamba Chorus"}`;
}

function googleCalendarUrl(item: ItineraryItem): string | null {
  const w = eventWindow(item);
  if (!w) return null;
  const dates = `${toIcsLocal(w.start)}/${toIcsLocal(w.end)}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: item.event,
    dates,
    details: eventDescription(item),
    location: item.location || "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function downloadIcs(item: ItineraryItem) {
  const w = eventWindow(item);
  if (!w) return;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Kachamba Chorus//Itinerary//EN",
    "BEGIN:VEVENT",
    `UID:${item.id}@kachambachorus.org`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
    `DTSTART:${toIcsLocal(w.start)}`,
    `DTEND:${toIcsLocal(w.end)}`,
    `SUMMARY:${escapeIcs(item.event)}`,
    `DESCRIPTION:${escapeIcs(eventDescription(item))}`,
    `LOCATION:${escapeIcs(item.location || "")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${item.event.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const eventLink = (id: string) => `${window.location.origin}/?event=${encodeURIComponent(id)}`;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — ignore */
  }
}

// Loads an image from the site (e.g. /logos/kachamba.png) as a data URL for the PDF.
async function loadImageDataUrl(src: string): Promise<string | null> {
  try {
    const res = await fetch(src);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function imageSize(dataUrl: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth || 1, h: img.naturalHeight || 1 });
    img.onerror = () => resolve({ w: 1, h: 1 });
    img.src = dataUrl;
  });
}

/* ───────── component ───────── */

export default function Itinerary({
  items,
  isAdmin,
  onAdd,
  onEdit,
  onDelete,
  onBookSelect,
  user,
  onGoogleLogin,
}: ItineraryProps) {
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [favorites, setFavorites] = useState<string[]>(() => readJson("kachamba_favorites", []));
  const [reminders, setReminders] = useState<string[]>(() => readJson("kachamba_event_reminders", []));
  const [openCalendarId, setOpenCalendarId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [media, setMedia] = useState<{ url: string; type: "image" | "video"; title: string } | null>(null);

  // Keep countdowns fresh
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(t);
  }, []);

  // Load favourites: from Firestore when signed in, otherwise from this browser
  useEffect(() => {
    if (!user?.uid) {
      setFavorites(readJson("kachamba_favorites", []));
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const remote = snap.exists() ? (snap.data().favorites as string[] | undefined) : undefined;
        if (remote && !cancelled) {
          setFavorites(remote);
          writeJson("kachamba_favorites", remote);
        }
      } catch {
        const cached = readJson<string[] | null>(`kachamba_favoritesRef_${user.uid}`, null);
        if (cached && !cancelled) setFavorites(cached);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  // Escape closes the media viewer
  useEffect(() => {
    if (!media) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMedia(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [media]);

  // Flash a short confirmation next to a button
  const flashCopied = (id: string) => {
    setCopiedId(id);
    window.setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 2000);
  };

  const toggleFavorite = async (id: string) => {
    if (!user) {
      onGoogleLogin?.();
      return;
    }
    const isFav = favorites.includes(id);
    const next = isFav ? favorites.filter((f) => f !== id) : [...favorites, id];
    setFavorites(next);
    writeJson("kachamba_favorites", next);
    writeJson(`kachamba_favoritesRef_${user.uid}`, next);
    try {
      await setDoc(doc(db, "users", user.uid), { favorites: isFav ? arrayRemove(id) : arrayUnion(id) }, { merge: true });
    } catch (err) {
      console.warn("Favourite saved on this device only:", err);
    }
  };

  const toggleReminder = (id: string) => {
    const next = reminders.includes(id) ? reminders.filter((r) => r !== id) : [...reminders, id];
    setReminders(next);
    writeJson("kachamba_event_reminders", next);
  };

  const copyLink = async (item: ItineraryItem) => {
    try {
      await navigator.clipboard.writeText(eventLink(item.id));
      flashCopied(item.id);
    } catch {
      console.warn("Clipboard unavailable");
    }
  };

  const shareWhatsApp = (item: ItineraryItem) => {
    const text = `${item.event} — ${formatDate(item.date)}${item.time ? `, ${item.time}` : ""}\n${eventLink(item.id)}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  // Sorted (earliest first) and filtered list
  const sorted = useMemo(() => {
    return [...(items || [])].sort((a, b) => {
      const ta = eventWindow(a)?.start.getTime() ?? Number.MAX_SAFE_INTEGER;
      const tb = eventWindow(b)?.start.getTime() ?? Number.MAX_SAFE_INTEGER;
      return ta - tb;
    });
  }, [items]);

  const nextUp = useMemo(
    () => sorted.find((item) => !isPast(item, now)) || null,
    [sorted, now]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = sorted.filter((item) => {
      const past = isPast(item, now);
      if (tab === "upcoming" && past) return false;
      if (tab === "past" && !past) return false;
      if ((tab === "charity" || tab === "revival") && categoryOf(item) !== tab) return false;
      if (!q) return true;
      return [item.event, item.location, item.host, item.notes].filter(Boolean).join(" ").toLowerCase().includes(q);
    });
    return tab === "past" ? list.reverse() : list;
  }, [sorted, tab, query, now]);

  const countdown = (item: ItineraryItem) => {
    const w = eventWindow(item);
    if (!w) return null;
    const diff = w.start.getTime() - now;
    if (diff <= 0) return "Happening now";
    const days = Math.floor(diff / 86_400_000);
    const hours = Math.floor((diff % 86_400_000) / 3_600_000);
    const mins = Math.floor((diff % 3_600_000) / 60_000);
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const downloadSchedule = async () => {
    const [mainLogo, sdaLogo] = await Promise.all([
      loadImageDataUrl("/logos/kachamba.png"),
      loadImageDataUrl("/logos/sda.png"),
    ]);
    const sdaSize = sdaLogo ? await imageSize(sdaLogo) : null;

    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const W = 210;
    const H = 297;
    const M = 16;
    const NAVY: [number, number, number] = [8, 24, 48];
    const ORANGE: [number, number, number] = [240, 144, 16];
    const ORANGE_TEXT: [number, number, number] = [184, 102, 10];
    const INK: [number, number, number] = [8, 24, 48];
    const MUTED: [number, number, number] = [100, 110, 125];
    const RULE: [number, number, number] = [222, 227, 234];
    const CONTENT_X = M + 24;
    const CONTENT_W = W - M - CONTENT_X;

    const fitBox = (size: { w: number; h: number }, max: number) => {
      const ratio = size.w / size.h;
      return ratio >= 1 ? { w: max, h: max / ratio } : { w: max * ratio, h: max };
    };

    // First page: tall navy header with both logos
    const drawFirstHeader = () => {
      pdf.setFillColor(...NAVY);
      pdf.rect(0, 0, W, 62, "F");
      pdf.setFillColor(...ORANGE);
      pdf.rect(0, 62, W, 1.6, "F");

      if (mainLogo) pdf.addImage(mainLogo, "PNG", M, 12, 27, 27);
      if (sdaLogo && sdaSize) {
        const box = fitBox(sdaSize, 24);
        pdf.addImage(sdaLogo, "PNG", W - M - box.w, 12 + (27 - box.h) / 2, box.w, box.h);
      }

      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(26);
      pdf.text("Itinerary", W / 2, 40, { align: "center" });
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9.5);
      pdf.setTextColor(255, 214, 160);
      pdf.text("KACHAMBA CHORUS  |  KACHOK SDA CHURCH, KISUMU, KENYA", W / 2, 50, { align: "center" });
    };

    // Other pages: slim header
    const drawContinuationHeader = () => {
      pdf.setFillColor(...NAVY);
      pdf.rect(0, 0, W, 20, "F");
      pdf.setFillColor(...ORANGE);
      pdf.rect(0, 20, W, 1, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.text("Itinerary", M, 12.5);
      if (mainLogo) pdf.addImage(mainLogo, "PNG", W - M - 12, 4, 12, 12);
    };

    let y = 76;
    let currentMonth = "";

    const newPage = () => {
      pdf.addPage();
      drawContinuationHeader();
      y = 32;
    };

    drawFirstHeader();

    if (sorted.length === 0) {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.setTextColor(...MUTED);
      pdf.text("No events scheduled yet.", M, y);
    }

    sorted.forEach((item) => {
      const w = eventWindow(item);
      const month = w
        ? w.start.toLocaleDateString("en-US", { month: "long", year: "numeric" }).toUpperCase()
        : "DATE TO BE ANNOUNCED";

      // Build the lines for this row first, so we know how tall it is
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11.5);
      const titleLines = pdf.splitTextToSize(item.event || "Untitled event", CONTENT_W) as string[];

      const metaParts = [item.time, item.location].filter(Boolean).join("  |  ");
      const metaText = [metaParts, item.host ? `Host: ${item.host}` : ""].filter(Boolean).join("   ");
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      const metaLines = metaText ? (pdf.splitTextToSize(metaText, CONTENT_W) as string[]) : [];

      const notesText = item.notes && !/https?:\/\//.test(item.notes) ? item.notes : "";
      pdf.setFontSize(8.5);
      const noteLines = notesText ? (pdf.splitTextToSize(notesText, CONTENT_W).slice(0, 2) as string[]) : [];

      const rowHeight =
        titleLines.length * 5.2 + metaLines.length * 4.4 + noteLines.length * 4 + 9 + (month !== currentMonth ? 14 : 0);

      if (y + rowHeight > H - 22) newPage();

      // Month heading when the month changes
      if (month !== currentMonth) {
        currentMonth = month;
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        pdf.setTextColor(...ORANGE_TEXT);
        pdf.text(month, M, y);
        pdf.setDrawColor(...RULE);
        pdf.line(M, y + 2.2, W - M, y + 2.2);
        y += 8;
      }

      // Date block
      const dayText = w ? String(w.start.getDate()) : "--";
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(20);
      pdf.setTextColor(...INK);
      pdf.text(dayText, M, y + 6);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(...MUTED);
      pdf.text(w ? w.start.toLocaleDateString("en-US", { weekday: "short" }) : "TBA", M, y + 11);

      // Title, meta, notes
      let ty = y + 4;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11.5);
      pdf.setTextColor(...INK);
      pdf.text(titleLines, CONTENT_X, ty);
      ty += titleLines.length * 5.2;

      if (metaLines.length) {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.setTextColor(...MUTED);
        pdf.text(metaLines, CONTENT_X, ty);
        ty += metaLines.length * 4.4;
      }

      if (noteLines.length) {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8.5);
        pdf.setTextColor(60, 72, 90);
        pdf.text(noteLines, CONTENT_X, ty);
        ty += noteLines.length * 4;
      }

      // Row separator
      const rowBottom = Math.max(ty, y + 13) + 3;
      pdf.setDrawColor(...RULE);
      pdf.line(M, rowBottom, W - M, rowBottom);
      y = rowBottom + 5;
    });

    // Footers with page numbers
    const total = pdf.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      pdf.setPage(i);
      pdf.setDrawColor(...RULE);
      pdf.line(M, H - 14, W - M, H - 14);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(...MUTED);
      pdf.text("kachambachorus.online", M, H - 8);
      pdf.text(`Page ${i} of ${total}`, W - M, H - 8, { align: "right" });
    }

    pdf.save("kachamba-itinerary.pdf");
  };

  const btnBase =
    "inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 disabled:opacity-40";
  const btnGhost = `${btnBase} border border-white/15 text-white/80 hover:border-white/40 hover:text-white`;
  const iconBtn =
    "grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/60 transition hover:border-white/30 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400";

  const renderCalendarMenu = (item: ItineraryItem) => {
    const gcal = googleCalendarUrl(item);
    const open = openCalendarId === item.id;
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpenCalendarId(open ? null : item.id)}
          aria-expanded={open}
          className={btnGhost}
        >
          <CalendarPlus className="h-3.5 w-3.5" aria-hidden="true" />
          Add to calendar
        </button>
        {open && (
          <div className="absolute left-0 top-11 z-20 w-56 rounded-xl border border-white/10 bg-slate-900 p-1.5 shadow-2xl">
            {gcal && (
              <a
                href={gcal}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpenCalendarId(null)}
                className="block rounded-lg px-3 py-2 text-xs text-white/85 hover:bg-white/5 hover:text-white"
              >
                Google Calendar
              </a>
            )}
            <button
              type="button"
              onClick={() => {
                downloadIcs(item);
                setOpenCalendarId(null);
              }}
              className="block w-full rounded-lg px-3 py-2 text-left text-xs text-white/85 hover:bg-white/5 hover:text-white"
            >
              Apple / Outlook (.ics)
            </button>
          </div>
        )}
      </div>
    );
  };

  // Shared action row: favourite, reminder, share, calendar, book
  const renderActions = (item: ItineraryItem) => {
    const past = isPast(item, now);
    const isFav = favorites.includes(item.id);
    const hasReminder = reminders.includes(item.id);
    return (
      <div className="flex flex-wrap items-center gap-2 md:justify-end">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => toggleFavorite(item.id)}
            aria-pressed={isFav}
            aria-label={isFav ? "Remove from favourites" : "Add to favourites"}
            title={user ? (isFav ? "Remove from favourites" : "Save to favourites") : "Sign in to save"}
            className={`${iconBtn} ${isFav ? "border-amber-400/60 text-amber-400" : ""}`}
          >
            <Star className={`h-3.5 w-3.5 ${isFav ? "fill-current" : ""}`} aria-hidden="true" />
          </button>
          {!past && (
            <button
              type="button"
              onClick={() => toggleReminder(item.id)}
              aria-pressed={hasReminder}
              aria-label={hasReminder ? "Remove reminder" : "Set reminder"}
              title={hasReminder ? "Reminder set" : "Remind me"}
              className={`${iconBtn} ${hasReminder ? "border-amber-400/60 text-amber-400" : ""}`}
            >
              {hasReminder ? <BellRing className="h-3.5 w-3.5" aria-hidden="true" /> : <Bell className="h-3.5 w-3.5" aria-hidden="true" />}
            </button>
          )}
          <button type="button" onClick={() => copyLink(item)} aria-label="Copy event link" title="Copy link" className={iconBtn}>
            {copiedId === item.id ? <Check className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" /> : <Link2 className="h-3.5 w-3.5" aria-hidden="true" />}
          </button>
          <button type="button" onClick={() => shareWhatsApp(item)} aria-label="Share on WhatsApp" title="Share on WhatsApp" className={iconBtn}>
            <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
        {!past && (
          <div className="flex items-center gap-2">
            {renderCalendarMenu(item)}
            <button type="button" onClick={() => onBookSelect(item.event)} className="btn-solid fill-accent !py-2 !px-4 !text-xs">
              Book
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <section id="itinerary" className="relative bg-slate-950 px-5 py-16 md:px-10 md:py-20">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-400">Schedule</p>
            <h2 className="mt-2 font-display text-[2rem] font-bold leading-tight tracking-tight text-white md:text-[2.4rem]">
              Itinerary
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-white/55">
              Concerts, vespers and outreach. Save an event to your calendar or share it with friends.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {sorted.length > 0 && (
              <button type="button" onClick={() => void downloadSchedule()} className={btnGhost}>
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                PDF
              </button>
            )}
            {isAdmin && (
              <button
                type="button"
                onClick={onAdd}
                className="btn-solid fill-accent !px-4 !py-2.5"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                Add event
              </button>
            )}
          </div>
        </div>

        {/* Next up */}
        {nextUp && (
          <div className="mb-10 grid gap-5 rounded-2xl border border-white/10 bg-slate-900 p-5 md:grid-cols-[1fr_auto] md:items-center md:p-6">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-amber-400">Next up</p>
              <h3 className="mt-1.5 font-display text-xl font-semibold leading-snug text-white md:text-2xl">
                {nextUp.event}
              </h3>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/55">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                  {formatDate(nextUp.date)}
                  {nextUp.time ? ` · ${nextUp.time}` : ""}
                </span>
                {nextUp.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    {nextUp.location}
                  </span>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {renderCalendarMenu(nextUp)}
                <button type="button" onClick={() => onBookSelect(nextUp.event)} className="btn-solid fill-accent !py-2 !px-4 !text-xs">
                  Book the chorus
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4 border-t border-white/10 pt-4 md:flex-col md:border-l md:border-t-0 md:pl-8 md:pt-0 md:text-center">
              <div>
                <p className="font-display text-2xl font-bold text-white">{countdown(nextUp) ?? "—"}</p>
                <p className="text-[11px] text-white/45">until start</p>
              </div>
            </div>
          </div>
        )}

        {/* Filters + search */}
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div role="tablist" aria-label="Filter events" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
            {TABS.map(({ id, label }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  onClick={() => setTab(id)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    active
                      ? "bg-white text-slate-950"
                      : "border border-white/15 text-white/60 hover:border-white/35 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <label className="relative block md:w-64">
            <span className="sr-only">Search events</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search events"
              className="h-9 w-full rounded-full border border-white/15 bg-transparent pl-9 pr-4 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-amber-400/70"
            />
          </label>
        </div>

        {/* List */}
        {visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 px-6 py-14 text-center">
            <p className="text-sm text-white/60">
              {query ? "No events match your search." : sorted.length === 0 ? "No events scheduled yet." : "No events in this view."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-white/10 border-y border-white/10">
            <AnimatePresence initial={false}>
              {visible.map((item) => {
                const w = eventWindow(item);
                const past = isPast(item, now);
                const isFav = favorites.includes(item.id);
                const hasReminder = reminders.includes(item.id);
                const mediaUrl = item.mediaUrl || "";
                const isVideo = item.mediaType === "video" || /\.(mp4|webm|mov)(\?.*)?$/i.test(mediaUrl);
                const cat = categoryOf(item);

                return (
                  <motion.li
                    key={item.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`grid grid-cols-[3.25rem_1fr] gap-4 py-5 md:grid-cols-[4.5rem_1fr_auto] md:gap-6 ${past ? "opacity-70" : ""}`}
                  >
                    {/* Date */}
                    <div className="text-center">
                      <p className="font-display text-2xl font-bold leading-none text-white">
                        {w ? w.start.getDate() : "--"}
                      </p>
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-white/45">
                        {w ? w.start.toLocaleDateString("en-US", { month: "short" }) : ""}
                      </p>
                    </div>

                    {/* Details */}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-semibold text-amber-400">{CATEGORY_LABEL[cat]}</span>
                        {past && <span className="text-[11px] text-white/40">· Past</span>}
                        {item.status === "Tentative" && <span className="text-[11px] text-white/40">· Tentative</span>}
                      </div>

                      <h3 className="mt-1 text-base font-semibold leading-snug text-white md:text-lg">{item.event}</h3>

                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/50">
                        {item.time && (
                          <span>{item.time}</span>
                        )}
                        {item.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" aria-hidden="true" />
                            {item.location}
                          </span>
                        )}
                        {item.host && <span>Host: {item.host}</span>}
                      </div>

                      {item.notes && !/https?:\/\//.test(item.notes) && (
                        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/55">{item.notes}</p>
                      )}

                      {/* Actions on phones (under the details) */}
                      <div className="mt-3 md:hidden">{renderActions(item)}</div>

                      {isAdmin && (
                        <div className="mt-3 flex items-center gap-1.5">
                          <button type="button" onClick={() => onEdit(item)} className={iconBtn} aria-label={`Edit ${item.event}`} title="Edit">
                            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(item.id)}
                            className={iconBtn}
                            aria-label={`Delete ${item.event}`}
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Desktop column: media thumbnail + actions */}
                    <div className="hidden flex-col items-end gap-2 md:flex">
                      {mediaUrl && (
                        <button
                          type="button"
                          onClick={() => setMedia({ url: mediaUrl, type: isVideo ? "video" : "image", title: item.event })}
                          className="relative mb-1 h-16 w-24 overflow-hidden rounded-lg border border-white/10 bg-slate-800"
                          aria-label={`Open media for ${item.event}`}
                        >
                          {isVideo ? (
                            <span className="grid h-full w-full place-items-center text-white/80">
                              <Play className="h-5 w-5" aria-hidden="true" />
                            </span>
                          ) : (
                            <img src={mediaUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                          )}
                        </button>
                      )}
                      {renderActions(item)}
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}

        {/* Sign-in hint for favourites */}
        {!user && sorted.length > 0 && (
          <p className="mt-6 text-xs text-white/40">
            Favourites are saved on this device.{" "}
            <button type="button" onClick={onGoogleLogin} className="text-amber-400 underline underline-offset-4 hover:text-amber-300">
              Sign in
            </button>{" "}
            to keep them across devices.
          </p>
        )}
      </div>

      {/* Media viewer */}
      <AnimatePresence>
        {media && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={media.title}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/95 p-4"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setMedia(null);
            }}
          >
            <button
              type="button"
              onClick={() => setMedia(null)}
              aria-label="Close media viewer"
              className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
            <div className="max-h-[90vh] max-w-4xl">
              {media.type === "video" ? (
                <video src={media.url} controls autoPlay playsInline className="max-h-[82vh] max-w-full rounded-xl" />
              ) : (
                <img src={media.url} alt={media.title} className="max-h-[82vh] max-w-full rounded-xl object-contain" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
