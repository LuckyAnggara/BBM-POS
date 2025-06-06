
import { PrismaClient, StockMovementType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // Clear existing data in reverse order of dependency
  await prisma.stockMovement.deleteMany(); // Clear stock movements first
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
    // Seed initial stock movement
    await prisma.stockMovement.create({
      data: {
        productId: product.id,
        type: StockMovementType.INITIAL_STOCK,
        quantityChange: product.quantity,
        quantityBefore: 0,
        quantityAfter: product.quantity,
        reason: 'Initial stock seeding',
      }
    });
  }
  console.log(`Created ${createdProducts.length} products and their initial stock movements.`);

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
  const poProductApple = createdProducts.find(p => p.id === 'prod_apple');
  if (adminUser && poProductApple && poProductApple.costPrice) {
    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber: 'PO2024-0701-DB', supplierName: 'Fresh Farms Inc.', orderDate: new Date('2024-07-01T10:00:00Z'), expectedDeliveryDate: new Date('2024-07-05T10:00:00Z'), status: "Received", discountAmount: 0, shippingCost: 10.00, taxes: 5.00, totalAmount: (poProductApple.costPrice * 20) + 10 + 5, notes: 'Urgent restock.', createdById: adminUser.id,
        items: { create: [{ productId: poProductApple.id, productName: poProductApple.name, quantityOrdered: 20, unitCost: poProductApple.costPrice, totalCost: poProductApple.costPrice * 20, quantityReceived: 20 }] },
      },
    });
    console.log(`Created a purchase order.`);

    // If PO status is Received, log stock movement
    if (po.status === "Received") {
      for (const item of po.items) {
        const product = await prisma.product.findUnique({ where: { id: item.productId }});
        if (product) {
          const quantityBefore = product.quantity - item.quantityOrdered; // Assuming stock was not yet updated from this PO
          await prisma.stockMovement.create({
            data: {
              productId: item.productId,
              type: StockMovementType.PURCHASE_RECEIPT,
              quantityChange: item.quantityOrdered,
              quantityBefore: quantityBefore,
              quantityAfter: product.quantity, // Current (already updated) product quantity
              reason: `PO #${po.poNumber} received`,
              referenceId: po.id,
              userId: adminUser.id,
            }
          });
          // Note: This assumes product.quantity was updated *before* this seed script runs for PO items.
          // If not, the product.quantity needs to be updated first, then log movement.
          // For simplicity in seed, we log based on current product quantity being the 'after' state.
        }
      }
      console.log(`Logged stock movements for received PO.`);
    }
  }


  // Seed Sales
  const staffUserCharlie = createdUsers.find(u => u.id === 'user_staff_charlie');
  const customerJohn = createdCustomers.find(c => c.id === 'cust_john_doe');
  const customerJane = createdCustomers.find(c => c.id === 'cust_jane_smith');
  const prodApple = createdProducts.find(p => p.id === 'prod_apple');
  const prodBread = createdProducts.find(p => p.id === 'prod_bread');
  const prodEggs = createdProducts.find(p => p.id === 'prod_eggs');
  const prodCoffee = createdProducts.find(p => p.id === 'prod_coffee');


  if (staffUserCharlie && customerJohn && prodApple && prodBread) {
    const sale1Subtotal = (prodApple.price * 2) + (prodBread.price * 1);
    const sale1 = await prisma.sale.create({
      data: {
        saleNumber: 'SALE-20240720-001', saleDate: new Date(Date.now() - 1000 * 60 * 60 * 48), 
        customerId: customerJohn.id, customerName: customerJohn.name, userId: staffUserCharlie.id,
        subtotal: sale1Subtotal, discountAmount: 0, taxPercent: 10, taxAmount: sale1Subtotal * 0.10, shippingCost: 0, grandTotal: sale1Subtotal * 1.10,
        paymentMethod: 'Cash', status: 'Completed', notes: 'Customer paid in cash.',
        items: {
          create: [
            { productId: prodApple.id, productName: prodApple.name, quantity: 2, unitPrice: prodApple.price, totalPrice: prodApple.price * 2, costPriceAtSale: prodApple.costPrice },
            { productId: prodBread.id, productName: prodBread.name, quantity: 1, unitPrice: prodBread.price, totalPrice: prodBread.price * 1, costPriceAtSale: prodBread.costPrice },
          ]
        }
      }
    });
    console.log(`Created sale 1 for John Doe.`);
    // Log stock movements for sale 1
    for (const item of sale1.items) {
        const product = await prisma.product.findUnique({ where: { id: item.productId }});
        if (product) {
             // Assuming product quantity is already reduced by the sale action in a real app
            // For seed, we simulate it. The `quantityAfter` would be product.quantity (after reduction).
            // `quantityBefore` is product.quantity + item.quantity (before reduction).
            // This logic might differ slightly from runtime if decreaseProductStockAction updates and then logs.
             await prisma.stockMovement.create({
                data: {
                    productId: item.productId,
                    type: StockMovementType.SALE,
                    quantityChange: -item.quantity,
                    quantityBefore: product.quantity + item.quantity, // Approximate before state for seed
                    quantityAfter: product.quantity, // Current state after sale
                    reason: `Sale #${sale1.saleNumber}`,
                    referenceId: sale1.id,
                    userId: staffUserCharlie.id
                }
            });
        }
    }
  }

  if (staffUserCharlie && customerJane && prodEggs && prodCoffee) {
     const sale2Subtotal = (prodEggs.price * 1) + (prodCoffee.price * 1);
    const sale2 = await prisma.sale.create({
      data: {
        saleNumber: 'SALE-20240721-002', saleDate: new Date(Date.now() - 1000 * 60 * 60 * 24), 
        customerId: customerJane.id, customerName: customerJane.name, userId: staffUserCharlie.id,
        subtotal: sale2Subtotal, discountAmount: 1.00, taxPercent: 10, taxAmount: (sale2Subtotal - 1.00) * 0.10, shippingCost: 2.50, grandTotal: (sale2Subtotal - 1.00) * 1.10 + 2.50,
        paymentMethod: 'Credit Card', status: 'Completed', notes: 'Used promo code SUMMER10 (not implemented, just note)',
        items: {
          create: [
            { productId: prodEggs.id, productName: prodEggs.name, quantity: 1, unitPrice: prodEggs.price, totalPrice: prodEggs.price * 1, costPriceAtSale: prodEggs.costPrice },
            { productId: prodCoffee.id, productName: prodCoffee.name, quantity: 1, unitPrice: prodCoffee.price, totalPrice: prodCoffee.price * 1, costPriceAtSale: prodCoffee.costPrice },
          ]
        }
      }
    });
    console.log(`Created sale 2 for Jane Smith.`);
    // Log stock movements for sale 2
     for (const item of sale2.items) {
        const product = await prisma.product.findUnique({ where: { id: item.productId }});
        if (product) {
             await prisma.stockMovement.create({
                data: {
                    productId: item.productId,
                    type: StockMovementType.SALE,
                    quantityChange: -item.quantity,
                    quantityBefore: product.quantity + item.quantity,
                    quantityAfter: product.quantity,
                    reason: `Sale #${sale2.saleNumber}`,
                    referenceId: sale2.id,
                    userId: staffUserCharlie.id
                }
            });
        }
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
