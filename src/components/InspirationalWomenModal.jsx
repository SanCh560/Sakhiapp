import React, { useState } from 'react';
import { X, Quote, Sparkles, Heart, Compass, Shield, Award, ChevronLeft, ChevronRight } from 'lucide-react';
import { INSPIRATIONAL_WOMEN } from '../data/inspirationalWomenData';

export default function InspirationalWomenModal({ isOpen, onClose }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!isOpen) return null;

  const currentWoman = INSPIRATIONAL_WOMEN[activeIndex];

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % INSPIRATIONAL_WOMEN.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + INSPIRATIONAL_WOMEN.length) % INSPIRATIONAL_WOMEN.length);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 relative space-y-5 max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-xs">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 leading-tight">Inspirational Women & Pioneers</h3>
            <p className="text-xs text-slate-500 font-medium">Wisdom, courage, and motivational quotes from legendary female trailblazers</p>
          </div>
        </div>

        {/* Featured Hero Carousel Card */}
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-violet-950 text-white shadow-xl relative overflow-hidden space-y-4">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-extrabold uppercase tracking-wider text-violet-300 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" /> {currentWoman.badge}
            </span>
            <span className="text-xs text-slate-400 font-bold">
              {activeIndex + 1} of {INSPIRATIONAL_WOMEN.length}
            </span>
          </div>

          <div className="flex items-start gap-4">
            <img
              src={currentWoman.avatar}
              alt={currentWoman.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-violet-400 shadow-md shrink-0"
            />
            <div>
              <h4 className="text-lg font-black text-white leading-snug">{currentWoman.name}</h4>
              <p className="text-xs text-violet-200 font-semibold">{currentWoman.role}</p>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">{currentWoman.story}</p>
            </div>
          </div>

          {/* Featured Quote Box */}
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 space-y-2 relative">
            <Quote className="w-6 h-6 text-violet-400/40 absolute top-2 right-2" />
            <p className="text-sm font-extrabold text-violet-100 italic leading-relaxed">
              {currentWoman.quote}
            </p>
            <span className="text-[10px] text-slate-400 font-bold block text-right">— {currentWoman.name}</span>
          </div>

          {/* Carousel Navigation Buttons */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={handlePrev}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-extrabold transition-all flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <button
              onClick={handleNext}
              className="px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-black transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              Next Pioneer <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Grid of All Pioneers */}
        <div className="space-y-2">
          <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">All Inspirational Pioneers</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {INSPIRATIONAL_WOMEN.map((woman, idx) => (
              <div
                key={woman.id}
                onClick={() => setActiveIndex(idx)}
                className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-2.5 ${
                  activeIndex === idx
                    ? 'bg-violet-50 border-violet-500 ring-2 ring-violet-500/20 shadow-xs'
                    : 'bg-slate-50 border-slate-200 hover:bg-white'
                }`}
              >
                <img
                  src={woman.avatar}
                  alt={woman.name}
                  className="w-9 h-9 rounded-xl object-cover shrink-0 border border-slate-200"
                />
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-extrabold text-slate-900 truncate block">{woman.name}</span>
                  <span className="text-[9px] text-slate-500 font-semibold truncate block">{woman.badge}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
