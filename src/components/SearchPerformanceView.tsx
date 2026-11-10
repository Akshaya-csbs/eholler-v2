'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  TrendingUp,
  Search,
  MousePointerClick,
  Eye,
  Percent,
  Hash,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Calendar,
  Lock,
  ArrowUpDown,
  CheckCircle2,
} from 'lucide-react';
import { GscAnalyticsResult, GscQueryRow } from '@/lib/types';

interface SearchPerformanceViewProps {
  gscConnected: boolean;
  selectedProperty: string | null;
  onOpenGscModal: () => void;
  onBackToDashboard?: () => void;
}

export const SearchPerformanceView: React.FC<SearchPerformanceViewProps> = ({
  gscConnected,
  selectedProperty,
  onOpenGscModal,
  onBackToDashboard,
}) => {
  const [days, setDays] = useState<7 | 28 | 90>(28);
  const [analytics, setAnalytics] = useState<GscAnalyticsResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'clicks' | 'impressions' | 'ctr' | 'position'>('clicks');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchPerformance = async (selectedDays: number) => {
    if (!gscConnected || !selectedProperty) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get<GscAnalyticsResult>(
        `/api/connections/google/analytics?days=${selectedDays}&siteUrl=${encodeURIComponent(selectedProperty)}`
      );
      setAnalytics(res.data);
    } catch (err: any) {
      setError(
        err.response?.data?.error || err.message || 'Failed to retrieve Google Search Console metrics.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (gscConnected && selectedProperty) {
      fetchPerformance(days);
    }
  }, [gscConnected, selectedProperty, days]);

  const handleDaysChange = (newDays: 7 | 28 | 90) => {
    setDays(newDays);
  };

  // Filter and sort queries
  const filteredQueries = (analytics?.queries || [])
    .filter((q) => q.query.toLowerCase().includes(searchQuery.toLowerCase().trim()))
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'clicks') comparison = a.clicks - b.clicks;
      else if (sortBy === 'impressions') comparison = a.impressions - b.impressions;
      else if (sortBy === 'ctr') comparison = a.ctr - b.ctr;
      else if (sortBy === 'position') comparison = a.position - b.position;

      return sortOrder === 'desc' ? -comparison : comparison;
    });

  const toggleSort = (column: 'clicks' | 'impressions' | 'ctr' | 'position') => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(column);
      setSortOrder(column === 'position' ? 'asc' : 'desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-600 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Google Search Console Performance</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Organic Search Queries &amp; Visibility</h2>
          <p className="text-xs text-gray-500 mt-1">
            Real performance telemetry direct from Google Search Console, tracking exact customer queries and rankings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="px-3.5 py-1.5 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Back to Dashboard
            </button>
          )}

          {gscConnected && (
            <button
              onClick={() => fetchPerformance(days)}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 transition disabled:opacity-50"
              title="Refresh Google Search Console data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-orange-600' : ''}`} />
              <span>Refresh</span>
            </button>
          )}
        </div>
      </div>

      {!gscConnected || !selectedProperty ? (
        /* Disconnected State Card */
        <div className="bg-white rounded-2xl p-10 border border-gray-200 shadow-sm text-center max-w-xl mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center mx-auto">
            <TrendingUp className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-gray-900">Connect Google Search Console</h3>
            <p className="text-xs text-gray-500 leading-relaxed max-w-md mx-auto">
              Link your verified Search Console property to inspect real customer impressions, organic clicks, CTR, and keyword rankings directly inside Eholler.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={onOpenGscModal}
              className="px-5 py-2.5 bg-[#C84A22] hover:bg-[#B33E1A] text-white text-xs font-semibold rounded-xl shadow-sm transition inline-flex items-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>Connect Search Console</span>
            </button>
          </div>
        </div>
      ) : (
        /* Connected State with Controls and KPIs */
        <>
          {/* Controls Bar */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="font-semibold text-gray-900">Property:</span>
              <code className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded font-mono text-xs">
                {selectedProperty}
              </code>
              <button
                onClick={onOpenGscModal}
                className="text-orange-600 hover:text-orange-800 font-medium underline text-xs ml-1"
              >
                Change
              </button>
            </div>

            {/* Date Range Selector (7 / 28 / 90 days) */}
            <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => handleDaysChange(7)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  days === 7
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Last 7 Days
              </button>
              <button
                type="button"
                onClick={() => handleDaysChange(28)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  days === 28
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Last 28 Days
              </button>
              <button
                type="button"
                onClick={() => handleDaysChange(90)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  days === 90
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Last 90 Days
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => setError(null)}
                className="underline font-semibold hover:text-red-900 text-xs"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-gray-500">
                <span className="text-xs font-bold uppercase tracking-wider">Total Clicks</span>
                <MousePointerClick className="w-4 h-4 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {analytics?.clicks !== undefined ? analytics.clicks.toLocaleString() : '—'}
              </div>
              <div className="text-[11px] text-gray-400">Direct organic visits from Google Search</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-gray-500">
                <span className="text-xs font-bold uppercase tracking-wider">Total Impressions</span>
                <Eye className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {analytics?.impressions !== undefined ? analytics.impressions.toLocaleString() : '—'}
              </div>
              <div className="text-[11px] text-gray-400">Total times business appeared in search</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-gray-500">
                <span className="text-xs font-bold uppercase tracking-wider">Average CTR</span>
                <Percent className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {analytics?.ctr !== undefined ? `${(analytics.ctr * 100).toFixed(2)}%` : '—'}
              </div>
              <div className="text-[11px] text-gray-400">Click-through rate from search impressions</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-gray-500">
                <span className="text-xs font-bold uppercase tracking-wider">Average Position</span>
                <Hash className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {analytics?.averagePosition !== undefined ? analytics.averagePosition.toFixed(1) : '—'}
              </div>
              <div className="text-[11px] text-gray-400">Mean rank across all search impressions</div>
            </div>
          </div>

          {/* Search Queries Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-900">Top Performing Search Queries</h3>
                <span className="text-xs text-gray-400 font-medium">
                  ({filteredQueries.length} {filteredQueries.length === 1 ? 'query' : 'queries'})
                </span>
              </div>

              {/* Filter Input */}
              <div className="relative max-w-xs w-full">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter queries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>

            {loading ? (
              <div className="py-16 text-center space-y-3">
                <RefreshCw className="w-7 h-7 text-orange-600 animate-spin mx-auto" />
                <div className="text-xs text-gray-500 font-medium">
                  Loading Search Console queries for last {days} days...
                </div>
              </div>
            ) : filteredQueries.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <p className="text-xs font-semibold text-gray-700">No search queries found</p>
                <p className="text-[11px] text-gray-400 max-w-sm mx-auto">
                  {searchQuery
                    ? `No queries matched "${searchQuery}". Try clearing your search filter.`
                    : 'Google Search Console recorded 0 query impressions for this time window.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-600 uppercase font-semibold text-[10px] tracking-wider border-b border-gray-100">
                    <tr>
                      <th className="px-5 py-3">Search Query</th>
                      <th
                        className="px-4 py-3 text-right cursor-pointer hover:text-gray-900"
                        onClick={() => toggleSort('clicks')}
                      >
                        <span className="inline-flex items-center gap-1">
                          Clicks
                          <ArrowUpDown className="w-3 h-3" />
                        </span>
                      </th>
                      <th
                        className="px-4 py-3 text-right cursor-pointer hover:text-gray-900"
                        onClick={() => toggleSort('impressions')}
                      >
                        <span className="inline-flex items-center gap-1">
                          Impressions
                          <ArrowUpDown className="w-3 h-3" />
                        </span>
                      </th>
                      <th
                        className="px-4 py-3 text-right cursor-pointer hover:text-gray-900"
                        onClick={() => toggleSort('ctr')}
                      >
                        <span className="inline-flex items-center gap-1">
                          CTR
                          <ArrowUpDown className="w-3 h-3" />
                        </span>
                      </th>
                      <th
                        className="px-5 py-3 text-right cursor-pointer hover:text-gray-900"
                        onClick={() => toggleSort('position')}
                      >
                        <span className="inline-flex items-center gap-1">
                          Average Rank
                          <ArrowUpDown className="w-3 h-3" />
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredQueries.map((q, idx) => {
                      const positionBadge =
                        q.position <= 3
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : q.position <= 10
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-gray-50 text-gray-600 border-gray-200';

                      return (
                        <tr key={idx} className="hover:bg-orange-50/20 transition">
                          <td className="px-5 py-3 font-medium text-gray-900 max-w-xs truncate">
                            {q.query}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900">
                            {q.clicks.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600">
                            {q.impressions.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600">
                            {(q.ctr * 100).toFixed(2)}%
                          </td>
                          <td className="px-5 py-3 text-right">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${positionBadge}`}
                            >
                              #{q.position.toFixed(1)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

