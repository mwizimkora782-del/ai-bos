// PROFESSIONAL OVERRIDE: Force Vercel to never cache this file at the Edge
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, userId } = body;

    let formattedPhone = phone.replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) formattedPhone = '254' + formattedPhone.substring(1);
    if (formattedPhone.startsWith('+')) formattedPhone = formattedPhone.substring(1);

    const cleanStr = (str: string | undefined) => str ? str.replace(/[\s\n\r\t]+/g, '') : '';
    
    const consumerKey = cleanStr(process.env.MPESA_CONSUMER_KEY);
    const consumerSecret = cleanStr(process.env.MPESA_CONSUMER_SECRET);
    const passkey = cleanStr(process.env.MPESA_PASSKEY);
    const shortcode = cleanStr(process.env.MPESA_SHORTCODE) || '174379';
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/mpesa/callback`;

    if (!consumerKey || !consumerSecret || !passkey) {
      return NextResponse.json({ error: "Vercel Vault Error: Keys are missing." }, { status: 500 });
    }

    // FIREWALL CHECK: Did you accidentally copy the asterisks?
    if (consumerKey.includes('*') || consumerSecret.includes('*')) {
      return NextResponse.json({ error: "CRITICAL: Your Vercel keys contain asterisks (*). Reveal them in Daraja before copying." }, { status: 500 });
    }

    // 1. Safaricom OAuth with Firewall Bypass
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    const tokenResponse = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      method: 'GET',
      headers: { 
        'Authorization': `Basic ${auth}`,
        'Cache-Control': 'no-cache',
        'User-Agent': 'AI-BOS-Server/1.0' // Bypasses aggressive WAF blocks
      },
      cache: 'no-store'
    });
    
    const tokenStatus = tokenResponse.status;
    const tokenText = await tokenResponse.text();
    
    if (!tokenResponse.ok) {
        return NextResponse.json({ error: `Safaricom OAuth Blocked. Status Code: ${tokenStatus}. Raw: ${tokenText || "Empty"}` }, { status: 502 });
    }

    let tokenData;
    try {
      tokenData = JSON.parse(tokenText);
    } catch (e) {
      return NextResponse.json({ error: `JSON Parse Crash. Status: ${tokenStatus}. Raw: ${tokenText}` }, { status: 502 });
    }

    if (!tokenData.access_token) {
      return NextResponse.json({ error: `Safaricom returned OK but no token. Response: ${tokenText}` }, { status: 502 });
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
        'Cache-Control': 'no-cache',
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
        TransactionDesc: "AI-BOS Professional Upgrade"
      })
    });

    const stkStatus = stkResponse.status;
    const stkText = await stkResponse.text();
    
    if (!stkResponse.ok) {
        return NextResponse.json({ error: `Safaricom STK Blocked. Status Code: ${stkStatus}. Raw: ${stkText || "Empty"}` }, { status: 502 });
    }

    let stkData;
    try {
      stkData = JSON.parse(stkText);
    } catch (e) {
      return NextResponse.json({ error: `STK JSON Crash. Status: ${stkStatus}. Raw: ${stkText}` }, { status: 502 });
    }

    if (stkData.errorMessage) {
      return NextResponse.json({ error: `Safaricom Rejected Payment: ${stkData.errorMessage}` }, { status: 502 });
    }

    return NextResponse.json({ success: true, message: "STK Push sent." });

  } catch (err: any) {
    return NextResponse.json({ error: `Server Exception: ${err.message}` }, { status: 500 });
  }
        }
