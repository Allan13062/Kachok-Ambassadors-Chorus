import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import { GalleryPhoto } from "../types";

interface GalleryProps {
  photos?: GalleryPhoto[];
}

type Filter = "all" | "photos" | "videos";

const isVideo = (photo: GalleryPhoto) =>
  photo.mediaType === "video" || /\.(mp4|webm|mov)(\?.*)?$/i.test(photo.url || "");

export default function Gallery({ photos = [] }: GalleryProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const list = Array.isArray(photos) ? photos.filter((p) => p && p.url) : [];
  const videoCount = list.filter(isVideo).length;
  const photoCount = list.length - videoCount;

  const visible = useMemo(() => {
    if (filter === "photos") return list.filter((p) => !isVideo(p));
    if (filter === "videos") return list.filter(isVideo);
    return list;
  }, [list, filter]);

  const current = openIndex !== null ? visible[openIndex] : null;

  const close = () => setOpenIndex(null);
  const step = (dir: 1 | -1) =>
    setOpenIndex((i) => (i === null ? null : (i + dir + visible.length) % visible.length));

  // Keyboard navigation and scroll lock while the viewer is open
  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openIndex, visible.length]);

  // Close the viewer if the filter changes underneath it
  useEffect(() => setOpenIndex(null), [filter]);

  const tabs: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: "All", count: list.length },
    { id: "photos", label: "Photos", count: photoCount },
    { id: "videos", label: "Videos", count: videoCount },
  ];

  return (
    <section id="gallery" className="relative bg-slate-900 px-5 py-16 md:px-10 md:py-20">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-400">Gallery</p>
            <h2 className="mt-2 font-display text-[2rem] font-bold leading-tight tracking-tight text-white md:text-[2.4rem]">
              Moments from our ministry
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-white/55">
              Prayer, harmony and outreach, captured in photos and video.
            </p>
          </div>

          {list.length > 0 && (
            <div role="tablist" aria-label="Filter gallery" className="flex gap-1.5">
              {tabs.map((t) => {
                const active = filter === t.id;
                return (
                  <button
                    key={t.id}
                    role="tab"
                    type="button"
                    aria-selected={active}
                    onClick={() => setFilter(t.id)}
                    disabled={t.count === 0 && t.id !== "all"}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition disabled:opacity-35 ${
                      active
                        ? "bg-white text-slate-950"
                        : "border border-white/15 text-white/60 hover:border-white/35 hover:text-white"
                    }`}
                  >
                    {t.label}
                    <span className={`ml-1.5 ${active ? "text-slate-500" : "text-white/35"}`}>{t.count}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Empty state */}
        {visible.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/15 px-6 py-16 text-center">
            <p className="text-sm text-white/60">
              {list.length === 0 ? "Photos and videos will appear here once they are added." : "Nothing in this view yet."}
            </p>
          </div>
        )}

        {/* Grid */}
        {visible.length > 0 && (
          <motion.div
            key={filter}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-4"
          >
            {visible.map((photo, index) => {
              const video = isVideo(photo);
              const label = photo.title || photo.caption || (video ? "Video" : "Photo");

              return (
                <button
                  key={photo.id || index}
                  type="button"
                  onClick={() => setOpenIndex(index)}
                  aria-label={`Open ${label}`}
                  className="group relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-800 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                >
                  {video ? (
                    <>
                      <video
                        src={photo.url}
                        muted
                        playsInline
                        preload="metadata"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                      />
                      <span className="absolute inset-0 grid place-items-center bg-slate-950/25">
                        <span className="grid h-11 w-11 place-items-center rounded-full bg-slate-950/70 text-white">
                          <Play className="ml-0.5 h-4 w-4 fill-current" aria-hidden="true" />
                        </span>
                      </span>
                    </>
                  ) : (
                    <img
                      src={photo.url}
                      alt={label}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                    />
                  )}

                  {/* Caption: always visible on phones, slides up on desktop hover */}
                  {(photo.title || photo.caption) && (
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 to-transparent px-3.5 pb-3 pt-10 text-left text-xs font-medium text-white md:translate-y-1 md:opacity-0 md:transition md:duration-300 md:group-hover:translate-y-0 md:group-hover:opacity-100">
                      {photo.title || photo.caption}
                    </span>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Viewer */}
      <AnimatePresence>
        {current && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={current.title || current.caption || "Gallery viewer"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-slate-950/95 p-4"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) close();
            }}
          >
            {/* Top bar */}
            <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 py-4">
              <p className="text-xs tabular-nums text-white/50">
                {(openIndex ?? 0) + 1} / {visible.length}
              </p>
              <button
                type="button"
                onClick={close}
                aria-label="Close gallery viewer"
                className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* Previous / next */}
            {visible.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label="Previous"
                  className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 md:left-6"
                >
                  <ChevronLeft className="h-6 w-6" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label="Next"
                  className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 md:right-6"
                >
                  <ChevronRight className="h-6 w-6" aria-hidden="true" />
                </button>
              </>
            )}

            {/* Media */}
            <div className="flex max-h-[84vh] w-full max-w-5xl flex-col items-center gap-4">
              {isVideo(current) ? (
                <video
                  key={current.url}
                  src={current.url}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-[78vh] max-w-full rounded-xl"
                />
              ) : (
                <img
                  key={current.url}
                  src={current.url}
                  alt={current.title || current.caption || "Gallery photo"}
                  className="max-h-[78vh] max-w-full rounded-xl object-contain"
                />
              )}
              {(current.title || current.caption) && (
                <p className="text-center text-sm text-white/65">{current.title || current.caption}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
