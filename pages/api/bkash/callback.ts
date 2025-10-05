import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BKASH_USERNAME = process.env.BKASH_USERNAME || '';
const BKASH_PASSWORD = process.env.BKASH_PASSWORD || '';
const BKASH_APP_KEY = process.env.BKASH_APP_KEY || '';
const BKASH_APP_SECRET = process.env.BKASH_APP_SECRET || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { paymentID, status } = req.query;
  

  if (status === 'cancel' || status === 'failure') {
    return res.redirect('/checkout/cancel');
  }

  try {
    // Grant token
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

    // Execute payment
    const executeResponse = await fetch(
      'https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout/execute',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': grantTokenData.id_token,
          'X-App-Key': BKASH_APP_KEY,
        },
        body: JSON.stringify({ paymentID }),
      }
    );

    const executeData = await executeResponse.json();

    if (executeData.transactionStatus === 'Completed') {
      // Get cart data from temporary storage
      const paymentData = global.pendingPayments?.[paymentID as string];

      if (paymentData) {
        // Create order in database
        const order = await prisma.order.create({
          data: {
            customer: paymentData.customerName,
            email: paymentData.customerEmail,
            total: parseFloat(paymentData.amount),
            status: 'PROCESSING',
            orderItems: {
              create: paymentData.cartItems.map((item: any) => ({
                productId: item.id,
                quantity: item.quantity,
                price: item.price,
              })),
            },
          },
        });

        // Update product stock
        for (const item of paymentData.cartItems) {
          await prisma.product.update({
            where: { id: item.id },
            data: { stock: { decrement: item.quantity } },
          });
        }

        // Clean up
        delete global.pendingPayments[paymentID as string];
      }

      return res.redirect(`/checkout/success?session_id=${executeData.paymentID}`);
    } else {
      return res.redirect('/checkout/cancel');
    }
  } catch (error) {
    console.error('Callback error:', error);
    return res.redirect('/checkout/cancel');
  } finally {
    await prisma.$disconnect();
  }
}
