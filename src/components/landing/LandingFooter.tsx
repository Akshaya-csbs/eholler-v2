import React from 'react';
import Link from 'next/link';

export function LandingFooter() {
  return (
    <footer className="bg-[#102D50] text-[#DCE8F6] pt-16 pb-12 border-t border-[#1C3E68]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-[#1F4572]">
          
          {/* Brand Info (2 cols) */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-white text-[#102D50] flex items-center justify-center font-bold shadow-md">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5 text-[#102D50]"
                >
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#102D50" stroke="#102D50" />
                  <path d="M9 12v-2" stroke="white" strokeWidth="1.8" />
                  <path d="M12 12V8" stroke="white" strokeWidth="1.8" />
                  <path d="M15 12V6" stroke="white" strokeWidth="1.8" />
                  <path d="M8 8.5l3.5-3.5 2 1.5 3-3" stroke="#60A5FA" strokeWidth="1.5" />
                </svg>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-white">
                  Eholler
                </span>
                <span className="text-xl font-medium tracking-tight text-[#60A5FA]">
                  Local SEO
                </span>
              </div>
            </Link>

            <p className="text-sm text-[#94A9C4] leading-relaxed max-w-sm">
              AI-powered Local SEO management platform helping local businesses, multi-location brands, and agencies dominate Google Search and Maps.
            </p>

            <div className="flex items-center gap-3 pt-2 text-xs text-[#94A9C4]">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>All Systems Operational • Google API Active</span>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Product
            </h4>
            <ul className="space-y-2 text-sm text-[#94A9C4]">
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Local Rank Tracking
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  GBP Management
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Review Monitoring
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  AI Action Engine
                </a>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors">
                  Live Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Navigation & Resources */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Company
            </h4>
            <ul className="space-y-2 text-sm text-[#94A9C4]">
              <li>
                <a href="#how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-white transition-colors">
                  Pricing Plans
                </a>
              </li>
              <li>
                <Link href="/sign-in" className="hover:text-white transition-colors">
                  Client Portal
                </Link>
              </li>
              <li>
                <Link href="/connect-gbp" className="hover:text-white transition-colors">
                  Connect Google Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Legal & Trust
            </h4>
            <ul className="space-y-2 text-sm text-[#94A9C4]">
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <span className="text-[#657E9E]">Security & Privacy</span>
              </li>
              <li>
                <span className="text-[#657E9E]">GDPR & CCPA</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#7B94B2] gap-4">
          <p>© {new Date().getFullYear()} Eholler Local SEO. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Built for Modern Businesses</span>
            <span>•</span>
            <span>Google Business Profile Compatible</span>
          </div>
        </div>

      </div>
    </footer>
  );
}

