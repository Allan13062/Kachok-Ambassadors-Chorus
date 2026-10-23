import React, { useEffect, useRef, useState } from "react";
import { ZoomIn, X, Play, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GalleryPhoto } from "../types";

interface GalleryProps {
  photos?: GalleryPhoto[];
}

export default function Gallery({ photos = [] }: GalleryProps) {
  const [selectedItem, setSelectedItem] = useState<GalleryPhoto | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!selectedItem) return;

    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedItem(null);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedItem]);

  const isVideo = (photo: GalleryPhoto) =>
    photo.mediaType === "video" ||
    /\.(mp4|webm|mov)(\?.*)?$/i.test(photo.url || "");

  return (
    <section
      id="gallery"
      className="relative overflow-hidden bg-slate-900 px-6 py-24 md:px-12"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,rgba(245,158,11,0.04)_0%,transparent_60%)]" />

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <div className="h-px w-6 bg-amber-400/50" />
            <span className="label-caps text-[11px] text-amber-400/70">
              Captured Moments
            </span>
            <div className="h-px w-6 bg-amber-400/50" />
          </div>

          <h2 className="font-display text-4xl font-bold tracking-tight text-white md:text-6xl">
            Gallery
          </h2>

          <p className="mx-auto mt-3 max-w-sm text-sm font-light leading-relaxed text-white/40">
            Prayer, harmony, and vibrant outreach — captured in every frame.
          </p>
        </div>

        {photos.length === 0 ? (
          <div className="glass rounded-2xl py-24 text-center">
            <div className="glass mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
              <ImageIcon className="h-6 w-6 text-white/25" aria-hidden="true" />
            </div>
            <p className="label-caps text-[11px] text-white/25">No media yet</p>
            <p className="mt-1 text-xs text-white/20">
              Admins can upload from the dashboard
            </p>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.05 },
              },
            }}
            className="columns-1 gap-4 space-y-4 sm:columns-2 lg:columns-3"
          >
            {photos.map((photo, index) => {
              const video = isVideo(photo);
              const label = photo.title || photo.caption || "Gallery media";

              return (
                <motion.div
                  key={photo.id || index}
                  variants={{
                    hidden: { opacity: 0, y: 12 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
                  }}
                  className="break-inside-avoid"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedItem(photo)}
                    aria-label={`Open ${label}`}
                    className="glass group relative block w-full overflow-hidden rounded-xl text-left focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    {video ? (
                      <div className="relative">
                        <video
                          src={photo.url}
                          muted
                          playsInline
                          preload="metadata"
                          className="block max-h-[560px] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white">
                            <Play className="h-5 w-5" aria-hidden="true" />
                          </span>
                        </span>
                      </div>
                    ) : (
                      <div className="relative overflow-hidden">
                        <img
                          src={photo.url}
                          alt={label}
                          loading="lazy"
                          decoding="async"
                          className="block max-h-[560px] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <span className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition group-hover:opacity-100">
                          <span className="glass flex h-10 w-10 items-center justify-center rounded-full">
                            <ZoomIn className="h-4 w-4 text-white" aria-hidden="true" />
                          </span>
                        </span>
                      </div>
                    )}

                    {label && (
                      <span className="block border-t border-white/5 p-3 text-xs leading-relaxed text-white/55">
                        {label}
                      </span>
                    )}
                  </button>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {selectedItem && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={selectedItem.title || selectedItem.caption || "Gallery viewer"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/92 p-4 backdrop-blur-2xl"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setSelectedItem(null);
            }}
          >
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => setSelectedItem(null)}
              aria-label="Close gallery viewer"
              title="Close"
              className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>

            <div className="flex max-h-[90vh] max-w-5xl flex-col items-center gap-3">
              {isVideo(selectedItem) ? (
                <video
                  src={selectedItem.url}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-[80vh] max-w-full rounded-xl"
                />
              ) : (
                <img
                  src={selectedItem.url}
                  alt={selectedItem.title || selectedItem.caption || "Gallery"}
                  className="max-h-[80vh] max-w-full rounded-xl object-contain"
                />
              )}

              {(selectedItem.title || selectedItem.caption) && (
                <p className="text-center text-sm text-white/60">
                  {selectedItem.title || selectedItem.caption}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
