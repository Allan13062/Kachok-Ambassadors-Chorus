// Shared settings + PDF generator for the printable schedule.
// The on-screen preview (PrintStudio.tsx) and the downloaded PDF both read the same options,
// so what you arrange in the studio is what you get on paper.

import { jsPDF } from "jspdf";

export type LogoLayout = "split" | "left" | "center";
export type FontTheme = "traditional" | "modern" | "editorial";
export type HeaderStyle = "navy" | "light";

export interface PrintOptions {
  title: string;
  subtitle: string;
  logoLayout: LogoLayout;
  fontTheme: FontTheme;
  headerStyle: HeaderStyle;
  showGroupLogo: boolean;
  showSdaLogo: boolean;
  showLocation: boolean;
  showHost: boolean;
  showTime: boolean;
  showNotes: boolean;
  groupByMonth: boolean;
}

export interface PrintItem {
  id: string;
  event: string;
  date: string;
  time?: string;
  location?: string;
  host?: string;
  notes?: string;
  status?: string;
}

export const DEFAULT_PRINT_OPTIONS: PrintOptions = {
  title: "Kachamba Chorus Itinerary",
  subtitle: "Kachok SDA Church · Kisumu, Kenya",
  logoLayout: "split",
  fontTheme: "traditional",
  headerStyle: "navy",
  showGroupLogo: true,
  showSdaLogo: true,
  showLocation: true,
  showHost: true,
  showTime: true,
  showNotes: true,
  groupByMonth: false,
};

// Brand colours (from the Kachamba logo)
export const NAVY = "#0c1a35";
export const ORANGE = "#f0920e";
const NAVY_RGB: [number, number, number] = [12, 26, 53];
const ORANGE_RGB: [number, number, number] = [240, 146, 14];
const ORANGE_TEXT_RGB: [number, number, number] = [176, 92, 0];
const INK_RGB: [number, number, number] = [12, 26, 53];
const MUTED_RGB: [number, number, number] = [96, 108, 128];
const RULE_RGB: [number, number, number] = [218, 224, 233];
const ZEBRA_RGB: [number, number, number] = [246, 248, 252];

/** Logo sources, tried in order. Drop the official file at /public/logos/sda.png to make it fully offline-safe. */
export const GROUP_LOGO_SOURCES = ["/logos/kachamba.png", "/logo.png"];
export const SDA_LOGO_SOURCES = [
  "/logos/sda.png",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Seventh-day_Adventist_Church_logo_svg.svg/320px-Seventh-day_Adventist_Church_logo_svg.svg.png",
];

export const FONT_THEMES: Record<
  FontTheme,
  { label: string; hint: string; titleCss: string; bodyCss: string; pdfTitle: "times" | "helvetica"; pdfBody: "times" | "helvetica"; titleSize: number }
> = {
  traditional: {
    label: "Classic serif",
    hint: "Times-style titles and text. Formal, church-bulletin feel.",
    titleCss: 'Georgia, "Times New Roman", Times, serif',
    bodyCss: 'Georgia, "Times New Roman", Times, serif',
    pdfTitle: "times",
    pdfBody: "times",
    titleSize: 20,
  },
  modern: {
    label: "Clean sans",
    hint: "Helvetica-style throughout. Crisp and modern.",
    titleCss: 'Inter, "Helvetica Neue", Helvetica, Arial, sans-serif',
    bodyCss: 'Inter, "Helvetica Neue", Helvetica, Arial, sans-serif',
    pdfTitle: "helvetica",
    pdfBody: "helvetica",
    titleSize: 18,
  },
  editorial: {
    label: "Editorial",
    hint: "Bold serif headline with a clean sans body.",
    titleCss: 'Georgia, "Times New Roman", Times, serif',
    bodyCss: 'Inter, "Helvetica Neue", Helvetica, Arial, sans-serif',
    pdfTitle: "times",
    pdfBody: "helvetica",
    titleSize: 22,
  },
};

/* ───────── helpers shared by preview + PDF ───────── */

export function parseLocalDate(s: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || "");
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(s);
}

export function dateParts(s: string): { top: string; year: string; month: string } {
  const d = parseLocalDate(s);
  if (Number.isNaN(d.getTime())) return { top: "TBA", year: "", month: "Date to be announced" };
  return {
    top: d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }).replace(",", ""),
    year: String(d.getFullYear()),
    month: d.toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
  };
}

/** Meeting links are for the web page, not for paper. */
export function cleanNotes(notes?: string): string {
  return (notes || "").replace(/https?:\/\/\S+/g, "").replace(/\s{2,}/g, " ").trim();
}

