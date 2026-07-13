import React, { useState, useEffect } from "react";
import { Mail, Phone, MapPin, Send, CheckCircle } from "lucide-react";
import { motion } from "motion/react";

interface ContactUsProps {
  bookingSubject: string;
  onClearBookingSubject: () => void;
  onInquirySubmitted: () => void;
}

export default function ContactUs({ bookingSubject, onClearBookingSubject, onInquirySubmitted }: ContactUsProps) {
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (bookingSubject) {
      setFormData(prev => ({
        ...prev,
        subject: `Booking request: ${bookingSubject}`,
        message: `Dear Kachamba Chorus,\n\nWe would love to reserve the choir for "${bookingSubject}". Please let us know your availability and requirements.\n\nBlessings!`
      }));
      const el = document.getElementById("contact");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  }, [bookingSubject]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setErrorMsg("Please fill in name, email, and message.");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message || "Thank you! We'll be in touch soon.");
        setFormData({ name: "", email: "", subject: "", message: "" });
        onClearBookingSubject();
        onInquirySubmitted();
      } else {
        setErrorMsg(data.error || "Failed to send message.");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    { icon: MapPin, label: "Location", value: "SDA Kachok Church, Kisumu, Kenya" },
    { icon: Phone, label: "Phone", value: "+254 797 450 206" },
    { icon: Mail, label: "Email", value: "kachambachorus@gmail.com" },
  ];

  return (
    <section id="contact" className="relative py-28 px-6 md:px-12 bg-slate-950 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_80%,rgba(245,158,11,0.04)_0%,transparent_60%)] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative">

        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-6 h-px bg-amber-400/50" />
            <span className="label-caps text-amber-400/70 text-[11px]">Get In Touch</span>
            <div className="w-6 h-px bg-amber-400/50" />
          </div>
          <h2 className="font-display font-bold text-4xl md:text-6xl text-white tracking-tight leading-none mb-3">
            Contact <span className="text-white/25 font-light">Us</span>
          </h2>
          <p className="text-white/40 text-sm font-light max-w-xs mx-auto">
            Book the choir, ask a question, or just say hello.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Contact Info Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-2 glass rounded-2xl p-8 flex flex-col gap-8"
          >
            <div>
              <h3 className="font-display font-semibold text-xl text-white mb-2">Kachamba Chorus</h3>
              <p className="text-white/40 text-sm font-light leading-relaxed">
                Seventh-day Adventist Ambassador Youth Ministry, spreading the Gospel through choral harmony.
              </p>
            </div>

            <div className="flex flex-col gap-5">
              {contactInfo.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-8 h-8 glass rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-amber-400/70" />
                  </div>
                  <div>
                    <p className="label-caps text-[9px] text-white/30 mb-0.5">{label}</p>
                    <p className="text-white/65 text-sm">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Sabbath notice */}
            <div className="glass-light rounded-xl p-4 border border-amber-400/10">
              <p className="label-caps text-[10px] text-amber-400/70 mb-1.5">Sabbath Hours</p>
              <p className="text-white/45 text-xs leading-relaxed">
                We observe the Sabbath from Friday sunset to Saturday sunset. Responses during this time will be addressed the following day.
              </p>
            </div>

            {/* Social links */}
            <div className="flex items-center gap-3 pt-2 border-t border-white/5">
              {[
                { href: "https://www.facebook.com/share/1GjHUY1u8a/", label: "Facebook" },
                { href: "https://www.tiktok.com/@kachokambassadors", label: "TikTok" },
                { href: "https://youtube.com/@kachambachorus", label: "YouTube" },
              ].map(({ href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass label-caps text-[10px] text-white/40 hover:text-amber-400 px-3 py-1.5 rounded-lg transition-colors"
                >
                  {label}
                </a>
              ))}
            </div>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-3 glass rounded-2xl p-8"
          >
            {successMsg ? (
              <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-8">
                <div className="w-14 h-14 glass rounded-full flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-emerald-400" />
                </div>
                <h3 className="font-display text-xl text-white">Message Sent!</h3>
                <p className="text-white/45 text-sm max-w-xs">{successMsg}</p>
                <button
                  onClick={() => setSuccessMsg("")}
                  className="label-caps text-[11px] text-amber-400 hover:text-amber-300 transition-colors mt-2"
                >
                  Send Another →
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <h3 className="font-display font-semibold text-xl text-white mb-2">Send a Message</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label-caps text-[10px] text-white/35 block mb-1.5">Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                      placeholder="Your full name"
                      className="w-full glass rounded-xl px-4 py-3 text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-amber-500/30 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="label-caps text-[10px] text-white/35 block mb-1.5">Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                      placeholder="your@email.com"
                      className="w-full glass rounded-xl px-4 py-3 text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-amber-500/30 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="label-caps text-[10px] text-white/35 block mb-1.5">Subject</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData(p => ({ ...p, subject: e.target.value }))}
                    placeholder="Booking request, inquiry, etc."
                    className="w-full glass rounded-xl px-4 py-3 text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-amber-500/30 transition-all"
                  />
                </div>

                <div>
                  <label className="label-caps text-[10px] text-white/35 block mb-1.5">Message *</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData(p => ({ ...p, message: e.target.value }))}
                    placeholder="Tell us how we can help you…"
                    rows={5}
                    className="w-full glass rounded-xl px-4 py-3 text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-amber-500/30 transition-all resize-none"
                    required
                  />
                </div>

                {errorMsg && (
                  <p className="text-red-400/80 text-xs">{errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2.5 bg-amber-400 hover:bg-amber-300 disabled:bg-amber-400/40 text-slate-950 font-semibold label-caps text-[11px] px-6 py-3.5 rounded-full transition-all cursor-pointer shadow-lg shadow-amber-500/15 self-start"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  {loading ? "Sending…" : "Send Message"}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
