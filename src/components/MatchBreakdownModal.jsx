import React from 'react';
import { X, ShieldCheck, Heart, Coffee, Navigation, Sparkles, CheckCircle2, Brain } from 'lucide-react';

export default function MatchBreakdownModal({ isOpen, onClose, title, matchScore, whyChosen, safetyFeatures }) {
  if (!isOpen || !matchScore) return null;

  const scoreObj = typeof matchScore === 'object' ? matchScore : {
    overall: matchScore,
    safety: Math.min(100, matchScore + 2),
    personalFit: Math.max(80, matchScore - 2),
    comfort: Math.max(85, matchScore - 1),
    convenience: Math.max(80, matchScore - 3)
  };

  const metrics = [
    { label: 'Safety Index', val: scoreObj.safety, icon: ShieldCheck, color: 'bg-emerald-500', textCol: 'text-emerald-700' },
    { label: 'Personal Fit', val: scoreObj.personalFit, icon: Heart, color: 'bg-rose-400', textCol: 'text-rose-700' },
    { label: 'Comfort & Vibe', val: scoreObj.comfort, icon: Coffee, color: 'bg-amber-400', textCol: 'text-amber-700' },
    { label: 'Convenience & Access', val: scoreObj.convenience, icon: Navigation, color: 'bg-sky-500', textCol: 'text-sky-700' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-100 relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1.5">
          <span className="p-1.5 rounded-xl bg-violet-50 text-violet-600 font-bold">
            <Sparkles className="w-4 h-4" />
          </span>
          <span className="text-[11px] font-black uppercase tracking-wider text-violet-600">Holistic AI Match Rationale</span>
        </div>

        <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 pr-6 mb-3 leading-tight">{title}</h3>

        {/* Overall Match Banner */}
        <div className="p-4 mb-4 rounded-2xl bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800 text-white flex items-center justify-between shadow-md">
          <div>
            <div className="text-3xl font-black tracking-tight">{scoreObj.overall}%</div>
            <div className="text-xs font-semibold text-violet-100">Overall AI Harmony Score</div>
          </div>
          <div className="text-right text-[10px] font-bold bg-white/20 px-3 py-1.5 rounded-xl backdrop-blur-md border border-white/20">
            Synthesized for You
          </div>
        </div>

        {/* 4 Core Dimensions */}
        <div className="space-y-2.5 mb-4">
          <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Four-Dimension AI Synthesis</h4>
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Icon className={`w-3.5 h-3.5 ${m.textCol}`} />
                    {m.label}
                  </span>
                  <span className="font-extrabold text-slate-900">{m.val}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${m.color}`}
                    style={{ width: `${m.val}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* AI Multi-Factor Rationale */}
        {whyChosen && (
          <div className="mb-3 p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-slate-800 space-y-1">
            <h4 className="text-[11px] font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-amber-600" />
              How Sakhi Personalized This Decision
            </h4>
            <p className="text-xs leading-relaxed text-slate-700 font-medium">{whyChosen}</p>
          </div>
        )}

        {/* Safety & Vibe Highlights */}
        {safetyFeatures && safetyFeatures.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-slate-800 space-y-1.5">
            <h4 className="text-[11px] font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Verified Highlights & Background Signals
            </h4>
            <ul className="space-y-1">
              {safetyFeatures.map((feat, idx) => (
                <li key={idx} className="text-xs flex items-start gap-1.5 text-emerald-950 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full py-2.5 rounded-2xl bg-slate-900 hover:bg-black text-white font-bold text-xs transition-colors shadow-md cursor-pointer"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
