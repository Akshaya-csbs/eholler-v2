'use client';

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  X,
  Store,
  MapPin,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Phone,
  Globe,
  Tag,
  Building,
  Building2,
  Search,
  ExternalLink,
  Shield,
  Layers,
  ChevronDown,
} from 'lucide-react';

export interface GbpLocation {
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
  isSelected: boolean;
}

export interface GbpAccount {
  name: string;
  accountName: string;
  type?: string;
  role?: string;
}

interface GbpLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelected: (location: GbpLocation) => void;
  currentActiveLocationId?: string | null;
}

export const GbpLocationModal: React.FC<GbpLocationModalProps> = ({
  isOpen,
  onClose,
  onLocationSelected,
  currentActiveLocationId,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [locations, setLocations] = useState<GbpLocation[]>([]);
  const [accounts, setAccounts] = useState<GbpAccount[]>([]);
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(currentActiveLocationId || null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAccountFilter, setSelectedAccountFilter] = useState<string>('ALL');

  const fetchLocations = async (isManualRefresh: boolean = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await axios.get('/api/connections/google/gbp/locations');
      const locs: GbpLocation[] = res.data?.locations || [];
      const accs: GbpAccount[] = res.data?.accounts || [];
      const email: string | null = res.data?.googleEmail || null;

      setLocations(locs);
      setAccounts(accs);
      setGoogleEmail(email);

      // Determine default selected location
      const activeLoc = locs.find((l) => l.isSelected);
      if (activeLoc) {
        setSelectedId(activeLoc.id);
      } else if (currentActiveLocationId) {
        setSelectedId(currentActiveLocationId);
      } else if (locs.length > 0) {
        setSelectedId(locs[0].id);
      }
    } catch (err: any) {
      console.error('Error fetching GBP locations:', err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to fetch Google Business Profile locations.';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLocations();
      setSearchQuery('');
      setSelectedAccountFilter('ALL');
    }
  }, [isOpen]);

  // Filter locations based on search query and account filter
  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      // Account filter
      if (selectedAccountFilter !== 'ALL' && loc.accountName !== selectedAccountFilter) {
        return false;
      }

      // Search query filter
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase().trim();

      const matchTitle = loc.locationTitle.toLowerCase().includes(query);
      const matchAddress = loc.address?.toLowerCase().includes(query) ?? false;
      const matchCategory = loc.primaryCategory?.toLowerCase().includes(query) ?? false;
      const matchStoreCode = loc.storeCode?.toLowerCase().includes(query) ?? false;
      const matchAccount = loc.accountTitle?.toLowerCase().includes(query) ?? false;
      const matchPlaceId = loc.placeId?.toLowerCase().includes(query) ?? false;

      return (
        matchTitle ||
        matchAddress ||
        matchCategory ||
        matchStoreCode ||
        matchAccount ||
        matchPlaceId
      );
    });
  }, [locations, selectedAccountFilter, searchQuery]);

  const handleSelect = async () => {
    if (!selectedId) return;

    setSaving(true);
    setError(null);
    try {
      const res = await axios.post('/api/connections/google/gbp/select', {
        locationId: selectedId,
      });

      const updatedLoc = res.data?.location;
      if (updatedLoc) {
        onLocationSelected(updatedLoc);
      }
      onClose();
    } catch (err: any) {
      console.error('Error selecting location:', err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          'Failed to select this location.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const isAccessDeniedError =
    error &&
    (error.toLowerCase().includes('denied') ||
      error.toLowerCase().includes('403') ||
      error.toLowerCase().includes('not enabled') ||
      error.toLowerCase().includes('permission'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#C84A22] shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Select Google Business Profile Location
                </h2>
                {locations.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                    {locations.length} {locations.length === 1 ? 'Location' : 'Locations'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {googleEmail ? (
                  <span>
                    Authorized Google Account:{' '}
                    <span className="font-mono font-semibold text-slate-700">{googleEmail}</span>
                  </span>
                ) : (
                  'Choose the verified location to analyze with owner-level Google Business Profile audits.'
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchLocations(true)}
              disabled={refreshing || loading}
              title="Refresh locations from Google API"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#C84A22]' : ''}`} />
              <span className="hidden sm:inline">Refresh from Google</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Account Filter Bar (only show when locations exist) */}
        {!loading && !error && locations.length > 0 && (
          <div className="px-6 py-3 bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by business name, address, category, or store code..."
                className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C84A22] focus:border-[#C84A22] transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Account Switcher (if multiple GBP accounts) */}
            {accounts.length > 1 && (
              <div className="relative min-w-[200px]">
                <select
                  value={selectedAccountFilter}
                  onChange={(e) => setSelectedAccountFilter(e.target.value)}
                  className="w-full appearance-none px-3 py-2 pr-8 text-xs font-medium rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#C84A22] transition"
                >
                  <option value="ALL">All Accounts ({accounts.length})</option>
                  {accounts.map((acc) => (
                    <option key={acc.name} value={acc.name}>
                      {acc.accountName || acc.name} {acc.type ? `(${acc.type})` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <RefreshCw className="w-8 h-8 text-[#C84A22] animate-spin mb-3" />
              <p className="text-sm font-semibold text-slate-800">
                Querying Google Business Profile API...
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Discovering all accounts, verified locations, store codes, and metadata accessible to your authorized Google account.
              </p>
            </div>
          ) : error ? (
            <div className="p-5 bg-red-50 border border-red-200 rounded-xl text-red-800 space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-1.5 flex-1">
                  <h4 className="text-xs font-bold text-red-900">
                    {isAccessDeniedError
                      ? 'Google Business Profile API Permission or Activation Issue'
                      : 'Unable to Retrieve Google Business Profile Locations'}
                  </h4>
                  <p className="text-xs text-red-700 leading-relaxed font-mono bg-red-100/60 p-2.5 rounded-lg border border-red-200">
                    {error}
                  </p>
                  {isAccessDeniedError && (
                    <div className="text-xs text-red-800 space-y-1 pt-1">
                      <p className="font-semibold">Prerequisites checklist:</p>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px] text-red-700">
                        <li>
                          Ensure <span className="font-semibold">My Business Account Management API</span> is enabled in Google Cloud Console.
                        </li>
                        <li>
                          Ensure <span className="font-semibold">My Business Business Information API</span> is enabled in Google Cloud Console.
                        </li>
                        <li>
                          Ensure your Google account (<span className="font-mono">{googleEmail || 'connected'}</span>) has Owner or Manager permissions on the target locations.
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-red-200">
                <button
                  onClick={() => fetchLocations(false)}
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition shadow-2xs"
                >
                  Retry Request
                </button>
                <a
                  href="/api/connections/google/gbp"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-300 transition"
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Connect a Different Google Account</span>
                </a>
              </div>
            </div>
          ) : locations.length === 0 ? (
            <div className="py-12 text-center space-y-3.5">
              <Building className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No Business Locations Found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                The Google account <span className="font-semibold text-slate-700">{googleEmail || 'you authorized'}</span> does not currently manage any Google Business Profile locations.
              </p>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-left max-w-md mx-auto text-xs text-amber-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-600" />
                  <span>Account Requirements:</span>
                </div>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  To audit your Business Profile, authorize with the specific Google account that holds Owner or Manager status in your Google Business Profile Manager dashboard.
                </p>
              </div>
              <div className="pt-2">
                <a
                  href="/api/connections/google/gbp"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#C84A22] text-white text-xs font-semibold rounded-xl hover:bg-[#b03e1b] transition shadow-xs"
                >
                  <Store className="w-4 h-4" />
                  <span>Authorize with a Different Google Account</span>
                </a>
              </div>
            </div>
          ) : filteredLocations.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Search className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">
                No locations match &quot;{searchQuery}&quot;
              </p>
              <p className="text-xs text-slate-400">
                Try searching with a different term or clear the filter.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedAccountFilter('ALL');
                }}
                className="mt-2 px-3 py-1.5 text-xs font-semibold text-[#C84A22] hover:underline"
              >
                Clear Search Filter
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>
                  Showing {filteredLocations.length} of {locations.length} Locations
                </span>
                {accounts.length > 0 && (
                  <span className="text-[11px] text-slate-400 font-normal">
                    Across {accounts.length} GBP Account{accounts.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <div className="space-y-2.5">
                {filteredLocations.map((loc) => {
                  const isChecked = selectedId === loc.id;
                  const isServiceArea =
                    loc.address?.toLowerCase().includes('service area') || !loc.address;

                  return (
                    <label
                      key={loc.id}
                      onClick={() => setSelectedId(loc.id)}
                      className={`block p-4 rounded-xl border cursor-pointer transition relative ${
                        isChecked
                          ? 'border-[#C84A22] bg-orange-50/40 ring-1 ring-[#C84A22]'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="gbp_location_choice"
                            checked={isChecked}
                            onChange={() => setSelectedId(loc.id)}
                            className="mt-1 h-4 w-4 text-[#C84A22] focus:ring-[#C84A22] border-slate-300"
                          />
                          <div className="space-y-1.5">
                            {/* Business Name and Badges */}
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-bold text-slate-900">
                                {loc.locationTitle}
                              </span>
                              {loc.isSelected && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Active Location</span>
                                </span>
                              )}
                              {loc.storeCode && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                  Store #{loc.storeCode}
                                </span>
                              )}
                              {loc.accountTitle && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                  <Building2 className="w-3 h-3 text-blue-600" />
                                  <span>{loc.accountTitle}</span>
                                </span>
                              )}
                            </div>

                            {/* Address / Service Area (Critical for distinguishing multi-location businesses) */}
                            {loc.address ? (
                              <div className="text-xs text-slate-700 flex items-start gap-1.5 pt-0.5">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                <span className="font-medium">{loc.address}</span>
                              </div>
                            ) : (
                              <div className="text-xs text-amber-700 flex items-center gap-1.5 pt-0.5">
                                <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                <span className="italic">Service Area Business (No public address)</span>
                              </div>
                            )}

                            {/* Metadata Details (Category, Phone, Website) */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[11px] text-slate-500">
                              {loc.primaryCategory && (
                                <span className="flex items-center gap-1 font-medium text-slate-600">
                                  <Tag className="w-3 h-3 text-slate-400" />
                                  <span>{loc.primaryCategory}</span>
                                </span>
                              )}
                              {loc.phoneNumber && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  <span>{loc.phoneNumber}</span>
                                </span>
                              )}
                              {loc.websiteUri && (
                                <span className="flex items-center gap-1 max-w-[220px] truncate text-slate-600">
                                  <Globe className="w-3 h-3 text-slate-400" />
                                  <span>{loc.websiteUri.replace(/^https?:\/\//, '')}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right side snippet: Place ID */}
                        {loc.placeId && (
                          <span
                            title={`Place ID: ${loc.placeId}`}
                            className="hidden sm:inline-block px-2 py-1 rounded-md bg-slate-100 text-[10px] font-mono text-slate-600 border border-slate-200 shrink-0"
                          >
                            PID: {loc.placeId.slice(0, 10)}...
                          </span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {selectedId ? (
              <span className="text-slate-700">
                Selected:{' '}
                <span className="font-semibold">
                  {locations.find((l) => l.id === selectedId)?.locationTitle || '1 location'}
                </span>
              </span>
            ) : (
              <span>Please select a location above</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSelect}
              disabled={saving || !selectedId || locations.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C84A22] text-white text-xs font-semibold hover:bg-[#b03e1b] transition disabled:opacity-50 shadow-sm"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Activating Location...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Select &amp; Activate Location</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
