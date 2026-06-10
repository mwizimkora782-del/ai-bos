'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Terminal, Users, Layers, Activity, Send, Landmark, LogOut, Zap } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Dashboard() {
  const router = useRouter();
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [messages, setMessages] = useState([{ role: 'ai_ceo', text: 'Welcome back. Your unified AI team is standing by. State your objective.' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        setIsAuthenticating(false);
      }
    };
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Standard CEO Chat
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
        body: JSON.stringify({ message: userMessage.text })
      });
      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'ai_ceo', text: data.reply || data.error }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'ai_ceo', text: 'Network connection link severed.' }]);
    } finally {
      setLoading(false);
    }
  };

  // Automated Marketing Workflow
  const triggerMarketingWorkflow = async () => {
    if (loading) return;
    const targetProduct = prompt("What product are we creating a campaign for?");
    if (!targetProduct) return;

    setMessages((prev) => [...prev, { role: 'user', text: `Execute 3-Day Email Campaign for: ${targetProduct}` }]);
    setLoading(true);

    try {
      const response = await fetch('/api/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: targetProduct })
      });
      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'ai_marketing', text: data.reply || data.error }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'ai_marketing', text: 'Marketing Agent offline.' }]);
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticating) {
    return <div className="flex h-screen items-center justify-center bg-black text-white text-sm">Verifying enterprise credentials...</div>;
  }

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-200 overflow-hidden text-xs sm:text-sm">
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
        <div className="space-y-4">
          <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-950/30 transition text-left">
            <LogOut size={16} /> Terminate Session
          </button>
          <div className="flex items-center gap-2 text-xs text-neutral-500 border-t border-neutral-900 pt-4">
            <Activity size={12} className="text-emerald-500" /> Active Scale Instance
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-neutral-900/20">
        <header className="border-b border-neutral-900 p-4 sm:p-6 flex justify-between items-center bg-neutral-950/80">
          <div>
            <h1 className="text-sm sm:text-md font-medium tracking-tight text-white">HQ Control Interface</h1>
            <p className="text-xs text-neutral-500 hidden sm:block">Deterministic multi-agent execution array</p>
          </div>
          <div className="flex gap-2">
            <div className="bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded text-neutral-400 flex items-center gap-1.5">
              <Landmark size={12} className="text-neutral-500" /> Layer: <span className="text-white font-mono font-bold">Secure</span>
            </div>
            <button onClick={handleLogout} className="md:hidden bg-red-950/30 border border-red-900/50 px-3 py-1.5 rounded text-red-500 flex items-center">
               <LogOut size={14} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xl rounded-xl px-4 py-3 text-sm leading-relaxed tracking-normal shadow-sm whitespace-pre-wrap ${
                msg.role === 'user' ? 'bg-white text-black font-normal' : 
                msg.role === 'ai_marketing' ? 'bg-indigo-950/40 border border-indigo-900/50 text-indigo-100' :
                'bg-neutral-900 border border-neutral-850 text-neutral-100'
              }`}>
                {msg.role === 'ai_marketing' && <div className="text-xs font-bold text-indigo-400 mb-2 border-b border-indigo-900/50 pb-1">MARKETING DEPT</div>}
                {msg.role === 'ai_ceo' && idx !== 0 && <div className="text-xs font-bold text-emerald-500 mb-2 border-b border-neutral-800 pb-1">AI CEO</div>}
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-neutral-900 border border-neutral-850 text-neutral-400 rounded-xl px-4 py-3 text-sm animate-pulse">
                Workforce executing directive...
              </div>
            </div>
          )}
        </div>

        <footer className="p-4 sm:p-6 bg-neutral-950/80 border-t border-neutral-900 flex flex-col gap-3">
          {/* Quick Actions Bar */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button 
              onClick={triggerMarketingWorkflow}
              disabled={loading}
              className="flex items-center gap-1.5 whitespace-nowrap bg-neutral-900 border border-neutral-800 text-indigo-400 font-medium text-xs px-3 py-2 rounded-lg hover:bg-neutral-800 transition disabled:opacity-50"
            >
              <Zap size={14} /> + 3-Day Email Campaign
            </button>
          </div>

          <form onSubmit={handleSendMessage} className="relative flex items-center w-full">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Instruct your AI Workforce..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-4 pr-12 py-3.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-700 transition"
              disabled={loading}
            />
            <button type="submit" className="absolute right-3 p-2 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition disabled:opacity-50" disabled={loading || !input.trim()}>
              <Send size={14} />
            </button>
          </form>
        </footer>
      </main>
    </div>
  );
}
