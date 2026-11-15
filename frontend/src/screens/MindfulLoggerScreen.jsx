import React, { useState } from 'react';
import { Brain, Sparkles, Check } from 'lucide-react';
import { logMindful } from '../api';
import confetti from 'canvas-confetti';

export default function MindfulLoggerScreen({ catalogue, onClose, onLogged }) {
  const mindfulList = catalogue.mindful || [];
  const [selectedId, setSelectedId] = useState(mindfulList[0]?.id || '');
  const [durationMin, setDurationMin] = useState(mindfulList[0]?.default_duration_min || 8);
  const [submitting, setSubmitting] = useState(false);

  const handleSelect = (m) => {
    setSelectedId(m.id);
    setDurationMin(m.default_duration_min || 8);
  };

  const handleLog = async () => {
    if (!selectedId) return;
    setSubmitting(true);
    try {
      await logMindful({
        activity_id: selectedId,
        duration_min: Number(durationMin)
      });
      confetti({ particleCount: 45, spread: 60 });
      if (onLogged) onLogged();
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-1">
        <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
          <Brain className="w-4 h-4 text-teal-400" />
          <span>Mindful Restoration & Parasympathetic Recovery</span>
        </h2>
        <p className="text-[11px] text-slate-400">
          Infers stress relief and passive mood replenishment without manual sliders.
        </p>
      </div>

      {/* Activity list */}
      <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
        {mindfulList.map((m) => {
          const isSelected = selectedId === m.id;
          return (
            <div
              key={m.id}
              onClick={() => handleSelect(m)}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-teal-950/40 border-teal-500 shadow text-white'
                  : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold">{m.name}</div>
                  <div className="text-[10px] text-teal-300/80 capitalize mt-0.5">
                    Type: {m.type} · Target: {m.default_duration_min} min
                  </div>
                </div>
                {isSelected && <Check className="w-4 h-4 text-teal-400" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Duration selector */}
      <div className="p-3 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-2">
        <label className="text-xs text-slate-300 font-semibold">Session Duration (Minutes)</label>
        <div className="flex items-center gap-3">
          {[5, 8, 10, 15, 20].map((mins) => (
            <button
              key={mins}
              type="button"
              onClick={() => setDurationMin(mins)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                durationMin === mins
                  ? 'bg-teal-600 border-teal-400 text-white'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              {mins}m
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={onClose}
          className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
        >
          Cancel
        </button>
        <button
          onClick={handleLog}
          disabled={submitting}
          className="flex-1 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg shadow-teal-600/30"
        >
          {submitting ? 'Logging...' : 'Complete Mindful Quest'}
        </button>
      </div>
    </div>
  );
}
