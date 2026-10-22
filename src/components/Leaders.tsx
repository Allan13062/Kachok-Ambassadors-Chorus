import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Facebook, Linkedin, Link2, Pencil, Phone, Plus, Search, Trash2, X } from "lucide-react";
import type { Leader } from "../types";

interface LeadersProps {
  items: Leader[];
  isAdmin: boolean;
  onAdd: () => void;
  onEdit: (leader: Leader) => void;
  onDelete: (id: string) => void;
}

function WhatsAppIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.884 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.48-8.413z" />
    </svg>
  );
}

// Link builders — accept full URLs, handles, or phone numbers
function getWhatsAppLink(whatsapp?: string, phone?: string): string | null {
  const val = (whatsapp && whatsapp.trim()) || (phone && phone.trim());
  if (!val) return null;
  if (/^https?:\/\//i.test(val)) return val;
  let digits = val.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("0")) digits = `254${digits.slice(1)}`;
  else if (digits.length === 9) digits = `254${digits}`;
  return `https://wa.me/${digits}`;
}

function getFacebookLink(facebook?: string): string | null {
  if (!facebook || !facebook.trim()) return null;
  const val = facebook.trim();
  if (/^https?:\/\//i.test(val)) return val;
  return `https://facebook.com/${val.replace(/^@/, "")}`;
}

function getLinkedInLink(linkedin?: string): string | null {
  if (!linkedin || !linkedin.trim()) return null;
  const val = linkedin.trim();
  if (/^https?:\/\//i.test(val)) return val;
  const clean = val.replace(/^@/, "");
  if (clean.startsWith("in/") || clean.startsWith("company/")) return `https://linkedin.com/${clean}`;
  return `https://linkedin.com/in/${clean}`;
}

export default function Leaders({ items, isAdmin, onAdd, onEdit, onDelete }: LeadersProps) {
  const [selected, setSelected] = useState<Leader | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const list = Array.isArray(items) ? items : [];

  // Keep the open profile in sync with the list
  useEffect(() => {
    if (!selected) return;
    const current = list.find((l) => l.id === selected.id);
    if (current !== selected) setSelected(current || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  // Open a profile from a shared link: ?leader=<id>
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("leader");
    if (id && list.length) {
      const match = list.find((l) => l.id === id);
      if (match) setSelected(match);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const closeProfile = () => {
    setSelected(null);
    const params = new URLSearchParams(window.location.search);
    if (params.has("leader")) {
      params.delete("leader");
      const q = params.toString();
      window.history.replaceState({}, "", `${window.location.pathname}${q ? `?${q}` : ""}${window.location.hash}`);
    }
  };

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeProfile();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const flash = (id: string) => {
    setCopiedId(id);
    window.setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 2000);
  };

  const shareLeader = async (leader: Leader, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const shareUrl = `${window.location.origin}${window.location.pathname}?leader=${encodeURIComponent(leader.id)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: leader.name, text: `${leader.name} — ${leader.role} at Kachamba Chorus`, url: shareUrl });
        return;
      }
    } catch {
      /* user cancelled native share — fall through to copy */
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      flash(leader.id);
    } catch {
      console.warn("Clipboard unavailable");
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((l) => l.name.toLowerCase().includes(q) || (l.role || "").toLowerCase().includes(q));
  }, [list, query]);

  const iconLink =
    "grid h-8 w-8 place-items-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400";

  return (
    <section id="leadership" className="relative bg-slate-950 px-5 py-16 md:px-10 md:py-20">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-400">Leadership</p>
            <h2 className="mt-2 font-display text-[2rem] font-bold leading-tight tracking-tight text-white md:text-[2.4rem]">
              Our leaders
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-white/55">
              The stewards who guide our rehearsals, fellowship and outreach.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {list.length > 4 && (
              <label className="relative block w-full md:w-56">
                <span className="sr-only">Filter leaders</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" aria-hidden="true" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filter by name or role"
                  className="h-9 w-full rounded-full border border-white/15 bg-transparent pl-9 pr-4 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-amber-400/70"
                />
              </label>
            )}
            {isAdmin && (
              <button type="button" onClick={onAdd} className="btn-solid fill-accent !px-4 !py-2.5 whitespace-nowrap">
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                Add leader
              </button>
            )}
          </div>
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/15 px-6 py-14 text-center">
            <p className="text-sm text-white/60">
              {query ? "No leaders match your filter." : "Leader profiles will appear here once they are added."}
            </p>
          </div>
        )}

        {/* Grid */}
        {filtered.length > 0 && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4 md:gap-x-6">
            {filtered.map((leader) => {
              const waUrl = getWhatsAppLink(leader.whatsapp, leader.phone);
              const fbUrl = getFacebookLink(leader.facebook);
              const liUrl = getLinkedInLink(leader.linkedin);

              return (
                <article key={leader.id} className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => setSelected(leader)}
                    className="group relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-slate-800 text-left"
                    aria-label={`View profile of ${leader.name}`}
                  >
                    {leader.image ? (
                      <img
                        src={leader.image}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <span className="grid h-full w-full place-items-center font-display text-4xl font-bold text-white/25">
                        {leader.name?.trim()?.charAt(0)?.toUpperCase() || "K"}
                      </span>
                    )}
                  </button>

                  <div className="mt-3 min-w-0">
                    <h3 className="truncate font-display text-base font-semibold text-white" title={leader.name}>
                      {leader.name}
                    </h3>
                    <p className="truncate text-xs text-amber-400">{leader.role || "Choir leadership"}</p>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-0.5">
                      {waUrl && (
                        <a href={waUrl} target="_blank" rel="noopener noreferrer" aria-label={`Message ${leader.name} on WhatsApp`} title="WhatsApp" className={iconLink}>
                          <WhatsAppIcon className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {fbUrl && (
                        <a href={fbUrl} target="_blank" rel="noopener noreferrer" aria-label={`${leader.name} on Facebook`} title="Facebook" className={iconLink}>
                          <Facebook className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>
                      )}
                      {liUrl && (
                        <a href={liUrl} target="_blank" rel="noopener noreferrer" aria-label={`${leader.name} on LinkedIn`} title="LinkedIn" className={iconLink}>
                          <Linkedin className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>
                      )}
                      {leader.phone && !waUrl && (
                        <a href={`tel:${leader.phone}`} aria-label={`Call ${leader.name}`} title="Call" className={iconLink}>
                          <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => shareLeader(leader, e)}
                      aria-label={`Share ${leader.name}'s profile`}
                      title={copiedId === leader.id ? "Link copied" : "Share"}
                      className={iconLink}
                    >
                      {copiedId === leader.id ? <Check className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" /> : <Link2 className="h-3.5 w-3.5" aria-hidden="true" />}
                    </button>
                  </div>

                  {isAdmin && (
                    <div className="mt-2 flex items-center gap-1 border-t border-white/10 pt-2">
                      <button
                        type="button"
                        onClick={() => onEdit(leader)}
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs text-white/60 transition hover:bg-white/10 hover:text-white"
                      >
                        <Pencil className="h-3 w-3" aria-hidden="true" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Remove ${leader.name} from leadership?`)) onDelete(leader.id);
                        }}
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs text-white/60 transition hover:bg-white/10 hover:text-white"
                      >
                        <Trash2 className="h-3 w-3" aria-hidden="true" /> Delete
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Profile dialog */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4"
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
              className="relative w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
            >
              <button
                type="button"
                onClick={closeProfile}
                aria-label="Close profile"
                className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>

              <div className="flex items-start gap-4">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-800">
                  {selected.image ? (
                    <img src={selected.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="grid h-full w-full place-items-center font-display text-2xl font-bold text-white/30">
                      {selected.name?.charAt(0) || "K"}
                    </span>
                  )}
                </div>
                <div className="min-w-0 pr-8">
                  <p className="text-xs font-semibold text-amber-400">{selected.role || "Choir leadership"}</p>
                  <h3 id="leader-dialog-name" className="mt-1 font-display text-xl font-bold leading-tight text-white">
                    {selected.name}
                  </h3>
                  <p className="mt-1 text-xs text-white/45">Kachamba Chorus</p>
                </div>
              </div>

              <div className="mt-5 border-t border-white/10 pt-4">
                <p className="whitespace-pre-line text-sm leading-relaxed text-white/75">
                  {selected.bio || "Serving the choir and its outreach through sacred music, faith and youth mentorship."}
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-2 border-t border-white/10 pt-4">
                {getWhatsAppLink(selected.whatsapp, selected.phone) && (
                  <a
                    href={getWhatsAppLink(selected.whatsapp, selected.phone)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/85 transition hover:border-white/40 hover:text-white"
                  >
                    <WhatsAppIcon className="h-3.5 w-3.5" /> WhatsApp
                  </a>
                )}
                {getFacebookLink(selected.facebook) && (
                  <a
                    href={getFacebookLink(selected.facebook)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/85 transition hover:border-white/40 hover:text-white"
                  >
                    <Facebook className="h-3.5 w-3.5" aria-hidden="true" /> Facebook
                  </a>
                )}
                {getLinkedInLink(selected.linkedin) && (
                  <a
                    href={getLinkedInLink(selected.linkedin)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/85 transition hover:border-white/40 hover:text-white"
                  >
                    <Linkedin className="h-3.5 w-3.5" aria-hidden="true" /> LinkedIn
                  </a>
                )}
                {selected.phone && (
                  <a
                    href={`tel:${selected.phone}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/85 transition hover:border-white/40 hover:text-white"
                  >
                    <Phone className="h-3.5 w-3.5" aria-hidden="true" /> {selected.phone}
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => shareLeader(selected)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/85 transition hover:border-white/40 hover:text-white"
                >
                  {copiedId === selected.id ? <Check className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" /> : <Link2 className="h-3.5 w-3.5" aria-hidden="true" />}
                  {copiedId === selected.id ? "Link copied" : "Share"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
