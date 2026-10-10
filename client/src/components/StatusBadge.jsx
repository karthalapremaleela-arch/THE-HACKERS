import React from 'react';
import { AlertCircle, Clock, CheckCircle2, XCircle, ShieldAlert } from 'lucide-react';

export default function StatusBadge({ type, value, size = 'sm' }) {
  const normalized = (value || '').toUpperCase();
  const sizeClasses = size === 'lg' ? 'px-3 py-1 text-sm font-semibold' : 'px-2.5 py-0.5 text-xs font-medium';

  // Urgency Badges
  if (type === 'urgency') {
    if (normalized === 'CRITICAL') {
      return (
        <span className={`inline-flex items-center space-x-1 rounded-full bg-red-100 text-red-800 border border-red-300 animate-pulse-fast ${sizeClasses}`}>
          <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
          <span>CRITICAL</span>
        </span>
      );
    }
    if (normalized === 'HIGH') {
      return (
        <span className={`inline-flex items-center space-x-1 rounded-full bg-orange-100 text-orange-800 border border-orange-200 ${sizeClasses}`}>
          <AlertCircle className="w-3.5 h-3.5 text-orange-600" />
          <span>HIGH</span>
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center space-x-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200 ${sizeClasses}`}>
        <Clock className="w-3.5 h-3.5 text-blue-600" />
        <span>NORMAL</span>
      </span>
    );
  }

  // Hospital Approval Status
  if (type === 'approval') {
    if (normalized === 'APPROVED') {
      return (
        <span className={`inline-flex items-center space-x-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 ${sizeClasses}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Verified (Demo)</span>
        </span>
      );
    }
    if (normalized === 'PENDING') {
      return (
        <span className={`inline-flex items-center space-x-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 ${sizeClasses}`}>
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span>Pending Approval</span>
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center space-x-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300 ${sizeClasses}`}>
        <XCircle className="w-3.5 h-3.5 text-rose-600" />
        <span>Rejected</span>
      </span>
    );
  }

  // Request Status
  if (type === 'request') {
    if (normalized === 'ACTIVE') {
      return (
        <span className={`inline-flex items-center space-x-1 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping mr-1"></span>
          <span>ACTIVE</span>
        </span>
      );
    }
    if (normalized === 'FULFILLED') {
      return (
        <span className={`inline-flex items-center space-x-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 ${sizeClasses}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>FULFILLED</span>
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center space-x-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}>
        <XCircle className="w-3.5 h-3.5 text-slate-500" />
        <span>{normalized}</span>
      </span>
    );
  }

  // Alert Status
  if (type === 'alert') {
    if (normalized === 'ACCEPTED') {
      return (
        <span className={`inline-flex items-center space-x-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 ${sizeClasses}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>ACCEPTED</span>
        </span>
      );
    }
    if (normalized === 'DECLINED') {
      return (
        <span className={`inline-flex items-center space-x-1 rounded-full bg-rose-100 text-rose-800 border border-rose-200 ${sizeClasses}`}>
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          <span>DECLINED</span>
        </span>
      );
    }
    if (normalized === 'VIEWED') {
      return (
        <span className={`inline-flex items-center space-x-1 rounded-full bg-purple-100 text-purple-800 border border-purple-200 ${sizeClasses}`}>
          <span>VIEWED</span>
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center space-x-1 rounded-full bg-sky-100 text-sky-800 border border-sky-200 ${sizeClasses}`}>
        <span>SENT (SIMULATED)</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center rounded-full bg-slate-100 text-slate-800 ${sizeClasses}`}>
      {value}
    </span>
  );
}
