'use client';

import { useState, useEffect, useRef } from 'react';

// Replace this with how you currently get your logged-in user's ID
const HARDCODED_USER_ID = "dc82cc1e-918d-4e87-90b1-68dc85d1c79e"; 

export default function CommandCore() {
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load Persistent Memory on Mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/chat?userId=${HARDCODED_USER_ID}`);
        const data = await res.json();
        if (data.success && data.messages) {
          setMessages(data.messages);
        }
      } catch (err) {
        console.error("Failed to load memory:", err);
      }
    };
    fetchHistory();
  }, []);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userText, userId: HARDCODED_USER_ID })
      });

      const data = await res.json();

      if (data.success) {
        setMessages(prev => [...prev, { role: 'model', content: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'model', content: `❌ ERROR: ${data.error}` }]);
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'model', content: `❌ SYSTEM CRASH: ${err.message}` }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a] text-white p-4 max-w-4xl mx-auto font-sans">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight">AI-BOS Command Core</h1>
          <p className="text-xs text-emerald-400 font-mono flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            System Initialized. Memory Linked.
          </p>
        </div>
        <div className="bg-purple-600/20 text-purple-400 text-xs px-3 py-1 rounded-full border border-purple-500/30">
          PRO INSTANCE
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 overflow-y-auto py-6 space-y-6 scrollbar-hide">
        {messages.length === 0 && (
          <div className="text-center text-neutral-500 text-sm mt-10 font-mono">
            Awaiting executive orders...
          </div>
        )}
        
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <span className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1 ml-1">
              {msg.role === 'user' ? 'Founder' : 'AI CEO'}
            </span>
            <div className={`px-4 py-3 rounded-2xl max-w-[85%] text-sm whitespace-pre-wrap leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-neutral-800 text-white border border-neutral-700 rounded-tr-sm' 
                : 'bg-emerald-900/20 text-emerald-50 border border-emerald-500/20 rounded-tl-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex flex-col items-start">
            <span className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1 ml-1">AI CEO</span>
            <div className="px-4 py-3 rounded-2xl bg-emerald-900/20 border border-emerald-500/20 rounded-tl-sm">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Field */}
      <form onSubmit={sendMessage} className="pt-4 border-t border-neutral-800 relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Instruct your AI Workforce..."
          disabled={isTyping}
          className="w-full bg-neutral-900 border border-neutral-800 text-white text-sm rounded-xl px-4 py-4 pr-12 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all disabled:opacity-50"
        />
        <button 
          type="submit" 
          disabled={!input.trim() || isTyping}
          className="absolute right-3 top-1/2 -translate-y-1/2 mt-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
        </button>
      </form>
      
    </div>
  );
}
