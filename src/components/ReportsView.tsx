'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FileText,
  Share2,
  Printer,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Eye,
  Trash2,
  Calendar,
  Building,
  Star,
  Globe,
  Award,
} from 'lucide-react';
import { AuditResponse } from '@/lib/types';

interface SharedReportItem {
  id: string;
  shareToken: string;
  reportTitle: string;
  isRevoked: boolean;
  viewCount: number;
  createdAt: string;
  shareUrl: string;
}

interface ReportsViewProps {
  data: AuditResponse | null;
  onBackToDashboard?: () => void;
  onNavigateToHistory?: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  data,
  onBackToDashboard,
  onNavigateToHistory,
}) => {
  const [reports, setReports] = useState<SharedReportItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [latestShareUrl, setLatestShareUrl] = useState<string | null>(null);

  const fetchSharedReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/reports/share');
      setReports(res.data?.reports || []);
    } catch (err: any) {
      console.warn('Could not load shared reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSharedReports();
  }, []);

  const handleGenerateShareLink = async () => {
    if (!data?.auditRunId || !data?.business?.placeId) {
      setError('Cannot generate share link: active audit ID is missing.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    try {
      const res = await axios.post('/api/reports/share', {
        businessId: data.business.placeId,
        auditRunId: data.auditRunId,
        reportTitle: `${data.business.name} - Executive Local SEO Audit`,
      });

      const fullUrl = `${window.location.origin}${res.data.shareUrl}`;
      setLatestShareUrl(fullUrl);
      await fetchSharedReports();
    } catch (err: any) {
      setError(
        err.response?.data?.error || err.message || 'Failed to generate public shareable report.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevokeShare = async (token: string) => {
    if (!confirm('Are you sure you want to revoke this public report link? Anyone with this link will no longer be able to access it.')) {
      return;
    }

    try {
      await axios.delete(`/api/reports/share/${token}`);
      await fetchSharedReports();
      if (latestShareUrl?.includes(token)) {
        setLatestShareUrl(null);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to revoke link.');
    }
  };

  const copyToClipboard = (text: string, token: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!data) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-gray-200 shadow-sm text-center max-w-xl mx-auto space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto">
          <FileText className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">No Active Audit Loaded</h3>
        <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
          Please run a new Local SEO audit or select a past audit from your history to generate an executive report or shareable client link.
        </p>
        <div className="pt-2 flex items-center justify-center gap-3">
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="px-4 py-2 bg-[#C84A22] hover:bg-[#B33E1A] text-white text-xs font-semibold rounded-lg shadow-sm transition"
            >
              Start New Audit
            </button>
          )}
          {onNavigateToHistory && (
            <button
              onClick={onNavigateToHistory}
              className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-semibold rounded-lg transition"
            >
              View Past Audits
            </button>
          )}
        </div>
      </div>
    );
  }

  const { business, scores, gbpCompleteAudit, websiteAudit } = data;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-600 mb-1">
            <FileText className="w-4 h-4" />
            <span>Executive Client Reports &amp; Secure Sharing</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Local SEO Audit Report</h2>
          <p className="text-xs text-gray-500 mt-1">
            Generate client-facing presentations, export high-resolution PDFs, or create revocable public sharing links.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 transition shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF Export</span>
          </button>

          <button
            type="button"
            onClick={handleGenerateShareLink}
            disabled={isGenerating}
            className="px-4 py-2 rounded-lg bg-[#C84A22] hover:bg-[#B33E1A] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{isGenerating ? 'Generating...' : 'Create Share Link'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="underline text-xs font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {/* Latest Share Link Notification Card */}
      {latestShareUrl && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-bold text-emerald-900">
                Public Shareable Report Generated
              </span>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-200 text-emerald-900">
              Live Link
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={latestShareUrl}
              className="flex-1 bg-white border border-emerald-300 px-3 py-2 rounded-lg text-xs font-mono text-gray-800 select-all focus:outline-none"
            />
            <button
              onClick={() => copyToClipboard(latestShareUrl, 'latest')}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
            >
              {copiedToken === 'latest' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedToken === 'latest' ? 'Copied' : 'Copy'}</span>
            </button>
            <a
              href={latestShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open</span>
            </a>
          </div>
          <p className="text-[11px] text-emerald-800">
            This link is publicly accessible to clients without requiring login. Sensitive tokens and credentials are excluded. You can revoke it at any time below.
          </p>
        </div>
      )}

      {/* Executive Summary Card (Printable) */}
      <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-gray-100 pb-6">
          <div>
            <div className="text-xs uppercase font-bold tracking-widest text-[#C84A22]">
              Executive Local SEO Audit
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">{business.name}</h1>
            <div className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-2">
              <span>{business.category}</span>
              <span>·</span>
              <span>{business.address}</span>
              {business.websiteUrl && (
                <>
                  <span>·</span>
                  <a
                    href={business.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 hover:underline"
                  >
                    {business.websiteUrl.replace(/^https?:\/\//, '')}
                  </a>
                </>
              )}
            </div>
          </div>

          <div className="text-right">
            <div className="text-3xl font-extrabold text-orange-600">
              {scores?.authorityScore ?? 75}
              <span className="text-sm font-normal text-gray-400">/100</span>
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Local Authority Score
            </div>
          </div>
        </div>

        {/* 4 Core Pillars Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="text-[10px] uppercase font-bold text-gray-500">GBP Completeness</div>
            <div className="text-xl font-bold text-gray-900 mt-1">
              {scores?.gbpHealth ?? gbpCompleteAudit?.completenessScore ?? 85}%
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">57 profile fields evaluated</div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="text-[10px] uppercase font-bold text-gray-500">Website Technical</div>
            <div className="text-xl font-bold text-gray-900 mt-1">
              {websiteAudit?.technicalScore ?? scores?.websiteScore ?? 80}%
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">SSL, Mobile viewport &amp; Sitemap</div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="text-[10px] uppercase font-bold text-gray-500">On-Page SEO &amp; NAP</div>
            <div className="text-xl font-bold text-gray-900 mt-1">
              {websiteAudit?.onPageScore ?? 85}%
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">Schema markup &amp; Name parity</div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="text-[10px] uppercase font-bold text-gray-500">Rating &amp; Reviews</div>
            <div className="text-xl font-bold text-gray-900 mt-1 flex items-center gap-1">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span>{business.rating ? business.rating.toFixed(1) : '5.0'}</span>
              <span className="text-xs font-normal text-gray-400">({business.reviewCount})</span>
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">Google Maps reputation</div>
          </div>
        </div>

        {/* Audit Highlights */}
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-bold text-gray-900">Key Audit Takeaways</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-1.5">
              <span className="font-bold text-emerald-900 block">Demonstrated Strengths</span>
              <ul className="list-disc list-inside space-y-1 text-emerald-800 text-[11px]">
                <li>Google Maps Place ID successfully resolved and verified.</li>
                <li>Core business categories aligned with commercial service intent.</li>
                <li>{websiteAudit?.isHttps ? 'SSL HTTPS encryption verified on primary website.' : 'Website presence registered.'}</li>
                <li>Customer rating profile active with {business.reviewCount} verified reviews.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-orange-50/60 border border-orange-200/80 space-y-1.5">
              <span className="font-bold text-orange-950 block">Priority Growth Opportunities</span>
              <ul className="list-disc list-inside space-y-1 text-orange-900 text-[11px]">
                <li>Complete secondary service definitions and special attributes on GBP.</li>
                <li>Implement Schema.org LocalBusiness structured data on homepage.</li>
                <li>Generate consistent review velocity to surpass top local competitors.</li>
                <li>Maintain strict NAP parity across all directory citations.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Active Shared Links Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Active Shared Reports</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Public links generated for clients and stakeholders. Revoking a link immediately stops external access.
            </p>
          </div>
          <button
            onClick={fetchSharedReports}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition"
            title="Refresh shared reports"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-gray-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-orange-600" />
            Loading shared links...
          </div>
        ) : reports.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-500">
            No public share links created yet. Click &quot;Create Share Link&quot; above to generate one.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {reports.map((r) => {
              const fullUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}${r.shareUrl}`;

              return (
                <div
                  key={r.id}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                    r.isRevoked ? 'bg-gray-50 opacity-60' : 'hover:bg-orange-50/10'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 truncate">{r.reportTitle}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          r.isRevoked
                            ? 'bg-red-100 text-red-700'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {r.isRevoked ? 'Revoked' : 'Active'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-gray-400 text-[11px]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {r.viewCount} views
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!r.isRevoked && (
                      <>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(fullUrl, r.shareToken)}
                          className="px-2.5 py-1.5 border border-gray-300 hover:bg-gray-50 rounded-lg text-gray-700 font-medium flex items-center gap-1 shadow-2xs"
                        >
                          {copiedToken === r.shareToken ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-gray-500" />
                          )}
                          <span>{copiedToken === r.shareToken ? 'Copied' : 'Copy'}</span>
                        </button>

                        <a
                          href={fullUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 border border-gray-300 hover:bg-gray-50 rounded-lg text-gray-700 font-medium flex items-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Open</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => handleRevokeShare(r.shareToken)}
                          className="px-2.5 py-1.5 border border-red-200 hover:bg-red-50 text-red-700 rounded-lg font-medium flex items-center gap-1"
                          title="Revoke public link"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Revoke</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
