import React, { useEffect, useState } from "react";
import { Activity } from "../types";
import {
  MapPin,
  Calendar,
  Plus,
  Trash2,
  Edit,
  X,
  Check,
  Share2,
  Search,
  Play,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ActivitiesProps {
  items: Activity[];
  isAdmin: boolean;
  onAdd: () => void;
  onEdit: (activity: Activity) => void;
  onDelete: (id: string) => void;
}

export default function Activities({
  items,
  isAdmin,
  onAdd,
  onEdit,
  onDelete,
}: ActivitiesProps) {
  const [activeMedia, setActiveMedia] = useState<{
    url: string;
    type: "image" | "video";
    title: string;
  } | null>(null);
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const safeItems = Array.isArray(items) ? items : [];
  const query = searchQuery.trim().toLowerCase();

  const filteredItems = safeItems.filter((act) => {
    const searchable = [
      act?.title,
      act?.description,
      act?.location,
      act?.category,
      act?.date,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchable.includes(query);
  });

  useEffect(() => {
    if (!activeMedia) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveMedia(null);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [activeMedia]);

  const handleCopyActivity = async (
    id: string,
    title = "Kachamba Chorus Ministry",
    date = "",
    location = ""
  ) => {
    const text = `Kachamba Chorus Ministry\n\n${title}\n${date ? `Date: ${date}\n` : ""}${
      location ? `Location: ${location}\n` : ""
    }\n${window.location.origin}/#activities`;

    try {
      await navigator.clipboard.writeText(text);
      setCopiedItemId(id);
      window.setTimeout(() => setCopiedItemId(null), 2000);
    } catch {
      console.warn("Clipboard access was unavailable.");
    }
  };

  return (
    <section
      id="activities"
      className="relative overflow-hidden bg-slate-950 px-6 py-24 md:px-12"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(245,158,11,0.04)_0%,transparent_60%)]" />

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="h-px w-6 bg-amber-400/50" />
              <span className="label-caps text-[11px] text-amber-400/70">
                Choral Growth & Service
              </span>
            </div>

            <h2 className="font-display text-4xl font-bold leading-none tracking-tight text-white md:text-6xl">
              Ministries &
              <br />
              <span className="font-light text-white/30">Activities</span>
            </h2>

            <p className="mt-4 max-w-md text-sm font-light leading-relaxed text-white/45">
              Regular choral practices, musical seminars, and humanitarian
              missions — all in one place.
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 md:items-end">
            {safeItems.length > 0 && (
              <label className="relative">
                <span className="sr-only">Search ministries</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search ministries…"
                  className="glass w-56 rounded-xl py-2.5 pl-9 pr-4 text-xs text-white/80 placeholder-white/25 outline-none transition-all focus:border-amber-500/50"
                />
              </label>
            )}

            {isAdmin && (
              <button
                type="button"
                onClick={onAdd}
                className="flex items-center gap-2 rounded-full bg-amber-400 px-5 py-2.5 text-[11px] font-semibold text-slate-950 shadow-lg shadow-amber-500/15 transition hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-slate-950"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                Add Ministry
              </button>
            )}
          </div>
        </div>

        {filteredItems.length === 0 && (
          <div className="glass rounded-2xl py-20 text-center">
            <p className="label-caps text-[11px] text-white/30">
              {query ? "No ministries match your search" : "No ministries found"}
            </p>
          </div>
        )}

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.06 },
            },
          }}
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filteredItems.map((act, index) => {
            const mediaUrl = act?.image || "";
            const isVideo =
              act?.mediaType === "video" ||
              /\.(mp4|webm|mov)(\?.*)?$/i.test(mediaUrl);

            const accents = [
              "border-amber-400/50",
              "border-cyan-400/50",
              "border-violet-400/50",
              "border-emerald-400/50",
              "border-rose-400/50",
            ];

            return (
              <motion.article
                key={act.id}
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.4 },
                  },
                }}
                className={`glass overflow-hidden rounded-2xl border-t-2 ${accents[index % accents.length]}`}
              >
                {mediaUrl ? (
                  <button
                    type="button"
                    className="group relative block h-44 w-full overflow-hidden text-left"
                    onClick={() =>
                      setActiveMedia({
                        url: mediaUrl,
                        type: isVideo ? "video" : "image",
                        title: act.title || "Ministry media",
                      })
                    }
                    aria-label={`Open media for ${act.title || "ministry"}`}
                  >
                    {isVideo ? (
                      <video
                        src={mediaUrl}
                        muted
                        playsInline
                        preload="metadata"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <img
                        src={mediaUrl}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}

                    <span className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition group-hover:opacity-100">
                      {isVideo && (
                        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white">
                          <Play className="h-5 w-5" aria-hidden="true" />
                        </span>
                      )}
                    </span>
                  </button>
                ) : (
                  <div className="flex h-32 items-center justify-center bg-gradient-to-br from-amber-500/10 to-transparent">
                    <span className="text-3xl opacity-30" aria-hidden="true">
                      🎵
                    </span>
                  </div>
                )}

                <div className="p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="label-caps rounded-full border border-amber-500/15 bg-amber-500/5 px-2 py-0.5 text-[9px] text-amber-400/70">
                      {act.category || "Ministry"}
                    </span>
                  </div>

                  <h3 className="mb-2 font-display text-base font-semibold leading-tight text-white">
                    {act.title || "Untitled ministry"}
                  </h3>

                  <p className="mb-4 line-clamp-3 text-xs leading-relaxed text-white/45">
                    {act.description || "No description provided."}
                  </p>

                  <div className="mb-4 flex flex-col gap-1.5">
                    {act.date && (
                      <div className="flex items-center gap-2 text-xs text-white/35">
                        <Calendar className="h-3 w-3 shrink-0" aria-hidden="true" />
                        <span>{act.date}</span>
                      </div>
                    )}

                    {act.location && (
                      <div className="flex items-center gap-2 text-xs text-white/35">
                        <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                        <span className="line-clamp-1">{act.location}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-3">
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyActivity(
                          act.id,
                          act.title,
                          act.date,
                          act.location
                        )
                      }
                      className="flex items-center gap-1.5 text-[10px] text-white/35 transition hover:text-white/80 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                    >
                      {copiedItemId === act.id ? (
                        <Check className="h-3 w-3" aria-hidden="true" />
                      ) : (
                        <Share2 className="h-3 w-3" aria-hidden="true" />
                      )}
                      {copiedItemId === act.id ? "Copied" : "Share"}
                    </button>

                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEdit(act)}
                          aria-label={`Edit ${act.title || "ministry"}`}
                          title="Edit"
                          className="rounded-lg p-2 text-white/35 transition hover:bg-amber-500/10 hover:text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                        >
                          <Edit className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onDelete(act.id)}
                          aria-label={`Delete ${act.title || "ministry"}`}
                          title="Delete"
                          className="rounded-lg p-2 text-white/35 transition hover:bg-red-500/10 hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/50"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.article>
            );
          })}
        </motion.div>
      </div>

      <AnimatePresence>
        {activeMedia && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={activeMedia.title}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-xl"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setActiveMedia(null);
            }}
          >
            <button
              type="button"
              onClick={() => setActiveMedia(null)}
              aria-label="Close media viewer"
              title="Close"
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>

            <div className="max-h-[90vh] max-w-5xl">
              {activeMedia.type === "video" ? (
                <video
                  src={activeMedia.url}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-[82vh] max-w-full rounded-xl"
                />
              ) : (
                <img
                  src={activeMedia.url}
                  alt={activeMedia.title}
                  className="max-h-[82vh] max-w-full rounded-xl object-contain"
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
