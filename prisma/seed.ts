
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
  await prisma.category.deleteMany(); 
  await prisma.appSettings.deleteMany(); 

  // Seed AppSettings
  await prisma.appSettings.upsert({
    where: { id: 'main_settings' },
    update: {
      defaultTaxRate: 10, 
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
      defaultTaxRate: 10, 
    },
  });
  console.log(`Created/ensured main app settings.`);

  // Seed Categories
  const categoriesToCreate = [
    { name: 'Fruits' }, { name: 'Bakery' }, { name: 'Dairy & Eggs' },
    { name: 'Beverages' }, { name: 'Pantry Staples' }, { name: 'Men' },
    { name: 'Women' }, { name: 'Accessories' }, { name: 'Uncategorized' },
  ];
  const createdCategories = [];
  for (const cat of categoriesToCreate) {
    const category = await prisma.category.create({ data: cat });
    createdCategories.push(category);
  }
  console.log(`Created ${createdCategories.length} categories.`);
  const getCategoryIdByName = (name: string) => createdCategories.find(c => c.name === name)?.id || createdCategories.find(c => c.name === 'Uncategorized')!.id;

  // Seed Products
  const productsToCreate = [
    { id: 'prod_apple', name: 'Organic Apples', sku: 'ORG-APP-001', categoryId: getCategoryIdByName('Fruits'), quantity: 150, price: 2.99, costPrice: 1.50, supplier: 'Fresh Farms Inc.', description: 'Crisp organic apples.', imageUrl: 'https://placehold.co/300x200/a2cf6e/ffffff.png?text=Apples', tags: JSON.stringify(['organic', 'fruit']), lowStockThreshold: 20 },
    { id: 'prod_bread', name: 'Whole Wheat Bread', sku: 'WW-BRD-002', categoryId: getCategoryIdByName('Bakery'), quantity: 75, price: 4.50, costPrice: 2.20, supplier: 'Artisan Bakers Co.', description: 'Freshly baked whole wheat bread.', imageUrl: 'https://placehold.co/300x200/d4a373/ffffff.png?text=Bread', tags: JSON.stringify(['bakery', 'bread']), lowStockThreshold: 10 },
    { id: 'prod_eggs', name: 'Free-Range Eggs (Dozen)', sku: 'FR-EGG-003', categoryId: getCategoryIdByName('Dairy & Eggs'), quantity: 100, price: 5.99, costPrice: 3.00, supplier: 'Happy Hens Farm', description: 'Grade A large free-range eggs.', imageUrl: 'https://placehold.co/300x200/fefae0/000000.png?text=Eggs', tags: JSON.stringify(['eggs', 'dairy']), lowStockThreshold: 15 },
    { id: 'prod_coffee', name: 'Artisanal Coffee Beans', sku: 'COF-BEA-004', categoryId: getCategoryIdByName('Beverages'), quantity: 50, price: 12.99, costPrice: 7.50, supplier: 'Roast Masters Ltd.', description: 'Premium whole coffee beans.', imageUrl: 'https://placehold.co/300x200/6f4e37/ffffff.png?text=Coffee', tags: JSON.stringify(['coffee', 'beverage']), lowStockThreshold: 5 },
  ];
  const createdProducts = [];
  for (const p of productsToCreate) {
    const product = await prisma.product.create({ data: p });
    createdProducts.push(product);
  }
  console.log(`Created ${createdProducts.length} products.`);

  // Seed Users
  const usersToCreate = [
    { id: 'user_admin_alice', name: 'Alice Wonderland', email: 'alice@stockpilot.com', role: "ADMIN", avatarUrl: 'https://placehold.co/100x100/E91E63/FFFFFF.png?text=AW', isActive: true, lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 2) },
    { id: 'user_manager_bob', name: 'Bob The Builder', email: 'bob@stockpilot.com', role: "MANAGER", avatarUrl: 'https://placehold.co/100x100/FFC107/000000.png?text=BB', isActive: true, lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2) },
    { id: 'user_staff_charlie', name: 'Charlie Brown', email: 'charlie@stockpilot.com', role: "STAFF", avatarUrl: 'https://placehold.co/100x100/4CAF50/FFFFFF.png?text=CB', isActive: true, lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 3) },
  ];
  const createdUsers = [];
  for (const u of usersToCreate) {
    const user = await prisma.user.create({ data: u });
    createdUsers.push(user);
  }
  console.log(`Created ${createdUsers.length} users.`);

  // Seed Customers
  const customersToCreate = [
    { id: 'cust_john_doe', name: 'John Doe', email: 'john.doe@example.com', phone: '555-0101' },
    { id: 'cust_jane_smith', name: 'Jane Smith', email: 'jane.smith@example.com', phone: '555-0102' },
    { id: 'cust_guest_1', name: 'Guest Customer', email: null, phone: null },
  ];
  const createdCustomers = [];
  for (const c of customersToCreate) {
    const customer = await prisma.customer.create({ data: c });
    createdCustomers.push(customer);
  }
  console.log(`Created ${createdCustomers.length} customers.`);

  // Seed Purchase Orders
  const adminUser = createdUsers.find(u => u.role === "ADMIN");
  if (adminUser && createdProducts.length > 1) {
    await prisma.purchaseOrder.create({
      data: {
        poNumber: 'PO2024-0701-DB', supplierName: 'Fresh Farms Inc.', orderDate: new Date('2024-07-01T10:00:00Z'), expectedDeliveryDate: new Date('2024-07-05T10:00:00Z'), status: "Received", discountAmount: 0, shippingCost: 10.00, taxes: 5.00, totalAmount: (createdProducts[0].costPrice! * 20) + 10 + 5, notes: 'Urgent restock.', createdById: adminUser.id,
        items: { create: [{ productId: createdProducts[0].id, productName: createdProducts[0].name, quantityOrdered: 20, unitCost: createdProducts[0].costPrice!, totalCost: createdProducts[0].costPrice! * 20, quantityReceived: 20 }] },
      },
    });
    console.log(`Created a purchase order.`);
  }

  // Seed Sales
  const staffUserCharlie = createdUsers.find(u => u.id === 'user_staff_charlie');
  const customerJohn = createdCustomers.find(c => c.id === 'cust_john_doe');
  const customerJane = createdCustomers.find(c => c.id === 'cust_jane_smith');

  if (staffUserCharlie && customerJohn && createdProducts.length >= 2) {
    const sale1Subtotal = (createdProducts[0].price * 2) + (createdProducts[1].price * 1);
    await prisma.sale.create({
      data: {
        saleNumber: 'SALE-20240720-001', saleDate: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
        customerId: customerJohn.id, customerName: customerJohn.name, userId: staffUserCharlie.id,
        subtotal: sale1Subtotal, discountAmount: 0, taxPercent: 10, taxAmount: sale1Subtotal * 0.10, shippingCost: 0, grandTotal: sale1Subtotal * 1.10,
        paymentMethod: 'Cash', status: 'Completed', notes: 'Customer paid in cash.',
        items: {
          create: [
            { productId: createdProducts[0].id, productName: createdProducts[0].name, quantity: 2, unitPrice: createdProducts[0].price, totalPrice: createdProducts[0].price * 2, costPriceAtSale: createdProducts[0].costPrice },
            { productId: createdProducts[1].id, productName: createdProducts[1].name, quantity: 1, unitPrice: createdProducts[1].price, totalPrice: createdProducts[1].price * 1, costPriceAtSale: createdProducts[1].costPrice },
          ]
        }
      }
    });
    console.log(`Created sale 1 for John Doe.`);
  }

  if (staffUserCharlie && customerJane && createdProducts.length >= 3) {
     const sale2Subtotal = (createdProducts[2].price * 1) + (createdProducts[3].price * 1);
    await prisma.sale.create({
      data: {
        saleNumber: 'SALE-20240721-002', saleDate: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        customerId: customerJane.id, customerName: customerJane.name, userId: staffUserCharlie.id,
        subtotal: sale2Subtotal, discountAmount: 1.00, taxPercent: 10, taxAmount: (sale2Subtotal - 1.00) * 0.10, shippingCost: 2.50, grandTotal: (sale2Subtotal - 1.00) * 1.10 + 2.50,
        paymentMethod: 'Credit Card', status: 'Completed', notes: 'Used promo code SUMMER10 (not implemented, just note)',
        items: {
          create: [
            { productId: createdProducts[2].id, productName: createdProducts[2].name, quantity: 1, unitPrice: createdProducts[2].price, totalPrice: createdProducts[2].price * 1, costPriceAtSale: createdProducts[2].costPrice },
            { productId: createdProducts[3].id, productName: createdProducts[3].name, quantity: 1, unitPrice: createdProducts[3].price, totalPrice: createdProducts[3].price * 1, costPriceAtSale: createdProducts[3].costPrice },
          ]
        }
      }
    });
    console.log(`Created sale 2 for Jane Smith.`);
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
