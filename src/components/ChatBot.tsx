import React, { useEffect, useRef, useState } from "react";
import {
  MessageSquare, X, Send, Bot, User, Minimize2, ArrowUpRight,
  CalendarDays, Music2, Users, LoaderCircle
} from "lucide-react";
import { ChatMessage } from "../types";

interface ChatBotProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
}

const quickPrompts = [
  { label: "Book the choir", icon: CalendarDays, prompt: "How can we book the choir?" },
  { label: "Rehearsal times", icon: Music2, prompt: "When are rehearsals?" },
  { label: "Join the chorus", icon: Users, prompt: "How can I join the chorus?" },
  { label: "Our music", icon: Sparkles, prompt: "What kind of music do you sing?" },
];

const logo = "https://www.image2url.com/r2/default/images/1781098447744-9bfd4cd8-4c62-4a1a-b218-7ccd6f1b36d2.png";

export default function ChatBot({ isOpen, onClose, onOpen }: ChatBotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: "welcome",
    role: "assistant",
    text: "Hello and welcome! I’m **Ambassador Guide**, the Kachamba Chorus assistant. Ask me about bookings, rehearsals, joining the choir, or our ministry.",
    timestamp: new Date(),
  }]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiMode, setAiMode] = useState<"lite" | "search" | "maps">("lite");
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem("kachamba_inquiry_helper_dismissed") === "true"
  );
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setDismissed(false);
      localStorage.removeItem("kachamba_inquiry_helper_dismissed");
      const timer = window.setTimeout(() => inputRef.current?.focus(), 250);
      return () => window.clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const sendMessage = async (raw: string) => {
    const text = raw.trim();
    if (!text || loading) return;
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`, role: "user", text, timestamp: new Date(),
    };
    const history = [...messages, userMsg];
    setMessages(history);
    setInputText("");
    setLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map(({ role, text }) => ({ role, text })),
          feature: aiMode,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "The assistant is temporarily unavailable.");
      setMessages(prev => [...prev, {
        id: `assistant-${Date.now()}`, role: "assistant",
        text: typeof data.text === "string" && data.text.trim()
          ? data.text
          : "I’m sorry, I couldn’t prepare a response just now. Please use the contact form and our team will help.",
        timestamp: new Date(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`, role: "assistant",
        text: "I can’t reach the assistant service right now. Please use the contact form or email **kachambachorus@gmail.com** for help.",
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = (text: string) => text.split("\n\n").map((paragraph, i) => (
    <p key={i} className={i ? "kach-chat-paragraph" : undefined}>
      {paragraph.split("**").map((part, index) =>
        index % 2 ? <strong key={index}>{part}</strong> : part
      )}
    </p>
  ));

  if (!isOpen && dismissed) return null;

  return (
    <div className={`kach-chat-root ${isOpen ? "is-open" : "is-closed"}`}>
      {!isOpen && (
        <div className="kach-chat-launch-wrap">
          <button className="kach-chat-launch" onClick={onOpen} aria-label="Open Ambassador Guide chat">
            <span className="kach-chat-launch-icon"><MessageSquare size={21} /></span>
            <span><strong>Ambassador Guide</strong><small>Ask the chorus assistant</small></span>
            <ArrowUpRight size={17} className="kach-chat-launch-arrow" />
          </button>
          <button
            className="kach-chat-dismiss"
            onClick={() => { setDismissed(true); localStorage.setItem("kachamba_inquiry_helper_dismissed", "true"); }}
            aria-label="Hide chat launcher"
          ><X size={16} /></button>
        </div>
      )}

      {isOpen && (
        <section className="kach-chat-panel" role="dialog" aria-modal="false" aria-labelledby="kach-chat-title">
          <header className="kach-chat-header">
            <div className="kach-chat-brand-mark">
              <img src={logo} alt="" />
              <span className="kach-chat-online-dot" />
            </div>
            <div className="kach-chat-brand-copy">
              <span className="kach-chat-eyebrow">KACHAMBA CHORUS</span>
              <h2 id="kach-chat-title">Ambassador Guide</h2>
              <p><span className="kach-chat-status-dot" /> Your chorus assistant</p>
            </div>
            <button className="kach-chat-icon-btn" onClick={onClose} aria-label="Minimize chat">
              <Minimize2 size={19} />
            </button>
            <button className="kach-chat-icon-btn kach-chat-close" onClick={onClose} aria-label="Close chat">
              <X size={20} />
            </button>
          </header>

          <div className="kach-chat-welcome">
            <div className="kach-chat-welcome-icon"><Sparkles size={17} /></div>
            <div>
              <span className="kach-chat-section-label">HERE TO HELP</span>
              <p>Ask a question or choose a quick topic below.</p>
            </div>
          </div>

          <div className="kach-chat-messages" aria-live="polite" aria-relevant="additions text">
            {messages.map(message => (
              <div key={message.id} className={`kach-chat-message ${message.role === "user" ? "from-user" : "from-assistant"}`}>
                <div className="kach-chat-avatar">
                  {message.role === "user" ? <User size={16} /> : <img src={logo} alt="" />}
                </div>
                <div className="kach-chat-message-content">
                  <div className="kach-chat-bubble">{renderMessage(message.text)}</div>
                  <time>{message.timestamp instanceof Date
                    ? message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : ""}</time>
                </div>
              </div>
            ))}
            {messages.length === 1 && (
              <div className="kach-chat-suggestions">
                {quickPrompts.map(({ label, icon: Icon, prompt }) => (
                  <button key={label} onClick={() => sendMessage(prompt)} disabled={loading}>
                    <span className="kach-chat-suggestion-icon"><Icon size={17} /></span>
                    <span>{label}</span>
                    <ArrowUpRight size={15} className="kach-chat-suggestion-arrow" />
                  </button>
                ))}
              </div>
            )}
            {loading && (
              <div className="kach-chat-message from-assistant">
                <div className="kach-chat-avatar"><img src={logo} alt="" /></div>
                <div className="kach-chat-bubble kach-chat-typing" aria-label="Assistant is typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <footer className="kach-chat-footer">
            <div className="kach-chat-mode-row" aria-label="Response mode">
              {([
                ["lite", "Quick answer"],
                ["search", "Web search"],
                ["maps", "Places"],
              ] as const).map(([mode, label]) => (
                <button
                  key={mode}
                  className={aiMode === mode ? "active" : ""}
                  onClick={() => setAiMode(mode)}
                  aria-pressed={aiMode === mode}
                >{label}</button>
              ))}
            </div>
            <form className="kach-chat-composer" onSubmit={e => { e.preventDefault(); void sendMessage(inputText); }}>
              <input
                ref={inputRef}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="Ask us anything…"
                aria-label="Your message"
                disabled={loading}
                autoComplete="off"
              />
              <button type="submit" disabled={!inputText.trim() || loading} aria-label="Send message">
                {loading ? <LoaderCircle size={19} className="kach-chat-spinner" /> : <Send size={18} />}
              </button>
            </form>
            <p className="kach-chat-note">For bookings or urgent enquiries, please use the <a href="#contact" onClick={onClose}>contact form</a>.</p>
          </footer>
        </section>
      )}
    </div>
  );
}
