import React, { useState, useEffect } from 'react';
import { Dumbbell, Footprints, Flame, Sparkles, Plus, Check } from 'lucide-react';
import { logExercise } from '../api';
import confetti from 'canvas-confetti';

const STORAGE_KEY = 'quest_coach_last_exercise_setup';

export default function ExerciseLoggerScreen({ catalogue, onClose, onLogged }) {
  const [tab, setTab] = useState('weightlifting'); // 'weightlifting' | 'steps' | 'calisthenics'

  // Load remembered setup or defaults
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  
  // Weightlifting state
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
  const [selectedCalisId, setSelectedCalisId] = useState(calisthenicsExercises[2]?.id || calisthenicsExercises[0]?.id || '');
  const [calisReps, setCalisReps] = useState(15);
  const [calisDuration, setCalisDuration] = useState(20);
  const [calisHarder, setCalisHarder] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [result1RM, setResult1RM] = useState(null);

  // Filter or adjust calisthenics based on toggle
  const availableCalisthenics = calisthenicsExercises.filter(e => 
    calisHarder ? (e.difficulty_tier === 'intermediate' || e.difficulty_tier === 'pro') : (e.difficulty_tier === 'beginner' || e.difficulty_tier === 'intermediate')
  );

  const handleSaveSetup = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      exerciseId: selectedExerciseId,
      weightKg,
      reps,
      sets,
      stepsCount,
      stepsDuration
    }));
  };

  const handleLog = async () => {
    setSubmitting(true);
    setResult1RM(null);
    handleSaveSetup();

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
      if (res.epley_1rm) {
        setResult1RM(res.epley_1rm);
      }
      confetti({ particleCount: 50, spread: 60 });
      if (onLogged) onLogged();
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* 3 Tabs / Swipe Selector */}
      <div className="grid grid-cols-3 gap-2 p-1 bg-slate-900/80 rounded-2xl border border-slate-800">
        <button
          onClick={() => setTab('weightlifting')}
          className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            tab === 'weightlifting' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Dumbbell className="w-4 h-4" />
          <span>Weights</span>
        </button>
        <button
          onClick={() => setTab('steps')}
          className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            tab === 'steps' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Footprints className="w-4 h-4" />
          <span>Steps</span>
        </button>
        <button
          onClick={() => setTab('calisthenics')}
          className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            tab === 'calisthenics' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Bodyweight</span>
        </button>
      </div>

      {/* Tab 1: Weightlifting */}
      {tab === 'weightlifting' && (
        <div className="space-y-3 bg-slate-800/40 border border-slate-700/60 p-4 rounded-2xl">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Select Exercise / Machine</label>
            <select
              value={selectedExerciseId}
              onChange={(e) => setSelectedExerciseId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
            >
              {weightliftingExercises.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} (Tier: {e.difficulty_tier})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-slate-400">Weight (kg)</label>
              <input
                type="number"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Reps</label>
              <input
                type="number"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Sets</label>
              <input
                type="number"
                value={sets}
                onChange={(e) => setSets(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400">Total Duration (Minutes)</label>
            <input
              type="number"
              value={weightDuration}
              onChange={(e) => setWeightDuration(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
            />
          </div>

          {/* Epley Live Estimate */}
          <div className="p-3 bg-indigo-950/40 border border-indigo-800/40 rounded-xl flex items-center justify-between text-xs">
            <span className="text-indigo-300 font-medium">Estimated 1RM (Epley Formula):</span>
            <span className="text-white font-bold text-sm">
              {(weightKg * (1 + reps / 30)).toFixed(1)} kg
            </span>
          </div>
        </div>
      )}

      {/* Tab 2: Steps */}
      {tab === 'steps' && (
        <div className="space-y-4 bg-slate-800/40 border border-slate-700/60 p-4 rounded-2xl">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Step Count Logged</label>
            <input
              type="number"
              step="500"
              value={stepsCount}
              onChange={(e) => setStepsCount(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Active Walking Duration (min)</label>
            <input
              type="number"
              value={stepsDuration}
              onChange={(e) => setStepsDuration(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
            />
          </div>
        </div>
      )}

      {/* Tab 3: Calisthenics */}
      {tab === 'calisthenics' && (
        <div className="space-y-3 bg-slate-800/40 border border-slate-700/60 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Progression Difficulty</span>
            <button
              onClick={() => setCalisHarder(!calisHarder)}
              className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all ${
                calisHarder
                  ? 'bg-rose-600/30 border-rose-500 text-rose-300'
                  : 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
              }`}
            >
              {calisHarder ? 'Harder Tier' : 'Standard / Easier Tier'}
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400">Exercise</label>
            <select
              value={selectedCalisId}
              onChange={(e) => setSelectedCalisId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
            >
              {availableCalisthenics.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} (Tier: {e.difficulty_tier})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-400">Reps Completed</label>
              <input
                type="number"
                value={calisReps}
                onChange={(e) => setCalisReps(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Duration (min)</label>
              <input
                type="number"
                value={calisDuration}
                onChange={(e) => setCalisDuration(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-2 flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
        >
          Cancel
        </button>
        <button
          onClick={handleLog}
          disabled={submitting}
          className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5"
        >
          {submitting ? 'Logging...' : 'Log Exercise'}
        </button>
      </div>
    </div>
  );
}
