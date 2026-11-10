const path = require('path');
const fs = require('fs');

async function runPhase10NavigationTests() {
  console.log('================================================================');
  console.log('PHASE 10 TEST SUITE: COMPLETE PRODUCT NAVIGATION & 10 VIEWS');
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

  // 1. Check Sidebar definition
  const sidebarCode = fs.readFileSync(path.join(__dirname, '../src/components/Sidebar.tsx'), 'utf8');
  const requiredNavItems = [
    { id: 'dashboard', label: 'Dashboard Overview' },
    { id: 'profile-opt', label: 'GBP Profile Audit' },
    { id: 'website-seo', label: 'Website SEO & NAP' },
    { id: 'competitor-analysis', label: 'Competitor Benchmarking' },
    { id: 'recommendations', label: 'AI Recommendations' },
    { id: 'search-performance', label: 'Search Performance' },
    { id: 'analytics', label: 'Analytics (GA4)' },
    { id: 'audit-history', label: 'Audit History & Compare' },
    { id: 'reports', label: 'Reports & Sharing' },
    { id: 'profile', label: 'Account & Settings' },
  ];

  requiredNavItems.forEach((item) => {
    assert(
      sidebarCode.includes(`id: '${item.id}'`) || sidebarCode.includes(`setActiveTab('${item.id}')`),
      `Sidebar contains navigation target for: ${item.label} ('${item.id}')`
    );
  });

  // 2. Check all Component Files Exist
  const requiredComponents = [
    'src/components/Sidebar.tsx',
    'src/components/Header.tsx',
    'src/components/MetricCards.tsx',
    'src/components/OptimizationProgress.tsx',
    'src/components/ToolsSection.tsx',
    'src/components/InsightsActions.tsx',
    'src/components/GbpAuditView.tsx',
    'src/components/WebsiteSeoView.tsx',
    'src/components/CompetitorView.tsx',
    'src/components/RecommendationsView.tsx',
    'src/components/SearchPerformanceView.tsx',
    'src/components/AnalyticsView.tsx',
    'src/components/AuditHistoryView.tsx',
    'src/components/ReportsView.tsx',
    'src/components/UserProfileView.tsx',
  ];

  requiredComponents.forEach((compPath) => {
    const fullPath = path.join(__dirname, '..', compPath);
    assert(fs.existsSync(fullPath), `Component file exists: ${compPath}`);
  });

  // 3. Check API Routes Exist
  const requiredApiRoutes = [
    'src/app/api/audit/route.ts',
    'src/app/api/ai-recommendations/route.ts',
    'src/app/api/reports/share/route.ts',
    'src/app/api/reports/share/[token]/route.ts',
    'src/app/api/connections/google/analytics/route.ts',
    'src/app/api/connections/google/status/route.ts',
    'src/app/api/connections/google/properties/route.ts',
    'src/app/api/connections/google/gbp/route.ts',
    'src/app/api/connections/google/gbp/locations/route.ts',
    'src/app/api/auth/sync/route.ts',
    'src/app/api/user/profile/route.ts',
  ];

  requiredApiRoutes.forEach((routePath) => {
    const fullPath = path.join(__dirname, '..', routePath);
    assert(fs.existsSync(fullPath), `API route file exists: ${routePath}`);
  });

  // 4. Check Public Shared Report Page Exists
  const sharedReportPage = path.join(__dirname, '../src/app/reports/share/[token]/page.tsx');
  assert(fs.existsSync(sharedReportPage), 'Public report page exists: src/app/reports/share/[token]/page.tsx');

  console.log('----------------------------------------------------------------');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('================================================================');

  if (failed > 0) process.exit(1);
}

runPhase10NavigationTests();
