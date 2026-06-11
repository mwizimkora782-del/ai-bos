export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    console.log("🔥 WEBHOOK HIT! Safaricom Daraja just pinged Vercel.");
    const payload = await req.json();
    console.log("📦 DARAJA PAYLOAD:", JSON.stringify(payload));

    const callbackData = payload?.Body?.stkCallback;
    if (!callbackData) {
        console.error("❌ ERROR: Payload missing stkCallback. Daraja sent invalid data.");
        return NextResponse.json({ error: "Invalid Payload" }, { status: 400 });
    }

    const resultCode = callbackData.ResultCode;

    if (resultCode !== 0) {
        console.log(`⚠️ Payment cancelled or failed. ResultCode: ${resultCode}. Desc: ${callbackData.ResultDesc}`);
        return NextResponse.json({ success: true });
    }

    console.log("✅ PAYMENT SUCCESSFUL. Initializing Supabase Admin...");
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error("❌ FATAL: Supabase keys are missing in the Vercel Vault.");
        return NextResponse.json({ success: true, message: "Webhook received but DB update failed due to missing keys." });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("🔍 Searching database for the most recent user profile...");
    const { data: latestUser, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1);

    if (fetchError) {
        console.error("❌ DB FETCH ERROR: Could not read profiles table:", fetchError);
    } else if (latestUser && latestUser.length > 0) {
        console.log(`🔓 Attempting to unlock PRO INSTANCE for user ID: ${latestUser[0].id}`);
        
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ is_pro: true })
            .eq('id', latestUser[0].id);
            
        if (updateError) {
            console.error("❌ DB UPDATE ERROR: Failed to flip the is_pro switch:", updateError);
        } else {
            console.log("🎉 SUCCESS! ACCOUNT UPGRADED TO PRO.");
        }
    } else {
        console.error("❌ DB ERROR: No users found in the 'profiles' table. Did the user register properly?");
    }

    // Always return 200 OK to prevent Daraja from spamming retries
    return NextResponse.json({ success: true, message: "Webhook processed." });

  } catch (err: any) {
    console.error("❌ CRITICAL WEBHOOK CRASH:", err);
    return NextResponse.json({ error: "Server exception" }, { status: 500 });
  }
}
