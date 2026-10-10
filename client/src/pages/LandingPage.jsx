import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  ShieldAlert,
  Clock,
  Compass,
  CheckCircle,
  Activity,
  Users,
  Building2,
  BellRing,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import api from '../services/api';

export default function LandingPage() {
  const [stats, setStats] = useState({
    hospitals: 3,
    syntheticDonors: 28,
    bloodRequests: 3,
    simulatedAlerts: 6,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchDemoStats = async () => {
      try {
        const res = await api.get('/demo/status');
        if (res.data.success && res.data.counts) {
          setStats(res.data.counts);
        }
      } catch (err) {
        console.warn('Could not fetch dynamic demo stats, using baseline defaults.');
      } finally {
        setLoadingStats(false);
      }
    };
    fetchDemoStats();
  }, []);

  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-red-50/70 via-white to-slate-50 pt-12 pb-20 px-4 sm:px-6 lg:px-8 rounded-3xl border border-red-100/60 max-w-7xl mx-auto">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold tracking-wide border border-red-200">
            <Sparkles className="w-3.5 h-3.5 text-red-600" />
            <span>AI-Powered Emergency Blood Matching MVP</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Connecting Emergency Requests to <span className="bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">Nearby Blood Donors</span> in Critical Minutes
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            During medical emergencies, hospitals cannot afford delays. BloodConnect matches verified hospitals with nearby synthetic donors ranked by distance, triggering instant simulated alerts.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Link
              to="/register-hospital"
              className="px-6 py-3.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/25 transition-all hover:-translate-y-0.5 flex items-center space-x-2 text-sm sm:text-base"
            >
              <span>Register Hospital</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/login"
              className="px-6 py-3.5 rounded-xl font-bold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 shadow-sm transition-all hover:-translate-y-0.5 text-sm sm:text-base"
            >
              Hospital & Donor Sign In
            </Link>

            <Link
              to="/login?role=admin"
              className="px-5 py-3.5 rounded-xl font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors text-sm"
            >
              Admin Portal
            </Link>
          </div>
        </div>

        {/* Dynamic Demo Metrics Row */}
        <div className="mt-16 pt-8 border-t border-slate-200/80 max-w-5xl mx-auto">
          <p className="text-center text-xs font-bold uppercase tracking-wider text-slate-600 mb-6">
            Live Database Simulation Statistics
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="bg-white/80 p-4 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex justify-center mb-1 text-red-600">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{stats.hospitals}</span>
              <span className="block text-xs font-medium text-slate-600 mt-1">Hospitals (Approved/Pending)</span>
            </div>

            <div className="bg-white/80 p-4 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex justify-center mb-1 text-rose-600">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{stats.syntheticDonors}</span>
              <span className="block text-xs font-medium text-slate-600 mt-1">Synthetic Donors Seeded</span>
            </div>

            <div className="bg-white/80 p-4 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex justify-center mb-1 text-indigo-600">
                <Activity className="w-5 h-5" />
              </div>
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{stats.bloodRequests}</span>
              <span className="block text-xs font-medium text-slate-600 mt-1">Emergency Requests</span>
            </div>

            <div className="bg-white/80 p-4 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex justify-center mb-1 text-amber-600">
                <BellRing className="w-5 h-5" />
              </div>
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{stats.simulatedAlerts}</span>
              <span className="block text-xs font-medium text-slate-600 mt-1">Simulated Alerts Dispatched</span>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Process Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            How BloodConnect Works
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2">
            A verified 4-step rapid matching workflow designed for critical care triage.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3 relative hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold text-lg">
              1
            </div>
            <h3 className="font-bold text-slate-900 text-base">Hospital Verification</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Hospitals register and enter a pending queue. Only administrators can approve facility credentials, preventing fraudulent requests.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3 relative hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-lg">
              2
            </div>
            <h3 className="font-bold text-slate-900 text-base">Emergency Request</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Approved hospitals specify blood group (A+, B+, O-, or ANY), required units, urgency level, and search radius (1-100 km).
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3 relative hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
              3
            </div>
            <h3 className="font-bold text-slate-900 text-base">Haversine Matching</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              The mock donor discovery engine calculates great-circle straight-line distance, filtering out ineligible or unavailable donors.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3 relative hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-lg">
              4
            </div>
            <h3 className="font-bold text-slate-900 text-base">Simulated Urgent Alert</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              In-app alerts are dispatched immediately. Donors accept or decline, updating real-time hospital response statistics.
            </p>
          </div>
        </div>
      </section>

      {/* Role Demonstration Access Hub */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold">Ready to Explore the Platform?</h2>
            <p className="text-slate-300 text-sm sm:text-base">
              The project is pre-seeded with administrator, hospital, and donor demo accounts for instant hackathon evaluation.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                to="/login"
                className="px-6 py-3 rounded-xl font-bold text-slate-900 bg-white hover:bg-slate-100 transition-colors text-sm"
              >
                Go to Quick-Fill Sign In
              </Link>
              <Link
                to="/register-hospital"
                className="px-6 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors text-sm"
              >
                Test Hospital Registration
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
