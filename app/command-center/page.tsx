'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import {
  ArrowLeft, Send, Loader2, Sparkles,
  TrendingUp, Users, Megaphone, DollarSign,
  CheckSquare, Zap, ChevronRight
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

type Message = {
  role: 'user' | 'ai';
  text: string;
  agent?: string;
  agentColor?: string;
};

const STARTERS = [
  { icon: <TrendingUp size={15} />,  color: 'text-emerald-400', label: 'Grow my business',   prompt: 'How can I grow my business this month? Give me a concrete action plan.' },
  { icon: <Users size={15} />,       color: 'text-blue-400',    label: 'Get more customers',  prompt: 'Help me get more customers. What are the best strategies for my type of business?' },
  { icon: <Megaphone size={15} />,   color: 'text-indigo-400',  label: 'Write a Facebook ad', prompt: 'Write a high-converting Facebook ad for my business.' },
  { icon: <DollarSign size={15} />,  color: 'text-amber-400',   label: 'Analyze my revenue',  prompt: 'Analyze my revenue and tell me where I can increase profits.' },
  { icon: <CheckSquare size={15} />, color: 'text-violet-400',  label: 'Plan my week',        prompt: 'Create a focused task list for my business this week.' },
  { icon: <Zap size={15} />,         color: 'text-rose-400',    label: 'Reduce expenses',     prompt: 'Help me find ways to reduce business expenses without hurting growth.' },
];

const detectAgent = (text: string): { label: string; color: string } => {
  const t = text.toLowerCase();
  if (t.includes('market') || t.includes('ad') || t.includes('campaign') || t.includes('brand'))
    return { label: 'Marketing Agent', color: 'text-indigo-400' };
  if (t.includes('revenue') || t.includes('profit') || t.includes('expense') || t.includes('financ') || t.includes('money'))
    return { label: 'Financial Analyst', color: 'text-emerald-400' };
  if (t.includes('task') || t.includes('plan') || t.includes('week') || t.includes('schedule'))
    return { label: 'Operations Agent', color: 'text-violet-400' };
  if (t.includes('hire') || t.includes('staff') || t.includes('team') || t.includes('employee'))
    return { label: 'HR Agent', color: 'text-rose-400' };
  if (t.includes('grow') || t.includes('strateg') || t.includes('scale') || t.includes('customer'))
    return { label: 'Strategy Agent', color: 'text-amber-400' };
  return { label: 'AI CEO', color: 'text-neutral-400' };
};

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-2xl rounded-tl-sm w-fit">
      {[0, 150, 300].map(delay => (
        <span key={delay} className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-bounce"
          style={{ animationDelay: `${delay}ms` }} />
      ))}
    </div>
  );
}

function Bubble({ msg }: { msg: Message }) {
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-white text-black rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
          {msg.text}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-2.5 justify-start">
      <div className="w-7 h-7 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center flex-shrink-0 mt-1">
        <Sparkles size={12} className="text-neutral-300" />
      </div>
      <div className="max-w-[82%] flex flex-col gap-1">
        {msg.agent && (
          <span className={`text-[10px] font-semibold tracking-widest uppercase pl-0.5 ${msg.agentColor ?? 'text-neutral-500'}`}>
            {msg.agent}
          </span>
        )}
        <div className="bg-neutral-900 border border-neutral-800 text-neutral-100 rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
          {msg.text}
        </div>
      </div>
    </div>
  );
}

