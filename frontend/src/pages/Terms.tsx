import React from 'react';
import { ShieldCheck, FileCheck, CheckCircle2 } from 'lucide-react';

export const Terms: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            <FileCheck className="w-4 h-4" /> Platform Governance
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white">Terms of Service</h1>
          <p className="text-sm text-slate-500">Effective Date: October 2026 • DONATO Innovation Project</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">1. Platform Nature & Demonstration Context</h2>
            <p>
              DONATO is a blockchain-powered transparent donation platform built for innovation competitions and social impact.
              Simulated sandbox payments are strictly labelled as demonstrations and do not process actual fiat banking transfers.
              On-chain Web3 donations execute on configured EVM testnets and local development blockchains.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">2. NGO Responsibilities</h2>
            <p>
              Registered NGOs must provide accurate procurement invoices and itemized receipts for fund utilization reports.
              Submitting falsified expenditure reports or doctored receipts results in immediate suspension and blacklisting.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">3. Blockchain Immutability</h2>
            <p>
              Donors and NGOs acknowledge that records registered on the blockchain smart contract are mathematically immutable
              and cannot be erased or modified by any party.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
