import React, { useState, useEffect } from 'react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import ConfirmationModal from '../components/ConfirmationModal';
import {
  Building2,
  Clock,
  Check,
  X,
  Filter,
  CheckCircle2,
  AlertCircle,
  RotateCw,
} from 'lucide-react';

export default function HospitalApprovalManagementPage() {
  const [hospitals, setHospitals] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const [selectedHospital, setSelectedHospital] = useState(null);
  const [modalAction, setModalAction] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      const url = statusFilter === 'ALL' ? '/admin/hospitals' : `/admin/hospitals?status=${statusFilter}`;
      const res = await api.get(url);
      setHospitals(res.data.data);
    } catch (err) {
      console.error('Failed to fetch hospitals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, [statusFilter]);

  const handleApprove = async () => {
    if (!selectedHospital) return;
    try {
      setActionLoading(true);
      await api.patch(`/admin/hospitals/${selectedHospital._id}/approve`);
      setSelectedHospital(null);
      setModalAction(null);
      await fetchHospitals();
    } catch (err) {
      alert('Approval failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedHospital) return;
    try {
      setActionLoading(true);
      await api.patch(`/admin/hospitals/${selectedHospital._id}/reject`, {
        rejectionReason: rejectionReason || 'Documentation credentials could not be verified in demo review.',
      });
      setSelectedHospital(null);
      setModalAction(null);
      setRejectionReason('');
      await fetchHospitals();
    } catch (err) {
      alert('Rejection failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Hospital Approval Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review and govern hospital authorizations across the emergency network
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-2xl text-xs font-semibold">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl transition-colors ${
                statusFilter === st
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-slate-400">Loading hospitals...</p>
          </div>
        ) : hospitals.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No Hospitals Found</p>
            <p className="text-xs text-slate-400 mt-1">No hospital accounts match the current filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[11px] font-bold">
                  <th className="py-3 px-3">Hospital Name</th>
                  <th className="py-3 px-3">Synthetic Reg #</th>
                  <th className="py-3 px-3">Address & City</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Review Notes / Info</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {hospitals.map((hosp) => (
                  <tr key={hosp._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-3 font-bold text-slate-900">{hosp.hospitalName}</td>
                    <td className="py-3.5 px-3 font-mono text-slate-600">{hosp.syntheticRegistrationNumber}</td>
                    <td className="py-3.5 px-3 text-slate-600">{hosp.address}, {hosp.city}</td>
                    <td className="py-3.5 px-3">
                      <StatusBadge type="approval" value={hosp.approvalStatus} />
                    </td>
                    <td className="py-3.5 px-3 text-xs text-slate-500 max-w-xs truncate">
                      {hosp.rejectionReason ? (
                        <span className="text-rose-600 font-medium">Reason: {hosp.rejectionReason}</span>
                      ) : hosp.approvalStatus === 'APPROVED' ? (
                        <span className="text-emerald-600 font-medium">Verified by admin</span>
                      ) : (
                        <span className="text-amber-600 font-medium">Awaiting evaluation</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                      {hosp.approvalStatus !== 'APPROVED' && (
                        <button
                          onClick={() => {
                            setSelectedHospital(hosp);
                            setModalAction('APPROVE');
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors inline-flex items-center space-x-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Approve</span>
                        </button>
                      )}
                      {hosp.approvalStatus !== 'REJECTED' && (
                        <button
                          onClick={() => {
                            setSelectedHospital(hosp);
                            setModalAction('REJECT');
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors inline-flex items-center space-x-1"
                        >
                          <X className="w-3 h-3" />
                          <span>Reject</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Approval Confirmation Modal */}
      <ConfirmationModal
        isOpen={modalAction === 'APPROVE'}
        title="Approve Hospital Registration"
        message={`Are you sure you want to approve "${selectedHospital?.hospitalName}"?`}
        confirmLabel={actionLoading ? 'Approving...' : 'Confirm Approval'}
        onConfirm={handleApprove}
        onCancel={() => {
          setSelectedHospital(null);
          setModalAction(null);
        }}
      />

      {/* Rejection Confirmation Modal */}
      <ConfirmationModal
        isOpen={modalAction === 'REJECT'}
        title="Reject Hospital Registration"
        message={`Specify the reason for rejecting "${selectedHospital?.hospitalName}":`}
        confirmLabel={actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
        isDangerous={true}
        onConfirm={handleReject}
        onCancel={() => {
          setSelectedHospital(null);
          setModalAction(null);
          setRejectionReason('');
        }}
      >
        <div className="mt-2">
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={2}
            placeholder="Documentation credentials could not be verified in demo review."
            className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
      </ConfirmationModal>
    </div>
  );
}
