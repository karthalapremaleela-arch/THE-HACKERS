import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  ShieldAlert,
  Clock,
  Compass,
  FileText,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'ANY'];

export default function CreateRequestPage() {
  const navigate = useNavigate();

  const [bloodGroup, setBloodGroup] = useState('O-');
  const [unitsRequired, setUnitsRequired] = useState(2);
  const [urgency, setUrgency] = useState('CRITICAL');
  const [searchRadiusKm, setSearchRadiusKm] = useState(10);
  const [requiredByHours, setRequiredByHours] = useState(2);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const requiredByDate = new Date(Date.now() + requiredByHours * 3600000).toISOString();

      const res = await api.post('/requests', {
        bloodGroup,
        unitsRequired: Number(unitsRequired),
        urgency,
        searchRadiusKm: Number(searchRadiusKm),
        requiredBy: requiredByDate,
        notes: notes || undefined,
      });

      const newRequestId = res.data.data.request._id;
      navigate(`/hospital/request/${newRequestId}`);
    } catch (err) {
      setError(
        err.response?.data?.details
          ? err.response.data.details.map((d) => d.message).join(', ')
          : err.response?.data?.error || 'Failed to submit emergency request.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6">
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xl space-y-6">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold mb-2">
            <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
            <span>Emergency Triage Workflow</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Create Emergency Blood Request
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Searches the mock donor discovery dataset, ranks eligible donors by distance, and dispatches simulated alerts.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Blood Group Selection Grid */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Requested Blood Group
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
              {BLOOD_GROUPS.map((bg) => (
                <button
                  key={bg}
                  type="button"
                  onClick={() => setBloodGroup(bg)}
                  className={`py-2.5 rounded-xl text-sm font-extrabold transition-all border ${
                    bloodGroup === bg
                      ? 'bg-red-600 text-white border-red-600 shadow-md scale-105'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-red-300 hover:bg-red-50/50'
                  }`}
                >
                  {bg}
                </button>
              ))}
            </div>

            {bloodGroup === 'ANY' && (
              <div className="mt-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start space-x-2">
                <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p>
                  <strong>Exploratory Search:</strong> Requesting "ANY" will match all available donors within radius regardless of blood type. Final blood-group compatibility and transfusion suitability must be confirmed by qualified hospital or blood-bank personnel.
                </p>
              </div>
            )}
          </div>

          {/* Units Required & Urgency Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Units Required
              </label>
              <input
                type="number"
                min="1"
                max="20"
                required
                value={unitsRequired}
                onChange={(e) => setUnitsRequired(e.target.value)}
                className="w-full px-4 py-2.5 text-base font-bold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Urgency Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['CRITICAL', 'HIGH', 'NORMAL'].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setUrgency(lvl)}
                    className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${
                      urgency === lvl
                        ? lvl === 'CRITICAL'
                          ? 'bg-red-600 text-white border-red-600 shadow-md animate-pulse-fast'
                          : lvl === 'HIGH'
                          ? 'bg-orange-600 text-white border-orange-600 shadow-md'
                          : 'bg-blue-600 text-white border-blue-600 shadow-md'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Search Radius Slider */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                <Compass className="w-4 h-4 text-red-600" />
                <span>Search Radius (Haversine Straight-line Distance)</span>
              </span>
              <span className="font-mono font-bold text-base text-red-600">{searchRadiusKm} km</span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={searchRadiusKm}
              onChange={(e) => setSearchRadiusKm(e.target.value)}
              className="w-full accent-red-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>1 km (Immediate)</span>
              <span>10 km (Standard Urban)</span>
              <span>100 km (Regional)</span>
            </div>
          </div>

          {/* Required By Timeline */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-red-600" />
              <span>Required-By Window</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: '1 Hour', hours: 1 },
                { label: '2 Hours (Demo)', hours: 2 },
                { label: '6 Hours', hours: 6 },
                { label: '24 Hours', hours: 24 },
              ].map((opt) => (
                <button
                  key={opt.hours}
                  type="button"
                  onClick={() => setRequiredByHours(opt.hours)}
                  className={`py-2 rounded-xl text-xs font-semibold transition-all border ${
                    requiredByHours === opt.hours
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Non-identifying Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Clinical Context / Case Notes (Non-Identifying)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Emergency trauma unit arrival. Immediate standby units needed."
              className="w-full p-3 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Medical Notice */}
          <div className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
            <strong>Medical Notice:</strong> Straight-line distance calculation via Haversine formula is used for rapid proximity ranking. Travel time may vary based on traffic.
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-4 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-xl shadow-red-600/25 transition-all hover:-translate-y-0.5 disabled:opacity-50 text-base flex items-center justify-center space-x-2"
          >
            <span>{loading ? 'Executing Haversine Matching...' : 'Submit Emergency Request & Alert Donors'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
