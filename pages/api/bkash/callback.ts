import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { paymentID, status } = req.query;

  // TEMPORARY: Treat all payments as successful for testing
  // TODO: Remove this before production!
  return res.redirect(`/checkout/success?payment_id=TEST_${paymentID}&trx_id=TEST_TRX_${Date.now()}`);
}