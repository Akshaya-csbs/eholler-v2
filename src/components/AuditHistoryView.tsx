'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  History,
  Building,
  Calendar,
  Award,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  GitCompare,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

interface AuditHistoryItem {
  id: string;
  businessId: string;
  businessName: string;
  city?: string;
  category?: string;
  status: string;
  authorityScore?: number;
  mapsRank?: number;
  gbpHealthScore?: number;
  createdAt: string;
  completedAt?: string;
}

interface AuditComparisonData {
  baseAudit: {
    id: string;
    createdAt: string;
    authorityScore?: number;
    gbpHealthScore?: number;
    mapsRank?: number;
    businessName: string;
  };
  targetAudit: {
    id: string;
    createdAt: string;
    authorityScore?: number;
    gbpHealthScore?: number;
    mapsRank?: number;
    businessName: string;
  };
  deltas: {
    authorityScoreDelta: number;
    gbpHealthScoreDelta: number;
    mapsRankDelta: number;
  };
  resolvedFields: string[];
  newIssues: string[];
  remainingIssues: string[];
}

interface AuditHistoryViewProps {
  onSelectAudit: (auditId: string) => void;
  currentAuditRunId?: string;
  onBackToDashboard?: () => void;
}

export const AuditHistoryView: React.FC<AuditHistoryViewProps> = ({
  onSelectAudit,
  currentAuditRunId,
  onBackToDashboard,
}) => {
  const [audits, setAudits] = useState<AuditHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Comparison state
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [comparisonLoading, setComparisonLoading] = useState<boolean>(false);
  const [comparisonData, setComparisonData] = useState<AuditComparisonData | null>(null);
  const [comparisonError, setComparisonError] = useState<string | null>(null);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/audit?list=true');
      setAudits(res.data?.audits || []);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load audit history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const toggleSelectForCompare = (auditId: string) => {
    setSelectedForCompare((prev) => {
      if (prev.includes(auditId)) {
        return prev.filter((id) => id !== auditId);
      }
      if (prev.length >= 2) {
        // Keep the second one and add the new one
        return [prev[1], auditId];
      }
      return [...prev, auditId];
    });
  };

  const runComparison = async () => {
    if (selectedForCompare.length !== 2) return;
    setIsComparing(true);
    setComparisonLoading(true);
    setComparisonError(null);
    try {
      // Find the two audits and order chronologically (older is base, newer is target)
      const auditA = audits.find((a) => a.id === selectedForCompare[0]);
      const auditB = audits.find((a) => a.id === selectedForCompare[1]);

      let baseId = selectedForCompare[0];
      let targetId = selectedForCompare[1];

      if (auditA && auditB) {
        const timeA = new Date(auditA.createdAt).getTime();
        const timeB = new Date(auditB.createdAt).getTime();
        if (timeA > timeB) {
          baseId = auditB.id;
          targetId = auditA.id;
        }
      }

      const res = await axios.get(
        `/api/audit?compare=true&baseAuditId=${baseId}&targetAuditId=${targetId}`
      );
      setComparisonData(res.data);
    } catch (err: any) {
      setComparisonError(
        err.response?.data?.error || err.message || 'Failed to compare audits.'
      );
    } finally {
      setComparisonLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-600 mb-1">
            <History className="w-4 h-4" />
            <span>Audit Trail &amp; Version History</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Historical Local SEO Audits</h2>
          <p className="text-xs text-gray-500 mt-1">
            Every audit snapshot is recorded in PostgreSQL. Compare any two audits to track optimization progress and resolved SEO issues.
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
        </div>
      </div>

      {/* Comparison Action Bar (Appears when 1 or 2 are selected) */}
      {selectedForCompare.length > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs">
              {selectedForCompare.length}/2
            </div>
            <div>
              <span className="text-xs font-bold text-gray-900 block">
                {selectedForCompare.length === 1
                  ? 'Select 1 more audit from the list below to compare'
                  : '2 Audits selected for side-by-side comparison'}
              </span>
              <span className="text-[11px] text-gray-500">
                Measures score deltas, resolved checklist items, and newly discovered issues.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedForCompare([])}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-white/60 rounded-lg transition"
            >
              Clear Selection
            </button>
            <button
              type="button"
              onClick={runComparison}
              disabled={selectedForCompare.length !== 2}
              className="px-4 py-1.5 bg-[#C84A22] hover:bg-[#B33E1A] text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5 disabled:opacity-40"
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Compare Audits</span>
            </button>
          </div>
        </div>
      )}

      {/* History List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-orange-600 animate-spin mx-auto" />
            <div className="text-xs text-gray-500 font-medium">Loading historical audits from PostgreSQL...</div>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 text-xs">
            <AlertCircle className="w-6 h-6 mx-auto mb-2 text-red-500" />
            {error}
          </div>
        ) : audits.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <History className="w-10 h-10 text-gray-400 mx-auto" />
            <h3 className="text-sm font-bold text-gray-900">No Audits Recorded Yet</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Run your first Local SEO audit using the dashboard to begin building your profile history.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {audits.map((item) => {
              const isCurrent = item.id === currentAuditRunId;
              const isSelected = selectedForCompare.includes(item.id);
              const formattedDate = new Date(item.createdAt).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={item.id}
                  className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${
                    isSelected
                      ? 'bg-orange-50/70 border-l-4 border-orange-600'
                      : isCurrent
                      ? 'bg-orange-50/30 border-l-4 border-orange-400'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectForCompare(item.id)}
                      className="mt-1 sm:mt-0 w-4 h-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500 cursor-pointer"
                      title="Select for comparison"
                    />

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-900">{item.businessName}</span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-orange-100 text-orange-800">
                            Active View
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            item.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'RUNNING'
                              ? 'bg-blue-100 text-blue-800 animate-pulse'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{item.category || 'Business'}</span>
                        <span>·</span>
                        <span>{item.city || 'Local Area'}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          {formattedDate}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {item.status === 'COMPLETED' && (
                      <div className="flex items-center gap-3 text-right">
                        <div>
                          <div className="text-[10px] text-gray-400 uppercase font-bold">Authority</div>
                          <div className="text-sm font-bold text-purple-700">
                            {item.authorityScore ?? '—'}/100
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-400 uppercase font-bold">Maps Rank</div>
                          <div className="text-sm font-bold text-emerald-700">
                            #{item.mapsRank ?? '—'}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-400 uppercase font-bold">GBP Health</div>
                          <div className="text-sm font-bold text-amber-700">
                            {item.gbpHealthScore ?? '—'}
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => onSelectAudit(item.id)}
                      className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                        isCurrent
                          ? 'bg-gray-100 text-gray-700 cursor-default'
                          : 'bg-[#C84A22] text-white hover:bg-[#B33E1A] shadow-sm'
                      }`}
                    >
                      <span>{isCurrent ? 'Viewing' : 'Load Audit'}</span>
                      {!isCurrent && <ArrowRight className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Side-by-Side Comparison Modal */}
      {isComparing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-gray-200 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2">
                <GitCompare className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-bold text-gray-900">Side-by-Side Audit Comparison</h3>
              </div>
              <button
                onClick={() => setIsComparing(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {comparisonLoading ? (
              <div className="py-16 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-orange-600 animate-spin mx-auto" />
                <div className="text-xs text-gray-500 font-medium">Computing deltas and diffs...</div>
              </div>
            ) : comparisonError ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
                {comparisonError}
              </div>
            ) : comparisonData ? (
              <div className="space-y-6">
                {/* 2 Audits Banner */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                      Baseline Audit (Older)
                    </span>
                    <div className="font-bold text-gray-900">{comparisonData.baseAudit.businessName}</div>
                    <div className="text-gray-500 text-[11px]">
                      {new Date(comparisonData.baseAudit.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-orange-700 tracking-wider">
                      Target Audit (Newer)
                    </span>
                    <div className="font-bold text-gray-900">{comparisonData.targetAudit.businessName}</div>
                    <div className="text-gray-500 text-[11px]">
                      {new Date(comparisonData.targetAudit.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Deltas Grid */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                    <div className="text-[10px] uppercase font-bold text-gray-500">Authority Score</div>
                    <div className="text-xl font-extrabold text-gray-900 mt-1 flex items-center justify-center gap-1">
                      <span>{comparisonData.targetAudit.authorityScore ?? 0}</span>
                      <span
                        className={`text-xs font-bold inline-flex items-center ${
                          comparisonData.deltas.authorityScoreDelta >= 0
                            ? 'text-emerald-600'
                            : 'text-red-600'
                        }`}
                      >
                        {comparisonData.deltas.authorityScoreDelta >= 0 ? '+' : ''}
                        {comparisonData.deltas.authorityScoreDelta}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400">
                      from {comparisonData.baseAudit.authorityScore ?? 0}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                    <div className="text-[10px] uppercase font-bold text-gray-500">GBP Health</div>
                    <div className="text-xl font-extrabold text-gray-900 mt-1 flex items-center justify-center gap-1">
                      <span>{comparisonData.targetAudit.gbpHealthScore ?? 0}</span>
                      <span
                        className={`text-xs font-bold inline-flex items-center ${
                          comparisonData.deltas.gbpHealthScoreDelta >= 0
                            ? 'text-emerald-600'
                            : 'text-red-600'
                        }`}
                      >
                        {comparisonData.deltas.gbpHealthScoreDelta >= 0 ? '+' : ''}
                        {comparisonData.deltas.gbpHealthScoreDelta}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400">
                      from {comparisonData.baseAudit.gbpHealthScore ?? 0}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                    <div className="text-[10px] uppercase font-bold text-gray-500">Maps Rank</div>
                    <div className="text-xl font-extrabold text-gray-900 mt-1 flex items-center justify-center gap-1">
                      <span>#{comparisonData.targetAudit.mapsRank ?? 0}</span>
                      <span
                        className={`text-xs font-bold inline-flex items-center ${
                          comparisonData.deltas.mapsRankDelta <= 0
                            ? 'text-emerald-600'
                            : 'text-red-600'
                        }`}
                      >
                        {comparisonData.deltas.mapsRankDelta > 0 ? '+' : ''}
                        {comparisonData.deltas.mapsRankDelta}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400">
                      from #{comparisonData.baseAudit.mapsRank ?? 0}
                    </div>
                  </div>
                </div>

                {/* Progress Details: Resolved vs New Issues */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Resolved Fields ({comparisonData.resolvedFields.length})</span>
                    </div>
                    {comparisonData.resolvedFields.length === 0 ? (
                      <p className="text-[11px] text-emerald-700">No previous issues resolved between these audits.</p>
                    ) : (
                      <ul className="list-disc list-inside space-y-1 text-emerald-800 text-[11px]">
                        {comparisonData.resolvedFields.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                    <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span>New Issues Detected ({comparisonData.newIssues.length})</span>
                    </div>
                    {comparisonData.newIssues.length === 0 ? (
                      <p className="text-[11px] text-amber-800">No new issues detected since the baseline audit.</p>
                    ) : (
                      <ul className="list-disc list-inside space-y-1 text-amber-900 text-[11px]">
                        {comparisonData.newIssues.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Remaining Issues */}
                {comparisonData.remainingIssues.length > 0 && (
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs space-y-1.5">
                    <span className="font-bold text-gray-700 block">
                      Remaining Checklist Opportunities ({comparisonData.remainingIssues.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {comparisonData.remainingIssues.slice(0, 8).map((f, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-white border border-gray-200 text-gray-700 text-[11px]"
                        >
                          {f}
                        </span>
                      ))}
                      {comparisonData.remainingIssues.length > 8 && (
                        <span className="px-2 py-0.5 rounded text-[11px] text-gray-400">
                          +{comparisonData.remainingIssues.length - 8} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsComparing(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition"
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
