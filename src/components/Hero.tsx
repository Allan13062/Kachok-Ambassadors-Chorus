import React, { useRef } from "react";
import { ChevronDown, Calendar, MessageCircle } from "lucide-react";
import { motion, useMotionValue, useSpring } from "motion/react";

interface HeroProps {
  onAskAI: () => void;
  webLogo?: string;
}

// Layout Orchestration Sequence Settings
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

// Orchestration directional motion configurations
const slideLeftVariants = {
  hidden: { opacity: 0, x: -40, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
  },
};

const slideRightVariants = {
  hidden: { opacity: 0, x: 40, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
  },
};

const dropDownVariants = {
  hidden: { opacity: 0, y: -30, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 1.4, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function Hero({ onAskAI, webLogo }: HeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Raw coordinate tracking channels
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Physical structural damping spring loops (prevents jittery cursor jumps)
  const orbX = useSpring(mouseX, { stiffness: 60, damping: 25 });
  const orbY = useSpring(mouseY, { stiffness: 60, damping: 25 });

  // Secondary delayed spring channel to generate a dual trailing liquid aura look
  const trailingOrbX = useSpring(mouseX, { stiffness: 35, damping: 20 });
  const trailingOrbY = useSpring(mouseY, { stiffness: 35, damping: 20 });

  // Capture canvas plane interaction matrices
  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    // Project absolute positions down relative to structural container view dimensions
    mouseX.set(event.clientX - rect.left);
    mouseY.set(event.clientY - rect.top);
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <section
      id="home"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-screen flex flex-col justify-center items-center overflow-hidden bg-slate-950 cursor-default"
    >
      {/* Cinematic Background — Slow Zoom Out */}
      <motion.div
        initial={{ scale: 1.25, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 3.5, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 z-0 select-none pointer-events-none"
      >
        <img
          src="/WhatsApp Image 2026-06-11 at 11.06.18 AM.jpeg"
          alt="Kachamba Chorus Choir"
          className="w-full h-full object-cover"
        />
        {/* Multi-layer darkening overlay setup */}
        <div className="absolute inset-0 bg-slate-950/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-slate-950/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/40 via-transparent to-slate-950/40" />
      </motion.div>

      {/* 
        MOUSE INTERACTION ORB LAYERS 
        - Centered by subtracting half dimensions (-250px) using x/y styles to keep tracking smooth
      */}
      <motion.div 
        style={{
          x: orbX,
          y: orbY,
          transform: "translate(-250px, -250px)",
        }}
        className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-amber-500/10 blur-[130px] pointer-events-none z-0 mix-blend-screen"
      />
      <motion.div 
        style={{
          x: trailingOrbX,
          y: trailingOrbY,
          transform: "translate(-200px, -200px)",
        }}
        className="absolute top-0 left-0 w-[400px] h-[400px] rounded-full bg-blue-500/8 blur-[110px] pointer-events-none z-0 mix-blend-screen"
      />

      {/* Content Master Container */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-5xl mx-auto px-6 md:px-12 text-center flex flex-col items-center pt-20"
      >
        {/* 1. Eyebrow — Drops Down */}
        <motion.div variants={dropDownVariants} className="flex items-center gap-3 mb-8">
          <div className="w-8 h-px bg-amber-400/50" />
          <span className="label-caps text-amber-400/80 text-[11px]">Kachok Ambassadors Chorus</span>
          <div className="w-8 h-px bg-amber-400/50" />
        </motion.div>

        {/* 2. Main Title — Slides from the Left */}
        <motion.h1 variants={slideLeftVariants} className="leading-[0.95] mb-4 text-center">
          <span
            style={{
              fontFamily: "'Glacial Indifference', 'Century Gothic', 'Futura', sans-serif",
              fontWeight: 700,
              fontSize: "clamp(4.5rem, 14vw, 10rem)",
              letterSpacing: "0.03em",
              lineHeight: 1,
              display: "block",
              background: "linear-gradient(180deg, #FCD34D 60%, #F59E0B 25%, #FFFFFF 55%, #FDE68A 78%, #FDE68A 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 0 32px rgba(251,191,36,0.30))",
            }}
          >
            KACHAMBA
          </span>
          <span
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: "clamp(2.8rem, 8.5vw, 6.2rem)",
              letterSpacing: "0.01em",
              lineHeight: 1,
              display: "block",
              color: "#FFFFFF",
            }}
          >
            Chorus
          </span>
        </motion.h1>

        {/* 3. Subheading — Slides from the Right */}
        <motion.p
          variants={slideRightVariants}
          className="label-caps text-white/40 text-[11px] mb-6 tracking-[0.25em]"
        >
          Sounds Of Togetherness · Since 2021
        </motion.p>

        {/* 4. Body description — Drops Down */}
        <motion.p
          variants={dropDownVariants}
          className="text-white/60 text-sm md:text-base max-w-xl mx-auto leading-relaxed font-light mb-12"
        >
          Spreading the Gospel through absolute vocal harmony, youth fellowship,
          and passionate community mission outreach across Kenya.
        </motion.p>

        {/* 5. CTAs */}
        <motion.div variants={dropDownVariants} className="flex flex-col sm:flex-row items-center gap-4 mb-16">
          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => scrollTo("itinerary")}
            className="flex items-center gap-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold label-caps text-[11px] px-8 py-3.5 rounded-full transition-all cursor-pointer shadow-lg shadow-amber-500/20"
          >
            <Calendar className="w-3.5 h-3.5" />
            View Itinerary
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={onAskAI}
            className="flex items-center gap-2.5 glass label-caps text-[11px] px-8 py-3.5 rounded-full text-white/70 hover:text-white transition-all cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5 text-amber-400/70" />
            Ask Kachamba AI
          </motion.button>
        </motion.div>

        {/* 6. Stats Panel with Glass Variant & Metric Card Hovers */}
        <motion.div
          variants={dropDownVariants}
          className="glass rounded-2xl p-2 max-w-2xl w-full grid grid-cols-2 sm:grid-cols-4 gap-2"
        >
          {[
            { value: "40+", label: "Singers" },
            { value: "SATB", label: "Voice Parts" },
            { value: "12+", label: "Events / Year" },
            { value: "100%", label: "Youth Ministry" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              whileHover={{ 
                scale: 1.04, 
                backgroundColor: "rgba(255, 255, 255, 0.04)",
                boxShadow: "0 10px 30px -10px rgba(245, 158, 11, 0.12)"
              }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="text-center py-4 px-2 rounded-xl transition-colors duration-300 cursor-default"
            >
              <div className="text-2xl font-bold text-amber-400 font-display tracking-tight">{stat.value}</div>
              <div className="label-caps text-[9px] text-white/35 mt-1 tracking-wider">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* 7. Scripture Quote */}
        <motion.div variants={dropDownVariants} className="mt-12 text-center">
          <p className="text-white/30 text-xs italic font-light" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            "I will sing unto the Lord as long as I live…" — Psalm 104:33
          </p>
        </motion.div>
      </motion.div>

      {/* Floating Scroll Indicator */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 1 }}
        onClick={() => scrollTo("itinerary")}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 cursor-pointer group"
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
