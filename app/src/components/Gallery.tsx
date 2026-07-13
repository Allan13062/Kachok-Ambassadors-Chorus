import React, { useState } from "react";
import { ZoomIn, X, Play, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GalleryPhoto } from "../types";

interface GalleryProps {
  photos?: GalleryPhoto[];
}

export default function Gallery({ photos = [] }: GalleryProps) {
  const [selectedItem, setSelectedItem] = useState<GalleryPhoto | null>(null);

  return (
    <section id="gallery" className="relative py-28 px-6 md:px-12 bg-slate-900 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,rgba(245,158,11,0.04)_0%,transparent_60%)] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative">

        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-6 h-px bg-amber-400/50" />
            <span className="label-caps text-amber-400/70 text-[11px]">Captured Moments</span>
            <div className="w-6 h-px bg-amber-400/50" />
          </div>
          <h2 className="font-display font-bold text-4xl md:text-6xl text-white tracking-tight leading-none mb-3">
            Gallery
          </h2>
          <p className="text-white/40 text-sm font-light max-w-sm mx-auto leading-relaxed">
            Prayer, harmony, and vibrant outreach — captured in every frame.
          </p>
        </div>

        {/* Empty state */}
        {photos.length === 0 && (
          <div className="glass rounded-2xl py-24 text-center">
            <div className="p-4 glass rounded-2xl w-14 h-14 flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="w-6 h-6 text-white/25" />
            </div>
            <p className="label-caps text-[11px] text-white/25">No media yet</p>
            <p className="text-white/20 text-xs mt-1">Admins can upload from the dashboard</p>
          </div>
        )}

        {/* Masonry-style Grid */}
        {photos.length > 0 && (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } }}
            className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4"
          >
            {photos.map((photo, index) => {
              const isVideo = photo.mediaType === "video" || photo.url?.match(/\.(mp4|webm|mov)$/i);
              return (
                <motion.div
                  key={photo.id || index}
                  variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
                  className="break-inside-avoid glass rounded-xl overflow-hidden group cursor-pointer relative"
                  onClick={() => setSelectedItem(photo)}
                >
                  {isVideo ? (
                    <div className="relative">
                      <video src={photo.url} className="w-full object-cover group-hover:scale-105 transition-transform duration-700" muted />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-12 h-12 glass rounded-full flex items-center justify-center">
                          <Play className="w-5 h-5 text-white ml-0.5" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative overflow-hidden">
                      <img
                        src={photo.url}
                        alt={photo.title || photo.caption || "Gallery"}
                        className="w-full object-cover group-hover:scale-105 transition-transform duration-700"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-10 h-10 glass rounded-full flex items-center justify-center">
                          <ZoomIn className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    </div>
                  )}
                  {(photo.title || photo.caption) && (
                    <div className="p-3 border-t border-white/5">
                      <p className="text-white/55 text-xs leading-relaxed">{photo.title || photo.caption}</p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/92 backdrop-blur-2xl flex items-center justify-center p-4"
            onClick={() => setSelectedItem(null)}
          >
            <button
              className="absolute top-5 right-5 w-9 h-9 glass rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors"
              onClick={() => setSelectedItem(null)}
            >
              <X className="w-4 h-4" />
            </button>
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="max-w-5xl w-full max-h-[90vh] flex flex-col items-center gap-3"
              onClick={(e) => e.stopPropagation()}
            >
              {selectedItem.mediaType === "video" || selectedItem.url?.match(/\.(mp4|webm|mov)$/i) ? (
                <video src={selectedItem.url} controls autoPlay className="max-h-[80vh] w-full rounded-xl" />
              ) : (
                <img src={selectedItem.url} alt={selectedItem.title || ""} className="max-h-[80vh] object-contain rounded-xl" />
              )}
              {(selectedItem.title || selectedItem.caption) && (
                <p className="text-white/50 text-sm text-center">{selectedItem.title || selectedItem.caption}</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
