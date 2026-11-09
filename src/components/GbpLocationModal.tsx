'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';

interface GbpLocation {
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

interface GbpAccount {
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
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [locations, setLocations] = useState<GbpLocation[]>([]);
  const [accounts, setAccounts] = useState<GbpAccount[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(currentActiveLocationId || null);

  const fetchLocations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/connections/google/gbp/locations');
      const locs: GbpLocation[] = res.data?.locations || [];
      const accs: GbpAccount[] = res.data?.accounts || [];
      setLocations(locs);
      setAccounts(accs);

      // Determine default selected
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
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLocations();
    }
  }, [isOpen]);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#C84A22]">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Select Business Profile Location
              </h2>
              <p className="text-xs text-slate-500">
                Choose the location to analyze with owner-level Google Business Profile audits.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <RefreshCw className="w-8 h-8 text-[#C84A22] animate-spin mb-3" />
              <p className="text-sm font-semibold text-slate-800">
                Querying Google Business Profile API...
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Fetching all verified accounts and locations linked to your authorized Google account.
              </p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-red-900">Unable to retrieve locations</h4>
                  <p className="text-xs text-red-700 leading-relaxed">{error}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={fetchLocations}
                  className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 text-xs font-semibold rounded-lg transition"
                >
                  Retry Request
                </button>
                <a
                  href="/api/connections/google/gbp"
                  className="text-xs font-semibold text-red-700 underline hover:text-red-900"
                >
                  Reconnect with a Different Google Account
                </a>
              </div>
            </div>
          ) : locations.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <Building className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No Locations Found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                We did not find any business locations associated with this Google account. Please ensure your Google account has Owner or Manager role on Google Business Profile.
              </p>
              <div className="pt-2">
                <a
                  href="/api/connections/google/gbp"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#C84A22] text-white text-xs font-semibold rounded-xl hover:bg-[#b03e1b] transition shadow-xs"
                >
                  <Store className="w-4 h-4" />
                  <span>Connect a Different Google Account</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Available Locations ({locations.length})</span>
                {accounts.length > 0 && (
                  <span className="text-[11px] text-slate-400 font-normal">
                    Across {accounts.length} GBP Account{accounts.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <div className="space-y-2.5">
                {locations.map((loc) => {
                  const isChecked = selectedId === loc.id;
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
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-900">
                                {loc.locationTitle}
                              </span>
                              {loc.isSelected && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Active Location</span>
                                </span>
                              )}
                            </div>

                            {loc.accountTitle && (
                              <div className="text-[11px] text-slate-500 font-medium">
                                Account: {loc.accountTitle}
                              </div>
                            )}

                            {loc.address && (
                              <div className="text-xs text-slate-600 flex items-center gap-1.5 pt-0.5">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{loc.address}</span>
                              </div>
                            )}

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[11px] text-slate-500">
                              {loc.primaryCategory && (
                                <span className="flex items-center gap-1">
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
                                <span className="flex items-center gap-1 max-w-[200px] truncate">
                                  <Globe className="w-3 h-3 text-slate-400" />
                                  <span>{loc.websiteUri}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {loc.placeId && (
                          <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-mono text-slate-600">
                            ID: {loc.placeId.slice(0, 10)}...
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
                <span>Setting Active Location...</span>
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
  );
};

