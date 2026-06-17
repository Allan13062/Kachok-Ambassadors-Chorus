import React, { useState, useEffect } from "react";
import { X, Lock, Eye, Check, ShieldCheck, Mail, Calendar, AlertCircle, Trash2, Plus, EyeOff, Music, Users, CreditCard } from "lucide-react";
import { Inquiry, Activity, ItineraryItem, MusicData, Leader } from "../types";
import ImageEditor from "./ImageEditor";
import { motion, AnimatePresence } from "motion/react";

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (passcode: string) => Promise<boolean>;
  onLogout: () => void;
  isAuthenticated: boolean;
  inquiries: Inquiry[];
  onDeleteInquiry: (id: string) => void;
  onUpdateInquiryStatus: (id: string, status: string) => void;
  
  // Creation/Edit Handlers
  onSaveActivity: (actData: any) => Promise<boolean>;
  onSaveItinerary: (itiData: any) => Promise<boolean>;
  onSaveMusic: (musicData: MusicData) => Promise<boolean>;
  onSaveLeader: (ldrData: any) => Promise<boolean>;
  
  activityToEdit: Activity | null;
  itineraryToEdit: ItineraryItem | null;
  leaderToEdit: Leader | null;
  music: MusicData;
  onClearEdits: () => void;
}

