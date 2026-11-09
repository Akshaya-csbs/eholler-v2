import axios from 'axios';
import {
  GBP_ACCOUNTS_URL,
  GBP_LOCATIONS_BASE_URL,
} from './gbp-config';

export interface GbpAccount {
  name: string; // e.g. "accounts/109876543210"
  accountName: string; // e.g. "Acme Organization"
  type?: string; // "PERSONAL" | "ORGANIZATION"
  role?: string; // "OWNER" | "MANAGER" | "COMMUNITY_MANAGER"
  verificationState?: string;
}

export interface NormalizedGbpLocation {
  accountName: string;
  accountTitle: string;
  locationName: string; // e.g. "locations/1234567890"
  locationTitle: string; // e.g. "Acme Plumbing - Downtown"
  placeId: string | null;
  storeCode: string | null;
  address: string | null;
  phoneNumber: string | null;
  websiteUri: string | null;
  primaryCategory: string | null;
}

/**
 * 1. Fetch all GBP accounts accessible to the authenticated Google account.
 * Paginates until all accounts are collected.
 */
export async function listGbpAccounts(accessToken: string): Promise<GbpAccount[]> {
  const accounts: GbpAccount[] = [];
  let pageToken: string | undefined = undefined;

  try {
    do {
      const url = new URL(GBP_ACCOUNTS_URL);
      url.searchParams.set('pageSize', '20');
      if (pageToken) {
        url.searchParams.set('pageToken', pageToken);
      }

      const res = await axios.get(url.toString(), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
        timeout: 15000,
        validateStatus: () => true,
      });

      if (res.status === 403) {
        const errorDetail = res.data?.error?.message || 'Access denied';
        throw new Error(
          `Google Business Profile API is not enabled in your Google Cloud Console or your Google account lacks permission: ${errorDetail}`
        );
      }

      if (res.status >= 400) {
        throw new Error(
          res.data?.error?.message || `Failed to fetch GBP accounts (HTTP ${res.status})`
        );
      }

      const list = res.data?.accounts || [];
      for (const item of list) {
        accounts.push({
          name: item.name,
          accountName: item.accountName || item.name,
          type: item.type,
          role: item.role,
          verificationState: item.verificationState,
        });
      }

      pageToken = res.data?.nextPageToken;
    } while (pageToken);

    return accounts;
  } catch (err: any) {
    console.error('[GBP API] Error listing accounts:', err.message);
    throw err;
  }
}

/**
 * 2. Fetch all locations for a specific GBP account.
 * Requires mandatory readMask parameter in v1.
 * Paginates until all locations are collected.
 */
export async function listGbpLocationsForAccount(
  accessToken: string,
  account: GbpAccount
): Promise<NormalizedGbpLocation[]> {
  const locations: NormalizedGbpLocation[] = [];
  let pageToken: string | undefined = undefined;

  const readMask = [
    'name',
    'title',
    'storefrontAddress',
    'websiteUri',
    'phoneNumbers',
    'categories',
    'metadata',
    'regularHours',
    'serviceArea',
    'storeCode',
  ].join(',');

  try {
    do {
      // Endpoint format: https://mybusinessbusinessinformation.googleapis.com/v1/{account.name}/locations
      const endpoint = `${GBP_LOCATIONS_BASE_URL}/${account.name}/locations`;
      const url = new URL(endpoint);
      url.searchParams.set('readMask', readMask);
      url.searchParams.set('pageSize', '100');
      if (pageToken) {
        url.searchParams.set('pageToken', pageToken);
      }

      const res = await axios.get(url.toString(), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
        timeout: 15000,
        validateStatus: () => true,
      });

      if (res.status === 403) {
        const errorDetail = res.data?.error?.message || 'Access denied';
        console.warn(`[GBP API] Permission denied for account ${account.name}:`, errorDetail);
        throw new Error(
          `Google Business Profile API access denied for account "${account.accountName}": ${errorDetail}. Please ensure My Business Business Information API is enabled in your Google Cloud Console.`
        );
      }

      if (res.status >= 400) {
        const errorDetail = res.data?.error?.message || `HTTP ${res.status}`;
        console.warn(`[GBP API] Error fetching locations for ${account.name}:`, errorDetail);
        throw new Error(`Failed to fetch locations for account "${account.accountName}": ${errorDetail}`);
      }

      const rawLocations = res.data?.locations || [];
      for (const loc of rawLocations) {
        const addressLines = loc.storefrontAddress?.addressLines || [];
        const locality = loc.storefrontAddress?.locality || '';
        const adminArea = loc.storefrontAddress?.administrativeArea || '';
        const postalCode = loc.storefrontAddress?.postalCode || '';
        let formattedAddr = [
          ...addressLines,
          [locality, adminArea, postalCode].filter(Boolean).join(', '),
        ]
          .filter(Boolean)
          .join(', ');

        // Handle Service Area businesses without physical storefront addresses
        if (!formattedAddr && loc.serviceArea) {
          const placeNames = loc.serviceArea.places?.placeInfos
            ?.map((p: any) => p.placeName)
            .filter(Boolean) || [];
          if (placeNames.length > 0) {
            formattedAddr = `Service Area: ${placeNames.join(', ')}`;
          } else {
            formattedAddr = 'Service Area Business (No public storefront)';
          }
        }

        locations.push({
          accountName: account.name,
          accountTitle: account.accountName,
          locationName: loc.name,
          locationTitle: loc.title || 'Untitled Location',
          placeId: loc.metadata?.placeId || null,
          storeCode: loc.storeCode || null,
          address: formattedAddr || null,
          phoneNumber: loc.phoneNumbers?.primaryPhone || null,
          websiteUri: loc.websiteUri || null,
          primaryCategory: loc.categories?.primaryCategory?.displayName || null,
        });
      }

      pageToken = res.data?.nextPageToken;
    } while (pageToken);

    return locations;
  } catch (err: any) {
    console.error(`[GBP API] Error listing locations for account ${account.name}:`, err.message);
    throw err;
  }
}

/**
 * 3. Consolidate and fetch all locations across every account accessible to the user.
 */
export async function listAllAccessibleGbpLocations(
  accessToken: string
): Promise<{ accounts: GbpAccount[]; locations: NormalizedGbpLocation[] }> {
  const accounts = await listGbpAccounts(accessToken);
  const allLocations: NormalizedGbpLocation[] = [];

  for (const acc of accounts) {
    const locs = await listGbpLocationsForAccount(accessToken, acc);
    allLocations.push(...locs);
  }

  return {
    accounts,
    locations: allLocations,
  };
}

