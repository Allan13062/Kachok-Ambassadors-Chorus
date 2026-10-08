import React, { useEffect, useRef } from "react";
import { ChevronDown, MessageCircle } from "lucide-react";
import { motion, useMotionValue, useSpring } from "motion/react";

interface HeroProps {
  onAskAI: () => void;
  webLogo?: string;
}

const ease = [0.19, 1, 0.22, 1] as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 1.15, ease },
  },
};

export default function Hero({ onAskAI, webLogo }: HeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);

  const glowX = useSpring(cursorX, { stiffness: 90, damping: 24 });
  const glowY = useSpring(cursorY, { stiffness: 90, damping: 24 });

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const rect = section.getBoundingClientRect();
    cursorX.set(rect.width / 2);
    cursorY.set(rect.height / 2);
  }, [cursorX, cursorY]);

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType === "touch") return;

    const rect = event.currentTarget.getBoundingClientRect();
    cursorX.set(event.clientX - rect.left);
    cursorY.set(event.clientY - rect.top);
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <section
      id="home"
      ref={sectionRef}
      onPointerMove={handlePointerMove}
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-6 pt-24"
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute h-96 w-96 rounded-full bg-amber-500/10 blur-3xl"
        style={{
          left: glowX,
          top: glowY,
          transform: "translate(-50%, -50%)",
        }}
      />

      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.6, ease }}
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.09),transparent_55%)]"
      />

      <div className="relative z-10 mx-auto max-w-5xl text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.12 } },
          }}
        >
          {webLogo && (
            <motion.img
              variants={itemVariants}
              src={webLogo}
              alt="Kachamba Chorus"
              className="mx-auto mb-8 h-20 w-20 rounded-full border border-white/15 object-cover shadow-2xl"
              loading="eager"
              decoding="async"
              referrerPolicy="no-referrer"
            />
          )}

          <motion.p
            variants={itemVariants}
            className="mb-4 font-mono text-[11px] uppercase tracking-[0.25em] text-amber-400"
          >
            Kachamba Chorus
          </motion.p>

          <motion.h1
            variants={itemVariants}
            className="font-display text-5xl font-bold leading-[0.95] tracking-tight text-white md:text-7xl lg:text-8xl"
          >
            Voices United.
            <br />
            <span className="font-light text-white/35">Faith in Harmony.</span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mx-auto mt-7 max-w-2xl text-sm leading-relaxed text-white/50 md:text-base"
          >
            A choral ministry committed to worship, fellowship, service,
            outreach, and sharing the gospel through music.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <button
              type="button"
              onClick={() => scrollTo("itinerary")}
              className="rounded-full bg-amber-400 px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-950 transition hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              Explore our journey
            </button>

            <button
              type="button"
              onClick={onAskAI}
              className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-xs font-semibold text-white transition hover:border-amber-400/40 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Ask Ambassador Guide
            </button>
          </motion.div>
        </motion.div>
      </div>

      <button
        type="button"
        onClick={() => scrollTo("itinerary")}
        aria-label="Scroll to itinerary"
        className="absolute bottom-7 left-1/2 -translate-x-1/2 rounded-full p-2 text-white/40 transition hover:text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
      >
        <ChevronDown className="h-5 w-5 animate-bounce" aria-hidden="true" />
      </button>
    </section>
  );
}
