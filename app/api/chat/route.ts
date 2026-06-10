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
      return NextResponse.json({ error: "System Configuration Error: GEMINI_API_KEY is missing in Vercel." }, { status: 500 });
    }

    // Call Google Gemini API using the updated 2.5 Flash model
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `You are the executive AI CEO for an enterprise platform. Answer this operational user directive with absolute data-driven clarity: ${message}` }] }]
        })
      }
    );

    // DEBUGGING UPGRADE: If Google rejects the call, capture their exact reason
    if (!geminiResponse.ok) {
       const errorDetails = await geminiResponse.text();
       return NextResponse.json({ error: `Google API Rejection: Status ${geminiResponse.status} - ${errorDetails}` }, { status: 502 });
    }

    const data = await geminiResponse.json();
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Operational analysis complete, awaiting output display.";

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
