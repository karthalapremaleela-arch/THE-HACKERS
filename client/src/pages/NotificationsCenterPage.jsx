import React, { useState, useEffect } from 'react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import {
  Bell,
  MessageSquare,
  Mail,
  ShieldCheck,
  RotateCw,
  Clock,
  Building2,
  Users,
} from 'lucide-react';

export default function NotificationsCenterPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/notifications');
      setNotifications(res.data.data);
    } catch (err) {
      console.warn('Could not load admin notification logs directly:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Bell className="w-4 h-4 text-red-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-red-600">
              Notification Simulation Hub
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Simulated Emergency Alerts & Delivery Logs
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Inspecting synthetic in-app notifications and simulated SMS dispatch payloads
          </p>
        </div>

        <button
          onClick={fetchNotifications}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors self-start sm:self-auto"
        >
          <RotateCw className="w-4 h-4" />
          <span>Refresh Delivery Logs</span>
        </button>
      </div>

      {/* Demo Architecture Notice Banner */}
      <div className="bg-slate-900 text-slate-300 p-6 rounded-3xl space-y-2 border border-slate-800 text-xs sm:text-sm">
        <div className="flex items-center space-x-2 text-white font-bold text-base">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>Zero Paid API Key Architecture</span>
        </div>
        <p className="text-slate-400 text-xs leading-relaxed max-w-3xl">
          In compliance with the MVP design specifications, real SMS and email APIs (e.g. Twilio, SendGrid) are bypassed. The backend <code>mockNotificationService</code> persists simulated alerts into MongoDB, logs the delivery payload with generated synthetic IDs, and emits real-time updates over Socket.IO.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-400">Loading delivery stream...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-2">
          <Bell className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">No Notification Records</p>
          <p className="text-xs text-slate-400">Submit an emergency blood request to view simulated dispatches.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((item) => (
            <div
              key={item._id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:border-slate-300 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    {item.alertId}
                  </span>
                  <StatusBadge type="urgency" value={item.urgency} />
                  <StatusBadge type="alert" value={item.status} />
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  {new Date(item.createdAt).toLocaleString()}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Medical Facility</span>
                  <span className="font-bold text-slate-900 block">
                    {item.hospitalId?.hospitalName || 'Hospital'}
                  </span>
                  <span className="text-slate-500 text-[11px]">{item.hospitalId?.city}</span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Matched Synthetic Donor</span>
                  <span className="font-bold text-slate-900 block">
                    {item.donorId?.displayName || 'Mock Donor'}
                  </span>
                  <span className="text-red-600 font-extrabold text-[11px]">
                    Group: {item.bloodGroup} • Distance: ~{item.distanceKm} km
                  </span>
                </div>

                {/* Simulated Payload Box */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    Simulated SMS Payload Log
                  </span>
                  <div className="text-[11px] font-mono text-slate-700 truncate">
                    Phone: {item.simulatedDeliveryDetails?.mockSmsPhone || '+1-555-MOCK'}
                  </div>
                  <div className="text-[11px] font-mono text-slate-700 truncate">
                    MsgID: {item.simulatedDeliveryDetails?.simulatedProviderMessageId || 'MOCK-DISPATCH'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
