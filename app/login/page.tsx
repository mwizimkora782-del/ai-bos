'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { ShieldCheck, Lock, ArrowRight, Loader2, Mail, KeyRound } from 'lucide-react';

// Architect Note: We avoid top-level module execution to prevent Vercel build crashes.
// The client is safely instantiated inside the component or via a getter function.
const getSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    console.warn('Supabase environment variables are missing.');
    return null;
  }
  return createClient(url, key);
};

type Step = 'signup' | 'verify' | 'login';

export default function LoginPage() {
  const router = useRouter();
  
  // Initialize Supabase safely on the client side
  const supabase = useMemo(() => getSupabaseClient(), []);

  const [step, setStep]         = useState<Step>('signup');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp]           = useState('');
  const [loading, setLoading]   = useState(false);
  const [message, setMessage]   = useState({ text: '', isError: false });

  const showMsg = (text: string, isError = false) => setMessage({ text, isError });
  const clearMsg = () => setMessage({ text: '', isError: false });

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return showMsg('System configuration error. Contact support.', true);
    if (password.length < 6) return showMsg('Passkey must be at least 6 characters.', true);
    
    setLoading(true);
    clearMsg();
    
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      
      showMsg('Verification code sent! Check your inbox.');
      setStep('verify');
    } catch (err: any) {
      const msg = err.message?.toLowerCase() || '';
      if (msg.includes('already registered') || msg.includes('already exists')) {
        showMsg('This email already has an account. Redirecting to login...', true);
        setTimeout(() => { setStep('login'); clearMsg(); }, 2000);
      } else {
        showMsg(err.message || 'Signup failed. Please try again.', true);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return showMsg('System configuration error.', true);
    if (otp.length < 6) return showMsg('Enter the 6-digit code from your email.', true);
    
    setLoading(true);
    showMsg('Verifying your identity...');
    
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'signup' });
      if (error) throw error;
      
      showMsg('Identity confirmed! Securing your connection...');
      setTimeout(() => router.push('/onboarding'), 1500);
    } catch (err: any) {
      const msg = err.message?.toLowerCase() || '';
      if (msg.includes('expired')) {
        showMsg('Security code expired. Please request a new one.', true);
        setTimeout(() => { setStep('signup'); setOtp(''); clearMsg(); }, 3000);
      } else {
        showMsg('Invalid verification code. Please try again.', true);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!supabase) return;
    setLoading(true);
    showMsg('Dispatching a new security code...');
    
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) throw error;
      showMsg('New code dispatched! Check your inbox.');
    } catch {
      showMsg('Network error. Please wait a moment and try again.', true);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return showMsg('System configuration error.', true);
    
    setLoading(true);
    clearMsg();
    
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      router.push('/onboarding');
    } catch (err: any) {
      const msg = err.message?.toLowerCase() || '';
      if (msg.includes('email not confirmed')) {
        showMsg('Account not verified. Please check your email.', true);
        setTimeout(() => { setStep('verify'); clearMsg(); }, 2500);
      } else if (msg.includes('invalid') || msg.includes('wrong') || msg.includes('credentials')) {
        showMsg('Invalid credentials. Access denied.', true);
      } else {
        showMsg(err.message || 'Authentication failed. Please try again.', true);
      }
    } finally {
      setLoading(false);
    }
  }

  const msgClass = message.isError
    ? 'bg-red-950/30 border border-red-900/50 text-red-400'
    : 'bg-emerald-950/30 border border-emerald-900/50 text-emerald-400';

  const inputClass = 'w-full bg-neutral-950/80 border border-neutral-800 hover:border-neutral-700 focus:border-neutral-600 focus:ring-1 focus:ring-neutral-500 rounded-xl py-3.5 text-sm text-white placeholder-neutral-600 outline-none transition-all';

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center px-4 py-12 selection:bg-neutral-800">
      {/* Top bar */}
      <div className="w-full max-w-sm mb-6 flex items-center justify-between text-xs text-neutral-600">
        <span className="font-mono tracking-wider">AI-BOS v2.0</span>
        <span className="flex items-center gap-1.5 bg-emerald-950/50 border border-emerald-900/40 text-emerald-500 px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Systems online
        </span>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-sm bg-neutral-900/60 border border-neutral-800/60 rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl">
        {/* Brand header */}
        <div className="px-8 pt-8 pb-6 border-b border-neutral-800/50">
          <div className="flex items-center gap-3 mb-7">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-black font-bold text-lg">Ω</span>
            </div>
            <div>
              <p className="text-white font-semibold text-sm tracking-wide">AI-BOS</p>
              <p className="text-neutral-500 text-xs tracking-widest uppercase">Enterprise OS</p>
            </div>
          </div>

          {/* Progress Indicators */}
          {step !== 'login' && (
            <div className="flex items-center gap-2 mb-5">
              {(['signup', 'verify'] as Step[]).map((s, i) => {
                const stepIndex = ['signup', 'verify'].indexOf(step);
                const isActive  = step === s;
                const isDone    = i < stepIndex;
                return (
                  <React.Fragment key={s}>
                    <div className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${isActive ? 'text-white' : isDone ? 'text-emerald-500' : 'text-neutral-600'}`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors ${isActive ? 'border-white text-white' : isDone ? 'border-emerald-500 text-emerald-500' : 'border-neutral-700 text-neutral-600'}`}>
                        {isDone ? '✓' : (i + 1)}
                      </div>
                      {s === 'signup' ? 'Create account' : 'Verify email'}
                    </div>
                    {i === 0 && <div className={`flex-1 h-px transition-colors ${isDone ? 'bg-emerald-900/50' : 'bg-neutral-800'}`} />}
                  </React.Fragment>
                );
              })}
            </div>
          )}

          <h1 className="text-2xl font-semibold text-white tracking-tight leading-tight mb-2">
            {step === 'login' ? 'Welcome back.' : step === 'signup' ? 'Create your command center.' : 'Check your inbox.'}
          </h1>
          <p className="text-sm text-neutral-500 leading-relaxed">
            {step === 'login' ? 'Sign in to deploy your AI workforce.' : step === 'signup' ? 'Launch your enterprise AI workforce in 60 seconds.' : `We sent a secure code to ${email}`}
          </p>
        </div>

        {/* Form Container */}
        <div className="px-8 py-6">
          <form 
            onSubmit={step === 'signup' ? handleSignup : step === 'verify' ? handleVerify : handleLogin} 
            className="space-y-4"
          >
            {/* Email Input (Shared between Login & Signup) */}
            {step !== 'verify' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-neutral-400 tracking-widest uppercase">Email address</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)}
                    placeholder="founder@enterprise.com" 
                    required 
                    autoComplete="email"
                    className={`${inputClass} pl-10 pr-4`} 
                  />
                </div>
              </div>
            )}

            {/* Password Input (Shared between Login & Signup) */}
            {step !== 'verify' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-neutral-400 tracking-widest uppercase">Passkey</label>
                  {step === 'login' && (
                    <button type="button" className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors">
                      Recover access
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 6 characters" 
                    required 
                    minLength={6} 
                    autoComplete={step === 'login' ? 'current-password' : 'new-password'}
                    className={`${inputClass} pl-10 pr-4`} 
                  />
                </div>
              </div>
            )}

            {/* OTP Input (Verify Step Only) */}
            {step === 'verify' && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <label className="block text-xs font-medium text-neutral-400 tracking-widest uppercase">Verification code</label>
                <div className="relative">
                  <KeyRound size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input 
                    type="text" 
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000" 
                    required 
                    maxLength={6} 
                    inputMode="numeric" 
                    autoComplete="one-time-code"
                    className={`${inputClass} pl-10 pr-4 tracking-[0.4em] font-mono text-center text-lg`} 
                  />
                </div>
              </div>
            )}

            {/* Status Messages */}
            {message.text && (
              <div className={`flex items-start gap-2.5 px-4 py-3 rounded-xl text-xs leading-relaxed animate-in fade-in zoom-in-95 duration-300 ${msgClass}`}>
                <ShieldCheck size={14} className="mt-0.5 flex-shrink-0" />
                <span className="font-medium">{message.text}</span>
              </div>
            )}

            {/* Primary Action Button */}
            <button 
              type="submit" 
              disabled={loading || (step === 'verify' ? otp.length < 6 : !email || password.length < 6)}
              className="w-full bg-white hover:bg-neutral-200 text-black font-semibold py-3.5 rounded-xl text-sm transition-all disabled:opacity-50 disabled:hover:bg-white flex items-center justify-center gap-2 mt-2 shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Processing...</>
              ) : (
                <>
                  {step === 'login' ? 'Initialize Access' : step === 'signup' ? 'Deploy Workspace' : 'Verify & Enter'} 
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {/* Secondary Actions / Toggles */}
            {step === 'verify' ? (
              <div className="flex items-center justify-between text-xs pt-2">
                <button type="button" onClick={() => { setStep('signup'); setOtp(''); clearMsg(); }} className="text-neutral-500 hover:text-white transition-colors">
                  ← Change email
                </button>
                <button type="button" onClick={handleResend} disabled={loading} className="text-neutral-500 hover:text-emerald-400 transition-colors disabled:opacity-40">
                  Resend code
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 pt-2">
                  <div className="flex-1 h-px bg-neutral-800/80" />
                  <span className="text-xs text-neutral-600 font-medium">
                    {step === 'signup' ? 'Already deployed?' : 'New to AI-BOS?'}
                  </span>
                  <div className="flex-1 h-px bg-neutral-800/80" />
                </div>
                <button 
                  type="button" 
                  onClick={() => { setStep(step === 'signup' ? 'login' : 'signup'); clearMsg(); }}
                  className="w-full border border-neutral-800 hover:bg-neutral-800/50 hover:border-neutral-700 text-neutral-400 hover:text-white font-medium py-3.5 rounded-xl text-sm transition-all"
                >
                  {step === 'signup' ? 'Sign in to existing workspace' : 'Create enterprise account'}
                </button>
              </>
            )}
          </form>
        </div>

        {/* Trust Badges */}
        <div className="px-8 py-4 bg-neutral-950/30 border-t border-neutral-800/50 flex items-center justify-between">
          {[
            { label: 'SOC 2 Ready', color: 'text-emerald-500/80' },
            { label: '256-bit AES', color: 'text-amber-500/80' },
            { label: 'Zero Trust',  color: 'text-blue-500/80' },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <ShieldCheck size={12} className={color} />
              <span className="text-[10px] font-medium tracking-wide text-neutral-500 uppercase">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-8 text-xs text-neutral-600 font-medium tracking-wide">
        &copy; {new Date().getFullYear()} AI-BOS · Enterprise Autonomous Operations
      </p>
    </div>
  );
            }
        
