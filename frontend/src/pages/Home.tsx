import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Heart,
  ShieldCheck,
  Search,
  ArrowRight,
  PieChart,
  CheckCircle2,
  Lock,
  Building,
  DollarSign,
  Users,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { DonationModal } from '../components/DonationModal';

export const Home: React.FC = () => {
  const { user } = useAuth();
  const [featuredCampaigns, setFeaturedCampaigns] = useState<any[]>([]);
  const [searchTxQuery, setSearchTxQuery] = useState<string>('');
  const [selectedDonationCampaign, setSelectedDonationCampaign] = useState<any | null>(null);

  useEffect(() => {
    api.get('/campaigns')
      .then((res) => {
        setFeaturedCampaigns(res.data.slice(0, 3));
      })
      .catch((err) => console.warn('Could not load featured campaigns:', err));
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 100 } },
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 overflow-x-hidden relative">
      {/* Dynamic Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[30%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/10 dark:bg-cyan-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold mb-6 shadow-sm"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          DONATO: Making Every Donation Count
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight mb-6 max-w-4xl mx-auto leading-[1.08] text-slate-900 dark:text-white"
        >
          Blockchain-Powered{' '}
          <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
            Transparent Giving
          </span>{' '}
          For Verified Causes
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          “Make giving transparent and trustworthy for every donor.” Connect directly with audited NGOs,
          verify donation transactions on the Ethereum blockchain, and track milestone expenditures in real time.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <Link
            to="/campaigns"
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-600/20 group text-base"
          >
            <span>Browse Verified Campaigns</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            to="/verify"
            className="w-full sm:w-auto px-8 py-4 bg-white/70 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold rounded-2xl border border-slate-200 dark:border-slate-700 transition-all text-base flex items-center justify-center gap-2 shadow-sm"
          >
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <span>Verify Transaction Hash</span>
          </Link>
        </motion.div>

        {/* Quick Search Bar Directly On Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="max-w-2xl mx-auto mb-20"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (searchTxQuery) window.location.href = `/verify?query=${encodeURIComponent(searchTxQuery)}`;
            }}
            className="relative flex items-center shadow-2xl rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-1.5"
          >
            <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
            <input
              type="text"
              value={searchTxQuery}
              onChange={(e) => setSearchTxQuery(e.target.value)}
              placeholder="Test verification: enter tx hash (0x...) or ref (DON-2026-881902)"
              className="w-full px-3 py-2.5 bg-transparent text-xs sm:text-sm font-medium outline-none text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-emerald-600 dark:hover:bg-emerald-700 text-xs font-bold transition-colors shrink-0"
            >
              Verify
            </button>
          </form>
        </motion.div>

        {/* Real-time Stats Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md shadow-sm max-w-5xl mx-auto"
        >
          {[
            { value: '$45,000+', label: 'Verified Donations', desc: 'Anchored on Ethereum registry' },
            { value: '100%', label: 'On-Chain Verifiable', desc: 'Zero PII disclosed' },
            { value: '3,800+', label: 'Children & Beneficiaries', desc: 'Supported across active NGOs' },
            { value: '0 Modified', label: 'Tamper-Proof Records', desc: 'SHA-256 hash digests' },
          ].map((stat, idx) => (
            <motion.div variants={itemVariants} key={idx} className="text-center p-3">
              <p className="text-2xl sm:text-4xl font-black bg-gradient-to-tr from-emerald-600 to-teal-500 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-400 leading-none mb-2">
                {stat.value}
              </p>
              <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">{stat.label}</p>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">{stat.desc}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Featured Verified Campaigns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
              Active Social Impact
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white">
              Featured Verified Initiatives
            </h2>
          </div>
          <Link
            to="/campaigns"
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>View All Campaigns</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featuredCampaigns.map((camp) => {
            const percent = Math.min(100, Math.round((camp.raisedAmount / camp.targetAmount) * 100));
            return (
              <div
                key={camp.id}
                className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
                    <img
                      src={camp.bannerImage}
                      alt={camp.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-slate-950/70 backdrop-blur-md text-white text-[10px] font-bold uppercase">
                        {camp.category.replace('_', ' ')}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1 shadow">
                        <ShieldCheck className="w-3 h-3" /> On-Chain
                      </span>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {camp.ngo?.name}
                    </div>
                    <Link to={`/campaigns/${camp.id}`} className="block">
                      <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors line-clamp-2">
                        {camp.title}
                      </h3>
                    </Link>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {camp.description}
                    </p>

                    <div className="space-y-1.5 pt-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-emerald-600 dark:text-emerald-400">
                          ${camp.raisedAmount.toLocaleString()}
                        </span>
                        <span className="text-slate-400">of ${camp.targetAmount.toLocaleString()} ({percent}%)</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0 border-t border-slate-100 dark:border-slate-800/80 mt-4 grid grid-cols-2 gap-3">
                  <Link
                    to={`/campaigns/${camp.id}?tab=transparency`}
                    className="py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <PieChart className="w-3.5 h-3.5 text-teal-500" />
                    <span>Utilization</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => setSelectedDonationCampaign(camp)}
                    className="py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black flex items-center justify-center gap-1.5 shadow transition-all"
                  >
                    <Heart className="w-3.5 h-3.5 fill-white" />
                    <span>Donate</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* "Where Your Money Goes" Feature Highlight */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <div className="p-10 rounded-3xl bg-gradient-to-br from-emerald-900 via-slate-900 to-cyan-950 text-white shadow-2xl space-y-8 border border-emerald-500/20">
          <div className="max-w-2xl space-y-3">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider border border-emerald-500/30">
              Anti-Tamper Accountability
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
              Where Your Money Goes: 100% Traceable
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              We eliminate black-box charity spending. NGOs must submit itemized procurement bills and receipts.
              Our platform calculates an immutable cryptographic SHA-256 digest of each invoice and anchors it
              directly into our Ethereum smart contract.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 space-y-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              <h4 className="font-bold text-sm">Invoice Anchoring</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Wholesale grain, milk, medical, and logistics receipts are hashed so that claims cannot be revised later.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 space-y-2">
              <Lock className="w-6 h-6 text-cyan-400" />
              <h4 className="font-bold text-sm">Admin Audit Pipeline</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Platform administrators inspect document validity before authorizing blockchain synchronization.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 space-y-2">
              <ShieldCheck className="w-6 h-6 text-teal-400" />
              <h4 className="font-bold text-sm">Public Ledger Verification</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Anyone can independently verify document authenticity on Sepolia Etherscan with one click.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black">
              <Heart className="w-4 h-4 fill-white" />
            </div>
            <span className="font-black text-slate-900 dark:text-white">DONATO Platform</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <Link to="/campaigns" className="hover:text-emerald-600">Campaigns</Link>
            <Link to="/verify" className="hover:text-emerald-600">Blockchain Explorer</Link>
            <Link to="/about" className="hover:text-emerald-600">About & Protocol</Link>
            <Link to="/privacy" className="hover:text-emerald-600">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-emerald-600">Terms of Service</Link>
          </div>

          <p className="text-xs text-slate-400">
            © 2026 DONATO. Social Cause Innovation Project.
          </p>
        </div>
      </footer>

      {/* Donation Modal */}
      {selectedDonationCampaign && (
        <DonationModal
          campaign={selectedDonationCampaign}
          isOpen={!!selectedDonationCampaign}
          onClose={() => setSelectedDonationCampaign(null)}
          onSuccess={() => {
            api.get('/campaigns').then((res) => setFeaturedCampaigns(res.data.slice(0, 3)));
          }}
        />
      )}
    </div>
  );
};
