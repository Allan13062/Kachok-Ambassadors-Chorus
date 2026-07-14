import React, { useState, useEffect } from "react";
import { Music, Star, Mic, CheckCircle, CreditCard, Smartphone, Coins, Eye, X, Info, Send, Barcode } from "lucide-react";
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

  const handleAuditionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: "", email: "", voicePart: "Soprano", experience: "" });
    }, 6000);
  };

  const handleStkPushSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;

    setIsPushing(true);
    setPushStatus({
      type: "loading",
      message: "Sending Lipa Na M-Pesa STK Prompt to " + phone + "... Please check your phone keypad."
    });

    const finalAmount = amount === "custom" ? customAmount : amount;
    if (!finalAmount || isNaN(Number(finalAmount)) || Number(finalAmount) <= 0) {
      setPushStatus({
        type: "error",
        message: "Please enter a valid monetary amount."
      });
      setIsPushing(false);
      return;
    }

    try {
      const res = await fetch("/api/mpesa/stkpush", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, amount: finalAmount })
      });
      let data;
      try {
        const text = await res.text();
        try {
          data = JSON.parse(text);
        } catch (e) {
          throw new Error("Invalid JSON: " + text.slice(0, 100));
        }
      } catch (e: any) {
        setPushStatus({
          type: "error",
          message: "Connection failed: " + e.message
        });
        setIsPushing(false);
        return;
      }
      
      if (res.ok && data.success) {
        setPushStatus({
          type: "success",
          message: data.message,
          refNumber: data.checkoutRequestId || `ws_CO_${Date.now().toString().slice(3)}`
        });

        // Loop simulate response when testing in dev/sandbox with mock responses
        if (!data.realApi) {
          setTimeout(() => {
            setPushStatus({
              type: "success",
              message: "✓ Simulated contribution of KES " + finalAmount + " processed successfully! Thank you for supporting Kachamba Chorus!",
              refNumber: data.checkoutRequestId || `ws_CO_${Date.now().toString().slice(3)}`
            });
            setIsPushing(false);
          }, 5000);
        } else {
          setIsPushing(false);
        }
      } else {
        setPushStatus({
          type: "error",
          message: data.error || "Failed to trigger M-pesa billing prompt."
        });
        setIsPushing(false);
      }
    } catch (err: any) {
      setPushStatus({
        type: "error",
        message: "Connection failed: " + err.message
      });
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
    {
      icon: Mic,
      title: "1. Vocal Placement",
      description: "A friendly, private 5-minute audition with our Choir Council. We check your vocal range to find if you fit best as a Soprano, Alto, Tenor, or Bass."
    },
    {
      icon: Music,
      title: "2. Faith Commitment",
      description: "Ambasaddors are disciples first. We match our lifestyles to Seventh-day Adventist standards, holding high Bible values and supportive fellowship."
    },
    {
      icon: Star,
      title: "3. Stand and Ministry",
      description: "Once positioned, you gather weekly for vestry devotionals, dress rehearsals, and embark on countrywide tours spread across conferences."
    }
  ];

  return (
    <section
      id="join"
      className="py-28 px-6 md:px-12 bg-slate-950 text-white relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_60%,rgba(245,158,11,0.04)_0%,transparent_60%)] pointer-events-none" />
      <div className="max-w-6xl mx-auto relative">

        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-6 h-px bg-amber-400/50" />
            <span className="label-caps text-amber-400/70 text-[11px]">Lift Your Voice · Support Our Mission</span>
            <div className="w-6 h-px bg-amber-400/50" />
          </div>
          <h2 className="font-display font-bold text-4xl md:text-6xl text-white tracking-tight leading-none mb-3">
            Participate &<br /><span className="text-white/25 font-light">Elevate</span>
          </h2>
          <p className="text-white/40 text-sm font-light max-w-md mx-auto leading-relaxed">
            Help Kachamba Chorus further the Gospel cause.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Block: Steps */}
          <div className="print-hidden lg:col-span-5">
            <div className="flex flex-col gap-4">
              {steps.map((step, idx) => (
                <div key={idx} className="flex gap-4 glass rounded-2xl p-5">
                  <div className="w-10 h-10 glass rounded-xl flex items-center justify-center flex-shrink-0">
                    <step.icon className="w-4 h-4 text-amber-400/70" />
                  </div>
                  <div>
                    <h4 className="font-display font-semibold text-sm text-white mb-1">{step.title}</h4>
                    <p className="text-white/40 text-xs leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Block: Tabs */}
          <div className="lg:col-span-7 glass rounded-2xl p-6 md:p-8 relative overflow-hidden">
            
            {/* Tab switch controller */}
            <div className="print-hidden flex glass p-1 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => { setActiveTab("audition"); setPushStatus({ type: "idle", message: "" }); }}
                className={`flex-1 py-2.5 rounded-lg label-caps text-[11px] transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === "audition"
                    ? "bg-amber-400 text-slate-950 font-semibold shadow-md"
                    : "text-white/45 hover:text-white"
                }`}
              >
                <Mic className="w-3 h-3" />
                Audition
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("mpesa")}
                className={`flex-1 py-2.5 rounded-lg label-caps text-[11px] transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === "mpesa"
                    ? "bg-amber-400 text-slate-950 font-semibold shadow-md"
                    : "text-white/45 hover:text-white"
                }`}
              >
                <CreditCard className="w-3 h-3" />
                M-Pesa Contribute
              </button>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === "audition" ? (
                /* Tab 1: Apply to Audition */
                <motion.div
                  key="audition-tab"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="mb-6">
                    <h3 className="font-sans font-bold text-xl text-white">Join the Chorus</h3>
                    <p className="font-sans text-xs text-slate-400 mt-1">
                      Fill in your details, and our choir director will contact you soon.
                    </p>
                  </div>

                  {submitted ? (
                    <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 p-6 rounded-xl text-center flex flex-col items-center justify-center gap-3">
                      <CheckCircle className="w-10 h-10 text-emerald-400 animate-bounce" />
                      <h4 className="font-sans font-bold text-lg text-white">Application Received!</h4>
                      <p className="font-sans text-xs leading-relaxed max-w-xs">
                        Praise God! We have recorded your interest in the **{formData.voicePart}** part. Our Choir secretary will reach out shortly to guide you on our meetings.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleAuditionSubmit} className="flex flex-col gap-4 text-sm">
                      <div>
                        <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase tracking-wide">Full Name</label>
                        <input 
                          type="text" 
                          required
                          value={formData.name || ""}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 outline-none font-sans text-sm focus:ring-1 focus:ring-amber-500/20 text-white transition-all"
                          placeholder="Your official name"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase tracking-wide">Email Address</label>
                        <input 
                          type="email" 
                          required
                          value={formData.email || ""}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 outline-none font-sans text-sm focus:ring-1 focus:ring-amber-500/20 text-white transition-all"
                          placeholder="yourname@gmail.com"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase tracking-wide">Vocal Part Preference</label>
                        <select 
                          value={formData.voicePart || ""}
                          onChange={(e) => setFormData({ ...formData, voicePart: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 outline-none font-sans text-sm text-white focus:ring-1 focus:ring-amber-500/20 cursor-pointer transition-all"
                        >
                          <option value="Soprano">Soprano (High range girls)</option>
                          <option value="Alto">Alto (Mid/Deep range girls)</option>
                          <option value="Tenor">Tenor (High range boys)</option>
                          <option value="Bass">Bass (Deep range boys)</option>
                          <option value="Unsure">Not sure (Auditoner will place you)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase tracking-wide">Musical Experience (Optional)</label>
                        <textarea 
                          value={formData.experience || ""}
                          onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                          rows={3}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 outline-none font-sans text-sm focus:ring-1 focus:ring-amber-500/20 text-white transition-all resize-none"
                          placeholder="Tell us if you have sung in other SDA choruses or read sheet music..."
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-sans font-bold py-3 px-6 rounded-xl shadow-lg transition-all cursor-pointer mt-2"
                      >
                        Submit Audition Application
                      </button>
                    </form>
                  )}

                  <div className="mt-4 text-center">
                    <p className="font-mono text-[10px] text-slate-500">
                      Weekly Rehearsals: Sabbath Day (Saturdays) @ Kachok Church
                    </p>
                  </div>
                </motion.div>
              ) : (
                /* Tab 2: Send M-Pesa Contribution */
                <motion.div
                  key="mpesa-tab"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.25 }}
                >
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
                                  <p className={`${mpesaConfig.receiptBodySize || 'text-sm'} ${mpesaConfig.receiptBodyColor || 'text-slate-500'}`}>Payment Successful</p>
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
                      <div className="mb-5">
                        <h3 className="font-sans font-bold text-xl text-white">Support the Ministry</h3>
                        <p className="font-sans text-xs text-slate-400 mt-1">
                          Support us via Lipa Na M-Pesa. Choose an amount, enter your phone, and complete the STK prompt on your screen.
                        </p>
                      </div>

                      {pushStatus.type !== "idle" && (
                        <div id="mpesa-error-container" className={`p-4 rounded-xl text-xs mb-5 border leading-relaxed font-sans ${
                          pushStatus.type === "loading" 
                            ? "bg-amber-500/10 border-amber-500/20 text-amber-300 animate-pulse" 
                            : "bg-red-500/10 border-red-500/20 text-red-400"
                        }`}>
                          <div className="flex gap-2 items-start">
                            {pushStatus.type === "loading" && <div className="w-3.5 h-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin shrink-0 mt-0.5" />}
                            {pushStatus.type === "error" && <span className="text-red-400 shrink-0">⚠</span>}
                            <span>{pushStatus.message}</span>
                          </div>
                        </div>
                      )}

                      <form onSubmit={handleStkPushSubmit} className="flex flex-col gap-4 text-sm font-sans mb-6">
                        {/* Phone field */}
                        <div>
                          <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase tracking-wide flex items-center gap-1">
                            <Smartphone className="w-3.5 h-3.5 text-amber-500" />
                            M-Pesa Phone Number
                          </label>
                          <div className="flex bg-slate-950 border border-slate-800 rounded-lg overflow-hidden focus-within:border-amber-500 transition-all focus-within:ring-1 focus-within:ring-amber-500/20">
                            <div className="bg-slate-900 px-3.5 py-2.5 font-mono text-sm text-slate-400 border-r border-slate-800 flex items-center select-none">
                              🇰🇪 +254
                            </div>
                            <input 
                              type="text" 
                              required
                              value={phone || ""}
                              onChange={(e) => setPhone(e.target.value)}
                              className="flex-1 bg-transparent p-2.5 outline-none font-mono text-sm text-white"
                              placeholder="712345678"
                            />
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1 leading-normal font-sans">
                            Enter your Safaricom mobile number (e.g. 0712345678 or 712345678)
                          </p>
                        </div>

                        {/* Amount selectors */}
                        <div>
                          <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase tracking-wide flex items-center gap-1">
                            <Coins className="w-3.5 h-3.5 text-amber-500" />
                            Select Amount (KES)
                          </label>
                          <div className="grid grid-cols-4 gap-2 mb-3">
                            {["200", "500", "1000", "2500"].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => {
                                  setAmount(preset);
                                  setCustomAmount("");
                                }}
                                className={`py-2 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
                                  amount === preset 
                                    ? "bg-amber-500 text-slate-950 border-amber-500 font-extrabold shadow" 
                                    : "bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700"
                                }`}
                              >
                                {preset}
                              </button>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={() => setAmount("custom")}
                            className={`w-full py-2.5 rounded-lg text-xs font-sans font-bold border transition-all cursor-pointer ${
                              amount === "custom" 
                                ? "bg-amber-500 text-slate-950 border-amber-500 font-extrabold shadow mb-2" 
                                : "bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 mb-0"
                            }`}
                          >
                            Enter Custom Amount
                          </button>

                          {amount === "custom" && (
                            <div className="relative mt-2">
                              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-slate-450 font-bold text-xs select-none">KES</span>
                              <input 
                                type="number"
                                required
                                min="1"
                                value={customAmount || ""}
                                onChange={(e) => setCustomAmount(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 pl-12 outline-none font-sans text-sm focus:ring-1 focus:ring-amber-500/20 text-white transition-all"
                                placeholder="Type contribution amount..."
                              />
                            </div>
                          )}
                        </div>

                        <button
                          type="submit"
                          disabled={isPushing}
                          className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-sans font-bold py-3 px-6 rounded-xl shadow-lg transition-all cursor-pointer mt-2 flex items-center justify-center gap-2"
                        >
                          {isPushing ? (
                            <>
                              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                              Verifying & Prompting Pin...
                            </>
                          ) : (
                            `Send Lipa Na M-Pesa Prompt (KES ${amount === "custom" ? customAmount || "0" : amount})`
                          )}
                        </button>
                      </form>

                      {/* SECTION: Media Preview of Till */}
                      <div className="border-t border-slate-800 pt-5 mt-5">
                        <p className="block text-xs font-mono text-slate-400 mb-2 uppercase tracking-wide flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-amber-500" />
                          Till Media Poster Preview
                        </p>

                        {mpesaConfig.tillImage ? (
                          /* Loaded custom poster media file */
                          <div 
                            className="relative group cursor-pointer border border-slate-800 rounded-xl overflow-hidden aspect-video shadow-md bg-slate-950 p-2 flex items-center justify-center max-h-52" 
                            onClick={() => setShowPosterModal(true)}
                            title="Click to enlarge M-Pesa sticker"
                          >
                            <img 
                              src={mpesaConfig.tillImage} 
                              alt="Lipa Na M-Pesa Till Poster Detail" 
                              className="max-h-full max-w-full object-contain transition-all group-hover:scale-[1.02] duration-500" 
                            />
                            <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center duration-300 gap-1.5">
                              <Eye className="w-6 h-6 text-amber-400" />
                              <span className="text-[10px] bg-amber-500 text-slate-955 font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                                Click to Expand
                              </span>
                            </div>
                            <div className="absolute bottom-2 left-3 bg-slate-950/85 px-2.5 py-0.5 rounded border border-slate-800 text-[9px] font-mono font-semibold tracking-wider uppercase text-slate-400">
                              Custom Poster
                            </div>
                          </div>
                        ) : (
                          /* Stylistic Realistic Safaricom Terminal card fallback */
                          <div 
                            className="relative group cursor-pointer bg-emerald-50 rounded-xl border-2 border-emerald-500 overflow-hidden text-slate-800 p-4 shadow-lg transition-transform hover:-translate-y-0.5 duration-300 select-none flex flex-col gap-3 font-sans"
                            onClick={() => setShowPosterModal(true)}
                            title="Click to show fullscreen helper modal"
                          >
                            <div className="bg-emerald-600 px-3 py-1 text-[10px] font-bold text-white uppercase tracking-wider flex justify-between items-center rounded">
                              <span>Lipa Na M-Pesa</span>
                              <span className="text-[8px] bg-emerald-800/40 px-1.5 py-0.5 rounded text-emerald-100">by Safaricom</span>
                            </div>
                            <div className="text-center py-2 bg-white/40 rounded-lg">
                              <p className="text-[9px] uppercase font-mono tracking-widest text-slate-500 font-semibold">
                                {mpesaConfig.tillType === "paybill" ? "Paybill Business No:" : "Buy Goods Till No:"}
                              </p>
                              <h4 className="text-3xl font-extrabold tracking-wider text-emerald-800 font-mono select-all">
                                {mpesaConfig.tillNumber}
                              </h4>
                              <p className="text-[11px] text-slate-700 font-bold uppercase mt-1">
                                {mpesaConfig.tillName}
                              </p>
                            </div>
                            <div className="text-[9px] text-slate-500 font-mono border-t border-dashed border-slate-200.5 pt-2 flex justify-between">
                              <span>CHARGES: NONE</span>
                              <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                                🔍 TAP TO EXPAND
                              </span>
                            </div>
                          </div>
                        )}
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
