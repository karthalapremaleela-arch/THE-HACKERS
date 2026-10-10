import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import CountdownTimer from '../components/CountdownTimer';
import ConfirmationModal from '../components/ConfirmationModal';
import { getSocket } from '../services/socket';
import {
  Heart,
  ShieldAlert,
  BellRing,
  CheckCircle2,
  XCircle,
  MapPin,
  Clock,
  Compass,
  Building2,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  UserCheck,
} from 'lucide-react';

export default function DonorDashboardPage() {
  const [profile, setProfile] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingAvail, setTogglingAvail] = useState(false);

  // Response modal state
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [responseAction, setResponseAction] = useState(null); // 'ACCEPT' | 'DECLINE'
  const [responseNotes, setResponseNotes] = useState('');
  const [responding, setResponding] = useState(false);

  const fetchDonorData = async () => {
    try {
      setLoading(true);
      const [donorRes, alertsRes] = await Promise.all([
        api.get('/donors/me'),
        api.get('/donors/me/alerts'),
      ]);
      setProfile(donorRes.data.data);
      setAlerts(alertsRes.data.data);
    } catch (err) {
      console.error('Failed to load donor dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonorData();

    const socket = getSocket();
    const handleAlertEvent = () => {
      fetchDonorData();
    };

    socket.on('alert:created', handleAlertEvent);

    return () => {
      socket.off('alert:created', handleAlertEvent);
    };
  }, []);

  const handleToggleAvailability = async () => {
    if (!profile) return;
    try {
      setTogglingAvail(true);
      const newStatus = !profile.isAvailable;
      const res = await api.patch('/donors/me/availability', { isAvailable: newStatus });
      setProfile(res.data.data);
    } catch (err) {
      alert('Failed to update availability: ' + (err.response?.data?.error || err.message));
    } finally {
      setTogglingAvail(false);
    }
  };

  const handleRespondToAlert = async () => {
    if (!selectedAlert || !responseAction) return;
    try {
      setResponding(true);
      await api.patch(`/alerts/${selectedAlert._id}/respond`, {
        response: responseAction,
        notes: responseNotes || undefined,
      });
      setSelectedAlert(null);
      setResponseAction(null);
      setResponseNotes('');
      await fetchDonorData();
    } catch (err) {
      alert('Failed to submit response: ' + (err.response?.data?.error || err.message));
    } finally {
      setResponding(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 text-center">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm text-slate-500">Loading Donor Console...</p>
      </div>
    );
  }

  const activeAlerts = alerts.filter(
    (a) => a.status === 'SENT_SIMULATED' || a.status === 'VIEWED' || a.status === 'QUEUED'
  );
  const previousResponses = alerts.filter(
    (a) => a.status === 'ACCEPTED' || a.status === 'DECLINED'
  );

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Top Welcome & Availability Card */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold tracking-wide">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Synthetic Donor Profile: {profile?.syntheticDonorId}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {profile?.displayName}
          </h1>
          <p className="text-red-100 text-xs sm:text-sm">
            Blood Group: <strong>{profile?.bloodGroup}</strong> • City: {profile?.city} • Proximity Radius Active
          </p>
        </div>

        {/* Live Availability Toggle Switch */}
        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex items-center justify-between space-x-4 self-start md:self-auto min-w-[240px]">
          <div>
            <span className="block text-xs uppercase font-bold text-red-100 tracking-wider">
              Emergency Availability
            </span>
            <span className="text-sm font-extrabold text-white">
              {profile?.isAvailable ? 'Available for Donation' : 'Currently Unavailable'}
            </span>
          </div>
          <button
            onClick={handleToggleAvailability}
            disabled={togglingAvail}
            className="p-1 text-white hover:scale-105 transition-transform disabled:opacity-50"
            title="Toggle availability"
          >
            {profile?.isAvailable ? (
              <ToggleRight className="w-10 h-10 text-emerald-300" />
            ) : (
              <ToggleLeft className="w-10 h-10 text-slate-300" />
            )}
          </button>
        </div>
      </div>

      {/* Incoming Urgent Alerts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center space-x-2">
              <BellRing className="w-5 h-5 text-red-600 animate-bounce" />
              <span>Incoming Emergency Blood Alerts ({activeAlerts.length})</span>
            </h2>
            <p className="text-xs text-slate-500">
              Urgent match notifications dispatched by verified hospitals within your area
            </p>
          </div>
        </div>

        {activeAlerts.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Pending Emergency Alerts</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You are currently on active standby. When a nearby hospital creates an emergency request matching blood group <strong>{profile?.bloodGroup}</strong>, you will receive simulated alerts here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeAlerts.map((alert) => (
              <div
                key={alert._id}
                className="bg-white p-6 rounded-3xl border border-red-200 shadow-md space-y-4 relative overflow-hidden"
              >
                {/* Critical Top Ribbon */}
                {alert.urgency === 'CRITICAL' && (
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-600 animate-pulse"></div>
                )}

                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[11px] font-mono text-slate-400 block">{alert.alertId}</span>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                      <span>{alert.hospitalId?.hospitalName || 'Local Medical Center'}</span>
                    </h3>
                    <span className="text-xs text-slate-500">{alert.hospitalId?.address}, {alert.hospitalId?.city}</span>
                  </div>
                  <StatusBadge type="urgency" value={alert.urgency} size="lg" />
                </div>

                {/* Match Specifications */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl text-xs text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Requested</span>
                    <span className="font-extrabold text-red-600 text-base">{alert.bloodGroup}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Distance</span>
                    <span className="font-extrabold text-slate-900 font-mono text-base">~{alert.distanceKm} km</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Time Window</span>
                    <div className="mt-0.5">
                      {alert.requestId?.requiredBy && (
                        <CountdownTimer targetDate={alert.requestId.requiredBy} />
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-3 pt-2">
                  <button
                    onClick={() => {
                      setSelectedAlert(alert);
                      setResponseAction('ACCEPT');
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Accept Alert</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedAlert(alert);
                      setResponseAction('DECLINE');
                    }}
                    className="py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Decline</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Previous Response History */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Your Response History</h2>
        {previousResponses.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No prior responses recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[11px] font-bold">
                  <th className="py-3 px-3">Hospital</th>
                  <th className="py-3 px-3">Blood Group</th>
                  <th className="py-3 px-3">Distance</th>
                  <th className="py-3 px-3">Response Decision</th>
                  <th className="py-3 px-3">Notes</th>
                  <th className="py-3 px-3">Responded At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {previousResponses.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-3 font-bold text-slate-900">
                      {item.hospitalId?.hospitalName || 'Hospital'}
                    </td>
                    <td className="py-3.5 px-3 font-extrabold text-red-600">{item.bloodGroup}</td>
                    <td className="py-3.5 px-3 font-mono">{item.distanceKm} km</td>
                    <td className="py-3.5 px-3">
                      <StatusBadge type="alert" value={item.status} />
                    </td>
                    <td className="py-3.5 px-3 text-xs text-slate-500">{item.responseNotes || '—'}</td>
                    <td className="py-3.5 px-3 font-mono text-xs text-slate-400">
                      {item.respondedAt ? new Date(item.respondedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Response Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(selectedAlert && responseAction)}
        title={responseAction === 'ACCEPT' ? 'Accept Emergency Blood Request' : 'Decline Blood Request'}
        message={
          responseAction === 'ACCEPT'
            ? `Confirm your intention to donate for ${selectedAlert?.hospitalId?.hospitalName}? Your simulated confirmation will be transmitted to hospital staff.`
            : `Are you unable to donate for ${selectedAlert?.hospitalId?.hospitalName}? Your response will update hospital metrics so they can pursue other matched donors.`
        }
        confirmLabel={responding ? 'Submitting...' : responseAction === 'ACCEPT' ? 'Confirm Acceptance' : 'Confirm Decline'}
        isDangerous={responseAction === 'DECLINE'}
        onConfirm={handleRespondToAlert}
        onCancel={() => {
          setSelectedAlert(null);
          setResponseAction(null);
          setResponseNotes('');
        }}
      >
        <div className="mt-3">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Optional Note to Medical Facility:
          </label>
          <input
            type="text"
            value={responseNotes}
            onChange={(e) => setResponseNotes(e.target.value)}
            placeholder={responseAction === 'ACCEPT' ? 'e.g. Arriving in ~20 minutes' : 'e.g. Currently away from city'}
            className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
      </ConfirmationModal>
    </div>
  );
}
