import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { syncCurrentUser } from '@/lib/auth/user-sync';
import { classifyUserEmail } from '@/lib/auth/email-classification';

/**
 * GET /api/user/profile
 * Returns the current authenticated user's profile details.
 */
export async function GET() {
  const { userId: clerkUserId } = auth();

  if (!clerkUserId) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  try {
    let dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!dbUser) {
      const synced = await syncCurrentUser();
      if (synced) {
        dbUser = await prisma.user.findUnique({
          where: { id: synced.id },
        });
      }
    }

    if (!dbUser) {
      return NextResponse.json({ error: 'User record not found.' }, { status: 404 });
    }

    const classification = classifyUserEmail(dbUser.email, {
      accountType: dbUser.accountType,
      companyName: dbUser.companyName,
    });

    return NextResponse.json({
      success: true,
      profile: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        avatarUrl: dbUser.avatarUrl,
        phoneNumber: dbUser.phoneNumber,
        jobTitle: dbUser.jobTitle,
        companyName: dbUser.companyName,
        country: dbUser.country,
        accountType: dbUser.accountType || null,
        emailClassification: classification.classification,
        isCustomDomain: classification.isCustomDomain,
        isProfileCompleted: Boolean(dbUser.isProfileCompleted),
      },
    });
  } catch (err: any) {
    console.error('[/api/user/profile GET] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch user profile.' }, { status: 500 });
  }
}

/**
 * POST /api/user/profile
 * Validates and updates user profile information on both Prisma and Clerk.
 */
export async function POST(req: NextRequest) {
  const { userId: clerkUserId } = auth();

  if (!clerkUserId) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, phoneNumber, jobTitle, companyName, country, avatarUrl, accountType } = body;

    // 1. Server-side validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Full name is required (minimum 2 characters).' },
        { status: 400 }
      );
    }

    const trimmedName = name.trim().slice(0, 100);
    const trimmedPhone = typeof phoneNumber === 'string' ? phoneNumber.trim().slice(0, 30) : null;
    const trimmedJob = typeof jobTitle === 'string' ? jobTitle.trim().slice(0, 100) : null;
    const trimmedCompany = typeof companyName === 'string' ? companyName.trim().slice(0, 120) : null;
    const trimmedCountry = typeof country === 'string' ? country.trim().slice(0, 80) : null;
    const trimmedAvatar = typeof avatarUrl === 'string' && avatarUrl.trim() ? avatarUrl.trim() : null;
    const normalizedAccountType =
      accountType === 'BUSINESS' || accountType === 'PERSONAL' ? accountType : undefined;

    // 2. Ensure Prisma User is synced
    let dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!dbUser) {
      const synced = await syncCurrentUser();
      if (synced) {
        dbUser = await prisma.user.findUnique({
          where: { id: synced.id },
        });
      }
    }

    if (!dbUser) {
      return NextResponse.json({ error: 'User record not found.' }, { status: 404 });
    }

    // 3. Update Prisma User record
    const updatedUser = await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        name: trimmedName,
        phoneNumber: trimmedPhone || null,
        jobTitle: trimmedJob || null,
        companyName: trimmedCompany || null,
        country: trimmedCountry || null,
        avatarUrl: trimmedAvatar || dbUser.avatarUrl,
        accountType: normalizedAccountType !== undefined ? normalizedAccountType : dbUser.accountType,
        isProfileCompleted: true,
      },
    });

    // 4. Update default Organisation name if user provided company name
    if (trimmedCompany) {
      try {
        const membership = await prisma.organisationMembership.findFirst({
          where: { userId: dbUser.id },
          include: { organisation: true },
        });

        if (
          membership &&
          (membership.organisation.name === 'Default Workspace' ||
            membership.organisation.name === 'Personal Workspace')
        ) {
          await prisma.organisation.update({
            where: { id: membership.organisationId },
            data: { name: trimmedCompany },
          });
        }
      } catch (orgErr) {
        console.warn('Could not update organisation name from companyName (non-fatal):', orgErr);
      }
    }

    // 5. Sync name to Clerk backend
    try {
      const parts = trimmedName.split(' ');
      const firstName = parts[0] || trimmedName;
      const lastName = parts.slice(1).join(' ') || undefined;

      const client = typeof clerkClient === 'function' ? clerkClient() : clerkClient;
      if (client?.users?.updateUser) {
        await client.users.updateUser(clerkUserId, {
          firstName,
          lastName,
        });
      }
    } catch (clerkErr) {
      console.warn('Could not sync name to Clerk user object (non-fatal):', clerkErr);
    }

    return NextResponse.json({
      success: true,
      profile: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        avatarUrl: updatedUser.avatarUrl,
        phoneNumber: updatedUser.phoneNumber,
        jobTitle: updatedUser.jobTitle,
        companyName: updatedUser.companyName,
        country: updatedUser.country,
        isProfileCompleted: Boolean(updatedUser.isProfileCompleted),
      },
    });
  } catch (err: any) {
    console.error('[/api/user/profile POST] Error:', err);
    return NextResponse.json({ error: 'Failed to save profile information.' }, { status: 500 });
  }
}

