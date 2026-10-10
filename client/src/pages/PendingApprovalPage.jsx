import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Clock,
  Building2,
  ShieldAlert,
  RotateCw,
  LogOut,
  CheckCircle,
  FileText,
} from 'lucide-react';

export default function PendingApprovalPage() {
  const { user, profile, refreshMe, logout } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const [notice, setNotice] = useState('');

  const handleCheckStatus = async () => {
    setChecking(true);
    setNotice('');
    try {
      await refreshMe();
      const updatedProfile = JSON.parse(localStorage.getItem('bloodconnect_profile') || '{}');
      if (updatedProfile.approvalStatus === 'APPROVED') {
        navigate('/hospital');
      } else if (updatedProfile.approvalStatus === 'REJECTED') {
        setNotice('Notice: This registration has been rejected by the administrator.');
      } else {
        setNotice('Status is still Pending. Administrator review is required.');
      }
    } catch (err) {
      setNotice('Could not check status: ' + err.message);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-600 mx-auto flex items-center justify-center shadow-inner animate-pulse">
          <Clock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
            Registration Status: Pending
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Hospital Verification in Progress
          </h1>
          <p className="text-sm text-slate-500 max-w-lg mx-auto">
            Your facility registration for <strong>{profile?.hospitalName || 'your hospital'}</strong> has been received and is awaiting administrator verification.
          </p>
        </div>

        {/* Facility Summary Card */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-left space-y-3 text-xs sm:text-sm">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200 font-semibold text-slate-700">
            <span>Facility Details</span>
            <span className="text-slate-400 font-normal">Demo Synthetic Registry</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-slate-600">
            <div>
              <span className="text-slate-400 block text-xs">Hospital Name</span>
              <span className="font-semibold text-slate-900">{profile?.hospitalName || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-xs">Synthetic Reg #</span>
              <span className="font-mono text-slate-900">{profile?.syntheticRegistrationNumber || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-xs">City</span>
              <span className="text-slate-900">{profile?.city || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-xs">Account Contact</span>
              <span className="text-slate-900">{user?.email || 'N/A'}</span>
            </div>
          </div>
        </div>

        {notice && (
          <div className="p-3 rounded-xl bg-slate-100 text-xs font-semibold text-slate-700">
            {notice}
          </div>
        )}

        {/* Hackathon Demo Tip */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 text-left space-y-1">
          <div className="font-bold flex items-center space-x-1.5 text-blue-700">
            <ShieldAlert className="w-4 h-4" />
            <span>Hackathon Evaluation Tip:</span>
          </div>
          <p>
            To approve this hospital right now: Sign out, log in with the demo administrator credentials (<strong>admin@bloodconnect.local</strong>), navigate to <strong>Approvals</strong>, and click <strong>Approve</strong>.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={handleCheckStatus}
            disabled={checking}
            className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-md transition-all flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
          >
            <RotateCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'Checking...' : 'Refresh Status'}</span>
          </button>

          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="w-full sm:w-auto px-5 py-3 rounded-xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center space-x-1.5 text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
