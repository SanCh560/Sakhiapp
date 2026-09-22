import React from 'react';
import { X, PhoneCall, ShieldAlert } from 'lucide-react';

export default function EmergencyModal({ isOpen, onClose, destinationData }) {
  if (!isOpen || !destinationData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 text-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-800 relative space-y-4 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </span>
          <div>
            <h3 className="text-base font-extrabold text-white">{destinationData.cityName} Emergency & SOS Hub</h3>
            <p className="text-xs text-slate-400">Pre-cached offline emergency numbers & translator</p>
          </div>
        </div>

        {/* Emergency Call Buttons */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">One-Tap Direct Dial</span>
          {destinationData.emergencyContacts.map((contact, idx) => (
            <a
              key={idx}
              href={`tel:${contact.number}`}
              className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700/80 flex items-center justify-between transition-colors"
            >
              <div>
                <div className="text-xs font-bold text-white">{contact.name}</div>
                <div className="text-[11px] text-slate-400 font-medium">{contact.label}</div>
              </div>
              <span className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm">
                <PhoneCall className="w-3.5 h-3.5" /> Call {contact.number}
              </span>
            </a>
          ))}
        </div>

        {/* Local Emergency Cards */}
        {destinationData.offlineFlashcards && (
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Show to Police or Passersby</span>
            {destinationData.offlineFlashcards.map((card, idx) => (
              <div key={idx} className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 space-y-1">
                <div className="text-xs text-amber-300 font-bold">{card.english}</div>
                <div className="text-base font-extrabold text-white tracking-wide">{card.translation}</div>
                {card.phonetic && <div className="text-[11px] text-slate-400 italic font-mono">"{card.phonetic}"</div>}
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
        >
          Close Emergency Hub
        </button>
      </div>
    </div>
  );
}
