import React, { useState, useEffect, useRef } from "react";
import { Headphones, Play, Pause, ExternalLink, Disc, Share2, Volume2, Music, X } from "lucide-react";
import { MusicData } from "../types";
import { motion } from "motion/react";

export default function MusicStreaming({ music, theme = "dark" }: { music: MusicData; theme?: "dark" | "light" }) {
  const isDark = theme === "dark";
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [trackDuration, setTrackDuration] = useState(45); // 45s snippet limit
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Audio wave visualization simulation
  const [audioBars, setAudioBars] = useState<number[]>([
    20, 45, 15, 60, 30, 75, 40, 25, 55, 35, 70, 45, 60, 20, 50, 30, 40, 65, 35, 15, 45, 55, 25, 60
  ]);

  // Dynamic audio resolver wrapping external audio sources into a secure server-side streaming content tunnel 
  // to completely bypass browser strict CORS policies, iframe referrer blocks, and sandbox stream bans.
  const getPlayableAudioUrl = (urlStr: string) => {
    if (!urlStr) return "";
    if (urlStr.startsWith("data:") || urlStr.startsWith("/")) {
      return urlStr;
    }
    try {
      if (typeof window !== "undefined" && urlStr.startsWith(window.location.origin)) {
        return urlStr;
      }
    } catch (_) {}
    return `/api/proxy-audio?url=${encodeURIComponent(urlStr)}`;
  };

  // Fallback default track (Hallelujah Chorus - extremely stable, HTTPS and CORS-friendly Wikimedia CDN)
  const demoAudioTrack = "https://upload.wikimedia.org/wikipedia/commons/4/4c/Halleluja_%28H%C3%A4ndel%29.mp3";
  const activeAudioUrl = getPlayableAudioUrl(music?.audioUrl || demoAudioTrack);

  // Track logo fallback
  const defaultLogo = "https://www.image2url.com/r2/default/images/1781098447744-9bfd4cd8-4c62-4a1a-b218-7ccd6f1b36d2.png";
  const coverImage = music?.coverUrl || defaultLogo;

  // Sync isPlaying with real audio element play/pause
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch((err) => {
          console.warn("Audio autoplay blocked or failed, continuing with visual simulation:", err);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Sync audio source loading when the URL changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play().catch(() => {
          console.warn("Audio load and autoplay failed, continuing with visual simulation.");
        });
      }
    }
  }, [activeAudioUrl]);

  // Handle active spectrum bars jitter when audio is actively playing
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        // Safe play-head progress updater (ensures progression even if soundhelix or external media is blocked or muted)
        let realTimeAdvancing = false;
        if (audioRef.current) {
          const cur = audioRef.current.currentTime;
          if (!audioRef.current.paused && cur > 0) {
            realTimeAdvancing = true;
            setCurrentTime(Math.round(cur));
          }
        }

        if (!realTimeAdvancing) {
          setCurrentTime((prev) => {
            if (prev >= trackDuration) {
              setIsPlaying(false);
              return 0;
            }
            return prev + 1;
          });
        }

        // Jitter the audio bars when playing to simulate active audio spectrum
        setAudioBars((prev) =>
          prev.map(() => Math.floor(Math.random() * 65) + 15)
        );
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      // Calm down the audio bars
      setAudioBars([
        10, 15, 8, 12, 10, 14, 12, 10, 15, 8, 12, 10, 14, 12, 10, 15, 8, 12, 10, 14, 12, 10, 15, 8
      ]);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, trackDuration, activeAudioUrl]);

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs === Infinity) return "0:00";
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? "0" : ""}${remainder}`;
  };

  const progressPercent = (currentTime / trackDuration) * 100;


  // Custom SVG Icons for streaming platforms
  const SpotifyIcon = () => (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.565.387-.86.207-2.377-1.454-5.37-1.783-8.893-.982-.336.076-.67-.135-.746-.472-.076-.336.135-.67.472-.746 3.855-.88 7.15-.504 9.82 1.134.295.18.387.565.207.86zm1.226-2.723c-.226.367-.707.487-1.074.26-2.72-1.672-6.87-2.157-10.076-1.183-.412.125-.845-.108-.97-.52-.125-.413.108-.846.52-.97 3.666-1.112 8.24-.57 11.336 1.334.367.226.488.707.261 1.074zm.104-2.834C14.39 8.8 8.1 8.586 4.49 9.68a.995.995 0 01-1.224-.686.994.994 0 01.686-1.223c4.175-1.267 11.13-.996 15.355 1.512a.996.996 0 01.321 1.363c-.25.42-.79.553-1.21.321z"/>
    </svg>
  );

  const AppleMusicIcon = () => (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.392 10.925c-.172.937-.733 1.516-1.683 1.737-1.135.263-2.368.172-3.136-.788l-.053 3.606c.01.077-.005.158-.046.223-.092.144-.287.185-.432.091a.332.332 0 01-.137-.234l-.403-4.708a2.531 2.531 0 01-1.295.362c-1.322 0-2.39-1.073-2.39-2.4 0-1.324 1.068-2.398 2.39-2.398.98 0 1.815.59 2.186 1.442l.067-4.526c.005-.184.154-.332.338-.328h.01c.477.01.996.108 1.517.29a3.606 3.606 0 011.666 1.345c.105.153.067.362-.086.467a.337.337 0 01-.186.056c-.66-.002-1.31-.202-1.85-.572l-.055 3.738c.677-.076 1.36.195 1.765.719a2.528 2.528 0 011.36-.395c1.322 0 2.39 1.073 2.39 2.4 0 .977-.584 1.812-1.42 2.184z"/>
    </svg>
  );

  const BoomplayIcon = () => (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.29 14.29L12 13V7c1.66 0 3 1.34 3 3v6.29zm-5.29-3L7.71 11l2.29-2.29v4.58z"/>
    </svg>
  );


  const YouTubeIcon = () => (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
      <path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 00-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 002.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.003 3.003 0 002.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );

  const handleRewind = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newTime = Math.max(0, currentTime - 10);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
    setCurrentTime(newTime);
  };

  const handleForward = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newTime = Math.min(trackDuration, currentTime + 10);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
    setCurrentTime(newTime);
  };

  return (
    <section 
      id="music" 
      className={`py-20 px-6 md:px-12 border-t border-b relative overflow-hidden ${
        isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-100 border-slate-200 text-slate-900"
      }`}
    >

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 text-amber-400 font-mono text-xs tracking-[0.15em] uppercase mb-3">
            <span>Sounds of Togetherness</span>
          </div>
          <h2 className={`font-display font-semibold text-3xl md:text-5xl tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
            Music &amp; <span className={isDark ? "font-light text-white/70" : "font-light text-slate-500"}>Streaming</span>
          </h2>
          <p className={`font-sans text-sm md:text-base mt-3 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            Listen, share, and worship with us on the go. Explore our latest album releases and connect with our social streaming accounts.
          </p>
        </div>

        {/* Music Display Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Latest Music Release Featured Player Card (5/12 Columns) */}
          <div className="lg:col-span-6 xl:col-span-5 bg-slate-950/80 border border-slate-800 rounded-3xl p-6 shadow-2xl relative group hover:border-amber-500/30 transition-all duration-300">
            <div className="absolute top-4 right-4 bg-amber-500/10 text-amber-400 border border-amber-500/20 font-sans text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
          
              <span>Latest Release</span>
            </div>

            {/* Hidden native audio player */}
            <audio 
              ref={audioRef}
              src={activeAudioUrl}
              onTimeUpdate={(e) => {
                const time = Math.floor(e.currentTarget.currentTime);
                if (time >= 45) {
                  e.currentTarget.pause();
                  e.currentTarget.currentTime = 0;
                  setIsPlaying(false);
                  setCurrentTime(0);
                } else {
                  setCurrentTime(time);
                }
              }}
              onDurationChange={(e) => {
                if (e.currentTarget.duration) {
                  setTrackDuration(Math.min(45, Math.floor(e.currentTarget.duration)));
                } else {
                  setTrackDuration(45);
                }
              }}
              onEnded={() => {
                setIsPlaying(false);
                setCurrentTime(0);
              }}
            />

            {/* Album Cover & Spinning Record */}
            <div className="flex flex-col items-center mt-4">
              <div className="relative w-48 h-48 mb-6 cursor-pointer" onClick={() => setIsPlaying(!isPlaying)}>
                {/* Vinyl Record Behind Cover Art */}
                <div className={`absolute top-0 w-44 h-44 rounded-full bg-slate-900 border-[10px] border-slate-950 shadow-lg flex items-center justify-center transition-all duration-700 ease-in-out ${
                  isPlaying ? "animate-spin right-[-15px] sm:right-[-30px]" : "right-0"
                }`}>
                  <div className="w-14 h-14 rounded-full border border-amber-500/30 overflow-hidden bg-amber-500/10 flex items-center justify-center relative">
                    <img 
                      src={coverImage} 
                      alt="" 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover" 
                    />
                    {/* Pin hole center of vinyl */}
                    <div className="absolute w-3 h-3 rounded-full bg-slate-950 border border-slate-800" />
                  </div>
                </div>

                {/* Cover Art Frame */}
                <div 
                  className="relative w-44 h-44 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl flex flex-col justify-between p-4 z-10 group-hover:scale-[1.01] transition-transform"
                  style={{
                    backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.45) 0%, rgba(15, 23, 42, 0.95) 100%), url(${coverImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-[8px] text-amber-200 uppercase tracking-widest border border-amber-400/30 px-1.5 py-0.5 rounded bg-slate-950/60">
                    
                    </span>
                    <Music className="w-4 h-4 text-amber-400/80" />
                  </div>

                  <div className="text-left">
                    <p className="font-sans font-extrabold text-xs leading-snug text-white uppercase tracking-wider drop-shadow-md line-clamp-2">
                      {music?.albumName || "SOUNDS OF TOGETHERNESS"}
                    </p>
                    <p className="font-mono text-[9px] text-amber-400/80 tracking-wide mt-1 uppercase drop-shadow-md">
                      {music?.label || "Coming Soon"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Player Metadata Details */}
              <div className="text-center w-full">
                <h3 className="font-sans font-bold text-lg text-amber-200 tracking-wide line-clamp-1">{music?.songTitle || "Umchukue Mwanao"}</h3>
                <p className="font-sans text-xs text-slate-400 mt-1 line-clamp-1">{music?.artistName || "Kachok Ambassadors Chorus"}</p>
              </div>

              {/* Progress Bar controls */}
              <div className="w-full mt-6">
                <div className="relative group/progress">
                  <input
                    type="range"
                    min="0"
                    max={trackDuration || 45}
                    value={currentTime || 0}
                    onChange={(e) => {
                      const seekTo = parseFloat(e.target.value);
                      if (audioRef.current) {
                        audioRef.current.currentTime = seekTo;
                      }
                      setCurrentTime(seekTo);
                    }}
                    className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-amber-500 outline-none focus:outline-none transition-all"
                    style={{
                      background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${progressPercent}%, #1e293b ${progressPercent}%, #1e293b 100%)`
                    }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 mt-2">
                  <span>{formatTime(currentTime)}</span>
                  <span className="text-[9px] text-amber-500/60 font-sans uppercase font-bold tracking-wider">45s Preview Snippet</span>
                  <span>{formatTime(trackDuration)}</span>
                </div>
              </div>

              {/* Controls Interactive Ribbon */}
              <div className="flex items-center justify-center gap-6 mt-4 w-full">
                <button 
                  onClick={handleRewind}
                  className="p-2 text-slate-400 hover:text-amber-400 font-sans cursor-pointer text-xs font-semibold"
                  title="Rewind 10s"
                >
                  -10s
                </button>

                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="bg-amber-500 hover:bg-amber-405 text-slate-950 p-4 rounded-full shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
                </button>

                <button 
                  onClick={handleForward}
                  className="p-2 text-slate-400 hover:text-amber-400 font-sans cursor-pointer text-xs font-semibold"
                  title="Forward 10s"
                >
                  +10s
                </button>
              </div>

              {/* Simulated Audio Spectrum Waveform */}
              <div className="flex items-end justify-center gap-0.5 h-10 mt-6 w-full px-4 overflow-hidden">
                {audioBars.map((barHeight, idx) => (
                  <motion.div 
                    key={idx}
                    className="w-1.5 rounded-t"
                    animate={{ height: `${barHeight}%` }}
                    transition={{ type: "spring", stiffness: 200, damping: 25 }}
                    style={{ 
                      backgroundColor: idx % 2 === 0 ? "rgba(245, 158, 11, 0.5)" : "rgba(217, 119, 6, 0.3)" 
                    }}
                  />
                ))}
              </div>

              {/* Description & lyrics preview snippet */}
              <div className="mt-5 text-center px-4 py-3 bg-slate-900/60 border border-slate-900 rounded-xl leading-relaxed w-full">
                <p className="font-sans italic text-xs text-slate-300">
                  "{music?.quoteText || "Let our voices unite, lifting the sound of hope to the clouds..."}"
                </p>
                <span className="block font-mono text-[9px] text-slate-500 mt-1 uppercase tracking-widest">
                  Featured Album Release
                </span>
              </div>

              {/* View Lyrics Button */}
              <button 
                onClick={() => setIsLyricsOpen(true)}
                className="mt-4 flex items-center justify-center gap-1.5 w-full py-2.5 px-4 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-900 text-xs font-sans font-bold text-amber-400 hover:text-amber-300 transition-all cursor-pointer hover:border-amber-400/20 active:scale-[0.99] shadow-md uppercase tracking-wider font-mono text-[9px]"
              >
                <Music className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                <span>View Lyrics</span>
              </button>
            </div>
          </div>


          {/* Music Streaming Platforms Link Cards Grid (7/12 Columns) */}
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col justify-center">
            
            <div className="mb-6">
              <h3 className="font-sans font-bold text-lg text-amber-200 tracking-wide">
                Listen on Your Favorite Streaming App
              </h3>
              <p className="font-sans text-xs text-slate-400 mt-1">
                We are actively publishing our spiritual albums, live camp meetings, and devotional acappella sets. Tap below to follow or subscribe.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Spotify Card */}
              <a 
                href="https://open.spotify.com/artist/6w0ZfVIEtqgYSzsrtZds3O?si=aWzhTq9PTtCEpHPTvOdbDw" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group p-5 bg-slate-950/40 border border-slate-800 hover:border-[#1DB954]/50 rounded-2xl flex items-start gap-4 hover:bg-slate-950 transition-all shadow-md"
              >
                <div className="p-3 rounded-xl bg-[#1DB954]/10 text-[#1DB954] group-hover:scale-105 transition-transform">
                  <SpotifyIcon />
                </div>
                <div>
                  <h4 className="font-sans font-bold text-sm text-slate-100 group-hover:text-[#1DB954] transition-colors flex items-center gap-1.5">
                    Spotify
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h4>
                  <p className="font-mono text-[9px] text-slate-500 uppercase tracking-wide mt-0.5">
                    Official Artist Channel
                  </p>
                  <p className="font-sans text-xs text-slate-400 mt-1 leading-normal">
                    Listen to high fidelity studio single streams and add us to your gospel playlist.
                  </p>
                </div>
              </a>

              {/* YouTube Channel */}
              <a 
                href="https://youtube.com/@kachambachorus?si=Mqg13XYzO8QFE9fE" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group p-5 bg-slate-950/40 border border-slate-800 hover:border-[#FF0000]/50 rounded-2xl flex items-start gap-4 hover:bg-slate-950 transition-all shadow-md"
              >
                <div className="p-3 rounded-xl bg-[#FF0000]/10 text-[#FF0000] group-hover:scale-105 transition-transform">
                  <YouTubeIcon />
                </div>
                <div>
                  <h4 className="font-sans font-bold text-sm text-slate-100 group-hover:text-[#FF0000] transition-colors flex items-center gap-1.5">
                    YouTube Music
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h4>
                  <p className="font-mono text-[9px] text-slate-500 uppercase tracking-wide mt-0.5">
                    Music Videos & Concerts
                  </p>
                  <p className="font-sans text-xs text-slate-400 mt-1 leading-normal">
                    Watch our direct sermon song clips, mission vlogs and rehearsal programs.
                  </p>
                </div>
              </a>

              {/* Apple Music */}
              <a 
                href="https://music.apple.com/ke/artist/kachok-ambassadors-chorus/1747560210" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group p-5 bg-slate-950/40 border border-slate-800 hover:border-[#FC3C44]/50 rounded-2xl flex items-start gap-4 hover:bg-slate-950 transition-all shadow-md"
              >
                <div className="p-3 rounded-xl bg-[#FC3C44]/10 text-[#FC3C44] group-hover:scale-105 transition-transform">
                  <AppleMusicIcon />
                </div>
                <div>
                  <h4 className="font-sans font-bold text-sm text-slate-100 group-hover:text-[#FC3C44] transition-colors flex items-center gap-1.5">
                    Apple Music
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h4>
                  <p className="font-mono text-[9px] text-slate-500 uppercase tracking-wide mt-0.5">
                    Dolby Spatial Chords
                  </p>
                  <p className="font-sans text-xs text-slate-400 mt-1 leading-normal">
                    Fulfill absolute vocal spatial atmosphere on devices integrated with Apple Music.
                  </p>
                </div>
              </a>

              {/* Boomplay */}
              <a 
                href="https://www.boomplay.com/artists/90917648?srModel=COPYLINK&srList=WEB&share_content=artist&share_channel=copylink&share_platform=web" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group p-5 bg-slate-950/40 border border-slate-800 hover:border-[#01ACF2]/50 rounded-2xl flex items-start gap-4 hover:bg-slate-950 transition-all shadow-md"
              >
                <div className="p-3 rounded-xl bg-[#01ACF2]/10 text-[#01ACF2] group-hover:scale-105 transition-transform">
                  <BoomplayIcon />
                </div>
                <div>
                  <h4 className="font-sans font-bold text-sm text-slate-100 group-hover:text-[#01ACF2] transition-colors flex items-center gap-1.5">
                    Boomplay
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h4>
                  <p className="font-mono text-[9px] text-slate-500 uppercase tracking-wide mt-0.5">
                    Gospel Playlists
                  </p>
                  <p className="font-sans text-xs text-slate-400 mt-1 leading-normal">
                    Listen to offline savings of our gospel catalog straight on your African device stream.
                  </p>
                </div>
              </a>

              {/* General Digital Music card */}
              <div className="p-5 bg-slate-950/20 border border-slate-800/60 rounded-2xl flex items-start gap-4">
                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
                  <Volume2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-sans font-bold text-sm text-amber-200">
                    And Many More...
                  </h4>
                  <p className="font-mono text-[9px] text-slate-500 uppercase tracking-wide mt-0.5">
                    Digital Outlets
                  </p>
                  <p className="font-sans text-xs text-slate-400 mt-1 leading-normal">
                    Available on Amazon Music, Tidal, Deezer, Audiomack, and local SDA church media portals.
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* Lyrics Modal Backdrop */}
      {isLyricsOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setIsLyricsOpen(false)}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative flex flex-col max-h-[85vh] text-slate-100"
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 bg-slate-950/45 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/15">
                  <Music className="w-5 h-5 text-amber-400" />
                </div>
                <div className="text-left">
                  <h4 className="font-sans font-extrabold text-white text-base">Track Lyrics</h4>
                  <p className="font-sans text-xs text-slate-400 mt-0.5">{music?.songTitle || "Umchukue Mwanao"} — {music?.artistName || "Kachok Ambassadors"}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsLyricsOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-850 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-700/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable lyrics content) */}
            <div className="p-6 overflow-y-auto text-left flex-1 bg-slate-950/20 max-h-[50vh] scrollbar-thin scrollbar-thumb-slate-800">
              {music?.lyrics ? (
                <pre className="font-sans text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-medium break-words text-center md:text-left select-text p-4 bg-slate-950/30 border border-slate-850 rounded-2xl">
                  {music.lyrics}
                </pre>
              ) : (
                <div className="text-center py-12 text-slate-400 font-sans">
                  <p className="italic text-sm">No lyrics have been added for this track yet.</p>
                  <p className="text-[10px] font-mono mt-2 text-slate-500 uppercase tracking-widest">Configure lyrics in the Admin Portal</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/45 text-center shrink-0">
              <span className="font-mono text-[9px] text-slate-500 uppercase tracking-wider">
                KACHOK AMBASSADORS CHORUS • HYMNAL PORTAL
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </section>
  );
}
