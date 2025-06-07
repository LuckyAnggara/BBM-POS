
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { loginUser } from './actions';
import { LogIn, Mail, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      const result = await loginUser(email);
      if (result.success) {
        toast.success(result.message || 'Login successful! Redirecting...');
        // Redirect to dashboard or intended page after login
        // Wait for toast to show then redirect
        setTimeout(() => {
          router.push('/'); 
          router.refresh(); // Important to refresh layout and potentially NavUser
        }, 1000);
      } else {
        toast.error(result.error || 'Login failed. Please check your email.');
      }
    } catch (error) {
      toast.error('An unexpected error occurred during login.');
      console.error("Login submit error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <LogIn className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-headline">Welcome Back!</CardTitle>
          <CardDescription>
            Enter your email to log in to your StockPilot account.
            (Password check is not implemented in this basic version).
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground"/> Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            {/* Password field could be added here if desired */}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={isLoading || !email}>
              {isLoading ? <Loader2 className="animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
              {isLoading ? 'Logging in...' : 'Log In'}
            </Button>
            <p className="text-xs text-muted-foreground">
              Don&apos;t have an account? Contact admin.
            </p>
             <Link href="/" className="text-xs text-primary hover:underline">
                Back to Homepage
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

    