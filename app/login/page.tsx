'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Terminal } from 'lucide-react';

// Initialize safe frontend database connection
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleAuth = async (action: 'login' | 'signup', e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (action === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Registration successful. You can now log in.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/'); // Redirect to HQ Dashboard on success
      }
    } catch (error: any) {
      setMessage(error.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-md bg-neutral-900/50 border border-neutral-800 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center text-black mb-4 shadow-md">
            <Terminal size={20} />
          </div>
          <h1 className="text-xl font-medium text-white tracking-tight">AI-BOS Authorization</h1>
          <p className="text-sm text-neutral-500 mt-2 text-center">Enter your enterprise credentials to access your autonomous workforce.</p>
        </div>

        <form className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">Corporate Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-neutral-600 transition"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">Security Passkey</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-neutral-600 transition"
              required
            />
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-xs font-medium border ${message.includes('successful') ? 'bg-emerald-950/30 border-emerald-900/50 text-emerald-400' : 'bg-red-950/30 border-red-900/50 text-red-400'}`}>
              {message}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={(e) => handleAuth('login', e)}
              disabled={loading}
              className="flex-1 bg-white text-black font-medium py-3 rounded-lg text-sm hover:bg-neutral-200 transition disabled:opacity-50"
            >
              Initialize Login
            </button>
            <button
              onClick={(e) => handleAuth('signup', e)}
              disabled={loading}
              className="flex-1 bg-neutral-800 border border-neutral-700 text-white font-medium py-3 rounded-lg text-sm hover:bg-neutral-700 transition disabled:opacity-50"
            >
              Deploy New Instance
            </button>
          </div>
        </form>
      </div>
    </div>
  );
            }
