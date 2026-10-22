import React from "react";
import { ArrowRight, MapPin, MessageCircle } from "lucide-react";
import type { GalleryPhoto, ItineraryItem } from "../types";

interface HeroProps {
  onAskAI: () => void;
  webLogo?: string;
  photos?: GalleryPhoto[];
  events?: ItineraryItem[];
}

export default function Hero({ onAskAI, photos = [], events = [] }: HeroProps) {
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  // Background: first gallery photo if there is one, otherwise public/hero.jpg
  const photo = photos.find((p) => p.url && (!p.mediaType || p.mediaType === "image"));
  const background = photo?.url || "/hero.jpg";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const next = [...events]
    .filter((e) => e.status !== "Past" && !Number.isNaN(new Date(e.date).getTime()) && new Date(e.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  const nextDate = next
    ? new Date(next.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";

  return (
    <section id="home" className="relative isolate flex min-h-[92vh] flex-col justify-end overflow-hidden bg-slate-950 text-white">
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: `url("${background}")` }}
        role="img"
        aria-label="Kachamba Chorus singing"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/30" />

      <div className="mx-auto w-full max-w-6xl px-5 pb-12 pt-36 md:px-10 md:pb-16">
        <p className="text-xs font-semibold tracking-wide text-white/80">Kachok SDA Church · Kisumu, Kenya</p>

        <h1 className="hero-title mt-4 max-w-3xl font-display font-bold text-white">
          Sounds of <span className="accent-word">togetherness.</span>
        </h1>

        <p className="mt-5 max-w-lg text-base leading-relaxed text-white/75">
          Kachamba Chorus is the a cappella ministry of Kachok SDA Church. Worship, service and outreach, carried by voice alone.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => go("itinerary")} className="btn-solid fill-accent">
            See upcoming events
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => go("music")} className="btn-outline">
            Listen to our music
          </button>
          <button
            type="button"
            onClick={onAskAI}
            className="inline-flex items-center gap-2 px-2 text-sm text-white/70 underline underline-offset-4 hover:text-white"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Ask the guide
          </button>
        </div>
      </div>

      {/* Next event strip */}
      <a
        href="#itinerary"
        onClick={(e) => {
          e.preventDefault();
          go("itinerary");
        }}
        className="group relative block w-full border-t border-white/15 bg-slate-950/85"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 md:px-10">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-wide text-amber-400">
              {next ? "Next event" : "Upcoming"}
            </p>
            <p className="truncate font-display text-base font-semibold md:text-lg">
              {next ? next.event : "See where we are singing next"}
            </p>
          </div>

          {next && (
            <div className="hidden shrink-0 items-center gap-5 text-xs text-white/65 sm:flex">
              <span>
                {nextDate}
                {next.time ? ` · ${next.time}` : ""}
              </span>
              {next.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" aria-hidden="true" />
                  {next.location}
                </span>
              )}
            </div>
          )}

          <ArrowRight
            className="h-5 w-5 shrink-0 text-white/60 transition group-hover:translate-x-1 group-hover:text-amber-400"
            aria-hidden="true"
          />
        </div>
      </a>
    </section>
  );
}
