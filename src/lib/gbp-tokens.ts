import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import axios from 'axios';
import {
  GBP_COOKIE,
  GOOGLE_TOKEN_URL,
  isGoogleOAuthConfigured,
  gbpCookieOptions,
} from './gbp-config';
import { getDefaultOrgScope } from './db/default-org';
import { GoogleServiceType } from '@prisma/client';

const ACCESS_COOKIE_MAX_AGE = 60 * 60;
const REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 60; // 60 days

export interface GbpStoredTokens {
  accessToken: string;
  refreshToken?: string;
  expiryMs: number;
}

export function applyGbpTokenCookies(
  tokens: {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  },
  res?: NextResponse
) {
  const expiresIn = Number(tokens.expires_in) > 0 ? Number(tokens.expires_in) : ACCESS_COOKIE_MAX_AGE;
  const expiryMs = Date.now() + expiresIn * 1000;
  const store = cookies();

  store.set(GBP_COOKIE.access, tokens.access_token, gbpCookieOptions(expiresIn));
  store.set(GBP_COOKIE.expiry, String(expiryMs), gbpCookieOptions(REFRESH_COOKIE_MAX_AGE));
  res?.cookies.set(GBP_COOKIE.access, tokens.access_token, gbpCookieOptions(expiresIn));
  res?.cookies.set(GBP_COOKIE.expiry, String(expiryMs), gbpCookieOptions(REFRESH_COOKIE_MAX_AGE));

  if (tokens.refresh_token) {
    store.set(GBP_COOKIE.refresh, tokens.refresh_token, gbpCookieOptions(REFRESH_COOKIE_MAX_AGE));
    res?.cookies.set(GBP_COOKIE.refresh, tokens.refresh_token, gbpCookieOptions(REFRESH_COOKIE_MAX_AGE));
  }
}

export function clearGbpCookies(res?: NextResponse) {
  const store = cookies();
  const opts = gbpCookieOptions(0);
  store.set(GBP_COOKIE.access, '', opts);
  store.set(GBP_COOKIE.refresh, '', opts);
  store.set(GBP_COOKIE.expiry, '', opts);
  store.set(GBP_COOKIE.location, '', opts);
  store.set(GBP_COOKIE.state, '', opts);

  res?.cookies.set(GBP_COOKIE.access, '', opts);
  res?.cookies.set(GBP_COOKIE.refresh, '', opts);
  res?.cookies.set(GBP_COOKIE.expiry, '', opts);
  res?.cookies.set(GBP_COOKIE.location, '', opts);
  res?.cookies.set(GBP_COOKIE.state, '', opts);
}

export function readGbpStoredTokens(): GbpStoredTokens | null {
  const store = cookies();
  const accessToken = store.get(GBP_COOKIE.access)?.value;
  if (!accessToken) return null;

  const expiryRaw = store.get(GBP_COOKIE.expiry)?.value;
  const expiryMs = expiryRaw ? Number(expiryRaw) : 0;
  const refreshToken = store.get(GBP_COOKIE.refresh)?.value;

  return {
    accessToken,
    refreshToken: refreshToken || undefined,
    expiryMs: Number.isFinite(expiryMs) ? expiryMs : 0,
  };
}

async function refreshGbpAccessToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
} | null> {
  if (!isGoogleOAuthConfigured()) return null;

  try {
    const body = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID as string,
      client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    const response = await axios.post(GOOGLE_TOKEN_URL, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 15000,
      validateStatus: () => true,
    });

    if (response.status >= 200 && response.status < 300 && response.data?.access_token) {
      return {
        access_token: response.data.access_token,
        expires_in: response.data.expires_in,
        refresh_token: response.data.refresh_token,
      };
    }

    console.error('GBP token refresh failed with status', response.status);
    return null;
  } catch (err) {
    console.error('GBP token refresh request failed:', err);
    return null;
  }
}

export async function getValidGbpAccessToken(): Promise<string | null> {
  const stored = readGbpStoredTokens();

  // 1. Try memory/cookie tokens first
  if (stored) {
    const stillValid = stored.expiryMs - Date.now() > 60_000;
    if (stillValid) return stored.accessToken;

    if (stored.refreshToken) {
      const refreshed = await refreshGbpAccessToken(stored.refreshToken);
      if (refreshed) {
        applyGbpTokenCookies({
          access_token: refreshed.access_token,
          expires_in: refreshed.expires_in,
          refresh_token: refreshed.refresh_token || stored.refreshToken,
        });

        // Sync refreshed tokens to PostgreSQL
        try {
          const orgScope = await getDefaultOrgScope();
          const conn = await orgScope.getGbpConnection();
          const expiresInSec = Number(refreshed.expires_in) || 3600;
          await orgScope.saveGoogleConnection({
            service: GoogleServiceType.BUSINESS_PROFILE,
            email: conn?.email || 'gbp-connection@eholler.local',
            accessToken: refreshed.access_token,
            refreshToken: refreshed.refresh_token || stored.refreshToken,
            tokenExpiry: new Date(Date.now() + expiresInSec * 1000),
            scopes: conn?.scopes || ['https://www.googleapis.com/auth/business.manage'],
          });
        } catch (dbErr) {
          console.warn('Could not sync refreshed GBP token to DB:', dbErr);
        }

        return refreshed.access_token;
      }
    }

    return stored.accessToken || null;
  }

  // 2. Fallback to PostgreSQL encrypted GoogleConnection for BUSINESS_PROFILE
  try {
    const orgScope = await getDefaultOrgScope();
    const conn = await orgScope.getGbpConnection();
    if (!conn) return null;

    const isStillValid = conn.tokenExpiry ? conn.tokenExpiry.getTime() - Date.now() > 60_000 : false;
    if (isStillValid && conn.accessToken) {
      const remainingSeconds = conn.tokenExpiry
        ? Math.max(60, Math.floor((conn.tokenExpiry.getTime() - Date.now()) / 1000))
        : 3600;
      applyGbpTokenCookies({
        access_token: conn.accessToken,
        expires_in: remainingSeconds,
        refresh_token: conn.refreshToken || undefined,
      });
      return conn.accessToken;
    }

    // Attempt refresh if refresh token is in DB
    if (conn.refreshToken) {
      const refreshed = await refreshGbpAccessToken(conn.refreshToken);
      if (refreshed) {
        const expiresInSec = Number(refreshed.expires_in) || 3600;
        await orgScope.saveGoogleConnection({
          service: GoogleServiceType.BUSINESS_PROFILE,
          email: conn.email,
          accessToken: refreshed.access_token,
          refreshToken: refreshed.refresh_token || conn.refreshToken,
          tokenExpiry: new Date(Date.now() + expiresInSec * 1000),
          scopes: conn.scopes,
        });

        applyGbpTokenCookies({
          access_token: refreshed.access_token,
          expires_in: refreshed.expires_in,
          refresh_token: refreshed.refresh_token || conn.refreshToken,
        });

        return refreshed.access_token;
      }
    }
  } catch (err) {
    console.warn('Failed to resolve GBP connection from database fallback:', err);
  }

  return null;
}

export async function isGbpConnectedWithDb(): Promise<boolean> {
  const token = await getValidGbpAccessToken();
  return Boolean(token);
}

