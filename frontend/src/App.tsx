import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Web3Provider } from './context/Web3Context';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';

// Import Pages
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { VerifyOTP } from './pages/VerifyOTP';
import { Campaigns } from './pages/Campaigns';
import { CampaignDetails } from './pages/CampaignDetails';
import { VerifyTransaction } from './pages/VerifyTransaction';
import { About } from './pages/About';
import { Privacy } from './pages/Privacy';
import { Terms } from './pages/Terms';

// Import Dashboards
import { AdminDashboard } from './pages/dashboards/AdminDashboard';
import { DonorDashboard } from './pages/dashboards/DonorDashboard';
import { RestaurantDashboard } from './pages/dashboards/RestaurantDashboard';
import { NGODashboard } from './pages/dashboards/NGODashboard';
import { VendorDashboard } from './pages/dashboards/VendorDashboard';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <Web3Provider>
            <Router>
              <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 flex flex-col">
                <Navbar />
                
                <div className="flex-grow">
                  <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/campaigns" element={<Campaigns />} />
                    <Route path="/campaigns/:id" element={<CampaignDetails />} />
                    <Route path="/verify" element={<VerifyTransaction />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/verify-otp" element={<VerifyOTP />} />
                    <Route path="/login/:role" element={<Login />} />

                    {/* Role Protected Dashboards */}
                    <Route
                      path="/dashboard/admin"
                      element={
                        <ProtectedRoute allowedRoles={['admin']}>
                          <AdminDashboard />
                        </ProtectedRoute>
                      }
                    />
                    
                    <Route
                      path="/dashboard/donor"
                      element={
                        <ProtectedRoute allowedRoles={['donor']}>
                          <DonorDashboard />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/dashboard/restaurant"
                      element={
                        <ProtectedRoute allowedRoles={['restaurant']}>
                          <RestaurantDashboard />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/dashboard/restaurant/inventory"
                      element={
                        <ProtectedRoute allowedRoles={['restaurant']}>
                          <RestaurantDashboard />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/dashboard/ngo"
                      element={
                        <ProtectedRoute allowedRoles={['ngo']}>
                          <NGODashboard />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/dashboard/vendor"
                      element={
                        <ProtectedRoute allowedRoles={['vendor']}>
                          <VendorDashboard />
                        </ProtectedRoute>
                      }
                    />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </div>
              </div>
            </Router>
          </Web3Provider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;
