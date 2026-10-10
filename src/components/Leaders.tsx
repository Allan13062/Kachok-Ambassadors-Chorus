import React, { useEffect, useState, useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Facebook,
  Linkedin,
  Phone,
  Share2,
  Check,
  Plus,
  Pencil,
  Trash2,
  X,
  ArrowUpRight,
  Users,
  Award,
  Search
} from "lucide-react";
import type { Leader } from "../types";

interface LeadersProps {
  items: Leader[];
  isAdmin: boolean;
  onAdd: () => void;
  onEdit: (leader: Leader) => void;
  onDelete: (id: string) => void;
}

// Crisp, standardized WhatsApp vector icon
function WhatsAppIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.884 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.48-8.413z" />
    </svg>
  );
}

// Resilient link builders
function getWhatsAppLink(whatsapp?: string, phone?: string): string | null {
  const val = (whatsapp && whatsapp.trim()) || (phone && phone.trim());
  if (!val) return null;
  if (val.startsWith("http://") || val.startsWith("https://")) return val;
  let digits = val.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("0")) digits = `254${digits.slice(1)}`;
  else if (digits.length === 9) digits = `254${digits}`;
  return `https://wa.me/${digits}`;
}

function getFacebookLink(facebook?: string): string | null {
  if (!facebook || !facebook.trim()) return null;
  const val = facebook.trim();
  if (val.startsWith("http://") || val.startsWith("https://")) return val;
  const clean = val.replace(/^@/, "");
  return `https://facebook.com/${clean}`;
}

function getLinkedInLink(linkedin?: string): string | null {
  if (!linkedin || !linkedin.trim()) return null;
  const val = linkedin.trim();
  if (val.startsWith("http://") || val.startsWith("https://")) return val;
  const clean = val.replace(/^@/, "");
  if (clean.startsWith("in/") || clean.startsWith("company/")) {
    return `https://linkedin.com/${clean}`;
  }
  return `https://linkedin.com/in/${clean}`;
}

