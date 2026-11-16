import React, { useEffect, useState } from 'react';
import { fetchLevelToday, skipTask, activateRestDay, deleteFoodLog, deleteExerciseLog, deleteMindfulLog } from '../api';
import { Dumbbell, Brain, Apple, Sparkles, CheckCircle, Coins, ShieldAlert, FastForward, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';

export default function LevelScreen({ onOpenLogger, onOpenBoss, onRefreshState }) {
  const [levelData, setLevelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState(null);
  const [recoveryMessage, setRecoveryMessage] = useState(null);

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

  const triggerLimeOrbBurst = () => {
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.2 },
      colors: ['#76B900', '#92D050', '#FFB900']
    });
  };

  const handleSkip = async (pillar) => {
    setActionError(null);
    try {
      await skipTask(pillar);
      triggerLimeOrbBurst();
      await loadData();
      if (onRefreshState) onRefreshState();
    } catch (err) {
      setActionError(err.message || 'Skip failed');
    }
  };

  const handleRestDay = async () => {
    setActionError(null);
    setRecoveryMessage(null);
    try {
      const res = await activateRestDay();
      if (res && res.message) {
        setRecoveryMessage(res.message);
      }
      triggerLimeOrbBurst();
      await loadData();
      if (onRefreshState) onRefreshState();
    } catch (err) {
      setActionError(err.message || 'Rest-day activation failed');
    }
  };

  const handleDeleteLog = async (type, id) => {
    try {
      if (type === 'food') await deleteFoodLog(id);
      if (type === 'exercise') await deleteExerciseLog(id);
      if (type === 'mindful') await deleteMindfulLog(id);
      await loadData();
      if (onRefreshState) onRefreshState();
    } catch (err) {
      console.error(err);
      setActionError(err.message || 'Failed to delete log entry');
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

  const foodLogs = levelData.food_logs || [];
  const exerciseLogs = levelData.exercise_logs || [];
  const mindfulLogs = levelData.mindful_logs || [];

  return (
    <div className="p-4 space-y-5">
      {/* Level Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-lime-400">
            {levelData.is_boss_day ? '⚔️ Boss Encounter Day' : `Level ${levelData.level} Training`}
          </span>
          <h2 className="text-lg font-extrabold text-white">Daily 3-Pillar Quests</h2>
        </div>
        <motion.div
          whileTap={{ scale: 0.96 }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-extrabold glow-gold"
        >
          <Coins className="w-4 h-4 text-amber-400" />
          <span>{levelData.tokens} Tokens</span>
        </motion.div>
      </div>

      {actionError && (
        <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Custom Agent Recovery Message Banner (instead of confetti) when using 3T Rest-Day Pass */}
      {recoveryMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 to-teal-950/80 border border-emerald-500/60 text-emerald-200 text-xs shadow-lg space-y-1.5"
        >
          <div className="flex items-center gap-2 font-bold text-emerald-300">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Agent Recovery Intelligence</span>
          </div>
          <p className="leading-relaxed">{recoveryMessage}</p>
        </motion.div>
      )}

      {/* Planned Rest Day Banner */}
      {levelData.is_planned_rest && !recoveryMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <div className="font-bold">Planned Rest Day Active</div>
            <div className="text-[11px] text-emerald-300/80">
              All daily requirements forgiven. Streak protected.
            </div>
          </div>
        </div>
      )}

      {/* Boss Encounter Banner if Boss Day */}
      {levelData.is_boss_day && levelData.boss_challenge && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/80 to-amber-950/70 border border-rose-500/60 shadow-lg shadow-rose-950/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-rose-300 px-2.5 py-0.5 rounded-full bg-rose-900/60 border border-rose-700/50">
              Active Boss Encounter
            </span>
            <span className="text-xs font-bold text-amber-300">Reward: +5 Tokens & Rank Up</span>
          </div>
          <h3 className="text-sm font-black text-white">{levelData.boss_challenge.boss_name}</h3>
          <p className="text-xs text-slate-300">{levelData.boss_challenge.description}</p>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => onOpenBoss && onOpenBoss(levelData.boss_challenge)}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-extrabold text-xs shadow-md shadow-rose-600/30 transition-all glow-xbox"
          >
            Enter Boss Arena ⚔️
          </motion.button>
        </div>
      )}

      {/* 3 Directly Clickable Pillar Quest Cards */}
      <div className="space-y-3">
        {levelData.quests.map((quest) => {
          const progressPercent = Math.min(
            100,
            Math.round((quest.current_value / quest.target_value) * 100)
          );

          const pillarLoggerType = quest.pillar === 'nutrition' ? 'food' : quest.pillar === 'exercise' ? 'exercise' : 'mindful';

          return (
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              key={quest.id}
              onClick={() => onOpenLogger(pillarLoggerType)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer glass-aero ${
                quest.completed
                  ? 'border-emerald-500/50 bg-emerald-950/20 shadow-emerald-900/20'
                  : 'border-white/20 bg-slate-900/40 hover:border-lime-400/50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/20">
                    {getPillarIcon(quest.pillar)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>{quest.title}</span>
                      {quest.completed && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">{quest.description}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-black text-lime-400">
                    {quest.current_value} / {quest.target_value} {quest.unit}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">+{quest.xp_reward} XP</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3 w-full h-2 rounded-full bg-slate-950 border border-white/10 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    quest.completed ? 'bg-emerald-400' : 'bg-gradient-to-r from-lime-500 to-sky-400'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Rest-Day Pass & Skip Controls (Hidden on Boss Day 5) */}
      {!levelData.is_boss_day && (
        <div className="p-4 rounded-2xl glass-aero space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200">
            <span>Athlete Assistance Passes</span>
            <span className="text-amber-400">🪙 {levelData.tokens} Tokens Available</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleRestDay}
              className="py-2.5 px-3 rounded-xl bg-sky-500/20 border border-sky-500/40 hover:bg-sky-500/30 text-sky-300 text-xs font-extrabold flex items-center justify-center gap-1.5 glow-aero-blue"
            >
              <span>Activate 3T Rest-Day</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => handleSkip('exercise')}
              className="py-2.5 px-3 rounded-xl bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-300 text-xs font-extrabold flex items-center justify-center gap-1.5 glow-gold"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span>Skip Task (1T)</span>
            </motion.button>
          </div>
        </div>
      )}

      {/* Logged Today Lists with Delete Buttons */}
      {(foodLogs.length > 0 || exerciseLogs.length > 0 || mindfulLogs.length > 0) && (
        <div className="p-4 rounded-2xl glass-aero space-y-3">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Logged Today</h3>

          {foodLogs.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[11px] text-emerald-400 font-bold">Nutrition & Foods</div>
              {foodLogs.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-white/10 text-xs">
                  <div className="text-slate-200">
                    <span className="font-bold">{item.name}</span> ({item.portion_g}g) · <span className="text-emerald-400">{item.calories} kcal</span>
                  </div>
                  <button
                    onClick={() => handleDeleteLog('food', item.id)}
                    className="p-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-300"
                    title="Delete entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {exerciseLogs.length > 0 && (
            <div className="space-y-1.5 pt-2">
              <div className="text-[11px] text-indigo-400 font-bold">Exercise & Training</div>
              {exerciseLogs.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-white/10 text-xs">
                  <div className="text-slate-200">
                    <span className="font-bold">{item.exercise_name}</span> ({item.duration_min}m)
                    {item.weight_kg ? ` · ${item.weight_kg}kg × ${item.reps} reps` : ''}
                  </div>
                  <button
                    onClick={() => handleDeleteLog('exercise', item.id)}
                    className="p-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-300"
                    title="Delete entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {mindfulLogs.length > 0 && (
            <div className="space-y-1.5 pt-2">
              <div className="text-[11px] text-teal-400 font-bold">Mindful Restoration</div>
              {mindfulLogs.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-white/10 text-xs">
                  <div className="text-slate-200">
                    <span className="font-bold">{item.name}</span> ({item.duration_min} min)
                  </div>
                  <button
                    onClick={() => handleDeleteLog('mindful', item.id)}
                    className="p-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-300"
                    title="Delete entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
