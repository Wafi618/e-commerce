import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === 'GET') {
      // GET /api/orders - Fetch all orders
      const { status, email } = req.query;

      const where: any = {};

      // Filter by status if provided
      if (status && status !== 'all') {
        where.status = (status as string).toUpperCase();
      }

      // Filter by email if provided
      if (email) {
        where.email = {
          contains: email as string,
          mode: 'insensitive',
        };
      }

      const orders = await prisma.order.findMany({
        where,
        include: {
          orderItems: {
            include: {
              product: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Format orders for frontend
      const formattedOrders = orders.map(order => ({
        id: order.id,
        customer: order.customer,
        email: order.email,
        total: order.total,
        status: order.status.toLowerCase(),
        date: order.createdAt.toISOString().split('T')[0],
        items: order.orderItems.length,
        orderItems: order.orderItems,
      }));

      return res.status(200).json({
        success: true,
        data: formattedOrders,
      });
    } else if (req.method === 'POST') {
      // POST /api/orders - Create a new order (used by webhook)
      const { customer, email, total, status, orderItems } = req.body;

      // Validation
      if (!email || !total || !orderItems || !Array.isArray(orderItems)) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: email, total, orderItems',
        });
      }

      // Create order with order items
      const order = await prisma.order.create({
        data: {
          customer: customer || 'Guest',
          email,
          total: parseFloat(total),
          status: status || 'PENDING',
          orderItems: {
            create: orderItems.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
        include: {
          orderItems: {
            include: {
              product: true,
            },
          },
        },
      });

      return res.status(201).json({
        success: true,
        data: order,
      });
    } else {
      // Method not allowed
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({
        success: false,
        error: `Method ${req.method} Not Allowed`,
      });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    await prisma.$disconnect();
  }
}
