import React, { useState } from "react";
import {Music, Star, Mic, CheckCircle } from "lucide-react";

export default function JoinUs() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    voicePart: "Soprano",
    experience: ""
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    // Simulate response, save local to display excitement
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: "", email: "", voicePart: "Soprano", experience: "" });
    }, 6000);
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
      className="py-20 px-6 md:px-12 bg-slate-950 text-white relative"
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Information Block */}
          <div className="lg:col-span-7">
            <div className="flex items-center gap-2 text-amber-400 font-mono text-xs tracking-wider uppercase mb-2">
              
              <span>Lift Your Voice in Praise</span>
            </div>
            <h2 className="font-sans font-extrabold text-3xl md:text-5xl tracking-tight text-white mb-6">
              Become a Kachamba!
            </h2>
            <p className="font-sans text-slate-300 text-sm md:text-base leading-relaxed mb-8 max-w-xl">
              Are you an Adventist youth with a heart for evangelism and a passion for acappella harmonies? The Kachamba Chorus family is waiting to welcome your voice. Help us proclaim the Good News far and wide!
            </p>

            {/* Audition Steps */}
            <div className="flex flex-col gap-6 max-w-xl">
              {steps.map((step, idx) => (
                <div key={idx} className="flex gap-4 p-4 rounded-xl bg-slate-900 border border-slate-805">
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

          {/* Registration Form Block */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 relative shadow-2xl">
            <div className="absolute top-0 right-8 -translate-y-1/2 bg-amber-500 text-slate-950 font-mono text-[10px] font-bold tracking-widest px-4 py-1.5 rounded-full uppercase">
              Auditions Open
            </div>

            <h3 className="font-sans font-bold text-2xl text-white mb-2">Apply to Audition</h3>
            <p className="font-sans text-xs text-slate-400 mb-6">
              Fill in your details, and our choir director will contact you before next Sabbath afternoon's practice.
            </p>

            {submitted ? (
              <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 p-6 rounded-xl text-center flex flex-col items-center justify-center gap-3">
                <CheckCircle className="w-10 h-10 text-emerald-400 animate-bounce" />
                <h4 className="font-sans font-bold text-lg text-white">Application Received!</h4>
                <p className="font-sans text-xs leading-relaxed max-w-xs">
                  Praise God! We have recorded your interest in the **{formData.voicePart}** part. Our Choir secretary will reach out shortly to guide you about the Saturday practice audition.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-sm">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase tracking-wide">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 outline-none font-sans text-sm focus:ring-1 focus:ring-amber-500/20 text-white transition-all"
                    placeholder="Enter full name"
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
                    placeholder="name@example.com"
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
                    <option value="Unsure">Not sure (Audio tester will find)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase tracking-wide">Musical Experience (Optional)</label>
                  <textarea 
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 outline-none font-sans text-sm focus:ring-1 focus:ring-amber-500/20 text-white transition-all resize-none"
                    placeholder="Briefly state if you have sung in other SDA choirs or have music notation experience..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-sans font-bold py-3 px-6 rounded-xl shadow-lg shadow-amber-500/5 hover:-translate-y-0.5 transition-all cursor-pointer mt-2"
                >
                  Submit Application
                </button>
              </form>
            )}

            <div className="mt-4 text-center">
              <p className="font-mono text-[10px] text-slate-500">
                Weekly Rehearsals: Every communicated day from 2PM  @ Kachok Church
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
