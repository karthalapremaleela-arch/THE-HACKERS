import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Heart,
  MapPin,
  Mail,
  Lock,
  Compass,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function DonorRegisterPage() {
  const { registerDonor } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    displayName: '',
    bloodGroup: 'O+',
    city: 'Metro City',
    latitude: 40.7128,
    longitude: -74.0060,
    isAvailable: true,
    acceptsUrgentAlerts: true,
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? checked
          : name === 'latitude' || name === 'longitude'
          ? parseFloat(value) || ''
          : value,
    }));
  };

  const handleUseMetroCoordinates = () => {
    const dLat = (Math.random() - 0.5) * 0.06;
    const dLon = (Math.random() - 0.5) * 0.06;
    setFormData((prev) => ({
      ...prev,
      city: 'Metro City',
      latitude: Number((40.7128 + dLat).toFixed(4)),
      longitude: Number((-74.0060 + dLon).toFixed(4)),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await registerDonor(formData);
      navigate('/donor');
    } catch (err) {
      setError(
        err.response?.data?.details
          ? err.response.data.details.map((d) => d.message).join(', ')
          : err.response?.data?.error || 'Registration failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 sm:px-6">
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-red-600 text-white mx-auto flex items-center justify-center shadow-md">
            <Heart className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Synthetic Donor Registration
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Register a synthetic demo donor profile for emergency match simulation.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Taylor Vance"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Display Name (Demo Badge)
              </label>
              <input
                type="text"
                required
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                placeholder="Taylor V. (Donor)"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="taylor@donor.local"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500"
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
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          </div>

          {/* Blood Group */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Blood Group
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {BLOOD_GROUPS.map((bg) => (
                <button
                  key={bg}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, bloodGroup: bg }))}
                  className={`py-2 rounded-xl text-xs font-extrabold transition-all border ${
                    formData.bloodGroup === bg
                      ? 'bg-red-600 text-white border-red-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {bg}
                </button>
              ))}
            </div>
          </div>

          {/* Location & Coordinates */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                <Compass className="w-4 h-4 text-red-600" />
                <span>Mock Coordinates (Proximity Matching)</span>
              </label>
              <button
                type="button"
                onClick={handleUseMetroCoordinates}
                className="text-xs font-semibold text-red-600 hover:underline"
              >
                Generate Metro Location
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <span className="block text-[11px] text-slate-400 mb-1">City</span>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                />
              </div>
              <div>
                <span className="block text-[11px] text-slate-400 mb-1">Latitude</span>
                <input
                  type="number"
                  step="0.0001"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 bg-white"
                />
              </div>
              <div>
                <span className="block text-[11px] text-slate-400 mb-1">Longitude</span>
                <input
                  type="number"
                  step="0.0001"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 bg-white"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all hover:-translate-y-0.5 disabled:opacity-50 text-sm"
          >
            {loading ? 'Creating Synthetic Profile...' : 'Complete Synthetic Donor Registration'}
          </button>
        </form>

        <div className="text-center pt-2 text-xs text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-red-600 hover:underline">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
}
