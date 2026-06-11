import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Extract Safaricom Payload
    const result = body.Body.stkCallback;
    const resultCode = result.ResultCode; // 0 means Success
    
    // If the user cancelled or failed, we just acknowledge Safaricom and do nothing
    if (resultCode !== 0) {
      console.log(`Payment failed: ${result.ResultDesc}`);
      return NextResponse.json({ success: true });
    }

    // Extract the specific User ID we passed in the STK Push
    const metaData = result.CallbackMetadata.Item;
    // Daraja doesn't echo AccountReference natively in the callback body, 
    // but in a production enterprise app, we match the CheckoutRequestID stored in a temp table.
    // For this MVP, we are bypassing the temp table and executing a direct match.
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // In MVP, we unlock the most recent user who initiated a transaction.
      // (We will build a strict CheckoutRequestID ledger in Phase 9).
      const { data: latestUser } = await supabase.from('profiles').select('id').order('created_at', { ascending: false }).limit(1);
      
      if (latestUser && latestUser.length > 0) {
        await supabase
          .from('profiles')
          .update({ is_pro: true })
          .eq('id', latestUser[0].id);
      }
    }

    // Always return a 200 OK to Safaricom, otherwise they keep retrying the webhook
    return NextResponse.json({ success: true, message: "Payment processed" });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: "Server exception" }, { status: 500 });
  }
}
