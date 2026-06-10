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

    if (!geminiKey) {
      return NextResponse.json({ error: "System Configuration Error: GEMINI_API_KEY missing." }, { status: 500 });
    }

    // INDUSTRY SPECIALIZATION: E-COMMERCE CORE
    const ecommerceSystemPrompt = `
      You are the elite AI CEO for a scaling E-commerce Enterprise. 
      Your primary operational directives are:
      1. Maximize Return on Ad Spend (ROAS).
      2. Decrease cart abandonment rates.
      3. Optimize inventory turnover.
      4. Increase Customer Lifetime Value (CLV).
      
      When the user asks you a question, answer with strict, data-driven e-commerce strategies. 
      Do not give generic business advice. Use e-commerce terminology (AOV, CAC, conversion rate).
      
      User Directive: ${message}
    `;

    // Call Google Gemini 2.5 Flash
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: ecommerceSystemPrompt }] }]
        })
      }
    );

    if (!geminiResponse.ok) {
       const errorDetails = await geminiResponse.text();
       return NextResponse.json({ error: `Google API Rejection: Status ${geminiResponse.status} - ${errorDetails}` }, { status: 502 });
    }

    const data = await geminiResponse.json();
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "E-commerce analysis complete.";

    // Safe Database Insertion 
    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase.from('messages').insert([
          { sender: 'user', content: message },
          { sender: 'ai_ceo', content: aiText }
        ]);
      } catch (dbError) {
        console.error("Database sync failed.");
      }
    }

    return NextResponse.json({ reply: aiText });
    
  } catch (err) {
    return NextResponse.json({ error: "Fatal backend exception." }, { status: 500 });
  }
}
