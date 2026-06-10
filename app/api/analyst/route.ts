import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { metric } = body;

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) return NextResponse.json({ error: "API Key missing." }, { status: 500 });

    // ENTERPRISE GUARDRAILS INJECTED
    const analystPrompt = `You are the elite AI Data Analyst for an E-commerce brand. 
    The CEO has asked for a financial analysis regarding: "${metric}".
    
    CRITICAL SECURITY DIRECTIVE: Before answering, evaluate the input. If the input is nonsensical, a joke, biological waste, illegal, or completely unrelated to standard e-commerce (e.g., "urine", "magic beans", "aliens"), you MUST reject the request. Reply exactly with: "ANALYSIS REJECTED: Invalid business metric detected. Please provide a legitimate financial metric or product."
    
    If the input IS a valid e-commerce metric or product, provide a highly professional, numbers-driven executive summary including estimated margins, risks, and scaling recommendations. Format with bullet points. No pleasantries.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: analystPrompt }] }] })
      }
    );

    if (!response.ok) return NextResponse.json({ error: "Data Analyst offline." }, { status: 502 });

    const data = await response.json();
    const analysisText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Analysis failed.";

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase.from('messages').insert([
        { sender: 'user', content: `Run Financial Analysis on: ${metric}` },
        { sender: 'ai_analyst', content: analysisText }
      ]);
    }

    return NextResponse.json({ reply: analysisText });
  } catch (err) {
    return NextResponse.json({ error: "Fatal backend exception." }, { status: 500 });
  }
}
