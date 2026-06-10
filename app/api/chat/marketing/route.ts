import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { product } = body;

    const geminiKey = process.env.GEMINI_API_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!geminiKey) {
      return NextResponse.json({ error: "API Key missing." }, { status: 500 });
    }

    // SPECIALIZED WORKFLOW: 3-Day E-Commerce Email Sequence
    const marketingPrompt = `
      You are the elite AI Marketing Manager for an E-commerce brand.
      The CEO wants to launch a marketing campaign for: ${product}.
      
      Generate a professional, high-converting 3-day email sequence:
      - Email 1 (Day 1): The Hook & Problem Agitation.
      - Email 2 (Day 2): The Solution & Social Proof.
      - Email 3 (Day 3): The Offer & Urgency (Scarcity).
      
      Format it beautifully. Do not include pleasantries, just output the raw email copy.
    `;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: marketingPrompt }] }]
        })
      }
    );

    if (!response.ok) {
       return NextResponse.json({ error: "Marketing Agent offline." }, { status: 502 });
    }

    const data = await response.json();
    const campaignText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Campaign generation failed.";

    // Save the generated campaign to the company memory
    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase.from('messages').insert([
          { sender: 'user', content: `Triggered Marketing Workflow for: ${product}` },
          { sender: 'ai_marketing', content: campaignText }
        ]);
      } catch (dbError) {
        console.error("Database sync failed.");
      }
    }

    return NextResponse.json({ reply: campaignText });
    
  } catch (err) {
    return NextResponse.json({ error: "Fatal backend exception." }, { status: 500 });
  }
}
