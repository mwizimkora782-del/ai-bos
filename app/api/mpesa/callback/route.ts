export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    console.log("🔥 WEBHOOK HIT — Safaricom callback received.");
    const payload = await req.json();
    console.log("📦 DARAJA PAYLOAD:", JSON.stringify(payload));

    const callbackData = payload?.Body?.stkCallback;
    if (!callbackData) {
      console.error("❌ Missing stkCallback in payload.");
      return NextResponse.json({ error: "Invalid Payload" }, { status: 400 });
    }

    const resultCode = callbackData.ResultCode;

    if (resultCode !== 0) {
      console.log(`⚠️ Payment failed/cancelled. Code: ${resultCode}. Desc: ${callbackData.ResultDesc}`);
      return NextResponse.json({ success: true });
    }

    // ✅ FIXED: Get the userId from AccountReference — not the latest profile
    const userId = callbackData.CallbackMetadata?.Item?.find(
      (item: any) => item.Name === 'AccountReference'
    )?.Value || null;

    // Also try from the top-level MerchantRequestID context
    // Safaricom puts AccountReference inside CheckoutRequestID metadata
    // So we also check the raw metadata array
    const metadataItems: any[] = callbackData.CallbackMetadata?.Item ?? [];
    const accountRef = metadataItems.find((i: any) => i.Name === 'AccountReference')?.Value
      ?? callbackData.AccountReference
      ?? userId;

    console.log(`✅ Payment confirmed. Account Reference (userId): ${accountRef}`);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ FATAL: Supabase keys missing.");
      return NextResponse.json({ success: true, message: "Webhook received but DB update failed." });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!accountRef || accountRef === 'GUEST') {
      console.error("❌ No valid userId in AccountReference. Cannot upgrade.");
      return NextResponse.json({ success: true });
    }

    // ✅ FIXED: Upgrade the EXACT user who paid using their userId
    console.log(`🔓 Upgrading user ${accountRef} to PRO...`);
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ is_pro: true })
      .eq('id', accountRef);

    if (updateError) {
      console.error("❌ DB UPDATE ERROR:", updateError);
    } else {
      console.log(`🎉 SUCCESS — User ${accountRef} is now PRO.`);
    }

    return NextResponse.json({ success: true, message: "Webhook processed." });

  } catch (err: any) {
    console.error("❌ CRITICAL WEBHOOK CRASH:", err);
    return NextResponse.json({ error: "Server exception" }, { status: 500 });
  }
}
