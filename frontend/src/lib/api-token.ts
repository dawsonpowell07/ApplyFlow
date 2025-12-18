let cachedToken: string | null = null;
let tokenExpiry: number = 0;

export async function getApiToken(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  try {
    // Call our server-side API route instead of Auth0 directly
    const response = await fetch('/api/token');

    if (!response.ok) {
      throw new Error('Failed to fetch API token');
    }

    const data = await response.json();
    cachedToken = data.access_token;

    // Set expiry to 5 minutes before actual expiry (tokens are typically valid for 24 hours)
    tokenExpiry = Date.now() + ((data.expires_in || 86400) - 300) * 1000;

    if (!cachedToken) {
      throw new Error('Failed to retrieve access token');
    }

    return cachedToken;
  } catch (error) {
    console.error('Error fetching API token:', error);
    throw error;
  }
}
