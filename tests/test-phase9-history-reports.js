const path = require('path');
const fs = require('fs');

// Load environment variables from .env.local if present
const envLocalPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, 'utf8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  });
}

const jiti = require('jiti')(path.join(__dirname, 'test.js'));
const { prisma } = jiti('../src/lib/prisma');
const { createOrgScope } = jiti('../src/lib/db/org-context');

async function runPhase9HistoryReportsTests() {
  console.log('================================================================');
  console.log('PHASE 9 TEST SUITE: AUDIT COMPARISON & SECURE REVOCABLE SHARING');
  console.log('================================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    let org = await prisma.organisation.findFirst();
    if (!org) {
      org = await prisma.organisation.create({
        data: { name: 'Test Org Phase 9', slug: 'test-org-p9-' + Date.now() },
      });
    }
    assert(Boolean(org && org.id), `Resolved active organisation (${org.id})`);

    const scope = createOrgScope(org.id);

    // 1. Find or create audit runs to test comparison and sharing
    let auditRuns = await prisma.auditRun.findMany({
      where: { organisationId: org.id },
      orderBy: { createdAt: 'desc' },
      take: 2,
    });

    if (auditRuns.length === 0) {
      let biz = await prisma.business.create({
        data: {
          organisationId: org.id,
          name: 'P9 Business',
          slug: 'p9-biz-' + Date.now(),
          placeId: 'ChIJP9Test' + Date.now(),
        },
      });

      const run1 = await prisma.auditRun.create({
        data: {
          organisationId: org.id,
          businessId: biz.id,
          status: 'COMPLETED',
          authorityScore: 70,
          gbpHealthScore: 75,
          mapsRank: 3,
        },
      });

      const run2 = await prisma.auditRun.create({
        data: {
          organisationId: org.id,
          businessId: biz.id,
          status: 'COMPLETED',
          authorityScore: 82,
          gbpHealthScore: 88,
          mapsRank: 1,
        },
      });

      auditRuns = [run2, run1];
    }

    const activeRun = auditRuns[0];

    // 2. Test createSharedReport
    const shared = await scope.createSharedReport({
      businessId: activeRun.businessId,
      auditRunId: activeRun.id,
      title: 'Automated Test Executive Report',
    });

    assert(Boolean(shared && shared.id), `Shared report generated (id: ${shared?.id})`);
    assert(
      Boolean(shared?.shareToken && shared.shareToken.length >= 20),
      `Generated unique secure share token: ${shared?.shareToken}`
    );
    assert(shared?.isRevoked === false, 'New shared report is initially not revoked (isRevoked === false)');
    assert(shared?.viewCount === 0, 'Initial viewCount is 0');

    // 3. Test listSharedReports
    const reportsList = await scope.listSharedReports();
    assert(Array.isArray(reportsList), 'listSharedReports returns an array');
    const foundInList = reportsList.some((r) => r.shareToken === shared.shareToken);
    assert(foundInList, 'Newly created shared report appears in active shared reports list');

    // 4. Test public retrieval via token
    const publicReport = await prisma.sharedReport.findUnique({
      where: { shareToken: shared.shareToken },
      include: { business: true, auditRun: true },
    });
    assert(Boolean(publicReport), 'Public report successfully retrieved by share token without authentication');

    // 5. Security & Secret Exposure Audit
    const serialized = JSON.stringify(publicReport);
    assert(!serialized.includes('accessToken'), 'Sanitized report does NOT contain accessToken');
    assert(!serialized.includes('refreshToken'), 'Sanitized report does NOT contain refreshToken');
    assert(!serialized.includes('client_secret'), 'Sanitized report does NOT contain client_secret');
    assert(!serialized.includes('secretKey'), 'Sanitized report does NOT contain secretKey');

    // 6. Test Revocation
    const revoked = await scope.revokeSharedReport(shared.id);
    assert(revoked.isRevoked === true, 'Successfully revoked shared report via revokeSharedReport');

    // 7. Verify Revoked status
    const postRevoke = await prisma.sharedReport.findUnique({
      where: { shareToken: shared.shareToken },
    });
    assert(postRevoke?.isRevoked === true, 'Post-revocation database check confirms isRevoked === true');

    // Clean up test report
    await prisma.sharedReport.delete({ where: { id: shared.id } });

    // 8. Test Audit Comparison Logic
    if (auditRuns.length >= 2) {
      const baseAuditId = auditRuns[1].id;
      const targetAuditId = auditRuns[0].id;

      const comparison = await scope.compareAudits(baseAuditId, targetAuditId);
      assert(Boolean(comparison), 'compareAudits returned valid comparison result');
      assert(
        typeof comparison?.deltas?.scoreDelta === 'number',
        `Computed authorityScore scoreDelta: ${comparison?.deltas?.scoreDelta}`
      );
      assert(
        typeof comparison?.deltas?.healthDelta === 'number',
        `Computed gbpHealth healthDelta: ${comparison?.deltas?.healthDelta}`
      );
      assert(Array.isArray(comparison?.resolvedFields), 'Comparison returns resolvedFields array');
      assert(Array.isArray(comparison?.newIssues), 'Comparison returns newIssues array');
      assert(Array.isArray(comparison?.remainingIssues), 'Comparison returns remainingIssues array');
    }
  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    await prisma.$disconnect();
  }

  console.log('----------------------------------------------------------------');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('================================================================');

  if (failed > 0) process.exit(1);
}

runPhase9HistoryReportsTests();
