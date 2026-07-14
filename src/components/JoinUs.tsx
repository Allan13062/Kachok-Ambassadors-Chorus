import React from "react";
import { motion } from "motion/react";
import { Heart, Calendar } from "lucide-react";

interface JoinFamilyCTAProps {
  theme?: "dark" | "light";
}

// A bold, self-contained closing statement before the footer — the "come sing
// with us" moment the site didn't have a dedicated place for. Deliberately
// solid amber rather than a vibrant multi-color gradient, to stay consistent
// with the rest of the site's quieter, photography-led language.
export default function JoinFamilyCTA({ theme = "dark" }: JoinFamilyCTAProps) {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const headerOffset = 72;
      const y = el.getBoundingClientRect().top + window.pageYOffset - headerOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <section className="relative py-20 px-6 md:px-12 overflow-hidden bg-amber-500">
      {/* Quiet texture, not a rainbow blur-orb — a single soft dark vignette at the edges */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-amber-500 to-amber-600" />
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-slate-950/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-slate-950/10 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl mx-auto text-center relative z-10"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-950/15 border border-slate-950/10 mb-6">
          <Heart className="w-8 h-8 text-slate-950" fill="currentColor" fillOpacity={0.15} />
        </div>

        <h2 className="font-display font-semibold text-3xl sm:text-5xl text-slate-950 tracking-tight leading-[1.1] mb-4">
          Join the Kachamba <span className="font-light">Family</span>
        </h2>

        <p className="font-sans text-sm sm:text-base text-slate-900/80 max-w-xl mx-auto mb-9 leading-relaxed">
          Whether you're a seasoned singer or a passionate beginner, there's a voice for you in the Kachamba Chorus. Come sing with us.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => scrollTo("join")}
            className="w-full sm:w-auto bg-slate-950 hover:bg-slate-900 text-white font-sans font-semibold text-sm px-8 py-3.5 rounded-full transition-colors cursor-pointer"
          >
            Get In Touch
          </button>
          <button
            onClick={() => scrollTo("itinerary")}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-transparent hover:bg-slate-950/10 border border-slate-950/30 hover:border-slate-950/50 text-slate-950 font-sans font-semibold text-sm px-8 py-3.5 rounded-full transition-all cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            View Events
          </button>
        </div>
      </motion.div>
    </section>
  );
}
