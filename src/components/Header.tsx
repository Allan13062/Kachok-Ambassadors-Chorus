import React, { useEffect, useRef, useState } from "react";
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

const navItems = [
  ["Home", "home"],
  ["Itinerary", "itinerary"],
  ["Ministries", "activities"],
  ["Leaders", "leadership"],
  ["Music", "music"],
  ["Gallery", "gallery"],
  ["Join Us", "join"],
  ["Contact", "contact"],
] as const;

export default function Header({
  isAdmin,
  onOpenAdmin,
  onLogout,
  activeSection,
  theme,
  onToggleTheme,
  user,
  onGoogleLogin,
  onGoogleLogout,
  webLogo,
}: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;

      setScrolled(y > 50);
      setProgress(max > 0 ? (y / max) * 100 : 0);

      if (y < 100) {
        setHidden(false);
      } else if (y > lastY.current + 8) {
        setHidden(true);
      } else if (y < lastY.current - 8) {
        setHidden(false);
      }

      lastY.current = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  const scrollTo = (id: string) => {
    setMobileOpen(false);

    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 120);
  };

  const isDark = theme === "dark";
  const textClass = isDark ? "text-white" : "text-slate-900";

  return (
    <motion.header
      animate={{ y: hidden ? "-110%" : 0 }}
      transition={{ duration: 0.28 }}
      className={`fixed left-0 right-0 top-0 z-50 border-b ${
        scrolled
          ? isDark
            ? "border-white/10 bg-slate-950/85 backdrop-blur-xl"
            : "border-slate-200 bg-white/85 backdrop-blur-xl"
          : "border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 md:px-10">
        <button
          type="button"
          onClick={() => scrollTo("home")}
          className={`flex shrink-0 items-center gap-3 ${textClass} focus:outline-none focus:ring-2 focus:ring-amber-400`}
          aria-label="Go to home"
        >
          <img
            src={
              webLogo ||
              "https://www.image2url.com/r2/default/images/1781098447744-9bfd4cd8-4c62-4a1a-b218-7ccd6f1b36d2.png"
            }
            alt=""
            className="h-8 w-8 rounded-full border border-white/20 object-cover"
            loading="eager"
            decoding="async"
            referrerPolicy="no-referrer"
          />
          <span className="label-caps hidden text-[11px] font-semibold tracking-[0.18em] sm:block">
            KACHAMBA CHORUS
          </span>
        </button>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
          {navItems.map(([label, id]) => (
            <button
              key={id}
              type="button"
              onClick={() => scrollTo(id)}
              aria-current={activeSection === id ? "page" : undefined}
              className={`rounded-lg px-3 py-2 text-[10px] font-semibold uppercase tracking-wider transition focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                activeSection === id
                  ? "bg-amber-500/10 text-amber-400"
                  : `${isDark ? "text-white/55 hover:text-white" : "text-slate-500 hover:text-slate-900"}`
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
            title={`Switch to ${isDark ? "light" : "dark"} theme`}
            className={`rounded-lg p-2 transition focus:outline-none focus:ring-2 focus:ring-amber-400 ${
              isDark ? "text-white/60 hover:bg-white/10 hover:text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {isAdmin ? (
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-2 rounded-full border border-amber-400/20 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-amber-400 transition hover:bg-amber-400/10 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <Lock className="h-3.5 w-3.5" />
              Logout
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-white/60 transition hover:border-amber-400/30 hover:text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <Lock className="h-3.5 w-3.5" />
              Admin
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((value) => !value)}
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation"
          className={`rounded-lg p-2 md:hidden ${
            isDark ? "text-white" : "text-slate-900"
          } focus:outline-none focus:ring-2 focus:ring-amber-400`}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div className="absolute bottom-0 left-0 h-0.5 bg-amber-400 transition-all" style={{ width: `${progress}%` }} />

      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            id="mobile-navigation"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={`overflow-hidden border-t px-5 pb-5 md:hidden ${
              isDark ? "border-white/10 bg-slate-950/95" : "border-slate-200 bg-white/95"
            }`}
            aria-label="Mobile navigation"
          >
            <div className="grid gap-1 pt-3">
              {navItems.map(([label, id]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => scrollTo(id)}
                  className={`rounded-xl px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    activeSection === id
                      ? "bg-amber-500/10 text-amber-400"
                      : isDark
                        ? "text-white/70"
                        : "text-slate-700"
                  }`}
                >
                  {label}
                </button>
              ))}

              <div className="mt-2 flex gap-2 border-t border-white/10 pt-3">
                <button
                  type="button"
                  onClick={onToggleTheme}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-xs"
                >
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  Theme
                </button>

                <button
                  type="button"
                  onClick={isAdmin ? onLogout : onOpenAdmin}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-amber-400/20 px-4 py-3 text-xs text-amber-400"
                >
                  <Lock className="h-4 w-4" />
                  {isAdmin ? "Logout" : "Admin"}
                </button>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
