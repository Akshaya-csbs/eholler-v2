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

async function runPhase8RecommendationTests() {
  console.log('================================================================');
  console.log('PHASE 8 TEST SUITE: ACTIONABLE RECOMMENDATIONS & STATUS TRACKING');
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
    // 1. Verify Prisma Enum
    const { RecommendationStatus } = require('@prisma/client');
    assert(RecommendationStatus !== undefined, 'RecommendationStatus enum is exported by Prisma client');
    assert(RecommendationStatus.PENDING === 'PENDING', 'Enum contains PENDING');
    assert(RecommendationStatus.IN_PROGRESS === 'IN_PROGRESS', 'Enum contains IN_PROGRESS');
    assert(RecommendationStatus.COMPLETED === 'COMPLETED', 'Enum contains COMPLETED');
    assert(RecommendationStatus.DISMISSED === 'DISMISSED', 'Enum contains DISMISSED');

    // 2. Query default organisation from DB
    let org = await prisma.organisation.findFirst();
    if (!org) {
      org = await prisma.organisation.create({
        data: { name: 'Test Org', slug: 'test-org-' + Date.now() },
      });
    }
    assert(Boolean(org && org.id), `Resolved active organisation (orgId: ${org.id})`);

    const scope = createOrgScope(org.id);

    // 3. Find or create a test recommendation to test status transitions
    let testRec = await prisma.aIRecommendation.findFirst({
      where: { organisationId: org.id },
    });

    if (!testRec) {
      // Find or create an audit run to attach to
      let auditRun = await prisma.auditRun.findFirst({
        where: { organisationId: org.id },
      });

      if (!auditRun) {
        let biz = await prisma.business.findFirst({ where: { organisationId: org.id } });
        if (!biz) {
          biz = await prisma.business.create({
            data: {
              organisationId: org.id,
              name: 'Test Business',
              slug: 'test-biz-' + Date.now(),
              placeId: 'ChIJTestPlaceId' + Date.now(),
            },
          });
        }

        auditRun = await prisma.auditRun.create({
          data: {
            organisationId: org.id,
            businessId: biz.id,
            status: 'COMPLETED',
            authorityScore: 78,
            gbpHealthScore: 82,
            mapsRank: 2,
          },
        });
      }

      testRec = await prisma.aIRecommendation.create({
        data: {
          organisationId: org.id,
          auditRunId: auditRun.id,
          businessId: auditRun.businessId,
          category: 'MISSING_SEO_FIELD',
          severity: 'HIGH',
          issueTitle: 'Verify Primary Service Categories Test',
          explanation: 'Ensure commercial service match on listing.',
          recommendedAction: 'Update primary category in Google Business Profile.',
          evidence: 'Maps API category mismatch.',
          estimatedEffort: 'QUICK_WIN',
          status: 'PENDING',
        },
      });
    }

    if (testRec) {
      assert(true, `Found test recommendation (id: ${testRec.id}, initial status: ${testRec.status})`);

      // 4. Test Transition to IN_PROGRESS
      const updatedInProgress = await scope.updateRecommendationStatus(
        testRec.id,
        'IN_PROGRESS'
      );
      assert(
        updatedInProgress && updatedInProgress.status === 'IN_PROGRESS',
        'Successfully transitioned recommendation status to IN_PROGRESS'
      );

      // 5. Test Transition to COMPLETED
      const updatedCompleted = await scope.updateRecommendationStatus(
        testRec.id,
        'COMPLETED'
      );
      assert(
        updatedCompleted && updatedCompleted.status === 'COMPLETED',
        'Successfully transitioned recommendation status to COMPLETED'
      );

      // 6. Test Transition to DISMISSED
      const updatedDismissed = await scope.updateRecommendationStatus(
        testRec.id,
        'DISMISSED'
      );
      assert(
        updatedDismissed && updatedDismissed.status === 'DISMISSED',
        'Successfully transitioned recommendation status to DISMISSED'
      );

      // 7. Reset back to PENDING
      const resetPending = await scope.updateRecommendationStatus(
        testRec.id,
        'PENDING'
      );
      assert(
        resetPending && resetPending.status === 'PENDING',
        'Successfully reset recommendation status back to PENDING'
      );

      // 8. Test listRecommendations filtering
      const pendingList = await scope.listRecommendations({ status: 'PENDING' });
      assert(Array.isArray(pendingList), 'listRecommendations returns an array for status PENDING');
      const foundInPending = pendingList.some((r) => r.id === testRec.id);
      assert(foundInPending, 'Test recommendation is present in PENDING filtered results');

      // 9. Test Tenant Isolation: Attempt update with scope for another organisationId
      const fakeOrg = await prisma.organisation.create({
        data: { name: 'Foreign Org', slug: 'foreign-org-' + Date.now() },
      });
      const foreignScope = createOrgScope(fakeOrg.id);
      let crossOrgBlocked = false;
      try {
        await foreignScope.updateRecommendationStatus(testRec.id, 'COMPLETED');
      } catch (e) {
        crossOrgBlocked = true;
      }
      assert(
        crossOrgBlocked,
        'Tenant isolation enforced: cross-organisation recommendation update threw access error'
      );
      await prisma.organisation.delete({ where: { id: fakeOrg.id } });
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

runPhase8RecommendationTests();
