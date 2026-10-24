import React from 'react';
import { ShieldCheck, Lock, EyeOff, Server } from 'lucide-react';

export const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" /> Transparency & Data Protection
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white">Privacy Policy</h1>
          <p className="text-sm text-slate-500">Effective Date: October 2026 • DONATO Innovation Project</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-emerald-500" /> 1. Blockchain Privacy Rule (Zero On-Chain PII)
            </h2>
            <p>
              In accordance with DONATO's privacy architecture, Personally Identifiable Information (PII) including
              donor full names, phone numbers, email addresses, government IDs (such as Aadhaar or SSN), bank details,
              and private payment credentials are <strong>strictly never recorded to the public Ethereum blockchain</strong>.
            </p>
            <p>
              Only anonymous record identifiers (e.g. <code className="font-mono text-xs">DON-2026-XXXX</code>), contribution amounts,
              currency designations, and cryptographic document hashes are anchored on-chain.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-teal-500" /> 2. Anonymous Attribution
            </h2>
            <p>
              Donors can select the anonymous attribution toggle at checkout. When selected, public donor rolls and
              campaign leaderboards display the attribution as <em>“Anonymous Donor”</em>.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-500" /> 3. Verification Documents
            </h2>
            <p>
              NGO onboarding documents and tax exemption certificates uploaded for platform verification are
              stored securely in encrypted cloud storage and accessible exclusively by authorized platform administrators.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
