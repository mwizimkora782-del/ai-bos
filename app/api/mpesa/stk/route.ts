import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, userId } = body;

    let formattedPhone = phone.replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) formattedPhone = '254' + formattedPhone.substring(1);
    if (formattedPhone.startsWith('+')) formattedPhone = formattedPhone.substring(1);

    // .trim() removes any accidental spaces copied from the mobile phone
    const consumerKey = process.env.MPESA_CONSUMER_KEY?.trim();
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET?.trim();
    const passkey = process.env.MPESA_PASSKEY?.trim();
    const shortcode = process.env.MPESA_SHORTCODE?.trim() || '174379';
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/mpesa/callback`;

    if (!consumerKey || !consumerSecret || !passkey) {
      return NextResponse.json({ error: "Vercel Vault Error: Keys are missing." }, { status: 500 });
    }

    // 1. Safaricom OAuth with Error Catching
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    const tokenResponse = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      headers: { Authorization: `Basic ${auth}` }
    });
    
    const tokenText = await tokenResponse.text();
    let tokenData;
    try {
      tokenData = JSON.parse(tokenText);
    } catch (e) {
      return NextResponse.json({ error: `Safaricom OAuth Crash: ${tokenText}` }, { status: 502 });
    }

    if (!tokenData.access_token) {
      return NextResponse.json({ error: `Safaricom rejected credentials. Raw: ${tokenText}` }, { status: 502 });
    }

    // 2. Security Passwords
    const date = new Date();
    const timestamp = date.getFullYear().toString() + 
      (date.getMonth() + 1).toString().padStart(2, '0') + 
      date.getDate().toString().padStart(2, '0') + 
      date.getHours().toString().padStart(2, '0') + 
      date.getMinutes().toString().padStart(2, '0') + 
      date.getSeconds().toString().padStart(2, '0');
      
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

    // 3. STK Push with Error Catching
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

    const stkText = await stkResponse.text();
    let stkData;
    try {
      stkData = JSON.parse(stkText);
    } catch (e) {
      return NextResponse.json({ error: `Safaricom STK Crash: ${stkText}` }, { status: 502 });
    }

    if (stkData.errorMessage) {
      return NextResponse.json({ error: `Safaricom Error: ${stkData.errorMessage}` }, { status: 502 });
    }

    return NextResponse.json({ success: true, message: "STK Push sent." });

  } catch (err: any) {
    return NextResponse.json({ error: `Server Exception: ${err.message}` }, { status: 500 });
  }
}
