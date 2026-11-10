'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import axios from 'axios';
import {
  Store,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Info,
  MapPin,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  Building2,
  Search,
  ExternalLink,
  ChevronRight,
  UserCheck,
  Lock,
} from 'lucide-react';

interface GbpLocationItem {
  id: string;
  accountName: string;
  accountTitle?: string | null;
  locationName: string;
  locationTitle: string;
  placeId?: string | null;
  storeCode?: string | null;
  address?: string | null;
  phoneNumber?: string | null;
  websiteUri?: string | null;
  primaryCategory?: string | null;
  isSelected?: boolean;
}

interface OnboardingStatus {
  email: string;
  isEmailVerified: boolean;
  classification: 'business' | 'personal';
  isCustomDomain: boolean;
  accountType?: string | null;
  classificationReason: string;
  oauthConfigured: boolean;
  hasConnection: boolean;
  googleEmail: string | null;
  isEmailMatch: boolean;
  hasMatchingConnection: boolean;
  isTokenValid: boolean;
  locationsCount: number;
  activeLocation?: {
    id: string;
    locationTitle: string;
    address?: string | null;
    placeId?: string | null;
    primaryCategory?: string | null;
  } | null;
}

export default function ConnectGbpOnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();

  const [statusLoading, setStatusLoading] = useState(true);
  const [onboardStatus, setOnboardStatus] = useState<OnboardingStatus | null>(null);

  // Discovery & Location selection state
  const [locations, setLocations] = useState<GbpLocationItem[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [savingLocation, setSavingLocation] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  // Flag to avoid auto-redirect loop for business flow
  const autoRedirectFired = useRef(false);

  // URL parameters from callback or error redirects
  const urlStatus = searchParams.get('status');
  const urlError = searchParams.get('error');
  const urlGoogleEmail = searchParams.get('google_email');
  const urlExpectedEmail = searchParams.get('expected_email');
  const urlConnected = searchParams.get('connected');

  // Fetch onboarding status
  const fetchStatus = async () => {
    setStatusLoading(true);
    try {
      const res = await axios.get('/api/connections/google/gbp/onboarding-status');
      if (res.data?.success) {
        setOnboardStatus(res.data);
      }
    } catch (err) {
      console.warn('Could not determine onboarding status:', err);
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded) {
      fetchStatus();
    }
  }, [isLoaded]);

  // Load locations if already connected or just discovered
  const loadLocations = async () => {
    setLocationsLoading(true);
    setSaveError(null);
    try {
      const res = await axios.get('/api/connections/google/gbp/locations');
      const locList: GbpLocationItem[] = res.data?.locations || [];
      setLocations(locList);

      const active = locList.find((l) => l.isSelected) || locList[0];
      if (active) {
        setSelectedLocationId(active.id);
      }
    } catch (err: any) {
      console.warn('Could not load locations:', err);
    } finally {
      setLocationsLoading(false);
    }
  };

  // Trigger location loading when in discovered state or has matching connection
  useEffect(() => {
    if (!onboardStatus) return;

    if (
      urlStatus === 'discovered' ||
      onboardStatus.hasMatchingConnection ||
      (onboardStatus.hasConnection && onboardStatus.locationsCount > 0)
    ) {
      loadLocations();
    }
  }, [urlStatus, onboardStatus?.hasMatchingConnection, onboardStatus?.hasConnection]);

  // Handle automatic business-email OAuth initiation (Flow B)
  useEffect(() => {
    if (statusLoading || !onboardStatus || autoRedirectFired.current) return;

    // Do NOT auto-redirect if an error occurred, user already has matching connection, or status is discovered
    if (urlError || urlStatus === 'discovered' || onboardStatus.hasMatchingConnection) {
      return;
    }

    // Business flow auto-connection requirement:
    // If user is classified as business and has NO matching connection, auto-start Google OAuth
    if (onboardStatus.classification === 'business' && !onboardStatus.hasMatchingConnection) {
      autoRedirectFired.current = true;
      const verifiedEmail = onboardStatus.email;
      const targetUrl = `/api/connections/google/gbp?from=onboarding&flow=business&login_hint=${encodeURIComponent(
        verifiedEmail
      )}`;
      // Small timeout to allow user to see the "Finding your Google Business Profiles" banner
      const timer = setTimeout(() => {
        window.location.href = targetUrl;
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [statusLoading, onboardStatus, urlError, urlStatus]);

  // Filtered locations
  const filteredLocations = useMemo(() => {
    if (!searchFilter.trim()) return locations;
    const q = searchFilter.toLowerCase();
    return locations.filter(
      (loc) =>
        loc.locationTitle.toLowerCase().includes(q) ||
        loc.address?.toLowerCase().includes(q) ||
        loc.storeCode?.toLowerCase().includes(q) ||
        loc.primaryCategory?.toLowerCase().includes(q) ||
        loc.accountTitle?.toLowerCase().includes(q)
    );
  }, [locations, searchFilter]);

  // Handle Location Selection and proceed to dashboard
  const handleSaveLocation = async () => {
    if (!selectedLocationId) {
      setSaveError('Please select a business location to continue.');
      return;
    }

    setSavingLocation(true);
    setSaveError(null);
    try {
      const res = await axios.post('/api/connections/google/gbp/select', {
        locationId: selectedLocationId,
      });

      if (res.data?.success) {
        router.push('/');
      } else {
        setSaveError(res.data?.error || 'Failed to link selected location.');
      }
    } catch (err: any) {
      console.error('Error saving GBP location:', err);
      setSaveError(err.response?.data?.message || err.message || 'Error saving location selection.');
    } finally {
      setSavingLocation(false);
    }
  };

  const handleSkip = () => {
    router.push('/');
  };

  const handlePersonalConnect = () => {
    window.location.href = '/api/connections/google/gbp?from=onboarding&flow=personal';
  };

  const handleRetryBusiness = () => {
    const emailToUse = urlExpectedEmail || onboardStatus?.email || '';
    window.location.href = `/api/connections/google/gbp?from=onboarding&flow=business&prompt=select_account&login_hint=${encodeURIComponent(
      emailToUse
    )}`;
  };

  const handleContinueWithMismatchedGoogle = () => {
    // Allows user whose business profile is legitimately managed under another Google account to connect it
    window.location.href = '/api/connections/google/gbp?from=onboarding&flow=personal&prompt=select_account';
  };

  // ── Render Loading State ──
  if (statusLoading || !isLoaded) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center py-12 px-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-[#C84A22] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-700">Verifying account configuration...</p>
        </div>
      </div>
    );
  }

  const primaryEmail = onboardStatus?.email || user?.primaryEmailAddress?.emailAddress || '';
  const isBusiness = onboardStatus?.classification === 'business';
  const hasDiscoveredLocations =
    urlStatus === 'discovered' ||
    (onboardStatus?.hasMatchingConnection && locations.length > 0) ||
    locations.length > 0;

  // =========================================================================
  // VIEW 1: ERROR - Google Identity Mismatch (Flow B)
  // =========================================================================
  if (urlError === 'email_mismatch') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold mb-3 shadow-2xs">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Google Account Verification</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Google Account Mismatch
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Your Eholler business account was not linked because a different Google account was selected during sign-in.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
          <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-3xl sm:px-10 space-y-6">
            <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/80 space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700 leading-relaxed space-y-1">
                  <div>
                    <span className="font-semibold text-slate-500">Expected Business Account:</span>{' '}
                    <span className="font-mono font-bold text-slate-900">{urlExpectedEmail || primaryEmail}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500">Authorized Google Account:</span>{' '}
                    <span className="font-mono font-bold text-amber-800">{urlGoogleEmail || 'Different Account'}</span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-600 border-t border-amber-200/60 pt-2 leading-relaxed">
                To protect your business listings and maintain account isolation, Eholler matches your corporate Google identity. If your Google Business Profile is legitimately managed under a separate Google account, you can still choose to link it below.
              </p>
            </div>

            <div className="space-y-3 pt-1">
              <button
                onClick={handleRetryBusiness}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#C84A22] text-white text-xs font-bold hover:bg-[#b03e1b] shadow-sm transition"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry Sign-in with {urlExpectedEmail || primaryEmail}</span>
              </button>

              <button
                onClick={handleContinueWithMismatchedGoogle}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200 transition"
              >
                <UserCheck className="w-4 h-4 text-slate-500" />
                <span>Link a Different Manager Account ({urlGoogleEmail || 'Alternative'})</span>
              </button>

              <button
                type="button"
                onClick={handleSkip}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
              >
                <span>Skip for now &amp; Continue to Manual Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: ERROR - User Cancelled or Declined Permissions
  // =========================================================================
  if (urlError === 'access_denied') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-bold mb-3 shadow-2xs">
            <AlertCircle className="w-3.5 h-3.5 text-red-600" />
            <span>Authorization Incomplete</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Google Authorization Cancelled
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Google sign-in was cancelled or the required Business Profile management permission was declined.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
          <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-3xl sm:px-10 space-y-6">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-600 leading-relaxed space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Lock className="w-4 h-4 text-[#C84A22]" />
                <span>Why Google Authorization is Needed</span>
              </div>
              <p>
                Google Business Profile requires explicit consent for the <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">business.manage</code> scope to retrieve your accessible locations and audit your profile completeness.
              </p>
              <p className="text-[11px] text-slate-500">
                Your Eholler login credentials and completed profile remain completely safe and active.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={isBusiness ? handleRetryBusiness : handlePersonalConnect}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#C84A22] text-white text-xs font-bold hover:bg-[#b03e1b] shadow-sm transition"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry Google Business Profile Authorization</span>
              </button>

              <button
                type="button"
                onClick={handleSkip}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
              >
                <span>Continue without Google Business Profile</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: DISCOVERED LOCATIONS / LOCATION SELECTOR (Flow A & Flow B)
  // =========================================================================
  if (hasDiscoveredLocations) {
    const connectedGoogleEmail =
      urlGoogleEmail || onboardStatus?.googleEmail || 'Connected Google Account';

    return (
      <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Google Account Connected</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Select Your Business Location
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
              We discovered {locations.length} accessible {locations.length === 1 ? 'location' : 'locations'} under{' '}
              <span className="font-mono font-semibold text-slate-800">{connectedGoogleEmail}</span>. Choose the business to audit.
            </p>
          </div>

          <div className="bg-white shadow-sm border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6">
            {/* Connected Google Account Header Pill */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-100/70 text-[#C84A22] flex items-center justify-center shrink-0">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">Connected Google Identity</div>
                  <div className="font-mono text-slate-600">{connectedGoogleEmail}</div>
                </div>
              </div>
              {isBusiness && onboardStatus?.isEmailMatch && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Matches Business Account</span>
                </span>
              )}
            </div>

            {/* If zero locations found */}
            {locations.length === 0 && !locationsLoading && (
              <div className="p-6 bg-amber-50/60 rounded-2xl border border-amber-200 text-center space-y-3">
                <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
                <h3 className="text-sm font-bold text-slate-900">No Business Profiles Found</h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                  Google authorization succeeded, but no Google Business Profile locations were returned where{' '}
                  <span className="font-mono font-bold text-slate-900">{connectedGoogleEmail}</span> has Owner or Manager permissions.
                </p>
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={handleContinueWithMismatchedGoogle}
                    className="px-4 py-2 text-xs font-semibold bg-[#C84A22] text-white rounded-xl hover:bg-[#b03e1b] transition"
                  >
                    Switch to Another Google Account
                  </button>
                  <button
                    onClick={handleSkip}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Continue to Manual Dashboard
                  </button>
                </div>
              </div>
            )}

            {/* Search Input if multiple locations */}
            {locations.length > 3 && (
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filter locations by name, address, or store code..."
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#C84A22]/20 focus:border-[#C84A22] transition"
                />
              </div>
            )}

            {/* Error Message */}
            {saveError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            {/* Locations List */}
            {locationsLoading ? (
              <div className="py-12 text-center space-y-2">
                <RefreshCw className="w-6 h-6 text-[#C84A22] animate-spin mx-auto" />
                <p className="text-xs text-slate-500">Retrieving locations from Google Business Profile API...</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {filteredLocations.map((loc) => {
                  const isSelected = selectedLocationId === loc.id;
                  return (
                    <div
                      key={loc.id}
                      onClick={() => setSelectedLocationId(loc.id)}
                      className={`p-4 rounded-2xl border transition cursor-pointer flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'border-[#C84A22] bg-orange-50/40 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 truncate">
                            {loc.locationTitle}
                          </span>
                          {loc.primaryCategory && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                              {loc.primaryCategory}
                            </span>
                          )}
                          {loc.storeCode && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-500 bg-slate-100">
                              #{loc.storeCode}
                            </span>
                          )}
                        </div>

                        {loc.address && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{loc.address}</span>
                          </div>
                        )}

                        {loc.accountTitle && (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            <span>Account: {loc.accountTitle}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-1 shrink-0">
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${
                            isSelected
                              ? 'border-[#C84A22] bg-[#C84A22] text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Action Buttons */}
            {locations.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <button
                  onClick={handleSaveLocation}
                  disabled={savingLocation || !selectedLocationId}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#C84A22] text-white text-xs font-bold hover:bg-[#b03e1b] shadow-sm transition disabled:opacity-50"
                >
                  {savingLocation ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving Selected Business...</span>
                    </>
                  ) : (
                    <>
                      <Store className="w-4 h-4" />
                      <span>Save Location &amp; Continue to Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1 px-1">
                  <button
                    onClick={handleContinueWithMismatchedGoogle}
                    className="hover:text-slate-800 hover:underline"
                  >
                    Switch Google Account
                  </button>
                  <button
                    onClick={handleSkip}
                    className="hover:text-slate-800 hover:underline"
                  >
                    Skip location &amp; continue
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 4: FLOW B (BUSINESS EMAIL) - AUTOMATIC CONNECTION INITIATION
  // =========================================================================
  if (isBusiness) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-[#C84A22] text-xs font-bold mb-3 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Smart Business Account Discovery</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Finding your Google Business Profiles
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Your Eholler business account is being automatically matched with its Google Business Profile. Complete Google&apos;s secure sign-in and authorisation if requested.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
          <div className="bg-white py-10 px-6 shadow-sm border border-slate-200 rounded-3xl sm:px-10 text-center space-y-6">
            {/* Pulsing Match Indicator */}
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-2xl bg-orange-100 animate-ping opacity-30" />
              <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#C84A22] shadow-xs">
                <Store className="w-8 h-8" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-sm font-bold text-slate-900">
                Matching verified corporate email:
              </div>
              <div className="font-mono text-xs font-semibold text-[#C84A22] bg-orange-50/70 inline-block px-3 py-1 rounded-lg border border-orange-100">
                {primaryEmail}
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left text-xs text-slate-600 leading-relaxed space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Google Security Verification</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Google will prompt you to authenticate your Google Account with your normal security challenges (password, passkey, Google Prompt, or OTP) and request permission to retrieve your Business Profile locations.
              </p>
            </div>

            <div className="pt-2 space-y-3">
              <a
                href={`/api/connections/google/gbp?from=onboarding&flow=business&login_hint=${encodeURIComponent(
                  primaryEmail
                )}`}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#C84A22] text-white text-xs font-bold hover:bg-[#b03e1b] shadow-sm transition"
              >
                <span>Authorize with Google</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={handleSkip}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
              >
                <span>Cancel &amp; Continue to Manual Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 5: FLOW A (PERSONAL EMAIL) - MANUAL OPTIONAL CONNECTION
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-[#C84A22] text-xs font-bold mb-3 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Step 3 of Onboarding (Optional)</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
          Connect your Google Business Profile
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
          Connect the Google account that owns or manages your business listings. Eholler will securely retrieve your accessible business locations so you can choose which business to audit.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-3xl sm:px-10 space-y-6">
          {/* Account Independence Info Banner */}
          <div className="p-4 bg-orange-50/60 rounded-2xl border border-orange-100 flex items-start gap-3">
            <Info className="w-5 h-5 text-[#C84A22] shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 leading-relaxed">
              <span className="font-bold text-slate-900">Connect Any Managing Google Account:</span>{' '}
              Your Eholler login is <span className="font-mono font-semibold">{primaryEmail}</span>. You can connect any Google account that holds Owner or Manager access to your Google Business Profile (for example, <span className="font-mono text-slate-600">owner@company.com</span>).
            </div>
          </div>

          {/* Capabilities Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Mode B Owner Audit</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Audits all 57 Google Business Profile fields including backend attributes, business hours, and service menus.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 mb-1">
                <Store className="w-4 h-4 text-[#C84A22]" />
                <span>Location Discovery</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Automatically retrieve and select from all business profiles accessible to your authorized Google account.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handlePersonalConnect}
              className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#C84A22] text-white text-xs font-bold hover:bg-[#b03e1b] shadow-sm transition"
            >
              <Store className="w-4 h-4" />
              <span>Connect Google Business Profile</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleSkip}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition"
            >
              <span>Continue without connecting</span>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400">
              You can connect, switch, or disconnect your Google Business Profile anytime from the Account &amp; Profile section.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
