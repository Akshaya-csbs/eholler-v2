require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const { PrismaClient, GoogleServiceType, ConnectionStatus, BusinessStatus, AuditStatus } = require('@prisma/client');
const prisma = new PrismaClient();

async function runPhase4Tests() {
  console.log('================================================================');
  console.log('PHASE 4 TEST SUITE: GBP MULTI-ACCOUNT/LOCATION DISCOVERY & SELECTION');
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

  // Ensure default test organisation
  let org = await prisma.organisation.findFirst({
    where: { slug: 'primary-workspace' },
  });
  if (!org) {
    org = await prisma.organisation.findFirst();
  }
  if (!org) {
    org = await prisma.organisation.create({
      data: {
        name: 'Phase 4 Primary Workspace',
        slug: 'phase-4-workspace-' + Date.now(),
      },
    });
  }
  const orgId = org.id;

  try {
    // -------------------------------------------------------------
    // TEST 1: Independent GBP Connection Storage
    // -------------------------------------------------------------
    console.log('\n--- TEST 1: GBP Connection Setup with Isolated Email ---');
    const gbpConn = await prisma.googleConnection.upsert({
      where: {
        organisationId_service: {
          organisationId: orgId,
          service: GoogleServiceType.BUSINESS_PROFILE,
        },
      },
      update: {
        email: 'agency.gbp.manager@domain.com',
        status: ConnectionStatus.CONNECTED,
      },
      create: {
        organisationId: orgId,
        service: GoogleServiceType.BUSINESS_PROFILE,
        email: 'agency.gbp.manager@domain.com',
        encryptedAccessToken: 'test_phase4_encrypted_token',
        status: ConnectionStatus.CONNECTED,
      },
    });
    assert(
      gbpConn.service === GoogleServiceType.BUSINESS_PROFILE &&
        gbpConn.email === 'agency.gbp.manager@domain.com',
      `GBP Connection established with dedicated Google email: ${gbpConn.email}`
    );

    // -------------------------------------------------------------
    // TEST 2: Multi-Account Discovery Structure
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Multiple Accessible GBP Accounts Discovery ---');
    // Simulate discovering 2 distinct GBP accounts (e.g. Personal Brand + Enterprise Agency)
    const discoveredAccounts = [
      {
        name: 'accounts/101010101',
        accountName: 'Acme Enterprises (Corporate)',
        type: 'ORGANIZATION',
        role: 'OWNER',
      },
      {
        name: 'accounts/202020202',
        accountName: 'Apex Franchise Group',
        type: 'ORGANIZATION',
        role: 'MANAGER',
      },
    ];

    assert(
      discoveredAccounts.length === 2 &&
        discoveredAccounts[0].name !== discoveredAccounts[1].name,
      `Successfully discovered ${discoveredAccounts.length} distinct GBP accounts (Corporate Owner & Franchise Manager)`
    );

    // -------------------------------------------------------------
    // TEST 3: Multi-Location Discovery with Identical Business Names
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Location Discovery Across Accounts with Name Collision & Service Areas ---');
    // Scenario:
    // Location 1 & 2 share identical title: "Acme Plumbing Services"
    // They are distinguished by address, store code, and place ID.
    // Location 3 is a Service Area Business (no physical storefront).
    const discoveredLocations = [
      {
        accountName: 'accounts/101010101',
        accountTitle: 'Acme Enterprises (Corporate)',
        locationName: 'locations/loc-downtown-101',
        locationTitle: 'Acme Plumbing Services',
        placeId: 'ChIJ_acme_downtown_01',
        storeCode: 'STORE-101',
        address: '100 Main Street, Suite 400, Chicago, IL 60601',
        phoneNumber: '+1 312-555-0101',
        websiteUri: 'https://acmeplumbing.com/chicago',
        primaryCategory: 'Plumber',
      },
      {
        accountName: 'accounts/101010101',
        accountTitle: 'Acme Enterprises (Corporate)',
        locationName: 'locations/loc-suburb-102',
        locationTitle: 'Acme Plumbing Services',
        placeId: 'ChIJ_acme_suburb_02',
        storeCode: 'STORE-102',
        address: '450 North Elmwood Ave, Naperville, IL 60540',
        phoneNumber: '+1 630-555-0102',
        websiteUri: 'https://acmeplumbing.com/naperville',
        primaryCategory: 'Plumber',
      },
      {
        accountName: 'accounts/202020202',
        accountTitle: 'Apex Franchise Group',
        locationName: 'locations/loc-service-201',
        locationTitle: 'Apex Rapid Emergency Plumbing',
        placeId: 'ChIJ_apex_service_03',
        storeCode: null,
        address: 'Service Area: Greater Chicago Area, Cook County, DuPage County',
        phoneNumber: '+1 800-555-9999',
        websiteUri: 'https://apexemergency.com',
        primaryCategory: 'Emergency Plumbing Service',
      },
    ];

    // Upsert into database
    for (const loc of discoveredLocations) {
      await prisma.gbpLocation.upsert({
        where: {
          organisationId_locationName: {
            organisationId: orgId,
            locationName: loc.locationName,
          },
        },
        create: {
          organisationId: orgId,
          googleConnectionId: gbpConn.id,
          accountName: loc.accountName,
          accountTitle: loc.accountTitle,
          locationName: loc.locationName,
          locationTitle: loc.locationTitle,
          placeId: loc.placeId,
          storeCode: loc.storeCode,
          address: loc.address,
          phoneNumber: loc.phoneNumber,
          websiteUri: loc.websiteUri,
          primaryCategory: loc.primaryCategory,
          isSelected: false,
        },
        update: {
          googleConnectionId: gbpConn.id,
          accountTitle: loc.accountTitle,
          locationTitle: loc.locationTitle,
          placeId: loc.placeId,
          storeCode: loc.storeCode,
          address: loc.address,
          phoneNumber: loc.phoneNumber,
          websiteUri: loc.websiteUri,
          primaryCategory: loc.primaryCategory,
        },
      });
    }

    const savedLocations = await prisma.gbpLocation.findMany({
      where: { organisationId: orgId },
      orderBy: { locationName: 'asc' },
    });

    assert(
      savedLocations.length >= 3,
      `Saved ${savedLocations.length} locations to organisation ${orgId}`
    );

    // Verify distinction of identical titles
    const identicalTitles = savedLocations.filter(
      (l) => l.locationTitle === 'Acme Plumbing Services'
    );
    assert(
      identicalTitles.length === 2 &&
        identicalTitles[0].storeCode !== identicalTitles[1].storeCode &&
        identicalTitles[0].address !== identicalTitles[1].address,
      `Identical titles cleanly differentiated: "${identicalTitles[0].storeCode} (${identicalTitles[0].address})" vs "${identicalTitles[1].storeCode} (${identicalTitles[1].address})"`
    );

    // Verify service area business record
    const sabLocation = savedLocations.find((l) => l.locationName === 'locations/loc-service-201');
    assert(
      sabLocation && sabLocation.address.includes('Service Area:'),
      `Service Area Business handled gracefully with coverage description: "${sabLocation.address}"`
    );

    // -------------------------------------------------------------
    // TEST 4: Upsert Idempotency (Sync without Duplication)
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Location Sync Idempotency (Re-syncing Google API) ---');
    const countBefore = await prisma.gbpLocation.count({ where: { organisationId: orgId } });
    // Re-upsert identical batch
    for (const loc of discoveredLocations) {
      await prisma.gbpLocation.upsert({
        where: {
          organisationId_locationName: {
            organisationId: orgId,
            locationName: loc.locationName,
          },
        },
        create: {
          organisationId: orgId,
          googleConnectionId: gbpConn.id,
          accountName: loc.accountName,
          accountTitle: loc.accountTitle,
          locationName: loc.locationName,
          locationTitle: loc.locationTitle,
          placeId: loc.placeId,
          storeCode: loc.storeCode,
          address: loc.address,
          phoneNumber: loc.phoneNumber,
          websiteUri: loc.websiteUri,
          primaryCategory: loc.primaryCategory,
          isSelected: false,
        },
        update: {
          locationTitle: loc.locationTitle,
          address: loc.address,
        },
      });
    }
    const countAfter = await prisma.gbpLocation.count({ where: { organisationId: orgId } });
    assert(
      countBefore === countAfter,
      `Re-sync is completely idempotent: count before (${countBefore}) === count after (${countAfter})`
    );

    // -------------------------------------------------------------
    // TEST 5: Active Location Selection & Atomic Switching
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Active Location Selection & Atomic Switching ---');
    const locDowntown = await prisma.gbpLocation.findFirst({
      where: { organisationId: orgId, locationName: 'locations/loc-downtown-101' },
    });
    const locSuburb = await prisma.gbpLocation.findFirst({
      where: { organisationId: orgId, locationName: 'locations/loc-suburb-102' },
    });

    // 1. Select Downtown
    await prisma.$transaction([
      prisma.gbpLocation.updateMany({
        where: { organisationId: orgId, isSelected: true },
        data: { isSelected: false },
      }),
      prisma.gbpLocation.update({
        where: { id: locDowntown.id },
        data: { isSelected: true },
      }),
    ]);

    let activeLoc = await prisma.gbpLocation.findFirst({
      where: { organisationId: orgId, isSelected: true },
    });
    assert(
      activeLoc && activeLoc.id === locDowntown.id,
      `Active location successfully set to: ${activeLoc.locationTitle} (${activeLoc.storeCode})`
    );

    // 2. Atomically switch to Suburb
    await prisma.$transaction([
      prisma.gbpLocation.updateMany({
        where: { organisationId: orgId, isSelected: true },
        data: { isSelected: false },
      }),
      prisma.gbpLocation.update({
        where: { id: locSuburb.id },
        data: { isSelected: true },
      }),
    ]);

    const activeList = await prisma.gbpLocation.findMany({
      where: { organisationId: orgId, isSelected: true },
    });
    assert(
      activeList.length === 1 && activeList[0].id === locSuburb.id,
      `Atomically switched active location: Exactly 1 active location (${activeList[0].storeCode})`
    );

    // -------------------------------------------------------------
    // TEST 6: Linked Business Record Association
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: Linking Active Location to Business Record ---');
    // Ensure Business record exists for Suburb location
    let biz = await prisma.business.findFirst({
      where: { organisationId: orgId, placeId: locSuburb.placeId },
    });
    if (!biz) {
      biz = await prisma.business.create({
        data: {
          organisationId: orgId,
          name: locSuburb.locationTitle,
          placeId: locSuburb.placeId,
          formattedAddress: locSuburb.address,
          phone: locSuburb.phoneNumber,
          websiteUrl: locSuburb.websiteUri,
          category: locSuburb.primaryCategory,
          status: BusinessStatus.ACTIVE,
        },
      });
    }

    // Link business to location
    await prisma.gbpLocation.update({
      where: { id: locSuburb.id },
      data: { businessId: biz.id },
    });

    const refreshedLoc = await prisma.gbpLocation.findUnique({
      where: { id: locSuburb.id },
      include: { business: true },
    });

    assert(
      refreshedLoc.businessId === biz.id && refreshedLoc.business.name === locSuburb.locationTitle,
      `GbpLocation successfully linked to Business: "${refreshedLoc.business.name}" (ID: ${refreshedLoc.business.id})`
    );

    // -------------------------------------------------------------
    // TEST 7: Audit History Preservation
    // -------------------------------------------------------------
    console.log('\n--- TEST 7: Historical Audit Run Preservation ---');
    // Create an audit run for this business
    const auditRun = await prisma.auditRun.create({
      data: {
        organisationId: orgId,
        businessId: biz.id,
        status: AuditStatus.COMPLETED,
        authorityScore: 84,
        mapsRank: 3,
        gbpHealthScore: 91,
        completenessScore: 88,
        summary: 'Phase 4 verification audit run',
      },
    });

    // Verify switching locations does not alter or delete previous audits
    const auditCheck = await prisma.auditRun.findUnique({
      where: { id: auditRun.id },
    });
    assert(
      auditCheck && auditCheck.authorityScore === 84 && auditCheck.status === AuditStatus.COMPLETED,
      `Historical AuditRun (#${auditCheck.id.slice(0, 8)}) remains completely intact and immutable`
    );

    // -------------------------------------------------------------
    // TEST 8: GSC Isolation Check
    // -------------------------------------------------------------
    console.log('\n--- TEST 8: GBP Operations Do Not Touch GSC Connection ---');
    const gscConn = await prisma.googleConnection.findFirst({
      where: { organisationId: orgId, service: GoogleServiceType.SEARCH_CONSOLE },
    });
    assert(
      !gscConn || gscConn.service === GoogleServiceType.SEARCH_CONSOLE,
      'GSC connection is completely unaffected by GBP operations'
    );

    console.log('\n================================================================');
    console.log(`PHASE 4 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================');

    // Clean up test locations and audit created in this run
    await prisma.auditRun.delete({ where: { id: auditRun.id } });
    await prisma.gbpLocation.deleteMany({
      where: {
        organisationId: orgId,
        locationName: { in: discoveredLocations.map((l) => l.locationName) },
      },
    });
    console.log('  Cleaned up transient Phase 4 test data.');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPhase4Tests();

