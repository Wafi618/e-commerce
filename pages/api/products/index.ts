import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === 'GET') {
      // GET /api/products - Fetch all products
      const { category, search } = req.query;

      const where: any = {};

      // Filter by category if provided
      if (category && category !== 'All') {
        where.category = category as string;
      }

      // Search by product name if provided
      if (search) {
        where.name = {
          contains: search as string,
          mode: 'insensitive',
        };
      }

      const products = await prisma.product.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
      });

      return res.status(200).json({
        success: true,
        data: products,
      });
    } else if (req.method === 'POST') {
      // POST /api/products - Create a new product
      const { name, price, image, stock, category, description } = req.body;

      // Validation
      if (!name || !price || !stock || !category) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: name, price, stock, category',
        });
      }

      if (typeof price !== 'number' || price <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Price must be a positive number',
        });
      }

      if (typeof stock !== 'number' || stock < 0) {
        return res.status(400).json({
          success: false,
          error: 'Stock must be a non-negative number',
        });
      }

      const product = await prisma.product.create({
        data: {
          name,
          price: price,
          image: image || '📦',
          stock: stock,
          category,
          description: description || null,
        },
      });

      return res.status(201).json({
        success: true,
        data: product,
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
