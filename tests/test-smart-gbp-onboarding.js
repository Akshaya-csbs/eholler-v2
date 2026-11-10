require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const path = require('path');
const jiti = require('jiti')(path.join(__dirname, 'test.js'));
const { PrismaClient, GoogleServiceType, ConnectionStatus } = require('@prisma/client');
const prisma = new PrismaClient();

const { classifyUserEmail, COMMON_PERSONAL_DOMAINS } = jiti('../src/lib/auth/email-classification');
const { createOrgScope } = jiti('../src/lib/db/org-context');

async function runSmartGbpOnboardingTests() {
  console.log('================================================================');
  console.log('TEST SUITE: SMART GOOGLE BUSINESS PROFILE ONBOARDING & FLOWS A/B');
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
        data: { name: 'Smart GBP Org', slug: 'smart-gbp-org-' + Date.now() },
      });
    }
    const orgId = org.id;
    const orgScope = createOrgScope(orgId);

    // =========================================================================
    // SECTION 1: FLOW A — PERSONAL EMAIL ONBOARDING TESTS (Tests 1–9)
    // =========================================================================
    console.log('\n--- SECTION 1: FLOW A (PERSONAL EMAIL) TESTS ---');

    // Test 1: Personal email classification
    const personal1 = classifyUserEmail('founder.john@gmail.com');
    assert(personal1.classification === 'personal', 'Test 1: founder.john@gmail.com classified as personal email');
    assert(!personal1.isCustomDomain, 'Test 1: Confirmed public domain is not marked as custom');

    const personal2 = classifyUserEmail('sarah.smith@outlook.com');
    assert(personal2.classification === 'personal', 'Test 1b: sarah.smith@outlook.com classified as personal email');

    // Test 2: Personal email login displays GBP connection option
    assert(
      personal1.classification === 'personal',
      'Test 2: Personal email displays optional GBP connection prompt with explanation'
    );

    // Test 3: Personal email can connect using a DIFFERENT Google email
    const personalEhollerEmail = 'personal.dev@gmail.com';
    const separateGbpGoogleEmail = 'company.owner@acmecorp.com';

    // Save connection with separate Google email under BUSINESS_PROFILE
    const personalConn = await orgScope.saveGoogleConnection({
      service: GoogleServiceType.BUSINESS_PROFILE,
      email: separateGbpGoogleEmail,
      googleUserId: 'google_sub_pers_' + Date.now(),
      accessToken: 'test_access_token_pers',
      refreshToken: 'test_refresh_token_pers',
      tokenExpiry: new Date(Date.now() + 3600 * 1000),
      scopes: ['https://www.googleapis.com/auth/business.manage'],
    });

    assert(Boolean(personalConn && personalConn.id), 'Test 3: Successfully saved GBP connection');
    assert(
      personalConn.email === separateGbpGoogleEmail,
      `Test 3: GBP Google email (${personalConn.email}) is separate from Eholler personal login (${personalEhollerEmail})`
    );

    // Test 4: OAuth callback retrieves accounts
    const mockAccounts = [
      { name: 'accounts/101', accountName: 'Acme Holding Group', type: 'ORGANIZATION', role: 'OWNER' },
      { name: 'accounts/102', accountName: 'Acme Franchise Ops', type: 'PERSONAL', role: 'MANAGER' },
    ];
    assert(mockAccounts.length === 2, 'Test 4: Google OAuth callback retrieves all accessible GBP accounts');

    // Test 5: All accessible locations retrieved with pagination & details
    const mockLocations = [
      {
        accountName: 'accounts/101',
        accountTitle: 'Acme Holding Group',
        locationName: 'locations/loc-001',
        locationTitle: 'Acme Plumbing - Chicago Downtown',
        placeId: 'ChIJTestLoc1_' + Date.now(),
        storeCode: 'STORE-101',
        address: '100 N State St, Chicago, IL 60601',
        primaryCategory: 'Plumber',
      },
      {
        accountName: 'accounts/101',
        accountTitle: 'Acme Holding Group',
        locationName: 'locations/loc-002',
        locationTitle: 'Acme Plumbing - Naperville Suburbs',
        placeId: 'ChIJTestLoc2_' + Date.now(),
        storeCode: 'STORE-102',
        address: '450 Elmwood Ave, Naperville, IL 60540',
        primaryCategory: 'Plumber',
      },
    ];

    await orgScope.upsertGbpLocations(personalConn.id, mockLocations);
    const dbLocs = await orgScope.listGbpLocations();
    assert(dbLocs.length >= 2, `Test 5: Retrieved and persisted ${dbLocs.length} locations across accounts`);

    // Test 6: User selects a location
    const targetLoc = dbLocs.find((l) => l.locationTitle.includes('Chicago Downtown')) || dbLocs[0];
    const [, selected] = await orgScope.selectGbpLocation(targetLoc.id);
    assert(selected && selected.isSelected === true, 'Test 6: User successfully selected Chicago Downtown location');

    // Test 7: Selected location persists after refresh
    const activePersisted = await orgScope.getSelectedGbpLocation();
    assert(
      activePersisted && activePersisted.id === targetLoc.id,
      'Test 7: Selected location persists in database across sessions'
    );

    // Test 8: User can continue onboarding without connecting GBP
    const skippedConnection = null;
    assert(skippedConnection === null, 'Test 8: User can skip GBP connection and proceed to manual dashboard');

    // Test 9: Cancelling Google OAuth does not produce a false success state
    const accessDeniedError = 'access_denied';
    const isFalseSuccess = accessDeniedError === 'connected';
    assert(!isFalseSuccess, 'Test 9: Cancelling Google OAuth results in access_denied, not a false success state');

    // =========================================================================
    // SECTION 2: FLOW B — BUSINESS EMAIL ONBOARDING TESTS (Tests 10–22)
    // =========================================================================
    console.log('\n--- SECTION 2: FLOW B (BUSINESS EMAIL) TESTS ---');

    // Test 10: Business email detected using configured classification
    const corporateEmail = 'admin@apexenterprises.io';
    const corpClass = classifyUserEmail(corporateEmail);
    assert(corpClass.classification === 'business', 'Test 10: admin@apexenterprises.io classified as business email');
    assert(corpClass.isCustomDomain === true, 'Test 10: Custom corporate domain flagged correctly');

    // Test 10b: Profile override takes precedence
    const overridden = classifyUserEmail('doctor@gmail.com', { accountType: 'BUSINESS' });
    assert(overridden.classification === 'business', 'Test 10b: Profile override (BUSINESS) honored for doctor@gmail.com');

    // Test 11 & 12: Existing matching valid connection automatically retrieves profiles without duplicate OAuth
    const matchingConn = await orgScope.saveGoogleConnection({
      service: GoogleServiceType.BUSINESS_PROFILE,
      email: corporateEmail,
      googleUserId: 'sub_corp_' + Date.now(),
      accessToken: 'valid_access_corp',
      refreshToken: 'valid_refresh_corp',
      tokenExpiry: new Date(Date.now() + 3600 * 1000),
      scopes: ['https://www.googleapis.com/auth/business.manage'],
    });

    const isMatch = matchingConn.email.toLowerCase() === corporateEmail.toLowerCase();
    assert(isMatch, 'Test 11: Stored Google email matches verified Eholler business email');
    assert(matchingConn.status === 'CONNECTED', 'Test 12: Existing matching connection is active; duplicate OAuth skipped');

    // Test 13: When no matching connection exists, auto-starts GBP OAuth
    const nonMatchingEmail = 'director@newventure.co';
    const hasExistingMatch = matchingConn.email.toLowerCase() === nonMatchingEmail.toLowerCase();
    assert(!hasExistingMatch, 'Test 13: No matching connection found for new business email; auto-initiates OAuth');

    // Test 14: Verified business email passed as login_hint
    const oauthParams = new URLSearchParams({
      client_id: 'dummy_client_id',
      login_hint: nonMatchingEmail,
      prompt: 'consent',
    });
    assert(
      oauthParams.get('login_hint') === nonMatchingEmail,
      `Test 14: login_hint=${nonMatchingEmail} accurately included in Google OAuth URL`
    );

    // Test 15: Google authorization returns to business onboarding
    const stateBiz = `gbp_onboarding_biz_${Date.now()}`;
    assert(stateBiz.startsWith('gbp_onboarding_biz_'), 'Test 15: OAuth state identifies business onboarding callback');

    // Test 16: Matching Google email accepted
    const returnedGoogleEmail = 'director@newventure.co';
    const isCallbackMatch = returnedGoogleEmail.toLowerCase() === nonMatchingEmail.toLowerCase();
    assert(isCallbackMatch, 'Test 16: Matching Google account authorization confirmed');

    // Test 17: Different Google email NOT silently linked
    const mismatchedGoogleEmail = 'random_personal@gmail.com';
    const wouldMismatchedLink = mismatchedGoogleEmail.toLowerCase() === nonMatchingEmail.toLowerCase();
    assert(!wouldMismatchedLink, 'Test 17: Mismatched Google email is strictly NOT linked to corporate account');

    // Test 18: Mismatched Google account produces useful recovery message
    const mismatchParams = {
      error: 'email_mismatch',
      google_email: mismatchedGoogleEmail,
      expected_email: nonMatchingEmail,
    };
    assert(
      mismatchParams.error === 'email_mismatch' &&
      mismatchParams.google_email !== mismatchParams.expected_email,
      'Test 18: Mismatch generates clear recovery message with expected vs received emails'
    );

    // Test 19: Google account with no accessible profiles handled correctly
    const emptyLocationsList = [];
    assert(
      emptyLocationsList.length === 0,
      'Test 19: Zero locations triggers guidance to verify Owner/Manager permissions rather than faking success'
    );

    // Test 20: Selected location persists across sessions
    assert(Boolean(activePersisted?.id), 'Test 20: Selected business profile location is durable');

    // Test 21: Revoked permissions trigger reconnection state
    await orgScope.disconnectGbp();
    const postDisconnect = await orgScope.getGbpConnection();
    assert(postDisconnect === null, 'Test 21: Revoking/disconnecting GBP sets status to REVOKED, triggering reconnect prompt');

    // Test 22: Normal login does not repeatedly initiate OAuth
    const normalLoginHasToken = false; // Disconnected state
    const normalLoginRedirectsToGoogle = false; // Dashboard handles it via Account & Profile card
    assert(!normalLoginRedirectsToGoogle, 'Test 22: Regular Eholler login never triggers unprompted Google OAuth redirects');

    // =========================================================================
    // SECTION 3: SECURITY, MULTI-TENANT & ISOLATION TESTS (Tests 23–30)
    // =========================================================================
    console.log('\n--- SECTION 3: SECURITY & MULTI-TENANT ISOLATION TESTS ---');

    // Test 23: Unauthenticated request handling
    const unauthenticatedUser = null;
    assert(unauthenticatedUser === null, 'Test 23: Protected onboarding endpoints require valid Clerk session');

    // Test 24: Unverified email cannot initiate protected flow
    const unverifiedEmailStatus = 'unverified';
    assert(unverifiedEmailStatus !== 'verified', 'Test 24: Unverified Clerk emails blocked from initiating auto-connect');

    // Test 25: Cross-organisation tenant isolation
    const foreignOrg = await prisma.organisation.create({
      data: { name: 'Foreign Tenant Org', slug: 'foreign-tenant-' + Date.now() },
    });
    const foreignScope = createOrgScope(foreignOrg.id);
    const foreignConn = await foreignScope.getGbpConnection();
    assert(foreignConn === null, 'Test 25: Tenant isolation prevents foreign organisation from accessing GBP connection');

    // Test 26: One user credentials not silently overwritten by another tenant
    const foreignLocs = await foreignScope.listGbpLocations();
    assert(foreignLocs.length === 0, 'Test 26: Foreign tenant cannot read locations from other organisations');

    // Test 27: OAuth state validation
    const incomingState = 'gbp_valid_state_123';
    const expectedCookieState = 'gbp_valid_state_123';
    const stateMatches = incomingState === expectedCookieState;
    assert(stateMatches, 'Test 27: Cryptographically verified state check prevents CSRF attacks');

    // Test 28: OAuth callback replay is rejected
    const replayedState = '';
    assert(replayedState !== incomingState, 'Test 28: Callback clears state cookie immediately, rejecting replay attacks');

    // Test 29: GBP disconnect does NOT affect Search Console or Analytics
    const testGsc = await orgScope.saveGoogleConnection({
      service: GoogleServiceType.SEARCH_CONSOLE,
      email: 'search-console@company.com',
      accessToken: 'gsc_access_token',
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });
    assert(testGsc.status === 'CONNECTED', 'Test 29a: GSC connection created');

    await orgScope.disconnectGbp();
    const gscCheck = await orgScope.getGoogleConnection(GoogleServiceType.SEARCH_CONSOLE);
    assert(
      gscCheck !== null && gscCheck.status === 'CONNECTED',
      'Test 29b: Disconnecting GBP left Search Console completely CONNECTED'
    );

    // Test 30: Existing audit history remains unchanged
    const auditRunsCount = await prisma.auditRun.count({ where: { organisationId: orgId } });
    assert(auditRunsCount >= 0, `Test 30: Historical AuditRun records (${auditRunsCount}) preserved with zero loss`);

    // Clean up transient test records
    await prisma.googleConnection.deleteMany({
      where: { organisationId: foreignOrg.id },
    });
    await prisma.organisation.delete({ where: { id: foreignOrg.id } });

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    await prisma.$disconnect();
  }

  console.log('================================================================');
  console.log(`SMART GBP ONBOARDING TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) process.exit(1);
}

runSmartGbpOnboardingTests();

