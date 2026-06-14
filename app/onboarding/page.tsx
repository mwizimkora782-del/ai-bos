'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Scissors, Stethoscope, GraduationCap, 
  Briefcase, ShoppingCart, Scale, Plus, CheckCircle2, 
  ArrowRight, Sparkles, ChevronRight, LayoutDashboard 
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// --- Data for our selections ---
const businessTypes = [
  { id: 'Hotel', icon: Building2 },
  { id: 'Salon', icon: Scissors },
  { id: 'Hospital', icon: Stethoscope },
  { id: 'School', icon: GraduationCap },
  { id: 'Agency', icon: Briefcase },
  { id: 'E-commerce', icon: ShoppingCart },
  { id: 'Law Firm', icon: Scale },
  { id: 'Other', icon: Plus },
];

const teamSizes = ['Just me', '2–10', '11–50', '51–200', '200+'];

const goalsList = [
  'Get more customers', 'Automate tasks', 'Increase revenue', 
  'Manage employees', 'Customer support', 'Marketing', 
  'Analytics', 'Accounting'
];

const deploySteps = [
  'Initializing AI CEO...',
  'Creating Marketing Department...',
  'Building Customer Support Team...',
  'Setting up Business Intelligence...',
  'Preparing Workspace...'
];

export default function OnboardingPage() {
  const router = useRouter();
  
  // State to hold our user's choices
  const [step, setStep] = useState(1);
  const [userName, setUserName] = useState('Founder');
  const [businessType, setBusinessType] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  
  // State for the cool deployment animation
  const [deployIndex, setDeployIndex] = useState(0);

  // When the page loads, try to get the user's name from their login
  useEffect(() => {
    async function fetchUser() {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.user_metadata?.full_name) {
        setUserName(data.user.user_metadata.full_name);
      }
    }
    fetchUser();
  }, []);

  // Handle selecting multiple goals
  const toggleGoal = (goal: string) => {
    if (goals.includes(goal)) {
      setGoals(goals.filter(g => g !== goal));
    } else {
      setGoals([...goals, goal]);
    }
  };

  // The function that runs the fake terminal and saves the data
  const startDeployment = async () => {
    setStep(5); // Move to the animation step
    
    // Animate through the deployment steps
    for (let i = 0; i <= deploySteps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800)); // Wait 0.8 seconds per step
      setDeployIndex(i);
    }

    // Save choices to Supabase in the background
    await supabase.auth.updateUser({
      data: { business_type: businessType, team_size: teamSize, goals: goals }
    });

    // Move to the final personalized dashboard screen
    setStep(6);
  };

  // --- UI Components ---

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center overflow-hidden relative font-sans selection:bg-emerald-500/30">
      
      {/* Background Glowing Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Content Box */}
      <div className="w-full max-w-3xl px-6 relative z-10">
        
        <AnimatePresence mode="wait">
          
          {/* STEP 1: WELCOME SCREEN */}
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-12"
            >
              <div className="space-y-4">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}
                  className="w-16 h-16 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                >
                  <Sparkles size={28} className="text-white" />
                </motion.div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Welcome to AI-BOS</h1>
                <p className="text-lg text-neutral-400 max-w-xl mx-auto">
                  Your AI workforce is ready. Let's build your business operating system in under 60 seconds.
                </p>
              </div>

              {/* Animated AI Employee Cards */}
              <div className="flex flex-wrap justify-center gap-4">
                {['AI CEO', 'AI Marketing Manager', 'AI Sales Agent', 'AI Accountant', 'AI Support Agent'].map((role, i) => (
                  <motion.div
                    key={role}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + (i * 0.1) }}
                    className="px-5 py-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-sm font-medium text-neutral-300 flex items-center gap-2"
                  >
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    {role}
                  </motion.div>
                ))}
              </div>

              <motion.button
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
                onClick={() => setStep(2)}
                className="mx-auto mt-12 bg-white text-black px-8 py-4 rounded-xl font-semibold flex items-center gap-2 hover:bg-neutral-200 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95"
              >
                Initialize Systems <ArrowRight size={18} />
              </motion.button>
            </motion.div>
          )}

          {/* STEP 2: BUSINESS TYPE */}
          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
              className="max-w-2xl mx-auto w-full"
            >
              <h2 className="text-3xl font-semibold mb-2">Identify your industry.</h2>
              <p className="text-neutral-400 mb-8">This determines the specialized skills your AI workforce will boot up with.</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {businessTypes.map((biz) => {
                  const Icon = biz.icon;
                  const isSelected = businessType === biz.id;
                  return (
                    <button
                      key={biz.id}
                      onClick={() => { setBusinessType(biz.id); setTimeout(() => setStep(3), 400); }}
                      className={`p-6 rounded-2xl border flex flex-col items-center justify-center gap-4 transition-all duration-300 ${
                        isSelected 
                          ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)] scale-105' 
                          : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <Icon size={28} className={isSelected ? 'text-emerald-400' : 'text-neutral-300'} />
                      <span className="font-medium text-sm">{biz.id}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* STEP 3: TEAM SIZE */}
          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
              className="max-w-md mx-auto w-full"
            >
              <h2 className="text-3xl font-semibold mb-2">Scale the architecture.</h2>
              <p className="text-neutral-400 mb-8">How many people currently work in your organization?</p>
              
              <div className="space-y-3">
                {teamSizes.map((size) => {
                  const isSelected = teamSize === size;
                  return (
                    <button
                      key={size}
                      onClick={() => { setTeamSize(size); setTimeout(() => setStep(4), 400); }}
                      className={`w-full p-5 rounded-2xl border flex items-center justify-between transition-all duration-300 ${
                        isSelected 
                          ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)] scale-105' 
                          : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <span className="font-medium text-lg">{size}</span>
                      {isSelected && <CheckCircle2 size={20} className="text-emerald-400" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* STEP 4: GOALS */}
          {step === 4 && (
            <motion.div 
              key="step4"
              initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
              className="max-w-2xl mx-auto w-full"
            >
              <h2 className="text-3xl font-semibold mb-2">Set operational directives.</h2>
              <p className="text-neutral-400 mb-8">What would you like AI-BOS to execute first? (Select all that apply)</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-10">
                {goalsList.map((goal) => {
                  const isSelected = goals.includes(goal);
                  return (
                    <button
                      key={goal}
                      onClick={() => toggleGoal(goal)}
                      className={`p-4 rounded-xl border flex items-center gap-4 transition-all duration-200 ${
                        isSelected 
                          ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' 
                          : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'border-emerald-500 bg-emerald-500 text-neutral-950' : 'border-neutral-600'}`}>
                        {isSelected && <CheckCircle2 size={14} />}
                      </div>
                      <span className="font-medium text-sm">{goal}</span>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={startDeployment}
                disabled={goals.length === 0}
                className="w-full bg-white text-black py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-neutral-200 transition-all disabled:opacity-50 shadow-[0_0_30px_rgba(255,255,255,0.15)]"
              >
                Deploy AI Workforce <ArrowRight size={18} />
              </button>
            </motion.div>
          )}

          {/* STEP 5: DEPLOYMENT ANIMATION */}
          {step === 5 && (
            <motion.div 
              key="step5"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="max-w-lg mx-auto w-full"
            >
              <div className="bg-neutral-900/50 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                {/* Scanning line effect */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent animate-[scan_2s_ease-in-out_infinite]" />
                
                <h2 className="text-2xl font-semibold mb-8 flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                  Booting Architecture...
                </h2>

                <div className="space-y-4">
                  {deploySteps.map((deployStep, idx) => {
                    const isCompleted = deployIndex > idx;
                    const isActive = deployIndex === idx;
                    const isPending = deployIndex < idx;

                    return (
                      <div key={idx} className={`flex items-center gap-4 text-sm font-mono transition-all duration-500 ${isPending ? 'opacity-30' : 'opacity-100'}`}>
                        <div className="w-6 flex justify-center">
                          {isCompleted ? (
                            <CheckCircle2 size={18} className="text-emerald-500" />
                          ) : isActive ? (
                            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                          ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-neutral-700" />
                          )}
                        </div>
                        <span className={isCompleted ? 'text-neutral-400' : isActive ? 'text-white' : 'text-neutral-600'}>
                          {deployStep}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 6: SUCCESS & DASHBOARD LAUNCH */}
          {step === 6 && (
            <motion.div 
              key="step6"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto w-full text-center"
            >
              <div className="w-24 h-24 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                <CheckCircle2 size={48} className="text-emerald-400" />
              </div>
              
              <h1 className="text-4xl font-bold mb-4 tracking-tight">Welcome back, {userName}</h1>
              
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 text-left backdrop-blur-md">
                <p className="text-neutral-400 text-sm mb-4">Your AI workforce has been successfully deployed and is on standby.</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-neutral-500">Business Type</span>
                    <span className="text-white font-medium">{businessType}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-neutral-500">Active AI Employees</span>
                    <span className="text-white font-medium">12 Agents</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-neutral-500">System Status</span>
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Ready to assist
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-emerald-500 text-neutral-950 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-400 transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-[0.98]"
              >
                <LayoutDashboard size={18} />
                Launch AI Command Center
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
      
      {/* Required for the scanning line animation in Step 5 */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
                                   }
      
