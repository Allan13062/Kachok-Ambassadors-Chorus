import React, { useEffect, useMemo, useState } from "react";
import { Activity } from "../types";
import { Calendar, Check, Link2, MapPin, Pencil, Play, Plus, Search, Trash2, X } from "lucide-react";

interface ActivitiesProps {
  items: Activity[];
  isAdmin: boolean;
  onAdd: () => void;
  onEdit: (activity: Activity) => void;
  onDelete: (id: string) => void;
}

export default function Activities({ items, isAdmin, onAdd, onEdit, onDelete }: ActivitiesProps) {
  const [query, setQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [media, setMedia] = useState<{ url: string; type: "image" | "video"; title: string } | null>(null);

  const safeItems = Array.isArray(items) ? items : [];

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return safeItems;
    return safeItems.filter((act) =>
      [act?.title, act?.description, act?.location, act?.category, act?.date]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [safeItems, query]);

  useEffect(() => {
    if (!media) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMedia(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [media]);

  const copyActivity = async (act: Activity) => {
    const lines = [
      "Kachamba Chorus Ministry",
      "",
      act.title,
      act.date ? `Date: ${act.date}` : "",
      act.location ? `Location: ${act.location}` : "",
      "",
      `${window.location.origin}/#activities`,
    ].filter((l, i, arr) => !(l === "" && arr[i - 1] === ""));
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopiedId(act.id);
      window.setTimeout(() => setCopiedId((c) => (c === act.id ? null : c)), 2000);
    } catch {
      console.warn("Clipboard unavailable");
    }
  };

  const iconBtn =
    "grid h-8 w-8 place-items-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400";

  return (
    <section id="activities" className="relative bg-slate-900 px-5 py-16 md:px-10 md:py-20">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-400">Serve</p>
            <h2 className="mt-2 font-display text-[2rem] font-bold leading-tight tracking-tight text-white md:text-[2.4rem]">
              Ministries
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-white/55">
              Choral practice, music seminars and outreach missions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {safeItems.length > 0 && (
              <label className="relative block w-full md:w-60">
                <span className="sr-only">Search ministries</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" aria-hidden="true" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search ministries"
                  className="h-9 w-full rounded-full border border-white/15 bg-transparent pl-9 pr-4 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-amber-400/70"
                />
              </label>
            )}
            {isAdmin && (
              <button type="button" onClick={onAdd} className="btn-solid fill-accent !px-4 !py-2.5 whitespace-nowrap">
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                Add
              </button>
            )}
          </div>
        </div>

        {/* Empty state */}
        {visible.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/15 px-6 py-14 text-center">
            <p className="text-sm text-white/60">
              {query ? "No ministries match your search." : "Ministries will appear here once they are added."}
            </p>
          </div>
        )}

        {/* Grid */}
        {visible.length > 0 && (
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((act) => {
              const mediaUrl = act?.image || "";
              const isVideo = act?.mediaType === "video" || /\.(mp4|webm|mov)(\?.*)?$/i.test(mediaUrl);
              const title = act.title || "Untitled ministry";

              return (
                <article key={act.id} className="flex flex-col">
                  {mediaUrl ? (
                    <button
                      type="button"
                      onClick={() => setMedia({ url: mediaUrl, type: isVideo ? "video" : "image", title })}
                      className="group relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-slate-800 text-left"
                      aria-label={`Open media for ${title}`}
                    >
                      {isVideo ? (
                        <>
                          <video src={mediaUrl} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                          <span className="absolute inset-0 grid place-items-center bg-slate-950/30">
                            <span className="grid h-10 w-10 place-items-center rounded-full bg-slate-950/70 text-white">
                              <Play className="h-4 w-4" aria-hidden="true" />
                            </span>
                          </span>
                        </>
                      ) : (
                        <img
                          src={mediaUrl}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                        />
                      )}
                    </button>
                  ) : (
                    <div className="grid aspect-[16/10] w-full place-items-center rounded-xl border border-white/10 bg-slate-800/60">
                      <span className="font-display text-2xl font-bold text-white/25">{title.charAt(0).toUpperCase()}</span>
                    </div>
                  )}

                  <div className="mt-4 flex flex-1 flex-col">
                    <p className="text-xs font-semibold text-amber-400">{act.category || "Ministry"}</p>
                    <h3 className="mt-1 font-display text-lg font-semibold leading-snug text-white">{title}</h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-white/55">
                      {act.description || "No description provided."}
                    </p>

                    <div className="mt-3 flex flex-col gap-1 text-xs text-white/45">
                      {act.date && (
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-3 w-3" aria-hidden="true" />
                          {act.date}
                        </span>
                      )}
                      {act.location && (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-3 w-3" aria-hidden="true" />
                          <span className="line-clamp-1">{act.location}</span>
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                      <button
                        type="button"
                        onClick={() => copyActivity(act)}
                        className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold text-white/60 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                      >
                        {copiedId === act.id ? <Check className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" /> : <Link2 className="h-3.5 w-3.5" aria-hidden="true" />}
                        {copiedId === act.id ? "Copied" : "Copy details"}
                      </button>

                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => onEdit(act)} aria-label={`Edit ${title}`} title="Edit" className={iconBtn}>
                            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                          <button type="button" onClick={() => onDelete(act.id)} aria-label={`Delete ${title}`} title="Delete" className={iconBtn}>
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Media viewer */}
      {media && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={media.title}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/95 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setMedia(null);
          }}
        >
          <button
            type="button"
            onClick={() => setMedia(null)}
            aria-label="Close media viewer"
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="max-h-[90vh] max-w-5xl">
            {media.type === "video" ? (
              <video src={media.url} controls autoPlay playsInline className="max-h-[82vh] max-w-full rounded-xl" />
            ) : (
              <img src={media.url} alt={media.title} className="max-h-[82vh] max-w-full rounded-xl object-contain" />
            )}
          </div>
        </div>
      )}
    </section>
  );
}
