
'use client';

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Trash2, Edit, Loader2, WalletCards } from "lucide-react"; // Using WalletCards for expense categories
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { fetchExpenseCategories, createExpenseCategory, deleteExpenseCategory } from './actions';
import type { ExpenseCategory } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

const expenseCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(50, "Category name too long"),
});

type ExpenseCategoryFormValues = z.infer<typeof expenseCategorySchema>;

export default function ExpenseCategoryManagementPage() {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ExpenseCategoryFormValues>({
    resolver: zodResolver(expenseCategorySchema),
    defaultValues: { name: "" },
  });

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const fetchedCategories = await fetchExpenseCategories();
      setCategories(fetchedCategories);
    } catch (error) {
      toast.error("Failed to load expense categories.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const onSubmit: SubmitHandler<ExpenseCategoryFormValues> = async (data) => {
    setIsSubmitting(true);
    try {
      const newCategory = await createExpenseCategory(data.name);
      setCategories(prev => [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success(`Expense category "${newCategory.name}" created successfully!`);
      form.reset();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create expense category.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = (categoryId: string, categoryName: string) => {
    toast.warning(`Are you sure you want to delete expense category "${categoryName}"?`, {
        description: "This might affect logged expenses. This action cannot be undone.",
        action: { 
            label: "Delete", 
            onClick: async () => {
                try {
                    await deleteExpenseCategory(categoryId);
                    toast.success(`Category "${categoryName}" deleted.`);
                    loadCategories();
                } catch (e: any) {
                    toast.error(e.message || `Failed to delete category "${categoryName}".`);
                }
            }
        },
        cancel: { label: "Cancel" }
    })
  }

  return (
    <div className="grid md:grid-cols-3 gap-6 items-start">
      <div className="md:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><PlusCircle className="h-5 w-5 text-primary"/> Add New Expense Category</CardTitle>
            <CardDescription>Create a new category for organizing expenses.</CardDescription>
          </CardHeader>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent>
              <Input
                {...form.register("name")}
                placeholder="e.g., Rent, Utilities, Marketing"
                disabled={isSubmitting}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>
              )}
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSubmitting || isLoading}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                {isSubmitting ? "Adding..." : "Add Category"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><WalletCards className="h-5 w-5 text-primary"/> Existing Expense Categories</CardTitle>
            <CardDescription>Manage and view all expense categories.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : categories.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No expense categories found. Add one to get started.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{format(new Date(category.createdAt), "MMM dd, yyyy")}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => toast.info("Edit not implemented yet.")} className="mr-1">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(category.id, category.name)} className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    