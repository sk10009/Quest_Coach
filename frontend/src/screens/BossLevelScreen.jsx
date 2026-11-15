import React, { useState } from 'react';
import { Skull, Award, Coins, Flame, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import { defeatBoss } from '../api';
import confetti from 'canvas-confetti';

export default function BossLevelScreen({ bossChallenge, onVictory, onBack }) {
  const [fighting, setFighting] = useState(false);
  const [bossHp, setBossHp] = useState(100);

  const handleFight = async () => {
    setFighting(true);
    // Dynamic attack animation
    for (let hp = 100; hp >= 0; hp -= 25) {
      setBossHp(hp);
      await new Promise((r) => setTimeout(r, 200));
    }

    try {
      const res = await defeatBoss();
      confetti({
        particleCount: 100,
        spread: 90,
        origin: { y: 0.5 }
      });
      setTimeout(() => {
        onVictory(res);
      }, 1200);
    } catch (err) {
      console.error(err);
      setFighting(false);
      setBossHp(100);
    }
  };

  if (!bossChallenge) {
    return (
      <div className="p-8 text-center text-slate-400 text-sm">
        No active boss challenge detected.
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5 text-center">
      {/* Boss Encounter Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold uppercase tracking-wider animate-pulse">
          <Skull className="w-4 h-4" />
          <span>Day 5 Cycle Boss Encounter</span>
        </div>
        <h1 className="text-xl font-black text-white">{bossChallenge.boss_name}</h1>
        <p className="text-xs text-slate-400">
          Targeted challenge evolved specifically against your weakest habit pillar: <span className="font-bold uppercase text-rose-400">{bossChallenge.weakest_pillar}</span>
        </p>
      </div>

      {/* Boss Avatar & HP Bar */}
      <div className="p-6 rounded-3xl bg-gradient-to-b from-rose-950/40 to-slate-900 border border-rose-800/40 space-y-4 shadow-2xl">
        <div className="w-24 h-24 mx-auto rounded-2xl bg-rose-900/30 border-2 border-rose-500/60 flex items-center justify-center shadow-lg shadow-rose-950/80">
          <Skull className="w-14 h-14 text-rose-400 animate-bounce" />
        </div>

        {/* Boss HP */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold text-rose-300">
            <span>Boss Health</span>
            <span>{bossHp} / 100 HP</span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden border border-rose-900/50">
            <div
              className="h-full bg-gradient-to-r from-rose-600 to-amber-500 transition-all duration-300"
              style={{ width: `${bossHp}%` }}
            />
          </div>
        </div>

        {/* Challenge Requirements */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-left space-y-1.5">
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>{bossChallenge.challenge_title}</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {bossChallenge.description}
          </p>
          <div className="text-[11px] font-semibold text-emerald-400 pt-1">
            Required Metric: {bossChallenge.target_metric}
          </div>
        </div>
      </div>

      {/* Victory Rewards */}
      <div className="flex items-center justify-around p-3 rounded-2xl bg-slate-800/60 border border-slate-700 text-xs">
        <div className="flex items-center gap-1.5 text-indigo-300 font-bold">
          <Award className="w-4 h-4 text-indigo-400" />
          <span>+150 XP</span>
        </div>
        <div className="flex items-center gap-1.5 text-amber-300 font-bold">
          <Coins className="w-4 h-4 text-amber-400" />
          <span>+5 Tokens</span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>+1 Rank</span>
        </div>
      </div>

      {/* Fight Action Button */}
      <button
        onClick={handleFight}
        disabled={fighting || bossHp <= 0}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-extrabold text-sm shadow-xl shadow-rose-600/30 transition-all active:scale-95 disabled:opacity-50"
      >
        {fighting ? 'Striking Boss...' : 'Prove Mastery & Defeat Boss'}
      </button>

      <button
        onClick={onBack}
        className="text-xs text-slate-500 hover:text-slate-300 font-medium"
      >
        Back to Dashboard
      </button>
    </div>
  );
}
