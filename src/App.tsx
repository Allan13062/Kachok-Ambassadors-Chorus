/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Itinerary from "./components/Itinerary";
import Activities from "./components/Activities";
import MusicStreaming from "./components/MusicStreaming";
import Gallery from "./components/Gallery";
import JoinUs from "./components/JoinUs";
import ContactUs from "./components/ContactUs";
import ChatBot from "./components/ChatBot";
import AdminPanel from "./components/AdminPanel";
import Leaders from "./components/Leaders";
import { Activity, ItineraryItem, Inquiry, MusicData, Leader } from "./types";
import { Music, Heart, Calendar, Compass, Star, Facebook, Youtube } from "lucide-react";

function FadeInSection({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 1.6, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  // Database states loaded dynamically from server
  const [dbData, setDbData] = useState<{
    activities: Activity[];
    itinerary: ItineraryItem[];
    inquiries: Inquiry[];
    leaders: Leader[];
  }>({
    activities: [],
    itinerary: [],
    inquiries: [],
    leaders: []
  });

  const [music, setMusic] = useState<MusicData>({
    songTitle: "Umchukue Mwanao",
    artistName: "Kachok Ambassadors Chorus",
    albumName: "Sounds Of Togetherness",
    audioUrl: "",
    coverUrl: "",
    quoteText: "Let our voices unite, lifting the sound of hope to the clouds...",
    label: "Live At Central",
    lyrics: "[Acapella Harmony Intro]\n(Ibrahimu, Ibrahimu...\nMchukue mwanao, umpendaye sana Isaka...\nUkamtoe dhabihu...)\n\n(Verse 1)\nSiku ile Mungu alimwita Ibrahimu akasema: \"Ibrahimu!\"\nNaye akaitika kwa upole: \"Mimi hapa Bwana.\"\nAkamwambia: \"Umchukue mwanao, mwana wako wa pekee,\nIsaka yule unayempenda sana, ukaende mpaka nchi ya Moria,\nUkamtoe awe dhabihu ya kuteketezwa juu ya mlima nitakaokuonyesha.\"\n\n(Chorus)\nAkatandika punda wake asubuhi, akachukua kuni na moto,\nAkaanza safari ya utiifu, akamchukua mwanawe Isaka.\nMwanangu kumbuka, utiifu kwa Bwana ni ufunguo wa baraka,\nUnapoombwa kutoa kilicho bora, usisite wala usilalamike,\nMaana Mungu wetu aliye hai, kila wakati atajipatia!\n\n(Verse 2)\nWakiwa njiani mwana Isaka akamwuliza baba yake kwa unyenyekevu:\n\"Baba yangu, moto upo na kuni zipo, lakini yuko wapi kondoo?\"\nIbrahimu akamjibu kwa imani kuu, akasema kwa ujasiri:\n\"Mwanangu, Mungu atajipatia mwenyewe kondoo wa dhabihu.\"\nWakaendelea mbele kwa pamoja, mioyo yao ikiwa imejaa imani.\n\n(Bridge)\nWalipofika juu ya madhabahu, Ibrahimu akanyosha mkono wake,\nAkatwaa kisu amtoe mwanawe dhabihu, ghafla Malaika wa Bwana akaita:\n\"Ibrahimu! Ibrahimu! Usinyoshe mkono wako juu ya kijana!\"\nTazama! Nyuma yake kulikuwa na kondoo dume, amenaswa pembe zake kichakani,\nIbrahimu akamtoa yule kondoo badala ya Isaka!\n\n[Outro]\nBwana atajipatia... Yehova Yire!\nUtiifu wako utaleta baraka kubwa maishani mwako.\nMchukue mwanao, mchukue kila ulichonacho, umkabidhi Bwana,\nMshahara wako utakuwa mkuu mbinguni. Amina!"
  });


  // UI state managers
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [adminPasscode, setAdminPasscode] = useState<string | null>(() => {
    return localStorage.getItem("kachamba_admin_passcode");
  });
  const [activeSection, setActiveSection] = useState("home");
  const [bookingPrefill, setBookingPrefill] = useState("");
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const saved = localStorage.getItem("kachamba_theme");
    return (saved === "light" || saved === "dark") ? saved : "dark";
  });

  // Keep theme utility synchronized in the DOM and LocalStorage
  useEffect(() => {
    if (theme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
    localStorage.setItem("kachamba_theme", theme);
  }, [theme]);

  // Editing state markers
  const [actToEdit, setActToEdit] = useState<Activity | null>(null);
  const [itiToEdit, setItiToEdit] = useState<ItineraryItem | null>(null);
  const [ldrToEdit, setLdrToEdit] = useState<Leader | null>(null);

  // Load database items on launch and whenever passcode changes
  const fetchData = async () => {
    try {
      const headers: Record<string, string> = {};
      if (adminPasscode) {
        headers["x-admin-passcode"] = adminPasscode;
      }

      const response = await fetch("/api/db", {
        headers,
        cache: "no-store"
      });
      if (response.ok) {
        const data = await response.json();
        setDbData({
          activities: data.activities || [],
          itinerary: data.itinerary || [],
          inquiries: data.inquiries || [],
          leaders: data.leaders || []
        });
        if (data.music) {
          setMusic(data.music);
        }
      }
    } catch (error) {
      console.error("Failed to sync choral records from Express:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [adminPasscode]);

  // Scrollspy helper tracking navbar highlighting
  useEffect(() => {
    const handleScroll = () => {
      const sections = ["home", "itinerary", "activities", "leadership", "music", "gallery", "join", "contact"];
      const currentScroll = window.scrollY + 200; // Offset checking

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (currentScroll >= top && currentScroll < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Leaders portal auth pipeline
  const handleAdminAuth = async (passcode: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ passcode })
      });
      if (res.ok) {
        setAdminPasscode(passcode);
        localStorage.setItem("kachamba_admin_passcode", passcode);
        return true;
      }
    } catch (error) {
      console.error("Auth server failure:", error);
    }
    return false;
  };

  const handleAdminLogout = () => {
    setAdminPasscode(null);
    localStorage.removeItem("kachamba_admin_passcode");
    setIsAdminOpen(false);
    clearOperationalStates();
  };

  const clearOperationalStates = () => {
    setActToEdit(null);
    setItiToEdit(null);
    setLdrToEdit(null);
  };

  // Inquiry actions (Admin panel)
  const handleDeleteInquiry = async (id: string) => {
    if (!adminPasscode) return;
    try {
      const res = await fetch(`/api/inquiries/${id}`, {
        method: "DELETE",
        headers: {
          "x-admin-passcode": adminPasscode
        }
      });
      if (res.ok) {
        fetchData();
      }
    } catch {
      console.error("Failed to delete inquiry.");
    }
  };

  const handleUpdateInquiryStatus = async (id: string, status: string) => {
    if (!adminPasscode) return;
    try {
      const res = await fetch(`/api/inquiries/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": adminPasscode
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchData();
      }
    } catch {
      console.error("Failed to update inquiry status.");
    }
  };

  // Central base64 file upload interceptor helper
  const uploadBase64IfNeeded = async (base64Str: string | undefined | null, defaultFilename = "upload.jpg"): Promise<string | undefined | null> => {
    if (!base64Str || !base64Str.startsWith("data:")) {
      return base64Str;
    }
    if (!adminPasscode) return base64Str;
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": adminPasscode
        },
        body: JSON.stringify({
          filename: defaultFilename,
          base64: base64Str
        })
      });
      if (res.ok) {
        const data = await res.json();
        return data.url;
      } else {
        console.error("Base64 upload failed on server, using fallback inline data.");
      }
    } catch (err) {
      console.error("Network error during base64 upload:", err);
    }
    return base64Str;
  };

  // Activity actions (Admin CRUD)
  const handleSaveActivity = async (formData: any): Promise<boolean> => {
    if (!adminPasscode) return false;
    try {
      const imageUrl = await uploadBase64IfNeeded(formData.image, "activity.jpg");
      const payload = { ...formData, image: imageUrl };

      // Optimistically update the UI state so edits and crops reflect immediately
      setDbData(prev => {
        let updated = [...prev.activities];
        if (actToEdit) {
          updated = updated.map(item => item.id === actToEdit.id ? { ...item, ...payload } : item);
        } else {
          updated.push({ id: payload.id || `temp-${Date.now()}`, ...payload });
        }
        return { ...prev, activities: updated };
      });

      const method = actToEdit ? "PUT" : "POST";
      const url = actToEdit ? `/api/activities/${actToEdit.id}` : "/api/activities";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": adminPasscode
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        fetchData();
        return true;
      }
    } catch {
      console.error("Failed to capture activity program.");
    }
    return false;
  };

  const handleDeleteActivity = async (id: string) => {
    if (!adminPasscode) return;
    if (!confirm("Are you sure you want to dismiss this ministry program from the database?")) return;
    try {
      const res = await fetch(`/api/activities/${id}`, {
        method: "DELETE",
        headers: {
          "x-admin-passcode": adminPasscode
        }
      });
      if (res.ok) {
        fetchData();
      }
    } catch {
      console.error("Deletion failed.");
    }
  };

  // Itinerary actions (Admin CRUD)
  const handleSaveItinerary = async (formData: any): Promise<boolean> => {
    if (!adminPasscode) return false;
    try {
      const mediaUrl = await uploadBase64IfNeeded(formData.mediaUrl, formData.mediaType === "video" ? "tour_video.mp4" : "tour_photo.jpg");
      const payload = { ...formData, mediaUrl };

      // Optimistically update the UI state so edits and media reflect immediately
      setDbData(prev => {
        let updated = [...prev.itinerary];
        if (itiToEdit) {
          updated = updated.map(item => item.id === itiToEdit.id ? { ...item, ...payload } : item);
        } else {
          updated.push({ id: payload.id || `temp-${Date.now()}`, ...payload });
        }
        return { ...prev, itinerary: updated };
      });

      const method = itiToEdit ? "PUT" : "POST";
      const url = itiToEdit ? `/api/itinerary/${itiToEdit.id}` : "/api/itinerary";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": adminPasscode
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        fetchData();
        return true;
      }
    } catch {
      console.error("Failed to schedule tour.");
    }
    return false;
  };

  const handleSaveMusic = async (formData: MusicData): Promise<boolean> => {
    if (!adminPasscode) return false;
    try {
      const audioUrl = await uploadBase64IfNeeded(formData.audioUrl, "snippet.wav");
      const coverUrl = await uploadBase64IfNeeded(formData.coverUrl, "cover.jpg");
      const payload = { ...formData, audioUrl: audioUrl || "", coverUrl: coverUrl || "" };

      // Optimistically update the UI state so edits reflect immediately and seamlessly
      setMusic(payload);

      const res = await fetch("/api/music", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": adminPasscode
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        fetchData();
        return true;
      }
    } catch (error) {
      console.error("Failed to update dynamic music details:", error);
    }
    return false;
  };


  const handleDeleteItinerary = async (id: string) => {
    if (!adminPasscode) return;
    if (!confirm("Remove this upcoming tour/itinerary mission from schedules?")) return;
    try {
      const res = await fetch(`/api/itinerary/${id}`, {
        method: "DELETE",
        headers: {
          "x-admin-passcode": adminPasscode
        }
      });
      if (res.ok) {
        fetchData();
      }
    } catch {
      console.error("Deletion failed.");
    }
  };

  // Leaders actions (Admin CRUD)
  const handleSaveLeader = async (formData: any): Promise<boolean> => {
    if (!adminPasscode) return false;

    // Optimistically update UI instantly so that the saved profile and cropped photo render at once
    setDbData(prev => {
      let updated = [...prev.leaders];
      if (ldrToEdit) {
        updated = updated.map(item => item.id === ldrToEdit.id ? { ...item, ...formData } : item);
      } else {
        updated.push({ id: `temp-${Date.now()}`, ...formData });
      }
      return { ...prev, leaders: updated };
    });

    try {
      const imageUrl = await uploadBase64IfNeeded(formData.image, "leader.jpg");
      const payload = { ...formData, image: imageUrl };

      const method = ldrToEdit ? "PUT" : "POST";
      const url = ldrToEdit ? `/api/leaders/${ldrToEdit.id}` : "/api/leaders";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": adminPasscode
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        fetchData();
        return true;
      }
    } catch {
      console.error("Failed to save leader profile.");
    }
    return false;
  };

  const handleDeleteLeader = async (id: string) => {
    if (!adminPasscode) return;
    if (!confirm("Are you sure you want to dismiss this leader's profile from dynamic listing?")) return;
    try {
      const res = await fetch(`/api/leaders/${id}`, {
        method: "DELETE",
        headers: {
          "x-admin-passcode": adminPasscode
        }
      });
      if (res.ok) {
        fetchData();
      }
    } catch {
      console.error("Deletion failed.");
    }
  };

  return (
    <div className={`min-h-screen overflow-x-hidden flex flex-col font-sans antialiased selection:bg-amber-500/20 selection:text-amber-300 transition-colors duration-300 ${
      theme === "dark" 
        ? "bg-slate-950 text-white" 
        : "bg-slate-50 text-slate-900"
    }`}>
      
      {/* Decorative Header Frame line */}
      <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-amber-300 to-amber-600 sticky top-0 z-50 pointer-events-none" />

      {/* Navigation Header */}
      <Header 
        isAdmin={!!adminPasscode}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onLogout={handleAdminLogout}
        activeSection={activeSection}
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
      />

      {/* Hero Welcome Unit */}
      <FadeInSection>
        <Hero 
          onAskAI={() => {
            setIsChatOpen(true);
          }}
        />
      </FadeInSection>

      <main className="flex-1">
        
        {/* Dynamic Itinerary Section */}
        <FadeInSection>
          <Itinerary 
            items={dbData.itinerary}
            isAdmin={!!adminPasscode}
            adminPasscode={adminPasscode}
            onRefresh={fetchData}
            onAdd={() => {
              setItiToEdit(null);
              setIsAdminOpen(true);
            }}
            onEdit={(item) => {
              setItiToEdit(item);
              setIsAdminOpen(true);
            }}
            onDelete={handleDeleteItinerary}
            onBookSelect={(eventName) => {
              setBookingPrefill(eventName);
            }}
          />
        </FadeInSection>

        {/* Dynamic Ministries/Activities Section */}
        <FadeInSection>
          <Activities 
            items={dbData.activities}
            isAdmin={!!adminPasscode}
            onAdd={() => {
              setActToEdit(null);
              setIsAdminOpen(true);
            }}
            onEdit={(activity) => {
              setActToEdit(activity);
              setIsAdminOpen(true);
            }}
            onDelete={handleDeleteActivity}
          />
        </FadeInSection>

        {/* Dynamic Leaders/Stewards Section */}
        <FadeInSection>
          <Leaders 
            items={dbData.leaders}
            isAdmin={!!adminPasscode}
            onAdd={() => {
              setLdrToEdit(null);
              setIsAdminOpen(true);
            }}
            onEdit={(leader) => {
              setLdrToEdit(leader);
              setIsAdminOpen(true);
            }}
            onDelete={handleDeleteLeader}
          />
        </FadeInSection>

        {/* Music Streaming and Releases Section */}
        <FadeInSection>
          <MusicStreaming music={music} />
        </FadeInSection>

        {/* Dynamic Photo Gallery */}
        <FadeInSection>
          <Gallery />
        </FadeInSection>

        {/* Join Us Recruitment Section */}
        <FadeInSection>
          <JoinUs />
        </FadeInSection>

        {/* Real Contact/Booking Form */}
        <FadeInSection>
          <ContactUs 
            bookingSubject={bookingPrefill}
            onClearBookingSubject={() => setBookingPrefill("")}
            onInquirySubmitted={() => fetchData()}
          />
        </FadeInSection>

      </main>

      {/* Interactive Helper Chatbot Widget */}
      <ChatBot 
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onOpen={() => setIsChatOpen(true)}
      />

      {/* Leaders Control modal overlay */}
      <AnimatePresence>
        {isAdminOpen && (
          <AdminPanel 
            isOpen={isAdminOpen}
            onClose={() => setIsAdminOpen(false)}
            onLogin={handleAdminAuth}
            onLogout={handleAdminLogout}
            isAuthenticated={!!adminPasscode}
            inquiries={dbData.inquiries}
            onDeleteInquiry={handleDeleteInquiry}
            onUpdateInquiryStatus={handleUpdateInquiryStatus}
            
            onSaveActivity={handleSaveActivity}
            onSaveItinerary={handleSaveItinerary}
            onSaveMusic={handleSaveMusic}
            onSaveLeader={handleSaveLeader}
            
            activityToEdit={actToEdit}
            itineraryToEdit={itiToEdit}
            leaderToEdit={ldrToEdit}
            music={music}
            onClearEdits={clearOperationalStates}
          />
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-12 px-6 text-center text-slate-500 text-xs">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-left w-full md:w-auto">
            <h4 className="font-sans font-bold text-amber-400 text-sm">KACHAMBA CHORUS</h4>
            <p className="text-slate-400 font-mono text-[10px] uppercase tracking-wider mt-1">
              Seventh-day Adventist Ambassador Youth Ministry
            </p>
            <div className="text-slate-500 mt-2.5 text-[11px] font-sans">
              <p>SDA Kachok Church, Kisumu</p>
              <p className="mt-0.5">Phone: +254797450206 | Email: kachambachorus@gmail.com</p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-4 font-medium text-slate-400 text-sm">
              <a href="#itinerary" className="hover:text-amber-400 font-sans transition-colors">Tours</a>
              <a href="#activities" className="hover:text-amber-400 font-sans transition-colors">Ministries</a>
              <a href="#music" className="hover:text-amber-400 font-sans transition-colors">Music</a>
              <a href="#gallery" className="hover:text-amber-400 font-sans transition-colors">Gallery</a>
              <a href="#join" className="hover:text-amber-400 font-sans transition-colors">Join Us</a>
            </div>
            
            {/* Social Media Presence icons */}
            <div className="flex items-center gap-3">
              <a 
                href="https://www.facebook.com/share/1GjHUY1u8a/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-slate-400 p-2 rounded-full border border-slate-800 hover:border-amber-400 transition-all cursor-pointer font-sans"
                title="Follow Kachamba Chorus on Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a 
                href="https://www.tiktok.com/@kachokambassadors?_r=1&_t=ZS-974QMSEh16L"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-slate-400 p-2 rounded-full border border-slate-800 hover:border-amber-400 transition-all cursor-pointer font-sans"
                title="Follow us on TikTok"
              >
                <Music className="w-4 h-4" />
              </a>
              <a 
                href="https://youtube.com/@kachambachorus?si=Mqg13XYzO8QFE9fE"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-slate-400 p-2 rounded-full border border-slate-800 hover:border-amber-400 transition-all cursor-pointer font-sans"
                title="Subscribe to our YouTube Channel"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="text-center md:text-right w-full md:w-auto">
            <p className="font-sans leading-relaxed text-slate-500">
              &copy; {new Date().getFullYear()} Kachok Ambassadors Chorus. All Rights Reserved.<br />
              <span className="font-sans text-[10px] text-slate-600 tracking-wide uppercase">Sounds Of Togetherness since 2021</span>
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
