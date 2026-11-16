import React, { useState } from 'react';
import { User, ShieldCheck, Coins, Award, Brain, Dumbbell, Apple, Heart, BatteryCharging, Calendar, AlertCircle, Edit3, RotateCcw } from 'lucide-react';
import { setupProfile, resetProfile } from '../api';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';

export default function ProfileScreen({ profile, onClose, onRefreshState }) {
  if (!profile) return null;

  const { rank, level, tokens, xp, inferred_mood, inferred_fatigue, weakest_pillar, boss_wins, simulated_date } = profile;
  const user = profile.profile || {};

  const [isEditing, setIsEditing] = useState(false);
  const [age, setAge] = useState(user.age || 24);
  const [weightKg, setWeightKg] = useState(user.weight_kg || 72);
  const [heightCm, setHeightCm] = useState(user.height_cm || 175);
  const [gender, setGender] = useState(user.gender || 'male');
  const [gymExperience, setGymExperience] = useState(user.gym_experience || 'intermediate');
  const [preferredRegion, setPreferredRegion] = useState(user.preferred_region || 'Pan-Indian');
  const [requestedGoal, setRequestedGoal] = useState(user.goal || 'maintain');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await setupProfile({
        age: Number(age),
        weight_kg: Number(weightKg),
        height_cm: Number(heightCm),
        gender,
        gym_experience: gymExperience,
        preferred_region: preferredRegion,
        requested_goal: requestedGoal,
      });
      confetti({ particleCount: 40, spread: 60, colors: ['#76B900', '#00A4EF'] });
      setIsEditing(false);
      if (onRefreshState) onRefreshState();
    } catch (err) {
      setErrorMsg(err.message || 'Profile update failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetProgress = async () => {
    if (!window.confirm('Are you sure you want to reset your daily logs & pathway back to Day 1 Level 1? Your rank, boss wins, XP, and PRs will be preserved.')) {
      return;
    }
    try {
      await resetProfile();
      confetti({ particleCount: 50, spread: 70, colors: ['#FFB900', '#76B900'] });
      if (onRefreshState) onRefreshState();
      if (onClose) onClose();
    } catch (err) {
      console.error(err);
      alert('Reset failed: ' + err.message);
    }
  };

  return (
    <div className="p-4 space-y-4 max-h-[760px] overflow-y-auto">
      {/* Top Profile Card */}
      <div className="p-5 rounded-3xl glass-aero space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-lime-600 to-emerald-500 border border-white/40 flex items-center justify-center text-white font-black text-xl glow-xbox">
              R{rank || 1}
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Athlete Status</h2>
              <div className="text-xs text-lime-400 font-bold">
                Rank {rank || 1} · Level {level || 1} · {xp || 0} XP
              </div>
              <div className="text-[10px] text-slate-300 mt-0.5">
                Simulated Date: {simulated_date || 'Today'}
              </div>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setIsEditing(!isEditing)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold flex items-center gap-1"
          >
            <Edit3 className="w-3.5 h-3.5 text-lime-400" />
            <span>{isEditing ? 'Cancel' : 'Edit'}</span>
          </motion.button>
        </div>

        {/* High-level stats */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center">
          <div className="p-2 rounded-xl bg-slate-900/60 border border-white/10">
            <div className="text-[10px] text-slate-400">Tokens</div>
            <div className="text-sm font-bold text-amber-400 mt-0.5">🪙 {tokens ?? 5}</div>
          </div>
          <div className="p-2 rounded-xl bg-slate-900/60 border border-white/10">
            <div className="text-[10px] text-slate-400">Boss Wins</div>
            <div className="text-sm font-bold text-emerald-400 mt-0.5">⚔️ {boss_wins ?? 0}</div>
          </div>
          <div className="p-2 rounded-xl bg-slate-900/60 border border-white/10">
            <div className="text-[10px] text-slate-400">BMI</div>
            <div className="text-sm font-bold text-lime-300 mt-0.5">{user.bmi || 22.0}</div>
          </div>
        </div>
      </div>

      {/* Edit Profile Form Modal / Section */}
      {isEditing && (
        <form onSubmit={handleEditSubmit} className="p-4 rounded-2xl glass-aero space-y-3 border border-lime-400/40">
          <h3 className="text-xs font-extrabold text-lime-400 uppercase tracking-wider">Edit Athlete Profile</h3>
          
          {errorMsg && <div className="text-xs text-rose-400">{errorMsg}</div>}

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] text-slate-300">Age</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full bg-slate-900 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-slate-300">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full bg-slate-900 border border-white/20 rounded-xl px-2.5 py-1.5 text-xs text-slate-200"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] text-slate-300">Height (cm)</label>
              <input
                type="number"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                className="w-full bg-slate-900 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-slate-300">Weight (kg)</label>
              <input
                type="number"
                step="0.5"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full bg-slate-900 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] text-slate-300">Goal</label>
              <select
                value={requestedGoal}
                onChange={(e) => setRequestedGoal(e.target.value)}
                className="w-full bg-slate-900 border border-white/20 rounded-xl px-2.5 py-1.5 text-xs text-slate-200"
              >
                <option value="lose">Fat Loss</option>
                <option value="maintain">Maintain</option>
                <option value="gain">Muscle Gain</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-slate-300">Region</label>
              <select
                value={preferredRegion}
                onChange={(e) => setPreferredRegion(e.target.value)}
                className="w-full bg-slate-900 border border-white/20 rounded-xl px-2.5 py-1.5 text-xs text-slate-200"
              >
                <option value="Pan-Indian">Pan-Indian</option>
                <option value="South Indian">South Indian</option>
                <option value="Global">Global</option>
              </select>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.96 }}
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-lime-600 to-emerald-500 text-white font-extrabold text-xs shadow-lg glow-xbox"
          >
            {submitting ? 'Saving Profile...' : 'Save Profile Changes'}
          </motion.button>
        </form>
      )}

      {/* Passive Latent State Estimator (Zero Sliders) */}
      <div className="p-4 rounded-2xl glass-aero space-y-3">
        <span className="text-xs font-bold text-slate-200">Passive Latent States (AI Inference)</span>
        
        {/* Mood */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-300">
            <span className="flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-400" />
              <span>Inferred Mood</span>
            </span>
            <span className="font-bold text-white">{Math.round((inferred_mood || 0.75) * 100)}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-rose-500 to-emerald-400"
              style={{ width: `${(inferred_mood || 0.75) * 100}%` }}
            />
          </div>
        </div>

        {/* Fatigue */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-300">
            <span className="flex items-center gap-1.5">
              <BatteryCharging className="w-3.5 h-3.5 text-amber-400" />
              <span>Inferred Fatigue</span>
            </span>
            <span className="font-bold text-white">{Math.round((inferred_fatigue || 0.25) * 100)}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-rose-500"
              style={{ width: `${(inferred_fatigue || 0.25) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Agent-Detected Strengths & Weaknesses */}
      <div className="p-4 rounded-2xl glass-aero space-y-2">
        <span className="text-xs font-bold text-slate-200">Player Model Telemetry</span>
        <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 flex items-center justify-between text-xs">
          <span className="text-slate-400">Weakest Pillar (Targeted by Boss):</span>
          <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 font-bold uppercase">
            {weakest_pillar || 'Exercise'}
          </span>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 flex items-center justify-between text-xs">
          <span className="text-slate-400">Assigned Fitness Goal:</span>
          <span className="px-2.5 py-1 rounded-lg bg-lime-500/20 text-lime-300 font-bold uppercase">
            {user.goal || 'Maintain'}
          </span>
        </div>
      </div>

      {/* Reset Progress Button */}
      <div className="pt-2">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleResetProgress}
          className="w-full py-3 rounded-xl bg-rose-500/20 border border-rose-500/40 hover:bg-rose-500/30 text-rose-300 font-extrabold text-xs flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4 text-rose-400" />
          <span>Reset Pathway Progress to Day 1 Level 1</span>
        </motion.button>
      </div>

      {/* Medical Disclaimer */}
      <div className="pt-2 border-t border-white/10 flex items-center justify-center gap-1.5 text-xs text-slate-400">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="font-medium text-center">General guidance only, not medical advice</span>
      </div>
    </div>
  );
}
