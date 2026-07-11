import React, { useState, useEffect } from "react";
import { auth } from "../lib/firebase";
import { UserPlus, X, Lock, Eye, Check, ShieldCheck, Mail, Calendar, AlertCircle, Trash2, Plus, EyeOff, Music, Users, CreditCard, Smartphone, CheckCircle, Send, Barcode, Copy, RefreshCw, Key, HelpCircle, Sliders, ChevronUp, ChevronDown, DollarSign, MessageSquare as MessageSquareIcon, Layout, UploadCloud, Film, FileText, CloudLightning, ShieldAlert } from "lucide-react";
import { Inquiry, Activity, ItineraryItem, MusicData, Leader, Subscriber, Broadcast, MemberSpotlight as MemberSpotlightType } from "../types";
import ImageEditor from "./ImageEditor";
import { motion, AnimatePresence } from "motion/react";
import { uploadMedia } from "../lib/mediaUpload";

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, password?: string) => Promise<boolean>;
  onGoogleLoginAdmin: () => Promise<boolean>;
  onResetPassword: (email: string) => Promise<boolean>;
  onLogout: () => void;
  isAuthenticated: boolean;
  adminError?: string | null;
  adminToken?: string | null;
  authLoading?: boolean;
  googleAccessToken?: string | null;
  onGoogleLogin?: () => void;
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

  itinerary: ItineraryItem[];

  // Real data lists for broadcasts, newsletters, spotlights
  subscribers: Subscriber[];
  broadcasts: Broadcast[];
  memberSpotlights: MemberSpotlightType[];
  onRefresh: () => void;
  scrollToSection?: string | null;
}

interface AdvancedMediaDropzoneProps {
  label: string;
  value: string;
  mediaType: "image" | "video" | "dual" | "";
  error: string;
  onClear: () => void;
  onFileSelect: (dataUrl: string, type: "image" | "video", fileName: string, size: number) => void;
  onError: (msg: string) => void;
  acceptedTypes?: string;
}

