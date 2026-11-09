import { NextRequest, NextResponse } from 'next/server';
import { getDefaultOrgScope } from '@/lib/db/default-org';
import { prisma } from '@/lib/prisma';
import { GBP_COOKIE, gbpCookieOptions } from '@/lib/gbp-config';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { locationId } = body;

    if (!locationId || typeof locationId !== 'string') {
      return NextResponse.json({ error: 'locationId is required' }, { status: 400 });
    }

    const orgScope = await getDefaultOrgScope();
    const location = await prisma.gbpLocation.findFirst({
      where: { id: locationId, organisationId: orgScope.organisationId },
    });

    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    // If location is not yet linked to a Business record, find or create one in this organisation
    let businessId = location.businessId;
    if (!businessId) {
      let existingBiz = null;
      if (location.placeId) {
        existingBiz = await prisma.business.findFirst({
          where: { organisationId: orgScope.organisationId, placeId: location.placeId },
        });
      }
      if (!existingBiz && location.locationTitle) {
        existingBiz = await prisma.business.findFirst({
          where: { organisationId: orgScope.organisationId, name: location.locationTitle },
        });
      }

      if (existingBiz) {
        businessId = existingBiz.id;
      } else {
        const newBiz = await orgScope.upsertBusiness({
          name: location.locationTitle,
          placeId: location.placeId || undefined,
          formattedAddress: location.address || undefined,
          phone: location.phoneNumber || undefined,
          websiteUrl: location.websiteUri || undefined,
          category: location.primaryCategory || undefined,
          mapUrl: location.placeId
            ? `https://www.google.com/maps/place/?q=place_id:${location.placeId}`
            : undefined,
        });
        businessId = newBiz.id;
      }
    }

    const [, updatedLocation] = await orgScope.selectGbpLocation(locationId, businessId || undefined);

    const res = NextResponse.json({
      success: true,
      location: updatedLocation,
    });

    // Also persist location ID into cookie for easy synchronous resolution
    res.cookies.set(GBP_COOKIE.location, locationId, gbpCookieOptions(60 * 60 * 24 * 60)); // 60 days
    return res;
  } catch (err: any) {
    console.error('Error selecting GBP location:', err);
    return NextResponse.json(
      { error: 'selection_failed', message: err.message || 'Failed to select location' },
      { status: 500 }
    );
  }
}

