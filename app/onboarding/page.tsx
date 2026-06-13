'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Search, ArrowRight, Check, Loader2 } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

type Industry = { id: string; name: string; icon: string; category: string };

const INDUSTRIES: Industry[] = [
  // Hospitality & Food
  { id:'hotel',          name:'Hotel',               icon:'🏨', category:'Hospitality & Food' },
  { id:'resort',         name:'Resort',              icon:'🏝️', category:'Hospitality & Food' },
  { id:'airbnb',         name:'Airbnb',              icon:'🏠', category:'Hospitality & Food' },
  { id:'guesthouse',     name:'Guest House',         icon:'🛏️', category:'Hospitality & Food' },
  { id:'restaurant',     name:'Restaurant',          icon:'🍽️', category:'Hospitality & Food' },
  { id:'fastfood',       name:'Fast Food',           icon:'🍔', category:'Hospitality & Food' },
  { id:'cafe',           name:'Cafe',                icon:'☕', category:'Hospitality & Food' },
  { id:'coffeeshop',     name:'Coffee Shop',         icon:'☕', category:'Hospitality & Food' },
  { id:'bakery',         name:'Bakery',              icon:'🥐', category:'Hospitality & Food' },
  { id:'catering',       name:'Catering Business',   icon:'🍱', category:'Hospitality & Food' },
  { id:'bar',            name:'Bar',                 icon:'🍺', category:'Hospitality & Food' },
  { id:'nightclub',      name:'Nightclub',           icon:'🎵', category:'Hospitality & Food' },
  // Beauty & Wellness
  { id:'salon',          name:'Salon',               icon:'💇', category:'Beauty & Wellness' },
  { id:'barbershop',     name:'Barbershop',          icon:'✂️', category:'Beauty & Wellness' },
  { id:'spa',            name:'Spa',                 icon:'💆', category:'Beauty & Wellness' },
  { id:'beautystudio',   name:'Beauty Studio',       icon:'💄', category:'Beauty & Wellness' },
  { id:'nailstudio',     name:'Nail Studio',         icon:'💅', category:'Beauty & Wellness' },
  { id:'tattoo',         name:'Tattoo Studio',       icon:'🎨', category:'Beauty & Wellness' },
  { id:'gym',            name:'Gym',                 icon:'💪', category:'Beauty & Wellness' },
  { id:'fitness',        name:'Fitness Center',      icon:'🏋️', category:'Beauty & Wellness' },
  { id:'sportsclub',     name:'Sports Club',         icon:'⚽', category:'Beauty & Wellness' },
  { id:'trainer',        name:'Personal Trainer',    icon:'🏃', category:'Beauty & Wellness' },
  { id:'yoga',           name:'Yoga Studio',         icon:'🧘', category:'Beauty & Wellness' },
  // Retail & Commerce
  { id:'retail',         name:'Retail Store',        icon:'🏪', category:'Retail & Commerce' },
  { id:'supermarket',    name:'Supermarket',         icon:'🛒', category:'Retail & Commerce' },
  { id:'wholesale',      name:'Wholesale Business',  icon:'📦', category:'Retail & Commerce' },
  { id:'ecommerce',      name:'E-commerce Store',    icon:'🛍️', category:'Retail & Commerce' },
  { id:'electronics',    name:'Electronics Store',   icon:'📱', category:'Retail & Commerce' },
  { id:'fashion',        name:'Fashion Store',       icon:'👗', category:'Retail & Commerce' },
  { id:'furniture',      name:'Furniture Store',     icon:'🪑', category:'Retail & Commerce' },
  { id:'pharmacy',       name:'Pharmacy',            icon:'💊', category:'Retail & Commerce' },
  { id:'bookstore',      name:'Bookstore',           icon:'📚', category:'Retail & Commerce' },
  { id:'hardware',       name:'Hardware Store',      icon:'🔧', category:'Retail & Commerce' },
  { id:'agristore',      name:'Agricultural Store',  icon:'🌱', category:'Retail & Commerce' },
  { id:'autoparts',      name:'Auto Parts Store',    icon:'🚗', category:'Retail & Commerce' },
  // Education
  { id:'school',         name:'School',              icon:'🏫', category:'Education' },
  { id:'primaryschool',  name:'Primary School',      icon:'🎒', category:'Education' },
  { id:'highschool',     name:'High School',         icon:'🎓', category:'Education' },
  { id:'university',     name:'University',          icon:'🏛️', category:'Education' },
  { id:'college',        name:'College',             icon:'📐', category:'Education' },
  { id:'elearning',      name:'Online Learning',     icon:'💻', category:'Education' },
  { id:'trainingcenter', name:'Training Center',     icon:'📋', category:'Education' },
  { id:'coaching',       name:'Coaching Center',     icon:'🎯', category:'Education' },
  { id:'research',       name:'Research Institution',icon:'🔬', category:'Education' },
  // Healthcare
  { id:'hospital',       name:'Hospital',            icon:'🏥', category:'Healthcare' },
  { id:'clinic',         name:'Clinic',              icon:'🩺', category:'Healthcare' },
  { id:'medicalcenter',  name:'Medical Center',      icon:'⚕️', category:'Healthcare' },
  { id:'dental',         name:'Dental Clinic',       icon:'🦷', category:'Healthcare' },
  { id:'vet',            name:'Veterinary Clinic',   icon:'🐾', category:'Healthcare' },
  { id:'lab',            name:'Laboratory',          icon:'🧪', category:'Healthcare' },
  { id:'mentalhealth',   name:'Mental Health Center',icon:'🧠', category:'Healthcare' },
  { id:'nursinghome',    name:'Nursing Home',        icon:'🏡', category:'Healthcare' },
  // Professional Services
  { id:'lawfirm',        name:'Law Firm',            icon:'⚖️', category:'Professional Services' },
  { id:'accounting',     name:'Accounting Firm',     icon:'📊', category:'Professional Services' },
  { id:'consulting',     name:'Consulting Firm',     icon:'💼', category:'Professional Services' },
  { id:'marketing',      name:'Marketing Agency',    icon:'📣', category:'Professional Services' },
  { id:'design',         name:'Design Agency',       icon:'✏️', category:'Professional Services' },
  { id:'software',       name:'Software Company',    icon:'💻', category:'Professional Services' },
  { id:'itcompany',      name:'IT Company',          icon:'🖥️', category:'Professional Services' },
  { id:'cyber',          name:'Cybersecurity Co.',   icon:'🔒', category:'Professional Services' },
  { id:'architecture',   name:'Architecture Firm',   icon:'🏗️', category:'Professional Services' },
  { id:'engineering',    name:'Engineering Firm',    icon:'⚙️', category:'Professional Services' },
  // Real Estate
  { id:'realestate',     name:'Real Estate Agency',  icon:'🏢', category:'Real Estate & Property' },
  { id:'propmanage',     name:'Property Management', icon:'🔑', category:'Real Estate & Property' },
  { id:'construction',   name:'Construction Company',icon:'👷', category:'Real Estate & Property' },
  { id:'interior',       name:'Interior Design',     icon:'🛋️', category:'Real Estate & Property' },
  { id:'propdev',        name:'Property Developer',  icon:'🏙️', category:'Real Estate & Property' },
  // Transport & Logistics
  { id:'logistics',      name:'Logistics Company',   icon:'🚚', category:'Transport & Logistics' },
  { id:'delivery',       name:'Delivery Service',    icon:'📦', category:'Transport & Logistics' },
  { id:'taxi',           name:'Taxi Company',        icon:'🚕', category:'Transport & Logistics' },
  { id:'ridehailing',    name:'Ride-Hailing',        icon:'🚗', category:'Transport & Logistics' },
  { id:'shipping',       name:'Shipping Company',    icon:'🚢', category:'Transport & Logistics' },
  { id:'travel',         name:'Travel Agency',       icon:'✈️', category:'Transport & Logistics' },
  { id:'tour',           name:'Tour Company',        icon:'🗺️', category:'Transport & Logistics' },
  // Manufacturing
  { id:'manufacturing',  name:'Manufacturing Co.',   icon:'🏭', category:'Manufacturing' },
  { id:'factory',        name:'Factory',             icon:'⚙️', category:'Manufacturing' },
  { id:'foodprocessing', name:'Food Processing',     icon:'🥫', category:'Manufacturing' },
  { id:'textile',        name:'Textile Company',     icon:'🧵', category:'Manufacturing' },
  // Agriculture
  { id:'farm',           name:'Farm',                icon:'🌾', category:'Agriculture' },
  { id:'dairyfarm',      name:'Dairy Farm',          icon:'🐄', category:'Agriculture' },
  { id:'poultry',        name:'Poultry Farm',        icon:'🐔', category:'Agriculture' },
  { id:'fishfarm',       name:'Fish Farm',           icon:'🐟', category:'Agriculture' },
  { id:'agribusiness',   name:'Agribusiness',        icon:'🌿', category:'Agriculture' },
  // Financial Services
  { id:'bank',           name:'Bank',                icon:'🏦', category:'Financial Services' },
  { id:'microfinance',   name:'Microfinance',        icon:'💰', category:'Financial Services' },
  { id:'sacco',          name:'SACCO',               icon:'🤝', category:'Financial Services' },
  { id:'insurance',      name:'Insurance Company',   icon:'🛡️', category:'Financial Services' },
  { id:'investment',     name:'Investment Company',  icon:'📈', category:'Financial Services' },
  { id:'lending',        name:'Lending Company',     icon:'💳', category:'Financial Services' },
  // Media & Entertainment
  { id:'media',          name:'Media Company',       icon:'📺', category:'Media & Entertainment' },
  { id:'tvstation',      name:'TV Station',          icon:'📡', category:'Media & Entertainment' },
  { id:'radio',          name:'Radio Station',       icon:'📻', category:'Media & Entertainment' },
  { id:'podcast',        name:'Podcast Business',    icon:'🎙️', category:'Media & Entertainment' },
  { id:'creator',        name:'Content Creator',     icon:'🎬', category:'Media & Entertainment' },
  { id:'influencer',     name:'Influencer',          icon:'⭐', category:'Media & Entertainment' },
  { id:'events',         name:'Event Management',    icon:'🎪', category:'Media & Entertainment' },
  // Non-Profit
  { id:'ngo',            name:'NGO',                 icon:'🌍', category:'Non-Profit' },
  { id:'charity',        name:'Charity',             icon:'❤️', category:'Non-Profit' },
  { id:'foundation',     name:'Foundation',          icon:'🏛️', category:'Non-Profit' },
  { id:'church',         name:'Church',              icon:'⛪', category:'Non-Profit' },
  { id:'mosque',         name:'Mosque',              icon:'🕌', category:'Non-Profit' },
  { id:'community',      name:'Community Org',       icon:'👥', category:'Non-Profit' },
  // Technology
  { id:'startup',        name:'Startup',             icon:'🚀', category:'Technology' },
  { id:'saas',           name:'SaaS Company',        icon:'☁️', category:'Technology' },
  { id:'ai',             name:'AI Company',          icon:'🤖', category:'Technology' },
  { id:'blockchain',     name:'Blockchain Company',  icon:'⛓️', category:'Technology' },
  { id:'datacompany',    name:'Data Company',        icon:'📊', category:'Technology' },
  // Government
  { id:'government',     name:'Government Office',   icon:'🏛️', category:'Government' },
  { id:'county',         name:'County Office',       icon:'🗂️', category:'Government' },
  { id:'publicservice',  name:'Public Service',      icon:'📋', category:'Government' },
  // Personal
  { id:'freelancer',     name:'Freelancer',          icon:'💻', category:'Personal & Independent' },
  { id:'consultant',     name:'Consultant',          icon:'🎯', category:'Personal & Independent' },
  { id:'coach',          name:'Coach',               icon:'🏆', category:'Personal & Independent' },
  { id:'speaker',        name:'Speaker',             icon:'🎤', category:'Personal & Independent' },
  { id:'solopreneur',    name:'Solopreneur',         icon:'⚡', category:'Personal & Independent' },
  { id:'smallbusiness',  name:'Small Business',      icon:'🏪', category:'Personal & Independent' },
  // Other
  { id:'other',          name:'Other',               icon:'✨', category:'Other' },
];

