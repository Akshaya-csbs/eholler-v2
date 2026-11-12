'use client';

import React from 'react';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  Building2,
} from 'lucide-react';

export function ContactSection() {
  return (
    <section id="contact" className="py-10 lg:py-14 bg-[#FCF9F3] border-t border-[#EBE1D1] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Corporate Trust & Headquarters Information Banner (Blue Color Box) */}
        <div className="bg-[#102D50] text-white rounded-3xl p-8 lg:p-10 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#3478C9]/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-8 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#60A5FA] text-xs font-semibold">
                <Building2 className="w-3.5 h-3.5" />
                <span>eholler Digital Services Private Limited</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Built and Operated by Experienced Digital Professionals
              </h3>
              <p className="text-sm sm:text-base text-[#C2D6EE] leading-relaxed max-w-2xl font-normal">
                Eholler Local SEO is an intelligent SaaS platform developed by eholler Digital Services Private Limited, Chennai. We empower entrepreneurs and businesses with cutting-edge Local SEO automation and verified Google Business integrations.
              </p>
              <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-[#A5C3E7] pt-2">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#60A5FA]" />
                  Adyar, Chennai, Tamil Nadu - 600020
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#60A5FA]" />
                  Mon - Sat, 9 AM - 6 PM IST
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Verified Google API Partner Infrastructure
                </span>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-end items-stretch">
              <a
                href="mailto:info@eholler.in"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white hover:bg-[#F0F5FA] text-[#102D50] font-semibold text-sm transition-colors shadow-md"
              >
                <Mail className="w-4 h-4 text-[#3478C9]" />
                <span>info@eholler.in</span>
              </a>
              <a
                href="tel:+919791074290"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#1C3E68] hover:bg-[#254F85] text-white border border-[#2D5A92] font-semibold text-sm transition-colors"
              >
                <Phone className="w-4 h-4 text-[#60A5FA]" />
                <span>+91 97910 74290</span>
              </a>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
