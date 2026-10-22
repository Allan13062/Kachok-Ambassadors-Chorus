import { jsPDF } from "jspdf";

/* Helpers for M-Pesa receipts. The on-screen and printed receipt UI lives in
   src/components/ReceiptView.tsx and reads everything from these exports. */

export type ReceiptData = {
  reference: string;
  when: Date;
  phone: string;
  amount: number;
  title: string;
  message: string;
  orgName: string;
  logoUrl?: string;
  extraLogoUrl?: string;
  tillName: string;
  tillLabel: string;
  tillNumber: string;
};

export const SCRIPTURE = "“God loves a cheerful giver.” — 2 Corinthians 9:7";

const DEFAULT_MESSAGE = "We have received your generous contribution. May God bless you abundantly.";

// Small stable string hash (FNV-1a), used for deterministic barcode and codes
function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

export function formatKes(amount: number): string {
  const n = Number.isFinite(amount) ? amount : 0;
  return `KES ${n.toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;
}

export function formatWhen(when: Date): string {
  return when.toLocaleString("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Nairobi",
  });
}

// "0712345678" or "254712345678" → "0712••••678"
export function maskPhone(phone: string): string {
  const digits = (phone || "").replace(/\D/g, "");
  if (digits.length < 7) return phone || "";
  return `${digits.slice(0, 4)}••••${digits.slice(-3)}`;
}

// Bar widths for the decorative barcode. Same input always gives the same bars.
export function barcodePattern(seed: string): number[] {
  let state = hashString(seed) || 1;
  const bars: number[] = [];
  for (let i = 0; i < 48; i++) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    bars.push(1 + ((state >>> 24) % 3));
  }
  return bars;
}

// Short human-checkable code printed on the receipt
export function verificationCode(reference: string, when: Date): string {
  return hashString(`${reference}|${when.getTime()}`)
    .toString(36)
    .toUpperCase()
    .padStart(8, "0")
    .slice(-8);
}

// Builds receipt data from the till settings in JoinUs
export function buildReceiptData(
  cfg: any,
  amount: number,
  reference: string,
  phone: string,
  when: Date
): ReceiptData {
  return {
    reference,
    when,
    phone,
    amount,
    title: cfg?.receiptTitle || "Contribution receipt",
    message: cfg?.receiptMessage || DEFAULT_MESSAGE,
    orgName: "Kachamba Chorus",
    logoUrl: cfg?.receiptLogo || undefined,
    extraLogoUrl: cfg?.receiptExtraLogo || undefined,
    tillName: cfg?.tillName || "Kachok Ambassadors Chorus",
    tillLabel: cfg?.tillType === "paybill" ? "Paybill No." : "Till No.",
    tillNumber: String(cfg?.tillNumber || ""),
  };
}

// Creates a PDF copy of the receipt (A5 portrait) and downloads it
export async function downloadReceiptPdf(data: ReceiptData): Promise<void> {
  const pdf = new jsPDF({ unit: "mm", format: "a5" });
  const W = 148;
  const margin = 12;

  // Header band
  pdf.setFillColor(8, 24, 48);
  pdf.rect(0, 0, W, 38, "F");
  pdf.setFillColor(240, 144, 16);
  pdf.rect(0, 38, W, 1.4, "F");

  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(15);
  pdf.text(data.orgName, margin, 18);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  pdf.text("Seventh-day Adventist Youth Ministry · Kisumu, Kenya", margin, 25);

  // Title and reference
  pdf.setTextColor(8, 24, 48);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.text("RECEIPT", margin, 50);
  pdf.setFontSize(13);
  pdf.text(data.title, margin, 57);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(100, 110, 125);
  pdf.text("Receipt no.", W - margin, 50, { align: "right" });
  pdf.setFont("courier", "bold");
  pdf.setFontSize(8.5);
  pdf.setTextColor(8, 24, 48);
  pdf.text(data.reference, W - margin, 56, { align: "right" });

  // Amount
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  pdf.setTextColor(100, 110, 125);
  pdf.text("AMOUNT", margin, 69);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  pdf.setTextColor(8, 24, 48);
  pdf.text(formatKes(data.amount), margin, 80);

  // Details rows
  const rows: [string, string][] = [
    ["Date & time", formatWhen(data.when)],
    ["Payment method", `M-Pesa · ${maskPhone(data.phone)}`],
    ["Paid to", data.tillName],
    [data.tillLabel, data.tillNumber],
    ["Purpose", "Ministry contribution"],
  ];
  let y = 92;
  rows.forEach(([label, value]) => {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(100, 110, 125);
    pdf.text(label, margin, y);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(8, 24, 48);
    pdf.text(value, W - margin, y, { align: "right" });
    pdf.setDrawColor(220, 224, 230);
    pdf.line(margin, y + 2.5, W - margin, y + 2.5);
    y += 9;
  });

  // Message and scripture
  y += 6;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(40, 50, 65);
  const messageLines = pdf.splitTextToSize(data.message, W - margin * 2) as string[];
  pdf.text(messageLines, margin, y);
  y += messageLines.length * 4.6 + 3;
  pdf.setFont("helvetica", "italic");
  pdf.setFontSize(8);
  pdf.setTextColor(100, 110, 125);
  pdf.text(SCRIPTURE, margin, y);

  // Footer
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  pdf.text(
    `Verification code ${verificationCode(data.reference, data.when)} · kachambachorus.online`,
    margin,
    198
  );

  const safeRef = data.reference.replace(/[^A-Za-z0-9-]/g, "_") || "receipt";
  pdf.save(`receipt-${safeRef}.pdf`);
                       }
