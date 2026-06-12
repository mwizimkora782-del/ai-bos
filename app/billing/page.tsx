'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import {
  ArrowLeft, Check, Smartphone, CreditCard,
  Loader2, ShieldCheck, Zap, Brain, BarChart3,
  Database, Star
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const FEATURES = [
  { icon: <Brain size={13} />,    label: 'Unlimited AI CEO directives',         color: 'text-violet-400' },
  { icon: <Zap size={13} />,      label: 'Marketing Agent — full campaigns',    color: 'text-indigo-400' },
  { icon: <BarChart3 size={13} />, label: 'Financial Analyst — live reports',   color: 'text-emerald-400' },
  { icon: <Database size={13} />, label: 'Persistent memory across sessions',   color: 'text-amber-400'  },
  { icon: <Star size={13} />,     label: 'Priority execution queue',            color: 'text-rose-400'   },
];

type Status = { text: string; type: 'idle' | 'info' | 'success' | 'error' };

export default function Billing() {
  const router = useRouter();
  const [phone, setPhone]   = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus]   = useState<Status>({ text: '', type: 'idle' });
  const [userId, setUserId]   = useState('');

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      setUserId(session.user.id);
    };
    getUser();
  }, [router]);

  const formatPhone = (value: string) => {
    // Strip non-digits, keep max 12 chars
    return value.replace(/\D/g, '').slice(0, 12);
  };

  const handleMpesaPayment = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 9) {
      setStatus({ text: 'Enter a valid Safaricom number e.g. 0712 345 678', type: 'error' });
      return;
    }

    setLoading(true);
    setStatus({ text: 'Connecting to Safaricom...', type: 'info' });

    try {
      const response = await fetch('/api/mpesa/stk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: digits, userId }),
      });

      const rawText = await response.text();
      let data: any;
      try { data = JSON.parse(rawText); }
      catch { throw new Error('Server returned invalid response. Please try again.'); }

      if (!response.ok) throw new Error(data.error || 'Transaction failed.');

      setStatus({ text: 'STK push sent! Check your phone and enter your M-Pesa PIN.', type: 'success' });

      // Poll for upgrade confirmation
      const poll = setInterval(async () => {
        const { data: profile } = await supabase
          .from('profiles').select('is_pro').eq('id', userId).single();
        if (profile?.is_pro) {
          clearInterval(poll);
          setStatus({ text: 'Payment confirmed! Unlocking your enterprise account...', type: 'success' });
          setTimeout(() => router.push('/'), 2000);
        }
      }, 3000);

    } catch (err: any) {
      setStatus({ text: err.message || 'Payment failed. Please try again.', type: 'error' });
      setLoading(false);
    }
  };

  const statusStyles: Record<Status['type'], string> = {
    idle:    '',
    info:    'bg-neutral-900 border border-neutral-800 text-neutral-400',
    success: 'bg-emerald-950/40 border border-emerald-900/50 text-emerald-400',
    error:   'bg-red-950/30 border border-red-900/50 text-red-400',
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center px-4 py-12">

      {/* Back button */}
      <div className="w-full max-w-md mb-4">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-neutral-500 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft size={15} /> Back to command core
        </button>
      </div>

      {/* Main card */}
      <div className="w-full max-w-md bg-neutral-900/60 border border-neutral-800/60 rounded-3xl overflow-hidden backdrop-blur-sm">

        {/* Hero section */}
        <div className="px-7 pt-7 pb-6 border-b border-neutral-800/50">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-sm">Ω</span>
              </div>
              <span className="text-sm font-semibold text-white tracking-wide">AI-BOS Pro</span>
            </div>
            <div className="bg-violet-950/60 border border-violet-900/50 text-violet-400 text-[10px] font-semibold px-2.5 py-1 rounded-full tracking-wider uppercase">
              Recommended
            </div>
          </div>

          <p className="text-xs text-neutral-500 uppercase tracking-widest mb-2">Professional tier</p>
          <h1 className="text-2xl font-semibold text-white tracking-tight leading-tight mb-2">
            Deploy your full<br />AI workforce
          </h1>
          <p className="text-sm text-neutral-500 leading-relaxed mb-5">
            Remove all limits. Your agents work 24/7 across every department — so you don't have to.
          </p>

          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-white tracking-tight">
              <span className="text-xl mr-0.5">KES</span>6,500
            </span>
            <span className="text-neutral-500 text-sm">/month</span>
            <span className="ml-2 bg-emerald-950/50 border border-emerald-900/40 text-emerald-500 text-xs px-2 py-0.5 rounded-full">
              ~$50 USD
            </span>
          </div>
        </div>

        {/* Features */}
        <div className="px-7 py-5 border-b border-neutral-800/50 space-y-3">
          {FEATURES.map(({ icon, label, color }) => (
            <div key={label} className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-lg bg-neutral-800/80 flex items-center justify-center flex-shrink-0 ${color}`}>
                {icon}
              </div>
              <span className="text-sm text-neutral-300">{label}</span>
              <Check size={13} className="text-emerald-500 ml-auto flex-shrink-0" />
            </div>
          ))}
        </div>

        {/* Payment section */}
        <div className="px-7 py-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-neutral-800" />
            <span className="text-xs text-neutral-600 uppercase tracking-widest">M-Pesa checkout</span>
            <div className="flex-1 h-px bg-neutral-800" />
          </div>

          {/* Phone input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-500 uppercase tracking-widest">
              Safaricom number
            </label>
            <div className="relative">
              <Smartphone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600" />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(formatPhone(e.target.value))}
                placeholder="0712 345 678"
                disabled={loading}
                className="w-full bg-neutral-950/80 border border-neutral-800 hover:border-neutral-700 focus:border-emerald-700 rounded-xl pl-10 pr-4 py-3.5 text-sm text-white placeholder-neutral-600 outline-none transition-colors disabled:opacity-50"
              />
            </div>
          </div>

          {/* Status message */}
          {status.text && (
            <div className={`flex items-start gap-2.5 px-4 py-3 rounded-xl text-xs leading-relaxed ${statusStyles[status.type]}`}>
              <ShieldCheck size={13} className="mt-0.5 flex-shrink-0" />
              {status.text}
            </div>
          )}

          {/* STK hint */}
          {!status.text && (
            <p className="text-xs text-neutral-600 leading-relaxed text-center">
              You'll receive an STK push on your phone.<br />Enter your M-Pesa PIN to confirm.
            </p>
          )}

          {/* M-Pesa button */}
          <button
            onClick={handleMpesaPayment}
            disabled={loading || !phone}
            className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold py-4 rounded-xl text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Processing...</>
            ) : (
              <><Smartphone size={16} /> Pay KES 6,500 with M-Pesa</>
            )}
          </button>

          {/* Card button */}
          <button
            disabled
            className="w-full bg-transparent border border-neutral-800 text-neutral-600 font-medium py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 cursor-not-allowed"
          >
            <CreditCard size={15} /> Global card — coming soon
          </button>
        </div>

        {/* Trust footer */}
        <div className="px-7 py-4 border-t border-neutral-800/50 flex items-center justify-between">
          {[
            { icon: <ShieldCheck size={11} />, label: '256-bit encrypted' },
            { icon: <Check size={11} />,       label: 'Instant unlock'     },
            { icon: <ArrowLeft size={11} />,   label: 'Cancel anytime'     },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-[10px] text-neutral-600">
              {icon} {label}
            </div>
          ))}
        </div>
      </div>

      <p className="mt-6 text-xs text-neutral-700 text-center">
        © 2026 AI-BOS · Secure payments via Safaricom M-Pesa
      </p>
    </div>
  );
              }
