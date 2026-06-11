export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const phone = body.phone || '';
    const userId = body.userId || 'GUEST';

    if (!phone) {
        return NextResponse.json({ error: "OMEGA: Phone number missing." }, { status: 400 });
    }

    let formattedPhone = phone.replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) formattedPhone = '254' + formattedPhone.substring(1);
    if (formattedPhone.startsWith('+')) formattedPhone = formattedPhone.substring(1);

    // Safest cleanup: removes all invisible line breaks and spaces
    const cleanStr = (str?: string) => str ? str.replace(/[\s\r\n]+/g, '') : '';
    
    const consumerKey = cleanStr(process.env.MPESA_CONSUMER_KEY);
    const consumerSecret = cleanStr(process.env.MPESA_CONSUMER_SECRET);
    const passkey = cleanStr(process.env.MPESA_PASSKEY);
    const shortcode = cleanStr(process.env.MPESA_SHORTCODE) || '174379';
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/mpesa/callback`;

    if (!consumerKey || !consumerSecret || !passkey) {
      return NextResponse.json({ error: "OMEGA: Safaricom credentials missing in Vercel Vault." }, { status: 500 });
    }

    // 1. Authenticate with Safaricom (OAuth)
    const authString = `${consumerKey}:${consumerSecret}`;
    const authBase64 = Buffer.from(authString).toString('base64'); 
    
    const tokenResponse = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      method: 'GET',
      headers: { 
        'Authorization': `Basic ${authBase64}`,
        'Accept': 'application/json'
      },
      cache: 'no-store'
    });
    
    const tokenText = await tokenResponse.text();

    if (!tokenResponse.ok) {
        return NextResponse.json({ 
            error: `OMEGA: Daraja Auth Blocked (${tokenResponse.status}). Raw: ${tokenText || "Empty"}` 
        }, { status: 502 });
    }

    let tokenData;
    try {
        tokenData = JSON.parse(tokenText);
    } catch (e) {
        return NextResponse.json({ error: `OMEGA: Invalid JSON (${tokenResponse.status}). Raw: ${tokenText}` }, { status: 502 });
    }

    if (!tokenData.access_token) {
      return NextResponse.json({ error: "OMEGA: Safaricom returned no token." }, { status: 502 });
    }

    // 2. Generate Cryptographic Passwords
    const date = new Date();
    const timestamp = date.getFullYear().toString() + 
      (date.getMonth() + 1).toString().padStart(2, '0') + 
      date.getDate().toString().padStart(2, '0') + 
      date.getHours().toString().padStart(2, '0') + 
      date.getMinutes().toString().padStart(2, '0') + 
      date.getSeconds().toString().padStart(2, '0');
      
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

    // 3. Dispatch STK Push
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
        AccountReference: userId,
        TransactionDesc: "AI-BOS Upgrade"
      })
    });

    const stkText = await stkResponse.text();

    if (!stkResponse.ok) {
        return NextResponse.json({ error: `OMEGA: STK Push Blocked (${stkResponse.status}). Raw: ${stkText || "Empty"}` }, { status: 502 });
    }

    let stkData;
    try {
        stkData = JSON.parse(stkText);
    } catch (e) {
        return NextResponse.json({ error: `OMEGA: STK JSON Error (${stkResponse.status}). Raw: ${stkText}` }, { status: 502 });
    }

    if (stkData.errorMessage) {
      return NextResponse.json({ error: `OMEGA: Safaricom Error: ${stkData.errorMessage}` }, { status: 502 });
    }

    return NextResponse.json({ success: true, message: "STK Push successfully deployed." });

  } catch (err: any) {
    return NextResponse.json({ error: `OMEGA: System Exception: ${err.message}` }, { status: 500 });
  }
          }
                               
