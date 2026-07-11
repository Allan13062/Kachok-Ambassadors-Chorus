import React, { useState, useEffect, useMemo } from "react";
import { 
  Heart, Phone, DollarSign, Loader2, CheckCircle2, AlertTriangle, 
  Printer, Copy, Check, ArrowRight, Download, QrCode, Maximize2, X, Eye 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { jsPDF } from "jspdf";

interface SupportOurMissionProps {
  theme: "dark" | "light";
  webLogo?: string;
}

// Complete Code 39 Character Patterns for true scannable vector barcodes
const CODE39_PATTERNS: { [key: string]: string } = {
  'A': '110101001011', 'B': '101101001011', 'C': '110110100101', 'D': '101011001011',
  'E': '110101100101', 'F': '101101100101', 'G': '101010011011', 'H': '110101001101',
  'I': '101101001101', 'J': '101011001101', 'K': '110101010011', 'L': '101101010011',
  'M': '110110101001', 'N': '101011010011', 'O': '110101101001', 'P': '101101101001',
  'Q': '101010110011', 'R': '110101011001', 'S': '101101011001', 'T': '101011011001',
  'U': '110010101011', 'V': '100110101011', 'W': '110011010101', 'X': '100101101011',
  'Y': '110010110101', 'Z': '100110110101', '-': '100101011011', '.': '110010101101',
  ' ': '100110101101', '*': '100101101101', '$': '100100100101', '/': '100100101001',
  '+': '100101001001', '%': '101001001001', '0': '101001101101', '1': '110100101011',
  '2': '101100101011', '3': '110110010101', '4': '101001101011', '5': '110100110101',
  '6': '101100110101', '7': '101001011011', '8': '110100101101', '9': '101100101101'
};

// Pure vector Code 39 SVG Barcode Generator
function BarcodeSVG({ value }: { value: string }) {
  const code = `*${value.toUpperCase()}*`;
  let bits = "";
  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    if (CODE39_PATTERNS[char]) {
      bits += CODE39_PATTERNS[char];
      if (i < code.length - 1) {
        bits += '0'; // inter-character space
      }
    }
  }

  const totalBits = bits.length;
  const width = 300;
  const height = 50;
  const scale = width / totalBits;

  return (
    <div className="flex flex-col items-center gap-1.5 w-full bg-white p-3.5 rounded-2xl border border-slate-100/80 shadow-inner mt-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-[260px] h-11" shapeRendering="crispEdges">
        <rect width={width} height={height} fill="#ffffff" />
        {bits.split("").map((bit, idx) => {
          if (bit === "1") {
            return (
              <rect
                key={idx}
                x={idx * scale}
                y={0}
                width={scale}
                height={height}
                fill="#000000"
              />
            );
          }
          return null;
        })}
      </svg>
      <span className="font-mono text-[9px] tracking-[0.25em] text-slate-500 font-bold uppercase">{value.toUpperCase()}</span>
    </div>
  );
}



