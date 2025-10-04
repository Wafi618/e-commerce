import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });
  console.log('✓ Admin user created:', admin.email);

  // Create customer user
  const customerPassword = await bcrypt.hash('customer123', 10);
  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      password: customerPassword,
      name: 'John Doe',
      role: 'CUSTOMER',
    },
  });
  console.log('✓ Customer user created:', customer.email);

  // Create sample products
  const products = [
    { 
      name: 'Wireless Headphones', 
      price: 79.99, 
      image: '🎧', 
      stock: 15, 
      category: 'Electronics',
      description: 'High-quality wireless headphones with noise cancellation'
    },
    { 
      name: 'Smart Watch', 
      price: 199.99, 
      image: '⌚', 
      stock: 8, 
      category: 'Electronics',
      description: 'Feature-rich smartwatch with fitness tracking'
    },
    { 
      name: 'Laptop Sleeve', 
      price: 29.99, 
      image: '💼', 
      stock: 25, 
      category: 'Accessories',
      description: 'Protective sleeve for 13-15 inch laptops'
    },
    { 
      name: 'USB-C Cable', 
      price: 12.99, 
      image: '🔌', 
      stock: 50, 
      category: 'Accessories',
      description: 'Durable USB-C charging and data cable'
    },
    { 
      name: 'Bluetooth Speaker', 
      price: 49.99, 
      image: '🔊', 
      stock: 12, 
      category: 'Electronics',
      description: 'Portable Bluetooth speaker with powerful bass'
    },
    { 
      name: 'Phone Case', 
      price: 19.99, 
      image: '📱', 
      stock: 30, 
      category: 'Accessories',
      description: 'Protective phone case with premium finish'
    },
    { 
      name: 'Wireless Mouse', 
      price: 34.99, 
      image: '🖱️', 
      stock: 20, 
      category: 'Electronics',
      description: 'Ergonomic wireless mouse for productivity'
    },
    { 
      name: 'Mechanical Keyboard', 
      price: 89.99, 
      image: '⌨️', 
      stock: 10, 
      category: 'Electronics',
      description: 'RGB mechanical keyboard with tactile switches'
    },
    { 
      name: 'Laptop Stand', 
      price: 39.99, 
      image: '💻', 
      stock: 18, 
      category: 'Accessories',
      description: 'Adjustable aluminum laptop stand'
    },
    { 
      name: 'Webcam HD', 
      price: 59.99, 
      image: '🎥', 
      stock: 14, 
      category: 'Electronics',
      description: '1080p HD webcam with auto-focus'
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { name: product.name },
      update: {},
      create: product,
    });
  }
  console.log(`✓ ${products.length} products created`);

  // Create sample orders
  const createdProducts = await prisma.product.findMany({ take: 3 });
  
  if (createdProducts.length > 0) {
    const order1 = await prisma.order.create({
      data: {
        customer: customer.name || 'John Doe',
        email: customer.email,
        total: 79.99,
        status: 'COMPLETED',
        orderItems: {
          create: [
            {
              productId: createdProducts[0].id,
              quantity: 1,
              price: createdProducts[0].price,
            },
          ],
        },
      },
    });

    const order2 = await prisma.order.create({
      data: {
        customer: customer.name || 'John Doe',
        email: customer.email,
        total: 249.98,
        status: 'PROCESSING',
        orderItems: {
          create: [
            {
              productId: createdProducts[1].id,
              quantity: 1,
              price: createdProducts[1].price,
            },
            {
              productId: createdProducts[2].id,
              quantity: 1,
              price: createdProducts[2].price,
            },
          ],
        },
      },
    });

    console.log('✓ Sample orders created');
  }

  console.log('\n🎉 Database seeding completed successfully!\n');
  console.log('Admin credentials:');
  console.log('  Email: admin@example.com');
  console.log('  Password: admin123\n');
  console.log('Customer credentials:');
  console.log('  Email: customer@example.com');
  console.log('  Password: customer123\n');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
