import React from 'react';
import { WifiOff, PhoneCall, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function OfflineBanner({ isOffline, onToggle, onOpenSOS }) {
  if (!isOffline) return null;

  return (
    <div className="bg-slate-900 text-slate-100 px-4 py-2.5 shadow-md flex items-center justify-between text-xs border-b border-slate-700 animate-slide-down">
      <div className="flex items-center gap-2">
        <span className="p-1 rounded-md bg-amber-500/20 text-amber-400">
          <WifiOff className="w-4 h-4 animate-pulse" />
        </span>
        <div>
          <span className="font-semibold text-white">Offline Mode Active</span>
          <span className="hidden sm:inline text-slate-300 ml-1.5">
            — Maps, Emergency Flashcards & Safe Routes cached locally.
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenSOS}
          className="px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1 transition-colors text-xs"
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>SOS / Help</span>
        </button>
      </div>
    </div>
  );
}
