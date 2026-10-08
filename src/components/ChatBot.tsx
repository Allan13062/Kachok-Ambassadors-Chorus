import React, { FormEvent, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Bot, MessageCircle, Send, X, Sparkles, UserRound, LoaderCircle, ArrowUpRight } from "lucide-react";
import type { ChatMessage } from "../types";

interface ChatBotProps { isOpen: boolean; onClose: () => void; onOpen: () => void; }
const quickPrompts = ["How do I book the choir?", "When are rehearsals?", "How can I join?", "What kind of music do you sing?"];
const welcome: ChatMessage = { id: "welcome", role: "assistant", text: "Hello and welcome! I’m **Ambassador Guide**, the Kachamba Chorus assistant. Ask me about bookings, rehearsals, joining the choir, or our ministry.", timestamp: new Date() };

function MessageText({ text }: { text: string }) {
  return <div className="kc-chat-message-text">{text.split(/(\*\*.*?\*\*)/g).map((part, index) => part.startsWith("**") && part.endsWith("**") ? <strong key={index}>{part.slice(2, -2)}</strong> : part).reduce<React.ReactNode[]>((parts, part, index) => { if (typeof part === "string") { const lines = part.split("\n"); lines.forEach((line, lineIndex) => { if (lineIndex) parts.push(<br key={`${index}-br-${lineIndex}`} />); parts.push(line); }); } else parts.push(part); return parts; }, [])}</div>;
}

export default function ChatBot({ isOpen, onClose, onOpen }: ChatBotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([welcome]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, loading, isOpen]);
  useEffect(() => { if (isOpen) { const id = window.setTimeout(() => inputRef.current?.focus(), 120); return () => window.clearTimeout(id); } }, [isOpen]);
  useEffect(() => { if (!isOpen) return; const close = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); }; window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close); }, [isOpen, onClose]);

  const sendMessage = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || loading) return;
    const userMessage: ChatMessage = { id: `user-${Date.now()}`, role: "user", text, timestamp: new Date() };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: nextMessages.slice(-16).map(({ role, text: messageText }) => ({ role, text: messageText })) }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || "The assistant could not respond right now.");
      const answer = typeof payload?.text === "string" && payload.text.trim() ? payload.text : "I’m sorry, I couldn’t form a response. Please try again or use the contact form.";
      setMessages((current) => [...current, { id: `assistant-${Date.now()}`, role: "assistant", text: answer, timestamp: new Date() }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection issue. Please try again.");
    } finally { setLoading(false); }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); void sendMessage(input); };

  return <>
    {!isOpen && <motion.button type="button" className="kc-chat-launcher" onClick={onOpen} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} aria-label="Open Ambassador Guide chat"><MessageCircle size={23} /><span className="kc-chat-launcher__spark"><Sparkles size={13} /></span><span className="kc-chat-launcher__label">Ask us</span></motion.button>}
    <AnimatePresence>
      {isOpen && <motion.aside className="kc-chat-panel" role="dialog" aria-modal="false" aria-label="Ambassador Guide chat" initial={{ opacity: 0, y: 22, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.97 }} transition={{ duration: 0.2 }}>
        <header className="kc-chat-header"><div className="kc-chat-avatar"><Bot size={22} /></div><div className="min-w-0 flex-1"><p className="text-sm font-bold text-white">Ambassador Guide</p><p className="mt-0.5 flex items-center gap-1.5 text-xs text-emerald-300"><span className="kc-online-dot" /> Kachamba Chorus assistant</p></div><button className="kc-chat-close" type="button" onClick={onClose} aria-label="Close chat"><X size={19} /></button></header>
        <div className="kc-chat-welcome"><span className="kc-chat-welcome__icon"><Sparkles size={15} /></span><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-300">Here to help</p><p className="mt-1 text-xs leading-5 text-slate-300">Ask a question or choose a quick topic below.</p></div></div>
        <div className="kc-chat-messages" aria-live="polite" aria-relevant="additions text">
          {messages.map((message) => <div key={message.id} className={`kc-chat-row ${message.role === "user" ? "kc-chat-row--user" : "kc-chat-row--assistant"}`}><span className={`kc-chat-message-avatar ${message.role === "user" ? "kc-chat-message-avatar--user" : ""}`}>{message.role === "user" ? <UserRound size={15} /> : <Bot size={15} />}</span><div className={`kc-chat-bubble ${message.role === "user" ? "kc-chat-bubble--user" : "kc-chat-bubble--assistant"}`}><MessageText text={message.text} /><time>{message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time></div></div>)}
          {loading && <div className="kc-chat-row kc-chat-row--assistant"><span className="kc-chat-message-avatar"><Bot size={15} /></span><div className="kc-chat-bubble kc-chat-bubble--assistant kc-chat-thinking"><LoaderCircle size={15} className="animate-spin" /> Thinking…</div></div>}
          <div ref={bottomRef} />
        </div>
        {messages.length <= 1 && <div className="kc-chat-prompts">{quickPrompts.map((prompt) => <button type="button" key={prompt} onClick={() => void sendMessage(prompt)}>{prompt}<ArrowUpRight size={13} /></button>)}</div>}
        {error && <p className="kc-chat-error" role="alert">{error}</p>}
        <form className="kc-chat-composer" onSubmit={handleSubmit}><input ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask us anything…" aria-label="Your message" maxLength={1000} disabled={loading} /><button type="submit" disabled={loading || !input.trim()} aria-label="Send message"><Send size={17} /></button></form>
        <p className="kc-chat-disclaimer">For bookings or urgent enquiries, please use the contact form.</p>
      </motion.aside>}
    </AnimatePresence>
  </>;
}
