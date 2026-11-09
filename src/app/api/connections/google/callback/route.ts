import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import axios from 'axios';
import {
  COOKIE as GSC_COOKIE,
  GOOGLE_TOKEN_URL,
  getGoogleRedirectUri,
  isGoogleOAuthConfigured,
  tokenCookieOptions,
} from '@/lib/gsc-config';
import { applyTokenCookies as applyGscTokenCookies, clearGscCookies } from '@/lib/gsc-tokens';
import {
  GBP_COOKIE,
  GOOGLE_USERINFO_URL,
  getGbpRedirectUri,
  gbpCookieOptions,
} from '@/lib/gbp-config';
import { applyGbpTokenCookies, clearGbpCookies } from '@/lib/gbp-tokens';
import { getDefaultOrgScope } from '@/lib/db/default-org';
import { GoogleServiceType } from '@prisma/client';
import { cookies } from 'next/headers';

function safeEqual(left?: string | null, right?: string | null): boolean {
  if (!left || !right) return false;
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function redirectHome(req: NextRequest, params: Record<string, string>) {
  const url = new URL('/', req.nextUrl.origin);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url;
}

export async function GET(req: NextRequest) {
  const state = req.nextUrl.searchParams.get('state') || '';
  const isGbp = state.startsWith('gbp_') || Boolean(req.cookies.get(GBP_COOKIE.state)?.value);

  // ---------------------------------------------------------
  // GBP (Google Business Profile) OAuth Flow Handling
  // ---------------------------------------------------------
  if (isGbp) {
    const failGbp = (code: string) => {
      cookies().set(GBP_COOKIE.state, '', gbpCookieOptions(0));
      return NextResponse.redirect(redirectHome(req, { activeTab: 'profile', gbp_error: code }));
    };

    if (!isGoogleOAuthConfigured()) {
      return failGbp('oauth_not_configured');
    }

    const googleError = req.nextUrl.searchParams.get('error');
    if (googleError) {
      if (googleError === 'access_denied') return failGbp('access_denied');
      return failGbp('google_oauth_error');
    }

    const code = req.nextUrl.searchParams.get('code');
    const expectedState = req.cookies.get(GBP_COOKIE.state)?.value || cookies().get(GBP_COOKIE.state)?.value;

    if (!code) return failGbp('missing_code');
    if (!safeEqual(state, expectedState)) return failGbp('invalid_state');

    try {
      const body = new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID as string,
        client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
        redirect_uri: getGbpRedirectUri(req),
        grant_type: 'authorization_code',
      });

      const tokenRes = await axios.post(GOOGLE_TOKEN_URL, body.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 15000,
        validateStatus: () => true,
      });

      if (tokenRes.status < 200 || tokenRes.status >= 300 || !tokenRes.data?.access_token) {
        console.error('GBP authorization code exchange failed with status', tokenRes.status);
        return failGbp('token_exchange_failed');
      }

      // Fetch authentic Google identity (email & sub) of the Google account authorising GBP
      let googleEmail = 'gbp-connected@google.local';
      let googleUserId: string | null = null;
      try {
        const userInfoRes = await axios.get(GOOGLE_USERINFO_URL, {
          headers: { Authorization: `Bearer ${tokenRes.data.access_token}` },
          timeout: 10000,
          validateStatus: () => true,
        });
        if (userInfoRes.status >= 200 && userInfoRes.status < 300 && userInfoRes.data?.email) {
          googleEmail = userInfoRes.data.email;
          googleUserId = userInfoRes.data.sub || null;
        }
      } catch (uiErr) {
        console.warn('Could not fetch Google UserInfo for GBP connection:', uiErr);
      }

      const success = NextResponse.redirect(redirectHome(req, { activeTab: 'profile', gbp: 'connected' }));
      applyGbpTokenCookies(
        {
          access_token: tokenRes.data.access_token,
          refresh_token: tokenRes.data.refresh_token,
          expires_in: tokenRes.data.expires_in,
        },
        success
      );

      // Persist GBP connection to Neon PostgreSQL isolated under GoogleServiceType.BUSINESS_PROFILE
      try {
        const orgScope = await getDefaultOrgScope();
        const expiresInSec = Number(tokenRes.data.expires_in) || 3600;
        await orgScope.saveGoogleConnection({
          service: GoogleServiceType.BUSINESS_PROFILE,
          email: googleEmail,
          googleUserId,
          accessToken: tokenRes.data.access_token,
          refreshToken: tokenRes.data.refresh_token,
          tokenExpiry: new Date(Date.now() + expiresInSec * 1000),
          scopes: [
            'https://www.googleapis.com/auth/business.manage',
            'openid',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
          ],
        });
      } catch (dbErr) {
        console.warn('Could not persist encrypted GBP Google connection to database (non-fatal):', dbErr);
      }

      success.cookies.set(GBP_COOKIE.state, '', gbpCookieOptions(0));
      return success;
    } catch (err) {
      console.error('Google GBP OAuth callback error:', err);
      const failure = NextResponse.redirect(redirectHome(req, { activeTab: 'profile', gbp_error: 'token_exchange_failed' }));
      clearGbpCookies(failure);
      return failure;
    }
  }

  // ---------------------------------------------------------
  // GSC (Google Search Console) OAuth Flow Handling (Preserved)
  // ---------------------------------------------------------
  const failGsc = (code: string) => {
    cookies().set(GSC_COOKIE.state, '', tokenCookieOptions(0));
    return NextResponse.redirect(redirectHome(req, { gsc_error: code }));
  };

  if (!isGoogleOAuthConfigured()) {
    return failGsc('oauth_not_configured');
  }

  const googleError = req.nextUrl.searchParams.get('error');
  if (googleError) {
    if (googleError === 'access_denied') return failGsc('access_denied');
    return failGsc('google_oauth_error');
  }

  const code = req.nextUrl.searchParams.get('code');
  const expectedState = req.cookies.get(GSC_COOKIE.state)?.value || cookies().get(GSC_COOKIE.state)?.value;

  if (!code) return failGsc('missing_code');
  if (!safeEqual(state, expectedState)) return failGsc('invalid_state');

  try {
    const body = new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID as string,
      client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
      redirect_uri: getGoogleRedirectUri(req),
      grant_type: 'authorization_code',
    });

    const tokenRes = await axios.post(GOOGLE_TOKEN_URL, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 15000,
      validateStatus: () => true,
    });

    if (tokenRes.status < 200 || tokenRes.status >= 300 || !tokenRes.data?.access_token) {
      console.error('Google authorization code exchange failed with status', tokenRes.status);
      return failGsc('token_exchange_failed');
    }

    const success = NextResponse.redirect(redirectHome(req, { gsc: 'connected' }));
    applyGscTokenCookies(
      {
        access_token: tokenRes.data.access_token,
        refresh_token: tokenRes.data.refresh_token,
        expires_in: tokenRes.data.expires_in,
      },
      success
    );

    // Persist securely into Neon with AES-256-GCM encrypted tokens for SEARCH_CONSOLE
    try {
      const orgScope = await getDefaultOrgScope();
      const expiresInSec = Number(tokenRes.data.expires_in) || 3600;
      await orgScope.saveGoogleConnection({
        service: GoogleServiceType.SEARCH_CONSOLE,
        email: 'default-connection@gsc.local',
        accessToken: tokenRes.data.access_token,
        refreshToken: tokenRes.data.refresh_token,
        tokenExpiry: new Date(Date.now() + expiresInSec * 1000),
        scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
      });
    } catch (dbErr) {
      console.warn('Could not persist encrypted Google connection to database (non-fatal):', dbErr);
    }

    success.cookies.set(GSC_COOKIE.state, '', tokenCookieOptions(0));
    return success;
  } catch {
    console.error('Google OAuth callback failed');
    const failure = NextResponse.redirect(redirectHome(req, { gsc_error: 'token_exchange_failed' }));
    clearGscCookies(failure);
    return failure;
  }
}
