import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { product } = body;

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) return NextResponse.json({ error: "API Key missing." }, { status: 500 });

    // ENTERPRISE GUARDRAILS INJECTED
    const marketingPrompt = `You are the elite AI Marketing Manager for an E-commerce brand. 
    The CEO wants to launch a marketing campaign for: "${product}". 
    
    CRITICAL SECURITY DIRECTIVE: Before answering, evaluate the input. If the input is nonsensical, a joke, biological waste, illegal, or completely unrelated to standard e-commerce, you MUST reject the request. Reply exactly with: "CAMPAIGN REJECTED: Invalid product detected. Please provide a legitimate commercial item."
    
    If the product is valid, generate a professional, high-converting 3-day email sequence. Format it beautifully. Do not include pleasantries.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: marketingPrompt }] }] })
      }
    );

    if (!response.ok) return NextResponse.json({ error: "Marketing Agent offline." }, { status: 502 });

    const data = await response.json();
    const campaignText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Campaign generation failed.";

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase.from('messages').insert([
        { sender: 'user', content: `Execute 3-Day Email Campaign for: ${product}` },
        { sender: 'ai_marketing', content: campaignText }
      ]);
    }

    return NextResponse.json({ reply: campaignText });
  } catch (err) {
    return NextResponse.json({ error: "Fatal backend exception." }, { status: 500 });
  }
}
