import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Heart,
  Search,
  Filter,
  ShieldCheck,
  TrendingUp,
  Users,
  Calendar,
  ArrowRight,
  PieChart,
  DollarSign,
  Loader2,
} from 'lucide-react';
import { api } from '../utils/api';
import { DonationModal } from '../components/DonationModal';

const categories = [
  { id: '', label: 'All Causes' },
  { id: 'orphanage_care', label: 'Orphanage Care' },
  { id: 'food_hunger', label: 'Food & Hunger' },
  { id: 'disaster_relief', label: 'Disaster Relief' },
  { id: 'education', label: 'Education' },
  { id: 'health_medical', label: 'Health & Medical' },
];

export const Campaigns: React.FC = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCampaignForDonation, setSelectedCampaignForDonation] = useState<any | null>(null);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedCategory) params.category = selectedCategory;
      if (searchQuery) params.search = searchQuery;

      const res = await api.get('/campaigns', { params });
      setCampaigns(res.data);
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCampaigns();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Page Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
            <ShieldCheck className="w-4 h-4" /> 100% On-Chain Verified Transparency
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Explore Verified Campaigns
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
            Support high-impact social initiatives by vetted NGOs and orphanages. Every dollar is tracked with
            cryptographic proof, milestone expenditures, and verified receipts.
          </p>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === c.id
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search causes..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </form>
          </div>
        </div>

        {/* Campaign Cards Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            <p className="text-sm font-semibold text-slate-500">Loading verified initiatives...</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-800/40 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
            <Heart className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold">No campaigns found</h3>
            <p className="text-xs text-slate-500 mt-1">Try switching categories or clearing search terms.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {campaigns.map((camp) => {
              const percent = Math.min(100, Math.round((camp.raisedAmount / camp.targetAmount) * 100));
              return (
                <motion.div
                  key={camp.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col justify-between group"
                >
                  {/* Banner Image */}
                  <div>
                    <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
                      <img
                        src={camp.bannerImage || 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80'}
                        alt={camp.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-slate-950/70 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider">
                          {camp.category.replace('_', ' ')}
                        </span>
                        {camp.onChainCampaignId && (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/90 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1 shadow">
                            <ShieldCheck className="w-3 h-3" /> On-Chain
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-6 space-y-4">
                      {/* NGO Attribution */}
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {camp.ngo?.name || 'Verified NGO'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-[11px] text-slate-400">
                          <ShieldCheck className="w-3 h-3 text-emerald-500" /> Admin Audited
                        </span>
                      </div>

                      {/* Title */}
                      <Link to={`/campaigns/${camp.id}`} className="block">
                        <h3 className="font-black text-lg text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
                          {camp.title}
                        </h3>
                      </Link>

                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {camp.description}
                      </p>

                      {/* Progress Bar */}
                      <div className="space-y-1.5 pt-2">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-emerald-600 dark:text-emerald-400">
                            ${camp.raisedAmount.toLocaleString()} raised
                          </span>
                          <span className="text-slate-400">
                            of ${camp.targetAmount.toLocaleString()} ({percent}%)
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700/60 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-700"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="p-6 pt-0 border-t border-slate-100 dark:border-slate-800/80 mt-4 grid grid-cols-2 gap-3">
                    <Link
                      to={`/campaigns/${camp.id}?tab=transparency`}
                      className="py-3 px-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <PieChart className="w-3.5 h-3.5 text-teal-500" />
                      <span>Where Money Goes</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => setSelectedCampaignForDonation(camp)}
                      className="py-3 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
                    >
                      <Heart className="w-3.5 h-3.5 fill-white" />
                      <span>Donate</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Donation Modal */}
      {selectedCampaignForDonation && (
        <DonationModal
          campaign={selectedCampaignForDonation}
          isOpen={!!selectedCampaignForDonation}
          onClose={() => setSelectedCampaignForDonation(null)}
          onSuccess={() => {
            fetchCampaigns();
          }}
        />
      )}
    </div>
  );
};
