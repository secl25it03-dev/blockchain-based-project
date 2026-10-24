import React, { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  CheckCircle,
  Truck,
  Plus,
  FileText,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  PieChart,
  DollarSign,
  Hash,
  ExternalLink,
  UploadCloud,
  Check,
  X,
  Loader2,
} from 'lucide-react';

export const NGODashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [availableListings, setAvailableListings] = useState<any[]>([]);
  const [myClaims, setMyClaims] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [myCampaigns, setMyCampaigns] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'campaigns' | 'utilization' | 'feed' | 'my-claims'>('campaigns');
  const [loading, setLoading] = useState(true);

  // Selected vendor mapping dictionary for dropdowns
  const [selectedVendorsMap, setSelectedVendorsMap] = useState<{ [key: string]: string }>({});

  // Create Campaign Modal
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newBeneficiary, setNewBeneficiary] = useState('');
  const [newCategory, setNewCategory] = useState('orphanage_care');
  const [newTarget, setNewTarget] = useState('10000');
  const [newBanner, setNewBanner] = useState('https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80');
  const [creatingCampaign, setCreatingCampaign] = useState(false);

  // Submit Utilization Report Modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedCampaignForReport, setSelectedCampaignForReport] = useState('');
  const [reportTitle, setReportTitle] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [amountSpent, setAmountSpent] = useState('1200');
  const [reportCategory, setReportCategory] = useState('Staple Food Supply');
  const [invoiceFileName, setInvoiceFileName] = useState('Procurement_Invoice_Oct2026.pdf');
  const [submittingReport, setSubmittingReport] = useState(false);

  useEffect(() => {
    fetchNGOData();
  }, []);

  const fetchNGOData = async () => {
    try {
      setLoading(true);
      const [availableRes, myClaimsRes, vendorsRes, campaignsRes] = await Promise.all([
        api.get('/donations/food/available').catch(() => ({ data: [] })),
        api.get('/donations/history/ngo').catch(() => ({ data: [] })),
        api.get('/donations/vendors/available').catch(() => ({ data: [] })),
        api.get('/campaigns').catch(() => ({ data: [] })),
      ]);
      setAvailableListings(availableRes.data || []);
      setMyClaims(myClaimsRes.data || []);
      setVendors(vendorsRes.data || []);
      
      // Filter campaigns by current user if active NGO
      const allCamp = campaignsRes.data || [];
      const userCampaigns = user?.role === 'admin' 
        ? allCamp 
        : allCamp.filter((c: any) => c.ngoId === user?.id || c.ngo?.id === user?.id);
      setMyCampaigns(userCampaigns.length > 0 ? userCampaigns : allCamp);
    } catch (e: any) {
      showToast('Error syncing NGO dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (donationId: string) => {
    try {
      await api.post(`/donations/food/${donationId}/claim`);
      showToast('Food donation claimed successfully!', 'success');
      fetchNGOData();
    } catch (e: any) {
      showToast('Failed to claim food donation', 'error');
    }
  };

  const handleAssignVendor = async (donationId: string) => {
    const vendorId = selectedVendorsMap[donationId];
    if (!vendorId) {
      showToast('Please select a driver first', 'warning');
      return;
    }

    try {
      await api.post(`/donations/food/${donationId}/assign`, { vendorId });
      showToast('Rider dispatched to pickup address!', 'success');
      setSelectedVendorsMap((prev) => {
        const copy = { ...prev };
        delete copy[donationId];
        return copy;
      });
      fetchNGOData();
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Failed to dispatch vendor', 'error');
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDesc || !newTarget) {
      showToast('Please complete all required campaign fields', 'warning');
      return;
    }

    setCreatingCampaign(true);
    try {
      const res = await api.post('/campaigns', {
        title: newTitle,
        description: newDesc,
        beneficiaryStory: newBeneficiary,
        category: newCategory,
        targetAmount: parseFloat(newTarget),
        currency: 'USD',
        bannerImage: newBanner,
      });

      showToast('Campaign launched and registered on Ethereum!', 'success');
      setShowCampaignModal(false);
      setNewTitle('');
      setNewDesc('');
      fetchNGOData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to create campaign', 'error');
    } finally {
      setCreatingCampaign(false);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaignForReport || !reportTitle || !reportDesc || !amountSpent) {
      showToast('Please complete all required report fields', 'warning');
      return;
    }

    setSubmittingReport(true);
    try {
      await api.post('/utilization/submit', {
        campaignId: selectedCampaignForReport,
        title: reportTitle,
        description: reportDesc,
        amountSpent: parseFloat(amountSpent),
        category: reportCategory,
        supportingDocuments: [
          {
            name: invoiceFileName,
            url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
          },
        ],
      });

      showToast('Utilization report submitted for platform review!', 'success');
      setShowReportModal(false);
      setReportTitle('');
      setReportDesc('');
      fetchNGOData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to submit report', 'error');
    } finally {
      setSubmittingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  const isVerified = user?.status === 'active';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Verification Status Banner */}
        {!isVerified ? (
          <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4 text-amber-800 dark:text-amber-300">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <div>
                <h4 className="font-bold text-sm">Organization Verification Pending</h4>
                <p className="text-xs">
                  Your registration papers are currently under review by Platform Admin. You can view demo features;
                  publishing live campaigns will unlock once approved.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-500 text-white font-black text-xs shrink-0">
              Under Review
            </span>
          </div>
        ) : (
          <div className="p-4 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-4 text-emerald-800 dark:text-emerald-300 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                <strong>Verified Organization:</strong> Fully approved for Ethereum registry anchoring and public fundraising.
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-bold text-[10px]">
              Active Partner
            </span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              NGO / Orphanage Impact Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Create transparent donation campaigns, upload itemized expenditure reports, and manage food logistics.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowReportModal(true)}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <UploadCloud className="w-4 h-4 text-emerald-500" /> Submit Expense Report
            </button>

            <button
              onClick={() => setShowCampaignModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" /> New Campaign
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'campaigns'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            My Donation Campaigns ({myCampaigns.length})
          </button>

          <button
            onClick={() => setActiveTab('utilization')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'utilization'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>Fund Utilization & Invoice Ledger</span>
          </button>

          <button
            onClick={() => setActiveTab('feed')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'feed'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Surplus Food Feeds ({availableListings.length})
          </button>

          <button
            onClick={() => setActiveTab('my-claims')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'my-claims'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Claimed Logistics ({myClaims.length})
          </button>
        </div>

        {/* TAB 1: CAMPAIGNS */}
        {activeTab === 'campaigns' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {myCampaigns.map((camp) => {
                const percent = Math.min(100, Math.round((camp.raisedAmount / camp.targetAmount) * 100));
                return (
                  <div
                    key={camp.id}
                    className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px]">
                        {camp.category}
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {camp.status.toUpperCase()}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-slate-900 dark:text-white line-clamp-2">
                      {camp.title}
                    </h3>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span>${camp.raisedAmount.toLocaleString()} raised</span>
                        <span className="text-slate-400">${camp.targetAmount.toLocaleString()} goal</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    {camp.onChainCampaignId && (
                      <div className="p-2.5 rounded-xl bg-slate-900 text-[10px] font-mono text-emerald-400 break-all select-all">
                        On-chain ID: {camp.onChainCampaignId.slice(0, 16)}...
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <a
                        href={`/campaigns/${camp.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        Public View <ExternalLink className="w-3 h-3" />
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCampaignForReport(camp.id);
                          setShowReportModal(true);
                        }}
                        className="px-3 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 rounded-lg font-bold text-[11px]"
                      >
                        + Add Expense
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: FUND UTILIZATION REPORTS */}
        {activeTab === 'utilization' && (
          <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Published Expenditure & Utilization Ledger
                </h3>
                <p className="text-xs text-slate-500">
                  Every submitted invoice is hashed with SHA-256 for cryptographic anchoring upon platform review.
                </p>
              </div>
              <button
                onClick={() => setShowReportModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
              >
                + New Expense Report
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {myCampaigns.flatMap((c) => c.utilizationReports || []).length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No expenditure reports submitted yet. Click "+ New Expense Report" to upload invoices.
                </div>
              ) : (
                myCampaigns.flatMap((c) => (c.utilizationReports || []).map((r: any) => ({ ...r, campaignTitle: c.title }))).map((rep: any) => (
                  <div key={rep.id} className="p-6 flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1 max-w-lg">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-[10px] font-bold uppercase">
                          {rep.category}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            rep.verificationStatus === 'verified_by_admin'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400'
                          }`}
                        >
                          {rep.verificationStatus.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{rep.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{rep.description}</p>
                      <div className="text-[11px] font-mono text-teal-600 dark:text-teal-400 select-all">
                        SHA-256: {rep.documentHash?.slice(0, 24)}...
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                        ${rep.amountSpent.toLocaleString()}
                      </div>
                      {rep.onChainTxHash && (
                        <a
                          href={`/verify?query=${rep.onChainTxHash}`}
                          className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center justify-end gap-1"
                        >
                          View On-Chain <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: FOOD DONATIONS FEED (PRESERVED) */}
        {activeTab === 'feed' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableListings.length === 0 ? (
              <div className="col-span-3 p-12 text-center text-xs text-slate-400 bg-white dark:bg-slate-800 rounded-3xl">
                No surplus food currently available in this radius.
              </div>
            ) : (
              availableListings.map((item) => (
                <div key={item.id} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <h4 className="font-bold text-sm">{item.donor?.name || 'Surplus Donor'}</h4>
                  <p className="text-xs text-slate-500">{item.pickupAddress}</p>
                  <button
                    onClick={() => handleClaim(item.id)}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs"
                  >
                    Claim Food Donation
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 4: MY CLAIMS & LOGISTICS (PRESERVED) */}
        {activeTab === 'my-claims' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {myClaims.length === 0 ? (
              <div className="col-span-2 p-12 text-center text-xs text-slate-400 bg-white dark:bg-slate-800 rounded-3xl">
                No claimed items yet.
              </div>
            ) : (
              myClaims.map((item) => (
                <div key={item.id} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold">Claim #{item.id.slice(0, 8)}</span>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                      {item.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{item.pickupAddress}</p>
                  {item.status === 'claimed' && (
                    <div className="flex gap-2 pt-2">
                      <select
                        onChange={(e) => setSelectedVendorsMap({ ...selectedVendorsMap, [item.id]: e.target.value })}
                        className="flex-grow p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-900"
                      >
                        <option value="">Select Delivery Driver</option>
                        {vendors.map((v) => (
                          <option key={v.userId} value={v.userId}>
                            {v.user?.name || v.vehicleType} ({v.vehicleType})
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleAssignVendor(item.id)}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                      >
                        Assign
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Create Campaign Modal */}
      <AnimatePresence>
        {showCampaignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 max-w-lg w-full my-8 space-y-4"
            >
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-black text-lg text-slate-900 dark:text-white">Launch Verified Campaign</h3>
                <button onClick={() => setShowCampaignModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCampaign} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold mb-1">Campaign Title *</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Daily Nutritional Meals for 150 Children"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Target Amount ($) *</label>
                    <input
                      type="number"
                      required
                      min="100"
                      value={newTarget}
                      onChange={(e) => setNewTarget(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Category *</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                    >
                      <option value="orphanage_care">Orphanage Care</option>
                      <option value="food_hunger">Food & Hunger</option>
                      <option value="disaster_relief">Disaster Relief</option>
                      <option value="education">Education</option>
                      <option value="health_medical">Health & Medical</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1">Description *</label>
                  <textarea
                    required
                    rows={3}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Describe program goals and operational plan..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Beneficiary Story</label>
                  <textarea
                    rows={2}
                    value={newBeneficiary}
                    onChange={(e) => setNewBeneficiary(e.target.value)}
                    placeholder="Who will directly receive these supplies?"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={creatingCampaign}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2"
                >
                  {creatingCampaign ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  <span>Publish & Anchor to Blockchain</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Submit Report Modal */}
      <AnimatePresence>
        {showReportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 max-w-lg w-full my-8 space-y-4"
            >
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-black text-lg text-slate-900 dark:text-white">Submit Utilization Report</h3>
                <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitReport} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold mb-1">Associated Campaign *</label>
                  <select
                    required
                    value={selectedCampaignForReport}
                    onChange={(e) => setSelectedCampaignForReport(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  >
                    <option value="">Select Campaign</option>
                    {myCampaigns.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">Expenditure Report Title *</label>
                  <input
                    type="text"
                    required
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    placeholder="e.g. 500kg Rice & Lentils Wholesale Purchase"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Amount Spent ($) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={amountSpent}
                      onChange={(e) => setAmountSpent(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Category *</label>
                    <select
                      value={reportCategory}
                      onChange={(e) => setReportCategory(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                    >
                      <option value="Staple Food Supply">Staple Food Supply</option>
                      <option value="Fresh Dairy & Nutrition">Fresh Dairy & Nutrition</option>
                      <option value="Medical & Pediatric Care">Medical & Pediatric Care</option>
                      <option value="Logistics & Distribution">Logistics & Distribution</option>
                      <option value="Educational Materials">Educational Materials</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1">Procurement Invoice Reference *</label>
                  <input
                    type="text"
                    required
                    value={invoiceFileName}
                    onChange={(e) => setInvoiceFileName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    SHA-256 cryptographic digest will be computed and anchored on smart contract upon admin approval.
                  </p>
                </div>

                <div>
                  <label className="block font-bold mb-1">Description / Notes *</label>
                  <textarea
                    required
                    rows={2}
                    value={reportDesc}
                    onChange={(e) => setReportDesc(e.target.value)}
                    placeholder="Details about vendor, items, and distribution schedule..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReport}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2"
                >
                  {submittingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                  <span>Submit For Verification</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
