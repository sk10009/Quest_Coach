import React, { useEffect, useState } from 'react';
import { fetchPathway } from '../api';
import { Skull, CheckCircle2, Lock, Flame, Award, Coins, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

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

  // Reverse nodes so Level 1 is at the bottom, climbing up to Boss Gate at top
  const nodesReversed = [...pathway.nodes].reverse();
  const currentLevel = pathway.current_level;

  return (
    <div className="p-4 space-y-5">
      {/* Top Banner / Stats */}
      <div className="glass-aero rounded-2xl p-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-lime-600 to-emerald-500 border border-white/40 flex items-center justify-center text-white font-bold text-xl glow-xbox">
            R{pathway.rank}
          </div>
          <div>
            <div className="text-[10px] text-lime-400 font-semibold uppercase tracking-wider">Bottom-Up Pathway</div>
            <div className="text-base font-extrabold text-white">Current: Level {currentLevel}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold glow-gold">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>{pathway.tokens}</span>
          </div>
        </div>
      </div>

      {/* Cycle Progress indicator */}
      <div className="flex items-center justify-between px-2 text-xs">
        <span className="text-slate-300">Boss Ascent Cycle</span>
        <span className="font-bold text-lime-400">{pathway.cycle_progress}</span>
      </div>

      {/* Vertical Pathway Nodes (Bottom-to-Top) */}
      <div className="relative py-4 px-2">
        {/* Connecting vertical line */}
        <div className="absolute left-1/2 top-6 bottom-6 w-1.5 bg-gradient-to-t from-emerald-500 via-sky-500 to-indigo-600 -translate-x-1/2 -z-0 rounded-full" />

        <div className="space-y-6 relative z-10">
          {nodesReversed.map((node, idx) => {
            const isCompleted = node.status === 'completed';
            const isCurrent = node.status === 'current';
            const isLocked = node.status === 'locked';

            return (
              <div
                key={node.level}
                className={`flex items-center ${idx % 2 === 0 ? 'flex-row' : 'flex-row-reverse'} justify-between gap-4`}
              >
                {/* Node Label Card with Speech Bubble on Current */}
                <div className={`w-[40%] p-3 rounded-2xl border text-xs transition-all glass-aero ${
                  isCurrent
                    ? 'border-lime-400 shadow-lg shadow-lime-500/30 text-white ring-2 ring-lime-400/50'
                    : isCompleted
                    ? 'border-emerald-500/40 text-emerald-200'
                    : 'border-white/10 text-slate-400 opacity-70'
                }`}>
                  <div className="font-bold flex items-center gap-1.5">
                    {node.is_boss && <Skull className="w-3.5 h-3.5 text-rose-400" />}
                    <span>{node.title}</span>
                  </div>
                  <div className="text-[10px] mt-0.5 opacity-80">
                    {node.is_boss ? 'Boss Gate (+5 Tokens)' : '3 Pillar Quests'}
                  </div>

                  {/* Speech bubble for current athlete milestone */}
                  {isCurrent && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 p-1.5 rounded-lg bg-lime-500/20 border border-lime-500/40 text-[10px] text-lime-300 font-semibold flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-lime-400 shrink-0" />
                      <span>Climbing to glory! Let's train!</span>
                    </motion.div>
                  )}
                </div>

                {/* Node Center Icon / Button with Custom Athlete Sprite on Current */}
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={() => onSelectLevel(node.level)}
                  disabled={isLocked}
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 shadow-xl transition-all relative ${
                    isCurrent
                      ? 'bg-gradient-to-tr from-lime-600 to-emerald-400 border-white text-white ring-4 ring-lime-400/40 scale-110 glow-xbox'
                      : isCompleted
                      ? 'bg-emerald-600 border-emerald-300 text-white'
                      : 'bg-slate-800/80 border-slate-700 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {isCurrent && (
                    <div className="absolute -top-7 text-xs font-black px-2 py-0.5 rounded-full bg-lime-400 text-slate-955 shadow glow-xbox whitespace-nowrap">
                      🏃 Athlete
                    </div>
                  )}

                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : node.is_boss ? (
                    <Skull className="w-6 h-6 text-rose-300" />
                  ) : isLocked ? (
                    <Lock className="w-4 h-4" />
                  ) : (
                    <span className="font-extrabold text-sm">{node.level}</span>
                  )}
                </motion.button>

                <div className="w-[40%]" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
