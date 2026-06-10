'use client';
import React, { useState } from 'react';
import { Terminal, Users, Layers, Activity, Send, Briefcase, Landmark } from 'lucide-react';

export default function Dashboard() {
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Welcome to AI-BOS. System operational. Your unified AI team is standing by. State your objective.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });
      const data = await response.json();
      
      setMessages((prev) => [...prev, { 
        role: 'ai', 
        text: data.reply || data.error || 'System anomaly encountered.' 
      }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'ai', text: 'Network connection link severed.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-200 overflow-hidden text-xs sm:text-sm">
      {/* Sidebar - Desktop view layout, stays compact on mobile grids */}
      <aside className="hidden md:flex w-64 border-r border-neutral-900 bg-neutral-950 p-6 flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-8">
            <div className="h-6 w-6 rounded bg-white flex items-center justify-center text-black font-bold text-xs">Ω</div>
            <span className="text-sm font-semibold tracking-wider text-white">AI-BOS</span>
          </div>
          <nav className="space-y-2">
            <button className="flex w-full items-center gap-3 rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white text-left">
              <Terminal size={16} /> Command Core
            </button>
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-neutral-400 hover:text-white transition text-left">
              <Users size={16} /> AI Workforce
            </button>
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-neutral-400 hover:text-white transition text-left">
              <Layers size={16} /> Architecture
            </button>
          </nav>
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-500 border-t border-neutral-900 pt-4">
          <Activity size={12} className="text-emerald-500" /> Active Scale Instance
        </div>
      </aside>

      {/* Main Workspace Terminal Frame */}
      <main className="flex-1 flex flex-col min-w-0 bg-neutral-900/20">
        {/* Dynamic Metric Display Dashboard Panel */}
        <header className="border-b border-neutral-900 p-4 sm:p-6 flex justify-between items-center bg-neutral-950/80">
          <div>
            <h1 className="text-sm sm:text-md font-medium tracking-tight text-white">HQ Control Interface</h1>
            <p className="text-xs text-neutral-500 hidden sm:block">Deterministic multi-agent execution array</p>
          </div>
          <div className="flex gap-2">
            <div className="bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded text-neutral-400 flex items-center gap-1.5">
              <Landmark size={12} className="text-neutral-500" /> Layer: <span className="text-white font-mono font-bold">MVP</span>
            </div>
          </div>
        </header>

        {/* Real-time Conversation Stream Window */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xl rounded-xl px-4 py-3 text-sm leading-relaxed tracking-normal shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-white text-black font-normal' 
                  : 'bg-neutral-900 border border-neutral-850 text-neutral-100'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-neutral-900 border border-neutral-850 text-neutral-400 rounded-xl px-4 py-3 text-sm animate-pulse">
                AI Workforce analyzing data streams...
              </div>
            </div>
          )}
        </div>

        {/* Tactical Natural Language Input Field Bar */}
        <footer className="p-4 sm:p-6 bg-neutral-950/80 border-t border-neutral-900">
          <form onSubmit={handleSendMessage} className="relative flex items-center max-w-4xl mx-auto w-full">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Instruct your AI Workforce (e.g., 'Review operating margins')..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-4 pr-12 py-3.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-700 transition"
              disabled={loading}
            />
            <button 
              type="submit" 
              className="absolute right-3 p-2 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition disabled:opacity-50"
              disabled={loading || !input.trim()}
            >
              <Send size={14} />
            </button>
          </form>
        </footer>
      </main>
    </div>
  );
                             }
        
