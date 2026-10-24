import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../utils/api';

export interface IUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'donor' | 'vendor' | 'restaurant' | 'ngo';
  status: 'unverified' | 'pending_approval' | 'active' | 'suspended';
  avatar?: string;
}

interface AuthContextType {
  user: IUser | null;
  profile: any;
  loading: boolean;
  login: (email: string, password: string, role: string) => Promise<any>;
  signup: (details: any) => Promise<any>;
  verifyOTP: (email: string, code: string) => Promise<any>;
  googleLogin: (name: string, email: string, role: string) => Promise<any>;
  logout: () => Promise<void>;
  updateProfile: (newProfile: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedProfile = localStorage.getItem('profile');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string, role: string) => {
    const { data } = await api.post('/auth/login', { email, password, role });
    
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    if (data.profile) {
      localStorage.setItem('profile', JSON.stringify(data.profile));
    }

    setUser(data.user);
    setProfile(data.profile);
    return data;
  };

  const signup = async (details: any) => {
    const { data } = await api.post('/auth/signup', details);
    return data;
  };

  const verifyOTP = async (email: string, code: string) => {
    const { data } = await api.post('/auth/verify-otp', { email, code });
    return data;
  };

  const googleLogin = async (name: string, email: string, role: string) => {
    // Simulated Google login endpoint call
    const { data } = await api.post('/auth/google', {
      token: 'mock-google-token-' + Date.now(),
      role,
      name,
      email,
    });

    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    if (data.profile) {
      localStorage.setItem('profile', JSON.stringify(data.profile));
    }

    setUser(data.user);
    setProfile(data.profile);
    return data;
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      await api.post('/auth/logout', { token: refreshToken });
    } catch (e) {
      console.error('Logout API call failed, removing local keys...', e);
    }
    
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('profile');
    setUser(null);
    setProfile(null);
  };

  const updateProfile = (newProfile: any) => {
    localStorage.setItem('profile', JSON.stringify(newProfile));
    setProfile(newProfile);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, signup, verifyOTP, googleLogin, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
