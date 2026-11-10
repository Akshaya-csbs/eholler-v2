import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import axios from 'axios';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
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
import { listAllAccessibleGbpLocations } from '@/lib/gbp-api';
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

function redirectOnboarding(req: NextRequest, params: Record<string, string>) {
  const url = new URL('/connect-gbp', req.nextUrl.origin);
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
    const isOnboarding = state.includes('onboarding') || state.startsWith('gbp_onboarding_');
    const isExplicitBusiness = state.includes('_biz_');

    // Decode optional metadata cookie
    let meta: { flow?: string; from?: string; expectedEmail?: string | null } = {};
    const rawMeta = req.cookies.get('gbp_oauth_meta')?.value;
    if (rawMeta) {
      try {
        meta = JSON.parse(Buffer.from(rawMeta, 'base64').toString('utf-8'));
      } catch (e) {
        meta = {};
      }
    }

    const isBusinessFlow = isExplicitBusiness || meta.flow === 'business';

    const failGbp = (code: string, extraParams: Record<string, string> = {}) => {
      const res = isOnboarding
        ? NextResponse.redirect(redirectOnboarding(req, { error: code, ...extraParams }))
        : NextResponse.redirect(redirectHome(req, { activeTab: 'profile', gbp_error: code, ...extraParams }));

      res.cookies.set(GBP_COOKIE.state, '', gbpCookieOptions(0));
      res.cookies.set('gbp_oauth_meta', '', gbpCookieOptions(0));
      clearGbpCookies(res);
      return res;
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
          googleEmail = userInfoRes.data.email.trim().toLowerCase();
          googleUserId = userInfoRes.data.sub || null;
        }
      } catch (uiErr) {
        console.warn('Could not fetch Google UserInfo for GBP connection:', uiErr);
      }

      // Retrieve current authenticated Clerk user
      let verifiedEhollerEmail: string | null = meta.expectedEmail || null;
      let currentDbUserId: string | null = null;
      try {
        const clerkUser = await currentUser();
        const primary = clerkUser?.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId);
        if (primary?.emailAddress) {
          verifiedEhollerEmail = primary.emailAddress.trim().toLowerCase();
        }
        if (clerkUser?.id) {
          const dbUser = await prisma.user.findFirst({
            where: { clerkId: clerkUser.id },
          });
          if (dbUser) currentDbUserId = dbUser.id;
        }
      } catch (authErr) {
        console.warn('Could not inspect current Clerk user in GBP callback:', authErr);
      }

      // ── Step 5: Google Identity Mismatch Check for Business Email Flow ──
      // If user entered via business email onboarding, verify the authorised Google account matches
      if (isBusinessFlow && verifiedEhollerEmail) {
        const normalizedGoogle = googleEmail.trim().toLowerCase();
        const normalizedEholler = verifiedEhollerEmail.trim().toLowerCase();

        if (normalizedGoogle !== normalizedEholler) {
          console.warn(
            `[GBP Business Flow] Email mismatch: Google account (${normalizedGoogle}) does not match Eholler business account (${normalizedEholler})`
          );
          return failGbp('email_mismatch', {
            google_email: normalizedGoogle,
            expected_email: normalizedEholler,
          });
        }
      }

      // Persist GBP connection to Neon PostgreSQL isolated under GoogleServiceType.BUSINESS_PROFILE
      let savedConn: any = null;
      try {
        const orgScope = await getDefaultOrgScope();
        const expiresInSec = Number(tokenRes.data.expires_in) || 3600;
        savedConn = await orgScope.saveGoogleConnection({
          service: GoogleServiceType.BUSINESS_PROFILE,
          userId: currentDbUserId || undefined,
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
        console.warn('Could not persist encrypted GBP Google connection to database:', dbErr);
      }

      // Automatically discover GBP accounts and locations to display in onboarding
      let discoveredCount = 0;
      try {
        const orgScope = await getDefaultOrgScope();
        const { accounts, locations } = await listAllAccessibleGbpLocations(tokenRes.data.access_token);
        discoveredCount = locations.length;

        if (savedConn && locations.length > 0) {
          await orgScope.upsertGbpLocations(
            savedConn.id,
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

          // If exactly 1 location discovered, auto-select it for seamless UX
          if (locations.length === 1) {
            const singleDbLoc = await prisma.gbpLocation.findFirst({
              where: {
                googleConnectionId: savedConn.id,
                locationName: locations[0].locationName,
              },
            });
            if (singleDbLoc) {
              await orgScope.selectGbpLocation(singleDbLoc.id);
            }
          }
        }
      } catch (locErr) {
        console.warn('Auto-discovery of GBP locations failed (non-fatal, can retry):', locErr);
      }

      // Direct to Onboarding location selector or Dashboard
      const redirectUrl = isOnboarding
        ? redirectOnboarding(req, {
            status: 'discovered',
            connected: 'true',
            matched: isBusinessFlow ? 'true' : 'false',
            google_email: googleEmail,
            locations: String(discoveredCount),
          })
        : redirectHome(req, {
            activeTab: 'profile',
            gbp: 'connected',
            locations: String(discoveredCount),
          });

      const success = NextResponse.redirect(redirectUrl);
      applyGbpTokenCookies(
        {
          access_token: tokenRes.data.access_token,
          refresh_token: tokenRes.data.refresh_token,
          expires_in: tokenRes.data.expires_in,
        },
        success
      );

      success.cookies.set(GBP_COOKIE.state, '', gbpCookieOptions(0));
      success.cookies.set('gbp_oauth_meta', '', gbpCookieOptions(0));
      return success;
    } catch (err) {
      console.error('Google GBP OAuth callback error:', err);
      return failGbp('token_exchange_failed');
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