export default function Leaders({ items, isAdmin, onAdd, onEdit, onDelete }: LeadersProps) {
  const [selected, setSelected] = useState<Leader | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Sync selected leader if list changes
  useEffect(() => {
    if (!selected) return;
    const current = items.find((l) => l.id === selected.id);
    setSelected(current || null);
  }, [items]);

  // Deep-link check from URL parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("leader");
    if (id && items.length) {
      const match = items.find((l) => l.id === id);
      if (match) setSelected(match);
    }
  }, [items]);

  // Escape key handler
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeProfile();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  const closeProfile = () => {
    setSelected(null);
    const params = new URLSearchParams(window.location.search);
    if (params.has("leader")) {
      params.delete("leader");
      const q = params.toString();
      window.history.replaceState({}, "", `${window.location.pathname}${q ? `?${q}` : ""}${window.location.hash}`);
    }
  };

  const shareLeader = async (leader: Leader, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const shareUrl = `${window.location.origin}${window.location.pathname}?leader=${encodeURIComponent(leader.id)}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: leader.name,
          text: `${leader.name} — ${leader.role} at Kachamba Chorus`,
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setCopiedId(leader.id);
        window.setTimeout(() => setCopiedId(null), 2000);
      }
    } catch {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopiedId(leader.id);
        window.setTimeout(() => setCopiedId(null), 2000);
      } catch (_) {}
    }
  };

  // Filter leaders if search is used
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (l) => l.name.toLowerCase().includes(q) || (l.role && l.role.toLowerCase().includes(q))
    );
  }, [items, searchQuery]);

  return (
    <section id="leadership" className="relative overflow-hidden bg-slate-950 px-5 py-20 sm:px-8 lg:px-12 lg:py-28 text-white">
      {/* Quiet background ambiance */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.04)_0%,transparent_60%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl">
        {/* Editorial Section Header */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-b border-white/5 pb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="h-px w-5 bg-amber-400/60" />
              <span className="text-[11px] font-sans font-medium uppercase tracking-[0.2em] text-amber-400/90">
                Ministry Stewards
              </span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-white">
              The People <span className="italic text-amber-200/90">Behind the Voices</span>
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-400 font-light">
              Stewarding our acappella music ministry, rehearsals, and Christian fellowship across East Africa.
            </p>
          </div>

          {/* Right Controls: Search & Admin CTA */}
          <div className="flex items-center gap-3 self-start md:self-end">
            {items.length > 4 && (
              <div className="relative w-44 sm:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter stewards..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-900/80 border border-white/10 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-400/60 transition-colors"
                />
              </div>
            )}
            {isAdmin && (
              <button
                type="button"
                onClick={onAdd}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-all shadow-sm shadow-amber-500/20 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Leader</span>
              </button>
            )}
          </div>
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-12 text-center max-w-md mx-auto">
            <div className="mx-auto w-12 h-12 rounded-xl bg-slate-800/80 border border-white/5 flex items-center justify-center text-amber-400/80 mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-medium text-white">
              {searchQuery ? "No matching stewards" : "Leadership Team"}
            </h3>
            <p className="mt-2 text-xs text-slate-400 font-light leading-relaxed">
              {searchQuery ? "Try clearing your search query to see all choir leaders." : "Leader profiles will appear here once added by the choir administration."}
            </p>
            {isAdmin && !searchQuery && (
              <button
                type="button"
                onClick={onAdd}
                className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add First Leader
              </button>
            )}
          </div>
        ) : (
          /* Professional, Minimalistic, Compact Profile Cards Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {filteredItems.map((leader, index) => {
              const waUrl = getWhatsAppLink(leader.whatsapp, leader.phone);
              const fbUrl = getFacebookLink(leader.facebook);
              const liUrl = getLinkedInLink(leader.linkedin);
              const hasSocials = Boolean(waUrl || fbUrl || liUrl || leader.phone);

              return (
                <motion.article
                  key={leader.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.2) }}
                  className="group relative flex flex-col justify-between rounded-xl border border-white/[0.08] hover:border-amber-400/30 bg-slate-900/50 hover:bg-slate-900/90 transition-all duration-300 overflow-hidden"
                >
                  {/* Top Image & Role */}
                  <div className="p-4 pb-0">
                    {/* Compact Portrait Frame (Aspect 4:3, strictly bounded height) */}
                    <div
                      onClick={() => setSelected(leader)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelected(leader);
                        }
                      }}
                      className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-slate-800/80 border border-white/5 cursor-pointer"
                      aria-label={`View full profile of ${leader.name}`}
                    >
                      {leader.image ? (
                        <img
                          src={leader.image}
                          alt={leader.name}
                          loading="lazy"
                          className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-slate-850 text-amber-300/80 font-serif text-3xl font-light">
                          {leader.name?.trim()?.charAt(0)?.toUpperCase() || "K"}
                        </div>
                      )}
                      {/* Quiet scrim gradient at base of portrait */}
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-slate-900/80 to-transparent" />
                    </div>

                    {/* Metadata Header */}
                    <div className="mt-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-sans font-medium uppercase tracking-wider text-amber-400/90 truncate">
                          {leader.role || "Choir Leadership"}
                        </span>
                        {/* Quick View Trigger */}
                        <button
                          type="button"
                          onClick={() => setSelected(leader)}
                          className="text-slate-500 hover:text-amber-300 transition-colors p-0.5"
                          title="View bio"
                          aria-label={`Read ${leader.name}'s bio`}
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h3
                        onClick={() => setSelected(leader)}
                        className="font-serif text-base font-semibold text-white tracking-tight leading-snug hover:text-amber-300 transition-colors cursor-pointer mt-1 truncate"
                        title={leader.name}
                      >
                        {leader.name}
                      </h3>

                      {leader.bio && (
                        <p className="mt-1.5 text-xs text-slate-400 font-light line-clamp-2 leading-relaxed min-h-[2rem]">
                          {leader.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bottom: Social Links Bar & Admin Actions */}
                  <div className="p-4 pt-3 mt-2 border-t border-white/[0.06] bg-slate-950/30">
                    <div className="flex items-center justify-between gap-1.5">
                      {/* Social Media Links Icons */}
                      <div className="flex items-center gap-1.5">
                        {/* Facebook Icon */}
                        {fbUrl && (
                          <a
                            href={fbUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${leader.name} on Facebook`}
                            title="Facebook"
                            className="w-7 h-7 rounded-md bg-slate-800/80 hover:bg-[#1877F2]/20 text-slate-400 hover:text-[#1877F2] border border-white/5 hover:border-[#1877F2]/40 flex items-center justify-center transition-all"
                          >
                            <Facebook className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {/* WhatsApp Icon */}
                        {waUrl && (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Message ${leader.name} on WhatsApp`}
                            title="WhatsApp"
                            className="w-7 h-7 rounded-md bg-slate-800/80 hover:bg-[#25D366]/20 text-slate-400 hover:text-[#25D366] border border-white/5 hover:border-[#25D366]/40 flex items-center justify-center transition-all"
                          >
                            <WhatsAppIcon className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {/* LinkedIn Icon */}
                        {liUrl && (
                          <a
                            href={liUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${leader.name} on LinkedIn`}
                            title="LinkedIn"
                            className="w-7 h-7 rounded-md bg-slate-800/80 hover:bg-[#0A66C2]/20 text-slate-400 hover:text-[#0A66C2] border border-white/5 hover:border-[#0A66C2]/40 flex items-center justify-center transition-all"
                          >
                            <Linkedin className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {/* Phone call icon fallback */}
                        {leader.phone && !waUrl && (
                          <a
                            href={`tel:${leader.phone}`}
                            aria-label={`Call ${leader.name}`}
                            title="Call Leader"
                            className="w-7 h-7 rounded-md bg-slate-800/80 hover:bg-amber-400/20 text-slate-400 hover:text-amber-300 border border-white/5 hover:border-amber-400/40 flex items-center justify-center transition-all"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {!hasSocials && (
                          <span className="text-[11px] text-slate-500 font-light italic">
                            Ministry Council
                          </span>
                        )}
                      </div>

                      {/* Right: Share icon button */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => shareLeader(leader, e)}
                          aria-label={`Share ${leader.name}'s profile`}
                          title={copiedId === leader.id ? "Link copied!" : "Share profile"}
                          className={`w-7 h-7 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                            copiedId === leader.id
                              ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                              : "bg-slate-800/60 border-white/5 text-slate-400 hover:text-white hover:bg-slate-800"
                          }`}
                        >
                          {copiedId === leader.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Share2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Admin Actions Bar (Discreet, compact) */}
                    {isAdmin && (
                      <div className="mt-2.5 pt-2 border-t border-white/[0.04] flex items-center justify-between text-[11px]">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">
                          Admin
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onEdit(leader)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            title="Edit leader profile"
                          >
                            <Pencil className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Remove ${leader.name} from leadership?`)) {
                                onDelete(leader.id);
                              }
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-rose-100 transition-colors cursor-pointer"
                            title="Delete leader profile"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </div>

      {/* Minimal Profile Detail Dialog */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeProfile();
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="leader-dialog-name"
              className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 sm:p-7 shadow-2xl overflow-hidden"
              initial={{ opacity: 0, scale: 0.95, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={closeProfile}
                aria-label="Close profile"
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col sm:flex-row gap-5 items-start">
                {/* Portrait */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-xl overflow-hidden bg-slate-800 border border-white/10">
                  {selected.image ? (
                    <img src={selected.image} alt={selected.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-amber-300 font-serif text-3xl">
                      {selected.name?.charAt(0) || "K"}
                    </div>
                  )}
                </div>

                {/* Profile Header */}
                <div className="flex-1 min-w-0 pr-6">
                  <span className="text-[10px] font-sans font-medium uppercase tracking-[0.2em] text-amber-400">
                    {selected.role}
                  </span>
                  <h3 id="leader-dialog-name" className="font-serif text-2xl font-bold text-white tracking-tight mt-1">
                    {selected.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                    <Award className="w-3.5 h-3.5 text-amber-400/80" />
                    <span>Kachamba Chorus Ministry</span>
                  </div>
                </div>
              </div>

              {/* Bio Quote */}
              <div className="mt-5 border-t border-white/5 pt-4">
                <p className="text-xs uppercase font-sans tracking-wider text-slate-400 mb-2">Ministry Bio & Service</p>
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300 font-light">
                  {selected.bio ||
                    "Committed to serving the Kachok Ambassadors choir and its gospel outreach mission through sacred music, faith, and dedicated youth mentorship."}
                </p>
              </div>

              {/* Social Channels & Contact Action Grid */}
              <div className="mt-6 border-t border-white/5 pt-4">
                <p className="text-xs uppercase font-sans tracking-wider text-slate-400 mb-3">Connect Directly</p>
                <div className="flex flex-wrap gap-2.5">
                  {getWhatsAppLink(selected.whatsapp, selected.phone) && (
                    <a
                      href={getWhatsAppLink(selected.whatsapp, selected.phone)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] border border-[#25D366]/30 text-xs font-medium transition-colors"
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  )}

                  {getFacebookLink(selected.facebook) && (
                    <a
                      href={getFacebookLink(selected.facebook)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1877F2]/15 hover:bg-[#1877F2]/25 text-[#1877F2] border border-[#1877F2]/30 text-xs font-medium transition-colors"
                    >
                      <Facebook className="w-3.5 h-3.5" />
                      <span>Facebook</span>
                    </a>
                  )}

                  {getLinkedInLink(selected.linkedin) && (
                    <a
                      href={getLinkedInLink(selected.linkedin)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0A66C2]/15 hover:bg-[#0A66C2]/25 text-[#0A66C2] border border-[#0A66C2]/30 text-xs font-medium transition-colors"
                    >
                      <Linkedin className="w-3.5 h-3.5" />
                      <span>LinkedIn</span>
                    </a>
                  )}

                  {selected.phone && (
                    <a
                      href={`tel:${selected.phone}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400/15 hover:bg-amber-400/25 text-amber-300 border border-amber-400/30 text-xs font-medium transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{selected.phone}</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => shareLeader(selected)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer border border-white/5"
                  >
                    {copiedId === selected.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                    <span>{copiedId === selected.id ? "Link Copied" : "Share"}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
