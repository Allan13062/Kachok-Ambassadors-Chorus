import React, { useState, useEffect } from "react";
import { Music, Lock, Users, Calendar, Image as ImageIcon, Heart, Sun, Moon, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { User as FirebaseUser } from "firebase/auth";

interface HeaderProps {
  isAdmin: boolean;
  onOpenAdmin: () => void;
  onLogout: () => void;
  activeSection: string;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  user?: FirebaseUser | null;
  onGoogleLogin?: () => void;
  onGoogleLogout?: () => void;
}

export default function Header({ isAdmin, onOpenAdmin, onLogout, activeSection, theme, onToggleTheme, user, onGoogleLogin, onGoogleLogout }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const computeScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = document.documentElement.clientHeight;
      const maxScroll = docHeight - winHeight;
      if (maxScroll <= 0) return setScrollProgress(0);
      setScrollProgress((scrollY / maxScroll) * 100);
    };

    window.addEventListener("scroll", computeScroll);
    return () => window.removeEventListener("scroll", computeScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;

    const navigate = () => {
      const targetEl = document.getElementById(id);
      if (targetEl) {
        const headerOffset = 72; // height of the sticky navbar
        const elementPosition = targetEl.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }
    };

    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
      // Wait for mobile drawer to slide out/close to get accurate coordinate values and prevent scroll cancel
      setTimeout(navigate, 280);
    } else {
      navigate();
    }
  };

  const navItems = [
    { label: "Home", id: "home", icon: null },
    { label: "Itinerary", id: "itinerary", icon: Calendar },
    { label: "Ministries", id: "activities", icon: Users },
    { label: "Leaders", id: "leadership", icon: Users },
    { label: "Music", id: "music", icon: Music },
    { label: "Gallery", id: "gallery", icon: ImageIcon },
    { label: "Join Us", id: "join", icon: Heart },
    { label: "Contact", id: "contact", icon: null },
  ];

  return (
    <header className={`sticky top-0 z-40 w-full backdrop-blur-md border-b transition-all ${
      theme === "dark" 
        ? "bg-slate-900/90 border-slate-800/80 text-white" 
        : "bg-white/90 border-slate-200 text-slate-900"
    }`}>
      <div 
        className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-amber-400 to-amber-600 origin-left transition-all duration-150 ease-out z-50"
        style={{ width: `${scrollProgress}%` }}
      />
      <div className="w-full py-3 px-4 md:px-12 flex justify-between items-center relative">
        <div 
          onClick={() => scrollTo("home")}
        className="flex items-center gap-2 sm:gap-3 cursor-pointer group shrink-0"
      >
        <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-amber-550/30 bg-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/5 group-hover:scale-105 transition-transform">
          <img 
            src="https://www.image2url.com/r2/default/images/1781098447744-9bfd4cd8-4c62-4a1a-b218-7ccd6f1b36d2.png" 
            alt="Kachamba Chorus Logo" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div>
          <h1 className={`font-sans font-bold tracking-tight text-sm sm:text-base md:text-xl group-hover:text-amber-500 transition-colors ${
            theme === "dark" ? "text-amber-400" : "text-amber-600"
          }`}>
            KACHAMBA CHORUS
          </h1>
        </div>
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center gap-6 lg:gap-8">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => scrollTo(item.id)}
            className={`font-sans text-sm font-medium transition-all hover:text-amber-405 hover:scale-[1.03] active:scale-[0.98] cursor-pointer relative py-1 ${
              activeSection === item.id 
                ? "text-amber-450 font-semibold" 
                : theme === "dark" ? "text-slate-300" : "text-slate-705 hover:text-amber-605"
            }`}
          >
            <span>{item.label}</span>
            {activeSection === item.id && (
              <motion.span
                layoutId="activeHeaderTabLine"
                className="absolute bottom-0 left-0 right-0 h-[3px] bg-amber-500 rounded-full"
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
              />
            )}
          </button>
        ))}
      </nav>

      {/* Action Buttons: Theme Toggle & Admin Module & Mobile Hamburger */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {user ? (
          <div className="flex items-center gap-2 mr-1 sm:mr-2">
            <img 
              src={user.photoURL || "https://api.dicebear.com/7.x/adventurer/svg?seed=Guest"} 
              alt={user.displayName || "User"} 
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-amber-500/30" 
              title={user.displayName || "User Profile"} 
            />
            <button
              onClick={onGoogleLogout}
              className={`text-[10px] sm:text-xs font-semibold px-2 py-1 rounded transition-colors ${theme === "dark" ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-905"}`}
            >
              Sign Out
            </button>
          </div>
        ) : (
          <button
            onClick={onGoogleLogin}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-all mr-2 ${theme === "dark" ? "bg-slate-800 border-slate-700 hover:bg-slate-705 text-amber-400 hover:text-amber-300" : "bg-slate-100 border-slate-300 hover:bg-slate-200 text-slate-700"}`}
          >
            Sign In / Sign Up
          </button>
        )}

        {/* Modern Switch Toggle */}
        <button
          onClick={onToggleTheme}
          className={`p-1.5 sm:p-2 rounded-lg transition-all border cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center ${
            theme === "dark" 
              ? "bg-slate-800/60 hover:bg-slate-700/80 border-slate-700 text-amber-450 hover:text-amber-300" 
              : "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700 hover:text-amber-600"
          }`}
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === "dark" ? (
            <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
          ) : (
            <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />
          )}
        </button>

        {isAdmin ? (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className={`hidden lg:inline-block border text-[10px] font-mono px-2 py-0.5 rounded ${
              theme === "dark" 
                ? "bg-amber-500/10 text-amber-400 border-amber-500/30" 
                : "bg-amber-100 text-amber-800 border-amber-300"
            }`}>
              ADMIN
            </span>
            <button
              onClick={onLogout}
              className="bg-red-500/10 hover:bg-red-505 hover:text-white border border-red-500/20 text-red-500 font-sans text-[11px] sm:text-xs font-semibold px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg cursor-pointer transition-all"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAdmin}
            className={`flex items-center gap-1.5 text-[11px] sm:text-xs font-medium px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg border transition-all cursor-pointer ${
              theme === "dark"
                ? "bg-slate-800/80 hover:bg-slate-700/80 text-amber-400 hover:text-amber-300 border-slate-700"
                : "bg-slate-100 hover:bg-amber-500 hover:text-white text-slate-800 border-slate-300 hover:border-amber-400"
            }`}
          >
            <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="hidden xs:inline">Leader Portal</span>
            <span className="inline xs:hidden">Portal</span>
          </button>
        )}

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`md:hidden p-1.5 sm:p-2 rounded-lg border transition-all cursor-pointer hover:scale-105 active:scale-95 ${
            theme === "dark"
              ? "bg-slate-850 border-slate-750 text-slate-300 hover:text-white hover:bg-slate-800"
              : "bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200"
          }`}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? (
            <X className="w-4 h-4" />
          ) : (
            <Menu className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className={`absolute top-full left-0 w-full border-b shadow-2xl flex flex-col p-4 gap-2 z-50 md:hidden overflow-hidden ${
              theme === "dark"
                ? "bg-slate-900 border-slate-800 text-slate-100"
                : "bg-white border-slate-200 text-slate-800"
            }`}
          >
            {/* Mobile User Profiles or Quick Login Buttons */}
            <div className={`p-2 border-b mb-1 flex items-center justify-between ${theme === "dark" ? "border-slate-800" : "border-slate-100"}`}>
              {user ? (
                <div className="flex items-center gap-2.5">
                  <img 
                    src={user.photoURL || "https://api.dicebear.com/7.x/adventurer/svg?seed=Guest"} 
                    alt={user.displayName || "User"} 
                    className="w-8 h-8 rounded-full border border-amber-500/30" 
                  />
                  <div>
                    <p className="text-xs font-bold leading-tight">{user.displayName || "Ambassador Guest"}</p>
                    <p className="text-[9px] text-slate-550 font-mono">{user.email || "support@kachamba.org"}</p>
                  </div>
                </div>
              ) : (
                <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">Ambassador Portal Access</span>
              )}

              {user ? (
                <button
                  onClick={onGoogleLogout}
                  className="text-xs bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white px-3 py-1.5 rounded-lg border border-red-500/20 font-sans font-semibold transition-all"
                >
                  Sign Out
                </button>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onGoogleLogin) onGoogleLogin();
                  }}
                  className="text-xs bg-amber-500 text-slate-950 font-sans font-bold px-4 py-1.5 rounded-lg shadow-sm transition-all"
                >
                  Sign In
                </button>
              )}
            </div>

            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className={`w-full text-left font-sans text-sm font-semibold p-2.5 rounded-lg transition-colors cursor-pointer flex items-center justify-between ${
                  activeSection === item.id
                    ? theme === "dark" 
                      ? "bg-amber-500/10 text-amber-400" 
                      : "bg-amber-500/10 text-amber-600"
                    : theme === "dark"
                      ? "hover:bg-slate-800/80 text-slate-300 hover:text-white"
                      : "hover:bg-slate-100 text-slate-700 hover:text-slate-900"
                }`}
              >
                <span>{item.label}</span>
                {item.icon && <item.icon className="w-4 h-4 opacity-50" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </header>
  );
}