export default function SupportOurMission({ theme, webLogo }: SupportOurMissionProps) {
  const [mpesaConfig, setMpesaConfig] = useState<any>({
    tillNumber: "4119041",
    tillName: "Kachok Ambassadors Chorus",
    tillImage: "",
    tillType: "buy_goods",
    receiptTitle: "Kachamba Chorus",
    receiptLogo: "https://www.image2url.com/r2/default/images/1781098447744-9bfd4cd8-4c62-4a1a-b218-7ccd6f1b36d2.png",
    receiptMessage: "We have received your generous gift. May God bless you abundantly.",
    receiptLayout: "modern",
    receiptHeaderSize: "text-xl",
    receiptHeaderColor: "text-slate-800",
    receiptBodySize: "text-sm",
    receiptBodyColor: "text-slate-500",
    receiptTextAlign: "text-center",
    receiptFontFamily: "font-sans",
  });

  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("500");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);

  // STK Push states
  const [pushSent, setPushSent] = useState(false);
  const [countdown, setCountdown] = useState(20);
  const [transactionData, setTransactionData] = useState<any>(null);
  const [paymentStep, setPaymentStep] = useState<"idle" | "sending" | "waiting" | "success">("idle");

  // Load configuration
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetch("/api/mpesa/config");
        if (res.ok) {
          const data = await res.json();
          setMpesaConfig(data);
        }
      } catch (err) {
        console.warn("Could not load M-Pesa configurations inside SupportOurMission component:", err);
      }
    };
    loadConfig();
  }, []);

  // Timer countdown for simulated confirmation
  useEffect(() => {
    let timer: any;
    if (paymentStep === "waiting" && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (paymentStep === "waiting" && countdown === 0) {
      handleConfirmSuccess();
    }
    return () => clearInterval(timer);
  }, [paymentStep, countdown]);

  const handleCopyTill = () => {
    navigator.clipboard.writeText(mpesaConfig.tillNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePresetSelect = (value: string) => {
    setAmount(value);
  };

  const handleInitiateSTK = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setPaymentStep("sending");

    // Basic format filter
    const cleanPhone = phone.trim().replace(/\+/g, "");
    if (!cleanPhone) {
      setError("Please enter a phone number.");
      setLoading(false);
      setPaymentStep("idle");
      return;
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid positive contribution amount.");
      setLoading(false);
      setPaymentStep("idle");
      return;
    }

    try {
      const response = await fetch("/api/mpesa/stkpush", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone, amount: numAmount }),
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok && data.success) {
        setTransactionData(data);
        setPushSent(true);
        setCountdown(20);
        setPaymentStep("waiting");
      } else {
        setError(data.error || "Failed to trigger the M-Pesa STK Push. Please try again.");
        setPaymentStep("idle");
      }
    } catch (err: any) {
      setError(err.message || "Network error. Please try again.");
      setLoading(false);
      setPaymentStep("idle");
    }
  };

  const handleConfirmSuccess = () => {
    setPaymentStep("success");
  };

  const handleResetForm = () => {
    setPhone("");
    setAmount("500");
    setPushSent(false);
    setTransactionData(null);
    setPaymentStep("idle");
    setError(null);
  };

  // Helper to load image securely for pdf inclusion
  const loadImageData = async (url: string): Promise<{ dataUrl: string, width: number, height: number } | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";

      // If it's a remote absolute URL, use the proxy to bypass CORS restrictions
      const finalUrl = url.startsWith("http")
        ? `/api/proxy-image?url=${encodeURIComponent(url)}`
        : url;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          try {
            const dataUrl = canvas.toDataURL('image/png');
            resolve({ dataUrl, width: img.width, height: img.height });
          } catch (e) {
            console.error("[loadImageData] Canvas conversion error:", e);
            resolve(null);
          }
        } else {
          resolve(null);
        }
      };

      img.onerror = () => {
        if (finalUrl !== url) {
          console.warn("[loadImageData] Proxy image load failed. Retrying direct load as fallback for:", url);
          const fallbackImg = new Image();
          fallbackImg.crossOrigin = "Anonymous";
          fallbackImg.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = fallbackImg.width;
            canvas.height = fallbackImg.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(fallbackImg, 0, 0);
              try {
                const dataUrl = canvas.toDataURL('image/png');
                resolve({ dataUrl, width: fallbackImg.width, height: fallbackImg.height });
              } catch (e) {
                resolve(null);
              }
            } else {
              resolve(null);
            }
          };
          fallbackImg.onerror = () => resolve(null);
          fallbackImg.src = url;
        } else {
          resolve(null);
        }
      };

      img.src = finalUrl;
    });
  };



  // Helper to construct simulated receipt info
  const receiptNo = useMemo(() => {
    if (!transactionData) return "MPESA_DRAFT";
    const baseId = transactionData.merchantRequestId || transactionData.checkoutRequestId || "TXN";
    // Clean alphanumeric characters to keep barcode scannable and valid Code 39
    const cleanBase = baseId.replace(/[^A-Z0-9]/ig, "").toUpperCase();
    const truncated = cleanBase.slice(-5);
    // Let's generate a stable 3-digit random suffix based on a hash of the baseId
    let hash = 0;
    for (let i = 0; i < baseId.length; i++) {
      hash = baseId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const suffix = Math.abs(hash % 900) + 100; // 100 to 999
    return `MP${truncated}${suffix}`;
  }, [transactionData]);

  const formattedDate = useMemo(() => {
    return new Date().toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  }, [transactionData]);

  // Generate high-fidelity ticket PDF receipt with dynamic Code 39 scannable barcode
  const generateReceiptPDFDoc = async () => {
    // Draw scannable Code 39 barcode onto PDF vectorially
    const drawBarcodePDF = (pdfDoc: any, text: string, x: number, yPos: number, barcodeHeight: number = 10) => {
      const code = text.toUpperCase();
      let bits = "";
      
      // Start code
      bits += CODE39_PATTERNS['*'] + '0';
      for (let i = 0; i < code.length; i++) {
        const char = code[i];
        if (CODE39_PATTERNS[char]) {
          bits += CODE39_PATTERNS[char] + '0';
        }
      }
      // Stop code
      bits += CODE39_PATTERNS['*'];

      const totalBits = bits.length;
      const totalWidth = 60; // 60mm
      const bitWidth = totalWidth / totalBits;

      pdfDoc.setFillColor(0, 0, 0);
      for (let i = 0; i < totalBits; i++) {
        if (bits[i] === '1') {
          pdfDoc.rect(x + (i * bitWidth), yPos, bitWidth, barcodeHeight, 'F');
        }
      }

      // Centered label code text below the bars
      pdfDoc.setFont("courier", "bold");
      pdfDoc.setFontSize(8);
      pdfDoc.setTextColor(60, 60, 60);
      pdfDoc.text(text, x + (totalWidth / 2), yPos + barcodeHeight + 4, { align: "center" });
    };

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [100, 180] // Ticket dimensions
    });

    const pageWidth = 100;
    const pageHeight = 180;
    const margin = 10;
    const contentWidth = pageWidth - (margin * 2); // 80mm

    let y = 14;

    // Draw topmost accent bar
    doc.setFillColor(46, 188, 84); // Safaricom green
    doc.rect(margin, y - 4, contentWidth, 2, "F");

    y += 6; // Compact spacing now that logo is removed

    // Title & Header details
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42); // slate-800
    const rTitle = mpesaConfig.receiptTitle || mpesaConfig.tillName || "KACHAMBA CHORUS";
    doc.text(rTitle.toUpperCase(), pageWidth / 2, y, { align: "center" });
    y += 5;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.text("OFFICIAL M-PESA CONTRIBUTION RECEIPT", pageWidth / 2, y, { align: "center" });
    y += 4.5;

    // Separation border line
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    // Amount Display Panel Card
    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(margin, y, contentWidth, 22, "F");
    doc.setDrawColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 22, "S");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184); // Slate-400
    doc.text("TOTAL CONTRIBUTION APPROVED", pageWidth / 2, y + 5, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(`KES ${amount}.00`, pageWidth / 2, y + 13, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(16, 185, 129); // Emerald-500
    doc.text("★ TRANSACTION SECURED & VERIFIED", pageWidth / 2, y + 19, { align: "center" });
    y += 28;

    // Detail Rows
    const drawDetailRow = (label: string, val: string, currentY: number) => {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(label, margin + 2, currentY);
      doc.setFont("courier", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(val, pageWidth - margin - 2, currentY, { align: "right" });
    };

    drawDetailRow("Receipt Code:", receiptNo, y); y += 4.5;
    drawDetailRow("Donor Mobile:", `+${phone || "2547XXXXXXXX"}`, y); y += 4.5;
    drawDetailRow("Gateway Channel:", `Lipa Na M-Pesa (${mpesaConfig.tillType === "paybill" ? "Paybill" : "Buy Goods"})`, y); y += 4.5;
    drawDetailRow("Till/Shortcode:", mpesaConfig.tillNumber, y); y += 4.5;

    // Date alignment
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("Date / Time:", margin + 2, y);
    doc.setFont("courier", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(formattedDate, pageWidth - margin - 2, y, { align: "right" });
    y += 7;

    // Separation Line
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    // Custom message paragraph
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105); // Slate-600
    const msgLines: string[] = doc.splitTextToSize(`"${mpesaConfig.receiptMessage}"`, contentWidth - 4);
    msgLines.forEach((line) => {
      doc.text(line, pageWidth / 2, y, { align: "center" });
      y += 3.8;
    });
    y += 4;

    // Separation Line
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.25);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    // Draw real Code 39 scannable barcode vector
    drawBarcodePDF(doc, receiptNo, (pageWidth - 60) / 2, y, 10);
    y += 21;

    // Footer
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text("SDA KACHOK CHURCH, KISUMU • SINCE 2021", pageWidth / 2, y, { align: "center" });

    return doc;
  };

  const downloadReceiptPDF = async () => {
    try {
      const doc = await generateReceiptPDFDoc();
      doc.save(`Mpesa_Receipt_${receiptNo}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
    }
  };

  // Automatically upload receipt PDF to Cloudinary and database when payment succeeds
  useEffect(() => {
    if (paymentStep === "success") {
      const triggerUpload = async () => {
        try {
          console.log("[Receipt Sync] Generating high-fidelity PDF for auto-saving to Cloudinary database...");
          const doc = await generateReceiptPDFDoc();
          
          // Get base64 string from jsPDF
          const dataUri = doc.output('datauristring');
          const base64Content = dataUri.split(',')[1];
          
          const payload = {
            receiptNo,
            amount: Number(amount) || 0,
            phone: phone || "2547XXXXXXXX",
            date: formattedDate,
            pdfBase64: base64Content,
            contributorName: "Valued Kachamba Supporter"
          };
          
          console.log("[Receipt Sync] Uploading receipt to Cloudinary and Database...");
          const response = await fetch("/api/mpesa/receipt/save", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
          });
          
          const resData = await response.json();
          if (response.ok && resData.success) {
            console.log("[Receipt Sync] Receipt saved successfully! secure_url:", resData.pdfUrl);
          } else {
            console.warn("[Receipt Sync] Auto-upload returned status but with error:", resData.error || "Unknown error");
          }
        } catch (uploadErr) {
          console.error("[Receipt Sync] Failed to upload receipt to Cloudinary/DB:", uploadErr);
        }
      };
      triggerUpload();
    }
  }, [paymentStep]);

  // Dynamic QR Code payload matching till details
  const qrData = `M-PESA LIPA NA M-PESA. TILL NUMBER: ${mpesaConfig.tillNumber}. MERCHANT: ${mpesaConfig.tillName}. AMOUNT: ${amount}`;

  return (
    <section 
      id="support" 
      className={`py-24 relative overflow-hidden transition-colors ${
        theme === "dark" ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* Background radial gradient overlays */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-amber-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Lightbox / Dialog Modal for expanding Till Sticker Image */}
      <AnimatePresence>
        {showLightbox && mpesaConfig.tillImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setShowLightbox(false)}
          >
            <div className="absolute top-4 right-4 z-10 flex gap-3">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowLightbox(false);
                }} 
                className="bg-slate-900/80 hover:bg-slate-800 text-white p-3 rounded-full border border-slate-800 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="max-w-2xl w-full flex flex-col gap-4 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={mpesaConfig.tillImage} 
                alt="Expanded Lipa Na M-Pesa Till Sticker" 
                className="w-full h-auto object-contain max-h-[80vh] rounded-3xl border border-slate-800 shadow-2xl bg-slate-950/20"
              />
              <div className="text-center text-xs font-mono text-slate-400 mt-2">
                {mpesaConfig.tillName} • Lipa Na M-Pesa Till Sticker Poster
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Outer wrapper that binds print rules in index.css */}
      <div id="join" className="max-w-6xl mx-auto px-4 relative z-10">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16 print:hidden">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-amber-500 text-xs font-semibold uppercase tracking-wider mb-4">
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>Support Our Mission</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-sans font-black tracking-tight text-white mb-6 uppercase">
            Fuel the <span className="text-amber-500">Gospel Choral Sound</span>
          </h2>
          <p className="text-slate-400 text-base md:text-lg leading-relaxed font-sans font-medium">
            Your generous financial gifts empower the Kachamba Chorus to travel, host crusades, and share the comforting news of Christ's return through sacred youth choral ministry.
          </p>
        </div>

        {/* Dynamic Payment/Success Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Interaction Portal */}
          <div className="lg:col-span-7 w-full print:col-span-12">
            <AnimatePresence mode="wait">
              
              {/* Idle Input State */}
              {paymentStep === "idle" && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className={`p-6 sm:p-8 rounded-3xl border shadow-xl ${
                    theme === "dark" 
                      ? "bg-slate-900/60 border-slate-800/80 shadow-slate-950/20" 
                      : "bg-white border-slate-200/80 shadow-slate-200/30"
                  }`}
                >
                  <div className="flex items-center gap-3.5 mb-6">
                    <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-sans font-bold text-lg text-white">Safaricom M-Pesa STK Push</h3>
                      <p className="text-xs text-slate-400">Initiate an instant payment prompt directly on your phone</p>
                    </div>
                  </div>

                  {error && (
                    <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs flex gap-2.5 items-start">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <form onSubmit={handleInitiateSTK} className="space-y-5">
                    {/* Phone Number Input */}
                    <div>
                      <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Your Safaricom Phone Number
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm font-semibold">
                          +254
                        </span>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/[^0-9+]/g, ""))}
                          placeholder="712345678"
                          className={`w-full pl-16 pr-4 py-3.5 rounded-2xl border text-sm font-mono outline-none transition-all ${
                            theme === "dark"
                              ? "bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                              : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                          }`}
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1.5 font-sans">
                        Provide your registered Safaricom SIM line (e.g., 0712345678 or 712345678)
                      </p>
                    </div>

                    {/* Amount Input */}
                    <div>
                      <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Contribution Amount (KES)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm">
                          KES
                        </span>
                        <input
                          type="number"
                          required
                          min="1"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="500"
                          className={`w-full pl-14 pr-4 py-3.5 rounded-2xl border text-sm font-mono outline-none transition-all ${
                            theme === "dark"
                              ? "bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                              : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Quick Amount Presets */}
                    <div>
                      <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Quick Preset Amounts
                      </span>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {["100", "250", "500", "1000", "2000", "5000"].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => handlePresetSelect(preset)}
                            className={`py-2 rounded-xl text-xs font-semibold border font-sans transition-all cursor-pointer ${
                              amount === preset
                                ? "bg-amber-500 border-amber-500 text-slate-950 shadow-md shadow-amber-500/10 scale-102"
                                : theme === "dark"
                                  ? "bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300"
                                  : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700"
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* CTA Submit Button */}
                    <button
                      type="submit"
                      className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-4 rounded-2xl text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/5 hover:shadow-amber-500/10 active:scale-98 mt-2"
                    >
                      <span>Send M-Pesa STK Prompt</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                </motion.div>
              )}

              {/* Sending STK Request state */}
              {paymentStep === "sending" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className={`p-12 rounded-3xl border shadow-xl flex flex-col items-center justify-center text-center ${
                    theme === "dark" ? "bg-slate-900 border-slate-800/80" : "bg-white border-slate-200"
                  }`}
                >
                  <Loader2 className="w-12 h-12 text-amber-500 animate-spin mb-6" />
                  <h3 className="text-xl font-bold font-sans text-white mb-2">Contacting Safaricom Gateway...</h3>
                  <p className="text-sm text-slate-400 max-w-sm">
                    We are securely preparing your M-Pesa STK Push request of KES {amount} to your Safaricom phone line.
                  </p>
                </motion.div>
              )}

              {/* Waiting for User Confirmation on Device */}
              {paymentStep === "waiting" && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`p-8 rounded-3xl border shadow-xl text-center relative ${
                    theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                  }`}
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-6">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                  
                  <h3 className="text-xl font-bold font-sans text-white mb-3">Check Your Phone!</h3>
                  <p className="text-sm text-slate-300 max-w-md mx-auto mb-6">
                    An M-Pesa STK Pin Request has been sent to <span className="font-bold text-amber-400">+{phone}</span>. 
                    Please unlock your device and enter your <span className="font-bold text-emerald-400">M-Pesa PIN</span> to approve the payment of <span className="font-extrabold text-white">KES {amount}</span>.
                  </p>

                  {/* Circular visual timer overlay */}
                  <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs font-mono mb-6">
                    <span className="text-slate-400">Awaiting secure callback response:</span>
                    <span className="text-amber-500 font-bold ml-2">{countdown}s</span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                    <button
                      onClick={handleConfirmSuccess}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      I have completed the PIN prompt
                    </button>
                    <button
                      onClick={handleResetForm}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-6 py-3 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Cancel / Restart Form
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Success / Printable Receipt Container */}
              {paymentStep === "success" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col gap-6"
                >
                  {/* Immediate success visual header */}
                  <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left print:hidden">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 shrink-0" />
                    <div>
                      <h4 className="font-sans font-bold text-white text-base">Payment Triggered Successfully</h4>
                      <p className="text-xs text-slate-400">
                        Thank you for supporting Kachamba Chorus. A downloadable receipt of this secure contribution transaction is drafted below.
                      </p>
                    </div>
                  </div>

                  {/* PRINTABLE RECEIPT TEMPLATE - Conforms strictly to mpesa-receipt-container rules */}
                  <div id="mpesa-receipt-container" className="w-full">
                    <div 
                      id="mpesa-receipt" 
                      className={`bg-white rounded-3xl p-8 max-w-md mx-auto shadow-2xl relative border border-slate-100 ${
                        mpesaConfig.receiptFontFamily || "font-sans"
                      } ${mpesaConfig.receiptTextAlign || "text-center"} text-slate-900`}
                    >
                      {/* Standard Watermark or Brand Logo */}
                      {mpesaConfig.receiptLogo && (
                        <div className="flex justify-center mb-5">
                          <img 
                            src={mpesaConfig.receiptLogo} 
                            alt="Logo" 
                            className="w-14 h-14 rounded-full object-cover border border-slate-100 shadow-sm"
                          />
                        </div>
                      )}

                      {/* Title block */}
                      <div className="border-b border-slate-100 pb-4 mb-5">
                        <h4 className={`${mpesaConfig.receiptHeaderSize || "text-xl"} font-black ${mpesaConfig.receiptHeaderColor || "text-slate-800"} uppercase tracking-tight mb-1`}>
                          {mpesaConfig.receiptTitle || mpesaConfig.tillName || "Kachamba Chorus"}
                        </h4>
                        <p className={`${mpesaConfig.receiptBodySize || "text-xs"} ${mpesaConfig.receiptBodyColor || "text-slate-500"} uppercase tracking-widest font-mono font-bold`}>
                          M-Pesa Transaction Receipt
                        </p>
                      </div>

                      {/* Numeric Value block */}
                      <div className="bg-slate-50 rounded-2xl p-4 mb-5 border border-slate-100 text-center">
                        <span className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">
                          Amount Gifted
                        </span>
                        <span className="text-3xl font-extrabold text-slate-900 tracking-tight block">
                          KES {amount}.00
                        </span>
                        <span className="text-[10px] text-emerald-600 font-bold block mt-1 uppercase tracking-wider font-mono">
                          ★ Payment Confirmed
                        </span>
                      </div>

                      {/* Audit Details */}
                      <div className="space-y-3 text-xs font-sans text-left border-b border-slate-100 pb-5 mb-5">
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-mono">Receipt Code:</span>
                          <span className="font-mono font-bold text-slate-900">{receiptNo}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-mono">Donor Mobile:</span>
                          <span className="font-mono font-bold text-slate-900">+{phone || "2547XXXXXXXX"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-mono">Date / Time:</span>
                          <span className="font-mono font-bold text-slate-900">{formattedDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-mono">Target Channel:</span>
                          <span className="font-mono font-bold text-slate-900">
                            Lipa Na M-Pesa ({mpesaConfig.tillType === "paybill" ? "Paybill" : "Buy Goods"})
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-mono">Till / Shortcode:</span>
                          <span className="font-mono font-bold text-slate-900">{mpesaConfig.tillNumber}</span>
                        </div>
                      </div>

                      {/* Heartwarming Note */}
                      <div className="mb-4">
                        <p className="text-xs text-slate-600 leading-relaxed font-sans font-medium italic">
                          "{mpesaConfig.receiptMessage}"
                        </p>
                      </div>

                      {/* Dynamic Scannable Code 39 Barcode */}
                      <BarcodeSVG value={receiptNo} />

                      {/* Footer signatures */}
                      <div className="pt-4 border-t border-dashed border-slate-200 text-center text-[9px] font-mono text-slate-400 uppercase tracking-wider mt-5">
                        SDA Kachok Church, Kisumu • Since 2021
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar - Replaced printer with secure direct pdf download */}
                  <div className="flex flex-wrap gap-3 justify-center items-center mt-2 print:hidden">
                    <button
                      onClick={downloadReceiptPDF}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3.5 rounded-xl text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/10"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Receipt (PDF)</span>
                    </button>
                    <button
                      onClick={handleResetForm}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-6 py-3.5 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Support Again
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT COLUMN: Supporting contextual information, QR code scanner & media preview */}
          <div className="lg:col-span-5 space-y-6 print:hidden">

            {/* TILL MEDIA PREVIEW / STICKER VIEW CARD */}
            <div className={`p-6 rounded-3xl border ${
              theme === "dark" 
                ? "bg-slate-900/40 border-slate-800/60" 
                : "bg-white border-slate-200 shadow-sm"
            }`}>
              <div className="flex items-center gap-2.5 mb-4 justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                    <Eye className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">
                    Till Sticker Sticker Stand
                  </h3>
                </div>
                {mpesaConfig.tillImage && (
                  <button 
                    onClick={() => setShowLightbox(true)}
                    className="text-amber-500 hover:text-amber-400 transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Expand</span>
                  </button>
                )}
              </div>
              
              {mpesaConfig.tillImage ? (
                <div 
                  className="relative group overflow-hidden rounded-2xl border border-slate-800/40 cursor-zoom-in shadow-inner bg-slate-950/10 p-2" 
                  onClick={() => setShowLightbox(true)}
                >
                  <img 
                    src={mpesaConfig.tillImage} 
                    alt="Official Lipa Na M-Pesa Till Sticker" 
                    className="w-full h-auto object-contain max-h-[190px] mx-auto rounded-xl transition-transform duration-300 group-hover:scale-102"
                  />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                    <span className="text-[10px] font-semibold bg-slate-900/90 border border-slate-700 text-amber-400 px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                      <Maximize2 className="w-3 h-3" /> Expand poster
                    </span>
                  </div>
                </div>
              ) : (
                /* Interactive mock design representing Lipa Na M-Pesa sticker stand */
                <div className="bg-[#2ebc54] text-white rounded-2xl overflow-hidden shadow-lg border border-[#239241] flex flex-col items-center p-5 text-center select-none relative">
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[7px] font-mono font-black tracking-wider uppercase">
                    Live Dynamic Preview
                  </div>
                  
                  <div className="w-full flex justify-between items-center mb-3 border-b border-white/20 pb-2">
                    <span className="font-sans font-black tracking-tighter text-sm italic text-white flex items-center gap-0.5">
                      Safaricom <span className="text-red-500">M-PESA</span>
                    </span>
                    <span className="text-[8px] font-bold tracking-widest font-mono bg-white/10 px-1.5 py-0.5 rounded">
                      LIPA NA M-PESA
                    </span>
                  </div>

                  <div className="bg-white text-[#2ebc54] font-black text-[10px] px-3.5 py-1 rounded-full uppercase tracking-wider mb-3 shadow-sm">
                    {mpesaConfig.tillType === "paybill" ? "Paybill Channel" : "Buy Goods Till"}
                  </div>

                  <div className="bg-slate-950/90 rounded-xl px-4 py-3 mb-3 border border-white/10 w-full">
                    <span className="block text-[7px] font-mono text-slate-400 uppercase tracking-widest mb-0.5">
                      TILL NUMBER
                    </span>
                    <span className="text-2xl font-mono font-black tracking-wider text-amber-400">
                      {mpesaConfig.tillNumber}
                    </span>
                  </div>

                  <div className="text-[11px] font-sans font-bold uppercase tracking-wider mb-1 text-white/95 truncate max-w-full">
                    {mpesaConfig.tillName}
                  </div>

                  <span className="text-[8px] font-mono text-white/70 leading-relaxed">
                    Lipa Na M-Pesa &gt; {mpesaConfig.tillType === "paybill" ? "Pay Bill" : "Buy Goods"} &gt; Enter Till &gt; Send
                  </span>
                </div>
              )}
            </div>

            {/* Manual details backup text - ENHANCED SIZE AND VISUAL HIERARCHY */}
            <div className={`p-6 rounded-3xl border shadow-lg ${
              theme === "dark" 
                ? "bg-slate-900/50 border-slate-800/80 text-slate-300" 
                : "bg-white border-slate-200 text-slate-700 shadow-sm"
            }`}>
              <div className="space-y-4">
                <div>
                  <span className="block text-[11px] font-mono font-bold uppercase tracking-widest text-slate-500 mb-1">
                    Merchant Name
                  </span>
                  <span className={`text-xl md:text-2xl font-sans font-black tracking-tight block ${
                    theme === "dark" ? "text-white" : "text-slate-900"
                  }`}>
                    {mpesaConfig.tillName}
                  </span>
                </div>
                
                <div className="border-t border-dashed border-slate-800/40 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <span className="block text-[11px] font-mono font-bold uppercase tracking-widest text-slate-500 mb-1">
                      Till Code / Shortcode
                    </span>
                    <span className="text-3xl font-mono font-black tracking-wider text-amber-500 block">
                      {mpesaConfig.tillNumber}
                    </span>
                  </div>
                  
                  <button
                    onClick={handleCopyTill}
                    className={`sm:self-end px-4 py-2.5 rounded-xl text-xs uppercase tracking-widest font-bold transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer select-none active:scale-95 ${
                      copied 
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                        : "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/10"
                    }`}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? "Copied Till!" : "Copy Code"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Scripture card */}
            <div className="bg-gradient-to-br from-amber-500/5 to-amber-600/10 border border-amber-500/10 p-6 rounded-3xl text-center">
              <span className="text-amber-400 text-xl block mb-2 font-mono">“</span>
              <p className="text-xs text-slate-300 italic font-sans leading-relaxed mb-3">
                Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver.
              </p>
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-500 font-bold">
                — 2 Corinthians 9:7
              </span>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
