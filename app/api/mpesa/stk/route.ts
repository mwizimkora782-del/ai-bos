export const dynamic = 'force-dynamic'; // Nuclear cache override

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, userId } = body;

    let formattedPhone = phone.replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) formattedPhone = '254' + formattedPhone.substring(1);
    if (formattedPhone.startsWith('+')) formattedPhone = formattedPhone.substring(1);

    // PROFESSIONAL PURIFICATION: Destroys absolutely everything that is not a letter or number.
    // This eradicates invisible mobile zero-width spaces that cause 400 errors.
    const purify = (str: string | undefined) => str ? str.replace(/[^a-zA-Z0-9]/g, '') : '';
    
    const consumerKey = purify(process.env.MPESA_CONSUMER_KEY);
    const consumerSecret = purify(process.env.MPESA_CONSUMER_SECRET);
    const passkey = purify(process.env.MPESA_PASSKEY);
    const shortcode = purify(process.env.MPESA_SHORTCODE) || '174379';
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/mpesa/callback`;

    if (!consumerKey || !consumerSecret || !passkey) {
      return NextResponse.json({ error: "Vercel Vault Error: Keys are completely empty." }, { status: 500 });
    }

    // 1. Safaricom OAuth
    const authString = `${consumerKey}:${consumerSecret}`;
    const authBase64 = Buffer.from(authString).toString('base64');
    
    const tokenResponse = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      method: 'GET',
      headers: { 
        'Authorization': `Basic ${authBase64}`
      },
      cache: 'no-store'
    });
    
    const tokenStatus = tokenResponse.status;
    const tokenText = await tokenResponse.text();
    
    if (!tokenResponse.ok) {
        // DIAGNOSTIC METRICS: Daraja Consumer Keys should be exactly 28 chars. Secrets should be 16 chars.
        return NextResponse.json({ 
          error: `Safaricom OAuth Blocked (400). KeyLength: ${consumerKey.length}, SecretLength: ${consumerSecret.length}. Raw: ${tokenText || "Empty"}` 
        }, { status: 502 });
    }

    const tokenData = JSON.parse(tokenText);

    if (!tokenData.access_token) {
      return NextResponse.json({ error: `Safaricom OAuth failed to return token. Raw: ${tokenText}` }, { status: 502 });
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
        'Content-Type': 'application/json'
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

    const stkStatus = stkResponse.status;
    const stkText = await stkResponse.text();
    
    if (!stkResponse.ok) {
        return NextResponse.json({ error: `Safaricom STK Blocked. Status: ${stkStatus}. Raw: ${stkText || "Empty"}` }, { status: 502 });
    }

    const stkData = JSON.parse(stkText);

    if (stkData.errorMessage) {
      return NextResponse.json({ error: `Safaricom Rejected Payment: ${stkData.errorMessage}` }, { status: 502 });
    }

    return NextResponse.json({ success: true, message: "STK Push sent." });

  } catch (err: any) {
    return NextResponse.json({ error: `Server Exception: ${err.message}` }, { status: 500 });
  }
}
