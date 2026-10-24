import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Phone, MapPin, Award, Truck, Store, BookOpen, ShieldAlert } from 'lucide-react';

export const Signup: React.FC = () => {
  const { signup } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Primary fields
  const [role, setRole] = useState<'donor' | 'restaurant' | 'ngo' | 'vendor'>('donor');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Custom role-specific fields
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  
  // Restaurant / NGO specific
  const [licenseNo, setLicenseNo] = useState('');
  const [registrationNo, setRegistrationNo] = useState('');
  const [capacity, setCapacity] = useState('Medium');
  const [foodCategories, setFoodCategories] = useState<string[]>([]);
  
  // Vendor specific
  const [vehicleType, setVehicleType] = useState<'bike' | 'car' | 'truck'>('bike');
  const [licensePlate, setLicensePlate] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');

  const categoriesOptions = ['Bakery', 'Cooked Meals', 'Produce/Vegetables', 'Dry Rations', 'Dairy/Meat'];

  const handleCategoryToggle = (cat: string) => {
    setFoodCategories((prev) =>
      prev.includes(cat) ? prev.filter((item) => item !== cat) : [...prev, cat]
    );
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      showToast('Please fill in name, email, and password fields', 'warning');
      return;
    }

    setLoading(true);

    try {
      // Build payload based on role
      const payload: any = {
        name,
        email,
        password,
        role,
      };

      if (role === 'ngo') {
        payload.registrationNo = registrationNo;
        payload.capacity = capacity;
        payload.address = address;
        payload.phone = phone;
        payload.verificationDocument = 'https://via.placeholder.com/150?text=NGO+Verification+Doc';
      } else if (role === 'restaurant') {
        payload.licenseNo = licenseNo;
        payload.address = address;
        payload.phone = phone;
        payload.foodCategories = foodCategories;
        payload.verificationDocument = 'https://via.placeholder.com/150?text=Restaurant+License';
      } else if (role === 'vendor') {
        payload.vehicleType = vehicleType;
        payload.licensePlate = licensePlate;
        payload.licenseNumber = licenseNumber;
        payload.phone = phone;
        payload.verificationDocument = 'https://via.placeholder.com/150?text=Driver+License';
      }

      const res = await signup(payload);
      showToast('Registration successful! Verification code sent to your email.', 'success');
      
      // Auto-populate for user convenience in development
      if (res._dev_otp_) {
        console.log(`[DEV MODE] Auto-injecting OTP code: ${res._dev_otp_}`);
      }

      navigate('/verify-otp', { state: { email, _dev_otp_: res._dev_otp_ } });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registration failed. Try again.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-16 bg-slate-50 dark:bg-slate-900 transition-colors">
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary-500/5 to-transparent pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card max-w-2xl w-full p-8 border border-white/50 dark:border-white/5"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Create an Account
          </h2>
          <p className="text-sm text-gray-550 dark:text-gray-400 mt-2">
            Join the ecosystem and help reduce global food waste.
          </p>
        </div>

        {/* Role Selector Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { id: 'donor', name: 'Donor', icon: <User className="w-4 h-4" /> },
            { id: 'restaurant', name: 'Restaurant', icon: <Store className="w-4 h-4" /> },
            { id: 'ngo', name: 'NGO Partner', icon: <BookOpen className="w-4 h-4" /> },
            { id: 'vendor', name: 'Delivery', icon: <Truck className="w-4 h-4" /> }
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setRole(item.id as any)}
              className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 font-bold transition-all text-xs cursor-pointer ${
                role === item.id
                  ? 'bg-primary-500 text-white border-transparent shadow shadow-primary-500/10'
                  : 'bg-white/40 dark:bg-slate-900/40 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              {item.icon}
              {item.name}
            </button>
          ))}
        </div>

        <form onSubmit={handleSignup} className="space-y-6">
          {/* Base Credentials */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                Full Name / Business Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe / Fresh Foods LLC"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all dark:text-white text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all dark:text-white text-sm"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  required
                  placeholder="Choose a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all dark:text-white text-sm"
                />
              </div>
            </div>
          </div>

          {/* Conditional Restaurant Fields */}
          {role === 'restaurant' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4 pt-4 border-t border-gray-150 dark:border-slate-850"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                    Restaurant License No
                  </label>
                  <div className="relative">
                    <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. FSSAI-12847294"
                      value={licenseNo}
                      onChange={(e) => setLicenseNo(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all dark:text-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                    Contact Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +1 555-0199"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all dark:text-white text-sm"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                    Full Pickup Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      required
                      placeholder="Suite / Street, City, ZIP code"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all dark:text-white text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                  Food Categories Offered
                </label>
                <div className="flex flex-wrap gap-2">
                  {categoriesOptions.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategoryToggle(cat)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        foodCategories.includes(cat)
                          ? 'bg-primary-100 text-primary-800 border-primary-300 dark:bg-primary-950/40 dark:text-primary-400 dark:border-primary-900'
                          : 'bg-white/40 dark:bg-slate-905/40 text-gray-650 dark:text-gray-400 border-gray-250 dark:border-slate-800'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Conditional NGO Fields */}
          {role === 'ngo' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4 pt-4 border-t border-gray-150 dark:border-slate-850"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                    NGO Registration Number
                  </label>
                  <div className="relative">
                    <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. NGO-9284729"
                      value={registrationNo}
                      onChange={(e) => setRegistrationNo(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all dark:text-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                    Operational Capacity
                  </label>
                  <select
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="w-full px-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all dark:text-white text-sm h-[46px]"
                  >
                    <option value="Small">Small (Under 50 portions/day)</option>
                    <option value="Medium">Medium (50 - 200 portions/day)</option>
                    <option value="Large">Large (200+ portions/day)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                    Contact Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +1 555-0144"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all dark:text-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                    Office / Drop-off Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      required
                      placeholder="Street, City, ZIP code"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all dark:text-white text-sm"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Conditional Vendor Fields */}
          {role === 'vendor' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4 pt-4 border-t border-gray-150 dark:border-slate-850"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                    Vehicle Type
                  </label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value as any)}
                    className="w-full px-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all dark:text-white text-sm h-[46px]"
                  >
                    <option value="bike">Bicycle / Motorcycle</option>
                    <option value="car">Car / Sedan</option>
                    <option value="truck">Truck / Van</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                    License Plate Number
                  </label>
                  <div className="relative">
                    <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. 5XYZ99"
                      value={licensePlate}
                      onChange={(e) => setLicensePlate(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all dark:text-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                    Driver's License Number
                  </label>
                  <div className="relative">
                    <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. DL-12345678"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all dark:text-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                    Mobile Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +1 555-0155"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all dark:text-white text-sm"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Verification warning for Business accounts */}
          {role !== 'donor' && (
            <div className="flex gap-3 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-950/10 text-xs leading-relaxed text-blue-700 dark:text-blue-400">
              <ShieldAlert className="w-5 h-5 flex-shrink-0" />
              <span>
                <strong>Document Verification Required:</strong> Your license/registration files will be evaluated 
                by system administrators. You will be placed in a pending verification state initially.
              </span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl flex items-center justify-center transition-all shadow-md text-sm cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Registering Account...' : 'Submit & Register'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-550 dark:text-gray-400">
          Already registered?{' '}
          <Link to={`/login/${role}`} className="text-primary-600 dark:text-primary-400 font-bold hover:underline">
            Access Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
