import React, { useState, useEffect } from "react";
import { Lock, Sun, Moon, Menu, X } from "lucide-react";
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
  webLogo?: string;
}

export default function Header({ isAdmin, onOpenAdmin, onLogout, activeSection, theme, onToggleTheme, user, onGoogleLogin, onGoogleLogout, webLogo }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 60);
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      setScrollProgress(docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => {
    const navigate = () => {
      const el = document.getElementById(id);
      if (el) {
        const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    };
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
      setTimeout(navigate, 280);
    } else {
      navigate();
    }
  };

  const navItems = [
    { label: "Home", id: "home" },
    { label: "Itinerary", id: "itinerary" },
    { label: "Ministries", id: "activities" },
    { label: "Leaders", id: "leadership" },
    { label: "Music", id: "music" },
    { label: "Gallery", id: "gallery" },
    { label: "Join Us", id: "join" },
    { label: "Contact", id: "contact" },
  ];

  const isDark = theme === "dark";
  const navBg = scrolled
    ? isDark
      ? "glass-nav shadow-lg shadow-black/20"
      : "glass-nav shadow-md shadow-black/5"
    : "glass-nav-transparent";

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${navBg}`}>
      {/* Scroll progress line */}
      <div
        className="absolute bottom-0 left-0 h-px bg-gradient-to-r from-amber-500/80 via-amber-400/60 to-transparent transition-all duration-150 ease-out"
        style={{ width: `${scrollProgress}%` }}
      />

      <div className="max-w-7xl mx-auto px-5 md:px-10 py-4 flex items-center justify-between gap-6">

        {/* Logo */}
        <button onClick={() => scrollTo("home")} className="flex items-center gap-3 group shrink-0">
          <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/20 shadow-lg shadow-black/30 group-hover:scale-105 transition-transform duration-300">
            <img
              src={webLogo || "https://www.image2url.com/r2/default/images/1781098447744-9bfd4cd8-4c62-4a1a-b218-7ccd6f1b36d2.png"}
              alt="Kachamba Chorus"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <span className={`label-caps font-semibold tracking-[0.18em] text-[11px] transition-colors ${
            scrolled
              ? isDark ? "text-white/90" : "text-slate-800"
              : "text-white/90"
          } group-hover:text-amber-400`}>
            KACHAMBA CHORUS
          </span>
        </button>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-7 lg:gap-9">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            const textColor = scrolled
              ? isDark
                ? isActive ? "text-amber-400" : "text-white/70 hover:text-white"
                : isActive ? "text-amber-600" : "text-slate-600 hover:text-slate-900"
              : isActive
                ? "text-amber-400"
                : "text-white/70 hover:text-white";
            return (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className={`relative label-caps text-[11px] py-1 cursor-pointer transition-colors duration-200 ${textColor}`}
              >
                {item.label}
                {isActive && (
                  <motion.span
                    layoutId="navUnderline"
                    className="absolute -bottom-0.5 left-0 right-0 h-px bg-amber-400/80 rounded-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* User */}
          {user ? (
            <div className="hidden sm:flex items-center gap-2">
              <img
                src={user.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=Guest`}
                alt={user.displayName || "User"}
                className="w-7 h-7 rounded-full border border-white/20"
                title={user.displayName || ""}
              />
              <button
                onClick={onGoogleLogout}
                className="label-caps text-[10px] text-white/50 hover:text-white/90 transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={onGoogleLogin}
              className={`hidden sm:block label-caps text-[10px] px-3 py-2 rounded-lg border transition-all ${
                scrolled && !isDark
                  ? "border-slate-300/60 text-slate-600 hover:text-slate-900 hover:border-slate-400"
                  : "border-white/15 text-white/60 hover:text-white hover:border-white/30"
              }`}
            >
              Sign In
            </button>
          )}

          {/* Theme */}
          <button
            onClick={onToggleTheme}
            className={`p-2 rounded-lg border transition-all hover:scale-105 active:scale-95 ${
              scrolled && !isDark
                ? "border-slate-200 text-slate-500 hover:text-amber-600 bg-white/60"
                : "border-white/10 text-white/50 hover:text-amber-400 bg-white/5"
            }`}
            title={isDark ? "Light mode" : "Dark mode"}
          >
            {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          {/* Admin / Leader Portal */}
          <button
            onClick={onOpenAdmin}
            className={`hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-lg border label-caps text-[10px] transition-all cursor-pointer ${
              isAdmin
                ? "border-amber-500/40 text-amber-400 bg-amber-500/8 hover:bg-amber-500/15"
                : scrolled && !isDark
                ? "border-slate-300 text-slate-600 hover:bg-amber-500 hover:text-white hover:border-amber-500 bg-white/70"
                : "border-white/15 text-white/70 hover:text-amber-400 hover:border-amber-400/40 bg-white/5"
            }`}
          >
            <Lock className="w-3 h-3" />
            {isAdmin ? "Dashboard" : "Leader Portal"}
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`md:hidden p-2 rounded-lg border transition-all ${
              scrolled && !isDark
                ? "border-slate-200 text-slate-600 bg-white/60"
                : "border-white/10 text-white/70 bg-white/5"
            }`}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className={`md:hidden overflow-hidden border-t ${
              isDark
                ? "border-white/5 bg-slate-950/95 backdrop-blur-2xl"
                : "border-slate-200/60 bg-white/92 backdrop-blur-2xl"
            }`}
          >
            <div className="px-5 py-4 flex flex-col gap-1">
              {/* Mobile user row */}
              <div className={`flex items-center justify-between pb-3 mb-2 border-b ${isDark ? "border-white/5" : "border-slate-100"}`}>
                {user ? (
                  <div className="flex items-center gap-2.5">
                    <img src={user.photoURL || ""} alt="" className="w-7 h-7 rounded-full border border-white/20" />
                    <span className="text-xs font-medium">{user.displayName}</span>
                  </div>
                ) : (
                  <span className="label-caps text-[10px] text-white/40">Ambassador Portal</span>
                )}
                {user ? (
                  <button onClick={onGoogleLogout} className="label-caps text-[10px] text-red-400/80 hover:text-red-400">Sign Out</button>
                ) : (
                  <button onClick={() => { setMobileMenuOpen(false); onGoogleLogin?.(); }} className="label-caps text-[10px] text-amber-400">Sign In</button>
                )}
              </div>

              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className={`w-full text-left label-caps text-[11px] py-2.5 px-3 rounded-lg transition-colors ${
                    activeSection === item.id
                      ? "text-amber-400 bg-amber-500/8"
                      : isDark
                        ? "text-white/60 hover:text-white hover:bg-white/5"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  {item.label}
                </button>
              ))}

              <button
                onClick={() => { setMobileMenuOpen(false); onOpenAdmin(); }}
                className={`mt-2 flex items-center gap-2 label-caps text-[10px] py-2.5 px-3 rounded-lg border transition-all ${
                  isAdmin
                    ? "border-amber-500/30 text-amber-400 bg-amber-500/8"
                    : isDark
                      ? "border-white/10 text-white/50 hover:text-amber-400"
                      : "border-slate-200 text-slate-500 hover:text-amber-600"
                }`}
              >
                <Lock className="w-3 h-3" />
                {isAdmin ? "Admin Dashboard" : "Leader Portal"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
