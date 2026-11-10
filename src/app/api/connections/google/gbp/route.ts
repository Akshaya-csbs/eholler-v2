import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { auth, currentUser } from '@clerk/nextjs/server';
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
 * Supports:
 * - Flow A: Personal email manual connection (prompts user to connect any GBP manager account)
 * - Flow B: Business email automatic connection (pre-fills verified business email with login_hint)
 * - Settings reconnection / account switching (prompt=select_account)
 */
export async function GET(req: NextRequest) {
  const from = req.nextUrl.searchParams.get('from');
  const requestedFlow = req.nextUrl.searchParams.get('flow'); // 'business' | 'personal'
  const promptParam = req.nextUrl.searchParams.get('prompt'); // 'consent' | 'select_account'
  let clientLoginHint = req.nextUrl.searchParams.get('login_hint')?.trim();

  const failRedirect = (errorParam: string) => {
    if (from === 'onboarding') {
      const onboard = new URL('/connect-gbp', req.nextUrl.origin);
      onboard.searchParams.set('error', errorParam);
      return NextResponse.redirect(onboard);
    }
    const home = new URL('/', req.nextUrl.origin);
    home.searchParams.set('activeTab', 'profile');
    home.searchParams.set('gbp_error', errorParam);
    return NextResponse.redirect(home);
  };

  if (!isGoogleOAuthConfigured()) {
    return failRedirect('oauth_not_configured');
  }

  // Retrieve authenticated Clerk user session on server
  let verifiedEmail: string | null = null;
  try {
    const clerkUser = await currentUser();
    const primary = clerkUser?.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId
    );
    if (primary && primary.verification?.status === 'verified') {
      verifiedEmail = primary.emailAddress.trim().toLowerCase();
    } else if (clerkUser?.emailAddresses[0]) {
      verifiedEmail = clerkUser.emailAddresses[0].emailAddress.trim().toLowerCase();
    }
  } catch (err) {
    console.warn('Could not inspect current Clerk user for GBP initiation:', err);
  }

  const isBusinessFlow = requestedFlow === 'business';
  const effectiveLoginHint = isBusinessFlow
    ? verifiedEmail || clientLoginHint || undefined
    : clientLoginHint || undefined;

  // Determine prompt strategy:
  // - Default: 'consent' to guarantee offline refresh_token issuance
  // - If user is retrying or explicitly switching: 'select_account consent'
  const promptValue = promptParam === 'select_account' ? 'select_account consent' : 'consent';

  // Construct prefix that encapsulates the flow context
  const nonce = crypto.randomBytes(20).toString('hex');
  let state = `gbp_${nonce}`;
  if (from === 'onboarding') {
    state = isBusinessFlow ? `gbp_onboarding_biz_${nonce}` : `gbp_onboarding_pers_${nonce}`;
  } else if (isBusinessFlow) {
    state = `gbp_biz_${nonce}`;
  }

  const redirectUri = getGbpRedirectUri(req);

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID as string,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GBP_SCOPES,
    access_type: 'offline',
    prompt: promptValue,
    include_granted_scopes: 'true',
    state,
  });

  if (effectiveLoginHint) {
    params.set('login_hint', effectiveLoginHint);
  }

  const authUrl = `${GOOGLE_AUTH_URL}?${params.toString()}`;
  const res = NextResponse.redirect(authUrl);

  // Store CSRF state cookie (10 minutes)
  res.cookies.set(GBP_COOKIE.state, state, gbpCookieOptions(600));

  // Store metadata cookie to help callback verify flow context and expected email
  const flowMeta = JSON.stringify({
    flow: isBusinessFlow ? 'business' : 'personal',
    from: from || 'settings',
    expectedEmail: isBusinessFlow ? verifiedEmail : null,
  });
  res.cookies.set('gbp_oauth_meta', Buffer.from(flowMeta).toString('base64'), gbpCookieOptions(600));

  return res;
}
