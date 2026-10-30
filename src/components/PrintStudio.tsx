import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowDown, ArrowUp, Download, FileText, Printer, RefreshCw, X, AlertCircle } from "lucide-react";
import {
  DEFAULT_PRINT_OPTIONS,
  FONT_THEMES,
  GROUP_LOGO_SOURCES,
  NAVY,
  ORANGE,
  SDA_LOGO_SOURCES,
  cellText,
  dateParts,
  generateSchedulePdf,
  parseLocalDate,
  visibleColumns,
  type FontTheme,
  type HeaderStyle,
  type LogoLayout,
  type PrintItem,
  type PrintOptions,
} from "../lib/schedulePrint";

interface PrintStudioProps {
  isOpen: boolean;
  items: PrintItem[];
  onClose: () => void;
}

const PAPER_W = 794; // A4 at 96 dpi
const STORAGE_KEY = "kachamba_print_studio_v2";

type Row = { item: PrintItem; include: boolean };

const byDate = (a: PrintItem, b: PrintItem) => parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime();

function loadOptions(): PrintOptions {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_PRINT_OPTIONS, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return DEFAULT_PRINT_OPTIONS;
}

/** Shows the first source that loads; renders nothing (not even the wrapper) if none do. */
function LogoImg({ sources, className, alt, wrapClass }: { sources: string[]; className?: string; alt: string; wrapClass?: string }) {
  const [i, setI] = useState(0);
  if (i >= sources.length) return null;
  const img = <img src={sources[i]} alt={alt} className={className} onError={() => setI((n) => n + 1)} />;
  return wrapClass ? <span className={wrapClass}>{img}</span> : img;
}

