export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, userId } = body;

    let formattedPhone = phone.replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) formattedPhone = '254' + formattedPhone.substring(1);
    if (formattedPhone.startsWith('+')) formattedPhone = formattedPhone.substring(1);

    // Removes accidental line breaks or spaces from copying
    const cleanStr = (str: string | undefined) => str ? str.replace(/[\s\n\r\t]+/g, '') : '';
    
    const consumerKey = cleanStr(process.env.MPESA_CONSUMER_KEY);
    const consumerSecret = cleanStr(process.env.MPESA_CONSUMER_SECRET);
    const passkey = cleanStr(process.env.MPESA_PASSKEY);
    const shortcode = cleanStr(process.env.MPESA_SHORTCODE) || '174379';
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/mpesa/callback`;

    if (!consumerKey || !consumerSecret || !passkey) {
      return NextResponse.json({ error: "Configuration Error: System keys are missing." }, { status: 500 });
    }

    // 1. Safaricom OAuth
    const authString = `${consumerKey}:${consumerSecret}`;
    const authBase64 = Buffer.from(authString).toString('base64');
    
    const tokenResponse = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      method: 'GET',
      headers: { 
        'Authorization': `Basic ${authBase64}`,
        'User-Agent': 'AI-BOS-Server/1.0'
      },
      cache: 'no-store'
    });
    
    if (!tokenResponse.ok) {
        return NextResponse.json({ error: "Safaricom rejected the API keys. Please verify your Consumer Key and Secret are the correct length." }, { status: 502 });
    }

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      return NextResponse.json({ error: "Safaricom failed to return an access token." }, { status: 502 });
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

    // 3. STK Push
    const stkResponse = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'AI-BOS-Server/1.0'
      },
      cache: 'no-store',
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
        TransactionDesc: "AI-BOS Upgrade"
      })
    });

    if (!stkResponse.ok) {
        return NextResponse.json({ error: `Safaricom STK Blocked. Ensure your phone number is registered in the Daraja Sandbox.` }, { status: 502 });
    }

    const stkData = await stkResponse.json();

    if (stkData.errorMessage) {
      return NextResponse.json({ error: `Safaricom Error: ${stkData.errorMessage}` }, { status: 502 });
    }

    return NextResponse.json({ success: true, message: "STK Push sent." });

  } catch (err: any) {
    return NextResponse.json({ error: `Server Exception: ${err.message}` }, { status: 500 });
  }
}
