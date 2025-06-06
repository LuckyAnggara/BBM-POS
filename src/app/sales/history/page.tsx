
'use client';

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Search, Filter, Download, History, FileText, DollarSign, Users, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { format, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import type { Sale } from '@/lib/types';
import { fetchSalesHistory } from '../actions';
import Link from 'next/link';

const paymentMethodColors: Record<string, string> = {
  'Cash': 'bg-green-100 text-green-800 border-green-300',
  'Credit Card': 'bg-blue-100 text-blue-800 border-blue-300',
  'VISA': 'bg-sky-100 text-sky-800 border-sky-300', // Generic for VISA
  'Mastercard': 'bg-orange-100 text-orange-800 border-orange-300', // Generic for Mastercard
  // Add more as needed
};

const saleStatusColors: Record<string, string> = {
  'Completed': 'bg-green-500/20 text-green-700 border-green-500/30',
  'PendingPayment': 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30',
  'Refunded': 'bg-red-500/20 text-red-700 border-red-500/30',
  'Cancelled': 'bg-gray-500/20 text-gray-700 border-gray-500/30',
};


export default function SalesHistoryPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadSales() {
      setIsLoading(true);
      try {
        const fetchedSales = await fetchSalesHistory();
        setSales(fetchedSales);
      } catch (error) {
        toast.error("Failed to load sales history.");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    loadSales();
  }, []);

  const filteredSales = sales.filter(sale =>
    sale.saleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sale.customerName && sale.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (sale.user?.name && sale.user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (sale.paymentMethod && sale.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase())) ||
    sale.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                placeholder="Search by Sale No, Customer, Cashier, Payment, Status..."
                className="w-full rounded-lg bg-background pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" disabled>
              <Filter className="mr-2 h-4 w-4" /> Filter by Date/Status
            </Button>
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
              <p className="text-lg text-muted-foreground">No sales transactions found.</p>
              <p className="text-sm text-muted-foreground">Once sales are made, they will appear here.</p>
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
                      {/* <Link href={`/sales/${sale.id}`} className="hover:underline"> */}
                        {sale.saleNumber}
                      {/* </Link> */}
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
                        className={`text-xs px-2 py-0.5 ${saleStatusColors[sale.status] || saleStatusColors['Cancelled']}`}
                      >
                        {sale.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-xs">${sale.grandTotal.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toast.info("View Sale Details: Not yet implemented.")}>
                            <FileText className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                           {/* Add more actions like Print Receipt, Refund (later) */}
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
