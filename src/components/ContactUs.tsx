import React, { useState, useEffect } from "react";
import { Mail, Phone, MapPin, Send, CheckCircle, Clock } from "lucide-react";

interface ContactUsProps {
  bookingSubject: string;
  onClearBookingSubject: () => void;
  onInquirySubmitted: () => void;
}

export default function ContactUs({ bookingSubject, onClearBookingSubject, onInquirySubmitted }: ContactUsProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Sync booking subject triggers from itinerary component
  useEffect(() => {
    if (bookingSubject) {
      setFormData(prev => ({
        ...prev,
        subject: `Booking request: ${bookingSubject}`,
        message: `Dear Kachamba Chorus,\n\nWe would love to reserve the choir to minister at "${bookingSubject}". Please let us know of availability and requirements.\n\nBlessings!`
      }));
      // Scroll to Contact us smoothly
      const el = document.getElementById("contact");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [bookingSubject]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setErrorMsg("Please fill in cooperative name, email, and description message.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();

      if (response.ok) {
        setSuccessMsg(data.message || "Thank you! Your inquiries have been received.");
        setFormData({ name: "", email: "", subject: "", message: "" });
        onClearBookingSubject();
        onInquirySubmitted(); // trigger refresh of inquiries on admin end
      } else {
        setErrorMsg(data.error || "Failed to post inquiry. Please try again.");
      }
    } catch {
      setErrorMsg("Network error occurred. The Express backend may be starting. Please double check.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section 
      id="contact" 
      className="py-20 px-6 md:px-12 bg-slate-900 border-t border-slate-805 text-white"
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Quick Contact & Physical Address Info */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-amber-500 font-mono text-xs tracking-wider uppercase mb-2">
                <Mail className="w-4 h-4" />
                <span>Christian Engagement</span>
              </div>
              <h2 className="font-sans font-extrabold text-3xl md:text-5xl tracking-tight text-white mb-6">
                Get In Touch
              </h2>
              <p className="font-sans text-slate-400 text-sm md:text-base leading-relaxed mb-8">
                Want us to host a vocal workshop, minister in your Divine Sabbath Service, sing at your Christian wedding, or attend an evangelistic conference? Fill in your booking inquiry here.
              </p>

              {/* Physical/Spiritual Contact Details */}
              <div className="flex flex-col gap-6 font-sans">
                <div className="flex gap-4">
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-805 text-amber-400 shrink-0 h-fit">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-300 uppercase font-mono tracking-wider">Sanctuary Address</h4>
                    <p className="text-slate-400 text-sm mt-1">SDA Kachok Church, Kisumu</p>
                    <p className="text-xs text-slate-500">Kisumu, Kenya</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-805 text-amber-400 shrink-0 h-fit">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-300 uppercase font-mono tracking-wider">Choir Booking Hotlines</h4>
                    <p className="text-slate-400 text-sm mt-1">Phone: +254797450206</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-805 text-amber-400 shrink-0 h-fit">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-300 uppercase font-mono tracking-wider">Vocal Team Inbox</h4>
                    <a 
                      href="mailto:kachambachorus@gmail.com?subject=Inquiry%20for%20Kachamba%20Chorus"
                      className="text-amber-400 hover:text-amber-300 text-sm mt-1 block font-medium transition-colors hover:underline"
                      title="Email Kachamba Chorus directly"
                    >
                      kachambachorus@gmail.com
                    </a>
                    <p className="text-xs text-slate-500">Subject response rate: Under 24 Hours</p>
                    <a 
                      href="mailto:kachambachorus@gmail.com?subject=Inquiry%20for%20Kachamba%20Chorus"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-500 hover:text-amber-400 mt-2 transition-colors hover:underline group"
                    >
                      <span>✉ Send Quick Email Link</span> <span className="group-hover:translate-x-0.5 transition-transform inline-block">&rarr;</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Prayer Note Card */}
            <div className="mt-8 bg-slate-950/40 border border-slate-800 p-4 rounded-xl flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="font-sans text-xs text-slate-400 leading-relaxed">
                <strong>Sabbath Notice:</strong> As true Adventists, we observe rest on the Seventh-day Sabbath (Friday sunset until Saturday sunset). All virtual or operational booking feedback will be happily delivered after Sunday morning.
              </div>
            </div>
          </div>

          {/* Real POST Inquiry Message Form */}
          <div className="lg:col-span-7 bg-slate-950/80 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
            <h3 className="font-sans font-bold text-2xl text-amber-300 mb-2">Send an Inquiry or Booking</h3>
            <p className="font-sans text-xs md:text-sm text-slate-400 mb-6">
              Your inquiry goes straight to the choir committee. We register and discuss all bookings in our weekly Sunday council meetings.
            </p>

            {successMsg ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-6 rounded-xl flex flex-col items-center text-center gap-3">
                <CheckCircle className="w-12 h-12 text-emerald-400 animate-bounce" />
                <h4 className="font-bold text-lg text-white">Message Logged!</h4>
                <p className="text-sm font-sans max-w-sm">
                  {successMsg}
                </p>
                <button
                  onClick={() => setSuccessMsg("")}
                  className="mt-2 text-xs font-mono text-amber-400 border border-amber-500/20 px-4 py-1.5 rounded hover:bg-amber-500 hover:text-slate-950 transition-colors cursor-pointer"
                >
                  Post Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-sm font-sans">
                {errorMsg && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-center font-mono text-xs">
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1 uppercase tracking-wider">Your Name</label>
                    <input 
                      type="text"
                      required
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-amber-500/10 text-white transition-all"
                      placeholder="e.g. Pastor John"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1 uppercase tracking-wider">Email Address</label>
                    <input 
                      type="email"
                      required
                      value={formData.email || ""}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-amber-500/10 text-white transition-all"
                      placeholder="e.g. john@church.org"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1 uppercase tracking-wider">Subject</label>
                  <input 
                    type="text"
                    value={formData.subject || ""}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-amber-500/10 text-white transition-all"
                    placeholder="e.g. Booking for Youth Campout"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1 uppercase tracking-wider">Detailed Message</label>
                  <textarea 
                    required
                    value={formData.message || ""}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={6}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-amber-500/10 text-white transition-all resize-none"
                    placeholder="Write details about physical coordinates, transportation provisions, choir duration, or song themes..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-slate-755 disabled:text-slate-500 text-slate-950 font-sans font-bold py-3.5 px-6 rounded-xl hover:-translate-y-0.5 transition-all shadow-lg shadow-amber-500/5 cursor-pointer mt-2 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{loading ? "Sending Inquiry..." : "Send Official Inquiry"}</span>
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
