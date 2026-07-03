/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { onAuthStateChanged, User as FirebaseUser, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { auth, db } from "./lib/firebase";
import { uploadToFirebaseStorage } from "./lib/uploadToStorage";
import { useAdminAuth } from "./hooks/useAdminAuth";
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
import AuthModal from "./components/AuthModal";
import { Activity, ItineraryItem, Inquiry, MusicData, Leader, Subscriber, Broadcast, MemberSpotlight as MemberSpotlightType } from "./types";
import MemberSpotlight from "./components/MemberSpotlight";
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
  // Authentication state
  const [user, setUser] = useState<any>(() => {
    try {
      const savedUser = localStorage.getItem("kachamba_portal_user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(() => {
    return localStorage.getItem("kachamba_google_accessToken");
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        const mappedUser = {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(currentUser.displayName || "Ambassador")}`,
          providerId: "google"
        };
        setUser(mappedUser);
        localStorage.setItem("kachamba_portal_user", JSON.stringify(mappedUser));
      }
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = () => {
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (userData: any) => {
    setUser(userData);
    localStorage.setItem("kachamba_portal_user", JSON.stringify(userData));
  };

  const handleGoogleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.warn("Firebase logout warning:", error);
    }
    setUser(null);
    setGoogleAccessToken(null);
    localStorage.removeItem("kachamba_portal_user");
    localStorage.removeItem("kachamba_google_accessToken");
  };

  // Database states loaded dynamically from server
  const [dbData, setDbData] = useState<{
    activities: Activity[];
    itinerary: ItineraryItem[];
    inquiries: Inquiry[];
    leaders: Leader[];
    subscribers: Subscriber[];
    broadcasts: Broadcast[];
    memberSpotlights: MemberSpotlightType[];
  }>({
    activities: [],
    itinerary: [],
    inquiries: [],
    leaders: [],
    subscribers: [],
    broadcasts: [],
    memberSpotlights: []
  });

  const [music, setMusic] = useState<MusicData>({
    songTitle: "Umchukue Mwanao",
    artistName: "Kachok Ambassadors Chorus",
    albumName: "Sounds Of Togetherness",
    audioUrl: "",
    coverUrl: "",
    quoteText: "Let our voices unite, lifting the sound of hope to the clouds...",
    label: "Live At Central",
    lyrics: "[Acapella Harmony Intro]\n(Ibrahimu, Ibrahimu...\nMchukue mwanao, umpendaye sana Isaka...\nUkamtoe dhabihu...)\n\n(Verse 1)\nSiku ile Mungu alimwita Ibrahimu akasema: \"Ibrahimu!\"\nNaye akaitika kwa upole: \"Mimi hapa Bwana.\"\nAkamwambia: \"Umchukue mwanao, mwana wako wa pekee,\nIsaka yule unayempenda sana, ukaende mpaka nchi ya Moria,\nUkamtoe awe dhabihu ya kuteketezwa juu ya mlima nitakaokuonyesha.\"\n\n(Chorus)\nAkatandika punda wake asubuhi, akachukua kuni nicotine na moto,\nAkaanza safari ya utiifu, akamchukua mwanawe Isaka.\nMwanangu kumbuka, utiifu kwa Bwana ni ufunguo wa baraka,\nUnapoombwa kutoa kilicho bora, usisite wala usilalamike,\nMaana Mungu wetu aliye hai, kila wakati atajipatia!\n\n(Verse 2)\nWakiwa njiani mwana Isaka akamwuliza baba yake kwa unyenyekevu:\n\"Baba yangu, moto upo na kuni zipo, lakini yuko wapi kondoo?\"\nIbrahimu akamjibu kwa imani kuu, akasema kwa ujasiri:\n\"Mwanangu, Mungu atajipatia mwenyewe kondoo wa dhabihu.\"\nWakaendelea mbele kwa pamoja, mioyo yao ikiwa imejaa imani.\n\n(Bridge)\nWalipofika juu ya madhabahu, Ibrahimu akanyosha mkono wake,\nAkatwaa kisu amtoe mwanawe dhabihu, ghafla Malaika wa Bwana akaita:\n\"Ibrahimu! Ibrahimu! Usinyoshe mkono wako juu ya kijana!\"\nTazama! Nyuma yake kulikuwa na kondoo dume, amenaswa pembe zake kichakani,\nIbrahimu akamtoe yule kondoo badala ya Isaka!\n\n[Outro]\nBwana atajipatia... Yehova Yire!\nUtiifu wako utaleta baraka kubwa maishani mwako.\nMchukue mwanao, mchukue kila ulichonacho, umkabidhi Bwana,\nMshahara wako utakuwa mkuu mbinguni. Amina!"
  });


  // UI state managers
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [adminScrollTarget, setAdminScrollTarget] = useState<string | null>(null);

  // Custom secure React hook managing centralized admin sessions
  const { isAdmin, adminToken, authLoading, adminError, login: loginAdmin, loginWithGoogle: loginAdminGoogle, logout: logoutAdmin, resetPassword: resetAdminPassword } = useAdminAuth();
  const adminPasscode = adminToken;

  const [activeSection, setActiveSection] = useState("home");
  const [bookingPrefill, setBookingPrefill] = useState("");
  const [webLogo, setWebLogo] = useState("https://www.image2url.com/r2/default/images/1781098447744-9bfd4cd8-4c62-4a1a-b218-7ccd6f1b36d2.png");
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

  // App state markers
  // Editing state markers
  const [actToEdit, setActToEdit] = useState<Activity | null>(null);
  const [itiToEdit, setItiToEdit] = useState<ItineraryItem | null>(null);
  const [ldrToEdit, setLdrToEdit] = useState<Leader | null>(null);

  // Shared Vesper Poster link lookup
  const [sharedEvent, setSharedEvent] = useState<ItineraryItem | null>(null);
  const [copiedShareEventId, setCopiedShareEventId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get("event");
    if (eventId && dbData.itinerary.length > 0) {
      const found = dbData.itinerary.find(item => item.id === eventId);
      if (found) {
        setSharedEvent(found);
      }
    }
  }, [dbData.itinerary]);

  // Load database items on launch and whenever passcode changes
  const fetchData = async () => {
    try {
      const headers: Record<string, string> = {};
      if (adminPasscode) {
        headers["x-admin-passcode"] = adminPasscode;
        headers["x-admin-token"] = adminPasscode;
      }
      if (user?.uid) {
        headers["x-user-id"] = user.uid;
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
          leaders: data.leaders || [],
          subscribers: data.subscribers || [],
          broadcasts: data.broadcasts || [],
          memberSpotlights: data.memberSpotlights || []
        });
        if (data.music) {
          setMusic(data.music);
        }
      }

      // Securely fetch M-Pesa config to derive the dynamic website logo
      try {
        const mpesaRes = await fetch("/api/mpesa/config");
        if (mpesaRes.ok) {
          const mpesaData = await mpesaRes.json();
          if (mpesaData.receiptLogo) {
            setWebLogo(mpesaData.receiptLogo);
          }
        }
      } catch (err) {
        console.warn("Could not retrieve M-Pesa dynamic configurations on boot:", err);
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
  const handleAdminAuth = async (email: string, password?: string): Promise<boolean> => {
    return await loginAdmin(email, password);
  };

  const handleAdminGoogleAuth = async (): Promise<boolean> => {
    return await loginAdminGoogle();
  };

  const handleAdminResetPassword = async (email: string): Promise<boolean> => {
    return await resetAdminPassword(email);
  };

  const handleAdminLogout = () => {
    logoutAdmin();
    setIsAdminOpen(false);
    clearOperationalStates();
  };

  const clearOperationalStates = () => {
    setActToEdit(null);
    setItiToEdit(null);
    setLdrToEdit(null);
    setAdminScrollTarget(null);
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

  const compressImage = (base64Str: string, maxWidth = 800): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ratio = Math.min(maxWidth / img.width, 1);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.7)); // compress heavily
        } else {
          resolve(base64Str);
        }
      };
      img.onerror = () => resolve(base64Str); // Fallback
    });
  };

  const uploadBase64IfNeeded = async (base64Str: string | undefined | null, defaultFilename = "upload.jpg"): Promise<string | undefined | null> => {
    if (!base64Str || !base64Str.startsWith("data:")) {
      return base64Str;
    }

    let processedBase64 = base64Str;
    if (base64Str.startsWith("data:image/")) {
      processedBase64 = await compressImage(base64Str);
    }

    // Primary: upload to Firebase Storage (durable, works from Vercel)
    try {
      const url = await uploadToFirebaseStorage(processedBase64, defaultFilename);
      return url;
    } catch (storageErr) {
      console.warn("Firebase Storage upload failed, falling back to server upload:", storageErr);
    }

    // Fallback: server-side upload (Postgres/Firestore)
    if (!adminPasscode) return processedBase64;
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": adminPasscode
        },
        body: JSON.stringify({
          filename: defaultFilename,
          base64: processedBase64
        })
      });
      if (res.ok) {
        const data = await res.json();
        return data.url || processedBase64;
      } else {
        console.error("Fallback server upload also failed.");
      }
    } catch (err) {
      console.error("Network error during fallback upload:", err);
    }
    return processedBase64;
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
        user={user}
        onGoogleLogin={handleGoogleLogin}
        onGoogleLogout={handleGoogleLogout}
        webLogo={webLogo}
      />

      {/* Hero Welcome Unit */}
      <FadeInSection>
        <Hero 
          onAskAI={() => {
            setIsChatOpen(true);
          }}
          webLogo={webLogo}
        />
      </FadeInSection>

      <main className="flex-1">
        
        {/* Dynamic Member Spotlight Section */}
        <FadeInSection>
          <MemberSpotlight
            spotlights={dbData.memberSpotlights}
            isAdmin={!!adminPasscode}
            onLaunchAdmin={() => {
              setAdminScrollTarget("spotlight");
              setIsAdminOpen(true);
            }}
          />
        </FadeInSection>
        
        {/* Dynamic Itinerary Section */}
        <FadeInSection>
          <Itinerary 
            items={dbData.itinerary}
            isAdmin={!!adminPasscode}
            adminPasscode={adminPasscode}
            onRefresh={fetchData}
            onAdd={() => {
              setItiToEdit(null);
              setAdminScrollTarget("itinerary");
              setIsAdminOpen(true);
            }}
            onEdit={(item) => {
              setItiToEdit(item);
              setAdminScrollTarget("itinerary");
              setIsAdminOpen(true);
            }}
            onDelete={handleDeleteItinerary}
            onBookSelect={(eventName) => {
              setBookingPrefill(eventName);
            }}
            user={user}
            onGoogleLogin={handleGoogleLogin}
          />
        </FadeInSection>

        {/* Dynamic Ministries/Activities Section */}
        <FadeInSection>
          <Activities 
            items={dbData.activities}
            isAdmin={!!adminPasscode}
            onAdd={() => {
              setActToEdit(null);
              setAdminScrollTarget("activities");
              setIsAdminOpen(true);
            }}
            onEdit={(activity) => {
              setActToEdit(activity);
              setAdminScrollTarget("activities");
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
              setAdminScrollTarget("leaders");
              setIsAdminOpen(true);
            }}
            onEdit={(leader) => {
              setLdrToEdit(leader);
              setAdminScrollTarget("leaders");
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
            onClose={() => {
              setIsAdminOpen(false);
              setAdminScrollTarget(null);
            }}
            onLogin={handleAdminAuth}
            onGoogleLoginAdmin={handleAdminGoogleAuth}
            onResetPassword={handleAdminResetPassword}
            onLogout={handleAdminLogout}
            isAuthenticated={!!adminPasscode}
            adminError={adminError}
            adminToken={adminToken}
            authLoading={authLoading}
            googleAccessToken={googleAccessToken}
            onGoogleLogin={handleGoogleLogin}
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
            itinerary={dbData.itinerary}
            subscribers={dbData.subscribers}
            broadcasts={dbData.broadcasts}
            memberSpotlights={dbData.memberSpotlights}
            onRefresh={fetchData}
            scrollToSection={adminScrollTarget}
          />
        )}
      </AnimatePresence>


      {/* 🌟 STANDALONE SABBATH/FRIDAY VESPER POSTER & EVENT DISPATCH VIEW 🌟 */}
      <AnimatePresence>
        {sharedEvent && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto text-slate-100"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl relative"
            >
              <button 
                onClick={() => {
                  setSharedEvent(null);
                  window.history.pushState({}, "", window.location.origin);
                }}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-slate-950/60 hover:bg-slate-950 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-slate-805"
                title="Return to Main Website"
              >
                ✕
              </button>

              {/* Poster frame aspect ratio container */}
              <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-slate-1050 flex items-center justify-center border-b border-slate-850 overflow-hidden group">
                {sharedEvent.mediaUrl ? (
                  <img 
                    src={sharedEvent.mediaUrl} 
                    alt={sharedEvent.event}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 font-sans"
                  />
                ) : (
                  <div className="text-center p-6 flex flex-col items-center gap-3">
                    <span className="text-4xl">🎶</span>
                    <h3 className="font-sans font-bold text-lg text-amber-400 tracking-wide uppercase">Kachamba Chorus Sabbath Vesper</h3>
                    <p className="text-[11px] font-mono text-slate-500 uppercase tracking-widest">Worship in Truth & Choral Sacred Music</p>
                  </div>
                )}
                {/* Backdrop amber layout glow */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent pointer-events-none" />
                
                {/* Status banner */}
                <div className="absolute top-4 left-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-mono font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                  Upcoming Sabbath Crusade
                </div>
              </div>

              {/* Event details container */}
              <div className="p-6 sm:p-8 flex flex-col gap-5">
                <div>
                  <h2 className="text-xl sm:text-2xl font-sans font-black tracking-tight text-white mb-2 uppercase">
                    {sharedEvent.event}
                  </h2>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-450 uppercase font-mono tracking-wider">
                    <span className="flex items-center gap-1.5 text-amber-405">
                      📅 {new Date(sharedEvent.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5 text-slate-300">
                      ⏰ {sharedEvent.time || "Sunset"}
                    </span>
                  </div>
                </div>

                {/* Meta properties details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/40 border border-slate-850 p-4 rounded-2xl text-xs">
                  <div>
                    <span className="block text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-0.5">Host Council</span>
                    <strong className="text-slate-200">{sharedEvent.host || "SDA Kachock Church"}</strong>
                  </div>
                  <div>
                    <span className="block text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-0.5">Auditorium Venue</span>
                    <strong className="text-slate-200">{sharedEvent.location}</strong>
                  </div>
                </div>

                {/* Pastor notes section */}
                {sharedEvent.notes && (
                  <div className="bg-slate-950/20 border border-slate-800 p-4 rounded-2xl">
                    <span className="block text-[9px] font-mono text-amber-400 uppercase tracking-widest mb-2 font-bold">Pastor's Special Guide Notes</span>
                    <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed font-sans font-medium">
                      {sharedEvent.notes}
                    </p>
                  </div>
                )}

                {/* Render extracted real Google Meet / Forms direct link button proxies */}
                <div className="flex flex-col gap-2 mt-1">
                  {/* Extracted Google Meet link buttons */}
                  {sharedEvent.notes?.includes("meet.google.com/") && (
                    <a 
                      href={sharedEvent.notes.match(/https:\/\/meet\.google\.com\/[a-z0-9-]+/i)?.[0] || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all hover:scale-[1.01] uppercase tracking-wider font-mono cursor-pointer"
                    >
                      🎥 Click to Join Sabbath Google Meet Room
                    </a>
                  )}

                  {/* Extracted Google Forms RSVP buttons */}
                  {sharedEvent.notes?.includes("docs.google.com/forms/") && (
                    <a 
                      href={sharedEvent.notes.match(/https:\/\/docs\.google\.com\/forms\/[a-zA-Z0-9-_\/]+/i)?.[0] || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-purple-600 hover:bg-purple-500 text-white font-bold p-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all hover:scale-[1.01] uppercase tracking-wider font-mono cursor-pointer"
                    >
                      📝 Submit Requests / Prayer Form to Admin
                    </a>
                  )}
                </div>

                {/* Footer share controls */}
                <div className="flex items-center gap-2 border-t border-slate-850 pt-5 mt-2 justify-between">
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                    <span>Spread the Gospel:</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/?event=${sharedEvent.id}`;
                        navigator.clipboard.writeText(url).then(() => {
                          setCopiedShareEventId(sharedEvent.id);
                          setTimeout(() => setCopiedShareEventId(null), 2000);
                        });
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer font-sans transition-colors flex items-center gap-1.5 ${
                        copiedShareEventId === sharedEvent.id
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-slate-800 hover:bg-slate-755 text-slate-200 border border-slate-700"
                      }`}
                    >
                      <span>{copiedShareEventId === sharedEvent.id ? "✓ Copied Link!" : "🔗 Share Link"}</span>
                    </button>

                    <button
                      onClick={() => {
                        setSharedEvent(null);
                        window.history.pushState({}, "", window.location.origin);
                      }}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-transform duration-100 hover:scale-102"
                    >
                      Explore Chorus HQ ➜
                    </button>
                  </div>
                </div>

              </div>
            </motion.div>
          </motion.div>
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

      {/* Modern Credentials and Multi-Social Authentications Modal */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <AuthModal 
            isOpen={isAuthModalOpen} 
            onClose={() => setIsAuthModalOpen(false)} 
            onAuthSuccess={handleAuthSuccess}
            theme={theme}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
