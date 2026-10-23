import React from "react";
import { ArrowRight, MapPin } from "lucide-react";
import type { GalleryPhoto, ItineraryItem } from "../types";

interface HeroProps {
  onAskAI: () => void;
  webLogo?: string;
  photos?: GalleryPhoto[];
  events?: ItineraryItem[];
}

export default function Hero({ photos = [], events = [] }: HeroProps) {
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  // Main image: first gallery photo if there is one, otherwise public/hero.jpg
  const photo = photos.find((p) => p.url && (!p.mediaType || p.mediaType === "image"));
  const image = photo?.url || "/hero.jpg";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const next = [...events]
    .filter((e) => e.status !== "Past" && !Number.isNaN(new Date(e.date).getTime()) && new Date(e.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  const nextDate = next
    ? new Date(next.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";

  return (
    <section id="home" style={{ backgroundColor: "#FFFFFF" }} className="px-5 pb-16 pt-28 text-center md:px-10 md:pb-20 md:pt-36">
      <div className="mx-auto max-w-3xl">
        <span className="eyebrow-pill">Kachok SDA Church · Kisumu, Kenya</span>

        <h1 className="hero-title mt-6 font-display font-bold text-[#0B2A4A]">
          Sounds of <span className="accent-word">Togetherness.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[#0B2A4A]/75 md:text-lg">
          Kachamba Chorus is a vibrant Adventist Youth Ministry focused on worship, service and outreach, with the sole aim of bringing back the lost sheep into the fold.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button type="button" onClick={() => go("itinerary")} className="btn-navy">
            See upcoming events
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => go("music")} className="btn-outline-navy">
            Listen to our music
          </button>
        </div>
      </div>

      {/* Photo: no box, edges fade into the page */}
      <div className="mx-auto mt-12 max-w-5xl">
        <img
          src={image}
          alt="Kachamba Chorus performing"
          loading="eager"
          decoding="async"
          referrerPolicy="no-referrer"
          className="hero-photo aspect-[16/9] w-full object-cover"
        />
      </div>

      {/* Next event strip */}
      <button
        type="button"
        onClick={() => go("itinerary")}
        className="group mx-auto mt-8 flex w-full max-w-4xl items-center justify-between gap-4 rounded-xl border border-[#0B2A4A]/10 bg-[#F4F8FC] px-5 py-4 text-left transition hover:border-[#F09010]/50"
      >
        <span className="min-w-0">
          <span className="block text-[11px] font-semibold tracking-wide text-[#D9730A]">
            {next ? "Next event" : "Upcoming"}
          </span>
          <span className="block truncate font-display text-base font-semibold text-[#0B2A4A] md:text-lg">
            {next ? next.event : "See where we are singing next"}
          </span>
        </span>

        {next && (
          <span className="hidden shrink-0 items-center gap-4 text-xs text-[#0B2A4A]/70 sm:flex">
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
          </span>
        )}

        <ArrowRight className="h-5 w-5 shrink-0 text-[#0B2A4A]/50 transition group-hover:translate-x-1 group-hover:text-[#D9730A]" aria-hidden="true" />
      </button>
    </section>
  );
}
