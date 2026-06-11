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

    // THE ULTIMATE PURIFIER: Daraja keys are strictly alphanumeric. 
    // This physically vaporizes hidden unicode, zero-width spaces, and clipboard artifacts.
    const purify = (str?: string) => str ? str.replace(/[^a-zA-Z0-9]/g, '') : '';
    
    const consumerKey = purify(process.env.MPESA_CONSUMER_KEY);
    const consumerSecret = purify(process.env.MPESA_CONSUMER_SECRET);
    const passkey = purify(process.env.MPESA_PASSKEY);
    const shortcode = purify(process.env.MPESA_SHORTCODE) || '174379';
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/mpesa/callback`;

    if (!consumerKey || !consumerSecret || !passkey) {
      return NextResponse.json({ error: "Configuration Error: Safaricom credentials missing in Vercel Vault." }, { status: 500 });
    }

    // 1. Authenticate with Safaricom (OAuth)
    const authString = `${consumerKey}:${consumerSecret}`;
    const authBase64 = Buffer.from(authString).toString('base64'); 
    
    const tokenResponse = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      method: 'GET',
      headers: { 
        'Authorization': `Basic ${authBase64}`,
        'Accept': 'application/json',
        'User-Agent': 'PostmanRuntime/7.36.1' // WAF Bypass
      },
      cache: 'no-store'
    });
    
    const tokenStatus = tokenResponse.status;
    const tokenText = await tokenResponse.text();

    if (!tokenResponse.ok) {
        // DIAGNOSTIC ALFA: Verifies the exact length of BOTH keys after strict purification
        return NextResponse.json({ 
            error: `DIAGNOSTIC ALFA: Gateway Blocked (${tokenStatus}). Key: ${consumerKey.length} Secret: ${consumerSecret.length}. Raw: ${tokenText || "Empty"}` 
        }, { status: 502 });
    }

    let tokenData;
    try {
        tokenData = JSON.parse(tokenText);
    } catch (e) {
        return NextResponse.json({ error: `DIAGNOSTIC ALFA: Invalid OAuth JSON (${tokenStatus}). Raw: ${tokenText}` }, { status: 502 });
    }

    if (!tokenData.access_token) {
      return NextResponse.json({ error: "Safaricom authorized the request but returned no token." }, { status: 502 });
    }

    // 2. Generate Cryptographic Passwords safely
    const date = new Date();
    const timestamp = date.getFullYear().toString() + 
      (date.getMonth() + 1).toString().padStart(2, '0') + 
      date.getDate().toString().padStart(2, '0') + 
      date.getHours().toString().padStart(2, '0') + 
      date.getMinutes().toString().padStart(2, '0') + 
      date.getSeconds().toString().padStart(2, '0');

    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

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
        return NextResponse.json({ error: `DIAGNOSTIC ALFA: STK Request Blocked (${stkStatus}). Raw: ${stkText || "Empty"}` }, { status: 502 });
    }

    let stkData;
    try {
        stkData = JSON.parse(stkText);
    } catch (e) {
        return NextResponse.json({ error: `DIAGNOSTIC ALFA: STK JSON Parse Error (${stkStatus}). Raw: ${stkText}` }, { status: 502 });
    }

    if (stkData.errorMessage || stkData.ResponseCode !== "0") {
      return NextResponse.json({ error: `Safaricom Execution Error: ${stkData.errorMessage || stkData.ResponseDescription}` }, { status: 502 });
    }

    return NextResponse.json({ success: true, message: "STK Push successfully deployed." });

  } catch (err: any) {
    return NextResponse.json({ error: `Backend Exception: ${err.message}` }, { status: 500 });
  }
        }
        
