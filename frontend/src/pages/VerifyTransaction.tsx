import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  Hash,
  Database,
  Building,
  Calendar,
  DollarSign,
  FileText,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { api } from '../utils/api';
import deployedInfo from '../blockchain/deployedContract.json';

export const VerifyTransaction: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('query') || '';

  const [query, setQuery] = useState<string>(initialQuery);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string>('');

  const [registryStatus, setRegistryStatus] = useState<any>(null);

  useEffect(() => {
    // Fetch live registry status
    api.get('/blockchain/status')
      .then((res) => setRegistryStatus(res.data))
      .catch((err) => console.warn('Could not fetch registry status:', err));

    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSearch = async (searchTarget?: string) => {
    const q = (searchTarget || query).trim();
    if (!q) {
      setErrorMsg('Please enter a transaction hash or donation reference.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setResult(null);

    try {
      const res = await api.get(`/blockchain/verify?query=${encodeURIComponent(q)}`);
      setResult(res.data);
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message ||
        'No matching record found on the configured blockchain registry. Please check your query and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const sampleQueries = [
    { label: 'Sample Reconciled Donation', value: 'DON-2026-881902' },
    { label: 'Sample Web3 Tx Hash', value: '0x5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c' },
    { label: 'Sample Report Anchored Hash', value: '0x7e4a8f9c1b3d5e2a4f6d8c0b2e4a6f8d0c2e4a6f8d0c2e4a6f8d0c2e4a6f8d0c' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
            <ShieldCheck className="w-4 h-4" /> Live Cryptographic Verification Portal
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Verify Donation & Impact Records
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm max-w-2xl mx-auto">
            DONATO anchors donation receipts and NGO fund utilization reports to immutable smart contracts.
            Verify cryptographic proofs, transaction hashes, and anti-tamper digests in real time.
          </p>
        </div>

        {/* Network & Registry Info Banner */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <span className="text-slate-500 dark:text-slate-400 font-medium">Smart Contract:</span>{' '}
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {registryStatus?.contractAddress || deployedInfo.contractAddress}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold">
              {registryStatus?.network || 'Hardhat Local / Ethereum Testnet'}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-bold">
              Block #{registryStatus?.currentBlock || '18,452,395'}
            </span>
          </div>
        </div>

        {/* Network Warning Disclaimer */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <strong>Demonstration Network Environment:</strong> Verification records in this deployment are anchored
            against the local/testnet EVM registry contract. Zero real fiat funds or mainnet gas fees are expended.
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white dark:bg-slate-800/80 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-grow">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter Transaction Hash (0x...) or Donation Ref (DON-...)"
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>Verify Record</span>
            </button>
          </form>

          {/* Quick Click Samples */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Quick Demo Queries:</span>
            {sampleQueries.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => {
                  setQuery(s.value);
                  handleSearch(s.value);
                }}
                className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 transition-colors"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error State */}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-3xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-400 text-sm flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold mb-1">Verification Unsuccessful</div>
              <div>{errorMsg}</div>
            </div>
          </motion.div>
        )}

        {/* Verification Result Display */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800/90 rounded-3xl border border-emerald-500/30 shadow-2xl overflow-hidden"
          >
            {/* Result Header */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 text-white flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                  <CheckCircle2 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-100">
                    Cryptographic Status: Confirmed
                  </div>
                  <h3 className="text-xl font-black">
                    {result.recordType === 'donation'
                      ? 'Verified Donation Record'
                      : result.recordType === 'utilization_report'
                      ? 'Verified NGO Utilization Proof'
                      : 'Verified Blockchain Transaction'}
                  </h3>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase">
                {result.network || 'EVM Network'}
              </span>
            </div>

            {/* Content Details */}
            <div className="p-8 space-y-6">
              {/* Reference & Block Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Record Identifier</div>
                  <div className="font-mono text-sm font-bold text-slate-900 dark:text-white mt-1">
                    {result.reference}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Block Height</div>
                  <div className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                    #{result.blockNumber}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Confirmation Timestamp</div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                    {new Date(result.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Specific details based on recordType */}
              {result.financials && (
                <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Donation Amount</div>
                    <div className="text-2xl font-black text-emerald-800 dark:text-emerald-300">
                      {result.financials.currency === 'USD' ? '$' : ''}{result.financials.amount.toLocaleString()} {result.financials.currency}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Donor Attribution</div>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {result.financials.attribution}
                    </div>
                  </div>
                </div>
              )}

              {result.expenditureDetails && (
                <div className="p-5 rounded-2xl bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/40 space-y-2">
                  <div className="text-xs text-teal-700 dark:text-teal-400 font-bold uppercase tracking-wider">
                    Expenditure Summary
                  </div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">
                    {result.expenditureDetails.title}
                  </div>
                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span>Category: <strong>{result.expenditureDetails.category}</strong></span>
                    <span>Amount Spent: <strong>${result.expenditureDetails.amountSpent.toLocaleString()}</strong></span>
                  </div>
                </div>
              )}

              {result.campaign && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Associated Campaign</div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">{result.campaign.title}</div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                    NGO: {result.campaign.ngo}
                  </div>
                </div>
              )}

              {/* Cryptographic Hashes Section */}
              <div className="p-5 rounded-2xl bg-slate-900 text-slate-200 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
                  <span className="font-sans font-bold text-emerald-400 flex items-center gap-1.5">
                    <Hash className="w-4 h-4" /> Cryptographic Signatures
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Transaction Hash:</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(result.txHash, 'tx')}
                      className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      {copiedKey === 'tx' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedKey === 'tx' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="break-all text-emerald-300 select-all font-semibold">
                    {result.txHash}
                  </div>
                </div>

                {result.documentHash && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Document SHA-256 Digest:</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(result.documentHash, 'doc')}
                        className="text-[10px] text-teal-400 hover:underline flex items-center gap-1"
                      >
                        {copiedKey === 'doc' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedKey === 'doc' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <div className="break-all text-teal-300 select-all">
                      {result.documentHash}
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <span className="text-slate-400">Verified Smart Contract:</span>
                  <div className="break-all text-slate-300 select-all">
                    {result.contractAddress}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Data queried directly from DONATO verified registry
              </span>
              {result.explorerUrl && (
                <a
                  href={result.explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  View on Sepolia Etherscan <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
