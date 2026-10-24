import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWeb3 } from '../context/Web3Context';
import { ThemeToggle } from './ThemeToggle';
import { api } from '../utils/api';
import { Bell, LogOut, User as UserIcon, Heart, Menu, X, Check, Wallet, ShieldCheck, ChevronDown } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { account, isConnected, isConnecting, networkName, connectWallet, disconnectWallet } = useWeb3();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const walletRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && user.status === 'active') {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (walletRef.current && !walletRef.current.contains(event.target as Node)) {
        setShowWalletMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/inventory/notifications');
      setNotifications(data);
    } catch (e) {
      // Notification polling fallback
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/inventory/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      showToast('Notification marked as read', 'success');
    } catch (e) {
      console.error('Failed to mark read', e);
    }
  };

  const handleLogout = async () => {
    await logout();
    showToast('Logged out successfully', 'info');
    navigate('/');
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-300">
              <Heart className="w-5 h-5 fill-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-400">
                DONATO
              </span>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold -mt-1 hidden sm:block">
                Transparent Platform
              </span>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            <Link
              to="/campaigns"
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Browse Campaigns
            </Link>

            <Link
              to="/verify"
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Verify On-Chain</span>
            </Link>

            <Link
              to="/about"
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              About
            </Link>

            {user && (
              <Link
                to={`/dashboard/${user.role}`}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
              >
                My Dashboard
              </Link>
            )}
          </div>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {/* MetaMask Wallet Connect Button */}
            <div className="relative" ref={walletRef}>
              {isConnected ? (
                <button
                  type="button"
                  onClick={() => setShowWalletMenu(!showWalletMenu)}
                  className="px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center gap-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-mono text-[11px]">
                    {account?.slice(0, 6)}...{account?.slice(-4)}
                  </span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isConnecting}
                  onClick={connectWallet}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Wallet className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
                </button>
              )}

              {/* Wallet Dropdown Menu */}
              {showWalletMenu && isConnected && (
                <div className="absolute right-0 mt-2 w-64 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl z-50 text-xs space-y-3">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Connected Wallet</span>
                    <div className="font-mono text-[11px] font-bold text-slate-900 dark:text-white break-all select-all">
                      {account}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Active Network</span>
                    <div className="font-semibold text-emerald-600 dark:text-emerald-400 text-xs">
                      {networkName}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      disconnectWallet();
                      setShowWalletMenu(false);
                    }}
                    className="w-full py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-100 transition-colors"
                  >
                    Disconnect Wallet
                  </button>
                </div>
              )}
            </div>

            <ThemeToggle />

            {user ? (
              <>
                {/* Notifications Bell */}
                {user.status === 'active' && (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      <Bell className="w-4 h-4" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-rose-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white">
                          {unreadCount}
                        </span>
                      )}
                    </button>

                    {/* Dropdown menu */}
                    {showNotifications && (
                      <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden z-50">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-white text-xs">Notifications</span>
                          {unreadCount > 0 && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 rounded-full font-semibold">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-xs">
                              All caught up!
                            </div>
                          ) : (
                            notifications.map((n) => (
                              <div
                                key={n.id || n._id}
                                className={`p-3.5 border-b border-slate-50 dark:border-slate-700/40 flex items-start gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${
                                  !n.read ? 'bg-emerald-50/20 dark:bg-emerald-950/10' : ''
                                }`}
                              >
                                <div className="flex-grow">
                                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{n.title}</h4>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{n.message}</p>
                                </div>
                                {!n.read && (
                                  <button
                                    onClick={() => markAsRead(n.id || n._id)}
                                    className="p-1 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-slate-400 hover:text-emerald-500 transition-colors"
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Profile Badge */}
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-xs font-black">
                    {user.name.charAt(0)}
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-xs font-bold text-slate-900 dark:text-white leading-none">{user.name}</p>
                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 uppercase font-black">{user.role}</span>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl border border-rose-200 dark:border-rose-900/40 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login/donor"
                  className="text-xs font-bold text-slate-700 hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400 px-3 py-2"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-xl transition-all shadow-md shadow-emerald-600/20"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger menu */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 flex flex-col gap-3">
          <Link
            to="/campaigns"
            onClick={() => setMobileMenuOpen(false)}
            className="px-4 py-2 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Browse Campaigns
          </Link>
          <Link
            to="/verify"
            onClick={() => setMobileMenuOpen(false)}
            className="px-4 py-2 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Verify Records</span>
          </Link>
          <Link
            to="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="px-4 py-2 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            About DONATO
          </Link>

          {/* Wallet button in mobile */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            {isConnected ? (
              <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300">
                  {account?.slice(0, 8)}...{account?.slice(-4)}
                </span>
                <button
                  type="button"
                  onClick={() => disconnectWallet()}
                  className="text-rose-500 font-bold"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={connectWallet}
                className="w-full py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center gap-2"
              >
                <Wallet className="w-4 h-4" />
                <span>Connect MetaMask Wallet</span>
              </button>
            )}
          </div>

          {user ? (
            <>
              <Link
                to={`/dashboard/${user.role}`}
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
              >
                Go to Dashboard ({user.role})
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Link
                to="/login/donor"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 rounded-xl text-center text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 rounded-xl text-center text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
