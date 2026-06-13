'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import {
  ArrowLeft, Crown, Megaphone, TrendingUp,
  Headphones, Calculator, Users, Terminal,
  Loader2, Sparkles, ChevronRight
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

type Agent = {
  id:       string;
  name:     string;
  role:     string;
  icon:     React.ReactNode;
  color:    string;
  bg:       string;
  stat:     string;
  statVal:  string;
  status:   'active' | 'idle';
  prompt:   string;
};

const AGENTS: Agent[] = [
  {
    id: 'ceo', name: 'AI CEO', role: 'Strategy & Growth',
    icon: <Crown size={20} />,
    color: 'text-violet-600', bg: 'bg-violet-100',
    stat: 'Tasks today', statVal: '12 completed', status: 'active',
    prompt: 'You are the AI CEO. Give me a full strategic business overview and the top 3 things I should focus on this month to grow.',
  },
  {
    id: 'marketing', name: 'Marketing Manager', role: 'Campaigns & Ads',
    icon: <Megaphone size={20} />,
    color: 'text-blue-600', bg: 'bg-blue-100',
    stat: 'Campaigns', statVal: '3 active', status: 'active',
    prompt: 'You are the AI Marketing Manager. Create a complete marketing campaign for my business including ad copy, target audience, and a 7-day posting schedule.',
  },
  {
    id: 'sales', name: 'Sales Representative', role: 'Leads & Closing',
    icon: <TrendingUp size={20} />,
    color: 'text-emerald-600', bg: 'bg-emerald-100',
    stat: 'Leads this week', statVal: '24 new', status: 'active',
    prompt: 'You are the AI Sales Representative. Give me a proven sales script, objection handling guide, and the top 5 ways to close more deals for my business.',
  },
  {
    id: 'support', name: 'Customer Support', role: 'Replies & Service',
    icon: <Headphones size={20} />,
    color: 'text-amber-600', bg: 'bg-amber-100',
    stat: 'Tickets resolved', statVal: '8 today', status: 'active',
    prompt: 'You are the AI Customer Support agent. Write 5 professional customer reply templates for common issues like complaints, refunds, delays, and positive feedback.',
  },
  {
    id: 'finance', name: 'AI Accountant', role: 'Finance & Reports',
    icon: <Calculator size={20} />,
    color: 'text-pink-600', bg: 'bg-pink-100',
    stat: 'Reports pending', statVal: '2 ready', status: 'idle',
    prompt: 'You are the AI Accountant. Analyze my business finances and give me a clear breakdown of how to increase profit, reduce expenses, and manage cash flow better.',
  },
  {
    id: 'hr', name: 'HR Recruiter', role: 'Hiring & Culture',
    icon: <Users size={20} />,
    color: 'text-slate-600', bg: 'bg-slate-100',
    stat: 'Applicants', statVal: '5 reviewed', status: 'idle',
    prompt: 'You are the AI HR Recruiter. Help me hire the right people — write a job description, interview questions, and an onboarding checklist for a new team member.',
  },
];

type ChatMsg = { role: 'user' | 'ai'; text: string };

