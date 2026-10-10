import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import CountdownTimer from '../components/CountdownTimer';
import ConfirmationModal from '../components/ConfirmationModal';
import { getSocket } from '../services/socket';
import {
  ShieldAlert,
  ArrowLeft,
  Building2,
  Clock,
  Compass,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCw,
  BellRing,
  Sparkles,
} from 'lucide-react';

export default function RequestDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const fetchRequestAndMatches = async () => {
    try {
      setLoading(true);
      const [reqRes, matchRes] = await Promise.all([
        api.get(`/requests/${id}`),
        api.get(`/requests/${id}/matches`),
      ]);
      setRequest(reqRes.data.data);
      setMatches(matchRes.data.data);
    } catch (err) {
      console.error('Failed to load request:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestAndMatches();

    const socket = getSocket();
    const handleUpdate = () => {
      fetchRequestAndMatches();
    };

    socket.on(`request:${id}:update`, handleUpdate);
    socket.on('stats:updated', handleUpdate);

    return () => {
      socket.off(`request:${id}:update`, handleUpdate);
      socket.off('stats:updated', handleUpdate);
    };
  }, [id]);

  const handleCancelRequest = async () => {
    try {
      setCancelling(true);
      await api.patch(`/requests/${id}/cancel`);
      setShowCancelModal(false);
      await fetchRequestAndMatches();
    } catch (err) {
      alert('Failed to cancel request: ' + (err.response?.data?.error || err.message));
    } finally {
      setCancelling(false);
    }
  };

  if (loading && !request) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 text-center">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm text-slate-500">Loading emergency request details...</p>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Request Not Found</h2>
        <Link to="/hospital" className="inline-block text-xs font-bold text-red-600 hover:underline">
          Return to Hospital Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Top Breadcrumb & Cancel Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/hospital')}
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-red-600">
                Emergency Case Review
              </span>
              <StatusBadge type="urgency" value={request.urgency} />
              <StatusBadge type="request" value={request.status} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-0.5">
              Request for {request.unitsRequired} Units of {request.bloodGroup} Blood
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <button
            onClick={fetchRequestAndMatches}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh response states"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {request.status === 'ACTIVE' && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
            >
              Cancel Request
            </button>
          )}
        </div>
      </div>

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase">Target Blood Group</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-red-600">{request.bloodGroup}</span>
            <span className="text-sm font-semibold text-slate-600">({request.unitsRequired} Units)</span>
          </div>
          <span className="block text-xs text-slate-400">
            {request.bloodGroup === 'ANY' ? 'Exploratory ANY search' : 'Exact blood type matching'}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase">Search Radius</span>
          <div className="text-3xl font-extrabold text-slate-900 font-mono">
            {request.searchRadiusKm} <span className="text-lg font-normal text-slate-500">km</span>
          </div>
          <span className="block text-xs text-slate-400">Haversine straight-line limit</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase">Time Remaining</span>
          <div className="pt-1">
            {request.status === 'ACTIVE' ? (
              <CountdownTimer targetDate={request.requiredBy} />
            ) : (
              <span className="text-sm font-bold text-slate-500 uppercase">{request.status}</span>
            )}
          </div>
          <span className="block text-xs text-slate-400">
            Required by: {new Date(request.requiredBy).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase">Responses Tracked</span>
          <div className="text-2xl font-extrabold text-slate-900 flex items-center space-x-3">
            <span className="text-emerald-600">{request.acceptedResponseCount} Accept</span>
            <span className="text-slate-300">/</span>
            <span className="text-rose-600">{request.declinedResponseCount} Decline</span>
          </div>
          <span className="block text-xs text-slate-400">Live donor response rate</span>
        </div>
      </div>

      {request.notes && (
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-700">
          <strong className="text-slate-900">Case Notes:</strong> {request.notes}
        </div>
      )}

      {/* Matched Donors Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Users className="w-5 h-5 text-red-600" />
              <span>Matched Synthetic Donors ({matches.length})</span>
            </h2>
            <p className="text-xs text-slate-500">
              Ranked strictly by distance ascending from hospital facility coordinates
            </p>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            Origin: {request.latitude.toFixed(4)}, {request.longitude.toFixed(4)}
          </div>
        </div>

        {matches.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-amber-300 bg-amber-50/50 rounded-2xl p-6 space-y-2">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
            <h3 className="text-base font-bold text-amber-900">No Eligible Mock Donors Within Radius</h3>
            <p className="text-xs text-amber-700 max-w-md mx-auto">
              No synthetic donors in the dataset matched blood group <strong>{request.bloodGroup}</strong> within a <strong>{request.searchRadiusKm} km</strong> radius who are available and accept urgent alerts.
            </p>
            <p className="text-xs text-slate-500">
              Tip: Try creating a new request with a wider search radius (e.g. 25-50 km) or selecting "ANY" for exploratory matching.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[11px] font-bold">
                  <th className="py-3 px-3">Rank / Distance</th>
                  <th className="py-3 px-3">Donor Name (Synthetic)</th>
                  <th className="py-3 px-3">Blood Group</th>
                  <th className="py-3 px-3">Location City</th>
                  <th className="py-3 px-3">Match Reason</th>
                  <th className="py-3 px-3">Simulated Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {matches.map((item, idx) => (
                  <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="flex items-center space-x-2">
                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-extrabold text-xs flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <span className="font-extrabold text-slate-900 font-mono text-sm">
                          {item.distanceKm} km
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-bold text-slate-900 block">{item.donorId?.displayName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{item.donorId?.syntheticDonorId}</span>
                    </td>
                    <td className="py-3.5 px-3 font-extrabold text-red-600 text-sm">
                      {item.donorId?.bloodGroup}
                    </td>
                    <td className="py-3.5 px-3 text-slate-600">{item.donorId?.city}</td>
                    <td className="py-3.5 px-3 text-xs text-slate-500">{item.matchReason}</td>
                    <td className="py-3.5 px-3">
                      <StatusBadge type="alert" value={item.matchStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      <ConfirmationModal
        isOpen={showCancelModal}
        title="Cancel Emergency Request"
        message="Are you sure you want to cancel this emergency request? Dispatched simulated alerts will be marked as cancelled and no further donor responses will be processed."
        confirmLabel={cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
        isDangerous={true}
        onConfirm={handleCancelRequest}
        onCancel={() => setShowCancelModal(false)}
      />
    </div>
  );
}
