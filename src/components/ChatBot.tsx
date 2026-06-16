import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User, Minimize2, ArrowUpRight } from "lucide-react";
import { ChatMessage } from "../types";

interface ChatBotProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
}

export default function ChatBot({ isOpen, onClose, onOpen }: ChatBotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Greetings in Christ! I am **Ambassador Guide**, the choral companion of Kachamba Chorus.\n\nAsk me about upcoming tour bookings, practice times, voice auditions, or Adventist beliefs. How can I minister to you today?",
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem("kachamba_inquiry_helper_dismissed") === "true";
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Suggested quick prompts trigger beautiful answers instantly
  const quickPrompts = [
    "How can we book the choir?",
    "What are your practice times?",
    "How can I join the chorus?",
    "Do you sing acappella only?"
  ];

  // Auto scroll messages to bottom on new message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Automatically undismiss if chat is explicitly opened (e.g. from Hero button)
  useEffect(() => {
    if (isOpen) {
      setIsDismissed(false);
      localStorage.removeItem("kachamba_inquiry_helper_dismissed");
    }
  }, [isOpen]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: "msg-" + Date.now(),
      role: "user",
      text: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setLoading(true);

    try {
      // Gather dialogue history for server-side Gemini
      // Map structures to format the endpoint expects
      const payloadMessages = [...messages, userMsg].map(m => ({
        role: m.role,
        text: m.text
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ messages: payloadMessages })
      });
      const data = await res.json();

      if (res.ok) {
        setMessages(prev => [
          ...prev,
          {
            id: "reply-" + Date.now(),
            role: "assistant",
            text: data.text,
            timestamp: new Date()
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: "error-" + Date.now(),
            role: "assistant",
            text: "My apologies. I had trouble connecting to my Gemini brain. No worries though, you can always contact our Coordinator directly at `kachambachorus@gmail.com` or '0797450206'!",
            timestamp: new Date()
          }
        ]);
      }
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: "error-" + Date.now(),
          role: "assistant",
          text: "I couldn't reach the choral server. Is the application starting? Please check your connection or send a booking inquiry downstairs!",
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (isDismissed && !isOpen) return null;

  return (
    <div className={`fixed z-50 transition-all duration-300 ${isOpen ? "bottom-0 right-0 w-full sm:w-auto sm:bottom-6 sm:right-6" : "bottom-6 right-6"}`}>
      
      {/* Floating Toggle Icon */}
      {!isOpen && (
        <div className="relative flex items-center group">
          <button
            onClick={onOpen}
            className="flex items-center gap-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 p-4 rounded-full shadow-2xl hover:shadow-amber-500/20 hover:-translate-y-1 transition-all cursor-pointer group/btn border border-amber-400/20"
          >
            <MessageSquare className="w-6 h-6 animate-pulse group-hover/btn:scale-105 transition-transform" />
            <span className="font-sans font-bold text-sm pr-1">Inquiry Helper</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsDismissed(true);
              localStorage.setItem("kachamba_inquiry_helper_dismissed", "true");
            }}
            className="absolute -top-1.5 -right-1.5 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white p-1 rounded-full border border-slate-700 shadow-lg hover:scale-110 transition-all cursor-pointer"
            title="Hide inquiry helper"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Chat Interface */}
      {isOpen && (
        <div className="bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:w-[400px] h-[85vh] sm:h-[550px] flex flex-col overflow-hidden text-white transition-all scale-100 opacity-100">
          
          {/* Header Banner */}
          <div className="bg-slate-950 px-5 py-4 border-b border-slate-805 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-amber-550/35 bg-[#050B14] flex items-center justify-center shadow-md">
                <img 
                  src="https://www.image2url.com/r2/default/images/1781098447744-9bfd4cd8-4c62-4a1a-b218-7ccd6f1b36d2.png" 
                  alt="Kachamba Chorus Logo" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h3 className="font-sans font-bold text-sm tracking-wide text-amber-400">Ambassador Guide</h3>
                <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block animate-ping" />
                  <span>Kachamba Chorus Assistant</span>
                </span>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-lg cursor-pointer transition-colors"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Loop Container */}
          <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-4 font-sans text-sm bg-slate-900/60 custom-scrollbar">
            {messages.map((m) => (
              <div 
                key={m.id}
                className={`flex gap-3 max-w-[85%] ${
                  m.role === "user" ? "self-end flex-row-reverse" : "self-start"
                }`}
              >
                {/* Avatar Icon */}
                {m.role === "user" ? (
                  <div className="p-1.5 rounded-lg h-fit shrink-0 bg-amber-600 text-slate-950">
                    <User className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="relative w-7 h-7 rounded-full overflow-hidden border border-amber-550/30 bg-[#050B14] flex items-center justify-center shrink-0 shadow">
                    <img 
                      src="https://www.image2url.com/r2/default/images/1781098447744-9bfd4cd8-4c62-4a1a-b218-7ccd6f1b36d2.png" 
                      alt="Kachamba Chorus Logo" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                {/* Bubble Context */}
                <div className={`p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                  m.role === "user" 
                    ? "bg-amber-500 text-slate-950 rounded-tr-none font-medium" 
                    : "bg-slate-950 border border-slate-805 text-slate-200 rounded-tl-none font-sans"
                }`}>
                  {/* Clean Markdown Bold Render Simulation */}
                  {m.text.split("\n\n").map((para, i) => {
                    // Quick bold format simulation
                    const parts = para.split("**");
                    return (
                      <p key={i} className={i > 0 ? "mt-2.5" : ""}>
                        {parts.map((p, idx) => idx % 2 === 1 ? <strong key={idx} className={m.role === "user" ? "font-bold text-slate-950" : "font-bold text-amber-300"}>{p}</strong> : p)}
                      </p>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* AI Processing Bubble */}
            {loading && (
              <div className="flex gap-3 max-w-[85%] self-start">
                <div className="relative w-7 h-7 rounded-full overflow-hidden border border-amber-550/30 bg-[#050B14] flex items-center justify-center shrink-0 shadow">
                  <img 
                    src="https://www.image2url.com/r2/default/images/1781098447744-9bfd4cd8-4c62-4a1a-b218-7ccd6f1b36d2.png" 
                    alt="Kachamba Chorus Logo" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce delay-100" />
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick recommendations panel */}
          {messages.length === 1 && (
            <div className="px-5 py-2.5 border-t border-slate-800/60 bg-slate-950/40">
              <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">Suggested Questions</span>
              <div className="flex flex-col gap-1.5 mt-2">
                {quickPrompts.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    className="flex justify-between items-center text-left bg-slate-950 hover:bg-slate-850 border border-slate-805 hover:border-amber-400/20 text-slate-300 hover:text-amber-300 text-xs py-2 px-3 rounded-lg transition-colors cursor-pointer"
                  >
                    <span>{q}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Inputs Panel */}
          <div className="p-4 bg-slate-950 border-t border-slate-805 flex gap-2">
            <input 
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage(inputText)}
              placeholder="Ask an Ambassador elder..."
              disabled={loading}
              className="flex-1 bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-amber-500 outline-none rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-amber-500/10 placeholder-slate-500 transition-all text-white"
            />
            <button
              onClick={() => handleSendMessage(inputText)}
              disabled={!inputText.trim() || loading}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 disabled:bg-slate-800 disabled:text-slate-500 p-2.5 rounded-xl transition-all font-sans font-bold cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
