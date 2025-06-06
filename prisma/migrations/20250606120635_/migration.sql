/*
  Warnings:

  - You are about to alter the column `tags` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AppSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'main_settings',
    "appName" TEXT NOT NULL DEFAULT 'StockPilot',
    "dateFormat" TEXT NOT NULL DEFAULT 'MM/dd/yyyy',
    "timeZone" TEXT NOT NULL DEFAULT 'America/New_York',
    "defaultCurrency" TEXT NOT NULL DEFAULT 'USD',
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "lowStockAlerts" BOOLEAN NOT NULL DEFAULT true,
    "newOrderAlerts" BOOLEAN NOT NULL DEFAULT false,
    "defaultTaxRate" DECIMAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_AppSettings" ("appName", "createdAt", "dateFormat", "defaultCurrency", "defaultTaxRate", "emailNotifications", "id", "lowStockAlerts", "newOrderAlerts", "timeZone", "updatedAt") SELECT "appName", "createdAt", "dateFormat", "defaultCurrency", "defaultTaxRate", "emailNotifications", "id", "lowStockAlerts", "newOrderAlerts", "timeZone", "updatedAt" FROM "AppSettings";
DROP TABLE "AppSettings";
ALTER TABLE "new_AppSettings" RENAME TO "AppSettings";
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL NOT NULL,
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
CREATE TABLE "new_PurchaseOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "poNumber" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "orderDate" DATETIME NOT NULL,
    "expectedDeliveryDate" DATETIME,
    "status" TEXT NOT NULL,
    "discountAmount" DECIMAL,
    "shippingCost" DECIMAL,
    "taxes" DECIMAL,
    "totalAmount" DECIMAL NOT NULL,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PurchaseOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PurchaseOrder" ("createdAt", "createdById", "discountAmount", "expectedDeliveryDate", "id", "notes", "orderDate", "poNumber", "shippingCost", "status", "supplierName", "taxes", "totalAmount", "updatedAt") SELECT "createdAt", "createdById", "discountAmount", "expectedDeliveryDate", "id", "notes", "orderDate", "poNumber", "shippingCost", "status", "supplierName", "taxes", "totalAmount", "updatedAt" FROM "PurchaseOrder";
DROP TABLE "PurchaseOrder";
ALTER TABLE "new_PurchaseOrder" RENAME TO "PurchaseOrder";
CREATE UNIQUE INDEX "PurchaseOrder_poNumber_key" ON "PurchaseOrder"("poNumber");
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
    "purchaseOrderId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StockMovement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StockMovement_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_StockMovement" ("createdAt", "id", "productId", "quantityAfter", "quantityBefore", "quantityChange", "reason", "referenceId", "type", "userId") SELECT "createdAt", "id", "productId", "quantityAfter", "quantityBefore", "quantityChange", "reason", "referenceId", "type", "userId" FROM "StockMovement";
DROP TABLE "StockMovement";
ALTER TABLE "new_StockMovement" RENAME TO "StockMovement";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("avatarUrl", "createdAt", "email", "id", "isActive", "lastLogin", "name", "role", "updatedAt") SELECT "avatarUrl", "createdAt", "email", "id", "isActive", "lastLogin", "name", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
