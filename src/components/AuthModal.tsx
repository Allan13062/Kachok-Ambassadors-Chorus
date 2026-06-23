import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mail, Lock, User, Eye, EyeOff, X, Facebook, AlertCircle, Check, ArrowRight, Shield, Music, Sparkles } from "lucide-react";
import { auth, db } from "../lib/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, updateProfile, setPersistence, browserLocalPersistence, browserSessionPersistence } from "firebase/auth";
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

          setSuccessMsg(`Successfully authenticated via Google!`);
          setTimeout(() => {
            onAuthSuccess({
              uid: userCredential.user.uid,
              email: userCredential.user.email,
              name: userCredential.user.displayName,
            });
            onClose();
            resetForm();
          }, 1500);
        } catch (authErr: any) {
          console.warn("Direct Firebase Google Login failed, checking origin restriction...", authErr);
          // If we hit an unauthorized domain error, gracefully explain the workaround
          if (
            authErr.code === "auth/unauthorized-domain" || 
            authErr.message?.includes("unauthorized-domain") || 
            authErr.message?.includes("unauthorized")
          ) {
            throw new Error("Firebase Authentication Error (auth/unauthorized-domain): Standard Google Sign-In requires adding 'kachambachorus.online' to your Firebase Console Authorized Domains list. To log in instantly on this custom domain, please create a free account below using an Email & Password!");
          } else {
            throw authErr;
          }
        }
      } else {
        setErrorMsg("Facebook login is not implemented yet.");
      }
    } catch (err: any) {
      if (err.code === "auth/popup-closed-by-user") {
        setErrorMsg("Google Sign-In was cancelled by the user.");
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
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
      />

      {/* Main Card */}
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 15 }}
        transition={{ type: "spring", damping: 25, stiffness: 220 }}
        className={`w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative border z-10 font-sans ${
          isDark 
            ? "bg-slate-900 border-slate-800 text-white" 
            : "bg-white border-slate-200 text-slate-900"
        }`}
      >
        {/* Banner with Logo icon */}
        <div className={`p-6 pb-4 border-b flex justify-between items-center ${
          isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-100"
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                {isSignUp ? "Create Ambassador Account" : "Sign In to Portal"}
              </h3>
              <p className={`text-[11px] font-medium leading-none mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                {isSignUp ? "Connect with the Chorus community" : "Access your member benefits"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sliding form content area */}
        <div className="p-6">
          
          {/* Sign In vs Sign Up Tabs slider */}
          <div className={`flex rounded-xl p-1 mb-6 border ${
            isDark ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-200"
          }`}>
            <button
              onClick={() => {
                setIsSignUp(false);
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all correlation relative cursor-pointer ${
                !isSignUp 
                  ? "bg-amber-500 text-slate-950 shadow" 
                  : isDark ? "text-slate-450 hover:text-white" : "text-slate-500 hover:text-slate-850"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsSignUp(true);
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all relative cursor-pointer ${
                isSignUp 
                  ? "bg-amber-500 text-slate-950 shadow" 
                  : isDark ? "text-slate-450 hover:text-white" : "text-slate-500 hover:text-slate-850"
              }`}
            >
              Sign Up
            </button>
          </div>

          <AnimatePresence mode="wait">
            {successMsg ? (
              <motion.div
                key="success-container"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-6 rounded-xl text-center flex flex-col items-center justify-center gap-3 my-4"
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
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
              >
                {/* Social Logins Row */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {/* Google */}
                  <button
                    type="button"
                    onClick={() => handleSocialAuth("google")}
                    disabled={loading}
                    className={`flex items-center justify-center gap-2 py-2 px-3 border rounded-xl text-xs font-bold cursor-pointer transition-all ${
                      isDark 
                        ? "bg-slate-950 hover:bg-slate-850 border-slate-800 text-slate-300 hover:text-white" 
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                    }`}
                  >
                    {socialLoading === "google" ? (
                      <div className="w-4 h-4 rounded-full border-2 border-slate-400 border-t-slate-700 animate-spin"></div>
                    ) : (
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.275 1.564-1.88 4.587-6.887 4.587-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.024 5.047 1.926l3.23-3.11c-2.074-1.928-4.912-3.111-8.277-3.111-6.627 0-12 5.373-12 11.999s5.373 12 12 12c6.914 0 11.512-4.856 11.512-11.727 0-.79-.085-1.391-.188-1.99h-11.334z"/>
                      </svg>
                    )}
                    <span>{socialLoading === "google" ? "Connecting..." : "Google"}</span>
                  </button>

                  {/* Facebook */}
                  <button
                    type="button"
                    onClick={() => handleSocialAuth("facebook")}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 py-2 px-3 border border-[#1877F2]/20 rounded-xl text-xs font-bold cursor-pointer transition-all bg-[#1877F2]/10 hover:bg-[#1877F2]/15 text-[#1877F2]"
                  >
                    {socialLoading === "facebook" ? (
                      <div className="w-4 h-4 rounded-full border-2 border-[#1877F2]/40 border-t-[#1877F2] animate-spin"></div>
                    ) : (
                      <Facebook className="w-4 h-4 shrink-0 fill-current" />
                    )}
                    <span>{socialLoading === "facebook" ? "Connecting..." : "Facebook"}</span>
                  </button>
                </div>

                {/* Separator line */}
                <div className="flex items-center gap-3 mb-6">
                  <div className={`h-[1px] flex-1 ${isDark ? "bg-slate-800" : "bg-slate-200"}`}></div>
                  <span className={`text-[10px] font-mono uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>Or continue with</span>
                  <div className={`h-[1px] flex-1 ${isDark ? "bg-slate-800" : "bg-slate-200"}`}></div>
                </div>

                {/* Form Inputs */}
                <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
                  
                  {/* Signup Details */}
                  {isSignUp && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="flex flex-col gap-4"
                    >
                      <div>
                        <label className={`block text-[10px] font-mono uppercase tracking-wider mb-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Full Name</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                          <input
                            type="text"
                            required
                            value={name || ""}
                            onChange={(e) => setName(e.target.value)}
                            className={`w-full pl-9 pr-4 py-2.5 rounded-xl border outline-none text-xs transition-all ${
                              isDark 
                                ? "bg-slate-950 border-slate-800 focus:border-amber-500 text-white" 
                                : "bg-slate-50 border-slate-200 focus:border-amber-500 text-slate-800"
                            }`}
                            placeholder="Your legal or official name"
                          />
                        </div>
                      </div>

                      <div>
                        <label className={`block text-[10px] font-mono uppercase tracking-wider mb-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Voice Part Preference</label>
                        <select
                          value={voicePart || "Soprano"}
                          onChange={(e) => setVoicePart(e.target.value)}
                          className={`w-full p-2.5 rounded-xl border outline-none text-xs transition-all cursor-pointer ${
                            isDark 
                              ? "bg-slate-950 border-slate-800 focus:border-amber-500 text-white" 
                              : "bg-slate-50 border-slate-200 focus:border-amber-500 text-slate-800"
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

                  {/* Email */}
                  <div>
                    <label className={`block text-[10px] font-mono uppercase tracking-wider mb-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        required
                        value={email || ""}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full pl-9 pr-4 py-2.5 rounded-xl border outline-none text-xs transition-all ${
                          isDark 
                            ? "bg-slate-950 border-slate-800 focus:border-amber-500 text-white" 
                            : "bg-slate-50 border-slate-200 focus:border-amber-500 text-slate-800"
                        }`}
                        placeholder="yourname@gmail.com"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className={`block text-[10px] font-mono uppercase tracking-wider mb-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Secure Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password || ""}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`w-full pl-9 pr-10 py-2.5 rounded-xl border outline-none text-xs transition-all ${
                          isDark 
                            ? "bg-slate-950 border-slate-800 focus:border-amber-500 text-white" 
                            : "bg-slate-50 border-slate-200 focus:border-amber-500 text-slate-800"
                        }`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me Toggle */}
                  <div className="flex items-center gap-2 mt-1 px-1">
                    <input 
                      type="checkbox" 
                      id="rememberMe" 
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className={`w-3.5 h-3.5 rounded border focus:ring-amber-500 cursor-pointer ${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-300"}`}
                    />
                    <label htmlFor="rememberMe" className={`text-[11px] cursor-pointer ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      Remember me
                    </label>
                  </div>

                  {/* Error Notification */}
                  {errorMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: 3 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs flex gap-2 items-center"
                    >
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <span>{errorMsg}</span>
                    </motion.div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-slate-850 text-slate-950 disabled:text-slate-500 font-bold py-2.5 px-4 rounded-xl shadow-lg transition-all cursor-pointer mt-2 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>{isSignUp ? "Create Free Account" : "Access Personal Portal"}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Practice footnote */}
          <div className="mt-6 text-center border-t border-dashed border-slate-800/60 pt-4">
            <span className={`text-[10px] font-mono flex items-center justify-center gap-1.5 ${isDark ? "text-slate-500" : "text-slate-500"}`}>
              <Music className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              Sabbaths @ 2:30 PM • Kachok SDA Church
            </span>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
