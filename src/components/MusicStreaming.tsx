import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Play,
  Pause,
  ArrowUpRight,
  Share2,
  Volume2,
  VolumeX,
  RotateCcw,
  RotateCw,
  Check,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { motion } from "motion/react";
import { MusicData } from "../types";

/* ───────────────────────── Config ───────────────────────── */

/** Visitors hear at most this many seconds, then are pointed to the streaming apps. */
const PREVIEW_SECONDS = 45;

const FALLBACK_COVER =
  "https://www.image2url.com/r2/default/images/1781098447744-9bfd4cd8-4c62-4a1a-b218-7ccd6f1b36d2.png";

const PLATFORMS = [
  {
    name: "Spotify",
    blurb: "Stream on Spotify",
    url: "https://open.spotify.com/artist/6w0ZfVIEtqgYSzsrtZds3O?si=aWzhTq9PTtCEpHPTvOdbDw",
  },
  {
    name: "YouTube",
    blurb: "Watch & subscribe",
    url: "https://youtube.com/@kachambachorus?si=Mqg13XYzO8QFE9fE",
  },
  {
    name: "Apple Music",
    blurb: "Listen on Apple Music",
    url: "https://music.apple.com/ke/artist/kachok-ambassadors-chorus/1747560210",
  },
  {
    name: "Boomplay",
    blurb: "Stream on Boomplay",
    url: "https://www.boomplay.com/artists/90917648?srModel=COPYLINK&srList=WEB&share_content=artist&share_channel=copylink&share_platform=web",
  },
];

const TILE_COLOURS = ["var(--fill-primary)", "var(--fill-secondary)", "var(--fill-accent)", "var(--fill-primary)"];

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

