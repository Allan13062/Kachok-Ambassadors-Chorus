import React, { useEffect, useRef, useState } from "react";
import { Lock, Sun, Moon, Menu, X, ArrowUpRight } from "lucide-react";
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

// [label, section id]
const navItems = [
  ["Home", "home"],
  ["Itinerary", "itinerary"],
  ["Ministries", "activities"],
  ["Leaders", "leadership"],
  ["Music", "music"],
  ["Gallery", "gallery"],
  ["Join", "join"],
  ["Contact", "contact"],
] as const;

const FALLBACK_LOGO =
  "https://www.image2url.com/r2/default/images/1781098447744-9bfd4cd8-4c62-4a1a-b218-7ccd6f1b36d2.png";

export default function Header({
  isAdmin,
  onOpenAdmin,
  onLogout,
  activeSection,
  theme,
  onToggleTheme,
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
      setScrolled(y > 24);
      setProgress(max > 0 ? (y / max) * 100 : 0);
      if (y < 100) setHidden(false);
      else if (y > lastY.current + 8) setHidden(true);
      else if (y < lastY.current - 8) setHidden(false);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const scrollTo = (id: string) => {
    setMobileOpen(false);
    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  };

  const isDark = theme === "dark";

  return (
    <motion.header
      animate={{ y: hidden && !mobileOpen ? "-110%" : 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed inset-x-0 top-0 z-50 text-white transition-colors duration-300 ${
        scrolled || mobileOpen ? "glass-nav" : "glass-nav-transparent"
      }`}
    >
      <div className="brand-bar" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-5 md:px-10">
        {/* Wordmark */}
        <button
          type="button"
          onClick={() => scrollTo("home")}
          aria-label="Go to home"
          className="flex shrink-0 items-center gap-3"
        >
          <img
            src={webLogo || FALLBACK_LOGO}
            alt=""
            className="h-9 w-9 rounded-full border-2 border-white/20 object-cover"
            loading="eager"
            decoding="async"
            referrerPolicy="no-referrer"
          />
          <span className="font-display text-lg font-bold tracking-tight">
            Kachamba<span className="text-white/50"> Chorus</span>
          </span>
        </button>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Primary navigation">
          {navItems.map(([label, id]) => {
            const active = activeSection === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => scrollTo(id)}
                aria-current={active ? "page" : undefined}
                className={`relative rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors ${
                  active ? "text-[color:var(--hue-primary)]" : "text-white/60 hover:text-white"
                }`}
              >
                {label}
                {active && (
                  <motion.span
                    layoutId="nav-dot"
                    className="absolute -bottom-[3px] left-1/2 h-1 w-5 -translate-x-1/2 rounded-full"
                    style={{ background: "var(--fill-primary)" }}
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 lg:flex">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-white/70 transition hover:border-white/40 hover:text-white"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={() => scrollTo("contact")}
            className="btn-solid fill-accent !px-4 !py-2.5 !text-[13px]"
          >
            Book us
            <ArrowUpRight className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={isAdmin ? onLogout : onOpenAdmin}
            className="flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-semibold text-white/50 transition hover:text-white"
          >
            <Lock className="h-3.5 w-3.5" />
            {isAdmin ? "Logout" : "Admin"}
          </button>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation"
          className="grid h-10 w-10 place-items-center rounded-full border border-white/20 lg:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Scroll progress */}
      <div
        className="absolute bottom-0 left-0 h-[2px]"
        style={{
          width: `${progress}%`,
          background: "var(--fill-primary)",
        }}
      />

      {/* Mobile full-screen sheet */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            id="mobile-navigation"
            aria-label="Mobile navigation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 bottom-0 top-[68px] overflow-y-auto bg-slate-950 px-6 pb-10 pt-4 lg:hidden"
          >
            <ul className="divide-y divide-white/10">
              {navItems.map(([label, id], i) => (
                <motion.li
                  key={id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.035 * i, duration: 0.35 }}
                >
                  <button
                    type="button"
                    onClick={() => scrollTo(id)}
                    className="flex w-full items-center gap-4 py-4 text-left"
                  >
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ background: ["var(--fill-primary)", "var(--fill-secondary)", "var(--fill-accent)"][i % 3] }}
                    />
                    <span
                      className={`font-display text-3xl font-bold tracking-tight ${
                        activeSection === id ? "text-[color:var(--hue-primary)]" : ""
                      }`}
                    >
                      {label}
                    </span>
                  </button>
                </motion.li>
              ))}
            </ul>

            <div className="mt-8 grid grid-cols-2 gap-3">
              <button type="button" onClick={onToggleTheme} className="btn-outline !py-3 !text-[13px]">
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {isDark ? "Light mode" : "Dark mode"}
              </button>
              <button
                type="button"
                onClick={isAdmin ? onLogout : onOpenAdmin}
                className="btn-outline !py-3 !text-[13px]"
              >
                <Lock className="h-4 w-4" />
                {isAdmin ? "Logout" : "Admin"}
              </button>
            </div>
            <button
              type="button"
              onClick={() => scrollTo("contact")}
              className="btn-solid fill-accent mt-3 w-full !py-4"
            >
              Book the chorus
            </button>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
