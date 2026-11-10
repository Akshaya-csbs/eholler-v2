'use client';

import React, { useState } from 'react';
import {
  BarChart3,
  Globe,
  ExternalLink,
  CheckCircle2,
  Copy,
  Check,
  TrendingUp,
  MapPin,
  Phone,
  Calendar,
  Sparkles,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface AnalyticsViewProps {
  businessWebsiteUrl?: string;
  onBackToDashboard?: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  businessWebsiteUrl = '',
  onBackToDashboard,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const website = businessWebsiteUrl || 'https://yourbusiness.com';
  const cleanWebsite = website.replace(/\/+$/, '');

  const gbpUtmUrl = `${cleanWebsite}/?utm_source=google&utm_medium=organic&utm_campaign=gbp_listing`;
  const bookingUtmUrl = `${cleanWebsite}/book?utm_source=google&utm_medium=organic&utm_campaign=gbp_booking`;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(id);
    setTimeout(() => setCopiedField(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-600 mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>Google Analytics 4 (GA4) Integration &amp; Telemetry</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Local SEO Web Analytics &amp; Conversion Tracking</h2>
          <p className="text-xs text-gray-500 mt-1">
            Track user journeys from Google Business Profile and local search results directly into website visits and phone conversions.
          </p>
        </div>

        {onBackToDashboard && (
          <button
            onClick={onBackToDashboard}
            className="px-3.5 py-1.5 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            Back to Dashboard
          </button>
        )}
      </div>

      {/* GA4 Overview / Telemetry Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
          <div className="w-9 h-9 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
            <MapPin className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-gray-900">GBP Traffic Attribution</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Separate general organic website traffic from high-intent Google Maps profile visits using tagged landing page URLs.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Phone className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-gray-900">Local Action Conversions</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Measure critical local conversion signals: click-to-call phone inquiries, contact forms, directions requests, and bookings.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-gray-900">Landing Page Engagement</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Evaluate bounce rates and engagement duration on geo-targeted service pages to inform your on-page SEO optimization.
          </p>
        </div>
      </div>

      {/* Recommended UTM Tagging for GBP Listing */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              Recommended Google Business Profile UTM Tagging
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Copy and set these tagged URLs inside your Google Business Profile &quot;Website&quot; and &quot;Appointment&quot; fields to track profile clicks in GA4.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded bg-orange-50 text-orange-700 text-[11px] font-bold border border-orange-200">
            Best Practice
          </span>
        </div>

        <div className="space-y-4">
          {/* Main Website URL */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800">
                1. Primary Business Profile Website URL
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(gbpUtmUrl, 'primary-url')}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 flex items-center gap-1.5 transition shadow-2xs"
              >
                {copiedField === 'primary-url' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-semibold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-gray-500" />
                    <span>Copy URL</span>
                  </>
                )}
              </button>
            </div>
            <code className="block bg-white p-2.5 rounded-lg border border-gray-200 text-xs font-mono text-gray-800 break-all select-all">
              {gbpUtmUrl}
            </code>
            <p className="text-[11px] text-gray-500">
              In your GBP Dashboard &gt; Edit Profile &gt; Contact &gt; Website, paste this URL so all clicks are segmented under &quot;gbp_listing&quot; in GA4.
            </p>
          </div>

          {/* Appointment / Booking URL */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800">
                2. Appointment / Booking Action Link
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(bookingUtmUrl, 'booking-url')}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 flex items-center gap-1.5 transition shadow-2xs"
              >
                {copiedField === 'booking-url' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-semibold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-gray-500" />
                    <span>Copy URL</span>
                  </>
                )}
              </button>
            </div>
            <code className="block bg-white p-2.5 rounded-lg border border-gray-200 text-xs font-mono text-gray-800 break-all select-all">
              {bookingUtmUrl}
            </code>
            <p className="text-[11px] text-gray-500">
              In your GBP Dashboard &gt; Edit Profile &gt; Booking Link, use this tagged destination to isolate appointment generation.
            </p>
          </div>
        </div>
      </div>

      {/* Recommended Custom Events Guide */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-gray-900">
          Essential GA4 Events for Local SEO Measurement
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-1.5">
            <div className="flex items-center justify-between">
              <code className="font-mono font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded">
                click_to_call
              </code>
              <span className="text-[10px] text-gray-500 uppercase font-semibold">Lead Trigger</span>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Fires whenever a visitor taps on your website phone link (<code className="font-mono">tel:</code>). High correlation with immediate customer revenue.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-1.5">
            <div className="flex items-center justify-between">
              <code className="font-mono font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                get_directions
              </code>
              <span className="text-[10px] text-gray-500 uppercase font-semibold">Store Footfall</span>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Fires when a customer clicks a map embed or directions link to your physical address. Key indicator for brick-and-mortar storefronts.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-1.5">
            <div className="flex items-center justify-between">
              <code className="font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                generate_lead
              </code>
              <span className="text-[10px] text-gray-500 uppercase font-semibold">Inquiry Conversion</span>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Fires upon submission of a contact form, quote request, or callback booking on local service landing pages.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-1.5">
            <div className="flex items-center justify-between">
              <code className="font-mono font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                local_review_click
              </code>
              <span className="text-[10px] text-gray-500 uppercase font-semibold">Social Proof</span>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Fires when users click to leave a Google review or read customer testimonials on your verified profile.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

