'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { ShieldCheck, Lock, ArrowRight, Loader2 } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Mode = 'login' | 'signup';

const TRUST_BADGES = [
  { label: 'SOC 2 certified', color: 'text-emerald-600' },
  { label: '256-bit encrypted', color: 'text-amber-600' },
  { label: 'GDPR ready', color: 'text-blue-600' },
];

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [message, setMessage]   = useState('');
  const [isError, setIsError]   = useState(false);
  const [mode, setMode]         = useState<Mode>('login');
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsError(false);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Account created. Check your email to confirm, then sign in.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/');
      }
    } catch (error: any) {
      setIsError(true);
      setMessage(error.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center px-4 py-12">

      {/* Top status bar */}
      <div className="w-full max-w-sm mb-6 flex items-center justify-between text-xs text-neutral-600">
        <span className="font-mono tracking-wider">AI-BOS v2.0</span>
        <span className="flex items-center gap-1.5 bg-emerald-950/50 border border-emerald-900/40 text-emerald-500 px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Systems online
        </span>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-neutral-900/60 border border-neutral-800/60 rounded-3xl overflow-hidden backdrop-blur-sm">

        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-neutral-800/50">
          <div className="flex items-center gap-3 mb-7">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-black font-bold text-lg leading-none">Ω</span>
            </div>
            <div>
              <p className="text-white font-semibold text-sm tracking-wide">AI-BOS</p>
              <p className="text-neutral-500 text-xs tracking-widest uppercase">Enterprise OS</p>
            </div>
          </div>

          <h1 className="text-2xl font-semibold text-white tracking-tight leading-tight mb-2">
            {mode === 'login' ? 'Your autonomous\nworkforce awaits.' : 'Create your\ncommand center.'}
          </h1>
          <p className="text-sm text-neutral-500 leading-relaxed">
            {mode === 'login'
              ? 'Sign in to deploy AI agents across your entire operation.'
              : 'Launch your enterprise AI workforce in under 60 seconds.'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleAuth} className="px-8 py-6 space-y-4">

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-neutral-400 tracking-widest uppercase">
              Corporate email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="ceo@yourcompany.com"
              required
              autoComplete="email"
              className="w-full bg-neutral-950/80 border border-neutral-800 hover:border-neutral-700 focus:border-neutral-600 rounded-xl px-4 py-3.5 text-sm text-white placeholder-neutral-600 outline-none transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-neutral-400 tracking-widest uppercase">
                Passkey
              </label>
              {mode === 'login' && (
                <button
                  type="button"
                  className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  Forgot passkey?
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="w-full bg-neutral-950/80 border border-neutral-800 hover:border-neutral-700 focus:border-neutral-600 rounded-xl pl-4 pr-11 py-3.5 text-sm text-white placeholder-neutral-600 outline-none transition-colors"
              />
              <Lock size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-600" />
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`flex items-start gap-2.5 px-4 py-3 rounded-xl text-xs leading-relaxed border ${
              isError
                ? 'bg-red-950/30 border-red-900/50 text-red-400'
                : 'bg-emerald-950/30 border-emerald-900/50 text-emerald-400'
            }`}>
              <ShieldCheck size={13} className="mt-0.5 flex-shrink-0" />
              {message}
            </div>
          )}

          {/* Primary CTA */}
          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full bg-white hover:bg-neutral-100 active:bg-neutral-200 text-black font-semibold py-3.5 rounded-xl text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                {mode === 'login' ? 'Authenticating...' : 'Deploying instance...'}
              </>
            ) : (
              <>
                {mode === 'login' ? 'Initialize access' : 'Deploy enterprise account'}
                <ArrowRight size={15} />
              </>
            )}
          </button>

          {/* Mode toggle */}
          <div className="flex items-center gap-3 pt-1">
            <div className="flex-1 h-px bg-neutral-800" />
            <span className="text-xs text-neutral-600 whitespace-nowrap">
              {mode === 'login' ? 'New to AI-BOS?' : 'Already have access?'}
            </span>
            <div className="flex-1 h-px bg-neutral-800" />
          </div>

          <button
            type="button"
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage(''); }}
            className="w-full bg-transparent hover:bg-neutral-800/60 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white font-medium py-3.5 rounded-xl text-sm transition-all"
          >
            {mode === 'login' ? 'Create enterprise account' : 'Sign in instead'}
          </button>
        </form>

        {/* Trust badges */}
        <div className="px-8 py-4 border-t border-neutral-800/50 flex items-center justify-between">
          {TRUST_BADGES.map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <ShieldCheck size={10} className={color} />
              <span className="text-[10px] text-neutral-600">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <p className="mt-6 text-xs text-neutral-700 text-center">
        © 2026 AI-BOS · Enterprise Autonomous Operations
      </p>
    </div>
  );
          }
