import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Heart,
  ShieldCheck,
  Building,
  Calendar,
  DollarSign,
  PieChart,
  FileText,
  ExternalLink,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Hash,
  Download,
  Share2,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { api } from '../utils/api';
import { DonationModal } from '../components/DonationModal';
import { DigitalReceiptModal } from '../components/DigitalReceiptModal';
import type { IDigitalReceipt } from '../components/DigitalReceiptModal';

export const CampaignDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'story';

  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [campaign, setCampaign] = useState<any | null>(null);
  const [utilizationData, setUtilizationData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDonationOpen, setIsDonationOpen] = useState<boolean>(false);

  const [selectedReceipt, setSelectedReceipt] = useState<IDigitalReceipt | null>(null);

  const fetchCampaignData = async () => {
    if (!id) return;
    try {
      const [campRes, utilRes] = await Promise.all([
        api.get(`/campaigns/${id}`),
        api.get(`/utilization/campaign/${id}`).catch(() => ({ data: null })),
      ]);
      setCampaign(campRes.data);
      setUtilizationData(utilRes.data);
    } catch (err) {
      console.error('Error fetching campaign:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaignData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Loading campaign transparency ledger...</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <h2 className="text-xl font-bold">Campaign Not Found</h2>
        <Link to="/campaigns" className="text-emerald-600 hover:underline text-sm font-semibold">
          Return to All Campaigns
        </Link>
      </div>
    );
  }

  const percentRaised = Math.min(100, Math.round((campaign.raisedAmount / campaign.targetAmount) * 100));
  const remainingTarget = Math.max(0, campaign.targetAmount - campaign.raisedAmount);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Link to="/" className="hover:underline">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/campaigns" className="hover:underline">Campaigns</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-xs">{campaign.title}</span>
        </div>

        {/* Campaign Hero Banner */}
        <div className="relative h-80 sm:h-96 w-full rounded-3xl overflow-hidden bg-slate-950 shadow-2xl">
          <img
            src={campaign.bannerImage || 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1400&q=80'}
            alt={campaign.title}
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          {/* Banner Meta Badges */}
          <div className="absolute top-6 left-6 flex flex-wrap items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider">
              {campaign.category.replace('_', ' ')}
            </span>
            <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/90 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1.5 shadow">
              <ShieldCheck className="w-4 h-4" /> Blockchain Registered
            </span>
          </div>

          <div className="absolute bottom-6 left-6 right-6 max-w-3xl space-y-2">
            <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight tracking-tight">
              {campaign.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-200">
              <div className="flex items-center gap-1.5">
                <Building className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold">{campaign.ngo?.name || 'Verified NGO'}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>Launched {new Date(campaign.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content & Floating Contribution Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tab Switcher */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <button
                type="button"
                onClick={() => setActiveTab('story')}
                className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  activeTab === 'story'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                The Cause & Story
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('transparency')}
                className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'transparency'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
                }`}
              >
                <PieChart className="w-4 h-4" />
                <span>Where Your Money Goes</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('donations')}
                className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'donations'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Public Ledger ({campaign.donations?.length || 0})</span>
              </button>
            </div>

            {/* TAB 1: STORY & BENEFICIARIES */}
            {activeTab === 'story' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white dark:bg-slate-800/80 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6"
              >
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mb-3">About This Initiative</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {campaign.description}
                  </p>
                </div>

                {campaign.beneficiaryStory && (
                  <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Who You Are Helping (Beneficiary Impact)
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {campaign.beneficiaryStory}
                    </p>
                  </div>
                )}

                {/* NGO Profile Card */}
                <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black text-xl">
                    {campaign.ngo?.name?.charAt(0) || 'N'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{campaign.ngo?.name}</h4>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                        Verified Partner
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {campaign.ngo?.ngoProfile?.mission || 'Committed to transparent and verifiable social impact.'}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 2: WHERE YOUR MONEY GOES (FUND UTILIZATION) */}
            {activeTab === 'transparency' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* Financial Summary Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-1">
                      Total Donations Received
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                      ${campaign.raisedAmount.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                      {percentRaised}% of ${campaign.targetAmount.toLocaleString()} target
                    </div>
                  </div>

                  <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-1">
                      Verified Expenditure Spent
                    </div>
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      ${utilizationData?.totalExpenditureVerified?.toLocaleString() || '0'}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Anchored on smart contract
                    </div>
                  </div>

                  <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-1">
                      Remaining Unspent Balance
                    </div>
                    <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                      ${utilizationData?.remainingBalance?.toLocaleString() || campaign.raisedAmount.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Held in verified reserve
                    </div>
                  </div>
                </div>

                {/* Audit Disclaimer Notice */}
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-300 text-xs flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold">Cryptographic Fund Traceability</div>
                    <p className="leading-relaxed text-[11px] text-emerald-800 dark:text-emerald-400">
                      Expenditure reports below are verified against official invoices and anchored to the Ethereum smart contract
                      using cryptographic SHA-256 digests. This guarantees that procurement details cannot be retroactively altered.
                    </p>
                  </div>
                </div>

                {/* Detailed Utilization Reports */}
                <div className="space-y-4">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Milestone Expenditure Reports ({campaign.utilizationReports?.length || 0})
                  </h3>

                  {(!campaign.utilizationReports || campaign.utilizationReports.length === 0) ? (
                    <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
                      No expenditure reports published yet. The NGO will submit reports once fund milestones are allocated.
                    </div>
                  ) : (
                    campaign.utilizationReports.map((report: any) => {
                      const isVerified = report.verificationStatus === 'verified_by_admin';
                      return (
                        <div
                          key={report.id}
                          className="bg-white dark:bg-slate-800/90 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold uppercase">
                                  {report.category}
                                </span>
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    isVerified
                                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                                      : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                                  }`}
                                >
                                  {isVerified ? '✓ Verified by Platform Admin' : 'Pending Review'}
                                </span>
                              </div>
                              <h4 className="text-base font-black text-slate-900 dark:text-white mt-1">
                                {report.title}
                              </h4>
                            </div>

                            <div className="text-right">
                              <div className="text-xs text-slate-400">Expenditure</div>
                              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                                ${report.amountSpent.toLocaleString()}
                              </div>
                            </div>
                          </div>

                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {report.description}
                          </p>

                          {/* Cryptographic Details Card */}
                          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs font-mono">
                            <div className="flex flex-wrap items-center justify-between gap-2 text-slate-500">
                              <span className="font-sans font-bold flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                                <Hash className="w-3.5 h-3.5 text-emerald-500" /> Document SHA-256 Digest:
                              </span>
                              <span className="text-[11px] font-sans">
                                {new Date(report.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="break-all text-[11px] text-teal-600 dark:text-teal-400 select-all">
                              {report.documentHash}
                            </div>

                            {report.onChainTxHash && (
                              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                                <span className="text-[11px] text-slate-500 font-sans">Smart Contract Tx:</span>
                                <Link
                                  to={`/verify?query=${report.onChainTxHash}`}
                                  className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-sans"
                                >
                                  Verify On-Chain <ExternalLink className="w-3 h-3" />
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}

            {/* TAB 3: PUBLIC DONATIONS LEDGER */}
            {activeTab === 'donations' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white dark:bg-slate-800/80 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
              >
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Public Contribution Roll</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    All completed donations verified via smart contract. Zero private personal information is disclosed.
                  </p>
                </div>

                {(!campaign.donations || campaign.donations.length === 0) ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    No contributions yet. Be the first supporter of this verified campaign!
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {campaign.donations.map((don: any) => (
                      <div key={don.id} className="p-5 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs">
                            {don.isAnonymous ? '?' : don.donorName?.charAt(0) || 'D'}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white">
                              {don.isAnonymous ? 'Anonymous Donor' : don.donorName}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2">
                              <span>{new Date(don.createdAt).toLocaleDateString()}</span>
                              <span>•</span>
                              <span className="font-mono">{don.donationRef}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
                              {don.currency === 'USD' ? '$' : ''}{don.amount.toLocaleString()} {don.currency}
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold">
                              Verified
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedReceipt({
                                receiptNumber: `REC-${don.donationRef}`,
                                donationRef: don.donationRef,
                                campaignName: campaign.title,
                                ngoName: campaign.ngo?.name || 'Verified NGO',
                                amount: don.amount,
                                currency: don.currency,
                                channel: don.channel,
                                paymentStatus: 'completed',
                                timestamp: don.createdAt,
                                donorAttribution: don.isAnonymous ? 'Anonymous Donor' : don.donorName,
                                txHash: don.txHash,
                                verifiedOnChain: don.verifiedOnChain,
                              });
                            }}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
                          >
                            Receipt
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Right Floating Contribution Card */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800/90 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 sticky top-24">
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                    ${campaign.raisedAmount.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-400 font-bold">
                    target: ${campaign.targetAmount.toLocaleString()}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                    style={{ width: `${percentRaised}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  <span>{percentRaised}% funded</span>
                  <span>${remainingTarget.toLocaleString()} to go</span>
                </div>
              </div>

              {/* Main CTA */}
              <button
                type="button"
                onClick={() => setIsDonationOpen(true)}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white font-black text-base shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
              >
                <Heart className="w-5 h-5 fill-white" />
                <span>Donate Now</span>
              </button>

              {/* Trust Features */}
              <div className="space-y-3 pt-2 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Verified NGO identity & registration</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Immediate immutable digital receipt</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <PieChart className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Itemized procurement milestones tracked</span>
                </div>
              </div>

              {/* Smart Contract Proof Widget */}
              {campaign.onChainCampaignId && (
                <div className="p-4 rounded-2xl bg-slate-900 text-slate-300 text-xs font-mono space-y-1">
                  <span className="text-[10px] uppercase font-sans font-bold text-emerald-400">
                    On-Chain Campaign Anchor
                  </span>
                  <div className="break-all text-[11px] text-emerald-300 select-all">
                    {campaign.onChainCampaignId}
                  </div>
                  <Link
                    to={`/verify?query=${campaign.onChainCampaignId}`}
                    className="inline-flex items-center gap-1 text-[10px] font-sans font-bold text-teal-400 hover:underline pt-1"
                  >
                    Inspect in Explorer <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Donation Modal */}
      <DonationModal
        campaign={campaign}
        isOpen={isDonationOpen}
        onClose={() => setIsDonationOpen(false)}
        onSuccess={() => {
          fetchCampaignData();
        }}
      />

      {/* Digital Receipt Modal */}
      <DigitalReceiptModal
        receipt={selectedReceipt}
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />
    </div>
  );
};