export default function Onboarding() {
  const router = useRouter();
  const [userId, setUserId]       = useState('');
  const [selected, setSelected]   = useState('');
  const [search, setSearch]       = useState('');
  const [saving, setSaving]       = useState(false);
  const [authed, setAuthed]       = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      setUserId(session.user.id);

      // Skip onboarding if already completed
      const { data: profile } = await supabase
        .from('profiles')
        .select('business_type')
        .eq('id', session.user.id)
        .single();

      if (profile?.business_type) { router.push('/'); return; }
      setAuthed(true);
    })();
  }, [router]);

  const filtered = useMemo(() => {
    if (!search.trim()) return INDUSTRIES;
    const q = search.toLowerCase();
    return INDUSTRIES.filter(i =>
      i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)
    );
  }, [search]);

  const categories = useMemo(() => {
    const cats: Record<string, Industry[]> = {};
    filtered.forEach(i => {
      if (!cats[i.category]) cats[i.category] = [];
      cats[i.category].push(i);
    });
    return cats;
  }, [filtered]);

  const handleContinue = async () => {
    if (!selected || !userId) return;
    setSaving(true);
    try {
      await supabase.from('profiles').update({ business_type: selected }).eq('id', userId);
      router.push('/');
    } catch {
      setSaving(false);
    }
  };

  if (!authed) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-950">
        <p className="text-sm text-neutral-500 animate-pulse">Preparing your workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col">

      {/* Header */}
      <div className="px-5 pt-8 pb-4 flex-shrink-0">
        {/* Progress */}
        <div className="flex gap-1.5 mb-6">
          {[1,2,3,4].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full ${s <= 2 ? 'bg-white' : 'bg-neutral-800'}`} />
          ))}
        </div>

        {/* Brand */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-black font-bold text-base">Ω</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm tracking-wide">AI-BOS</p>
            <p className="text-neutral-500 text-xs tracking-widest uppercase">Enterprise OS</p>
          </div>
        </div>

        <h1 className="text-2xl font-semibold text-white tracking-tight leading-tight mb-2">
          What type of business<br />do you operate?
        </h1>
        <p className="text-sm text-neutral-500 leading-relaxed mb-5">
          We'll build your custom AI workspace, dashboards, and agents based on your industry.
        </p>

        {/* Search */}
        <div className="relative mb-2">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-600" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search industries..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder-neutral-600 outline-none focus:border-neutral-700 transition-colors"
          />
        </div>
      </div>

      {/* Industry grid — scrollable */}
      <div className="flex-1 overflow-y-auto px-5 pb-32">
        {Object.entries(categories).map(([cat, items]) => (
          <div key={cat} className="mb-6">
            <p className="text-[10px] font-semibold text-neutral-600 tracking-widest uppercase mb-3">
              {cat}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {items.map(industry => {
                const isSelected = selected === industry.id;
                return (
                  <button
                    key={industry.id}
                    onClick={() => setSelected(industry.id)}
                    className={`relative flex flex-col items-start p-3.5 rounded-2xl border text-left transition-all active:scale-95 ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-800/60'
                        : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/60'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Check size={9} className="text-black" />
                      </div>
                    )}
                    <span className="text-xl mb-2">{industry.icon}</span>
                    <span className={`text-xs font-medium leading-tight ${isSelected ? 'text-emerald-300' : 'text-neutral-300'}`}>
                      {industry.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Sticky footer CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-4 bg-neutral-950 border-t border-neutral-900">
        {selected && (
          <p className="text-xs text-neutral-500 text-center mb-3">
            Selected: <span className="text-white font-medium">
              {INDUSTRIES.find(i => i.id === selected)?.name}
            </span>
          </p>
        )}
        <button
          onClick={handleContinue}
          disabled={!selected || saving}
          className="w-full bg-white hover:bg-neutral-100 text-black font-semibold py-4 rounded-2xl text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? (
            <><Loader2 size={16} className="animate-spin" /> Building your workspace...</>
          ) : (
            <><span>✨</span> Build my AI workspace <ArrowRight size={16} /></>
          )}
        </button>
        <p className="text-center text-xs text-neutral-700 mt-2">Your workspace will be ready in seconds</p>
      </div>
    </div>
  );
   }
