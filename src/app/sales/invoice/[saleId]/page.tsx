
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, Printer, Building, UserCircle, Hash, CalendarDays, CreditCard, FileText, ShoppingBag, Percent, Truck, DollarSign } from 'lucide-react';
import type { Sale } from '@/lib/types';
import { fetchSaleById } from '../../actions'; // Adjusted import path

// Placeholder company details
const companyDetails = {
  name: 'StockPilot Inc.',
  address: '123 Inventory Ave, Suite 456, Tech City, ST 78900',
  phone: '(555) 123-4567',
  email: 'contact@stockpilot.com',
  logoUrl: 'https://placehold.co/150x50.png?text=StockPilot' // data-ai-hint="company logo"
};

export default function InvoicePage() {
  const router = useRouter();
  const params = useParams();
  const saleId = params.saleId as string;

  const [sale, setSale] = useState<Sale | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (saleId) {
      setIsLoading(true);
      fetchSaleById(saleId)
        .then(data => {
          if (data) {
            setSale(data);
          } else {
            toast.error('Sale not found.');
            router.push('/sales/history'); // Redirect if sale not found
          }
        })
        .catch(error => {
          console.error('Failed to fetch sale details:', error);
          toast.error('Failed to load sale details.');
        })
        .finally(() => setIsLoading(false));
    }
  }, [saleId, router]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-4xl invoice-page-container">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row justify-between items-center">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-10 w-24" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
            <div className="flex justify-end">
              <Skeleton className="h-20 w-1/2" />
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Skeleton className="h-10 w-20" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!sale) {
    // This state should ideally be brief or handled by redirect in useEffect
    return <div className="container mx-auto p-4 md:p-8">Sale not found or failed to load.</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl invoice-page-container">
      <div className="mb-6 flex justify-between items-center print:hidden">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" /> Print Invoice
        </Button>
      </div>

      <Card className="shadow-lg" id="invoice-content">
        <div className="invoice-print-area p-6 md:p-8">
          <CardHeader className="px-0 pb-6 border-b mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start">
              <div>
                <img src={companyDetails.logoUrl} alt="Company Logo" className="h-12 mb-2" data-ai-hint="company logo"/>
                <h2 className="text-2xl font-bold font-headline text-primary">{companyDetails.name}</h2>
                <p className="text-xs text-muted-foreground">{companyDetails.address}</p>
                <p className="text-xs text-muted-foreground">Phone: {companyDetails.phone} | Email: {companyDetails.email}</p>
              </div>
              <div className="text-left sm:text-right mt-4 sm:mt-0">
                <h1 className="text-3xl font-bold font-headline text-gray-700">INVOICE</h1>
                <div className="text-sm text-muted-foreground">
                  <span className="font-semibold">Invoice #:</span> {sale.saleNumber}
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="font-semibold">Date:</span> {format(parseISO(sale.saleDate), 'PPP')}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-sm">
              <div>
                <h3 className="font-semibold mb-1 text-gray-600">Billed To:</h3>
                <p className="font-medium">{sale.customerName || sale.customer?.name || 'Guest Customer'}</p>
                {sale.customer?.email && <p className="text-muted-foreground">{sale.customer.email}</p>}
                {sale.customer?.phone && <p className="text-muted-foreground">{sale.customer.phone}</p>}
              </div>
              <div className="md:text-right">
                <h3 className="font-semibold mb-1 text-gray-600">Payment Details:</h3>
                <p><span className="text-muted-foreground">Method:</span> {sale.paymentMethod || 'N/A'}</p>
                <p><span className="text-muted-foreground">Status:</span> <Badge variant={sale.status === 'Completed' ? 'default' : 'outline'} className={`text-xs px-1.5 py-0.5 ${sale.status === 'Completed' ? 'bg-green-500/20 text-green-700' : 'bg-yellow-500/20 text-yellow-700'}`}>{sale.status}</Badge></p>
                {sale.user?.name && <p><span className="text-muted-foreground">Cashier:</span> {sale.user.name}</p>}
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[50%] font-semibold">Item Description</TableHead>
                  <TableHead className="text-center font-semibold">Qty</TableHead>
                  <TableHead className="text-right font-semibold">Unit Price</TableHead>
                  <TableHead className="text-right font-semibold">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sale.items.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <p className="font-medium">{item.productName}</p>
                      {item.product?.sku && <p className="text-xs text-muted-foreground">SKU: {item.product.sku}</p>}
                    </TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="text-right">${item.unitPrice.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${item.totalPrice.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="mt-8 flex justify-end">
              <div className="w-full max-w-xs space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">${sale.subtotal.toFixed(2)}</span>
                </div>
                {sale.discountAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount:</span>
                    <span className="font-medium text-green-600">-${sale.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax ({sale.taxPercent.toFixed(1)}%):</span>
                  <span className="font-medium">${sale.taxAmount.toFixed(2)}</span>
                </div>
                {sale.shippingCost > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping:</span>
                    <span className="font-medium">${sale.shippingCost.toFixed(2)}</span>
                  </div>
                </div>
                <div className="border-t my-1"></div>
                <div className="flex justify-between text-base font-bold">
                  <span>Grand Total:</span>
                  <span>${sale.grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {sale.notes && (
              <div className="mt-8 pt-4 border-t">
                <h4 className="font-semibold mb-1 text-sm text-gray-600">Notes:</h4>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{sale.notes}</p>
              </div>
            )}
             <div className="mt-12 text-center text-xs text-muted-foreground">
              <p>Thank you for your business!</p>
              <p>{companyDetails.name} | {companyDetails.phone}</p>
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}
