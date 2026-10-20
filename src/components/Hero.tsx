import React from "react";
import { ArrowRight, ArrowUpRight, MapPin, Play, MessageCircle } from "lucide-react";
import { motion } from "motion/react";
import type { GalleryPhoto, ItineraryItem } from "../types";

interface HeroProps {
  onAskAI: () => void;
  webLogo?: string;
  /** Optional: pass dbData.gallery so the hero can show a real photo of the choir */
  photos?: GalleryPhoto[];
  /** Optional: pass dbData.itinerary so the hero can show the next event */
  events?: ItineraryItem[];
}

const ease = [0.16, 1, 0.3, 1] as const;
const rise = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.85, ease } },
};

export default function Hero({ onAskAI, webLogo, photos = [], events = [] }: HeroProps) {
  const go = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const photo = photos.find((p) => p.url && (!p.mediaType || p.mediaType === "image"));
  const next = events.find((e) => e.status !== "Past");

  return (
    <section
      id="home"
      className="relative overflow-hidden bg-slate-950 px-6 pb-20 pt-28 text-white md:px-12 md:pb-28 md:pt-36"
    >
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.09 } } }}
        className="mx-auto grid w-full max-w-6xl items-center gap-16 lg:grid-cols-12 lg:gap-12"
      >
        {/* ───────── Copy ───────── */}
        <div className="lg:col-span-7">
          <motion.p
            variants={rise}
            className="inline-flex items-center gap-2.5 rounded-full border border-white/15 px-3.5 py-1.5 text-xs font-semibold text-white/70"
          >
            
          <motion.h1
            variants={rise}
            className="mt-7 font-display text-[3.1rem] font-bold leading-[0.95] tracking-[-0.05em] sm:text-7xl lg:text-[5.75rem]"
          >
            Sounds Of
            <br />
            <span style={{ color: "var(--hue-primary)" }}>Togetherness.</span>
          </motion.h1>

          <motion.p variants={rise} className="mt-7 max-w-xl text-lg leading-relaxed text-white/65">
            Kachamba Chorus is a choral youth ministry of SDA Kachok Church.
          </motion.p>

          <motion.div variants={rise} className="mt-9 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={() => go("itinerary")} className="btn-solid fill-accent">
              See upcoming events
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => go("music")} className="btn-outline">
              <Play className="h-4 w-4" aria-hidden="true" />
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

          <motion.dl
            variants={rise}
            className="mt-14 grid max-w-lg grid-cols-3 divide-x divide-white/10 border-y border-white/10"
          >
            {[
              ["2021", "Founded"],
              ["4 parts", "Soprano to bass"],
              ["100%", "A cappella"],
            ].map(([big, small]) => (
              <div key={big} className="px-4 py-4 first:pl-0">
                <dt className="font-display text-2xl font-bold tracking-tight md:text-3xl">{big}</dt>
                <dd className="mt-0.5 text-xs font-medium text-white/50">{small}</dd>
              </div>
            ))}
          </motion.dl>
        </div>

        {/* ───────── Visual ───────── */}
        <motion.div variants={rise} className="relative mx-auto w-full max-w-md lg:col-span-5 lg:max-w-none">
          {/* offset colour block behind the photo */}
          <div
            aria-hidden="true"
            className="absolute inset-0 translate-x-3 translate-y-3 rounded-[2rem] sm:translate-x-5 sm:translate-y-5"
            style={{ background: "var(--fill-primary)" }}
          />

          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-slate-800">
            {photo ? (
              <img
                src={photo.url}
                alt={photo.title || "Kachamba Chorus"}
                className="h-full w-full object-cover"
                loading="eager"
                decoding="async"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div
                className="grid h-full w-full place-items-center"
                style={{ background: "var(--fill-secondary)" }}
              >
                <div className="rounded-full border border-white/25 p-5">
                  <div className="rounded-full border border-white/25 p-5">
                    {webLogo ? (
                      <img
                        src={webLogo}
                        alt="Kachamba Chorus emblem"
                        className="h-36 w-36 rounded-full border-4 border-white/90 object-cover sm:h-44 sm:w-44"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="grid h-36 w-36 place-items-center font-display text-7xl font-bold text-white">K</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <span
              className="absolute left-4 top-4 rounded-full px-3 py-1.5 text-xs font-bold text-white"
              style={{ background: "var(--fill-secondary)" }}
            >
              Kachok SDA Church
            </span>
          </div>

          {/* Next-up card */}
          <button
            type="button"
            onClick={() => go("itinerary")}
            className="group absolute -bottom-6 left-3 right-3 rounded-2xl border border-white/10 bg-slate-900 p-4 text-left shadow-2xl shadow-black/30 transition hover:-translate-y-1 sm:-left-8 sm:right-auto sm:w-[19rem]"
          >
            <span className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.14em]">
              <span style={{ color: "var(--hue-accent)" }}>{next ? "Next up" : "On the road"}</span>
              <ArrowUpRight className="h-4 w-4 text-white/40 transition group-hover:text-white" aria-hidden="true" />
            </span>
            <span className="mt-1.5 block font-display text-lg font-semibold leading-snug tracking-tight">
              {next ? next.event : "See where we’re singing next"}
            </span>
            <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/55">
              {next ? (
                <>
                  <span>
                    {next.date}
                    {next.time ? ` · ${next.time}` : ""}
                  </span>
                  {next.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" aria-hidden="true" />
                      {next.location}
                    </span>
                  )}
                </>
              ) : (
                <span>Concerts, vespers and outreach — full itinerary</span>
              )}
            </span>
          </button>
        </motion.div>
      </motion.div>
    </section>
  );
}
