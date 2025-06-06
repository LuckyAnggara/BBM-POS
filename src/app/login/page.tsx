
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { loginUser } from '@/app/auth/actions';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Loader2, LogIn } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid').min(1, 'Email tidak boleh kosong'),
  password: z.string().min(1, 'Password tidak boleh kosong'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await loginUser(data);
        if (result.success) {
          toast.success('Login berhasil!');
          router.push('/'); // Redirect to dashboard
          router.refresh(); // Refresh to ensure layout picks up new auth state
        } else {
          setError(result.error || 'Email atau password salah.');
          toast.error(result.error || 'Email atau password salah.');
        }
      } catch (e) {
        console.error('Login error:', e);
        const errorMessage = e instanceof Error ? e.message : 'Terjadi kesalahan saat login.';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <LogIn className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-headline">Selamat Datang!</CardTitle>
          <CardDescription>Silakan masuk untuk melanjutkan ke StockPilot.</CardDescription>
        </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@stockpilot.com"
                {...form.register('email')}
                disabled={isPending}
              />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...form.register('password')}
                disabled={isPending}
              />
              {form.formState.errors.password && (
                <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>
            {error && (
              <p className="text-xs text-destructive text-center bg-destructive/10 p-2 rounded-md">{error}</p>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
              {isPending ? 'Memproses...' : 'Login'}
            </Button>
             <p className="text-xs text-muted-foreground text-center">
              Belum punya akun? <a href="#" className="text-primary hover:underline" onClick={(e) => {e.preventDefault(); toast.info("Fitur registrasi belum tersedia.")}}>Hubungi Admin</a>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
