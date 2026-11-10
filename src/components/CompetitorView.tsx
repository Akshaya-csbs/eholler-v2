'use client';

import React, { useState } from 'react';
import {
  Users2,
  Sparkles,
  Star,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  Globe,
  Award,
} from 'lucide-react';
import { AuditResponse, CompetitorItem } from '@/lib/types';

interface CompetitorViewProps {
  data: AuditResponse;
  onBackToDashboard?: () => void;
}

export const CompetitorView: React.FC<CompetitorViewProps> = ({
  data,
  onBackToDashboard,
}) => {
  const profile = data.targetServiceProfile;
  const directComps =
    data.directCompetitors || data.competitors.filter((c) => c.classification === 'direct');
  const relatedComps =
    data.relatedCompetitors || data.competitors.filter((c) => c.classification === 'related');

  // Real Target business metrics
  const targetRating =
    typeof data.business.rating === 'number' && data.business.rating > 0 ? data.business.rating : null;
  const targetReviews =
    typeof data.business.reviewCount === 'number' && data.business.reviewCount >= 0
      ? data.business.reviewCount
      : null;

  // Find top rated competitor and highest review competitor (filtering only real available data)
  const allComps = [...directComps, ...relatedComps];
  const compsWithRatings = allComps.filter((c) => typeof c.rating === 'number' && c.rating > 0);
  const compsWithReviews = allComps.filter((c) => typeof c.reviews === 'number' && c.reviews >= 0);

  const maxCompReviews =
    compsWithReviews.length > 0 ? Math.max(...compsWithReviews.map((c) => c.reviews!)) : null;
  const maxCompRating =
    compsWithRatings.length > 0 ? Math.max(...compsWithRatings.map((c) => c.rating!)) : null;

  const reviewDeficit =
    maxCompReviews !== null && targetReviews !== null
      ? Math.max(0, maxCompReviews - targetReviews)
      : null;

  // Mathematical projection: estimated 5-star reviews needed to reach competitor rating parity
  // Formula: Target Avg = (Current Sum + 5 * X) / (Current Count + X) => X = (Target * N - Sum) / (5 - Target)
  let neededFiveStarReviews: number | null = null;
  if (
    targetRating !== null &&
    targetReviews !== null &&
    targetReviews > 0 &&
    maxCompRating !== null &&
    maxCompRating > targetRating
  ) {
    const targetGoal = Math.min(4.9, maxCompRating);
    if (5.0 - targetGoal >= 0.05) {
      const currentSum = targetRating * targetReviews;
      const needed = Math.ceil((targetGoal * targetReviews - currentSum) / (5.0 - targetGoal));
      neededFiveStarReviews = needed > 0 ? needed : null;
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-600 mb-1">
            <Users2 className="w-4 h-4" />
            <span>Service-Driven Competitor Intelligence &amp; Gap Analysis</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Competitor Benchmarking &amp; Gap Matrix</h2>
          <p className="text-xs text-gray-500 mt-1">
            Verified local competitors discovered by matching actual commercial services and sorted strictly by real Google ratings.
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

      {/* Target Business Service Profile Card */}
      {profile && (
        <div className="bg-gradient-to-br from-gray-900 to-[#121A21] text-white rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
                Validated Commercial Service Profile
              </span>
            </div>
            <div className="flex items-center gap-2">
              {profile.confidenceScore !== undefined && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {profile.confidenceScore}% Confidence
                </span>
              )}
              <span className="text-[11px] text-gray-400">
                {profile.sourceSummary || 'Derived from crawled website & Google Places'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-1">
              <span className="text-gray-400 uppercase font-semibold text-[10px] tracking-wider block">
                Actual Commercial Activity
              </span>
              <span className="text-white font-bold text-sm block">
                {profile.actualBusinessType || profile.mainService}
              </span>
              <span className="text-gray-400 text-[11px] block">
                Maps Category: {profile.mapsCategory || data.business.category}
              </span>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-1">
              <span className="text-gray-400 uppercase font-semibold text-[10px] tracking-wider block">
                Primary Services ({profile.primaryServices?.length || 1})
              </span>
              <span
                className="text-gray-200 font-medium block truncate"
                title={profile.primaryServices?.join(', ') || profile.mainService}
              >
                {profile.primaryServices?.length
                  ? profile.primaryServices.slice(0, 3).join(', ')
                  : profile.mainService}
              </span>
              <span className="text-gray-400 text-[11px] block">
                Core offerings used for direct competitor discovery
              </span>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-1">
              <span className="text-gray-400 uppercase font-semibold text-[10px] tracking-wider block">
                Secondary Services ({profile.secondaryServices?.length || 0})
              </span>
              <span
                className="text-gray-200 font-medium block truncate"
                title={profile.secondaryServices?.join(', ') || 'None'}
              >
                {profile.secondaryServices?.length
                  ? profile.secondaryServices.slice(0, 3).join(', ')
                  : 'None detected'}
              </span>
              <span className="text-gray-400 text-[11px] block">
                Used for related service provider discovery
              </span>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-1">
              <span className="text-gray-400 uppercase font-semibold text-[10px] tracking-wider block">
                Market &amp; Customers
              </span>
              <span className="text-gray-200 font-medium block truncate">
                {profile.serviceLocations?.join(', ') ||
                  profile.serviceArea ||
                  data.business.city ||
                  'Regional'}
              </span>
              <span className="text-gray-400 text-[11px] block truncate" title={profile.targetCustomers}>
                {profile.targetCustomers || 'Enterprise and commercial clients'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Gap Analysis Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Review Volume Deficit Card */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
          <div className="text-[10px] uppercase font-bold text-gray-400">Review Volume Deficit</div>
          <div className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            {reviewDeficit === null ? (
              <span className="text-sm font-semibold text-gray-500">No Review Data</span>
            ) : reviewDeficit === 0 ? (
              <>
                <span>Leader</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  #1 in Market
                </span>
              </>
            ) : (
              <>
                <span>-{reviewDeficit.toLocaleString()}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                  Top Competitor: {maxCompReviews?.toLocaleString()}
                </span>
              </>
            )}
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            {reviewDeficit === null
              ? 'Review count was not provided by the Places API response for this profile.'
              : reviewDeficit > 0
              ? `Your profile has ${targetReviews ?? 0} reviews vs ${maxCompReviews} for the highest-reviewed competitor in this set.`
              : 'Your business holds the highest review count among all discovered competitors.'}
          </p>
        </div>

        {/* Rating Position & 5-Star Projection Card */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
          <div className="text-[10px] uppercase font-bold text-gray-400">Rating Position &amp; Projection</div>
          <div className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span>{targetRating !== null ? targetRating.toFixed(1) : 'Unrated'}</span>
            {maxCompRating !== null && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-orange-100 text-orange-800">
                Competitor Top: {maxCompRating.toFixed(1)}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            {targetRating === null
              ? 'Business has no verified Google rating on record.'
              : maxCompRating !== null && targetRating < maxCompRating && neededFiveStarReviews !== null
              ? `Est. ~${neededFiveStarReviews} consecutive 5-star reviews needed to reach rating parity.`
              : 'Google rating is equal to or higher than top discovered competitors.'}
          </p>
          <div className="text-[10px] text-gray-400 border-t border-gray-100 pt-1 leading-tight">
            *Mathematical projection assumes exclusively 5-star ratings; actual ranking algorithms also weigh relevance and distance.
          </div>
        </div>

        {/* Competitive Set Size */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
          <div className="text-[10px] uppercase font-bold text-gray-400">Market Competitive Set</div>
          <div className="text-2xl font-bold text-gray-900">
            {allComps.length}{' '}
            <span className="text-xs font-normal text-gray-500">
              ({directComps.length} direct, {relatedComps.length} related)
            </span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Direct competitors provide the same core service; related providers offer secondary or overlapping services.
          </p>
        </div>
      </div>

      {/* Comparison Matrix Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Local SEO Benchmark Matrix</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Side-by-side comparison of your business against discovered local competitors. Missing data is shown as &quot;—&quot;.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 uppercase font-semibold text-[10px] tracking-wider border-b border-gray-100">
              <tr>
                <th className="px-5 py-3">Business</th>
                <th className="px-4 py-3">Classification</th>
                <th className="px-4 py-3 text-right">Rating</th>
                <th className="px-4 py-3 text-right">Reviews</th>
                <th className="px-4 py-3">Primary Service</th>
                <th className="px-4 py-3">Website &amp; Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {/* Target Business Row */}
              <tr className="bg-orange-50/50 font-medium">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-600"></span>
                    <span className="font-bold text-gray-900">{data.business.name}</span>
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-orange-200 text-orange-900">
                      Your Business
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-700 font-semibold">Target</td>
                <td className="px-4 py-3 text-right">
                  {targetRating !== null ? (
                    <div className="inline-flex items-center gap-1 font-bold text-amber-900">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{targetRating.toFixed(1)}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400">Unrated</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-bold text-gray-900">
                  {targetReviews !== null ? targetReviews.toLocaleString() : '—'}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {profile?.mainService || data.business.category}
                </td>
                <td className="px-4 py-3">
                  {data.business.websiteUrl ? (
                    <a
                      href={data.business.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-600 hover:underline inline-flex items-center gap-1"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>{data.business.websiteUrl.replace(/^https?:\/\//, '').split('/')[0]}</span>
                    </a>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
              </tr>

              {/* Competitor Rows */}
              {allComps.map((comp, idx) => (
                <tr key={comp.id || idx} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-3 font-medium text-gray-900 max-w-xs truncate">
                    {comp.name}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        comp.classification === 'direct'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {comp.classification === 'direct' ? 'Direct' : 'Related'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {comp.rating ? (
                      <div className="inline-flex items-center gap-1 font-bold text-amber-800">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span>{comp.rating.toFixed(1)}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">Unrated</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700 font-semibold">
                    {comp.reviews !== undefined ? comp.reviews.toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                    {comp.mainServiceIdentified || comp.matchedTargetService || comp.category}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {(comp.evidenceSourceUrl || comp.websiteUri) && (
                        <a
                          href={comp.evidenceSourceUrl || comp.websiteUri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-orange-600 hover:underline inline-flex items-center gap-1"
                          title="Verified Website"
                        >
                          <Globe className="w-3 h-3" />
                          <span>Website</span>
                        </a>
                      )}
                      {comp.mapUrl && (
                        <a
                          href={comp.mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-500 hover:text-gray-800 inline-flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Maps</span>
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section A: Direct Competitors */}
      <div className="space-y-3">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
            <span>Direct Competitors ({directComps.length})</span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Verified local businesses offering the same core service (
            <strong className="text-gray-700">
              {profile?.mainService || data.business.category}
            </strong>
            ). Sorted by highest Google rating first.
          </p>
        </div>

        {directComps.length === 0 ? (
          <div className="p-8 bg-white rounded-2xl border border-dashed border-gray-300 text-center text-xs text-gray-500">
            No direct competitors identified in this market radius.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {directComps.map((comp, idx) => (
              <div
                key={comp.id || idx}
                className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-sm text-gray-900">{comp.name}</div>
                    <span className="text-[11px] text-gray-500">{comp.category || 'Local Business'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{comp.rating ? comp.rating.toFixed(1) : 'Unrated'}</span>
                    <span className="text-gray-400 font-normal">({comp.reviews} reviews)</span>
                  </div>
                </div>

                <div className="text-xs text-gray-600 space-y-1.5 pt-1 border-t border-gray-100">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                    <span className="truncate">{comp.address || 'Local Service Area'}</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Main Service:</strong>{' '}
                      {comp.mainServiceIdentified || profile?.mainService}
                    </span>
                  </div>
                </div>

                {comp.rationale && (
                  <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100 text-[11px] text-gray-700 leading-relaxed">
                    {comp.rationale}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[11px]">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                    Direct Competitor
                  </span>
                  <div className="flex items-center gap-2">
                    {(comp.evidenceSourceUrl || comp.websiteUri) && (
                      <a
                        href={comp.evidenceSourceUrl || comp.websiteUri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-600 hover:text-orange-800 font-medium inline-flex items-center gap-1"
                      >
                        <span>Website</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {comp.mapUrl && (
                      <a
                        href={comp.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-gray-800 font-medium inline-flex items-center gap-1"
                      >
                        <span>Maps</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section B: Related Competitors */}
      {relatedComps.length > 0 && (
        <div className="space-y-3 pt-2">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <span>Related Providers ({relatedComps.length})</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Local businesses offering overlapping secondary services or adjacent offerings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relatedComps.map((comp, idx) => (
              <div
                key={comp.id || idx}
                className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-sm text-gray-900">{comp.name}</div>
                    <span className="text-[11px] text-gray-500">{comp.category || 'Local Business'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{comp.rating ? comp.rating.toFixed(1) : 'Unrated'}</span>
                    <span className="text-gray-400 font-normal">({comp.reviews} reviews)</span>
                  </div>
                </div>

                <div className="text-xs text-gray-600 space-y-1.5 pt-1 border-t border-gray-100">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                    <span className="truncate">{comp.address || 'Local Service Area'}</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Overlaps with:</strong>{' '}
                      {comp.matchedTargetService || 'Secondary offering'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[11px]">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    Related Provider
                  </span>
                  <div className="flex items-center gap-2">
                    {(comp.evidenceSourceUrl || comp.websiteUri) && (
                      <a
                        href={comp.evidenceSourceUrl || comp.websiteUri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-600 hover:text-orange-800 font-medium inline-flex items-center gap-1"
                      >
                        <span>Website</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {comp.mapUrl && (
                      <a
                        href={comp.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-gray-800 font-medium inline-flex items-center gap-1"
                      >
                        <span>Maps</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
