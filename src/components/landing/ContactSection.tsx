'use client';

import React from 'react';
import {
  Phone,
  Mail,
  MapPin,
  Globe,
  Clock,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Building2,
  MessageSquare,
} from 'lucide-react';

export function ContactSection() {
  const contactMethods = [
    {
      id: 'phone',
      icon: Phone,
      title: 'Phone Consultation',
      value: '+91 97910 74290',
      href: 'tel:+919791074290',
      actionLabel: 'Call Our Team',
      caption: 'Monday to Saturday, 9:00 AM to 6:00 PM IST',
      badge: 'Immediate Assistance',
    },
    {
      id: 'email',
      icon: Mail,
      title: 'Email Support & Inquiries',
      value: 'info@eholler.in',
      href: 'mailto:info@eholler.in',
      actionLabel: 'Send an Email',
      caption: 'Inquiries, audits, and custom agency plans',
      badge: 'Quick 24h Response',
    },
    {
      id: 'address',
      icon: MapPin,
      title: 'Registered Headquarters',
      value: 'Chennai, Tamil Nadu',
      addressDetails: 'New No. 9, Old No. 6/3, 4th Street, Venkateswara Nagar, Adyar, Chennai, Tamil Nadu - 600020, India',
      href: 'https://maps.google.com/?q=New+No.+9,+Old+No.+6/3,+4th+Street,+Venkateswara+Nagar,+Adyar,+Chennai,+Tamil+Nadu+600020',
      actionLabel: 'Open in Google Maps',
      caption: 'eholler Digital Services Private Limited',
      badge: 'Corporate Office',
    },
    {
      id: 'website',
      icon: Globe,
      title: 'Official Corporate Agency',
      value: 'www.eholler.in',
      href: 'https://eholler.in',
      actionLabel: 'Visit eholler.in',
      caption: 'Branding, web engineering, and enterprise digital solutions',
      badge: 'Parent Organization',
    },
  ];

  return (
    <section id="contact" className="py-20 lg:py-28 bg-[#FCF9F3] border-t border-[#EBE1D1] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-block mb-3">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#3478C9]">
              Contact & Corporate Information
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-black text-[#102D50] tracking-tight leading-tight mb-4">
            Connect with the Eholler Team
          </h2>

          <p className="text-base sm:text-lg text-[#65748A] leading-relaxed">
            Have questions about ranking your business on Google Search, onboarding multi-location accounts, or custom SEO strategies? Our team is here to assist.
          </p>
        </div>

        {/* 4 Contact Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {contactMethods.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-6 border border-[#E8DEC9] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#EBF2FA] text-[#3478C9] flex items-center justify-center shadow-inner">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#3478C9] bg-[#EBF2FA] px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#65748A] mb-1">
                    {item.title}
                  </h3>

                  <p className="text-lg font-bold text-[#102D50] mb-2 leading-snug">
                    {item.value}
                  </p>

                  {item.addressDetails ? (
                    <p className="text-xs text-[#5F7188] leading-relaxed mb-4">
                      {item.addressDetails}
                    </p>
                  ) : (
                    <p className="text-xs text-[#5F7188] leading-relaxed mb-4">
                      {item.caption}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-[#F1F5F9]">
                  <a
                    href={item.href}
                    target={item.href.startsWith('http') ? '_blank' : undefined}
                    rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3478C9] hover:text-[#102D50] transition-colors"
                  >
                    <span>{item.actionLabel}</span>
                    {item.href.startsWith('http') ? (
                      <ExternalLink className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5" />
                    )}
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Corporate Trust & Headquarters Information Banner */}
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
                  <Clock className="w-3.5 h-3.5 text-[#60A5FA]" />
                  Operating Hours: Mon - Sat, 9 AM - 6 PM IST
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
