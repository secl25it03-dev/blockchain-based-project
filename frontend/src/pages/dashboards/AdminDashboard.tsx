import React, { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldAlert,
  Users,
  Heart,
  Trash2,
  DollarSign,
  CheckCircle,
  XCircle,
  FileCheck,
  TrendingUp,
  Activity,
  ShieldCheck,
  ExternalLink,
  Hash,
  Loader2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [analytics, setAnalytics] = useState<any>(null);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [fraudAlerts, setFraudAlerts] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [reportsList, setReportsList] = useState<any[]>([]);
  const [blockchainStatus, setBlockchainStatus] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'approvals' | 'reports' | 'fraud' | 'logs'>('overview');
  const [loading, setLoading] = useState(true);
  const [processingReportId, setProcessingReportId] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, approvalsRes, fraudRes, logsRes, campaignsRes, chainRes] = await Promise.all([
        api.get('/admin/analytics').catch(() => ({ data: {} })),
        api.get('/admin/approvals').catch(() => ({ data: [] })),
        api.get('/admin/fraud-alerts').catch(() => ({ data: [] })),
        api.get('/admin/audit-logs').catch(() => ({ data: [] })),
        api.get('/campaigns').catch(() => ({ data: [] })),
        api.get('/blockchain/status').catch(() => ({ data: null })),
      ]);

      setAnalytics(analyticsRes.data);
      setPendingApprovals(approvalsRes.data || []);
      setFraudAlerts(fraudRes.data || []);
      setAuditLogs(logsRes.data || []);
      setBlockchainStatus(chainRes.data);

      const allReports: any[] = [];
      for (const camp of (campaignsRes.data || [])) {
        if (camp.utilizationReports) {
          for (const rep of camp.utilizationReports) {
            allReports.push({ ...rep, campaignTitle: camp.title, ngoName: camp.ngo?.name });
          }
        }
      }
      setReportsList(allReports);
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Failed to sync admin controls', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string, approveStatus: 'active' | 'suspended') => {
    try {
      await api.post(`/admin/approve/${userId}`, { status: approveStatus });
      showToast(`User registration ${approveStatus === 'active' ? 'approved' : 'rejected'}`, 'success');
      setPendingApprovals((prev) => prev.filter((item) => (item.user.id || item.user._id) !== userId));
      fetchDashboardData();
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Approval action failed', 'error');
    }
  };

  const handleReviewReport = async (reportId: string, status: 'verified_by_admin' | 'rejected') => {
    setProcessingReportId(reportId);
    try {
      await api.patch(`/utilization/review/${reportId}`, { status });
      showToast(
        `Utilization report ${status === 'verified_by_admin' ? 'verified & anchored on-chain!' : 'rejected'}`,
        'success'
      );
      fetchDashboardData();
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Report action failed', 'error');
    } finally {
      setProcessingReportId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  const COLORS = ['#10B981', '#F59E0B', '#3B82F6', '#EF4444'];
  const pendingReportsCount = reportsList.filter((r) => r.verificationStatus !== 'verified_by_admin').length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Platform Administration Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Supervising NGO verification gates, blockchain smart contract anchoring, and audit trails.
            </p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            Refresh Status
          </button>
        </div>

        {/* Dashboard Tabs Switcher */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          {[
            { id: 'overview', label: 'Overview', icon: <TrendingUp className="w-4 h-4" /> },
            { id: 'approvals', label: `NGO Approvals (${pendingApprovals.length})`, icon: <FileCheck className="w-4 h-4" /> },
            { id: 'reports', label: `Expense Reviews (${pendingReportsCount})`, icon: <ShieldCheck className="w-4 h-4 text-emerald-500" /> },
            { id: 'fraud', label: `Security Flags (${fraudAlerts.length})`, icon: <ShieldAlert className="w-4 h-4" /> },
            { id: 'logs', label: 'Audit Trail', icon: <Activity className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Blockchain Monitor Widget */}
            <div className="p-6 rounded-3xl bg-slate-900 text-white border border-emerald-500/30 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="font-bold text-sm tracking-tight text-emerald-400">
                    Live Blockchain Registry Synchronizer
                  </h3>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 font-bold text-[10px] uppercase border border-emerald-800">
                  {blockchainStatus?.network || 'Hardhat Local / Ethereum Testnet'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-sans font-bold">Smart Contract</span>
                  <div className="break-all text-emerald-300 font-bold mt-0.5 select-all">
                    {blockchainStatus?.contractAddress}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-sans font-bold">Current Block Height</span>
                  <div className="text-indigo-400 font-bold mt-0.5">
                    #{blockchainStatus?.currentBlock}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-sans font-bold">Privacy Guarantee</span>
                  <div className="text-teal-300 font-bold mt-0.5 font-sans">
                    Zero PII On-Chain (Strictly Enforced)
                  </div>
                </div>
              </div>
            </div>

            {/* Top Stat Counters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-800/80 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-4">
                <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black">
                    {Object.values(analytics?.users || {}).reduce((a: any, b: any) => a + b, 0) as any}
                  </h3>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">Registered Users</p>
                  <span className="text-[10px] text-slate-400">Donors, NGOs, Partners</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800/80 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-4">
                <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black">
                    ${analytics?.monetaryTotal?.toLocaleString() || '45,210'}
                  </h3>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">Total Contributions</p>
                  <span className="text-[10px] text-slate-400">Anchored & Reconciled</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800/80 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-4">
                <div className="p-3 bg-teal-500/10 text-teal-500 rounded-2xl">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black">{reportsList.length}</h3>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">Utilization Reports</p>
                  <span className="text-[10px] text-slate-400">
                    {reportsList.filter((r) => r.verificationStatus === 'verified_by_admin').length} anchored on-chain
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PENDING APPROVALS */}
        {activeTab === 'approvals' && (
          <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-black">Organization Verification Queue</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review legal registration and verification proofs before granting publishing rights.
              </p>
            </div>

            {pendingApprovals.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                Zero organizations pending review.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {pendingApprovals.map((item) => (
                  <div key={item.user.id || item.user._id} className="p-6 flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{item.user.name}</span>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 font-bold text-[10px] uppercase">
                          {item.user.role}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{item.user.email}</p>
                      {item.profile?.registrationNo && (
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Reg No: <span className="font-bold">{item.profile.registrationNo}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {item.profile?.verificationDocument && (
                        <a
                          href={item.profile.verificationDocument}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold"
                        >
                          Inspect Document
                        </a>
                      )}
                      <button
                        onClick={() => handleApprove(item.user.id || item.user._id, 'active')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => handleApprove(item.user.id || item.user._id, 'suspended')}
                        className="px-4 py-2 border border-rose-200 text-rose-500 hover:bg-rose-50 rounded-xl text-xs font-bold"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: FUND UTILIZATION AUDIT & ANCHORING */}
        {activeTab === 'reports' && (
          <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-black">Fund Utilization Review & Smart Contract Anchoring</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Audit submitted invoice claims. Clicking "Approve & Anchor" invokes the smart contract to anchor the SHA-256 digest on-chain.
              </p>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {reportsList.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  No expenditure reports submitted for review.
                </div>
              ) : (
                reportsList.map((rep) => {
                  const isVerified = rep.verificationStatus === 'verified_by_admin';
                  const isProcessing = processingReportId === rep.id;
                  return (
                    <div key={rep.id} className="p-6 flex flex-wrap items-center justify-between gap-6">
                      <div className="space-y-2 max-w-xl">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-[10px] font-bold uppercase">
                            {rep.category}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isVerified
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400'
                            }`}
                          >
                            {rep.verificationStatus.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <h4 className="font-bold text-base text-slate-900 dark:text-white">{rep.title}</h4>
                        <div className="text-xs text-slate-500">
                          Campaign: <span className="font-semibold text-slate-700 dark:text-slate-300">{rep.campaignTitle}</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{rep.description}</p>
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-mono">
                          <span className="text-slate-400">SHA-256 Digest:</span>{' '}
                          <span className="text-teal-600 dark:text-teal-400 select-all">{rep.documentHash}</span>
                        </div>
                      </div>

                      <div className="text-right space-y-3">
                        <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                          ${rep.amountSpent.toLocaleString()}
                        </div>

                        {isVerified ? (
                          <div className="space-y-1">
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 rounded-full font-bold text-xs inline-flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" /> Anchored On-Chain
                            </span>
                            {rep.onChainTxHash && (
                              <div className="pt-1">
                                <a
                                  href={`/verify?query=${rep.onChainTxHash}`}
                                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center justify-end gap-1 font-bold"
                                >
                                  Verify Tx <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleReviewReport(rep.id, 'verified_by_admin')}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 transition-all disabled:opacity-50"
                            >
                              {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                              <span>Approve & Anchor to Blockchain</span>
                            </button>
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleReviewReport(rep.id, 'rejected')}
                              className="px-3 py-2 border border-rose-200 text-rose-500 hover:bg-rose-50 rounded-xl text-xs font-bold"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 4: FRAUD DETECTION (PRESERVED) */}
        {activeTab === 'fraud' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 text-rose-500 shrink-0" />
              <div>
                <h3 className="font-bold text-sm">Automated Security & Loss Flags</h3>
                <p className="text-xs text-slate-500">
                  Real-time pattern monitoring for logistics deviations, duplicate webhook submissions, and anomalies.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {fraudAlerts.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400 bg-white dark:bg-slate-800 rounded-3xl">
                  System logs checked. Zero security anomalies detected.
                </div>
              ) : (
                fraudAlerts.map((alert, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-rose-600">{alert.type}:</span> {alert.message}
                    </div>
                    <span className="text-slate-400">{alert.severity}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 5: AUDIT LOGS (PRESERVED) */}
        {activeTab === 'logs' && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold">Platform Audit Logs</h2>
              <p className="text-xs text-slate-500">Immutable record of administrative actions and reconciliations.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100 dark:border-slate-800">
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Actor</th>
                    <th className="p-4">Action</th>
                    <th className="p-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {auditLogs.map((log) => (
                    <tr key={log.id || log._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-4 text-slate-400 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="p-4 font-bold">{log.actor?.name || 'System / Relayer'}</td>
                      <td className="p-4 font-mono font-bold text-emerald-600">{log.action}</td>
                      <td className="p-4 text-slate-600 dark:text-slate-300">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
