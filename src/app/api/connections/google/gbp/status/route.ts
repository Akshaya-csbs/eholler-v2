import { NextRequest, NextResponse } from 'next/server';
import { getGbpRedirectUri, isGoogleOAuthConfigured } from '@/lib/gbp-config';
import { isGbpConnectedWithDb } from '@/lib/gbp-tokens';
import { getDefaultOrgScope } from '@/lib/db/default-org';

export async function GET(req: NextRequest) {
  const isConfigured = isGoogleOAuthConfigured();
  let isConnected = false;
  let googleEmail: string | null = null;
  let activeLocation: any = null;
  let totalLocationsCount = 0;

  try {
    const orgScope = await getDefaultOrgScope();
    const conn = await orgScope.getGbpConnection();
    if (conn && conn.status === 'CONNECTED') {
      googleEmail = conn.email;
      isConnected = await isGbpConnectedWithDb();
      activeLocation = await orgScope.getSelectedGbpLocation();
      const locations = await orgScope.listGbpLocations();
      totalLocationsCount = locations.length;
    }
  } catch (err) {
    console.warn('Error fetching GBP status:', err);
  }

  return NextResponse.json({
    oauthConfigured: isConfigured,
    connected: isConnected,
    googleEmail,
    activeLocation,
    totalLocationsCount,
    redirectUri: getGbpRedirectUri(req),
  });
}

