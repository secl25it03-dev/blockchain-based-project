import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { motion } from 'framer-motion';
import { KeyRound, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

export const VerifyOTP: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyOTP } = useAuth();
  const { showToast } = useToast();

  const state = location.state as { email?: string; _dev_otp_?: string } | null;
  const [email, setEmail] = useState(state?.email || '');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [successState, setSuccessState] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !code) {
      showToast('Please provide both email and verification code', 'warning');
      return;
    }

    setLoading(true);
    try {
      const data = await verifyOTP(email, code);
      showToast('Account email verified successfully!', 'success');
      setSuccessState(data.status); // 'active' or 'pending_approval'
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid or expired OTP code';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-slate-50 dark:bg-slate-900 transition-colors">
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary-500/5 to-transparent pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card max-w-md w-full p-8 border border-white/50 dark:border-white/5"
      >
        {!successState ? (
          <>
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Two-Step Verification
              </h2>
              <p className="text-sm text-gray-550 dark:text-gray-400 mt-2">
                We've sent a 6-digit confirmation code to your email.
              </p>
            </div>

            {/* Dev Mode Assistance */}
            {state?._dev_otp_ && (
              <div className="p-3 border border-emerald-100 dark:border-emerald-950/40 bg-emerald-50/50 dark:bg-emerald-950/10 text-emerald-800 dark:text-emerald-400 text-xs font-bold rounded-xl mb-6 text-center">
                🛠️ Dev Sandbox OTP Code: {state._dev_otp_}
              </div>
            )}

            <form onSubmit={handleVerify} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                  Confirm Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    placeholder="you@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all dark:text-white text-sm"
                  />
                </div>
              </div>

              {/* Code */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                  6-Digit OTP Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="e.g. 123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center tracking-[0.5em] py-3.5 bg-white/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all dark:text-white text-lg font-bold"
                />
              </div>

              {/* Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md text-sm cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Confirming Code...' : 'Verify Code'}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-6 flex flex-col items-center">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <ShieldCheck className="w-9 h-9" />
            </div>
            
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-3">
              Verification Complete!
            </h2>

            {successState === 'active' ? (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-8 max-w-sm">
                  Your email has been confirmed. You can now login to access your Donor dashboard.
                </p>
                <button
                  onClick={() => navigate('/login/donor')}
                  className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md text-sm cursor-pointer"
                >
                  Proceed to Login <ArrowRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-8 max-w-sm leading-relaxed">
                  Your email has been confirmed. Your business verification profile is now in queue for administrator review. 
                  We will activate your workspace shortly!
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="w-full py-3.5 bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md text-sm cursor-pointer"
                >
                  Return to Homepage
                </button>
              </>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};
