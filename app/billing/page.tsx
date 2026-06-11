'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Check, ArrowLeft, CreditCard, Smartphone } from 'lucide-react';

export default function Billing() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-4">
      {/* Navigation */}
      <button 
        onClick={() => router.push('/')} 
        className="absolute top-6 left-6 flex items-center gap-2 text-neutral-400 hover:text-white transition"
      >
        <ArrowLeft size={16} /> Return to HQ
      </button>
      
      <div className="max-w-3xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight mb-4">Unlock Your Full AI Workforce</h1>
          <p className="text-neutral-400 text-sm sm:text-base">Upgrade to the Professional Tier for unlimited deterministic execution.</p>
        </div>

        {/* Pricing Card */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
            RECOMMENDED
          </div>
          
          <div className="flex flex-col md:flex-row gap-8">
            {/* Features Section */}
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-semibold mb-2">Professional Instance</h2>
              <div className="text-4xl font-bold mb-6">$49<span className="text-lg text-neutral-500 font-normal">/mo</span></div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-sm text-neutral-300">
                  <Check size={16} className="text-emerald-500 flex-shrink-0" /> Unlimited AI CEO Intelligence
                </li>
                <li className="flex items-center gap-3 text-sm text-neutral-300">
                  <Check size={16} className="text-emerald-500 flex-shrink-0" /> Advanced Marketing Automation
                </li>
                <li className="flex items-center gap-3 text-sm text-neutral-300">
                  <Check size={16} className="text-emerald-500 flex-shrink-0" /> Real-time Financial Analyst Agent
                </li>
                <li className="flex items-center gap-3 text-sm text-neutral-300">
                  <Check size={16} className="text-emerald-500 flex-shrink-0" /> Persistent Enterprise Memory
                </li>
              </ul>
            </div>
            
            {/* Checkout Section */}
            <div className="flex-1 flex flex-col gap-4 border-t md:border-t-0 md:border-l border-neutral-800 pt-6 md:pt-0 md:pl-8 justify-center">
              <p className="text-xs text-neutral-400 mb-2 font-medium uppercase tracking-wider">Select Payment Gateway</p>
              
              <button className="w-full bg-white text-black flex items-center justify-center gap-2 font-semibold py-4 rounded-xl hover:bg-neutral-200 transition">
                <CreditCard size={18} /> Global Card Checkout
              </button>
              
              <button className="w-full bg-emerald-950/30 border border-emerald-900/50 text-emerald-400 flex items-center justify-center gap-2 font-semibold py-4 rounded-xl hover:bg-emerald-900/40 transition">
                <Smartphone size={18} /> Mobile Money API
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
        }
      
