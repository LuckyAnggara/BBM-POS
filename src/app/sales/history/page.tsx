
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Search, Filter, Download, History, FileText, DollarSign, Users, ShoppingBag, FileSpreadsheet, CalendarIcon, X, MoreHorizontal, RotateCcw, PackageCheck, PackageX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format, parseISO, isValid } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import type { Sale, SaleStatus } from '@/lib/types';
import { fetchSalesHistory, type SalesHistoryFilters, refundSaleAction } from '../actions';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const paymentMethodOptions = ['All Methods', 'Cash', 'Credit Card', 'VISA', 'Mastercard']; // Add more as needed
const saleStatusOptions: Array<SaleStatus | 'All Statuses'> = ['All Statuses', 'Completed', 'PendingPayment', 'Refunded', 'Cancelled'];

const paymentMethodColors: Record<string, string> = {
  'Cash': 'bg-green-100 text-green-800 border-green-300',
  'Credit Card': 'bg-blue-100 text-blue-800 border-blue-300',
  'VISA': 'bg-sky-100 text-sky-800 border-sky-300',
  'Mastercard': 'bg-orange-100 text-orange-800 border-orange-300',
};

const saleStatusColors: Record<SaleStatus, string> = {
  'Completed': 'bg-green-500/20 text-green-700 border-green-500/30',
  'PendingPayment': 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30',
  'Refunded': 'bg-purple-500/20 text-purple-700 border-purple-500/30', // New color for Refunded
  'Cancelled': 'bg-gray-500/20 text-gray-700 border-gray-500/30',
};


