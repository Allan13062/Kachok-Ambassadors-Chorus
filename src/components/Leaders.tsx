import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Award, X, Phone, MessageCircle, Share2, Check, Plus, Pencil, Trash2, ArrowUpRight, Users } from "lucide-react";
import type { Leader } from "../types";

interface LeadersProps {
  items: Leader[];
  isAdmin: boolean;
  onAdd: () => void;
  onEdit: (leader: Leader) => void;
  onDelete: (id: string) => void;
}

const phoneDigits = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) return `254${digits.slice(1)}`;
  if (digits.length === 9) return `254${digits}`;
  return digits;
};

export default function Leaders({ items, isAdmin, onAdd, onEdit, onDelete }: LeadersProps) {
  const [selected, setSelected] = useState<Leader | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!selected) return;
    const current = items.find((leader) => leader.id === selected.id);
    setSelected(current || null);
  }, [items]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("leader");
    if (id && items.length) {
      const match = items.find((leader) => leader.id === id);
      if (match) setSelected(match);
    }
  }, [items]);

  useEffect(() => {
    if (!selected) return;
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selected]);

  const closeProfile = () => {
    setSelected(null);
    const params = new URLSearchParams(window.location.search);
    if (params.has("leader")) {
      params.delete("leader");
      const query = params.toString();
      window.history.replaceState({}, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
    }
  };

  const shareLeader = async (leader: Leader) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?leader=${encodeURIComponent(leader.id)}`;
    try {
      if (navigator.share) await navigator.share({ title: leader.name, text: `${leader.name} — ${leader.role}`, url: shareUrl });
      else {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(leader.id);
        window.setTimeout(() => setCopied(null), 1800);
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(leader.id);
        window.setTimeout(() => setCopied(null), 1800);
      } catch { /* Clipboard access can be unavailable in insecure contexts. */ }
    }
  };

  return (
    <section id="leadership" className="kc-section relative overflow-hidden px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
      <div className="kc-section-glow kc-section-glow--gold" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-5 sm:mb-14 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="kc-eyebrow mb-3"><span /> Servant leadership</p>
            <h2 className="kc-heading">The people <em>behind the voices.</em></h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">Meet the stewards who help guide our music, fellowship, and mission.</p>
          </div>
          {isAdmin && <button onClick={onAdd} className="kc-button kc-button--gold self-start"><Plus size={17} /> Add leader</button>}
        </div>

        {items.length === 0 ? (
          <div className="kc-empty-state"><span className="kc-empty-icon"><Users size={26} /></span><h3>Our leadership team</h3><p>Profiles will appear here as they are added.</p>{isAdmin && <button className="kc-button kc-button--gold mt-5" onClick={onAdd}><Plus size={16} /> Add first leader</button>}</div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((leader, index) => (
              <motion.article key={leader.id} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.35, delay: Math.min(index * 0.045, 0.22) }} className="kc-leader-card group">
                <button type="button" className="kc-leader-card__main text-left" onClick={() => setSelected(leader)} aria-label={`View profile of ${leader.name}`}>
                  <div className="kc-leader-card__portrait">
                    {leader.image ? <img src={leader.image} alt={leader.name} loading="lazy" /> : <div className="kc-leader-card__placeholder"><span>{leader.name?.trim()?.charAt(0)?.toUpperCase() || "K"}</span></div>}
                    <span className="kc-leader-card__portrait-shade" />
                    <span className="kc-leader-card__role">{leader.role || "Choir leadership"}</span>
                  </div>
                  <div className="p-5">
                    <h3 className="kc-leader-card__name">{leader.name}</h3>
                    <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-400">{leader.bio || "Serving through music, fellowship, and faith."}</p>
                    <span className="kc-text-link mt-4">View profile <ArrowUpRight size={14} /></span>
                  </div>
                </button>
                <div className="kc-leader-card__footer">
                  <button type="button" onClick={() => shareLeader(leader)} className="kc-icon-button" aria-label={`Share ${leader.name}`} title="Share profile">{copied === leader.id ? <Check size={16} /> : <Share2 size={16} />}</button>
                  {leader.phone && <a className="kc-icon-button" href={`https://wa.me/${phoneDigits(leader.phone)}`} target="_blank" rel="noreferrer" aria-label={`Message ${leader.name} on WhatsApp`} title="WhatsApp"><MessageCircle size={16} /></a>}
                  {isAdmin && <><button type="button" className="kc-icon-button" onClick={() => onEdit(leader)} aria-label={`Edit ${leader.name}`} title="Edit profile"><Pencil size={15} /></button><button type="button" className="kc-icon-button kc-icon-button--danger" onClick={() => { if (window.confirm(`Delete ${leader.name}'s profile?`)) onDelete(leader.id); }} aria-label={`Delete ${leader.name}`} title="Delete profile"><Trash2 size={15} /></button></>}
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selected && <motion.div className="kc-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) closeProfile(); }}>
          <motion.section role="dialog" aria-modal="true" aria-labelledby="kc-leader-dialog-title" className="kc-profile-modal" initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.98 }}>
            <button type="button" className="kc-modal-close" onClick={closeProfile} aria-label="Close profile"><X size={19} /></button>
            <div className="kc-profile-modal__image">{selected.image ? <img src={selected.image} alt={selected.name} /> : <div className="kc-leader-card__placeholder"><span>{selected.name?.charAt(0) || "K"}</span></div>}</div>
            <div className="p-6 sm:p-8"><p className="kc-eyebrow mb-3"><Award size={14} /> Leadership profile</p><h3 id="kc-leader-dialog-title" className="kc-heading kc-heading--modal">{selected.name}</h3><p className="mt-2 font-semibold text-amber-300">{selected.role}</p><p className="mt-5 whitespace-pre-line text-sm leading-7 text-slate-300">{selected.bio || "Committed to serving the choir and its mission through faith, music, and fellowship."}</p>
              <div className="mt-7 flex flex-wrap gap-3">{selected.phone && <a className="kc-button kc-button--gold" href={`https://wa.me/${phoneDigits(selected.phone)}`} target="_blank" rel="noreferrer"><MessageCircle size={16} /> Contact leader</a>}<button className="kc-button kc-button--outline" onClick={() => shareLeader(selected)}>{copied === selected.id ? <Check size={16} /> : <Share2 size={16} />}{copied === selected.id ? "Copied" : "Share profile"}</button>{selected.phone && <a className="kc-button kc-button--outline" href={`tel:${selected.phone}`}><Phone size={16} /> Call</a>}</div>
            </div>
          </motion.section>
        </motion.div>}
      </AnimatePresence>
    </section>
  );
}
