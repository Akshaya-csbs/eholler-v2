'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import axios from 'axios';
import {
  User,
  Mail,
  ShieldCheck,
  Building2,
  Calendar,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Lock,
  Layers,
  ArrowRight,
  LogOut,
  Sparkles,
  MapPin,
  ChevronRight,
  Store,
  Pencil,
  Briefcase,
  Phone,
  Globe,
} from 'lucide-react';
import { GbpLocationModal } from './GbpLocationModal';
import { EditProfileModal } from './EditProfileModal';

interface GbpConnectionStatus {
  connected: boolean;
  googleEmail: string | null;
  activeLocation: {
    id: string;
    locationTitle: string;
    accountTitle?: string | null;
    address?: string | null;
    placeId?: string | null;
  } | null;
  totalLocationsCount?: number;
}

interface UserProfileViewProps {
  onOpenGscModal?: () => void;
  gscConnected?: boolean;
  gscProperty?: string | null;
  onOpenGbpLocationModal?: () => void;
  onSelectBusinessAudit?: (placeId: string, name: string) => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  onOpenGscModal,
  gscConnected = false,
  gscProperty = null,
  onOpenGbpLocationModal,
  onSelectBusinessAudit,
}) => {
  const { user, isLoaded } = useUser();

  const [gbpStatus, setGbpStatus] = useState<GbpConnectionStatus>({
    connected: false,
    googleEmail: null,
    activeLocation: null,
  });
  const [profileData, setProfileData] = useState<{
    id?: string;
    name: string | null;
    email: string;
    phoneNumber?: string | null;
    jobTitle?: string | null;
    companyName?: string | null;
    country?: string | null;
    avatarUrl?: string | null;
    isProfileCompleted?: boolean;
  } | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [gbpLoading, setGbpLoading] = useState<boolean>(true);
  const [disconnecting, setDisconnecting] = useState<boolean>(false);
  const [isGbpModalOpen, setIsGbpModalOpen] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Fetch GBP connection status
  const fetchGbpStatus = async () => {
    setGbpLoading(true);
    try {
      const res = await axios.get('/api/connections/google/gbp/status');
      setGbpStatus({
        connected: Boolean(res.data?.connected),
        googleEmail: res.data?.googleEmail || null,
        activeLocation: res.data?.activeLocation || null,
        totalLocationsCount: res.data?.totalLocationsCount || 0,
      });
    } catch (err) {
      console.warn('Could not fetch GBP status:', err);
      setGbpStatus({ connected: false, googleEmail: null, activeLocation: null });
    } finally {
      setGbpLoading(false);
    }
  };

  // Fetch personal profile details
  const fetchUserProfile = async () => {
    try {
      const res = await axios.get('/api/user/profile');
      if (res.data?.profile) {
        setProfileData(res.data.profile);
      }
    } catch (err) {
      console.warn('Could not fetch user profile:', err);
    }
  };

  useEffect(() => {
    fetchGbpStatus();
    fetchUserProfile();

    // Check for query parameters indicating fresh OAuth return
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('gbp') === 'connected') {
        setIsGbpModalOpen(true);
        setFeedbackMessage({
          type: 'success',
          text: 'Google Business Profile connected successfully! Please select your active business location below.',
        });
        window.history.replaceState({}, '', '/?activeTab=profile');
      } else if (params.get('gbp_error')) {
        const err = params.get('gbp_error');
        setFeedbackMessage({
          type: 'error',
          text: `Google Business Profile connection failed: ${err}. Please try again.`,
        });
        window.history.replaceState({}, '', '/?activeTab=profile');
      }
    }
  }, []);

  const handleConnectGbp = () => {
    // Initiate independent Google OAuth for Google Business Profile
    window.location.href = '/api/connections/google/gbp';
  };

  const handleDisconnectGbp = async () => {
    if (!confirm('Are you sure you want to disconnect Google Business Profile? Your Eholler account and Google Search Console will remain completely active.')) {
      return;
    }

    setDisconnecting(true);
    setFeedbackMessage(null);
    try {
      await axios.post('/api/connections/google/gbp/disconnect');
      setFeedbackMessage({
        type: 'success',
        text: 'Google Business Profile disconnected successfully.',
      });
      await fetchGbpStatus();
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to disconnect Google Business Profile.',
      });
    } finally {
      setDisconnecting(false);
    }
  };

  const handleLocationSelected = (location: any) => {
    setGbpStatus((prev) => ({
      ...prev,
      activeLocation: location,
    }));
    setFeedbackMessage({
      type: 'success',
      text: `Active Google Business Profile location updated to "${location.locationTitle}".`,
    });
  };

  const primaryEmail = user?.primaryEmailAddress?.emailAddress || '';
  const fullName = user?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User';
  const createdAtFormatted = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Active';

  // Determine email type display
  const isPersonalDomain = /@(gmail|googlemail|yahoo|hotmail|outlook|live|icloud|aol)\.com$/i.test(primaryEmail);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
          <User className="w-3.5 h-3.5 text-[#C84A22]" />
          <span>Account &amp; Integrations</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Personal Profile &amp; Service Connections
        </h1>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
          Manage your Eholler account credentials, view connected Google accounts, and configure independent Google Business Profile &amp; Search Console authorizations.
        </p>
      </div>

      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-xs underline font-medium hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 1. Eholler User Account Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-[#C84A22] text-white flex items-center justify-center font-bold text-xl shadow-md shadow-orange-900/10">
              {fullName[0] || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{profileData?.name || fullName}</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-[#C84A22] border border-orange-200">
                  Eholler Account
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono text-slate-700">{primaryEmail}</span>
                <span className="text-slate-400">·</span>
                <span className="text-[11px] text-slate-500">
                  {isPersonalDomain ? 'Personal Email' : 'Business Domain'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition shadow-2xs"
            >
              <Pencil className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit Profile</span>
            </button>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Email Verified</span>
            </span>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/50">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Authentication Provider
            </div>
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#C84A22]" />
              <span>Clerk Authentication</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Email OTP + Password protected
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Member Since
            </div>
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{createdAtFormatted}</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Workspace access active
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Workspace Scope
            </div>
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>{profileData?.companyName || 'Primary Workspace'}</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Multi-tenant data isolation enabled
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Role &amp; Company
            </div>
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-slate-500" />
              <span>
                {profileData?.jobTitle || 'Role not specified'}
                {profileData?.companyName ? ` · ${profileData.companyName}` : ''}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {profileData?.companyName ? 'Organization affiliation' : 'Personal account'}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Contact Phone
            </div>
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-500" />
              <span>{profileData?.phoneNumber || 'Not provided'}</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Direct member communication
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Country / Region
            </div>
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span>{profileData?.country || 'Not specified'}</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Regional localization
            </div>
          </div>
        </div>
      </div>

      {/* 2. Google Integrations Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Google Service Connections
          </h3>
          <p className="text-xs text-slate-500">
            Each Google service operates on an independent authorization flow. You may authorize the same Google account or completely different Google accounts for each service.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card A: Google Business Profile */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#C84A22]">
                  <Store className="w-5 h-5" />
                </div>
                {gbpStatus.connected ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Connected</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                    <span>Not Connected</span>
                  </span>
                )}
              </div>

              <h4 className="text-base font-bold text-slate-900">
                Google Business Profile (GBP)
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Connect the Google account that manages your Google Business Profile to unlock Mode B audits, verify location metadata, and audit all 57 profile fields with owner privileges.
              </p>

              {/* Status & Details */}
              <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs">
                {gbpStatus.connected ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Connected Google Email:</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {gbpStatus.googleEmail || 'Authorized Account'}
                      </span>
                    </div>

                    <div className="flex items-start justify-between pt-1 border-t border-slate-200/60">
                      <span className="text-slate-500 font-medium">Selected Location:</span>
                      <div className="text-right">
                        {gbpStatus.activeLocation ? (
                          <>
                            <div className="font-bold text-slate-900">
                              {gbpStatus.activeLocation.locationTitle}
                            </div>
                            {gbpStatus.activeLocation.address && (
                              <div className="text-[11px] text-slate-500 max-w-[200px] truncate">
                                {gbpStatus.activeLocation.address}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-amber-700 font-medium">
                              No location selected ({gbpStatus.totalLocationsCount || 0} available)
                            </span>
                            <button
                              onClick={() => (onOpenGbpLocationModal ? onOpenGbpLocationModal() : setIsGbpModalOpen(true))}
                              className="px-2 py-0.5 text-[10px] font-bold bg-[#C84A22] text-white rounded-md hover:bg-[#b03e1b]"
                            >
                              Choose
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-slate-500 text-[11px] leading-relaxed">
                    <span className="font-semibold text-slate-700">Account Independence:</span> You can authorize with any Google account that has Owner or Manager access to your Google Business Profile. It does not need to match your Eholler login email ({primaryEmail}).
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              {gbpStatus.connected ? (
                <>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => (onOpenGbpLocationModal ? onOpenGbpLocationModal() : setIsGbpModalOpen(true))}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-orange-50 text-[#C84A22] border border-orange-200 hover:bg-orange-100 transition"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Switch Location</span>
                    </button>
                    {gbpStatus.activeLocation && onSelectBusinessAudit && (
                      <button
                        onClick={() =>
                          onSelectBusinessAudit(
                            gbpStatus.activeLocation?.placeId || '',
                            gbpStatus.activeLocation?.locationTitle || ''
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-[#C84A22] text-white hover:bg-[#b03e1b] transition shadow-xs"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Run Audit</span>
                      </button>
                    )}
                  </div>
                  <button
                    onClick={handleDisconnectGbp}
                    disabled={disconnecting}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline disabled:opacity-50"
                  >
                    {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                  </button>
                </>
              ) : (
                <button
                  onClick={handleConnectGbp}
                  disabled={gbpLoading}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#C84A22] text-white text-xs font-semibold hover:bg-[#b03e1b] shadow-sm transition disabled:opacity-50"
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Connect Google Business Profile</span>
                </button>
              )}
            </div>
          </div>

          {/* Card B: Google Search Console */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <Layers className="w-5 h-5" />
                </div>
                {gscConnected ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Connected</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                    <span>Not Connected</span>
                  </span>
                )}
              </div>

              <h4 className="text-base font-bold text-slate-900">
                Google Search Console (GSC)
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Connect Google Search Console to monitor organic search performance, map visibility percentages, top search queries, impressions, and click-through rates.
              </p>

              {/* Status & Details */}
              <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs">
                {gscConnected ? (
                  <div className="flex items-start justify-between">
                    <span className="text-slate-500 font-medium">Selected Property:</span>
                    <span className="font-mono font-semibold text-slate-800 max-w-[220px] truncate text-right">
                      {gscProperty || 'Domain / URL prefix'}
                    </span>
                  </div>
                ) : (
                  <div className="text-slate-500 text-[11px] leading-relaxed">
                    Search Console properties are tracked separately from Google Business Profile. You can link any verified domain property.
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              {gscConnected ? (
                <>
                  <button
                    onClick={onOpenGscModal}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition"
                  >
                    <span>Manage Property</span>
                  </button>
                  <button
                    onClick={onOpenGscModal}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-800 hover:underline"
                  >
                    Settings
                  </button>
                </>
              ) : (
                <button
                  onClick={onOpenGscModal}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 shadow-sm transition"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Connect Google Search Console</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* GBP Location Selection Modal */}
      <GbpLocationModal
        isOpen={isGbpModalOpen}
        onClose={() => setIsGbpModalOpen(false)}
        onLocationSelected={handleLocationSelected}
        currentActiveLocationId={gbpStatus.activeLocation?.id || null}
      />

      {/* Edit Personal Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        currentProfile={
          profileData || {
            name: fullName,
            email: primaryEmail,
          }
        }
        onProfileUpdated={(updated) => {
          setProfileData(updated);
          setFeedbackMessage({
            type: 'success',
            text: 'Personal profile updated successfully.',
          });
        }}
      />
    </div>
  );
};
