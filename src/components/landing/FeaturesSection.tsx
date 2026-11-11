'use client';

import React from 'react';
import { MapPin, Star, BarChart3, Zap, ArrowRight, Check } from 'lucide-react';

export function FeaturesSection() {
  const features = [
    {
      id: 'rank-tracking',
      title: 'Local Rank Tracking',
      subtitle: 'Monitor your position on Google Search and Maps.',
      icon: MapPin,
      bullets: [
        'Monitor your position on Google Search and Maps',
        'Track hyper-local keyword performance',
        'Understand local search visibility across zip codes',
      ],
      metric: 'Top 3 Grid Tracking',
    },
    {
      id: 'reviews',
      title: 'Review Management',
      subtitle: 'Monitor customer reviews and manage feedback.',
      icon: Star,
      bullets: [
        'Monitor customer reviews in real-time',
        'Manage and respond to feedback faster',
        'Improve your local reputation and 5-star rating gap',
      ],
      metric: 'Reputation Scorecard',
    },
    {
      id: 'insights',
      title: 'SEO Insights',
      subtitle: 'Get actionable recommendations and beat competitors.',
      icon: BarChart3,
      bullets: [
        'Get actionable AI recommendations to boost visibility',
        'Identify GBP missing fields and optimization opportunities',
        'Benchmark against top local competitors and analyze gaps',
      ],
      metric: 'AI Action Engine',
    },
    {
      id: 'growth',
      title: 'Business Growth',
      subtitle: 'Turn local searches into paying customers.',
      icon: Zap,
      bullets: [
        'Improve local discoverability across mobile and desktop',
        'Attract more qualified, high-intent phone calls and store visits',
        'Turn local searches into sustainable business opportunities',
      ],
      metric: '+42% Inbound Leads',
    },
  ];

  return (
    <section id="features" className="py-20 lg:py-28 bg-[#FCF9F3] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center justify-center gap-2 mb-3">
            <span className="w-6 h-[1.5px] bg-[#3478C9]"></span>
            <span className="text-xs font-bold uppercase tracking-widest text-[#3478C9]">
              POWERFUL FEATURES
            </span>
            <span className="w-6 h-[1.5px] bg-[#3478C9]"></span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-black text-[#102D50] tracking-tight leading-tight mb-4">
            Everything You Need for Local SEO Success
          </h2>
          
          <p className="text-base sm:text-lg text-[#65748A] leading-relaxed">
            From tracking rankings to managing reviews, get all the tools you need to grow your local business.
          </p>
        </div>

        {/* 4 Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-7">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.id}
                className="group relative bg-white/95 rounded-2xl p-7 border border-[#EBE3D5] shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Icon Header */}
                  <div className="w-12 h-12 rounded-xl bg-[#EBF2FA] text-[#3478C9] flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-[#3478C9] group-hover:text-white transition-all duration-200">
                    <Icon className="w-6 h-6" />
                  </div>

                  {/* Card Title */}
                  <h3 className="text-xl font-bold text-[#102D50] tracking-tight mb-2.5">
                    {feature.title}
                  </h3>

                  {/* Description / Subtitle */}
                  <p className="text-sm text-[#65748A] leading-relaxed mb-6 font-normal">
                    {feature.subtitle}
                  </p>

                  {/* Bullet points */}
                  <ul className="space-y-2.5 mb-6">
                    {feature.bullets.map((bullet, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-[#475569] leading-relaxed">
                        <Check className="w-4 h-4 text-[#3478C9] shrink-0 mt-0.5" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Card Footer Metric Pill */}
                <div className="pt-4 border-t border-[#F1F5F9] flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#3478C9] bg-[#EBF2FA] px-2.5 py-1 rounded-full">
                    {feature.metric}
                  </span>
                  <span className="text-[#65748A] group-hover:text-[#102D50] flex items-center gap-1 font-medium transition-colors">
                    Explore <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

