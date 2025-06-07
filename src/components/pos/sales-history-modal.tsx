
'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Sale, SaleStatus } from '@/lib/types';
import { fetchSalesHistory } from '@/app/sales/actions';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { Loader2, FileSpreadsheet, Eye } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

interface SalesHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const saleStatusColors: Record<SaleStatus, string> = {
  'Completed': 'bg-green-500/20 text-green-700 border-green-500/30',
  'PendingPayment': 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30',
  'Refunded': 'bg-purple-500/20 text-purple-700 border-purple-500/30',
  'Cancelled': 'bg-gray-500/20 text-gray-700 border-gray-500/30',
};

export function SalesHistoryModal({ isOpen, onClose }: SalesHistoryModalProps) {
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadRecentSales = useCallback(async () => {
    if (!isOpen) return;
    setIsLoading(true);
    try {
      // Fetch last 10 completed sales for the modal
      const fetchedSales = await fetchSalesHistory({ status: 'Completed' });
      setRecentSales(fetchedSales.slice(0, 10));
    } catch (error) {
      toast.error("Failed to load recent sales.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    loadRecentSales();
  }, [loadRecentSales]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Recent Sales Transactions</DialogTitle>
          <DialogDescription>
            Showing the last 10 completed sales. Click "View Invoice" for more details.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full pr-2">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : recentSales.length === 0 ? (
              <div className="text-center py-10">
                <FileSpreadsheet className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No recent completed sales found.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Sale No.</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium text-xs">{sale.saleNumber}</TableCell>
                      <TableCell className="text-xs">{format(parseISO(sale.saleDate), 'MMM dd, yyyy HH:mm')}</TableCell>
                      <TableCell className="text-xs">{sale.customerName || sale.customer?.name || 'Guest'}</TableCell>
                      <TableCell className="text-right text-xs">${sale.grandTotal.toFixed(2)}</TableCell>
                      <TableCell className="text-center text-xs">
                         <Badge 
                            variant={'outline'} 
                            className={`text-xs px-2 py-0.5 ${saleStatusColors[sale.status as SaleStatus] || saleStatusColors['Cancelled']}`}
                          >
                            {sale.status}
                          </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="outline" size="sm" asChild className="h-7 text-xs px-2">
                          <Link href={`/sales/invoice/${sale.id}`} target="_blank">
                            <Eye className="mr-1.5 h-3.5 w-3.5" /> Invoice
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </div>
        <DialogFooter className="sm:justify-end mt-4">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    