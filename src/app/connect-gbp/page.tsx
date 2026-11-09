'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import {
  Store,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Info,
  Layers,
  MapPin,
} from 'lucide-react';

export default function ConnectGbpOnboardingPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const primaryEmail = user?.primaryEmailAddress?.emailAddress || '';

  const handleConnect = () => {
    window.location.href = '/api/connections/google/gbp?from=onboarding';
  };

  const handleSkip = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-[#C84A22] text-xs font-bold mb-3 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Step 3 of Onboarding (Optional)</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
          Connect Google Business Profile
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
          Link the Google account that manages your Business Profile to unlock Mode B audits, verify location metadata, and inspect all 57 profile fields with owner privileges.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-3xl sm:px-10 space-y-6">
          {/* Account Independence Info Banner */}
          <div className="p-4 bg-orange-50/60 rounded-2xl border border-orange-100 flex items-start gap-3">
            <Info className="w-5 h-5 text-[#C84A22] shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 leading-relaxed">
              <span className="font-bold text-slate-900">Separate Google Account Supported:</span>{' '}
              You may connect any Google account that holds Owner or Manager access on Google Business Profile. It does <span className="font-semibold underline">not</span> need to match your Eholler login email ({primaryEmail || 'current account'}).
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
                <span>Location Selector</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Automatically retrieve and select from all locations accessible to your authorized Google account.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleConnect}
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
              <span>Skip for now &amp; Continue to Manual Dashboard</span>
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

