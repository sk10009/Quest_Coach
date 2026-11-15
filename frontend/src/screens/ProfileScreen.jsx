import React from 'react';
import { User, ShieldCheck, Coins, Award, Brain, Dumbbell, Apple, Heart, BatteryCharging, Calendar, AlertCircle } from 'lucide-react';

export default function ProfileScreen({ profile, onClose }) {
  if (!profile) return null;

  const { rank, level, tokens, xp, inferred_mood, inferred_fatigue, weakest_pillar, boss_wins, simulated_date } = profile;
  const user = profile.profile || {};

  return (
    <div className="p-4 space-y-4 max-h-[760px] overflow-y-auto">
      {/* Top Profile Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-950/70 to-slate-900 border border-indigo-800/40 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-300 font-bold text-xl">
            R{rank || 1}
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white">Athlete Status</h2>
            <div className="text-xs text-indigo-300">
              Rank {rank || 1} · Level {level || 1} · {xp || 0} XP
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Simulated Date: {simulated_date || 'Today'}
            </div>
          </div>
        </div>

        {/* High-level stats */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-indigo-900/40 text-center">
          <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[10px] text-slate-400">Tokens</div>
            <div className="text-sm font-bold text-amber-400 mt-0.5">🪙 {tokens ?? 5}</div>
          </div>
          <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[10px] text-slate-400">Boss Wins</div>
            <div className="text-sm font-bold text-emerald-400 mt-0.5">⚔️ {boss_wins ?? 0}</div>
          </div>
          <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[10px] text-slate-400">BMI</div>
            <div className="text-sm font-bold text-indigo-300 mt-0.5">{user.bmi || 22.0}</div>
          </div>
        </div>
      </div>

      {/* Passive Latent State Estimator (Zero Sliders) */}
      <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-3">
        <span className="text-xs font-bold text-slate-300">Passive Latent States (Passive Inference)</span>
        
        {/* Mood */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-400" />
              <span>Inferred Mood</span>
            </span>
            <span className="font-bold text-white">{Math.round((inferred_mood || 0.75) * 100)}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-rose-500 to-emerald-400"
              style={{ width: `${(inferred_mood || 0.75) * 100}%` }}
            />
          </div>
        </div>

        {/* Fatigue */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <BatteryCharging className="w-3.5 h-3.5 text-amber-400" />
              <span>Inferred Fatigue</span>
            </span>
            <span className="font-bold text-white">{Math.round((inferred_fatigue || 0.25) * 100)}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-rose-500"
              style={{ width: `${(inferred_fatigue || 0.25) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Agent-Detected Strengths & Weaknesses (Bayesian Player Model) */}
      <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-2">
        <span className="text-xs font-bold text-slate-300">Player Model Telemetry</span>
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">Weakest Pillar (Targeted by Boss):</span>
          <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-400 font-bold uppercase">
            {weakest_pillar || 'Exercise'}
          </span>
        </div>
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">Assigned Fitness Goal:</span>
          <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold uppercase">
            {user.goal || 'Maintain'}
          </span>
        </div>
      </div>

      {/* Medical Disclaimer */}
      <div className="pt-2 border-t border-slate-800 flex items-center justify-center gap-1.5 text-xs text-slate-500">
        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
        <span className="font-medium text-center">General guidance only, not medical advice</span>
      </div>
    </div>
  );
}
