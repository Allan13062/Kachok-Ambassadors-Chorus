import React from "react";
import { ChevronRight, Calendar, Volume2, ChevronDown } from "lucide-react";
import { motion } from "motion/react";

interface HeroProps {
  onAskAI: () => void;
}

export default function Hero({ onAskAI }: HeroProps) {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Stagger variants for elegant sequence loading
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.25,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 70, damping: 20 },
    },
  };

  const logoVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { type: "spring", stiffness: 80, damping: 18, delay: 0.3 },
    },
  };

  return (
    <section 
      id="home"
      className="relative min-h-[95vh] bg-slate-950 text-white flex flex-col justify-center items-center px-6 md:px-12 py-20 overflow-hidden"
    >
      {/* Background Image Layer with Zoom-In Transition */}
      <motion.div 
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.6 }}
        transition={{ duration: 2.5, ease: "easeOut" }}
        className="absolute inset-0 z-0 select-none pointer-events-none"
      >
        <img 
          src="/WhatsApp Image 2026-06-11 at 11.06.18 AM.jpeg" 
          alt="Kachamba Chorus Choir Group" 
          className="w-full h-full object-cover brightness-[0.8] saturate-100"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/40 to-slate-950" />
        <div className="absolute inset-0 bg-radial-at-c from-transparent via-slate-950/15 to-slate-950" />
      </motion.div>

      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none z-0 animate-pulse" style={{ animationDuration: "8s" }} />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-blue-500/5 blur-3xl pointer-events-none z-0 animate-pulse" style={{ animationDuration: "12s" }} />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center text-center max-w-4xl z-10 w-full"
      >
        {/* Hero Logo & Badge */}
        <div className="mb-6 flex flex-col items-center gap-4">
          {/* Elegant Animated Logo frame with Gold-Blue Radial Glow shadow */}
          <motion.div 
            variants={logoVariants}
            className="relative group cursor-pointer"
          >
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-[#0B1528] opacity-40 blur-xl group-hover:opacity-75 transition duration-1000 group-hover:duration-200" />
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border-2 border-amber-500/50 bg-[#070E1B] p-1 shadow-2xl transition duration-500 group-hover:rotate-6">
              <img 
                src="https://www.image2url.com/r2/default/images/1781098447744-9bfd4cd8-4c62-4a1a-b218-7ccd6f1b36d2.png" 
                alt="Kachamba Chorus Official Logo" 
                className="w-full h-full object-cover rounded-full"
                referrerPolicy="no-referrer"
              />
            </div>
          </motion.div>

          {/* Hero Badge */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            className="mt-2 flex items-center gap-2 bg-blue-500/15 border border-amber-500/30 text-amber-400 font-mono text-xs tracking-wider uppercase px-4 py-1.5 rounded-full shadow-inner"
          >
            <span>An Adventist Youth Ministry</span>
          </motion.div>
        </div>

        {/* Main Heading */}
        <motion.h1 
          variants={itemVariants}
          className="font-sans font-extrabold tracking-tight text-4xl sm:text-6xl md:text-7xl leading-[1.1] text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 drop-shadow-sm"
        >
          KACHAMBA CHORUS
        </motion.h1>
        
        <motion.h2 
          variants={itemVariants}
          className="font-sans font-medium text-lg sm:text-2xl md:text-3xl text-slate-100 mt-4 tracking-normal drop-shadow-md pb-1"
        >
          Kachok Ambassadors Chorus — Sounds Of Togetherness
        </motion.h2>

        <motion.p 
          variants={itemVariants}
          className="font-sans text-sm sm:text-base md:text-lg text-slate-200 font-medium max-w-2xl mx-auto mt-6 leading-relaxed drop-shadow-md"
        >
          Spreading the Gospel of Jesus Christ and the Three Angels' Messages through absolute vocal harmony, dedicated youth fellowship, and passionate community mission outreach.
        </motion.p>

        {/* CTAs */}
        <motion.div 
          variants={itemVariants}
          className="flex flex-col sm:flex-row items-center gap-4 mt-10 w-full sm:w-auto"
        >
          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => scrollTo("itinerary")}
            className="flex items-center justify-center gap-2 w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-sans font-bold text-sm px-8 py-3.5 rounded-xl shadow-lg hover:shadow-amber-500/20 duration-150 transition-colors cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            <span>View Our Itinerary</span>
            <ChevronRight className="w-4 h-4" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={onAskAI}
            className="flex items-center justify-center gap-2 w-full sm:w-auto bg-slate-850 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-200 font-sans font-semibold text-sm px-8 py-3.5 rounded-xl duration-150 transition-colors cursor-pointer"
          >
            <Volume2 className="w-4 h-4 text-amber-400" />
            <span>Ask Kachamba Guide</span>
          </motion.button>
        </motion.div>

        {/* Scripture Banner */}
        <motion.div 
          variants={itemVariants}
          className="mt-16 text-center max-w-lg font-serif italic text-slate-300 text-sm md:text-base border-t border-slate-800/60 pt-6 drop-shadow-md w-full"
        >
          "I will sing unto the Lord as long as I live: I will sing praise to my God while I have my being." 
          <span className="block font-sans not-italic font-bold text-slate-400 text-xs mt-2 uppercase tracking-wider drop-shadow-sm">— Psalm 104:33</span>
        </motion.div>

        {/* Simple stats bar */}
        <motion.div 
          variants={itemVariants}
          className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-8 bg-slate-950/80 border border-slate-800/80 px-8 py-6 rounded-2xl max-w-3xl w-full shadow-xl"
        >
          <div className="text-center">
            <motion.div whileHover={{ scale: 1.1 }} className="text-3xl font-bold font-sans text-amber-400">40+</motion.div>
            <div className="text-xs font-sans text-slate-500 uppercase tracking-widest mt-1">Active Singers</div>
          </div>
          <div className="text-center border-l border-slate-800/80">
            <motion.div whileHover={{ scale: 1.1 }} className="text-3xl font-bold font-sans text-amber-400">4</motion.div>
            <div className="text-xs font-sans text-slate-500 uppercase tracking-widest mt-1">SDA Parts (SATB)</div>
          </div>
          <div className="text-center border-l border-slate-800/80">
            <motion.div whileHover={{ scale: 1.1 }} className="text-3xl font-bold font-sans text-amber-400">12+</motion.div>
            <div className="text-xs font-sans text-slate-500 uppercase tracking-widest mt-1">Annual Events</div>
          </div>
          <div className="text-center border-l border-slate-800/80">
            <motion.div whileHover={{ scale: 1.1 }} className="text-3xl font-bold font-sans text-amber-400">100%</motion.div>
            <div className="text-xs font-sans text-slate-500 uppercase tracking-widest mt-1">SDA Youth Vocal</div>
          </div>
        </motion.div>
      </motion.div>

      {/* Subtle Scroll Down Indicator */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8, duration: 1 }}
        onClick={() => scrollTo("itinerary")}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5 cursor-pointer group text-slate-400 hover:text-amber-400 transition-colors"
      >
        <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-slate-500 group-hover:text-amber-400 transition-colors select-none">
          Scroll to Explore
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="flex items-center justify-center bg-slate-900/60 p-1.5 rounded-full border border-slate-800/80 group-hover:border-amber-500/40 group-hover:bg-amber-500/10 transition-all shadow-lg"
        >
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400 transition-colors" />
        </motion.div>
      </motion.div>
    </section>
  );
}
