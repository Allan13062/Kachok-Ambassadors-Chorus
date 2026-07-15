import React, { useEffect, useRef } from "react";
import { ChevronDown, Calendar, MessageCircle } from "lucide-react";
import { motion, useMotionValue, useSpring } from "motion/react";

interface HeroProps {
  onAskAI: () => void;
  webLogo?: string;
}

// Layout Orchestration
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.18, // Slightly slower, more deliberate pacing between elements
      delayChildren: 0.35,
    },
  },
};

// Elements sliding in from the LEFT
const slideLeftVariants = {
  hidden: { opacity: 0, x: -70, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: 1.7, ease: [0.16, 1, 0.3, 1] }, // Slow, epic cinematic ease-out
  },
};

// Elements sliding in from the RIGHT
const slideRightVariants = {
  hidden: { opacity: 0, x: 70, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: 1.7, ease: [0.16, 1, 0.3, 1] },
  },
};

// Text drops down centrally
const dropDownVariants = {
  hidden: { opacity: 0, y: -36, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 1.8, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function Hero({ onAskAI, webLogo }: HeroProps) {
  const sectionRef = useRef<HTMLElement>(null);

  // Raw cursor position within the hero section
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);

  // Primary glow — snaps close to the actual cursor
  const glowSpring = { stiffness: 120, damping: 22, mass: 0.6 };
  const glow1X = useSpring(cursorX, glowSpring);
  const glow1Y = useSpring(cursorY, glowSpring);

  // Trailing glow — lags behind for a soft parallax depth effect
  const trailSpring = { stiffness: 55, damping: 26, mass: 1 };
  const glow2X = useSpring(cursorX, trailSpring);
  const glow2Y = useSpring(cursorY, trailSpring);

  useEffect(() => {
    // Center the orbs on mount so they don't start pinned at the top-left corner
    if (sectionRef.current) {
      const { width, height } = sectionRef.current.getBoundingClientRect();
      cursorX.set(width / 2);
      cursorY.set(height / 2);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePointerMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    cursorX.set(e.clientX - rect.left);
    cursorY.set(e.clientY - rect.top);
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
      ref={sectionRef}
      onMouseMove={handlePointerMove}
      className="relative min-h-screen flex flex-col justify-center items-center overflow-hidden bg-slate-950"
    >
      {/* Cinematic Background — Slow Zoom Out, then a perpetual gentle Ken Burns drift */}
      <motion.div
        initial={{ scale: 1.35, opacity: 0 }}
        animate={{ scale: [1.35, 1.06, 1.14], opacity: 1 }}
        transition={{
          scale: {
            duration: 16,
            times: [0, 0.28, 1],
            ease: [0.16, 1, 0.3, 1],
            repeat: Infinity,
            repeatType: "mirror",
          },
          opacity: { duration: 2.8, ease: "easeOut" },
        }}
        className="absolute inset-0 z-0"
      >
        <img
          src="/WhatsApp Image 2026-06-11 at 11.06.18 AM.jpeg"
          alt="Kachamba Chorus Choir"
          className="w-full h-full object-cover"
        />
        {/* Multi-layer darkening overlay */}
        <div className="absolute inset-0 bg-slate-950/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-slate-950/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/40 via-transparent to-slate-950/40" />
      </motion.div>

      {/* Ambient orbs (static, slow ambient pulse) */}
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full bg-amber-500/5 blur-[100px] pointer-events-none z-0 animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-blue-500/4 blur-[80px] pointer-events-none z-0 animate-pulse-slow" style={{ animationDelay: "3s" }} />

      {/* Cursor-tracking glow orbs */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute z-[1] w-[420px] h-[420px] rounded-full bg-amber-400/20 blur-[90px] mix-blend-screen"
        style={{ left: glow1X, top: glow1Y, translateX: "-50%", translateY: "-50%" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute z-[1] w-[260px] h-[260px] rounded-full bg-sky-400/10 blur-[70px] mix-blend-screen"
        style={{ left: glow2X, top: glow2Y, translateX: "-50%", translateY: "-50%" }}
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

        {/* 5. CTAs — Lift gracefully together */}
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

        {/* 6. Stats Panel with Advanced Metric Card Hover Micro-interactions */}
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
                scale: 1.06,
                y: -6,
                backgroundColor: "rgba(255, 255, 255, 0.06)",
                boxShadow:
                  "0 20px 40px -12px rgba(245, 158, 11, 0.25), 0 0 0 1px rgba(245, 158, 11, 0.18)",
              }}
              whileTap={{ scale: 0.98, y: -2 }}
              transition={{ type: "spring", stiffness: 350, damping: 22 }}
              className="group relative overflow-hidden text-center py-4 px-2 rounded-xl cursor-default"
            >
              {/* Top accent line that sweeps in on hover */}
              <motion.span
                aria-hidden
                className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/80 to-transparent"
                initial={{ scaleX: 0, opacity: 0 }}
                whileHover={{ scaleX: 1, opacity: 1 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              />

              <motion.div
                whileHover={{ scale: 1.12 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                className="text-2xl font-bold text-amber-400 font-display tracking-tight"
              >
                {stat.value}
              </motion.div>
              <div className="label-caps text-[9px] text-white/35 mt-1 tracking-wider transition-colors duration-300 group-hover:text-white/65">
                {stat.label}
              </div>
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
        transition={{ delay: 2.6, duration: 1 }}
        onClick={() => scrollTo("itinerary")}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 cursor-pointer group"
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-8 h-8 rounded-full glass flex items-center justify-center group-hover:border-amber-400/30 transition-colors"
        >
          <ChevronDown className="w-4 h-4 text-white/40 group-hover:text-amber-400 transition-colors" />
        </motion.div>
      </motion.button>
    </section>
  );
}
