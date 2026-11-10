import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveOrgScope } from '@/lib/db/default-org';

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const report = await prisma.sharedReport.findUnique({
      where: { shareToken: token },
      include: {
        business: true,
        auditRun: {
          include: {
            fieldAudits: true,
            aiRecommendations: true,
            snapshots: true,
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    if (report.isRevoked) {
      return NextResponse.json(
        { error: 'This shared report link has been revoked by the owner.' },
        { status: 410 }
      );
    }

    if (report.expiresAt && new Date() > report.expiresAt) {
      return NextResponse.json(
        { error: 'This shared report link has expired.' },
        { status: 410 }
      );
    }

    // Increment view counter non-blockingly
    prisma.sharedReport.update({
      where: { id: report.id },
      data: { viewCount: { increment: 1 } },
    }).catch((e) => console.warn('Could not increment report view count:', e));

    const audit = report.auditRun;
    const biz = report.business;

    // Extract sanitized snapshot data
    const placesSnapshot = audit.snapshots.find((s) => s.sourceType === 'GOOGLE_PLACES');
    const webSnapshot = audit.snapshots.find((s) => s.sourceType === 'WEBSITE');
    const placesMeta = (placesSnapshot?.metadata as any) || {};
    const websiteData = (webSnapshot?.rawData as any) || undefined;

    const competitors = (placesMeta.directCompetitors || placesMeta.competitors || []).map((c: any) => ({
      name: c.name,
      rating: c.rating,
      reviews: c.reviews,
      category: c.category,
      address: c.address,
      rationale: c.rationale,
      classification: c.classification,
    }));

    // Return strictly sanitized data for public view
    return NextResponse.json({
      success: true,
      report: {
        title: report.title,
        auditDate: audit.createdAt,
        business: {
          name: biz.name,
          city: biz.city,
          address: biz.formattedAddress,
          category: biz.category,
          websiteUrl: biz.websiteUrl,
          rating: biz.rating,
          reviewCount: biz.reviewCount,
        },
        scores: {
          authorityScore: audit.authorityScore,
          mapsRank: audit.mapsRank,
          gbpHealthScore: audit.gbpHealthScore,
          completenessScore: audit.completenessScore,
          technicalScore: websiteData?.technicalScore,
          onPageScore: websiteData?.onPageScore,
          missingFieldsCount: audit.missingFieldsCount,
          inconsistentFieldsCount: audit.inconsistentFieldsCount,
        },
        fieldAuditsSummary: {
          total: audit.fieldAudits.length,
          optimized: audit.fieldAudits.filter((f) => f.status === 'NO_CHANGES_REQUIRED').length,
          missing: audit.fieldAudits.filter((f) => f.status === 'MISSING').length,
          needsImprovement: audit.fieldAudits.filter((f) => f.status === 'NEEDS_IMPROVEMENT').length,
          unableToVerify: audit.fieldAudits.filter((f) => f.status === 'UNABLE_TO_VERIFY').length,
        },
        priorityRecommendations: audit.aiRecommendations.map((r) => ({
          issueTitle: r.issueTitle,
          category: r.category.toLowerCase(),
          evidence: r.evidence,
          severity: r.severity.toLowerCase(),
          explanation: r.explanation,
          recommendedAction: r.recommendedAction,
          estimatedEffort: r.estimatedEffort.toLowerCase(),
          status: r.status,
        })),
        competitors,
        websiteOverview: websiteData
          ? {
              isHttps: websiteData.isHttps,
              statusCode: websiteData.statusCode,
              hasLocalBusinessSchema: websiteData.hasLocalBusinessSchema,
              hasPhoneMatch: websiteData.hasPhoneMatch,
              hasAddressMatch: websiteData.hasAddressMatch,
              h1Count: websiteData.h1Headings?.length || 0,
              loadTimeMs: websiteData.loadTimeMs,
            }
          : undefined,
      },
    });
  } catch (err: any) {
    console.error('Error retrieving shared report:', err);
    return NextResponse.json(
      { error: 'Failed to retrieve shared report. The link may be invalid or expired.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const orgIdHeader = req.headers.get('x-organisation-id');
    const orgScope = await resolveOrgScope(orgIdHeader);

    const token = params.token;
    const report = await prisma.sharedReport.findFirst({
      where: { shareToken: token, organisationId: orgScope.organisationId },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const updated = await orgScope.revokeSharedReport(report.id);

    return NextResponse.json({
      success: true,
      message: 'Report access revoked successfully',
      isRevoked: updated.isRevoked,
    });
  } catch (err: any) {
    console.error('Error revoking report link:', err);
    return NextResponse.json(
      { error: 'Failed to revoke shared report' },
      { status: 500 }
    );
  }
}

