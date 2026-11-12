'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useUser, SignOutButton } from '@clerk/nextjs';
import { Menu, X, ArrowRight, ChevronDown, User, LogOut } from 'lucide-react';

export function LandingNavbar() {
  const { isSignedIn, user } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[#F7F1E7]/95 backdrop-blur-md border-b border-[#EBE1D1] transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            {/* Custom Location Pin + Upward Analytics Icon */}
            <div className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-[#102D50] text-white shadow-md shadow-[#102D50]/15 group-hover:scale-105 transition-transform duration-200">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5 text-white"
              >
                {/* Location Pin Silhouette */}
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#102D50" stroke="white" />
                {/* Analytics Trending Bars Inside */}
                <path d="M9 12v-2" stroke="white" strokeWidth="1.8" />
                <path d="M12 12V8" stroke="white" strokeWidth="1.8" />
                <path d="M15 12V6" stroke="white" strokeWidth="1.8" />
                <path d="M8 8.5l3.5-3.5 2 1.5 3-3" stroke="#60A5FA" strokeWidth="1.5" />
              </svg>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-extrabold tracking-tight text-[#102D50]">
                Eholler
              </span>
              <span className="text-xl font-medium tracking-tight text-[#3478C9]">
                Local SEO
              </span>
            </div>
          </Link>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="flex items-center gap-1 text-[15px] font-medium text-[#172B45] hover:text-[#3478C9] transition-colors duration-150"
            >
              Features
              <ChevronDown className="w-3.5 h-3.5 text-[#65748A]" />
            </a>
            <a
              href="#how-it-works"
              className="text-[15px] font-medium text-[#172B45] hover:text-[#3478C9] transition-colors duration-150"
            >
              How It Works
            </a>
            <a
              href="#pricing"
              className="text-[15px] font-medium text-[#172B45] hover:text-[#3478C9] transition-colors duration-150"
            >
              Pricing
            </a>
            <a
              href="#resources"
              className="flex items-center gap-1 text-[15px] font-medium text-[#172B45] hover:text-[#3478C9] transition-colors duration-150"
            >
              Resources
              <ChevronDown className="w-3.5 h-3.5 text-[#65748A]" />
            </a>
            <a
              href="#contact"
              className="text-[15px] font-medium text-[#172B45] hover:text-[#3478C9] transition-colors duration-150"
            >
              Contact
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            {isSignedIn ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#102D50] hover:bg-[#1A3D68] text-white text-sm font-semibold shadow-sm hover:shadow transition-all duration-150"
                >
                  <span>Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <SignOutButton>
                  <button
                    className="p-2 rounded-full border border-[#D5CBBB] text-[#65748A] hover:text-[#102D50] hover:bg-[#EFE8DC] transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </SignOutButton>
              </div>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="px-5 py-2.5 rounded-full border border-[#102D50] text-[#102D50] hover:bg-[#102D50]/5 text-sm font-semibold transition-all duration-150"
                >
                  Login
                </Link>
                <Link
                  href="/sign-up"
                  className="px-5 py-2.5 rounded-full bg-[#102D50] hover:bg-[#1A3D68] text-white text-sm font-semibold shadow-sm hover:shadow transition-all duration-150"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Hamburger Button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#102D50] hover:bg-[#EFE8DC] transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#EBE1D1] bg-[#F7F1E7] px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <nav className="flex flex-col space-y-2">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-base font-medium text-[#172B45] hover:bg-[#EFE8DC]"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-base font-medium text-[#172B45] hover:bg-[#EFE8DC]"
            >
              How It Works
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-base font-medium text-[#172B45] hover:bg-[#EFE8DC]"
            >
              Pricing
            </a>
            <a
              href="#resources"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-base font-medium text-[#172B45] hover:bg-[#EFE8DC]"
            >
              Resources
            </a>
            <a
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-base font-medium text-[#172B45] hover:bg-[#EFE8DC]"
            >
              Contact
            </a>
          </nav>
          
          <div className="pt-4 border-t border-[#EBE1D1] flex flex-col gap-2.5">
            {isSignedIn ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 px-4 rounded-full bg-[#102D50] text-white font-semibold text-sm shadow-sm"
                >
                  Go to Dashboard →
                </Link>
                <SignOutButton>
                  <button className="w-full text-center py-2 px-4 rounded-full border border-[#D5CBBB] text-[#65748A] font-medium text-sm">
                    Sign Out ({user?.primaryEmailAddress?.emailAddress})
                  </button>
                </SignOutButton>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/sign-in"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 px-4 rounded-full border border-[#102D50] text-[#102D50] font-semibold text-sm hover:bg-[#102D50]/5"
                >
                  Login
                </Link>
                <Link
                  href="/sign-up"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 px-4 rounded-full bg-[#102D50] text-white font-semibold text-sm shadow-sm hover:bg-[#1A3D68]"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

