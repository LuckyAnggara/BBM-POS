import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // Clear existing products and users
  await prisma.user.deleteMany();
  await prisma.product.deleteMany();

  // Seed Products
  const productsToCreate = [
    {
      name: 'Organic Apples',
      sku: 'ORG-APP-001',
      category: 'Fruits',
      quantity: 150,
      price: 2.99,
      costPrice: 1.50,
      supplier: 'Fresh Farms Inc.',
      description: 'Crisp and delicious organic apples, perfect for snacking or baking.',
      imageUrl: 'https://placehold.co/300x200.png',
      tags: JSON.stringify(['organic', 'fruit', 'healthy']),
      lowStockThreshold: 20,
    },
    {
      name: 'Whole Wheat Bread',
      sku: 'WW-BRD-002',
      category: 'Bakery',
      quantity: 75,
      price: 4.50,
      costPrice: 2.20,
      supplier: 'Artisan Bakers Co.',
      description: 'Freshly baked whole wheat bread, rich in fiber.',
      imageUrl: 'https://placehold.co/300x200.png',
      tags: JSON.stringify(['bakery', 'bread', 'whole wheat']),
      lowStockThreshold: 10,
    },
    {
      name: 'Free-Range Eggs (Dozen)',
      sku: 'FR-EGG-003',
      category: 'Dairy & Eggs',
      quantity: 100,
      price: 5.99,
      costPrice: 3.00,
      supplier: 'Happy Hens Farm',
      description: 'Grade A large free-range eggs.',
      imageUrl: 'https://placehold.co/300x200.png',
      tags: JSON.stringify(['eggs', 'dairy', 'free-range']),
      lowStockThreshold: 15,
    },
     {
      name: 'Artisanal Coffee Beans',
      sku: 'COF-BEA-004',
      category: 'Beverages',
      quantity: 50,
      price: 12.99,
      costPrice: 7.50,
      supplier: 'Roast Masters Ltd.',
      description: 'Premium whole coffee beans, medium roast.',
      imageUrl: 'https://placehold.co/300x200.png',
      tags: JSON.stringify(['coffee', 'beverage', 'premium']),
      lowStockThreshold: 5,
    },
    {
      name: 'Extra Virgin Olive Oil',
      sku: 'OIL-EVO-005',
      category: 'Pantry Staples',
      quantity: 80,
      price: 9.75,
      costPrice: 5.25,
      supplier: 'Mediterranean Groves',
      description: 'Cold-pressed extra virgin olive oil, 500ml.',
      imageUrl: 'https://placehold.co/300x200.png',
      tags: JSON.stringify(['oil', 'pantry', 'cooking']),
      lowStockThreshold: 10,
    },
  ];

  for (const p of productsToCreate) {
    const product = await prisma.product.create({
      data: p,
    });
    console.log(`Created product with id: ${product.id} (${product.name})`);
  }

  // Seed Users
  const usersToCreate = [
    {
      name: 'Alice Wonderland',
      email: 'alice@stockpilot.com',
      role: Role.ADMIN,
      avatarUrl: 'https://placehold.co/100x100/E91E63/FFFFFF.png?text=AW',
      isActive: true,
      lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    },
    {
      name: 'Bob The Builder',
      email: 'bob@stockpilot.com',
      role: Role.MANAGER,
      avatarUrl: 'https://placehold.co/100x100/FFC107/000000.png?text=BB',
      isActive: true,
      lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    },
    {
      name: 'Charlie Brown',
      email: 'charlie@stockpilot.com',
      role: Role.STAFF,
      avatarUrl: 'https://placehold.co/100x100/4CAF50/FFFFFF.png?text=CB',
      isActive: false,
    },
    {
      name: 'Diana Prince',
      email: 'diana@stockpilot.com',
      role: Role.STAFF,
      isActive: true,
      lastLogin: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    },
  ];

  for (const u of usersToCreate) {
    const user = await prisma.user.create({
      data: u,
    });
    console.log(`Created user with id: ${user.id} (${user.name})`);
  }

  console.log(`Seeding finished.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
