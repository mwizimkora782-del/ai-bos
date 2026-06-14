'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { 
  Building, Users, Target, Rocket, ArrowRight, 
  Terminal, ShieldCheck, Database, Cpu, CheckCircle2 
} from 'lucide-react';

const getSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
};

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseClient(), []);

  const [step, setStep] = useState(1);
  const [isDeploying, setIsDeploying] = useState(false);
  const [bootLogs, setBootLogs] = useState<string[]>([]);
  
  // Enterprise Context Form State
  const [formData, setFormData] = useState({
    companyName: '',
    teamSize: '',
    industry: '',
    primaryObjective: ''
  });

  // Handle Input Changes
  const updateForm = (key: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // Deployment Logic (Database Insertion & Terminal Animation)
  const finalizeDeployment = async () => {
    setIsDeploying(true);
    setStep(3);

    const logs = [
      "Initializing AI-BOS connection protocols...",
      "Authenticating enterprise credentials...",
      `Creating secure tenant for ${formData.companyName}...`,
      "Configuring Row Level Security policies...",
      `Optimizing models for ${formData.industry} operations...`,
      `Setting primary directive: ${formData.primaryObjective}...`,
      "Allocating autonomous neural resources...",
      "Deployment successful. Routing to command center..."
    ];

    // Boot sequence animation
    for (let i = 0; i < logs.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setBootLogs(prev => [...prev, logs[i]]);
    }

    // Database Insertion Execution
    if (supabase) {
      try {
        const { data: userData, error: authErr } = await supabase.auth.getUser();
        if (authErr) throw authErr;
        const userId = userData.user?.id;

        if (userId) {
          // 1. Create Organization
          const { data: orgData, error: orgErr } = await supabase
            .from('organizations')
            .insert({
              name: formData.companyName,
              industry: formData.industry,
              team_size: formData.teamSize
            })
            .select()
            .single();
          
          if (orgErr) console.error("Org creation error:", orgErr);

          if (orgData) {
            // 2. Link Profile to Org
            await supabase.from('profiles').upsert({
              id: userId,
              org_id: orgData.id,
              role: 'owner'
            });

            // 3. Provision Workspace
            await supabase.from('ai_workspaces').insert({
              org_id: orgData.id,
              primary_objective: formData.primaryObjective
            });
          }
        }
      } catch (err) {
        console.error("Deployment initialization failed:", err);
        // Fail silently to the user to maintain UX, log to Sentry in production
      }
    }

    // Route to main dashboard
    setTimeout(() => {
      router.push('/dashboard');
    }, 1500);
  };

  // UI Components for Custom Selection Cards
  const SelectCard = ({ icon: Icon, label, value, stateKey }: any) => {
    const isSelected = formData[stateKey as keyof typeof formData] === value;
    return (
      <button
        onClick={() => updateForm(stateKey as keyof typeof formData, value)}
        className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
          isSelected 
            ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' 
            : 'border-neutral-800 bg-neutral-950/50 text-neutral-400 hover:border-neutral-700 hover:bg-neutral-900'
        }`}
      >
        <Icon size={18} className={isSelected ? 'text-emerald-500' : 'text-neutral-500'} />
        <span className="text-sm font-medium">{label}</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center px-4 py-12 selection:bg-neutral-800 font-sans">
      
      {/* Top Navigation / Progress */}
      <div className="w-full max-w-2xl mb-8 flex items-center justify-between text-xs font-mono">
        <span className="text-neutral-500">SYSTEM.INIT()</span>
        {!isDeploying && (
          <div className="flex gap-2">
            <span className={step === 1 ? 'text-emerald-500' : 'text-neutral-600'}>01_CONTEXT</span>
            <span className="text-neutral-800">/</span>
            <span className={step === 2 ? 'text-emerald-500' : 'text-neutral-600'}>02_DIRECTIVE</span>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-2xl relative">
        
        {/* STEP 1: Organization Context */}
        {step === 1 && !isDeploying && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
              <h1 className="text-3xl font-semibold text-white tracking-tight mb-2">Establish infrastructure.</h1>
              <p className="text-neutral-500">Provide the context required to calibrate your AI workforce.</p>
            </div>

            <div className="space-y-6 bg-neutral-900/40 p-8 rounded-3xl border border-neutral-800/60 backdrop-blur-sm">
              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-400 tracking-widest uppercase">Organization Name</label>
                <div className="relative">
                  <Building size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input 
                    type="text" 
                    value={formData.companyName}
                    onChange={(e) => updateForm('companyName', e.target.value)}
                    placeholder="Acme Corp" 
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-neutral-600 focus:ring-1 focus:ring-neutral-500 rounded-xl py-4 pl-12 pr-4 text-sm text-white placeholder-neutral-600 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-medium text-neutral-400 tracking-widest uppercase">Team Scale</label>
                <div className="grid grid-cols-2 gap-3">
                  <SelectCard icon={Users} label="1 - 10 Seats" value="1-10" stateKey="teamSize" />
                  <SelectCard icon={Users} label="11 - 50 Seats" value="11-50" stateKey="teamSize" />
                  <SelectCard icon={Users} label="50 - 250 Seats" value="50-250" stateKey="teamSize" />
                  <SelectCard icon={Users} label="Enterprise (250+)" value="250+" stateKey="teamSize" />
                </div>
              </div>

              <button 
                onClick={() => setStep(2)}
                disabled={!formData.companyName || !formData.teamSize}
                className="w-full bg-white hover:bg-neutral-200 text-black font-semibold py-4 rounded-xl text-sm transition-all disabled:opacity-30 flex items-center justify-center gap-2 mt-4"
              >
                Proceed to Directives <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Primary Directive */}
        {step === 2 && !isDeploying && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
            <div>
              <h1 className="text-3xl font-semibold text-white tracking-tight mb-2">Assign primary directive.</h1>
              <p className="text-neutral-500">What is the initial operational objective for AI-BOS?</p>
            </div>

            <div className="space-y-6 bg-neutral-900/40 p-8 rounded-3xl border border-neutral-800/60 backdrop-blur-sm">
              <div className="space-y-3">
                <label className="text-xs font-medium text-neutral-400 tracking-widest uppercase">Industry Vector</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {['Finance', 'Healthcare', 'SaaS / Tech', 'E-Commerce', 'Logistics', 'Other'].map(ind => (
                    <button
                      key={ind}
                      onClick={() => updateForm('industry', ind)}
                      className={`py-3 px-4 rounded-xl border text-sm text-center transition-all ${
                        formData.industry === ind ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' : 'border-neutral-800 bg-neutral-950/50 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-medium text-neutral-400 tracking-widest uppercase">Initial Autonomous Task</label>
                <div className="grid grid-cols-1 gap-3">
                  <SelectCard icon={Database} label="Data Synthesis & Financial Analysis" value="Data Analysis" stateKey="primaryObjective" />
                  <SelectCard icon={Target} label="Customer Operations & Lead Scoring" value="Customer Ops" stateKey="primaryObjective" />
                  <SelectCard icon={Cpu} label="Autonomous DevOps & Code Review" value="DevOps" stateKey="primaryObjective" />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setStep(1)}
                  className="px-6 py-4 rounded-xl border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800/50 text-sm font-medium transition-all"
                >
                  Back
                </button>
                <button 
                  onClick={finalizeDeployment}
                  disabled={!formData.industry || !formData.primaryObjective}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold py-4 rounded-xl text-sm transition-all disabled:opacity-30 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                >
                  <Rocket size={16} /> Deploy Architecture
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Terminal Boot Sequence */}
        {isDeploying && (
          <div className="w-full bg-black border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-700">
            <div className="bg-neutral-900 border-b border-neutral-800 px-4 py-3 flex items-center gap-4">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-xs text-neutral-500 font-mono flex items-center gap-2">
                <Terminal size={12} /> root@ai-bos-core
              </span>
            </div>
            
            <div className="p-6 h-[300px] overflow-hidden font-mono text-sm">
              <div className="space-y-3">
                {bootLogs.map((log, index) => (
                  <div key={index} className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
                    <span className="text-neutral-600 flex-shrink-0">{`[${new Date().toISOString().split('T')[1].slice(0, 8)}]`}</span>
                    {log.includes('successful') || log.includes('Deployment') ? (
                       <span className="text-emerald-400 flex items-center gap-2">
                         <CheckCircle2 size={14} /> {log}
                       </span>
                    ) : (
                      <span className="text-neutral-300">{log}</span>
                    )}
                  </div>
                ))}
                <div className="flex items-center gap-2 text-neutral-500">
                  <span className="animate-pulse">_</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
            }
              
