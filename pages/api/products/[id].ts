import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

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
      error: 'Invalid product ID',
    });
  }

  const productId = parseInt(id);

  if (isNaN(productId)) {
    return res.status(400).json({
      success: false,
      error: 'Product ID must be a number',
    });
  }

  try {
    if (req.method === 'GET') {
      // GET /api/products/[id] - Fetch a single product
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found',
        });
      }

      return res.status(200).json({
        success: true,
        data: product,
      });
    } else if (req.method === 'PUT') {
      // PUT /api/products/[id] - Update a product
      const { name, price, image, stock, category, description } = req.body;

      // Check if product exists
      const existingProduct = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!existingProduct) {
        return res.status(404).json({
          success: false,
          error: 'Product not found',
        });
      }

      // Prepare update data (only include provided fields)
      const updateData: any = {};

      if (name !== undefined) updateData.name = name;
      if (price !== undefined) {
        if (typeof price !== 'number' || price <= 0) {
          return res.status(400).json({
            success: false,
            error: 'Price must be a positive number',
          });
        }
        updateData.price = parseFloat(price);
      }
      if (image !== undefined) updateData.image = image;
      if (stock !== undefined) {
        if (typeof stock !== 'number' || stock < 0) {
          return res.status(400).json({
            success: false,
            error: 'Stock must be a non-negative number',
          });
        }
        updateData.stock = parseInt(stock);
      }
      if (category !== undefined) updateData.category = category;
      if (description !== undefined) updateData.description = description;

      const updatedProduct = await prisma.product.update({
        where: { id: productId },
        data: updateData,
      });

      return res.status(200).json({
        success: true,
        data: updatedProduct,
      });
    } else if (req.method === 'DELETE') {
      // DELETE /api/products/[id] - Delete a product
      const existingProduct = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!existingProduct) {
        return res.status(404).json({
          success: false,
          error: 'Product not found',
        });
      }

      // Check if product is in any orders (optional business logic)
      const orderItemsCount = await prisma.orderItem.count({
        where: { productId },
      });

      if (orderItemsCount > 0) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete product that is part of existing orders',
        });
      }

      await prisma.product.delete({
        where: { id: productId },
      });

      return res.status(200).json({
        success: true,
        message: 'Product deleted successfully',
      });
    } else {
      // Method not allowed
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
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
