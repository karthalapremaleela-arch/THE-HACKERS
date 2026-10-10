import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Lock,
  Mail,
  HeartHandshake,
  ShieldCheck,
  Building2,
  UserCheck,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(email, password);
      const user = data.user;
      const profile = data.profile;

      if (user.role === 'ADMIN') {
        navigate('/admin');
      } else if (user.role === 'HOSPITAL') {
        if (profile?.approvalStatus === 'PENDING') {
          navigate('/pending-approval');
        } else {
          navigate('/hospital');
        }
      } else if (user.role === 'DONOR') {
        navigate('/donor');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password credentials.');
    } finally {
      setLoading(false);
    }
  };

  const autofillCredentials = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl border border-slate-200 shadow-xl">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white shadow-lg mb-3">
            <HeartHandshake className="w-7 h-7" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Sign In to BloodConnect</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Access hospital operations, donor emergency triage, or admin console
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Demo Autofill Section */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Hackathon Quick-Fill Credentials:</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => autofillCredentials('admin@bloodconnect.local', 'AdminDemo@2026')}
              className="p-2 rounded-lg bg-white border border-slate-200 hover:border-red-300 hover:bg-red-50/50 text-left transition-colors flex items-center space-x-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
              <div className="truncate">
                <span className="font-semibold block truncate">Admin</span>
                <span className="text-[10px] text-slate-400">System Admin</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => autofillCredentials('metropolitan@hospital.local', 'Password123!')}
              className="p-2 rounded-lg bg-white border border-slate-200 hover:border-red-300 hover:bg-red-50/50 text-left transition-colors flex items-center space-x-1.5"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <div className="truncate">
                <span className="font-semibold block truncate">Hospital</span>
                <span className="text-[10px] text-slate-400">Approved</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => autofillCredentials('stjude@hospital.local', 'Password123!')}
              className="p-2 rounded-lg bg-white border border-slate-200 hover:border-red-300 hover:bg-red-50/50 text-left transition-colors flex items-center space-x-1.5"
            >
              <Building2 className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <div className="truncate">
                <span className="font-semibold block truncate">Hospital</span>
                <span className="text-[10px] text-slate-400">Pending</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => autofillCredentials('mock.donor8@bloodconnect.local', 'Password123!')}
              className="p-2 rounded-lg bg-white border border-slate-200 hover:border-red-300 hover:bg-red-50/50 text-left transition-colors flex items-center space-x-1.5"
            >
              <UserCheck className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
              <div className="truncate">
                <span className="font-semibold block truncate">Donor (O-)</span>
                <span className="text-[10px] text-slate-400">Universal Donor</span>
              </div>
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@organization.local"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all hover:-translate-y-0.5 disabled:opacity-50 text-sm"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-500 space-y-1">
          <p>
            Hospital facility looking to register?{' '}
            <Link to="/register-hospital" className="font-semibold text-red-600 hover:underline">
              Register Hospital
            </Link>
          </p>
          <p>
            Register synthetic donor?{' '}
            <Link to="/register-donor" className="font-semibold text-red-600 hover:underline">
              Create Mock Donor
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
