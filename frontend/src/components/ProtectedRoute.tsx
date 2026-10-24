import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Hourglass, MailWarning } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<'admin' | 'donor' | 'vendor' | 'restaurant' | 'ngo'>;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-primary-200 border-t-primary-500 animate-spin"></div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Securing session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // If not logged in, take them to home page
    return <Navigate to="/" replace />;
  }

  // Check specific status
  if (user.status === 'unverified') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900">
        <div className="glass-card max-w-md w-full p-8 text-center flex flex-col items-center border-amber-200/50 dark:border-amber-900/30">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-500 mb-4 animate-bounce">
            <MailWarning className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Verify Your Email</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
            We sent an email verification OTP code to your registered email. Please verify your address.
          </p>
          <Navigate to="/verify-otp" replace />
        </div>
      </div>
    );
  }

  if (user.status === 'pending_approval') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900">
        <div className="glass-card max-w-md w-full p-8 text-center flex flex-col items-center border-indigo-200/50 dark:border-indigo-900/30">
          <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-500 mb-4 animate-pulse">
            <Hourglass className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Pending Approval</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
            Thank you for registering! An administrator is currently verifying your license and documents. 
            We will activate your account shortly.
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors text-sm shadow"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (user.status === 'suspended') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900">
        <div className="glass-card max-w-md w-full p-8 text-center flex flex-col items-center border-rose-200/50 dark:border-rose-900/30">
          <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center text-rose-500 mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Account Suspended</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
            Your account has been suspended for violations of platform guidelines. Please contact support if you believe this is an error.
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg transition-colors text-sm shadow"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Check roles
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900">
        <div className="glass-card max-w-md w-full p-8 text-center flex flex-col items-center border-rose-200/50 dark:border-rose-900/30">
          <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center text-rose-500 mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
            You do not have the required permissions to access this dashboard.
          </p>
          <Navigate to={`/dashboard/${user.role}`} replace />
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
