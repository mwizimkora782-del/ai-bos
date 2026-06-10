import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { metric } = body;

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) return NextResponse.json({ error: "API Key missing." }, { status: 500 });

    const analystPrompt = `You are the elite AI Data Analyst for an E-commerce brand. 
    The CEO has asked for a financial analysis regarding: "${metric}".
    
    CRITICAL SECURITY DIRECTIVE: Before answering, evaluate the input. If the input is nonsensical, a joke, biological waste, illegal, or completely unrelated to standard e-commerce, you MUST reject the request. Reply exactly with: "ANALYSIS REJECTED: Invalid business metric detected. Please provide a legitimate financial metric or product."
    
    If the input IS a valid e-commerce metric, provide a highly professional, numbers-driven executive summary including estimated margins, risks, and scaling recommendations. Format with bullet points. No pleasantries.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contents: [{ parts: [{ text: analystPrompt }] }],
          // OVERRIDE GOOGLE'S DEFAULT FIREWALL
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" }
          ]
        })
      }
    );

    // If Google still rejects the network call, capture the raw error
    if (!response.ok) {
       const errorDetails = await response.text();
       return NextResponse.json({ error: `Google API Firewall: ${response.status} - ${errorDetails}` }, { status: 502 });
    }

    const data = await response.json();
    
    // Check if Google returned a 200 OK but blocked the content internally
    let analysisText = "Analysis failed.";
    if (data.candidates && data.candidates[0].content) {
        analysisText = data.candidates[0].content.parts[0].text;
    } else if (data.promptFeedback) {
        analysisText = `SYSTEM OVERRIDE: Google Safety Blocked this prompt. Reason: ${data.promptFeedback.blockReason}`;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase.from('messages').insert([
          { sender: 'user', content: `Run Financial Analysis on: ${metric}` },
          { sender: 'ai_analyst', content: analysisText }
        ]);
      } catch (dbError) {
        console.error("Database sync failed.");
      }
    }

    return NextResponse.json({ reply: analysisText });
  } catch (err: any) {
    return NextResponse.json({ error: `Backend exception: ${err.message}` }, { status: 500 });
  }
}
