// PROFESSIONAL OVERRIDE: Prevent Vercel edge caching of API responses
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, userId } = body;

    if (!phone) {
        return NextResponse.json({ error: "Phone number payload missing." }, { status: 400 });
    }

    // Standardize phone format to Safaricom requirement (254XXXXXXXXX)
    let formattedPhone = phone.replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) formattedPhone = '254' + formattedPhone.substring(1);
    if (formattedPhone.startsWith('+')) formattedPhone = formattedPhone.substring(1);

    // Deep clean whitespace/newlines only. Preserves special chars if they exist.
    const cleanStr = (str?: string) => str ? str.replace(/\s+/g, '') : '';
    
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
    const authBase64 = Buffer.from(authString).toString('base64');
    
    const tokenResponse = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      method: 'GET',
      headers: { 
        'Authorization': `Basic ${authBase64}`,
        'Accept': 'application/json' // Crucial: Prevents Daraja 400 Bad Request drops
      },
      cache: 'no-store'
    });
    
    if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        // 401 = Invalid Keys. 400 = Malformed Header.
        return NextResponse.json({ 
            error: `Safaricom OAuth Failed (${tokenResponse.status}). Response: ${errorText || "Empty Gateway Drop"}` 
        }, { status: 502 });
    }

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      return NextResponse.json({ error: "Safaricom authorized the request but failed to issue a token." }, { status: 502 });
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

    // 3. Dispatch STK Push to User Device
    const stkResponse = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      cache: 'no-store',
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: 1, // KES 1 for Sandbox Testing
        PartyA: formattedPhone,
        PartyB: shortcode,
        PhoneNumber: formattedPhone,
        CallBackURL: callbackUrl,
        AccountReference: userId || "AI_BOS_GUEST",
        TransactionDesc: "AI-BOS Upgrade"
      })
    });

    if (!stkResponse.ok) {
        const stkErrorText = await stkResponse.text();
        return NextResponse.json({ error: `Safaricom STK Blocked (${stkResponse.status}). Raw: ${stkErrorText}` }, { status: 502 });
    }

    const stkData = await stkResponse.json();

    if (stkData.errorMessage || stkData.ResponseCode !== "0") {
      return NextResponse.json({ error: `Safaricom Execution Error: ${stkData.errorMessage || stkData.ResponseDescription}` }, { status: 502 });
    }

    return NextResponse.json({ success: true, message: "STK Push successfully deployed." });

  } catch (err: any) {
    return NextResponse.json({ error: `Server Backend Exception: ${err.message}` }, { status: 500 });
  }
      }
