'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, Sparkles } from 'lucide-react';

export function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      description: 'Ideal for single-location businesses looking to grow their local search visibility.',
      priceMonthly: 39,
      priceAnnual: 29,
      highlight: false,
      features: [
        '1 Google Business Profile location',
        'Daily local rank & keyword tracking',
        'Automated GBP completeness audit',
        'Review tracking & sentiment alerts',
        'Basic AI optimization recommendations',
        'Email customer support',
      ],
      ctaText: 'Start 14-Day Free Trial',
    },
    {
      id: 'growth',
      name: 'Growth',
      badge: 'MOST POPULAR',
      description: 'Complete Local SEO toolkit for businesses wanting to outrank local competitors.',
      priceMonthly: 99,
      priceAnnual: 79,
      highlight: true,
      features: [
        'Up to 3 business locations',
        'Google Search Console & GA4 integration',
        'Competitor benchmarking & review gap analysis',
        'Full AI recommendation engine with ready-to-use copy',
        'Historical comparison & shareable client reports',
        'Priority support & weekly progress summaries',
      ],
      ctaText: 'Start Free Trial',
    },
    {
      id: 'agency',
      name: 'Agency & Multi-Location',
      description: 'For agencies and franchises managing multiple high-value business locations.',
      priceMonthly: 249,
      priceAnnual: 199,
      highlight: false,
      features: [
        'Up to 15 business locations (expandable)',
        'Multi-tenant workspace isolation',
        'White-label shareable client audit links',
        'Automated weekly rankings & review digest',
        'Dedicated onboarding & account manager',
        'Full API access & export capabilities',
      ],
      ctaText: 'Contact Sales / Start Trial',
    },
  ];

  return (
    <section id="pricing" className="py-14 lg:py-20 bg-[#FCF9F3] border-t border-[#EBE1D1] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 lg:mb-12">
          <div className="inline-block mb-2.5">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#3478C9]">
              Transparent Pricing
            </span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-black text-[#102D50] tracking-tight leading-tight mb-3">
            Simple Plans Built for Local Growth
          </h2>
          
          <p className="text-base sm:text-lg text-[#65748A] leading-relaxed mb-6">
            Every plan includes a 14-day free trial. No credit card required to start.
          </p>

          {/* Billing Cycle Switcher */}
          <div className="inline-flex items-center p-1 rounded-full bg-[#EFE8DC] border border-[#DDD3C3]">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                billingCycle === 'monthly'
                  ? 'bg-white text-[#102D50] shadow-sm'
                  : 'text-[#65748A] hover:text-[#102D50]'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                billingCycle === 'annual'
                  ? 'bg-[#102D50] text-white shadow-sm'
                  : 'text-[#65748A] hover:text-[#102D50]'
              }`}
            >
              <span>Annual Billing</span>
              <span className="bg-[#3478C9] text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => {
            const price = billingCycle === 'annual' ? plan.priceAnnual : plan.priceMonthly;
            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-8 flex flex-col justify-between transition-all duration-300 ${
                  plan.highlight
                    ? 'bg-white border-2 border-[#3478C9] shadow-2xl scale-105 z-10'
                    : 'bg-white/90 border border-[#E8DEC9] shadow-sm hover:shadow-lg'
                }`}
              >
                {/* Popular Badge */}
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#3478C9] text-white text-[11px] font-bold uppercase tracking-wider shadow-sm">
                      <Sparkles className="w-3 h-3" />
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-bold text-[#102D50] mb-2">{plan.name}</h3>
                  <p className="text-xs text-[#65748A] mb-6 leading-relaxed min-h-[36px]">
                    {plan.description}
                  </p>

                  {/* Price */}
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-black text-[#102D50] tracking-tight">
                      ${price}
                    </span>
                    <span className="text-xs font-medium text-[#65748A]">/ month</span>
                    {billingCycle === 'annual' && (
                      <span className="text-[10px] text-[#3478C9] font-semibold ml-2">
                        billed annually
                      </span>
                    )}
                  </div>

                  {/* Features List */}
                  <div className="pt-6 border-t border-[#F1F5F9] mb-8">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#102D50] block mb-4">
                      What's Included:
                    </span>
                    <ul className="space-y-3">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs text-[#475569]">
                          <Check className="w-4 h-4 text-[#3478C9] shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* CTA Button */}
                <Link
                  href="/sign-up"
                  className={`w-full py-3.5 px-4 rounded-full text-center text-sm font-semibold transition-all duration-150 block ${
                    plan.highlight
                      ? 'bg-[#102D50] hover:bg-[#1A3D68] text-white shadow-md'
                      : 'border border-[#102D50] text-[#102D50] hover:bg-[#102D50]/5'
                  }`}
                >
                  {plan.ctaText}
                </Link>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

