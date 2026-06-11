import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, userId } = body; // userId is passed so we know who is paying

    // Format phone number to 254 format safely
    let formattedPhone = phone.replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) formattedPhone = '254' + formattedPhone.substring(1);
    if (formattedPhone.startsWith('+')) formattedPhone = formattedPhone.substring(1);

    // Environment Variables (You will add these to Vercel later)
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    const passkey = process.env.MPESA_PASSKEY;
    const shortcode = process.env.MPESA_SHORTCODE || '174379'; // Default Daraja Sandbox Till
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/mpesa/callback`;

    if (!consumerKey || !consumerSecret || !passkey) {
      return NextResponse.json({ error: "Safaricom Daraja credentials missing in Vercel." }, { status: 500 });
    }

    // 1. Generate M-Pesa OAuth Token
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    const tokenResponse = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      headers: { Authorization: `Basic ${auth}` }
    });
    
    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) throw new Error("Failed to authenticate with Safaricom.");

    // 2. Generate Security Passwords & Timestamps
    const date = new Date();
    const timestamp = date.getFullYear().toString() + 
      (date.getMonth() + 1).toString().padStart(2, '0') + 
      date.getDate().toString().padStart(2, '0') + 
      date.getHours().toString().padStart(2, '0') + 
      date.getMinutes().toString().padStart(2, '0') + 
      date.getSeconds().toString().padStart(2, '0');
      
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

    // 3. Trigger the STK Push
    const stkResponse = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: 1, // $49 equivalent in KES (Set to 1 for testing)
        PartyA: formattedPhone,
        PartyB: shortcode,
        PhoneNumber: formattedPhone,
        CallBackURL: callbackUrl,
        AccountReference: userId, // CRITICAL: We pass the Supabase User ID here to identify them in the webhook
        TransactionDesc: "AI-BOS Professional Upgrade"
      })
    });

    const stkData = await stkResponse.json();
    if (stkData.errorMessage) throw new Error(stkData.errorMessage);

    return NextResponse.json({ success: true, message: "STK Push sent. Please check your phone to enter M-Pesa PIN." });
  } catch (err: any) {
    return NextResponse.json({ error: `M-Pesa Trigger Failed: ${err.message}` }, { status: 500 });
  }
}
