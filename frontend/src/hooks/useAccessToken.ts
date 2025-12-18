'use client';

import { useState, useEffect, useCallback } from 'react';

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  user?: {
    sub: string;
    email?: string;
    name?: string;
  };
}

interface UseAccessTokenResult {
  token: string | null;
  loading: boolean;
  error: Error | null;
  refreshToken: () => Promise<void>;
}

/**
 * Client-side hook for managing user access tokens
 * Similar to auth0.js checkSession() functionality
 *
 * Features:
 * - Automatic token fetching on mount
 * - Caches token in memory
 * - Automatic refresh before expiration
 * - Manual refresh capability
 *
 * @param autoRefresh - Whether to automatically refresh tokens before expiration (default: true)
 * @param refreshBuffer - Seconds before expiration to refresh (default: 300 = 5 minutes)
 */
export function useAccessToken(
  autoRefresh: boolean = true,
  refreshBuffer: number = 300
): UseAccessTokenResult {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);

  const fetchToken = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/user-token');

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Not authenticated');
        }
        throw new Error('Failed to fetch access token');
      }

      const data: TokenResponse = await response.json();

      setToken(data.access_token);

      // Calculate expiration timestamp
      const expiresAtTimestamp = Math.floor(Date.now() / 1000) + data.expires_in;
      setExpiresAt(expiresAtTimestamp);

      console.log('Access token fetched successfully', {
        expiresIn: data.expires_in,
        user: data.user,
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error('Error fetching access token:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial token fetch
  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  // Auto-refresh logic
  useEffect(() => {
    if (!autoRefresh || !expiresAt || !token) {
      return;
    }

    // Calculate when to refresh (buffer seconds before expiration)
    const now = Math.floor(Date.now() / 1000);
    const refreshAt = expiresAt - refreshBuffer;
    const msUntilRefresh = (refreshAt - now) * 1000;

    // If token is already expired or about to expire, refresh immediately
    if (msUntilRefresh <= 0) {
      fetchToken();
      return;
    }

    // Schedule refresh
    console.log(`Token will auto-refresh in ${Math.floor(msUntilRefresh / 1000)} seconds`);
    const timeoutId = setTimeout(() => {
      console.log('Auto-refreshing access token');
      fetchToken();
    }, msUntilRefresh);

    return () => clearTimeout(timeoutId);
  }, [autoRefresh, expiresAt, token, refreshBuffer, fetchToken]);

  return {
    token,
    loading,
    error,
    refreshToken: fetchToken,
  };
}
