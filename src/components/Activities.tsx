import React, { useState } from "react";
import { Activity } from "../types";
import { MapPin, Calendar, Plus, Trash2, Edit, X, Check, Share2, Search } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ActivitiesProps {
  items: Activity[];
  isAdmin: boolean;
  onAdd: () => void;
  onEdit: (activity: Activity) => void;
  onDelete: (id: string) => void;
}

export default function Activities({ items, isAdmin, onAdd, onEdit, onDelete }: ActivitiesProps) {
  const [activeMedia, setActiveMedia] = useState<{ url: string; type: "image" | "video" | ""; title: string } | null>(null);
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
    const text = `Kachamba Chorus\n\n📢 ${title}\n🗓️ ${date}\n📍 ${location}\n\n${window.location.origin}/#activities-ministry-${id}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedItemId(id);
      setTimeout(() => setCopiedItemId(null), 2000);
    });
  };

  return (
    <section id="activities" className="relative py-28 px-6 md:px-12 bg-slate-950 overflow-hidden">
      {/* Subtle background texture */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(245,158,11,0.04)_0%,transparent_60%)] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative">

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-px bg-amber-400/50" />
              <span className="label-caps text-amber-400/70 text-[11px]">Choral Growth & Service</span>
            </div>
            <h2 className="font-display font-bold text-4xl md:text-6xl text-white tracking-tight leading-none">
              Ministries &<br />
              <span className="text-white/30 font-light">Activities</span>
            </h2>
            <p className="text-white/45 text-sm mt-4 max-w-md font-light leading-relaxed">
              Regular choral practices, musical seminars, and humanitarian missions — all in one place.
            </p>
          </div>

          <div className="flex flex-col gap-3 items-start md:items-end">
            {items.length > 0 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                <input
                  type="text"
                  placeholder="Search ministries…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="glass rounded-xl py-2.5 pl-9 pr-4 text-xs text-white/80 placeholder-white/25 focus:outline-none focus:border-amber-500/30 w-56 transition-all"
                />
              </div>
            )}
            {isAdmin && (
              <button
                onClick={onAdd}
                className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold label-caps text-[11px] px-5 py-2.5 rounded-full transition-all cursor-pointer shadow-lg shadow-amber-500/15"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Ministry
              </button>
            )}
          </div>
        </div>

        {/* Empty state */}
        {filteredItems.length === 0 && (
          <div className="glass rounded-2xl py-20 text-center">
            <p className="text-white/30 label-caps text-[11px]">No ministries found</p>
          </div>
        )}

        {/* Cards Grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {filteredItems.map((act) => {
            const hasMedia = !!(act.mediaUrl || act.imageUrl);
            const mediaUrl = act.mediaUrl || act.imageUrl || "";
            const isVideo = act.mediaType === "video" || mediaUrl.match(/\.(mp4|webm|mov)$/i);
            const isActive = act.status === "active" || act.status === "ongoing";

            return (
              <motion.div
                key={act.id}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
                className="glass rounded-2xl overflow-hidden group hover:border-white/15 transition-all duration-300"
              >
                {/* Media */}
                {hasMedia ? (
                  <div
                    className="relative h-44 cursor-pointer overflow-hidden"
                    onClick={() => setActiveMedia({ url: mediaUrl, type: isVideo ? "video" : "image", title: act.title })}
                  >
                    {isVideo ? (
                      <video src={mediaUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" muted />
                    ) : (
                      <img src={mediaUrl} alt={act.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  </div>
                ) : (
                  <div className="h-32 bg-gradient-to-br from-amber-500/8 via-transparent to-transparent flex items-center justify-center">
                    <span className="text-3xl opacity-30">🎵</span>
                  </div>
                )}

                {/* Content */}
                <div className="p-5">
                  {/* Status + Category */}
                  <div className="flex items-center gap-2 mb-3">
                    {isActive && (
                      <span className="flex items-center gap-1 label-caps text-[9px] text-emerald-400/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Active
                      </span>
                    )}
                    <span className="label-caps text-[9px] text-amber-400/60 bg-amber-500/8 px-2 py-0.5 rounded-full border border-amber-500/15">
                      {act.category || "Ministry"}
                    </span>
                  </div>

                  <h3 className="font-display font-semibold text-base text-white mb-2 leading-tight">{act.title}</h3>
                  <p className="text-white/45 text-xs leading-relaxed line-clamp-2 mb-4">{act.description}</p>

                  <div className="flex flex-col gap-1.5 mb-4">
                    {act.date && (
                      <div className="flex items-center gap-2 text-white/35 text-xs">
                        <Calendar className="w-3 h-3 flex-shrink-0" />
                        <span>{act.date}</span>
                      </div>
                    )}
                    {act.location && (
                      <div className="flex items-center gap-2 text-white/35 text-xs">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="line-clamp-1">{act.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <button
                      onClick={() => handleCopyActivity(act.id, act.title, act.date, act.location)}
                      className={`flex items-center gap-1.5 label-caps text-[10px] transition-colors ${
                        copiedItemId === act.id ? "text-emerald-400" : "text-white/30 hover:text-white/70"
                      }`}
                    >
                      {copiedItemId === act.id ? <Check className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
                      {copiedItemId === act.id ? "Copied" : "Share"}
                    </button>

                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        <button onClick={() => onEdit(act)} className="p-1.5 rounded-lg text-white/30 hover:text-amber-400 hover:bg-amber-500/8 transition-all">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => onDelete(act.id)} className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/8 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Media Lightbox */}
      <AnimatePresence>
        {activeMedia && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setActiveMedia(null)}
          >
            <button className="absolute top-4 right-4 w-9 h-9 glass rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors" onClick={() => setActiveMedia(null)}>
              <X className="w-4 h-4" />
            </button>
            <motion.div
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="max-w-4xl max-h-[90vh] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {activeMedia.type === "video" ? (
                <video src={activeMedia.url} controls autoPlay className="w-full max-h-[80vh] rounded-xl" />
              ) : (
                <img src={activeMedia.url} alt={activeMedia.title} className="w-full max-h-[80vh] object-contain rounded-xl" />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
