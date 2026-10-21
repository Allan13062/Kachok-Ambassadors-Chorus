import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Download, Printer, Check, Loader2 } from "lucide-react";
import {
  ReceiptData,
  SCRIPTURE,
  barcodePattern,
  downloadReceiptPdf,
  formatKes,
  formatWhen,
  maskPhone,
  verificationCode,
} from "../lib/receipt";

/* ───────────────────────── The receipt itself ─────────────────────────
   Used on screen AND in the printout, so what you see is what prints.
   Colours inside .receipt-sheet are always "paper" (see index.css). */

export function ReceiptSheet({ data }: { data: ReceiptData }) {
  const [logoFailed, setLogoFailed] = useState(false);
  const bars = useMemo(() => barcodePattern(`${data.reference}${data.when.getTime()}`), [data]);
  const total = bars.reduce((n, w) => n + w + 0.7, 0);

  const rows: [string, string][] = [
    ["Date & time", formatWhen(data.when)],
    ["Payment method", `M-Pesa · ${maskPhone(data.phone)}`],
    ["Paid to", data.tillName],
    [data.tillLabel, data.tillNumber],
    ["Purpose", "Ministry contribution"],
  ];

  return (
    <div className="receipt-sheet w-full overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-900">
      {/* brand strip */}
      <div className="flex h-1.5" aria-hidden="true">
        <i className="flex-[5]" style={{ background: "var(--fill-primary)" }} />
        <i className="flex-[3]" style={{ background: "var(--fill-secondary)" }} />
        <i className="flex-[2]" style={{ background: "var(--fill-accent)" }} />
      </div>

      {/* header with logo */}
      <div className="flex items-center gap-4 px-6 py-6 sm:px-8" style={{ background: "var(--fill-primary)" }}>
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white p-1.5">
          {!logoFailed && data.logoUrl ? (
            <img
              src={data.logoUrl}
              alt={`${data.orgName} logo`}
              className="h-full w-full object-contain"
              referrerPolicy="no-referrer"
              onError={() => setLogoFailed(true)}
            />
          ) : (
            <span className="font-display text-3xl font-bold" style={{ color: "var(--fill-primary)" }}>
              K
            </span>
          )}
        </div>
        <div className="min-w-0 text-white">
          <p className="truncate font-display text-xl font-bold leading-tight tracking-tight">{data.orgName}</p>
          <p className="mt-0.5 text-xs leading-snug text-white/80">Seventh-day Adventist Youth Ministry · Kisumu, Kenya</p>
        </div>
      </div>

      <div className="px-6 pb-7 pt-6 sm:px-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--fill-primary)" }}>
              Receipt
            </p>
            <h4 className="mt-1 font-display text-2xl font-bold tracking-tight">{data.title}</h4>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-slate-500">Receipt no.</p>
            <p className="break-all font-mono text-xs font-bold">{data.reference}</p>
          </div>
        </div>

        {/* amount */}
        <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Amount</p>
            <p className="mt-1 font-display text-4xl font-bold leading-none tracking-tight tabular-nums sm:text-5xl">
              {formatKes(data.amount)}
            </p>
          </div>
          <span
            className="shrink-0 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em]"
            style={{ background: "#def4f0", color: "#08796f" }}
          >
            Request sent
          </span>
        </div>

        {/* details */}
        <dl className="mt-5 divide-y divide-slate-200 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between gap-6 py-3">
              <dt className="text-slate-500">{label}</dt>
              <dd className="break-words text-right font-semibold">{value}</dd>
            </div>
          ))}
        </dl>

        {/* message */}
        <div className="mt-5 rounded-2xl border-l-4 px-5 py-4" style={{ background: "#eef1fe", borderColor: "var(--fill-primary)" }}>
          <p className="text-sm leading-relaxed text-slate-800">{data.message}</p>
          <p className="mt-2 text-xs italic leading-relaxed text-slate-500">{SCRIPTURE}</p>
        </div>

        <p className="mt-5 text-xs leading-relaxed text-slate-500">
          This receipt acknowledges a contribution request made through M-Pesa. Your M-Pesa confirmation message is your
          official proof of payment.
        </p>

        {/* footer */}
        <div className="mt-6 flex items-end justify-between gap-4 border-t border-slate-200 pt-4">
          <div>
            <svg viewBox={`0 0 ${total} 24`} preserveAspectRatio="none" className="h-8 w-40" aria-hidden="true">
              {(() => {
                let x = 0;
                return bars.map((w, i) => {
                  const rect = i % 2 === 0 ? <rect key={i} x={x} y={0} width={w} height={24} fill="#0f172a" /> : null;
                  x += w + 0.7;
                  return rect;
                });
              })()}
            </svg>
            <p className="mt-1.5 text-[10px] text-slate-500">
              Verification code {verificationCode(data.reference, data.when)} · kachambachorus.online
            </p>
          </div>
          {data.extraLogoUrl && (
            <img
              src={data.extraLogoUrl}
              alt=""
              className="h-10 w-10 shrink-0 object-contain"
              referrerPolicy="no-referrer"
              onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Screen view + actions + print ───────────────────────── */

export default function ReceiptView({ data, onDone }: { data: ReceiptData; onDone: () => void }) {
  const [busy, setBusy] = useState(false);

  const handleDownload = async () => {
    setBusy(true);
    try {
      await downloadReceiptPdf(data);
    } catch (err) {
      console.error("Receipt PDF failed:", err);
      alert("Sorry, the PDF couldn't be created. Please try Print instead.");
    } finally {
      setBusy(false);
    }
  };

  const handlePrint = () => {
    const cleanup = () => {
      document.body.classList.remove("print-mode-receipt");
      window.removeEventListener("afterprint", cleanup);
    };
    document.body.classList.add("print-mode-receipt");
    window.addEventListener("afterprint", cleanup);
    window.setTimeout(() => {
      window.print();
      window.setTimeout(cleanup, 120000); // safety net for browsers that skip `afterprint`
    }, 50);
  };

  return (
    <div id="mpesa-receipt-container" className="mx-auto w-full max-w-md">
      <div id="mpesa-receipt">
        <ReceiptSheet data={data} />
      </div>

      <div className="no-print mt-6 grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={handleDownload} disabled={busy} className="btn-solid fill-primary !py-3.5 disabled:opacity-60">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
          {busy ? "Preparing…" : "Download PDF"}
        </button>
        <button type="button" onClick={handlePrint} className="btn-outline !py-3.5">
          <Printer className="h-4 w-4" aria-hidden="true" />
          Print
        </button>
      </div>
      <button
        type="button"
        onClick={onDone}
        className="no-print mx-auto mt-4 flex items-center gap-2 text-sm font-semibold text-white/60 underline decoration-white/25 underline-offset-4 hover:text-white"
      >
        <Check className="h-4 w-4" aria-hidden="true" />
        Done
      </button>

      {/* Print-only copy, mounted on <body> so nothing else on the page prints with it */}
      {typeof document !== "undefined" &&
        createPortal(
          <div className="receipt-print-only">
            <ReceiptSheet data={data} />
          </div>,
          document.body
        )}
    </div>
  );
}
