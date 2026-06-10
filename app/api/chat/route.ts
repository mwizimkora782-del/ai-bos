import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    const geminiKey = process.env.GEMINI_API_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!geminiKey || !supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "System configuration variables missing." }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

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

    const data = await geminiResponse.json();
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Operational analysis timed out.";

    await supabase.from('messages').insert([
      { sender: 'user', content: message },
      { sender: 'ai_ceo', content: aiText }
    ]);

    return NextResponse.json({ reply: aiText });
  } catch (err) {
    return NextResponse.json({ error: "Core backend execution exception encountered." }, { status: 500 });
  }
}
