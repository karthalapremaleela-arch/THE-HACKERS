import React from 'react';
import { Heart, ShieldCheck, Info } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-8 border-t border-slate-800 text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 pb-8 border-b border-slate-800">
          {/* Brand & Purpose */}
          <div>
            <div className="flex items-center space-x-2 text-white font-extrabold text-base mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
              <span>BloodConnect</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              AI-Powered Emergency Blood Donor Matching and Simulated Alert Platform.
              Connecting verified medical facilities with eligible mock donors in critical seconds.
            </p>
          </div>

          {/* Medical Disclaimer Banner */}
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
            <div className="flex items-center space-x-2 text-amber-400 font-semibold mb-2">
              <Info className="w-4 h-4 flex-shrink-0" />
              <span>Medical Safety Notice</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Final blood-group compatibility and transfusion suitability must be confirmed by qualified hospital or blood-bank personnel. This application performs synthetic proximity matching and does not make clinical decisions.
            </p>
          </div>

          {/* Synthetic Demo Architecture */}
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
            <div className="flex items-center space-x-2 text-emerald-400 font-semibold mb-2">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              <span>Simulated Architecture</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              100% synthetic mock dataset. Powered by the Haversine great-circle distance algorithm, local donor discovery provider, and in-app simulated SMS/email dispatch logging.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between text-slate-500 text-xs space-y-2 sm:space-y-0">
          <p>© {new Date().getFullYear()} BloodConnect MVP. Designed for Hackathon Demonstration.</p>
          <p className="flex items-center space-x-1">
            <span>Built with MERN Stack & Tailwind CSS</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
