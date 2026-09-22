import React from 'react';
import { Sparkles, Star } from 'lucide-react';

export default function MatchScoreBadge({ score, onClick }) {
  if (!score) return null;

  const scoreVal = typeof score === 'object' ? score.overall : score;

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-950 border border-violet-200 transition-all font-extrabold text-[11px] cursor-pointer shadow-2xs group"
      title="Click to view explainable 4D AI match rationale"
    >
      <Sparkles className="w-3 h-3 text-violet-600 group-hover:scale-110 transition-transform" />
      <span>{scoreVal}% Match</span>
    </button>
  );
}
