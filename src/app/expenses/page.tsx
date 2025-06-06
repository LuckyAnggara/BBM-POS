
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Search, Filter, Edit, Trash2, ReceiptText, CalendarIcon, ListFilter, MoreHorizontal } from "lucide-react";
import { Input } from '@/components/ui/input';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { toast } from "sonner";
import { format, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import type { Expense, ExpenseCategory } from '@/lib/types';
import { fetchExpenses, fetchAllExpenseCategoriesAction, deleteExpense, type FetchExpensesFilters } from './actions';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [filters, setFilters] = useState<FetchExpensesFilters>({
    startDate: undefined,
    endDate: undefined,
    categoryId: 'all',
  });

  const loadExpenses = useCallback(async (currentFilters?: FetchExpensesFilters) => {
    setIsLoading(true);
    try {
      const fetchedExpenses = await fetchExpenses(currentFilters);
      setExpenses(fetchedExpenses);
    } catch (error) {
      toast.error("Failed to load expenses.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    setIsLoadingCategories(true);
    try {
      const fetchedCategories = await fetchAllExpenseCategoriesAction();
      setCategories(fetchedCategories);
    } catch (error) {
      toast.error("Failed to load expense categories for filter.");
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    loadExpenses(filters);
    loadCategories();
  }, [loadExpenses, loadCategories, filters]);


  const handleFilterChange = (filterName: keyof FetchExpensesFilters, value: string | undefined) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };
  
  const handleDateChange = (date: Date | undefined, field: 'startDate' | 'endDate') => {
    setFilters(prev => ({ ...prev, [field]: date ? date.toISOString().split('T')[0] : undefined }));
  };

  const clearFilters = () => {
    setFilters({
      startDate: undefined,
      endDate: undefined,
      categoryId: 'all',
    });
    setSearchTerm('');
  };

  const filteredExpenses = expenses.filter(expense =>
    expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (expense.notes && expense.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
    expense.category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteExpense = (expenseId: string, description: string) => {
    toast.warning(`Are you sure you want to delete expense "${description}"?`, {
        description: "This action cannot be undone.",
        action: {
            label: "Delete",
            onClick: async () => {
                try {
                    await deleteExpense(expenseId);
                    toast.success(`Expense "${description}" deleted.`);
                    loadExpenses(filters); // Refresh list
                } catch (error: any) {
                     toast.error(error.message || `Failed to delete expense.`);
                }
            }
        },
        cancel: { label: "Cancel"}
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-semibold flex items-center gap-2">
            <ReceiptText className="h-8 w-8 text-primary" /> Expenses
          </h1>
          <p className="text-muted-foreground">Track and manage all your business expenses.</p>
        </div>
        <Link href="/expenses/add" passHref>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Log New Expense
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-grow w-full sm:w-auto">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by description, notes, category..."
                className="w-full rounded-lg bg-background pl-8 h-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Popover>
                <PopoverTrigger asChild>
                    <Button id="dateRange" variant={"outline"} className={cn("w-full sm:w-auto justify-start text-left font-normal h-10", !filters.startDate && !filters.endDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.startDate && filters.endDate ? `${format(new Date(filters.startDate), "LLL dd, y")} - ${format(new Date(filters.endDate), "LLL dd, y")}` : filters.startDate ? format(new Date(filters.startDate), "LLL dd, y") : filters.endDate ? format(new Date(filters.endDate), "LLL dd, y") : <span>Date Range</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar initialFocus mode="range" defaultMonth={filters.startDate ? new Date(filters.startDate) : new Date()} selected={{from: filters.startDate ? new Date(filters.startDate) : undefined, to: filters.endDate ? new Date(filters.endDate) : undefined}} onSelect={(range) => { handleDateChange(range?.from, 'startDate'); handleDateChange(range?.to, 'endDate'); }} numberOfMonths={2}/>
                </PopoverContent>
            </Popover>
             <Select value={filters.categoryId} onValueChange={(value) => handleFilterChange('categoryId', value)} disabled={isLoadingCategories}>
              <SelectTrigger className="w-full sm:w-[180px] h-10">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="ghost" onClick={clearFilters} className="h-10">Clear Filters</Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Recorded By</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-[70px] ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-8 w-[30px] mx-auto" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-12">
              <ReceiptText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-lg text-muted-foreground">No expenses found matching your criteria.</p>
              <p className="text-sm text-muted-foreground">Try adjusting your filters or log a new expense.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Recorded By</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="text-xs">{format(parseISO(expense.date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="font-medium text-sm">{expense.description}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{expense.category.name}</Badge></TableCell>
                    <TableCell className="text-right font-semibold text-sm">${expense.amount.toFixed(2)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{expense.user?.name || 'N/A'}</TableCell>
                    <TableCell className="text-center">
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem disabled>
                            <Edit className="mr-2 h-4 w-4" /> Edit Expense
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDeleteExpense(expense.id, expense.description)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Expense
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

    