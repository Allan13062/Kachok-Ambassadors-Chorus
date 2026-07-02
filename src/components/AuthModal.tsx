import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mail, Lock, User, Eye, EyeOff, X, Facebook, AlertCircle, Check, ArrowRight, Shield, Music, Loader2 } from "lucide-react";
import { auth, db } from "../lib/firebase";
import { setPersistence, browserLocalPersistence, browserSessionPersistence, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (userData: any) => void;
  theme: "dark" | "light";
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess, theme }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [voicePart, setVoicePart] = useState("Listener");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | "facebook" | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setName("");
    setVoicePart("Listener");
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (isSignUp && !name)) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const endpoint = isSignUp ? "/api/auth/signup" : "/api/auth/login";
      const payload = isSignUp ? { name, email, password, voicePart } : { email, password };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Authentication request failed.");
      }

      setSuccessMsg(isSignUp ? "Account created successfully!" : "Logged in successfully!");
      
      setTimeout(() => {
        onAuthSuccess({
          uid: data.user.uid,
          email: data.user.email,
          displayName: data.user.displayName,
          photoURL: data.user.photoURL,
          voicePart: data.user.voicePart || voicePart,
          role: data.user.role || "member"
        });
        onClose();
        resetForm();
      }, 1500);

    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected auth error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = async (providerName: "google" | "facebook") => {
    setLoading(true);
    setSocialLoading(providerName);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (providerName === "google") {
        try {
          await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
          const provider = new GoogleAuthProvider();
          const userCredential = await signInWithPopup(auth, provider);
          
          // Save user to Firestore if they don't exist
          const userRef = doc(db, "users", userCredential.user.uid);
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              uid: userCredential.user.uid,
              email: userCredential.user.email,
              name: userCredential.user.displayName,
              voicePart: "Listener",
              createdAt: new Date().toISOString(),
            });
          }

          // Sync with server database
          let voicePartVal = "Listener";
          let roleVal = "member";
          try {
            const syncRes = await fetch("/api/auth/social", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                provider: "google",
                email: userCredential.user.email,
                name: userCredential.user.displayName
              })
            });
            if (syncRes.ok) {
              const syncData = await syncRes.json();
              if (syncData.user) {
                voicePartVal = syncData.user.voicePart || "Listener";
                roleVal = syncData.user.role || "member";
              }
            }
          } catch (syncErr) {
            console.warn("Failed to sync social login with backend database:", syncErr);
          }

          setSuccessMsg(`Successfully authenticated via Google!`);
          setTimeout(() => {
            onAuthSuccess({
              uid: userCredential.user.uid,
              email: userCredential.user.email,
              displayName: userCredential.user.displayName,
              photoURL: userCredential.user.photoURL,
              voicePart: voicePartVal,
              role: roleVal
            });
            onClose();
            resetForm();
          }, 1500);
        } catch (authErr: any) {
          console.warn("Direct Firebase Google Login failed, checking origin restriction...", authErr);
          if (
            authErr.code === "auth/unauthorized-domain" || 
            authErr.message?.includes("unauthorized-domain") || 
            authErr.message?.includes("unauthorized")
          ) {
            throw new Error("Standard Google Sign-In requires adding 'kachambachorus.online' to your Firebase Console Authorized Domains. To log in instantly on this preview, please create an Email & Password account below!");
          } else {
            throw authErr;
          }
        }
      } else {
        setErrorMsg("Facebook login is not implemented yet.");
      }
    } catch (err: any) {
      if (err.code === "auth/popup-closed-by-user") {
        setErrorMsg("Google Sign-In was cancelled.");
      } else {
        setErrorMsg(err.message || `Failed to connect to ${providerName}`);
      }
    } finally {
      setLoading(false);
      setSocialLoading(null);
    }
  };

  if (!isOpen) return null;

  const isDark = theme === "dark";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Background Dim Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
      />

      {/* Main Card */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 16 }}
        transition={{ type: "spring", damping: 25, stiffness: 220 }}
        className={`w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative border z-10 font-sans ${
          isDark 
            ? "bg-slate-900 border-slate-800 text-white" 
            : "bg-white border-slate-200 text-slate-900"
        }`}
      >
        {/* Header Section */}
        <div className={`p-6 pb-4 border-b flex justify-between items-center ${
          isDark ? "bg-slate-950/40 border-slate-800" : "bg-slate-50 border-slate-100"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
              isDark 
                ? "bg-amber-500/10 border-amber-500/20 text-amber-500" 
                : "bg-amber-50 border-amber-200 text-amber-600"
            }`}>
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                {isSignUp ? "Create Account" : "Sign In to Portal"}
              </h3>
              <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                {isSignUp ? "Join the Kachamba Chorus community" : "Access your secure chorus desk"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close authentication modal"
            className={`p-2 rounded-lg transition-all ${
              isDark 
                ? "text-slate-400 hover:text-white hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-slate-750 outline-none" 
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-350 outline-none"
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Content Container */}
        <div className="p-6">
          
          {/* Sign In vs Sign Up Tab Controller */}
          <div className={`flex rounded-xl p-1 mb-6 border relative ${
            isDark ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-200"
          }`}>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setIsSignUp(false);
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all relative z-10 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                !isSignUp 
                  ? "text-slate-950" 
                  : isDark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {!isSignUp && (
                <motion.div
                  layoutId="activeTabBackground"
                  className="absolute inset-0 bg-amber-500 rounded-lg shadow-sm -z-10"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              Sign In
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setIsSignUp(true);
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all relative z-10 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                isSignUp 
                  ? "text-slate-950" 
                  : isDark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {isSignUp && (
                <motion.div
                  layoutId="activeTabBackground"
                  className="absolute inset-0 bg-amber-500 rounded-lg shadow-sm -z-10"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              Sign Up
            </button>
          </div>

          <AnimatePresence mode="wait">
            {successMsg ? (
              <motion.div
                key="success-container"
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-6 rounded-2xl text-center flex flex-col items-center justify-center gap-3 my-4"
              >
                <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center animate-bounce">
                  <Check className="w-6 h-6 text-emerald-400" />
                </div>
                <h4 className="font-bold text-base text-white">{successMsg}</h4>
                <p className="text-slate-400 text-xs">Preparing your personal secure session...</p>
              </motion.div>
            ) : (
              <motion.div
                key="form-container"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                {/* Social Logins Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {/* Google Button */}
                  <button
                    type="button"
                    onClick={() => handleSocialAuth("google")}
                    disabled={loading}
                    className={`flex items-center justify-center gap-2 py-2 px-3 border rounded-xl text-xs font-bold cursor-pointer transition-all duration-200 ease-in-out outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                      isDark 
                        ? "bg-slate-950 hover:bg-slate-850 border-slate-800 text-slate-300 hover:text-white disabled:bg-slate-950/40 disabled:text-slate-600" 
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 disabled:bg-slate-50/40 disabled:text-slate-400"
                    }`}
                  >
                    {socialLoading === "google" ? (
                      <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                    ) : (
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.275 1.564-1.88 4.587-6.887 4.587-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.024 5.047 1.926l3.23-3.11c-2.074-1.928-4.912-3.111-8.277-3.111-6.627 0-12 5.373-12 11.999s5.373 12 12 12c6.914 0 11.512-4.856 11.512-11.727 0-.79-.085-1.391-.188-1.99h-11.334z"/>
                      </svg>
                    )}
                    <span>{socialLoading === "google" ? "Connecting..." : "Google"}</span>
                  </button>

                  {/* Facebook Button */}
                  <button
                    type="button"
                    onClick={() => handleSocialAuth("facebook")}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 py-2 px-3 border border-blue-600/20 rounded-xl text-xs font-bold cursor-pointer transition-all duration-200 ease-in-out outline-none focus-visible:ring-2 focus-visible:ring-amber-500 bg-blue-600/10 hover:bg-blue-600/15 text-blue-500 disabled:opacity-55"
                  >
                    {socialLoading === "facebook" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Facebook className="w-4 h-4 shrink-0 fill-current" />
                    )}
                    <span>{socialLoading === "facebook" ? "Connecting..." : "Facebook"}</span>
                  </button>
                </div>

                {/* Separator Divider */}
                <div className="flex items-center gap-3 mb-6">
                  <div className={`h-[1px] flex-1 ${isDark ? "bg-slate-800" : "bg-slate-200"}`}></div>
                  <span className={`text-[10px] font-mono uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>Or continue with</span>
                  <div className={`h-[1px] flex-1 ${isDark ? "bg-slate-800" : "bg-slate-200"}`}></div>
                </div>

                {/* Main Form Inputs */}
                <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
                  
                  {/* SignUp Additional Form Fields */}
                  <AnimatePresence initial={false}>
                    {isSignUp && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col gap-4 overflow-hidden"
                      >
                        <div>
                          <label className={`block text-[10px] font-mono uppercase tracking-wider mb-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Full Name</label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                              type="text"
                              required
                              disabled={loading}
                              value={name || ""}
                              onChange={(e) => setName(e.target.value)}
                              className={`w-full pl-9 pr-4 py-2.5 rounded-xl border outline-none text-xs transition-all duration-200 ease-in-out ${
                                isDark 
                                  ? "bg-slate-950 border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-white disabled:bg-slate-950/50 disabled:text-slate-500" 
                                  : "bg-slate-50 border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-slate-800 disabled:bg-slate-50/50 disabled:text-slate-400"
                              }`}
                              placeholder="Your full name"
                            />
                          </div>
                        </div>

                        <div>
                          <label className={`block text-[10px] font-mono uppercase tracking-wider mb-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Voice Part Preference</label>
                          <select
                            value={voicePart || "Listener"}
                            disabled={loading}
                            onChange={(e) => setVoicePart(e.target.value)}
                            className={`w-full p-2.5 rounded-xl border outline-none text-xs transition-all duration-200 ease-in-out cursor-pointer appearance-none ${
                              isDark 
                                ? "bg-slate-950 border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-white disabled:bg-slate-950/50" 
                                : "bg-slate-50 border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-slate-800 disabled:bg-slate-50/50"
                            }`}
                          >
                            <option value="Soprano">Soprano (High female vocal)</option>
                            <option value="Alto">Alto (Deep female vocal)</option>
                            <option value="Tenor">Tenor (High male vocal)</option>
                            <option value="Bass">Bass (Deep male vocal)</option>
                            <option value="Listener">Supporter / Joyful Listener</option>
                          </select>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Email Field */}
                  <div>
                    <label className={`block text-[10px] font-mono uppercase tracking-wider mb-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        required
                        disabled={loading}
                        value={email || ""}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full pl-9 pr-4 py-2.5 rounded-xl border outline-none text-xs transition-all duration-200 ease-in-out ${
                          isDark 
                            ? "bg-slate-950 border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-white disabled:bg-slate-950/50" 
                            : "bg-slate-50 border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-slate-800 disabled:bg-slate-50/50"
                        }`}
                        placeholder="yourname@domain.com"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <label className={`block text-[10px] font-mono uppercase tracking-wider mb-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Secure Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        disabled={loading}
                        value={password || ""}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`w-full pl-9 pr-10 py-2.5 rounded-xl border outline-none text-xs transition-all duration-200 ease-in-out ${
                          isDark 
                            ? "bg-slate-950 border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-white disabled:bg-slate-950/50" 
                            : "bg-slate-50 border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-slate-800 disabled:bg-slate-50/50"
                        }`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors p-1 rounded hover:text-slate-350 cursor-pointer focus-visible:ring-1 focus-visible:ring-amber-500 outline-none`}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me Checkbox */}
                  <div className="flex items-center gap-2 mt-1 px-1">
                    <input 
                      type="checkbox" 
                      id="rememberMe" 
                      checked={rememberMe}
                      disabled={loading}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-amber-500 focus:ring-amber-500 transition-colors cursor-pointer"
                    />
                    <label htmlFor="rememberMe" className={`text-xs select-none cursor-pointer ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      Remember my login session
                    </label>
                  </div>

                  {/* Error Notification Alert */}
                  {errorMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs flex gap-2.5 items-start"
                    >
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{errorMsg}</span>
                    </motion.div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-amber-500/10 transition-all duration-200 ease-in-out cursor-pointer mt-2 flex items-center justify-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    ) : (
                      <>
                        <span>{isSignUp ? "Create Ambassador Account" : "Access Personal Portal"}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer Practice Footnote */}
          <div className="mt-6 text-center border-t border-dashed border-slate-200 dark:border-slate-800/60 pt-4">
            <span className={`text-[10px] font-mono flex items-center justify-center gap-1.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              <Music className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              Sabbaths @ 2:30 PM • Kachok SDA Church
            </span>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
