import React, { useState, useEffect } from "react";
import { Phone, Shield, Edit, Trash2, Plus, MessageCircle, X, ExternalLink, Award, Share2, Check } from "lucide-react";
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
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedLeader) {
      const match = items.find(i => i.id === selectedLeader.id);
      if (match) setSelectedLeader(match);
      else setSelectedLeader(null);
    }
  }, [items]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const leaderId = params.get("leader");
    if (leaderId && items.length > 0 && !selectedLeader) {
      const found = items.find(i => i.id === leaderId);
      if (found) setSelectedLeader(found);
    }
  }, [items]);

  const getWhatsAppUrl = (phone: string) => {
    const cleaned = phone.replace(/[^\d]/g, "");
    let final = cleaned;
    if (cleaned.startsWith("0")) final = "254" + cleaned.substring(1);
    else if (!cleaned.startsWith("254") && cleaned.length === 9) final = "254" + cleaned;
    return `https://wa.me/${final}`;
  };

  const handleClose = () => {
    setSelectedLeader(null);
    const params = new URLSearchParams(window.location.search);
    if (params.has("leader")) window.history.pushState({}, "", window.location.origin);
  };

  const handleShare = (leader: Leader) => {
    const url = `${window.location.origin}/?leader=${leader.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(leader.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <section id="leadership" className="relative py-28 px-6 md:px-12 bg-slate-950 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(245,158,11,0.04)_0%,transparent_60%)] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-px bg-amber-400/50" />
              <span className="label-caps text-amber-400/70 text-[11px]">Servant Leadership</span>
            </div>
            <h2 className="font-display font-bold text-4xl md:text-6xl text-white tracking-tight leading-none">
              Our <span className="text-white/25 font-light">Leaders</span>
            </h2>
          </div>
          {isAdmin && (
            <button
              onClick={onAdd}
              className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold label-caps text-[11px] px-5 py-2.5 rounded-full transition-all cursor-pointer shadow-lg shadow-amber-500/15 self-start md:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Leader
            </button>
          )}
        </div>

        {/* Empty state */}
        {items.length === 0 && (
          <div className="glass rounded-2xl py-20 text-center">
            <p className="label-caps text-[11px] text-white/25">No leaders added yet</p>
          </div>
        )}

        {/* Grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          {items.map((leader, idx) => {
            const accents = [
              "border-amber-400/50 hover:shadow-amber-500/15",
              "border-cyan-400/50 hover:shadow-cyan-500/15",
              "border-violet-400/50 hover:shadow-violet-500/15",
              "border-emerald-400/50 hover:shadow-emerald-500/15",
              "border-rose-400/50 hover:shadow-rose-500/15",
              "border-sky-400/50 hover:shadow-sky-500/15",
            ];
            const ac = accents[idx % accents.length];
            return (
            <motion.div
              key={leader.id}
              variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45 } } }}
              className={`glass rounded-2xl overflow-hidden group cursor-pointer transition-all duration-300 hover:border-white/20 hover:shadow-lg border-t-2 ${ac}`}
              onClick={() => setSelectedLeader(leader)}
            >
              {/* Avatar */}
              <div className="relative h-44 overflow-hidden bg-gradient-to-br from-amber-500/8 to-transparent">
                {leader.photoUrl ? (
                  <img
                    src={leader.photoUrl}
                    alt={leader.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full glass flex items-center justify-center">
                      <span className="text-2xl text-white/30">{leader.name?.[0] || "L"}</span>
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                {/* Role badge */}
                {leader.role && (
                  <div className="absolute bottom-3 left-3 right-3">
                    <span className="label-caps text-[9px] text-amber-400/80 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full border border-amber-400/15 line-clamp-1">
                      {leader.role}
                    </span>
                  </div>
                )}
              </div>

              {/* Name */}
              <div className="p-4">
                <h3 className="font-display font-semibold text-sm text-white leading-tight mb-1 line-clamp-1">{leader.name}</h3>
                {leader.voicePart && (
                  <p className="label-caps text-[9px] text-white/30">{leader.voicePart}</p>
                )}
              </div>
            </motion.div>
          );})}
        </motion.div>
      </div>

      {/* Leader Detail Modal */}
      <AnimatePresence>
        {selectedLeader && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-2xl flex items-center justify-center p-4"
            onClick={handleClose}
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
              transition={{ duration: 0.25 }}
              className="glass-light rounded-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header image */}
              <div className="relative h-52">
                {selectedLeader.photoUrl ? (
                  <img src={selectedLeader.photoUrl} alt={selectedLeader.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-amber-500/10 to-transparent flex items-center justify-center">
                    <span className="text-5xl text-white/20">{selectedLeader.name?.[0]}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <button
                  onClick={handleClose}
                  className="absolute top-3 right-3 w-8 h-8 glass rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <h3 className="font-display font-bold text-xl text-white mb-1">{selectedLeader.name}</h3>
                  {selectedLeader.role && (
                    <span className="label-caps text-[10px] text-amber-400/70">{selectedLeader.role}</span>
                  )}
                </div>

                {selectedLeader.bio && (
                  <p className="text-white/50 text-sm leading-relaxed mb-5">{selectedLeader.bio}</p>
                )}

                {/* Meta */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {selectedLeader.voicePart && (
                    <div className="glass rounded-xl p-3">
                      <p className="label-caps text-[9px] text-white/30 mb-0.5">Voice Part</p>
                      <p className="text-white/70 text-xs">{selectedLeader.voicePart}</p>
                    </div>
                  )}
                  {selectedLeader.yearsActive && (
                    <div className="glass rounded-xl p-3">
                      <p className="label-caps text-[9px] text-white/30 mb-0.5">Years Active</p>
                      <p className="text-white/70 text-xs">{selectedLeader.yearsActive}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {selectedLeader.phone && (
                    <a
                      href={getWhatsAppUrl(selectedLeader.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/20 text-emerald-400 label-caps text-[10px] py-2.5 rounded-xl transition-all"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      WhatsApp
                    </a>
                  )}
                  <button
                    onClick={() => handleShare(selectedLeader)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border label-caps text-[10px] transition-all ${
                      copiedId === selectedLeader.id
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        : "glass text-white/50 hover:text-white"
                    }`}
                  >
                    {copiedId === selectedLeader.id ? <Check className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
                    {copiedId === selectedLeader.id ? "Copied" : "Share"}
                  </button>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <button onClick={() => { handleClose(); onEdit(selectedLeader); }} className="p-2.5 glass rounded-xl text-white/30 hover:text-amber-400 transition-colors">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { onDelete(selectedLeader.id); handleClose(); }} className="p-2.5 glass rounded-xl text-white/30 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
