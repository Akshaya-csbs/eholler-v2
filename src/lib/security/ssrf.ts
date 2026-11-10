import dns from 'dns/promises';
import net from 'net';
import axios from 'axios';

/**
 * SSRF Protection Utility for Eholler Local SEO
 * Validates URLs and strictly blocks loopback, private, link-local, multicast,
 * cloud metadata (e.g. AWS/GCP 169.254.169.254), and reserved IP ranges.
 */

export function isPrivateOrReservedIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4 || parts.some(isNaN)) return true;

    // 0.0.0.0/8 (Current network)
    if (parts[0] === 0) return true;

    // 10.0.0.0/8 (Private-Use Networks)
    if (parts[0] === 10) return true;

    // 127.0.0.0/8 (Loopback)
    if (parts[0] === 127) return true;

    // 169.254.0.0/16 (Link Local, including AWS/GCP metadata service 169.254.169.254)
    if (parts[0] === 169 && parts[1] === 254) return true;

    // 172.16.0.0/12 (Private-Use Networks: 172.16.0.0 – 172.31.255.255)
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;

    // 192.168.0.0/16 (Private-Use Networks)
    if (parts[0] === 192 && parts[1] === 168) return true;

    // 100.64.0.0/10 (Carrier-Grade NAT)
    if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return true;

    // 192.0.0.0/24 (IETF Protocol Assignments)
    if (parts[0] === 192 && parts[1] === 0 && parts[2] === 0) return true;

    // 192.0.2.0/24 (TEST-NET-1)
    if (parts[0] === 192 && parts[1] === 0 && parts[2] === 2) return true;

    // 198.51.100.0/24 (TEST-NET-2)
    if (parts[0] === 198 && parts[1] === 51 && parts[2] === 100) return true;

    // 203.0.113.0/24 (TEST-NET-3)
    if (parts[0] === 203 && parts[1] === 0 && parts[2] === 113) return true;

    // 198.18.0.0/15 (Network Benchmark Tests)
    if (parts[0] === 198 && (parts[1] === 18 || parts[1] === 19)) return true;

    // 224.0.0.0/4 (Multicast: 224.0.0.0 - 239.255.255.255)
    if (parts[0] >= 224 && parts[0] <= 239) return true;

    // 240.0.0.0/4 (Reserved / Future Use)
    if (parts[0] >= 240) return true;

    // 255.255.255.255 (Broadcast)
    if (ip === '255.255.255.255') return true;

    return false;
  }

  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();

    // ::1 (Loopback)
    if (lower === '::1' || lower === '0:0:0:0:0:0:0:1') return true;

    // :: (Unspecified)
    if (lower === '::' || lower === '0:0:0:0:0:0:0:0') return true;

    // fc00::/7 (Unique Local Addresses: fc00:: to fdff::)
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true;

    // fe80::/10 (Link-Local Addresses)
    if (
      lower.startsWith('fe8') ||
      lower.startsWith('fe9') ||
      lower.startsWith('fea') ||
      lower.startsWith('feb')
    ) {
      return true;
    }

    // ff00::/8 (Multicast)
    if (lower.startsWith('ff')) return true;

    // IPv4-Mapped IPv6 (e.g. ::ffff:127.0.0.1)
    if (lower.includes('::ffff:')) {
      const v4Part = lower.split('::ffff:')[1];
      if (v4Part && net.isIPv4(v4Part)) {
        return isPrivateOrReservedIp(v4Part);
      }
    }

    // 2001:db8::/32 (Documentation)
    if (lower.startsWith('2001:db8:')) return true;

    return false;
  }

  // Not a recognizable valid IP -> block defensively
  return true;
}

export interface SsrfValidationResult {
  valid: boolean;
  reason?: string;
  normalizedUrl?: string;
  resolvedIp?: string;
}

/**
 * Validates any outbound URL before HTTP requests are dispatched.
 * Performs DNS resolution and validates that the destination IP is public.
 */
