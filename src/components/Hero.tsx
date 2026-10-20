import React from "react";
import { ArrowDown, MessageCircle } from "lucide-react";
import { motion } from "motion/react";

interface HeroProps {
  onAskAI: () => void;
  webLogo?: string;
}

const ease = [0.16, 1, 0.3, 1] as const;
const rise = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease } },
};

// The four voices of an a cappella choir — each owns a colour used across the site.
const voices = [
  { letter: "S", name: "Soprano", fill: "var(--fill-coral)" },
  { letter: "A", name: "Alto", fill: "var(--fill-teal)" },
  { letter: "T", name: "Tenor", fill: "var(--fill-violet)" },
  { letter: "B", name: "Bass", fill: "var(--fill-cobalt)" },
];

export default function Hero({ onAskAI, webLogo }: HeroProps) {
  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <section
      id="home"
      className="relative flex min-h-[100svh] items-center overflow-hidden bg-slate-950 px-6 pb-20 pt-32 text-white md:px-12"
    >
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.09 } } }}
        className="mx-auto w-full max-w-6xl"
      >
        <div className="grid items-center gap-14 lg:grid-cols-[1.25fr_1fr]">
          {/* Copy */}
          <div>
            <motion.p
              variants={rise}
              className="inline-flex items-center gap-3 rounded-full border border-white/15 py-1.5 pl-2 pr-4 text-xs font-semibold text-white/70"
            >
              <span className="flex gap-1" aria-hidden="true">
                {voices.map((v) => (
                  <i key={v.letter} className="h-2.5 w-2.5 rounded-full" style={{ background: v.fill }} />
                ))}
              </span>
              A cappella · Adventist Youth Ministry · Kisumu
            </motion.p>

            <motion.h1
              variants={rise}
              className="mt-7 font-display text-[3rem] font-bold leading-[0.98] tracking-[-0.045em] sm:text-7xl lg:text-[5.6rem]"
            >
              Sounds of{" "}
              <span
                style={{
                  backgroundImage: "linear-gradient(var(--fill-coral), var(--fill-coral))",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "100% 0.16em",
                  backgroundPosition: "0 90%",
                }}
              >
                Togetherness
              </span>
            </motion.h1>

            <motion.p variants={rise} className="mt-7 max-w-xl text-lg leading-relaxed text-white/65">
              Kachamba Chorus is a voice-only gospel ministry from Kachok SDA Church — four
              parts, one sound, committed to worship, service and outreach.
            </motion.p>

            <motion.div variants={rise} className="mt-9 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={() => scrollTo("itinerary")} className="btn-solid fill-cobalt">
                See upcoming events
              </button>
              <button type="button" onClick={() => scrollTo("music")} className="btn-outline">
                Listen to our music
              </button>
            </motion.div>

            <motion.button
              variants={rise}
              type="button"
              onClick={onAskAI}
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white/55 underline decoration-white/25 underline-offset-4 transition hover:text-white"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Questions? Ask the Kachamba Guide
            </motion.button>
          </div>

          {/* Four-voice tiles */}
          <motion.div variants={rise} className="relative mx-auto w-full max-w-md">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {voices.map((v, i) => (
                <div
                  key={v.letter}
                  className={`flex aspect-square flex-col justify-between rounded-[28px] p-5 sm:rounded-[32px] sm:p-6 ${
                    i % 2 === 1 ? "translate-y-6" : ""
                  }`}
                  style={{ background: v.fill, color: "#fff" }}
                >
                  <span className="font-display text-6xl font-extrabold leading-none tracking-tighter sm:text-7xl">
                    {v.letter}
                  </span>
                  <span className="text-sm font-semibold opacity-90">{v.name}</span>
                </div>
              ))}
            </div>

            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[44%]">
              {webLogo ? (
                <img
                  src={webLogo}
                  alt="Kachamba Chorus emblem"
                  className="h-24 w-24 rounded-full border-[6px] border-slate-950 bg-slate-950 object-cover sm:h-28 sm:w-28"
                  loading="eager"
                  decoding="async"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="grid h-24 w-24 place-items-center rounded-full border-[6px] border-slate-950 bg-slate-800 font-display text-4xl font-bold sm:h-28 sm:w-28">
                  K
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Facts strip */}
        <motion.dl
          variants={rise}
          className="mt-24 grid grid-cols-3 gap-6 border-t border-white/10 pt-8 text-left"
        >
          {[
            ["2021", "Founded", "coral"],
            ["Kisumu", "Kenya", "teal"],
            ["4 parts", "A cappella gospel", "violet"],
          ].map(([big, small, hue]) => (
            <div key={big}>
              <dt
                className="font-display text-2xl font-bold tracking-tight md:text-4xl"
                style={{ color: `var(--hue-${hue})` }}
              >
                {big}
              </dt>
              <dd className="mt-1 text-xs font-medium text-white/50 md:text-sm">{small}</dd>
            </div>
          ))}
        </motion.dl>
      </motion.div>

      <button
        type="button"
        onClick={() => scrollTo("itinerary")}
        aria-label="Scroll to content"
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 rounded-full p-2 text-white/35 transition hover:text-white md:block"
      >
        <ArrowDown className="h-5 w-5 animate-bounce" aria-hidden="true" />
      </button>
    </section>
  );
}
