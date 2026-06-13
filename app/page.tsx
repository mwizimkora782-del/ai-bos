'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import {
  Terminal, Users, Layers, Activity, Send, Landmark,
  LogOut, Zap, BarChart3, Lock, ShieldCheck, Menu, X,
  TrendingUp, Scale, Megaphone, ChevronRight
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const AGENTS: Record<string, { label: string; color: string; border: string; text: string; dot: string }> = {
  ai_ceo: {
    label: 'AI CEO',
    color: 'bg-neutral-900',
    border: 'border-neutral-800',
    text: 'text-neutral-100',
    dot: 'bg-neutral-400',
  },
  ai_marketing: {
    label: 'Marketing Agent',
    color: 'bg-indigo-950/40',
    border: 'border-indigo-900/50',
    text: 'text-indigo-100',
    dot: 'bg-indigo-400',
  },
  ai_analyst: {
    label: 'Data Analyst',
    color: 'bg-emerald-950/40',
    border: 'border-emerald-900/50',
    text: 'text-emerald-100',
    dot: 'bg-emerald-400',
  },
};

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}

function MessageBubble({ msg }: { msg: { role: string; text: string } }) {
  const isUser = msg.role === 'user';
  const agent = AGENTS[msg.role];

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[78%] bg-white text-black rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
          {msg.text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start gap-2">
      <div className="flex-shrink-0 mt-1">
        <div className={`w-6 h-6 rounded-full ${agent?.dot ?? 'bg-neutral-500'} flex items-center justify-center`}>
          <span className="text-[9px] font-bold text-black">AI</span>
        </div>
      </div>
      <div className="max-w-[78%] flex flex-col gap-1">
        {agent && (
          <span className="text-[10px] font-semibold text-neutral-500 tracking-wide uppercase pl-1">
            {agent.label}
          </span>
        )}
        <div className={`${agent?.color ?? 'bg-neutral-900'} border ${agent?.border ?? 'border-neutral-800'} ${agent?.text ?? 'text-neutral-100'} rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap`}>
          {msg.text}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userId, setUserId] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    const initializeSystem = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      setUserId(session.user.id);

      const { data: profile } = await supabase
        .from('profiles').select('is_pro').eq('id', session.user.id).single();
      if (profile?.is_pro) setIsPro(true);

      const { data: history } = await supabase
        .from('messages')
        .select('*')
        .eq('profile_id', session.user.id)
        .order('created_at', { ascending: true });

      if (history && history.length > 0) {
        setMessages(history.map(msg => ({ role: msg.sender, text: msg.content })));
      } else {
        setMessages([{ role: 'ai_ceo', text: 'System initialized. State your objective and I\'ll deploy the right agents.' }]);
      }
      setIsAuthenticating(false);
    };
    initializeSystem();
  }, [router]);

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/login'); };

  const userInteractionCount = messages.filter(m => m.role === 'user').length;
  const FREE_LIMIT = 5;
  const isPaywalled = !isPro && userInteractionCount >= FREE_LIMIT;

  // ✅ Fixed: sends prompt + userId
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || isPaywalled) return;
    const userMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMessage.text, userId }),
      });
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'ai_ceo', text: data.reply || data.error }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai_ceo', text: 'Network connection severed. Please retry.' }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const triggerWorkflow = async (
    promptText: string,
    endpoint: string,
    bodyKey: string,
    agentRole: string,
    offlineMsg: string
  ) => {
    if (loading || isPaywalled) return;
    const value = prompt(promptText);
    if (!value) return;
    setMessages(prev => [...prev, { role: 'user', text: `${promptText.split('?')[0]}: ${value}` }]);
    setLoading(true);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [bodyKey]: value }),
      });
      const data = await response.json();
      setMessages(prev => [...prev, { role: agentRole, text: data.reply || data.error }]);
    } catch {
      setMessages(prev => [...prev, { role: agentRole, text: offlineMsg }]);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      label: 'Email Campaign',
      icon: <Zap size={13} />,
      color: 'text-indigo-400',
      action: () => triggerWorkflow('What product are we creating a campaign for?', '/api/marketing', 'product', 'ai_marketing', 'Marketing Agent offline.'),
    },
    {
      label: 'Financial Analysis',
      icon: <BarChart3 size={13} />,
      color: 'text-emerald-400',
      action: () => triggerWorkflow('What metric or campaign should I analyze?', '/api/analyst', 'metric', 'ai_analyst', 'Data Analyst offline.'),
    },
    {
      label: 'Strategy',
      icon: <TrendingUp size={13} />,
      color: 'text-amber-400',
      action: () => setInput('Build a 90-day growth strategy for '),
    },
    {
      label: 'Legal Review',
      icon: <Scale size={13} />,
      color: 'text-rose-400',
      action: () => setInput('Review the following contract clause: '),
    },
    {
      label: 'Content Plan',
      icon: <Megaphone size={13} />,
      color: 'text-purple-400',
      action: () => setInput('Create a content calendar for '),
    },
  ];

  // ── Sidebar nav items with routing ──
  const NAV_ITEMS = [
    { icon: <Terminal size={15} />,  label: 'Command Core',    href: '/',                  active: true  },
    { icon: <Zap size={15} />,       label: 'Command Center',  href: '/command-center',    active: false },
    { icon: <Users size={15} />,     label: 'AI Workforce',    href: '/workforce',         active: false },
    { icon: <Layers size={15} />,    label: 'Architecture',    href: '/architecture',      active: false },
  ];

  if (isAuthenticating) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-black font-bold text-sm">Ω</div>
          <p className="text-sm text-neutral-400 animate-pulse">Synchronizing Enterprise Memory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-200 overflow-hidden text-sm relative">

      {/* PAYWALL OVERLAY */}
      {isPaywalled && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-2xl max-w-sm w-full text-center">
            <div className="mx-auto w-12 h-12 bg-indigo-500/20 text-indigo-400 flex items-center justify-center rounded-full mb-4">
              <Lock size={24} />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">Compute Limit Reached</h2>
            <p className="text-neutral-400 mb-6 text-sm leading-relaxed">
              You've used your {FREE_LIMIT} free executions. Upgrade to unlock unlimited AI workforce access.
            </p>
            <button
              onClick={() => router.push('/billing')}
              className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-neutral-200 transition flex items-center justify-center gap-2"
            >
              Upgrade to Pro — KES 6,500/mo <ChevronRight size={16} />
            </button>
            <button onClick={handleLogout} className="w-full mt-3 text-neutral-500 text-xs hover:text-white transition py-2">
              Sign out
            </button>
          </div>
        </div>
      )}

      {/* MOBILE SIDEBAR OVERLAY */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside className={`
        fixed md:relative z-50 md:z-auto
        w-64 h-full border-r border-neutral-900 bg-neutral-950 p-6 flex flex-col justify-between
        transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-white flex items-center justify-center text-black font-bold text-sm">Ω</div>
              <span className="text-sm font-semibold tracking-wider text-white">AI-BOS</span>
            </div>
            <button className="md:hidden text-neutral-500" onClick={() => setSidebarOpen(false)}>
              <X size={16} />
            </button>
          </div>

          {/* ✅ Nav with working routes */}
          <nav className="space-y-1">
            {NAV_ITEMS.map(({ icon, label, href, active }) => (
              <button
                key={label}
                onClick={() => { router.push(href); setSidebarOpen(false); }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-left transition ${
                  active ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                {icon} {label}
              </button>
            ))}
          </nav>

          {/* ✅ Quick nav cards — mobile shortcut */}
          <div className="mt-6 grid grid-cols-2 gap-2 md:hidden">
            <button
              onClick={() => router.push('/command-center')}
              className="flex flex-col items-start gap-1 bg-neutral-900 border border-neutral-800 rounded-xl p-3 hover:bg-neutral-800 transition"
            >
              <Zap size={14} className="text-amber-400" />
              <span className="text-xs text-neutral-300 font-medium">Command</span>
              <span className="text-[10px] text-neutral-500">Center</span>
            </button>
            <button
              onClick={() => router.push('/workforce')}
              className="flex flex-col items-start gap-1 bg-neutral-900 border border-neutral-800 rounded-xl p-3 hover:bg-neutral-800 transition"
            >
              <Users size={14} className="text-blue-400" />
              <span className="text-xs text-neutral-300 font-medium">AI</span>
              <span className="text-[10px] text-neutral-500">Workforce</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-950/30 transition text-left"
          >
            <LogOut size={15} /> Sign out
          </button>
          <div className="border-t border-neutral-900 pt-4">
            {isPro ? (
              <div className="flex items-center justify-between text-xs text-indigo-400 font-semibold p-2.5 bg-indigo-950/30 rounded-xl border border-indigo-900/50">
                <span className="flex items-center gap-1.5"><ShieldCheck size={13} /> PRO</span>
                <span>Unlimited</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span className="flex items-center gap-1.5">
                    <Activity size={11} className="text-emerald-500" /> Free Tier
                  </span>
                  <span>{Math.max(0, FREE_LIMIT - userInteractionCount)} / {FREE_LIMIT} left</span>
                </div>
                <div className="w-full bg-neutral-900 rounded-full h-1">
                  <div
                    className="bg-emerald-500 h-1 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (userInteractionCount / FREE_LIMIT) * 100)}%` }}
                  />
                </div>
                <button
                  onClick={() => router.push('/billing')}
                  className="w-full text-xs text-neutral-500 hover:text-white border border-neutral-800 rounded-lg py-1.5 transition hover:bg-neutral-900"
                >
                  Upgrade to Pro
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* HEADER */}
        <header className="border-b border-neutral-900 px-4 py-3 flex justify-between items-center bg-neutral-950 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button className="md:hidden text-neutral-400 hover:text-white transition" onClick={() => setSidebarOpen(true)}>
              <Menu size={18} />
            </button>
            <div>
              <h1 className="text-sm font-medium text-white">Command Core</h1>
              <p className="text-[11px] text-neutral-500 hidden sm:block">Multi-agent execution</p>
            </div>
          </div>

          {/* ✅ Header nav shortcuts for mobile */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/command-center')}
              className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 px-2.5 py-1.5 rounded-lg text-neutral-400 hover:text-white text-xs transition"
            >
              <Zap size={11} className="text-amber-400" /> Center
            </button>
            <button
              onClick={() => router.push('/workforce')}
              className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 px-2.5 py-1.5 rounded-lg text-neutral-400 hover:text-white text-xs transition"
            >
              <Users size={11} className="text-blue-400" /> Workforce
            </button>
            <div className="bg-neutral-900 border border-neutral-800 px-2.5 py-1.5 rounded-lg text-neutral-400 flex items-center gap-1.5 text-xs">
              <Landmark size={11} className="text-neutral-500" />
              <span className="text-white font-mono font-semibold">Secure</span>
            </div>
          </div>
        </header>

        {/* MESSAGES */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
          {messages.map((msg, idx) => (
            <MessageBubble key={idx} msg={msg} />
          ))}
          {loading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* FOOTER */}
        <footer className="px-4 pt-3 pb-5 bg-neutral-950 border-t border-neutral-900 flex-shrink-0 space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {quickActions.map(({ label, icon, color, action }) => (
              <button
                key={label}
                onClick={action}
                disabled={loading || isPaywalled}
                className={`flex items-center gap-1.5 whitespace-nowrap bg-neutral-900 border border-neutral-800 ${color} font-medium text-xs px-3 py-2 rounded-xl hover:bg-neutral-800 transition disabled:opacity-40 flex-shrink-0`}
              >
                {icon} {label}
              </button>
            ))}
          </div>
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <div className="flex-1">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={isPaywalled ? 'Upgrade to continue...' : 'Instruct your AI Workforce...'}
                disabled={loading || isPaywalled}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl pl-4 pr-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-700 transition disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={loading || isPaywalled || !input.trim()}
              className="w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center hover:bg-neutral-200 transition disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              <Send size={15} />
            </button>
          </form>
        </footer>
      </main>
    </div>
  );
                             }
