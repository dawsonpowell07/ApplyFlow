import { NextResponse } from 'next/server';

interface Auth0TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

// In-memory token cache
let cachedToken: string | null = null;
let tokenExpiryTime: number | null = null;

// Refresh token 5 minutes before expiry to avoid edge cases
const REFRESH_BUFFER_SECONDS = 300;

async function fetchNewToken(): Promise<Auth0TokenResponse> {
  const response = await fetch(`https://${process.env.AUTH0_DOMAIN}/oauth/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.AUTH0_CLIENT_ID,
      client_secret: process.env.AUTH0_CLIENT_SECRET,
      audience: process.env.AUDIENCE,
      grant_type: 'client_credentials'
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Auth0 token request failed:', errorText);
    throw new Error('Failed to fetch API token');
  }

  return await response.json();
}

export async function GET() {
  try {
    const now = Math.floor(Date.now() / 1000);

    // Check if we have a valid cached token
    if (cachedToken && tokenExpiryTime && now < tokenExpiryTime - REFRESH_BUFFER_SECONDS) {
      console.log('Returning cached token');
      return NextResponse.json({
        access_token: cachedToken,
        expires_in: tokenExpiryTime - now
      });
    }

    // Fetch new token if cache is empty or expired
    console.log('Fetching new token from Auth0');
    const data = await fetchNewToken();

    // Update cache
    cachedToken = data.access_token;
    tokenExpiryTime = now + data.expires_in;

    return NextResponse.json({
      access_token: data.access_token,
      expires_in: data.expires_in
    });
  } catch (error) {
    console.error('Error fetching API token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
