import React, { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, CheckCircle2, MapPin, Store, Navigation, ShieldCheck, Heart, User, Check, Play } from 'lucide-react';
import confetti from 'canvas-confetti';

export const VendorDashboard: React.FC = () => {
  const { user, profile, updateProfile } = useAuth();
  const { showToast } = useToast();

  const [activeTasks, setActiveTasks] = useState<any[]>([]);
  const [onlineStatus, setOnlineStatus] = useState<boolean>(profile?.status === 'idle');
  const [loading, setLoading] = useState(true);

  // Proof Modal state
  const [selectedTaskForProof, setSelectedTaskForProof] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [signatureName, setSignatureName] = useState('');
  const [proofLoading, setProofLoading] = useState(false);

  useEffect(() => {
    fetchVendorTasks();
  }, []);

  const fetchVendorTasks = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/donations/history/vendor');
      setActiveTasks(data);
    } catch (e: any) {
      showToast('Error syncing delivery tasks', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleOnline = async () => {
    try {
      const nextStatus = !onlineStatus ? 'idle' : 'offline';
      
      // Call mock or status update endpoint
      const { data } = await api.post(`/admin/approve/${user?.id}`, { status: 'active' }); // Admin reuse path for simplicity or standard update
      
      // Update local profile state
      const updatedProfile = { ...profile, status: nextStatus };
      updateProfile(updatedProfile);
      setOnlineStatus(!onlineStatus);
      showToast(`Your status set to ${nextStatus.toUpperCase()}`, 'info');
    } catch (e) {
      showToast('Failed to switch operational state', 'error');
    }
  };

  const handleStatusChange = async (donationId: string, nextStatus: 'picked_up') => {
    try {
      await api.post(`/donations/food/${donationId}/status`, { status: nextStatus });
      showToast('Status updated to PICKED UP! Safe driving.', 'success');
      fetchVendorTasks();
    } catch (e: any) {
      showToast('Failed to update shipment status', 'error');
    }
  };

  const handleCompleteDeliverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signatureName) {
      showToast('Recipient signature name is required', 'warning');
      return;
    }

    try {
      setProofLoading(true);
      await api.post(`/donations/food/${selectedTaskForProof._id}/status`, {
        status: 'delivered',
        proofImage: 'https://via.placeholder.com/200?text=Recipient+Signature+Proof', // simulated Cloudinary link
        notes: `Signed by ${signatureName}. Notes: ${notes}`
      });

      showToast('Delivery completed successfully! Great job.', 'success');
      confetti({ particleCount: 70, spread: 50 });

      // Reset Modal
      setSelectedTaskForProof(null);
      setSignatureName('');
      setNotes('');
      
      fetchVendorTasks();
    } catch (e: any) {
      showToast('Failed to finalize delivery', 'error');
    } finally {
      setProofLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const pendingPickups = activeTasks.filter((t) => t.status === 'claimed');
  const activeTransits = activeTasks.filter((t) => t.status === 'picked_up');
  const completedCount = activeTasks.filter((t) => t.status === 'delivered').length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-gray-800 dark:text-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Logistics Rider Portal</h1>
            <p className="text-sm text-gray-550 dark:text-gray-400 mt-1">
              Toggle your availability, review delivery tasks, and complete pickup logs.
            </p>
          </div>

          {/* Toggle Switch */}
          <div className="flex items-center gap-3 bg-white/40 dark:bg-slate-900/40 px-4 py-2 rounded-2xl border border-white/50 dark:border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-650 dark:text-gray-300">
              Rider Status: {onlineStatus ? 'Online / Idle' : 'Offline'}
            </span>
            <button
              onClick={handleToggleOnline}
              className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${
                onlineStatus ? 'bg-primary-500 flex justify-end' : 'bg-gray-350 flex justify-start'
              }`}
            >
              <div className="w-4 h-4 bg-white rounded-full shadow"></div>
            </button>
          </div>
        </div>

        {/* Dashboard Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 border-l-4 border-l-amber-500 border border-white/50 dark:border-white/5">
            <h3 className="text-2xl font-black">{pendingPickups.length} Items</h3>
            <p className="text-xs font-bold text-gray-800 dark:text-gray-100 mt-0.5">Pending Pickup Requests</p>
            <span className="text-[10px] text-gray-550">Awaiting cargo loading from donors</span>
          </div>

          <div className="glass-card p-6 border-l-4 border-l-blue-500 border border-white/50 dark:border-white/5">
            <h3 className="text-2xl font-black">{activeTransits.length} Shipments</h3>
            <p className="text-xs font-bold text-gray-800 dark:text-gray-100 mt-0.5">Active Cargo In-Transit</p>
            <span className="text-[10px] text-gray-550">Heading to NGO drop-off addresses</span>
          </div>

          <div className="glass-card p-6 border-l-4 border-l-emerald-500 border border-white/50 dark:border-white/5">
            <h3 className="text-2xl font-black">{completedCount} Deliveries</h3>
            <p className="text-xs font-bold text-gray-800 dark:text-gray-100 mt-0.5">Completed Shipments</p>
            <span className="text-[10px] text-gray-550">Cargo proof uploaded successfully</span>
          </div>
        </div>

        {/* Main tasks list and Map sandbox */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Deliveries Queue */}
          <div className="space-y-6">
            <h2 className="text-lg font-bold flex items-center gap-2"><Truck className="text-primary-500" /> Active Deliveries Queue</h2>
            
            {activeTasks.filter(t => t.status !== 'delivered').length === 0 ? (
              <div className="glass-card p-12 text-center text-gray-500 dark:text-gray-400 text-sm">
                No active delivery tasks assigned to you right now. Turn on status to get matching.
              </div>
            ) : (
              activeTasks.filter(t => t.status !== 'delivered').map((task) => (
                <div key={task._id} className="glass-card p-6 border border-white/50 dark:border-white/5 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold text-gray-450 uppercase">Task ID: #{task._id.substring(12)}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                      task.status === 'claimed' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {task.status === 'claimed' ? 'Assigned' : 'In Transit'}
                    </span>
                  </div>

                  <div className="p-3 bg-white/40 dark:bg-slate-900/40 rounded-xl space-y-1 text-xs">
                    <p className="text-[9px] uppercase font-bold text-gray-400 mb-1.5">Cargo Listing Details</p>
                    {task.items.map((food: any, idx: number) => (
                      <div key={idx} className="flex justify-between font-semibold">
                        <span>{food.name}</span>
                        <span>{food.quantity} {food.unit}</span>
                      </div>
                    ))}
                  </div>

                  {/* Address steps */}
                  <div className="space-y-3 pt-2 text-xs">
                    <div className="flex gap-2.5">
                      <Store className="w-5 h-5 text-amber-500 flex-shrink-0" />
                      <div>
                        <p className="font-bold text-gray-800 dark:text-white">PICKUP: {task.donor?.name}</p>
                        <p className="text-gray-500 dark:text-gray-450 mt-0.5">{task.pickupAddress}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2.5">
                      <MapPin className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                      <div>
                        <p className="font-bold text-gray-800 dark:text-white">DROP-OFF: {task.claimedByNGO?.name}</p>
                        <p className="text-gray-500 dark:text-gray-450 mt-0.5">{task.claimedByNGO?.name} Drop-off Center</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions buttons based on status */}
                  <div className="pt-2 border-t border-gray-150 dark:border-slate-850 flex gap-2">
                    {task.status === 'claimed' ? (
                      <button
                        onClick={() => handleStatusChange(task._id, 'picked_up')}
                        className="flex-grow py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Play className="w-4.5 h-4.5" /> Start Pickup Run
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedTaskForProof(task)}
                        className="flex-grow py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Check className="w-4.5 h-4.5" /> Complete Cargo Drop-off
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Simulated Navigator */}
          <div className="space-y-6">
            <h2 className="text-lg font-bold flex items-center gap-2"><Navigation className="text-primary-500" /> Active GPS Navigator Simulation</h2>
            <div className="glass-card p-6 border border-white/50 dark:border-white/5 h-[420px] flex flex-col justify-between">
              
              <div className="space-y-4">
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3">
                  <div className="p-2.5 bg-primary-950 text-primary-400 rounded-xl border border-primary-900 flex-shrink-0 animate-pulse">
                    <Navigation className="w-5 h-5" />
                  </div>
                  <div className="text-xs text-white">
                    <p className="font-extrabold text-sm">Head North on Broadway St</p>
                    <p className="text-gray-400 mt-0.5">Arrive at Storefront Pickup address in 0.4 miles.</p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <p className="text-[10px] uppercase font-bold text-gray-500">Route Waypoints</p>
                  {[
                    { label: 'Origin: Surplus Food Kitchen', status: 'completed' },
                    { label: 'Waypoint: Safe Storage Transit Point', status: 'current' },
                    { label: 'Destination: NGO Drop-off Hub', status: 'pending' }
                  ].map((way, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 text-xs">
                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold text-[9px] ${
                        way.status === 'completed'
                          ? 'bg-emerald-500 text-white'
                          : way.status === 'current'
                          ? 'bg-blue-500 text-white animate-pulse'
                          : 'bg-slate-200 dark:bg-slate-800 text-gray-550'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className={way.status === 'completed' ? 'text-gray-500 line-through' : 'font-semibold text-gray-700 dark:text-gray-300'}>
                        {way.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation simulated GPS screen */}
              <div className="flex-grow bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center p-6 text-center text-xs relative overflow-hidden mt-4">
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="text-[9px] text-gray-400 uppercase font-mono tracking-wider font-extrabold">GPS ACTIVE</span>
                </div>
                <div className="space-y-1.5">
                  <Truck className="w-10 h-10 text-primary-400 mx-auto" />
                  <p className="font-extrabold text-white">Live Route Overlay Sandbox</p>
                  <p className="text-[9px] text-gray-400 font-mono">Speed: 24 mph | Remaining: 4.8 miles (8 mins)</p>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Modal: Complete Cargo Drop-off */}
        <AnimatePresence>
          {selectedTaskForProof && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="glass-card max-w-md w-full p-6 bg-white dark:bg-slate-900 relative shadow-2xl"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-lg">Finalize Delivery Proof</h3>
                  <button
                    onClick={() => setSelectedTaskForProof(null)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white"
                  >
                    Close
                  </button>
                </div>
                
                <form onSubmit={handleCompleteDeliverySubmit} className="space-y-4">
                  
                  {/* Mock Signature box */}
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">E-Signature Pad (Simulation)</label>
                    <div className="h-28 bg-slate-100 dark:bg-slate-950 border border-dashed border-gray-250 dark:border-slate-800 rounded-xl flex items-center justify-center text-xs text-gray-450 cursor-crosshair">
                      [ Recipient Sign Here ]
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-550 mb-1">Recipient Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-450" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Sister Teresa (Hope Shelter)"
                        value={signatureName}
                        onChange={(e) => setSignatureName(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-white/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-lg outline-none text-xs dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-550 mb-1">Delivery Notes</label>
                    <textarea
                      placeholder="e.g. Cargo received in good conditions."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2 bg-white/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-lg outline-none text-xs dark:text-white h-20 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={proofLoading}
                    className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs shadow-md shadow-primary-600/10 cursor-pointer disabled:opacity-50"
                  >
                    {proofLoading ? 'Finalizing Drop-off...' : 'Upload Proof & Complete'}
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