export interface ColumnDef {
  key: "date" | "event" | "location" | "host" | "time" | "notes";
  label: string;
  /** percentage of the table width */
  pct: number;
}

export function visibleColumns(o: PrintOptions): ColumnDef[] {
  const fixedDate = 14;
  const fixedTime = o.showTime ? 12 : 0;
  const flex: { key: ColumnDef["key"]; label: string; weight: number }[] = [{ key: "event", label: "Event", weight: 3 }];
  if (o.showLocation) flex.push({ key: "location", label: "Venue", weight: 2.3 });
  if (o.showHost) flex.push({ key: "host", label: "Host", weight: 1.8 });
  if (o.showNotes) flex.push({ key: "notes", label: "Notes", weight: 2.6 });
  const total = flex.reduce((a, c) => a + c.weight, 0);
  const room = 100 - fixedDate - fixedTime;
  const cols: ColumnDef[] = [{ key: "date", label: "Date", pct: fixedDate }];
  flex.forEach((c) => cols.push({ key: c.key, label: c.label, pct: (c.weight / total) * room }));
  if (o.showTime) {
    // time sits right after the date, where people look for it
    cols.splice(1, 0, { key: "time", label: "Time", pct: fixedTime });
  }
  return cols;
}

export function cellText(item: PrintItem, key: ColumnDef["key"]): string {
  switch (key) {
    case "event":
      return item.event + (item.status === "Tentative" ? " (tentative)" : "");
    case "location":
      return item.location || "—";
    case "host":
      return item.host || "—";
    case "time":
      return item.time || "—";
    case "notes":
      return cleanNotes(item.notes) || "—";
    default:
      return "";
  }
}

/* ───────── image loading (local first, remote fallback) ───────── */

async function fetchDataUrl(src: string): Promise<string | null> {
  try {
    const res = await fetch(src, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!blob.type.startsWith("image/")) return null;
    return await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(r.error);
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function measure(dataUrl: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth || 1, h: img.naturalHeight || 1 });
    img.onerror = () => resolve({ w: 1, h: 1 });
    img.src = dataUrl;
  });
}

export interface LoadedLogo {
  dataUrl: string;
  w: number;
  h: number;
}

export async function loadLogo(sources: string[]): Promise<LoadedLogo | null> {
  for (const src of sources) {
    const dataUrl = await fetchDataUrl(src);
    if (dataUrl) return { dataUrl, ...(await measure(dataUrl)) };
  }
  return null;
}

/* ───────── PDF ───────── */

const fit = (l: { w: number; h: number }, max: number) => {
  const r = l.w / l.h;
  return r >= 1 ? { w: max, h: max / r } : { w: max * r, h: max };
};

