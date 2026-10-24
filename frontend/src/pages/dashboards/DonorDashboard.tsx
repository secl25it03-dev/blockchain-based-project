import React, { useEffect, useState, useRef } from 'react';
import { api } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Plus, Trash2, ShieldCheck, Leaf, DollarSign, Award, Download, MapPin, Eye, ChevronRight } from 'lucide-react';
import confetti from 'canvas-confetti';

import { Link } from 'react-router-dom';
import { useWeb3 } from '../../context/Web3Context';
import { DigitalReceiptModal } from '../../components/DigitalReceiptModal';
import type { IDigitalReceipt } from '../../components/DigitalReceiptModal';

export const DonorDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { account, isConnected, networkName, connectWallet } = useWeb3();

  const [foodHistory, setFoodHistory] = useState<any[]>([]);
  const [moneyHistory, setMoneyHistory] = useState<any[]>([]);
  const [blockchainDonations, setBlockchainDonations] = useState<any[]>([]);
  const [ngosList, setNgosList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Digital Receipt state
  const [selectedReceipt, setSelectedReceipt] = useState<IDigitalReceipt | null>(null);

  // Listing Form state
  const [pickupAddress, setPickupAddress] = useState('');
  const [lat, setLat] = useState('40.7128');
  const [lng, setLng] = useState('-74.0060');
  const [foodItems, setFoodItems] = useState<Array<{ name: string; quantity: number; unit: string; expiryTime: string }>>([
    { name: '', quantity: 1, unit: 'portions', expiryTime: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 16) }
  ]);

  // Monetary contribution state
  const [monetaryAmount, setMonetaryAmount] = useState('25');
  const [selectedNGO, setSelectedNGO] = useState('');
  const [paymentGateway, setPaymentGateway] = useState<'stripe' | 'razorpay'>('stripe');
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Certificate Modal state
  const [selectedCert, setSelectedCert] = useState<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetchHistoryAndNGOs();
  }, []);

  const fetchHistoryAndNGOs = async () => {
    try {
      setLoading(true);
      const [historyRes, usersRes, blockchainRes] = await Promise.all([
        api.get('/donations/history/donor'),
        api.get('/admin/users?role=ngo'),
        api.get('/donations/my-history').catch(() => ({ data: [] })),
      ]);
      setFoodHistory(historyRes.data.food);
      setMoneyHistory(historyRes.data.monetary);
      setNgosList(usersRes.data.filter((u: any) => u.status === 'active'));
      setBlockchainDonations(blockchainRes.data || []);
    } catch (e: any) {
      showToast('Error syncing donor history', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Add Item to Food Listing Form
  const addFormItem = () => {
    setFoodItems([
      ...foodItems,
      { name: '', quantity: 1, unit: 'portions', expiryTime: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 16) }
    ]);
  };

  const removeFormItem = (idx: number) => {
    if (foodItems.length === 1) return;
    setFoodItems(foodItems.filter((_, i) => i !== idx));
  };

  const updateFormItem = (idx: number, field: string, val: any) => {
    setFoodItems(
      foodItems.map((item, i) => (i === idx ? { ...item, [field]: val } : item))
    );
  };

  // Submit Food Donation
  const handleFoodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (foodItems.some(i => !i.name || i.quantity <= 0)) {
      showToast('Please fill out all food item details', 'warning');
      return;
    }
    if (!pickupAddress) {
      showToast('Pickup Address is required', 'warning');
      return;
    }

    try {
      const payload = {
        items: foodItems,
        pickupAddress,
        coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) }
      };

      await api.post('/donations/food', payload);
      showToast('Surplus food listing published to NGOs!', 'success');
      
      // Reset form
      setFoodItems([{ name: '', quantity: 1, unit: 'portions', expiryTime: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 16) }]);
      setPickupAddress('');
      
      // Celebrate
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 } });

      fetchHistoryAndNGOs();
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Failed to list food donation', 'error');
    }
  };

  // Handle Monetary Donation Simulation
  const handleMoneySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(monetaryAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast('Please provide a valid contribution amount', 'warning');
      return;
    }

    try {
      setPaymentProcessing(true);
      const { data } = await api.post('/donations/monetary', {
        amount: amt,
        currency: 'USD',
        ngoRecipientId: selectedNGO || undefined,
        gateway: paymentGateway
      });

      showToast('Redirecting to secure gateway session...', 'info');

      // Simulate Gateway Redirect & Success Loop
      setTimeout(async () => {
        try {
          await api.post('/donations/monetary/verify', {
            paymentId: data.paymentId,
            status: 'completed'
          });
          
          showToast('Payment verified! Thank you for your support.', 'success');
          
          // Celebrate
          confetti({ particleCount: 100, spread: 80, origin: { y: 0.7 } });
          
          // Reset states
          setMonetaryAmount('25');
          setSelectedNGO('');
          
          fetchHistoryAndNGOs();
        } catch (err) {
          showToast('Verification failed', 'error');
        } finally {
          setPaymentProcessing(false);
        }
      }, 2000);

    } catch (e: any) {
      showToast('Failed to prepare checkout order', 'error');
      setPaymentProcessing(false);
    }
  };

  // Render Certificate on Canvas
  const drawCertificate = (donation: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background Gradient
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#f0fdf4');
    grad.addColorStop(1, '#dcfce7');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorative Borders
    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 15;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.strokeRect(35, 35, canvas.width - 70, canvas.height - 70);

    // Text details
    ctx.fillStyle = '#14532d';
    ctx.textAlign = 'center';
    
    ctx.font = 'bold 36px Outfit';
    ctx.fillText('DONATO IMPACT CERTIFICATE', canvas.width / 2, 90);

    ctx.font = '20px Plus Jakarta Sans';
    ctx.fillStyle = '#166534';
    ctx.fillText('This certificate is proudly presented to', canvas.width / 2, 160);

    ctx.font = 'bold 28px Outfit';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(user?.name.toUpperCase() || 'VALUED DONOR', canvas.width / 2, 210);

    ctx.font = '16px Plus Jakarta Sans';
    ctx.fillStyle = '#475569';
    ctx.fillText('for contributing surplus food items to our network partners.', canvas.width / 2, 260);

    // Items and metadata
    ctx.font = 'bold 18px Outfit';
    ctx.fillStyle = '#1e293b';
    const itemsDesc = donation.items.map((i: any) => `${i.quantity} ${i.unit} of ${i.name}`).join(', ');
    ctx.fillText(`Donation: ${itemsDesc}`, canvas.width / 2, 310);

    ctx.font = 'italic 14px Plus Jakarta Sans';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`Transaction ID: #${donation._id} | Date: ${new Date(donation.createdAt).toLocaleDateString()}`, canvas.width / 2, 360);

    // Seal
    ctx.beginPath();
    ctx.arc(canvas.width / 2, 440, 35, 0, 2 * Math.PI);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Outfit';
    ctx.fillText('VERIFIED', canvas.width / 2, 435);
    ctx.fillText('IMPACT', canvas.width / 2, 450);
  };

  const handleOpenCertificate = (donation: any) => {
    setSelectedCert(donation);
    setTimeout(() => drawCertificate(donation), 100);
  };

  const handleDownloadCertificate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `donato-impact-${selectedCert._id}.png`;
    link.href = url;
    link.click();
    showToast('Certificate downloaded successfully!', 'success');
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Calculate stats
  const totalMeals = foodHistory
    .filter(f => f.status === 'delivered')
    .reduce((sum, item) => sum + item.items.reduce((s: number, i: any) => s + (i.unit === 'portions' ? i.quantity : i.quantity * 2), 0), 0);
  const totalCO2 = (totalMeals * 0.5).toFixed(1); // 0.5 kg CO2 offset per meal equivalent
  const cashDonated = moneyHistory.filter(m => m.status === 'completed').reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-gray-800 dark:text-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-slate-800 pb-6">
          <h1 className="text-3xl font-extrabold tracking-tight">Citizen Donor Portal</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track your ecosystem impact, list surplus food batches, or sponsor NGO programs.
          </p>
        </div>

        {/* Impact Widgets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 border-l-4 border-l-emerald-500 border border-white/50 dark:border-white/5 flex items-center gap-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black">{totalMeals} Meals</h3>
              <p className="text-xs font-bold text-gray-800 dark:text-gray-100">Surplus Portions Donated</p>
              <span className="text-[10px] text-gray-500">Delivered directly to local NGOs</span>
            </div>
          </div>

          <div className="glass-card p-6 border-l-4 border-l-primary-500 border border-white/50 dark:border-white/5 flex items-center gap-4">
            <div className="p-3 bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400 rounded-xl">
              <Leaf className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-2xl font-black">{totalCO2} kg</h3>
              <p className="text-xs font-bold text-gray-800 dark:text-gray-100">CO2 Emissions Prevented</p>
              <span className="text-[10px] text-gray-500">Diverted from toxic landfills</span>
            </div>
          </div>

          <div className="glass-card p-6 border-l-4 border-l-amber-500 border border-white/50 dark:border-white/5 flex items-center gap-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black">${cashDonated.toLocaleString()}</h3>
              <p className="text-xs font-bold text-gray-800 dark:text-gray-100">Monetary Sponsorships</p>
              <span className="text-[10px] text-gray-500">Funding meal delivery logistics</span>
            </div>
          </div>
        </div>

        {/* Input Workspaces */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Form 1: Food Donation Listing */}
          <div className="glass-card p-6 border border-white/50 dark:border-white/5">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Plus className="text-primary-500" /> List Surplus Food
            </h2>
            <form onSubmit={handleFoodSubmit} className="space-y-4">
              {foodItems.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-end">
                  <div className="flex-grow">
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Item Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sandwiches"
                      value={item.name}
                      onChange={(e) => updateFormItem(idx, 'name', e.target.value)}
                      className="w-full px-3 py-2 bg-white/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-lg outline-none text-xs dark:text-white"
                    />
                  </div>

                  <div className="w-16">
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Qty</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateFormItem(idx, 'quantity', parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-white/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-lg outline-none text-xs dark:text-white"
                    />
                  </div>

                  <div className="w-24">
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Unit</label>
                    <select
                      value={item.unit}
                      onChange={(e) => updateFormItem(idx, 'unit', e.target.value)}
                      className="w-full px-3 py-2 bg-white/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-lg outline-none text-xs dark:text-white h-[34px]"
                    >
                      <option value="portions">portions</option>
                      <option value="kg">kg</option>
                      <option value="servings">servings</option>
                    </select>
                  </div>

                  <div className="w-40">
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Expiry time</label>
                    <input
                      type="datetime-local"
                      required
                      value={item.expiryTime}
                      onChange={(e) => updateFormItem(idx, 'expiryTime', e.target.value)}
                      className="w-full px-3 py-2 bg-white/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-lg outline-none text-xs dark:text-white h-[34px]"
                    />
                  </div>

                  {foodItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFormItem(idx)}
                      className="p-2 border border-rose-100 dark:border-rose-950/40 text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={addFormItem}
                className="text-xs font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center gap-1 mt-2 cursor-pointer"
              >
                + Add Another Item
              </button>

              <div className="pt-2">
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Pickup Location Details</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    placeholder="Enter pickup address details"
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-white/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-lg outline-none text-xs dark:text-white"
                  />
                </div>
              </div>

              {/* Coordinates simulation */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Latitude (GPS Sim)</label>
                  <input
                    type="text"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    className="w-full px-3 py-2 bg-white/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-lg outline-none text-xs dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Longitude (GPS Sim)</label>
                  <input
                    type="text"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    className="w-full px-3 py-2 bg-white/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-lg outline-none text-xs dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs shadow-md shadow-primary-600/10 cursor-pointer"
              >
                Publish Surplus Food Listing
              </button>
            </form>
          </div>

          {/* Form 2: Sponsor / Monetary Donation */}
          <div className="glass-card p-6 border border-white/50 dark:border-white/5 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <DollarSign className="text-amber-500" /> Sponsoring Programs
              </h2>
              <form onSubmit={handleMoneySubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-2">Select Contribution Amount ($)</label>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {['10', '25', '50', '100'].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setMonetaryAmount(amt)}
                        className={`py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          monetaryAmount === amt
                            ? 'bg-amber-500 text-white border-transparent shadow shadow-amber-500/10'
                            : 'bg-white/40 dark:bg-slate-900/40 border-gray-200 dark:border-slate-800'
                        }`}
                      >
                        ${amt}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min={1}
                    required
                    placeholder="Enter custom amount"
                    value={monetaryAmount}
                    onChange={(e) => setMonetaryAmount(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-lg outline-none text-xs dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Direct to Specific NGO (Optional)</label>
                  <select
                    value={selectedNGO}
                    onChange={(e) => setSelectedNGO(e.target.value)}
                    className="w-full px-3 py-2 bg-white/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-lg outline-none text-xs dark:text-white h-[36px]"
                  >
                    <option value="">General Platform Logistics Pool (Recommended)</option>
                    {ngosList.map((ngo) => (
                      <option key={ngo._id} value={ngo._id}>{ngo.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-2">Payment Gateway Integration</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'stripe', name: 'Stripe Global' },
                      { id: 'razorpay', name: 'Razorpay India' }
                    ].map((gate) => (
                      <button
                        key={gate.id}
                        type="button"
                        onClick={() => setPaymentGateway(gate.id as any)}
                        className={`py-3.5 rounded-xl border flex items-center justify-center font-bold text-xs transition-all cursor-pointer ${
                          paymentGateway === gate.id
                            ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 border-transparent shadow'
                            : 'bg-white/40 dark:bg-slate-900/40 border-gray-200 dark:border-slate-800'
                        }`}
                      >
                        {gate.name}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={paymentProcessing}
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs shadow-md shadow-amber-500/10 cursor-pointer disabled:opacity-50"
                >
                  {paymentProcessing ? 'Synchronizing Secure Sandbox...' : `Contribute $${monetaryAmount || 0} Now`}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* History Catalog */}
        <div className="glass-card border border-white/50 dark:border-white/5 overflow-hidden">
          <div className="p-6 border-b border-gray-150 dark:border-slate-850">
            <h2 className="text-lg font-bold">Your Donation Ledger & Certificates</h2>
            <p className="text-xs text-gray-550 dark:text-gray-400 mt-1">Download verified impact certificates for tax deduction or CSR compliance records.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-105/50 dark:bg-slate-950/20 text-gray-500 uppercase tracking-wider font-extrabold border-b border-gray-150 dark:border-slate-850">
                  <th className="p-4">Listing Date</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Details</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 dark:divide-slate-850">
                {/* Food History Rows */}
                {foodHistory.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                    <td className="p-4 whitespace-nowrap text-gray-450">{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 font-bold text-emerald-600 dark:text-emerald-450">Surplus Food</td>
                    <td className="p-4 font-medium text-gray-700 dark:text-gray-300">
                      {item.items.map((i: any) => `${i.quantity} ${i.unit} of ${i.name}`).join(', ')}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        item.status === 'delivered'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-450'
                          : item.status === 'pending'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-450'
                          : 'bg-indigo-100 text-indigo-850 dark:bg-indigo-950 dark:text-indigo-400'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {item.status === 'delivered' ? (
                        <button
                          onClick={() => handleOpenCertificate(item)}
                          className="px-3 py-1 bg-primary-100 hover:bg-primary-200 text-primary-850 dark:bg-primary-950/40 dark:text-primary-400 border border-primary-200 dark:border-primary-900 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Award className="w-3.5 h-3.5" /> Certificate
                        </button>
                      ) : (
                        <span className="text-[10px] text-gray-400">Locked (Delivery Pending)</span>
                      )}
                    </td>
                  </tr>
                ))}

                {/* Monetary History Rows */}
                {moneyHistory.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                    <td className="p-4 whitespace-nowrap text-gray-450">{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 font-bold text-amber-600 dark:text-amber-450">Funds Sponsoring</td>
                    <td className="p-4 font-medium text-gray-700 dark:text-gray-300">
                      Amount: ${item.amount} {item.currency} (via {item.paymentGateway})
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        item.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-450'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-450'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-[10px] text-gray-450 font-semibold font-mono uppercase">
                        Ref: {item.paymentId.substring(0, 12)}...
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dedicated Verified Blockchain Donations Ledger */}
        <div className="glass-card border border-emerald-500/20 overflow-hidden bg-white/70 dark:bg-slate-900/70 shadow-lg">
          <div className="p-6 border-b border-gray-150 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  Verified Blockchain Donations & Digital Receipts
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Every record below is anchored to the Ethereum registry contract. Click "Digital Receipt" to view cryptographic proofs.
              </p>
            </div>
            <Link
              to="/campaigns"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <Heart className="w-3.5 h-3.5" /> Support New Cause
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 uppercase tracking-wider font-extrabold border-b border-emerald-200/50 dark:border-emerald-800/40">
                  <th className="p-4">Date</th>
                  <th className="p-4">Campaign</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Channel</th>
                  <th className="p-4">Transaction Hash</th>
                  <th className="p-4">Proof Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {blockchainDonations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                      No blockchain donation records yet. Contributed funds will automatically appear here with cryptographic receipts.
                    </td>
                  </tr>
                ) : (
                  blockchainDonations.map((don) => (
                    <tr key={don.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 whitespace-nowrap text-slate-500">
                        {new Date(don.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900 dark:text-white line-clamp-1 max-w-xs">
                          {don.campaign?.title || 'Relief Campaign'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {don.donationRef}
                        </div>
                      </td>
                      <td className="p-4 font-black text-emerald-600 dark:text-emerald-400">
                        {don.currency === 'USD' ? '$' : ''}{don.amount.toLocaleString()} {don.currency}
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                          {don.channel === 'crypto_web3' ? 'MetaMask' : 'Sandbox Gateway'}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-[11px]">
                        {don.txHash ? (
                          <Link
                            to={`/verify?query=${don.txHash}`}
                            className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                          >
                            <span>{don.txHash.slice(0, 10)}...{don.txHash.slice(-6)}</span>
                          </Link>
                        ) : (
                          <span className="text-slate-400">Anchored off-chain</span>
                        )}
                      </td>
                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedReceipt({
                              receiptNumber: `REC-${don.donationRef}`,
                              donationRef: don.donationRef,
                              campaignName: don.campaign?.title || 'Relief Fund',
                              ngoName: don.campaign?.ngo?.name || 'Verified Partner',
                              amount: don.amount,
                              currency: don.currency,
                              channel: don.channel,
                              paymentStatus: don.status,
                              timestamp: don.createdAt,
                              donorAttribution: don.isAnonymous ? 'Anonymous Donor' : don.donorName,
                              txHash: don.txHash,
                              verifiedOnChain: don.verifiedOnChain,
                            });
                          }}
                          className="px-3 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-lg font-bold flex items-center gap-1 transition-colors"
                        >
                          <Award className="w-3.5 h-3.5" /> Digital Receipt
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Certificate Modal */}
        <AnimatePresence>
          {selectedCert && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="glass-card max-w-xl w-full p-6 bg-white dark:bg-slate-900 relative shadow-2xl"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-base">Impact Certificate Preview</h3>
                  <button
                    onClick={() => setSelectedCert(null)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white"
                  >
                    Close
                  </button>
                </div>
                
                {/* Canvas representation */}
                <div className="flex justify-center border border-gray-100 dark:border-slate-800 rounded-xl overflow-hidden shadow-inner">
                  <canvas
                    ref={canvasRef}
                    width={560}
                    height={500}
                    className="max-w-full h-auto aspect-[56/50]"
                  />
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={handleDownloadCertificate}
                    className="flex-grow py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-primary-600/10"
                  >
                    <Download className="w-4 h-4" /> Download Certificate (PNG)
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Digital Receipt Modal */}
        <DigitalReceiptModal
          receipt={selectedReceipt}
          isOpen={!!selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      </div>
    </div>
  );
};
