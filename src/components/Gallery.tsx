import React, { useState } from "react";
import { Image as ImageIcon, ZoomIn, X, Play } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GalleryPhoto } from "../types";

interface GalleryProps {
  photos?: GalleryPhoto[];
}

export default function Gallery({ photos = [] }: GalleryProps) {
  const [selectedItem, setSelectedItem] = useState<GalleryPhoto | null>(null);

  const hasPhotos = photos.length > 0;

  return (
    <section
      id="gallery"
      className="py-20 px-6 md:px-12 bg-slate-900 border-t border-b border-slate-800 text-white"
    >
      <div className="max-w-6xl mx-auto">

        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 text-amber-400 font-mono text-xs tracking-wider uppercase mb-2">
          </div>
          <h2 className="font-sans font-extrabold text-3xl md:text-5xl tracking-tight text-white">
            Gallery
          </h2>
          <p className="font-sans text-slate-400 text-sm md:text-base mt-2">
            Capturing sincere moments of prayer, harmonious melodies, and vibrant outreach ministries.
          </p>
        </div>

        {/* Empty state */}
        {!hasPhotos && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="p-5 bg-slate-800/60 rounded-2xl border border-slate-700 mb-4">
              <ImageIcon className="w-10 h-10 text-slate-500" />
            </div>
            <p className="text-slate-400 font-sans text-sm">No photos or videos yet.</p>
            <p className="text-slate-500 font-mono text-xs mt-1">Admins can upload gallery media from the admin panel.</p>
          </div>
        )}

        {/* Gallery Bento Grid */}
        {hasPhotos && (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {photos.map((photo, index) => {
              const isVideo = photo.mediaType === "video" || photo.url?.match(/\.(mp4|webm|mov)$/i);
              return (
                <motion.div
                  key={photo.id || index}
                  variants={{
                    hidden: { opacity: 0, y: 25 },
                    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 70, damping: 20 } }
                  }}
                  whileHover={{ y: -5, scale: 1.03, boxShadow: "0 15px 30px -5px rgba(245, 158, 11, 0.08)" }}
                  onClick={() => setSelectedItem(photo)}
                  className="group relative bg-slate-950/80 border border-slate-800 hover:border-amber-400/40 rounded-2xl overflow-hidden shadow-lg transition-all cursor-zoom-in"
                >
                  {/* Media Frame */}
                  <div className="relative h-64 overflow-hidden bg-slate-950">
                    {isVideo ? (
                      <video
                        src={photo.url}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-90"
                        muted
                        playsInline
                      />
                    ) : (
                      <motion.img
                        src={photo.url}
                        alt={photo.title}
                        referrerPolicy="no-referrer"
                        whileHover={{ scale: 1.08 }}
                        transition={{ duration: 1.0, ease: "easeOut" }}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-90"
                      />
                    )}
                    <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/0 transition-all" />

                    {/* Zoom / Play Badge */}
                    <div className="absolute top-4 right-4 bg-slate-950/80 p-2 rounded-lg border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isVideo ? <Play className="w-4 h-4 text-amber-400" /> : <ZoomIn className="w-4 h-4 text-amber-400" />}
                    </div>

                    {/* Category Pin */}
                    <div className="absolute bottom-4 left-4 bg-amber-500 text-slate-950 font-mono text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded">
                      {photo.category}
                    </div>
                  </div>

                  {/* Context */}
                  <div className="p-5">
                    <h3 className="font-sans font-bold text-base text-amber-200 group-hover:text-amber-100 transition-colors">
                      {photo.title}
                    </h3>
                    {photo.description && (
                      <p className="font-sans text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                        {photo.description}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Full-screen Modal */}
        <AnimatePresence>
          {selectedItem && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-4 backdrop-blur-sm"
              onClick={() => setSelectedItem(null)}
            >
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-6 right-6 bg-slate-900 border border-slate-850 p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer transition-colors z-20"
              >
                <X className="w-6 h-6" />
              </button>
              <motion.div
                initial={{ opacity: 0, scale: 0.93 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.93 }}
                transition={{ type: "spring", stiffness: 150, damping: 25 }}
                className="max-w-4xl w-full flex flex-col items-center"
                onClick={(e) => e.stopPropagation()}
              >
                {selectedItem.mediaType === "video" || selectedItem.url?.match(/\.(mp4|webm|mov)$/i) ? (
                  <video
                    src={selectedItem.url}
                    controls
                    autoPlay
                    className="max-h-[75vh] w-auto max-w-full rounded-xl border border-slate-805 shadow-2xl"
                  />
                ) : (
                  <img
                    src={selectedItem.url}
                    alt={selectedItem.title}
                    className="max-h-[75vh] w-auto max-w-full rounded-xl object-contain border border-slate-805 shadow-2xl"
                    referrerPolicy="no-referrer"
                  />
                )}
                <p className="text-white font-sans text-sm md:text-base font-semibold mt-4 text-center px-4">
                  {selectedItem.title}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
}