export async function generateSchedulePdf(items: PrintItem[], o: PrintOptions): Promise<void> {
  const [group, sda] = await Promise.all([
    o.showGroupLogo ? loadLogo(GROUP_LOGO_SOURCES) : Promise.resolve(null),
    o.showSdaLogo ? loadLogo(SDA_LOGO_SOURCES) : Promise.resolve(null),
  ]);

  const theme = FONT_THEMES[o.fontTheme];
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const H = 297;
  const M = 14;
  const CW = W - M * 2;
  const navyHeader = o.headerStyle === "navy";
  const cols = visibleColumns(o).map((c) => ({ ...c, w: (c.pct / 100) * CW }));

  const drawLogo = (logo: LoadedLogo, x: number, y: number, box: number, badge: boolean) => {
    const s = fit(logo, box);
    if (badge) {
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(x - 1.8, y - 1.8, s.w + 3.6, s.h + 3.6, 2, 2, "F");
    }
    pdf.addImage(logo.dataUrl, "PNG", x, y, s.w, s.h);
    return s;
  };

  // ── first-page header ──
  const drawFirstHeader = (): number => {
    const centered = o.logoLayout === "center";
    const BOX = centered ? 20 : 24;
    const height = centered ? 58 : 46;

    if (navyHeader) {
      pdf.setFillColor(...NAVY_RGB);
      pdf.rect(0, 0, W, height, "F");
      pdf.setFillColor(...ORANGE_RGB);
      pdf.rect(0, height, W, 1.4, "F");
    } else {
      pdf.setFillColor(...ORANGE_RGB);
      pdf.rect(0, 0, W, 2.2, "F");
      pdf.setDrawColor(...NAVY_RGB);
      pdf.setLineWidth(0.5);
      pdf.line(M, height, W - M, height);
    }
    const textRGB: [number, number, number] = navyHeader ? [255, 255, 255] : INK_RGB;
    const subRGB: [number, number, number] = navyHeader ? [255, 214, 160] : MUTED_RGB;
    // The SDA mark is dark, so on a navy band it sits on a small white badge.
    const sdaBadge = navyHeader;

    let titleX = W / 2;
    let align: "center" | "left" = "center";
    let maxW = CW - 2 * (BOX + 10);
    let titleTop = 0;

    if (o.logoLayout === "split") {
      const y = (height - BOX) / 2;
      if (group) drawLogo(group, M, y, BOX, false);
      if (sda) {
        const s = fit(sda, BOX);
        drawLogo(sda, W - M - s.w, y + (BOX - s.h) / 2, BOX, sdaBadge);
      }
    } else if (o.logoLayout === "left") {
      let x = M;
      const y = (height - BOX) / 2;
      if (group) x += drawLogo(group, x, y, BOX, false).w + 6;
      if (sda) {
        const s = fit(sda, BOX);
        x += drawLogo(sda, x, y + (BOX - s.h) / 2, BOX, sdaBadge).w + 8;
      }
      titleX = Math.max(x, M);
      align = "left";
      maxW = W - M - titleX;
    } else {
      // centred: logos side by side above the title
      const gap = 8;
      const gs = group ? fit(group, BOX) : null;
      const ss = sda ? fit(sda, BOX) : null;
      const totalW = (gs?.w || 0) + (ss?.w || 0) + (gs && ss ? gap : 0);
      let x = (W - totalW) / 2;
      const y = 7;
      if (group && gs) x += drawLogo(group, x, y + (BOX - gs.h) / 2, BOX, false).w + gap;
      if (sda && ss) drawLogo(sda, x, y + (BOX - ss.h) / 2, BOX, sdaBadge);
      titleTop = BOX + 2;
      maxW = CW;
    }

    pdf.setTextColor(...textRGB);
    pdf.setFont(theme.pdfTitle, "bold");
    pdf.setFontSize(theme.titleSize);
    const titleLines = (pdf.splitTextToSize((o.title || "Itinerary").toUpperCase(), maxW) as string[]).slice(0, 2);
    pdf.setFont(theme.pdfBody, "normal");
    pdf.setFontSize(9);
    const subLines = o.subtitle ? (pdf.splitTextToSize(o.subtitle, maxW) as string[]).slice(0, 2) : [];

    const titleH = titleLines.length * (theme.titleSize * 0.42);
    const subH = subLines.length * 4.4;
    const blockH = titleH + (subLines.length ? subH + 2 : 0);
    const areaTop = o.logoLayout === "center" ? titleTop + 8 : 0;
    const areaH = o.logoLayout === "center" ? height - areaTop - 4 : height;
    let ty = areaTop + (areaH - blockH) / 2 + theme.titleSize * 0.33;

    pdf.setFont(theme.pdfTitle, "bold");
    pdf.setFontSize(theme.titleSize);
    pdf.setTextColor(...textRGB);
    titleLines.forEach((line) => {
      pdf.text(line, titleX, ty, { align });
      ty += theme.titleSize * 0.42;
    });
    if (subLines.length) {
      ty += 1;
      pdf.setFont(theme.pdfBody, "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(...subRGB);
      subLines.forEach((line) => {
        pdf.text(line, titleX, ty, { align });
        ty += 4.4;
      });
    }
    return height + 8;
  };

  // ── slim header on following pages ──
  const drawSlimHeader = (): number => {
    pdf.setFillColor(...NAVY_RGB);
    pdf.rect(0, 0, W, 15, "F");
    pdf.setFillColor(...ORANGE_RGB);
    pdf.rect(0, 15, W, 0.9, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFont(theme.pdfTitle, "bold");
    pdf.setFontSize(10.5);
    const t = (o.title || "Itinerary").toUpperCase();
    pdf.text(t.length > 60 ? t.slice(0, 57) + "…" : t, M, 9.6);
    let x = W - M;
    if (sda) {
      const s = fit(sda, 8);
      x -= s.w;
      drawLogo(sda, x, (15 - s.h) / 2, 8, true);
      x -= 6;
    }
    if (group) {
      const s = fit(group, 10);
      x -= s.w;
      drawLogo(group, x, (15 - s.h) / 2, 10, false);
    }
    return 23;
  };

  const drawTableHead = (y: number): number => {
    pdf.setFillColor(...(navyHeader ? NAVY_RGB : ([232, 237, 245] as [number, number, number])));
    pdf.rect(M, y, CW, 7.5, "F");
    pdf.setFont(theme.pdfBody, "bold");
    pdf.setFontSize(7.5);
    pdf.setTextColor(...(navyHeader ? ([255, 255, 255] as [number, number, number]) : INK_RGB));
    let x = M;
    cols.forEach((c) => {
      pdf.text(c.label.toUpperCase(), x + 2.2, y + 5);
      x += c.w;
    });
    return y + 7.5;
  };

  let y = drawFirstHeader();
  let page = 1;
  const FOOT = H - 16;

  if (items.length === 0) {
    pdf.setFont(theme.pdfBody, "normal");
    pdf.setFontSize(11);
    pdf.setTextColor(...MUTED_RGB);
    pdf.text("No events selected for this schedule.", M, y + 6);
  } else {
    y = drawTableHead(y);
  }

  const LINE = 3.7;
  const PADX = 2.2;
  const PADY = 2.4;
  let lastMonth = "";
  let zebra = false;

  items.forEach((item) => {
    const parts = dateParts(item.date);

    // cell text → wrapped lines
    const lines: Record<string, string[]> = {};
    cols.forEach((c) => {
      if (c.key === "date") return;
      pdf.setFont(theme.pdfBody, c.key === "event" ? "bold" : "normal");
      pdf.setFontSize(c.key === "event" ? 9 : 8.2);
      lines[c.key] = pdf.splitTextToSize(cellText(item, c.key), c.w - PADX * 2) as string[];
    });
    const maxLines = Math.max(2, ...Object.values(lines).map((l) => l.length));
    const rowH = maxLines * LINE + PADY * 2;
    const monthH = o.groupByMonth && parts.month !== lastMonth ? 9 : 0;

    if (y + monthH + rowH > FOOT) {
      pdf.addPage();
      page++;
      y = drawTableHead(drawSlimHeader());
      zebra = false;
    }

    if (monthH) {
      lastMonth = parts.month;
      pdf.setFont(theme.pdfTitle, "bold");
      pdf.setFontSize(9.5);
      pdf.setTextColor(...ORANGE_TEXT_RGB);
      pdf.text(parts.month.toUpperCase(), M + 1, y + 6);
      pdf.setDrawColor(...ORANGE_RGB);
      pdf.setLineWidth(0.35);
      pdf.line(M, y + 7.4, W - M, y + 7.4);
      y += monthH;
      zebra = false;
    }

    if (zebra) {
      pdf.setFillColor(...ZEBRA_RGB);
      pdf.rect(M, y, CW, rowH, "F");
    }
    zebra = !zebra;

    let x = M;
    cols.forEach((c) => {
      if (c.key === "date") {
        pdf.setFont(theme.pdfBody, "bold");
        pdf.setFontSize(8.6);
        pdf.setTextColor(...INK_RGB);
        pdf.text(parts.top, x + PADX, y + PADY + 3);
        pdf.setFont(theme.pdfBody, "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(...MUTED_RGB);
        pdf.text(parts.year, x + PADX, y + PADY + 3 + LINE);
      } else {
        pdf.setFont(theme.pdfBody, c.key === "event" ? "bold" : "normal");
        pdf.setFontSize(c.key === "event" ? 9 : 8.2);
        pdf.setTextColor(...(c.key === "event" ? INK_RGB : ([55, 66, 86] as [number, number, number])));
        pdf.text(lines[c.key], x + PADX, y + PADY + 3, { lineHeightFactor: 1.2 });
      }
      x += c.w;
    });

    pdf.setDrawColor(...RULE_RGB);
    pdf.setLineWidth(0.2);
    pdf.line(M, y + rowH, W - M, y + rowH);
    y += rowH;
  });

  // footers
  const total = pdf.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    pdf.setPage(i);
    pdf.setDrawColor(...ORANGE_RGB);
    pdf.setLineWidth(0.5);
    pdf.line(M, H - 13, W - M, H - 13);
    pdf.setFont(theme.pdfBody, "normal");
    pdf.setFontSize(7.5);
    pdf.setTextColor(...MUTED_RGB);
    pdf.text("Kachamba Chorus · Seventh-day Adventist Youth Ministry · kachambachorus.online", M, H - 8);
    pdf.text(`Page ${i} of ${total}`, W - M, H - 8, { align: "right" });
  }
  void page;

  pdf.save("kachamba-itinerary.pdf");
}
