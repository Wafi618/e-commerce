import { NextApiRequest, NextApiResponse } from 'next';

const BKASH_USERNAME = process.env.BKASH_USERNAME || '';
const BKASH_PASSWORD = process.env.BKASH_PASSWORD || '';
const BKASH_APP_KEY = process.env.BKASH_APP_KEY || '';
const BKASH_APP_SECRET = process.env.BKASH_APP_SECRET || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { amount, invoiceNumber, cartItems, customerEmail, customerName } = req.body;

    // Grant token - same as Flutter implementation
    const grantTokenResponse = await fetch(
      'https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout/token/grant',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'username': BKASH_USERNAME,
          'password': BKASH_PASSWORD,
        },
        body: JSON.stringify({
          app_key: BKASH_APP_KEY,
          app_secret: BKASH_APP_SECRET,
        }),
      }
    );

    const grantTokenData = await grantTokenResponse.json();
    
    if (!grantTokenData.id_token) {
      return res.status(400).json({ success: false, error: 'Failed to get token' });
    }

    // Create payment - same as Flutter implementation
    const createPaymentResponse = await fetch(
      'https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout/create',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': grantTokenData.id_token,
          'X-App-Key': BKASH_APP_KEY,
        },
        body: JSON.stringify({
          mode: '0011',
          payerReference: '01770618576',
          callbackURL: `${req.headers.origin || 'http://localhost:3000'}/api/bkash/callback`,
          amount: amount,
          currency: 'BDT',
          intent: 'sale',
          merchantInvoiceNumber: invoiceNumber,
        }),
      }
    );

    const createPaymentData = await createPaymentResponse.json();

    if (!createPaymentData.bkashURL) {
      return res.status(400).json({ success: false, error: 'Failed to create payment' });
    }

    // Store cart info in a way callback can access it
    // In production, use proper session management or database
    global.pendingPayments = global.pendingPayments || {};
    global.pendingPayments[createPaymentData.paymentID] = {
      cartItems,
      customerEmail,
      customerName,
      invoiceNumber,
      amount,
    };

    return res.status(200).json({
      success: true,
      bkashURL: createPaymentData.bkashURL,
      paymentID: createPaymentData.paymentID,
    });
  } catch (error) {
    console.error('bKash error:', error);
    return res.status(500).json({ success: false, error: 'Something went wrong' });
  }
}