export default function AdminPanel({
  isOpen,
  onClose,
  onLogin,
  onLogout,
  isAuthenticated,
  inquiries,
  onDeleteInquiry,
  onUpdateInquiryStatus,
  onSaveActivity,
  onSaveItinerary,
  onSaveMusic,
  onSaveLeader,
  activityToEdit,
  itineraryToEdit,
  leaderToEdit,
  music,
  onClearEdits
}: AdminPanelProps) {
  
  const [passcode, setPasscode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [submittingData, setSubmittingData] = useState(false);

  // Reset UI states
  const [showResetUI, setShowResetUI] = useState(false);
  const [resetRecoveryKey, setResetRecoveryKey] = useState("");
  const [resetNewPasscode, setResetNewPasscode] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetErrorMsg, setResetErrorMsg] = useState("");
  const [resetCurrentPasscode, setResetCurrentPasscode] = useState("");

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetNewPasscode || (!resetRecoveryKey && !resetCurrentPasscode)) return;
    setAuthLoading(true);
    setResetMessage("");
    setResetErrorMsg("");

    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recoveryKey: resetRecoveryKey,
          currentPasscode: resetCurrentPasscode,
          newPasscode: resetNewPasscode
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResetMessage("Passcode reset successfully! Check above to login.");
        setTimeout(() => {
          setShowResetUI(false);
          setResetMessage("");
          setResetRecoveryKey("");
          setResetNewPasscode("");
          setResetCurrentPasscode("");
        }, 3000);
      } else {
        setResetErrorMsg(data.error || "Failed to reset passcode.");
      }
    } catch (err: any) {
      setResetErrorMsg("Connection format error: " + err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // M-Pesa Config states
  const [mpesaTill, setMpesaTill] = useState("4119041");
  const [mpesaName, setMpesaName] = useState("Kachok Ambassadors Chorus");
  const [mpesaImage, setMpesaImage] = useState("");
  const [mpesaType, setMpesaType] = useState("buy_goods");
  const [mpesaSaving, setMpesaSaving] = useState(false);
  const [mpesaMessage, setMpesaMessage] = useState("");
  const [mpesaError, setMpesaError] = useState("");

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      const fetchMpesaConfig = async () => {
        try {
          const res = await fetch("/api/mpesa/config");
          if (res.ok) {
            const data = await res.json();
            setMpesaTill(data.tillNumber || "4119041");
            setMpesaName(data.tillName || "Kachok Ambassadors Chorus");
            setMpesaImage(data.tillImage || "");
            setMpesaType(data.tillType || "buy_goods");
          }
        } catch (err) {
          console.error("Failed to load mpesa config", err);
        }
      };
      fetchMpesaConfig();
    }
  }, [isOpen, isAuthenticated]);

  const handleSaveMpesa = async (e: React.FormEvent) => {
    e.preventDefault();
    setMpesaSaving(true);
    setMpesaMessage("");
    setMpesaError("");
    try {
      const res = await fetch("/api/mpesa/config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": passcode || localStorage.getItem("kachamba_admin_passcode") || ""
        },
        body: JSON.stringify({
          tillNumber: mpesaTill,
          tillName: mpesaName,
          tillImage: mpesaImage,
          tillType: mpesaType
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMpesaMessage("M-Pesa Billing config saved successfully!");
      } else {
        setMpesaError(data.error || "Failed to save mpesa configurations.");
      }
    } catch (err: any) {
      setMpesaError("Error saving: " + err.message);
    } finally {
      setMpesaSaving(false);
    }
  };

  // Forms states
  const [actForm, setActForm] = useState<{
    title: string;
    date: string;
    location: string;
    description: string;
    category: string;
    image: string;
    mediaType: 'image' | 'video' | '';
  }>({
    title: "",
    date: "",
    location: "",
    description: "",
    category: "Worship & Practice",
    image: "",
    mediaType: ""
  });

  const [actFileError, setActFileError] = useState("");

  const [itiForm, setItiForm] = useState<{
    event: string;
    date: string;
    time: string;
    location: string;
    host: string;
    status: string;
    notes: string;
    mediaUrl: string;
    mediaType: 'image' | 'video' | '';
  }>({
    event: "",
    date: "",
    time: "",
    location: "",
    host: "",
    status: "Confirmed",
    notes: "",
    mediaUrl: "",
    mediaType: ""
  });

  const [itiFileError, setItiFileError] = useState("");

  // Music Edit parameters
  const [musicForm, setMusicForm] = useState<MusicData>({
    songTitle: "",
    artistName: "",
    albumName: "",
    audioUrl: "",
    coverUrl: "",
    quoteText: "",
    label: "",
    lyrics: ""
  });
  const [musicSaving, setMusicSaving] = useState(false);
  const [musicMessage, setMusicMessage] = useState("");

  // Leader Edit parameters
  const [ldrForm, setLdrForm] = useState({
    name: "",
    role: "",
    image: "",
    bio: "",
    phone: ""
  });
  const [ldrSaving, setLdrSaving] = useState(false);
  const [ldrError, setLdrError] = useState("");
  const [showLdrStudio, setShowLdrStudio] = useState(false);
  const [showActStudio, setShowActStudio] = useState(false);
  const [showItiStudio, setShowItiStudio] = useState(false);

  // Audio Snippet Trimmer parameter states
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [trimStart, setTrimStart] = useState<number>(0);
  const [isTrimming, setIsTrimming] = useState<boolean>(false);
  const [trimError, setTrimError] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<boolean>(false);
  const audioCtxRef = React.useRef<AudioContext | null>(null);
  const sourceNodeRef = React.useRef<AudioBufferSourceNode | null>(null);

  const stopPreview = () => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch (e) {}
      sourceNodeRef.current = null;
    }
    setPreviewing(false);
  };

  const handleAudioFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAudioFile(file);
    setAudioBuffer(null);
    setAudioDuration(0);
    setTrimStart(0);
    setTrimError(null);
    stopPreview();

    try {
      setIsTrimming(true);
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const arrayBuffer = await file.arrayBuffer();
      // Decode audio asynchronously
      const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);
      setAudioBuffer(decodedBuffer);
      setAudioDuration(decodedBuffer.duration);
    } catch (err: any) {
      console.error(err);
      setTrimError("Could not decode audio file. Make sure it's a valid audio format.");
    } finally {
      setIsTrimming(false);
    }
  };

  const handlePlayPreview = async () => {
    if (!audioBuffer) return;
    try {
      if (previewing) {
        stopPreview();
        return;
      }

      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      
      const playDuration = Math.min(25, audioDuration - trimStart);
      source.start(0, trimStart, playDuration);
      sourceNodeRef.current = source;
      setPreviewing(true);
      
      source.onended = () => {
        setPreviewing(false);
      };
    } catch (err: any) {
      console.error(err);
      setTrimError("Error previewing audio: " + err.message);
    }
  };

  const handleCropAndEncode = async () => {
    if (!audioBuffer) return;
    try {
      setIsTrimming(true);
      setTrimError(null);
      stopPreview();
      
      const blob = bufferToWavMono(audioBuffer, trimStart, 25);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        setMusicForm(prev => ({
          ...prev,
          audioUrl: base64data
        }));
        setIsTrimming(false);
      };
      reader.readAsDataURL(blob);
    } catch (err: any) {
      console.error(err);
      setTrimError("Failed to crop and encode snippet: " + err.message);
      setIsTrimming(false);
    }
  };

  React.useEffect(() => {
    return () => {
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  React.useEffect(() => {
    if (music) {
      setMusicForm({
        songTitle: music.songTitle || "",
        artistName: music.artistName || "",
        albumName: music.albumName || "",
        audioUrl: music.audioUrl || "",
        coverUrl: music.coverUrl || "",
        quoteText: music.quoteText || "",
        label: music.label || "",
        lyrics: music.lyrics || ""
      });
    }
  }, [music]);

  // Sync edits if trigger present
  React.useEffect(() => {
    if (activityToEdit) {
      setActForm({
        title: activityToEdit.title,
        date: activityToEdit.date,
        location: activityToEdit.location,
        description: activityToEdit.description,
        category: activityToEdit.category,
        image: activityToEdit.image,
        mediaType: activityToEdit.mediaType || "image"
      });
    } else {
      setActForm({
        title: "",
        date: "",
        location: "",
        description: "",
        category: "Worship & Practice",
        image: "",
        mediaType: ""
      });
    }
  }, [activityToEdit]);

  React.useEffect(() => {
    if (itineraryToEdit) {
      setItiForm({
        event: itineraryToEdit.event,
        date: itineraryToEdit.date,
        time: itineraryToEdit.time,
        location: itineraryToEdit.location,
        host: itineraryToEdit.host,
        status: itineraryToEdit.status,
        notes: itineraryToEdit.notes || "",
        mediaUrl: itineraryToEdit.mediaUrl || "",
        mediaType: itineraryToEdit.mediaType || ""
      });
    } else {
      setItiForm({
        event: "",
        date: "",
        time: "",
        location: "",
        host: "",
        status: "Confirmed",
        notes: "",
        mediaUrl: "",
        mediaType: ""
      });
    }
  }, [itineraryToEdit]);

  React.useEffect(() => {
    setShowLdrStudio(false);
    if (leaderToEdit) {
      setLdrForm({
        name: leaderToEdit.name,
        role: leaderToEdit.role,
        image: leaderToEdit.image || "",
        bio: leaderToEdit.bio || "",
        phone: leaderToEdit.phone || ""
      });
    } else {
      setLdrForm({
        name: "",
        role: "",
        image: "",
        bio: "",
        phone: ""
      });
    }
  }, [leaderToEdit]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode) return;
    setAuthLoading(true);
    setErrorMsg("");
    
    const success = await onLogin(passcode);
    setAuthLoading(false);
    if (!success) {
      setErrorMsg("Unauthorized: Invalid passcode. Check with Choir Director.");
    } else {
      setPasscode("");
    }
  };

  const handleActSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingData(true);
    const result = await onSaveActivity(actForm);
    setSubmittingData(false);
    if (result) {
      onClearEdits();
      onClose();
    }
  };

  const handleItiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingData(true);
    const result = await onSaveItinerary(itiForm);
    setSubmittingData(false);
    if (result) {
      onClearEdits();
      onClose();
    }
  };

  const handleMusicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMusicSaving(true);
    setMusicMessage("");
    const result = await onSaveMusic(musicForm);
    setMusicSaving(false);
    if (result) {
      setMusicMessage("Track player metadata updated successfully!");
      setTimeout(() => setMusicMessage(""), 4000);
    } else {
      setMusicMessage("Failed to update music settings.");
    }
  };

  const handleLdrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ldrForm.name || !ldrForm.role) {
      setLdrError("Name and position/role are required!");
      return;
    }
    setLdrSaving(true);
    setLdrError("");
    const result = await onSaveLeader(ldrForm);
    setLdrSaving(false);
    if (result) {
      onClearEdits();
      onClose();
    } else {
      setLdrError("Failed to save leadership records.");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md overflow-y-auto"
    >
      <motion.div 
        initial={{ y: 25, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 25, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-white shadow-2xl relative my-8"
      >
        
        {/* Close Button */}
        <button 
          onClick={() => {
            onClearEdits();
            onClose();
          }}
          className="absolute top-5 right-5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-750 p-2 rounded-full cursor-pointer transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* LOCKED SCREEN GATE */}
        {!isAuthenticated ? (
          <div className="flex-1 py-16 px-6 sm:px-12 flex flex-col items-center justify-center text-center">
            <div className="bg-amber-500 text-slate-950 p-4 rounded-full shadow-lg shadow-amber-500/20 mb-6 font-bold">
              <Lock className="w-8 h-8" />
            </div>
            
            <h2 className="font-sans font-extrabold text-3xl text-amber-400 max-w-md">
              KACHAMBA LEADER PORTAL
            </h2>
            <p className="font-sans text-sm text-slate-400 max-w-sm mt-2 leading-relaxed">
              Authorized SDA Choir leaders or Church Elders only. Unlock dynamic editing of activities, scheduling itineraries, and feedback viewing.
            </p>

            {showResetUI ? (
              <form onSubmit={handleResetSubmit} className="mt-8 max-w-sm w-full flex flex-col gap-3">
                {resetErrorMsg && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs font-mono text-center flex items-center justify-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{resetErrorMsg}</span>
                  </div>
                )}
                {resetMessage && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-xs font-mono text-center flex items-center justify-center gap-1.5">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{resetMessage}</span>
                  </div>
                )}
                <div className="relative">
                  <input 
                    type="text"
                    required
                    value={resetRecoveryKey}
                    onChange={(e) => setResetRecoveryKey(e.target.value)}
                    placeholder="Enter Recovery Key (e.g. KACHAMBA2026)"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-lg p-3 text-center outline-none text-xs tracking-widest placeholder-slate-500 transition-all font-mono"
                  />
                </div>
                <div className="relative">
                  <input 
                    type="password"
                    required
                    value={resetNewPasscode}
                    onChange={(e) => setResetNewPasscode(e.target.value)}
                    placeholder="Create New Admin Passcode"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-lg p-3 text-center outline-none text-xs tracking-widest placeholder-slate-500 transition-all font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-sans font-bold text-sm py-3 px-6 rounded-lg transition-colors cursor-pointer disabled:bg-slate-800 disabled:text-slate-500 shadow-lg shadow-emerald-500/5 mt-1"
                >
                  {authLoading ? "Updating..." : "Reset Admin Passcode"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowResetUI(false);
                    setResetErrorMsg("");
                    setResetMessage("");
                  }}
                  className="text-xs text-slate-400 hover:text-white mt-2 font-sans font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <form onSubmit={handleAuthSubmit} className="mt-8 max-w-sm w-full flex flex-col gap-3">
                {errorMsg && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs font-mono text-center flex items-center justify-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}
                
                <div className="relative">
                  <input 
                    type="password"
                    required
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Enter Passcode (e.g., SDA2026)"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-lg p-3 text-center outline-none text-sm tracking-widest placeholder-slate-500 transition-all font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-sans font-bold text-sm py-3 px-6 rounded-lg transition-colors cursor-pointer disabled:bg-slate-800 disabled:text-slate-500 shadow-lg shadow-amber-500/5 mt-1"
                >
                  {authLoading ? "Verifying..." : "Authenticate Session"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowResetUI(true)}
                  className="text-[11px] text-amber-500/70 hover:text-amber-400 mt-2 font-mono uppercase tracking-widest transition-colors cursor-pointer"
                >
                  Forgot Passcode? Reset Here
                </button>
              </form>
            )}

            <span className="font-mono text-[10px] text-slate-600 mt-6 uppercase tracking-wider">
              Secret Key Auth • Demo Key: SDA2026 • Recovery Key: KACHAMBA2026
            </span>
          </div>
        ) : (
          
          /* UNLOCKED LEADER PANEL CONTENT */
          <div className="flex flex-col h-full overflow-hidden">
            
            {/* Header */}
            <div className="bg-slate-950 py-5 px-6 sm:px-8 border-b border-slate-805 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500/12 text-emerald-400 border border-emerald-500/30 p-2 rounded-lg">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-sans font-bold text-lg md:text-xl text-white">Choral Council Dashboard</h2>
                  <p className="text-xs text-slate-400 font-mono">Welcome, Ambassador Council Member</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onLogout}
                  className="bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/10 font-sans font-semibold text-xs px-4 py-2 rounded-lg cursor-pointer transition-all"
                >
                  Force Log Out
                </button>
              </div>
            </div>

            {/* Scrolling Body */}
            <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 flex flex-col gap-10 custom-scrollbar max-h-[70vh]">
              
              {/* TRIGGER FORM INDICATION */}
              {(activityToEdit || itineraryToEdit || leaderToEdit) && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex justify-between items-center text-amber-300 text-xs">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span>Currently Editing: <strong>{activityToEdit ? `Activity: "${activityToEdit.title}"` : itineraryToEdit ? `Itinerary Tour: "${itineraryToEdit?.event}"` : `Leader Steward: "${leaderToEdit?.name}"`}</strong></span>
                  </div>
                  <button 
                    onClick={onClearEdits}
                    className="bg-amber-500/20 text-amber-300 font-bold px-2.5 py-1 rounded hover:bg-amber-500 hover:text-slate-950 transition-colors cursor-pointer uppercase text-[10px]"
                  >
                    Cancel Editing
                  </button>
                </div>
              )}

              {/* SECTION A: MANAGE ACTIVITIES FORM */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* 1. Activities Form */}
                <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl">
                  <div className="flex items-center gap-2 text-amber-400 mb-4 bg-slate-950 p-2 rounded-lg font-bold border border-slate-805 text-sm uppercase tracking-wide">
                    <Plus className="w-4 h-4" />
                    <span>{activityToEdit ? "Edit Ministry Program" : "Create Modern Ministry"}</span>
                  </div>

                  <form onSubmit={handleActSubmit} className="flex flex-col gap-4 text-xs">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Title</label>
                      <input 
                        type="text" required
                        value={actForm.title}
                        onChange={(e) => setActForm({ ...actForm, title: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white outline-none focus:border-amber-400"
                        placeholder="e.g. Accapella Vocal Workshop"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Category</label>
                        <select 
                          value={actForm.category}
                          onChange={(e) => setActForm({ ...actForm, category: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white cursor-pointer"
                        >
                          <option value="Worship & Practice">Worship & Practice</option>
                          <option value="Youth Camp & Training">Youth Camp & Training</option>
                          <option value="Community Outreach">Community Outreach</option>
                          <option value="General Activities">General Activities</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Date/Schedule</label>
                        <input 
                          type="text" required
                          value={actForm.date}
                          onChange={(e) => setActForm({ ...actForm, date: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white outline-none focus:border-amber-400"
                          placeholder="e.g. Every Saturday at 2:30 PM"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Location Address</label>
                      <input 
                        type="text" required
                        value={actForm.location}
                        onChange={(e) => setActForm({ ...actForm, location: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white outline-none focus:border-amber-400"
                        placeholder="e.g. Sanctuary Hall, Kachok SDA"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Cover Image URL (or upload local)</label>
                      <input 
                        type="text"
                        value={actForm.image}
                        onChange={(e) => setActForm({ ...actForm, image: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white outline-none focus:border-amber-400 font-mono text-[11px] mb-2"
                        placeholder="Paste image link, or leave blank"
                      />
                      <div className="flex flex-col sm:flex-row gap-3">
                        <label className="flex-1 bg-slate-800 border border-slate-700 p-2 rounded cursor-pointer text-center hover:bg-slate-750 transition-colors flex items-center justify-center gap-2 font-mono text-[10px] uppercase font-bold text-slate-350">
                          <Plus className="w-3.5 h-3.5 text-amber-400" />
                          <span>Upload Photo</span>
                          <input 
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              setActFileError("");
                              if (file) {
                                if (file.size > 100 * 1024 * 1024) {
                                  setActFileError("File too large. Choose under 100MB.");
                                  return;
                                }
                                try {
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    const dataUrl = event.target?.result as string;
                                    if (!dataUrl) {
                                      setActFileError("Failed to read image file.");
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
                                          setActForm({ ...actForm, image: dataUrl, mediaType: 'image' });
                                          return;
                                        }
                                        ctx.drawImage(image, 0, 0, width, height);
                                        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.95);
                                        setActForm({ ...actForm, image: compressedDataUrl, mediaType: 'image' });
                                      } catch (err) {
                                        console.error("Canvas encoding error", err);
                                        setActForm({ ...actForm, image: dataUrl, mediaType: 'image' });
                                      }
                                    };
                                    image.onerror = () => {
                                      console.warn("Fell back to raw image dataUrl due to loading restriction.");
                                      setActForm({ ...actForm, image: dataUrl, mediaType: 'image' });
                                    };
                                    image.src = dataUrl;
                                  };
                                  reader.onerror = () => {
                                    setActFileError("Failed to load file.");
                                  };
                                  reader.readAsDataURL(file);
                                } catch (e) {
                                  setActFileError("Image file loading error.");
                                }
                              }
                            }}
                          />
                        </label>

                        <label className="flex-1 bg-slate-800 border border-slate-700 p-2 rounded cursor-pointer text-center hover:bg-slate-750 transition-colors flex items-center justify-center gap-2 font-mono text-[10px] uppercase font-bold text-slate-350">
                          <Plus className="w-3.5 h-3.5 text-amber-500" />
                          <span>Upload Video</span>
                          <input 
                            type="file"
                            accept="video/*"
                            className="hidden"
                            onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              setActFileError("");
                              if (file) {
                                if (file.size > 100 * 1024 * 1024) {
                                  setActFileError("Video too large. Choose under 100MB.");
                                  return;
                                }
                                try {
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    const dataUrl = event.target?.result as string;
                                    setActForm({ ...actForm, image: dataUrl, mediaType: 'video' });
                                  };
                                  reader.readAsDataURL(file);
                                } catch (e) {
                                  setActFileError("Video file loading error.");
                                }
                              }
                            }}
                          />
                        </label>

                        {actForm.image && (
                          <button
                            type="button"
                            onClick={() => setActForm({ ...actForm, image: "", mediaType: "" })}
                            className="bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 px-3 py-2 rounded border border-red-500/20 text-[10px] font-mono uppercase transition-colors shrink-0"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      {actFileError && (
                        <div className="text-[10px] text-red-400 font-mono bg-red-950/20 border border-red-900/30 p-2 rounded mt-1">
                          ⚠️ {actFileError}
                        </div>
                      )}
                      {actForm.image && actForm.image.startsWith("data:") && (
                        <div className="mt-1 text-slate-400 text-[10px] font-mono bg-slate-950 p-2 rounded border border-slate-800">
                          Uploaded local file successfully!
                        </div>
                      )}

                      {actForm.image && (!actForm.mediaType || actForm.mediaType === "image") && (
                        <div className="mt-3 flex flex-col gap-2">
                          <div className="flex items-center justify-between bg-slate-900/50 p-2 rounded-lg border border-slate-850">
                            <span className="text-[10px] font-mono text-slate-450 uppercase font-semibold">Activity Crop Studio</span>
                            <button
                              type="button"
                              onClick={() => setShowActStudio(!showActStudio)}
                              className={`text-[9px] font-mono uppercase tracking-wider py-1 px-2.5 rounded border flex items-center gap-1 cursor-pointer transition-all ${
                                showActStudio 
                                  ? "bg-rose-500/10 border-rose-500/30 text-rose-450 hover:bg-rose-500 hover:text-white"
                                  : "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500 hover:text-slate-950 font-bold"
                              }`}
                            >
                              {showActStudio ? "Close Studio [X]" : "🎨 Launch Photo Crop Studio"}
                            </button>
                          </div>

                          <AnimatePresence mode="wait">
                            {showActStudio ? (
                              <motion.div 
                                key="studio-act"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="overflow-hidden mt-2"
                              >
                                <ImageEditor 
                                  initialImage={actForm.image}
                                  onSave={(newBase64) => {
                                    setActForm({ ...actForm, image: newBase64, mediaType: 'image' });
                                    setShowActStudio(false);
                                  }}
                                  onCancel={() => setShowActStudio(false)}
                                />
                              </motion.div>
                            ) : null}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Detailed Description</label>
                      <textarea 
                        required rows={4}
                        value={actForm.description}
                        onChange={(e) => setActForm({ ...actForm, description: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white outline-none focus:border-amber-400 resize-none"
                        placeholder="Why is this ministry active? Provide logistics details, sermon coordinators, or musical values..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingData}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded transition-colors cursor-pointer"
                    >
                      {submittingData ? "Saving..." : (activityToEdit ? "Update Ministry Program" : "Establish New Ministry")}
                    </button>
                  </form>
                </div>


                {/* 2. Itinerary Edit Form */}
                <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl">
                  <div className="flex items-center gap-2 text-amber-400 mb-4 bg-slate-950 p-2 rounded-lg font-bold border border-slate-805 text-sm uppercase tracking-wide">
                    <Calendar className="w-4 h-4" />
                    <span>{itineraryToEdit ? "Edit Tour Itinerary" : "Plan New Choral Tour"}</span>
                  </div>

                  <form onSubmit={handleItiSubmit} className="flex flex-col gap-4 text-xs">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Event / Crusade Title</label>
                      <input 
                        type="text" required
                        value={itiForm.event}
                        onChange={(e) => setItiForm({ ...itiForm, event: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white outline-none focus:border-amber-400"
                        placeholder="e.g. Kisumu Youth Camporee Vesper"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Absolute Calendar Date</label>
                        <input 
                          type="date" required
                          value={itiForm.date}
                          onChange={(e) => setItiForm({ ...itiForm, date: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white outline-none focus:border-amber-400 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Hour of performance</label>
                        <input 
                          type="text" required
                          value={itiForm.time}
                          onChange={(e) => setItiForm({ ...itiForm, time: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white outline-none focus:border-amber-400"
                          placeholder="e.g. 10:30 AM or Sunset"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Host/Sponsor Council</label>
                        <input 
                          type="text" required
                          value={itiForm.host}
                          onChange={(e) => setItiForm({ ...itiForm, host: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white outline-none focus:border-amber-400"
                          placeholder="e.g. Lake Victoria Field"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Touring Status</label>
                        <select 
                          value={itiForm.status}
                          onChange={(e) => setItiForm({ ...itiForm, status: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white cursor-pointer"
                        >
                          <option value="Confirmed">Confirmed</option>
                          <option value="Tentative">Tentative</option>
                          <option value="Past">Past Mission</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Auditorum / Church Address</label>
                      <input 
                        type="text" required
                        value={itiForm.location}
                        onChange={(e) => setItiForm({ ...itiForm, location: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white outline-none focus:border-amber-400"
                        placeholder="e.g. Migori Town SDA Church"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Special Pastor's Notes (Optional)</label>
                      <textarea 
                        rows={3}
                        value={itiForm.notes}
                        onChange={(e) => setItiForm({ ...itiForm, notes: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white outline-none focus:border-amber-400 resize-none"
                        placeholder="e.g. Sermon booklet supplied, dress code: White and Blue Uniform..."
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Upload Photo or Video OR Paste URL</label>
                      <div className="flex flex-col gap-2">
                        <input 
                          type="text"
                          value={itiForm.mediaUrl}
                          onChange={(e) => {
                            const val = e.target.value;
                            let detectedType: 'image' | 'video' | '' = "";
                            if (val) {
                              detectedType = (val.match(/\.(mp4|webm|ogg|mov)$/i) || val.includes("video") || val.includes("youtube") || val.includes("vimeo")) ? 'video' : 'image';
                            }
                            setItiForm({ ...itiForm, mediaUrl: val, mediaType: detectedType });
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white outline-none focus:border-amber-400 font-mono text-[11px]"
                          placeholder="Paste image/video URL (e.g., https://... or leave blank)"
                        />
                        <div className="flex items-center gap-3">
                          <label className="flex-1 bg-slate-800 border border-slate-700 p-2 rounded cursor-pointer text-center hover:bg-slate-750 transition-colors flex items-center justify-center gap-2 font-mono text-[10px] uppercase font-bold text-slate-350">
                            <Plus className="w-3.5 h-3.5 text-amber-400" />
                            <span>Upload File (Photo/Video)</span>
                            <input 
                              type="file"
                              accept="image/*,video/*"
                              className="hidden"
                              onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                setItiFileError("");
                                if (file) {
                                  // Support up to 100MB files (photos and video clips)
                                  if (file.size > 100 * 1024 * 1024) {
                                    setItiFileError("This file is too large. Please select a photo or video under 100MB.");
                                    return;
                                  }

                                  const type = file.type.startsWith('video') ? 'video' : 'image';
                                  if (type === 'video') {
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                      if (event.target?.result) {
                                        setItiForm({
                                          ...itiForm,
                                          mediaUrl: event.target.result as string,
                                          mediaType: 'video'
                                        });
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  } else {
                                    // Image! Use FileReader to get a dataURL first so it works robustly in sandboxed iframes.
                                    try {
                                      const reader = new FileReader();
                                      reader.onload = (event) => {
                                        const dataUrl = event.target?.result as string;
                                        if (!dataUrl) {
                                          setItiFileError("Failed to read image file.");
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
                                              setItiForm({
                                                ...itiForm,
                                                mediaUrl: dataUrl,
                                                mediaType: 'image'
                                              });
                                              return;
                                            }

                                            ctx.drawImage(image, 0, 0, width, height);
                                            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.95);
                                            setItiForm({
                                              ...itiForm,
                                              mediaUrl: compressedDataUrl,
                                              mediaType: 'image'
                                            });
                                          } catch (err) {
                                            console.error("Canvas compression error", err);
                                            setItiForm({
                                              ...itiForm,
                                              mediaUrl: dataUrl,
                                              mediaType: 'image'
                                            });
                                          }
                                        };
                                        image.onerror = () => {
                                          console.warn("Fell back to raw image dataUrl due to loading restriction.");
                                          setItiForm({
                                            ...itiForm,
                                            mediaUrl: dataUrl,
                                            mediaType: 'image'
                                          });
                                        };
                                        image.src = dataUrl;
                                      };
                                      reader.onerror = () => {
                                        setItiFileError("Failed to load file.");
                                      };
                                      reader.readAsDataURL(file);
                                    } catch (e) {
                                      setItiFileError("Image file loading error.");
                                    }
                                  }
                                }
                              }}
                            />
                          </label>
                          
                          {itiForm.mediaUrl && (
                            <button
                              type="button"
                              onClick={() => setItiForm({ ...itiForm, mediaUrl: "", mediaType: "" })}
                              className="bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 px-3 py-2 rounded border border-red-500/20 text-[10px] font-mono uppercase"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        {itiFileError && (
                          <div className="text-[10px] text-red-400 font-mono bg-red-950/20 border border-red-900/30 p-2 rounded mt-1">
                            ⚠️ {itiFileError}
                          </div>
                        )}
                         {itiForm.mediaUrl && (
                          <div className="mt-1 text-slate-400 text-[10px] flex items-center justify-between bg-slate-950 p-2 rounded border border-slate-800">
                            <span className="truncate max-w-[200px]">
                              {itiForm.mediaUrl.startsWith("data:") ? "Uploaded local file successfully!" : itiForm.mediaUrl}
                            </span>
                            <select 
                              value={itiForm.mediaType}
                              onChange={(e) => setItiForm({ ...itiForm, mediaType: e.target.value as any })}
                              className="bg-slate-900 border border-slate-800 rounded p-1 text-[10px] text-amber-400 outline-none focus:border-amber-400"
                            >
                              <option value="">No Preview</option>
                              <option value="image">Format: Photo</option>
                              <option value="video">Format: Video</option>
                            </select>
                          </div>
                        )}

                        {itiForm.mediaUrl && (!itiForm.mediaType || itiForm.mediaType === "image") && (
                          <div className="mt-3 flex flex-col gap-2">
                            <div className="flex items-center justify-between bg-slate-900/50 p-2 rounded-lg border border-slate-850">
                              <span className="text-[10px] font-mono text-slate-450 uppercase font-semibold">Itinerary Crop Studio</span>
                              <button
                                type="button"
                                onClick={() => setShowItiStudio(!showItiStudio)}
                                className={`text-[9px] font-mono uppercase tracking-wider py-1 px-2.5 rounded border flex items-center gap-1 cursor-pointer transition-all ${
                                  showItiStudio 
                                    ? "bg-rose-500/10 border-rose-500/30 text-rose-450 hover:bg-rose-500 hover:text-white"
                                    : "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500 hover:text-slate-950 font-bold"
                                }`}
                              >
                                {showItiStudio ? "Close Studio [X]" : "🎨 Launch Photo Crop Studio"}
                              </button>
                            </div>

                            <AnimatePresence mode="wait">
                              {showItiStudio ? (
                                <motion.div 
                                  key="studio-iti"
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.3, ease: "easeInOut" }}
                                  className="overflow-hidden mt-2"
                                >
                                  <ImageEditor 
                                    initialImage={itiForm.mediaUrl}
                                    onSave={(newBase64) => {
                                      setItiForm({ ...itiForm, mediaUrl: newBase64, mediaType: 'image' });
                                      setShowItiStudio(false);
                                    }}
                                    onCancel={() => setShowItiStudio(false)}
                                  />
                                </motion.div>
                              ) : null}
                            </AnimatePresence>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingData}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-sans font-bold py-3 rounded-lg transition-colors cursor-pointer w-full text-center text-xs mt-2"
                    >
                      {submittingData ? "Saving..." : (itineraryToEdit ? "Update Tour Schedule" : "Add Tour Schedule")}
                    </button>
                  </form>
                </div>

              </div>


              {/* SECTION C: MANAGE MUSIC SINGLE STREAMING */}
              <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl">
                <div className="flex items-center gap-2 text-amber-400 mb-6 bg-slate-950 p-2.5 rounded-lg border border-slate-805 text-sm font-bold uppercase tracking-wider">
                  <Music className="w-5 h-5 text-amber-500" />
                  <span>Configure Dynamic Choral Track Player</span>
                </div>

                <form onSubmit={handleMusicSubmit} className="flex flex-col gap-5 text-xs">
                  {musicMessage && (
                    <div className={`p-3 rounded-lg text-xs font-mono text-center flex items-center justify-center gap-1.5 ${
                      musicMessage.includes("success") || musicMessage.includes("updated")
                        ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                        : "bg-red-500/10 border border-red-500/20 text-red-100"
                    }`}>
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{musicMessage}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Song Track Title</label>
                      <input 
                        type="text" required
                        value={musicForm.songTitle}
                        onChange={(e) => setMusicForm({ ...musicForm, songTitle: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white outline-none focus:border-amber-400"
                        placeholder="e.g. Umchukue Mwanao"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Artist Credits</label>
                      <input 
                        type="text" required
                        value={musicForm.artistName}
                        onChange={(e) => setMusicForm({ ...musicForm, artistName: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white outline-none focus:border-amber-400"
                        placeholder="e.g. Kachok Ambassadors Chorus"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Album / Collection</label>
                      <input 
                        type="text" required
                        value={musicForm.albumName}
                        onChange={(e) => setMusicForm({ ...musicForm, albumName: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white outline-none focus:border-amber-400"
                        placeholder="e.g. Sounds Of Togetherness"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Track Label / Edition</label>
                      <input 
                        type="text" required
                        value={musicForm.label}
                        onChange={(e) => setMusicForm({ ...musicForm, label: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white outline-none focus:border-amber-400"
                        placeholder="e.g. Live At Central"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Highlight Quote / Lyric Snippet</label>
                      <input 
                        type="text" required
                        value={musicForm.quoteText}
                        onChange={(e) => setMusicForm({ ...musicForm, quoteText: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white outline-none focus:border-amber-400"
                        placeholder="e.g. Let our voices unite, lifting the sound..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Full Song Lyrics</label>
                    <textarea 
                      rows={5}
                      value={musicForm.lyrics}
                      onChange={(e) => setMusicForm({ ...musicForm, lyrics: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white outline-none focus:border-amber-400 font-sans text-xs"
                      placeholder="Paste the gospel lyrics of this choral track here..."
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Left side: Standard Inputs */}
                    <div className="flex flex-col gap-4">
                      <div>
                        <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Album Cover & Vinyl Center Image URL (blank for fallback)</label>
                        <input 
                          type="text"
                          value={musicForm.coverUrl}
                          onChange={(e) => setMusicForm({ ...musicForm, coverUrl: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white outline-none focus:border-amber-400 font-mono"
                          placeholder="Paste image link, e.g. https://domain.com/picture.jpg"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">
                          Audio Stream Source Link (or Generated Base64 Snippet below)
                        </label>
                        <textarea 
                          rows={3}
                          value={musicForm.audioUrl}
                          onChange={(e) => setMusicForm({ ...musicForm, audioUrl: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white outline-none focus:border-amber-400 font-mono text-[10px] resize-none whitespace-pre-wrap break-all"
                          placeholder="Auto-filled with 25s snippet once trimmed, or input custom MP3 link manually"
                        />
                        {musicForm.audioUrl && musicForm.audioUrl.startsWith("data:") && (
                          <div className="text-[9px] text-emerald-400 font-mono mt-1 flex items-center justify-between">
                            <span>✓ Beautiful 25-second snippet loaded!</span>
                            <button 
                              type="button" 
                              onClick={() => setMusicForm({ ...musicForm, audioUrl: "" })}
                              className="text-red-400 hover:underline"
                            >
                              Clear Snippet
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right side: Trimmer Component */}
                    <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-bold">✂ 25s Snippet Trimmer Tool</span>
                          <span className="text-[9px] text-slate-500 font-mono">Generates lightweight Mono WAV</span>
                        </div>
                        
                        <p className="text-[10px] text-slate-400 font-sans mb-3 leading-relaxed">
                          Select any local audio file. You will be able to slide through the timeline to choose your favorite 25-second portion to play and test, then crop and attach it to your track.
                        </p>

                        <div className="flex flex-col gap-3">
                          <label className="w-full bg-slate-900 border border-slate-800 hover:bg-slate-800 py-2.5 px-3 rounded-lg cursor-pointer text-center transition-all flex items-center justify-center gap-2 font-mono text-[10px] uppercase font-bold text-amber-500 hover:border-amber-500/30">
                            <Plus className="w-4 h-4 text-amber-400 shrink-0" />
                            <span>{audioFile ? `Loaded: ${audioFile.name}` : "Select Full Track Audio File"}</span>
                            <input 
                              type="file"
                              accept="audio/*"
                              className="hidden"
                              onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
                              onChange={handleAudioFileChange}
                            />
                          </label>

                          {isTrimming && (
                            <div className="text-[10px] text-amber-400 font-mono animate-pulse text-center bg-slate-900 border border-slate-800/60 p-2 rounded">
                              Processing/Encoding snippet... Please wait...
                            </div>
                          )}

                          {trimError && (
                            <div className="text-[10px] text-red-400 font-mono text-center bg-red-500/5 border border-red-500/10 p-2 rounded">
                              {trimError}
                            </div>
                          )}

                          {audioBuffer && (
                            <div className="flex flex-col gap-3 bg-slate-900/60 p-3 rounded-lg border border-slate-850">
                              <div className="flex justify-between items-center text-[10px] font-mono text-slate-300">
                                <span>Track Duration: {Math.floor(audioDuration)}s</span>
                                <span className="font-bold text-amber-400">
                                  Snippet Start: {Math.floor(trimStart)}s
                                </span>
                              </div>

                              {/* Sliding bar trimmer */}
                              <input 
                                type="range"
                                min={0}
                                max={Math.max(0, audioDuration - 25)}
                                value={trimStart}
                                onChange={(e) => {
                                  setTrimStart(Number(e.target.value));
                                  stopPreview();
                                }}
                                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                              />

                              <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono">
                                <span>0s</span>
                                <span className="bg-amber-500/15 text-amber-500 px-2 py-0.5 rounded border border-amber-500/20 font-bold uppercase tracking-wide">
                                  Will crop: {Math.floor(trimStart)}s - {Math.floor(Math.min(audioDuration, trimStart + 25))}s
                                </span>
                                <span>{Math.floor(audioDuration - 25)}s</span>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={handlePlayPreview}
                                  className="flex-1 bg-slate-800 hover:bg-slate-750 text-white font-mono text-[10px] py-2 px-2.5 rounded-lg border border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                >
                                  {previewing ? (
                                    <>
                                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                                      Stop Preview
                                    </>
                                  ) : (
                                    <>
                                      <span>▶</span> Play Snippet
                                    </>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={handleCropAndEncode}
                                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-[10px] py-1.5 px-2.5 rounded-lg font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow"
                                >
                                  <span>✂</span> Apply Crop
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={musicSaving}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-sans font-bold py-3 rounded-lg transition-colors cursor-pointer w-full text-center text-xs"
                  >
                    {musicSaving ? "Saving Settings..." : "Save Track & Player Metadata"}
                  </button>
                </form>
              </div>

              {/* SECTION: MPESA BILLING CONFIGURATIONS */}
              <div id="admin-mpesa-config" className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl mb-8">
                <div className="flex items-center gap-2 text-amber-400 mb-4 bg-slate-950 p-2.5 rounded-lg border border-slate-805 text-sm font-bold uppercase tracking-wider">
                  <CreditCard className="w-5 h-5 text-amber-500" />
                  <span>M-Pesa Contribution Till Settings</span>
                </div>

                {mpesaMessage && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-lg text-xs font-mono mb-4">
                    ✓ {mpesaMessage}
                  </div>
                )}
                {mpesaError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs font-mono mb-4">
                    ⚠ {mpesaError}
                  </div>
                )}

                <form onSubmit={handleSaveMpesa} className="flex flex-col gap-4 text-xs font-sans">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 col-gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Till or Paybill Type</label>
                      <select
                        value={mpesaType}
                        onChange={(e) => setMpesaType(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded p-2 outline-none font-mono text-[11px] text-white"
                      >
                        <option value="buy_goods">Buy Goods (Till Number)</option>
                        <option value="paybill">Paybill</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">M-Pesa Till/Paybill Number</label>
                      <input
                        type="text"
                        required
                        value={mpesaTill}
                        onChange={(e) => setMpesaTill(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded p-2 outline-none font-mono text-[11px] text-white"
                        placeholder="e.g. 4119041"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Merchant / Account Name</label>
                    <input
                      type="text"
                      required
                      value={mpesaName}
                      onChange={(e) => setMpesaName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded p-2 outline-none font-mono text-[11px] text-white"
                      placeholder="e.g. Kachok Ambassadors Chorus"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Till Poster Image / Media (Optional)</label>
                    <p className="text-[10px] text-slate-500 mb-1.5 font-sans">
                      Upload an official Poster or QR code sticker image for your Till Number. It will be shown to users as a media preview.
                    </p>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={mpesaImage}
                          onChange={(e) => setMpesaImage(e.target.value)}
                          className="flex-1 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded p-2 outline-none font-mono text-[11px] text-white"
                          placeholder="Paste image URL or upload below..."
                        />
                        {mpesaImage && (
                          <button
                            type="button"
                            onClick={() => setMpesaImage("")}
                            className="bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 p-2 rounded border border-red-500/20 text-[10px] transition-colors"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="flex-1 bg-slate-800 border border-slate-700 p-2 rounded cursor-pointer text-center hover:bg-slate-750 transition-colors flex items-center justify-center gap-2 font-mono text-[10px] uppercase font-bold text-slate-350">
                          <span>📁</span> Upload Till Poster Image
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  const dataUrl = event.target?.result as string;
                                  setMpesaImage(dataUrl);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {mpesaImage && (
                    <div className="mt-2 text-center">
                      <p className="text-[10px] font-mono text-slate-500 mb-1">Poster Preview:</p>
                      <img src={mpesaImage} alt="Till Poster Preview" className="max-h-48 mx-auto rounded border border-slate-800 object-contain bg-slate-900 p-1" />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={mpesaSaving}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-sans font-bold py-3 rounded-lg transition-colors cursor-pointer w-full text-center text-xs mt-2"
                  >
                    {mpesaSaving ? "Saving Config..." : "Save M-Pesa Till Configuration"}
                  </button>
                </form>
              </div>

              {/* SECTION: MANAGE LEADERS / COUNCIL STEWARDS */}
              <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl">
                <div className="flex items-center gap-2 text-amber-400 mb-4 bg-slate-950 p-2.5 rounded-lg border border-slate-805 text-sm font-bold uppercase tracking-wider">
                  <Users className="w-5 h-5 text-amber-500" />
                  <span>{leaderToEdit ? "Edit Leader Steward" : "Add Leader Steward"}</span>
                </div>

                {ldrError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs font-mono mb-4 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{ldrError}</span>
                  </div>
                )}

                <form onSubmit={handleLdrSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Name</label>
                    <input 
                      type="text" required
                      value={ldrForm.name}
                      onChange={(e) => setLdrForm({ ...ldrForm, name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white outline-none focus:border-amber-400"
                      placeholder="e.g. Director Brighton"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Position / Role</label>
                    <input 
                      type="text" required
                      value={ldrForm.role}
                      onChange={(e) => setLdrForm({ ...ldrForm, role: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white outline-none focus:border-amber-400"
                      placeholder="e.g. Choir Director & Trainer"
                    />
                  </div>

                  <div className="md:col-span-2 bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="block text-[11px] font-mono text-slate-300 uppercase tracking-wider font-bold">Steward Profile Photo</span>
                        <span className="text-[10px] text-slate-500 font-sans">Crop and enhance your photo before enlisting</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowLdrStudio(!showLdrStudio)}
                        className={`text-[10px] font-mono uppercase tracking-wider py-1.5 px-3 rounded-lg border flex items-center gap-1.5 cursor-pointer transition-all ${
                          showLdrStudio 
                            ? "bg-rose-500/10 border-rose-500/30 text-rose-450 hover:bg-rose-500 hover:text-white"
                            : "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500 hover:text-slate-950 font-bold"
                        }`}
                      >
                        {showLdrStudio ? "Close Studio [X]" : "🎨 Launch Photo Crop Studio"}
                      </button>
                    </div>

                    <AnimatePresence mode="wait">
                      {showLdrStudio ? (
                        <motion.div 
                          key="studio"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden mt-2"
                        >
                          <ImageEditor 
                            initialImage={ldrForm.image}
                            onSave={(newBase64) => {
                              setLdrForm({ ...ldrForm, image: newBase64 });
                              setShowLdrStudio(false);
                            }}
                            onCancel={() => setShowLdrStudio(false)}
                          />
                        </motion.div>
                      ) : (
                        <motion.div 
                          key="thumbnail"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center gap-4 bg-slate-900/60 p-3 rounded-lg border border-slate-800/40"
                        >
                          <div className="relative w-16 h-16 rounded-full overflow-hidden bg-slate-950 border border-slate-800 shrink-0">
                            {ldrForm.image ? (
                              <img 
                                src={ldrForm.image} 
                                alt="Current Leader Thumbnail" 
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-600 bg-slate-950 font-mono">
                                No image
                              </div>
                            )}
                          </div>
                          <div className="flex-1 space-y-1">
                            {ldrForm.image ? (
                              <>
                                <div className="flex items-center gap-1.5 text-slate-200 font-sans text-xs font-bold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  <span>Status: Custom Photo Active</span>
                                </div>
                                <p className="text-[10px] text-slate-500 font-mono max-w-sm truncate">
                                  {ldrForm.image.startsWith("data:") ? "Base64 Embedded Image Stream" : ldrForm.image}
                                </p>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center gap-1.5 text-slate-400 font-sans text-xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                  <span>Status: Default Silhouette Active</span>
                                </div>
                                <p className="text-[10px] text-slate-500 font-sans leading-relaxed">
                                  Please click "Launch Photo Crop Studio" above to load and crop an image.
                                </p>
                              </>
                            )}
                          </div>
                          {ldrForm.image && (
                            <button
                              type="button"
                              onClick={() => setLdrForm({ ...ldrForm, image: "" })}
                              className="p-1.5 rounded bg-slate-800 hover:bg-red-500/20 text-slate-500 hover:text-red-400 border border-slate-750 hover:border-red-500/10 cursor-pointer transition-all"
                              title="Remove Photo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Collapsible toggle for advanced manual URL entry if needed */}
                    <details className="text-[11px] group text-slate-500">
                      <summary className="cursor-pointer font-mono text-[9px] uppercase tracking-widest hover:text-slate-350 select-none pb-1 mt-1">
                        Advanced: Enter Photo URL Manually
                      </summary>
                      <div className="pt-2">
                        <input 
                          type="text"
                          value={ldrForm.image}
                          onChange={(e) => setLdrForm({ ...ldrForm, image: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white outline-none focus:border-amber-400 text-xs"
                          placeholder="e.g. https://images.unsplash.com/... or base64 data"
                        />
                      </div>
                    </details>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Phone / Booking Contacts</label>
                    <input 
                      type="text"
                      value={ldrForm.phone}
                      onChange={(e) => setLdrForm({ ...ldrForm, phone: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white outline-none focus:border-amber-400"
                      placeholder="e.g. +254 712 345 678"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Brief Bio Quote</label>
                    <input 
                      type="text"
                      value={ldrForm.bio}
                      onChange={(e) => setLdrForm({ ...ldrForm, bio: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white outline-none focus:border-amber-400"
                      placeholder="e.g. Serving acappella ministries since 2018..."
                    />
                  </div>

                  <div className="md:col-span-2 mt-2">
                    <button
                      type="submit"
                      disabled={ldrSaving}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-sans font-bold py-3 rounded-lg transition-colors cursor-pointer w-full text-center text-xs"
                    >
                      {ldrSaving ? "Saving Steward..." : leaderToEdit ? "Update Leadership Record" : "Enlist Council Steward"}
                    </button>
                  </div>
                </form>
              </div>


              {/* SECTION B: VIEW CONTACT SUBMISSIONS */}
              <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl">
                <div className="flex items-center gap-2 text-amber-400 mb-6 bg-slate-950 p-2.5 rounded-lg border border-slate-805 text-sm font-bold uppercase tracking-wider">
                  <Mail className="w-5 h-5 text-amber-500" />
                  <span>Received Guest inquiries ({inquiries.length})</span>
                </div>

                {inquiries.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-slate-400 text-xs font-mono">No contact submissions saved in data/db.json yet.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {inquiries.map((inq) => (
                      <div 
                        key={inq.id}
                        className={`border rounded-xl p-4 sm:p-5 text-xs font-sans transition-all bg-slate-950/80 shadow ${
                          inq.status === "Unread" ? "border-amber-500/40 bg-slate-950" : "border-slate-800 bg-slate-900/50"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-2 border-b border-slate-850 pb-3 mb-3">
                          <div>
                            <span className="font-bold text-slate-200 text-sm">{inq.name}</span>
                            <span className="text-slate-400 font-mono block sm:inline sm:ml-2">({inq.email})</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-slate-500">
                              {new Date(inq.date).toLocaleString()}
                            </span>
                            {inq.status === "Unread" ? (
                              <button
                                onClick={() => onUpdateInquiryStatus(inq.id, "Read")}
                                className="bg-emerald-500/10 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 p-1 rounded-md border border-emerald-500/10 cursor-pointer text-[10px] font-mono uppercase tracking-wide px-2 flex items-center gap-1 transition-all"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Mark Read</span>
                              </button>
                            ) : (
                              <span className="text-[10px] uppercase font-mono bg-slate-800 text-slate-400 px-2.5 py-0.5 rounded">Reviewed</span>
                            )}
                            
                            <button
                              onClick={() => onDeleteInquiry(inq.id)}
                              className="text-red-400 border border-red-500/10 bg-red-500/5 hover:bg-red-500 hover:text-white p-1 rounded transition-colors cursor-pointer"
                              title="Delete Submission"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="text-slate-300">
                          <p className="font-semibold text-amber-200 uppercase tracking-wide text-[10px] font-mono">Subject: {inq.subject}</p>
                          <blockquote className="mt-2 text-slate-350 leading-relaxed italic bg-slate-900 p-3 rounded border-l border-slate-700 whitespace-pre-wrap">
                            "{inq.message}"
                          </blockquote>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION C: CHANGE ADMIN PASSCODE */}
              <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl mb-8">
                <div className="flex items-center gap-2 text-amber-400 mb-6 bg-slate-950 p-2.5 rounded-lg border border-slate-805 text-sm font-bold uppercase tracking-wider">
                  <Lock className="w-5 h-5 text-amber-500" />
                  <span>Update Admin Passcode</span>
                </div>
                
                <form onSubmit={handleResetSubmit} className="flex flex-col gap-4 text-xs">
                  {resetErrorMsg && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs font-mono text-center flex items-center justify-center gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{resetErrorMsg}</span>
                    </div>
                  )}
                  {resetMessage && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-xs font-mono text-center flex items-center justify-center gap-1.5">
                      <Check className="w-4 h-4 shrink-0" />
                      <span>{resetMessage}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Current Passcode</label>
                      <input 
                        type="password"
                        required
                        value={resetCurrentPasscode}
                        onChange={(e) => setResetCurrentPasscode(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-white outline-none focus:border-amber-400 font-mono tracking-widest"
                        placeholder="Current secret key..."
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">New Passcode</label>
                      <input 
                        type="password"
                        required
                        value={resetNewPasscode}
                        onChange={(e) => setResetNewPasscode(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-white outline-none focus:border-emerald-400 font-mono tracking-widest"
                        placeholder="At least 4 characters..."
                        minLength={4}
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-sans font-bold py-3 rounded-lg transition-colors cursor-pointer w-full text-center text-xs mt-2 border border-slate-700"
                  >
                    {authLoading ? "Updating..." : "Save New Admin Passcode"}
                  </button>
                </form>
              </div>

            </div>

          </div>
        )}

      </motion.div>
    </motion.div>
  );
}

function bufferToWavMono(buffer: AudioBuffer, startOffsetSec: number, durationSec: number = 25): Blob {
  const targetSampleRate = 11025;
  const numChannels = 1;
  const sampleRateRatio = buffer.sampleRate / targetSampleRate;
  
  const startSample = Math.floor(startOffsetSec * buffer.sampleRate);
  const maxSrcSamples = Math.floor(durationSec * buffer.sampleRate);
  const endSample = Math.min(buffer.length, startSample + maxSrcSamples);
  const srcSamples = endSample - startSample;
  
  // Calculate Target Samples based on ratio
  const numSamples = Math.floor(srcSamples / sampleRateRatio);
  
  const srcChannelData = buffer.getChannelData(0).subarray(startSample, endSample);
  
  const bytesPerSample = 2; // 16-bit PCM
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = targetSampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;
  
  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);
  
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, totalSize - 8, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, targetSampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);
  
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const srcIndex = Math.floor(i * sampleRateRatio);
    let sample = srcChannelData[srcIndex] || 0;
    sample = Math.max(-1, Math.min(1, sample));
    const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    view.setInt16(offset, intSample, true);
    offset += 2;
  }
  
  return new Blob([arrayBuffer], { type: 'audio/wav' });
}
