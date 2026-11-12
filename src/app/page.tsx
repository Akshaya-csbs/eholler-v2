import React from 'react';
import type { Metadata } from 'next';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { WaveDivider } from '@/components/landing/WaveDivider';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { FinalCtaSection } from '@/components/landing/FinalCtaSection';
import { LandingFooter } from '@/components/landing/LandingFooter';

export const metadata: Metadata = {
  title: 'Eholler Local SEO | Dominate Local Search & Grow Your Business',
  description:
    'Connect your Google Business Profile and unlock powerful Local SEO insights, rank tracking, and AI-powered recommendations in one easy-to-use platform.',
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#F7F1E7] text-[#172B45] selection:bg-[#3478C9] selection:text-white flex flex-col">
      {/* Premium Full-Width Sticky Navigation */}
      <LandingNavbar />

      {/* Split-Layout Hero Section */}
      <HeroSection />

      {/* Smooth Organic Navy & Cream Wave Transition */}
      <WaveDivider />

      {/* Dedicated Features Section */}
      <FeaturesSection />

      {/* Simple 3-Step "How It Works" Section */}
      <HowItWorksSection />

      {/* Transparent Pricing Plans */}
      <PricingSection />

      {/* Final High-Converting CTA Banner */}
      <FinalCtaSection />

      {/* Elegant Minimal Footer */}
      <LandingFooter />
    </main>
  );
}
