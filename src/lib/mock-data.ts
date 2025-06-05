
import type { PurchaseOrder, PurchaseOrderStatus } from '@/lib/types'; // Updated import

// mockPurchaseOrders is no longer the source of truth for PO data, DB is.
// This array can be removed or kept for reference/testing if needed, but app won't use it directly.
export const mockPurchaseOrders_DEPRECATED: PurchaseOrder[] = [
  {
    id: 'po1_mock',
    poNumber: 'PO2024-001',
    // supplierId: 'sup1', // No longer in type, supplierName is string
    supplierName: 'Fresh Farms Inc.',
    orderDate: new Date('2024-07-15').toISOString(),
    expectedDeliveryDate: new Date('2024-07-20').toISOString(),
    status: 'Received',
    items: [
      { id: 'item1', productId: 'prod_apple', productName: 'Organic Apples', quantityOrdered: 50, unitCost: 1.50, totalCost: 75.00, quantityReceived: 50, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ],
    discountAmount: 0,
    shippingCost: 10.00,
    taxes: 5.00,
    totalAmount: 90.00,
    notes: 'Ensure apples are fresh upon delivery.',
    createdById: 'user_admin_alice', // Changed from 'user1'
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  // ... other mock POs if needed for reference
];

export const purchaseOrderStatusOptions: PurchaseOrderStatus[] = [
  'Draft', 'PendingApproval', 'Approved', 'Ordered', 'Shipped', 'PartiallyReceived', 'Received', 'Cancelled', 'Closed'
];

export const purchaseOrderStatusColors: Record<PurchaseOrderStatus, string> = {
  'Draft': 'bg-gray-200 text-gray-700',
  'PendingApproval': 'bg-yellow-200 text-yellow-800',
  'Approved': 'bg-blue-200 text-blue-800',
  'Ordered': 'bg-indigo-200 text-indigo-800',
  'Shipped': 'bg-purple-200 text-purple-800',
  'PartiallyReceived': 'bg-orange-200 text-orange-800',
  'Received': 'bg-green-200 text-green-800',
  'Cancelled': 'bg-red-200 text-red-800',
  'Closed': 'bg-gray-400 text-gray-900',
};
