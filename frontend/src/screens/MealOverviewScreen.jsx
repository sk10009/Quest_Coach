import React, { useEffect, useState } from 'react';
import { fetchMealOverview, logFood } from '../api';
import { Sparkles, ShieldCheck, ArrowLeft, Lightbulb, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';

export default function MealOverviewScreen({ foodId, onClose, onSelectPortionAndLog }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!foodId) return;
    setLoading(true);
    fetchMealOverview(foodId)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [foodId]);

  const handleLogImmediately = async (food) => {
    setSubmitting(true);
    try {
      await logFood({
        food_id: food.id,
        portion_g: Number(food.standard_portion_g || 100)
      });
      confetti({ particleCount: 50, spread: 70, colors: ['#76B900', '#00A4EF'] });
      setTimeout(() => {
        onClose();
      }, 600);
    } catch (err) {
      console.error(err);
      setError('Failed to log meal');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 text-sm space-y-3">
        <div className="w-8 h-8 mx-auto border-2 border-lime-400 border-t-transparent rounded-full animate-spin" />
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

  const ratingColor = utility_rating >= 80 ? 'text-lime-400 border-lime-500/50 bg-lime-950/30' :
    utility_rating >= 60 ? 'text-sky-400 border-sky-500/50 bg-sky-950/30' :
    'text-amber-400 border-amber-500/50 bg-amber-950/30';

  return (
    <div className="p-4 space-y-4 max-h-[760px] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onClose}
          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20"
        >
          <ArrowLeft className="w-4 h-4" />
        </motion.button>
        <span className="text-xs font-bold uppercase tracking-wider text-lime-400">Meal AI Overview</span>
        <span className="px-2.5 py-0.5 rounded-full glass-aero text-[10px] text-lime-300 font-bold">
          {region_badge}
        </span>
      </div>

      {/* Food Title & Dynamic Rating */}
      <div className="p-4 rounded-2xl glass-aero flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white">{food.name}</h2>
          <div className="text-xs text-slate-300 mt-0.5">
            Standard Portion: {food.standard_portion_g}g · {food.calories} kcal
          </div>
          <div className="text-[11px] text-slate-300 mt-1">
            P: <span className="text-white font-semibold">{food.protein_g}g</span> · 
            C: <span className="text-white font-semibold"> {food.carbs_g}g</span> · 
            F: <span className="text-white font-semibold"> {food.fat_g}g</span> · 
            Fibre: <span className="text-white font-semibold"> {food.fibre_g}g</span>
          </div>
        </div>

        {/* Dynamic Utility Agent Rating (0-100) */}
        <div className={`p-3 rounded-2xl border flex flex-col items-center justify-center shrink-0 ${ratingColor}`}>
          <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-300">Agent Score</span>
          <span className="text-2xl font-black">{utility_rating}</span>
          <span className="text-[9px] font-semibold text-slate-300">/ 100</span>
        </div>
      </div>

      {/* Missing Macros FIRST */}
      <div className="p-3.5 rounded-2xl glass-aero space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-lime-300">
          <TrendingUp className="w-4 h-4 text-lime-400" />
          <span>Remaining Macro Deficits Today</span>
        </div>
        <div className="grid grid-cols-5 gap-1.5 text-center">
          <div className="p-2 rounded-xl bg-slate-900/80 border border-white/10">
            <div className="text-[10px] text-slate-400">Cals</div>
            <div className="text-xs font-bold text-white mt-0.5">{missing_macros_first.calories}</div>
          </div>
          <div className="p-2 rounded-xl bg-slate-900/80 border border-white/10">
            <div className="text-[10px] text-slate-400">Protein</div>
            <div className="text-xs font-bold text-lime-400 mt-0.5">{missing_macros_first.protein_g}g</div>
          </div>
          <div className="p-2 rounded-xl bg-slate-900/80 border border-white/10">
            <div className="text-[10px] text-slate-400">Carbs</div>
            <div className="text-xs font-bold text-sky-400 mt-0.5">{missing_macros_first.carbs_g}g</div>
          </div>
          <div className="p-2 rounded-xl bg-slate-900/80 border border-white/10">
            <div className="text-[10px] text-slate-400">Fat</div>
            <div className="text-xs font-bold text-amber-400 mt-0.5">{missing_macros_first.fat_g}g</div>
          </div>
          <div className="p-2 rounded-xl bg-slate-900/80 border border-white/10">
            <div className="text-[10px] text-slate-400">Fibre</div>
            <div className="text-xs font-bold text-teal-400 mt-0.5">{missing_macros_first.fibre_g}g</div>
          </div>
        </div>
      </div>

      {/* Coach Nutrient Analysis & Notes */}
      <div className="p-3.5 rounded-2xl glass-aero space-y-2">
        <span className="text-xs font-bold text-slate-200">Coach Nutrient Analysis & Notes</span>
        <div className="space-y-1.5">
          {user_improvement_notes.map((note, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-lime-400 shrink-0 mt-0.5" />
              <span>{note}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Genetic Algorithm Pro Tip Recommendation */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-950/80 to-purple-950/60 border border-indigo-500/40 space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
          <Lightbulb className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>Genetic Algorithm Evolved Recommendation</span>
        </div>
        <p className="text-xs text-slate-200 italic leading-relaxed">
          "{pro_tip}"
        </p>
      </div>

      {/* Action to log this food item immediately */}
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={() => handleLogImmediately(food)}
        disabled={submitting}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-lime-600 to-emerald-500 text-white font-extrabold text-xs shadow-lg glow-xbox"
      >
        {submitting ? 'Logging Standard Portion...' : `Log Standard Portion (${food.standard_portion_g}g) Now`}
      </motion.button>
    </div>
  );
}
