import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { buffer } from 'micro';

const stripe = new Stripe('sk_test_51R8wQ5Qp1gA9BIqHAJG1DPNbRG9GwyGd5JBTnbsDfXgCSk9SLAQvy38GvNhLlqAd5dlJxL1BM0ShjAIxbcMuBett00A2IWQ00l', {
  apiVersion: '2023-10-16',
});

const prisma = new PrismaClient();

// IMPORTANT: Disable body parsing, need raw body for webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

// Get this from Stripe Dashboard -> Webhooks -> Add endpoint
// For local testing, use Stripe CLI: stripe listen --forward-to localhost:3000/api/webhooks/stripe
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_your_webhook_secret_here';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} Not Allowed`,
    });
  }

  try {
    // Get the raw body as a buffer
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'];

    if (!sig) {
      return res.status(400).json({
        success: false,
        error: 'Missing stripe-signature header',
      });
    }

    let event: Stripe.Event;

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return res.status(400).json({
        success: false,
        error: `Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
      });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        console.log('Payment successful:', session.id);

        // Extract metadata
        const customerName = session.metadata?.customerName || 'Guest';
        const customerEmail = session.customer_email || session.customer_details?.email || '';
        const cartItemsString = session.metadata?.cartItems || '[]';

        let cartItems;
        try {
          cartItems = JSON.parse(cartItemsString);
        } catch (e) {
          console.error('Failed to parse cart items:', e);
          cartItems = [];
        }

        // Calculate total from session
        const total = session.amount_total ? session.amount_total / 100 : 0;

        // Create order in database
        const order = await prisma.order.create({
          data: {
            customer: customerName,
            email: customerEmail,
            total: total,
            status: 'PROCESSING',
            orderItems: {
              create: cartItems.map((item: any) => ({
                productId: item.id,
                quantity: item.quantity,
                price: item.price,
              })),
            },
          },
          include: {
            orderItems: true,
          },
        });

        // Update product stock
        for (const item of cartItems) {
          await prisma.product.update({
            where: { id: item.id },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
        }

        console.log('Order created:', order.id);

        break;
      }

      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Async payment succeeded:', session.id);
        // Handle async payment success (e.g., bank transfers)
        break;
      }

      case 'checkout.session.async_payment_failed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Async payment failed:', session.id);
        // Handle async payment failure
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return a response to acknowledge receipt of the event
    return res.status(200).json({
      success: true,
      received: true,
    });
  } catch (error) {
    console.error('Webhook Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Webhook handler failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    await prisma.$disconnect();
  }
}
