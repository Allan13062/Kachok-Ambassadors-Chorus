import React, { useState } from "react";
import { Activity } from "../types";
import { MapPin, Calendar, Heart, Plus, Trash2, Edit, X, Check, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ActivitiesProps {
  items: Activity[];
  isAdmin: boolean;
  onAdd: () => void;
  onEdit: (activity: Activity) => void;
  onDelete: (id: string) => void;
  theme?: "dark" | "light";
}

export default function Activities({ items, isAdmin, onAdd, onEdit, onDelete, theme = "dark" }: ActivitiesProps) {
  const isDark = theme === "dark";
  const [activeMedia, setActiveMedia] = useState<{ url: string; type: 'image' | 'video' | ''; title: string } | null>(null);
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = items.filter(
    (act) =>
      act.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyActivity = (id: string, title: string, date: string, location: string) => {
    const textToCopy = `Kachamba Chorus Ministry Details! ✨\n\n📢 *${title}*\n🗓️ Scheduled: ${date}\n📍 Location: ${location}\n\nLearn more and join us: ${window.location.origin}/#activities-ministry-${id}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedItemId(id);
      setTimeout(() => setCopiedItemId(null), 2000);
    }).catch(err => {
      console.error("Clipboard copy failed value", err);
    });
  };

  return (
    <section 
      id="activities" 
      className={`py-20 px-6 md:px-12 relative ${isDark ? "bg-slate-950 text-white" : "bg-white text-slate-900"}`}
    >
      <div className="max-w-6xl mx-auto">

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 text-amber-400 font-mono text-xs tracking-[0.15em] uppercase mb-3">
              <span>Choral Growth &amp; Service</span>
            </div>
            <h2 className={`font-display font-semibold text-3xl md:text-5xl tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
              Our <span className={isDark ? "font-light text-white/70" : "font-light text-slate-500"}>Ministries</span>
            </h2>
            <p className={`font-sans text-sm md:text-base mt-3 max-w-2xl ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              We gather to seek, prepare, and share. Learn more about our regular choral practices, musical seminars, and humanitarian missions.
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={onAdd}
              className="flex items-center gap-2 bg-transparent border border-amber-500/40 hover:bg-amber-500 hover:text-slate-950 text-amber-400 font-sans font-semibold text-sm px-5 py-2.5 rounded-full transition-all cursor-pointer inline-flex self-start md:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Ministry</span>
            </button>
          )}
        </div>

        {/* Search Filter Box */}
        {items.length > 0 && (
          <div className="mb-10 max-w-md animate-in fade-in duration-300">
            <div className="relative">
              <input
                type="text"
                placeholder="Search ministries page, location, and keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full rounded-xl py-3 pl-11 pr-10 text-sm focus:outline-none transition-all shadow-inner border ${
                  isDark
                    ? "bg-slate-900 border-slate-800 focus:border-amber-500 text-white placeholder-slate-500"
                    : "bg-slate-50 border-slate-200 focus:border-amber-500 text-slate-900 placeholder-slate-400"
                }`}
              />
              <svg 
                className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-450 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Activities Grid */}
        {items.length === 0 ? (
          <div className={`text-center py-12 border border-dashed rounded-2xl ${isDark ? "border-slate-850 bg-slate-900/20" : "border-slate-300 bg-slate-50"}`}>
            <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>No ministry programs recorded at this time.</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className={`text-center py-12 border border-dashed rounded-2xl ${isDark ? "border-slate-850 bg-slate-900/20" : "border-slate-300 bg-slate-50"}`}>
            <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>No ministry programs match your search filter.</p>
          </div>
        ) : (
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.15 }
              }
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {filteredItems.map((act) => (
              <motion.div 
                key={act.id}
                id={`activities-ministry-${act.id}`}
                variants={{
                  hidden: { opacity: 0, y: 25 },
                  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 70, damping: 20 } }
                }}
                whileHover={{ y: -6, scale: 1.015, boxShadow: "0 15px 30px -5px rgba(245, 158, 11, 0.08)" }}
                className={`group relative flex flex-col rounded-2xl overflow-hidden transition-all shadow-lg scroll-mt-24 border ${
                  isDark
                    ? "bg-slate-900/80 border-slate-800 hover:border-amber-400/40"
                    : "bg-white border-slate-200 hover:border-amber-400/60"
                }`}
              >
                
                {/* Visual Cover */}
                <div 
                  onClick={() => setActiveMedia({ url: act.image, type: act.mediaType || 'image', title: act.title })}
                  className="relative h-48 w-full overflow-hidden bg-slate-950 cursor-pointer"
                >
                  <motion.img 
                    src={act.image} 
                    alt={act.title}
                    referrerPolicy="no-referrer"
                    whileHover={{ scale: 1.08 }}
                    transition={{ duration: 1.0, ease: "easeOut" }}
                    className="w-full h-full object-cover opacity-80"
                  />

                  {/* Play badge / Zoom badge overlay */}
                  <div className="absolute inset-0 bg-slate-955/20 group-hover:bg-slate-955/40 transition-colors flex items-center justify-center">
                    {act.mediaType === "video" ? (
                      <div className="bg-amber-500 text-slate-950 p-3 rounded-full shadow-lg transform group-hover:scale-110 transition-transform">
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    ) : (
                      <div className="bg-slate-900/60 text-white p-2.5 rounded-full opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  {/* Category Pill */}
                  <div className="absolute top-4 left-4 bg-slate-950/85 text-amber-400 border border-amber-500/20 px-3 py-1 text-xs font-mono rounded-full font-medium tracking-wide">
                    {act.category}
                  </div>
                </div>

                {/* Card Context */}
                <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
                  <div>
                    <h3 className={`font-sans font-bold text-xl group-hover:text-amber-300 transition-colors ${isDark ? "text-white" : "text-slate-900"}`}>
                      {act.title}
                    </h3>
                    
                    <div className={`flex flex-col gap-2 my-4 text-xs font-mono ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      <span className={`flex items-center gap-2 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                        <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>{act.date}</span>
                      </span>
                      <span className={`flex items-center gap-2 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                        <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>{act.location}</span>
                      </span>
                    </div>

                    <p className={`text-sm font-sans leading-relaxed line-clamp-4 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                      {act.description}
                    </p>
                  </div>

                  {/* Actions Bar */}
                  <div className={`flex items-center justify-between mt-6 pt-4 border-t ${isDark ? "border-slate-800/80" : "border-slate-200"}`}>
                    <div className="flex items-center gap-3">
                      <span className={`flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                        <Heart className="w-4 h-4 text-pink-500 fill-pink-500/10 animate-pulse" />
                        Ministry Active
                      </span>

                      {/* Social Sharing Buttons */}
                      <div className="flex items-center gap-1.5 border-l border-slate-800 pl-3">
                        {/* WhatsApp */}
                        <a
                          href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                            `Kachamba Chorus Ministry Details! ✨\n\n📢 *${act.title}*\n🗓️ Scheduled: ${act.date}\n📍 Location: ${act.location}\n⭐ Category: ${act.category}\n\nJoin us on our journey of faith! Learn more: ${window.location.origin}/#activities-ministry-${act.id}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-7 h-7 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 border border-emerald-500/10 flex items-center justify-center transition-all cursor-pointer"
                          title="Share on WhatsApp"
                        >
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                            <path d="M12.004 0C5.378 0 .004 5.374.004 12c0 2.112.551 4.17 1.625 5.92L0 24l6.19-1.623c1.7 1.025 3.65 1.624 5.814 1.624 6.626 0 12-5.375 12-12s-5.374-12-12-12zm6.2 16.5c-.2.6-.8 1-1.3 1.1-.5.1-1.1.1-3-.7-2.3-1-3.8-3.3-3.9-3.4-.1-.1-.8-1-1.5-1.7-.5-.5-.8-.7-.9-.8-.2-.2-.2-.3-.1-.5s.5-.6.6-.8c.1-.2.2-.3.3-.5.1-.2 0-.3 0-.4-.1-.1-.5-1.2-.7-1.6-.2-.4-.3-.4-.5-.4h-.4c-.1 0-.3.1-.5.3-.2.2-.8.8-.8 2s.9 2.4 1 2.5c.1.1 1.8 2.8 4.4 3.9 1.1.5 1.8.7 2.3.8 1 .3 2 .3 2.7.2.8-.1 1.6-.7 1.9-1.3.3-.6.3-1.1.2-1.3 0-.1-.1-.2-.2-.3z" />
                          </svg>
                        </a>

                        {/* Twitter / X */}
                        <a
                          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                            `Kachamba Chorus Ministry Details! ✨\n\n📢 ${act.title}\n🗓️ Scheduled: ${act.date}\n📍 Location: ${act.location}\n\nLearn more and join us: ${window.location.origin}/#activities-ministry-${act.id}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-850 flex items-center justify-center transition-all cursor-pointer"
                          title="Share on X (Twitter)"
                        >
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                          </svg>
                        </a>

                        {/* Facebook */}
                        <a
                          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin + "/#activities-ministry-" + act.id)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-7 h-7 rounded-lg bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/10 flex items-center justify-center transition-all cursor-pointer"
                          title="Share on Facebook"
                        >
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                            <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.8c4.56-.93 8-4.96 8-9.8z" />
                          </svg>
                        </a>

                        {/* Interactive Copy Activity Share Link */}
                        <button
                          type="button"
                          onClick={() => handleCopyActivity(act.id, act.title, act.date, act.location)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                            copiedItemId === act.id 
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 scale-105" 
                              : "bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-amber-400 border-slate-850"
                          }`}
                          title={copiedItemId === act.id ? "Copied to Clipboard!" : "Copy Ministry Details to Clipboard"}
                        >
                          {copiedItemId === act.id ? (
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          ) : (
                            <Share2 className="w-3.5 h-3.5 stroke-[2]" />
                          )}
                        </button>
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onEdit(act)}
                          className="bg-slate-800 hover:bg-slate-750 text-slate-200 p-1.5 rounded border border-slate-700 cursor-pointer text-xs transition-colors"
                          title="Edit Ministry"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDelete(act.id)}
                          className="bg-red-500/10 hover:bg-red-505 hover:text-white text-red-400 p-1.5 rounded border border-red-500/20 cursor-pointer text-xs transition-colors"
                          title="Delete Ministry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                </div>

              </motion.div>
            ))}
          </motion.div>
        )}

      </div>

      {/* Dynamic Visual Media Lightbox */}
      <AnimatePresence>
        {activeMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md"
            onClick={() => setActiveMedia(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 180 }}
              className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Lightbox Header */}
              <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest block mb-0.5">Media Attachment Viewer</span>
                  <h4 className="text-white font-sans font-bold text-sm md:text-base line-clamp-1">{activeMedia.title}</h4>
                </div>
                <button
                  onClick={() => setActiveMedia(null)}
                  className="bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white p-2 rounded-lg transition-colors cursor-pointer"
                  title="Close Media Viewer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Lightbox Media Body */}
              <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950 min-h-[320px]">
                {activeMedia.type === "video" ? (
                  <video
                    src={activeMedia.url}
                    controls
                    autoPlay
                    playsInline
                    className="max-h-[65vh] w-auto max-w-full rounded-lg shadow-xl"
                  />
                ) : (
                  <img
                    src={activeMedia.url}
                    alt={activeMedia.title}
                    referrerPolicy="no-referrer"
                    className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg shadow-xl"
                  />
                )}
              </div>

              {/* Lightbox Footer */}
              <div className="p-4 border-t border-slate-800 bg-slate-900/40 text-center">
                <span className="text-slate-400 font-mono text-[10px] uppercase">
                  Studio Level High Definition Resolution
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </section>
  );
}
