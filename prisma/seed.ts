import { PrismaClient, Category, Product, User, Sale, PurchaseOrder } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function seedUsers() {
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: { name: 'Admin', email: 'admin@example.com', role: 'ADMIN' },
  });

  const staff = await prisma.user.upsert({
    where: { email: 'staff@example.com' },
    update: {},
    create: { name: 'Staff', email: 'staff@example.com', role: 'STAFF' },
  });

  return { admin, staff };
}

async function seedCategories() {
  const electronics = await prisma.category.create({ data: { name: 'Electronics' } });
  const groceries = await prisma.category.create({ data: { name: 'Groceries' } });
  return { electronics, groceries };
}

async function seedProducts(categories: Record<string, Category>) {
  const product1 = await prisma.product.create({
    data: {
      name: 'Wireless Mouse',
      sku: 'MOUSE001',
      quantity: 50,
      price: new Decimal(15.99),
      costPrice: new Decimal(10.0),
      supplier: 'TechSupplier Inc.',
      tags: JSON.stringify(['electronics']),
      categoryId: categories.electronics.id,
    },
  });

  const product2 = await prisma.product.create({
    data: {
      name: 'Organic Apples',
      sku: 'APPLE001',
      quantity: 100,
      price: new Decimal(2.5),
      costPrice: new Decimal(1.5),
      supplier: 'FarmFresh Co.',
      tags: JSON.stringify(['fruit']),
      categoryId: categories.groceries.id,
    },
  });

  return { product1, product2 };
}

async function seedPurchaseOrders(users: Record<string, User>, products: Record<string, Product>) {
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

  return { po };
}

async function seedSales(users: Record<string, User>, products: Record<string, Product>) {
  const customer = await prisma.customer.create({
    data: { name: 'John Doe', email: 'johndoe@example.com' },
  });

  const sale = await prisma.sale.create({
    data: {
      saleNumber: 'S1001',
      saleDate: new Date(),
      customerId: customer.id,
      customerName: customer.name,
      userId: users.staff.id,
      subtotal: new Decimal(31.98),
      taxPercent: new Decimal(10),
      taxAmount: new Decimal(3.2),
      grandTotal: new Decimal(35.18),
      status: 'Completed',
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

  return { sale };
}

async function seedStockMovements(
  users: Record<string, User>,
  products: Record<string, Product>,
  purchaseOrders: Record<string, PurchaseOrder>,
  sales: Record<string, Sale>
) {
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
}

async function main() {
  console.log('🌱 Start seeding...');

  await prisma.appSettings.upsert({
    where: { id: 'main_settings' },
    update: {},
    create: {},
  });

  const users = await seedUsers();
  const categories = await seedCategories();
  const products = await seedProducts(categories);
  const purchaseOrders = await seedPurchaseOrders(users, products);
  const sales = await seedSales(users, products);
  await seedStockMovements(users, products, purchaseOrders, sales);

  console.log('✅ Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
