import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Clock, Quote, X, ChevronLeft, ChevronRight, User, Sparkles } from "lucide-react";
import { MemberSpotlight as MemberSpotlightType } from "../types";

interface MemberSpotlightProps {
  spotlights: MemberSpotlightType[];
  isAdmin: boolean;
  onLaunchAdmin: () => void;
}

export default function MemberSpotlight({ spotlights, isAdmin, onLaunchAdmin }: MemberSpotlightProps) {
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);

  // Filter spotlights to only show those that are less than 48 hours old
  const activeSpotlights = spotlights.filter((spot) => {
    try {
      const createdTime = new Date(spot.createdAt).getTime();
      const diffMs = Date.now() - createdTime;
      const fortyEightHours = 48 * 60 * 60 * 1000;
      return diffMs >= 0 && diffMs < fortyEightHours;
    } catch {
      return false;
    }
  });

  // Automatically advance story progress
  useEffect(() => {
    if (activeStoryIndex === null || activeSpotlights.length === 0) {
      setProgress(0);
      return;
    }

    setProgress(0);
    const stepTime = 50; // ms per update
    const duration = 6000; // 6 seconds per story
    const totalSteps = duration / stepTime;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const currentProgress = (currentStep / totalSteps) * 100;
      setProgress(Math.min(currentProgress, 100));

      if (currentStep >= totalSteps) {
        clearInterval(timer);
        // Advance story index or close
        if (activeStoryIndex < activeSpotlights.length - 1) {
          setActiveStoryIndex(activeStoryIndex + 1);
        } else {
          setActiveStoryIndex(null); // Loop complete
        }
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [activeStoryIndex, activeSpotlights.length]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeStoryIndex === null) return;
    if (activeStoryIndex > 0) {
      setActiveStoryIndex(activeStoryIndex - 1);
    } else {
      setActiveStoryIndex(null);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeStoryIndex === null) return;
    if (activeStoryIndex < activeSpotlights.length - 1) {
      setActiveStoryIndex(activeStoryIndex + 1);
    } else {
      setActiveStoryIndex(null);
    }
  };

  const getHoursRemaining = (createdAtString: string) => {
    try {
      const difference = (new Date(createdAtString).getTime() + 48 * 60 * 60 * 1000) - Date.now();
      const hours = Math.ceil(difference / (1000 * 60 * 60));
      return hours > 0 ? `${hours}h left` : "Expired";
    } catch {
      return "48h";
    }
  };

  return (
    <div className="w-full bg-slate-900/10 border-y border-slate-900/60 py-6 px-4 md:px-8 mb-10 select-none">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-1.5 text-amber-500 font-mono text-[10px] tracking-widest uppercase font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Personal Testimony Alerts</span>
            </div>
            <h3 className="font-sans font-extrabold text-lg sm:text-xl text-white tracking-tight uppercase">
              Member <span className="text-amber-400">Spotlight Statuses</span>
            </h3>
            <p className="text-[11px] text-slate-400 font-sans mt-0.5">
              WhatsApp-style active highlights of our chorus members. Updates stay live for exactly 48 hours.
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={onLaunchAdmin}
              className="self-start sm:self-center bg-amber-500/10 border border-amber-500/20 hover:bg-amber-400 hover:text-slate-950 font-mono text-[10px] uppercase font-bold tracking-wider py-1.5 px-3 rounded-lg text-amber-400 cursor-pointer transition-all shrink-0"
            >
              + Create New Status
            </button>
          )}
        </div>

        {/* Circular Stories Scroll Strip */}
        <div className="flex items-center gap-5 overflow-x-auto pb-2 scrollbar-none">
          {/* Default Chorus Community Bubble is always active to avoid empty lists */}
          <div className="flex flex-col items-center gap-1.5 text-center shrink-0">
            <div className="relative group cursor-pointer" onClick={() => {
              if (activeSpotlights.length > 0) {
                setActiveStoryIndex(0);
              } else {
                // If empty force popup state message
                alert("Nothing new posted! Admins can create live status updates from the Admin Panel.");
              }
            }}>
              <div className={`w-16 h-16 rounded-full p-[2.5px] bg-gradient-to-tr ${activeSpotlights.length > 0 ? 'from-amber-400 via-rose-500 to-amber-300' : 'from-slate-700 to-slate-850'} transition-all group-hover:scale-105 duration-300 shadow`}>
                <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center overflow-hidden border border-slate-900">
                  <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-full text-amber-400">
                    <Quote className="w-5 h-5" />
                  </div>
                </div>
              </div>
              <span className="absolute bottom-0 right-0 bg-amber-500 text-slate-950 font-bold font-mono rounded-full text-[9px] w-5 h-5 flex items-center justify-center border-2 border-slate-950 leading-none shadow">
                {activeSpotlights.length}
              </span>
            </div>
            <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400 font-bold max-w-[70px] truncate leading-tight mt-1">
              Active Updates
            </span>
          </div>

          {/* Active Status Circular list container */}
          {activeSpotlights.map((spot, idx) => (
            <div
              key={spot.id}
              onClick={() => setActiveStoryIndex(idx)}
              className="flex flex-col items-center gap-1.5 text-center shrink-0 cursor-pointer group"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-amber-400 via-rose-500 to-amber-300 animate-pulse-slow group-hover:scale-105 transition-transform duration-300">
                  <div className="w-full h-full rounded-full bg-slate-950 overflow-hidden flex items-center justify-center border border-slate-900">
                    {spot.image ? (
                      <img
                        src={spot.image}
                        alt={spot.memberName}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover grayscale-[25%] group-hover:grayscale-0 transition-all"
                      />
                    ) : (
                      <div className="bg-gradient-to-b from-slate-900 to-slate-950 w-full h-full flex items-center justify-center text-amber-400">
                        <User className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 bg-slate-950/90 border border-slate-800 rounded px-1 text-[8px] font-mono font-bold text-rose-400">
                  {getHoursRemaining(spot.createdAt)}
                </div>
              </div>
              <div className="max-w-[76px]">
                <p className="font-sans font-bold text-[10px] text-slate-200 group-hover:text-amber-400 truncate leading-tight">
                  {spot.memberName}
                </p>
                <p className="font-mono text-[8px] uppercase text-slate-450 tracking-wider font-bold truncate mt-0.5">
                  {spot.roleOrVoicePart}
                </p>
              </div>
            </div>
          ))}

          {activeSpotlights.length === 0 && (
            <div className="flex items-center text-left py-2 px-3 border border-dashed border-slate-800 rounded-xl max-w-sm shrink-0 bg-slate-950/20">
              <p className="font-sans text-[10px] text-slate-450 leading-normal">
                No testimonies shared in the last 48 hours. {isAdmin ? "Hey admin, click the button on the right to post a new testimony highlight!" : "Check back later for active testimonies."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* STORY EXPAND OVERLAY / MODAL VIEWER */}
      <AnimatePresence>
        {activeStoryIndex !== null && activeSpotlights[activeStoryIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 backdrop-blur-xl p-4 cursor-default select-none overflow-hidden"
          >
            {/* Visual background ambient color */}
            <div className="absolute inset-x-0 top-1/4 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent z-0" />
            {activeSpotlights[activeStoryIndex].image && (
              <div className="absolute inset-0 z-0 opacity-15 select-none pointer-events-none blur-xl">
                <img
                  src={activeSpotlights[activeStoryIndex].image}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl h-[85vh] flex flex-col justify-between overflow-hidden shadow-2xl z-10 p-6 md:p-8">
              
              {/* TOP HEADER LIST SEGMENT PROGRESS BARS */}
              <div className="absolute top-4 inset-x-6 flex items-center gap-1 z-20">
                {activeSpotlights.map((_, i) => (
                  <div key={i} className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-75"
                      style={{
                        width:
                          i < activeStoryIndex
                            ? "100%"
                            : i === activeStoryIndex
                            ? `${progress}%`
                            : "0%",
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* TOP HEADER CONTROLS */}
              <div className="flex items-center justify-between mt-4 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full p-[1.5px] bg-gradient-to-tr from-amber-400 to-rose-500 overflow-hidden">
                    <div className="w-full h-full rounded-full bg-slate-900 overflow-hidden flex items-center justify-center">
                      {activeSpotlights[activeStoryIndex].image ? (
                        <img
                          src={activeSpotlights[activeStoryIndex].image}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-sans font-extrabold text-xs sm:text-sm text-slate-100">
                      {activeSpotlights[activeStoryIndex].memberName}
                    </h4>
                    <p className="font-mono text-[9px] uppercase tracking-wider text-amber-400 font-bold">
                      {activeSpotlights[activeStoryIndex].roleOrVoicePart}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-950/80 border border-slate-800 rounded-md text-[9px] font-mono text-slate-400">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{getHoursRemaining(activeSpotlights[activeStoryIndex].createdAt)}</span>
                  </div>
                  <button
                    onClick={() => setActiveStoryIndex(null)}
                    className="bg-slate-950/50 hover:bg-slate-800 text-slate-400 hover:text-white p-1.5 rounded-full border border-slate-800 cursor-pointer transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* ACTIVE TESTIMONY SPOTLIGHT BODY CONTENT */}
              <div className="flex-1 flex flex-col items-center justify-center text-center px-4 my-6 z-10 relative">
                <div className="opacity-10 absolute pointer-events-none text-slate-700 -top-4">
                  <Quote className="w-24 h-24 stroke-[1.5]" />
                </div>
                
                <p className="font-sans font-extrabold text-lg sm:text-2xl md:text-3xl text-white tracking-tight leading-relaxed italic z-10 select-text">
                  "{activeSpotlights[activeStoryIndex].quoteOrHighlight}"
                </p>

                {activeSpotlights[activeStoryIndex].image && (
                  <div className="mt-8 relative max-h-[35vh] overflow-hidden rounded-2xl border border-slate-800/85 shadow-lg select-none">
                    <img
                      src={activeSpotlights[activeStoryIndex].image}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="max-h-[35vh] w-auto object-contain rounded-2xl"
                    />
                  </div>
                )}
              </div>

              {/* ACTION TAP ZONES (Invisible tap areas on left/right for mobile story switching!) */}
              <div className="absolute inset-y-16 left-0 w-1/4 z-10 cursor-pointer" onClick={handlePrev} />
              <div className="absolute inset-y-16 right-0 w-1/4 z-10 cursor-pointer" onClick={handleNext} />

              {/* BOTTOM NAVIGATION FOOTER */}
              <div className="flex items-center justify-between border-t border-slate-800 pt-4 z-10">
                <button
                  onClick={handlePrev}
                  className="bg-slate-950/40 hover:bg-slate-800 text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all border border-slate-805"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>
                
                <span className="font-mono text-[9px] uppercase tracking-widest text-slate-500 font-bold">
                  {activeStoryIndex + 1} of {activeSpotlights.length}
                </span>

                <button
                  onClick={handleNext}
                  className="bg-slate-950/40 hover:bg-slate-800 text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all border border-slate-805"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
