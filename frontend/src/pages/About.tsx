import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Lock,
  Eye,
  Heart,
  FileCheck,
  Database,
  ArrowRight,
  Award,
  Zap,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-16">
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
            <ShieldCheck className="w-4 h-4" /> The DONATO Protocol
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tight">
            Making Every Donation Count
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            “Make giving transparent and trustworthy for every donor.”
          </p>
        </div>

        {/* The Core Problem & Our Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">The Challenge</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Many people want to donate, but they hesitate because of a lack of transparency and trust. Donors
              frequently ask: <em>“Did my money reach the children?”</em> and <em>“How was the expenditure actually utilized?”</em>
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
              <Eye className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">The DONATO Solution</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              DONATO bridges this gap through a unified platform that connects donors with vetted NGOs, logs
              immutable transaction proofs to an Ethereum smart contract registry, and requires itemized fund
              utilization reports anchored by cryptographic hashes.
            </p>
          </div>
        </div>

        {/* Triple-Layer Trust Architecture */}
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white">Triple-Layer Trust Architecture</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              How DONATO ensures verifiable accountability from donation click to ground impact.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <span className="w-8 h-8 rounded-full bg-emerald-500 text-white font-black text-xs flex items-center justify-center">
                1
              </span>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Admin-Verified NGOs</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Organizations must submit government registration papers and official identity documentation.
                Only platform-approved NGOs can publish campaigns.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <span className="w-8 h-8 rounded-full bg-teal-500 text-white font-black text-xs flex items-center justify-center">
                2
              </span>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Immutable Smart Contract</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Every confirmed donation is logged on the <code className="font-mono text-[11px]">DonatoDonationRegistry</code> smart contract.
                Donors receive instant cryptographic receipts with verifiable transaction hashes.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <span className="w-8 h-8 rounded-full bg-indigo-500 text-white font-black text-xs flex items-center justify-center">
                3
              </span>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Anchored Fund Utilization</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                When NGOs spend funds, procurement invoices are uploaded and hashed using SHA-256. The hash is anchored
                on-chain, preventing retroactively falsified expense records.
              </p>
            </div>
          </div>
        </div>

        {/* Security & Strict Privacy Mandate */}
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white border border-slate-800 shadow-2xl space-y-6">
          <div className="flex items-center gap-3">
            <Lock className="w-7 h-7 text-emerald-400" />
            <h3 className="text-2xl font-black">Smart Contract Security & Privacy Guarantee</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-300">
            <div className="space-y-2">
              <h4 className="font-bold text-sm text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Checks-Effects-Interactions & Guards
              </h4>
              <p className="leading-relaxed">
                Contract implements OpenZeppelin <code className="font-mono">ReentrancyGuard</code>, <code className="font-mono">Pausable</code>,
                and role-based authorization to ensure funds and state transitions cannot be manipulated or drained.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-sm text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Zero PII on Blockchain
              </h4>
              <p className="leading-relaxed">
                Personal identity details, donor phone numbers, email addresses, and private payment credentials
                are NEVER written to the public ledger. Only anonymous references and document hashes are registered.
              </p>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="text-center pt-6 space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/campaigns"
              className="px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-xl shadow-emerald-600/20 flex items-center gap-2 transition-all"
            >
              <span>Explore Verified Campaigns</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/verify"
              className="px-8 py-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-sm transition-all"
            >
              Verify A Transaction Hash
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
