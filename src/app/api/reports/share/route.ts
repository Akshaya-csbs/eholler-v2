import { NextRequest, NextResponse } from 'next/server';
import { resolveOrgScope } from '@/lib/db/default-org';

/**
 * POST /api/reports/share
 * Creates a secure, revocable public report link.
 */
export async function POST(req: NextRequest) {
  try {
    const orgIdHeader = req.headers.get('x-organisation-id');
    const orgScope = await resolveOrgScope(orgIdHeader);

    const body = await req.json();
    const { businessId, auditRunId, title, expiresInDays } = body;

    if (!businessId || !auditRunId) {
      return NextResponse.json(
        { error: 'businessId and auditRunId are required to generate a shared report.' },
        { status: 400 }
      );
    }

    let expiresAt: Date | undefined = undefined;
    if (expiresInDays && typeof expiresInDays === 'number' && expiresInDays > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    const report = await orgScope.createSharedReport({
      businessId,
      auditRunId,
      title: title || 'Local SEO Audit Executive Summary',
      expiresAt,
    });

    const origin = req.nextUrl.origin;
    const shareUrl = `${origin}/reports/share/${report.shareToken}`;

    return NextResponse.json({
      success: true,
      report: {
        id: report.id,
        shareToken: report.shareToken,
        shareUrl,
        title: report.title,
        createdAt: report.createdAt,
        expiresAt: report.expiresAt,
        isRevoked: report.isRevoked,
      },
    });
  } catch (err: any) {
    console.error('Error generating shared report link:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to generate shared report' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reports/share
 * Lists all active shared reports for the current organisation.
 */
export async function GET(req: NextRequest) {
  try {
    const orgIdHeader = req.headers.get('x-organisation-id');
    const orgScope = await resolveOrgScope(orgIdHeader);

    const businessId = req.nextUrl.searchParams.get('businessId') || undefined;
    const reports = await orgScope.listSharedReports(businessId);
    const origin = req.nextUrl.origin;

    return NextResponse.json({
      reports: reports.map((r) => ({
        id: r.id,
        shareToken: r.shareToken,
        shareUrl: `${origin}/reports/share/${r.shareToken}`,
        title: r.title,
        businessName: r.business.name,
        auditDate: r.auditRun.createdAt,
        authorityScore: r.auditRun.authorityScore,
        viewCount: r.viewCount,
        isRevoked: r.isRevoked,
        expiresAt: r.expiresAt,
        createdAt: r.createdAt,
      })),
    });
  } catch (err: any) {
    console.error('Error listing shared reports:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to list shared reports' },
      { status: 500 }
    );
  }
}

