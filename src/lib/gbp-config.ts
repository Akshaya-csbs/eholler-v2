import { NextRequest } from 'next/server';

export const GBP_SCOPES = [
  'https://www.googleapis.com/auth/business.manage',
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
].join(' ');

export const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
export const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
export const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';
export const GBP_ACCOUNTS_URL = 'https://mybusinessaccountmanagement.googleapis.com/v1/accounts';
export const GBP_LOCATIONS_BASE_URL = 'https://mybusinessbusinessinformation.googleapis.com/v1';

export const GBP_CALLBACK_PATH = '/api/connections/google/callback';

export const GBP_COOKIE = {
  state: 'gbp_oauth_state',
  access: 'gbp_access_token',
  refresh: 'gbp_refresh_token',
  expiry: 'gbp_token_expiry',
  location: 'gbp_selected_location',
} as const;

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function getGbpRedirectUri(req?: NextRequest): string {
  const fromEnv = process.env.GOOGLE_REDIRECT_URI?.trim();
  if (fromEnv) return fromEnv;

  if (req) {
    return `${req.nextUrl.origin}${GBP_CALLBACK_PATH}`;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');
  if (appUrl) return `${appUrl}${GBP_CALLBACK_PATH}`;

  return `http://localhost:3000${GBP_CALLBACK_PATH}`;
}

export function gbpCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  };
}

