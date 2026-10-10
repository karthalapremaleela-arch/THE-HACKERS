import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import CountdownTimer from '../components/CountdownTimer';
import { getSocket } from '../services/socket';
import {
  Building2,
  PlusCircle,
  Activity,
  HeartHandshake,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export default function HospitalDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/hospitals/dashboard');
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to load hospital dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const socket = getSocket();
    const handleUpdate = () => {
      fetchDashboardData();
    };

    socket.on('stats:updated', handleUpdate);

    return () => {
      socket.off('stats:updated', handleUpdate);
    };
  }, []);

  if (loading && !data) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 text-center">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm text-slate-500">Loading Hospital Console...</p>
      </div>
    );
  }

  const hospital = data?.hospital || {};
  const stats = data?.stats || {};
  const requests = data?.recentRequests || [];
  const isApproved = hospital.approvalStatus === 'APPROVED';

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Top Welcome & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-red-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-red-600">
              Hospital Operations
            </span>
            <StatusBadge type="approval" value={hospital.approvalStatus} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            {hospital.hospitalName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            {hospital.address}, {hospital.city} • Reg #{hospital.syntheticRegistrationNumber}
          </p>
        </div>

        {isApproved ? (
          <Link
            to="/hospital/request/new"
            className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/20 transition-all hover:-translate-y-0.5 text-sm self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Emergency Request</span>
          </Link>
        ) : (
          <Link
            to="/pending-approval"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 text-xs self-start sm:self-auto"
          >
            <Clock className="w-4 h-4 text-amber-700" />
            <span>View Verification Status</span>
          </Link>
        )}
      </div>

      {/* Warning Banner if NOT approved */}
      {!isApproved && (
        <div className="bg-amber-50 border border-amber-300 rounded-3xl p-5 text-amber-900 flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs sm:text-sm">
            <p className="font-bold">Hospital Account Pending Verification</p>
            <p>
              Your facility registration is currently under review by system administrators. You cannot dispatch emergency blood requests until this account is approved.
            </p>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Active Requests</span>
            <Activity className="w-5 h-5 text-red-600" />
          </div>
          <span className="text-3xl font-extrabold text-slate-900">{stats.activeRequests || 0}</span>
          <span className="block text-xs text-slate-400 mt-1">Under active proximity search</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Total Requests</span>
            <Building2 className="w-5 h-5 text-indigo-500" />
          </div>
          <span className="text-3xl font-extrabold text-slate-900">{stats.totalRequests || 0}</span>
          <span className="block text-xs text-slate-400 mt-1">Submitted facility cases</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Accepted Responses</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <span className="text-3xl font-extrabold text-emerald-600">
            {stats.totalAcceptedResponses || 0}
          </span>
          <span className="block text-xs text-slate-400 mt-1">Confirmed donor simulated accepts</span>
        </div>
      </div>

      {/* Active and Recent Requests */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Facility Blood Requests</h2>
            <p className="text-xs text-slate-500">Live emergency requests and donor proximity matches</p>
          </div>
          {isApproved && (
            <Link
              to="/hospital/request/new"
              className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline"
            >
              + New Request
            </Link>
          )}
        </div>

        {requests.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl">
            <Activity className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No Blood Requests Yet</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {isApproved
                ? 'Create your first emergency request to begin matching nearby synthetic donors.'
                : 'Account verification required before creating emergency requests.'}
            </p>
            {isApproved && (
              <Link
                to="/hospital/request/new"
                className="mt-4 inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Create Blood Request</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[11px] font-bold">
                  <th className="py-3 px-3">Blood Group</th>
                  <th className="py-3 px-3">Units</th>
                  <th className="py-3 px-3">Urgency</th>
                  <th className="py-3 px-3">Search Radius</th>
                  <th className="py-3 px-3">Countdown / Required By</th>
                  <th className="py-3 px-3">Matched Donors</th>
                  <th className="py-3 px-3">Responses</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-3 font-extrabold text-base text-red-600">{req.bloodGroup}</td>
                    <td className="py-3.5 px-3 font-semibold text-slate-900">{req.unitsRequired} units</td>
                    <td className="py-3.5 px-3">
                      <StatusBadge type="urgency" value={req.urgency} />
                    </td>
                    <td className="py-3.5 px-3 font-mono text-xs text-slate-600">{req.searchRadiusKm} km</td>
                    <td className="py-3.5 px-3">
                      {req.status === 'ACTIVE' ? (
                        <CountdownTimer targetDate={req.requiredBy} />
                      ) : (
                        <span className="text-xs text-slate-400">Completed</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-slate-800">
                      {req.matchedDonorCount} donors
                    </td>
                    <td className="py-3.5 px-3 text-xs">
                      <span className="text-emerald-600 font-bold">{req.acceptedResponseCount} accepted</span> /{' '}
                      <span className="text-rose-600 font-bold">{req.declinedResponseCount} declined</span>
                    </td>
                    <td className="py-3.5 px-3">
                      <StatusBadge type="request" value={req.status} />
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <Link
                        to={`/hospital/request/${req._id}`}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                      >
                        <span>Details</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
