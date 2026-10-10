import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import ConfirmationModal from '../components/ConfirmationModal';
import {
  Building2,
  Clock,
  CheckCircle2,
  Activity,
  Users,
  Bell,
  History,
  ShieldCheck,
  Check,
  X,
  Eye,
  Filter,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [requests, setRequests] = useState([]);
  const [donors, setDonors] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'hospitals', 'requests', 'donors', 'audit'
  const [loading, setLoading] = useState(true);

  // Approval / Rejection modal state
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [modalAction, setModalAction] = useState(null); // 'APPROVE' or 'REJECT'
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [dashRes, hospRes, reqRes, donRes, auditRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/hospitals'),
        api.get('/admin/requests'),
        api.get('/admin/donors'),
        api.get('/admin/audit-logs'),
      ]);

      setData(dashRes.data.data);
      setHospitals(hospRes.data.data);
      setRequests(reqRes.data.data);
      setDonors(donRes.data.data);
      setAuditLogs(auditRes.data.data);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleApprove = async () => {
    if (!selectedHospital) return;
    try {
      setActionLoading(true);
      await api.patch(`/admin/hospitals/${selectedHospital._id}/approve`);
      setSelectedHospital(null);
      setModalAction(null);
      await fetchAdminData();
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
        rejectionReason: rejectionReason || 'Documentation could not be verified in demo review.',
      });
      setSelectedHospital(null);
      setModalAction(null);
      setRejectionReason('');
      await fetchAdminData();
    } catch (err) {
      alert('Rejection failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const pendingHospitals = hospitals.filter((h) => h.approvalStatus === 'PENDING');

  if (loading && !data) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 text-center">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm text-slate-500">Loading Administrator Console...</p>
      </div>
    );
  }

  const stats = data?.stats || {};

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-red-600">Administrator Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            System Control & Verification Hub
          </h1>
        </div>

        <Link
          to="/admin/approvals"
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-sm transition-colors self-start sm:self-auto"
        >
          <Clock className="w-4 h-4" />
          <span>Pending Approvals ({stats.pendingHospitals || 0})</span>
        </Link>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Hospitals</span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900">{stats.totalHospitals || 0}</span>
          <span className="block text-[11px] text-slate-400 mt-1">Registered</span>
        </div>

        <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-bold text-amber-800 uppercase">Pending</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-2xl font-extrabold text-amber-900">{stats.pendingHospitals || 0}</span>
          <span className="block text-[11px] text-amber-700 mt-1">Requires review</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Approved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-2xl font-extrabold text-emerald-600">{stats.approvedHospitals || 0}</span>
          <span className="block text-[11px] text-slate-400 mt-1">Active facilities</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Requests</span>
            <Activity className="w-4 h-4 text-indigo-500" />
          </div>
          <span className="text-2xl font-extrabold text-indigo-600">{stats.activeRequests || 0}</span>
          <span className="block text-[11px] text-slate-400 mt-1">Active requests</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Mock Donors</span>
            <Users className="w-4 h-4 text-rose-500" />
          </div>
          <span className="text-2xl font-extrabold text-rose-600">{stats.totalDonors || 0}</span>
          <span className="block text-[11px] text-slate-400 mt-1">Seeded pool</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Alerts</span>
            <Bell className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900">{stats.simulatedNotifications || 0}</span>
          <span className="block text-[11px] text-slate-400 mt-1">Simulated logs</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 ${
            activeTab === 'pending'
              ? 'bg-amber-100 text-amber-900 border border-amber-300'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span>Pending Approvals ({pendingHospitals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('hospitals')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 ${
            activeTab === 'hospitals'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-3.5 h-3.5 text-red-600" />
          <span>All Hospitals ({hospitals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 ${
            activeTab === 'requests'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-indigo-600" />
          <span>Emergency Requests ({requests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('donors')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 ${
            activeTab === 'donors'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-rose-600" />
          <span>Mock Donors ({donors.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 ${
            activeTab === 'audit'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <History className="w-3.5 h-3.5 text-slate-600" />
          <span>Audit Log ({auditLogs.length})</span>
        </button>
      </div>

      {/* Tab 1: Pending Approvals */}
      {activeTab === 'pending' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">Hospital Approvals Queue</h2>
            <span className="text-xs text-slate-500">Only approved hospitals can initiate emergency requests</span>
          </div>

          {pendingHospitals.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800">Queue is Clear</p>
              <p className="text-xs text-slate-400 mt-1">No hospital accounts are currently awaiting approval.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase text-[11px] font-bold">
                    <th className="py-3 px-3">Hospital Name</th>
                    <th className="py-3 px-3">Registration #</th>
                    <th className="py-3 px-3">City / Address</th>
                    <th className="py-3 px-3">Coordinates</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingHospitals.map((hosp) => (
                    <tr key={hosp._id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-3 font-bold text-slate-900">{hosp.hospitalName}</td>
                      <td className="py-3.5 px-3 font-mono text-slate-600">{hosp.syntheticRegistrationNumber}</td>
                      <td className="py-3.5 px-3 text-slate-600">{hosp.address}, {hosp.city}</td>
                      <td className="py-3.5 px-3 font-mono text-xs text-slate-500">
                        {hosp.latitude.toFixed(4)}, {hosp.longitude.toFixed(4)}
                      </td>
                      <td className="py-3.5 px-3">
                        <StatusBadge type="approval" value={hosp.approvalStatus} />
                      </td>
                      <td className="py-3.5 px-3 text-right space-x-2">
                        <button
                          onClick={() => {
                            setSelectedHospital(hosp);
                            setModalAction('APPROVE');
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors inline-flex items-center space-x-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedHospital(hosp);
                            setModalAction('REJECT');
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors inline-flex items-center space-x-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: All Hospitals */}
      {activeTab === 'hospitals' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Registered Facilities Directory</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[11px] font-bold">
                  <th className="py-3 px-3">Hospital</th>
                  <th className="py-3 px-3">Synthetic Reg #</th>
                  <th className="py-3 px-3">Location</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Reviewed By</th>
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
                    <td className="py-3.5 px-3 text-xs text-slate-500">
                      {hosp.reviewedBy?.name || (hosp.approvalStatus === 'PENDING' ? 'Awaiting review' : 'System')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Emergency Requests */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Emergency Requests Lifecycle</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[11px] font-bold">
                  <th className="py-3 px-3">Hospital</th>
                  <th className="py-3 px-3">Blood Group</th>
                  <th className="py-3 px-3">Urgency</th>
                  <th className="py-3 px-3">Radius</th>
                  <th className="py-3 px-3">Matches</th>
                  <th className="py-3 px-3">Responses</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-3 font-bold text-slate-900">{req.hospitalId?.hospitalName || 'Hospital'}</td>
                    <td className="py-3.5 px-3 font-extrabold text-red-600">{req.bloodGroup}</td>
                    <td className="py-3.5 px-3">
                      <StatusBadge type="urgency" value={req.urgency} />
                    </td>
                    <td className="py-3.5 px-3 font-mono text-xs">{req.searchRadiusKm} km</td>
                    <td className="py-3.5 px-3 font-semibold text-slate-800">{req.matchedDonorCount} mock donors</td>
                    <td className="py-3.5 px-3 text-xs">
                      <span className="text-emerald-600 font-bold">{req.acceptedResponseCount} accepted</span> /{' '}
                      <span className="text-rose-600 font-bold">{req.declinedResponseCount} declined</span>
                    </td>
                    <td className="py-3.5 px-3">
                      <StatusBadge type="request" value={req.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Mock Donors */}
      {activeTab === 'donors' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">Synthetic Mock Donors Dataset</h2>
            <span className="text-xs text-slate-400">Deterministic dataset around Metro City</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[11px] font-bold">
                  <th className="py-3 px-3">Synthetic ID</th>
                  <th className="py-3 px-3">Display Name</th>
                  <th className="py-3 px-3">Blood Group</th>
                  <th className="py-3 px-3">City</th>
                  <th className="py-3 px-3">Coordinates</th>
                  <th className="py-3 px-3">Availability</th>
                  <th className="py-3 px-3">Alerts Preference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {donors.map((d) => (
                  <tr key={d._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-mono text-xs text-slate-500">{d.syntheticDonorId}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900">{d.displayName}</td>
                    <td className="py-3 px-3 font-bold text-red-600">{d.bloodGroup}</td>
                    <td className="py-3 px-3 text-slate-600">{d.city}</td>
                    <td className="py-3 px-3 font-mono text-xs text-slate-500">
                      {d.latitude.toFixed(4)}, {d.longitude.toFixed(4)}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                        d.isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {d.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-xs">
                      {d.acceptsUrgentAlerts ? (
                        <span className="text-emerald-600 font-semibold">Enabled</span>
                      ) : (
                        <span className="text-slate-400">Disabled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900">System Administrative Audit Trail</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[11px] font-bold">
                  <th className="py-3 px-3">Timestamp</th>
                  <th className="py-3 px-3">Action</th>
                  <th className="py-3 px-3">Entity Type</th>
                  <th className="py-3 px-3">Actor</th>
                  <th className="py-3 px-3">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-mono text-xs text-slate-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">{log.action}</td>
                    <td className="py-3 px-3 text-slate-600">{log.entityType}</td>
                    <td className="py-3 px-3 text-slate-700">
                      {log.actorUserId?.name || log.actorUserId?.email || 'System'}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500 max-w-xs truncate">
                      {JSON.stringify(log.safeMetadata || {})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Approval Confirmation Modal */}
      <ConfirmationModal
        isOpen={modalAction === 'APPROVE'}
        title="Approve Hospital Registration"
        message={`Are you sure you want to approve "${selectedHospital?.hospitalName}"? This will allow this medical facility to create live emergency blood requests and trigger simulated donor alerts.`}
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
        message={`Specify the reason for rejecting "${selectedHospital?.hospitalName}". The facility will be blocked from submitting requests.`}
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
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Rejection Reason
          </label>
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
