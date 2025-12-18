'use client';

import { useAccessToken } from '@/hooks/useAccessToken';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';

/**
 * Example component demonstrating useAccessToken hook usage
 *
 * This shows how to:
 * - Get user access tokens (similar to auth0.js checkSession)
 * - Handle loading and error states
 * - Manually refresh tokens
 * - Use tokens for API calls
 */
export default function TokenExample() {
  const { token, loading, error, refreshToken } = useAccessToken();

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading access token...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error: {error.message}</p>
            <Button onClick={refreshToken} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Access Token</CardTitle>
        <CardDescription>
          Access token for authenticated API calls (similar to auth0.js checkSession)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-2">Token (truncated):</p>
          <code className="block p-3 bg-gray-100 rounded text-xs break-all">
            {token ? `${token.substring(0, 50)}...` : 'No token'}
          </code>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={refreshToken}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Token
          </Button>

          <Button
            onClick={async () => {
              // Example: Make an API call with the token
              try {
                const response = await fetch('https://htnpjvh1wh.execute-api.us-east-1.amazonaws.com/applications', {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  },
                });
                const data = await response.json();
                console.log('API Response:', data);
                alert('Check console for API response');
              } catch (err) {
                console.error('API call failed:', err);
                alert('API call failed - check console');
              }
            }}
            variant="default"
            size="sm"
          >
            Test API Call
          </Button>
        </div>

        <div className="pt-4 border-t">
          <p className="text-xs text-gray-600">
            This token automatically refreshes 5 minutes before expiration.
            It contains user claims (sub, email, etc.) and can be used to call your backend API.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
