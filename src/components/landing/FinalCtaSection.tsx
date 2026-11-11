'use client';

import React from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

export function FinalCtaSection() {
  const { isSignedIn } = useUser();

  return (
    <section className="py-20 lg:py-28 bg-[#EFE7D8] border-t border-[#E2D6C0] relative overflow-hidden">
      {/* Ambient background blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#3478C9]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        
        {/* Subtle badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/70 border border-[#DDD0BC] text-[#102D50] text-xs font-semibold tracking-wide mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-[#3478C9]" />
          <span>Start Dominating Google Search Today</span>
        </div>

        {/* Heading */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#102D50] tracking-tight leading-tight mb-5">
          Ready to Grow Your Business Locally?
        </h2>

        {/* Description */}
        <p className="text-base sm:text-xl text-[#5A6C82] leading-relaxed mb-9 max-w-2xl mx-auto">
          Take control of your local search presence with intelligent SEO tools built for business growth.
        </p>

        {/* Primary CTA Button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href={isSignedIn ? "/dashboard" : "/sign-up"}
            className="inline-flex items-center justify-center gap-2.5 px-9 py-4 rounded-full bg-[#102D50] hover:bg-[#1A3D68] text-white font-semibold text-base shadow-xl shadow-[#102D50]/20 hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-200 group"
          >
            <span>{isSignedIn ? "Go to Dashboard" : "Get Started with Eholler"}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          
          {!isSignedIn && (
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center px-7 py-4 rounded-full border border-[#B8AA94] text-[#102D50] hover:bg-white/60 font-medium text-base transition-colors"
            >
              Sign In to Existing Account
            </Link>
          )}
        </div>

        {/* Trust Points */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-[#5A6C82] font-medium">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            No credit card required
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Instant 2-minute setup
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#3478C9]" />
            Official Google OAuth security
          </span>
        </div>

      </div>
    </section>
  );
}

