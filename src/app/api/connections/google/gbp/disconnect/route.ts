import { NextResponse } from 'next/server';
import { clearGbpCookies } from '@/lib/gbp-tokens';
import { getDefaultOrgScope } from '@/lib/db/default-org';

export async function POST() {
  const res = NextResponse.json({ success: true, connected: false });
  clearGbpCookies(res);
  try {
    const orgScope = await getDefaultOrgScope();
    await orgScope.disconnectGbp();
  } catch (err) {
    console.warn('Could not revoke Google Business Profile connection in database (non-fatal):', err);
  }
  return res;
}

