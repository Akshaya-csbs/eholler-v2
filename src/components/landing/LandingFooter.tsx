import React from 'react';
import Link from 'next/link';
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  ExternalLink,
  Clock,
  ShieldCheck,
} from 'lucide-react';

export function LandingFooter() {
  return (
    <footer id="contact" className="bg-[#102D50] text-[#DCE8F6] pt-12 pb-10 border-t border-[#1C3E68] scroll-mt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Main Footer Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-10 border-b border-[#1F4572]">
          
          {/* Brand & Corporate Entity (4 cols on lg) */}
          <div className="lg:col-span-4 space-y-4">
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

            <p className="text-xs font-semibold text-[#8FB4DF] tracking-wide uppercase">
              eholler Digital Services Private Limited
            </p>

            <p className="text-sm text-[#94A9C4] leading-relaxed max-w-sm">
              AI-powered Local SEO management platform helping local businesses, multi-location brands, and agencies dominate Google Search and Maps.
            </p>

            <div className="flex items-center gap-2.5 pt-2 text-xs text-[#94A9C4]">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>All Systems Operational • Google API Active</span>
            </div>
          </div>

          {/* Product Links (2 cols on lg) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Product
            </h4>
            <ul className="space-y-2 text-sm text-[#94A9C4]">
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Rank Tracking
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

          {/* Company & Resources (2 cols on lg) */}
          <div className="lg:col-span-2 space-y-3">
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
                <a href="#contact" className="hover:text-white transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <a
                  href="https://eholler.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <span>eholler.in</span>
                  <ExternalLink className="w-3 h-3 text-[#60A5FA]" />
                </a>
              </li>
              <li>
                <Link href="/sign-in" className="hover:text-white transition-colors">
                  Client Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Corporate Headquarters & Direct Contact (4 cols on lg) */}
          <div className="lg:col-span-4 space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Headquarters & Contact
            </h4>

            <div className="space-y-2.5 text-xs text-[#94A9C4]">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#60A5FA] shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  <strong className="text-[#C2D6EE] block font-semibold">eholler Digital Services Pvt. Ltd.</strong>
                  New No. 9, Old No. 6/3, 4th Street, Venkateswara Nagar, Adyar, Chennai, Tamil Nadu - 600020, India
                </span>
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <Phone className="w-4 h-4 text-[#60A5FA] shrink-0" />
                <a href="tel:+919791074290" className="text-white hover:text-[#60A5FA] font-medium transition-colors">
                  +91 97910 74290
                </a>
              </div>

              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#60A5FA] shrink-0" />
                <a href="mailto:info@eholler.in" className="text-white hover:text-[#60A5FA] font-medium transition-colors">
                  info@eholler.in
                </a>
              </div>

              <div className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-[#60A5FA] shrink-0" />
                <a
                  href="https://eholler.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  https://eholler.in
                </a>
              </div>

              <div className="flex items-center gap-2.5 text-[11px] text-[#7B94B2] pt-1">
                <Clock className="w-3.5 h-3.5 text-[#60A5FA] shrink-0" />
                <span>Mon - Sat: 9:00 AM - 6:00 PM IST</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#7B94B2] gap-4">
          <p>© {new Date().getFullYear()} eholler Digital Services Private Limited. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <span>Google Business Profile Compatible</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
