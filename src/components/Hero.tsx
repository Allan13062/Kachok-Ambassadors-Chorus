import React from "react";
import { ChevronRight, Calendar, Volume2, ChevronDown, Users, Music } from "lucide-react";
import { motion } from "motion/react";

interface HeroProps {
  onAskAI: () => void;
  webLogo?: string;
}

export default function Hero({ onAskAI, webLogo }: HeroProps) {
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
        staggerChildren: 0.18,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 90, damping: 18 },
    },
  };

  const logoVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 18 },
    },
  };

  const statsContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const statsCardVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 15 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 16 },
    },
  };

  return (
    <section 
      id="home"
      className="relative min-h-[95vh] bg-slate-950 text-white flex flex-col justify-center items-center px-4 sm:px-6 md:px-12 py-24 sm:py-32 overflow-hidden"
    >
      {/* Background Image Layer with Zoom-In Transition */}
      <motion.div 
        initial={{ scale: 1.05, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.5 }}
        transition={{ duration: 2, ease: "easeOut" }}
        className="absolute inset-0 z-0 select-none pointer-events-none"
      >
        <img 
          src="/WhatsApp Image 2026-06-11 at 11.06.18 AM.jpeg" 
          alt="Kachamba Chorus Choir Group" 
          className="w-full h-full object-cover brightness-[0.75] saturate-100"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/40 to-slate-950" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/30 via-transparent to-slate-950/30" />
      </motion.div>

      {/* Soft Radial Gradient Vignette behind the text to guarantee premium readability of the yellow branding */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(2,6,23,0.75)_0%,transparent_65%)] z-10 pointer-events-none" />

      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none z-0 animate-pulse" style={{ animationDuration: "8s" }} />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-amber-600/5 blur-3xl pointer-events-none z-0 animate-pulse" style={{ animationDuration: "12s" }} />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center text-center max-w-4xl z-20 w-full"
      >
        {/* Hero Logo & Badge */}
        <div className="mb-6 flex flex-col items-center gap-4">
          {/* Elegant Animated Logo frame with Gold-Blue Radial Glow shadow */}
          <motion.div 
            variants={logoVariants}
            className="relative group cursor-pointer"
          >
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-500 via-amber-450 to-amber-300 opacity-30 blur-xl group-hover:opacity-60 transition duration-1000" />
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border border-amber-500/30 bg-[#070E1B] p-1 shadow-2xl transition duration-500 group-hover:scale-105">
              <img 
                src={webLogo || "https://www.image2url.com/r2/default/images/1781098447744-9bfd4cd8-4c62-4a1a-b218-7ccd6f1b36d2.png"} 
                alt="Kachamba Chorus Official Logo" 
                className="w-full h-full object-cover rounded-full"
                referrerPolicy="no-referrer"
              />
            </div>
          </motion.div>
        </div>

        {/* Main Heading */}
        <motion.h1 
          variants={itemVariants}
          className="font-sans font-black tracking-tight text-4xl sm:text-6xl md:text-7xl leading-[1.1] text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 drop-shadow-[0_4px_24px_rgba(0,0,0,0.98)] select-none"
        >
          KACHAMBA CHORUS
        </motion.h1>
        
        <motion.h2 
          variants={itemVariants}
          className="font-sans font-bold text-lg sm:text-2xl md:text-3xl text-white mt-4 tracking-tight drop-shadow-[0_3px_12px_rgba(0,0,0,0.98)] pb-1 max-w-3xl"
        >
          Kachok Ambassadors Chorus — Sounds Of Togetherness
        </motion.h2>

        <motion.p 
          variants={itemVariants}
          className="font-sans text-sm sm:text-base md:text-lg text-slate-300 font-medium max-w-2xl mx-auto mt-5 leading-relaxed drop-shadow-md px-2"
        >
          Spreading the Gospel of Jesus Christ and the Three Angels' Messages through absolute vocal harmony, dedicated youth fellowship, and passionate community mission outreach.
        </motion.p>

        {/* CTAs */}
        <motion.div 
          variants={itemVariants}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 w-full max-w-md sm:max-w-none px-4 sm:px-0"
        >
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => scrollTo("itinerary")}
            className="flex items-center justify-center gap-2 w-full sm:w-auto sm:min-w-[200px] bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-sans font-bold text-sm px-8 py-3.5 rounded-xl shadow-lg hover:shadow-amber-500/20 duration-150 transition-all cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            <span>View Our Itinerary</span>
            <ChevronRight className="w-4 h-4" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={onAskAI}
            className="flex items-center justify-center gap-2 w-full sm:w-auto sm:min-w-[200px] bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 font-sans font-semibold text-sm px-8 py-3.5 rounded-xl duration-150 transition-all cursor-pointer"
          >
            <Volume2 className="w-4 h-4 text-amber-400" />
            <span>Ask Kachamba Guide</span>
          </motion.button>
        </motion.div>

        {/* Scripture Banner */}
        <motion.div 
          variants={itemVariants}
          className="mt-12 text-center max-w-xl px-4 w-full"
        >
          <div className="h-px w-16 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mx-auto mb-6" />
          <p className="font-serif italic text-base sm:text-lg text-slate-300 leading-relaxed">
            "I will sing unto the Lord as long as I live: I will sing praise to my God while I have my being."
          </p>
          <span className="block font-sans not-italic font-bold text-slate-400 text-xs mt-2 uppercase tracking-widest">— Psalm 104:33</span>
        </motion.div>

        {/* Modern Stats Grid - Perfectly Aligned & Standardized */}
        <motion.div 
          variants={statsContainerVariants}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-4xl w-full px-2 sm:px-0"
        >
          {/* Card 1 */}
          <motion.div 
            variants={statsCardVariants}
            whileHover={{ y: -4, scale: 1.02 }}
            className="relative group overflow-hidden bg-gradient-to-b from-slate-900/40 to-slate-950/60 backdrop-blur-md border border-slate-900 p-5 sm:p-6 rounded-2xl shadow-lg transition-all duration-300 hover:border-amber-500/30 hover:shadow-amber-500/5 flex flex-col items-center justify-center text-center min-h-[145px] sm:min-h-[160px] h-full"
          >
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-amber-500/5 blur-xl group-hover:bg-amber-500/10 transition-colors duration-500" />
            
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/80 group-hover:border-amber-500/20 group-hover:bg-amber-500/5 transition-all duration-300 text-amber-450 mb-3">
              <Users className="w-5 h-5" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-sans text-transparent bg-clip-text bg-gradient-to-r from-amber-250 to-amber-450 leading-none">
              40+
            </div>
            <div className="text-[10px] sm:text-xs font-bold font-sans text-slate-400 group-hover:text-amber-200 transition-colors uppercase tracking-widest mt-2 leading-none">
              Active Singers
            </div>
          </motion.div>

          {/* Card 2 */}
          <motion.div 
            variants={statsCardVariants}
            whileHover={{ y: -4, scale: 1.02 }}
            className="relative group overflow-hidden bg-gradient-to-b from-slate-900/40 to-slate-950/60 backdrop-blur-md border border-slate-900 p-5 sm:p-6 rounded-2xl shadow-lg transition-all duration-300 hover:border-amber-500/30 hover:shadow-amber-500/5 flex flex-col items-center justify-center text-center min-h-[145px] sm:min-h-[160px] h-full"
          >
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-amber-500/5 blur-xl group-hover:bg-amber-500/10 transition-colors duration-500" />
            
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/80 group-hover:border-amber-500/20 group-hover:bg-amber-500/5 transition-all duration-300 text-amber-450 mb-3">
              <Music className="w-5 h-5" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-sans text-transparent bg-clip-text bg-gradient-to-r from-amber-250 to-amber-450 leading-none">
              4
            </div>
            <div className="text-[10px] sm:text-xs font-bold font-sans text-slate-400 group-hover:text-amber-200 transition-colors uppercase tracking-widest mt-2 leading-none">
              SDA Parts (SATB)
            </div>
          </motion.div>

          {/* Card 3 */}
          <motion.div 
            variants={statsCardVariants}
            whileHover={{ y: -4, scale: 1.02 }}
            className="relative group overflow-hidden bg-gradient-to-b from-slate-900/40 to-slate-950/60 backdrop-blur-md border border-slate-900 p-5 sm:p-6 rounded-2xl shadow-lg transition-all duration-300 hover:border-amber-500/30 hover:shadow-amber-500/5 flex flex-col items-center justify-center text-center min-h-[145px] sm:min-h-[160px] h-full"
          >
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-amber-500/5 blur-xl group-hover:bg-amber-500/10 transition-colors duration-500" />
            
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/80 group-hover:border-amber-500/20 group-hover:bg-amber-500/5 transition-all duration-300 text-amber-450 mb-3">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-sans text-transparent bg-clip-text bg-gradient-to-r from-amber-250 to-amber-450 leading-none">
              12+
            </div>
            <div className="text-[10px] sm:text-xs font-bold font-sans text-slate-400 group-hover:text-amber-200 transition-colors uppercase tracking-widest mt-2 leading-none">
              Annual Events
            </div>
          </motion.div>

          {/* Card 4 */}
          <motion.div 
            variants={statsCardVariants}
            whileHover={{ y: -4, scale: 1.02 }}
            className="relative group overflow-hidden bg-gradient-to-b from-slate-900/40 to-slate-950/60 backdrop-blur-md border border-slate-900 p-5 sm:p-6 rounded-2xl shadow-lg transition-all duration-300 hover:border-amber-500/30 hover:shadow-amber-500/5 flex flex-col items-center justify-center text-center min-h-[145px] sm:min-h-[160px] h-full"
          >
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-amber-500/5 blur-xl group-hover:bg-amber-500/10 transition-colors duration-500" />
            
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/80 group-hover:border-amber-500/20 group-hover:bg-amber-500/5 transition-all duration-300 text-amber-450 mb-3">
              <Volume2 className="w-5 h-5" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-sans text-transparent bg-clip-text bg-gradient-to-r from-amber-250 to-amber-450 leading-none">
              100%
            </div>
            <div className="text-[10px] sm:text-xs font-bold font-sans text-slate-400 group-hover:text-amber-200 transition-colors uppercase tracking-widest mt-2 leading-none">
              SDA Youth Vocal
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Subtle Scroll Down Indicator */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        onClick={() => scrollTo("itinerary")}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5 cursor-pointer group text-slate-400 hover:text-amber-400 transition-colors"
      >
        <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-slate-500 group-hover:text-amber-400 transition-colors select-none">
          Scroll to Explore
        </span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="flex items-center justify-center bg-slate-900/60 p-1.5 rounded-full border border-slate-850 group-hover:border-amber-500/40 group-hover:bg-amber-500/10 transition-all shadow-lg"
        >
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400 transition-colors" />
        </motion.div>
      </motion.div>
    </section>
  );
}
