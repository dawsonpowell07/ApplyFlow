# Access Token Usage Guide

This project now supports two types of access tokens for calling the backend API. Choose the appropriate one based on your use case.

## Token Types

### 1. User Access Tokens (NEW - Similar to checkSession)

**Location:** `/api/user-token` and `useAccessToken` hook

**When to use:**
- When you need user-specific API calls
- When you need the user's identity in the token (JWT sub, email, etc.)
- For operations that should be scoped to the authenticated user
- For most application features where user context matters

**How it works:**
- Uses the Auth0 Next.js SDK's `getAccessToken()` method
- Returns tokens that contain user claims from the JWT
- Automatically refreshes when needed
- Similar to auth0.js v9's `checkSession()` pattern

**Usage Examples:**

#### Option A: Using the Hook (Recommended for React Components)

```tsx
'use client';

import { useAccessToken } from '@/hooks/useAccessToken';

export default function MyComponent() {
  const { token, loading, error, refreshToken } = useAccessToken();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const fetchData = async () => {
    const response = await fetch('https://your-api.com/endpoint', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    // handle response
  };

  return (
    <div>
      <button onClick={fetchData}>Fetch Data</button>
      <button onClick={refreshToken}>Refresh Token</button>
    </div>
  );
}
```

#### Option B: Using the Token Manager Directly

```typescript
import { getUserApiToken } from '@/lib/user-api-token';

async function makeApiCall() {
  const token = await getUserApiToken();

  const response = await fetch('https://your-api.com/endpoint', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  return response.json();
}
```

#### Option C: Integrate with Existing API Client

You can update your `api-client.ts` to use user tokens:

```typescript
import { getUserApiToken } from './user-api-token';

export async function apiRequestWithUserToken<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const token = await getUserApiToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  // ... rest of the implementation
}
```

### 2. Machine-to-Machine Tokens (Existing)

**Location:** `/api/token` and `getApiToken()`

**When to use:**
- For backend operations that don't need user context
- For admin operations
- For scheduled tasks or background jobs

**How it works:**
- Uses Auth0 client credentials flow
- Token represents the application itself, not a user
- No user claims in the token

**Usage:**

```typescript
import { getApiToken } from '@/lib/api-token';

// Existing usage - no changes needed
const token = await getApiToken();
```

## Configuration

The user token system is configured in `/src/lib/auth0.ts`:

```typescript
export const auth0 = new Auth0Client({
  authorizationParameters: {
    audience: process.env.AUDIENCE, // Your API audience
    scope: 'openid profile email',   // Add custom scopes as needed
  },
});
```

### Adding Custom Scopes

If your backend API requires specific scopes, update the configuration:

```typescript
export const auth0 = new Auth0Client({
  authorizationParameters: {
    audience: process.env.AUDIENCE,
    scope: 'openid profile email read:applications write:applications',
  },
});
```

## Hook Features

The `useAccessToken` hook provides:

- **Automatic fetching** on component mount
- **Caching** to avoid unnecessary API calls
- **Auto-refresh** before expiration (configurable)
- **Manual refresh** via `refreshToken()` function
- **Loading and error states** for better UX

### Hook Options

```typescript
// Default: auto-refresh 5 minutes before expiration
const { token } = useAccessToken();

// Custom: no auto-refresh
const { token } = useAccessToken(false);

// Custom: refresh 10 minutes before expiration
const { token } = useAccessToken(true, 600);
```

## Comparison with auth0.js checkSession()

If you're familiar with auth0.js v9's `checkSession()`:

| auth0.js v9 | This Implementation |
|------------|-------------------|
| `webAuth.checkSession()` | `await fetch('/api/user-token')` or `useAccessToken()` |
| Client-side only | Works both client and server side |
| Uses iframe | Uses Next.js SDK (no iframe) |
| Manual token refresh | Automatic refresh with hook |

## Backend Lambda Integration

Your backend Lambdas expect JWT tokens with user_id. The user tokens contain:

```json
{
  "sub": "auth0|123456789",  // Used as user_id in backend
  "email": "user@example.com",
  "name": "User Name",
  "aud": "https://htnpjvh1wh.execute-api.us-east-1.amazonaws.com",
  // ... other claims
}
```

The backend JWT authorizer extracts the `sub` claim and provides it as `user_id` to your Lambda functions.

## Migration Guide

To switch from machine-to-machine tokens to user tokens in your components:

### Before:
```typescript
import { apiRequest } from '@/lib/api-client';

const data = await apiRequest('/applications');
```

### After (if you want user context):
```typescript
import { getUserApiToken } from '@/lib/user-api-token';

const token = await getUserApiToken();
const response = await fetch('https://your-api.com/applications', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

Or use the hook for better React integration:
```typescript
const { token } = useAccessToken();
// Use token in your API calls
```

## Troubleshooting

### "Not authenticated" error
- Make sure the user is logged in before calling user token endpoints
- Check that your Auth0 session is valid

### Token expired errors
- The hook auto-refreshes by default
- For manual management, call `refreshToken()` or `clearUserTokenCache()`

### Missing claims in token
- Verify the `audience` parameter matches your API identifier in Auth0
- Check that required scopes are configured in `auth0.ts`
- Ensure your Auth0 API settings include necessary permissions
