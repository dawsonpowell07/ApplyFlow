/**
 * User API Token Manager
 *
 * This module provides user-specific access token management, similar to
 * auth0.js checkSession() functionality. Unlike the machine-to-machine
 * token in api-token.ts, these tokens have user context and claims.
 *
 * Use this when you need:
 * - User-scoped API calls
 * - JWT with user claims (sub, email, etc.)
 * - Access tokens that represent the authenticated user
 */

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

export async function getUserApiToken(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  try {
    // Call our server-side API route to get user access token
    const response = await fetch('/api/user-token');

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('User not authenticated');
      }
      throw new Error('Failed to fetch user API token');
    }

    const data = await response.json();
    cachedToken = data.access_token;

    // Set expiry to 5 minutes before actual expiry
    tokenExpiry = Date.now() + ((data.expires_in || 3600) - 300) * 1000;

    if (!cachedToken) {
      throw new Error('Failed to retrieve user access token');
    }

    return cachedToken;
  } catch (error) {
    console.error('Error fetching user API token:', error);
    throw error;
  }
}

/**
 * Force refresh the user token
 */
export function clearUserTokenCache(): void {
  cachedToken = null;
  tokenExpiry = 0;
}
