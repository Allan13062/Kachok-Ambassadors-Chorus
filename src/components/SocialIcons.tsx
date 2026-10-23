import React from "react";
import { FaFacebookF, FaInstagram, FaSpotify, FaTiktok, FaXTwitter, FaYoutube } from "react-icons/fa6";
import { SiApplemusic } from "react-icons/si";

/* Official brand logos. Requires the "react-icons" package (see package.json). */
export const BRAND_ICONS = {
  facebook: FaFacebookF,
  instagram: FaInstagram,
  tiktok: FaTiktok,
  youtube: FaYoutube,
  x: FaXTwitter,
  spotify: FaSpotify,
  apple: SiApplemusic,
} as const;

export type BrandKey = keyof typeof BRAND_ICONS;

export const SOCIAL_LINKS: { key: BrandKey; href: string; label: string }[] = [
  { key: "facebook", href: "https://www.facebook.com/share/1GjHUY1u8a/", label: "Facebook" },
  { key: "tiktok", href: "https://www.tiktok.com/@kachokambassadors", label: "TikTok" },
  { key: "youtube", href: "https://youtube.com/@kachambachorus", label: "YouTube" },
];

export function BrandIcon({ name, className = "h-4 w-4" }: { name: BrandKey; className?: string }) {
  const Icon = BRAND_ICONS[name];
  return <Icon className={className} aria-hidden="true" />;
}

export function SocialLinks() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {SOCIAL_LINKS.map(({ key, href, label }) => (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Kachamba Chorus on ${label}`}
          title={label}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3.5 py-2 text-xs font-semibold text-white/80 transition hover:border-amber-400/60 hover:text-white"
        >
          <BrandIcon name={key} className="h-3.5 w-3.5" />
          {label}
        </a>
      ))}
    </div>
  );
}
