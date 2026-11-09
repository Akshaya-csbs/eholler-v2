require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const { PrismaClient, GoogleServiceType, ConnectionStatus } = require('@prisma/client');
const prisma = new PrismaClient();

async function runGbpIntegrationTests() {
  console.log('================================================================');
  console.log('TEST SUITE: GOOGLE BUSINESS PROFILE (GBP) ISOLATION & DATA ACCESS');
  console.log('================================================================');

  let defaultOrg = await prisma.organisation.findFirst();
  if (!defaultOrg) {
    defaultOrg = await prisma.organisation.create({
      data: {
        name: 'Test Org GBP',
        slug: 'test-org-gbp-' + Date.now(),
      },
    });
  }

  const orgId = defaultOrg.id;
  let testGbpConn = null;
  let testGscConn = null;
  let testLocation = null;

  try {
    // -------------------------------------------------------------
    // TEST 1: ISOLATED CONNECTIONS PER SERVICE
    // -------------------------------------------------------------
    console.log('\n--- TEST 1: GBP & GSC SERVICE CONNECTION ISOLATION ---');

    // Create a GSC connection with email user1@company.com
    testGscConn = await prisma.googleConnection.upsert({
      where: {
        organisationId_service: {
          organisationId: orgId,
          service: GoogleServiceType.SEARCH_CONSOLE,
        },
      },
      update: {
        email: 'user1@company.com',
        status: ConnectionStatus.CONNECTED,
      },
      create: {
        organisationId: orgId,
        service: GoogleServiceType.SEARCH_CONSOLE,
        email: 'user1@company.com',
        encryptedAccessToken: 'dummy_gsc_token',
        status: ConnectionStatus.CONNECTED,
      },
    });
    console.log('  [PASS] GSC Connection saved under SEARCH_CONSOLE with email: user1@company.com');

    // Create a GBP connection with a DIFFERENT or SAME email (user2@gmail.com)
    testGbpConn = await prisma.googleConnection.upsert({
      where: {
        organisationId_service: {
          organisationId: orgId,
          service: GoogleServiceType.BUSINESS_PROFILE,
        },
      },
      update: {
        email: 'user2@gmail.com',
        status: ConnectionStatus.CONNECTED,
      },
      create: {
        organisationId: orgId,
        service: GoogleServiceType.BUSINESS_PROFILE,
        email: 'user2@gmail.com',
        encryptedAccessToken: 'dummy_gbp_token',
        status: ConnectionStatus.CONNECTED,
      },
    });
    console.log('  [PASS] GBP Connection saved under BUSINESS_PROFILE with email: user2@gmail.com');

    // Verify both exist independently in database
    const gscLookup = await prisma.googleConnection.findUnique({
      where: {
        organisationId_service: {
          organisationId: orgId,
          service: GoogleServiceType.SEARCH_CONSOLE,
        },
      },
    });
    const gbpLookup = await prisma.googleConnection.findUnique({
      where: {
        organisationId_service: {
          organisationId: orgId,
          service: GoogleServiceType.BUSINESS_PROFILE,
        },
      },
    });

    if (gscLookup && gbpLookup && gscLookup.id !== gbpLookup.id) {
      console.log('  [PASS] GSC and GBP connections coexist independently without overwriting');
    } else {
      throw new Error('Connections collided or overwritten!');
    }

    // -------------------------------------------------------------
    // TEST 2: GBP LOCATIONS UPSERTION & ISOLATION
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: GBP LOCATIONS UPSERTION ---');

    testLocation = await prisma.gbpLocation.upsert({
      where: {
        organisationId_locationName: {
          organisationId: orgId,
          locationName: 'locations/test-10101',
        },
      },
      update: {
        locationTitle: 'Acme Test Business - Downtown',
      },
      create: {
        organisationId: orgId,
        googleConnectionId: testGbpConn.id,
        accountName: 'accounts/1234567890',
        accountTitle: 'Acme Corporation',
        locationName: 'locations/test-10101',
        locationTitle: 'Acme Test Business - Downtown',
        placeId: 'ChIJTestPlace101',
        address: '123 Test Street, New York, NY 10001',
        phoneNumber: '+1-555-0199',
        primaryCategory: 'HVAC Contractor',
        isSelected: false,
      },
    });
    console.log('  [PASS] GbpLocation created and linked to googleConnectionId:', testLocation.id);

    // -------------------------------------------------------------
    // TEST 3: ATOMIC SINGLE-SELECTION IN WORKSPACE
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: ATOMIC SINGLE LOCATION SELECTION ---');

    // Create second location
    const testLocation2 = await prisma.gbpLocation.upsert({
      where: {
        organisationId_locationName: {
          organisationId: orgId,
          locationName: 'locations/test-20202',
        },
      },
      update: {
        locationTitle: 'Acme Test Business - Uptown',
      },
      create: {
        organisationId: orgId,
        googleConnectionId: testGbpConn.id,
        accountName: 'accounts/1234567890',
        accountTitle: 'Acme Corporation',
        locationName: 'locations/test-20202',
        locationTitle: 'Acme Test Business - Uptown',
        placeId: 'ChIJTestPlace202',
        address: '456 Test Ave, New York, NY 10002',
        isSelected: false,
      },
    });

    // Select location 1
    await prisma.$transaction([
      prisma.gbpLocation.updateMany({
        where: { organisationId: orgId, isSelected: true },
        data: { isSelected: false },
      }),
      prisma.gbpLocation.update({
        where: { id: testLocation.id },
        data: { isSelected: true },
      }),
    ]);

    let selectedCount = await prisma.gbpLocation.count({
      where: { organisationId: orgId, isSelected: true },
    });
    if (selectedCount === 1) {
      console.log('  [PASS] Location 1 successfully selected as the only active location');
    } else {
      throw new Error(`Expected 1 selected location, found ${selectedCount}`);
    }

    // Switch selection to location 2
    await prisma.$transaction([
      prisma.gbpLocation.updateMany({
        where: { organisationId: orgId, isSelected: true },
        data: { isSelected: false },
      }),
      prisma.gbpLocation.update({
        where: { id: testLocation2.id },
        data: { isSelected: true },
      }),
    ]);

    const activeLoc = await prisma.gbpLocation.findFirst({
      where: { organisationId: orgId, isSelected: true },
    });
    if (activeLoc && activeLoc.id === testLocation2.id) {
      console.log('  [PASS] Selection atomically switched to Location 2; Location 1 deselected');
    } else {
      throw new Error('Atomic selection switch failed');
    }

    // Clean up test locations
    await prisma.gbpLocation.deleteMany({
      where: {
        id: { in: [testLocation.id, testLocation2.id] },
      },
    });
    console.log('  [PASS] Test locations cleanly deleted');

    // -------------------------------------------------------------
    // TEST 4: REVOCATION / DISCONNECT ISOLATION
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: INDEPENDENT REVOCATION / DISCONNECTION ---');

    // Revoke GBP only
    await prisma.googleConnection.updateMany({
      where: { organisationId: orgId, service: GoogleServiceType.BUSINESS_PROFILE },
      data: { status: ConnectionStatus.REVOKED },
    });

    const gbpAfterRevoke = await prisma.googleConnection.findUnique({
      where: {
        organisationId_service: {
          organisationId: orgId,
          service: GoogleServiceType.BUSINESS_PROFILE,
        },
      },
    });
    const gscAfterRevoke = await prisma.googleConnection.findUnique({
      where: {
        organisationId_service: {
          organisationId: orgId,
          service: GoogleServiceType.SEARCH_CONSOLE,
        },
      },
    });

    if (gbpAfterRevoke.status === ConnectionStatus.REVOKED && gscAfterRevoke.status === ConnectionStatus.CONNECTED) {
      console.log('  [PASS] Disconnecting GBP revokes BUSINESS_PROFILE while preserving SEARCH_CONSOLE as CONNECTED');
    } else {
      throw new Error('Revoking GBP affected GSC status unexpectedly!');
    }

    // Clean up test connections
    await prisma.googleConnection.deleteMany({
      where: {
        id: { in: [testGbpConn.id, testGscConn.id] },
      },
    });
    console.log('  [PASS] Test GoogleConnection records cleaned up');

    console.log('\n================================================================');
    console.log('ALL GBP ISOLATION & DATA ACCESS TESTS PASSED (100%)');
    console.log('================================================================');
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runGbpIntegrationTests();
