import React from "react";
import { ArrowRight, MapPin, MessageCircle } from "lucide-react";
import type { GalleryPhoto, ItineraryItem } from "../types";

interface HeroProps {
  onAskAI: () => void;
  webLogo?: string;
  photos?: GalleryPhoto[];
  events?: ItineraryItem[];
}

export default function Hero({ onAskAI, webLogo, photos = [], events = [] }: HeroProps) {
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const photo = photos.find((p) => p.url && (!p.mediaType || p.mediaType === "image"));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const next = [...events]
    .filter((e) => e.status !== "Past" && !Number.isNaN(new Date(e.date).getTime()) && new Date(e.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  return (
    <section id="home" className="relative overflow-hidden bg-slate-950 px-5 pb-16 pt-24 text-white md:px-10 md:pb-24 md:pt-32">
      <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-12 lg:gap-10">
        {/* Copy */}
        <div className="lg:col-span-7">
          <h1 className="hero-title mt-5 font-display font-bold text-white">
            Sounds of <span className="text-amber-400">togetherness.</span>
          </h1>

          <p className="mt-5 max-w-md text-base leading-relaxed text-white/65">
            Kachamba Chorus is the a cappella ministry of Kachok SDA Church. Worship, service and outreach, carried by voice alone.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={() => go("itinerary")} className="btn-solid fill-accent">
              See upcoming events
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => go("music")} className="btn-outline">
              Listen to our music
            </button>
          </div>

          <button
            type="button"
            onClick={onAskAI}
            className="mt-6 inline-flex items-center gap-2 text-sm text-white/55 underline decoration-white/25 underline-offset-4 transition hover:text-white"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Questions? Ask the Kachamba Guide
          </button>

          <dl className="mt-12 grid max-w-md grid-cols-3 divide-x divide-white/10 border-y border-white/10">
            {[
              ["2021", "Founded"],
              ["4 parts", "Soprano to bass"],
              ["100%", "A cappella"],
            ].map(([big, small]) => (
              <div key={big} className="px-4 py-4 first:pl-0">
                <dt className="font-display text-lg font-bold tracking-tight">{big}</dt>
                <dd className="mt-0.5 text-xs text-white/50">{small}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Visual */}
        <div className="relative mx-auto w-full max-w-sm lg:col-span-5 lg:max-w-none">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-slate-800">
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
              <div className="grid h-full w-full place-items-center bg-gradient-to-b from-slate-800 to-slate-900">
                {webLogo ? (
                  <img src={webLogo} alt="Kachamba Chorus emblem" className="h-40 w-40 rounded-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span className="font-display text-6xl font-bold text-white/80">K</span>
                )}
              </div>
            )}
          </div>

          {/* Next up */}
          <button
            type="button"
            onClick={() => go("itinerary")}
            className="absolute -bottom-6 left-4 right-4 rounded-xl border border-white/10 bg-slate-900 p-4 text-left shadow-2xl shadow-black/40 transition hover:border-amber-400/50 sm:left-auto sm:right-auto sm:-left-8 sm:w-72"
          >
            <span className="block text-xs font-semibold text-amber-400">{next ? "Next up" : "On the road"}</span>
            <span className="mt-1 block font-display text-base font-semibold leading-snug">
              {next ? next.event : "See where we’re singing next"}
            </span>
            {next && (
              <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/55">
                <span>
                  {new Date(next.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  {next.time ? ` · ${next.time}` : ""}
                </span>
                {next.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" aria-hidden="true" />
                    {next.location}
                  </span>
                )}
              </span>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
