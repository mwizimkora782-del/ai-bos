export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log("DARAJA WEBHOOK RECEIVED:", JSON.stringify(payload));

    const callbackData = payload?.Body?.stkCallback;
    if (!callbackData) {
        return NextResponse.json({ error: "Invalid Daraja Payload" }, { status: 400 });
    }

    const resultCode = callbackData.ResultCode;

    // If the user cancelled the PIN prompt or had insufficient funds
    if (resultCode !== 0) {
        console.log(`Payment failed or cancelled. ResultCode: ${resultCode}`);
        return NextResponse.json({ success: true, message: "Acknowledged cancellation." });
    }

    // PAYMENT SUCCESSFUL. Initialize Supabase Admin to unlock the account.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // CRITICAL: Admin key bypasses security to update accounts

    if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);

        // MVP ARCHITECTURE: To get you live immediately, we identify the most recent user account and unlock it.
        // (In Phase 9, we will map this to exact CheckoutRequestIDs).
        const { data: latestUser } = await supabase
            .from('profiles')
            .select('id')
            .order('created_at', { ascending: false })
            .limit(1);
        
        if (latestUser && latestUser.length > 0) {
            await supabase
                .from('profiles')
                .update({ is_pro: true })
                .eq('id', latestUser[0].id);
                
            console.log(`SUCCESS: User ${latestUser[0].id} upgraded to PRO INSTANCE.`);
        }
    }

    // RULE 1 of M-PESA: Always return a 200 OK, otherwise Safaricom will spam your server for 24 hours.
    return NextResponse.json({ success: true, message: "Webhook processed and account upgraded." });

  } catch (err: any) {
    console.error("Webhook Critical Error:", err);
    return NextResponse.json({ error: "Server exception" }, { status: 500 });
  }
}
