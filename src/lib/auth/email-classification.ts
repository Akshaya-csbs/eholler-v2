/**
 * Email Classification Utility for Eholler Local SEO
 * 
 * Provides a maintainable, deterministic classification of user accounts
 * into 'business' (custom corporate domains / business accounts) and 'personal'
 * (consumer public webmail providers).
 * 
 * Rule Guarantees:
 * 1. Custom company domains (e.g. admin@mycompany.com, sarah@growthagency.io) are treated as business emails.
 * 2. Public webmail providers (e.g. gmail.com, outlook.com, yahoo.com) default to personal emails.
 * 3. Supports explicit user profile override (accountType = 'BUSINESS' | 'PERSONAL') so users can
 *    correct the classification anytime in Account & Profile settings.
 * 4. Never uses email domain classification as proof of Google Business Profile access; actual
 *    GBP permission is strictly verified by Google OAuth.
 */

export const COMMON_PERSONAL_DOMAINS: ReadonlySet<string> = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.co.uk',
  'yahoo.fr',
  'yahoo.ca',
  'yahoo.com.au',
  'yahoo.co.in',
  'ymail.com',
  'rocketmail.com',
  'hotmail.com',
  'hotmail.co.uk',
  'hotmail.fr',
  'outlook.com',
  'outlook.co.uk',
  'live.com',
  'live.co.uk',
  'msn.com',
  'passport.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'aim.com',
  'proton.me',
  'protonmail.com',
  'pm.me',
  'zoho.com',
  'zohomail.com',
  'mail.com',
  'email.com',
  'gmx.com',
  'gmx.net',
  'yandex.com',
  'yandex.ru',
  'fastmail.com',
  'tutanota.com',
  'tuta.io',
]);

export interface EmailClassificationResult {
  classification: 'business' | 'personal';
  isCustomDomain: boolean;
  domain: string;
  overrideApplied: boolean;
  reason: string;
}

/**
 * Classifies an email address as either 'business' or 'personal'.
 */
export function classifyUserEmail(
  email: string | undefined | null,
  options?: {
    accountType?: string | null;
    companyName?: string | null;
  }
): EmailClassificationResult {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const domain = normalizedEmail.split('@')[1] || '';

  // 1. Check for explicit user profile override
  if (options?.accountType === 'BUSINESS') {
    return {
      classification: 'business',
      isCustomDomain: domain ? !COMMON_PERSONAL_DOMAINS.has(domain) : false,
      domain,
      overrideApplied: true,
      reason: 'User explicitly set account classification to Business Account in Profile Settings',
    };
  }

  if (options?.accountType === 'PERSONAL') {
    return {
      classification: 'personal',
      isCustomDomain: domain ? !COMMON_PERSONAL_DOMAINS.has(domain) : false,
      domain,
      overrideApplied: true,
      reason: 'User explicitly set account classification to Personal Account in Profile Settings',
    };
  }

  // 2. Domain-based heuristic classification
  if (!domain) {
    return {
      classification: 'personal',
      isCustomDomain: false,
      domain: '',
      overrideApplied: false,
      reason: 'Missing email domain, defaulting to personal flow',
    };
  }

  const isPersonalDomain = COMMON_PERSONAL_DOMAINS.has(domain);

  if (isPersonalDomain) {
    return {
      classification: 'personal',
      isCustomDomain: false,
      domain,
      overrideApplied: false,
      reason: `Domain @${domain} is a standard public webmail provider`,
    };
  }

  // Custom company / agency domain detected
  return {
    classification: 'business',
    isCustomDomain: true,
    domain,
    overrideApplied: false,
    reason: `Custom company domain @${domain} detected`,
  };
}

