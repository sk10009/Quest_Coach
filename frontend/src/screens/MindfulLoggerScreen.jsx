import React, { useState, useEffect } from 'react';
import { Brain, Sparkles, Check, Trash2 } from 'lucide-react';
import { logMindful, fetchLevelToday, deleteMindfulLog } from '../api';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';

export default function MindfulLoggerScreen({ catalogue, onClose, onLogged }) {
  const mindfulList = catalogue.mindful || [];
  const [selectedId, setSelectedId] = useState(mindfulList[0]?.id || '');
  const [durationMin, setDurationMin] = useState(mindfulList[0]?.default_duration_min || 8);
  const [submitting, setSubmitting] = useState(false);
  const [loggedTodayList, setLoggedTodayList] = useState([]);

  const loadTodayData = async () => {
    try {
      const data = await fetchLevelToday();
      setLoggedTodayList(data.mindful_logs || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadTodayData();
  }, []);

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
      confetti({ particleCount: 45, spread: 60, colors: ['#00A4EF', '#92D050'] });
      if (onLogged) onLogged();
      await loadTodayData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMindfulLog = async (id) => {
    try {
      await deleteMindfulLog(id);
      await loadTodayData();
      if (onLogged) onLogged();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 space-y-4 max-h-[760px] overflow-y-auto">
      <div className="space-y-1">
        <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
          <Brain className="w-4 h-4 text-sky-400" />
          <span>Mindful Restoration & Parasympathetic Recovery</span>
        </h2>
        <p className="text-[11px] text-slate-300">
          Infers stress relief and passive mood replenishment without manual sliders.
        </p>
      </div>

      {/* Activity list */}
      <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
        {mindfulList.map((m) => {
          const isSelected = selectedId === m.id;
          return (
            <motion.div
              whileHover={{ scale: 1.01 }}
              key={m.id}
              onClick={() => handleSelect(m)}
              className={`p-3 rounded-2xl border cursor-pointer transition-all glass-aero ${
                isSelected
                  ? 'border-sky-400 bg-sky-950/40 text-white glow-aero-blue'
                  : 'border-white/10 bg-slate-900/60 text-slate-300 hover:border-sky-400/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold">{m.name}</div>
                  <div className="text-[10px] text-sky-300/80 capitalize mt-0.5">
                    Type: {m.type} · Target: {m.default_duration_min} min
                  </div>
                </div>
                {isSelected && <Check className="w-4 h-4 text-sky-400" />}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Duration selector */}
      <div className="p-3.5 glass-aero rounded-2xl space-y-2">
        <label className="text-xs text-slate-200 font-bold">Session Duration (Minutes)</label>
        <div className="flex items-center gap-2">
          {[5, 8, 10, 15, 20].map((mins) => (
            <button
              key={mins}
              type="button"
              onClick={() => setDurationMin(mins)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                durationMin === mins
                  ? 'bg-gradient-to-r from-sky-500 to-indigo-600 border-sky-300 text-white glow-aero-blue'
                  : 'bg-slate-900 border-white/20 text-slate-300 hover:text-white'
              }`}
            >
              {mins}m
            </button>
          ))}
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={handleLog}
        disabled={submitting}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-extrabold text-xs shadow-lg glow-aero-blue"
      >
        {submitting ? 'Logging...' : 'Complete Mindful Quest'}
      </motion.button>

      {/* Logged Today List with Delete Buttons */}
      {loggedTodayList.length > 0 && (
        <div className="p-4 rounded-2xl glass-aero space-y-2">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Mindful Sessions Logged Today</h3>
          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {loggedTodayList.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-white/10 text-xs">
                <div>
                  <span className="font-bold text-white">{item.name}</span> ({item.duration_min} min)
                </div>
                <button
                  onClick={() => handleDeleteMindfulLog(item.id)}
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
