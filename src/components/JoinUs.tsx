import React, { useState, useEffect } from "react";
import { Music, Star, Mic, CheckCircle, CreditCard, Smartphone, Coins, Eye, X, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

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
  const [mpesaConfig, setMpesaConfig] = useState({
    tillNumber: "4119041",
    tillName: "Kachok Ambassadors Chorus",
    tillImage: "",
    tillType: "buy_goods"
  });

  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("500");
  const [customAmount, setCustomAmount] = useState("");
  const [isPushing, setIsPushing] = useState(false);
  const [pushStatus, setPushStatus] = useState<{
    type: "idle" | "loading" | "success" | "error";
    message: string;
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
      const data = await res.json();
      if (res.ok && data.success) {
        setPushStatus({
          type: "success",
          message: data.message
        });

        // Loop simulate response when testing in dev/sandbox with mock responses
        if (!data.realApi) {
          setTimeout(() => {
            setPushStatus({
              type: "success",
              message: "✓ Simulated contribution of KES " + finalAmount + " processed successfully! Thank you for supporting Kachamba Chorus ministry!"
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
      className="py-20 px-6 md:px-12 bg-slate-950 text-white relative border-t border-slate-900"
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Block: Information / Promotional details */}
          <div className="print-hidden lg:col-span-6">
            <div className="flex items-center gap-2 text-amber-400 font-mono text-xs tracking-wider uppercase mb-2">
              <span>Lift Your Voice | Support Our Mission</span>
            </div>
            <h2 className="font-sans font-extrabold text-3xl md:text-5xl tracking-tight text-white mb-6">
              Participate & Elevate
            </h2>
            <p className="font-sans text-slate-300 text-sm md:text-base leading-relaxed mb-8 max-w-xl">
              Our ministry relies on voices raised in Adventist acappella praise and the generous contributions of supporters like you. Help Kachamba Chorus travel further, record more tracks, and distribute DVDs and digital music across East Africa.
            </p>

            {/* Audition / Recruitment steps info block */}
            <div className="flex flex-col gap-6 max-w-xl">
              {steps.map((step, idx) => (
                <div key={idx} className="flex gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-900">
                  <div className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg shrink-0 h-fit">
                    <step.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-sans font-bold text-base text-amber-300">{step.title}</h4>
                    <p className="font-sans text-xs md:text-sm text-slate-400 mt-1 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Block: Dynamic Interactive Tabs Application / Payment block */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 relative shadow-2xl overflow-hidden">
            
            {/* Tab switch controller */}
            <div className="print-hidden flex bg-slate-950 p-1 rounded-xl mb-6 border border-slate-800">
              <button 
                type="button"
                onClick={() => {
                  setActiveTab("audition");
                  setPushStatus({ type: "idle", message: "" });
                }}
                className={`flex-1 py-2.5 rounded-lg text-xs font-sans font-bold transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === "audition" 
                    ? "bg-amber-500 text-slate-950 shadow-md" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                Apply to Audition
              </button>
              <button 
                type="button"
                onClick={() => {
                  setActiveTab("mpesa");
                }}
                className={`flex-1 py-2.5 rounded-lg text-xs font-sans font-bold transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === "mpesa" 
                    ? "bg-amber-500 text-slate-950 shadow-md" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                M-Pesa Contribution
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
                      Fill in your details, and our choir director will contact you before next Saturday afternoon's practice.
                    </p>
                  </div>

                  {submitted ? (
                    <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 p-6 rounded-xl text-center flex flex-col items-center justify-center gap-3">
                      <CheckCircle className="w-10 h-10 text-emerald-400 animate-bounce" />
                      <h4 className="font-sans font-bold text-lg text-white">Application Received!</h4>
                      <p className="font-sans text-xs leading-relaxed max-w-xs">
                        Praise God! We have recorded your interest in the **{formData.voicePart}** part. Our Choir secretary will reach out shortly to guide you about Saturday practice audition at Kachok Church.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleAuditionSubmit} className="flex flex-col gap-4 text-sm">
                      <div>
                        <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase tracking-wide">Full Name</label>
                        <input 
                          type="text" 
                          required
                          value={formData.name}
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
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 outline-none font-sans text-sm focus:ring-1 focus:ring-amber-500/20 text-white transition-all"
                          placeholder="yourname@gmail.com"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase tracking-wide">Vocal Part Preference</label>
                        <select 
                          value={formData.voicePart}
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
                          value={formData.experience}
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
                  <div className="mb-5">
                    <h3 className="font-sans font-bold text-xl text-white">Support the Ministry</h3>
                    <p className="font-sans text-xs text-slate-400 mt-1">
                      Support us via Lipa Na M-Pesa. Choose an amount, enter your phone, and complete the STK prompt on your screen.
                    </p>
                  </div>

                  {/* Push feedback status indicators and Receipt Option */}
                  {pushStatus.type !== "idle" && (
                    <div id="mpesa-receipt-container" className={`p-4 rounded-xl text-xs mb-5 border leading-relaxed font-sans ${
                      pushStatus.type === "loading" 
                        ? "bg-amber-500/10 border-amber-500/20 text-amber-300 animate-pulse" 
                        : pushStatus.type === "success" 
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                        : "bg-red-500/10 border-red-500/20 text-red-400"
                    }`}>
                      <div className="flex gap-2 items-start" id="mpesa-receipt">
                        {pushStatus.type === "loading" && <div className="w-3.5 h-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin shrink-0 mt-0.5 print-hidden" />}
                        {pushStatus.type === "success" && <span className="text-emerald-400 shrink-0 print-hidden">✓</span>}
                        {pushStatus.type === "error" && <span className="text-red-400 shrink-0 print-hidden">⚠</span>}
                        <div>
                          <span>{pushStatus.message}</span>
                          {pushStatus.type === "success" && (
                            <div className="mt-4 print-receipt hidden print:block border-t border-emerald-500/30 pt-3">
                              <h4 className="font-bold text-lg text-slate-100 mb-2">Donation Receipt</h4>
                              <p className="text-slate-300"><strong>Amount:</strong> KES {amount === "custom" ? customAmount : amount}</p>
                              <p className="text-slate-300"><strong>Phone:</strong> +254 {phone}</p>
                              <p className="text-slate-300"><strong>Date:</strong> {new Date().toLocaleString()}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {pushStatus.type === "success" && (
                        <button
                          onClick={() => {
                            document.body.classList.add('print-mode-receipt');
                            window.print();
                            setTimeout(() => { document.body.classList.remove('print-mode-receipt'); }, 500);
                          }}
                          className="mt-4 px-4 py-2 border border-emerald-500/30 rounded-lg text-emerald-400 font-bold hover:bg-emerald-500/10 transition-colors cursor-pointer print-hidden flex items-center justify-center w-full shadow-lg shadow-emerald-500/5 hover:shadow-emerald-500/20"
                        >
                          Print Receipt
                        </button>
                      )}
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
                          value={phone}
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
                        Select Gift Amount (KES)
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
                            value={customAmount}
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
