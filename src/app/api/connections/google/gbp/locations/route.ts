import { NextResponse } from 'next/server';
import { getValidGbpAccessToken } from '@/lib/gbp-tokens';
import { listAllAccessibleGbpLocations } from '@/lib/gbp-api';
import { getDefaultOrgScope } from '@/lib/db/default-org';

export async function GET() {
  const accessToken = await getValidGbpAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      { error: 'not_connected', message: 'Google Business Profile is not connected or token expired' },
      { status: 401 }
    );
  }

  try {
    const orgScope = await getDefaultOrgScope();
    const conn = await orgScope.getGbpConnection();
    if (!conn) {
      return NextResponse.json(
        { error: 'no_connection_record', message: 'No active Google Business Profile connection record found.' },
        { status: 404 }
      );
    }

    // Call official GBP APIs with mandatory readMask and pagination
    const { accounts, locations } = await listAllAccessibleGbpLocations(accessToken);

    // Persist to Neon DB
    if (locations.length > 0) {
      await orgScope.upsertGbpLocations(
        conn.id,
        locations.map((l) => ({
          accountName: l.accountName,
          accountTitle: l.accountTitle,
          locationName: l.locationName,
          locationTitle: l.locationTitle,
          placeId: l.placeId || undefined,
          storeCode: l.storeCode || undefined,
          address: l.address || undefined,
          phoneNumber: l.phoneNumber || undefined,
          websiteUri: l.websiteUri || undefined,
          primaryCategory: l.primaryCategory || undefined,
        }))
      );
    }

    // Retrieve full list of persisted locations and current selection
    const dbLocations = await orgScope.listGbpLocations();
    const activeLocation = await orgScope.getSelectedGbpLocation();

    return NextResponse.json({
      success: true,
      accounts,
      locations: dbLocations,
      activeLocationId: activeLocation?.id || null,
    });
  } catch (err: any) {
    console.error('Failed to retrieve GBP locations:', err);
    return NextResponse.json(
      {
        error: 'fetch_failed',
        message: err.message || 'Failed to retrieve locations from Google Business Profile API',
      },
      { status: 500 }
    );
  }
}

