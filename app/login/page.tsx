'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { ShieldCheck, Lock, ArrowRight, Loader2, Mail, KeyRound } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Step = 'login' | 'signup' | 'verify';

const TRUST_BADGES = [
  { label: 'SOC 2 certified',   color: 'text-emerald-600' },
  { label: '256-bit encrypted', color: 'text-amber-600'   },
  { label: 'GDPR ready',        color: 'text-blue-600'    },
];

export default function Login() {
  const [step, setStep]       = useState<Step>('signup');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp]         = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const router = useRouter();

  const setMsg = (text: string, error = false) => {
    setMessage(text);
    setIsError(error);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setMsg('Passkey must be at least 6 characters.', true); return; }
    setLoading(true);
    setMsg('');
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      setMsg('Verification code sent! Check your inbox.');
      setStep('verify');
    } catch (err: any) {
      const m = (err.message || '').toLowerCase();
      if (m.includes('already registered') || m.includes('already exists')) {
        setMsg('This email already has an account. Sign in instead.', true);
        setTimeout(() => { setStep('login'); setMsg(''); }, 2500);
      } else {
        setMsg(err.message || 'Signup failed. Try again.', true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) { setMsg('Enter the 6-digit code from your email.', true); return; }
    setLoading(true);
    setMsg('Verifying your code...');
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'signup' });
      if (error) throw error;
      setMsg('Identity confirmed! Building your workspace...');
      setTimeout(() => router.push('/onboarding'), 1500); // ✅ goes to onboarding
    } catch (err: any) {
      const m = (err.message || '').toLowerCase();
      if (m.includes('expired')) {
        setMsg('Code expired. Please sign up again to get a new one.', true);
        setTimeout(() => { setStep('signup'); setOtp(''); setMsg(''); }, 3000);
      } else if (m.includes('invalid') || m.includes('incorrect')) {
        setMsg('Wrong code. Double-check your email and try again.', true);
      } else {
        setMsg(err.message || 'Verification failed. Try again.', true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setMsg('Sending a new code...');
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) throw error;
      setMsg('New code sent! Check your inbox.', false);
    } catch {
      setMsg('Could not resend. Please wait a moment and try again.', true);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push('/onboarding'); // ✅ goes to onboarding (skips if already done)
    } catch (err: any) {
      const m = (err.message || '').toLowerCase();
      if (m.includes('email not confirmed')) {
        setMsg('Please verify your email first. Check your inbox for the code.', true);
        setTimeout(() => { setStep('verify'); setMsg(''); }, 2500);
      } else if (m.includes('invalid') || m.includes('wrong') || m.includes('credentials')) {
        setMsg('Wrong email or passkey. Please try again.', true);
      } else {
        setMsg(err.message || 'Login failed. Try again.', true);
      }
    } finally {
      setLoading(false);
    }
  };

  const msgStyle = isError
    ? 'bg-red-950/30 border border-red-900/50 text-red-400'
    : 'bg-emerald-950/30 border border-emerald-900/50 text-emerald-400';

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center px-4 py-12">

      <div className="w-full max-w-sm mb-6 flex items-center justify-between text-xs text-neutral-600">
        <span className="font-mono tracking-wider">AI-BOS v2.0</span>
        <span className="flex items-center gap-1.5 bg-emerald-950/50 border border-emerald-900/40 text-emerald-500 px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Systems online
        </span>
      </div>

      <div className="w-full max-w-sm bg-neutral-900/60 border border-neutral-800/60 rounded-3xl overflow-hidden backdrop-blur-sm">

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

          {step !== 'login' && (
            <div className="flex items-center gap-2 mb-5">
              {(['signup', 'verify'] as Step[]).map((s, i) => (
                <React.Fragment key={s}>
                  <div className={`flex items-center gap-1.5 text-xs font-medium ${step === s ? 'text-white' : i < (['signup','verify'] as Step[]).indexOf(step) ? 'text-emerald-500' : 'text-neutral-600'}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${step === s ? 'border-white text-white' : i < (['signup','verify'] as Step[]).indexOf(step) ? 'border-emerald-500 text-emerald-500' : 'border-neutral-700 text-neutral-600'}`}>
                      {i + 1}
                    </div>
                    {s === 'signup' ? 'Create account' : 'Verify email'}
                  </div>
                  {i === 0 && <div className="flex-1 h-px bg-neutral-800" />}
                </React.Fragment>
              ))}
            </div>
          )}

          <h1 className="text-2xl font-semibold text-white tracking-tight leading-tight mb-2">
            {step === 'login'  && 'Welcome back.'}
            {step === 'signup' && 'Create your\ncommand center.'}
            {step === 'verify' && 'Check your\ninbox.'}
          </h1>
          <p className="text-sm text-neutral-500 leading-relaxed">
            {step === 'login'  && 'Sign in to deploy your AI workforce.'}
            {step === 'signup' && 'Launch your enterprise AI workforce in under 60 seconds.'}
            {step === 'verify' && `We sent a 6-digit code to ${email}`}
          </p>
        </div>

        {/* SIGNUP */}
        {step === 'signup' && (
          <form onSubmit={handleSignup} className="px-8 py-6 space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-neutral-400 tracking-widest uppercase">Email address</label>
              <div className="relative">
                <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@yourcompany.com" required autoComplete="email"
                  className="w-full bg-neutral-950/80 border border-neutral-800 hover:border-neutral-700 focus:border-neutral-600 rounded-xl pl-10 pr-4 py-3.5 text-sm text-white placeholder-neutral-600 outline-none transition-colors" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-neutral-400 tracking-widest uppercase">Create passkey</label>
              <div className="relative">
                <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600" />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 6 characters" required minLength={6} autoComplete="new-password"
                  className="w-full bg-neutral-950/80 border border-neutral-800 hover:border-neutral-700 focus:border-neutral-600 rounded-xl pl-10 pr-4 py-3.5 text-sm text-white placeholder-neutral-600 outline-none transition-colors" />
              </div>
            </div>
            {message && (
              <div className={`flex items-start gap-2.5 px-4 py-3 rounded-xl text-xs leading-relaxed ${msgStyle}`}>
                <ShieldCheck size={13} className="mt-0.5 flex-shrink-0" />{message}
              </div>
            )}
            <button type="submit" disabled={loading || !email || !password}
              className="w-full bg-white hover:bg-neutral-100 text-black font-semibold py-3.5 rounded-xl text-sm transition-colors disabled:opacity-40 flex items-center justify-center gap-2 mt-1">
              {loading ? <><Loader2 size={15} className="animate-spin" /> Creating account...</> : <>Create account & send code <ArrowRight size={15} /></>}
            </button>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-neutral-800" />
              <span className="text-xs text-neutral-600 whitespace-nowrap">Already have access?</span>
              <div className="flex-1 h-px bg-neutral-800" />
            </div>
            <button type="button" onClick={() => { setStep('login'); setMsg(''); }}
              className="w-full bg-transparent hover:bg-neutral-800/60 border border-neutral-800 text-neutral-400 hover:text-white font-medium py-3.5 rounded-xl text-sm transition-all">
              Sign in instead
            </button>
          </form>
        )}

        {/* VERIFY OTP */}
        {step === 'verify' && (
          <form onSubmit={handleVerify} className="px-8 py-6 space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-neutral-400 tracking-widest uppercase">6-digit verification code</label>
              <div className="relative">
                <KeyRound size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600" />
                <input type="text" value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000" required maxLength={6} inputMode="numeric" autoComplete="one-time-code"
                  className="w-full bg-neutral-950/80 border border-neutral-800 hover:border-neutral-700 focus:border-emerald-700 rounded-xl pl-10 pr-4 py-3.5 text-sm text-white placeholder-neutral-600 outline-none transition-colors tracking-[0.3em] font-mono text-center" />
              </div>
              <p className="text-xs text-neutral-600 text-center">Check spam/junk if you don't see it</p>
            </div>
            {message && (
              <div className={`flex items-start gap-2.5 px-4 py-3 rounded-xl text-xs leading-relaxed ${msgStyle}`}>
                <ShieldCheck size={13} className="mt-0.5 flex-shrink-0" />{message}
              </div>
            )}
            <button type="submit" disabled={loading || otp.length < 6}
              className="w-full bg-white hover:bg-neutral-100 text-black font-semibold py-3.5 rounded-xl text-sm transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
              {loading ? <><Loader2 size={15} className="animate-spin" /> Verifying...</> : <>Verify & enter workspace <ArrowRight size={15} /></>}
            </button>
            <div className="flex items-center justify-between text-xs pt-1">
              <button type="button" onClick={() => { setStep('signup'); setOtp(''); setMsg(''); }}
                className="text-neutral-500 hover:text-white transition-colors">
                ← Change email
              </button>
              <button type="button" onClick={handleResend} disabled={loading}
                className="text-neutral-500 hover:text-emerald-400 transition-colors disabled:opacity-40">
                Resend code
              </button>
            </div>
          </form>
        )}

        {/* LOGIN */}
        {step === 'login' && (
          <form onSubmit={handleLogin} className="px-8 py-6 space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-neutral-400 tracking-widest uppercase">Email address</label>
              <div className="relative">
                <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@yourcompany.com" required autoComplete="email"
                  className="w-full bg-neutral-950/80 border border-neutral-800 hover:border-neutral-700 focus:border-neutral-600 rounded-xl pl-10 pr-4 py-3.5 text-sm text-white placeholder-neutral-600 outline-none transition-colors" />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-neutral-400 tracking-widest uppercase">Passkey</label>
                <button type="button" className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors">Forgot passkey?</button>
              </div>
              <div className="relative">
                <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600" />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Your passkey" required autoComplete="current-password"
                  className="w-full bg-neutral-950/80 border border-neutral-800 hover:border-neutral-700 focus:border-neutral-600 rounded-xl pl-10 pr-4 py-3.5 text-sm text-white placeholder-neutral-600 outline-none transition-colors" />
              </div>
            </div>
            {message && (
              <div className={`flex items-start gap-2.5 px-4 py-3 rounded-xl text-xs leading-relaxed ${msgStyle}`}>
                <ShieldCheck size={13} className="mt-0.5 flex-shrink-0" />{message}
              </div>
            )}
            <button type="submit" disabled={loading || !email || !password}
              className="w-full bg-white hover:bg-neutral-100 text-black font-semibold py-3.5 rounded-xl text-sm transition-colors disabled:opacity-40 flex items-center justify-center gap-2 mt-1">
              {loading ? <><Loader2 size={15} className="animate-spin" /> Authenticating...</> : <>Initialize access <ArrowRight size={15} /></>}
            </button>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-neutral-800" />
              <span className="text-xs text-neutral-600 whitespace-nowrap">New to AI-BOS?</span>
              <div className="flex-1 h-px bg-neutral-800" />
            </div>
            <button type="button" onClick={() => { setStep('signup'); setMsg(''); }}
              className="w-full bg-transparent hover:bg-neutral-800/60 border border-neutral-800 text-neutral-400 hover:text-white font-medium py-3.5 rounded-xl text-sm transition-all">
              Create enterprise account
            </button>
          </form>
        )}

        <div className="px-8 py-4 border-t border-neutral-800/50 flex items-center justify-between">
          {TRUST_BADGES.map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <ShieldCheck size={10} className={color} />
              <span className="text-[10px] text-neutral-600">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-6 text-xs text-neutral-700 text-center">
        2026 AI-BOS · Enterprise Autonomous Operations
      </p>
    </div>
  );
    }p