/** Deterministic pseudo-waveform so every song gets its own stable "shape". */
function makeBars(seedText: string, count: number): number[] {
  let h = 1779033703 ^ seedText.length;
  for (let i = 0; i < seedText.length; i++) {
    h = Math.imul(h ^ seedText.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  const rand = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return Array.from({ length: count }, (_, i) => {
    const envelope = 0.55 + 0.45 * Math.sin((i / count) * Math.PI);
    return Math.max(0.18, Math.min(1, (0.25 + rand() * 0.75) * envelope + 0.08));
  });
}

type Status = "ok" | "error";
type Tab = "about" | "lyrics";

/* ───────────────────────── Component ───────────────────────── */

export default function MusicStreaming({
  music,
}: {
  music: MusicData;
  /** kept for backwards compatibility — colours now follow the site theme automatically */
  theme?: "dark" | "light";
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const barsRef = useRef<HTMLDivElement | null>(null);

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

  const bars = useMemo(() => makeBars(`${title}|${artist}`, 48), [title, artist]);

  // The most we let anyone hear: the preview limit, or the whole file if it's shorter.
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

  /* Stop sound when leaving the page section/unmounting */
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
    const el = barsRef.current;
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
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      /* user cancelled */
    }
  };

  /* ───────────────────────── UI ───────────────────────── */
  return (
    <section id="music" className="relative px-6 py-24 text-white md:px-12">
      <div className="mx-auto max-w-6xl">
        {/* Heading */}
        <div className="mb-12 max-w-2xl">
          <p className="inline-flex items-center gap-2.5 rounded-full border border-white/15 px-3.5 py-1.5 text-xs font-semibold text-white/70">
            <span className="h-2 w-2 rounded-full" style={{ background: "var(--fill-accent)" }} />
            Music
          </p>
          <h2 className="mt-5 text-4xl md:text-6xl">
            Listen to <span style={{ color: "var(--hue-primary)" }}>our latest</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/60 md:text-lg">
            Press play for a preview, then stream the full song on your favourite app.
          </p>
        </div>

        {/* Player card */}
        <div className="grid gap-8 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 sm:p-8 lg:grid-cols-12 lg:gap-12 lg:p-10">
          {/* Cover */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
              <div
                aria-hidden="true"
                className="absolute inset-0 translate-x-2.5 translate-y-2.5 rounded-[1.75rem]"
                style={{ background: "var(--fill-secondary)" }}
              />
              <button
                type="button"
                onClick={toggle}
                disabled={!hasAudio}
                aria-label={playing ? "Pause preview" : "Play preview"}
                className="group relative block aspect-square w-full overflow-hidden rounded-[1.75rem] bg-slate-800 disabled:cursor-default"
              >
                <img
                  src={cover}
                  alt={`${album} cover art`}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                />
                {/* Equaliser while playing */}
                {playing && (
                  <span className="absolute bottom-4 left-4 flex h-8 items-end gap-[3px] rounded-lg bg-black/55 px-2.5 py-2" aria-hidden="true">
                    {[0, 1, 2, 3].map((i) => (
                      <motion.i
                        key={i}
                        className="block w-[3px] origin-bottom rounded-full bg-white"
                        style={{ height: "100%" }}
                        animate={{ scaleY: [0.25, 1, 0.4, 0.85, 0.25] }}
                        transition={{ duration: 1.1 + i * 0.15, repeat: Infinity, ease: "easeInOut" }}
                      />
                    ))}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Info + controls */}
          <div className="flex flex-col justify-center lg:col-span-7">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white"
                style={{ background: "var(--fill-accent)" }}
              >
                {music?.label || "Latest release"}
              </span>
              <span className="text-xs font-medium text-white/50">{album}</span>
            </div>

            <h3 className="mt-4 text-3xl font-bold leading-tight tracking-[-0.03em] md:text-5xl">{title}</h3>
            <p className="mt-2 text-base font-medium text-white/60">{artist}</p>

            {/* Waveform scrubber */}
            <div className="mt-8">
              <div
                ref={barsRef}
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
                className={`flex h-16 touch-none select-none items-center gap-[3px] rounded-lg ${
                  hasAudio ? "cursor-pointer" : "opacity-40"
                }`}
              >
                {bars.map((h, i) => {
                  const done = (i + 0.5) / bars.length <= progress;
                  return (
                    <span
                      key={i}
                      className="flex-1 rounded-full transition-colors duration-150"
                      style={{
                        height: `${h * 100}%`,
                        background: done ? "var(--fill-primary)" : "color-mix(in srgb, var(--color-white) 22%, transparent)",
                      }}
                    />
                  );
                })}
              </div>
              <div className="mt-2 flex items-center justify-between text-xs font-medium tabular-nums text-white/50">
                <span>{fmt(current)}</span>
                <span>{isFullTrack ? "Full snippet" : `${PREVIEW_SECONDS}-second preview`}</span>
                <span>{fmt(limit)}</span>
              </div>
            </div>

            {/* Transport */}
            <div className="mt-5 flex items-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={toggle}
                disabled={!hasAudio}
                aria-label={playing ? "Pause" : "Play"}
                className="grid h-16 w-16 shrink-0 place-items-center rounded-full text-white shadow-lg transition hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
                style={{ background: "var(--fill-accent)" }}
              >
                {buffering ? (
                  <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
                ) : playing ? (
                  <Pause className="h-6 w-6 fill-current" aria-hidden="true" />
                ) : (
                  <Play className="ml-0.5 h-6 w-6 fill-current" aria-hidden="true" />
                )}
              </button>

              <button
                type="button"
                onClick={() => seekBy(-10)}
                disabled={!hasAudio}
                aria-label="Back 10 seconds"
                className="grid h-11 w-11 place-items-center rounded-full border border-white/15 text-white/70 transition hover:border-white/40 hover:text-white disabled:opacity-30"
              >
                <RotateCcw className="h-[18px] w-[18px]" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => seekBy(10)}
                disabled={!hasAudio}
                aria-label="Forward 10 seconds"
                className="grid h-11 w-11 place-items-center rounded-full border border-white/15 text-white/70 transition hover:border-white/40 hover:text-white disabled:opacity-30"
              >
                <RotateCw className="h-[18px] w-[18px]" aria-hidden="true" />
              </button>

              <div className="ml-auto flex items-center gap-1.5">
                <div className="hidden items-center gap-2 md:flex">
                  <button
                    type="button"
                    onClick={toggleMute}
                    aria-label={muted ? "Unmute" : "Mute"}
                    className="grid h-10 w-10 place-items-center rounded-full text-white/60 transition hover:text-white"
                  >
                    {muted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={muted ? 0 : volume}
                    onChange={(e) => applyVolume(Number(e.target.value))}
                    aria-label="Volume"
                    className="w-20"
                    style={{ accentColor: "var(--fill-primary)" }}
                  />
                </div>
                <button
                  type="button"
                  onClick={share}
                  aria-label="Share this song"
                  className="ml-1 inline-flex h-11 items-center gap-2 rounded-full border border-white/15 px-4 text-sm font-semibold text-white/80 transition hover:border-white/40 hover:text-white"
                >
                  {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Share2 className="h-4 w-4" aria-hidden="true" />}
                  <span className="hidden sm:inline">{copied ? "Link copied" : "Share"}</span>
                </button>
              </div>
            </div>

            {/* Status line */}
            <div className="mt-4 min-h-[1.5rem] text-sm" aria-live="polite">
              {!hasAudio && (
                <p className="text-white/55">
                  The audio preview is coming soon — you can already stream the full song below.
                </p>
              )}
              {status === "error" && hasAudio && (
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1" style={{ color: "var(--hue-accent)" }}>
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <AlertCircle className="h-4 w-4" aria-hidden="true" />
                    Couldn’t load the preview.
                  </span>
                  <button type="button" onClick={retry} className="inline-flex items-center gap-1.5 font-semibold underline underline-offset-4">
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                    Try again
                  </button>
                </p>
              )}
              {hasAudio && status !== "error" && (
                <p className="text-white/45">
                  Enjoying it?{" "}
                  <button
                    type="button"
                    onClick={() => document.getElementById("stream")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                    className="font-semibold underline decoration-white/30 underline-offset-4 hover:text-white"
                  >
                    Stream the full song
                  </button>
                  .
                </p>
              )}
            </div>

            {/* Tabs: about / lyrics */}
            <div className="mt-6 border-t border-white/10 pt-5">
              <div role="tablist" aria-label="Song details" className="flex gap-1.5">
                {(["about", "lyrics"] as Tab[]).map((t) => (
                  <button
                    key={t}
                    role="tab"
                    type="button"
                    aria-selected={tab === t}
                    onClick={() => setTab(t)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${
                      tab === t ? "bg-white/10 text-white" : "text-white/50 hover:text-white"
                    }`}
                  >
                    {t === "about" ? "About" : "Lyrics"}
                  </button>
                ))}
              </div>

              <div role="tabpanel" className="mt-4">
                {tab === "about" ? (
                  <p className="font-display text-lg font-medium leading-snug tracking-tight text-white/80 md:text-xl">
                    “{music?.quoteText || "Let our voices unite, lifting the sound of hope to the clouds..."}”
                  </p>
                ) : music?.lyrics ? (
                  <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap break-words font-sans text-sm leading-7 text-white/75 custom-scrollbar">
                    {music.lyrics}
                  </pre>
                ) : (
                  <p className="text-sm text-white/50">Lyrics for this song haven’t been added yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Streaming platforms */}
        <div id="stream" className="mt-16">
          <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <h3 className="text-2xl font-bold tracking-tight md:text-3xl">Stream the full song</h3>
            <p className="text-sm text-white/55">Follow Kachamba Chorus on our official channels.</p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PLATFORMS.map((p, i) => (
              <a
                key={p.name}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:-translate-y-1 hover:border-white/30"
              >
                <span
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-xl font-display text-xl font-bold text-white"
                  style={{ background: TILE_COLOURS[i % TILE_COLOURS.length] }}
                  aria-hidden="true"
                >
                  {p.name[0]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-bold">{p.name}</span>
                  <span className="block truncate text-xs text-white/50">{p.blurb}</span>
                </span>
                <ArrowUpRight
                  className="h-5 w-5 shrink-0 text-white/40 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white"
                  aria-hidden="true"
                />
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
