import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

/**
 * Public routes that do not require authentication.
 * All authentication pages, OAuth callbacks, and the existing Google OAuth callback are public.
 */
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/verify-email(.*)',
  '/create-password(.*)',
  '/forgot-password(.*)',
  '/reset-password(.*)',
  '/sso-callback(.*)',
  '/api/connections/google/callback(.*)',
]);

export default clerkMiddleware((auth, request) => {
  // Public report access is strictly limited to GET requests with a valid token
  const isPublicReportGet =
    request.method === 'GET' &&
    (request.nextUrl.pathname.startsWith('/reports/share/') ||
      /^\/api\/reports\/share\/[^/]+$/.test(request.nextUrl.pathname));

  if (!isPublicRoute(request) && !isPublicReportGet) {
    auth().protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};

