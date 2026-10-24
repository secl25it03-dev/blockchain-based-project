import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ShieldCheck, Download, ExternalLink, X, Hash, Award, Building, Calendar, DollarSign } from 'lucide-react';

export interface IDigitalReceipt {
  receiptNumber: string;
  donationRef: string;
  campaignName: string;
  ngoName: string;
  amount: number;
  currency: string;
  channel?: string;
  paymentGateway?: string;
  paymentStatus: string;
  timestamp: string | Date;
  donorAttribution: string;
  txHash?: string;
  network?: string;
  blockNumber?: number;
  contractAddress?: string;
  verifiedOnChain?: boolean;
  digitalFingerprint?: string;
}

interface DigitalReceiptModalProps {
  receipt: IDigitalReceipt | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DigitalReceiptModal: React.FC<DigitalReceiptModalProps> = ({ receipt, isOpen, onClose }) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(receipt.timestamp).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-emerald-500/30 rounded-3xl shadow-2xl overflow-hidden my-8"
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-8 py-6 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
                  DONATO Transparent Donation Platform
                </span>
                <h2 className="text-2xl font-black tracking-tight">Verified Digital Donation Receipt</h2>
              </div>
            </div>
          </div>

          {/* Receipt Body */}
          <div ref={receiptRef} className="p-8 space-y-6 text-slate-800 dark:text-slate-100">
            {/* Top Status */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Reconciliation Status</div>
                  <div className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                    Payment Verified & Anchored to Smart Contract
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Receipt ID</div>
                <div className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                  {receipt.receiptNumber}
                </div>
              </div>
            </div>

            {/* Financial & Campaign Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  Amount Contributed
                </div>
                <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                  {receipt.currency === 'USD' ? '$' : ''}{receipt.amount.toLocaleString()} {receipt.currency}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Via {receipt.channel === 'crypto_web3' ? 'MetaMask Web3' : 'Gateway / Sandbox'}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <Calendar className="w-4 h-4 text-teal-500" />
                  Timestamp
                </div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-100">{formattedDate}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Attribution: <span className="font-semibold text-slate-700 dark:text-slate-300">{receipt.donorAttribution}</span>
                </div>
              </div>
            </div>

            {/* Beneficiary Details */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Building className="w-4 h-4 text-cyan-500" />
                Cause & Beneficiary Organization
              </div>
              <div className="font-bold text-base text-slate-900 dark:text-white">
                {receipt.campaignName}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300">
                Verified Organization: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{receipt.ngoName}</span>
              </div>
            </div>

            {/* Blockchain Verification Proof */}
            <div className="p-5 rounded-2xl bg-slate-900 text-slate-200 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
                <span className="flex items-center gap-1.5 font-sans font-bold text-emerald-400">
                  <ShieldCheck className="w-4 h-4" /> Cryptographic Blockchain Record
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] uppercase font-bold border border-emerald-800/50">
                  {receipt.network || 'Ethereum Testnet'}
                </span>
              </div>

              {receipt.txHash && (
                <div className="space-y-1">
                  <span className="text-slate-400">Transaction Hash:</span>
                  <div className="break-all text-emerald-300 select-all font-semibold">
                    {receipt.txHash}
                  </div>
                </div>
              )}

              {receipt.contractAddress && (
                <div className="space-y-1">
                  <span className="text-slate-400">Smart Contract:</span>
                  <div className="break-all text-slate-300 select-all">
                    {receipt.contractAddress}
                  </div>
                </div>
              )}

              {receipt.digitalFingerprint && (
                <div className="space-y-1">
                  <span className="text-slate-400">Receipt SHA-256 Digest:</span>
                  <div className="break-all text-teal-300 select-all">
                    {receipt.digitalFingerprint}
                  </div>
                </div>
              )}
            </div>

            {/* Privacy Compliance Callout */}
            <p className="text-[11px] text-slate-500 dark:text-slate-400 italic text-center">
              Zero sensitive personal identity info (passwords, Aadhaar, payment card details) is stored on the public blockchain.
              Only anonymous record reference, amount, currency, and cryptographic timestamps are anchored.
            </p>
          </div>

          {/* Modal Footer Actions */}
          <div className="px-8 py-5 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
            {receipt.txHash ? (
              <a
                href={`/verify?query=${receipt.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Inspect On Explorer <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={handlePrint}
                className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" /> Print / Save PDF
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
