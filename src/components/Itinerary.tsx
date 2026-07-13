import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ItineraryItem } from "../types";
import { 
  CalendarDays, MapPin, ShieldCheck, Clock, Plus, Trash2, Edit, Play, 
  Minimize2, ZoomIn, Eye, ChevronRight, Upload, X, Check, Filter, 
  Newspaper, Camera, Film, AlertCircle, RefreshCw, Send, HelpCircle, Heart, Share2,
  Bell, BellRing, CalendarPlus, Download, FileText
} from "lucide-react";

import { User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, setDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "../lib/firebase";
import { jsPDF } from "jspdf";
import { uploadMedia } from "../lib/mediaUpload";
const sdaLogo = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Seventh-day_Adventist_Church_logo_svg.svg/320px-Seventh-day_Adventist_Church_logo_svg.svg.png";

interface ItineraryProps {
  items: ItineraryItem[];
  isAdmin: boolean;
  adminPasscode: string | null;
  onRefresh: () => void;
  onAdd: () => void;
  onEdit: (item: ItineraryItem) => void;
  onDelete: (id: string) => void;
  onBookSelect: (eventName: string) => void;
  user?: FirebaseUser | null;
  onGoogleLogin?: () => void;
  theme?: string;
}

export default function Itinerary({ 
  items, 
  isAdmin, 
  adminPasscode,
  onRefresh, 
  onAdd, 
  onEdit, 
  onDelete, 
  onBookSelect,
  user,
  onGoogleLogin,
  theme = "dark"
}: ItineraryProps) {
  const isDark = theme === "dark";
  // Favorites logic
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("kachamba_favorites");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Bookmarked local reminders state
  const [bookmarkedReminders, setBookmarkedReminders] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("kachamba_event_reminders");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeReminderMenuId, setActiveReminderMenuId] = useState<string | null>(null);

  const toggleBookmarkReminder = (id: string) => {
    const nextList = bookmarkedReminders.includes(id)
      ? bookmarkedReminders.filter(item => item !== id)
      : [...bookmarkedReminders, id];
    setBookmarkedReminders(nextList);
    try {
      localStorage.setItem("kachamba_event_reminders", JSON.stringify(nextList));
    } catch (err) {
      console.error("Local storage bookmark save error", err);
    }
  };

  const handleDownloadICS = (item: ItineraryItem) => {
    const title = item.event;
    const description = item.notes || `Choral mission by ${item.host || "Kachamba Chorus"}`;
    const location = item.location;
    
    let startTime = "090000";
    let endTime = "110000";
    
    if (item.time) {
      const timeMatch = item.time.match(/(\d{1,2})[.:](\d{2})/);
      if (timeMatch) {
        const hours = parseInt(timeMatch[1]).toString().padStart(2, '0');
        const minutes = parseInt(timeMatch[2]).toString().padStart(2, '0');
        startTime = `${hours}${minutes}00`;
        const endHours = (parseInt(timeMatch[1]) + 2).toString().padStart(2, '0');
        endTime = `${endHours}${minutes}00`;
      }
    }

    const dateStr = item.date.replace(/-/g, ""); // YYYYMMDD
    const startStamp = `${dateStr}T${startTime}`;
    const endStamp = `${dateStr}T${endTime}`;
    
    const icsLines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Kachamba Chorus//Adventist News Event Calendar//EN",
      "BEGIN:VEVENT",
      `UID:${item.id}@kachambachorus.org`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
      `DTSTART:${startStamp}`,
      `DTEND:${endStamp}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${description.replace(/\n/g, "\\n")}`,
      `LOCATION:${location}`,
      "END:VEVENT",
      "END:VCALENDAR"
    ];

    const blob = new Blob([icsLines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_reminder.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getGoogleCalendarURL = (item: ItineraryItem): string => {
    const title = encodeURIComponent(item.event);
    const description = encodeURIComponent(item.notes || `Choral mission by ${item.host || "Kachamba Chorus"}`);
    const location = encodeURIComponent(item.location);
    
    let startTime = "090000";
    let endTime = "110000";
    
    if (item.time) {
      const timeMatch = item.time.match(/(\d{1,2})[.:](\d{2})/);
      if (timeMatch) {
        const hours = parseInt(timeMatch[1]).toString().padStart(2, '0');
        const minutes = parseInt(timeMatch[2]).toString().padStart(2, '0');
        startTime = `${hours}${minutes}00`;
        const endHours = (parseInt(timeMatch[1]) + 2).toString().padStart(2, '0');
        endTime = `${endHours}${minutes}00`;
      }
    }

    const dateStr = item.date.replace(/-/g, "");
    const datesParam = `${dateStr}T${startTime}/${dateStr}T${endTime}`;
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${datesParam}&details=${description}&location=${location}`;
  };
  
  useEffect(() => {
    if (user) {
      const fetchFavorites = async () => {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data().favorites) {
            const remoteFavs = docSnap.data().favorites as string[];
            setFavorites(remoteFavs);
            try {
              localStorage.setItem("kachamba_favoritesRef_" + user.uid, JSON.stringify(remoteFavs));
              localStorage.setItem("kachamba_favorites", JSON.stringify(remoteFavs));
            } catch (storageErr) {
              console.warn("Failed to update local favorites cache:", storageErr);
            }
          }
        } catch (error: any) {
          // If the network request fails because the client is offline or firebase fails,
          // we gracefully fallback to the user's cached user-specific favorites.
          console.warn("Error fetching favorites from Firestore, using offline cache:", error?.message || error);
          try {
            const cached = localStorage.getItem("kachamba_favoritesRef_" + user.uid);
            if (cached) {
              setFavorites(JSON.parse(cached));
            }
          } catch {
            // keep current state
          }
        }
      };
      fetchFavorites();
    } else {
      // If not logged in, fetch general local favorites
      try {
        const saved = localStorage.getItem("kachamba_favorites");
        setFavorites(saved ? JSON.parse(saved) : []);
      } catch {
        setFavorites([]);
      }
    }
  }, [user]);

  const toggleFavorite = async (id: string) => {
    if (!user) {
      if (onGoogleLogin) onGoogleLogin();
      return;
    }
    
    const isFav = favorites.includes(id);
    const newFavs = isFav ? favorites.filter(f => f !== id) : [...favorites, id];
    setFavorites(newFavs);

    try {
      localStorage.setItem("kachamba_favorites", JSON.stringify(newFavs));
      localStorage.setItem("kachamba_favoritesRef_" + user.uid, JSON.stringify(newFavs));
    } catch (err) {
      console.warn("Local storage write error:", err);
    }

    try {
      const docRef = doc(db, "users", user.uid);
      await setDoc(docRef, {
        favorites: isFav ? arrayRemove(id) : arrayUnion(id)
      }, { merge: true });
    } catch (error: any) {
      console.warn("Error updating remote favorites, relying on offline local storage:", error?.message || error);
      // Since we updated local storage cache successfully, do NOT revert state on temporary network failures!
    }
  };

  // Lighbox state
  const [activeMedia, setActiveMedia] = useState<{ url: string; type: 'image' | 'video' | ''; eventTitle: string } | null>(null);
  
  // Category Filtering
  const [activeTab, setActiveTab] = useState<"all" | "upcoming" | "charity" | "revival" | "past">("all");
  const [itinerarySearch, setItinerarySearch] = useState("");
  
  // In-place inline quick edits
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ItineraryItem | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // In-place direct media uploader state
  const [mediaTargetId, setMediaTargetId] = useState<string | null>(null);
  const [mediaUrlInput, setMediaUrlInput] = useState("");
  const [mediaTypeInput, setMediaTypeInput] = useState<'image' | 'video'>('image');
  const [localFileBase64, setLocalFileBase64] = useState<string | null>(null);
  const [localFileType, setLocalFileType] = useState<'image' | 'video' | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // Copied item ID state for sharing
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null);

  // Find the next upcoming event dynamically
  const nextUpcomingEvent = [...items]
    .filter(item => {
      if (item.status === "Past") return false;
      try {
        const itemDate = new Date(item.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return itemDate >= today;
      } catch {
        return false;
      }
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number, total: number } | null>(null);

  const [mpesaConfig, setMpesaConfig] = useState<any>({
    tillNumber: "4119041",
    tillName: "Kachok Ambassadors Chorus",
    tillImage: "",
    tillType: "buy_goods",
    receiptTitle: "",
    receiptLogo: "https://www.image2url.com/r2/default/images/1781098447744-9bfd4cd8-4c62-4a1a-b218-7ccd6f1b36d2.png",
    receiptExtraLogo: "",
    receiptMessage: "We have received your generous gift. May God bless you abundantly.",
    receiptLayout: "modern",
    receiptHeaderSize: "text-xl",
    receiptHeaderColor: "text-slate-800",
    receiptBodySize: "text-sm",
    receiptBodyColor: "text-slate-500",
    receiptTextAlign: "text-center",
    receiptFontFamily: "font-sans"
  });

  useEffect(() => {
    const loadMpesaConfig = async () => {
      try {
        const res = await fetch("/api/mpesa/config");
        if (res.ok) {
          const data = await res.json();
          setMpesaConfig(data);
        }
      } catch (err) {
        console.error("Failed to load configuration inside Itinerary component:", err);
      }
    };
    loadMpesaConfig();
  }, []);

  useEffect(() => {
    if (!nextUpcomingEvent) {
      setTimeLeft(null);
      return;
    }

    const calculateTime = () => {
      const dateParts = nextUpcomingEvent.date.split("-");
      let target: Date;
      if (dateParts.length === 3) {
        target = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]), 0, 0, 0);
      } else {
        target = new Date(nextUpcomingEvent.date);
      }

      const diff = target.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeft({ days, hours, minutes, seconds, total: diff });
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);

    return () => clearInterval(timer);
  }, [nextUpcomingEvent?.date, nextUpcomingEvent?.id]);

  const handleCopyItinerary = (id: string, eventName: string, date: string, location: string) => {
    const shareableUrl = `${window.location.origin}/?event=${id}`;
    const textToCopy = `Kachamba Chorus Sabbath Vesper Alert! 🎶\n\n📢 *${eventName}*\n🗓️ Date: ${formatFriendlyDate(date)}\n📍 Venue: ${location}\n\nJoin us for fellowship & worship! Link details: ${shareableUrl}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedItemId(id);
      setTimeout(() => setCopiedItemId(null), 2000);
    }).catch(err => {
      console.error("Clipboard copy failed", err);
    });
  };

  // Helper to categorize items
  const getCategoryTag = (item: ItineraryItem): { label: string, color: string } => {
    const text = (item.event + " " + (item.notes || "") + " " + (item.host || "")).toLowerCase();
    
    if (text.includes("bullet") || text.includes("brighter") || text.includes("surgery") || text.includes("fund") || text.includes("charity") || text.includes("brighon") || text.includes("victim") || text.includes("police")) {
      return { label: "MEDICAL CHARITY", color: "bg-rose-600 text-rose-50 border-rose-500/20" };
    }
    if (text.includes("revival") || text.includes("camp") || text.includes("vesper") || text.includes("crusade") || text.includes("joint") || text.includes("combined")) {
      return { label: "SABBATH REVIVAL", color: "bg-amber-600 text-amber-50 border-amber-500/20" };
    }
    if (item.status === "Past") {
      return { label: "PAST MISSION REPORT", color: "bg-slate-800 text-slate-300 border-slate-700/50" };
    }
    return { label: "WORSHIP", color: "bg-blue-600 text-blue-50 border-blue-500/20" };
  };

  // Filter items based on activeTab, search query, and sort chronologically
  const filteredItems = items.filter(item => {
    let matchesTab = true;
    if (activeTab === "past") {
      matchesTab = item.status === "Past";
    } else if (activeTab === "upcoming") {
      matchesTab = item.status !== "Past";
    } else if (activeTab !== "all") {
      const tag = getCategoryTag(item).label;
      if (activeTab === "charity") {
        matchesTab = tag === "MEDICAL CHARITY";
      } else if (activeTab === "revival") {
        matchesTab = tag === "SABBATH REVIVAL" || tag === "CHORAL WORSHIP";
      }
    }

    if (!matchesTab) return false;

    if (itinerarySearch.trim() !== "") {
      const q = itinerarySearch.toLowerCase();
      const eventMatch = item.event.toLowerCase().includes(q);
      const notesMatch = (item.notes || "").toLowerCase().includes(q);
      const locationMatch = (item.location || "").toLowerCase().includes(q);
      const hostMatch = (item.host || "").toLowerCase().includes(q);
      const categoryMatch = getCategoryTag(item).label.toLowerCase().includes(q);
      return eventMatch || notesMatch || locationMatch || hostMatch || categoryMatch;
    }

    return true;
  }).sort((a, b) => {
    try {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    } catch {
      return 0;
    }
  });

  // Calculate counts for badges
  const getCount = (tab: "all" | "upcoming" | "charity" | "revival" | "past") => {
    return items.filter(item => {
      if (tab === "all") return true;
      if (tab === "past") return item.status === "Past";
      if (tab === "upcoming") return item.status !== "Past";
      
      const tag = getCategoryTag(item).label;
      if (tab === "charity") return tag === "MEDICAL CHARITY";
      if (tab === "revival") return tag === "SABBATH REVIVAL" || tag === "CHORAL WORSHIP";
      return true;
    }).length;
  };

  // Format date natively
  const formatFriendlyDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    } catch {
      return dateStr;
    }
  };

  // Helper to load image for pdf
  const loadImageData = async (url: string): Promise<{ dataUrl: string, width: number, height: number } | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          try {
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            resolve({ dataUrl, width: img.width, height: img.height });
          } catch (e) {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  };

  // Generate and download premium quality vector PDF of the choral schedule
  const downloadItineraryPDF = async (downloadAll: boolean = false) => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2); // 180mm

      let y = 20;

      // Draw topmost accent bar
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(margin, y, contentWidth, 3, "F");
      y += 8;

      const logoUrl = mpesaConfig.receiptLogo || "https://www.image2url.com/r2/default/images/1781098447744-9bfd4cd8-4c62-4a1a-b218-7ccd6f1b36d2.png";
      const logoData = await loadImageData(logoUrl);
      if (logoData && logoData.dataUrl) {
         doc.addImage(logoData.dataUrl, 'JPEG', pageWidth - margin - 20, 25, 20, 20);
      }

      // Header block
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42); // slate-900
      const dynTitle = (mpesaConfig.receiptTitle || mpesaConfig.tillName || "KACHAMBA CHORUS").toUpperCase();
      doc.setFontSize(dynTitle.length > 22 ? 16 : 22);
      doc.text(dynTitle, margin, y);
      y += 7;

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(180, 83, 9); // Amber-700
      doc.text("OFFICIAL CHORAL MISSIONS GAZETTE & ITINERARY", margin, y);
      y += 5.5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139); // Slate-500
      const filterLabel = downloadAll ? "COMPLETE FULL ITINERARY" : (activeTab.toUpperCase() + " MISSIONS");
      const exportTime = new Date().toLocaleDateString("en-US", { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      doc.text(`W.K.U.C. Ministry Gazette  •  Status Filters: ${filterLabel}  •  Exported: ${exportTime}`, margin, y);
      y += 5;

      // Header divider line (thin card separators)
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;

      const parentItems = downloadAll ? items : filteredItems;

      if (parentItems.length === 0) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(11);
        doc.setTextColor(100, 116, 139);
        doc.text("No active itinerary matching this category selection details.", margin, y);
      } else {
        for (let index = 0; index < parentItems.length; index++) {
          const item = parentItems[index];
          const itemNotes = item.notes || "";
          
          let mediaData = null;
          if (item.mediaUrl && item.mediaType === "image") {
            mediaData = await loadImageData(item.mediaUrl);
          }

          // Split notes to size to estimate height precisely
          const noteTextLines: string[] = itemNotes 
            ? doc.splitTextToSize(itemNotes, contentWidth - 20) 
            : [];
          
          const titleTextLines: string[] = doc.splitTextToSize(item.event.toUpperCase(), contentWidth - 15);
          const locationLines: string[] = doc.splitTextToSize(`Venue: ${item.location}`, contentWidth - 15);

          // Height estimation:
          let itemHeight = 32;
          itemHeight += titleTextLines.length * 5.5;
          itemHeight += locationLines.length * 5;
          if (itemNotes) {
            itemHeight += 10 + (noteTextLines.length * 4.5);
          }
          let imgHeight = 0;
          if (mediaData) {
             // Calculate image size to fit width of contentWidth - 25, while maintaining aspect ratio
             const maxImgW = contentWidth - 25;
             imgHeight = (maxImgW * mediaData.height) / mediaData.width;
             // Limit max height to 60 to prevent too large images
             if (imgHeight > 60) {
               imgHeight = 60;
             }
             itemHeight += imgHeight + 8;
          }

          // Check if drawing this card overrides page margin limits
          if (y + itemHeight > pageHeight - margin) {
            doc.addPage();
            y = 20;

            // Header for next page
            doc.setFillColor(15, 23, 42);
            doc.rect(margin, y, contentWidth, 1.5, "F");
            y += 5;

            // Ensure our logo appears in every print page
            if (logoData && logoData.dataUrl) {
              doc.addImage(logoData.dataUrl, 'JPEG', pageWidth - margin - 14, y - 2, 10, 10);
            }

            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            doc.setTextColor(100, 116, 139);
            doc.text(`${(mpesaConfig.receiptTitle || mpesaConfig.tillName || "KACHAMBA CHORUS").toUpperCase()} MINISTRY GAZETTE  •  Page ${doc.getNumberOfPages()}`, margin, y);
            y += 4;

            doc.setDrawColor(241, 245, 249);
            doc.line(margin, y, pageWidth - margin, y);
            y += 10;
          }

          const startY = y;

          // Background card fill
          doc.setFillColor(250, 250, 250); // slight gray panel
          doc.rect(margin, y, contentWidth, itemHeight, "F");

          // Sidebar left border accent
          let r = 100, g = 116, b = 139; // grey (past)
          if (item.status === "Confirmed") {
            r = 217; g = 119; b = 6;  // amber-600
          } else if (item.status === "Tentative") {
            r = 225; g = 29; b = 72;  // rose-600
          }
          doc.setFillColor(r, g, b);
          doc.rect(margin, y, 3, itemHeight, "F");

          // Outer card border line
          doc.setDrawColor(226, 232, 240); // slate-200
          doc.setLineWidth(0.25);
          doc.rect(margin, y, contentWidth, itemHeight, "S");

          // Sequence Index and Status badge
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(r, g, b);
          doc.text(`MISSION SECTOR #${index + 1}    [${item.status.toUpperCase()}]`, margin + 6, y + 6);

          // Right aligned Date & Time
          const dateStr = formatFriendlyDate(item.date);
          const timeStr = item.time ? ` @ ${item.time}` : "";
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9.5);
          doc.setTextColor(51, 65, 85); // slate-700
          doc.text(`${dateStr}${timeStr}`, pageWidth - margin - 6, y + 6, { align: "right" });

          // Event Title Text drawing
          y += 12;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(11.5);
          doc.setTextColor(15, 23, 42); // slate-900
          titleTextLines.forEach((tLine) => {
            doc.text(tLine, margin + 6, y);
            y += 5.5;
          });

          // Venue Location
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9.5);
          doc.setTextColor(71, 85, 105); // slate-600
          locationLines.forEach((lLine) => {
            doc.text(lLine, margin + 6, y);
            y += 5;
          });

          // Lead Host Body
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(100, 116, 139);
          doc.text(`Lead Host: ${item.host || "Ministry Organizers"}`, margin + 6, y);
          y += 5;

          // Classification Tag
          const classification = getCategoryTag(item).label;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(r, g, b);
          doc.text(`Classification: ${classification}`, margin + 6, y);

          // Pastoral Song Directives notes
          if (itemNotes) {
            y += 5.5;
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8.5);
            doc.setTextColor(51, 65, 85);
            doc.text("Worship Directives & Choir Directs:", margin + 6, y);
            y += 4.5;

            doc.setFont("helvetica", "italic");
            doc.setFontSize(8.5);
            doc.setTextColor(100, 116, 139);
            noteTextLines.forEach((noteLine) => {
              doc.text(`"${noteLine}"`, margin + 8, y);
              y += 4.5;
            });
          }

          if (mediaData) {
            y += 4;
            const maxImgW = contentWidth - 25;
            let drawW = maxImgW;
            let drawH = imgHeight;
            // Draw centered slightly if width is smaller but we made maxImgW match our layout.
            // Using maxImgW is fine. Actually, maintaining aspect ratio. 
            drawW = (drawH * mediaData.width) / mediaData.height;
            doc.addImage(mediaData.dataUrl, 'JPEG', margin + 6, y, drawW, drawH);
            y += drawH + 4;
          }

          // Advance cursor space to bottom of element
          y = startY + itemHeight + 6;
        }
      }

      doc.save(`Kachamba_Chorus_Schedule_${downloadAll ? 'complete_itinerary' : activeTab.toLowerCase()}.pdf`);
    } catch (err) {
      console.error("Failed to compile or generate PDF file download:", err);
    }
  };

  // Generate and download a professional, print-friendly liturgical bulletin schedule PDF for local church distribution
  const downloadProfessionalSchedulePDF = async () => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 12;
      const contentWidth = pageWidth - (margin * 2);

      const drawLiturgicalFrame = () => {
        // Deep primary outline frame
        doc.setDrawColor(15, 23, 42);
        doc.setLineWidth(0.45);
        doc.rect(margin, margin, contentWidth, pageHeight - (margin * 2), "S");
        
        // Delicate secondary inner frame
        doc.setLineWidth(0.15);
        doc.rect(margin + 1.2, margin + 1.2, contentWidth - 2.4, pageHeight - (margin * 2) - 2.4, "S");

        // Elegant corner intersecting crossbars (traditional liturgical corner markings)
        const offset = 1.2;
        const lineLen = 4.5;
        doc.setLineWidth(0.22);
        
        // Top-Left corner intersecting accents
        doc.line(margin + offset, margin + offset + lineLen, margin + offset + lineLen, margin + offset + lineLen);
        doc.line(margin + offset + lineLen, margin + offset, margin + offset + lineLen, margin + offset + lineLen);

        // Top-Right corner intersecting accents
        doc.line(pageWidth - margin - offset - lineLen, margin + offset + lineLen, pageWidth - margin - offset, margin + offset + lineLen);
        doc.line(pageWidth - margin - offset - lineLen, margin + offset, pageWidth - margin - offset - lineLen, margin + offset + lineLen);

        // Bottom-Left corner intersecting accents
        doc.line(margin + offset, pageHeight - margin - offset - lineLen, margin + offset + lineLen, pageHeight - margin - offset - lineLen);
        doc.line(margin + offset + lineLen, pageHeight - margin - offset - lineLen, margin + offset + lineLen, pageHeight - margin - offset);

        // Bottom-Right corner intersecting accents
        doc.line(pageWidth - margin - offset - lineLen, pageHeight - margin - offset - lineLen, pageWidth - margin - offset, pageHeight - margin - offset - lineLen);
        doc.line(pageWidth - margin - offset - lineLen, pageHeight - margin - offset - lineLen, pageWidth - margin - offset - lineLen, pageHeight - margin - offset);
      };

      const renderDocumentHeader = (pageNum: number) => {
        drawLiturgicalFrame();
        
        // DRAW OFFICIAL PASTORAL MINISTRY SEAL
        const sealX = pageWidth - margin - 15;
        const sealY = margin + 13.5;
        
        // Royal Outer Ring
        doc.setDrawColor(180, 83, 9); // Golden amber
        doc.setLineWidth(0.4);
        doc.circle(sealX, sealY, 8.5, "S");
        
        // Delicate Inner Ring
        doc.setLineWidth(0.12);
        doc.circle(sealX, sealY, 6.8, "S");

        // Sacred Central Latin Cross
        doc.setLineWidth(0.55);
        doc.line(sealX, sealY - 4.2, sealX, sealY + 3.8); // Vertical bar
        doc.line(sealX - 2.5, sealY - 1.4, sealX + 2.5, sealY - 1.4); // Horizontal bar

        // Circular Text Tagging
        doc.setFont("times", "bolditalic");
        doc.setFontSize(4);
        doc.setTextColor(180, 83, 9);
        doc.text("KACHAMBA", sealX, sealY - 4.8, { align: "center" });
        doc.text("MINISTRY", sealX, sealY + 5.2, { align: "center" });

        // Build Title Elements
        let currentY = margin + 6;
        doc.setFont("times", "bold");
        doc.setFontSize(14.5);
        doc.setTextColor(15, 23, 42);
        doc.text("KACHAMBA CHORUS ADVENTIST MINISTRY", pageWidth / 2, currentY, { align: "center" });
        currentY += 5.5;

        doc.setFont("times", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);
        doc.text("Proclaiming the Three Angels' Messages in Sacred Song and Acapella Harmony", pageWidth / 2, currentY, { align: "center" });
        currentY += 4.5;

        doc.setFont("times", "bolditalic");
        doc.setFontSize(11);
        doc.setTextColor(180, 83, 9);
        doc.text("OFFICIAL WORSHIP SERVICES & CONCERT SCHEDULE", pageWidth / 2, currentY, { align: "center" });
        currentY += 5;

        doc.setDrawColor(148, 163, 184);
        doc.setLineWidth(0.35);
        doc.line(margin + 15, currentY, pageWidth - margin - 25, currentY); // Spaced slightly to merge elegantly with seal
        currentY += 4.5;

        doc.setFont("courier", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        const dateStr = new Date().toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        doc.text(`Gazette Serial: KC-2026/BULLETIN-EDITION  •  Exported: ${dateStr}  •  Page ${pageNum}`, pageWidth / 2, currentY, { align: "center" });
        return currentY + 6;
      };

      const sortedItems = [...items].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      let y = renderDocumentHeader(1);

      if (sortedItems.length === 0) {
        doc.setFont("times", "italic");
        doc.setFontSize(11);
        doc.setTextColor(100, 116, 139);
        doc.text("No active schedule events recorded. Please contact the Secretariat.", pageWidth / 2, y + 20, { align: "center" });
      } else {
        const renderTableHeader = (headerY: number) => {
          doc.setFillColor(248, 250, 252);
          doc.rect(margin + 3, headerY, contentWidth - 6, 8, "F");
          doc.setDrawColor(15, 23, 42);
          doc.setLineWidth(0.35);
          doc.rect(margin + 3, headerY, contentWidth - 6, 8, "S");
          doc.setFont("times", "bold");
          doc.setFontSize(8.5);
          doc.setTextColor(15, 23, 42);
          doc.text("DATE & HARVEST HOUR", margin + 6, headerY + 5.5);
          doc.text("EVENT TITLE / SERVICE TYPE", margin + 50, headerY + 5.5);
          doc.text("SPONSOR HOST & PHYSICAL LOCATION", margin + 108, headerY + 5.5);
          doc.text("CHURCH MEMO & ANNOUNCEMENT", margin + 152, headerY + 5.5);
        };

        renderTableHeader(y);
        y += 8;

        for (let idx = 0; idx < sortedItems.length; idx++) {
          const item = sortedItems[idx];
          const eventDate = new Date(item.date).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' });
          const eventTime = item.time || "Sabbath Hours";
          const eventDateStr = `${eventDate}\n(${eventTime})`;

          const title = item.event.toUpperCase();
          const classification = getCategoryTag(item).label;
          const eventTitleText = `${title}\n[${classification}]`;

          const host = item.host || "SDA Sanctuary Host";
          const location = item.location;
          const sponsorHostText = `${host}\n${location}`;
          const notes = item.notes || "Join the Ambassadors in celestial praise. All visitors are welcomed.";

          const dateLines = doc.splitTextToSize(eventDateStr, 40);
          const titleLines = doc.splitTextToSize(eventTitleText, 54);
          const hostLines = doc.splitTextToSize(sponsorHostText, 42);
          const notesLines = doc.splitTextToSize(notes, 31);

          const maxLines = Math.max(dateLines.length, titleLines.length, hostLines.length, notesLines.length);
          const lineHeight = 4.2;
          const rowPadding = 6;
          const rowHeight = (maxLines * lineHeight) + rowPadding;

          if (y + rowHeight > pageHeight - margin - 15) {
            doc.setFont("times", "italic");
            doc.setFontSize(7.5);
            doc.setTextColor(100, 116, 139);
            doc.text("* This pastoral itinerary is arranged for prayer requests, visitation, and mission alignments.", margin + 5, pageHeight - margin - 5);
            doc.text("Official Church Circulation *", pageWidth - margin - 5, pageHeight - margin - 5, { align: "right" });

            doc.addPage();
            y = renderDocumentHeader(doc.getNumberOfPages());
            renderTableHeader(y);
            y += 8;
          }

          if (idx % 2 === 1) {
            doc.setFillColor(252, 252, 252);
            doc.rect(margin + 3, y, contentWidth - 6, rowHeight, "F");
          }

          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.15);
          doc.line(margin + 3, y + rowHeight, pageWidth - margin - 3, y + rowHeight);

          doc.setFontSize(8);
          doc.setTextColor(40, 40, 40);

          doc.setFont("times", "bold");
          dateLines.forEach((line, lIdx) => {
            doc.text(line, margin + 6, y + 4.5 + (lIdx * lineHeight));
          });

          titleLines.forEach((line, lIdx) => {
            if (line.trim().startsWith('[')) {
              doc.setFont("times", "italic");
              doc.setTextColor(180, 83, 9);
            } else {
              doc.setFont("times", "bold");
              doc.setTextColor(15, 23, 42);
            }
            doc.text(line, margin + 50, y + 4.5 + (lIdx * lineHeight));
          });
          doc.setTextColor(40, 40, 40);

          hostLines.forEach((line, lIdx) => {
            if (lIdx === 0) {
              doc.setFont("times", "bold");
            } else {
              doc.setFont("times", "normal");
            }
            doc.text(line, margin + 108, y + 4.5 + (lIdx * lineHeight));
          });

          doc.setFont("times", "italic");
          doc.setFontSize(7.5);
          doc.setTextColor(71, 85, 105);
          notesLines.forEach((line, lIdx) => {
            doc.text(line, margin + 152, y + 4.5 + (lIdx * lineHeight));
          });

          y += rowHeight;
        }

        doc.setDrawColor(15, 23, 42);
        doc.setLineWidth(0.3);
        doc.line(margin + 3, y, pageWidth - margin - 3, y);
      }

      if (y + 30 > pageHeight - margin - 15) {
        doc.addPage();
        y = renderDocumentHeader(doc.getNumberOfPages());
      }

      y += 10;
      doc.setFont("times", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text("Official Endorsement Authorities:", margin + 6, y);
      y += 6;

      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.2);
      doc.line(margin + 6, y, margin + 65, y);
      doc.line(pageWidth - margin - 65, y, pageWidth - margin - 6, y);

      doc.setFont("times", "italic");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("Ambassador Chorus Secretary-General", margin + 6, y + 4);
      doc.text("Patron & District Chaplain", pageWidth - margin - 6, y + 4, { align: "right" });

      y += 12;
      doc.setFont("times", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(180, 83, 9);
      doc.text("FOR LOCAL CHURCH DISTRIBUTION, PARISH BULLETIN INSERTION, & BOARD POSTINGS.", pageWidth / 2, y, { align: "center" });

      doc.setFont("times", "italic");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text("* The Ambassador Ministry is an auxiliary body of the Seventh-day Adventist Church. All music is performed on a purely philanthropic basis.", margin + 5, pageHeight - margin - 5);
      doc.text("Official Church Circulation *", pageWidth - margin - 5, pageHeight - margin - 5, { align: "right" });

      doc.save("Kachamba_Chorus_Church_Bulletin_Schedule.pdf");
    } catch (err) {
      console.error("Failed to compile church bulletin schedule:", err);
    }
  };

  // Setup inline quick editing
  const startInlineEdit = (item: ItineraryItem) => {
    setEditingItemId(item.id);
    setEditForm({ ...item });
    setSaveError(null);
  };

  const cancelInlineEdit = () => {
    setEditingItemId(null);
    setEditForm(null);
    setSaveError(null);
  };

  // Submit inline quick edits directly to Express
  const handleInlineSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm || !adminPasscode) return;
    setSavingId(editForm.id);
    setSaveError(null);

    try {
      const res = await fetch(`/api/itinerary/${editForm.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": adminPasscode
        },
        body: JSON.stringify(editForm)
      });

      if (res.ok) {
        onRefresh();
        setEditingItemId(null);
        setEditForm(null);
      } else {
        const errData = await res.json().catch(() => ({}));
        setSaveError(errData.error || "Failed to save itinerary changes.");
      }
    } catch (error) {
      console.error(error);
      setSaveError("Network error. Please try again.");
    } finally {
      setSavingId(null);
    }
  };

  // Setup direct media uploader panel
  const openMediaUploader = (e: React.MouseEvent, item: ItineraryItem) => {
    e.stopPropagation();
    setMediaTargetId(item.id);
    const hasBase64 = item.mediaUrl?.startsWith("data:");
    if (hasBase64) {
      setLocalFileBase64(item.mediaUrl || "");
      setLocalFileType(item.mediaType || 'image');
      setMediaUrlInput("");
    } else {
      setLocalFileBase64(null);
      setLocalFileType(null);
      setMediaUrlInput(item.mediaUrl || "");
    }
    setMediaTypeInput((item.mediaType as any) || 'image');
    setFileError(null);
  };

  const closeMediaUploader = () => {
    setMediaTargetId(null);
    setLocalFileBase64(null);
    setLocalFileType(null);
    setFileError(null);
  };

  // Handle local photo/video file upload conversion
  const handleLocalFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError(null);
    if (!file) return;

    const type = file.type.startsWith('video') ? 'video' : 'image';

    // Support up to 100MB files (photos and video clips)
    if (file.size > 100 * 1024 * 1024) {
      setFileError("This file is too large. Please select a photo or video under 50MB.");
      return;
    }

    if (type === 'video') {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLocalFileBase64(event.target.result as string);
          setLocalFileType('video');
        } else {
          setFileError("Could not read uploaded local file correctly.");
        }
      };
      reader.onerror = () => setFileError("File loading error. Please try a different video.");
      reader.readAsDataURL(file);
    } else {
      // It's an image! Use FileReader to get a dataURL first so it works robustly in sandboxed iframes.
      try {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          if (!dataUrl) {
            setFileError("Failed to read image file.");
            return;
          }

          const image = document.createElement('img');
          image.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              const maxWidth = 3840;
              const maxHeight = 3840;
              let width = image.width;
              let height = image.height;

              if (width > height) {
                if (width > maxWidth) {
                  height = Math.round((height * maxWidth) / width);
                  width = maxWidth;
                }
              } else {
                if (height > maxHeight) {
                  width = Math.round((width * maxHeight) / height);
                  height = maxHeight;
                }
              }

              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              if (!ctx) {
                setLocalFileBase64(dataUrl);
                setLocalFileType('image');
                return;
              }

              ctx.drawImage(image, 0, 0, width, height);
              // Compress visually lossless to jpeg
              const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.95);
              setLocalFileBase64(compressedDataUrl);
              setLocalFileType('image');
            } catch (err) {
              console.error("Canvas compression failed, falling back to raw.", err);
              setLocalFileBase64(dataUrl);
              setLocalFileType('image');
            }
          };
          image.onerror = () => {
            // In extremely sandboxed situations, dynamic image loaders might be blocked entirely from scaling.
            // In that case, we fall back to the raw image base64 directly so the user is never stuck!
            console.warn("Dynamic image loading in canvas blocked. Falling back to raw base64.");
            setLocalFileBase64(dataUrl);
            setLocalFileType('image');
          };
          image.src = dataUrl;
        };
        reader.onerror = () => {
          setFileError("Failed to load file.");
        };
        reader.readAsDataURL(file);
      } catch (e) {
         setFileError("Image file loading error.");
      }
    }
  };

  // Save changes to media specifically
  const handleSaveMediaChange = async () => {
    if (!mediaTargetId || !adminPasscode) return;
    setSavingId(mediaTargetId);

    const originalItem = items.find(i => i.id === mediaTargetId);
    if (!originalItem) return;

    let finalMediaUrl = mediaUrlInput;
    let finalMediaType = mediaTypeInput;

    if (localFileBase64) {
      setFileError(null);
      try {
        const defaultFilename = localFileType === "video" ? "uploaded_video.mp4" : "uploaded_photo.jpg";
        finalMediaUrl = await uploadMedia(localFileBase64, adminPasscode, defaultFilename);
        finalMediaType = localFileType || "image";
      } catch (err: any) {
        setFileError(err.message || "Failed to upload file.");
        setSavingId(null);
        return;
      }
    }

    const payload = {
      ...originalItem,
      mediaUrl: finalMediaUrl,
      mediaType: finalMediaType || ""
    };

    try {
      const res = await fetch(`/api/itinerary/${mediaTargetId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": adminPasscode
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        onRefresh();
        closeMediaUploader();
      } else {
        const errData = await res.json().catch(() => ({}));
        setFileError(errData.error || "Failed to update media attachment on server.");
      }
    } catch {
      setFileError("Network issue while uploading media.");
    } finally {
      setSavingId(null);
    }
  };

  // Default fallback image if no mediaUrl is present for the card
  const defaultBanner = "https://www.image2url.com/r2/default/images/1781098447744-9bfd4cd8-4c62-4a1a-b218-7ccd6f1b36d2.png";

  return (
    <section 
      id="itinerary" 
      className="py-24 px-4 sm:px-6 md:px-12 bg-transparent text-white relative border-t border-b border-white/5 overflow-hidden"
    >
      {/* Background Soft Accents to soften dark mode */}
      <div className="absolute top-10 left-10 w-[500px] h-[500px] bg-amber-500/[0.02] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-rose-600/[0.02] rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Printable Header - Repeating on every page via print css position: fixed */}
        <div className="itinerary-print-header hidden print:flex items-center gap-4 border-b border-slate-350 pb-3 mb-8 w-full text-black">
          <img 
            src={sdaLogo} 
            alt="SDA Logo" 
            className="w-14 h-14 object-contain shrink-0" 
            referrerPolicy="no-referrer"
          />
          <div className="flex-1 text-left leading-none">
            <h1 className="text-2xl font-black uppercase text-black font-archivoblack tracking-tight leading-none mb-1">
              KACHAMBA CHORUS
            </h1>
            <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest font-glacial">
              Official Seventh-day Adventist Choral Ministry & Missions Itinerary
            </p>
          </div>
        </div>

        {/* Newspaper Style Editorial Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12 border-b border-slate-900 pb-10 print:hidden">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="h-[2px] w-8 bg-amber-500 block" />
              <span className="text-amber-400 font-mono text-[10px] tracking-widest uppercase font-bold">
                Missions Gazette
              </span>
            </div>
            <h2 className="font-sans font-extrabold text-4xl md:text-6xl tracking-tight text-white mb-2 leading-none uppercase">
              Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-rose-500 to-amber-300">Itinerary</span>
            </h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 font-sans text-xs text-slate-400">
              <span className="text-amber-500 font-semibold">West Kenya Union Conference</span>
              <span className="text-slate-600">•</span>
              <span>Charities & Live Music Schedules</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 print:hidden">
            <button
              onClick={downloadProfessionalSchedulePDF}
              className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 hover:opacity-95 text-slate-950 font-sans font-extrabold text-[11px] uppercase tracking-wider px-5 py-3.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-amber-500/10 active:scale-95 duration-100 font-bold"
              style={{ color: '#090d16' }}
              title="Download print-friendly official bulletin schedule PDF formatted for local church distribution"
            >
               <FileText className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
               <span>Download PDF</span>
            </button>
            {isAdmin && (
              <button
                id="btn-add-itinerary-ga"
                onClick={onAdd}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-sans font-extrabold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 active:scale-95 duration-150 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 shrink-0 stroke-[3]" />
                <span>Create New Schedule</span>
              </button>
            )}
          </div>
        </div>

        {/* Next Tour / Event Countdown Banner with 'Days Until' dynamic countdown timer */}
        {nextUpcomingEvent && timeLeft && (
          <div className="mb-12 p-[1px] bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 rounded-3xl shadow-2xl shadow-amber-500/[0.05] animate-in fade-in duration-700 print:hidden">
            <div className="bg-slate-950 rounded-[23px] p-6 md:p-8">
              {editingItemId === nextUpcomingEvent.id && editForm ? (
                <form onSubmit={handleInlineSave} className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-4">
                    <div className="flex items-center gap-2">
                      <Edit className="w-5 h-5 text-amber-400 stroke-[2.5]" />
                      <h4 className="font-sans font-black text-white uppercase tracking-tight text-lg">
                        Edit Countdown Event Details
                      </h4>
                    </div>
                    <span className="text-[9px] uppercase font-mono tracking-widest text-amber-500 font-extrabold bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded">
                      Live Portal Editor
                    </span>
                  </div>

                  {saveError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 text-xs flex items-center gap-2 font-sans">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{saveError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2 font-bold">Event & Core Title</label>
                      <input 
                        type="text" 
                        required
                        value={editForm.event || ""}
                        onChange={(e) => setEditForm({ ...editForm, event: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-400 text-xs font-sans"
                        placeholder="e.g. Sabbath Revival & Mission Concert"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2 font-bold">Location / Venue</label>
                      <input 
                        type="text" 
                        required
                        value={editForm.location || ""}
                        onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-400 text-xs font-sans"
                        placeholder="e.g. Kisumu Central SDA Church"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2 font-bold">Event Date</label>
                      <input 
                        type="date" 
                        required
                        value={editForm.date || ""}
                        onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-amber-300 outline-none focus:border-amber-400 text-xs font-sans font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2 font-bold">Scheduled Time</label>
                      <input 
                        type="text" 
                        value={editForm.time || ""}
                        onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-400 text-xs font-sans"
                        placeholder="e.g. 09:00 AM - 05:00 PM"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2 font-bold">Lead Host Body</label>
                      <input 
                        type="text" 
                        required
                        value={editForm.host || ""}
                        onChange={(e) => setEditForm({ ...editForm, host: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-400 text-xs font-sans"
                        placeholder="e.g. SDA Central Choir"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2 font-bold">Mission Status</label>
                      <select 
                        value={editForm.status || "Confirmed"}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-amber-300 outline-none focus:border-amber-400 text-xs font-sans font-semibold"
                      >
                        <option value="Confirmed">Confirmed</option>
                        <option value="Tentative">Tentative</option>
                        <option value="Past">Past</option>
                      </select>
                    </div>

                    <div className="md:col-span-2 lg:col-span-3">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2 font-bold">Pastoral Notes & Choral Directives</label>
                      <textarea 
                        rows={2}
                        value={editForm.notes || ""}
                        onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-400 text-xs font-sans"
                        placeholder="Song lists, dress codes, health directives..."
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-900">
                    <button 
                      type="button" 
                      onClick={cancelInlineEdit}
                      className="px-4 py-2.5 rounded-xl border border-slate-850 text-slate-400 hover:text-white hover:bg-slate-900 text-xs font-sans font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Nevermind
                    </button>
                    <button 
                      type="submit" 
                      disabled={savingId === editForm.id}
                      className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-sans font-extrabold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/10"
                    >
                      {savingId === editForm.id ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving Changes...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Publish Campaign</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 lg:gap-8 w-full">
                  
                  {/* Left Column: Event details, venue context, and admin quick edit shortcut */}
                  <div className="space-y-4 text-center lg:text-left flex-1 min-w-0 w-full">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 font-mono text-[9px] uppercase tracking-wider font-extrabold max-w-full">
                      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping shrink-0" />
                      <span>Next Upcoming Choral Destination</span>
                    </div>
                    
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-sans font-black text-white uppercase tracking-tight leading-tight break-words" title={nextUpcomingEvent.event}>
                      {nextUpcomingEvent.event}
                    </h3>
                    
                    <div className="flex flex-wrap justify-center lg:justify-start items-center gap-x-3 gap-y-1.5 text-xs text-slate-400 w-full min-w-0">
                      <span className="flex items-center gap-1.5 min-w-0 max-w-full">
                        <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                        <span className="break-words text-slate-300 font-medium text-left">{nextUpcomingEvent.location}</span>
                      </span>
                      <span className="text-slate-800 hidden sm:inline">•</span>
                      <span className="flex items-center gap-1.5 font-mono text-slate-300 shrink-0">
                        <CalendarDays className="w-4 h-4 text-rose-500" />
                        <span>{formatFriendlyDate(nextUpcomingEvent.date)}</span>
                      </span>
                      {nextUpcomingEvent.time && (
                        <>
                          <span className="text-slate-800 hidden sm:inline">•</span>
                          <span className="text-slate-350 font-mono text-xs shrink-0 font-semibold">{nextUpcomingEvent.time}</span>
                        </>
                      )}
                    </div>
                    
                    {nextUpcomingEvent.notes && (
                      <p className="text-xs text-slate-400 max-w-xl font-sans leading-relaxed break-words italic border-l-2 border-slate-800 pl-3.5 py-0.5 text-left lg:text-left">
                        "{nextUpcomingEvent.notes}"
                      </p>
                    )}
                    
                    {/* Admin Quick Editor Portal toggle inside the countdown unit to guarantee Timeline is easily editable */}
                    {isAdmin && (
                      <div className="pt-1 flex flex-wrap justify-center lg:justify-start gap-2 items-center">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Timeline Editor Mode</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => startInlineEdit(nextUpcomingEvent)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-sans font-black uppercase tracking-wider transition-all shadow-md shadow-amber-500/10 cursor-pointer"
                          title="Directly edit dates and itinerary sequence parameters"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Timeline Quick-Edit</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Beautiful animated digital countdown block - highly optimized and responsive avoiding text spills */}
                  <div className="shrink-0 w-full lg:w-auto bg-slate-900/40 border border-slate-900/60 rounded-2xl p-4 sm:p-6 flex items-center justify-center gap-2 xs:gap-3 sm:gap-6 shadow-xl relative overflow-hidden font-sans">
                    {/* Subtle visual lighting accent under the digital digits */}
                    <div className="absolute -inset-10 bg-amber-500/[0.03] rounded-full blur-2xl pointer-events-none" />
                    
                    {/* Years/Days countdown slot */}
                    <div className="flex flex-col items-center min-w-[42px] xs:min-w-[50px] sm:min-w-[60px] shrink-0">
                      <div className="text-2xl xs:text-3xl sm:text-4xl font-extrabold font-mono text-white tracking-tight leading-none drop-shadow-md">
                        {String(timeLeft.days).padStart(2, '0')}
                      </div>
                      <span className="text-[8px] sm:text-[9px] font-mono text-slate-500 uppercase tracking-widest mt-1.5 font-bold">Days</span>
                    </div>
                    
                    <div className="text-lg sm:text-xl font-black font-mono text-amber-500/40 select-none -translate-y-1.5 shrink-0">:</div>
                    
                    {/* Hours countdown slot */}
                    <div className="flex flex-col items-center min-w-[42px] xs:min-w-[50px] sm:min-w-[60px] shrink-0">
                      <div className="text-2xl xs:text-3xl sm:text-4xl font-extrabold font-mono text-white tracking-tight leading-none drop-shadow-md">
                        {String(timeLeft.hours).padStart(2, '0')}
                      </div>
                      <span className="text-[8px] sm:text-[9px] font-mono text-slate-500 uppercase tracking-widest mt-1.5 font-bold">Hours</span>
                    </div>
                    
                    <div className="text-lg sm:text-xl font-black font-mono text-amber-500/40 select-none -translate-y-1.5 shrink-0">:</div>
                    
                    {/* Minutes countdown slot */}
                    <div className="flex flex-col items-center min-w-[42px] xs:min-w-[50px] sm:min-w-[60px] shrink-0">
                      <div className="text-2xl xs:text-3xl sm:text-4xl font-extrabold font-mono text-white tracking-tight leading-none drop-shadow-md">
                        {String(timeLeft.minutes).padStart(2, '0')}
                      </div>
                      <span className="text-[8px] sm:text-[9px] font-mono text-slate-500 uppercase tracking-widest mt-1.5 font-bold">Mins</span>
                    </div>
                    
                    <div className="text-lg sm:text-xl font-black font-mono text-amber-500/40 select-none -translate-y-1.5 shrink-0">:</div>
                    
                    {/* Seconds countdown slot with highlighted accent */}
                    <div className="flex flex-col items-center min-w-[42px] xs:min-w-[50px] sm:min-w-[60px] shrink-0">
                      <div className="text-2xl xs:text-3xl sm:text-4xl font-extrabold font-mono text-amber-400 tracking-tight leading-none drop-shadow-md animate-pulse">
                        {String(timeLeft.seconds).padStart(2, '0')}
                      </div>
                      <span className="text-[8px] sm:text-[9px] font-mono text-amber-400 font-bold uppercase tracking-widest mt-1.5">Secs</span>
                    </div>
                  </div>

                </div>
              )}
            </div>
          </div>
        )}

        {/* Search & Filter bar for Itinerary events */}
        <div className="mb-8 max-w-md animate-in fade-in duration-300">
          <div className="relative">
            <input
              type="text"
              placeholder="Search itinerary events, venues, keywords..."
              value={itinerarySearch || ""}
              onChange={(e) => setItinerarySearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl py-3.5 pl-11 pr-10 text-xs text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
            />
            <svg 
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {itinerarySearch && (
              <button
                type="button"
                onClick={() => setItinerarySearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-450 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Newspaper Section Style Filter Pills with Sliding active background */}
        <div className="flex flex-wrap gap-2 mb-10 pb-4 border-b border-slate-900/60 overflow-x-auto scrollbar-none relative">
          <motion.button 
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setActiveTab("all")} 
            className="px-4 py-2 rounded-lg font-sans text-xs font-bold uppercase tracking-wider relative cursor-pointer flex items-center gap-2 shrink-0 border z-10 overflow-hidden"
          >
            {activeTab === "all" ? (
              <motion.div 
                layoutId="activeItineraryTabIndicator" 
                className="absolute inset-0 bg-amber-500 border border-amber-500 -z-10 shadow-md shadow-amber-500/10"
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
              />
            ) : null}
            <span className={activeTab === "all" ? "text-slate-950 font-bold" : "text-slate-400 font-bold group-hover:text-white"}>All Bulletins</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${activeTab === 'all' ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-950 text-slate-500'}`}>{getCount("all")}</span>
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setActiveTab("upcoming")} 
            className="px-4 py-2 rounded-lg font-sans text-xs font-bold uppercase tracking-wider relative cursor-pointer flex items-center gap-2 shrink-0 border z-10 overflow-hidden"
          >
            {activeTab === "upcoming" ? (
              <motion.div 
                layoutId="activeItineraryTabIndicator" 
                className="absolute inset-0 bg-amber-500 border border-amber-500 -z-10 shadow-md shadow-amber-500/10"
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
              />
            ) : null}
            <CalendarDays className={`w-3.5 h-3.5 ${activeTab === "upcoming" ? "text-slate-950" : "text-slate-400"}`} />
            <span className={activeTab === "upcoming" ? "text-slate-950 font-bold" : "text-slate-400 font-bold"}>Active Missions</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${activeTab === 'upcoming' ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-950 text-slate-500'}`}>{getCount("upcoming")}</span>
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setActiveTab("charity")} 
            className="px-4 py-2 rounded-lg font-sans text-xs font-bold uppercase tracking-wider relative cursor-pointer flex items-center gap-2 shrink-0 border z-10 overflow-hidden"
          >
            {activeTab === "charity" ? (
              <motion.div 
                layoutId="activeItineraryTabIndicator" 
                className="absolute inset-0 bg-rose-600 border border-rose-600 -z-10 shadow-md shadow-rose-600/10"
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
              />
            ) : null}
            <Heart className={`w-3.5 h-3.5 ${activeTab === "charity" ? "text-rose-50" : "text-slate-400"}`} />
            <span className={activeTab === "charity" ? "text-rose-50 font-bold" : "text-slate-400 font-bold"}>Benevolence Charity</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${activeTab === 'charity' ? 'bg-slate-950/20 text-rose-500' : 'bg-slate-950 text-slate-500'}`}>{getCount("charity")}</span>
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setActiveTab("revival")} 
            className="px-4 py-2 rounded-lg font-sans text-xs font-bold uppercase tracking-wider relative cursor-pointer flex items-center gap-2 shrink-0 border z-10 overflow-hidden"
          >
            {activeTab === "revival" ? (
              <motion.div 
                layoutId="activeItineraryTabIndicator" 
                className="absolute inset-0 bg-amber-500 border border-amber-500 -z-10 shadow-md shadow-amber-500/10"
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
              />
            ) : null}
            <Clock className={`w-3.5 h-3.5 ${activeTab === "revival" ? "text-slate-950" : "text-slate-400"}`} />
            <span className={activeTab === "revival" ? "text-slate-950 font-bold" : "text-slate-400 font-bold"}>Sabbath Revivals</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${activeTab === 'revival' ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-900 text-slate-500'}`}>{getCount("revival")}</span>
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setActiveTab("past")} 
            className="px-4 py-2 rounded-lg font-sans text-xs font-bold uppercase tracking-wider relative cursor-pointer flex items-center gap-2 shrink-0 border z-10 overflow-hidden"
          >
            {activeTab === "past" ? (
              <motion.div 
                layoutId="activeItineraryTabIndicator" 
                className="absolute inset-0 bg-amber-500 border border-amber-500 -z-10 shadow-md shadow-amber-500/10"
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
              />
            ) : null}
            <ShieldCheck className={`w-3.5 h-3.5 ${activeTab === "past" ? "text-slate-950" : "text-slate-400"}`} />
            <span className={activeTab === "past" ? "text-slate-950 font-bold" : "text-slate-400 font-bold"}>Past Archives</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${activeTab === 'past' ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-950 text-slate-500'}`}>{getCount("past")}</span>
          </motion.button>
        </div>

        {/* Dynamic List Block */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-slate-800/60 rounded-3xl glass-card p-10 animate-in fade-in duration-300">
            <Newspaper className="w-12 h-12 text-slate-650 mx-auto mb-4 stroke-[1.5]" />
            <h4 className="font-sans font-bold text-lg text-slate-200">
              {itinerarySearch ? "No Search Matches" : "No Publications Filed"}
            </h4>
            <p className="text-slate-500 text-sm font-sans mt-2 max-w-sm mx-auto">
              {itinerarySearch 
                ? "No itinerary events match your keywords. Try checking other categories or clearing your search filter."
                : "We couldn't find any active schedules in this news section right now. Choose another category or register one as administrative."}
            </p>
            {itinerarySearch && (
              <button
                type="button"
                onClick={() => setItinerarySearch("")}
                className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
              >
                Clear Search Filter
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            {filteredItems.map((item) => {
              const isEditing = editingItemId === item.id;
              const isMediaTarget = mediaTargetId === item.id;
              const catTag = getCategoryTag(item);
              const hasMedia = !!item.mediaUrl;
              const displayUrl = item.mediaUrl || defaultBanner;

              if (isEditing && editForm) {
                // Return highly descriptive, beautiful in-place inline editing card
                return (
                  <form 
                    key={item.id} 
                    onSubmit={handleInlineSave}
                    className="bg-slate-950 border-2 border-amber-500/50 rounded-3xl p-6 md:p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200"
                  >
                    <div className="absolute top-4 right-4 text-amber-500 font-mono text-[9px] font-bold uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded border border-amber-550/20">
                      LIVE INLINE EDITOR
                    </div>

                    <h3 className="font-sans font-extrabold text-lg text-amber-300 flex items-center gap-2 mb-6 border-b border-slate-900 pb-3">
                      <Edit className="w-4 h-4 text-amber-400 stroke-[2.5]" />
                      <span>Edit: {item.event}</span>
                    </h3>

                    {saveError && (
                      <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 text-xs flex items-center gap-2 font-sans md:col-span-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{saveError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[10px] font-mono text-slate-450 uppercase tracking-wider mb-1.5 font-bold">Event or Initiative Name</label>
                        <input 
                          type="text" 
                          required
                          value={editForm.event || ""}
                          onChange={(e) => setEditForm({ ...editForm, event: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-400 text-xs font-sans"
                          placeholder="e.g. Youth Camp Meeting Live"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-slate-450 uppercase tracking-wider mb-1.5 font-bold">Host Organiser or Venue Host</label>
                        <input 
                          type="text" 
                          required
                          value={editForm.host || ""}
                          onChange={(e) => setEditForm({ ...editForm, host: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-400 text-xs font-sans"
                          placeholder="e.g. Kachok SDA Church Choir"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-slate-450 uppercase tracking-wider mb-1.5 font-bold">Calendar Date</label>
                        <input 
                          type="date" 
                          required
                          value={editForm.date || ""}
                          onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-400 text-xs font-sans font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-slate-450 uppercase tracking-wider mb-1.5 font-bold">Service Time hours</label>
                        <input 
                          type="text" 
                          value={editForm.time || ""}
                          onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-400 text-xs font-sans"
                          placeholder="e.g. 2:00 PM EST or Morning Services"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-slate-450 uppercase tracking-wider mb-1.5 font-bold">Physical Location / Address</label>
                        <input 
                          type="text" 
                          required
                          value={editForm.location || ""}
                          onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-400 text-xs font-sans"
                          placeholder="e.g. SDAC Kachok Church, Kisumu"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-slate-450 uppercase tracking-wider mb-1.5 font-bold">Mission Status</label>
                        <select 
                          value={editForm.status || "Confirmed"}
                          onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-amber-300 outline-none focus:border-amber-400 text-xs font-sans font-semibold"
                        >
                          <option value="Confirmed">Confirmed</option>
                          <option value="Tentative">Tentative</option>
                          <option value="Past">Past</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-mono text-slate-450 uppercase tracking-wider mb-1.5 font-bold">Leader's Dispatch or Pastoral Notes</label>
                        <textarea 
                          rows={3}
                          value={editForm.notes || ""}
                          onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-400 text-xs font-sans"
                          placeholder="Brief descriptions, sermon texts, or medical appeals details..."
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-900">
                      <button 
                        type="button" 
                        onClick={cancelInlineEdit}
                        className="px-4 py-2.5 rounded-xl border border-slate-850 text-slate-400 hover:text-white hover:bg-slate-900 text-xs font-sans cursor-pointer font-bold uppercase tracking-wider transition-colors"
                      >
                        Nevermind
                      </button>
                      <button 
                        type="submit" 
                        disabled={savingId === editForm.id}
                        className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-405 text-slate-950 text-xs font-sans font-bold uppercase tracking-wider transition-all shadow-md shadow-amber-500/10 cursor-pointer flex items-center gap-1.5"
                      >
                        {savingId === editForm.id ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Publishing Changes...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Publish Dispatch</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                );
              }

              // Normal display in Adventist News editorial format
              return (
                <div 
                  key={item.id}
                  id={`itinerary-dispatch-${item.id}`}
                  className="group relative glass-card hover:border-amber-400/40 rounded-3xl overflow-hidden transition-all duration-300 shadow-xl flex flex-col lg:flex-row items-stretch scroll-mt-24"
                >
                  
                  {/* Column 1: Feature Photo/Video Panel (Editorial News Style) */}
                  <div className="relative w-full lg:w-[350px] shrink-0 bg-slate-950 overflow-hidden min-h-[220px] lg:min-h-auto">
                    
                    {/* Media render */}
                    {item.mediaType === "video" && hasMedia ? (
                      <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                        <video 
                          src={item.mediaUrl} 
                          muted 
                          loop 
                          playsInline
                          onMouseEnter={(e) => e.currentTarget.play()}
                          onMouseLeave={(e) => e.currentTarget.pause()}
                          className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent pointer-events-none" />
                        <div className="absolute bottom-3 left-3 bg-slate-950/80 border border-slate-800 rounded-lg px-2 py-1 text-[9px] font-mono text-amber-400 uppercase tracking-widest flex items-center gap-1">
                          <Film className="w-3 h-3" />
                          <span>Video Clip (Hover to play)</span>
                        </div>
                        <button 
                          onClick={() => setActiveMedia({ url: item.mediaUrl!, type: 'video', eventTitle: item.event })}
                          className="absolute w-10 h-10 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all outline-none"
                        >
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <img 
                          src={displayUrl} 
                          alt="" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full min-h-[220px] object-cover opacity-75 group-hover:opacity-95 group-hover:scale-105 transition-all duration-700 ease-out" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-transparent pointer-events-none" />
                        
                        {!hasMedia && (
                          <div className="absolute inset-x-4 top-4 text-center mt-12">
                            <Newspaper className="w-6 h-6 text-slate-650 mx-auto opacity-50" />
                            <p className="font-mono text-[9px] text-slate-500 uppercase mt-2 tracking-widest">Kachok Press Association</p>
                          </div>
                        )}

                        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <button 
                            onClick={() => setActiveMedia({ url: displayUrl, type: 'image', eventTitle: item.event })}
                            className="bg-slate-950/90 hover:bg-amber-500 hover:text-slate-950 backdrop-blur-sm border border-slate-800 font-sans text-[10px] px-2.5 py-1.5 rounded-lg font-bold uppercase transition-colors flex items-center gap-1"
                            title="Expand Media Block"
                          >
                            <ZoomIn className="w-3.5 h-3.5" />
                            <span>Preview</span>
                          </button>
                        </div>
                      </>
                    )}

                    {/* Left Column Accent: Big Date Flag Overlay */}
                    <div className="absolute top-4 left-4 flex flex-col items-center bg-slate-950/95 border border-slate-850 px-3 py-2 rounded-xl backdrop-blur-md shadow-2xl">
                      <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-widest leading-none">
                        {new Date(item.date).toLocaleString('en-US', { month: 'short' })}
                      </span>
                      <span className="text-2xl font-extrabold font-sans text-white leading-none tracking-tight mt-1">
                        {new Date(item.date).toLocaleString('en-US', { day: '2-digit' })}
                      </span>
                      <span className="text-[8px] font-mono text-slate-550 uppercase tracking-widest mt-1 leading-none">
                        {new Date(item.date).toLocaleString('en-US', { weekday: 'short' })}
                      </span>
                    </div>

                    {/* Admin DIRECT Inplace Media Editor Button Overlay */}
                    {isAdmin && (
                      <div className="absolute inset-x-2 bottom-2 bg-slate-950/95 border border-slate-850 p-2.5 rounded-2xl flex flex-col gap-2 backdrop-blur shadow-2xl transition-all">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[9px] font-bold text-amber-500 uppercase tracking-widest">Media Manager</span>
                          <span className="text-[8px] font-mono text-slate-500">Fast Upload</span>
                        </div>
                        <button
                          type="button"
                          id={`btn-trigger-media-${item.id}`}
                          onClick={(e) => openMediaUploader(e, item)}
                          className="bg-slate-900 hover:bg-slate-850 text-white hover:text-amber-400 text-[10px] font-sans font-bold uppercase tracking-wide py-2 rounded-lg border border-slate-800 transition-colors cursor-pointer flex items-center justify-center gap-1.5 w-full"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Change Photo/Video</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Column 2: Article Specific Details (Right Panel) */}
                  <div className="flex-1 p-6 md:p-8 flex flex-col justify-between gap-6 relative">
                    
                    <div>
                      {/* Top Metadata Header: Category Label and Status Pill */}
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span className={`text-[9px] font-mono font-extrabold px-2.5 py-0.5 rounded border uppercase tracking-wider ${catTag.color}`}>
                          {catTag.label}
                        </span>
                        
                        <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-900">
                          <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>{item.time || "Event Schedule Pending"}</span>
                        </span>

                        <span className="text-[10px] font-mono text-slate-500">
                          Published: {formatFriendlyDate(item.date)}
                        </span>
                      </div>

                      {/* Main Title Headings */}
                      <h3 className="font-sans font-extrabold text-xl md:text-2xl text-white group-hover:text-amber-200 transition-colors duration-200 tracking-tight leading-snug">
                        {item.event}
                      </h3>

                      {/* Venue particulars */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-xs text-slate-400 border-t border-b border-slate-900 py-3.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-850 flex items-center justify-center shrink-0">
                            <MapPin className="w-3 h-3 text-amber-500" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[9px] font-mono text-slate-550 uppercase">Mission Venue</span>
                            <span className="truncate text-white font-medium">{item.location}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-850 flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-3 h-3 text-amber-500" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[9px] font-mono text-slate-550 uppercase">Lead Host Body</span>
                            <span className="truncate text-white font-medium">{item.host || "Local SDA Church"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Editorial Paragraph Description */}
                      {item.notes && (
                        <div className="mt-4 text-xs leading-relaxed text-slate-350 bg-slate-900/10 border-l-2 border-amber-500/30 pl-4 py-1.5 font-sans">
                          {item.notes}
                        </div>
                      )}
                    </div>

                    {/* Operational Actions Section */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mt-2 pt-4 border-t border-slate-900">
                      
                      {/* Left: Administrative control buttons / status / share */}
                      <div className="flex flex-wrap items-center gap-3">
                        {isAdmin ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              id={`btn-inline-edit-${item.id}`}
                              onClick={() => startInlineEdit(item)}
                              className="bg-slate-900 hover:bg-slate-850 text-slate-200 hover:text-amber-400 hover:border-amber-500/20 text-[10px] font-sans font-bold uppercase tracking-wider px-3.5 py-2.5 rounded-xl border border-slate-800 transition-all cursor-pointer flex items-center gap-1.5"
                              title="Edit Event Schedule Specs Inplace"
                            >
                              <Edit className="w-3.5 h-3.5 stroke-[2]" />
                              <span>Quick Edit</span>
                            </button>
                            
                            <button
                              type="button"
                              id={`btn-inline-del-${item.id}`}
                              onClick={() => onDelete(item.id)}
                              className="bg-red-500/5 hover:bg-red-500 hover:text-white hover:border-red-500 text-red-400 text-[10px] font-sans font-bold uppercase tracking-wider px-3.5 py-2.5 rounded-xl border border-red-550/10 transition-all cursor-pointer flex items-center gap-1.5"
                              title="Remove Schedule Listing"
                            >
                              <Trash2 className="w-3.5 h-3.5 stroke-[2]" />
                              <span>Delete</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-900">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Official Event Listing</span>
                          </div>
                        )}

                        {/* Social Sharing Buttons */}
                        <div className="flex items-center gap-1.5 border-l border-slate-850 pl-3">
                          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider hidden sm:inline">Share:</span>
                          
                          {/* Local iCal Calendar Integration & Reminder Bookmark */}
                          <div className="relative">
                            <button
                              onClick={() => {
                                toggleBookmarkReminder(item.id);
                                if (activeReminderMenuId === item.id) {
                                  setActiveReminderMenuId(null);
                                } else {
                                  setActiveReminderMenuId(item.id);
                                }
                              }}
                              className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                                bookmarkedReminders.includes(item.id)
                                  ? "bg-amber-500/15 text-amber-500 border-amber-550/30 ring-2 ring-amber-500/10 shadow-lg"
                                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-amber-400 hover:border-amber-400/20"
                              }`}
                              title={bookmarkedReminders.includes(item.id) ? "Reminder configured! Click for export actions." : "Configure calendar reminder bookmark"}
                            >
                              {bookmarkedReminders.includes(item.id) ? (
                                <BellRing className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                              ) : (
                                <Bell className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {/* Dropdown menu overlay */}
                            <AnimatePresence>
                              {activeReminderMenuId === item.id && (
                                <>
                                  <div 
                                    className="fixed inset-0 z-10" 
                                    onClick={() => setActiveReminderMenuId(null)} 
                                  />
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                    className="absolute left-0 bottom-9 mt-1.5 w-60 rounded-2xl bg-slate-950 border border-slate-800 p-2 shadow-2xl z-20 text-left"
                                  >
                                    <div className="px-3.5 py-2 border-b border-slate-900">
                                      <p className="text-[10px] font-mono text-amber-500 uppercase tracking-widest font-extrabold">Reminder Synced</p>
                                      <p className="text-xs font-sans text-slate-200 mt-0.5 truncate font-extrabold">{item.event}</p>
                                    </div>
                                    <div className="p-1 flex flex-col gap-1.5 mt-1">
                                      {/* Download ICS */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleDownloadICS(item);
                                          setActiveReminderMenuId(null);
                                        }}
                                        className="w-full text-left font-sans text-[11px] font-bold text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg p-2.5 flex items-center gap-2 cursor-pointer transition-colors"
                                      >
                                        <Download className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                        <span>Download iCal Entry (.ics)</span>
                                      </button>

                                      {/* Export Google Calendar */}
                                      <a
                                        href={getGoogleCalendarURL(item)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={() => setActiveReminderMenuId(null)}
                                        className="w-full text-left font-sans text-[11px] font-bold text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg p-2.5 flex items-center gap-2 cursor-pointer transition-colors"
                                      >
                                        <CalendarPlus className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                        <span>Add to Google Calendar</span>
                                      </a>
                                    </div>
                                    <div className="bg-slate-900/60 p-2 rounded-xl mt-2 flex items-center gap-1.5 text-[9px] font-mono text-slate-500 leading-tight">
                                      <Check className="w-3 h-3 text-emerald-400 shrink-0 animate-pulse" />
                                      <span>Successfully saved to system calendar reminder registry.</span>
                                    </div>
                                  </motion.div>
                                </>
                              )}
                            </AnimatePresence>
                          </div>

                          {/* Favorite / RSVP Toggle */}
                          <button
                            onClick={() => toggleFavorite(item.id)}
                            className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                              favorites.includes(item.id)
                                ? "bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20"
                                : "bg-slate-900 border-slate-800 text-slate-500 hover:text-rose-400 hover:border-rose-400/20"
                            }`}
                            title={favorites.includes(item.id) ? "Remove from Favorites" : "Save to Favorites"}
                          >
                            <Heart className={`w-3.5 h-3.5 ${favorites.includes(item.id) ? "fill-current" : ""}`} />
                          </button>
                          
                          {/* WhatsApp */}
                          <a
                            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                              `Kachamba Chorus Event Alert! 🎶\n\n📢 *${item.event}*\n🗓️ Date: ${formatFriendlyDate(item.date)}\n🕒 Time: ${item.time || 'Schedule Pending'}\n📍 Venue: ${item.location}\n⛪ Host: ${item.host || 'Local SDA Church'}\n\nJoin us for fellowship & worship! Learn more: ${window.location.origin}/#itinerary-dispatch-${item.id}`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-7 h-7 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 border border-emerald-500/10 flex items-center justify-center transition-all cursor-pointer"
                            title="Share on WhatsApp"
                          >
                            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                              <path d="M12.004 0C5.378 0 .004 5.374.004 12c0 2.112.551 4.17 1.625 5.92L0 24l6.19-1.623c1.7 1.025 3.65 1.624 5.814 1.624 6.626 0 12-5.375 12-12s-5.374-12-12-12zm6.2 16.5c-.2.6-.8 1-1.3 1.1-.5.1-1.1.1-3-.7-2.3-1-3.8-3.3-3.9-3.4-.1-.1-.8-1-1.5-1.7-.5-.5-.8-.7-.9-.8-.2-.2-.2-.3-.1-.5s.5-.6.6-.8c.1-.2.2-.3.3-.5.1-.2 0-.3 0-.4-.1-.1-.5-1.2-.7-1.6-.2-.4-.3-.4-.5-.4h-.4c-.1 0-.3.1-.5.3-.2.2-.8.8-.8 2s.9 2.4 1 2.5c.1.1 1.8 2.8 4.4 3.9 1.1.5 1.8.7 2.3.8 1 .3 2 .3 2.7.2.8-.1 1.6-.7 1.9-1.3.3-.6.3-1.1.2-1.3 0-.1-.1-.2-.2-.3z" />
                            </svg>
                          </a>

                          {/* Twitter / X */}
                          <a
                            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                              `Kachamba Chorus Event Alert! 🎶\n\n📢 ${item.event}\n🗓️ Date: ${formatFriendlyDate(item.date)}\n📍 Venue: ${item.location}\n\nJoin us for fellowship & worship! Learn more: ${window.location.origin}/#itinerary-dispatch-${item.id}`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-850 flex items-center justify-center transition-all cursor-pointer"
                            title="Share on X (Twitter)"
                          >
                            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                          </a>

                          {/* Facebook */}
                          <a
                            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin + "/?event=" + item.id)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-7 h-7 rounded-lg bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/10 flex items-center justify-center transition-all cursor-pointer"
                            title="Share on Facebook"
                          >
                            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                              <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.8c4.56-.93 8-4.96 8-9.8z" />
                            </svg>
                          </a>

                          {/* Interactive Copy Event Share Link */}
                          <button
                            type="button"
                            onClick={() => handleCopyItinerary(item.id, item.event, item.date, item.location)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                              copiedItemId === item.id 
                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 scale-105" 
                                : "bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-amber-400 border-slate-850"
                            }`}
                            title={copiedItemId === item.id ? "Copied to Clipboard!" : "Copy Event Details to Clipboard"}
                          >
                            {copiedItemId === item.id ? (
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            ) : (
                              <Share2 className="w-3.5 h-3.5 stroke-[2]" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Right: Public registration reservation/booking */}
                      {item.status !== "Past" && (
                        <button
                          id={`btn-reserve-${item.id}`}
                          onClick={() => onBookSelect(item.event)}
                          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-550 text-slate-950 text-xs font-sans font-extrabold uppercase tracking-widest px-6 py-2.5 rounded-xl transition-all shadow-md shadow-amber-500/10 hover:shadow-amber-500/20 active:scale-95 flex items-center gap-1 cursor-pointer"
                        >
                          <span>Reserve Seat Invitation</span>
                          <ChevronRight className="w-3.5 h-3.5 stroke-[3] mt-0.5" />
                        </button>
                      )}
                    </div>

                  </div>

                              {/* Direct Slide-Down Media Editor - Specific to each Card */}
                  {isMediaTarget && (
                    <div className="absolute inset-0 bg-slate-950/98 border border-amber-550/30 z-20 p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-bottom duration-300">
                      
                      <div>
                        {/* Header details */}
                        <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20 animate-pulse">
                              <Camera className="w-4 h-4" />
                            </div>
                            <div className="text-left">
                              <h4 className="font-sans font-extrabold text-sm text-white uppercase tracking-wider">Fast Media Attachment Portal</h4>
                              <p className="text-[10px] font-mono text-slate-400 line-clamp-1">Item: {item.event}</p>
                            </div>
                          </div>
                          <button 
                            type="button"
                            onClick={closeMediaUploader}
                            className="bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white p-2 rounded-xl border border-slate-850 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Drag and Drop/Media Options Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                          
                          {/* File Uploader Pane */}
                          <div className="bg-slate-900/60 border border-dashed border-slate-800 hover:border-amber-500/40 rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all min-h-[120px] relative">
                            <input 
                              type="file" 
                              id={`local-file-picker-${item.id}`}
                              accept="image/*,video/*"
                              onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
                              onChange={handleLocalFileSelection}
                              className="hidden" 
                            />
                            
                            {localFileBase64 ? (
                              <div className="flex flex-col items-center gap-2 w-full">
                                <div className="w-16 h-10 rounded overflow-hidden border border-slate-800">
                                  {localFileType === 'video' ? (
                                    <div className="bg-slate-950 w-full h-full flex items-center justify-center">
                                      <Film className="w-4 h-4 text-amber-400" />
                                    </div>
                                  ) : (
                                    <img src={localFileBase64} alt="" className="w-full h-full object-cover" />
                                  )}
                                </div>
                                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1.5 bg-emerald-900/10 border border-emerald-950 px-2 py-0.5 rounded">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                  <span>Local File Encoded</span>
                                </span>
                                <label 
                                  htmlFor={`local-file-picker-${item.id}`}
                                  className="text-[9px] text-slate-455 hover:text-amber-400 font-mono underline uppercase cursor-pointer"
                                >
                                  Choose Different File
                                </label>
                              </div>
                            ) : (
                              <label 
                                htmlFor={`local-file-picker-${item.id}`}
                                className="cursor-pointer flex flex-col items-center gap-2 group/u"
                              >
                                <div className="w-9 h-9 rounded-full bg-slate-950 border border-slate-850 flex items-center justify-center text-amber-500 group-hover/u:bg-amber-500 group-hover/u:text-slate-950 duration-200">
                                  <Upload className="w-4 h-4 stroke-[2]" />
                                </div>
                                <div>
                                  <p className="text-xs font-sans font-bold text-slate-205">Browse Local Image/Video</p>
                                  <p className="text-[9px] font-mono text-slate-500 mt-1 uppercase">Supports file uploads under 12MB</p>
                                </div>
                              </label>
                            )}
                          </div>

                          {/* Fallback Paste URL Options */}
                          <div className="space-y-3 flex flex-col justify-center">
                            <div>
                              <label className="block text-[9px] font-mono text-slate-400 uppercase font-bold tracking-wider mb-1">Or Paste Cloud Media Url</label>
                              <input 
                                type="text"
                                value={mediaUrlInput || ""}
                                onChange={(e) => {
                                  setMediaUrlInput(e.target.value);
                                  setLocalFileBase64(null);
                                }}
                                disabled={!!localFileBase64}
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-400 font-mono disabled:opacity-40"
                                placeholder="https://external-site.com/image.jpg"
                              />
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-[9px] font-mono text-slate-455 uppercase font-bold">Media Type:</span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setMediaTypeInput('image')}
                                  disabled={!!localFileBase64}
                                  className={`px-3 py-1 rounded text-[9px] font-mono uppercase font-bold border transition-colors ${
                                    mediaTypeInput === 'image' 
                                      ? "bg-amber-500 border-amber-500 text-slate-950" 
                                      : "bg-slate-900 border-slate-800 text-slate-400"
                                  }`}
                                >
                                  Photo
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setMediaTypeInput('video')}
                                  disabled={!!localFileBase64}
                                  className={`px-3 py-1 rounded text-[9px] font-mono uppercase font-bold border transition-colors ${
                                    mediaTypeInput === 'video' 
                                      ? "bg-amber-500 border-amber-500 text-slate-950" 
                                      : "bg-slate-900 border-slate-800 text-slate-400"
                                  }`}
                                >
                                  Video Clip
                                </button>
                              </div>
                            </div>
                          </div>

                        </div>

                        {/* Interactive live preview of the current change */}
                        {(localFileBase64 || mediaUrlInput) && (
                          <div className="mt-4 p-3 bg-slate-900/40 rounded-xl border border-slate-800/60 max-w-sm mx-auto w-full">
                            <p className="text-[10px] font-mono text-slate-550 uppercase tracking-widest mb-1.5 text-left">Live Composition Preview</p>
                            <div className="aspect-[16/9] w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-900 flex items-center justify-center relative">
                              {localFileBase64 ? (
                                localFileType === 'video' ? (
                                  <video src={localFileBase64} controls className="w-full h-full object-cover" />
                                ) : (
                                  <img src={localFileBase64} alt="Preloaded base64" className="w-full h-full object-cover" />
                                )
                              ) : (
                                mediaTypeInput === 'video' ? (
                                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-450 gap-1 p-2">
                                    <Film className="w-6 h-6 text-amber-500 animate-pulse" />
                                    <span className="text-[10px] font-mono text-center truncate max-w-full">{mediaUrlInput}</span>
                                  </div>
                                ) : (
                                  <img src={mediaUrlInput} alt="External link" className="w-full h-full object-cover" onError={(e) => {
                                    (e.target as HTMLImageElement).src = defaultBanner;
                                  }} />
                                )
                              )}
                            </div>
                          </div>
                        )}

                        {fileError && (
                          <div className="mt-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-2.5 text-xs flex items-center gap-1.5 max-w-xl font-sans">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{fileError}</span>
                          </div>
                        )}
                      </div>

                      {/* Footer save managers */}
                      <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-900 mt-4">
                        {(localFileBase64 || mediaUrlInput) && (
                          <button 
                            type="button" 
                            onClick={() => {
                              setLocalFileBase64(null);
                              setLocalFileType(null);
                              setMediaUrlInput("");
                              setMediaTypeInput("image");
                            }}
                            className="mr-auto px-3.5 py-2.5 rounded-xl text-[10px] font-sans font-bold uppercase tracking-wider text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors border border-red-500/20 cursor-pointer"
                          >
                            Remove Photo
                          </button>
                        )}
                        <button 
                          type="button" 
                          onClick={closeMediaUploader}
                          className="px-3.5 py-2 rounded-xl text-[10px] font-sans font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors cursor-pointer"
                        >
                          Dismiss
                        </button>
                        <button 
                          type="button" 
                          onClick={handleSaveMediaChange}
                          disabled={savingId === item.id}
                          className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-405 text-slate-950 text-[10px] font-sans font-bold uppercase tracking-wider transition-all shadow-md shadow-amber-500/10 cursor-pointer flex items-center gap-1.5"
                        >
                          {savingId === item.id ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <span>Save Media Setup</span>
                            </>
                          )}
                        </button>
                      </div>

                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Media Lightbox Viewer Overlay */}
      {activeMedia && (
        <div 
          id="itinerary-lightbox"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/98 p-4 md:p-8 backdrop-blur-md"
          onClick={() => setActiveMedia(null)}
        >
          <div 
            className="relative max-w-4xl w-full flex flex-col items-center text-white space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header info */}
            <div className="w-full flex items-center justify-between border-b border-slate-900 pb-3">
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-mono uppercase text-amber-500 tracking-widest font-extrabold">Media Attachment Viewer</span>
                <h3 className="font-sans font-extrabold text-sm md:text-md text-white line-clamp-1">{activeMedia.eventTitle}</h3>
              </div>
              <button 
                id="btn-close-lightbox-overlay"
                className="bg-slate-900 hover:bg-slate-800 text-slate-300 p-2.5 rounded-full border border-slate-800 cursor-pointer transition-colors"
                onClick={() => setActiveMedia(null)}
                title="Dismiss Media Viewer"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>

            {/* Render Canvas Image/Video */}
            <div className="w-full bg-slate-950 border border-slate-900 rounded-3xl overflow-hidden aspect-video flex items-center justify-center relative shadow-3xl">
              {activeMedia.type === "video" ? (
                <video 
                  src={activeMedia.url} 
                  controls 
                  autoPlay 
                  className="w-full h-full max-h-[70vh] object-contain"
                />
              ) : (
                <img 
                  src={activeMedia.url} 
                  alt={activeMedia.eventTitle} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full max-h-[70vh] object-contain"
                />
              )}
            </div>

            <div className="w-full text-center">
              <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">
                Press anywhere outside or hit close button to dismiss view
              </span>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
