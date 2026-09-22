import React from 'react';
import { Compass, Plane, Sun, HeartHandshake, Sparkles } from 'lucide-react';

export default function BottomNav({ activeStage, setActiveStage, onOpenChat }) {
  const tabs = [
    { id: 'before-trip', label: 'Before', icon: Compass },
    { id: 'arrival', label: 'Arrival', icon: Plane },
    { id: 'solo-days', label: 'Solo Days', icon: Sun },
    { id: 'goodbye', label: 'Goodbye', icon: HeartHandshake }
  ];

  return (
    <div className="sticky bottom-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 shadow-lg">
      <div className="max-w-xl mx-auto flex items-center justify-between gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeStage === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveStage(tab.id)}
              className={`flex-1 py-1.5 px-2 rounded-2xl flex flex-col items-center gap-1 transition-all cursor-pointer ${
                isActive
                  ? 'bg-violet-50 text-violet-700 font-extrabold scale-102 shadow-2xs ring-1 ring-violet-200/50'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 font-medium'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-violet-600' : 'text-slate-400'}`} />
              <span className="text-[10px] tracking-tight">{tab.label}</span>
            </button>
          );
        })}

        {/* Floating AI Companion Chat Button */}
        <button
          onClick={onOpenChat}
          className="ml-1 p-2.5 sm:px-3.5 sm:py-2 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-extrabold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          title="Open Sakhi AI Companion Chat"
        >
          <Sparkles className="w-4 h-4 text-violet-200" />
          <span className="hidden xs:inline">Sakhi AI</span>
        </button>
      </div>
    </div>
  );
}
