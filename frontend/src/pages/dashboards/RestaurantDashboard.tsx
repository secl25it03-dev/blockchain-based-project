import React, { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store,
  Plus,
  Trash2,
  Calendar,
  AlertTriangle,
  Heart,
  TrendingDown,
  ChevronRight,
  ClipboardList,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const RestaurantDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [inventory, setInventory] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Forms state
  const [showAddForm, setShowAddForm] = useState(false);
  const [addName, setAddName] = useState('');
  const [addQty, setAddQty] = useState('');
  const [addUnit, setAddUnit] = useState('kg');
  const [addExpiry, setAddExpiry] = useState('');
  const [addThreshold, setAddThreshold] = useState('5');

  // Waste logging modal state
  const [selectedWasteItem, setSelectedWasteItem] = useState<any>(null);
  const [wasteQty, setWasteQty] = useState('');
  const [wasteReason, setWasteReason] = useState<'expired' | 'damaged' | 'spoiled' | 'other'>('expired');
  const [wasteLoading, setWasteLoading] = useState(false);

  useEffect(() => {
    fetchStockAndAnalytics();
  }, []);

  const fetchStockAndAnalytics = async () => {
    try {
      setLoading(true);
      const [inventoryRes, analyticsRes] = await Promise.all([
        api.get('/inventory'),
        api.get('/inventory/analytics'),
      ]);
      setInventory(inventoryRes.data);
      setAlerts(analyticsRes.data);
    } catch (e: any) {
      showToast('Error syncing restaurant inventory', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Add Item
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName || !addQty || !addExpiry) {
      showToast('Please fill in all stock details', 'warning');
      return;
    }

    try {
      await api.post('/inventory', {
        name: addName,
        quantity: parseFloat(addQty),
        unit: addUnit,
        expiryDate: addExpiry,
        thresholdAlert: parseInt(addThreshold),
      });

      showToast('Item logged to stock ledger', 'success');
      
      // Reset
      setAddName('');
      setAddQty('');
      setAddExpiry('');
      setAddThreshold('5');
      setShowAddForm(false);

      fetchStockAndAnalytics();
    } catch (e: any) {
      showToast('Failed to add inventory item', 'error');
    }
  };

  // Log Waste Loss
  const handleLogWaste = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(wasteQty);
    if (!selectedWasteItem || isNaN(qty) || qty <= 0) {
      showToast('Provide a valid waste quantity', 'warning');
      return;
    }

    if (qty > selectedWasteItem.quantity) {
      showToast('Waste quantity cannot exceed current stock level', 'warning');
      return;
    }

    try {
      setWasteLoading(true);
      await api.post('/inventory/waste', {
        name: selectedWasteItem.name,
        quantity: qty,
        unit: selectedWasteItem.unit,
        reason: wasteReason,
        inventoryItemId: selectedWasteItem._id,
      });

      showToast(`Logged ${qty} ${selectedWasteItem.unit} of "${selectedWasteItem.name}" as waste`, 'info');
      setSelectedWasteItem(null);
      setWasteQty('');
      fetchStockAndAnalytics();
    } catch (e: any) {
      showToast('Failed to write waste log', 'error');
    } finally {
      setWasteLoading(false);
    }
  };

  // Quick Convert to Donation listing
  const handleQuickDonate = async (item: any) => {
    try {
      const expiryDateStr = new Date(item.expiryDate).toISOString().slice(0, 16);
      const payload = {
        items: [{
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          expiryTime: expiryDateStr,
        }],
        pickupAddress: user?.name + ' Storefront Address', // Default placeholder
        coordinates: { lat: 40.7128, lng: -74.0060 } // Default
      };

      await api.post('/donations/food', payload);
      showToast(`Surplus "${item.name}" listed as food donation!`, 'success');
      
      // Remove from inventory since we donated it
      await api.post('/inventory/waste', {
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        reason: 'other',
        inventoryItemId: item._id,
      });

      fetchStockAndAnalytics();
    } catch (e: any) {
      showToast('Failed to list item for donation', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Prepping Chart Data
  const wasteSummary = alerts?.waste || {};
  const wasteChartData = [
    { name: 'Expired', value: wasteSummary.expired || 0 },
    { name: 'Spoiled', value: wasteSummary.spoiled || 0 },
    { name: 'Damaged', value: wasteSummary.damaged || 0 },
    { name: 'Other', value: wasteSummary.other || 0 },
  ];

  const totalWasted = Object.values(wasteSummary).reduce((a: any, b: any) => a + b, 0) as any;

  const statsChartData = [
    { name: 'Listed Donations', count: alerts?.donationsCount || 0 },
    { name: 'Wasted Discards', count: totalWasted || 0 },
  ];

  const COLORS = ['#F59E0B', '#EF4444', '#10B981', '#3B82F6'];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-gray-800 dark:text-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Supermarket & Kitchen Portal</h1>
            <p className="text-sm text-gray-550 dark:text-gray-400 mt-1">
              Maintain fresh shelf inventory, track organic waste reduction, and share surplus.
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-5 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-primary-600/10 cursor-pointer"
          >
            + Log New Stock Item
          </button>
        </div>

        {/* Expiring Alerts Banner */}
        {alerts?.expiringCount > 0 && (
          <div className="p-4 rounded-xl border border-amber-200/50 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-950/10 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5 animate-bounce" />
            <div>
              <p className="text-sm font-bold text-amber-800 dark:text-amber-400">
                Critical Alert: {alerts.expiringCount} Item(s) Expiring within 48 Hours
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-500 mt-0.5">
                Convert them to listings to share with local food centers before they perish.
              </p>
            </div>
          </div>
        )}

        {/* Top Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 border-l-4 border-l-primary-500 border border-white/50 dark:border-white/5">
            <h3 className="text-2xl font-black">{inventory.length} Items</h3>
            <p className="text-xs font-bold text-gray-800 dark:text-gray-100 mt-0.5">Active Shelf Inventory</p>
            <span className="text-[10px] text-gray-550">Tracked items in stock ledger</span>
          </div>

          <div className="glass-card p-6 border-l-4 border-l-rose-500 border border-white/50 dark:border-white/5">
            <h3 className="text-2xl font-black">{totalWasted} Units</h3>
            <p className="text-xs font-bold text-gray-800 dark:text-gray-100 mt-0.5">Discarded Waste</p>
            <span className="text-[10px] text-gray-550">Total items recorded as loss</span>
          </div>

          <div className="glass-card p-6 border-l-4 border-l-indigo-500 border border-white/50 dark:border-white/5">
            <h3 className="text-2xl font-black">{alerts?.donationsCount || 0} Batches</h3>
            <p className="text-xs font-bold text-gray-800 dark:text-gray-100 mt-0.5">Shared Surplus Listings</p>
            <span className="text-[10px] text-gray-550">Re-routed from waste bin</span>
          </div>
        </div>

        {/* Charts & Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Chart 1: Donated vs Wasted */}
          <div className="glass-card p-6 border border-white/50 dark:border-white/5 flex flex-col h-[300px]">
            <h3 className="text-sm font-bold mb-4">Sustainability Performance (Donations vs Loss)</h3>
            <div className="flex-grow">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statsChartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="name" stroke="#888888" fontSize={11} />
                  <YAxis stroke="#888888" fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} barSize={45}>
                    <Cell fill="#10B981" />
                    <Cell fill="#EF4444" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Loss Pie */}
          <div className="glass-card p-6 border border-white/50 dark:border-white/5 flex flex-col h-[300px]">
            <h3 className="text-sm font-bold mb-4">Loss Factor Categorization</h3>
            <div className="flex-grow flex items-center justify-center">
              {totalWasted === 0 ? (
                <div className="text-xs text-gray-400">No waste logged yet! Keep it up.</div>
              ) : (
                <>
                  <div className="w-[60%] h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={wasteChartData.filter(d => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {wasteChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col gap-2 text-xs">
                    {wasteChartData.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                        <span className="font-medium">{item.name}: {item.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stock Ledger */}
        <div className="glass-card border border-white/50 dark:border-white/5 overflow-hidden">
          <div className="p-6 border-b border-gray-150 dark:border-slate-850">
            <h2 className="text-lg font-bold">Active Shelf Stock Ledger</h2>
            <p className="text-xs text-gray-550 dark:text-gray-400 mt-1">Audit active shelf levels, check warning indicators, and list surplus.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-105/50 dark:bg-slate-950/20 text-gray-500 uppercase tracking-wider font-extrabold border-b border-gray-150 dark:border-slate-850">
                  <th className="p-4">Item Name</th>
                  <th className="p-4">Quantity In Stock</th>
                  <th className="p-4">Expiry Date</th>
                  <th className="p-4">Status Alert</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 dark:divide-slate-850">
                {inventory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-gray-500 dark:text-gray-400 text-sm">
                      Your shelf stock ledger is empty. Click "+ Log New Stock Item" to add resources.
                    </td>
                  </tr>
                ) : (
                  inventory.map((item) => {
                    const daysLeft = Math.ceil((new Date(item.expiryDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
                    const isExpiring = daysLeft <= 2;
                    const isLow = item.quantity < item.thresholdAlert;

                    return (
                      <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                        <td className="p-4 font-bold text-gray-900 dark:text-white">{item.name}</td>
                        <td className="p-4 font-semibold text-gray-700 dark:text-gray-300">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="p-4 whitespace-nowrap text-gray-500 dark:text-gray-450 flex items-center gap-1.5 mt-2.5">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(item.expiryDate).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          {isExpiring ? (
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-450 rounded text-[9px] font-bold uppercase flex items-center gap-0.5 w-fit">
                              <AlertTriangle className="w-3 h-3" /> Expiring ({daysLeft} days)
                            </span>
                          ) : isLow ? (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-450 rounded text-[9px] font-bold uppercase w-fit">
                              Low Stock Level
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-450 rounded text-[9px] font-bold uppercase w-fit">
                              Fresh / Safe
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right flex items-center justify-end gap-2.5">
                          <button
                            onClick={() => handleQuickDonate(item)}
                            className="px-3 py-1 bg-primary-100 hover:bg-primary-200 text-primary-850 dark:bg-primary-950/40 dark:text-primary-400 border border-primary-200 dark:border-primary-900 rounded-lg font-bold flex items-center gap-0.5 transition-all cursor-pointer"
                          >
                            <Heart className="w-3.5 h-3.5 fill-current" /> Donate
                          </button>
                          <button
                            onClick={() => setSelectedWasteItem(item)}
                            className="px-3 py-1 border border-rose-105 hover:bg-rose-50 dark:border-rose-950/40 dark:hover:bg-rose-950/20 text-rose-500 rounded-lg font-bold transition-all cursor-pointer"
                          >
                            Log Waste
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Log New Stock Item */}
        <AnimatePresence>
          {showAddForm && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="glass-card max-w-md w-full p-6 bg-white dark:bg-slate-900 relative shadow-2xl"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-lg">Log New Stock Item</h3>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white"
                  >
                    Close
                  </button>
                </div>
                <form onSubmit={handleAddItem} className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Item Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Milk Liters"
                      value={addName}
                      onChange={(e) => setAddName(e.target.value)}
                      className="w-full px-3 py-2 bg-white/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-lg outline-none text-xs dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Quantity</label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={addQty}
                        onChange={(e) => setAddQty(e.target.value)}
                        className="w-full px-3 py-2 bg-white/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-lg outline-none text-xs dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Unit</label>
                      <select
                        value={addUnit}
                        onChange={(e) => setAddUnit(e.target.value)}
                        className="w-full px-3 py-2 bg-white/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-lg outline-none text-xs dark:text-white h-[34px]"
                      >
                        <option value="kg">kg</option>
                        <option value="portions">portions</option>
                        <option value="servings">servings</option>
                        <option value="liters">liters</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Expiry Date</label>
                    <input
                      type="date"
                      required
                      value={addExpiry}
                      onChange={(e) => setAddExpiry(e.target.value)}
                      className="w-full px-3 py-2 bg-white/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-lg outline-none text-xs dark:text-white h-[34px]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Low Stock Warning Threshold</label>
                    <input
                      type="number"
                      required
                      value={addThreshold}
                      onChange={(e) => setAddThreshold(e.target.value)}
                      className="w-full px-3 py-2 bg-white/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-lg outline-none text-xs dark:text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs shadow-md shadow-primary-600/10 cursor-pointer"
                  >
                    Log Stock Item
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal: Log Waste */}
        <AnimatePresence>
          {selectedWasteItem && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="glass-card max-w-md w-full p-6 bg-white dark:bg-slate-900 relative shadow-2xl"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-lg">Log Food Waste / Loss</h3>
                  <button
                    onClick={() => setSelectedWasteItem(null)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white"
                  >
                    Close
                  </button>
                </div>
                <form onSubmit={handleLogWaste} className="space-y-4">
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-450 border border-rose-100 dark:border-rose-900/20 rounded-xl text-xs">
                    Logging loss for: <strong>{selectedWasteItem.name}</strong> ({selectedWasteItem.quantity} {selectedWasteItem.unit} currently available)
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Discard Quantity</label>
                    <input
                      type="number"
                      required
                      min={0.1}
                      max={selectedWasteItem.quantity}
                      step={0.1}
                      placeholder={`Max: ${selectedWasteItem.quantity}`}
                      value={wasteQty}
                      onChange={(e) => setWasteQty(e.target.value)}
                      className="w-full px-3 py-2 bg-white/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-lg outline-none text-xs dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Reason for Discard</label>
                    <select
                      value={wasteReason}
                      onChange={(e) => setWasteReason(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-lg outline-none text-xs dark:text-white h-[34px]"
                    >
                      <option value="expired">Expired Date Exceeded</option>
                      <option value="spoiled">Spoiled / Rotten</option>
                      <option value="damaged">Damaged Packaging</option>
                      <option value="other">Other Residual Kitchen Waste</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={wasteLoading}
                    className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/10 cursor-pointer disabled:opacity-50"
                  >
                    {wasteLoading ? 'Logging Discard...' : 'Submit Waste Entry'}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};