export default function CommandCenter() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [authed, setAuthed]     = useState(false);
  const [isPro, setIsPro]       = useState(false);
  const [userId, setUserId]     = useState('');
  const bottomRef               = useRef<HTMLDivElement>(null);
  const inputRef                = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      setUserId(session.user.id);
      const { data: profile } = await supabase
        .from('profiles').select('is_pro').eq('id', session.user.id).single();
      if (profile?.is_pro) setIsPro(true);
      setAuthed(true);
    })();
  }, [router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
  };

  const send = async (text: string) => {
    if (!text.trim() || loading || !userId) return;
    const { label, color } = detectAgent(text);
    setMessages(prev => [...prev, { role: 'user', text }]);
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    setLoading(true);

    try {
      // ✅ API expects: { prompt, userId }
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text, userId }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        role: 'ai',
        text: data.reply || data.error || 'Something went wrong. Please try again.',
        agent: label,
        agentColor: color,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'ai',
        text: 'Connection lost. Please check your network and try again.',
        agent: 'System',
        agentColor: 'text-red-400',
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); send(input); };
  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  const userCount  = messages.filter(m => m.role === 'user').length;
  const FREE_LIMIT = 5;
  const paywalled  = !isPro && userCount >= FREE_LIMIT;
  const isEmpty    = messages.length === 0;

  if (!authed) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-black font-bold text-sm">Ω</span>
          </div>
          <p className="text-sm text-neutral-500 animate-pulse">Loading command center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-neutral-950 text-white overflow-hidden">

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-neutral-900 bg-neutral-950 flex-shrink-0">
        <button onClick={() => router.push('/')}
          className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors text-sm">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center">
            <span className="text-black font-bold text-xs">Ω</span>
          </div>
          <span className="text-sm font-semibold text-white">Command Center</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs bg-emerald-950/60 border border-emerald-900/40 text-emerald-400 px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center min-h-full py-8 gap-6">
            <div className="text-center">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-black font-bold text-2xl">Ω</span>
              </div>
              <h1 className="text-2xl font-semibold text-white tracking-tight mb-2">
                How can I help<br />your business today?
              </h1>
              <p className="text-sm text-neutral-500 max-w-xs mx-auto leading-relaxed">
                Talk to me like a business partner. Ask anything — strategy, marketing, finances, growth.
              </p>
            </div>
            <div className="w-full max-w-sm flex flex-col gap-2">
              {STARTERS.map(({ icon, color, label, prompt }) => (
                <button key={label} onClick={() => send(prompt)}
                  className="flex items-center gap-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 rounded-2xl px-4 py-3 text-left transition-all group">
                  <span className={`${color} flex-shrink-0`}>{icon}</span>
                  <span className="text-sm text-neutral-300 group-hover:text-white transition-colors flex-1">{label}</span>
                  <ChevronRight size={14} className="text-neutral-600 group-hover:text-neutral-400 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 pt-4">
            {messages.map((msg, i) => <Bubble key={i} msg={msg} />)}
            {loading && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center flex-shrink-0">
                  <Sparkles size={12} className="text-neutral-300" />
                </div>
                <TypingDots />
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Paywall */}
      {paywalled && (
        <div className="mx-4 mb-3 bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-white">Free limit reached</p>
            <p className="text-xs text-neutral-500">Upgrade for unlimited AI access</p>
          </div>
          <button onClick={() => router.push('/billing')}
            className="flex-shrink-0 bg-white text-black text-xs font-semibold px-3 py-2 rounded-xl hover:bg-neutral-200 transition-colors">
            Upgrade
          </button>
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-6 pt-2 bg-neutral-950 border-t border-neutral-900 flex-shrink-0">
        {!isEmpty && !paywalled && (
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
            {STARTERS.slice(0, 4).map(({ label, prompt }) => (
              <button key={label} onClick={() => send(prompt)} disabled={loading}
                className="whitespace-nowrap bg-neutral-900 border border-neutral-800 text-neutral-400 text-xs px-3 py-1.5 rounded-full hover:bg-neutral-800 hover:text-white transition-all disabled:opacity-40 flex-shrink-0">
                {label}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <div className="flex-1">
            <textarea ref={inputRef} value={input} onChange={handleInput} onKeyDown={handleKey}
              rows={1} placeholder={paywalled ? 'Upgrade to continue...' : 'Ask your business anything...'}
              disabled={loading || paywalled}
              className="w-full bg-neutral-900 border border-neutral-800 hover:border-neutral-700 focus:border-neutral-600 rounded-2xl pl-4 pr-4 py-3 text-sm text-white placeholder-neutral-600 outline-none transition-colors resize-none leading-relaxed disabled:opacity-50"
              style={{ minHeight: '48px', maxHeight: '160px' }} />
          </div>
          <button type="submit" disabled={loading || paywalled || !input.trim()}
            className="w-11 h-11 rounded-2xl bg-white text-black flex items-center justify-center hover:bg-neutral-200 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
          </button>
        </form>
        <p className="text-center text-[10px] text-neutral-700 mt-2">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
    }
