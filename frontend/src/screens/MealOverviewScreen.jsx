import React, { useEffect, useState } from 'react';
import { fetchMealOverview } from '../api';
import { Sparkles, ShieldCheck, ArrowLeft, Lightbulb, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';

export default function MealOverviewScreen({ foodId, onClose, onSelectPortionAndLog }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!foodId) return;
    setLoading(true);
    fetchMealOverview(foodId)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [foodId]);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 text-sm space-y-3">
        <div className="w-8 h-8 mx-auto border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p>Evaluating Dynamic Utility Agent & Genetic Algorithm Optimization...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 text-center space-y-4">
        <div className="text-rose-400 text-sm">{error || 'Could not load meal overview.'}</div>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
        >
          Back
        </button>
      </div>
    );
  }

  const { food, missing_macros_first, utility_rating, user_improvement_notes, region_badge, pro_tip } = data;

  // Rating color scale
  const ratingColor = utility_rating >= 80 ? 'text-emerald-400 border-emerald-500/50 bg-emerald-950/30' :
    utility_rating >= 60 ? 'text-indigo-400 border-indigo-500/50 bg-indigo-950/30' :
    'text-amber-400 border-amber-500/50 bg-amber-950/30';

  return (
    <div className="p-4 space-y-4 max-h-[760px] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Meal Overview</span>
        <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] text-slate-300 font-semibold">
          {region_badge}
        </span>
      </div>

      {/* Food Title & Dynamic Rating */}
      <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white">{food.name}</h2>
          <div className="text-xs text-slate-400 mt-0.5">
            Standard Portion: {food.standard_portion_g}g · {food.calories} kcal
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            P: <span className="text-white font-semibold">{food.protein_g}g</span> · 
            C: <span className="text-white font-semibold"> {food.carbs_g}g</span> · 
            F: <span className="text-white font-semibold"> {food.fat_g}g</span> · 
            Fibre: <span className="text-white font-semibold"> {food.fibre_g}g</span>
          </div>
        </div>

        {/* Dynamic Utility Agent Rating (0-100) */}
        <div className={`p-3 rounded-2xl border flex flex-col items-center justify-center shrink-0 ${ratingColor}`}>
          <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Agent Score</span>
          <span className="text-2xl font-black">{utility_rating}</span>
          <span className="text-[9px] font-semibold text-slate-400">/ 100</span>
        </div>
      </div>

      {/* (1) Missing Macros/Nutrients FIRST (SPEC Screen 7 requirement) */}
      <div className="p-3.5 rounded-2xl bg-slate-900 border border-indigo-900/40 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
          <TrendingUp className="w-4 h-4 text-indigo-400" />
          <span>Remaining Macro Deficits Today (Missing First)</span>
        </div>
        <div className="grid grid-cols-5 gap-1.5 text-center">
          <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <div className="text-[10px] text-slate-400">Cals</div>
            <div className="text-xs font-bold text-white mt-0.5">{missing_macros_first.calories}</div>
          </div>
          <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <div className="text-[10px] text-slate-400">Protein</div>
            <div className="text-xs font-bold text-emerald-400 mt-0.5">{missing_macros_first.protein_g}g</div>
          </div>
          <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <div className="text-[10px] text-slate-400">Carbs</div>
            <div className="text-xs font-bold text-cyan-400 mt-0.5">{missing_macros_first.carbs_g}g</div>
          </div>
          <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <div className="text-[10px] text-slate-400">Fat</div>
            <div className="text-xs font-bold text-amber-400 mt-0.5">{missing_macros_first.fat_g}g</div>
          </div>
          <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <div className="text-[10px] text-slate-400">Fibre</div>
            <div className="text-xs font-bold text-teal-400 mt-0.5">{missing_macros_first.fibre_g}g</div>
          </div>
        </div>
      </div>

      {/* (4) User Improvement Notes from Utility Agent */}
      <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-2">
        <span className="text-xs font-bold text-slate-200">Coach Nutrient Analysis & Notes</span>
        <div className="space-y-1.5">
          {user_improvement_notes.map((note, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>{note}</span>
            </div>
          ))}
        </div>
      </div>

      {/* (5) Genetic Algorithm Pro Tip Recommendation (SPEC 3.7) */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-purple-950/40 border border-indigo-700/40 space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
          <Lightbulb className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>Genetic Algorithm Evolved Recommendation</span>
        </div>
        <p className="text-xs text-slate-200 italic leading-relaxed">
          "{pro_tip}"
        </p>
      </div>

      {/* Action to log this food item */}
      <button
        onClick={() => onSelectPortionAndLog(food)}
        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
      >
        Log Portion of {food.name}
      </button>

      {/* Medical disclaimer */}
      <div className="pt-2 border-t border-slate-800 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        <span>General guidance only, not medical advice</span>
      </div>
    </div>
  );
}
