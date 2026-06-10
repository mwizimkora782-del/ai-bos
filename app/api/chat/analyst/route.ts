import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { metric } = body;

    const geminiKey = process.env.GEMINI_API_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!geminiKey) {
      return NextResponse.json({ error: "API Key missing." }, { status: 500 });
    }

    // SPECIALIZED WORKFLOW: Financial Data Analyst
    const analystPrompt = `
      You are the elite AI Data Analyst for an E-commerce brand.
      The CEO has asked for a rapid financial analysis regarding: ${metric}.
      
      Provide a highly professional, numbers-driven executive summary.
      Include:
      1. Estimated Profit Margins.
      2. One major financial risk to watch out for.
      3. A strict recommendation on whether to scale ad spend or cut costs.
      
      Format with bullet points. Be concise. No pleasantries.
    `;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: analystPrompt }] }]
        })
      }
    );

    if (!response.ok) {
       return NextResponse.json({ error: "Data Analyst offline." }, { status: 502 });
    }

    const data = await response.json();
    const analysisText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Analysis failed.";

    // Save to company memory
    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase.from('messages').insert([
          { sender: 'user', content: `Triggered Financial Analysis for: ${metric}` },
          { sender: 'ai_analyst', content: analysisText }
        ]);
      } catch (dbError) {
        console.error("Database sync failed.");
      }
    }

    return NextResponse.json({ reply: analysisText });
    
  } catch (err) {
    return NextResponse.json({ error: "Fatal backend exception." }, { status: 500 });
  }
}
