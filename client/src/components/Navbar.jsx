import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HeartHandshake,
  Bell,
  LogOut,
  User,
  PlusCircle,
  FileCheck2,
  ShieldAlert,
  RotateCcw,
  Menu,
  X,
} from 'lucide-react';
import api from '../services/api';

export default function Navbar() {
  const { user, profile, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [resetting, setResetting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleResetDemo = async () => {
    if (!window.confirm('Reset demo database to fresh deterministic baseline?')) return;
    try {
      setResetting(true);
      await api.post('/demo/seed');
      alert('Demo data successfully re-seeded!');
      window.location.reload();
    } catch (err) {
      alert('Failed to reset demo: ' + (err.response?.data?.error || err.message));
    } finally {
      setResetting(false);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-red-600 to-rose-700 bg-clip-text text-transparent">
                BloodConnect
              </span>
              <span className="block text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                Emergency Matching
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-3">
            <Link
              to="/"
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive('/') ? 'text-red-600 bg-red-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Home
            </Link>

            {isAuthenticated && user?.role === 'ADMIN' && (
              <>
                <Link
                  to="/admin"
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive('/admin') ? 'text-red-600 bg-red-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Admin Hub
                </Link>
                <Link
                  to="/admin/approvals"
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive('/admin/approvals') ? 'text-red-600 bg-red-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Approvals
                </Link>
              </>
            )}

            {isAuthenticated && user?.role === 'HOSPITAL' && (
              <>
                <Link
                  to="/hospital"
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive('/hospital') ? 'text-red-600 bg-red-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Hospital Dashboard
                </Link>
                {profile?.approvalStatus === 'APPROVED' && (
                  <Link
                    to="/hospital/request/new"
                    className="inline-flex items-center space-x-1 px-3 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 shadow-sm transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Emergency Request</span>
                  </Link>
                )}
              </>
            )}

            {isAuthenticated && user?.role === 'DONOR' && (
              <>
                <Link
                  to="/donor"
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive('/donor') ? 'text-red-600 bg-red-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Donor Dashboard
                </Link>
                <Link
                  to="/donor/alerts"
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive('/donor/alerts') ? 'text-red-600 bg-red-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  My Alerts
                </Link>
                <Link
                  to="/donor/profile"
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive('/donor/profile') ? 'text-red-600 bg-red-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Availability
                </Link>
              </>
            )}

            {/* Notification Center Link */}
            <Link
              to="/notifications"
              className={`p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors relative ${
                isActive('/notifications') ? 'text-red-600 bg-red-50' : ''
              }`}
              title="Simulated Alerts Center"
            >
              <Bell className="w-5 h-5" />
            </Link>

            {/* Quick Demo Reset Trigger */}
            <button
              onClick={handleResetDemo}
              disabled={resetting}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              title="Reset Demo Dataset"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin text-red-600' : ''}`} />
              <span>{resetting ? 'Resetting...' : 'Reset Demo'}</span>
            </button>
          </nav>

          {/* User Profile / Auth Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3 border-l pl-3 border-slate-200">
                <div className="text-right">
                  <span className="block text-xs font-semibold text-slate-800">
                    {user?.name || user?.email}
                  </span>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-red-600">
                    {user?.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/register-hospital"
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-sm transition-colors"
                >
                  Register Hospital
                </Link>
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md font-medium text-slate-700 hover:bg-slate-50"
          >
            Home
          </Link>
          {isAuthenticated ? (
            <>
              {user?.role === 'ADMIN' && (
                <>
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Admin Dashboard
                  </Link>
                  <Link
                    to="/admin/approvals"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Hospital Approvals
                  </Link>
                </>
              )}
              {user?.role === 'HOSPITAL' && (
                <>
                  <Link
                    to="/hospital"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Hospital Dashboard
                  </Link>
                  <Link
                    to="/hospital/request/new"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md font-medium text-red-600 font-semibold hover:bg-red-50"
                  >
                    + New Emergency Request
                  </Link>
                </>
              )}
              {user?.role === 'DONOR' && (
                <>
                  <Link
                    to="/donor"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Donor Dashboard
                  </Link>
                  <Link
                    to="/donor/alerts"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Emergency Alerts
                  </Link>
                  <Link
                    to="/donor/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Profile & Availability
                  </Link>
                </>
              )}
              <Link
                to="/notifications"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md font-medium text-slate-700 hover:bg-slate-50"
              >
                Notifications Stream
              </Link>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">{user?.name} ({user?.role})</span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg"
                >
                  Log Out
                </button>
              </div>
            </>
          ) : (
            <div className="pt-2 space-y-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center w-full px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg"
              >
                Sign In
              </Link>
              <Link
                to="/register-hospital"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center w-full px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg"
              >
                Register Hospital
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
