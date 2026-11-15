import React, { useEffect, useState } from 'react';
import { fetchPathway } from '../api';
import { Skull, CheckCircle2, Lock, Flame, Award, Coins } from 'lucide-react';

export default function LevelPathwayScreen({ onSelectLevel, profileData }) {
  const [pathway, setPathway] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPathway()
      .then(setPathway)
      .catch((err) => console.error('Failed to load pathway:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !pathway) {
    return (
      <div className="p-8 text-center text-slate-400 text-sm">
        Loading Level Pathway...
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5">
      {/* Top Banner / Stats */}
      <div className="bg-gradient-to-br from-indigo-950/80 to-slate-900 border border-indigo-900/50 rounded-2xl p-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold text-xl">
            R{pathway.rank}
          </div>
          <div>
            <div className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">Current Athlete Rank</div>
            <div className="text-base font-bold text-white">Level {pathway.current_level}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
            <Coins className="w-4 h-4" />
            <span>{pathway.tokens}</span>
          </div>
        </div>
      </div>

      {/* Cycle Progress indicator */}
      <div className="flex items-center justify-between px-2 text-xs">
        <span className="text-slate-400">Boss Progress Cycle</span>
        <span className="font-semibold text-indigo-400">{pathway.cycle_progress}</span>
      </div>

      {/* Vertical Pathway Nodes */}
      <div className="relative py-2">
        {/* Connecting vertical line */}
        <div className="absolute left-1/2 top-4 bottom-4 w-1 bg-gradient-to-b from-indigo-500 via-indigo-900 to-slate-800 -translate-x-1/2 -z-0" />

        <div className="space-y-6 relative z-10">
          {pathway.nodes.map((node, idx) => {
            const isCompleted = node.status === 'completed';
            const isCurrent = node.status === 'current';
            const isLocked = node.status === 'locked';

            return (
              <div
                key={node.level}
                className={`flex items-center ${idx % 2 === 0 ? 'flex-row' : 'flex-row-reverse'} justify-between gap-4`}
              >
                {/* Node Label Card */}
                <div className={`w-[42%] p-3 rounded-xl border text-xs transition-all ${
                  isCurrent
                    ? 'bg-indigo-900/50 border-indigo-500 shadow-md shadow-indigo-600/30 text-white'
                    : isCompleted
                    ? 'bg-slate-900/60 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-900/40 border-slate-800 text-slate-500'
                }`}>
                  <div className="font-bold flex items-center gap-1.5">
                    {node.is_boss && <Skull className="w-3.5 h-3.5 text-rose-400" />}
                    <span>{node.title}</span>
                  </div>
                  <div className="text-[10px] mt-0.5 opacity-80">
                    {node.is_boss ? 'Cycle Boss (+5 tokens)' : '3 Daily Quests (+1 token)'}
                  </div>
                </div>

                {/* Node Center Icon / Button */}
                <button
                  onClick={() => onSelectLevel(node.level)}
                  disabled={isLocked}
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 shadow-lg transition-all ${
                    isCurrent
                      ? 'bg-indigo-600 border-white text-white ring-4 ring-indigo-500/30 scale-110 animate-pulse'
                      : isCompleted
                      ? 'bg-emerald-600 border-emerald-400 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-600 cursor-not-allowed'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : node.is_boss ? (
                    <Skull className="w-6 h-6 text-rose-300" />
                  ) : isLocked ? (
                    <Lock className="w-4 h-4" />
                  ) : (
                    <span className="font-bold text-sm">{node.level}</span>
                  )}
                </button>

                {/* Spacer for alternating layout */}
                <div className="w-[42%]" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
