import React, { useState, useEffect } from "react";
import { Users, Phone, Shield, Edit, Trash2, Plus, MessageCircle, X, ExternalLink, Calendar, Award, Share2 } from "lucide-react";
import { Leader } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface LeadersProps {
  items: Leader[];
  isAdmin: boolean;
  onAdd: () => void;
  onEdit: (leader: Leader) => void;
  onDelete: (id: string) => void;
}

export default function Leaders({ items, isAdmin, onAdd, onEdit, onDelete }: LeadersProps) {
  const [selectedLeader, setSelectedLeader] = useState<Leader | null>(null);

  // Synchronize selectedLeader details immediately when underlying source list updates
  useEffect(() => {
    if (selectedLeader) {
      const parentMatch = items.find(item => item.id === selectedLeader.id);
      if (parentMatch) {
        setSelectedLeader(parentMatch);
      } else {
        setSelectedLeader(null); // Close if deleted
      }
    }
  }, [items]);

  // Deep linking for shared leader profile
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const leaderId = params.get("leader");
    if (leaderId && items.length > 0 && !selectedLeader) {
      const found = items.find(item => item.id === leaderId);
      if (found) {
        setSelectedLeader(found);
      }
    }
  }, [items]);


  // Parse Kenya standard phone numbers for WhatsApp integration
  const getWhatsAppUrl = (phone: string) => {
    const cleaned = phone.replace(/[^\d]/g, "");
    let finalNo = cleaned;
    if (cleaned.startsWith("0")) {
      finalNo = "254" + cleaned.substring(1);
    } else if (!cleaned.startsWith("254") && cleaned.length === 9) {
      finalNo = "254" + cleaned;
    }
    return `https://wa.me/${finalNo}`;
  };

  const handleCloseProfile = () => {
    setSelectedLeader(null);
    const params = new URLSearchParams(window.location.search);
    if (params.has("leader")) {
      window.history.pushState({}, "", window.location.origin);
    }
  };

  const getCleanPhone = (phone: string) => {
    return phone.replace(/[^\d+]/g, "");
  };

  const handleShareProfile = async (leader: Leader) => {
    const shareUrl = `${window.location.origin}/?leader=${leader.id}`;
    const textToCopy = `Meet ${leader.name}, ${leader.role} at Kachamba Chorus!\n\nView steward profile here: ${shareUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Kachamba Chorus Steward - ${leader.name}`,
          text: textToCopy,
          url: shareUrl,
        });
        return;
      } catch (err) {
        console.error("Error sharing via Web Share API:", err);
      }
    }

    try {
      await navigator.clipboard.writeText(textToCopy);
      alert("Leader profile link copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
      alert("Could not copy link.");
    }
  };

  return (
    <section 
      id="leadership" 
      className="py-16 md:py-24 px-4 sm:px-6 md:px-12 bg-slate-950/40 border-t border-slate-900 text-white relative"
    >
      <div className="max-w-6xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 font-mono text-[10px] sm:text-xs tracking-wider uppercase mb-3">
            <Users className="w-3.5 h-3.5" />
            <span>Kachamba Choral Executive</span>
          </div>
          <h2 className="font-sans font-extrabold text-3xl sm:text-4xl md:text-5xl tracking-tight text-white uppercase">
            Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-rose-500 to-amber-300">Leadership</span>
          </h2>
          <p className="font-sans text-slate-400 text-xs sm:text-sm md:text-base mt-2 px-2">
            Meet the dedicated stewards guiding the musical, spiritual, and missionary endeavors of our chorus.
          </p>
        </div>

        {/* Leaders Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {items.map((leader) => (
            <div 
              key={leader.id}
              className="group relative bg-slate-900/40 backdrop-blur-md border border-slate-850 hover:border-amber-400/30 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-amber-500/5 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Leader Picture Box - 16:10 or square responsive frame */}
                <div 
                  onClick={() => setSelectedLeader(leader)}
                  className="relative h-64 sm:h-72 overflow-hidden bg-slate-950 cursor-pointer group-hover:opacity-95 transition-all"
                >
                  <img 
                    src={leader.image || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400"} 
                    alt={leader.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />
                  
                  {/* Action Indicators on Hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-slate-950/40 backdrop-blur-[2px]">
                    <span className="font-sans text-xs bg-amber-500 text-slate-950 py-2 px-4 rounded-full font-bold shadow-lg flex items-center gap-1.5 uppercase tracking-wider scale-90 group-hover:scale-100 transition-transform">
                      <span>View steward bio</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </span>
                  </div>

                  {/* Admin Quick Controls */}
                  {isAdmin && (
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onEdit(leader)}
                        className="bg-slate-900/95 hover:bg-amber-500 text-slate-300 hover:text-slate-950 p-2 rounded-lg border border-slate-800 hover:border-amber-400 transition-colors cursor-pointer shadow"
                        title="Edit Leader Profile"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(leader.id)}
                        className="bg-slate-900/95 hover:bg-red-500 text-red-400 hover:text-white p-2 rounded-lg border border-slate-800 hover:border-red-500/20 transition-colors cursor-pointer shadow"
                        title="Delete Leader Profile"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Role Badge pinned bottom left */}
                  <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-slate-800/80 px-2.5 py-1 rounded-md flex items-center gap-1.5 text-xs select-none">
                    <Shield className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="font-mono text-amber-400 font-bold tracking-wide uppercase text-[9px] sm:text-[10px]">
                      {leader.role}
                    </span>
                  </div>
                </div>

                {/* Context Box */}
                <div className="p-5 sm:p-6" onClick={() => setSelectedLeader(leader)}>
                  <div className="cursor-pointer">
                    <h3 className="font-sans font-extrabold text-base sm:text-lg text-slate-100 group-hover:text-amber-400 transition-colors">
                      {leader.name}
                    </h3>
                    
                    {leader.bio ? (
                      <p className="font-sans text-xs text-slate-400 leading-relaxed mt-2 line-clamp-2 italic">
                        "{leader.bio}"
                      </p>
                    ) : (
                      <p className="font-sans text-xs text-slate-500 leading-relaxed mt-2 italic">
                        "Dedicated to praise and acappella ministry."
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contacts Panel (Integrated Quick Actions) */}
              {leader.phone && (
                <div className="px-5 sm:px-6 pb-5 pt-3 border-t border-slate-800/40 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono truncate">
                    <Phone className="w-3 h-3 text-amber-500/60 shrink-0" />
                    <span className="truncate">{leader.phone}</span>
                  </div>

                  {/* Quick dial/chat row */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleShareProfile(leader)}
                      className="bg-slate-950 hover:bg-indigo-500 hover:text-white text-indigo-400 p-1.5 rounded-md border border-slate-800 hover:border-indigo-500/30 transition-all text-[10px] font-mono flex items-center gap-1 font-bold cursor-pointer"
                      title="Share Profile"
                    >
                      <Share2 className="w-3 h-3" />
                    </button>
                    <a
                      href={`tel:${getCleanPhone(leader.phone)}`}
                      className="bg-slate-950 hover:bg-amber-500 text-slate-400 hover:text-slate-950 p-1.5 rounded-md border border-slate-800 hover:border-amber-400 transition-all text-[10px] font-mono flex items-center gap-1 font-bold"
                      title="Call Steward"
                    >
                      <Phone className="w-3 h-3" />
                      <span className="hidden xs:inline">Call</span>
                    </a>
                    <a
                      href={getWhatsAppUrl(leader.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-slate-950 hover:bg-emerald-505 hover:text-white text-emerald-400 p-1.5 rounded-md border border-slate-800 hover:border-emerald-500/30 transition-all text-[10px] font-mono flex items-center gap-1 font-bold"
                      title="Chat on WhatsApp"
                    >
                      <MessageCircle className="w-3 h-3" />
                      <span className="hidden xs:inline">WhatsApp</span>
                    </a>
                  </div>
                </div>
              )}

            </div>
          ))}

          {/* Admin Add Leader Card */}
          {isAdmin && (
            <button
              onClick={onAdd}
              className="border-2 border-dashed border-slate-800 hover:border-amber-400/40 rounded-2xl bg-slate-900/5 hover:bg-slate-905/35 transition-all flex flex-col items-center justify-center p-8 text-center min-h-[360px] cursor-pointer group"
            >
              <div className="bg-slate-900 border border-slate-800 group-hover:border-amber-400/30 p-3.5 rounded-full text-slate-500 group-hover:text-amber-400 transition-all shadow mb-4">
                <Plus className="w-7 h-7" />
              </div>
              <span className="font-sans font-bold text-sm text-slate-300 group-hover:text-white transition-colors">
                Enlist Council Steward
              </span>
              <p className="font-sans text-[11px] text-slate-500 max-w-[200px] mt-1.5 leading-relaxed">
                Add a new choir director, local secretary, or treasurer to public profiles directory.
              </p>
            </button>
          )}
        </div>

      </div>

      {/* LEADERSHIP BIO BOTTOM SHEET / DRAWER FOR DESKTOP & MOBILE */}
      <AnimatePresence>
        {selectedLeader && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/85 backdrop-blur-md p-0 sm:p-4 cursor-pointer"
            onClick={handleCloseProfile}
          >
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.93 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.93 }}
              transition={{ type: "spring", stiffness: 150, damping: 25 }}
              className="bg-slate-900 border-t sm:border border-slate-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] sm:max-h-[90vh] flex flex-col overflow-hidden text-white shadow-2xl relative cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header / Dismiss */}
              <button 
                onClick={handleCloseProfile}
                className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-950/50 p-1.5 rounded-full cursor-pointer hover:bg-slate-950 transition-colors z-20"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Content box / Photo */}
              <div className="overflow-y-auto custom-scrollbar flex-1">
                <div className="relative h-64 bg-slate-950">
                  <img 
                    src={selectedLeader.image || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400"} 
                    alt={selectedLeader.name} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/10 to-transparent" />
                  
                  {/* Badge inside Details */}
                  <div className="absolute bottom-4 left-4 bg-slate-900 border border-amber-500/30 px-3 py-1 rounded-lg flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    <span className="font-mono text-amber-400 font-bold text-[10px] uppercase tracking-wide">
                      {selectedLeader.role}
                    </span>
                  </div>
                </div>

                {/* Main Text */}
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="font-sans font-extrabold text-xl text-white">
                      {selectedLeader.name}
                    </h3>
                    <span className="font-sans text-xs text-slate-500">Kachok Ambassadors Chorus Steward Profile</span>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-mono text-[10px] text-slate-400 uppercase tracking-widest font-bold">Steward bio & mission quote</h4>
                    <p className="font-sans text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/40 border border-slate-850 p-4 rounded-xl italic">
                      "{selectedLeader.bio || "This council steward leads the chorus in executing acappella hymns and musical missionary initiatives with faithful service."}"
                    </p>
                  </div>

                  {selectedLeader.phone && (
                    <div className="space-y-3 pt-2">
                      <h4 className="font-mono text-[10px] text-slate-400 uppercase tracking-widest font-bold">Connect with Steward</h4>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <a
                          href={`tel:${getCleanPhone(selectedLeader.phone)}`}
                          className="bg-amber-500 text-slate-950 hover:bg-amber-400 font-sans text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 hover:scale-102 active:scale-98 transition-all"
                        >
                          <Phone className="w-4 h-4 shrink-0" />
                          <span>Place Call</span>
                        </a>
                        <a
                          href={getWhatsAppUrl(selectedLeader.phone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-slate-950 text-emerald-400 hover:bg-slate-850 hover:text-white border border-slate-800 hover:border-emerald-500/30 font-sans text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:scale-102 active:scale-98 transition-all"
                        >
                          <MessageCircle className="w-4 h-4 shrink-0" />
                          <span>WhatsApp Chat</span>
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      onClick={() => handleShareProfile(selectedLeader)}
                      className="w-full bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white border border-indigo-500/20 hover:border-indigo-500 font-sans text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Share2 className="w-4 h-4 shrink-0" />
                      <span>Share Leader Profile link</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer stamp */}
              <div className="bg-slate-950 py-3 px-6 text-center border-t border-slate-850 font-mono text-[9px] text-slate-500 uppercase tracking-widest">
                Sounds Of Togetherness • Since 2021
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </section>
  );
}
