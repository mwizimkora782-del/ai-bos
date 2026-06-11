import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, userId } = body;

    let formattedPhone = phone.replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) formattedPhone = '254' + formattedPhone.substring(1);
    if (formattedPhone.startsWith('+')) formattedPhone = formattedPhone.substring(1);

    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    const passkey = process.env.MPESA_PASSKEY;
    const shortcode = process.env.MPESA_SHORTCODE || '174379';
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/mpesa/callback`;

    // PROFESSIONAL DIAGNOSTIC: Pinpoint the exact missing key
    let missingKeys = [];
    if (!consumerKey) missingKeys.push('MPESA_CONSUMER_KEY');
    if (!consumerSecret) missingKeys.push('MPESA_CONSUMER_SECRET');
    if (!passkey) missingKeys.push('MPESA_PASSKEY');

    if (missingKeys.length > 0) {
      return NextResponse.json({ 
        error: `Vercel Vault Error: You are missing ${missingKeys.join(' AND ')}` 
      }, { status: 500 });
    }

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    const tokenResponse = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      headers: { Authorization: `Basic ${auth}` }
    });
    
    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) throw new Error("Safaricom rejected your Consumer Key or Secret. Double check them in Vercel.");

    const date = new Date();
    const timestamp = date.getFullYear().toString() + 
      (date.getMonth() + 1).toString().padStart(2, '0') + 
      date.getDate().toString().padStart(2, '0') + 
      date.getHours().toString().padStart(2, '0') + 
      date.getMinutes().toString().padStart(2, '0') + 
      date.getSeconds().toString().padStart(2, '0');
      
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

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
        Amount: 1, 
        PartyA: formattedPhone,
        PartyB: shortcode,
        PhoneNumber: formattedPhone,
        CallBackURL: callbackUrl,
        AccountReference: userId || "AI_BOS_GUEST",
        TransactionDesc: "AI-BOS Professional Upgrade"
      })
    });

    const stkData = await stkResponse.json();
    if (stkData.errorMessage) throw new Error(`Safaricom Error: ${stkData.errorMessage}`);

    return NextResponse.json({ success: true, message: "STK Push sent. Please check your phone to enter M-Pesa PIN." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
