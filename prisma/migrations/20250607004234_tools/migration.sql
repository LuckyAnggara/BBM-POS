/*
  Warnings:

  - You are about to drop the column `purchaseOrderId` on the `StockMovement` table. All the data in the column will be lost.
  - Made the column `createdById` on table `PurchaseOrder` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `Sale` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateTable
CREATE TABLE "PosSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME,
    "status" TEXT NOT NULL,
    "startingCash" DECIMAL NOT NULL,
    "countedCash" DECIMAL,
    "expectedCashInDrawer" DECIMAL NOT NULL,
    "totalSalesAmount" DECIMAL NOT NULL DEFAULT 0,
    "totalRefundsAmount" DECIMAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PosSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CashTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "posSessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "saleId" TEXT,
    "type" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CashTransaction_posSessionId_fkey" FOREIGN KEY ("posSessionId") REFERENCES "PosSession" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CashTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExpenseCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "expenseCategoryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Expense_expenseCategoryId_fkey" FOREIGN KEY ("expenseCategoryId") REFERENCES "ExpenseCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Expense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "price" DECIMAL NOT NULL DEFAULT 0,
    "costPrice" DECIMAL,
    "supplier" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "tags" JSONB,
    "lowStockThreshold" INTEGER DEFAULT 10,
    "categoryId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("categoryId", "costPrice", "createdAt", "description", "id", "imageUrl", "lowStockThreshold", "name", "price", "quantity", "sku", "supplier", "tags", "updatedAt") SELECT "categoryId", "costPrice", "createdAt", "description", "id", "imageUrl", "lowStockThreshold", "name", "price", "quantity", "sku", "supplier", "tags", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
CREATE INDEX "Product_name_idx" ON "Product"("name");
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");
CREATE TABLE "new_PurchaseOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "poNumber" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "orderDate" DATETIME NOT NULL,
    "expectedDeliveryDate" DATETIME,
    "status" TEXT NOT NULL,
    "discountAmount" DECIMAL DEFAULT 0,
    "shippingCost" DECIMAL DEFAULT 0,
    "taxes" DECIMAL DEFAULT 0,
    "totalAmount" DECIMAL NOT NULL,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PurchaseOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PurchaseOrder" ("createdAt", "createdById", "discountAmount", "expectedDeliveryDate", "id", "notes", "orderDate", "poNumber", "shippingCost", "status", "supplierName", "taxes", "totalAmount", "updatedAt") SELECT "createdAt", "createdById", "discountAmount", "expectedDeliveryDate", "id", "notes", "orderDate", "poNumber", "shippingCost", "status", "supplierName", "taxes", "totalAmount", "updatedAt" FROM "PurchaseOrder";
DROP TABLE "PurchaseOrder";
ALTER TABLE "new_PurchaseOrder" RENAME TO "PurchaseOrder";
CREATE UNIQUE INDEX "PurchaseOrder_poNumber_key" ON "PurchaseOrder"("poNumber");
CREATE INDEX "PurchaseOrder_status_idx" ON "PurchaseOrder"("status");
CREATE INDEX "PurchaseOrder_orderDate_idx" ON "PurchaseOrder"("orderDate");
CREATE TABLE "new_Sale" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saleNumber" TEXT NOT NULL,
    "saleDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerId" TEXT,
    "customerName" TEXT,
    "userId" TEXT NOT NULL,
    "subtotal" DECIMAL NOT NULL,
    "discountAmount" DECIMAL NOT NULL DEFAULT 0,
    "taxPercent" DECIMAL NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL NOT NULL DEFAULT 0,
    "shippingCost" DECIMAL NOT NULL DEFAULT 0,
    "grandTotal" DECIMAL NOT NULL,
    "paymentMethod" TEXT,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "cashTransactionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Sale_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sale_cashTransactionId_fkey" FOREIGN KEY ("cashTransactionId") REFERENCES "CashTransaction" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Sale" ("createdAt", "customerId", "customerName", "discountAmount", "grandTotal", "id", "notes", "paymentMethod", "saleDate", "saleNumber", "shippingCost", "status", "subtotal", "taxAmount", "taxPercent", "updatedAt", "userId") SELECT "createdAt", "customerId", "customerName", "discountAmount", "grandTotal", "id", "notes", "paymentMethod", "saleDate", "saleNumber", "shippingCost", "status", "subtotal", "taxAmount", "taxPercent", "updatedAt", "userId" FROM "Sale";
DROP TABLE "Sale";
ALTER TABLE "new_Sale" RENAME TO "Sale";
CREATE UNIQUE INDEX "Sale_saleNumber_key" ON "Sale"("saleNumber");
CREATE UNIQUE INDEX "Sale_cashTransactionId_key" ON "Sale"("cashTransactionId");
CREATE INDEX "Sale_status_idx" ON "Sale"("status");
CREATE INDEX "Sale_saleDate_idx" ON "Sale"("saleDate");
CREATE INDEX "Sale_userId_idx" ON "Sale"("userId");
CREATE INDEX "Sale_customerId_idx" ON "Sale"("customerId");
CREATE TABLE "new_StockMovement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantityChange" INTEGER NOT NULL,
    "quantityBefore" INTEGER NOT NULL,
    "quantityAfter" INTEGER NOT NULL,
    "reason" TEXT,
    "referenceId" TEXT,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StockMovement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_StockMovement" ("createdAt", "id", "productId", "quantityAfter", "quantityBefore", "quantityChange", "reason", "referenceId", "type", "userId") SELECT "createdAt", "id", "productId", "quantityAfter", "quantityBefore", "quantityChange", "reason", "referenceId", "type", "userId" FROM "StockMovement";
DROP TABLE "StockMovement";
ALTER TABLE "new_StockMovement" RENAME TO "StockMovement";
CREATE INDEX "StockMovement_productId_idx" ON "StockMovement"("productId");
CREATE INDEX "StockMovement_type_idx" ON "StockMovement"("type");
CREATE INDEX "StockMovement_referenceId_idx" ON "StockMovement"("referenceId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "PosSession_userId_status_idx" ON "PosSession"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CashTransaction_saleId_key" ON "CashTransaction"("saleId");

-- CreateIndex
CREATE INDEX "CashTransaction_posSessionId_idx" ON "CashTransaction"("posSessionId");

-- CreateIndex
CREATE INDEX "CashTransaction_type_idx" ON "CashTransaction"("type");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseCategory_name_key" ON "ExpenseCategory"("name");

-- CreateIndex
CREATE INDEX "Expense_date_idx" ON "Expense"("date");

-- CreateIndex
CREATE INDEX "Expense_expenseCategoryId_idx" ON "Expense"("expenseCategoryId");

-- CreateIndex
CREATE INDEX "Expense_userId_idx" ON "Expense"("userId");

-- CreateIndex
CREATE INDEX "Customer_name_idx" ON "Customer"("name");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_purchaseOrderId_idx" ON "PurchaseOrderItem"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_productId_idx" ON "PurchaseOrderItem"("productId");

-- CreateIndex
CREATE INDEX "SaleItem_saleId_idx" ON "SaleItem"("saleId");

-- CreateIndex
CREATE INDEX "SaleItem_productId_idx" ON "SaleItem"("productId");
