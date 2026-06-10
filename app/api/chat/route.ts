import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = body.message;

    if (!message) {
      return NextResponse.json({ error: "Empty payload received." }, { status: 400 });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Check keys but do not crash the runtime if DB keys are missing; just flag it.
    if (!geminiKey) {
      return NextResponse.json({ error: "AI Engine credentials missing." }, { status: 500 });
    }

    // 1. Call Google Gemini AI
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `You are the executive AI CEO for an enterprise platform. Answer this operational user directive with absolute data-driven clarity: ${message}` }] }]
        })
      }
    );

    if (!geminiResponse.ok) {
       return NextResponse.json({ error: "AI Provider latency or failure." }, { status: 502 });
    }

    const data = await geminiResponse.json();
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Operational analysis complete, awaiting output display.";

    // 2. Safe Database Insertion (Will not crash the chat if DB fails)
    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase.from('messages').insert([
          { sender: 'user', content: message },
          { sender: 'ai_ceo', content: aiText }
        ]);
      } catch (dbError) {
        console.error("Database sync failed, but maintaining chat runtime.");
      }
    }

    return NextResponse.json({ reply: aiText });
    
  } catch (err) {
    return NextResponse.json({ error: "Fatal backend exception." }, { status: 500 });
  }
}

