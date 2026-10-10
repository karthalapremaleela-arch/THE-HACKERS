import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function SyntheticNotice() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <aside aria-label="Demo notice" className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs sm:text-sm text-amber-900 flex items-center justify-between">
      <div className="max-w-7xl mx-auto flex items-center space-x-2 w-full justify-center text-center">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <p className="font-medium">
          <span className="font-bold uppercase tracking-wide bg-amber-200/80 text-amber-900 px-1.5 py-0.5 rounded mr-1.5 text-xs">
            Hackathon Demo Mode
          </span>
          All donors, hospitals, coordinates, and emergency alerts are synthetic simulations. No real people are contacted.
        </p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-amber-700 hover:text-amber-900 p-1 rounded transition-colors"
        title="Dismiss notice"
      >
        <X className="w-4 h-4" />
      </button>
    </aside>
  );
}
