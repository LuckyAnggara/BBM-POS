
import { PrismaClient, Category, Product, User, Sale, PurchaseOrder } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10; // Standard salt rounds for bcrypt

async function seedUsers() {
  console.log('Seeding users...');
  const adminPassword = await bcrypt.hash('adminpassword', SALT_ROUNDS);
  const staffPassword = await bcrypt.hash('staffpassword', SALT_ROUNDS);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      name: 'Admin User Alice',
      role: 'ADMIN',
      password: adminPassword, // Ensure password field exists in your User model
    },
    create: {
      id: 'user_admin_alice',
      name: 'Admin User Alice',
      email: 'admin@example.com',
      role: 'ADMIN',
      isActive: true,
      image: 'https://placehold.co/80x80/7F56D9/FFFFFF.png?text=AA',
      password: adminPassword, // Ensure password field exists
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: 'staff@example.com' },
    update: {
      name: 'Staff User Charlie',
      role: 'STAFF',
      password: staffPassword, // Ensure password field exists
    },
    create: {
      id: 'user_staff_charlie',
      name: 'Staff User Charlie',
      email: 'staff@example.com',
      role: 'STAFF',
      isActive: true,
      image: 'https://placehold.co/80x80/64748B/FFFFFF.png?text=SC',
      password: staffPassword, // Ensure password field exists
    },
  });
  console.log('Users seeded (passwords are hashed).');
  return { admin, staff };
}

async function seedCategories() {
  console.log('Seeding categories...');
  const electronics = await prisma.category.upsert({
    where: { name: 'Electronics' },
    update: {},
    create: { name: 'Electronics' },
  });
  const groceries = await prisma.category.upsert({
    where: { name: 'Groceries' },
    update: {},
    create: { name: 'Groceries' },
  });
  console.log('Categories seeded.');
  return { electronics, groceries };
}

async function seedProducts(categories: Record<string, Category>) {
  console.log('Seeding products...');
  const product1 = await prisma.product.upsert({
    where: { sku: 'MOUSE001' },
    update: {
        name: 'Wireless Mouse',
        quantity: 50,
        price: new Decimal(15.99),
        costPrice: new Decimal(10.0),
        supplier: 'TechSupplier Inc.',
        tags: JSON.stringify(['electronics', 'computer']),
        categoryId: categories.electronics.id,
    },
    create: {
      name: 'Wireless Mouse',
      sku: 'MOUSE001',
      quantity: 50,
      price: new Decimal(15.99),
      costPrice: new Decimal(10.0),
      supplier: 'TechSupplier Inc.',
      tags: JSON.stringify(['electronics', 'computer']),
      categoryId: categories.electronics.id,
      lowStockThreshold: 5,
    },
  });

  const product2 = await prisma.product.upsert({
     where: { sku: 'APPLE001' },
     update: {
        name: 'Organic Apples',
        quantity: 100,
        price: new Decimal(2.5),
        costPrice: new Decimal(1.5),
        supplier: 'FarmFresh Co.',
        tags: JSON.stringify(['fruit', 'organic']),
        categoryId: categories.groceries.id,
     },
    create: {
      name: 'Organic Apples',
      sku: 'APPLE001',
      quantity: 100,
      price: new Decimal(2.5),
      costPrice: new Decimal(1.5),
      supplier: 'FarmFresh Co.',
      tags: JSON.stringify(['fruit', 'organic']),
      categoryId: categories.groceries.id,
      lowStockThreshold: 10,
    },
  });
  console.log('Products seeded.');
  return { product1, product2 };
}

async function seedPurchaseOrders(users: Record<string, User>, products: Record<string, Product>) {
  console.log('Seeding purchase orders...');
  const existingPo = await prisma.purchaseOrder.findUnique({ where: { poNumber: 'PO1001' }});
  if (existingPo) {
    console.log('PO1001 already exists, skipping PO seed or use it.');
    return { po: existingPo };
  }

  const po = await prisma.purchaseOrder.create({
    data: {
      poNumber: 'PO1001',
      supplierName: 'TechSupplier Inc.',
      orderDate: new Date(),
      status: 'Ordered',
      totalAmount: new Decimal(300),
      createdById: users.admin.id,
      items: {
        create: [{
          productId: products.product1.id,
          productName: products.product1.name,
          quantityOrdered: 30,
          unitCost: new Decimal(10.0),
          totalCost: new Decimal(300),
        }],
      },
    },
  });
  console.log('Purchase orders seeded.');
  return { po };
}

