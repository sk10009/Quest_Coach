import React, { useState, useEffect } from 'react';
import { Dumbbell, Footprints, Flame, Sparkles, Plus, Check, Trash2, AlertCircle } from 'lucide-react';
import { logExercise, fetchLevelToday, deleteExerciseLog } from '../api';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';

const STORAGE_KEY = 'quest_coach_last_exercise_setup';

export default function ExerciseLoggerScreen({ catalogue, onClose, onLogged }) {
  const [tab, setTab] = useState('weightlifting'); // 'weightlifting' | 'steps' | 'calisthenics'

  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  
  const weightliftingExercises = catalogue.exercises?.filter(e => e.category === 'weightlifting') || [];
  const [selectedExerciseId, setSelectedExerciseId] = useState(saved.exerciseId || weightliftingExercises[0]?.id || '');
  const [weightKg, setWeightKg] = useState(saved.weightKg || 60);
  const [reps, setReps] = useState(saved.reps || 10);
  const [sets, setSets] = useState(saved.sets || 3);
  const [weightDuration, setWeightDuration] = useState(30);

  // Steps state
  const [stepsCount, setStepsCount] = useState(saved.stepsCount || 6000);
  const [stepsDuration, setStepsDuration] = useState(saved.stepsDuration || 45);

  // Calisthenics state
  const calisthenicsExercises = catalogue.exercises?.filter(e => e.category === 'calisthenics') || [];
  const [selectedCalisId, setSelectedCalisId] = useState(calisthenicsExercises[0]?.id || '');
  const [calisReps, setCalisReps] = useState(15);
  const [calisDuration, setCalisDuration] = useState(20);

  const [submitting, setSubmitting] = useState(false);
  const [result1RM, setResult1RM] = useState(null);
  const [varietyTip, setVarietyTip] = useState(null);
  const [loggedTodayList, setLoggedTodayList] = useState([]);

  const loadTodayData = async () => {
    try {
      const data = await fetchLevelToday();
      setLoggedTodayList(data.exercise_logs || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadTodayData();
  }, []);

  // Auto-fill ideal sets/reps/duration upon exercise selection
  const handleSelectExercise = (eId) => {
    setSelectedExerciseId(eId);
    const item = weightliftingExercises.find(e => e.id === eId);
    if (item) {
      setReps(item.default_reps || 10);
      setSets(item.default_sets || 3);
      setWeightDuration(item.default_duration_min || 30);
    }
  };

  const handleLog = async () => {
    setSubmitting(true);
    setResult1RM(null);
    setVarietyTip(null);

    try {
      let payload = {};
      if (tab === 'weightlifting') {
        const item = weightliftingExercises.find(e => e.id === selectedExerciseId);
        payload = {
          category: 'weightlifting',
          exercise_id: selectedExerciseId,
          exercise_name: item ? item.name : 'Weightlifting',
          duration_min: Number(weightDuration),
          weight_kg: Number(weightKg),
          reps: Number(reps),
          sets: Number(sets)
        };
      } else if (tab === 'steps') {
        payload = {
          category: 'steps',
          exercise_id: 'ex_steps_brisk',
          exercise_name: 'Daily Step Quota',
          duration_min: Number(stepsDuration),
          steps_count: Number(stepsCount)
        };
      } else {
        const item = calisthenicsExercises.find(e => e.id === selectedCalisId);
        payload = {
          category: 'calisthenics',
          exercise_id: selectedCalisId,
          exercise_name: item ? item.name : 'Calisthenics',
          duration_min: Number(calisDuration),
          calisthenics_reps: Number(calisReps)
        };
      }

      const res = await logExercise(payload);
      if (res.epley_1rm) setResult1RM(res.epley_1rm);
      if (res.variety_tip) setVarietyTip(res.variety_tip);

      confetti({ particleCount: 50, spread: 60, colors: ['#76B900', '#00A4EF'] });
      if (onLogged) onLogged();
      await loadTodayData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExerciseLog = async (id) => {
    try {
      await deleteExerciseLog(id);
      await loadTodayData();
      if (onLogged) onLogged();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 space-y-4 max-h-[760px] overflow-y-auto">
      {/* 3 Tabs */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900/80 rounded-2xl border border-white/20">
        <button
          onClick={() => setTab('weightlifting')}
          className={`py-2 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
            tab === 'weightlifting' ? 'bg-gradient-to-r from-lime-600 to-emerald-500 text-white shadow glow-xbox' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Dumbbell className="w-3.5 h-3.5" />
          <span>Weights</span>
        </button>
        <button
          onClick={() => setTab('steps')}
          className={`py-2 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
            tab === 'steps' ? 'bg-gradient-to-r from-lime-600 to-emerald-500 text-white shadow glow-xbox' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Footprints className="w-3.5 h-3.5" />
          <span>Steps</span>
        </button>
        <button
          onClick={() => setTab('calisthenics')}
          className={`py-2 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
            tab === 'calisthenics' ? 'bg-gradient-to-r from-lime-600 to-emerald-500 text-white shadow glow-xbox' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Bodyweight</span>
        </button>
      </div>

      {/* Clean SVG Illustration Banner */}
      <div className="p-3 rounded-2xl glass-aero flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-lime-500/20 border border-lime-500/40 flex items-center justify-center text-lime-400 shrink-0 glow-xbox">
          <Dumbbell className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xs font-bold text-white">Progressive Training & 1RM Calculator</h3>
          <p className="text-[10px] text-slate-300">Auto-fills ideal volume quotas and tracks personal records.</p>
        </div>
      </div>

      {/* Variety Nudge Banner if repeating */}
      {varietyTip && (
        <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{varietyTip}</span>
        </div>
      )}

      {/* Tab 1: Weightlifting */}
      {tab === 'weightlifting' && (
        <div className="space-y-3 glass-aero p-4 rounded-2xl">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-200">Select Exercise / Machine</label>
            <select
              value={selectedExerciseId}
              onChange={(e) => handleSelectExercise(e.target.value)}
              className="w-full bg-slate-900 border border-white/20 rounded-xl px-3 py-2 text-xs text-white"
            >
              {weightliftingExercises.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} (Tier: {e.difficulty_tier})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] text-slate-300">Weight (kg)</label>
              <input
                type="number"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full bg-slate-900 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-slate-300">Reps per Set</label>
              <input
                type="number"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                className="w-full bg-slate-900 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] text-slate-300">Sets Count</label>
              <input
                type="number"
                value={sets}
                onChange={(e) => setSets(e.target.value)}
                className="w-full bg-slate-900 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-slate-300">Duration (min)</label>
              <input
                type="number"
                value={weightDuration}
                onChange={(e) => setWeightDuration(e.target.value)}
                className="w-full bg-slate-900 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Steps */}
      {tab === 'steps' && (
        <div className="space-y-3 glass-aero p-4 rounded-2xl">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-200">Brisk Walking / Step Count</label>
            <input
              type="number"
              step="500"
              value={stepsCount}
              onChange={(e) => setStepsCount(e.target.value)}
              className="w-full bg-slate-900 border border-white/20 rounded-xl px-3 py-2 text-xs text-white font-bold"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-200">Duration (min)</label>
            <input
              type="number"
              value={stepsDuration}
              onChange={(e) => setStepsDuration(e.target.value)}
              className="w-full bg-slate-900 border border-white/20 rounded-xl px-3 py-2 text-xs text-white font-bold"
            />
          </div>
        </div>
      )}

      {/* Tab 3: Calisthenics */}
      {tab === 'calisthenics' && (
        <div className="space-y-3 glass-aero p-4 rounded-2xl">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-200">Select Bodyweight Movement</label>
            <select
              value={selectedCalisId}
              onChange={(e) => setSelectedCalisId(e.target.value)}
              className="w-full bg-slate-900 border border-white/20 rounded-xl px-3 py-2 text-xs text-white"
            >
              {calisthenicsExercises.map((e) => (
                <option key={e.id} value={e.id}>{e.name} ({e.difficulty_tier})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] text-slate-300">Total Reps</label>
              <input
                type="number"
                value={calisReps}
                onChange={(e) => setCalisReps(e.target.value)}
                className="w-full bg-slate-900 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-slate-300">Duration (min)</label>
              <input
                type="number"
                value={calisDuration}
                onChange={(e) => setCalisDuration(e.target.value)}
                className="w-full bg-slate-900 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white"
              />
            </div>
          </div>
        </div>
      )}

      {result1RM && (
        <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center">
          🏆 Estimated Epley 1RM Personal Record: {result1RM} kg!
        </div>
      )}

      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={handleLog}
        disabled={submitting}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-lime-600 to-emerald-500 text-white font-extrabold text-xs shadow-lg glow-xbox"
      >
        {submitting ? 'Logging Exercise...' : 'Complete Exercise Quest'}
      </motion.button>

      {/* Logged Today List with Delete Buttons */}
      {loggedTodayList.length > 0 && (
        <div className="p-4 rounded-2xl glass-aero space-y-2">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Exercises Logged Today</h3>
          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {loggedTodayList.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-white/10 text-xs">
                <div>
                  <span className="font-bold text-white">{item.exercise_name}</span> ({item.duration_min}m)
                  {item.weight_kg ? ` · ${item.weight_kg}kg × ${item.reps} reps` : ''}
                </div>
                <button
                  onClick={() => handleDeleteExerciseLog(item.id)}
                  className="p-1 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
