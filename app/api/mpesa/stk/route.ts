// NUCLEAR CACHE OVERRIDES: Physically forces Vercel to bypass all edge caching
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, userId } = body;

    if (!phone) {
        return NextResponse.json({ error: "Phone number payload missing." }, { status: 400 });
    }

    let formattedPhone = phone.replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) formattedPhone = '254' + formattedPhone.substring(1);
    if (formattedPhone.startsWith('+')) formattedPhone = formattedPhone.substring(1);

    // SAFEST PURIFIER: Removes hidden newlines and spaces, but keeps special characters safe
    const cleanStr = (str?: string) => str ? str.trim().replace(/[\r\n\s]+/g, '') : '';
    
    const consumerKey = cleanStr(process.env.MPESA_CONSUMER_KEY);
    const consumerSecret = cleanStr(process.env.MPESA_CONSUMER_SECRET);
    const passkey = cleanStr(process.env.MPESA_PASSKEY);
    const shortcode = cleanStr(process.env.MPESA_SHORTCODE) || '174379';
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/mpesa/callback`;

    if (!consumerKey || !consumerSecret || !passkey) {
      return NextResponse.json({ error: "Configuration Error: Safaricom credentials missing in Vercel Vault." }, { status: 500 });
    }

    // 1. Authenticate with Safaricom (OAuth)
    const authString = `${consumerKey}:${consumerSecret}`;
    // Explicit utf-8 buffer prevents Base64 corruption
    const authBase64 = Buffer.from(authString, 'utf-8').toString('base64'); 
    
    const tokenResponse = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      method: 'GET',
      headers: { 
        'Authorization': `Basic ${authBase64}`,
        'Accept': 'application/json'
      },
      cache: 'no-store'
    });
    
    const tokenStatus = tokenResponse.status;
    const tokenText = await tokenResponse.text();

    if (!tokenResponse.ok) {
        // UNIQUE IDENTIFIER: If you do not see "SYSTEM OVERRIDE" on your screen, Vercel did not deploy the code.
        return NextResponse.json({ 
            error: `SYSTEM OVERRIDE: Gateway Blocked (${tokenStatus}). Raw: ${tokenText || "Empty"}. KeyLength: ${consumerKey.length}` 
        }, { status: 502 });
    }

    let tokenData;
    try {
        tokenData = JSON.parse(tokenText);
    } catch (e) {
        return NextResponse.json({ error: `SYSTEM OVERRIDE: Invalid OAuth JSON (${tokenStatus}). Raw: ${tokenText}` }, { status: 502 });
    }

    if (!tokenData.access_token) {
      return NextResponse.json({ error: "Safaricom authorized the request but returned no token." }, { status: 502 });
    }

    // 2. Generate Cryptographic Passwords safely
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`, 'utf-8').toString('base64');

    // 3. Dispatch STK Push to User Device
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
        AccountReference: userId || "AIBOS",
        TransactionDesc: "Upgrade"
      })
    });

    const stkStatus = stkResponse.status;
    const stkText = await stkResponse.text();

    if (!stkResponse.ok) {
        return NextResponse.json({ error: `SYSTEM OVERRIDE: STK Request Blocked (${stkStatus}). Raw: ${stkText || "Empty"}` }, { status: 502 });
    }

    let stkData;
    try {
        stkData = JSON.parse(stkText);
    } catch (e) {
        return NextResponse.json({ error: `SYSTEM OVERRIDE: STK JSON Parse Error (${stkStatus}). Raw: ${stkText}` }, { status: 502 });
    }

    if (stkData.errorMessage || stkData.ResponseCode !== "0") {
      return NextResponse.json({ error: `Safaricom Execution Error: ${stkData.errorMessage || stkData.ResponseDescription}` }, { status: 502 });
    }

    return NextResponse.json({ success: true, message: "STK Push successfully deployed." });

  } catch (err: any) {
    return NextResponse.json({ error: `Backend Exception: ${err.message}` }, { status: 500 });
  }
}
