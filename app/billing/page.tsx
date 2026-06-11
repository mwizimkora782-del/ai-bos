'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Check, ArrowLeft, CreditCard, Smartphone, Loader2 } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Billing() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [userId, setUserId] = useState('');

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setUserId(session.user.id);
    };
    getUser();
  }, []);

  const handleMpesaPayment = async () => {
    if (!phone || phone.length < 9) {
      setStatus('Please enter a valid Safaricom number (e.g. 0712345678)');
      return;
    }

    setLoading(true);
    setStatus('Initiating secure connection to Safaricom...');

    try {
      const response = await fetch('/api/mpesa/stk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, userId })
      });
      
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || "Transaction failed");
      
      setStatus('STK Push sent! Please check your phone and enter your M-Pesa PIN.');
      
      // Auto-check for upgrade completion every 3 seconds
      const checkUpgrade = setInterval(async () => {
        const { data: profile } = await supabase.from('profiles').select('is_pro').eq('id', userId).single();
        if (profile?.is_pro) {
          clearInterval(checkUpgrade);
          setStatus('Payment Successful! Unlocking Enterprise Account...');
          setTimeout(() => router.push('/'), 2000);
        }
      }, 3000);

    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-4">
      <button onClick={() => router.push('/')} className="absolute top-6 left-6 flex items-center gap-2 text-neutral-400 hover:text-white transition">
        <ArrowLeft size={16} /> Return to HQ
      </button>
      
      <div className="max-w-3xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight mb-4">Unlock Your Full AI Workforce</h1>
          <p className="text-neutral-400 text-sm sm:text-base">Upgrade to the Professional Tier for unlimited deterministic execution.</p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">RECOMMENDED</div>
          
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-semibold mb-2">Professional Instance</h2>
              <div className="text-4xl font-bold mb-6">KES 6,500<span className="text-lg text-neutral-500 font-normal">/mo</span></div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-sm text-neutral-300"><Check size={16} className="text-emerald-500 flex-shrink-0" /> Unlimited AI CEO Intelligence</li>
                <li className="flex items-center gap-3 text-sm text-neutral-300"><Check size={16} className="text-emerald-500 flex-shrink-0" /> Advanced Marketing Automation</li>
                <li className="flex items-center gap-3 text-sm text-neutral-300"><Check size={16} className="text-emerald-500 flex-shrink-0" /> Real-time Financial Analyst Agent</li>
                <li className="flex items-center gap-3 text-sm text-neutral-300"><Check size={16} className="text-emerald-500 flex-shrink-0" /> Persistent Enterprise Memory</li>
              </ul>
            </div>
            
            <div className="flex-1 flex flex-col gap-4 border-t md:border-t-0 md:border-l border-neutral-800 pt-6 md:pt-0 md:pl-8 justify-center">
              <p className="text-xs text-neutral-400 font-medium uppercase tracking-wider">M-Pesa Express Checkout</p>
              
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter Safaricom Number (e.g. 07...)"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                disabled={loading}
              />

              {status && (
                <div className={`text-xs p-3 rounded-lg ${status.includes('Error') ? 'bg-red-950/30 text-red-400' : 'bg-emerald-950/30 text-emerald-400'}`}>
                  {status}
                </div>
              )}
              
              <button 
                onClick={handleMpesaPayment}
                disabled={loading}
                className="w-full bg-emerald-600 text-white flex items-center justify-center gap-2 font-semibold py-4 rounded-xl hover:bg-emerald-500 transition disabled:opacity-50"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <><Smartphone size={18} /> Pay with M-Pesa</>}
              </button>

              <div className="w-full h-px bg-neutral-800 my-2"></div>
              
              <button disabled className="w-full bg-neutral-950 border border-neutral-800 text-neutral-500 flex items-center justify-center gap-2 font-semibold py-3 rounded-xl opacity-50 cursor-not-allowed">
                <CreditCard size={18} /> Global Card (Coming Soon)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
                }
