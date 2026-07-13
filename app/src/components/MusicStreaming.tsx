import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, ExternalLink, Share2, Volume2, Music, X } from "lucide-react";
import { MusicData } from "../types";
import { motion, AnimatePresence } from "motion/react";

export default function MusicStreaming({ music }: { music: MusicData }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(45);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const demoTrack = "https://upload.wikimedia.org/wikipedia/commons/4/4c/Halleluja_%28H%C3%A4ndel%29.mp3";
  const getAudioUrl = (url: string) => {
    if (!url) return demoTrack;
    if (url.startsWith("data:") || url.startsWith("/")) return url;
    try { if (url.startsWith(window.location.origin)) return url; } catch (_) {}
    return `/api/proxy-audio?url=${encodeURIComponent(url)}`;
  };

  const activeAudioUrl = getAudioUrl(music?.audioUrl || demoTrack);
  const defaultLogo = "https://www.image2url.com/r2/default/images/1781098447744-9bfd4cd8-4c62-4a1a-b218-7ccd6f1b36d2.png";
  const coverImage = music?.coverUrl || defaultLogo;

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.play().catch(() => {});
      else audioRef.current.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.load();
      if (isPlaying) audioRef.current.play().catch(() => {});
    }
  }, [activeAudioUrl]);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
          if (audioRef.current.currentTime >= duration) {
            setIsPlaying(false);
            setCurrentTime(0);
          }
        }
      }, 500);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, duration]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const progressPct = Math.min((currentTime / duration) * 100, 100);

  return (
    <section id="music" className="relative py-28 px-6 md:px-12 bg-slate-900 overflow-hidden">
      {/* Background cover art blur */}
      <div
        className="absolute inset-0 opacity-10 bg-cover bg-center blur-2xl scale-110 pointer-events-none"
        style={{ backgroundImage: `url(${coverImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-slate-900/90 pointer-events-none" />

      <div className="max-w-4xl mx-auto relative">

        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-6 h-px bg-amber-400/50" />
            <span className="label-caps text-amber-400/70 text-[11px]">Latest Release</span>
            <div className="w-6 h-px bg-amber-400/50" />
          </div>
          <h2 className="font-display font-bold text-4xl md:text-6xl text-white tracking-tight leading-none mb-3">
            Music <span className="text-white/25 font-light">& Streaming</span>
          </h2>
        </div>

        {/* Player Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="glass rounded-3xl overflow-hidden"
        >
          <div className="flex flex-col md:flex-row">
            {/* Album Art */}
            <div className="relative md:w-56 lg:w-72 flex-shrink-0">
              <div className="aspect-square md:h-full">
                <img
                  src={coverImage}
                  alt="Album Cover"
                  className={`w-full h-full object-cover transition-all duration-700 ${isPlaying ? "brightness-110 saturate-110" : "brightness-90"}`}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/30 md:block hidden" />
              </div>
              {/* Play overlay on mobile */}
              <div className="md:hidden absolute inset-0 flex items-center justify-center bg-black/30">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-14 h-14 glass rounded-full flex items-center justify-center text-white shadow-xl"
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                </motion.button>
              </div>
            </div>

            {/* Info & Controls */}
            <div className="flex-1 p-7 flex flex-col gap-5">
              {/* Track info */}
              <div>
                <div className="label-caps text-[9px] text-amber-400/60 mb-1">{music?.label || "Live Recording"} · {music?.albumName || "Sounds Of Togetherness"}</div>
                <h3 className="font-display font-bold text-2xl text-white leading-tight">{music?.songTitle || "Umchukue Mwanao"}</h3>
                <p className="text-white/40 text-sm mt-0.5">{music?.artistName || "Kachok Ambassadors Chorus"}</p>
              </div>

              {/* Waveform visual */}
              <div className="flex items-end gap-0.5 h-10">
                {Array.from({ length: 40 }).map((_, i) => {
                  const heights = [20, 45, 15, 60, 30, 75, 40, 25, 55, 35, 70, 45, 60, 20, 50, 30, 40, 65, 35, 15, 45, 55, 25, 60, 40, 30, 50, 20, 65, 35, 55, 25, 45, 60, 30, 75, 20, 50, 40, 30];
                  const pct = (i / 40) * 100;
                  const isPast = pct < progressPct;
                  return (
                    <motion.div
                      key={i}
                      animate={{ height: isPlaying ? `${heights[i]}%` : `${heights[i] * 0.5}%` }}
                      transition={{ duration: 0.3, delay: i * 0.01 }}
                      className={`flex-1 rounded-full transition-colors duration-200 ${isPast ? "bg-amber-400/80" : "bg-white/10"}`}
                    />
                  );
                })}
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-3">
                <span className="label-caps text-[9px] text-white/30">{formatTime(currentTime)}</span>
                <div className="flex-1 h-0.5 bg-white/10 rounded-full relative">
                  <div className="absolute left-0 top-0 h-full bg-amber-400/70 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
                </div>
                <span className="label-caps text-[9px] text-white/30">{formatTime(duration)}</span>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3">
                {/* Desktop play button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="hidden md:flex w-11 h-11 bg-amber-400 hover:bg-amber-300 rounded-full items-center justify-center text-slate-950 transition-colors shadow-lg shadow-amber-500/20"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </motion.button>

                <button
                  onClick={() => setIsLyricsOpen(true)}
                  className="flex items-center gap-2 glass px-4 py-2 rounded-xl label-caps text-[10px] text-white/50 hover:text-white transition-colors"
                >
                  <Music className="w-3.5 h-3.5" />
                  Lyrics
                </button>

                {music?.streamUrl && (
                  <a
                    href={music.streamUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 glass px-4 py-2 rounded-xl label-caps text-[10px] text-white/50 hover:text-amber-400 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Stream
                  </a>
                )}

                <div className="flex items-center gap-1 ml-auto">
                  <Volume2 className="w-3.5 h-3.5 text-white/25" />
                </div>
              </div>

              {/* Quote */}
              {music?.quoteText && (
                <blockquote className="text-white/25 text-xs italic font-light border-l border-amber-400/20 pl-3 leading-relaxed">
                  {music.quoteText}
                </blockquote>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Lyrics modal */}
      <AnimatePresence>
        {isLyricsOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-2xl flex items-center justify-center p-4"
            onClick={() => setIsLyricsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.93, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93, y: 20 }}
              className="glass-light rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/6">
                <div>
                  <h4 className="font-display font-semibold text-white text-sm">{music?.songTitle}</h4>
                  <p className="label-caps text-[9px] text-white/35 mt-0.5">{music?.artistName}</p>
                </div>
                <button onClick={() => setIsLyricsOpen(false)} className="w-8 h-8 glass rounded-full flex items-center justify-center text-white/40 hover:text-white transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
                <pre className="text-white/55 text-sm leading-loose font-sans whitespace-pre-wrap">{music?.lyrics || "Lyrics not available."}</pre>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <audio ref={audioRef} src={activeAudioUrl} preload="metadata" onLoadedMetadata={() => { if (audioRef.current) setDuration(Math.min(audioRef.current.duration || 45, 45)); }} onEnded={() => { setIsPlaying(false); setCurrentTime(0); }} />
    </section>
  );
}
