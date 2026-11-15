import React, { useEffect, useState } from 'react';
import { fetchLevelToday, skipTask, activateRestDay } from '../api';
import { Dumbbell, Brain, Apple, Sparkles, CheckCircle, Coins, ShieldAlert, FastForward } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function LevelScreen({ onOpenLogger, onRefreshState }) {
  const [levelData, setLevelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState(null);

  const loadData = async () => {
    try {
      const data = await fetchLevelToday();
      setLevelData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerConfetti = () => {
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleSkip = async (pillar) => {
    setActionError(null);
    try {
      await skipTask(pillar);
      triggerConfetti();
      await loadData();
      if (onRefreshState) onRefreshState();
    } catch (err) {
      setActionError(err.message || 'Skip failed');
    }
  };

  const handleRestDay = async () => {
    setActionError(null);
    try {
      await activateRestDay();
      triggerConfetti();
      await loadData();
      if (onRefreshState) onRefreshState();
    } catch (err) {
      setActionError(err.message || 'Rest-day activation failed');
    }
  };

  if (loading || !levelData) {
    return <div className="p-8 text-center text-slate-400 text-sm">Loading Daily Quests...</div>;
  }

  const getPillarIcon = (pillar) => {
    switch (pillar) {
      case 'exercise': return <Dumbbell className="w-5 h-5 text-indigo-400" />;
      case 'mindful': return <Brain className="w-5 h-5 text-teal-400" />;
      case 'nutrition': return <Apple className="w-5 h-5 text-emerald-400" />;
      default: return <Sparkles className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <div className="p-4 space-y-5">
      {/* Level Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
            {levelData.is_boss_day ? '⚔️ Boss Encounter' : `Level ${levelData.level} Training`}
          </span>
          <h2 className="text-lg font-bold text-white">Daily 3-Pillar Quests</h2>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
          <Coins className="w-4 h-4" />
          <span>{levelData.tokens} Tokens</span>
        </div>
      </div>

      {actionError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Planned Rest Day Banner */}
      {levelData.is_planned_rest && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <div className="font-bold">Planned Rest Day Active</div>
            <div className="text-[11px] text-emerald-400/80">
              All daily requirements forgiven. Zero drop-off penalty; streak protected.
            </div>
          </div>
        </div>
      )}

      {/* 3 Quest Cards */}
      <div className="space-y-3">
        {levelData.quests.map((quest) => {
          const progressPercent = Math.min(
            100,
            Math.round((quest.current_value / quest.target_value) * 100)
          );

          return (
            <div
              key={quest.id}
              className={`p-4 rounded-2xl border transition-all ${
                quest.completed
                  ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm'
                  : 'bg-slate-800/60 border-slate-700/80'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-700/60">
                    {getPillarIcon(quest.pillar)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>{quest.title}</span>
                      {quest.completed && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">{quest.description}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-indigo-300">+{quest.xp_reward} XP</div>
                  {!quest.completed && !levelData.is_planned_rest && (
                    <button
                      onClick={() => handleSkip(quest.pillar)}
                      className="mt-1 text-[10px] px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-semibold flex items-center gap-1 active:scale-95"
                    >
                      <FastForward className="w-3 h-3" />
                      <span>Skip (1T)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3.5 space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Adherence</span>
                  <span className="font-medium text-slate-300">
                    {quest.current_value} / {quest.target_value} {quest.unit} ({progressPercent}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      quest.completed
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        : 'bg-gradient-to-r from-indigo-500 to-indigo-400'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rest Day Token Action Card */}
      {!levelData.is_planned_rest && (
        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-white">Full Rest-Day Pass</div>
            <div className="text-[10px] text-slate-400">Need recovery? Skip all tasks without streak penalty.</div>
          </div>
          <button
            onClick={handleRestDay}
            className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/50 text-indigo-300 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>Use Pass (3T)</span>
          </button>
        </div>
      )}

      {/* 3 Bottom Direct Action Buttons */}
      <div className="pt-2 grid grid-cols-3 gap-2">
        <button
          onClick={() => onOpenLogger('exercise')}
          className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex flex-col items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
        >
          <Dumbbell className="w-5 h-5" />
          <span>Log Workout</span>
        </button>

        <button
          onClick={() => onOpenLogger('food')}
          className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex flex-col items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
        >
          <Apple className="w-5 h-5" />
          <span>Log Macros</span>
        </button>

        <button
          onClick={() => onOpenLogger('mindful')}
          className="p-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs flex flex-col items-center justify-center gap-1.5 shadow-lg shadow-teal-600/20 active:scale-95 transition-all"
        >
          <Brain className="w-5 h-5" />
          <span>Log Mindful</span>
        </button>
      </div>
    </div>
  );
}
