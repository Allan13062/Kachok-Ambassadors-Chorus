import React, { useState } from "react";
import { Image as ImageIcon, Sparkles, ZoomIn, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function Gallery() {
  const [selectedImg, setSelectedImg] = useState<{ url: string; title: string } | null>(null);

  // Sample gorgeous imagery showcasing various church choral, nature & Christian ministry fields
  const galleryPhotos = [
    {
      title: "Divine Sabbath Accapella Harmonizers",
      category: "Sabbath Praise",
      url: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&q=80&w=800",
      description: "Lifting up voices in holy acappella chords, delivering the divine service message during camp meetings."
    },
    {
      title: "Mountain Top Vesper Prayer Circle",
      category: "Youth Retreat",
      url: "https://images.unsplash.com/photo-1445308112448-f621f31f9cca?auto=format&fit=crop&q=80&w=800",
      description: "Gathering after Sabbath sunset to seek God's leading for our upcoming sacred concert tours."
    },
    {
      title: "Combined Conference Sanctuary Choral Gathering",
      category: "Concerts",
      url: "https://images.unsplash.com/photo-1543840950-89196ec9923b?auto=format&fit=crop&q=80&w=800",
      description: "Our massive vocal seminar ending in a majestic sanctuary hymn service with 400 combined singers."
    },
    {
      title: "Local Community Clinic Song Service",
      category: "Medical Outreach",
      url: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&q=80&w=800",
      description: "Performing soothing bedroom lullabies and Christian healing hymns directly to bedridden patients."
    },
    {
      title: "Kachamba Tenor & Bass Rehearsal Block",
      category: "Sectional Rehearsal",
      url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800",
      description: "Pruning vocal tones, vocal projection, and dynamic timing to ensure absolute clarity of message."
    },
    {
      title: "Ambassador Bible Study Group Session",
      category: "Bible Study",
      url: "https://images.unsplash.com/photo-1504052434569-7c9302e09140?auto=format&fit=crop&q=80&w=800",
      description: "Grounding our melodies in truth. Studying the prophecies of Daniel and Revelation before our sermon program."
    }
  ];

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

        {/* Gallery Bento Grid */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.2 }
            }
          }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {galleryPhotos.map((photo, index) => (
            <motion.div 
              key={index}
              variants={{
                hidden: { opacity: 0, y: 25 },
                visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 70, damping: 20 } }
              }}
              whileHover={{ y: -5, scale: 1.015, boxShadow: "0 15px 30px -5px rgba(245, 158, 11, 0.08)" }}
              onClick={() => setSelectedImg({ url: photo.url, title: photo.title })}
              className="group relative bg-slate-950/80 border border-slate-800 hover:border-amber-400/40 rounded-2xl overflow-hidden shadow-lg transition-all cursor-zoom-in"
            >
              
              {/* Picture Frame */}
              <div className="relative h-64 overflow-hidden bg-slate-950">
                <motion.img 
                  src={photo.url} 
                  alt={photo.title}
                  referrerPolicy="no-referrer"
                  whileHover={{ scale: 1.08 }}
                  transition={{ duration: 1.0, ease: "easeOut" }}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-90"
                />
                <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/0 transition-all" />
                
                {/* Zoom Badge */}
                <div className="absolute top-4 right-4 bg-slate-950/80 p-2 rounded-lg border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ZoomIn className="w-4 h-4 text-amber-400" />
                </div>

                {/* Category Pin */}
                <div className="absolute bottom-4 left-4 bg-amber-500 text-slate-950 font-mono text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded">
                  {photo.category}
                </div>
              </div>

              {/* Picture Context */}
              <div className="p-5">
                <h3 className="font-sans font-bold text-base text-amber-200 group-hover:text-amber-100 transition-colors">
                  {photo.title}
                </h3>
                <p className="font-sans text-xs text-slate-400 mt-1 lines-2 leading-relaxed">
                  {photo.description}
                </p>
              </div>

            </motion.div>
          ))}
        </motion.div>

        {/* Image Full-Screen Modal overlay */}
        <AnimatePresence>
          {selectedImg && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-4 backdrop-blur-sm"
              onClick={() => setSelectedImg(null)}
            >
              <button 
                onClick={() => setSelectedImg(null)}
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
                <img 
                  src={selectedImg.url} 
                  alt={selectedImg.title}
                  className="max-h-[75vh] w-auto max-w-full rounded-xl object-contain border border-slate-805 shadow-2xl"
                  referrerPolicy="no-referrer"
                />
                <p className="text-white font-sans text-sm md:text-base font-semibold mt-4 text-center px-4">
                  {selectedImg.title}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
}
