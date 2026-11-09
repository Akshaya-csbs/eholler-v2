import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  GBP_COOKIE,
  GOOGLE_AUTH_URL,
  GBP_SCOPES,
  getGbpRedirectUri,
  isGoogleOAuthConfigured,
  gbpCookieOptions,
} from '@/lib/gbp-config';

/**
 * GET /api/connections/google/gbp
 * Initiates the independent Google OAuth authorization flow for Google Business Profile.
 */
export async function GET(req: NextRequest) {
  if (!isGoogleOAuthConfigured()) {
    const home = new URL('/', req.nextUrl.origin);
    home.searchParams.set('gbp_error', 'oauth_not_configured');
    return NextResponse.redirect(home);
  }

  // Prefix state with 'gbp_' so the shared callback can immediately route to the GBP handler
  const state = `gbp_${crypto.randomBytes(24).toString('hex')}`;
  const redirectUri = getGbpRedirectUri(req);

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID as string,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GBP_SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state,
  });

  const res = NextResponse.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
  res.cookies.set(GBP_COOKIE.state, state, gbpCookieOptions(600)); // 10 minutes
  return res;
}

