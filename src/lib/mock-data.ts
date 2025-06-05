
import type { PurchaseOrder } from '@/lib/types';

export const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: 'po1',
    poNumber: 'PO2024-001',
    supplierId: 'sup1',
    supplierName: 'Fresh Farms Inc.',
    orderDate: new Date('2024-07-15').toISOString(),
    expectedDeliveryDate: new Date('2024-07-20').toISOString(),
    status: 'Received',
    items: [
      { productId: '1', productName: 'Organic Apples', quantityOrdered: 50, unitCost: 1.50, totalCost: 75.00, quantityReceived: 50 },
    ],
    totalAmount: 75.00,
    createdBy: 'user1',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    id: 'po2',
    poNumber: 'PO2024-002',
    supplierId: 'sup2',
    supplierName: 'Artisan Bakers Co.',
    orderDate: new Date('2024-07-18').toISOString(),
    expectedDeliveryDate: new Date('2024-07-25').toISOString(),
    status: 'Ordered',
    items: [
      { productId: '2', productName: 'Whole Wheat Bread', quantityOrdered: 30, unitCost: 2.20, totalCost: 66.00 },
    ],
    totalAmount: 66.00,
    createdBy: 'user1',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: 'po3',
    poNumber: 'PO2024-003',
    supplierId: 'sup1',
    supplierName: 'Fresh Farms Inc.',
    orderDate: new Date('2024-07-20').toISOString(),
    expectedDeliveryDate: new Date('2024-07-28').toISOString(),
    status: 'Pending Approval',
    items: [
      { productId: '1', productName: 'Organic Apples', quantityOrdered: 20, unitCost: 1.50, totalCost: 30.00 },
      { productId: '3', productName: 'Free-Range Eggs (Dozen)', quantityOrdered: 10, unitCost: 3.00, totalCost: 30.00 },
    ],
    totalAmount: 60.00,
    createdBy: 'user1',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
  },
];

export const purchaseOrderStatusColors: Record<PurchaseOrder['status'], string> = {
  'Draft': 'bg-gray-200 text-gray-700',
  'Pending Approval': 'bg-yellow-200 text-yellow-800',
  'Approved': 'bg-blue-200 text-blue-800',
  'Ordered': 'bg-indigo-200 text-indigo-800',
  'Shipped': 'bg-purple-200 text-purple-800',
  'Partially Received': 'bg-orange-200 text-orange-800',
  'Received': 'bg-green-200 text-green-800',
  'Cancelled': 'bg-red-200 text-red-800',
  'Closed': 'bg-gray-400 text-gray-900',
};
