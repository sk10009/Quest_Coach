import React, { useState, useMemo } from 'react';
import { ShieldCheck, AlertCircle, Sparkles, ChevronRight } from 'lucide-react';
import { setupProfile } from '../api';

export default function ProfileSetupScreen({ onProfileCreated }) {
  const [age, setAge] = useState(24);
  const [weightKg, setWeightKg] = useState(72);
  const [heightCm, setHeightCm] = useState(175);
  const [gender, setGender] = useState('male');
  const [gymExperience, setGymExperience] = useState('intermediate');
  const [preferredRegion, setPreferredRegion] = useState('Pan-Indian');
  const [requestedGoal, setRequestedGoal] = useState('maintain');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Live BMI calculation
  const bmi = useMemo(() => {
    const h = heightCm / 100.0;
    if (h <= 0) return 0;
    return (weightKg / (h * h)).toFixed(1);
  }, [weightKg, heightCm]);

  // Reactive Safety Check & Backward Chaining preview
  const safetyLockInfo = useMemo(() => {
    const numAge = Number(age);
    const numBmi = Number(bmi);

    if (numAge < 18) {
      return {
        locked: true,
        enforcedGoal: requestedGoal === 'lose' ? 'maintain' : requestedGoal,
        warning: 'Safety Lock: Under 18 users cannot engage in aggressive weight-loss caloric deficits. Goal set to maintain/grow.'
      };
    }
    if (numBmi < 18.5) {
      return {
        locked: true,
        enforcedGoal: 'gain',
        warning: 'Safety Lock: BMI is below 18.5 (Underweight). Caloric restriction is disabled; target set to healthy weight gain.'
      };
    }
    if (numBmi >= 25.0) {
      return {
        locked: true,
        enforcedGoal: 'lose',
        warning: 'Safety Lock: BMI is 25.0+ (Overweight/Obese). Caloric surplus is disabled; target set to safe fat loss.'
      };
    }
    return {
      locked: false,
      enforcedGoal: requestedGoal,
      warning: null
    };
  }, [age, bmi, requestedGoal]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await setupProfile({
        age: Number(age),
        weight_kg: Number(weightKg),
        height_cm: Number(heightCm),
        gender,
        gym_experience: gymExperience,
        preferred_region: preferredRegion,
        requested_goal: safetyLockInfo.locked ? safetyLockInfo.enforcedGoal : requestedGoal,
      });
      if (res && res.profile) {
        onProfileCreated(res.profile);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <h1 className="text-xl font-bold tracking-tight text-white">Create Your Athlete Profile</h1>
        </div>
        <p className="text-xs text-slate-400">
          Deterministic Target Calculator & Rule Engine will compute your personalized daily macro, volume, and mindful quotas.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Age & Gender */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Age</label>
            <input
              type="number"
              min="10"
              max="99"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Height & Weight */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Height (cm)</label>
            <input
              type="number"
              min="100"
              max="240"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Weight (kg)</label>
            <input
              type="number"
              step="0.5"
              min="30"
              max="250"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              required
            />
          </div>
        </div>

        {/* Live Calculated BMI */}
        <div className="bg-slate-800/50 border border-slate-700/80 rounded-xl p-3 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Calculated Body Mass Index (BMI)</div>
            <div className="text-lg font-bold text-white">{bmi} kg/m²</div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
            bmi < 18.5 ? 'bg-amber-500/20 text-amber-400' :
            bmi >= 25.0 ? 'bg-rose-500/20 text-rose-400' :
            'bg-emerald-500/20 text-emerald-400'
          }`}>
            {bmi < 18.5 ? 'Underweight' : bmi >= 25.0 ? 'Overweight/Obese' : 'Normal Weight'}
          </span>
        </div>

        {/* Gym Experience */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-300">Gym Experience Tier</label>
          <div className="grid grid-cols-3 gap-2">
            {['beginner', 'intermediate', 'pro'].map((tier) => (
              <button
                type="button"
                key={tier}
                onClick={() => setGymExperience(tier)}
                className={`py-2 px-2 rounded-xl text-xs font-medium capitalize border transition-all ${
                  gymExperience === tier
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>

        {/* Preferred Food Region */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-300">Dietary & Regional Preference</label>
          <select
            value={preferredRegion}
            onChange={(e) => setPreferredRegion(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="Pan-Indian">Pan-Indian (Balanced)</option>
            <option value="North Indian">North Indian (Roti, Dal, Paneer)</option>
            <option value="South Indian">South Indian (Idli, Dosa, Sambar)</option>
            <option value="Gym Staple">Gym Staples (Whey, Oats, Chicken)</option>
          </select>
        </div>

        {/* Goal Selector or Safety Enforced */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-300">Primary Fitness Goal</label>
          {safetyLockInfo.locked ? (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                <AlertCircle className="w-4 h-4" />
                <span>Enforced Goal: {safetyLockInfo.enforcedGoal.toUpperCase()}</span>
              </div>
              <p className="text-[11px] text-amber-300/80 leading-relaxed">
                {safetyLockInfo.warning}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {['lose', 'maintain', 'gain'].map((g) => (
                <button
                  type="button"
                  key={g}
                  onClick={() => setRequestedGoal(g)}
                  className={`py-2 px-2 rounded-xl text-xs font-medium capitalize border transition-all ${
                    requestedGoal === g
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-600/30'
                      : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
        >
          {loading ? (
            'Computing Expert Targets...'
          ) : (
            <>
              <span>Begin Your Quest</span>
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Mandatory Medical Disclaimer */}
      <div className="pt-2 border-t border-slate-800 flex items-center justify-center gap-2 text-xs text-slate-400">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="font-medium text-center">General guidance only, not medical advice</span>
      </div>
    </div>
  );
}