export default function Workforce() {
  const router = useRouter();
  const [userId, setUserId]         = useState('');
  const [authed, setAuthed]         = useState(false);
  const [active, setActive]         = useState<Agent | null>(null);
  const [messages, setMessages]     = useState<ChatMsg[]>([]);
  const [input, setInput]           = useState('');
  const [loading, setLoading]       = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      setUserId(session.user.id);
      setAuthed(true);
    })();
  }, [router]);

  const deployAgent = async (agent: Agent) => {
    setActive(agent);
    setMessages([]);
    setLoading(true);
    try {
      const res  = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: agent.prompt, userId }),
      });
      const data = await res.json();
      setMessages([{ role: 'ai', text: data.reply || data.error }]);
    } catch {
      setMessages([{ role: 'ai', text: 'Agent offline. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading || !active) return;
    const text = input;
    setMessages(prev => [...prev, { role: 'user', text }]);
    setInput('');
    setLoading(true);
    try {
      const context = `You are the ${active.name} (${active.role}). `;
      const res = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: context + text, userId }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', text: data.reply || data.error }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: 'Connection lost.' }]);
    } finally {
      setLoading(false);
    }
  };

  if (!authed) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-950">
        <p className="text-sm text-neutral-500 animate-pulse">Loading workforce...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-neutral-950 text-white">

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-neutral-900 bg-neutral-950 sticky top-0 z-10">
        <button
          onClick={() => active ? setActive(null) : router.push('/')}
          className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft size={16} />
          {active ? 'All agents' : 'Back'}
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center">
            <span className="text-black font-bold text-xs">Ω</span>
          </div>
          <span className="text-sm font-semibold">{active ? active.name : 'AI Workforce'}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs bg-emerald-950/60 border border-emerald-900/40 text-emerald-400 px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </div>
      </header>

      {/* ── AGENT GRID ── */}
      {!active && (
        <div className="flex-1 px-4 py-5">
          <div className="mb-5">
            <h1 className="text-lg font-semibold text-white mb-1">Your AI Employees</h1>
            <p className="text-sm text-neutral-500">Tap any agent to deploy them instantly.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {AGENTS.map(agent => (
              <button
                key={agent.id}
                onClick={() => deployAgent(agent)}
                className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-2xl p-4 text-left transition-all hover:bg-neutral-800/60 active:scale-95"
              >
                {/* Top row */}
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl ${agent.bg} ${agent.color} flex items-center justify-center flex-shrink-0`}>
                    {agent.icon}
                  </div>
                  <div className={`w-2 h-2 rounded-full mt-1 ${agent.status === 'active' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                </div>

                <p className="text-sm font-medium text-white mb-0.5">{agent.name}</p>
                <p className="text-xs text-neutral-500 mb-3">{agent.role}</p>

                <div className="bg-neutral-800/60 rounded-lg px-2.5 py-1.5 mb-3">
                  <p className="text-[10px] text-neutral-500">{agent.stat}</p>
                  <p className="text-xs font-medium text-neutral-200">{agent.statVal}</p>
                </div>

                <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-400 border border-neutral-700 rounded-lg py-1.5">
                  <Terminal size={11} /> Deploy
                  <ChevronRight size={11} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── AGENT CHAT ── */}
      {active && (
        <div className="flex-1 flex flex-col">

          {/* Agent info bar */}
          <div className={`mx-4 mt-4 ${active.bg} rounded-2xl p-4 flex items-center gap-3`}>
            <div className={`w-10 h-10 rounded-xl bg-white/60 ${active.color} flex items-center justify-center flex-shrink-0`}>
              {active.icon}
            </div>
            <div>
              <p className={`text-sm font-semibold ${active.color}`}>{active.name}</p>
              <p className="text-xs text-neutral-600">{active.role} · Active</p>
            </div>
            <div className="ml-auto w-2 h-2 rounded-full bg-emerald-500" />
          </div>

          {/* Messages */}
          <div className="flex-1 px-4 py-4 space-y-4 overflow-y-auto">
            {loading && messages.length === 0 && (
              <div className="flex gap-2.5">
                <div className={`w-7 h-7 rounded-full ${active.bg} ${active.color} flex items-center justify-center flex-shrink-0`}>
                  <Sparkles size={12} />
                </div>
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                  {[0, 150, 300].map(d => (
                    <span key={d} className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'gap-2.5'}`}>
                {msg.role === 'ai' && (
                  <div className={`w-7 h-7 rounded-full ${active.bg} ${active.color} flex items-center justify-center flex-shrink-0 mt-1`}>
                    <Sparkles size={12} />
                  </div>
                )}
                <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-white text-black rounded-br-sm'
                    : 'bg-neutral-900 border border-neutral-800 text-neutral-100 rounded-tl-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && messages.length > 0 && (
              <div className="flex gap-2.5">
                <div className={`w-7 h-7 rounded-full ${active.bg} ${active.color} flex items-center justify-center flex-shrink-0`}>
                  <Sparkles size={12} />
                </div>
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                  {[0, 150, 300].map(d => (
                    <span key={d} className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="px-4 pb-6 pt-2 border-t border-neutral-900 bg-neutral-950 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder={`Ask ${active.name} anything...`}
              disabled={loading}
              className="flex-1 bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-neutral-600 outline-none focus:border-neutral-700 transition-colors disabled:opacity-50"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="w-11 h-11 rounded-2xl bg-white text-black flex items-center justify-center hover:bg-neutral-200 transition-all disabled:opacity-30 flex-shrink-0"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <ChevronRight size={16} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
    }
