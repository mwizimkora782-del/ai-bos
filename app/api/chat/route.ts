export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SYSTEM_PROMPT = `You are the AI-BOS (Artificial Intelligence Business Operating System), an elite, ruthless, and highly strategic digital executive team compressed into a single entity. 
You act concurrently as:
1. Chief Executive Officer (Focus: Scalability, competitive moats, zero-capital growth, remote-first execution).
2. Chief Financial Officer (Focus: Profitability, unit economics, risk mitigation, lean resource allocation).
3. Chief Marketing Officer (Focus: Viral acquisition, high-conversion copy, brand positioning).
4. Chief Operations Officer (Focus: Automation, prompt engineering, system architecture, frictionless workflows).

Your directives:
- Be proactive, not reactive. Tell the founder what they are missing.
- Format responses clearly with headings, bullet points, and actionable step-by-step execution plans.
- Prioritize zero-capital business models and remote digital infrastructure.
- Never use filler words, fluff, or standard AI apologies. Be direct, factual, and hyper-competent.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, userId } = body;

    if (!prompt || !userId) {
      return NextResponse.json({ error: "Missing prompt or User ID." }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const geminiKey   = process.env.GEMINI_API_KEY;

    if (!supabaseUrl || !supabaseKey || !geminiKey) {
      const missing = [
        !supabaseUrl && 'NEXT_PUBLIC_SUPABASE_URL',
        !supabaseKey && 'SUPABASE_SERVICE_ROLE_KEY',
        !geminiKey   && 'GEMINI_API_KEY',
      ].filter(Boolean).join(', ');
      return NextResponse.json({ error: `Missing env vars: ${missing}` }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Get history BEFORE saving current message
    const { data: history } = await supabase
      .from('messages')
      .select('sender, content')
      .eq('profile_id', userId)
      .order('created_at', { ascending: false })
      .limit(9);

    // 2. Build contents — history + current prompt
    const contents = [
      ...(history ?? []).reverse().map(msg => ({
        role:  msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      })),
      { role: 'user', parts: [{ text: prompt }] },
    ];

    // 3. Save user message
    await supabase.from('messages').insert({
      profile_id: userId,
      sender:     'user',
      content:    prompt,
    });

    // 4. Call Gemini 2.5 Flash (free, current model) with v1beta + system_instruction
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: SYSTEM_PROMPT }]
          },
          contents,
          generationConfig: {
            temperature:     0.7,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    const geminiData = await geminiResponse.json();

    if (!geminiResponse.ok) {
      const geminiError = geminiData?.error?.message || JSON.stringify(geminiData);
      console.error("Gemini Error:", geminiError);
      return NextResponse.json({ error: `Gemini Error: ${geminiError}` }, { status: 502 });
    }

    const aiTextResponse = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!aiTextResponse) {
      return NextResponse.json({ error: "Gemini returned empty response." }, { status: 502 });
    }

    // 5. Save AI response
    await supabase.from('messages').insert({
      profile_id: userId,
      sender:     'model',
      content:    aiTextResponse,
    });

    return NextResponse.json({ success: true, reply: aiTextResponse });

  } catch (err: any) {
    console.error("Core Brain Exception:", err.message);
    return NextResponse.json({ error: `System Exception: ${err.message}` }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: "No userId provided" }, { status: 400 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('messages')
      .select('sender, content')
      .eq('profile_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ success: true, messages: data });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
