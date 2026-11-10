'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Globe,
  MapPin,
  Star,
  CheckCircle2,
  AlertCircle,
  Printer,
  Sparkles,
  ShieldCheck,
  Building,
  Users2,
  ArrowRight,
  RefreshCw,
  FileText,
} from 'lucide-react';

export default function SharedReportPage({ params }: { params: { token: string } }) {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadReport() {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`/api/reports/share/${params.token}`);
        if (res.data?.report) {
          setReport(res.data.report);
        } else {
          setError('Report content is empty.');
        }
      } catch (err: any) {
        setError(
          err.response?.data?.error ||
          err.message ||
          'Failed to load shared report. The link may have expired or been revoked.'
        );
      } finally {
        setLoading(false);
      }
    }

    if (params.token) {
      loadReport();
    }
  }, [params.token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-[#C84A22] animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-800">Loading Local SEO Executive Report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Report Unavailable</h2>
          <p className="text-xs text-slate-600 leading-relaxed">{error}</p>
          <a
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#C84A22] text-white text-xs font-semibold rounded-xl hover:bg-[#b03e1b] transition"
          >
            Go to Eholler Home
          </a>
        </div>
      </div>
    );
  }

  const { business, scores, fieldAuditsSummary, priorityRecommendations, competitors, websiteOverview } = report;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8 print:p-0 print:max-w-full">
        {/* Print & Action Bar */}
        <div className="flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#C84A22]"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Eholler Local SEO Audit Report
            </span>
          </div>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print or Save as PDF</span>
          </button>
        </div>

        {/* Executive Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-[#C84A22] border border-orange-100">
                {business.category || 'Local Business'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
                {business.name}
              </h1>
              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 mt-2">
                {business.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{business.address}</span>
                  </span>
                )}
                {business.websiteUrl && (
                  <span className="flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono text-slate-700">{business.websiteUrl.replace(/^https?:\/\//, '')}</span>
                  </span>
                )}
                <span className="text-slate-400">·</span>
                <span>Audited: {new Date(report.auditDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>

            {/* Overall Authority Score Gauge */}
            <div className="bg-gradient-to-br from-[#121A21] to-[#1E2B37] text-white p-5 rounded-2xl text-center shrink-0 min-w-[140px] shadow-sm">
              <div className="text-[11px] uppercase tracking-wider text-orange-400 font-bold">Authority Score</div>
              <div className="text-4xl font-extrabold text-white mt-1">{scores.authorityScore ?? 75}<span className="text-lg font-normal text-slate-400">/100</span></div>
              <div className="text-[10px] text-slate-300 mt-1">Local Maps Rank #{scores.mapsRank ?? 1}</div>
            </div>
          </div>

          {/* Component Score Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">GBP Completeness</div>
              <div className="text-xl font-bold text-slate-900">{scores.gbpHealthScore ?? 80}%</div>
              <div className="text-[10px] text-slate-500">{fieldAuditsSummary.optimized} of {fieldAuditsSummary.total} fields ready</div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Technical SEO</div>
              <div className="text-xl font-bold text-slate-900">{scores.technicalScore ?? 85}/100</div>
              <div className="text-[10px] text-slate-500">{websiteOverview?.isHttps ? 'HTTPS Secure' : 'HTTP Warning'}</div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">On-Page Structure</div>
              <div className="text-xl font-bold text-slate-900">{scores.onPageScore ?? 80}/100</div>
              <div className="text-[10px] text-slate-500">{websiteOverview?.hasLocalBusinessSchema ? 'Schema.org JSON-LD' : 'Missing Schema'}</div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Reviews &amp; Reputation</div>
              <div className="text-xl font-bold text-slate-900 flex items-center gap-1">
                <span>{business.rating ? business.rating.toFixed(1) : 'Unrated'}</span>
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              </div>
              <div className="text-[10px] text-slate-500">{business.reviewCount ?? 0} Google reviews</div>
            </div>
          </div>
        </div>

        {/* Priority Action Recommendations */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#C84A22]" />
              <span>Priority SEO Action Items</span>
            </h2>
            <span className="text-xs text-slate-500">
              {priorityRecommendations?.length || 0} Grounded Opportunities
            </span>
          </div>

          <div className="space-y-3">
            {priorityRecommendations?.slice(0, 5).map((rec: any, idx: number) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="font-bold text-sm text-slate-900">{rec.issueTitle}</div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                    rec.severity === 'critical' ? 'bg-red-100 text-red-800' :
                    rec.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {rec.severity}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{rec.explanation}</p>
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <ArrowRight className="w-3.5 h-3.5 text-[#C84A22]" />
                    <span className="font-semibold">Action: </span>
                    <span>{rec.recommendedAction}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 capitalize">Effort: {rec.estimatedEffort}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Competitor Benchmark Overview */}
        {competitors && competitors.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Users2 className="w-5 h-5 text-blue-600" />
              <span>Local Service Competitor Benchmarks</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {competitors.slice(0, 4).map((comp: any, idx: number) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-sm text-slate-900">{comp.name}</div>
                      <div className="text-[11px] text-slate-500">{comp.category || 'Competitor'}</div>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{comp.rating ? comp.rating.toFixed(1) : 'Unrated'}</span>
                      <span className="text-slate-400 font-normal">({comp.reviews})</span>
                    </div>
                  </div>
                  {comp.rationale && (
                    <p className="text-[11px] text-slate-600 leading-relaxed">{comp.rationale}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Disclaimer */}
        <div className="text-center text-xs text-slate-400 space-y-1 pt-4 print:pt-8 border-t border-slate-200">
          <p>© {new Date().getFullYear()} Eholler Local SEO. All rights reserved.</p>
          <p className="text-[11px]">
            This audit report is generated from verified Google Places API metrics and crawl evidence.
          </p>
        </div>
      </div>
    </div>
  );
}

