import React, { useState, useEffect } from "react";
import { Mic, CheckCircle, Smartphone, Eye, X, Info, Barcode, Copy, Check, Loader2, AlertCircle, ArrowRight, ShieldCheck, Lock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { jsPDF } from "jspdf";
const sdaLogo = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Seventh-day_Adventist_Church_logo_svg.svg/320px-Seventh-day_Adventist_Church_logo_svg.svg.png";

export default function JoinUs() {
  const [activeTab, setActiveTab] = useState<"audition" | "mpesa">("audition");

  // Audition application form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    voicePart: "Soprano",
    experience: ""
  });
  const [submitted, setSubmitted] = useState(false);
  const [auditionLoading, setAuditionLoading] = useState(false);
  const [auditionError, setAuditionError] = useState("");
  const [tillCopied, setTillCopied] = useState(false);

  // M-Pesa contribution states
  const [mpesaConfig, setMpesaConfig] = useState<any>({
    tillNumber: "4119041",
    tillName: "Kachok Ambassadors Chorus",
    tillImage: "",
    tillType: "buy_goods",
    receiptTitle: "",
    receiptLogo: "https://www.image2url.com/r2/default/images/1781098447744-9bfd4cd8-4c62-4a1a-b218-7ccd6f1b36d2.png",
    receiptExtraLogo: "",
    receiptMessage: "We have received your generous contribution. May God bless you abundantly.",
    receiptLayout: "modern",
    receiptHeaderSize: "text-xl",
    receiptHeaderColor: "text-slate-800",
    receiptBodySize: "text-sm",
    receiptBodyColor: "text-slate-500",
    receiptTextAlign: "text-center",
    receiptFontFamily: "font-sans"
  });

  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("500");
  const [customAmount, setCustomAmount] = useState("");
  const [isPushing, setIsPushing] = useState(false);
  const [pushStatus, setPushStatus] = useState<{
    type: "idle" | "loading" | "success" | "error";
    message: string;
    refNumber?: string;
  }>({ type: "idle", message: "" });
  const [showPosterModal, setShowPosterModal] = useState(false);

  useEffect(() => {
    // Load current till config on mount
    const loadMpesaConfig = async () => {
      try {
        const res = await fetch("/api/mpesa/config");
        if (res.ok) {
          const data = await res.json();
          setMpesaConfig(data);
        }
      } catch (err) {
        console.error("Failed to load M-Pesa configuration:", err);
      }
    };
    loadMpesaConfig();
  }, []);

  useEffect(() => {
    if (window.location.hash === "#support") {
      setActiveTab("mpesa");
      window.setTimeout(() => document.getElementById("join")?.scrollIntoView({ behavior: "smooth" }), 400);
    }
  }, []);

  const handleCopyTill = async () => {
    try {
      await navigator.clipboard.writeText(String(mpesaConfig.tillNumber || ""));
      setTillCopied(true);
      window.setTimeout(() => setTillCopied(false), 2000);
    } catch {
      /* clipboard blocked — number is still visible and selectable */
    }
  };

  // Audition applications are saved as inquiries, so they appear in the admin Inbox.
  const handleAuditionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) return;
    setAuditionLoading(true);
    setAuditionError("");
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          subject: `Audition application — ${formData.voicePart}`,
          message:
            `Voice part: ${formData.voicePart}\n` +
            `Musical experience: ${formData.experience.trim() || "Not provided"}`
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not send your application.");
      setSubmitted(true);
    } catch (err: any) {
      setAuditionError(err?.message || "Network error. Please try again.");
    } finally {
      setAuditionLoading(false);
    }
  };

  const handleStkPushSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const digits = phone.replace(/[^0-9]/g, "");
    if (!/^(254|0)?(7|1)\d{8}$/.test(digits)) {
      setPushStatus({ type: "error", message: "Please enter a valid Safaricom number, e.g. 0712 345 678." });
      return;
    }

    const finalAmount = amount === "custom" ? customAmount : amount;
    if (!finalAmount || isNaN(Number(finalAmount)) || Number(finalAmount) < 1) {
      setPushStatus({ type: "error", message: "Please enter a valid amount of at least KES 1." });
      return;
    }

    setIsPushing(true);
    setPushStatus({ type: "loading", message: "Sending the M-Pesa prompt to your phone…" });

    try {
      const res = await fetch("/api/mpesa/stkpush", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: digits, amount: finalAmount })
      });
      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("The payment service did not respond properly. Please try again.");
      }

      if (res.ok && data.success && data.realApi) {
        setPushStatus({
          type: "success",
          message: data.message,
          refNumber: data.checkoutRequestId || `ws_CO_${Date.now().toString().slice(3)}`
        });
      } else if (res.ok && data.success && !data.realApi) {
        // Server is running without live M-Pesa credentials: never pretend a payment happened.
        setPushStatus({
          type: "error",
          message:
            "Online M-Pesa prompts aren't switched on right now. Please pay with the till number below and your contribution will still reach us."
        });
      } else {
        setPushStatus({ type: "error", message: data.error || "We couldn't send the M-Pesa prompt. Please try again." });
      }
    } catch (err: any) {
      setPushStatus({ type: "error", message: err?.message || "Connection failed. Please check your internet and try again." });
    } finally {
      setIsPushing(false);
    }
  };

  const loadImageData = async (url: string): Promise<{ dataUrl: string, width: number, height: number } | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          try {
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            resolve({ dataUrl, width: img.width, height: img.height });
          } catch (e) {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  };

  const downloadPdfReceipt = async () => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const finalAmount = amount === "custom" ? customAmount : amount;
      const refNumber = pushStatus.refNumber || `TXN-${Date.now().toString().slice(6)}`;
      const paymentTime = new Date().toLocaleString("en-US", { 
        month: "short", 
        day: "numeric", 
        year: "numeric", 
        hour: "numeric", 
        minute: "2-digit", 
        hour12: true 
      });

      // Load brand and extra companion logos asynchronously
      const logoUrl = mpesaConfig.receiptLogo || "https://www.image2url.com/r2/default/images/1781098447744-9bfd4cd8-4c62-4a1a-b218-7ccd6f1b36d2.png";
      const extraLogoUrl = mpesaConfig.receiptExtraLogo || "https://www.image2url.com/r2/default/images/1781098447744-9bfd4cd8-4c62-4a1a-b218-7ccd6f1b36d2.png";
      const logoData = await loadImageData(logoUrl);
      const extraLogoData = await loadImageData(extraLogoUrl);

      // 1. Sleek Top Header
      doc.setFillColor(111, 60, 212);
      doc.rect(0, 0, 210, 45, "F");

      // Draw loaded logos in top corners
      if (logoData && logoData.dataUrl) {
        doc.addImage(logoData.dataUrl, 'JPEG', 15, 12, 18, 18);
      }
      if (extraLogoData && extraLogoData.dataUrl) {
        doc.addImage(extraLogoData.dataUrl, 'JPEG', 177, 12, 18, 18);
      }

      // Header Text
      const pdfTitle = mpesaConfig.receiptTitle || mpesaConfig.tillName || "KACHAMBA CHORUS MINISTRY";
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      // Adjust font size based on text length to avoid overflow
      doc.setFontSize(pdfTitle.length > 25 ? 14 : 20);
      doc.text(pdfTitle.toUpperCase(), 105, 18, { align: "center" });
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.text("Seventh-day Adventist Youth Ministry | Kisumu, Kenya", 105, 26, { align: "center" });
      doc.setFontSize(8.5);
      doc.text("Email: kachambachorus@gmail.com | Phone: +254 797 450 206", 105, 32, { align: "center" });

      // 2. Receipt Container Frame
      doc.setDrawColor(226, 232, 240); // Slate 200
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(25, 55, 160, 125, 6, 6, "FD");

      // Success Indicator Icon (Circle with tick mark)
      doc.setFillColor(240, 253, 250); // Mint 50
      doc.ellipse(105, 75, 14, 14, "F");
      
      // Draw tick symbol
      doc.setDrawColor(16, 185, 129); // Emerald 505
      doc.setLineWidth(1.5);
      doc.line(100, 75, 103, 78);
      doc.line(103, 78, 111, 71);

      // Status Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(30, 41, 59); // Slate 800
      doc.text("Payment Successful", 105, 98, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139); // Slate 500
      doc.text("Your transaction has been processed and verified.", 105, 104, { align: "center" });

      // Transaction Amount Design Box
      doc.setFillColor(248, 250, 252); // Slate 50
      doc.roundedRect(40, 112, 130, 18, 3, 3, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      doc.setTextColor(15, 23, 42); // Slate 900
      doc.text(`KES ${Number(finalAmount).toLocaleString()}`, 105, 124, { align: "center" });

      // Receipt Details Table
      doc.setLineWidth(0.2);
      doc.setDrawColor(241, 245, 249); // Slate 100

      // Row 1: Reference Number
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text("Ref Number", 35, 144);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text(refNumber, 175, 144, { align: "right" });
      doc.line(35, 148, 175, 148);

      // Row 2: Payment Time
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("Payment Time", 35, 156);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text(paymentTime, 175, 156, { align: "right" });
      doc.line(35, 160, 175, 160);

      // Row 3: Payment Method
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("Payment Method", 35, 168);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text(`M-Pesa (+254 ***${phone.slice(-4)})`, 175, 168, { align: "right" });

      // 3. Heartfelt Closing blessing
      doc.setFont("helvetica", "medium");
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105); // Slate 600
      
      let messageLines = ["Thank you for your generous contribution!"];
      if (mpesaConfig.receiptMessage) {
        messageLines = doc.splitTextToSize(mpesaConfig.receiptMessage, 160);
      }
      
      let yOffset = 195;
      for (const line of messageLines) {
         doc.text(line, 105, yOffset, { align: "center" });
         yOffset += 6;
      }
      
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184); // Slate 400
      doc.text('"Every man according as he purposeth in his heart, so let him give" -- 2 Corinthians 9:7', 105, yOffset + 3, { align: "center" });

      // 4. Secure barcode or footer graphic lines
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(20, 265, 190, 265);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("This receipt certifies support for the missionary works of the Kachamba Chorus.", 105, 272, { align: "center" });
      doc.text(`Verification Key: ${refNumber}-${Date.now().toString().slice(-4)}`, 105, 277, { align: "center" });

      // Trigger download
      doc.save(`Kachamba_Donation_Receipt_${refNumber}.pdf`);
    } catch (err: any) {
      console.error("PDF generation failed:", err);
    }
  };

  const steps = [
    { icon: Mic, title: "Vocal placement", description: "A friendly, private five-minute audition with our Choir Council to find your part — Soprano, Alto, Tenor or Bass." },
    { icon: ShieldCheck, title: "Faith commitment", description: "Ambassadors are disciples first. We hold to Seventh-day Adventist standards and supportive fellowship." },
    { icon: ArrowRight, title: "Stand and minister", description: "Meet weekly for devotionals and rehearsals, then tour churches and conferences across the country." }
  ];

  const parts = ["Soprano", "Alto", "Tenor", "Bass", "Unsure"];
  const field =
    "w-full rounded-xl border border-white/15 bg-transparent px-4 py-3 text-[15px] text-white placeholder:text-white/35 outline-none transition focus:border-[color:var(--fill-primary)] focus:ring-2 focus:ring-[color:var(--fill-primary)]/25";
  const label = "mb-2 block text-xs font-semibold text-white/60";
  const finalAmount = amount === "custom" ? customAmount : amount;

  return (
    <section id="join" className="relative px-6 py-24 text-white md:px-12">
      <div className="mx-auto max-w-6xl">
        {/* Heading */}
        <div className="mb-14 max-w-2xl">
          <p className="inline-flex items-center gap-2.5 rounded-full border border-white/15 px-3.5 py-1.5 text-xs font-semibold text-white/70">
            <span className="h-2 w-2 rounded-full" style={{ background: "var(--fill-secondary)" }} />
            Join &amp; support
          </p>
          <h2 className="mt-5 text-4xl md:text-6xl">
            Sing with us. <span style={{ color: "var(--hue-primary)" }}>Support the mission.</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/60 md:text-lg">
            Audition for a place in the chorus, or give towards our outreach and tours.
          </p>
        </div>

        <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-14">
          {/* Steps */}
          <ol className="print-hidden divide-y divide-white/10 border-y border-white/10 lg:col-span-5">
            {steps.map((step, i) => (
              <li key={step.title} className="flex gap-5 py-6">
                <span className="font-display text-3xl font-bold leading-none tracking-tight text-white/25">0{i + 1}</span>
                <div>
                  <h3 className="text-lg font-bold">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/55">{step.description}</p>
                </div>
              </li>
            ))}
            <li className="py-5 text-xs font-medium text-white/45">
              Weekly rehearsals · Sabbath afternoons · Kachok SDA Church, Kisumu
            </li>
          </ol>

          {/* Panel */}
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 sm:p-8 lg:col-span-7">
            <div role="tablist" aria-label="Join or support" className="print-hidden mb-7 grid grid-cols-2 gap-1 rounded-full border border-white/10 p-1">
              {([
                ["audition", "Audition"],
                ["mpesa", "Support the ministry"]
              ] as const).map(([id, text]) => (
                <button
                  key={id}
                  role="tab"
                  type="button"
                  aria-selected={activeTab === id}
                  onClick={() => {
                    setActiveTab(id);
                    if (id === "audition") setPushStatus({ type: "idle", message: "" });
                  }}
                  className={`rounded-full px-3 py-2.5 text-sm font-bold transition ${
                    activeTab === id ? "text-white" : "text-white/55 hover:text-white"
                  }`}
                  style={activeTab === id ? { background: id === "audition" ? "var(--fill-primary)" : "var(--fill-accent)" } : undefined}
                >
                  {text}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === "audition" ? (
                <motion.div key="audition-tab" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                  <h3 className="text-2xl font-bold tracking-tight">Join the chorus</h3>
                  <p className="mt-1.5 text-sm text-white/55">Tell us a little about you. Our choir secretary will be in touch.</p>

                  {submitted ? (
                    <div className="mt-8 rounded-2xl border border-white/10 p-8 text-center">
                      <CheckCircle className="mx-auto h-10 w-10" style={{ color: "var(--hue-secondary)" }} aria-hidden="true" />
                      <h4 className="mt-4 text-xl font-bold">Application received</h4>
                      <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-white/60">
                        Thank you{formData.name ? `, ${formData.name.split(" ")[0]}` : ""}. We’ve noted your interest in the {formData.voicePart === "Unsure" ? "right" : formData.voicePart} part and will reach out about rehearsals.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSubmitted(false);
                          setFormData({ name: "", email: "", voicePart: "Soprano", experience: "" });
                        }}
                        className="btn-outline mt-6 !py-2.5 !text-sm"
                      >
                        Submit another
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleAuditionSubmit} className="mt-7 space-y-5">
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                          <label htmlFor="aud-name" className={label}>Full name</label>
                          <input id="aud-name" type="text" required autoComplete="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={field} placeholder="Your name" />
                        </div>
                        <div>
                          <label htmlFor="aud-email" className={label}>Email</label>
                          <input id="aud-email" type="email" required autoComplete="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={field} placeholder="you@example.com" />
                        </div>
                      </div>

                      <fieldset>
                        <legend className={label}>Voice part</legend>
                        <div className="flex flex-wrap gap-2">
                          {parts.map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setFormData({ ...formData, voicePart: p })}
                              aria-pressed={formData.voicePart === p}
                              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                                formData.voicePart === p ? "border-transparent text-white" : "border-white/15 text-white/65 hover:border-white/40"
                              }`}
                              style={formData.voicePart === p ? { background: "var(--fill-primary)" } : undefined}
                            >
                              {p === "Unsure" ? "Not sure" : p}
                            </button>
                          ))}
                        </div>
                      </fieldset>

                      <div>
                        <label htmlFor="aud-exp" className={label}>Musical experience <span className="font-normal text-white/40">(optional)</span></label>
                        <textarea id="aud-exp" rows={3} value={formData.experience} onChange={(e) => setFormData({ ...formData, experience: e.target.value })} className={field} placeholder="Other choirs you’ve sung in, reading music, instruments…" />
                      </div>

                      {auditionError && (
                        <p className="flex items-start gap-2 text-sm font-medium" style={{ color: "var(--hue-accent)" }} role="alert">
                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                          {auditionError}
                        </p>
                      )}

                      <button type="submit" disabled={auditionLoading} className="btn-solid fill-primary w-full !py-3.5 disabled:opacity-60">
                        {auditionLoading ? (<><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Sending…</>) : (<>Submit application <ArrowRight className="h-4 w-4" aria-hidden="true" /></>)}
                      </button>
                    </form>
                  )}
                </motion.div>
              ) : (
                <motion.div key="mpesa-tab" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                  <span id="support" className="block -translate-y-24" aria-hidden="true" />
                  {pushStatus.type === "success" ? (
                    <div id="mpesa-receipt-container" className="flex flex-col items-center justify-center font-sans print:fixed print:inset-0 print:bg-slate-50 print:z-[9999] print:w-screen print:h-screen print:flex print:flex-col print:items-center print:justify-center">
                      <div id="mpesa-receipt" className={`bg-white rounded-[24px] p-8 pt-10 max-w-sm w-full mx-auto shadow-2xl relative print:shadow-none print:max-w-md print:border border-slate-100 ${mpesaConfig.receiptLayout === 'classic' ? 'border print:border-none' : ''} ${mpesaConfig.receiptFontFamily || 'font-sans'} ${mpesaConfig.receiptTextAlign || 'text-center'} overflow-visible`}>
                        {/* Premium SDA Identity Header */}
                        <div className="flex items-center justify-center gap-2 mb-6 pb-4 border-b border-slate-100 print:border-slate-200">
                          <img 
                            src={sdaLogo} 
                            alt="SDA Logo" 
                            className="w-9 h-9 object-contain shrink-0" 
                            referrerPolicy="no-referrer"
                          />
                          <div className="text-left leading-none">
                            <span className="text-[11px] font-bold text-slate-800 tracking-tight block uppercase text-receipt-sda-header">Seventh-day Adventist</span>
                            <span className="text-[8px] text-slate-450 font-medium block uppercase tracking-wider mt-0.5">Ambassador Youth Ministry</span>
                          </div>
                        </div>

                        {/* Receipt Logo */}
                        {mpesaConfig.receiptLogo && (
                          <div className={`absolute top-6 left-6 ${mpesaConfig.receiptLayout === 'classic' ? 'relative top-0 left-0 mb-4 flex justify-center w-full' : ''}`}>
                            <img 
                              src={mpesaConfig.receiptLogo} 
                              alt="Organization Logo" 
                              className={`w-12 h-12 rounded-full object-cover border border-slate-100 shadow-sm ${mpesaConfig.receiptLayout === 'classic' ? 'mx-auto' : ''}`}
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}

                        {mpesaConfig.receiptExtraLogo && (
                          <div className={`absolute top-6 right-6 ${mpesaConfig.receiptLayout === 'classic' ? 'hidden' : ''}`}>
                            <img 
                              src={mpesaConfig.receiptExtraLogo} 
                              alt="Official Symbol" 
                              className={`w-12 h-12 object-contain drop-shadow-sm`}
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}
                        
                        {(mpesaConfig.receiptOrder ? JSON.parse(mpesaConfig.receiptOrder) : ["successIcon", "header", "amount", "message", "details", "barcode"]).map((block: string) => {
                          let content = null;
                          switch (block) {
                            case "successIcon":
                              content = mpesaConfig.receiptLayout === 'modern' ? (
                                <div className={`mb-5 mt-2 flex ${mpesaConfig.receiptTextAlign === 'text-left' ? 'justify-start' : mpesaConfig.receiptTextAlign === 'text-right' ? 'justify-end' : 'justify-center'}`}>
                                  <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center">
                                    <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                      <CheckCircle className="w-8 h-8 text-white" />
                                    </div>
                                  </div>
                                </div>
                              ) : null;
                              break;
                            case "header":
                              content = (
                                <div className="mb-6 mt-4">
                                  {mpesaConfig.receiptLayout === 'classic' && (
                                    <div className={`mb-3 ${mpesaConfig.receiptTextAlign === 'text-left' ? '' : mpesaConfig.receiptTextAlign === 'text-right' ? 'flex justify-end' : 'flex justify-center'}`}>
                                      <CheckCircle className="w-10 h-10 text-emerald-500" />
                                    </div>
                                  )}
                                  <h4 className={`${mpesaConfig.receiptHeaderSize || 'text-2xl'} font-bold ${mpesaConfig.receiptHeaderColor || 'text-slate-800'} mb-1`}>
                                    {mpesaConfig.receiptTitle || mpesaConfig.tillName || "Kachamba Chorus"}
                                  </h4>
                                  <p className={`${mpesaConfig.receiptBodySize || 'text-sm'} ${mpesaConfig.receiptBodyColor || 'text-slate-500'}`}>Contribution request sent</p>
                                  <p className="text-[10px] text-emerald-600 font-bold mt-1 print:hidden">Please enter M-Pesa PIN on your phone to complete.</p>
                                </div>
                              );
                              break;
                            case "amount":
                              content = (
                                <div className="mb-8 mt-2">
                                  <span className={`${mpesaConfig.receiptLayout === 'classic' ? 'text-3xl' : 'text-4xl'} font-extrabold text-slate-900 tracking-tight block`}>
                                    KES {amount === "custom" ? customAmount : amount}
                                  </span>
                                </div>
                              );
                              break;
                            case "message":
                              content = mpesaConfig.receiptMessage ? (
                                <div className="mb-6 px-2">
                                  <p className={`${mpesaConfig.receiptBodySize || 'text-xs'} ${mpesaConfig.receiptBodyColor || 'text-slate-600'} leading-relaxed font-medium italic`}>
                                    "{mpesaConfig.receiptMessage}"
                                  </p>
                                </div>
                              ) : null;
                              break;
                            case "details":
                              content = (
                                <div className="bg-slate-50 rounded-xl p-4 mb-8 border border-slate-100 text-sm">
                                  <div className="flex justify-between items-center py-2 border-b border-slate-200 border-dashed">
                                    <span className="text-slate-500">Ref Number</span>
                                    <span className="font-semibold text-slate-800 font-mono text-xs">{pushStatus.refNumber || `TXN-${Date.now().toString().slice(6)}`}</span>
                                  </div>
                                  <div className="flex justify-between items-center py-2 border-b border-slate-200 border-dashed">
                                    <span className="text-slate-500">Payment Time</span>
                                    <span className="font-semibold text-slate-800 text-xs text-right max-w-[120px]">
                                      {new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center py-2 h-10">
                                    <span className="text-slate-500">Method</span>
                                    <span className="font-semibold text-slate-800 flex items-center gap-1.5 text-xs">
                                      <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                                      M-Pesa ({phone.slice(-4)})
                                    </span>
                                  </div>
                                </div>
                              );
                              break;
                            case "barcode":
                              content = (
                                <div className="flex justify-center mt-2 pb-2 opacity-60 mix-blend-multiply relative z-10">
                                  <Barcode className="w-full max-w-[200px] h-10 text-slate-800" strokeWidth={1} />
                                </div>
                              );
                              break;
                          }
                          return content ? <div key={block}>{content}</div> : null;
                        })}
                      </div>

                      <div className="text-center print:hidden mt-6">
                          <button
                            onClick={downloadPdfReceipt}
                            className="bg-[#6f3cd4] hover:bg-[#5b2ab9] text-white font-bold py-3.5 px-6 rounded-full w-full transition-all shadow-lg shadow-[#6f3cd4]/30 cursor-pointer flex justify-center items-center gap-2 animate-bounce"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download PDF Receipt
                          </button>

                          <button
                            onClick={() => {
                              document.body.classList.add('print-mode-receipt');
                              window.print();
                              setTimeout(() => { document.body.classList.remove('print-mode-receipt'); }, 500);
                            }}
                            className="mt-3.5 text-xs text-slate-500 hover:text-[#6f3cd4] font-medium tracking-wide flex items-center justify-center gap-1 mx-auto transition-colors cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4" />
                            </svg>
                            Print Receipt instead
                          </button>
                          
                          <button 
                            onClick={() => {
                              setPushStatus({ type: "idle", message: "" });
                              setPhone("");
                            }}
                            className="mt-4 text-sm text-slate-400 hover:text-slate-600 font-semibold cursor-pointer underline block w-full text-center"
                          >
                            Done
                          </button>
                        </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-2xl font-bold tracking-tight">Support the ministry</h3>
                      <p className="mt-1.5 text-sm text-white/55">
                        Give by M-Pesa. Choose an amount, enter your number and approve the prompt on your phone.
                      </p>

                      {pushStatus.type !== "idle" && (
                        <div
                          id="mpesa-error-container"
                          role={pushStatus.type === "error" ? "alert" : "status"}
                          className="mt-6 flex items-start gap-3 rounded-xl border border-white/10 p-4 text-sm leading-relaxed"
                          style={pushStatus.type === "error" ? { borderColor: "var(--fill-accent)", color: "var(--hue-accent)" } : undefined}
                        >
                          {pushStatus.type === "loading" ? (
                            <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
                          ) : (
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                          )}
                          <span>{pushStatus.message}</span>
                        </div>
                      )}

                      <form onSubmit={handleStkPushSubmit} className="mt-7 space-y-6">
                        <fieldset>
                          <legend className={label}>Amount (KES)</legend>
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                            {["200", "500", "1000", "2500"].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                aria-pressed={amount === preset}
                                onClick={() => { setAmount(preset); setCustomAmount(""); }}
                                className={`rounded-xl border py-3 text-sm font-bold tabular-nums transition ${
                                  amount === preset ? "border-transparent text-white" : "border-white/15 text-white/70 hover:border-white/40"
                                }`}
                                style={amount === preset ? { background: "var(--fill-primary)" } : undefined}
                              >
                                {Number(preset).toLocaleString()}
                              </button>
                            ))}
                            <button
                              type="button"
                              aria-pressed={amount === "custom"}
                              onClick={() => setAmount("custom")}
                              className={`col-span-2 rounded-xl border py-3 text-sm font-bold transition sm:col-span-1 ${
                                amount === "custom" ? "border-transparent text-white" : "border-white/15 text-white/70 hover:border-white/40"
                              }`}
                              style={amount === "custom" ? { background: "var(--fill-primary)" } : undefined}
                            >
                              Other
                            </button>
                          </div>
                          {amount === "custom" && (
                            <div className="relative mt-3">
                              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-white/50">KES</span>
                              <input type="number" inputMode="numeric" required min={1} value={customAmount} onChange={(e) => setCustomAmount(e.target.value)} className={`${field} !pl-14`} placeholder="Enter amount" aria-label="Custom amount in KES" />
                            </div>
                          )}
                        </fieldset>

                        <div>
                          <label htmlFor="mpesa-phone" className={label}>M-Pesa phone number</label>
                          <div className="flex overflow-hidden rounded-xl border border-white/15 transition focus-within:border-[color:var(--fill-primary)] focus-within:ring-2 focus-within:ring-[color:var(--fill-primary)]/25">
                            <span className="flex items-center gap-2 border-r border-white/15 px-4 text-sm font-semibold text-white/60">
                              <Smartphone className="h-4 w-4" aria-hidden="true" /> +254
                            </span>
                            <input id="mpesa-phone" type="tel" inputMode="tel" autoComplete="tel-national" required value={phone} onChange={(e) => setPhone(e.target.value)} className="min-w-0 flex-1 bg-transparent px-4 py-3 text-[15px] text-white outline-none placeholder:text-white/35" placeholder="712 345 678" />
                          </div>
                        </div>

                        <button type="submit" disabled={isPushing} className="btn-solid fill-accent w-full !py-4 disabled:opacity-60">
                          {isPushing ? (
                            <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Waiting for M-Pesa…</>
                          ) : (
                            <>Give KES {finalAmount ? Number(finalAmount).toLocaleString() || finalAmount : "0"} <ArrowRight className="h-4 w-4" aria-hidden="true" /></>
                          )}
                        </button>
                        <p className="flex items-center justify-center gap-2 text-xs text-white/45">
                          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                          You approve on your own phone. We never see your M-Pesa PIN.
                        </p>
                      </form>

                      {/* Pay directly */}
                      <div className="mt-8 rounded-2xl border border-white/10 p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-white/55">
                              Prefer to pay directly? {mpesaConfig.tillType === "paybill" ? "Paybill number" : "Buy Goods till"}
                            </p>
                            <p className="mt-1 select-all font-display text-3xl font-bold tracking-wider">{mpesaConfig.tillNumber}</p>
                            <p className="mt-0.5 truncate text-sm text-white/55">{mpesaConfig.tillName}</p>
                          </div>
                          <button type="button" onClick={handleCopyTill} className="btn-outline shrink-0 !px-4 !py-2.5 !text-sm" aria-label="Copy till number">
                            {tillCopied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
                            {tillCopied ? "Copied" : "Copy"}
                          </button>
                        </div>
                        <button type="button" onClick={() => setShowPosterModal(true)} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white/65 underline decoration-white/25 underline-offset-4 hover:text-white">
                          <Eye className="h-4 w-4" aria-hidden="true" />
                          {mpesaConfig.tillImage ? "View till poster" : "How to pay manually"}
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Fullscreen Lightbox Media Preview Modal */}
      <AnimatePresence>
        {showPosterModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 md:p-12"
          >
            <button 
              type="button"
              onClick={() => setShowPosterModal(false)}
              className="absolute top-6 right-6 bg-slate-900 hover:bg-slate-800 text-white p-3 rounded-full border border-slate-800 transition-colors z-50 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <motion.div 
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-6 md:p-8 relative"
            >
              {mpesaConfig.tillImage ? (
                /* Maximize custom poster image */
                <div className="flex flex-col items-center gap-4">
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 w-full flex items-center justify-center" style={{ maxHeight: '72vh' }}>
                    <img src={mpesaConfig.tillImage} alt="Fullscreen M-Pesa Merchant Poster" className="max-h-[64vh] max-w-full object-contain" />
                  </div>
                  <div className="text-center">
                    <h4 className="font-sans font-bold text-base text-white">{mpesaConfig.tillName}</h4>
                    <p className="font-mono text-xs text-slate-450 mt-1 uppercase tracking-widest">
                      {mpesaConfig.tillType === "paybill" ? `Paybill No: ${mpesaConfig.tillNumber}` : `Till Number: ${mpesaConfig.tillNumber}`}
                    </p>
                  </div>
                </div>
              ) : (
                /* Full sized beautiful Lipa Na M-Pesa display sticker poster */
                <div className="bg-white text-slate-900 border-4 border-emerald-600 rounded-xl p-8 shadow-2xl text-center select-none font-sans">
                  <div className="flex justify-center mb-6">
                    <div className="bg-emerald-600 text-white font-extrabold text-lg px-8 py-2 rounded-full tracking-wider uppercase font-sans">
                      LIPA NA M-PESA
                    </div>
                  </div>
                  
                  <div className="my-8">
                    <p className="text-xs uppercase font-mono tracking-widest text-slate-500 font-bold mb-2">
                      {mpesaConfig.tillType === "paybill" ? "Paybill Business Number" : "Buy Goods Till Number"}
                    </p>
                    <span className="text-5xl md:text-6xl font-black tracking-widest text-emerald-800 font-mono block select-all bg-emerald-50 py-3 rounded-lg border border-emerald-100">
                      {mpesaConfig.tillNumber}
                    </span>
                  </div>

                  <div className="my-6 border-y border-dashed border-slate-200 py-4">
                    <p className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-1">Merchant / Account Name</p>
                    <span className="text-lg md:text-xl font-extrabold text-slate-850 uppercase tracking-wide block">
                      {mpesaConfig.tillName}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 items-center text-left max-w-sm mx-auto bg-slate-50 p-4 rounded-lg border border-slate-100 mt-4">
                    <div className="flex gap-2.5 items-start text-[10px] text-slate-500 leading-normal">
                      <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-700">Manual payment alternative:</p>
                        <p className="mt-0.5">Dial *334# or Open M-Pesa app → Go to Lipa Na M-Pesa → Select {mpesaConfig.tillType === "paybill" ? "Paybill" : "Buy Goods"} → Enter the Till/Business number above.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
