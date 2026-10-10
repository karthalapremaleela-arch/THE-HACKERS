import React, { useState, useEffect } from 'react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import CountdownTimer from '../components/CountdownTimer';
import ConfirmationModal from '../components/ConfirmationModal';
import {
  BellRing,
  CheckCircle2,
  XCircle,
  Building2,
  Clock,
  RotateCw,
  Filter,
} from 'lucide-react';

export default function DonorAlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'ACCEPTED' | 'DECLINED'
  const [loading, setLoading] = useState(true);

  // Response modal
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [responseAction, setResponseAction] = useState(null);
  const [responseNotes, setResponseNotes] = useState('');
  const [responding, setResponding] = useState(false);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/donors/me/alerts');
      setAlerts(res.data.data);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleRespond = async () => {
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
      await fetchAlerts();
    } catch (err) {
      alert('Failed to respond: ' + (err.response?.data?.error || err.message));
    } finally {
      setResponding(false);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filter === 'ACTIVE') return a.status === 'SENT_SIMULATED' || a.status === 'VIEWED';
    if (filter === 'ACCEPTED') return a.status === 'ACCEPTED';
    if (filter === 'DECLINED') return a.status === 'DECLINED';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Emergency Alerts Stream
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Simulated dispatch records and notifications from matching hospitals
          </p>
        </div>

        {/* Filter bar */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-2xl text-xs font-semibold">
          {['ALL', 'ACTIVE', 'ACCEPTED', 'DECLINED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-xl transition-colors ${
                filter === st
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-400">Loading alerts...</p>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-2">
          <BellRing className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">No Alerts Match Filter</p>
          <p className="text-xs text-slate-400">No simulated emergency alerts found under "{filter}".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAlerts.map((alert) => (
            <div
              key={alert._id}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block">{alert.alertId}</span>
                  <h3 className="font-bold text-slate-900 text-base">
                    {alert.hospitalId?.hospitalName || 'Hospital'}
                  </h3>
                  <span className="text-xs text-slate-500">
                    {alert.hospitalId?.address}, {alert.hospitalId?.city}
                  </span>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <StatusBadge type="urgency" value={alert.urgency} />
                  <StatusBadge type="alert" value={alert.status} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl text-xs text-center">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Blood Group</span>
                  <span className="font-extrabold text-red-600 text-base">{alert.bloodGroup}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Distance</span>
                  <span className="font-extrabold text-slate-900 font-mono text-base">
                    ~{alert.distanceKm} km
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Channel</span>
                  <span className="font-bold text-slate-700 text-xs block mt-1">In-App & SMS Log</span>
                </div>
              </div>

              {/* Action buttons if not already responded */}
              {alert.status === 'SENT_SIMULATED' || alert.status === 'VIEWED' ? (
                <div className="flex items-center space-x-3 pt-2">
                  <button
                    onClick={() => {
                      setSelectedAlert(alert);
                      setResponseAction('ACCEPT');
                    }}
                    className="flex-1 py-2 px-3 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Accept Alert</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedAlert(alert);
                      setResponseAction('DECLINE');
                    }}
                    className="py-2 px-3 rounded-xl font-bold text-xs text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center justify-center space-x-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Decline</span>
                  </button>
                </div>
              ) : (
                <div className="text-xs text-slate-500 pt-1 flex items-center justify-between border-t border-slate-100">
                  <span>Decision: <strong>{alert.status}</strong></span>
                  {alert.respondedAt && (
                    <span className="font-mono text-[11px] text-slate-400">
                      {new Date(alert.respondedAt).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Response Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(selectedAlert && responseAction)}
        title={responseAction === 'ACCEPT' ? 'Accept Emergency Request' : 'Decline Request'}
        message={`Confirm your decision for ${selectedAlert?.hospitalId?.hospitalName}?`}
        confirmLabel={responding ? 'Submitting...' : 'Confirm'}
        isDangerous={responseAction === 'DECLINE'}
        onConfirm={handleRespond}
        onCancel={() => {
          setSelectedAlert(null);
          setResponseAction(null);
          setResponseNotes('');
        }}
      >
        <div className="mt-2">
          <input
            type="text"
            value={responseNotes}
            onChange={(e) => setResponseNotes(e.target.value)}
            placeholder="Optional message..."
            className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
      </ConfirmationModal>
    </div>
  );
}
