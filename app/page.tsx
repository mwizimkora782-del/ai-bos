'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Terminal, Users, Layers, Activity, Send, Landmark, LogOut, Zap, BarChart3, Lock } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Dashboard() {
  const router = useRouter();
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const initializeSystem = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      
      const { data: history } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (history && history.length > 0) {
        setMessages(history.map(msg => ({
          role: msg.sender,
          text: msg.content
        })));
      } else {
        setMessages([{ role: 'ai_ceo', text: 'System initialized. State your objective.' }]);
      }
      
      setIsAuthenticating(false);
    };
    
    initializeSystem();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // SaaS METERING LOGIC: Calculate user interactions
  const userInteractionCount = messages.filter(m => m.role === 'user').length;
  const FREE_LIMIT = 5;
  const isPaywalled = userInteractionCount >= FREE_LIMIT;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || isPaywalled) return;

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

  const triggerMarketingWorkflow = async () => {
    if (loading || isPaywalled) return;
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

  const triggerAnalystWorkflow = async () => {
    if (loading || isPaywalled) return;
    const targetMetric = prompt("What financial metric or recent campaign should I analyze?");
    if (!targetMetric) return;

    setMessages((prev) => [...prev, { role: 'user', text: `Run Financial Analysis on: ${targetMetric}` }]);
    setLoading(true);

    try {
      const response = await fetch('/api/analyst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metric: targetMetric })
      });
      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'ai_analyst', text: data.reply || data.error }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'ai_analyst', text: 'Data Analyst offline.' }]);
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticating) {
    return <div className="flex h-screen items-center justify-center bg-black text-white text-sm">Synchronizing Enterprise Memory...</div>;
  }

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-200 overflow-hidden text-xs sm:text-sm relative">
      
      {/* PAYWALL OVERLAY */}
      {isPaywalled && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl">
            <div className="mx-auto w-12 h-12 bg-indigo-500/20 text-indigo-400 flex items-center justify-center rounded-full mb-4">
              <Lock size={24} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Compute Limit Reached</h2>
            <p className="text-neutral-400 mb-6 text-sm">You have exhausted your free tier execution cycles. Upgrade to the Professional Plan to unlock unlimited AI workforce access.</p>
            <button className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-neutral-200 transition">
              Upgrade to Pro - $49/mo
            </button>
            <button onClick={handleLogout} className="w-full mt-3 text-neutral-500 text-xs hover:text-white transition">
              Log out
            </button>
          </div>
        </div>
      )}

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
          <div className="flex flex-col gap-2 border-t border-neutral-900 pt-4">
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span className="flex items-center gap-1.5"><Activity size={12} className="text-emerald-500" /> Free Tier</span>
              <span>{FREE_LIMIT - userInteractionCount} credits left</span>
            </div>
            <div className="w-full bg-neutral-900 rounded-full h-1.5">
              <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${(userInteractionCount / FREE_LIMIT) * 100}%` }}></div>
            </div>
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
                msg.role === 'ai_analyst' ? 'bg-emerald-950/40 border border-emerald-900/50 text-emerald-100' :
                'bg-neutral-900 border border-neutral-850 text-neutral-100'
              }`}>
                {msg.role === 'ai_marketing' && <div className="text-xs font-bold text-indigo-400 mb-2 border-b border-indigo-900/50 pb-1 flex items-center gap-1"><Zap size={12}/> MARKETING DEPT</div>}
                {msg.role === 'ai_analyst' && <div className="text-xs font-bold text-emerald-400 mb-2 border-b border-emerald-900/50 pb-1 flex items-center gap-1"><BarChart3 size={12}/> DATA ANALYST</div>}
                {msg.role === 'ai_ceo' && <div className="text-xs font-bold text-neutral-400 mb-2 border-b border-neutral-800 pb-1">AI CEO</div>}
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
          <div ref={messagesEndRef} />
        </div>

        <footer className="p-4 sm:p-6 bg-neutral-950/80 border-t border-neutral-900 flex flex-col gap-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button 
              onClick={triggerMarketingWorkflow}
              disabled={loading || isPaywalled}
              className="flex items-center gap-1.5 whitespace-nowrap bg-neutral-900 border border-neutral-800 text-indigo-400 font-medium text-xs px-3 py-2 rounded-lg hover:bg-neutral-800 transition disabled:opacity-50"
            >
              <Zap size={14} /> + Email Campaign
            </button>
            <button 
              onClick={triggerAnalystWorkflow}
              disabled={loading || isPaywalled}
              className="flex items-center gap-1.5 whitespace-nowrap bg-neutral-900 border border-neutral-800 text-emerald-400 font-medium text-xs px-3 py-2 rounded-lg hover:bg-neutral-800 transition disabled:opacity-50"
            >
              <BarChart3 size={14} /> + Financial Analysis
            </button>
          </div>

          <form onSubmit={handleSendMessage} className="relative flex items-center w-full">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isPaywalled ? "Execution limit reached. Upgrade to continue." : "Instruct your AI Workforce..."}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-4 pr-12 py-3.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-700 transition disabled:opacity-50"
              disabled={loading || isPaywalled}
            />
            <button type="submit" className="absolute right-3 p-2 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition disabled:opacity-50" disabled={loading || isPaywalled || !input.trim()}>
              <Send size={14} />
            </button>
          </form>
        </footer>
      </main>
    </div>
  );
              }
            
