import React, { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, Share2, Volume2, VolumeX, RotateCcw, RotateCw, Check, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { MusicData } from "../types";
import { BrandIcon, BrandKey } from "./SocialIcons";

/* ───────────────────────── Config ───────────────────────── */

/** Visitors hear at most this many seconds, then are pointed to the streaming apps. */
const PREVIEW_SECONDS = 45;

const FALLBACK_COVER =
  "https://www.image2url.com/r2/default/images/1781098447744-9bfd4cd8-4c62-4a1a-b218-7ccd6f1b36d2.png";

/* icon = built-in brand logo; logo = image file in /public/logos */
const PLATFORMS: { name: string; url: string; icon?: BrandKey; logo?: string; color?: string }[] = [
  { name: "Spotify", url: "https://open.spotify.com/artist/6w0ZfVIEtqgYSzsrtZds3O?si=aWzhTq9PTtCEpHPTvOdbDw", icon: "spotify", color: "#1DB954" },
  { name: "YouTube", url: "https://youtube.com/@kachambachorus?si=Mqg13XYzO8QFE9fE", icon: "youtube", color: "#FF0000" },
  { name: "Apple Music", url: "https://music.apple.com/ke/artist/kachok-ambassadors-chorus/1747560210", icon: "apple", color: "#FA243C" },
  { name: "Boomplay", url: "https://www.boomplay.com/artists/90917648?srModel=COPYLINK&srList=WEB&share_content=artist&share_channel=copylink&share_platform=web", logo: "/logos/boomplay.png" },
];

/* ───────────────────────── Helpers ───────────────────────── */

/**
 * Google Drive / Dropbox "share" links are web pages, not audio files, so a plain
 * <audio> tag can't play them. Route those through the site's own /api/proxy-audio.
 */
function resolveAudioSrc(url: string): string {
  if (!url) return "";
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;
  if (/drive\.google\.com|docs\.google\.com|dropbox\.com/i.test(url)) {
    return `/api/proxy-audio?url=${encodeURIComponent(url)}`;
  }
  return url;
}

const fmt = (s: number) => {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
};

type Status = "ok" | "error";
type Tab = "about" | "lyrics";

/* ───────────────────────── Component ───────────────────────── */

export default function MusicStreaming({ music }: { music: MusicData; theme?: "dark" | "light" }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const title = music?.songTitle || "Latest release";
  const artist = music?.artistName || "Kachamba Chorus";
  const album = music?.albumName || "Sounds Of Togetherness";
  const cover = music?.coverUrl || FALLBACK_COVER;
  const rawAudio = (music?.audioUrl || "").trim();
  const src = useMemo(() => resolveAudioSrc(rawAudio), [rawAudio]);
  const hasAudio = Boolean(src);

  const [status, setStatus] = useState<Status>("ok");
  const [buffering, setBuffering] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [tab, setTab] = useState<Tab>("about");
  const [copied, setCopied] = useState(false);

  // The most anyone hears: the preview limit, or the whole file if it is shorter.
  const limit = duration > 0 ? Math.min(duration, PREVIEW_SECONDS) : PREVIEW_SECONDS;
  const isFullTrack = duration > 0 && duration <= PREVIEW_SECONDS;
  const progress = limit > 0 ? Math.min(1, current / limit) : 0;

  /* Reset whenever the song changes */
  useEffect(() => {
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.currentTime = 0;
    }
    setPlaying(false);
    setCurrent(0);
    setDuration(0);
    setStatus("ok");
    setBuffering(false);
  }, [src, hasAudio]);

  /* Stop sound when the component unmounts */
  useEffect(() => () => audioRef.current?.pause(), []);

  /* Lock-screen / headset controls on phones */
  useEffect(() => {
    if (!playing || !("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title,
        artist,
        album,
        artwork: [{ src: cover, sizes: "512x512" }],
      });
      navigator.mediaSession.setActionHandler("play", () => audioRef.current?.play());
      navigator.mediaSession.setActionHandler("pause", () => audioRef.current?.pause());
      navigator.mediaSession.setActionHandler("seekbackward", () => seekBy(-10));
      navigator.mediaSession.setActionHandler("seekforward", () => seekBy(10));
    } catch {
      /* Media Session is optional */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, title, artist, album, cover]);

  /* ── actions ── */
  const toggle = async () => {
    const a = audioRef.current;
    if (!a || !hasAudio) return;
    try {
      if (a.paused) {
        if (status === "error") {
          setStatus("ok");
          a.load();
        }
        setBuffering(true);
        await a.play();
      } else {
        a.pause();
      }
    } catch (err) {
      console.warn("Audio playback failed:", err);
      setPlaying(false);
      setBuffering(false);
      setStatus("error");
    }
  };

  const seekTo = (seconds: number) => {
    const a = audioRef.current;
    if (!a) return;
    const t = Math.max(0, Math.min(limit - 0.05, seconds));
    a.currentTime = t;
    setCurrent(t);
  };
  const seekBy = (delta: number) => seekTo((audioRef.current?.currentTime ?? 0) + delta);

  const seekFromPointer = (clientX: number) => {
    const el = trackRef.current;
    if (!el || !hasAudio) return;
    const r = el.getBoundingClientRect();
    seekTo(((clientX - r.left) / r.width) * limit);
  };

  const retry = () => {
    const a = audioRef.current;
    if (!a) return;
    setStatus("ok");
    setBuffering(true);
    a.load();
    a.play().catch(() => {
      setBuffering(false);
      setStatus("error");
    });
  };

  const applyVolume = (v: number) => {
    setVolume(v);
    setMuted(v === 0);
    if (audioRef.current) {
      audioRef.current.volume = v;
      audioRef.current.muted = v === 0;
    }
  };
  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    if (audioRef.current) audioRef.current.muted = next;
  };

  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}#music`;
    try {
      if (navigator.share) {
        await navigator.share({ title, text: `${title} — ${artist}`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* user cancelled */
    }
  };

  /* ───────────────────────── UI ───────────────────────── */
  return (
    <section id="music" className="relative bg-slate-950 px-5 py-16 text-white md:px-10 md:py-20">
      <div className="mx-auto max-w-5xl">
        {/* Heading */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-amber-400">Music</p>
          <h2 className="mt-2 font-display text-[2rem] font-bold leading-tight tracking-tight md:text-[2.4rem]">
            Listen to our latest
          </h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-white/55">
            Play a short preview here, then stream the full song on your favourite app.
          </p>
        </div>

        {/* Player card */}
        <div className="grid max-w-3xl gap-5 rounded-2xl border border-white/10 bg-slate-900 p-4 sm:grid-cols-[7.5rem_1fr] sm:items-center sm:p-5">
          {/* Cover */}
          <button
            type="button"
            onClick={toggle}
            disabled={!hasAudio}
            aria-label={playing ? "Pause preview" : "Play preview"}
            className="group relative aspect-square w-28 overflow-hidden rounded-xl bg-slate-800 disabled:cursor-default sm:w-full"
          >
            <img
              src={cover}
              alt={`${album} cover art`}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
            />
            {playing && (
              <span className="absolute bottom-2 left-2 flex h-5 items-end gap-[2px] rounded bg-black/60 px-1.5 py-1" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <motion.i
                    key={i}
                    className="block w-[2px] origin-bottom rounded-full bg-white"
                    style={{ height: "100%" }}
                    animate={{ scaleY: [0.3, 1, 0.5, 0.9, 0.3] }}
                    transition={{ duration: 1 + i * 0.2, repeat: Infinity, ease: "easeInOut" }}
                  />
                ))}
              </span>
            )}
          </button>

          {/* Info + controls */}
          <div className="min-w-0">
            <p className="text-xs font-medium text-white/45">
              {music?.label || "Latest release"} · {album}
            </p>
            <h3 className="mt-1 truncate font-display text-xl font-semibold leading-snug md:text-2xl">{title}</h3>
            <p className="truncate text-sm text-white/55">{artist}</p>

            {/* Progress */}
            <div className="mt-4">
              <div
                ref={trackRef}
                role="slider"
                tabIndex={hasAudio ? 0 : -1}
                aria-label="Seek through preview"
                aria-valuemin={0}
                aria-valuemax={Math.round(limit)}
                aria-valuenow={Math.round(current)}
                aria-valuetext={`${fmt(current)} of ${fmt(limit)}`}
                aria-disabled={!hasAudio}
                onPointerDown={(e) => {
                  if (!hasAudio) return;
                  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                  seekFromPointer(e.clientX);
                }}
                onPointerMove={(e) => {
                  if (e.buttons === 1) seekFromPointer(e.clientX);
                }}
                onKeyDown={(e) => {
                  if (!hasAudio) return;
                  if (e.key === "ArrowRight") { e.preventDefault(); seekBy(5); }
                  if (e.key === "ArrowLeft") { e.preventDefault(); seekBy(-5); }
                  if (e.key === "Home") { e.preventDefault(); seekTo(0); }
                  if (e.key === "End") { e.preventDefault(); seekTo(limit - 0.1); }
                  if (e.key === " ") { e.preventDefault(); toggle(); }
                }}
                className={`relative flex h-5 touch-none select-none items-center ${hasAudio ? "cursor-pointer" : "opacity-40"}`}
              >
                <span className="absolute inset-x-0 h-1 rounded-full bg-white/15" />
                <span
                  className="absolute left-0 h-1 rounded-full transition-[width] duration-150"
                  style={{ width: `${progress * 100}%`, background: "var(--fill-primary)" }}
                />
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] tabular-nums text-white/45">
                <span>{fmt(current)}</span>
                <span>{isFullTrack ? "Full track" : `${PREVIEW_SECONDS}s preview`}</span>
                <span>{fmt(limit)}</span>
              </div>
            </div>

            {/* Transport */}
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={toggle}
                disabled={!hasAudio}
                aria-label={playing ? "Pause" : "Play"}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-slate-950 transition hover:brightness-110 disabled:opacity-40"
                style={{ background: "var(--fill-accent)" }}
              >
                {buffering ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                ) : playing ? (
                  <Pause className="h-5 w-5 fill-current" aria-hidden="true" />
                ) : (
                  <Play className="ml-0.5 h-5 w-5 fill-current" aria-hidden="true" />
                )}
              </button>

              <button
                type="button"
                onClick={() => seekBy(-10)}
                disabled={!hasAudio}
                aria-label="Back 10 seconds"
                className="grid h-9 w-9 place-items-center rounded-full text-white/60 transition hover:text-white disabled:opacity-30"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => seekBy(10)}
                disabled={!hasAudio}
                aria-label="Forward 10 seconds"
                className="grid h-9 w-9 place-items-center rounded-full text-white/60 transition hover:text-white disabled:opacity-30"
              >
                <RotateCw className="h-4 w-4" aria-hidden="true" />
              </button>

              <div className="ml-auto flex items-center gap-1">
                <div className="hidden items-center gap-1.5 md:flex">
                  <button
                    type="button"
                    onClick={toggleMute}
                    aria-label={muted ? "Unmute" : "Mute"}
                    className="grid h-8 w-8 place-items-center rounded-full text-white/60 transition hover:text-white"
                  >
                    {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={muted ? 0 : volume}
                    onChange={(e) => applyVolume(Number(e.target.value))}
                    aria-label="Volume"
                    className="w-16"
                    style={{ accentColor: "var(--fill-primary)" }}
                  />
                </div>
                <button
                  type="button"
                  onClick={share}
                  aria-label="Share this song"
                  className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold text-white/70 transition hover:text-white"
                >
                  {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Share2 className="h-3.5 w-3.5" aria-hidden="true" />}
                  {copied ? "Copied" : "Share"}
                </button>
              </div>
            </div>

            {/* Status line */}
            <div className="mt-3 min-h-[1.25rem] text-xs" aria-live="polite">
              {!hasAudio && <p className="text-white/50">Preview coming soon. You can already stream the full song below.</p>}
              {status === "error" && hasAudio && (
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1" style={{ color: "var(--hue-accent)" }}>
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    Couldn’t load the preview.
                  </span>
                  <button type="button" onClick={retry} className="inline-flex items-center gap-1 font-semibold underline underline-offset-4">
                    <RefreshCw className="h-3 w-3" aria-hidden="true" />
                    Try again
                  </button>
                </p>
              )}
              {hasAudio && status !== "error" && (
                <p className="text-white/45">
                  Want the full song?{" "}
                  <button
                    type="button"
                    onClick={() => document.getElementById("stream")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                    className="font-semibold text-white/75 underline decoration-white/25 underline-offset-4 hover:text-white"
                  >
                    Stream it
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Lyrics / about (compact) */}
        <div className="mt-5 max-w-3xl">
          <div role="tablist" aria-label="Song details" className="flex gap-1">
            {(["about", "lyrics"] as Tab[]).map((t) => (
              <button
                key={t}
                role="tab"
                type="button"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  tab === t ? "bg-white/10 text-white" : "text-white/45 hover:text-white"
                }`}
              >
                {t === "about" ? "About" : "Lyrics"}
              </button>
            ))}
          </div>
          <div role="tabpanel" className="mt-3 text-sm leading-relaxed text-white/65">
            {tab === "about" ? (
              <p>{music?.quoteText || "Let our voices unite, lifting the sound of hope to the clouds."}</p>
            ) : music?.lyrics ? (
              <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap break-words font-sans text-sm leading-7 text-white/70 custom-scrollbar">
                {music.lyrics}
              </pre>
            ) : (
              <p className="text-white/45">Lyrics for this song haven’t been added yet.</p>
            )}
          </div>
        </div>

        {/* Streaming platforms */}
        <div id="stream" className="mt-10 max-w-3xl border-t border-white/10 pt-6">
          <p className="text-xs font-semibold text-white/45">Stream the full song</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <a
                key={p.name}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/80 transition hover:border-amber-400/60 hover:text-white"
              >
                {p.icon && (
                  <span style={{ color: p.color }} className="inline-flex">
                    <BrandIcon name={p.icon} className="h-4 w-4" />
                  </span>
                )}
                {p.logo && (
                  <img
                    src={p.logo}
                    alt=""
                    className="h-4 w-auto"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                )}
                {p.name}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Hidden audio engine */}
      {hasAudio && (
        <audio
          ref={audioRef}
          src={src}
          preload="metadata"
          onLoadedMetadata={(e) => {
            const d = e.currentTarget.duration;
            setDuration(Number.isFinite(d) ? d : 0);
          }}
          onCanPlay={() => setBuffering(false)}
          onWaiting={() => setBuffering(true)}
          onPlaying={() => {
            setBuffering(false);
            setStatus("ok");
          }}
          onPlay={() => setPlaying(true)}
          onPause={() => {
            setPlaying(false);
            setBuffering(false);
          }}
          onTimeUpdate={(e) => {
            const a = e.currentTarget;
            const cap = Number.isFinite(a.duration) && a.duration > 0 ? Math.min(a.duration, PREVIEW_SECONDS) : PREVIEW_SECONDS;
            if (a.currentTime >= cap) {
              a.pause();
              a.currentTime = 0;
              setCurrent(0);
              return;
            }
            setCurrent(a.currentTime);
          }}
          onEnded={() => {
            setCurrent(0);
            setPlaying(false);
          }}
          onError={() => {
            setPlaying(false);
            setBuffering(false);
            setStatus("error");
          }}
        />
      )}
    </section>
  );
}
