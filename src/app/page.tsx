'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  BarChart3, 
  LayoutDashboard, 
  MessageSquare, 
  Download, 
  ArrowRight, 
  Check, 
  ChevronDown, 
  FileSpreadsheet
} from 'lucide-react';

const TwitterIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

export default function LandingPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const features = [
    {
      icon: <FileSpreadsheet className="w-6 h-6 text-gold" />,
      title: "Upload Any Format",
      description: "Seamlessly parse CSV, XLSX, XLS, and JSON files directly in your browser. Maximum privacy: no server file uploads required."
    },
    {
      icon: <Sparkles className="w-6 h-6 text-gold" />,
      title: "Smart Cleaning",
      description: "Remove duplicate rows, fill missing values, trim whitespaces, and standardise date formats with a 4-step guided wizard."
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-gold" />,
      title: "Auto Charts",
      description: "Auto-detect column types to generate Line, Bar, Donut, Scatter, and Histogram charts instantly using custom gold-purple themes."
    },
    {
      icon: <LayoutDashboard className="w-6 h-6 text-gold" />,
      title: "Power BI Dashboard",
      description: "Access executive-level layouts with high-level KPI cards, searchable data tables, and correlation heatmaps."
    },
    {
      icon: <MessageSquare className="w-6 h-6 text-gold" />,
      title: "AI Chat Assistant",
      description: "Talk to your data. Ask questions like 'What was our highest growth category?' and get instant streaming answers from Groq."
    },
    {
      icon: <Download className="w-6 h-6 text-gold" />,
      title: "Premium Exports",
      description: "Export cleansed spreadsheets back to CSV, Excel, or JSON. Download visual analytical reports as executive-ready PDF documents."
    }
  ];

  const steps = [
    { number: "01", name: "Upload", desc: "Drag and drop your spreadsheet into our secure browser interface." },
    { number: "02", name: "Clean", desc: "Apply basic, column, date, and missing value operations in seconds." },
    { number: "03", name: "Analyze", desc: "Interact with automatically-generated charts and chat with your AI assistant." }
  ];

  const pricing = [
    {
      name: "Free Tier",
      price: "$0",
      period: "forever",
      desc: "Perfect for testing and simple data transformations.",
      features: [
        "1 active file limit",
        "Up to 5MB file sizes",
        "Standard cleaning wizard",
        "Basic Recharts visuals",
        "Export clean sheets to CSV/JSON"
      ],
      buttonText: "Get Started Free",
      link: "/signup",
      accent: false
    },
    {
      name: "Pro Tier",
      price: "$5",
      period: "monthly",
      desc: "For professionals who need advanced analytics and AI context.",
      features: [
        "Unlimited file uploads",
        "Up to 50MB file sizes",
        "All visual charts (Scatter, Heatmaps)",
        "Groq AI Data Chat streaming",
        "Executive PDF export reports",
        "Public analysis sharing links",
        "Priority Customer Support"
      ],
      buttonText: "Upgrade to Pro",
      link: "/signup?plan=pro",
      accent: true
    }
  ];

  const faqs = [
    {
      q: "What file formats does DataLens support?",
      a: "DataLens supports CSV, Excel (XLSX, XLS), and standard JSON structures. You can also paste public Google Sheets export URLs."
    },
    {
      q: "Is my data stored securely?",
      a: "Yes. DataLens parses files directly inside your browser. Original files are not stored on our database unless you choose to save your visual dashboards to the cloud, in which case data is fully secured with Row Level Security."
    },
    {
      q: "How does the AI Chat work?",
      a: "We extract metadata, summary statistics, and sample rows from your sheet, and pass it as context to Groq API's high-speed Llama-3 model, generating accurate responses about your dataset."
    },
    {
      q: "How does the Stripe test checkout work?",
      a: "DataLens payments are fully integrated with Stripe in test mode. You can upgrade using the standard test card number 4242 4242 4242 4242 with any future expiry date and CVC."
    },
    {
      q: "Can I share my visual dashboards?",
      a: "Yes. Pro users can toggle the 'Shareable' flag on any analyzed file. This creates a secure, publicly accessible visual dashboard that you can share with colleagues or clients."
    },
    {
      q: "How do I cancel my Pro subscription?",
      a: "You can manage your subscription directly from your settings panel. Clicking the Manage Billing button opens the Stripe Customer Portal, where you can cancel or update plans in one click."
    }
  ];

  return (
    <div className="min-h-screen bg-[#080A0F] text-[#F5F0E8] font-body selection:bg-gold/30 selection:text-white">
      
      {/* Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-md border-b border-[#1E2130]/80 bg-[#080A0F]/90">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-heading text-2xl font-bold tracking-wide text-gold-light">
              Data<span className="text-[#F5F0E8]">Lens</span>
            </span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#6B7280]">
            <a href="#features" className="hover:text-gold-light transition">Features</a>
            <a href="#workflow" className="hover:text-gold-light transition">How It Works</a>
            <a href="#pricing" className="hover:text-gold-light transition">Pricing</a>
            <a href="#faq" className="hover:text-gold-light transition">FAQ</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-semibold hover:text-gold-light transition px-4 py-2">
              Log in
            </Link>
            <Link href="/signup" className="btn-gold px-5 py-2.5 text-xs tracking-wider uppercase inline-flex items-center gap-2">
              Get Started <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        {/* Glow effect backgrounds */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gold/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-purple/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#1E2130] bg-[#0E1117] text-xs font-semibold tracking-wider text-gold-light uppercase mb-6">
              <Sparkles className="w-3.5 h-3.5" /> Next-Gen Data Assistant
            </span>

            <h1 className="font-heading text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1]">
              Turn Messy Data into <br />
              <span className="text-gold-gradient font-heading">Beautiful Insights</span>
            </h1>

            <p className="max-w-2xl mx-auto text-lg md:text-xl text-[#6B7280] font-light leading-relaxed mb-10">
              Upload spreadsheets, clean duplicates and null values automatically, generate stunning visual dashboards, and query your data using AI.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link href="/signup" className="btn-gold px-8 py-4 text-sm tracking-wider uppercase w-full sm:w-auto shadow-lg shadow-gold/10">
                Start Analysing Free
              </Link>
              <a href="#demo" className="px-8 py-4 text-sm font-semibold tracking-wider uppercase border border-[#1E2130] rounded-[10px] bg-[#0E1117]/80 hover:bg-[#141720] hover:border-gold/30 transition w-full sm:w-auto">
                View Live Demo
              </a>
            </div>
          </motion.div>

          {/* Interactive Mockup */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            id="demo"
            className="relative rounded-2xl border border-[#1E2130] bg-[#0E1117] p-4 md:p-6 shadow-2xl max-w-4xl mx-auto"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#080A0F] via-transparent to-transparent opacity-60 pointer-events-none rounded-2xl" />
            <div className="flex items-center justify-between border-b border-[#1E2130] pb-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#E74C3C]/60" />
                <div className="w-3 h-3 rounded-full bg-[#C9A84C]/60" />
                <div className="w-3 h-3 rounded-full bg-[#2ECC71]/60" />
                <span className="text-xs text-[#6B7280] ml-4 font-mono">dashboard_preview.csv</span>
              </div>
              <span className="text-xs px-2.5 py-1 rounded bg-gold/10 text-gold-light border border-gold/20 font-semibold uppercase tracking-wider">
                Pro Dashboard
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-left">
              <div className="p-4 rounded-xl bg-[#141720] border border-[#1E2130]">
                <div className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">Total Rows</div>
                <div className="text-2xl font-bold text-[#F5F0E8] font-heading">12,482</div>
                <div className="text-[10px] text-green-400 mt-1">100% Parsed Successfully</div>
              </div>
              <div className="p-4 rounded-xl bg-[#141720] border border-[#1E2130]">
                <div className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">Duplicates Removed</div>
                <div className="text-2xl font-bold text-gold font-heading">342</div>
                <div className="text-[10px] text-gold-light mt-1">Cleansed Auto-wizard</div>
              </div>
              <div className="p-4 rounded-xl bg-[#141720] border border-[#1E2130]">
                <div className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">Missing Fields Filled</div>
                <div className="text-2xl font-bold text-purple font-heading">1,209</div>
                <div className="text-[10px] text-[#8B6FBB] mt-1">Mean value interpolation</div>
              </div>
            </div>

            {/* Dummy Mockup Chart Graphics */}
            <div className="h-60 rounded-xl bg-[#141720]/50 border border-[#1E2130] flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 flex items-end justify-between px-8 pt-10">
                {[40, 65, 50, 85, 70, 95, 80, 110, 90, 120, 95, 130].map((h, i) => (
                  <div key={i} className="w-8 bg-gradient-to-t from-gold/10 to-gold rounded-t" style={{ height: `${h}%` }} />
                ))}
              </div>
              <div className="z-10 bg-[#0E1117]/90 px-4 py-3 rounded-lg border border-[#1E2130] text-center max-w-sm backdrop-blur-sm">
                <p className="text-xs font-semibold text-[#F5F0E8]">Sales Trends & Forecast Analysis</p>
                <p className="text-[10px] text-[#6B7280] mt-1">Renders auto charts dynamically based on date & numeric variables.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 bg-[#0E1117]/30 border-y border-[#1E2130]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="font-heading text-3xl md:text-5xl font-bold tracking-tight mb-6">
              Designed For High-Performance Analytics
            </h2>
            <p className="text-[#6B7280] text-lg font-light">
              Skip complex formulas and expensive setups. Upload and clean datasets with our luxury workspace tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="card-luxury p-8 flex flex-col gap-5">
                <div className="w-12 h-12 rounded-xl bg-[#141720] border border-[#1E2130] flex items-center justify-center">
                  {feature.icon}
                </div>
                <h3 className="font-heading text-xl font-bold text-[#F5F0E8]">
                  {feature.title}
                </h3>
                <p className="text-[#6B7280] text-sm leading-relaxed font-light">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works / Workflow */}
      <section id="workflow" className="py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-24">
            <h2 className="font-heading text-3xl md:text-5xl font-bold tracking-tight mb-6">
              Three Steps to Full Clarity
            </h2>
            <p className="text-[#6B7280] text-lg font-light">
              The fastest way to transform raw database files and CSV sheets into client-ready visual dashboards.
            </p>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-10 left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-gold/10 via-gold/40 to-gold/10 z-0" />

            {steps.map((step, idx) => (
              <div key={idx} className="relative z-10 text-center flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-[#0E1117] border border-[#1E2130] flex items-center justify-center font-heading text-xl font-extrabold text-gold shadow-lg mb-6">
                  {step.number}
                </div>
                <h3 className="font-heading text-2xl font-bold text-[#F5F0E8] mb-3">{step.name}</h3>
                <p className="text-[#6B7280] text-sm leading-relaxed max-w-xs font-light">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 bg-[#0E1117]/30 border-t border-[#1E2130]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="font-heading text-3xl md:text-5xl font-bold tracking-tight mb-6">
              Transparent, Premium Plans
            </h2>
            <p className="text-[#6B7280] text-lg font-light">
              Test out the wizard tool with our free plan, or unlock complete AI analytics with Stripe test checkout.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {pricing.map((card, idx) => (
              <div 
                key={idx} 
                className={`rounded-2xl border bg-[#0E1117] p-8 md:p-10 flex flex-col justify-between transition relative overflow-hidden ${
                  card.accent ? 'border-gold shadow-xl shadow-gold/5' : 'border-[#1E2130]'
                }`}
              >
                {card.accent && (
                  <div className="absolute top-0 right-0 bg-gold text-[#080A0F] text-[10px] tracking-widest font-extrabold uppercase py-1.5 px-5 rounded-bl-lg">
                    Recommended
                  </div>
                )}
                <div>
                  <h3 className="font-heading text-2xl font-bold text-[#F5F0E8] mb-2">{card.name}</h3>
                  <p className="text-sm text-[#6B7280] font-light mb-6">{card.desc}</p>
                  
                  <div className="flex items-baseline gap-2 mb-8">
                    <span className="font-heading text-5xl font-extrabold text-[#F5F0E8]">{card.price}</span>
                    <span className="text-[#6B7280] text-sm font-light">/ {card.period}</span>
                  </div>

                  <ul className="space-y-4 mb-10">
                    {card.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm text-[#6B7280] font-light">
                        <Check className="w-4.5 h-4.5 text-gold shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link 
                  href={card.link}
                  className={`w-full py-4 text-xs font-bold uppercase tracking-wider text-center rounded-[10px] block transition ${
                    card.accent 
                      ? 'btn-gold shadow-lg shadow-gold/15'
                      : 'border border-[#1E2130] bg-[#141720] hover:bg-[#1E2130] text-[#F5F0E8]'
                  }`}
                >
                  {card.buttonText}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-32 border-t border-[#1E2130]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="font-heading text-3xl md:text-5xl font-bold tracking-tight mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-[#6B7280] text-lg font-light">
              Clear answers to your security and usage queries.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div 
                key={idx} 
                className="border border-[#1E2130] bg-[#0E1117] rounded-xl overflow-hidden transition"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-[#141720]/30 transition"
                >
                  <span className="font-heading text-base md:text-lg font-bold text-[#F5F0E8]">
                    {faq.q}
                  </span>
                  <ChevronDown 
                    className={`w-5 h-5 text-gold-light transition-transform duration-300 ${
                      activeFaq === idx ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {activeFaq === idx && (
                  <div className="px-6 pb-6 pt-2 border-t border-[#1E2130]/30 text-sm text-[#6B7280] leading-relaxed font-light">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1E2130] bg-[#080A0F] py-16">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left">
            <span className="font-heading text-xl font-bold text-gold-light">
              Data<span className="text-[#F5F0E8]">Lens</span>
            </span>
            <p className="text-[#6B7280] text-xs font-light mt-2 max-w-xs leading-relaxed">
              Premium browser-based analytics and data cleaning platform powered by artificial intelligence.
            </p>
          </div>

          <div className="flex gap-6 text-xs text-[#6B7280] font-light">
            <a href="#features" className="hover:text-gold-light transition">Features</a>
            <a href="#pricing" className="hover:text-gold-light transition">Pricing</a>
            <a href="#" className="hover:text-gold-light transition">Privacy Policy</a>
            <a href="#" className="hover:text-gold-light transition">Terms of Service</a>
          </div>

          <div className="flex gap-4">
            <a href="#" className="w-9 h-9 rounded-lg border border-[#1E2130] bg-[#0E1117] flex items-center justify-center text-[#6B7280] hover:text-gold-light hover:border-gold/30 transition">
              <TwitterIcon className="w-4 h-4" />
            </a>
            <a href="#" className="w-9 h-9 rounded-lg border border-[#1E2130] bg-[#0E1117] flex items-center justify-center text-[#6B7280] hover:text-gold-light hover:border-gold/30 transition">
              <LinkedinIcon className="w-4 h-4" />
            </a>
            <a href="#" className="w-9 h-9 rounded-lg border border-[#1E2130] bg-[#0E1117] flex items-center justify-center text-[#6B7280] hover:text-gold-light hover:border-gold/30 transition">
              <GithubIcon className="w-4 h-4" />
            </a>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 text-center md:text-left mt-8 pt-8 border-t border-[#1E2130]/30 text-[10px] text-[#6B7280] font-light">
          &copy; {new Date().getFullYear()} DataLens Inc. All rights reserved. Built with Next.js 14, Supabase, and Stripe Test Mode.
        </div>
      </footer>

    </div>
  );
}
