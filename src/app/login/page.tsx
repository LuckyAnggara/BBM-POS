
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { loginUser } from './actions';
import { LogIn, Mail, KeyRound, Loader2 } from 'lucide-react'; // Added KeyRound for password
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Added password state
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      // Pass email and password to loginUser action
      const result = await loginUser(email, password); 
      if (result.success) {
        toast.success(result.message || 'Login successful! Redirecting...');
        setTimeout(() => {
          router.push('/'); 
          router.refresh(); 
        }, 1000);
      } else {
        toast.error(result.error || 'Login failed. Please check your credentials.');
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
            Enter your email and password to log in to your StockPilot account.
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
            <div className="space-y-2"> {/* Added password field */}
              <Label htmlFor="password" className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-muted-foreground"/> Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={isLoading || !email || !password}>
              {isLoading ? <Loader2 className="animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
              {isLoading ? 'Logging in...' : 'Log In'}
            </Button>
            <p className="text-xs text-muted-foreground">
              Sample users: admin@example.com (adminpassword) or staff@example.com (staffpassword)
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
