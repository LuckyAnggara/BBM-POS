
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // Clear existing data in reverse order of dependency
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.user.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany(); // Clear categories before products
  await prisma.appSettings.deleteMany(); 

  // Seed AppSettings (ensure only one record)
  await prisma.appSettings.upsert({
    where: { id: 'main_settings' },
    update: {
      defaultTaxRate: 10, // Set default tax rate if updating
    }, 
    create: {
      id: 'main_settings', 
      appName: "StockPilot HQ",
      dateFormat: "yyyy-MM-dd",
      timeZone: "Europe/London",
      defaultCurrency: "GBP",
      emailNotifications: true,
      lowStockAlerts: true,
      newOrderAlerts: true,
      defaultTaxRate: 10, // e.g. 10%
    },
  });
  console.log(`Created/ensured main app settings.`);

  // Seed Categories
  const categoriesToCreate = [
    { name: 'Fruits' },
    { name: 'Bakery' },
    { name: 'Dairy & Eggs' },
    { name: 'Beverages' },
    { name: 'Pantry Staples' },
    { name: 'Men' },
    { name: 'Women' },
    { name: 'Accessories' },
    { name: 'Uncategorized' }, // Default category
  ];
  const createdCategories = [];
  for (const cat of categoriesToCreate) {
    const category = await prisma.category.create({ data: cat });
    createdCategories.push(category);
    console.log(`Created category with id: ${category.id} (${category.name})`);
  }

  const getCategoryIdByName = (name: string) => {
    const found = createdCategories.find(c => c.name === name);
    if (!found) {
        const uncategorized = createdCategories.find(c => c.name === 'Uncategorized');
        console.warn(`Category "${name}" not found, using "Uncategorized".`);
        return uncategorized!.id; // Fallback to Uncategorized, ensure it exists
    }
    return found.id;
  }


  // Seed Products
  const productsToCreate = [
    {
      id: 'prod_apple', name: 'Organic Apples', sku: 'ORG-APP-001', categoryId: getCategoryIdByName('Fruits'), quantity: 150, price: 2.99, costPrice: 1.50, supplier: 'Fresh Farms Inc.', description: 'Crisp and delicious organic apples, perfect for snacking or baking.', imageUrl: 'https://placehold.co/300x200/a2cf6e/ffffff.png?text=Apples', tags: JSON.stringify(['organic', 'fruit', 'healthy']), lowStockThreshold: 20,
    },
    {
      id: 'prod_bread', name: 'Whole Wheat Bread', sku: 'WW-BRD-002', categoryId: getCategoryIdByName('Bakery'), quantity: 75, price: 4.50, costPrice: 2.20, supplier: 'Artisan Bakers Co.', description: 'Freshly baked whole wheat bread, rich in fiber.', imageUrl: 'https://placehold.co/300x200/d4a373/ffffff.png?text=Bread', tags: JSON.stringify(['bakery', 'bread', 'whole wheat']), lowStockThreshold: 10,
    },
    {
      id: 'prod_eggs', name: 'Free-Range Eggs (Dozen)', sku: 'FR-EGG-003', categoryId: getCategoryIdByName('Dairy & Eggs'), quantity: 100, price: 5.99, costPrice: 3.00, supplier: 'Happy Hens Farm', description: 'Grade A large free-range eggs.', imageUrl: 'https://placehold.co/300x200/fefae0/000000.png?text=Eggs', tags: JSON.stringify(['eggs', 'dairy', 'free-range']), lowStockThreshold: 15,
    },
    {
      id: 'prod_coffee', name: 'Artisanal Coffee Beans', sku: 'COF-BEA-004', categoryId: getCategoryIdByName('Beverages'), quantity: 50, price: 12.99, costPrice: 7.50, supplier: 'Roast Masters Ltd.', description: 'Premium whole coffee beans, medium roast.', imageUrl: 'https://placehold.co/300x200/6f4e37/ffffff.png?text=Coffee', tags: JSON.stringify(['coffee', 'beverage', 'premium']), lowStockThreshold: 5,
    },
    {
      id: 'prod_oil', name: 'Extra Virgin Olive Oil', sku: 'OIL-EVO-005', categoryId: getCategoryIdByName('Pantry Staples'), quantity: 80, price: 9.75, costPrice: 5.25, supplier: 'Mediterranean Groves', description: 'Cold-pressed extra virgin olive oil, 500ml.', imageUrl: 'https://placehold.co/300x200/808000/ffffff.png?text=Oil', tags: JSON.stringify(['oil', 'pantry', 'cooking']), lowStockThreshold: 10,
    },
    {
      id: 'prod_shirt_men', name: 'Men\'s Classic Tee', sku: 'MEN-TEE-001', categoryId: getCategoryIdByName('Men'), quantity: 120, price: 25.00, costPrice: 10.00, supplier: 'Apparel Co.', description: 'Comfortable and stylish classic t-shirt for men.', imageUrl: 'https://placehold.co/300x200/5c677d/ffffff.png?text=Men+Tee', tags: JSON.stringify(['clothing', 'men', 'tshirt']), lowStockThreshold: 15,
    },
    {
      id: 'prod_dress_women', name: 'Women\'s Summer Dress', sku: 'WOM-DRS-001', categoryId: getCategoryIdByName('Women'), quantity: 80, price: 45.00, costPrice: 18.00, supplier: 'Fashionista Ltd.', description: 'Light and airy summer dress for women.', imageUrl: 'https://placehold.co/300x200/f4a261/ffffff.png?text=Dress', tags: JSON.stringify(['clothing', 'women', 'dress']), lowStockThreshold: 10,
    },
     {
      id: 'prod_cap_unisex', name: 'Unisex Baseball Cap', sku: 'UNI-CAP-001', categoryId: getCategoryIdByName('Accessories'), quantity: 200, price: 15.99, costPrice: 6.50, supplier: 'Headwear Inc.', description: 'Adjustable and comfortable baseball cap for all.', imageUrl: 'https://placehold.co/300x200/2a9d8f/ffffff.png?text=Cap', tags: JSON.stringify(['accessory', 'unisex', 'cap']), lowStockThreshold: 25,
    },
  ];

  const createdProducts = [];
  for (const p of productsToCreate) {
    const product = await prisma.product.create({ data: p });
    createdProducts.push(product);
    console.log(`Created product with id: ${product.id} (${product.name})`);
  }

  // Seed Users
  const usersToCreate = [
    {
      id: 'user_admin_alice', name: 'Alice Wonderland', email: 'alice@stockpilot.com', role: "ADMIN", avatarUrl: 'https://placehold.co/100x100/E91E63/FFFFFF.png?text=AW', isActive: true, lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 2),
    },
    {
      id: 'user_manager_bob', name: 'Bob The Builder', email: 'bob@stockpilot.com', role: "MANAGER", avatarUrl: 'https://placehold.co/100x100/FFC107/000000.png?text=BB', isActive: true, lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    },
    {
      id: 'user_staff_charlie', name: 'Charlie Brown', email: 'charlie@stockpilot.com', role: "STAFF", avatarUrl: 'https://placehold.co/100x100/4CAF50/FFFFFF.png?text=CB', isActive: true, lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 3), 
    },
    {
      id: 'user_staff_diana', name: 'Diana Prince', email: 'diana@stockpilot.com', role: "STAFF", isActive: true, lastLogin: new Date(Date.now() - 1000 * 60 * 30),
    },
  ];
  
  const createdUsers = [];
  for (const u of usersToCreate) {
    const user = await prisma.user.create({ data: u });
    createdUsers.push(user);
    console.log(`Created user with id: ${user.id} (${user.name})`);
  }

  // Seed Customers
  const customersToCreate = [
    { id: 'cust_john_doe', name: 'John Doe', email: 'john.doe@example.com', phone: '555-0101' },
    { id: 'cust_jane_smith', name: 'Jane Smith', email: 'jane.smith@example.com', phone: '555-0102' },
    { id: 'cust_guest_1', name: 'Guest Customer', email: null, phone: null }, // Example guest
  ];
  for (const c of customersToCreate) {
    const customer = await prisma.customer.create({ data: c });
    console.log(`Created customer with id: ${customer.id} (${customer.name})`);
  }


  // Seed Purchase Orders
  if (createdProducts.length > 0 && createdUsers.length > 0) {
    const adminUser = createdUsers.find(u => u.role === "ADMIN");
    if (!adminUser) {
        console.error("Admin user not found for seeding POs. Skipping PO seeding.");
    } else {
        const po1 = await prisma.purchaseOrder.create({
        data: {
            poNumber: 'PO2024-001-DB',
            supplierName: 'Fresh Farms Inc.',
            orderDate: new Date('2024-07-15T10:00:00Z'),
            expectedDeliveryDate: new Date('2024-07-20T10:00:00Z'),
            status: "Received", 
            discountAmount: 0,
            shippingCost: 10.00,
            taxes: 5.00,
            totalAmount: 90.00, 
            notes: 'Ensure apples are fresh upon delivery.',
            createdById: adminUser.id,
            items: {
            create: [
                {
                productId: createdProducts[0].id, 
                productName: createdProducts[0].name,
                quantityOrdered: 50,
                quantityReceived: 50,
                unitCost: createdProducts[0].costPrice || 1.50,
                totalCost: (createdProducts[0].costPrice || 1.50) * 50,
                },
            ],
            },
        },
        });
        console.log(`Created PO with id: ${po1.id}`);

        const po2 = await prisma.purchaseOrder.create({
        data: {
            poNumber: 'PO2024-002-DB',
            supplierName: 'Artisan Bakers Co.',
            orderDate: new Date('2024-07-18T11:00:00Z'),
            expectedDeliveryDate: new Date('2024-07-25T11:00:00Z'),
            status: "Ordered", 
            discountAmount: 5.00,
            shippingCost: 5.00,
            taxes: 0.00, 
            totalAmount: ( (createdProducts[1].costPrice || 2.20) * 30 ) - 5.00 + 5.00,
            createdById: adminUser.id,
            items: {
            create: [
                {
                productId: createdProducts[1].id, 
                productName: createdProducts[1].name,
                quantityOrdered: 30,
                unitCost: createdProducts[1].costPrice || 2.20,
                totalCost: (createdProducts[1].costPrice || 2.20) * 30,
                },
            ],
            },
        },
        });
        console.log(`Created PO with id: ${po2.id}`);
    }
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