export default function SalesHistoryPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingRefund, setIsProcessingRefund] = useState<string | null>(null); // Store saleId being refunded
  const [searchTerm, setSearchTerm] = useState('');
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const [filters, setFilters] = useState<SalesHistoryFilters>({
    startDate: undefined,
    endDate: undefined,
    status: 'All Statuses',
    paymentMethod: 'All Methods',
  });
  const [tempFilters, setTempFilters] = useState<SalesHistoryFilters>(filters);


  const loadSales = useCallback(async (currentFilters?: SalesHistoryFilters) => {
    setIsLoading(true);
    try {
      const fetchedSales = await fetchSalesHistory(currentFilters);
      setSales(fetchedSales);
    } catch (error) {
      toast.error("Failed to load sales history.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSales(filters);
  }, [loadSales, filters]); 
  
  useEffect(() => {
    setTempFilters(filters);
  }, [filters]);


  const handleApplyFilters = () => {
    setFilters(tempFilters);
    setIsSheetOpen(false);
  };

  const handleClearFilters = () => {
    const cleared = {
        startDate: undefined,
        endDate: undefined,
        status: 'All Statuses',
        paymentMethod: 'All Methods',
    };
    setTempFilters(cleared);
    setFilters(cleared); 
    setIsSheetOpen(false);
  };
  
  const activeFilterCount = () => {
    let count = 0;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    if (filters.status && filters.status !== 'All Statuses') count++;
    if (filters.paymentMethod && filters.paymentMethod !== 'All Methods') count++;
    return count;
  };

  const filteredSales = sales.filter(sale =>
    sale.saleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sale.customerName && sale.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (sale.user?.name && sale.user.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleRefundSale = async (saleId: string, saleNumber: string) => {
    setIsProcessingRefund(saleId);
    try {
      await refundSaleAction(saleId);
      toast.success(`Sale ${saleNumber} has been refunded and stock updated.`);
      loadSales(filters); // Reload sales to reflect the change
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error(`Failed to refund sale ${saleNumber}.`);
      }
      console.error("Refund error:", error);
    } finally {
      setIsProcessingRefund(null);
    }
  };


  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-semibold flex items-center gap-2">
            <History className="h-7 w-7 text-primary" /> Sales History
          </h1>
          <p className="text-muted-foreground">View and manage all past sales transactions.</p>
        </div>
        <Button variant="outline" disabled>
          <Download className="mr-2 h-4 w-4" /> Export History
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by Sale No, Customer, Cashier..."
                className="w-full rounded-lg bg-background pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="relative">
                  <Filter className="mr-2 h-4 w-4" /> Filter Sales
                  {activeFilterCount() > 0 && (
                    <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs rounded-full">
                      {activeFilterCount()}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filter Sales History</SheetTitle>
                  <SheetDescription>
                    Refine your sales view by date, status, or payment method.
                  </SheetDescription>
                </SheetHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="startDate"
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !tempFilters.startDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {tempFilters.startDate ? format(new Date(tempFilters.startDate), "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={tempFilters.startDate ? new Date(tempFilters.startDate) : undefined}
                            onSelect={(date) => setTempFilters(prev => ({...prev, startDate: date ? date.toISOString() : undefined}))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="endDate">End Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="endDate"
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !tempFilters.endDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {tempFilters.endDate ? format(new Date(tempFilters.endDate), "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={tempFilters.endDate ? new Date(tempFilters.endDate) : undefined}
                            onSelect={(date) => setTempFilters(prev => ({...prev, endDate: date ? date.toISOString() : undefined}))}
                            disabled={(date) => tempFilters.startDate ? date < new Date(tempFilters.startDate) : false}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="status">Status</Label>
                    <Select value={tempFilters.status} onValueChange={(value) => setTempFilters(prev => ({...prev, status: value}))}>
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {saleStatusOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Select value={tempFilters.paymentMethod} onValueChange={(value) => setTempFilters(prev => ({...prev, paymentMethod: value}))}>
                      <SelectTrigger id="paymentMethod">
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethodOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <SheetFooter>
                  <Button variant="outline" onClick={handleClearFilters}>Clear Filters</Button>
                  <SheetClose asChild>
                    <Button onClick={handleApplyFilters}>Apply Filters</Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sale No.</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Cashier</TableHead>
                  <TableHead className="text-center">Items</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-4 w-[30px] mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-[80px] rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-[90px] rounded-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-[70px] ml-auto" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-8 w-[30px] mx-auto" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : filteredSales.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-lg text-muted-foreground">No sales transactions match your criteria.</p>
              <p className="text-sm text-muted-foreground">Try adjusting your filters or search term.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Sale No.</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Cashier</TableHead>
                  <TableHead className="text-center">Items</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">
                        {sale.saleNumber}
                    </TableCell>
                    <TableCell className="text-xs">{format(parseISO(sale.saleDate), 'MMM dd, yyyy HH:mm')}</TableCell>
                    <TableCell className="text-xs">{sale.customerName || sale.customer?.name || 'Guest'}</TableCell>
                    <TableCell className="text-xs">{sale.user?.name || 'N/A'}</TableCell>
                    <TableCell className="text-center text-xs">{sale.items.reduce((sum, item) => sum + item.quantity, 0)}</TableCell>
                    <TableCell className="text-xs">
                      <Badge 
                        variant="outline" 
                        className={`px-2 py-0.5 text-xs border ${paymentMethodColors[sale.paymentMethod || 'Default'] || 'bg-gray-100 text-gray-800 border-gray-300'}`}
                      >
                        {sale.paymentMethod || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      <Badge 
                        variant={sale.status === 'Completed' ? 'default' : 'outline'} 
                        className={`text-xs px-2 py-0.5 ${saleStatusColors[sale.status as SaleStatus] || saleStatusColors['Cancelled']}`}
                      >
                        {sale.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-xs">${sale.grandTotal.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isProcessingRefund === sale.id}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/sales/invoice/${sale.id}`}>
                              <FileSpreadsheet className="mr-2 h-4 w-4" /> View Invoice
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => toast.warning(
                                `Are you sure you want to refund sale ${sale.saleNumber}? This action cannot be undone.`,
                                {
                                    action: { label: "Confirm Refund", onClick: () => handleRefundSale(sale.id, sale.saleNumber) },
                                    cancel: { label: "Cancel" }
                                }
                            )}
                            disabled={sale.status === 'Refunded' || sale.status === 'Cancelled' || isProcessingRefund === sale.id}
                            className="text-amber-600 focus:text-amber-700 focus:bg-amber-500/10"
                          >
                            <RotateCcw className="mr-2 h-4 w-4" /> 
                            {isProcessingRefund === sale.id ? 'Refunding...' : 'Refund Sale'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