async function seedSales(users: Record<string, User>, products: Record<string, Product>) {
  console.log('Seeding sales...');
  const customer = await prisma.customer.upsert({
    where: { email: 'johndoe@example.com' },
    update: {},
    create: { name: 'John Doe', email: 'johndoe@example.com' },
  });

  const existingSale = await prisma.sale.findUnique({ where: { saleNumber: 'S1001' }});
  if (existingSale) {
    console.log('S1001 already exists, skipping Sale seed or use it.');
    return { sale: existingSale };
  }

  const sale = await prisma.sale.create({
    data: {
      saleNumber: 'S1001',
      saleDate: new Date(),
      customerId: customer.id,
      customerName: customer.name,
      userId: users.staff.id,
      subtotal: new Decimal(31.98),
      discountAmount: new Decimal(0),
      taxPercent: new Decimal(10),
      taxAmount: new Decimal(3.2),
      shippingCost: new Decimal(0),
      grandTotal: new Decimal(35.18),
      status: 'Completed',
      paymentMethod: 'Cash',
      items: {
        create: [{
          productId: products.product1.id,
          productName: products.product1.name,
          quantity: 2,
          unitPrice: new Decimal(15.99),
          totalPrice: new Decimal(31.98),
          costPriceAtSale: new Decimal(10.0),
        }],
      },
    },
  });
  console.log('Sales seeded.');
  return { sale };
}

async function seedStockMovements(
  users: Record<string, User>,
  products: Record<string, Product>,
  purchaseOrders: Record<string, PurchaseOrder>,
  sales: Record<string, Sale>
) {
  console.log('Seeding stock movements...');
  await prisma.stockMovement.deleteMany({
    where: {
      OR: [
        { referenceId: purchaseOrders.po.id, type: 'PURCHASE_RECEIPT' },
        { referenceId: sales.sale.id, type: 'SALE' },
      ]
    }
  });

  await prisma.stockMovement.createMany({
    data: [
      {
        productId: products.product1.id,
        type: 'PURCHASE_RECEIPT',
        quantityChange: 30,
        quantityBefore: 50, 
        quantityAfter: 80,
        reason: `PO #${purchaseOrders.po.poNumber} Received`,
        referenceId: purchaseOrders.po.id,
        userId: users.admin.id,
      },
      {
        productId: products.product1.id,
        type: 'SALE',
        quantityChange: -2,
        quantityBefore: 80, 
        quantityAfter: 78,
        reason: `Sale #${sales.sale.saleNumber}`,
        referenceId: sales.sale.id,
        userId: users.staff.id,
      },
    ],
  });
  console.log('Stock movements seeded.');
}

async function main() {
  console.log('🌱 Start seeding...');

  await prisma.appSettings.upsert({
    where: { id: 'main_settings' },
    update: {},
    create: {
      id: 'main_settings',
      appName: 'StockPilot',
      dateFormat: 'MM/dd/yyyy',
      timeZone: 'America/New_York',
      defaultCurrency: 'USD',
      emailNotifications: true,
      lowStockAlerts: true,
      newOrderAlerts: false,
      defaultTaxRate: 7.5,
    },
  });
  console.log('App settings seeded.');

  const users = await seedUsers();
  const categories = await seedCategories();
  const productsData = await seedProducts(categories);
  
  await prisma.product.update({
    where: { id: productsData.product1.id },
    data: { quantity: 50 } 
  });
  console.log(`Product ${productsData.product1.name} quantity reset to 50.`);
  
  const purchaseOrders = await seedPurchaseOrders(users, productsData);
  const sales = await seedSales(users, productsData);
  await seedStockMovements(users, productsData, purchaseOrders, sales);

  console.log('✅ Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
