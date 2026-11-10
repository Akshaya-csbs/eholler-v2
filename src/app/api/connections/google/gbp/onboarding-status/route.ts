import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { getDefaultOrgScope } from '@/lib/db/default-org';
import { isGoogleOAuthConfigured } from '@/lib/gbp-config';
import { getValidGbpAccessToken } from '@/lib/gbp-tokens';
import { classifyUserEmail } from '@/lib/auth/email-classification';
import { GoogleServiceType } from '@prisma/client';

/**
 * GET /api/connections/google/gbp/onboarding-status
 * 
 * Provides complete server-side intelligence for the GBP onboarding flow:
 * 1. Retrieves the authenticated Clerk user's verified primary email.
 * 2. Classifies the email as 'business' (custom domain) or 'personal' (public provider).
 * 3. Inspects Neon PostgreSQL for an active, authorized GBP connection.
 * 4. Checks whether the authorized Google email matches the verified Eholler business email.
 * 5. Returns whether an existing matching connection can be reused (skipping OAuth).
 */
export async function GET() {
  const { userId: clerkUserId } = auth();

  if (!clerkUserId) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  try {
    const clerkUser = await currentUser();
    const primaryEmailObj = clerkUser?.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId
    );
    const verifiedEmail = (primaryEmailObj?.emailAddress || clerkUser?.emailAddresses[0]?.emailAddress || '').trim().toLowerCase();
    const isEmailVerified = primaryEmailObj?.verification?.status === 'verified';

    if (!verifiedEmail) {
      return NextResponse.json({ error: 'No email address found for session' }, { status: 400 });
    }

    // Lookup User record in Neon
    const dbUser = await prisma.user.findFirst({
      where: {
        OR: [{ clerkId: clerkUserId }, { email: verifiedEmail }],
      },
    });

    // Classify user email using maintainable classification utility
    const classification = classifyUserEmail(verifiedEmail, {
      accountType: dbUser?.accountType,
      companyName: dbUser?.companyName,
    });

    const orgScope = await getDefaultOrgScope();
    const conn = await orgScope.getGbpConnection();

    let isTokenValid = false;
    let locationsCount = 0;
    let activeLocation: any = null;

    if (conn && conn.status === 'CONNECTED') {
      const token = await getValidGbpAccessToken();
      isTokenValid = Boolean(token);

      const dbLocations = await orgScope.listGbpLocations();
      locationsCount = dbLocations.length;
      activeLocation = await orgScope.getSelectedGbpLocation();
    }

    const googleEmail = conn?.email ? conn.email.trim().toLowerCase() : null;
    const isEmailMatch = Boolean(googleEmail && googleEmail === verifiedEmail);
    const hasMatchingConnection = Boolean(conn && conn.status === 'CONNECTED' && isEmailMatch && isTokenValid);

    return NextResponse.json({
      success: true,
      email: verifiedEmail,
      isEmailVerified,
      classification: classification.classification,
      isCustomDomain: classification.isCustomDomain,
      accountType: dbUser?.accountType || null,
      classificationReason: classification.reason,
      oauthConfigured: isGoogleOAuthConfigured(),
      hasConnection: Boolean(conn && conn.status === 'CONNECTED'),
      googleEmail: conn?.email || null,
      isEmailMatch,
      hasMatchingConnection,
      isTokenValid,
      locationsCount,
      activeLocation: activeLocation
        ? {
            id: activeLocation.id,
            locationTitle: activeLocation.locationTitle,
            address: activeLocation.address,
            placeId: activeLocation.placeId,
            primaryCategory: activeLocation.primaryCategory,
          }
        : null,
    });
  } catch (err: any) {
    console.error('Error in GBP onboarding-status:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to determine GBP onboarding status' },
      { status: 500 }
    );
  }
}

