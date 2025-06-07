
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const errorMessages: Record<string, string> = {
  CredentialsSignin: 'Invalid email or password. Please try again.',
  OAuthSignin: 'Error trying to sign in with the OAuth provider.',
  OAuthCallback: 'Error during the OAuth callback.',
  OAuthCreateAccount: 'Could not create a user account with this OAuth provider. The email might already be in use with a different sign-in method.',
  EmailCreateAccount: 'Could not create a user account. The email might already be in use.',
  Callback: 'Error in the callback handler.',
  OAuthAccountNotLinked: 'This OAuth account is not linked to a user. If you have an existing account, please sign in with that method first.',
  EmailSignin: 'Error sending the sign-in email. Please try again.',
  SessionRequired: 'You need to be signed in to access this page.',
  Default: 'An unknown authentication error occurred. Please try again.',
  AccessDenied: 'Access Denied. You do not have permission to sign in or access this resource.',
  Verification: 'The token has expired or has already been used.',
  Configuration: "There is a problem with the server configuration. Please contact support."
  // Specific errors from your application logic like "User account is inactive."
  // can be handled if NextAuth passes them as a custom error code.
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const errorType = searchParams.get('error');
  const [displayMessage, setDisplayMessage] = useState('');

  useEffect(() => {
    // Handle custom error messages that might be passed directly in the 'error' param
    // For example, if NextAuth is configured to throw custom error messages.
    if (errorType && !errorMessages[errorType]) {
        // If it's not a known key, it might be a direct message
        setDisplayMessage(errorType);
    } else {
        setDisplayMessage(errorMessages[errorType as string] || errorMessages.Default);
    }
  }, [errorType]);


  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-headline">Authentication Error</CardTitle>
          <CardDescription>
            {displayMessage}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* You can add more specific details or suggestions here if needed */}
          {errorType && (
            <p className="text-xs text-center text-muted-foreground">
              Error code: <span className="font-mono">{errorType}</span>
            </p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button asChild className="w-full">
            <Link href="/login">
              <LogIn className="mr-2 h-4 w-4" />
              Try Again
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