function AdvancedMediaDropzone({
  label,
  value,
  mediaType,
  error,
  onClear,
  onFileSelect,
  onError,
  acceptedTypes = "image/*,video/*"
}: AdvancedMediaDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const processFile = (file: File) => {
    onError("");
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      onError("File too large. Maximum size is 100MB.");
      return;
    }

    const type = file.type.startsWith("video") ? "video" : "image";
    
    setUploadProgress(10);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null) {
          clearInterval(interval);
          return null;
        }
        if (prev >= 90) {
          clearInterval(interval);
          return prev;
        }
        return prev + 15;
      });
    }, 100);

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) {
         onError("Failed to read file.");
         setUploadProgress(null);
         clearInterval(interval);
         return;
      }
      
      if (type === "image") {
        const image = document.createElement("img");
        image.onload = () => {
          try {
            const canvas = document.createElement("canvas");
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
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              setUploadProgress(100);
              setTimeout(() => {
                onFileSelect(dataUrl, "image", file.name, file.size);
                setUploadProgress(null);
              }, 200);
              return;
            }
            ctx.drawImage(image, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.95);
            setUploadProgress(100);
            setTimeout(() => {
              onFileSelect(compressedDataUrl, "image", file.name, file.size);
              setUploadProgress(null);
            }, 200);
          } catch (err) {
            setUploadProgress(100);
            setTimeout(() => {
              onFileSelect(dataUrl, "image", file.name, file.size);
              setUploadProgress(null);
            }, 200);
          }
        };
        image.onerror = () => {
          setUploadProgress(100);
          setTimeout(() => {
            onFileSelect(dataUrl, "image", file.name, file.size);
            setUploadProgress(null);
          }, 200);
        };
        image.src = dataUrl;
      } else {
        setUploadProgress(100);
        setTimeout(() => {
          onFileSelect(dataUrl, "video", file.name, file.size);
          setUploadProgress(null);
        }, 200);
      }
    };
    reader.onerror = () => {
      onError("Failed to load file.");
      setUploadProgress(null);
      clearInterval(interval);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const isLocalBase64 = value && value.startsWith("data:");
  const isVideo = mediaType === "video" || (value && (value.includes("video") || value.match(/\.(mp4|webm|mov)$/i)));

  return (
    <div className="space-y-2">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all flex flex-col items-center justify-center min-h-[140px] cursor-pointer ${
          isDragActive
            ? "border-amber-400 bg-amber-500/10 scale-[1.01]"
            : value
            ? "border-emerald-500/30 bg-slate-900/40"
            : "border-slate-850 bg-slate-950/60 hover:border-slate-800 hover:bg-slate-950/80"
        }`}
      >
        <input
          type="file"
          accept={acceptedTypes}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          title=""
        />

        {uploadProgress !== null ? (
          <div className="w-full max-w-[200px] flex flex-col items-center gap-2">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">Processing file...</span>
            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-amber-500 to-amber-600 h-full transition-all duration-150"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <span className="text-[9px] font-mono text-amber-400">{uploadProgress}%</span>
          </div>
        ) : value ? (
          <div className="flex flex-col items-center gap-3 w-full relative z-10" onClick={(e) => e.stopPropagation()}>
            {isVideo ? (
              <div className="w-16 h-16 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                <Film className="w-8 h-8 text-blue-400" />
              </div>
            ) : (
              <div className="relative group/thumb">
                <img
                  src={value}
                  alt="Thumbnail"
                  className="w-20 h-20 rounded-xl object-cover border border-slate-700 shadow-md p-0.5 bg-slate-800"
                />
                <div className="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                  <Check className="w-6 h-6 text-emerald-400 font-bold" />
                </div>
              </div>
            )}
            
            <div className="text-center">
              <span className="inline-flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/20 px-2.5 py-0.5 rounded text-[9px] font-mono uppercase font-black text-emerald-400 tracking-wider">
                <Check className="w-3 h-3 stroke-[3]" /> Encoded Successfully
              </span>
              <p className="text-[10px] font-mono text-slate-400 mt-1 truncate max-w-[240px] mx-auto">
                {isLocalBase64 ? "Buffered Local Memory" : value}
              </p>
            </div>

            <button
              type="button"
              onClick={onClear}
              className="px-3 py-1 bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/20 rounded-lg text-[9px] font-mono text-red-400 uppercase tracking-wider transition-all"
            >
              Remove File
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 pointer-events-none">
            <div className="p-3 bg-slate-900 rounded-full border border-slate-850 text-slate-400">
              <UploadCloud className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <span className="text-[11px] font-sans font-bold text-slate-350">
                Drag & Drop or <span className="text-amber-400">Browse</span>
              </span>
              <p className="text-[9px] font-mono text-slate-500 mt-1 uppercase tracking-widest leading-none">
                Supports image or video clips
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="text-[10px] text-red-400 font-mono bg-red-950/20 border border-red-900/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

function AddAdminSection({ userEmail }: { userEmail?: string | null }) {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  if (userEmail !== "allangeorge566@gmail.com") {
    return null;
  }

  const handleAdd = async () => {
    if (!email) return;
    setLoading(true);
    setMsg('');
    setErr('');
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('../lib/firebase');
      await setDoc(doc(db, 'admins', email.trim()), {
        email: email.trim(),
        role: 'admin',
        createdAt: new Date().toISOString()
      }, { merge: true });
      setMsg('Admin added successfully!');
      setEmail('');
    } catch (e: any) {
      setErr('Failed to add admin: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl mb-8">
      <div className="flex items-center gap-2 text-amber-400 mb-6 bg-slate-950 p-2.5 rounded-lg border border-slate-805 text-sm font-bold uppercase tracking-wider">
        <UserPlus className="w-5 h-5 text-amber-500" />
        <span>Admin Management (Super Admin Only)</span>
      </div>
      <div className="text-xs text-slate-400 mb-4">
        Add another administrator by entering their email address. They will be able to log in using Google Sign-In with that email.
      </div>
      
      {msg && <div className="text-emerald-400 text-xs mb-3 font-mono">{msg}</div>}
      {err && <div className="text-red-400 text-xs mb-3 font-mono">{err}</div>}

      <div className="flex items-center gap-3">
        <input 
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="flex-1 bg-slate-900 border border-slate-800 rounded p-2.5 text-white outline-none focus:border-amber-400 font-sans"
          placeholder="e.g. co-admin@example.com"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={loading}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 px-4 rounded-lg transition-colors cursor-pointer text-xs uppercase disabled:opacity-50"
        >
          {loading ? 'Adding...' : 'Add Admin'}
        </button>
      </div>
    </div>
  );
}

export default function AdminPanel({
  isOpen,
  onClose,
  onLogin,
  onGoogleLoginAdmin,
  onResetPassword,
  onLogout,
  isAuthenticated,
  adminError,
  googleAccessToken = null,
  onGoogleLogin = () => {},
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
  onClearEdits,
  itinerary,
  subscribers,
  broadcasts,
  memberSpotlights,
  onRefresh,
  authLoading: externalAuthLoading,
  adminToken,
  scrollToSection
}: AdminPanelProps) {
  
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [localAuthLoading, setLocalAuthLoading] = useState(false);
  const [submittingData, setSubmittingData] = useState(false);

  const authLoading = externalAuthLoading || localAuthLoading;

  // GitHub Webhook Guide Modal states
  const [isGitWebhookModalOpen, setIsGitWebhookModalOpen] = useState(false);
  const [gitActiveStep, setGitActiveStep] = useState(1);
  const [gitWebhookSecret, setGitWebhookSecret] = useState("KachambaSync_Secret2026");
  const [isSecretCopied, setIsSecretCopied] = useState(false);
  const [isPayloadCopied, setIsPayloadCopied] = useState(false);

  // Cloudinary Diagnostic states
  const [isCloudinaryDiagOpen, setIsCloudinaryDiagOpen] = useState(false);
  const [cloudinaryDiagStatus, setCloudinaryDiagStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [cloudinaryDiagReport, setCloudinaryDiagReport] = useState<any>(null);
  const [cloudinaryDiagError, setCloudinaryDiagError] = useState<string | null>(null);

  const handleRunCloudinaryDiagnostics = async () => {
    setCloudinaryDiagStatus('testing');
    setCloudinaryDiagError(null);
    setCloudinaryDiagReport(null);
    
    try {
      const res = await fetch("/api/cloudinary-diagnostic", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": adminToken || ""
        }
      });
      
      if (!res.ok) {
        throw new Error(`Server returned status code ${res.status}`);
      }
      
      const data = await res.json();
      if (data.success) {
        setCloudinaryDiagStatus('success');
        setCloudinaryDiagReport(data.diagnostics);
      } else {
        setCloudinaryDiagStatus('failed');
        setCloudinaryDiagError(data.error || "Unknown diagnostic error");
        setCloudinaryDiagReport(data.diagnostics || null);
      }
    } catch (err: any) {
      setCloudinaryDiagStatus('failed');
      setCloudinaryDiagError(err.message || "Network request failed");
    }
  };

  // Reset UI states
  const [showResetUI, setShowResetUI] = useState(false);
  const [resetRecoveryKey, setResetRecoveryKey] = useState("");
  const [resetNewPasscode, setResetNewPasscode] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetErrorMsg, setResetErrorMsg] = useState("");
  const [resetCurrentPasscode, setResetCurrentPasscode] = useState("");
  const [isPasscodeVisible, setIsPasscodeVisible] = useState(false);
  const [resetMethod, setResetMethod] = useState<'recovery' | 'current'>('current');
  
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail) {
      setResetErrorMsg("Please enter your email to reset the password.");
      return;
    }
    setLocalAuthLoading(true);
    setResetErrorMsg("");
    setResetMessage("");
    
    const success = await onResetPassword(adminEmail);
    if (success) {
      setResetMessage("Password reset email sent. Please check your inbox.");
      setTimeout(() => {
        setShowResetUI(false);
        setResetMessage("");
      }, 4000);
    } else {
      setResetErrorMsg("Failed to send reset email.");
    }
    setLocalAuthLoading(false);
  };

  // M-Pesa Config states
  const [mpesaTill, setMpesaTill] = useState("4119041");
  const [mpesaName, setMpesaName] = useState("Kachamba Chorus");
  const [mpesaImage, setMpesaImage] = useState("");
  const [mpesaType, setMpesaType] = useState("buy_goods");
  const [mpesaReceiptTitle, setMpesaReceiptTitle] = useState("");
  const [mpesaReceiptLogo, setMpesaReceiptLogo] = useState("");
  const [mpesaReceiptExtraLogo, setMpesaReceiptExtraLogo] = useState("");
  const [mpesaReceiptMessage, setMpesaReceiptMessage] = useState("");
  const [mpesaReceiptLayout, setMpesaReceiptLayout] = useState("modern");
  const [mpesaReceiptHeaderSize, setMpesaReceiptHeaderSize] = useState("text-xl");
  const [mpesaReceiptHeaderColor, setMpesaReceiptHeaderColor] = useState("text-slate-800");
  const [mpesaReceiptBodySize, setMpesaReceiptBodySize] = useState("text-sm");
  const [mpesaReceiptBodyColor, setMpesaReceiptBodyColor] = useState("text-slate-500");
  const [mpesaReceiptTextAlign, setMpesaReceiptTextAlign] = useState("text-center");
  const [mpesaReceiptFontFamily, setMpesaReceiptFontFamily] = useState("font-sans");
  const [mpesaReceiptOrder, setMpesaReceiptOrder] = useState<string[]>(["successIcon", "header", "amount", "message", "details", "barcode"]);
  const [mpesaSaving, setMpesaSaving] = useState(false);
  const [mpesaMessage, setMpesaMessage] = useState("");
  const [mpesaError, setMpesaError] = useState("");

  // Saved M-Pesa receipts state
  const [mpesaReceipts, setMpesaReceipts] = useState<any[]>([]);
  const [loadingReceipts, setLoadingReceipts] = useState(false);

  const dragItem = React.useRef<any>(null);
  const dragOverItem = React.useRef<any>(null);

  const handleSort = () => {
    let orderCopy = [...mpesaReceiptOrder];
    const draggedItemContent = orderCopy.splice(dragItem.current, 1)[0];
    orderCopy.splice(dragOverItem.current, 0, draggedItemContent);
    dragItem.current = null;
    dragOverItem.current = null;
    setMpesaReceiptOrder(orderCopy);
  };

  const fetchMpesaReceiptsList = async () => {
    setLoadingReceipts(true);
    try {
      const res = await fetch("/api/mpesa/receipts");
      if (res.ok) {
        const data = await res.json();
        setMpesaReceipts(data.receipts || []);
      }
    } catch (err) {
      console.error("Failed to load mpesa receipts", err);
    } finally {
      setLoadingReceipts(false);
    }
  };

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      const fetchMpesaConfig = async () => {
        try {
          const res = await fetch("/api/mpesa/config");
          if (res.ok) {
            const data = await res.json();
            setMpesaTill(data.tillNumber || "4119041");
            setMpesaName(data.tillName || "Kachamba Chorus");
            setMpesaImage(data.tillImage || "");
            setMpesaType(data.tillType || "buy_goods");
            setMpesaReceiptTitle(data.receiptTitle || "");
            setMpesaReceiptLogo(data.receiptLogo || "https://www.image2url.com/r2/default/images/1781098447744-9bfd4cd8-4c62-4a1a-b218-7ccd6f1b36d2.png");
            setMpesaReceiptExtraLogo(data.receiptExtraLogo || "");
            setMpesaReceiptMessage(data.receiptMessage || "We have received your generous gift. May God bless you abundantly.");
            setMpesaReceiptLayout(data.receiptLayout || "modern");
            setMpesaReceiptHeaderSize(data.receiptHeaderSize || "text-xl");
            setMpesaReceiptHeaderColor(data.receiptHeaderColor || "text-slate-800");
            setMpesaReceiptBodySize(data.receiptBodySize || "text-sm");
            setMpesaReceiptBodyColor(data.receiptBodyColor || "text-slate-500");
            setMpesaReceiptTextAlign(data.receiptTextAlign || "text-center");
            setMpesaReceiptFontFamily(data.receiptFontFamily || "font-sans");
            
            if (data.receiptOrder) {
              try {
                setMpesaReceiptOrder(JSON.parse(data.receiptOrder));
              } catch (e) {
                console.error("Failed to parse receipt order", e);
              }
            }
          }
        } catch (err) {
          console.error("Failed to load mpesa config", err);
        }
      };

      fetchMpesaConfig();
      fetchMpesaReceiptsList();
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
          "x-admin-passcode": adminToken || ""
        },
        body: JSON.stringify({
          tillNumber: mpesaTill,
          tillName: mpesaName,
          tillImage: mpesaImage,
          tillType: mpesaType,
          receiptTitle: mpesaReceiptTitle,
          receiptLogo: mpesaReceiptLogo,
          receiptExtraLogo: mpesaReceiptExtraLogo,
          receiptMessage: mpesaReceiptMessage,
          receiptLayout: mpesaReceiptLayout,
          receiptHeaderSize: mpesaReceiptHeaderSize,
          receiptHeaderColor: mpesaReceiptHeaderColor,
          receiptBodySize: mpesaReceiptBodySize,
          receiptBodyColor: mpesaReceiptBodyColor,
          receiptTextAlign: mpesaReceiptTextAlign,
          receiptFontFamily: mpesaReceiptFontFamily,
          receiptOrder: JSON.stringify(mpesaReceiptOrder)
        })
      });
      let data: any = {};
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : {};
      } catch (jsonErr) {
        data = { error: `Server returned an invalid response (Status ${res.status}).` };
      }
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
    sendBroadcast: boolean;
  }>({
    event: "",
    date: "",
    time: "",
    location: "",
    host: "",
    status: "Confirmed",
    notes: "",
    mediaUrl: "",
    mediaType: "",
    sendBroadcast: true
  });

  const [itiFileError, setItiFileError] = useState("");

  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(false);
  const [workspaceStatus, setWorkspaceStatus] = useState<{ type: 'info' | 'success' | 'error'; msg: string }>({ type: 'info', msg: '' });

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

  // Manual Choral Broadcast notification states
  const [broadForm, setBroadForm] = useState({ subject: "", body: "" });
  const [broadSaving, setBroadSaving] = useState(false);
  const [broadMsg, setBroadMsg] = useState("");
  const [broadErr, setBroadErr] = useState("");

  // Member Spotlight highlights states
  const [spotForm, setSpotForm] = useState({ memberName: "", roleOrVoicePart: "", quoteOrHighlight: "", image: "" });
  const [spotSaving, setSpotSaving] = useState(false);
  const [spotMsg, setSpotMsg] = useState("");
  const [spotErr, setSpotErr] = useState("");
  const [spotFileError, setSpotFileError] = useState("");
  const [showSpotStudio, setShowSpotStudio] = useState(false);

  // Print Preview Arranger Studio States
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [printHeaderText, setPrintHeaderText] = useState("KACHAMBA CHORUS TOUR ITINERARY");
  const [printSubText, setPrintSubText] = useState("Proclaiming the Three Angels' Messages in Song and Worship");
  const [showHostColumn, setShowHostColumn] = useState(true);
  const [showTimeColumn, setShowTimeColumn] = useState(true);
  const [showNotesColumn, setShowNotesColumn] = useState(true);
  const [logoPosition, setLogoPosition] = useState<'left' | 'center' | 'right'>('left');
  const [printFontTheme, setPrintFontTheme] = useState<'traditional' | 'modern' | 'bold-editorial'>('traditional');
  const [customSortedItinerary, setCustomSortedItinerary] = useState<any[]>([]);
  const [ldrError, setLdrError] = useState("");
  const [showLdrStudio, setShowLdrStudio] = useState(false);
  const [showActStudio, setShowActStudio] = useState(false);
  const [showItiStudio, setShowItiStudio] = useState(false);

  const renderLoadingOrLabel = (isLoading: boolean, label: string, loadingLabel: string) => {
    if (isLoading) {
      return (
        <span className="flex items-center justify-center gap-2">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>{loadingLabel}</span>
        </span>
      );
    }
    return <span>{label}</span>;
  };

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
        title: activityToEdit.title || "",
        date: activityToEdit.date || "",
        location: activityToEdit.location || "",
        description: activityToEdit.description || "",
        category: activityToEdit.category || "",
        image: activityToEdit.image || "",
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
        event: itineraryToEdit.event || "",
        date: itineraryToEdit.date || "",
        time: itineraryToEdit.time || "",
        location: itineraryToEdit.location || "",
        host: itineraryToEdit.host || "",
        status: itineraryToEdit.status || "Confirmed",
        notes: itineraryToEdit.notes || "",
        mediaUrl: itineraryToEdit.mediaUrl || "",
        mediaType: itineraryToEdit.mediaType || "",
        sendBroadcast: true
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
    if (itinerary) {
      setCustomSortedItinerary([...itinerary]);
    }
  }, [itinerary]);

  React.useEffect(() => {
    setShowLdrStudio(false);
    if (leaderToEdit) {
      setLdrForm({
        name: leaderToEdit.name || "",
        role: leaderToEdit.role || "",
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

  useEffect(() => {
    if (adminError) {
      setErrorMsg(adminError);
    }
  }, [adminError]);

  useEffect(() => {
    if (isOpen && isAuthenticated && scrollToSection) {
      setTimeout(() => {
        const el = document.getElementById(`admin-${scrollToSection}-section`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 300);
    }
  }, [isOpen, isAuthenticated, scrollToSection]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail || !adminPassword) return;
    setLocalAuthLoading(true);
    setErrorMsg("");
    
    const success = await onLogin(adminEmail, adminPassword);
    setLocalAuthLoading(false);
    if (!success) {
      // It will be set by the useEffect watching adminError
      if (!adminError) setErrorMsg("Unauthorized: Invalid credentials or not an admin.");
    } else {
      setAdminPassword("");
    }
  };
  
  const handleGoogleAuthSubmit = async () => {
    setLocalAuthLoading(true);
    setErrorMsg("");
    const success = await onGoogleLoginAdmin();
    setLocalAuthLoading(false);
    if (!success) {
      if (!adminError) setErrorMsg("Unauthorized: Could not sign in with Google or not an admin.");
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

  const uploadBase64 = async (base64Str: string | undefined | null, defaultFilename = "upload.jpg"): Promise<string | undefined | null> => {
    if (!base64Str || !base64Str.startsWith("data:")) {
      return base64Str;
    }
    let processedBase64 = base64Str;
    if (base64Str.startsWith("data:image/")) {
      processedBase64 = await compressImage(base64Str);
    }
    try {
      const url = await uploadMedia(processedBase64, adminToken || "", defaultFilename);
      return url || processedBase64;
    } catch (err) {
      console.error("Error during base64 upload in AdminPanel:", err);
    }
    return processedBase64;
  };

  const handleBroadcastSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadForm.subject || !broadForm.body) return;
    setBroadSaving(true);
    setBroadMsg("");
    setBroadErr("");

    try {
      const res = await fetch("/api/broadcasts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": adminToken || ""
        },
        body: JSON.stringify(broadForm)
      });
      let data: any = {};
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : {};
      } catch (jsonErr) {
        data = { error: `Server returned an invalid response (Status ${res.status}).` };
      }
      if (res.ok && data.success) {
        setBroadMsg(`Success: Choral alert broadcasted successfully to all active subscribers (${data.data.sentCount} recipients)!`);
        setBroadForm({ subject: "", body: "" });
        onRefresh();
      } else {
        setBroadErr(data.error || "Failed to dispatch broadcast alert.");
      }
    } catch (err: any) {
      setBroadErr(err.message || "Network error. Could not reach server.");
    } finally {
      setBroadSaving(false);
    }
  };

  const handleSpotlightSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spotForm.memberName || !spotForm.quoteOrHighlight) return;
    setSpotSaving(true);
    setSpotMsg("");
    setSpotErr("");

    try {
      const processedImage = await uploadBase64(spotForm.image, "spotlight_avatar.jpg");
      const payload = { ...spotForm, image: processedImage };

      const res = await fetch("/api/member-spotlights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": adminToken || ""
        },
        body: JSON.stringify(payload)
      });
      let data: any = {};
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : {};
      } catch (jsonErr) {
        data = { error: `Server returned an invalid response (Status ${res.status}).` };
      }
      if (res.ok && data.success) {
        setSpotMsg("Success: New WhatsApp-style spotlight status update created! It will stay active for exactly 48 hours.");
        setSpotForm({ memberName: "", roleOrVoicePart: "", quoteOrHighlight: "", image: "" });
        onRefresh();
      } else {
        setSpotErr(data.error || "Failed to add spotlight update.");
      }
    } catch (err: any) {
      setSpotErr(err.message || "Network error. Could not reach server.");
    } finally {
      setSpotSaving(false);
    }
  };

  const handleDeleteSubscriber = async (id: string) => {
    if (!confirm("Are you sure you want to delete this subscriber? They will stop receiving alerts.")) return;
    try {
      const res = await fetch("/api/subscribers/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": adminToken || ""
        },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error("Failed to delete subscriber:", err);
    }
  };

  const handleDeleteSpotlight = async (id: string) => {
    if (!confirm("Are you sure you want to delete this spotlight? It will disappear from active stories.")) return;
    try {
      const res = await fetch("/api/member-spotlights/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": adminToken || ""
        },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error("Failed to delete member spotlight:", err);
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
        {authLoading && !isAuthenticated ? (
          <div className="flex-1 py-14 px-6 sm:px-12 flex flex-col items-center justify-center text-center bg-radial from-slate-900 via-slate-950 to-black relative">
            <div className="w-8 h-8 md:w-10 md:h-10 border-4 border-amber-500/20 border-t-amber-400 rounded-full animate-spin mb-4 md:mb-6" />
            <div className="text-amber-400/80 font-mono text-xs uppercase tracking-widest font-semibold animate-pulse">
              Verifying Access...
            </div>
          </div>
        ) : !isAuthenticated ? (
          <div className="flex-1 py-14 px-6 sm:px-12 flex flex-col items-center justify-center text-center bg-radial from-slate-900 via-slate-950 to-black relative">
            
            {/* Ambient Background Glow Accent */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-center">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-amber-500/10 text-amber-400 p-4 rounded-2xl border border-amber-500/20 shadow-xl shadow-amber-500/5 mb-6"
              >
                <Lock className="w-8 h-8 animate-pulse" />
              </motion.div>
              
              <h2 className="font-sans font-extrabold text-3xl tracking-tight text-white max-w-md">
                KACHAMBA <span className="text-amber-400">LEADER</span> GATEWAY
              </h2>
              <p className="font-sans text-xs text-slate-400 max-w-sm mt-3.5 leading-relaxed">
                Enter your administrative key below to authorize device access for the Kachamba Chorus Gateway.
              </p>
            </div>

            {/* Error / Success Messages */}
            <div className="w-full max-w-sm mt-6">
              <AnimatePresence mode="wait">
                {showResetUI ? (
                  <>
                    {resetErrorMsg && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs font-mono text-center flex items-center justify-center gap-2 mb-3"
                      >
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{resetErrorMsg}</span>
                      </motion.div>
                    )}
                    {resetMessage && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-xl text-xs font-sans text-center flex items-center justify-center gap-2 mb-3 font-semibold"
                      >
                        <Check className="w-4 h-4 shrink-0" />
                        <span>{resetMessage}</span>
                      </motion.div>
                    )}
                  </>
                ) : (
                  <>
                    {errorMsg && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs font-mono text-center flex items-center justify-center gap-2 mb-3"
                      >
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{errorMsg}</span>
                      </motion.div>
                    )}
                  </>
                )}
              </AnimatePresence>
            </div>

            {showResetUI ? (
              <form onSubmit={handleResetSubmit} className="mt-2 max-w-sm w-full flex flex-col gap-3.5 relative z-10">
                <div className="relative">
                  <input 
                    type="email"
                    required
                    value={adminEmail || ""}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="Admin Email Address"
                    className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-amber-400 rounded-xl p-4 outline-none text-sm placeholder-slate-600 transition-all font-sans text-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-sans font-extrabold text-xs uppercase tracking-wider py-4 px-6 rounded-xl transition-all cursor-pointer disabled:bg-slate-900 disabled:text-slate-600 shadow-xl shadow-emerald-500/10 mt-1 active:scale-[0.98]"
                >
                  {authLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Sending...</span>
                    </div>
                  ) : "Send Reset Link"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowResetUI(false);
                    setResetErrorMsg("");
                    setResetMessage("");
                  }}
                  className="text-[10px] uppercase tracking-widest font-extrabold text-slate-500 hover:text-white mt-1 transition-colors cursor-pointer font-mono"
                >
                  Back to Sign In
                </button>
              </form>
            ) : (
              <form onSubmit={handleAuthSubmit} className="mt-2 max-w-sm w-full flex flex-col gap-3.5 relative z-10">
                <div className="relative">
                  <input 
                    type="email"
                    required
                    value={adminEmail || ""}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="Admin Email Address"
                    className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-amber-400 rounded-xl p-4 outline-none text-sm placeholder-slate-600 transition-all font-sans text-white"
                  />
                </div>
                <div className="relative">
                  <input 
                    type={isPasscodeVisible ? "text" : "password"}
                    required
                    value={adminPassword || ""}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Admin Password"
                    className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-amber-400 rounded-xl p-4 outline-none text-sm placeholder-slate-600 transition-all font-sans text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setIsPasscodeVisible(!isPasscodeVisible)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-350 cursor-pointer"
                  >
                    {isPasscodeVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-sans font-extrabold text-xs uppercase tracking-wider py-4 px-6 rounded-xl transition-all cursor-pointer disabled:bg-slate-900 disabled:text-slate-600 shadow-xl shadow-amber-500/10 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {authLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 shrink-0" />
                      Secure Login
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={handleGoogleAuthSubmit}
                  disabled={authLoading}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-sans font-semibold text-sm py-3 px-6 rounded-xl transition-all cursor-pointer disabled:bg-slate-900 disabled:text-slate-600 border border-slate-700 mt-1 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                    <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36 16.6053 6.54998L20.0303 3.125C17.9503 1.19 15.2353 0 12.0003 0C7.31028 0 3.25528 2.69 1.28027 6.60998L5.27028 9.70498C6.21528 6.86 8.87028 4.75 12.0003 4.75Z" fill="#EA4335" />
                    <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4" />
                    <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05" />
                    <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26537 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853" />
                  </svg>
                  Sign In with Google
                </button>

                <div className="flex justify-between items-center mt-2">
                  <button
                    type="button"
                    onClick={() => setShowResetUI(true)}
                    className="text-[10px] uppercase tracking-widest font-extrabold text-slate-500 hover:text-amber-400 transition-colors cursor-pointer font-mono"
                  >
                    Reset Password
                  </button>
                </div>
              </form>
            )}

            <div className="mt-8 border-t border-slate-900/60 pt-4 w-full max-w-xs flex flex-col items-center gap-2 relative z-10">
              <span className="font-mono text-[9px] text-slate-600 uppercase tracking-wider">
                Authority Sign-In Service
              </span>
              <div className="flex bg-slate-950/40 px-3 py-1.5 rounded-xl border border-slate-900 text-[8px] font-mono text-slate-500 gap-2 items-center">
                <span>Passcode is managed securely by your server environment!</span>
              </div>
            </div>
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
                  type="button"
                  onClick={() => setIsCloudinaryDiagOpen(true)}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-300 font-sans font-bold text-xs px-3.5 py-2 rounded-lg cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <CloudLightning className="w-3.5 h-3.5 text-amber-550 shrink-0" />
                  <span>Cloudinary Diagnostics</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsGitWebhookModalOpen(true)}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-300 font-sans font-bold text-xs px-3.5 py-2 rounded-lg cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5 text-amber-550 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                  <span>Missions Webhooks</span>
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
                <div id="admin-activities-section" className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl">
                  <div className="flex items-center gap-2 text-amber-400 mb-4 bg-slate-950 p-2 rounded-lg font-bold border border-slate-805 text-sm uppercase tracking-wide">
                    <Plus className="w-4 h-4" />
                    <span>{activityToEdit ? "Edit Ministry Program" : "Create Modern Ministry"}</span>
                  </div>

                  <form onSubmit={handleActSubmit} className="flex flex-col gap-4 text-xs">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Title</label>
                      <input 
                        type="text" required
                        value={actForm.title || ""}
                        onChange={(e) => setActForm({ ...actForm, title: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white outline-none focus:border-amber-400"
                        placeholder="e.g. Accapella Vocal Workshop"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Category</label>
                        <select 
                          value={actForm.category || ""}
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
                          value={actForm.date || ""}
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
                        value={actForm.location || ""}
                        onChange={(e) => setActForm({ ...actForm, location: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white outline-none focus:border-amber-400"
                        placeholder="e.g. Sanctuary Hall, Kachok SDA"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Cover Image URL (or upload local)</label>
                      <input 
                        type="text"
                        value={actForm.image || ""}
                        onChange={(e) => setActForm({ ...actForm, image: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white outline-none focus:border-amber-400 font-mono text-[11px] mb-2"
                        placeholder="Paste image link, or leave blank"
                      />
                      <div className="mt-2">
                        <AdvancedMediaDropzone
                          label="Activity Cover Art File"
                          value={actForm.image || ""}
                          mediaType={actForm.mediaType || "image"}
                          error={actFileError}
                          onClear={() => setActForm({ ...actForm, image: "", mediaType: "" })}
                          onFileSelect={(dataUrl, type) => {
                            setActForm({ ...actForm, image: dataUrl, mediaType: type });
                          }}
                          onError={(msg) => setActFileError(msg)}
                        />
                      </div>

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
                        value={actForm.description || ""}
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
                      {renderLoadingOrLabel(
                        submittingData,
                        activityToEdit ? "Update Ministry Program" : "Establish New Ministry",
                        actForm.image && actForm.image.startsWith("data:") 
                          ? "Uploading Banner Image..." 
                          : "Saving Ministry Program..."
                      )}
                    </button>
                  </form>
                </div>


                {/* 2. Itinerary Edit Form */}
                <div id="admin-itinerary-section" className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 bg-slate-950 p-2.5 rounded-lg border border-slate-805 text-sm uppercase tracking-wide">
                    <div className="flex items-center gap-2 text-amber-400 font-bold">
                      <Calendar className="w-4 h-4" />
                      <span>{itineraryToEdit ? "Edit Tour Itinerary" : "Plan New Choral Tour"}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomSortedItinerary([...itinerary]);
                        setIsPrintPreviewOpen(true);
                      }}
                      className="bg-amber-500/10 hover:bg-amber-450 hover:text-slate-950 text-amber-400 border border-amber-500/20 hover:border-transparent font-sans font-extrabold text-[10px] tracking-wider py-1.5 px-3.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span>🔮 Print Preview & Arranger</span>
                    </button>
                  </div>

                  <form onSubmit={handleItiSubmit} className="flex flex-col gap-4 text-xs">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Event / Crusade Title</label>
                      <input 
                        type="text" required
                        value={itiForm.event || ""}
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
                          value={itiForm.date || ""}
                          onChange={(e) => setItiForm({ ...itiForm, date: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white outline-none focus:border-amber-400 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Hour of performance</label>
                        <input 
                          type="text" required
                          value={itiForm.time || ""}
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
                          value={itiForm.host || ""}
                          onChange={(e) => setItiForm({ ...itiForm, host: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white outline-none focus:border-amber-400"
                          placeholder="e.g. Lake Victoria Field"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Touring Status</label>
                        <select 
                          value={itiForm.status || ""}
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
                        value={itiForm.location || ""}
                        onChange={(e) => setItiForm({ ...itiForm, location: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white outline-none focus:border-amber-400"
                        placeholder="e.g. Migori Town SDA Church"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Special Pastor's Notes (Optional)</label>
                      <textarea 
                        rows={3}
                        value={itiForm.notes || ""}
                        onChange={(e) => setItiForm({ ...itiForm, notes: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white outline-none focus:border-amber-400 resize-none"
                        placeholder="e.g. Sermon booklet supplied, dress code: White and Blue Uniform..."
                      />
                    </div>

                    {/* Google Workspace Integration Panel */}
                    <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl mt-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                        <h4 className="text-[10px] font-mono uppercase tracking-wider text-slate-300 font-bold">Google Workspace Automation</h4>
                      </div>
                      
                      {!googleAccessToken ? (
                        <div className="flex flex-col gap-2">
                          <p className="text-[10px] text-slate-400">
                            Connect with Google in the Admin panel to create real-time Google Meet schedule links, build event registration forms using Google Forms, and save posters to Google Drive!
                          </p>
                          <button
                            type="button"
                            onClick={onGoogleLogin}
                            className="bg-slate-800 hover:bg-slate-750 text-white p-2 rounded text-[10px] font-bold uppercase tracking-wide cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                              <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.14-5.174 4.14-3.41 0-6.177-2.766-6.177-6.177s2.767-6.177 6.177-6.177c1.554 0 2.964.58 4.053 1.527l3.078-3.078C18.847 2.14 15.714 1 12.24 1 6.046 1 12.24s5.046 11.24 11.24 11.24c6.043 0 10.96-4.665 10.96-10.96 0-.742-.086-1.458-.232-2.235H12.24z"/>
                            </svg>
                            <span>Authorize Google Account</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          <p className="text-[10px] text-emerald-400 font-mono">
                            ✓ Google APIs authorized successfully. Click to generate resource links:
                          </p>
                          
                          <div className="grid grid-cols-2 gap-2">
                            {/* Google Meet action */}
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  setIsWorkspaceLoading(true);
                                  setWorkspaceStatus({ type: 'info', msg: 'Generating Google Meet Room...' });
                                  const response = await fetch('/api/workspace/meet', {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      'Authorization': `Bearer ${googleAccessToken}`,
                                      'X-Admin-Passcode': adminToken || ""
                                    }
                                  });
                                  const data = await response.json();
                                  if (data.error) throw new Error(data.error);
                                  
                                  setItiForm(prev => ({
                                    ...prev,
                                    notes: `${prev.notes ? prev.notes + '\n\n' : ''}🎥 Friday Vesper Google Meet Room:\n${data.meetingUri}`
                                  }));
                                  
                                  setWorkspaceStatus({ type: 'success', msg: 'Google Meet Created & Appended!' });
                                  navigator.clipboard.writeText(data.meetingUri);
                                } catch (err: any) {
                                  setWorkspaceStatus({ type: 'error', msg: err?.message || 'Error occurred' });
                                } finally {
                                  setIsWorkspaceLoading(false);
                                }
                              }}
                              disabled={isWorkspaceLoading}
                              className="bg-emerald-950/40 border border-emerald-800 hover:bg-emerald-900/40 text-emerald-400 p-2 rounded text-[10px] font-bold flex flex-col items-center gap-1 cursor-pointer transition-colors"
                            >
                              <span>🎥 Create Google Meet</span>
                            </button>
                            
                            {/* Google Forms action */}
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  setIsWorkspaceLoading(true);
                                  setWorkspaceStatus({ type: 'info', msg: 'Generating Google Registration Form...' });
                                  const response = await fetch('/api/workspace/form', {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      'Authorization': `Bearer ${googleAccessToken}`,
                                      'X-Admin-Passcode': adminToken || ""
                                    },
                                    body: JSON.stringify({
                                      title: itiForm.event || 'Vesper Fellowship Registration'
                                    })
                                  });
                                  const data = await response.json();
                                  if (data.error) throw new Error(data.error);
                                  
                                  setItiForm(prev => ({
                                    ...prev,
                                    notes: `${prev.notes ? prev.notes + '\n\n' : ''}📝 Vesper RSVP/Prayer Request form:\n${data.responderUri}\n✏️ Edit Form Link:\n${data.editUrl}`
                                  }));
                                  
                                  setWorkspaceStatus({ type: 'success', msg: 'Google Form registration form created!' });
                                  navigator.clipboard.writeText(data.responderUri);
                                } catch (err: any) {
                                  setWorkspaceStatus({ type: 'error', msg: err?.message || 'Error occurred' });
                                } finally {
                                  setIsWorkspaceLoading(false);
                                }
                              }}
                              disabled={isWorkspaceLoading}
                              className="bg-purple-950/40 border border-purple-800 hover:bg-purple-900/40 text-purple-400 p-2 rounded text-[10px] font-bold flex flex-col items-center gap-1 cursor-pointer transition-colors"
                            >
                              <span>📝 Create Google Form</span>
                            </button>
                          </div>
                          
                          {/* Google Drive Poster Saver */}
                          {itiForm.mediaUrl && itiForm.mediaUrl.startsWith('data:image/') && (
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  setIsWorkspaceLoading(true);
                                  setWorkspaceStatus({ type: 'info', msg: 'Saving Poster in your Google Drive...' });
                                  const response = await fetch('/api/workspace/drive/poster', {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      'Authorization': `Bearer ${googleAccessToken}`,
                                      'X-Admin-Passcode': adminToken || ""
                                    },
                                    body: JSON.stringify({
                                      filename: `${itiForm.event.toLowerCase().replace(/[^a-z0-9]/g, '_')}_poster.png`,
                                      base64: itiForm.mediaUrl
                                    })
                                  });
                                  const data = await response.json();
                                  if (data.error) throw new Error(data.error);
                                  
                                  setItiForm(prev => ({
                                    ...prev,
                                    mediaUrl: data.posterUrl,
                                    mediaType: 'image'
                                  }));
                                  
                                  setWorkspaceStatus({ type: 'success', msg: 'Success! Poster saved in Google Drive and public link embedded with direct download!' });
                                } catch (err: any) {
                                  setWorkspaceStatus({ type: 'error', msg: err?.message || 'Error occurred' });
                                } finally {
                                  setIsWorkspaceLoading(false);
                                }
                              }}
                              disabled={isWorkspaceLoading}
                              className="w-full bg-blue-950/40 border border-blue-900 hover:bg-blue-900/40 text-blue-400 p-2 rounded text-[10px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors mt-1"
                            >
                              <span>💾 Save Poster to Google Drive & Get Link</span>
                            </button>
                          )}
                          
                          {workspaceStatus.msg && (
                            <div className={`p-2 rounded text-[10px] font-mono border ${
                              workspaceStatus.type === 'success' ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400 animate-pulse' :
                              workspaceStatus.type === 'error' ? 'bg-rose-950/60 border-rose-800 text-rose-400' :
                              'bg-slate-950 border-slate-800 text-slate-300'
                            }`}>
                              {workspaceStatus.msg}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Upload Photo or Video OR Paste URL</label>
                      <div className="flex flex-col gap-2">
                        <input 
                          type="text"
                          value={itiForm.mediaUrl || ""}
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
                        <div className="mt-1">
                          <AdvancedMediaDropzone
                            label="Itinerary Photo / Video File"
                            value={itiForm.mediaUrl || ""}
                            mediaType={itiForm.mediaType || "image"}
                            error={itiFileError}
                            onClear={() => setItiForm({ ...itiForm, mediaUrl: "", mediaType: "" })}
                            onFileSelect={(dataUrl, type) => {
                              setItiForm({ ...itiForm, mediaUrl: dataUrl, mediaType: type });
                            }}
                            onError={(msg) => setItiFileError(msg)}
                          />
                        </div>

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
                    
                    {!itineraryToEdit && (
                      <div className="flex items-center gap-3.5 p-3.5 bg-amber-500/5 rounded-xl border border-amber-500/10 mb-2">
                        <input
                          type="checkbox"
                          id="sendBroadcast"
                          checked={itiForm.sendBroadcast || false}
                          onChange={(e) => setItiForm({ ...itiForm, sendBroadcast: e.target.checked })}
                          className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-800 focus:ring-amber-500 accent-amber-500 cursor-pointer shrink-0"
                        />
                        <label htmlFor="sendBroadcast" className="text-[11px] font-sans text-slate-300 cursor-pointer select-none leading-relaxed">
                          📡 <strong>Send Broadcast Dispatch:</strong> Notify all registered email subscribers of this tour addition immediately!
                        </label>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submittingData}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-sans font-bold py-3 rounded-lg transition-colors cursor-pointer w-full text-center text-xs mt-2"
                    >
                      {renderLoadingOrLabel(
                        submittingData,
                        itineraryToEdit ? "Update Tour Schedule" : "Add Tour Schedule",
                        itiForm.mediaUrl && itiForm.mediaUrl.startsWith("data:") 
                          ? "Uploading Tour Media..." 
                          : "Scheduling Tour Mission..."
                      )}
                    </button>
                  </form>
                </div>

              </div>


              {/* SECTION C: MANAGE MUSIC SINGLE STREAMING */}
              <div id="admin-music-section" className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl">
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
                        value={musicForm.songTitle || ""}
                        onChange={(e) => setMusicForm({ ...musicForm, songTitle: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white outline-none focus:border-amber-400"
                        placeholder="e.g. Umchukue Mwanao"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Artist Credits</label>
                      <input 
                        type="text" required
                        value={musicForm.artistName || ""}
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
                        value={musicForm.albumName || ""}
                        onChange={(e) => setMusicForm({ ...musicForm, albumName: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white outline-none focus:border-amber-400"
                        placeholder="e.g. Sounds Of Togetherness"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Track Label / Edition</label>
                      <input 
                        type="text" required
                        value={musicForm.label || ""}
                        onChange={(e) => setMusicForm({ ...musicForm, label: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white outline-none focus:border-amber-400"
                        placeholder="e.g. Live At Central"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Highlight Quote / Lyric Snippet</label>
                      <input 
                        type="text" required
                        value={musicForm.quoteText || ""}
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
                      value={musicForm.lyrics || ""}
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
                          value={musicForm.coverUrl || ""}
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
                          value={musicForm.audioUrl || ""}
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
                                value={trimStart || ""}
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
                    {renderLoadingOrLabel(
                      musicSaving,
                      "Save Track & Player Metadata",
                      ((musicForm.audioUrl && musicForm.audioUrl.startsWith("data:")) || (musicForm.coverUrl && musicForm.coverUrl.startsWith("data:")))
                        ? "Uploading Music Assets..."
                        : "Saving Track Settings..."
                    )}
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <form onSubmit={handleSaveMpesa} className="flex flex-col gap-4 text-xs font-sans">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 col-gap-4">
                      <div>
                        <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Till or Paybill Type</label>
                        <select
                          value={mpesaType || ""}
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
                        value={mpesaTill || ""}
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
                      value={mpesaName || ""}
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
                    <div className="mt-2 text-left">
                      <AdvancedMediaDropzone
                        label="Till Poster Image File"
                        value={mpesaImage || ""}
                        mediaType="image"
                        error=""
                        onClear={() => setMpesaImage("")}
                        onFileSelect={(dataUrl) => {
                          setMpesaImage(dataUrl);
                        }}
                        onError={() => {}}
                        acceptedTypes="image/*"
                      />
                    </div>
                  </div>

                  <hr className="border-slate-800 my-4" />
                  <div className="flex items-center gap-2 text-indigo-400 mb-2 font-bold uppercase tracking-wider text-[10px] font-mono">
                    <CreditCard className="w-4 h-4" />
                    <span>Transaction Receipt Layout Settings</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Receipt Layout Style</label>
                      <select
                        value={mpesaReceiptLayout || ""}
                        onChange={(e) => setMpesaReceiptLayout(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded p-2 outline-none font-mono text-[11px] text-white"
                      >
                        <option value="modern">Modern Default Layout</option>
                        <option value="classic">Classic Minimalist</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Receipt Organization Title</label>
                      <input
                        type="text"
                        value={mpesaReceiptTitle || ""}
                        onChange={(e) => setMpesaReceiptTitle(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded p-2 outline-none font-mono text-[11px] text-white"
                        placeholder="e.g. Kachamba Chorus"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Receipt Top Logo URL (Optional)</label>
                    <input
                      type="text"
                      value={mpesaReceiptLogo || ""}
                      onChange={(e) => setMpesaReceiptLogo(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded p-2 outline-none font-mono text-[11px] text-white"
                      placeholder="e.g. https://example.com/logo.png"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Receipt Custom Message</label>
                    <textarea
                      value={mpesaReceiptMessage || ""}
                      onChange={(e) => setMpesaReceiptMessage(e.target.value)}
                      rows={2}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded p-2 outline-none font-sans text-xs text-white"
                      placeholder="e.g. We have received your generous gift. May God bless you abundantly."
                    ></textarea>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Receipt Title Font Size</label>
                      <select
                        value={mpesaReceiptHeaderSize || ""}
                        onChange={(e) => setMpesaReceiptHeaderSize(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded p-2 outline-none font-mono text-[11px] text-white"
                      >
                        <option value="text-sm">Small</option>
                        <option value="text-base">Medium</option>
                        <option value="text-lg">Large</option>
                        <option value="text-xl">Extra Large</option>
                        <option value="text-2xl">2XL</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Receipt Title Text Color</label>
                      <select
                        value={mpesaReceiptHeaderColor || ""}
                        onChange={(e) => setMpesaReceiptHeaderColor(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded p-2 outline-none font-mono text-[11px] text-white"
                      >
                        <option value="text-slate-800">Slate 800 (Default)</option>
                        <option value="text-slate-900">Slate 900 (Dark)</option>
                        <option value="text-amber-500">Amber 500</option>
                        <option value="text-amber-600">Amber 600</option>
                        <option value="text-blue-600">Blue 600</option>
                        <option value="text-emerald-600">Emerald 600</option>
                        <option value="text-red-600">Red 600</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Receipt Body Size</label>
                      <select
                        value={mpesaReceiptBodySize || ""}
                        onChange={(e) => setMpesaReceiptBodySize(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded p-2 outline-none font-mono text-[11px] text-white"
                      >
                        <option value="text-xs">Extra Small</option>
                        <option value="text-sm">Small (Default)</option>
                        <option value="text-base">Medium</option>
                        <option value="text-lg">Large</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Receipt Body Text Color</label>
                      <select
                        value={mpesaReceiptBodyColor || ""}
                        onChange={(e) => setMpesaReceiptBodyColor(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded p-2 outline-none font-mono text-[11px] text-white"
                      >
                        <option value="text-slate-500">Slate 500 (Default)</option>
                        <option value="text-slate-600">Slate 600</option>
                        <option value="text-slate-700">Slate 700</option>
                        <option value="text-slate-800">Slate 800</option>
                        <option value="text-amber-600">Amber 600</option>
                        <option value="text-emerald-600">Emerald 600</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Receipt Secondary Logo URL (SDA)</label>
                      <input
                        type="text"
                        value={mpesaReceiptExtraLogo || ""}
                        onChange={(e) => setMpesaReceiptExtraLogo(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded p-2 outline-none font-mono text-[11px] text-white"
                        placeholder="e.g. SDA Logo URL"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Receipt Text Alignment</label>
                      <select
                        value={mpesaReceiptTextAlign || ""}
                        onChange={(e) => setMpesaReceiptTextAlign(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded p-2 outline-none font-mono text-[11px] text-white"
                      >
                        <option value="text-left">Left</option>
                        <option value="text-center">Center</option>
                        <option value="text-right">Right</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Receipt Font Family</label>
                      <select
                        value={mpesaReceiptFontFamily || ""}
                        onChange={(e) => setMpesaReceiptFontFamily(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded p-2 outline-none font-mono text-[11px] text-white"
                      >
                        <option value="font-sans">Sans-Serif (Default)</option>
                        <option value="font-serif">Serif (Official/Classic)</option>
                        <option value="font-mono">Monospace</option>
                      </select>
                    </div>
                  </div>

                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl my-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <label className="block text-[10px] font-mono text-slate-350 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-amber-500" />
                          <span>Receipt Structural Element Order</span>
                        </label>
                        <span className="text-[9px] font-mono font-bold text-emerald-450 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                          Drag & Move Controls
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-sans leading-snug">
                        Arrange the order of elements displayed on your custom M-Pesa donation receipt. Drag components of the list or use the quick <ChevronUp className="inline-block w-3 h-3 text-amber-400 saturate-155"/> / <ChevronDown className="inline-block w-3 h-3 text-amber-400 saturate-155"/> button controls below.
                      </p>
                      
                      <div className="space-y-2">
                        {mpesaReceiptOrder.map((block, idx) => {
                          const blockLabels: Record<string, { label: string, color: string, icon: any }> = {
                            successIcon: { label: "✅ Success Accent Circle", color: "from-emerald-500/10 to-emerald-600/5 text-emerald-400 border-emerald-500/20", icon: CheckCircle },
                            header: { label: "📝 Receipt Title & Header", color: "from-blue-500/10 to-blue-600/5 text-blue-400 border-blue-500/20", icon: Layout },
                            amount: { label: "💵 Main Transaction Amount", color: "from-amber-500/10 to-amber-600/5 text-amber-400 border-amber-500/20", icon: DollarSign },
                            message: { label: "💬 Custom Thank You Message", color: "from-purple-500/10 to-purple-600/5 text-purple-400 border-purple-500/20", icon: MessageSquareIcon },
                            details: { label: "📊 Transaction Details Table", color: "from-pink-500/10 to-pink-600/5 text-pink-400 border-pink-500/20", icon: FileText },
                            barcode: { label: "║▌ Barcode Verification Strip", color: "from-slate-500/10 to-slate-600/5 text-slate-400 border-slate-500/20", icon: Barcode },
                          };
                          
                          const config = blockLabels[block] || { label: block, color: "from-indigo-500/10 to-indigo-600/5 text-indigo-400 border-indigo-500/20", icon: Layout };
                          const BlockIcon = config.icon;
                          
                          return (
                            <div
                              key={block}
                              draggable
                              onDragStart={() => { dragItem.current = idx; }}
                              onDragEnter={() => { dragOverItem.current = idx; }}
                              onDragEnd={handleSort}
                              onDragOver={(e) => e.preventDefault()}
                              className={`flex items-center justify-between border bg-gradient-to-r ${config.color} px-3 py-2 rounded-lg cursor-grab hover:cursor-grabbing hover:border-amber-400/50 hover:scale-[1.01] active:scale-[0.99] transition-all`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-slate-600 shrink-0 select-none text-xs">☰</span>
                                <BlockIcon className="w-3.5 h-3.5 shrink-0" />
                                <span className="text-[11px] font-sans font-semibold tracking-wide">{config.label}</span>
                              </div>
                              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => {
                                    const nextOrder = [...mpesaReceiptOrder];
                                    const temp = nextOrder[idx];
                                    nextOrder[idx] = nextOrder[idx - 1];
                                    nextOrder[idx - 1] = temp;
                                    setMpesaReceiptOrder(nextOrder);
                                  }}
                                  className="p-1 rounded bg-black/40 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none text-slate-350 hover:text-white transition-colors"
                                >
                                  <ChevronUp className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === mpesaReceiptOrder.length - 1}
                                  onClick={() => {
                                    const nextOrder = [...mpesaReceiptOrder];
                                    const temp = nextOrder[idx];
                                    nextOrder[idx] = nextOrder[idx + 1];
                                    nextOrder[idx + 1] = temp;
                                    setMpesaReceiptOrder(nextOrder);
                                  }}
                                  className="p-1 rounded bg-black/40 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none text-slate-350 hover:text-white transition-colors"
                                >
                                  <ChevronDown className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  <button
                    type="submit"
                    disabled={mpesaSaving}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-sans font-bold py-3 rounded-lg transition-colors cursor-pointer w-full text-center text-xs mt-2"
                  >
                    {mpesaSaving ? "Saving Config..." : "Save M-Pesa Till Configuration"}
                  </button>
                </form>

                <div className="flex flex-col border border-slate-800 rounded-2xl bg-slate-900/50 overflow-hidden relative">
                  <div className="bg-slate-950 p-2 font-mono text-[10px] text-slate-400 uppercase tracking-widest text-center border-b border-slate-800">
                    Live Receipt Preview & Drag-to-Reorder Layout
                  </div>
                  <div className="flex-1 p-4 sm:p-6 flex items-center justify-center bg-slate-50 opacity-100 overflow-hidden" style={{ minHeight: "450px" }}>
                    <div id="mpesa-receipt-preview" className={`bg-white rounded-[24px] p-6 pt-10 max-w-sm w-full mx-auto shadow-2xl relative border border-slate-100 ${mpesaReceiptLayout === 'classic' ? 'border' : ''} ${mpesaReceiptFontFamily || 'font-sans'} ${mpesaReceiptTextAlign || 'text-center'} scale-[0.8] sm:scale-95 origin-top`}>

                      {mpesaReceiptLogo && (
                        <div className={`absolute top-6 left-6 ${mpesaReceiptLayout === 'classic' ? 'relative top-0 left-0 mb-4 flex justify-center w-full' : ''}`}>
                          <img 
                            src={mpesaReceiptLogo} 
                            alt="Organization Logo" 
                            className={`w-12 h-12 rounded-full object-cover border border-slate-100 shadow-sm ${mpesaReceiptLayout === 'classic' ? 'mx-auto' : ''}`}
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}

                      {mpesaReceiptExtraLogo && (
                        <div className={`absolute top-6 right-6 ${mpesaReceiptLayout === 'classic' ? 'hidden' : ''}`}>
                          <img 
                            src={mpesaReceiptExtraLogo} 
                            alt="Official Symbol" 
                            className={`w-12 h-12 object-contain drop-shadow-sm`}
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}

                      {mpesaReceiptOrder.map((block, index) => {
                        const isDraggable = true;
                        
                        let content = null;
                        switch (block) {
                          case "successIcon":
                            content = mpesaReceiptLayout === 'modern' ? (
                              <div className={`mb-5 mt-2 flex ${mpesaReceiptTextAlign === 'text-left' ? 'justify-start' : mpesaReceiptTextAlign === 'text-right' ? 'justify-end' : 'justify-center'}`}>
                                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center relative">
                                  <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                    <CheckCircle className="w-8 h-8 text-white" />
                                  </div>
                                </div>
                              </div>
                            ) : null;
                            break;
                          case "header":
                            content = (
                              <div className="mb-6 mt-4 relative z-10">
                                {mpesaReceiptLayout === 'classic' && (
                                  <div className={`mb-3 ${mpesaReceiptTextAlign === 'text-left' ? '' : mpesaReceiptTextAlign === 'text-right' ? 'flex justify-end' : 'flex justify-center'}`}>
                                    <CheckCircle className="w-10 h-10 text-emerald-500" />
                                  </div>
                                )}
                                <h4 className={`${mpesaReceiptHeaderSize || 'text-2xl'} font-bold ${mpesaReceiptHeaderColor || 'text-slate-800'} mb-1`}>
                                  {mpesaReceiptTitle || mpesaName || "Kachamba Chorus"}
                                </h4>
                                <p className={`${mpesaReceiptBodySize || 'text-sm'} ${mpesaReceiptBodyColor || 'text-slate-500'}`}>Payment Successful</p>
                              </div>
                            );
                            break;
                          case "amount":
                            content = (
                              <div className="mb-6 mt-2 relative z-10">
                                <span className={`${mpesaReceiptLayout === 'classic' ? 'text-3xl' : 'text-4xl'} font-extrabold text-slate-900 tracking-tight block`}>
                                  KES 500
                                </span>
                              </div>
                            );
                            break;
                          case "message":
                            content = mpesaReceiptMessage ? (
                              <div className="mb-6 px-2 relative z-10">
                                <p className={`${mpesaReceiptBodySize || 'text-xs'} ${mpesaReceiptBodyColor || 'text-slate-600'} leading-relaxed font-medium italic`}>
                                  "{mpesaReceiptMessage}"
                                </p>
                              </div>
                            ) : null;
                            break;
                          case "details":
                            content = (
                              <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-100 text-sm relative z-10">
                                <div className="flex justify-between items-center py-2 border-b border-slate-200 border-dashed">
                                  <span className="text-slate-500">Ref Number</span>
                                  <span className="font-semibold text-slate-800 font-mono text-xs">TXN-{Date.now().toString().slice(6)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-slate-200 border-dashed">
                                  <span className="text-slate-500">Payment Time</span>
                                  <span className="font-semibold text-slate-800 text-xs text-right max-w-[120px]">
                                    {new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                  <span className="text-slate-500">Method</span>
                                  <span className="font-semibold text-slate-800 flex items-center gap-1.5 text-xs">
                                    <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                                    M-Pesa (0720)
                                  </span>
                                </div>
                              </div>
                            );
                            break;
                          case "barcode":
                            content = (
                              <div className="flex justify-center mt-2 pb-2 opacity-60 mix-blend-multiply">
                                <Barcode className="w-full max-w-[200px] h-10 text-slate-800" strokeWidth={1} />
                              </div>
                            );
                            break;
                        }

                        if (!content) return null;

                        return (
                          <div
                            key={block}
                            draggable={isDraggable}
                            onDragStart={() => (dragItem.current = index)}
                            onDragEnter={() => (dragOverItem.current = index)}
                            onDragEnd={handleSort}
                            onDragOver={(e) => e.preventDefault()}
                            className="cursor-move hover:outline hover:outline-2 hover:outline-dashed hover:outline-emerald-500 rounded p-1 transition-all"
                            title="Drag to reorder"
                          >
                            {content}
                          </div>
                        );
                      })}
                      
                    </div>
                  </div>
                </div>
                </div>

                {/* SAVED CLOUDINARY TRANSACTION RECEIPTS LIST */}
                <div className="mt-8 pt-8 border-t border-slate-800/80">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                      <h4 className="text-sm font-sans font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-400" />
                        <span>Saved Cloudinary Transaction Receipts</span>
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-1">
                        High-fidelity transaction receipts generated and automatically stored in your Cloudinary space and Firestore database.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={fetchMpesaReceiptsList}
                      disabled={loadingReceipts}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-[10px] font-mono text-slate-350 hover:text-white transition-colors cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${loadingReceipts ? 'animate-spin' : ''}`} />
                      <span>{loadingReceipts ? 'Syncing...' : 'Sync Cloudinary Receipts'}</span>
                    </button>
                  </div>

                  {mpesaReceipts.length === 0 ? (
                    <div className="text-center py-10 bg-slate-950/20 rounded-2xl border border-slate-900/60 p-6">
                      <FileText className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                      <p className="text-xs text-slate-400 font-sans">No saved receipts found in Cloudinary database yet.</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-1">Receipts are automatically synced here whenever contributors complete M-Pesa donations.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/20">
                      <table className="w-full text-left text-xs font-sans">
                        <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase tracking-widest border-b border-slate-800">
                          <tr>
                            <th className="p-4 font-semibold">Receipt Code</th>
                            <th className="p-4 font-semibold">Contributor</th>
                            <th className="p-4 font-semibold">Amount</th>
                            <th className="p-4 font-semibold">Donor Phone</th>
                            <th className="p-4 font-semibold">Transaction Date</th>
                            <th className="p-4 font-semibold text-center">Receipt File (Cloudinary)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900 font-sans text-slate-300">
                          {mpesaReceipts.map((rcpt: any) => (
                            <tr key={rcpt.id} className="hover:bg-slate-900/30 transition-colors">
                              <td className="p-4 font-mono font-bold text-white text-xs">{rcpt.receiptNo}</td>
                              <td className="p-4 text-xs font-semibold">{rcpt.contributorName}</td>
                              <td className="p-4 text-xs text-emerald-400 font-bold font-mono">KES {rcpt.amount}.00</td>
                              <td className="p-4 text-xs font-mono">+{rcpt.phone}</td>
                              <td className="p-4 text-xs text-slate-400 font-mono">{rcpt.date}</td>
                              <td className="p-4 text-center">
                                {rcpt.pdfUrl ? (
                                  <a
                                    href={rcpt.pdfUrl}
                                    target="_blank"
                                    rel="noreferrer referrer"
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-[10px] font-mono text-emerald-400 hover:text-emerald-300 transition-colors font-bold"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                    <span>View PDF Receipt</span>
                                  </a>
                                ) : (
                                  <span className="text-[10px] text-slate-500 font-mono">No URL</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION: MANAGE LEADERS / COUNCIL STEWARDS */}
              <div id="admin-leaders-section" className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl">
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
                      value={ldrForm.name || ""}
                      onChange={(e) => setLdrForm({ ...ldrForm, name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white outline-none focus:border-amber-400"
                      placeholder="e.g. Director Brighton"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Position / Role</label>
                    <input 
                      type="text" required
                      value={ldrForm.role || ""}
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
                          value={ldrForm.image || ""}
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
                      value={ldrForm.phone || ""}
                      onChange={(e) => setLdrForm({ ...ldrForm, phone: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white outline-none focus:border-amber-400"
                      placeholder="e.g. +254 712 345 678"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Brief Bio Quote</label>
                    <input 
                      type="text"
                      value={ldrForm.bio || ""}
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
                      {renderLoadingOrLabel(
                        ldrSaving,
                        leaderToEdit ? "Update Leadership Record" : "Enlist Council Steward",
                        ldrForm.image && ldrForm.image.startsWith("data:") 
                          ? "Uploading Profile Photo..." 
                          : "Saving Steward Profile..."
                      )}
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


              {/* CUSTOM SECTION: NEWSLETTER BROADCAST MANAGER */}
              <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl">
                <div className="flex items-center gap-2 text-amber-400 mb-6 bg-slate-950 p-2.5 rounded-lg border border-slate-805 text-sm font-bold uppercase tracking-wider">
                  <Send className="w-5 h-5 text-amber-500 animate-pulse-slow" />
                  <span>Newsletter Subscribers & Choral Broadcasts</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column: Create Custom Broadcast Alert */}
                  <div className="flex flex-col gap-4">
                    <h4 className="font-sans font-bold text-xs text-white uppercase tracking-wider border-b border-slate-800 pb-2 mb-1">
                      📢 Dispatch Custom Broadcast Alert
                    </h4>
                    <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                      Compose a direct newsletter message. All registered active newsletter subscribers will receive this immediate choral alert dispatch!
                    </p>

                    <form onSubmit={handleBroadcastSubmit} className="flex flex-col gap-3 font-sans text-xs">
                      {broadErr && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg font-mono">
                          {broadErr}
                        </div>
                      )}
                      {broadMsg && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg font-mono">
                          {broadMsg}
                        </div>
                      )}

                      <div>
                        <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Broadcast Subject</label>
                        <input
                          type="text" required
                          value={broadForm.subject || ""}
                          onChange={(e) => setBroadForm({ ...broadForm, subject: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white outline-none focus:border-amber-400"
                          placeholder="e.g. Tour Bus Cancellation / Vesper Shift Announcement"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Broadcast Email Body Material</label>
                        <textarea
                          required rows={5}
                          value={broadForm.body || ""}
                          onChange={(e) => setBroadForm({ ...broadForm, body: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white outline-none focus:border-amber-400 font-sans leading-relaxed block"
                          placeholder="Compose direct announcements. Use human, respectful words fit for ministry."
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={broadSaving}
                        className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold py-2.5 rounded-lg transition-colors cursor-pointer text-center text-xs font-sans mt-1"
                      >
                        {renderLoadingOrLabel(broadSaving, "🚀 Disseminate Choral Alert", "Broadcasting Choral Alert...")}
                      </button>
                    </form>
                  </div>

                  {/* Right Column: Manage Registered Subscribers & History */}
                  <div className="flex flex-col gap-4">
                    <h4 className="font-sans font-bold text-xs text-white uppercase tracking-wider border-b border-slate-800 pb-2 mb-1">
                      👥 Registered Active Subscribers ({subscribers.length})
                    </h4>
                    
                    <div className="max-h-[180px] overflow-y-auto bg-slate-950/40 border border-slate-850 rounded-xl p-3 flex flex-col gap-2 custom-scrollbar">
                      {subscribers.length === 0 ? (
                        <p className="text-[11px] text-slate-500 text-center py-6 font-mono">No active email subscriptions found.</p>
                      ) : (
                        subscribers.map((sub) => (
                          <div key={sub.id} className="flex justify-between items-center bg-slate-900 p-2 rounded-lg border border-slate-850/50 text-[11px]">
                            <span className="font-mono text-slate-300 truncate tracking-wide">{sub.email}</span>
                            <button
                              onClick={() => handleDeleteSubscriber(sub.id)}
                              className="text-red-400 hover:text-red-500 bg-red-500/10 hover:bg-red-500/20 p-1 rounded-md border border-red-500/10 cursor-pointer transition-colors"
                              title="Delete subscription"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    <h4 className="font-sans font-bold text-xs text-white uppercase tracking-wider border-b border-slate-800 pb-2 mb-1 mt-2">
                      📜 Dispatch History log ({broadcasts.length})
                    </h4>
                    <div className="max-h-[140px] overflow-y-auto bg-slate-950/40 border border-slate-850 rounded-xl p-3 flex flex-col gap-2 custom-scrollbar">
                      {broadcasts.length === 0 ? (
                        <p className="text-[11px] text-slate-500 text-center py-4 font-mono">No broadcasts dispatched yet.</p>
                      ) : (
                        [...broadcasts].reverse().map((b) => (
                          <div key={b.id} className="bg-slate-900 p-2 rounded-lg text-[10px] font-sans border border-slate-850">
                            <div className="flex justify-between font-bold text-amber-400">
                              <span className="truncate max-w-[170px]">{b.subject}</span>
                              <span className="font-mono text-slate-450 uppercase shrink-0">{b.sentCount} Recips</span>
                            </div>
                            <p className="text-slate-400 truncate mt-1 leading-normal italic">"{b.body}"</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>


              {/* CUSTOM SECTION: WHATSAPP MEMBER SPOTLIGHTS */}
              <div id="admin-spotlight-section" className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl">
                <div className="flex items-center gap-2 text-amber-400 mb-6 bg-slate-950 p-2.5 rounded-lg border border-slate-805 text-sm font-bold uppercase tracking-wider">
                  <Users className="w-5 h-5 text-amber-500" />
                  <span>Personal Member Spotlight Status updates</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column: Create Spotlight Status Update */}
                  <form onSubmit={handleSpotlightSubmit} className="flex flex-col gap-4">
                    <h4 className="font-sans font-bold text-xs text-white uppercase tracking-wider border-b border-slate-800 pb-2 mb-1">
                      🎬 Establish New Member Status Highlight
                    </h4>

                    {spotErr && (
                      <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg font-mono text-xs">
                        {spotErr}
                      </div>
                    )}
                    {spotMsg && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg font-mono text-xs">
                        {spotMsg}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Member Name</label>
                        <input
                          type="text" required
                          value={spotForm.memberName || ""}
                          onChange={(e) => setSpotForm({ ...spotForm, memberName: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white outline-none focus:border-amber-400"
                          placeholder="e.g. Sister Mercy"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Role / Voice Part</label>
                        <input
                          type="text" required
                          value={spotForm.roleOrVoicePart || ""}
                          onChange={(e) => setSpotForm({ ...spotForm, roleOrVoicePart: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white outline-none focus:border-amber-400"
                          placeholder="e.g. Soprano Choir Lead"
                        />
                      </div>
                    </div>

                    <div className="text-xs">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Testimony / Personal Spotlight Highlight</label>
                      <textarea
                        required rows={3}
                        value={spotForm.quoteOrHighlight || ""}
                        onChange={(e) => setSpotForm({ ...spotForm, quoteOrHighlight: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white outline-none focus:border-amber-400 leading-normal block"
                        placeholder="e.g. 'Singing with Kachamba has been an anchor to my faith, and I thank God for guiding our acapella paths!'"
                      />
                    </div>

                    <div className="text-xs">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Avatar Picture Link (or browse disk)</label>
                      <input
                        type="text"
                        value={spotForm.image || ""}
                        onChange={(e) => setSpotForm({ ...spotForm, image: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white outline-none focus:border-amber-400 font-mono text-[11px] mb-2"
                        placeholder="Paste profile image URL, or drop file below"
                      />
                      
                      <div className="mt-2">
                        <AdvancedMediaDropzone
                          label="Member Spotlight Image File"
                          value={spotForm.image || ""}
                          mediaType="image"
                          error={spotFileError}
                          onClear={() => setSpotForm({ ...spotForm, image: "" })}
                          onFileSelect={(dataUrl) => {
                            setSpotForm({ ...spotForm, image: dataUrl });
                          }}
                          onError={(msg) => setSpotFileError(msg)}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={spotSaving}
                      className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-sans font-bold py-3 rounded-lg transition-colors cursor-pointer w-full text-center text-xs mt-1"
                    >
                      {renderLoadingOrLabel(
                        spotSaving,
                        "⚡ Post Circular Status Highlight",
                        spotForm.image && spotForm.image.startsWith("data:") 
                          ? "Uploading Spotlight Status Image..." 
                          : "Publishing Spotlight Status..."
                      )}
                    </button>
                  </form>

                  {/* Right Column: List & Curate Spotlight statuses */}
                  <div className="flex flex-col gap-4">
                    <h4 className="font-sans font-bold text-xs text-white uppercase tracking-wider border-b border-slate-800 pb-2 mb-1">
                      📋 Current active Spotlight stories
                    </h4>

                    <div className="flex flex-col gap-3 max-h-[380px] overflow-y-auto custom-scrollbar">
                      {memberSpotlights.length === 0 ? (
                        <p className="text-[11px] text-slate-500 font-mono text-center py-10">No status stories have been posted yet.</p>
                      ) : (
                        [...memberSpotlights].reverse().map((spot) => (
                          <div key={spot.id} className="border border-slate-850 hover:border-slate-800 rounded-xl p-3 bg-slate-900/50 flex gap-3 text-xs items-start leading-relaxed">
                            <div className="w-10 h-10 rounded-full mt-0.5 overflow-hidden border border-slate-800 shrink-0 flex items-center justify-center bg-slate-950">
                              {spot.image ? (
                                <img src={spot.image} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Users className="w-4 h-4 text-slate-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-1">
                                <div>
                                  <h5 className="font-bold text-slate-100 truncate">{spot.memberName}</h5>
                                  <p className="font-mono text-[9px] text-amber-400 uppercase tracking-wider leading-tight">{spot.roleOrVoicePart}</p>
                                </div>
                                <button
                                  onClick={() => handleDeleteSpotlight(spot.id)}
                                  className="text-red-400 hover:text-red-500 p-1 bg-red-500/5 hover:bg-red-500/20 border border-red-500/10 rounded-md cursor-pointer shrink-0 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <p className="text-slate-350 italic text-[11px] mt-1.5 leading-snug">"{spot.quoteOrHighlight}"</p>
                              <p className="font-mono text-[8px] text-slate-500 uppercase tracking-widest mt-2">
                                Created At: {new Date(spot.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>


              
              {/* SECTION: ADMIN MANAGEMENT */}
              <AddAdminSection userEmail={auth.currentUser?.email} />

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
                        value={resetCurrentPasscode || ""}
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
                        value={resetNewPasscode || ""}
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

      {/* CLOUDINARY CONNECTION DIAGNOSTIC MODAL */}
      <AnimatePresence>
        {isCloudinaryDiagOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
          >
            <motion.div 
              initial={{ y: 35, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 35, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl text-slate-100 shadow-2xl relative flex flex-col overflow-hidden max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="bg-slate-950 p-6 border-b border-slate-805 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-500/10 text-amber-400 border border-amber-500/20 p-2 rounded-xl">
                    <CloudLightning className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-sans font-bold text-base text-white">Cloudinary Connection Diagnostics</h3>
                    <p className="text-[11px] text-slate-400 font-mono">Verify Cloud Run/Vercel server credentials & end-to-end handshake</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsCloudinaryDiagOpen(false);
                    setCloudinaryDiagStatus('idle');
                    setCloudinaryDiagError(null);
                    setCloudinaryDiagReport(null);
                  }}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white p-2 rounded-xl cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 text-xs sm:text-sm">
                
                {/* Intro / Disclaimer */}
                <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-850 space-y-2">
                  <p className="text-slate-300 leading-relaxed text-xs">
                    This utility triggers an ephemeral test connection by uploading a 1x1 transparent placeholder image to your configured Cloudinary account. To prevent cluttering, the asset is immediately destroyed as soon as the test completes.
                  </p>
                </div>

                {/* Configuration Checklist */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-semibold">Server-Side Credentials Mask</h4>
                  <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex flex-col gap-1">
                      <span className="text-[9px] text-slate-500 uppercase tracking-wider">Cloud Name</span>
                      <span className="text-amber-500 truncate">{cloudinaryDiagReport?.cloudName || "Checking..."}</span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex flex-col gap-1">
                      <span className="text-[9px] text-slate-500 uppercase tracking-wider">API Key</span>
                      <span className="text-slate-300 truncate">{cloudinaryDiagReport?.apiKey || "••••••••••••"}</span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex flex-col gap-1 col-span-2">
                      <span className="text-[9px] text-slate-500 uppercase tracking-wider">API Secret</span>
                      <span className="text-slate-400 truncate">{cloudinaryDiagReport?.apiSecret || "••••••••••••••••••••••••••••••••"}</span>
                    </div>
                  </div>
                </div>

                {/* Live Diagnostic Status Area */}
                {cloudinaryDiagStatus !== 'idle' && (
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-semibold">Test Progression Logs</h4>
                    
                    {cloudinaryDiagStatus === 'testing' && (
                      <div className="bg-slate-950 p-4 rounded-2xl border border-blue-500/10 flex items-center gap-3 animate-pulse">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                        <span className="text-blue-400 font-medium">Running diagnostic test upload... please wait</span>
                      </div>
                    )}

                    {cloudinaryDiagStatus === 'success' && (
                      <div className="bg-slate-950/80 p-5 rounded-2xl border border-emerald-500/20 space-y-4">
                        <div className="flex items-center gap-2.5 text-emerald-400 font-bold">
                          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                          <span>Handshake Confirmed - Connection Healthy!</span>
                        </div>
                        <div className="border-t border-slate-900 pt-3 space-y-2 font-mono text-[11px] text-slate-400">
                          <div className="flex justify-between">
                            <span>Diagnostic Status:</span>
                            <span className="text-emerald-500 font-semibold">SUCCESS</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Latency Time:</span>
                            <span className="text-slate-200">{cloudinaryDiagReport?.uploadTimeMs}ms</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Secure Asset URL:</span>
                            <span className="text-slate-400 truncate max-w-[240px] text-right" title={cloudinaryDiagReport?.uploadedUrl}>{cloudinaryDiagReport?.uploadedUrl}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Non-Persistent Cleanup:</span>
                            <span className="text-sky-400 font-semibold">DELETED ({cloudinaryDiagReport?.deletionStatus})</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Custom env variables:</span>
                            <span className={cloudinaryDiagReport?.isUsingCustomCredentials ? "text-amber-500" : "text-slate-500"}>
                              {cloudinaryDiagReport?.isUsingCustomCredentials ? "Yes (Using Custom Env)" : "No (Using Demo Credentials)"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {cloudinaryDiagStatus === 'failed' && (
                      <div className="bg-slate-950/80 p-5 rounded-2xl border border-rose-500/20 space-y-4">
                        <div className="flex items-center gap-2.5 text-rose-400 font-bold">
                          <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0" />
                          <span>Handshake Failed</span>
                        </div>
                        <p className="text-xs text-rose-300 font-mono bg-rose-950/20 p-3 rounded-xl border border-rose-500/10">
                          {cloudinaryDiagError}
                        </p>
                        
                        <div className="border-t border-slate-900 pt-3 space-y-2">
                          <h5 className="text-[10px] font-mono text-slate-450 uppercase tracking-wider font-semibold">Recommended Troubleshooting Steps:</h5>
                          <ul className="list-disc list-inside text-xs text-slate-400 space-y-1 pl-1">
                            <li>Check if <code className="text-amber-500 bg-slate-900 px-1 py-0.5 rounded">CLOUDINARY_URL</code> or individual credentials are set properly in settings.</li>
                            <li>Verify your credentials don't contain typos or trailing spaces.</li>
                            <li>Ensure server has been restarted since credentials were added.</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* Modal Footer */}
              <div className="bg-slate-950 p-5 border-t border-slate-805 flex justify-between items-center">
                <span className="text-[10px] text-slate-550 font-mono">Ambassador Choral Missions</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCloudinaryDiagOpen(false);
                      setCloudinaryDiagStatus('idle');
                      setCloudinaryDiagError(null);
                      setCloudinaryDiagReport(null);
                    }}
                    className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    disabled={cloudinaryDiagStatus === 'testing'}
                    onClick={handleRunCloudinaryDiagnostics}
                    className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-450 hover:to-amber-550 text-slate-950 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${cloudinaryDiagStatus === 'testing' ? 'animate-spin' : ''}`} />
                    <span>{cloudinaryDiagStatus === 'testing' ? 'Testing...' : cloudinaryDiagStatus === 'idle' ? 'Run Test Upload' : 'Re-run Diagnostic'}</span>
                  </button>
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GITHUB WEBHOOKS GUIDING MODAL */}
      <AnimatePresence>
        {isGitWebhookModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
          >
            <motion.div 
              initial={{ y: 35, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 35, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl text-slate-100 shadow-2xl relative flex flex-col overflow-hidden max-h-[90vh]"
            >
              
              {/* Modal Header */}
              <div className="bg-slate-950 p-6 border-b border-slate-805 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-500/10 text-amber-400 p-2.5 rounded-xl border border-amber-500/20">
                    <svg className="w-6 h-6 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold font-sans text-white">GitHub Webhooks Installer</h3>
                    <p className="text-xs text-slate-400 font-mono">Continuous Deployment & Production Synchronization</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsGitWebhookModalOpen(false)}
                  className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-full cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Progress Steps Indicator */}
              <div className="bg-slate-900 border-b border-slate-800/80 px-6 py-4 flex items-center justify-between text-xs font-mono">
                <button 
                  onClick={() => setGitActiveStep(1)}
                  className={`flex items-center gap-2 cursor-pointer pb-1 border-b-2 transition-all ${gitActiveStep === 1 ? 'border-amber-500 text-amber-400 font-bold' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                >
                  <span>[ Step 01 ]</span> <span className="font-sans">Payload Specs</span>
                </button>
                <div className="text-slate-700 font-sans font-bold">➔</div>
                <button 
                  onClick={() => setGitActiveStep(2)}
                  className={`flex items-center gap-2 cursor-pointer pb-1 border-b-2 transition-all ${gitActiveStep === 2 ? 'border-amber-500 text-amber-400 font-bold' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                >
                  <span>[ Step 02 ]</span> <span className="font-sans">GitHub Side</span>
                </button>
                <div className="text-slate-700 font-sans font-bold">➔</div>
                <button 
                  onClick={() => setGitActiveStep(3)}
                  className={`flex items-center gap-2 cursor-pointer pb-1 border-b-2 transition-all ${gitActiveStep === 3 ? 'border-amber-500 text-amber-400 font-bold' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                >
                  <span>[ Step 03 ]</span> <span className="font-sans">Sync Trigger</span>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 md:p-8 flex-1 overflow-y-auto space-y-6">
                
                {gitActiveStep === 1 && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-2xl flex gap-3 text-slate-300 text-xs font-sans leading-relaxed">
                      <HelpCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        These copyable credentials must be configured inside your GitHub repository settings. Webhooks inform the server of code updates so changes made locally or on GitHub reflect on the live website immediately!
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-semibold">1. Webhook Payload Target URL</span>
                          <button
                            type="button"
                            onClick={() => {
                              const dummyUrl = `${window.location.origin}/api/webhooks/github`;
                              navigator.clipboard.writeText(dummyUrl);
                              setIsPayloadCopied(true);
                              setTimeout(() => setIsPayloadCopied(false), 2000);
                            }}
                            className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer font-bold font-sans"
                          >
                            {isPayloadCopied ? <span className="text-emerald-400 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Copied!</span> : <span className="flex items-center gap-1"><Copy className="w-3 h-3" /> Copy URL</span>}
                          </button>
                        </div>
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 font-mono text-xs text-amber-500 select-all break-all pr-12 relative shadow-inner">
                          {window.location.origin}/api/webhooks/github
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-semibold">2. Cryptographic Secret Token</span>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                const newSec = "KachambaSync_Sec_" + Math.floor(100000 + Math.random() * 900000);
                                setGitWebhookSecret(newSec);
                              }}
                              className="text-[10px] text-slate-450 hover:text-white flex items-center gap-1 cursor-pointer font-mono"
                              title="Regenerate a random secret token"
                            >
                              <RefreshCw className="w-2.5 h-2.5" /> Reset Token
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(gitWebhookSecret);
                                setIsSecretCopied(true);
                                setTimeout(() => setIsSecretCopied(false), 2000);
                              }}
                              className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer font-bold font-sans"
                            >
                              {isSecretCopied ? <span className="text-emerald-400 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Copied!</span> : <span className="flex items-center gap-1"><Copy className="w-3 h-3" /> Copy Token</span>}
                            </button>
                          </div>
                        </div>
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 font-mono text-xs text-slate-300 select-all pr-12 relative shadow-inner flex items-center gap-2">
                          <Key className="w-3.5 h-3.5 text-slate-500" />
                          <span>{gitWebhookSecret}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {gitActiveStep === 2 && (
                  <div className="space-y-4 animate-in fade-in duration-300 text-xs sm:text-sm font-sans">
                    <h4 className="text-sm font-bold text-slate-200">Instructions (on GitHub.com):</h4>
                    <ol className="list-decimal list-inside space-y-3.5 text-slate-350 bg-slate-950/40 p-5 rounded-2xl border border-slate-850">
                      <li>Log in to your <b>GitHub Account</b> and navigate to your code repository.</li>
                      <li>Click the <span className="text-amber-400 font-semibold">Settings</span> tab near the top right of the repo bar.</li>
                      <li>Select <span className="text-amber-400 font-semibold">Webhooks</span> from the left-hand navigation column.</li>
                      <li>Click the green <span className="text-white bg-slate-800 px-1.5 py-0.5 rounded font-bold border border-slate-700">Add webhook</span> button in the upper right.</li>
                      <li>In the <span className="text-slate-200 font-semibold">Payload URL</span> input cell, paste the <i>Payload URL</i> from <b>Step 1</b>.</li>
                      <li>Set <span className="text-slate-205 font-semibold">Content type</span> option to <b>application/json</b>.</li>
                      <li>In the <span className="text-slate-200 font-semibold">Secret</span> input cell, paste the <i>Secret Token</i> from <b>Step 1</b>.</li>
                      <li>Keep <span className="text-slate-200">SSL verification</span> turned as <b>enabled</b>.</li>
                      <li>Select <span className="text-amber-400 font-semibold">Just the push event</span> or choose individual releases.</li>
                      <li>Click the green <span className="bg-emerald-650/40 border border-emerald-500/35 text-emerald-400 px-2 py-1 rounded font-bold">Add webhook</span> button at the bottom.</li>
                    </ol>
                  </div>
                )}

                {gitActiveStep === 3 && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="space-y-3 text-center">
                      <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-full border border-emerald-500/20 w-fit mx-auto mb-2">
                        <CheckCircle className="w-8 h-8" />
                      </div>
                      <h4 className="text-base font-bold text-white font-sans">Active Webhook Verification Ready!</h4>
                      <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                        Once you save the webhook, GitHub sends a test secure ping signature payload to our endpoint to confirm the handshake is healthy. 
                      </p>
                    </div>

                    <div className="bg-slate-950 rounded-xl p-4 border border-slate-850 font-mono text-center text-xs text-slate-500 space-y-2 max-w-sm mx-auto shadow-inner">
                      <div className="flex items-center justify-between text-[10px] text-slate-450 uppercase tracking-widest border-b border-slate-900 pb-1.5">
                        <span>HANDSHAKE STATUS</span>
                        <span className="text-emerald-500 font-sans font-black flex items-center gap-1 ml-2">● LIVE READY</span>
                      </div>
                      <p className="text-[10px] text-slate-400 text-left mt-2">
                        Pushing commits to branch <span className="text-amber-500">"main"</span> will trigger automated builds instantly. The website matches this environment exactly.
                      </p>
                    </div>
                  </div>
                )}

              </div>

              {/* Modal Footer Controls */}
              <div className="bg-slate-950 p-5 border-t border-slate-805 flex justify-between items-center">
                <button
                  type="button"
                  disabled={gitActiveStep === 1}
                  onClick={() => setGitActiveStep(prev => prev - 1)}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 rounded-xl text-xs text-slate-300 font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  Previous Step
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsGitWebhookModalOpen(false)}
                    className="px-4 py-2 bg-slate-900/60 hover:bg-slate-800 text-slate-450 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  >
                    Close Setup Guide
                  </button>
                  {gitActiveStep < 3 ? (
                    <button
                      type="button"
                      onClick={() => setGitActiveStep(prev => prev + 1)}
                      className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-450 hover:to-amber-550 text-slate-950 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>Next Step</span>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsGitWebhookModalOpen(false)}
                      className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-450 hover:to-emerald-550 text-slate-950 rounded-xl text-xs font-extrabold transition-all cursor-pointer"
                    >
                      Complete & Exit
                    </button>
                  )}
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PRINT PREVIEW OVERLAY / COMPENDIUM ARRANGER STUDIO */}
      <AnimatePresence>
        {isPrintPreviewOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-99 flex flex-col bg-slate-950/95 backdrop-blur-lg overflow-hidden text-white"
          >
            {/* Top Banner Control Header */}
            <div className="bg-slate-900 border-b border-slate-850 py-4 px-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-amber-500/10 text-amber-400 border border-amber-500/30 p-2 rounded-xl">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-base text-white">Live Print Preview & Arranger Studio</h3>
                  <p className="text-[11px] text-slate-400 font-mono">Verify logo alignments, fonts, rearrange schedules, and toggle visible columns before generating print layouts.</p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                  }}
                  className="flex-1 md:flex-none bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-sans font-extrabold text-[11px] tracking-wider py-2.5 px-5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 uppercase"
                >
                  <span>Print Itinerary (PDF)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintPreviewOpen(false)}
                  className="flex-1 md:flex-none bg-slate-805 hover:bg-slate-700 text-slate-200 font-sans font-bold text-[11px] py-2.5 px-4 rounded-lg transition-all cursor-pointer uppercase border border-slate-700 hover:border-transparent"
                >
                  Close Studio
                </button>
              </div>
            </div>

            {/* Main Scrolling Content area containing Left Sidebar Controls & Right Live Sheet */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              
              {/* Left Side: Setup Panels */}
              <div className="w-full lg:w-[360px] border-r border-slate-850 p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6 shrink-0 h-1/2 lg:h-full bg-slate-900/60">
                
                {/* Panel 1: Document Texts */}
                <div className="flex flex-col gap-3">
                  <h4 className="font-sans font-bold text-xs text-slate-350 uppercase tracking-widest border-b border-slate-800 pb-1.5">
                    📄 Document Titles
                  </h4>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Header Title</label>
                    <input
                      type="text"
                      value={printHeaderText || ""}
                      onChange={(e) => setPrintHeaderText(e.target.value.toUpperCase())}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white outline-none focus:border-amber-400 text-xs font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Document Subtitle Text</label>
                    <input
                      type="text"
                      value={printSubText || ""}
                      onChange={(e) => setPrintSubText(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white outline-none focus:border-amber-400 text-xs font-sans"
                    />
                  </div>
                </div>

                {/* Panel 2: Logo Alignment & Theme */}
                <div className="flex flex-col gap-3.5">
                  <h4 className="font-sans font-bold text-xs text-slate-350 uppercase tracking-widest border-b border-slate-800 pb-1.5">
                    🎨 Layout & Theme Styling
                  </h4>
                  
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1.5">SDA Logo Placement</label>
                    <div className="grid grid-cols-3 gap-1">
                      {(['left', 'center', 'right'] as const).map((pos) => (
                        <button
                          key={pos} type="button"
                          onClick={() => setLogoPosition(pos)}
                          className={`py-1 px-2 rounded font-sans text-[10px] font-bold uppercase transition-colors cursor-pointer border ${
                            logoPosition === pos 
                              ? "bg-amber-400/20 text-amber-400 border-amber-500/30" 
                              : "bg-slate-950 border-slate-850 hover:bg-slate-900 text-slate-400"
                          }`}
                        >
                          {pos}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1.5">Print Font Combinations</label>
                    <div className="flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPrintFontTheme('traditional')}
                        className={`p-2 rounded-lg text-left transition-colors cursor-pointer border text-xs leading-tight ${
                          printFontTheme === 'traditional'
                            ? "bg-amber-400/20 border-amber-500/30 text-white font-bold bg-amber-500/5"
                            : "bg-slate-950 border-slate-850 hover:bg-slate-900 text-slate-350"
                        }`}
                      >
                        <span className="font-sans block text-[10px] text-amber-400 uppercase tracking-wider font-extrabold mb-0.5">SDA Traditional Classic</span>
                        <span className="text-[11px] text-slate-400 font-sans block leading-snug">Archivo Black titles paired with Glacial Indifference body text</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrintFontTheme('modern')}
                        className={`p-2 rounded-lg text-left transition-colors cursor-pointer border text-xs leading-tight ${
                          printFontTheme === 'modern'
                            ? "bg-amber-400/20 border-amber-500/30 text-white font-bold bg-amber-500/5"
                            : "bg-slate-950 border-slate-850 hover:bg-slate-900 text-slate-350"
                        }`}
                      >
                        <span className="font-sans block text-[10px] text-amber-400 uppercase tracking-wider font-extrabold mb-0.5">Contemporary Swiss</span>
                        <span className="text-[11px] text-slate-400 font-sans block leading-snug">Inter Display headings paired with JetBrains Mono hour marks</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrintFontTheme('bold-editorial')}
                        className={`p-2 rounded-lg text-left transition-colors cursor-pointer border text-xs leading-tight ${
                          printFontTheme === 'bold-editorial'
                            ? "bg-amber-400/20 border-amber-500/30 text-white font-bold bg-amber-500/5"
                            : "bg-slate-950 border-slate-850 hover:bg-slate-900 text-slate-350"
                        }`}
                      >
                        <span className="font-sans block text-[10px] text-amber-400 uppercase tracking-wider font-extrabold mb-0.5">Bold Editorial Bulletin</span>
                        <span className="text-[11px] text-slate-400 font-sans block leading-snug">Bold serif typography pairing with spacious cell blocks</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Panel 3: Toggle Columns */}
                <div className="flex flex-col gap-3">
                  <h4 className="font-sans font-bold text-xs text-slate-350 uppercase tracking-widest border-b border-slate-800 pb-1.5">
                    Toggle Page Content Columns
                  </h4>
                  <div className="flex flex-col gap-2 bg-slate-950/50 p-3 rounded-lg border border-slate-850">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox" id="ptoggle-host" checked={showHostColumn}
                        onChange={(e) => setShowHostColumn(e.target.checked)}
                        className="w-3.5 h-3.5 text-amber-500 bg-slate-900 border-slate-800 accent-amber-550 cursor-pointer"
                      />
                      <label htmlFor="ptoggle-host" className="text-[11px] text-slate-205 cursor-pointer select-none">Show Host sponsor info</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox" id="ptoggle-time" checked={showTimeColumn}
                        onChange={(e) => setShowTimeColumn(e.target.checked)}
                        className="w-3.5 h-3.5 text-amber-500 bg-slate-900 border-slate-800 accent-amber-550 cursor-pointer"
                      />
                      <label htmlFor="ptoggle-time" className="text-[11px] text-slate-205 cursor-pointer select-none">Show Hour of performance</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox" id="ptoggle-notes" checked={showNotesColumn}
                        onChange={(e) => setShowNotesColumn(e.target.checked)}
                        className="w-3.5 h-3.5 text-amber-500 bg-slate-900 border-slate-800 accent-amber-550 cursor-pointer"
                      />
                      <label htmlFor="ptoggle-notes" className="text-[11px] text-slate-205 cursor-pointer select-none">Show Directors schedule notes</label>
                    </div>
                  </div>
                </div>

                {/* Panel 4: Quick Order Arrangement */}
                <div className="flex flex-col gap-3">
                  <h4 className="font-sans font-bold text-xs text-slate-350 uppercase tracking-widest border-b border-slate-800 pb-1.5">
                    ⏳ Chronological sorting
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const sorted = [...customSortedItinerary].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                        setCustomSortedItinerary(sorted);
                      }}
                      className="py-1.5 bg-slate-950 border border-slate-850 hover:bg-slate-900 rounded font-mono text-[10px] text-slate-200 transition-colors cursor-pointer"
                    >
                      Chronological
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const sorted = [...customSortedItinerary].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                        setCustomSortedItinerary(sorted);
                      }}
                      className="py-1.5 bg-slate-950 border border-slate-850 hover:bg-slate-900 rounded font-mono text-[10px] text-slate-200 transition-colors cursor-pointer"
                    >
                      Reverse Chrono
                    </button>
                  </div>
                </div>

              </div>

              {/* Right Side: Virtual Interactive Paper Preview */}
              <div className="flex-1 overflow-auto bg-slate-950 py-10 px-4 md:px-8 flex justify-center custom-scrollbar h-1/2 lg:h-full relative select-none">
                
                {/* Virtual Letterhead Printable sheet */}
                <div className="print-preview-printable-area w-full max-w-[21cm] bg-white text-black shadow-2xl p-10 md:p-14 min-h-[29.7cm] flex flex-col relative" style={{ boxSizing: 'border-box' }}>
                  
                  {/* Header alignment block */}
                  <div className={`flex items-center gap-4 border-b-2 border-slate-900 pb-4 mb-6 ${
                    logoPosition === 'center' ? 'flex-col justify-center text-center' : logoPosition === 'right' ? 'flex-row-reverse justify-between' : 'justify-start'
                  }`}>
                    {/* Logo */}
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Seventh-day_Adventist_Church_logo_svg.svg/320px-Seventh-day_Adventist_Church_logo_svg.svg.png"
                      alt="SDA Logo"
                      className="w-14 h-14 object-contain shrink-0"
                      onError={(e) => {
                        // absolute fallback in case sda-logo is not built in assets-store
                        (e.currentTarget as HTMLImageElement).src = 'https://logos-download.com/wp-content/uploads/2016/10/Seventh-day_Adventist_Church_logo_SDA.png';
                      }}
                    />
                    
                    {/* Brand Title details */}
                    <div className={`${logoPosition === 'center' ? 'text-center' : 'text-left'}`}>
                      <h1 
                        style={{ fontFamily: printFontTheme === 'traditional' ? 'Archivo Black, sans-serif' : printFontTheme === 'modern' ? 'Inter, sans-serif' : 'serif', fontWeight: 900 }}
                        className="text-base md:text-lg tracking-tight text-slate-950 uppercase leading-none"
                      >
                        {printHeaderText}
                      </h1>
                      <p className={`text-[10px] text-slate-600 font-mono tracking-wider mt-1.5 ${logoPosition === 'center' ? 'mx-auto max-w-sm' : ''}`}>
                        {printSubText}
                      </p>
                    </div>
                  </div>

                  {/* Table Itinerary list print body */}
                  {customSortedItinerary.length === 0 ? (
                    <p className="py-20 text-center text-slate-400 font-mono text-xs">No Scheduled Tours to view. Use the admin panel to plan tour events first.</p>
                  ) : (
                    <div className="w-full border-t border-slate-350">
                      {/* Table Head */}
                      <div className="grid grid-cols-12 border-b border-slate-350 py-2.5 bg-slate-50 text-[10px] font-mono uppercase tracking-widest font-bold">
                        <div className="col-span-2 text-slate-800">Date</div>
                        <div className={`col-span-3 text-slate-800`}>Event Title</div>
                        <div className="col-span-3 text-slate-800">Location</div>
                        {showHostColumn && <div className="col-span-2 text-slate-800">Host Council</div>}
                        {showTimeColumn && <div className="col-span-1 text-slate-800 text-right">Time</div>}
                        {showNotesColumn && <div className="col-span-1 text-slate-800 text-right">Notes</div>}
                      </div>

                      {/* Table Body rows */}
                      <div className="divide-y divide-slate-100 flex flex-col">
                        {customSortedItinerary.map((item, index) => {
                          const eventTime = item.time || "Sunset";
                          const eventHost = item.host || "SDA Sanctuary";
                          const formattedDate = new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                          
                          return (
                            <div key={item.id} className="grid grid-cols-12 py-3.5 items-start text-xs border-b border-slate-100 font-sans group relative hover:bg-slate-50/55">
                              <div className="col-span-2 font-mono text-[11px] text-slate-600">{formattedDate}</div>
                              <div className="col-span-3 text-slate-900 font-bold pr-2">{item.event}</div>
                              <div className="col-span-3 text-slate-600 font-mono text-[10px] tracking-tight truncate pr-2">{item.location}</div>
                              
                              {showHostColumn && (
                                <div className="col-span-2 text-slate-700 truncate pr-2">{eventHost}</div>
                              )}
                              
                              {showTimeColumn && (
                                <div className="col-span-1 text-slate-600 text-right font-mono text-[10px] pr-1">{eventTime}</div>
                              )}

                              {showNotesColumn && (
                                <div className="col-span-1 text-slate-600 italic text-[10px] text-right truncate" title={item.notes || "-"}>
                                  {item.notes || "-"}
                                </div>
                              )}

                              {/* Hover Control triggers to Rearrange Elements */}
                              <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-md shadow-md z-10">
                                <button
                                  type="button"
                                  disabled={index === 0}
                                  onClick={() => {
                                    const arr = [...customSortedItinerary];
                                    const temp = arr[index];
                                    arr[index] = arr[index-1];
                                    arr[index-1] = temp;
                                    setCustomSortedItinerary(arr);
                                  }}
                                  className="p-1 hover:bg-slate-100 text-slate-600 rounded disabled:opacity-30 cursor-pointer"
                                  title="Move Item Up"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={index === customSortedItinerary.length - 1}
                                  onClick={() => {
                                    const arr = [...customSortedItinerary];
                                    const temp = arr[index];
                                    arr[index] = arr[index+1];
                                    arr[index+1] = temp;
                                    setCustomSortedItinerary(arr);
                                  }}
                                  className="p-1 hover:bg-slate-100 text-slate-600 rounded disabled:opacity-30 cursor-pointer"
                                  title="Move Item Down"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Footer alignment info */}
                  <div className="mt-auto border-t-2 border-slate-900 pt-6 flex justify-between items-center text-[9px] font-mono text-slate-500 uppercase tracking-widest leading-loose">
                    <span>Proclaimed by Ambassador Council</span>
                    <span>{customSortedItinerary.length} Tour Services listed</span>
                    <span>SDA Kachamba Music</span>
                  </div>

                </div>

                {/* Print media css overrides style block */}
                <style>{`
                  @media print {
                    /* Hide entire layout and any other components */
                    body * {
                      visibility: hidden !important;
                    }
                    /* Render ONLY the print-preview-printable-area */
                    .print-preview-printable-area, .print-preview-printable-area * {
                      visibility: visible !important;
                      color: black !important;
                    }
                    /* Re-architect paper coordinates for absolute positioning */
                    .print-preview-printable-area {
                      position: absolute !important;
                      left: 0 !important;
                      top: 0 !important;
                      width: 100% !important;
                      height: auto !important;
                      box-shadow: none !important;
                      padding: 1.5cm !important;
                      background: white !important;
                    }
                  }
                `}</style>

              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
