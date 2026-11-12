'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, LineChart, Rocket, ArrowRight } from 'lucide-react';

export function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      title: 'Connect Your Business',
      description: 'Connect your Google Business Profile securely with official OAuth in under two minutes.',
      icon: ShieldCheck,
      badge: 'Step 1 • 2 Min Setup',
      detail: 'Zero technical setup required. Grant read access to automatically import your locations, reviews, and search metrics.',
    },
    {
      number: '02',
      title: 'Analyze Your Performance',
      description: 'Discover rankings, reviews, visibility gaps, and real-time optimization opportunities.',
      icon: LineChart,
      badge: 'Step 2 • Instant Audit',
      detail: 'Our audit engine analyzes your profile completeness, NAP consistency, search query performance, and local competitor benchmarks.',
    },
    {
      number: '03',
      title: 'Grow Your Business',
      description: 'Follow AI-powered recommendations and steadily dominate your local market.',
      icon: Rocket,
      badge: 'Step 3 • AI Execution',
      detail: 'Receive prioritized recommendations categorized by impact and effort, track ranking progress, and attract more local foot traffic.',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 lg:py-28 bg-[#F7F1E7] relative border-t border-[#EBE1D1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <div className="inline-block mb-3">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#3478C9]">
              Simple 3-Step Process
            </span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-black text-[#102D50] tracking-tight leading-tight mb-4">
            How Eholler Powers Your Local Presence
          </h2>
          
          <p className="text-base sm:text-lg text-[#65748A] leading-relaxed">
            Get started in three simple steps with no technical experience required.
          </p>
        </div>

        {/* 3 Step Cards Layout with Connecting Line */}
        <div className="relative">
          
          {/* Subtle Horizontal Connector Line (Desktop) */}
          <div className="hidden lg:block absolute top-1/2 left-[15%] right-[15%] -translate-y-12 h-[2px] bg-gradient-to-r from-[#D5E3F5] via-[#3478C9]/40 to-[#D5E3F5] z-0" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10 relative z-10">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.number}
                  className="bg-white/95 rounded-2xl p-8 border border-[#E8DEC9] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Step Number & Icon Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-[#EBF2FA] text-[#3478C9] flex items-center justify-center shadow-inner">
                        <Icon className="w-7 h-7" />
                      </div>
                      <span className="text-3xl font-black text-[#D5E3F5] tracking-tight">
                        {step.number}
                      </span>
                    </div>

                    <span className="inline-block text-[11px] font-semibold text-[#3478C9] uppercase tracking-wider mb-2">
                      {step.badge}
                    </span>

                    <h3 className="text-xl font-bold text-[#102D50] tracking-tight mb-3">
                      {step.title}
                    </h3>

                    <p className="text-sm text-[#475569] leading-relaxed mb-4 font-normal">
                      {step.description}
                    </p>

                    <p className="text-xs text-[#64748B] leading-relaxed border-t border-[#F1F5F9] pt-4">
                      {step.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Bottom CTA Helper */}
        <div className="mt-14 text-center">
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#102D50] hover:text-[#3478C9] transition-colors"
          >
            <span>Ready to see your business audit? Get started free</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </section>
  );
}

