import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Wallet, CreditCard, ShieldCheck, Check, Loader2, X, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useWeb3 } from '../context/Web3Context';
import { api } from '../utils/api';
import { DigitalReceiptModal } from './DigitalReceiptModal';
import type { IDigitalReceipt } from './DigitalReceiptModal';

interface DonationModalProps {
  campaign: {
    id: string;
    title: string;
    ngo?: { name: string };
    currency: string;
    targetAmount: number;
    raisedAmount: number;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const DonationModal: React.FC<DonationModalProps> = ({ campaign, isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const { isConnected, account, connectWallet, donateNativeEth } = useWeb3();

  const [paymentMode, setPaymentMode] = useState<'sandbox' | 'web3'>('sandbox');
  const [amount, setAmount] = useState<string>('50');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [donorName, setDonorName] = useState<string>(user?.name || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [receiptData, setReceiptData] = useState<IDigitalReceipt | null>(null);
  const [showReceipt, setShowReceipt] = useState<boolean>(false);

  if (!isOpen) return null;

  const presets = paymentMode === 'web3' ? ['0.01', '0.05', '0.1', '0.5'] : ['25', '50', '100', '250'];

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {}
  };

  const handleDonate = async () => {
    setErrorMsg('');
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMsg('Please enter a valid donation amount.');
      return;
    }

    setLoading(true);

    try {
      if (paymentMode === 'web3') {
        // --- WEB3 METAMASK FLOW ---
        if (!isConnected || !account) {
          const connected = await connectWallet();
          if (!connected) {
            setLoading(false);
            return;
          }
        }

        const donationRef = `DON-WEB3-${Date.now().toString().slice(-6)}`;
        
        // 1. Send native ETH through smart contract
        const onChainReceipt = await donateNativeEth(campaign.id, donationRef, amount);

        // 2. Persist record in backend
        const { data } = await api.post('/donations/web3', {
          campaignId: campaign.id,
          txHash: onChainReceipt.txHash,
          donorWallet: account,
          amount: numericAmount,
          currency: 'ETH',
          isAnonymous,
          donorName: isAnonymous ? 'Anonymous Web3 Donor' : (donorName || 'Web3 Supporter'),
        });

        triggerConfetti();

        // 3. Prepare digital receipt
        setReceiptData({
          receiptNumber: `REC-${donationRef}`,
          donationRef,
          campaignName: campaign.title,
          ngoName: campaign.ngo?.name || 'Verified NGO',
          amount: numericAmount,
          currency: 'ETH',
          channel: 'crypto_web3',
          paymentStatus: 'completed',
          timestamp: new Date().toISOString(),
          donorAttribution: isAnonymous ? 'Anonymous Web3 Donor' : (donorName || 'Web3 Supporter'),
          txHash: onChainReceipt.txHash,
          network: 'Hardhat Local / Ethereum Testnet',
          verifiedOnChain: true,
          digitalFingerprint: onChainReceipt.txHash,
        });

        setShowReceipt(true);
        if (onSuccess) onSuccess();
      } else {
        // --- SANDBOX FIAT / RECONCILED FLOW ---
        // 1. Initiate session
        const initRes = await api.post('/donations/initiate', {
          campaignId: campaign.id,
          amount: numericAmount,
          currency: 'USD',
          isAnonymous,
          donorName: isAnonymous ? 'Anonymous Donor' : (donorName || 'Generous Donor'),
          paymentGateway: 'mock_sandbox',
        });

        const { donationRef, paymentId } = initRes.data;

        // 2. Simulate payment confirmation and backend blockchain reconciliation
        const reconcileRes = await api.post('/donations/reconcile', {
          donationRef,
          paymentId,
          status: 'completed',
        });

        triggerConfetti();

        // 3. Fetch digital receipt
        const receiptRes = await api.get(`/donations/receipt/${donationRef}`);
        setReceiptData(receiptRes.data);
        setShowReceipt(true);
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      console.error('Donation error:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Transaction could not be completed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 relative bg-slate-50 dark:bg-slate-800/40">
              <button
                onClick={onClose}
                className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl">
                  <Heart className="w-6 h-6 fill-rose-500" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Make a Donation</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{campaign.title}</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-slate-800 dark:text-slate-100">
              {/* Payment Mode Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMode('sandbox');
                      setAmount('50');
                    }}
                    className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                      paymentMode === 'sandbox'
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-emerald-500" />
                    <div>
                      <div className="text-xs font-bold">Mock Sandbox</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Card / UPI Simulation</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMode('web3');
                      setAmount('0.05');
                    }}
                    className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                      paymentMode === 'web3'
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-900 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <Wallet className="w-5 h-5 text-indigo-500" />
                    <div>
                      <div className="text-xs font-bold">MetaMask Web3</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Native On-Chain ETH</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Mode Notice */}
              {paymentMode === 'sandbox' ? (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>
                    <strong>Sandbox Mode:</strong> Fully simulated payment reconciliation. It records verified transaction proofs without charging real currency.
                  </span>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-xs flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>
                      {isConnected ? (
                        <>Connected: <code className="font-mono text-[11px]">{account?.slice(0, 6)}...{account?.slice(-4)}</code></>
                      ) : (
                        'Wallet not connected yet'
                      )}
                    </span>
                  </div>
                  {!isConnected && (
                    <button
                      type="button"
                      onClick={connectWallet}
                      className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] transition-colors"
                    >
                      Connect
                    </button>
                  )}
                </div>
              )}

              {/* Amount Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">
                  Donation Amount ({paymentMode === 'web3' ? 'ETH' : 'USD'})
                </label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {presets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(preset)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        amount === preset
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {paymentMode === 'web3' ? `${preset} ETH` : `$${preset}`}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                    {paymentMode === 'web3' ? 'Ξ' : '$'}
                  </span>
                  <input
                    type="number"
                    step={paymentMode === 'web3' ? '0.001' : '1'}
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Custom amount"
                    className="w-full pl-9 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Attribution / Anonymous */}
              <div className="space-y-3 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    Donate anonymously (Attribution displayed as "Anonymous Donor")
                  </span>
                </label>

                {!isAnonymous && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      Display Name for Receipt
                    </label>
                    <input
                      type="text"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      placeholder="e.g. Sarah Jenkins"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>

            {/* Footer Action */}
            <div className="p-6 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={loading}
                onClick={handleDonate}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Anchoring to Blockchain Registry...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>
                      Confirm & Anchor Donation ({paymentMode === 'web3' ? `${amount} ETH` : `$${amount}`})
                    </span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Digital Receipt Modal */}
      <DigitalReceiptModal
        receipt={receiptData}
        isOpen={showReceipt}
        onClose={() => {
          setShowReceipt(false);
          onClose();
        }}
      />
    </>
  );
};
