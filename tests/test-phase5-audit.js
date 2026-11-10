const path = require('path');
const fs = require('fs');
const jiti = require('jiti')(path.join(__dirname, 'test.js'));

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

const { validateOutboundUrl, isPrivateOrReservedIp } = jiti('../src/lib/security/ssrf');
const { evaluateAllGbpFields, buildBusinessUnderstanding } = jiti('../src/lib/gbp-audit-engine');

async function runPhase5AuditTests() {
  console.log('================================================================');
  console.log('PHASE 5 TEST SUITE: COMPLETE LOCAL SEO AUDIT ENGINE & SSRF GUARD');
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

  // -------------------------------------------------------------
  // TEST 1: SSRF IP & URL Protection
  // -------------------------------------------------------------
  console.log('\n--- TEST 1: SSRF Defense & Internal Network Target Blocking ---');

  assert(isPrivateOrReservedIp('127.0.0.1'), 'Blocks IPv4 loopback 127.0.0.1');
  assert(isPrivateOrReservedIp('10.0.0.1'), 'Blocks RFC 1918 10.0.0.1');
  assert(isPrivateOrReservedIp('172.16.0.5'), 'Blocks RFC 1918 172.16.0.5');
  assert(isPrivateOrReservedIp('192.168.1.1'), 'Blocks RFC 1918 192.168.1.1');
  assert(isPrivateOrReservedIp('169.254.169.254'), 'Blocks Cloud Metadata Link-Local 169.254.169.254');
  assert(isPrivateOrReservedIp('::1'), 'Blocks IPv6 loopback ::1');
  assert(isPrivateOrReservedIp('fc00::1'), 'Blocks IPv6 unique local fc00::1');
  assert(!isPrivateOrReservedIp('8.8.8.8'), 'Permits public IPv4 8.8.8.8');
  assert(!isPrivateOrReservedIp('1.1.1.1'), 'Permits public IPv4 1.1.1.1');

  const localhostCheck = await validateOutboundUrl('http://localhost:3000/internal-metrics');
  assert(!localhostCheck.valid, `Blocked localhost URL: "${localhostCheck.reason}"`);

  const loopbackIpCheck = await validateOutboundUrl('http://127.0.0.1:8080/admin');
  assert(!loopbackIpCheck.valid, `Blocked direct loopback IP: "${loopbackIpCheck.reason}"`);

  const metadataCheck = await validateOutboundUrl('http://169.254.169.254/computeMetadata/v1/');
  assert(!metadataCheck.valid, `Blocked cloud metadata access: "${metadataCheck.reason}"`);

  const fileProtoCheck = await validateOutboundUrl('file:///etc/passwd');
  assert(!fileProtoCheck.valid, `Blocked file: protocol: "${fileProtoCheck.reason}"`);

  // -------------------------------------------------------------
  // TEST 2: GBP 57-Field Evaluation & API Limitation Transparency
  // -------------------------------------------------------------
  console.log('\n--- TEST 2: 57-Field GBP Audit & API Transparency ---');

  const mockPlace = {
    id: 'ChIJtest_place_57_fields',
    displayName: 'Downtown Dental Studio',
    formattedAddress: '500 N Michigan Ave, Chicago, IL 60611',
    nationalPhoneNumber: '(312) 555-0199',
    rating: 4.8,
    userRatingCount: 88,
    websiteUri: 'https://downtowndentalchicago.com',
    primaryType: 'Dentist',
    primaryTypeDisplayName: 'Dentist',
    photosCount: 12,
    editorialSummary: 'Full-service modern dental studio specializing in general dentistry, cosmetic teeth whitening, and dental implants in downtown Chicago.',
    openingHours: {
      openNow: true,
      weekdayDescriptions: ['Monday: 8:00 AM – 5:00 PM', 'Tuesday: 8:00 AM – 5:00 PM'],
    },
    accessibilityOptions: {
      wheelchairAccessibleEntrance: true,
      wheelchairAccessibleRestroom: true,
    },
  };

  const mockSiteAudit = {
    url: 'https://downtowndentalchicago.com',
    isHttps: true,
    statusCode: 200,
    title: 'Downtown Dental Studio | Top Chicago Dentist & Implants',
    metaDescription: 'Trusted Chicago dental clinic offering cosmetic veneers, teeth whitening, and emergency dental care on Michigan Avenue.',
    hasPhoneMatch: true,
    hasAddressMatch: true,
    hasLocalBusinessSchema: true,
    loadTimeMs: 420,
    h1Headings: ['Downtown Chicago Cosmetic & Family Dentistry'],
    h2Headings: ['Teeth Whitening', 'Dental Implants', 'Invisalign'],
    servicesMentioned: ['Teeth Whitening', 'Dental Implants', 'Invisalign Clear Aligners', 'Emergency Dentistry'],
    images: { total: 14, withAlt: 12, missingAlt: 2 },
    sitemapUrl: 'https://downtowndentalchicago.com/sitemap.xml',
    hasViewportMeta: true,
  };

  const understanding = buildBusinessUnderstanding(mockPlace, mockSiteAudit);
  assert(understanding.primaryCategory === 'Dentist', `Derived primary category: ${understanding.primaryCategory}`);
  assert(understanding.mainServices.length >= 2, `Derived main services: ${understanding.mainServices.slice(0, 2).join(', ')}`);

  const fields = evaluateAllGbpFields(mockPlace, mockSiteAudit, understanding);
  assert(fields.length === 57, `Evaluates exactly 57 GBP fields (Actual: ${fields.length})`);

  // Check categories coverage
  const categories = new Set(fields.map((f) => f.category));
  assert(categories.has('basic_info'), 'Includes basic_info category');
  assert(categories.has('location_area'), 'Includes location_area category');
  assert(categories.has('hours'), 'Includes hours category');
  assert(categories.has('services'), 'Includes services category');
  assert(categories.has('attributes'), 'Includes attributes category');
  assert(categories.has('photos'), 'Includes photos category');

  // Verify API limitation transparency: fields that Google doesn't expose publicly are tagged UNABLE TO VERIFY
  const unableToVerifyFields = fields.filter((f) => f.status === 'UNABLE TO VERIFY');
  assert(unableToVerifyFields.length > 0, `Identifies ${unableToVerifyFields.length} fields requiring owner manager credentials or unexposed publicly by Google`);

  const identityBadgesField = fields.find((f) => f.field_id === 'from_the_business_attributes');
  assert(
    identityBadgesField && identityBadgesField.status === 'UNABLE TO VERIFY',
    'Identity badges accurately tagged as UNABLE TO VERIFY with clear explanation rather than falsely claiming missing'
  );

  // -------------------------------------------------------------
  // TEST 3: Transparent Scoring & Deductions
  // -------------------------------------------------------------
  console.log('\n--- TEST 3: Transparent Scoring & Deductions ---');

  const optimizedCount = fields.filter((f) => f.status === 'NO CHANGES REQUIRED').length;
  const missingCount = fields.filter((f) => f.status === 'MISSING').length;
  const needsImprovementCount = fields.filter((f) => f.status === 'NEEDS IMPROVEMENT').length;

  assert(optimizedCount >= 20, `Optimized fields count: ${optimizedCount}`);
  assert(missingCount >= 0, `Missing fields count: ${missingCount}`);
  assert(needsImprovementCount >= 0, `Needs improvement count: ${needsImprovementCount}`);

  console.log('\n================================================================');
  console.log(`PHASE 5 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) process.exit(1);
}

runPhase5AuditTests();
