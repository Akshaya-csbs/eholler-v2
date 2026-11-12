'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@clerk/nextjs';
import {
  TrendingUp,
  Store,
  BarChart3,
  Star,
  ArrowRight,
  Phone,
  Navigation,
  Globe,
  Share2,
  CheckCircle2,
  Search,
  MapPin,
} from 'lucide-react';

export function HeroSection() {
  const { isSignedIn } = useUser();

  return (
    <section className="relative overflow-hidden pt-6 pb-12 lg:pt-10 lg:pb-16 bg-[#F7F1E7]">
      {/* Background ambient lighting effects */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-[#3478C9]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#DCE8F6]/40 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          
          {/* =============================================================== */}
          {/* LEFT SIDE: Copy & Features & CTA                                */}
          {/* =============================================================== */}
          <div className="lg:col-span-6 flex flex-col items-start text-left pt-1 lg:pt-2">

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-black text-[#102D50] tracking-tight leading-[1.12] mb-4">
              Dominate Local Search.{' '}
              <span className="text-[#3478C9] block mt-1">
                Grow Your Business.
              </span>
            </h1>

            {/* Supporting Description */}
            <p className="text-base sm:text-lg text-[#5F7188] font-normal leading-relaxed mb-6 max-w-xl">
              Connect your Google Business Profile and unlock powerful Local SEO insights in one easy-to-use platform.
            </p>

            {/* Four Horizontal Feature Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-2 w-full py-3 mb-6 border-y border-[#E8DEC9]">
              
              {/* Feature 1 */}
              <div className="flex flex-col items-start gap-2 pr-2 sm:border-r sm:border-[#E8DEC9]">
                <div className="w-8 h-8 rounded-lg bg-[#EBF2FA] flex items-center justify-center text-[#3478C9]">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-[#172B45] leading-tight">
                  Track Your<br />Local Rankings
                </span>
              </div>

              {/* Feature 2 */}
              <div className="flex flex-col items-start gap-2 px-0 sm:px-2 sm:border-r sm:border-[#E8DEC9]">
                <div className="w-8 h-8 rounded-lg bg-[#EBF2FA] flex items-center justify-center text-[#3478C9]">
                  <Store className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-[#172B45] leading-tight">
                  Manage Your<br />Google Business
                </span>
              </div>

              {/* Feature 3 */}
              <div className="flex flex-col items-start gap-2 px-0 sm:px-2 sm:border-r sm:border-[#E8DEC9]">
                <div className="w-8 h-8 rounded-lg bg-[#EBF2FA] flex items-center justify-center text-[#3478C9]">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-[#172B45] leading-tight">
                  Get Actionable<br />Insights
                </span>
              </div>

              {/* Feature 4 */}
              <div className="flex flex-col items-start gap-2 pl-0 sm:pl-2">
                <div className="w-8 h-8 rounded-lg bg-[#EBF2FA] flex items-center justify-center text-[#3478C9]">
                  <Star className="w-4 h-4 fill-[#3478C9]" />
                </div>
                <span className="text-xs font-semibold text-[#172B45] leading-tight">
                  Attract More<br />Local Customers
                </span>
              </div>
            </div>

            {/* Prominent CTA Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
              <Link
                href={isSignedIn ? "/dashboard" : "/sign-up"}
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-[#102D50] hover:bg-[#1A3D68] text-white font-semibold text-base shadow-lg shadow-[#102D50]/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 group"
              >
                <span>{isSignedIn ? "Go to Dashboard" : "Get Started Free"}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              {!isSignedIn && (
                <Link
                  href="/sign-in"
                  className="inline-flex items-center justify-center px-6 py-4 rounded-full border border-[#C5BBAA] text-[#172B45] hover:bg-[#EFE7D8] font-medium text-base transition-colors"
                >
                  Live Demo Login
                </Link>
              )}
            </div>

            <p className="text-xs text-[#7A8B9E] mt-3.5 flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              No credit card required • Connect with Google in 2 minutes
            </p>
          </div>

          {/* =============================================================== */}
          {/* RIGHT SIDE: Refined Corporate Illustration & Floating Cards     */}
          {/* =============================================================== */}
          <div className="lg:col-span-6 relative w-full flex items-center justify-center pt-6 lg:pt-0">
            
            {/* Main Stage Container (Comfortable, unclipped padding) */}
            <div className="relative w-full max-w-[580px] min-h-[500px] sm:min-h-[540px] flex items-center justify-center px-3 sm:px-6 py-8">
              
              {/* ------------------------------------------------------------- */}
              {/* 1. BACKGROUND: Professional Modern Corporate Workspace         */}
              {/* ------------------------------------------------------------- */}
              <div className="absolute inset-x-2 sm:inset-x-4 top-10 bottom-4 rounded-3xl overflow-hidden shadow-2xl border-2 border-[#E7DDCC] bg-slate-900">
                <Image
                  src="/images/corporate-workspace.jpg"
                  alt="Modern Corporate Office & Premium Business Workspace"
                  fill
                  className="object-cover object-center scale-105"
                  priority
                />
                {/* Subtle soft ambient darkening gradient for card contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#102D50]/40 via-[#102D50]/15 to-transparent pointer-events-none" />
                <div className="absolute inset-0 bg-[#102D50]/10 pointer-events-none" />
              </div>

              {/* Decorative Curved Arcs Connecting to Top Pin */}
              <div className="absolute top-2 inset-x-0 h-28 pointer-events-none flex items-center justify-center z-10">
                <svg className="w-full h-full max-w-[420px]" viewBox="0 0 400 110" fill="none">
                  <path
                    d="M 200 24 C 130 24, 60 55, 30 100"
                    stroke="#3478C9"
                    strokeWidth="1.8"
                    strokeDasharray="4 4"
                    strokeOpacity="0.5"
                  />
                  <path
                    d="M 200 24 C 270 24, 340 55, 370 100"
                    stroke="#3478C9"
                    strokeWidth="1.8"
                    strokeDasharray="4 4"
                    strokeOpacity="0.5"
                  />
                </svg>
              </div>

              {/* Top Location Pin Marker */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30">
                <div className="w-10 h-10 rounded-full bg-[#102D50] text-white flex items-center justify-center shadow-xl border-2 border-white animate-bounce-slow">
                  <MapPin className="w-5 h-5 fill-white text-[#102D50]" />
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* 2. CARD A: Upper-Left Floating Card – Local Rankings          */}
              {/* ------------------------------------------------------------- */}
              <div className="absolute top-6 left-0 sm:-left-3 z-30 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl shadow-[#102D50]/10 border border-[#E2E8F0] p-3.5 w-40 sm:w-44 animate-float-delayed">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-[#64748B]">
                    Local Rankings
                  </span>
                  <span className="text-xs font-extrabold text-[#16A34A] flex items-center">
                    ↑ 24%
                  </span>
                </div>
                {/* Crisp SVG Upward-Trending Sparkline */}
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[10px] text-[#94A3B8] font-medium">Top 3 Pack</span>
                  <svg className="w-16 h-7" viewBox="0 0 60 26" fill="none">
                    <path
                      d="M2 22 L16 17 L30 19 L44 9 L58 4"
                      stroke="#3478C9"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="58" cy="4" r="3" fill="#3478C9" />
                  </svg>
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* 3. CARD B: Upper-Right Floating Card – Search Visibility       */}
              {/* ------------------------------------------------------------- */}
              <div className="absolute top-8 right-0 sm:-right-3 z-30 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl shadow-[#102D50]/10 border border-[#E2E8F0] p-3.5 w-40 sm:w-44 animate-float-fast">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-[#64748B]">
                    Search Visibility
                  </span>
                  <span className="text-xs font-extrabold text-[#16A34A]">
                    ↑ 32%
                  </span>
                </div>
                {/* Crisp Ascending Bar Chart */}
                <div className="mt-1 flex items-end justify-between h-7 pt-1">
                  <span className="text-[10px] text-[#94A3B8] font-medium">Impressions</span>
                  <div className="flex items-end gap-1 h-6">
                    <div className="w-1.5 h-2.5 bg-[#93C5FD] rounded-t-sm" />
                    <div className="w-1.5 h-3.5 bg-[#60A5FA] rounded-t-sm" />
                    <div className="w-1.5 h-4.5 bg-[#3B82F6] rounded-t-sm" />
                    <div className="w-1.5 h-5 bg-[#2563EB] rounded-t-sm" />
                    <div className="w-1.5 h-6 bg-[#1D4ED8] rounded-t-sm" />
                  </div>
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* 4. CARD C: Lower-Left Floating Card – Customer Reviews        */}
              {/* ------------------------------------------------------------- */}
              <div className="absolute bottom-6 left-1 sm:-left-2 z-30 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl shadow-[#102D50]/10 border border-[#E2E8F0] p-3.5 w-42 sm:w-46 animate-float-slow">
                <span className="text-[11px] font-semibold text-[#64748B] block mb-1">
                  Customer Reviews
                </span>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-amber-50 flex items-center justify-center">
                    <Star className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                  </div>
                  <span className="text-xs font-extrabold text-[#16A34A]">
                    ★ 18% Growth
                  </span>
                </div>
                <div className="text-[10px] text-[#64748B] mt-1 flex items-center gap-1">
                  <span>Sentiment:</span>
                  <span className="font-semibold text-emerald-600">98% Positive</span>
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* 5. CENTER: Google Business Profile Card (Sharp & Unclipped)    */}
              {/* ------------------------------------------------------------- */}
              <div className="relative z-20 w-[295px] sm:w-[320px] bg-white rounded-2xl shadow-2xl shadow-[#102D50]/25 border border-slate-200/80 p-4 transition-transform duration-300">
                
                {/* Search Bar Header */}
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#F8FAFC] border border-slate-200/70 mb-3">
                  <div className="flex items-center gap-2">
                    {/* Google G Symbol */}
                    <div className="w-5 h-5 rounded-full bg-white shadow-xs flex items-center justify-center font-bold text-xs border border-slate-100">
                      <span className="text-[#4285F4]">G</span>
                    </div>
                    <span className="text-xs font-semibold text-[#1E293B]">Your Business</span>
                  </div>
                  <Search className="w-3.5 h-3.5 text-[#94A3B8]" />
                </div>

                {/* Professional Workspace Architectural Thumbnail */}
                <div className="relative w-full h-28 rounded-xl overflow-hidden mb-3 border border-slate-100 shadow-inner">
                  <Image
                    src="/images/workspace-thumbnail.jpg"
                    alt="Corporate Workspace Preview"
                    fill
                    className="object-cover"
                    sizes="320px"
                  />
                  {/* Verified Profile Badge */}
                  <div className="absolute top-2 left-2 bg-[#102D50]/80 backdrop-blur-md text-white text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Verified Profile</span>
                  </div>
                </div>

                {/* Rating & Reviews Line */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#0F172A]">4.8</span>
                    <div className="flex text-[#F59E0B]">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-[#F59E0B]" />
                      ))}
                    </div>
                    <span className="text-[11px] text-[#64748B] font-medium">(1.2K reviews)</span>
                  </div>
                </div>

                {/* Status Line */}
                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 mb-3.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Open · Closes 9 PM</span>
                </div>

                {/* Bottom Action Buttons (4 Equal, Centered, Crisp Columns) */}
                <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-100 text-center">
                  
                  {/* Action 1: Call */}
                  <button className="flex flex-col items-center justify-center group focus:outline-none">
                    <div className="w-8 h-8 rounded-full bg-[#EBF2FA] group-hover:bg-[#3478C9] group-hover:text-white transition-colors flex items-center justify-center text-[#3478C9] mb-1">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[11px] font-semibold text-[#1E293B] group-hover:text-[#3478C9] transition-colors block w-full text-center leading-tight">
                      Call
                    </span>
                  </button>

                  {/* Action 2: Directions */}
                  <button className="flex flex-col items-center justify-center group focus:outline-none">
                    <div className="w-8 h-8 rounded-full bg-[#EBF2FA] group-hover:bg-[#3478C9] group-hover:text-white transition-colors flex items-center justify-center text-[#3478C9] mb-1">
                      <Navigation className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[11px] font-semibold text-[#1E293B] group-hover:text-[#3478C9] transition-colors block w-full text-center leading-tight">
                      Directions
                    </span>
                  </button>

                  {/* Action 3: Website */}
                  <button className="flex flex-col items-center justify-center group focus:outline-none">
                    <div className="w-8 h-8 rounded-full bg-[#EBF2FA] group-hover:bg-[#3478C9] group-hover:text-white transition-colors flex items-center justify-center text-[#3478C9] mb-1">
                      <Globe className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[11px] font-semibold text-[#1E293B] group-hover:text-[#3478C9] transition-colors block w-full text-center leading-tight">
                      Website
                    </span>
                  </button>

                  {/* Action 4: Share */}
                  <button className="flex flex-col items-center justify-center group focus:outline-none">
                    <div className="w-8 h-8 rounded-full bg-[#EBF2FA] group-hover:bg-[#3478C9] group-hover:text-white transition-colors flex items-center justify-center text-[#3478C9] mb-1">
                      <Share2 className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[11px] font-semibold text-[#1E293B] group-hover:text-[#3478C9] transition-colors block w-full text-center leading-tight">
                      Share
                    </span>
                  </button>

                </div>

              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