function PaperSheet({ rows, o }: { rows: Row[]; o: PrintOptions }) {
  const theme = FONT_THEMES[o.fontTheme];
  const cols = visibleColumns(o);
  const navy = o.headerStyle === "navy";
  const items = rows.filter((r) => r.include).map((r) => r.item);

  const groupLogo = o.showGroupLogo ? <LogoImg sources={GROUP_LOGO_SOURCES} alt="Kachamba Chorus logo" className="kc-logo-group" /> : null;
  const sdaLogo = o.showSdaLogo ? (
    <LogoImg sources={SDA_LOGO_SOURCES} alt="Seventh-day Adventist Church logo" className="kc-logo-sda" wrapClass={navy ? "kc-sda-badge" : undefined} />
  ) : null;

  const titleBlock = (
    <div style={{ textAlign: o.logoLayout === "left" ? "left" : "center", flex: 1, minWidth: 0 }}>
      <h1 style={{ fontFamily: theme.titleCss, fontWeight: 700, fontSize: theme.titleSize * 1.45, lineHeight: 1.12, letterSpacing: "0.02em", margin: 0, textTransform: "uppercase" }}>
        {o.title || "Itinerary"}
      </h1>
      {o.subtitle && <p style={{ fontFamily: theme.bodyCss, fontSize: 12.5, margin: "6px 0 0", opacity: 0.85, color: navy ? "#ffd6a0" : "#5b6780" }}>{o.subtitle}</p>}
    </div>
  );

  let lastMonth = "";

  return (
    <div style={{ fontFamily: theme.bodyCss, color: NAVY, background: "#fff" }}>
      {/* Header */}
      <div
        style={{
          background: navy ? NAVY : "#fff",
          color: navy ? "#fff" : NAVY,
          padding: o.logoLayout === "center" ? "26px 14mm 22px" : "24px 14mm",
          borderBottom: navy ? `5px solid ${ORANGE}` : `2px solid ${NAVY}`,
          borderTop: navy ? "none" : `8px solid ${ORANGE}`,
        }}
      >
        {o.logoLayout === "split" && (
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div className="kc-logo-slot">{groupLogo}</div>
            {titleBlock}
            <div className="kc-logo-slot" style={{ justifyContent: "flex-end" }}>{sdaLogo}</div>
          </div>
        )}
        {o.logoLayout === "left" && (
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {groupLogo}
              {sdaLogo}
            </div>
            {titleBlock}
          </div>
        )}
        {o.logoLayout === "center" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
              {groupLogo}
              {sdaLogo}
            </div>
            {titleBlock}
          </div>
        )}
      </div>

      {/* Table */}
      <div style={{ padding: "22px 14mm 10px" }}>
        {items.length === 0 ? (
          <p style={{ textAlign: "center", padding: "60px 0", color: "#8a94a8", fontSize: 13 }}>No events selected. Tick events in the Arrange list to include them.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", fontSize: 11.5 }}>
            <colgroup>
              {cols.map((c) => (
                <col key={c.key} style={{ width: `${c.pct}%` }} />
              ))}
            </colgroup>
            <thead style={{ display: "table-header-group" }}>
              <tr style={{ background: navy ? NAVY : "#e8edf5", color: navy ? "#fff" : NAVY }}>
                {cols.map((c) => (
                  <th key={c.key} style={{ textAlign: "left", padding: "8px 8px", fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700 }}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const parts = dateParts(item.date);
                const showMonth = o.groupByMonth && parts.month !== lastMonth;
                if (showMonth) lastMonth = parts.month;
                return (
                  <React.Fragment key={item.id}>
                    {showMonth && (
                      <tr style={{ breakInside: "avoid" }}>
                        <td colSpan={cols.length} style={{ padding: "14px 2px 5px", borderBottom: `1.5px solid ${ORANGE}`, color: "#b05c00", fontFamily: theme.titleCss, fontWeight: 700, fontSize: 12.5, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          {parts.month}
                        </td>
                      </tr>
                    )}
                    <tr style={{ breakInside: "avoid", background: idx % 2 === 1 ? "#f6f8fc" : "#fff", borderBottom: "1px solid #dae0e9" }}>
                      {cols.map((c) => (
                        <td key={c.key} style={{ padding: "9px 8px", verticalAlign: "top", wordBreak: "break-word", color: c.key === "event" ? NAVY : "#37425a", fontWeight: c.key === "event" ? 700 : 400, fontSize: c.key === "event" ? 12 : 11 }}>
                          {c.key === "date" ? (
                            <>
                              <div style={{ fontWeight: 700, color: NAVY }}>{parts.top}</div>
                              <div style={{ color: "#6a7589", fontSize: 10.5 }}>{parts.year}</div>
                            </>
                          ) : (
                            cellText(item, c.key)
                          )}
                        </td>
                      ))}
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      <div style={{ margin: "6px 14mm 0", padding: "10px 0 22px", borderTop: `2px solid ${ORANGE}`, display: "flex", justifyContent: "space-between", gap: 12, fontSize: 10, color: "#6a7589" }}>
        <span>Kachamba Chorus · Seventh-day Adventist Youth Ministry</span>
        <span>{items.length} {items.length === 1 ? "engagement" : "engagements"} · kachambachorus.online</span>
      </div>
    </div>
  );
}

/* ───────── studio ───────── */

function Toggle({ id, checked, onChange, children }: { id: string; checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer select-none items-center gap-2.5 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-200">
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-3.5 w-3.5 cursor-pointer accent-amber-500" />
      {children}
    </label>
  );
}



export default function PrintStudio({ isOpen, items, onClose }: PrintStudioProps) {
  const [o, setO] = useState<PrintOptions>(() => loadOptions());
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const areaRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [paperH, setPaperH] = useState(1123);

  const set = <K extends keyof PrintOptions>(key: K, value: PrintOptions[K]) => setO((prev) => ({ ...prev, [key]: value }));

  // Start from the chronological list each time the studio opens
  useEffect(() => {
    if (isOpen) {
      setRows([...items].sort(byDate).map((item) => ({ item, include: true })));
      setError("");
    }
  }, [isOpen, items]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(o));
    } catch {
      /* ignore */
    }
  }, [o]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // Fit the A4 sheet to the available width, and keep its height in step with its content
  useLayoutEffect(() => {
    if (!isOpen) return;
    const area = areaRef.current;
    const paper = paperRef.current;
    if (!area || !paper) return;
    const update = () => {
      const avail = area.clientWidth - (window.innerWidth < 640 ? 24 : 64);
      setScale(Math.min(1, Math.max(0.3, avail / PAPER_W)));
      setPaperH(paper.offsetHeight);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(area);
    ro.observe(paper);
    return () => ro.disconnect();
  }, [isOpen]);

  const move = (index: number, dir: -1 | 1) =>
    setRows((prev) => {
      const next = [...prev];
      const j = index + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });

  const sortRows = (mode: "asc" | "desc" | "upcoming") =>
    setRows((prev) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const copy = [...prev];
      if (mode === "asc") return copy.sort((a, b) => byDate(a.item, b.item));
      if (mode === "desc") return copy.sort((a, b) => byDate(b.item, a.item));
      const isUp = (r: Row) => parseLocalDate(r.item.date).getTime() >= today.getTime();
      return [...copy.filter(isUp).sort((a, b) => byDate(a.item, b.item)), ...copy.filter((r) => !isUp(r)).sort((a, b) => byDate(b.item, a.item))];
    });

  const included = useMemo(() => rows.filter((r) => r.include).map((r) => r.item), [rows]);

  const download = async () => {
    setBusy(true);
    setError("");
    try {
      await generateSchedulePdf(included, o);
    } catch (err: any) {
      console.error(err);
      setError("The PDF could not be created. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (!isOpen) return null;

  const chip = (active: boolean) =>
    `rounded-lg border px-2.5 py-2 text-[11px] font-semibold transition cursor-pointer ${
      active ? "border-amber-500 bg-amber-500/15 text-amber-300" : "border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500"
    }`;
  const heading = "mb-2.5 border-b border-slate-800 pb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400";
  const label = "mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500";
  const input = "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-amber-500";

  const studio = (
    <div className="kc-print-portal fixed inset-0 z-[200] flex flex-col bg-slate-950 text-white" role="dialog" aria-modal="true" aria-label="Print preview and arranger studio">
      <style>{`
        .kc-logo-group { height: 76px; width: auto; max-width: 110px; object-fit: contain; display: block; }
        .kc-logo-sda { height: 62px; width: auto; max-width: 110px; object-fit: contain; display: block; }
        .kc-sda-badge { background: #fff; border-radius: 10px; padding: 6px 8px; display: inline-flex; }
        .kc-logo-slot { width: 112px; display: flex; align-items: center; flex-shrink: 0; }
        @page { size: A4; margin: 12mm 0 14mm 0; }
        @page :first { margin-top: 0; }
        @media print {
          body > *:not(.kc-print-portal) { display: none !important; }
          html, body, :root, #root { background: #fff !important; color-scheme: light; }
          .kc-print-portal { position: static !important; display: block !important; height: auto !important; overflow: visible !important; background: #fff !important; }
          .kc-no-print { display: none !important; }
          .kc-paper-area { display: block !important; overflow: visible !important; padding: 0 !important; height: auto !important; background: #fff !important; }
          .kc-scale-box { width: auto !important; height: auto !important; margin: 0 !important; }
          .kc-paper { transform: none !important; width: 210mm !important; min-height: 0 !important; box-shadow: none !important; }
          .kc-paper, .kc-paper * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .kc-paper tr { break-inside: avoid; }
        }
      `}</style>

      {/* Top bar */}
      <div className="kc-no-print flex shrink-0 flex-col gap-3 border-b border-slate-800 bg-slate-900 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-400">
            <FileText className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-white">Print preview &amp; arranger studio</h3>
            <p className="text-[11px] text-slate-400">Check logos, fonts and columns, reorder events, then download or print.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={download} disabled={busy || included.length === 0} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-[11px] font-bold disabled:opacity-50">
            {busy ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            {busy ? "Creating PDF…" : "Download PDF"}
          </button>
          <button type="button" onClick={() => window.print()} disabled={included.length === 0} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 px-4 py-2 text-[11px] font-bold text-slate-100 hover:border-slate-400 disabled:opacity-50">
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
          <button type="button" onClick={onClose} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-[11px] font-semibold text-slate-300 hover:text-white">
            <X className="h-3.5 w-3.5" /> Close
          </button>
        </div>
      </div>
      {error && (
        <p role="alert" className="kc-no-print flex items-center gap-2 border-b border-amber-500/30 bg-amber-500/10 px-6 py-2 text-xs text-amber-300">
          <AlertCircle className="h-3.5 w-3.5" /> {error}
        </p>
      )}

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Controls */}
        <aside className="kc-no-print overflow-x-hidden max-h-[45%] w-full shrink-0 overflow-y-auto border-b border-slate-800 bg-slate-900/70 p-4 lg:max-h-none lg:w-[340px] lg:border-b-0 lg:border-r lg:p-5">
          <section className="mb-6">
            <h4 className={heading}>Document</h4>
            <label className={label} htmlFor="ps-title">Title</label>
            <input id="ps-title" className={`${input} mb-3`} value={o.title} onChange={(e) => set("title", e.target.value)} />
            <label className={label} htmlFor="ps-sub">Subtitle</label>
            <input id="ps-sub" className={input} value={o.subtitle} onChange={(e) => set("subtitle", e.target.value)} />
          </section>

          <section className="mb-6">
            <h4 className={heading}>Logos &amp; header</h4>
            <div className="mb-3 grid gap-2">
              <Toggle id="ps-group" checked={o.showGroupLogo} onChange={(v) => set("showGroupLogo", v)}>Kachamba Chorus logo</Toggle>
              <Toggle id="ps-sda" checked={o.showSdaLogo} onChange={(v) => set("showSdaLogo", v)}>Seventh-day Adventist logo</Toggle>
            </div>
            <span className={label}>Alignment</span>
            <div className="mb-3 grid grid-cols-3 gap-1.5">
              {([["split", "Split"], ["left", "Left"], ["center", "Centred"]] as [LogoLayout, string][]).map(([v, t]) => (
                <button key={v} type="button" onClick={() => set("logoLayout", v)} className={chip(o.logoLayout === v)} aria-pressed={o.logoLayout === v}>{t}</button>
              ))}
            </div>
            <span className={label}>Header style</span>
            <div className="grid grid-cols-2 gap-1.5">
              {([["navy", "Navy band"], ["light", "Light (saves ink)"]] as [HeaderStyle, string][]).map(([v, t]) => (
                <button key={v} type="button" onClick={() => set("headerStyle", v)} className={chip(o.headerStyle === v)} aria-pressed={o.headerStyle === v}>{t}</button>
              ))}
            </div>
          </section>

          <section className="mb-6">
            <h4 className={heading}>Fonts</h4>
            <div className="grid gap-1.5">
              {(Object.keys(FONT_THEMES) as FontTheme[]).map((key) => {
                const t = FONT_THEMES[key];
                const active = o.fontTheme === key;
                return (
                  <button key={key} type="button" onClick={() => set("fontTheme", key)} aria-pressed={active} className={`rounded-lg border p-2.5 text-left transition ${active ? "border-amber-500 bg-amber-500/10" : "border-slate-700 bg-slate-950 hover:border-slate-500"}`}>
                    <span className="block text-sm font-bold text-white" style={{ fontFamily: t.titleCss }}>{t.label}</span>
                    <span className="mt-0.5 block text-[11px] text-slate-400" style={{ fontFamily: t.bodyCss }}>{t.hint}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="mb-6">
            <h4 className={heading}>Columns</h4>
            <div className="grid gap-2">
              <Toggle id="ps-loc" checked={o.showLocation} onChange={(v) => set("showLocation", v)}>Venue</Toggle>
              <Toggle id="ps-host" checked={o.showHost} onChange={(v) => set("showHost", v)}>Host</Toggle>
              <Toggle id="ps-time" checked={o.showTime} onChange={(v) => set("showTime", v)}>Time</Toggle>
              <Toggle id="ps-notes" checked={o.showNotes} onChange={(v) => set("showNotes", v)}>Notes</Toggle>
              <Toggle id="ps-month" checked={o.groupByMonth} onChange={(v) => set("groupByMonth", v)}>Group by month</Toggle>
            </div>
          </section>

          <section>
            <h4 className={heading}>Arrange events ({included.length} of {rows.length})</h4>
            <div className="mb-3 grid grid-cols-3 gap-1.5">
              <button type="button" className={chip(false)} onClick={() => sortRows("asc")}>Oldest first</button>
              <button type="button" className={chip(false)} onClick={() => sortRows("desc")}>Newest first</button>
              <button type="button" className={chip(false)} onClick={() => sortRows("upcoming")}>Upcoming first</button>
            </div>
            <ul className="grid gap-1.5">
              {rows.map((r, i) => (
                <li key={r.item.id} className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/60 px-2.5 py-2">
                  <input
                    type="checkbox"
                    aria-label={`Include ${r.item.event}`}
                    checked={r.include}
                    onChange={(e) => setRows((prev) => prev.map((x, j) => (j === i ? { ...x, include: e.target.checked } : x)))}
                    className="h-3.5 w-3.5 shrink-0 cursor-pointer accent-amber-500"
                  />
                  <span className={`min-w-0 flex-1 ${r.include ? "" : "opacity-40"}`}>
                    <span className="block truncate text-xs font-semibold text-white">{r.item.event}</span>
                    <span className="block text-[10px] text-slate-500">{dateParts(r.item.date).top} {dateParts(r.item.date).year}</span>
                  </span>
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" className="grid h-7 w-7 place-items-center rounded-md border border-slate-700 text-slate-300 hover:border-slate-500 disabled:opacity-30">
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === rows.length - 1} aria-label="Move down" className="grid h-7 w-7 place-items-center rounded-md border border-slate-700 text-slate-300 hover:border-slate-500 disabled:opacity-30">
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
              {rows.length === 0 && <li className="text-xs text-slate-500">No events yet. Add events in the admin panel first.</li>}
            </ul>
          </section>
        </aside>

        {/* Live paper */}
        <div ref={areaRef} className="kc-paper-area min-h-0 flex-1 overflow-auto bg-slate-800/60 px-3 py-6 sm:px-8 sm:py-8">
          <div className="kc-scale-box mx-auto" style={{ width: PAPER_W * scale, height: paperH * scale }}>
            <div ref={paperRef} className="kc-paper shadow-2xl" style={{ background: "#fff", width: PAPER_W, minHeight: 1123, transform: `scale(${scale})`, transformOrigin: "top left" }}>
              <PaperSheet rows={rows} o={o} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(studio, document.body);
}