export async function validateOutboundUrl(rawUrl: string): Promise<SsrfValidationResult> {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { valid: false, reason: 'URL must be a non-empty string.' };
  }

  let parsed: URL;
  try {
    let urlString = rawUrl.trim();
    if (!/^https?:\/\//i.test(urlString)) {
      urlString = `https://${urlString}`;
    }
    parsed = new URL(urlString);
  } catch {
    return { valid: false, reason: 'Malformed or invalid URL.' };
  }

  // Protocol check
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return {
      valid: false,
      reason: `Prohibited protocol: ${parsed.protocol}. Only http: and https: are allowed.`,
    };
  }

  // Hostname check
  const hostname = parsed.hostname.toLowerCase();
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.corp') ||
    hostname.endsWith('.lan') ||
    hostname.endsWith('.home')
  ) {
    return {
      valid: false,
      reason: `Prohibited hostname: ${hostname}. Internal domains are blocked.`,
    };
  }

  // If hostname is directly an IP literal
  if (net.isIP(hostname)) {
    if (isPrivateOrReservedIp(hostname)) {
      return {
        valid: false,
        reason: `Target IP ${hostname} is private, link-local, or reserved. Outbound access blocked.`,
        resolvedIp: hostname,
      };
    }
    return {
      valid: true,
      normalizedUrl: parsed.toString(),
      resolvedIp: hostname,
    };
  }

  // Resolve hostname via DNS
  try {
    const [ipv4Addresses, ipv6Addresses] = await Promise.all([
      dns.resolve4(hostname).catch(() => []),
      dns.resolve6(hostname).catch(() => []),
    ]);

    const allIps = [...ipv4Addresses, ...ipv6Addresses];

    if (allIps.length === 0) {
      return {
        valid: false,
        reason: `DNS resolution failed for hostname "${hostname}". Domain could not be resolved.`,
      };
    }

    for (const ip of allIps) {
      if (isPrivateOrReservedIp(ip)) {
        return {
          valid: false,
          reason: `Hostname "${hostname}" resolves to protected or internal IP ${ip}. Access blocked for SSRF protection.`,
          resolvedIp: ip,
        };
      }
    }

    return {
      valid: true,
      normalizedUrl: parsed.toString(),
      resolvedIp: allIps[0],
    };
  } catch (err: any) {
    return {
      valid: false,
      reason: `DNS resolution error for "${hostname}": ${err.message || 'Lookup failed'}`,
    };
  }
}

export interface SafeFetchResult {
  data: string;
  status: number;
  finalUrl: string;
  loadTimeMs: number;
}

/**
 * Hardened HTTP fetcher with active SSRF defense:
 * 1. Validates initial target URL and resolves DNS against private/link-local ranges.
 * 2. Prohibits automatic redirects (maxRedirects: 0).
 * 3. Re-validates every redirect destination against SSRF before following (prevents redirect-based SSRF).
 * 4. Enforces strict response size limits (maxContentLength) to prevent memory exhaustion / DoS.
 * 5. Enforces request timeouts.
 */
export async function safeFetchHtml(
  targetUrl: string,
  options: {
    timeout?: number;
    maxRedirects?: number;
    maxSizeBytes?: number;
    headers?: Record<string, string>;
  } = {}
): Promise<SafeFetchResult> {
  const maxRedirects = options.maxRedirects ?? 4;
  const timeout = options.timeout ?? 8000;
  const maxSizeBytes = options.maxSizeBytes ?? 5 * 1024 * 1024; // 5MB limit
  const headers = options.headers || {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml',
  };

  let currentUrl = targetUrl;
  let redirectCount = 0;
  const startTime = Date.now();

  while (redirectCount <= maxRedirects) {
    // SSRF verification on the exact current destination URL
    const check = await validateOutboundUrl(currentUrl);
    if (!check.valid) {
      throw new Error(`SSRF blocked on hop ${redirectCount} (${currentUrl}): ${check.reason}`);
    }

    const response = await axios.get(check.normalizedUrl || currentUrl, {
      timeout,
      headers,
      maxRedirects: 0, // Enforce manual re-validation on every redirect hop
      maxContentLength: maxSizeBytes,
      maxBodyLength: maxSizeBytes,
      validateStatus: (status) => status < 400 || (status >= 300 && status < 400),
    });

    // Check if redirect
    if (response.status >= 300 && response.status < 400 && response.headers.location) {
      redirectCount++;
      if (redirectCount > maxRedirects) {
        throw new Error(`Exceeded maximum allowed redirects (${maxRedirects})`);
      }
      const nextLocation = response.headers.location;
      currentUrl = new URL(nextLocation, currentUrl).toString();
      continue;
    }

    return {
      data: typeof response.data === 'string' ? response.data : String(response.data),
      status: response.status,
      finalUrl: currentUrl,
      loadTimeMs: Date.now() - startTime,
    };
  }

  throw new Error('Too many redirects');
}

