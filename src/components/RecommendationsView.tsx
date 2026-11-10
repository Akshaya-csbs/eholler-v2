'use client';

import React, { useState } from 'react';
import axios from 'axios';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  XCircle,
  RotateCcw,
  AlertTriangle,
  ArrowRight,
  Copy,
  Check,
  Filter,
  Tag,
  ShieldCheck,
} from 'lucide-react';
import { StructuredRecommendation } from '@/lib/types';

interface RecommendationsViewProps {
  recommendations?: StructuredRecommendation[];
  auditRunId?: string;
  businessName?: string;
  businessId?: string;
  onBackToDashboard?: () => void;
}

export const RecommendationsView: React.FC<RecommendationsViewProps> = ({
  recommendations = [],
  auditRunId,
  businessName,
  businessId,
  onBackToDashboard,
}) => {
  const [items, setItems] = useState<StructuredRecommendation[]>(recommendations);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusChange = async (id: string | undefined, newStatus: string, index: number) => {
    if (!id) {
      // Optimistic in-memory update if record doesn't have an ID
      setItems((prev) =>
        prev.map((item, idx) => (idx === index ? { ...item, status: newStatus as any } : item))
      );
      return;
    }

    setUpdatingId(id);
    try {
      await axios.patch('/api/ai-recommendations', { id, status: newStatus });
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: newStatus as any } : item))
      );
    } catch (err: any) {
      console.error('Failed to update recommendation status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const filteredItems = items.filter((item) => {
    const itemStatus = (item.status || 'DRAFT').toUpperCase();
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'ACTIVE' && (itemStatus === 'COMPLETED' || itemStatus === 'DISMISSED')) {
        return false;
      }
      if (statusFilter !== 'ACTIVE' && itemStatus !== statusFilter) {
        return false;
      }
    }

    if (priorityFilter !== 'ALL') {
      const sev = (item.severity || 'medium').toUpperCase();
      if (sev !== priorityFilter) return false;
    }

    return true;
  });

  const activeCount = items.filter(
    (i) => (i.status || 'DRAFT').toUpperCase() !== 'COMPLETED' && (i.status || 'DRAFT').toUpperCase() !== 'DISMISSED'
  ).length;

  const completedCount = items.filter(
    (i) => (i.status || '').toUpperCase() === 'COMPLETED'
  ).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#C84A22] mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Actionable SEO Roadmap</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            AI-Powered Local SEO Recommendations
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Grounded in verified Google Business Profile missing fields, website crawl findings, and competitor gaps for{' '}
            <span className="font-semibold text-slate-800">{businessName || 'your business'}</span>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl font-semibold">
            <span className="text-orange-700">{activeCount} Open</span>
            <span>·</span>
            <span className="text-emerald-700">{completedCount} Completed</span>
          </div>

          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Back
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All Recommendations' },
            { id: 'ACTIVE', label: 'Open / Pending' },
            { id: 'IN_PROGRESS', label: 'In Progress' },
            { id: 'COMPLETED', label: 'Completed' },
            { id: 'DISMISSED', label: 'Dismissed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                statusFilter === tab.id
                  ? 'bg-[#C84A22] text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2 text-slate-600">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-[11px] uppercase">Priority:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-medium text-slate-800 text-xs focus:ring-1 focus:ring-[#C84A22] focus:outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Recommendations Cards */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-xs text-slate-500 space-y-2">
          <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto" />
          <p className="font-bold text-slate-800 text-sm">No recommendations match the selected filter</p>
          <p className="text-[11px] text-slate-400">
            Try switching to &quot;All Recommendations&quot; or clearing your filter criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((rec, idx) => {
            const currentStatus = (rec.status || 'DRAFT').toUpperCase();
            const isCompleted = currentStatus === 'COMPLETED';
            const isDismissed = currentStatus === 'DISMISSED';
            const isInProgress = currentStatus === 'IN_PROGRESS';

            return (
              <div
                key={rec.id || idx}
                className={`bg-white rounded-2xl border p-6 shadow-sm transition space-y-4 ${
                  isCompleted
                    ? 'border-emerald-200 bg-emerald-50/20 opacity-80'
                    : isDismissed
                    ? 'border-slate-200 bg-slate-50/50 opacity-60'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          rec.severity === 'critical'
                            ? 'bg-red-100 text-red-800'
                            : rec.severity === 'high'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {rec.severity} Priority
                      </span>

                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        Effort: {rec.estimatedEffort || 'Moderate'}
                      </span>

                      {currentStatus !== 'DRAFT' && (
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-800'
                              : isInProgress
                              ? 'bg-amber-100 text-amber-800'
                              : isDismissed
                              ? 'bg-slate-200 text-slate-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {currentStatus.replace('_', ' ')}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 pt-1">
                      {rec.issueTitle}
                    </h3>
                  </div>

                  {/* Status Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    {!isCompleted && (
                      <button
                        onClick={() => handleStatusChange(rec.id, 'COMPLETED', idx)}
                        disabled={updatingId === rec.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition shadow-2xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Done</span>
                      </button>
                    )}

                    {!isInProgress && !isCompleted && !isDismissed && (
                      <button
                        onClick={() => handleStatusChange(rec.id, 'IN_PROGRESS', idx)}
                        disabled={updatingId === rec.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition shadow-2xs"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Start</span>
                      </button>
                    )}

                    {!isDismissed && !isCompleted && (
                      <button
                        onClick={() => handleStatusChange(rec.id, 'DISMISSED', idx)}
                        disabled={updatingId === rec.id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                        title="Dismiss recommendation"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}

                    {(isCompleted || isDismissed) && (
                      <button
                        onClick={() => handleStatusChange(rec.id, 'PENDING', idx)}
                        disabled={updatingId === rec.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 transition"
                      >
                        <RotateCcw className="w-3 h-3 text-slate-400" />
                        <span>Reopen</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Grounded Evidence & Why It Matters */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs">
                  <div>
                    <span className="font-bold text-slate-800">Audit Finding Evidence: </span>
                    <span className="text-slate-600">{rec.evidence}</span>
                  </div>
                  <div className="pt-1 border-t border-slate-200/60">
                    <span className="font-bold text-slate-800">Why It Matters for Local Search: </span>
                    <span className="text-slate-600">{rec.explanation}</span>
                  </div>
                </div>

                {/* Recommended Action */}
                <div className="space-y-1">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Recommended Implementation
                  </div>
                  <p className="text-xs font-semibold text-slate-900 leading-relaxed">
                    {rec.recommendedAction}
                  </p>
                </div>

                {/* Ready-to-copy suggested content */}
                {rec.suggestedContent && (
                  <div className="p-3.5 bg-orange-50/50 rounded-xl border border-orange-200/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-orange-950 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#C84A22]" />
                        <span>Ready-to-Paste Content Template</span>
                      </span>
                      <button
                        onClick={() => copyToClipboard(rec.suggestedContent!, idx)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-orange-200 text-[11px] font-semibold text-[#C84A22] hover:bg-orange-50 transition shadow-2xs"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Content</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="text-xs font-mono text-slate-800 bg-white/80 p-3 rounded-lg border border-orange-100 whitespace-pre-wrap leading-relaxed">
                      {rec.suggestedContent}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
