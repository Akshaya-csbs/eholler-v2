import { prisma } from '@/lib/prisma';
import { createOrgScope, OrgScope } from '@/lib/db/org-context';

const PRIMARY_WORKSPACE_SLUG = 'primary-workspace';
const PRIMARY_WORKSPACE_NAME = 'Primary Workspace';

/**
 * Resolves or initializes the single workspace organisation for the application.
 * All businesses, audits, and connections are scoped to this workspace.
 */
export async function getOrCreateDefaultOrganisation() {
  // Check for primary workspace first, then legacy default-org
  let org = await prisma.organisation.findFirst({
    where: {
      OR: [{ slug: PRIMARY_WORKSPACE_SLUG }, { slug: 'default-org' }],
    },
  });

  if (!org) {
    org = await prisma.organisation.create({
      data: {
        name: PRIMARY_WORKSPACE_NAME,
        slug: PRIMARY_WORKSPACE_SLUG,
      },
    });
  }

  return org;
}

/**
 * Returns a scoped data-isolation context for the primary workspace.
 */
export async function getDefaultOrgScope(): Promise<OrgScope> {
  const org = await getOrCreateDefaultOrganisation();
  return createOrgScope(org.id);
}

/**
 * Resolves the organisation scope for an API request.
 * Security & Multi-Tenant Isolation:
 * - If the request is from an authenticated Clerk user, we verify that the user actually
 *   has an active OrganisationMembership for the requested organisationId.
 * - Under no circumstances is an unverified frontend-supplied organisationId trusted.
 * - If the requested organisationId does not belong to the user, access is blocked and
 *   scoped to the user's verified primary organisation.
 * - For unauthenticated or background contexts, it safely defaults to the primary workspace.
 */
export async function resolveOrgScope(organisationId?: string | null): Promise<OrgScope> {
  let clerkUserId: string | null = null;
  try {
    const { auth } = await import('@clerk/nextjs/server');
    const session = auth();
    clerkUserId = session?.userId || null;
  } catch {
    // Outside active Next.js request context (e.g., CLI test runner)
    clerkUserId = null;
  }

  if (clerkUserId) {
    const dbUser = await prisma.user.findFirst({
      where: { clerkId: clerkUserId },
      include: {
        memberships: {
          include: { organisation: true },
        },
      },
    });

    if (dbUser && dbUser.memberships.length > 0) {
      if (organisationId) {
        const matchingMembership = dbUser.memberships.find(
          (m) => m.organisationId === organisationId
        );
        if (matchingMembership) {
          return createOrgScope(matchingMembership.organisationId);
        }
        // Attacker or misconfigured client supplied an organisation they do not belong to
        console.warn(
          `[Multi-Tenant Security Alert] User ${dbUser.id} attempted to access unauthorized organisation ${organisationId}`
        );
      }
      // Safely scope to the authenticated user's first legitimate organisation
      return createOrgScope(dbUser.memberships[0].organisationId);
    }
  }

  // Fallback for unauthenticated requests or background tasks (never accept arbitrary organisationId without verified auth)
  return getDefaultOrgScope();
}
