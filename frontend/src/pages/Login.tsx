import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { motion } from 'framer-motion';
import { Lock, Mail, Heart, Globe, Shield, Store, Truck, BookOpen } from 'lucide-react';

export const Login: React.FC = () => {
  const { role } = useParams<{ role: string }>();
  const { login, googleLogin } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Validate route role
  const validRoles = ['admin', 'donor', 'vendor', 'restaurant', 'ngo'];
  const activeRole = role && validRoles.includes(role) ? role : 'donor';

  // Branding config
  const getRoleBranding = (roleType: string) => {
    switch (roleType) {
      case 'admin':
        return {
          title: 'System Administration',
          desc: 'Monitor platform activities & approvals',
          glow: 'glow-accent border-accent-400/30',
          bgIcon: <Shield className="w-12 h-12 text-accent-500" />,
          btn: 'bg-accent-600 hover:bg-accent-700 shadow-accent-600/20'
        };
      case 'restaurant':
        return {
          title: 'Restaurant Portal',
          desc: 'Manage surplus food & waste logs',
          glow: 'glow-primary border-primary-400/30',
          bgIcon: <Store className="w-12 h-12 text-primary-500" />,
          btn: 'bg-primary-600 hover:bg-primary-700 shadow-primary-600/20'
        };
      case 'ngo':
        return {
          title: 'NGO Network',
          desc: 'Claim surplus food & direct logistics',
          glow: 'glow-accent border-indigo-400/30',
          bgIcon: <BookOpen className="w-12 h-12 text-indigo-500" />,
          btn: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
        };
      case 'vendor':
        return {
          title: 'Logistics Partner',
          desc: 'Accept and update dispatch routes',
          glow: 'glow-secondary border-secondary-400/30',
          bgIcon: <Truck className="w-12 h-12 text-secondary-500" />,
          btn: 'bg-secondary-600 hover:bg-secondary-700 shadow-secondary-600/20'
        };
      case 'donor':
      default:
        return {
          title: 'Donor Portal',
          desc: 'Contribute food or support programs',
          glow: 'glow-accent border-rose-400/30',
          bgIcon: <Heart className="w-12 h-12 text-rose-500" />,
          btn: 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
        };
    }
  };

  const brand = getRoleBranding(activeRole);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please fill in all fields', 'warning');
      return;
    }

    setLoading(true);
    try {
      await login(email, password, activeRole);
      showToast(`Welcome back to DONATO!`, 'success');
      navigate(`/dashboard/${activeRole}`);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed. Please check credentials.';
      const status = err.response?.data?.status;
      
      showToast(msg, 'error');
      
      if (status === 'unverified') {
        navigate('/verify-otp', { state: { email } });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const mockGoogleName = activeRole.charAt(0).toUpperCase() + activeRole.slice(1) + ' Guest';
      const mockGoogleEmail = `google-${activeRole}@example.com`;
      await googleLogin(mockGoogleName, mockGoogleEmail, activeRole);
      showToast('Logged in successfully via Google OAuth', 'success');
      navigate(`/dashboard/${activeRole}`);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Google OAuth authentication failed';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-slate-50 dark:bg-slate-900 transition-colors">
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary-500/5 to-transparent pointer-events-none"></div>
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`glass-card max-w-md w-full p-8 border ${brand.glow} relative overflow-hidden`}
      >
        {/* Floating role indicator background */}
        <div className="absolute -top-3 -right-3 opacity-[0.08] dark:opacity-[0.05] pointer-events-none rotate-12">
          {brand.bgIcon}
        </div>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {brand.title}
          </h2>
          <p className="text-sm text-gray-550 dark:text-gray-400 mt-2">{brand.desc}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all dark:text-white text-sm"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all dark:text-white text-sm"
              />
            </div>
          </div>

          {/* Action button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md text-sm cursor-pointer ${brand.btn} disabled:opacity-50`}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t border-gray-200 dark:border-slate-850"></div>
          <span className="flex-shrink mx-4 text-xs font-bold uppercase text-gray-400 dark:text-gray-500">Or continue with</span>
          <div className="flex-grow border-t border-gray-200 dark:border-slate-850"></div>
        </div>

        {/* Google OAuth Login */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-3 border border-gray-200 dark:border-slate-800 bg-white/30 dark:bg-slate-900/30 hover:bg-white/50 dark:hover:bg-slate-850 rounded-xl flex items-center justify-center gap-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
        >
          <Globe className="w-5 h-5 text-primary-500" />
          Google Account
        </button>

        {/* Sign up links */}
        <div className="mt-8 text-center text-xs">
          <span className="text-gray-550 dark:text-gray-400">New to DONATO? </span>
          <Link to="/signup" className="text-primary-600 dark:text-primary-400 font-bold hover:underline">
            Create an Account
          </Link>
        </div>

        {/* Role Toggles */}
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-850">
          <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 text-center mb-3">Portal Switchboard</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              { id: 'donor', name: 'Donor' },
              { id: 'restaurant', name: 'Restaurant' },
              { id: 'ngo', name: 'NGO' },
              { id: 'vendor', name: 'Vendor' },
              { id: 'admin', name: 'Admin' }
            ].map((item) => (
              <Link
                key={item.id}
                to={`/login/${item.id}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  activeRole === item.id
                    ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 border-transparent shadow'
                    : 'bg-white/20 dark:bg-slate-900/20 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-slate-800 hover:bg-gray-150/40 dark:hover:bg-slate-800/40'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
