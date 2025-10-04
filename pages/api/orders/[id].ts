import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

type OrderStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  // Validate ID
  if (!id || Array.isArray(id)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid order ID',
    });
  }

  const orderId = parseInt(id);

  if (isNaN(orderId)) {
    return res.status(400).json({
      success: false,
      error: 'Order ID must be a number',
    });
  }

  try {
    if (req.method === 'GET') {
      // GET /api/orders/[id] - Fetch a single order
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          orderItems: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found',
        });
      }

      return res.status(200).json({
        success: true,
        data: order,
      });
    } else if (req.method === 'PUT') {
      // PUT /api/orders/[id] - Update order status
      const { status } = req.body;

      // Check if order exists
      const existingOrder = await prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!existingOrder) {
        return res.status(404).json({
          success: false,
          error: 'Order not found',
        });
      }

      // Validate status
      const validStatuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'];
      const upperStatus = status?.toUpperCase();

      if (!upperStatus || !validStatuses.includes(upperStatus)) {
        return res.status(400).json({
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        });
      }

      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: upperStatus as OrderStatus,
        },
        include: {
          orderItems: {
            include: {
              product: true,
            },
          },
        },
      });

      return res.status(200).json({
        success: true,
        data: updatedOrder,
      });
    } else {
      // Method not allowed
      res.setHeader('Allow', ['GET', 'PUT']);
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
