import React, { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  ExternalLink,
  Share2,
  Volume2,
  Music,
  X,
} from "lucide-react";
import { MusicData } from "../types";
import { motion } from "motion/react";

export default function MusicStreaming({
  music,
  theme = "dark",
}: {
  music: MusicData;
  theme?: "dark" | "light";
}) {
  const isDark = theme === "dark";
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [trackDuration, setTrackDuration] = useState(45);

  const demoAudioTrack =
    "https://upload.wikimedia.org/wikipedia/commons/4/4c/Halleluja_%28H%C3%A4ndel%29.mp3";

  const activeAudioUrl = music?.audioUrl || demoAudioTrack;
  const coverImage =
    music?.coverUrl ||
    "https://www.image2url.com/r2/default/images/1781098447744-9bfd4cd8-4c62-4a1a-b218-7ccd6f1b36d2.png";

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
    setCurrentTime(0);
    setIsPlaying(false);
    setTrackDuration(45);
  }, [activeAudioUrl]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (audio.paused) {
        await audio.play();
      } else {
        audio.pause();
      }
    } catch (error) {
      console.warn("Audio playback failed:", error);
      setIsPlaying(false);
    }
  };

  const seek = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    const next = Math.max(0, Math.min(45, seconds));
    audio.currentTime = next;
    setCurrentTime(next);
  };

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = trackDuration
    ? Math.min(100, (currentTime / trackDuration) * 100)
    : 0;

  const shareMusic = async () => {
    const shareData = {
      title: music?.songTitle || "Kachamba Chorus",
      text: `${music?.songTitle || "Music"} — ${music?.artistName || "Kachamba Chorus"}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
      }
    } catch {
      // User cancellation is intentionally ignored.
    }
  };

  return (
    <section
      id="music"
      className={`relative overflow-hidden border-y px-6 py-20 md:px-12 ${
        isDark
          ? "border-slate-800 bg-slate-900 text-white"
          : "border-slate-200 bg-slate-100 text-slate-900"
      }`}
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <span className="font-mono text-xs uppercase tracking-[0.15em] text-amber-400">
            Sounds of Togetherness
          </span>
          <h2
            className={`mt-3 font-display text-3xl font-semibold tracking-tight md:text-5xl ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            Music &{" "}
            <span className={isDark ? "font-light text-white/60" : "font-light text-slate-500"}>
              Streaming
            </span>
          </h2>
          <p
            className={`mt-3 text-sm leading-relaxed md:text-base ${
              isDark ? "text-slate-400" : "text-slate-600"
            }`}
          >
            Listen, share, and worship with us on the go.
          </p>
        </div>

        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
          <div className="relative rounded-3xl border border-slate-800 bg-slate-950/80 p-6 shadow-2xl lg:col-span-6 xl:col-span-5">
            <audio
              ref={audioRef}
              src={activeAudioUrl}
              preload="metadata"
              onLoadedMetadata={(event) => {
                const duration = event.currentTarget.duration;
                setTrackDuration(
                  Number.isFinite(duration) ? Math.min(45, duration) : 45
                );
              }}
              onTimeUpdate={(event) => {
                const time = event.currentTarget.currentTime;
                if (time >= 45) {
                  event.currentTarget.pause();
                  event.currentTarget.currentTime = 0;
                  setCurrentTime(0);
                  setIsPlaying(false);
                  return;
                }
                setCurrentTime(time);
              }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => {
                setCurrentTime(0);
                setIsPlaying(false);
              }}
              onError={() => {
                setIsPlaying(false);
              }}
            />

            <div className="mb-5 text-right">
              <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-amber-400">
                Latest Release
              </span>
            </div>

            <button
              type="button"
              onClick={togglePlayback}
              aria-label={isPlaying ? "Pause music" : "Play music"}
              className="group relative mx-auto mb-6 block h-48 w-48 overflow-hidden rounded-2xl border border-slate-700 shadow-2xl focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <img
                src={coverImage}
                alt={`${music?.albumName || "Album"} cover`}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                className={`h-full w-full object-cover transition duration-700 group-hover:scale-105 ${
                  isPlaying ? "scale-105" : ""
                }`}
              />
              <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-slate-950 shadow-xl">
                  {isPlaying ? (
                    <Pause className="h-6 w-6 fill-current" aria-hidden="true" />
                  ) : (
                    <Play className="ml-0.5 h-6 w-6 fill-current" aria-hidden="true" />
                  )}
                </span>
              </span>
            </button>

            <div className="text-center">
              <h3 className="line-clamp-1 text-lg font-bold text-amber-200">
                {music?.songTitle || "Umchukue Mwanao"}
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                {music?.artistName || "Kachok Ambassadors Chorus"}
              </p>
            </div>

            <div className="mt-6">
              <input
                type="range"
                min={0}
                max={trackDuration || 45}
                step={0.1}
                value={Math.min(currentTime, trackDuration || 45)}
                onChange={(e) => seek(Number(e.target.value))}
                aria-label="Music progress"
                className="w-full accent-amber-500"
              />
              <div className="mt-2 flex justify-between text-[10px] font-mono text-slate-500">
                <span>{formatTime(currentTime)}</span>
                <span>45s Preview</span>
                <span>{formatTime(trackDuration)}</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-6">
              <button
                type="button"
                onClick={() => seek(currentTime - 10)}
                className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-400 transition hover:text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                -10s
              </button>

              <button
                type="button"
                onClick={togglePlayback}
                aria-label={isPlaying ? "Pause" : "Play"}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-slate-950 shadow-lg transition hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6 fill-current" aria-hidden="true" />
                ) : (
                  <Play className="ml-0.5 h-6 w-6 fill-current" aria-hidden="true" />
                )}
              </button>

              <button
                type="button"
                onClick={() => seek(currentTime + 10)}
                className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-400 transition hover:text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                +10s
              </button>
            </div>

            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-center">
              <p className="text-xs italic leading-relaxed text-slate-300">
                “{music?.quoteText || "Let our voices unite, lifting the sound of hope to the clouds..."}”
              </p>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setIsLyricsOpen(true)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-800 py-2.5 text-[10px] font-bold uppercase tracking-wider text-amber-400 transition hover:border-amber-400/30 focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <Music className="h-3.5 w-3.5" aria-hidden="true" />
                Lyrics
              </button>

              <button
                type="button"
                onClick={shareMusic}
                aria-label="Share music"
                title="Share"
                className="rounded-xl border border-slate-800 px-4 text-slate-400 transition hover:text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <Share2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 xl:col-span-7">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-amber-200">
                Listen on Your Favorite Streaming App
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                Follow Kachamba Chorus across our official music platforms.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                ["Spotify", "https://open.spotify.com/artist/6w0ZfVIEtqgYSzsrtZds3O?si=aWzhTq9PTtCEpHPTvOdbDw"],
                ["YouTube", "https://youtube.com/@kachambachorus?si=Mqg13XYzO8QFE9fE"],
                ["Apple Music", "https://music.apple.com/ke/artist/kachok-ambassadors-chorus/1747560210"],
                ["Boomplay", "https://www.boomplay.com/artists/90917648?srModel=COPYLINK&srList=WEB&share_content=artist&share_channel=copylink&share_platform=web"],
              ].map(([name, url]) => (
                <a
                  key={name}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-4 rounded-2xl border border-slate-800 bg-slate-950/40 p-5 transition hover:border-amber-400/30 hover:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <div className="rounded-xl bg-amber-500/10 p-3 text-amber-400">
                    <Volume2 className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h4 className="flex items-center gap-1.5 text-sm font-bold text-slate-100 group-hover:text-amber-300">
                      {name}
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </h4>
                    <p className="mt-1 text-xs text-slate-400">
                      Official Kachamba music channel
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isLyricsOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="lyrics-title"
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsLyricsOpen(false);
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 p-5">
              <div>
                <h4 id="lyrics-title" className="font-bold text-white">
                  Track Lyrics
                </h4>
                <p className="mt-1 text-xs text-slate-400">
                  {music?.songTitle || "Current track"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsLyricsOpen(false)}
                aria-label="Close lyrics"
                title="Close"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="overflow-y-auto p-6">
              {music?.lyrics ? (
                <pre className="whitespace-pre-wrap break-words rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-center text-sm leading-relaxed text-slate-200 md:text-left">
                  {music.lyrics}
                </pre>
              ) : (
                <p className="py-10 text-center text-sm italic text-slate-400">
                  No lyrics have been added for this track yet.
                </p>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </section>
  );
}
