import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import SyntheticNotice from './components/SyntheticNotice';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import HospitalRegisterPage from './pages/HospitalRegisterPage';
import DonorRegisterPage from './pages/DonorRegisterPage';
import PendingApprovalPage from './pages/PendingApprovalPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import HospitalApprovalManagementPage from './pages/HospitalApprovalManagementPage';
import HospitalDashboardPage from './pages/HospitalDashboardPage';
import CreateRequestPage from './pages/CreateRequestPage';
import RequestDetailsPage from './pages/RequestDetailsPage';
import DonorDashboardPage from './pages/DonorDashboardPage';
import DonorProfilePage from './pages/DonorProfilePage';
import DonorAlertsPage from './pages/DonorAlertsPage';
import NotificationsCenterPage from './pages/NotificationsCenterPage';
import NotFoundPage from './pages/NotFoundPage';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-xs text-slate-500">Checking authorization...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900">
          <SyntheticNotice />
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register-hospital" element={<HospitalRegisterPage />} />
              <Route path="/register-donor" element={<DonorRegisterPage />} />
              <Route path="/pending-approval" element={<PendingApprovalPage />} />
              <Route path="/notifications" element={<NotificationsCenterPage />} />

              {/* Admin Protected Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/approvals"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <HospitalApprovalManagementPage />
                  </ProtectedRoute>
                }
              />

              {/* Hospital Protected Routes */}
              <Route
                path="/hospital"
                element={
                  <ProtectedRoute allowedRoles={['HOSPITAL']}>
                    <HospitalDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hospital/request/new"
                element={
                  <ProtectedRoute allowedRoles={['HOSPITAL']}>
                    <CreateRequestPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hospital/request/:id"
                element={
                  <ProtectedRoute allowedRoles={['HOSPITAL', 'ADMIN']}>
                    <RequestDetailsPage />
                  </ProtectedRoute>
                }
              />

              {/* Donor Protected Routes */}
              <Route
                path="/donor"
                element={
                  <ProtectedRoute allowedRoles={['DONOR']}>
                    <DonorDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/donor/alerts"
                element={
                  <ProtectedRoute allowedRoles={['DONOR']}>
                    <DonorAlertsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/donor/profile"
                element={
                  <ProtectedRoute allowedRoles={['DONOR']}>
                    <DonorProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* 404 Route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}
