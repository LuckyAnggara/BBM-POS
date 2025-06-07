
'use client';

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Trash2, Edit, Loader2, ListTree } from "lucide-react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { fetchCategories, createCategory } from './actions';
import type { Category } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { usePageTitle } from '@/components/layout/page-title-context';

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(50, "Category name too long"),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export default function CategoryManagementPage() {
  usePageTitle('Product Category Management');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "" },
  });

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const fetchedCategories = await fetchCategories();
      setCategories(fetchedCategories);
    } catch (error) {
      toast.error("Failed to load categories.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const onSubmit: SubmitHandler<CategoryFormValues> = async (data) => {
    setIsSubmitting(true);
    try {
      const newCategory = await createCategory(data.name);
      setCategories(prev => [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success(`Category "${newCategory.name}" created successfully!`);
      form.reset();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create category.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Placeholder for delete action
  const handleDeleteCategory = (categoryId: string, categoryName: string) => {
    toast.warning(`Are you sure you want to delete category "${categoryName}"?`, {
        description: "This might affect products associated with this category.",
        action: { label: "Delete", onClick: () => toast.info("Delete functionality not yet implemented.")},
        cancel: { label: "Cancel" }
    })
  }

  return (
    <div className="grid md:grid-cols-3 gap-6 items-start">
      <div className="md:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><PlusCircle className="h-5 w-5 text-primary"/> Add New Category</CardTitle>
            <CardDescription>Create a new category for organizing products.</CardDescription>
          </CardHeader>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent>
              <Input
                {...form.register("name")}
                placeholder="e.g., Electronics"
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
            <CardTitle className="font-headline flex items-center gap-2"><ListTree className="h-5 w-5 text-primary"/> Existing Categories</CardTitle>
            <CardDescription>Manage and view all product categories.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : categories.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No categories found. Add one to get started.</p>
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
