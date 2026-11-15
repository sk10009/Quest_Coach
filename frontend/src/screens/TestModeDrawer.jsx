import React, { useState, useEffect } from 'react';
import { testAdvanceDay, testSimulateMissedDay, fetchAgentTelemetry } from '../api';
import { Terminal, Play, FastForward, AlertTriangle, RefreshCw, X, Code, Activity } from 'lucide-react';

export default function TestModeDrawer({ isOpen, onClose, onStateUpdated }) {
  const [telemetry, setTelemetry] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState(null);

  const loadTelemetry = async () => {
    try {
      const data = await fetchAgentTelemetry();
      setTelemetry(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTelemetry();
    }
  }, [isOpen]);

  const handleAdvanceDay = async () => {
    setLoading(true);
    setActionMsg(null);
    try {
      const res = await testAdvanceDay();
      setActionMsg(`Simulated day advanced to: ${res.simulated_date}. Level: ${res.current_level}`);
      await loadTelemetry();
      if (onStateUpdated) onStateUpdated();
    } catch (err) {
      setActionMsg(`Advance failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateMiss = async () => {
    setLoading(true);
    setActionMsg(null);
    try {
      const res = await testSimulateMissedDay();
      setActionMsg(
        `Miss simulated! Consecutive misses: ${res.consecutive_unexcused_misses}. Non-monotonic override: ${res.non_monotonic_override_applied}`
      );
      await loadTelemetry();
      if (onStateUpdated) onStateUpdated();
    } catch (err) {
      setActionMsg(`Simulate miss failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end transition-all">
      <div className="w-full max-w-md bg-slate-950 border-l border-slate-800 h-full p-4 flex flex-col justify-between text-xs overflow-y-auto">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="font-mono font-bold text-white uppercase tracking-wider">
                Desktop Test Mode & AI Telemetry
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Test Action Controls */}
          <div className="space-y-2">
            <span className="font-semibold text-slate-300">Simulation Controls</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleAdvanceDay}
                disabled={loading}
                className="p-2.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/50 text-indigo-300 font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <FastForward className="w-3.5 h-3.5" />
                <span>Advance 1 Day</span>
              </button>

              <button
                onClick={handleSimulateMiss}
                disabled={loading}
                className="p-2.5 rounded-xl bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/50 text-amber-300 font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Simulate Miss</span>
              </button>
            </div>
          </div>

          {actionMsg && (
            <div className="p-2.5 rounded-xl bg-slate-900 border border-emerald-500/30 text-emerald-300 font-mono text-[11px]">
              {actionMsg}
            </div>
          )}

          {/* Live AI Telemetry Panels */}
          {telemetry && (
            <div className="space-y-3 pt-2 border-t border-slate-800 font-mono">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Subsystems Telemetry</span>
                </span>
                <button
                  onClick={loadTelemetry}
                  className="p-1 rounded bg-slate-900 text-slate-400 hover:text-white"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>

              {/* Passive States */}
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="text-slate-400 font-semibold text-[10px]">Passive Latent States:</div>
                <div className="text-slate-200">
                  Inferred Mood: <span className="text-emerald-400 font-bold">{telemetry.passive_states.inferred_mood}</span> | 
                  Inferred Fatigue: <span className="text-amber-400 font-bold">{telemetry.passive_states.inferred_fatigue}</span>
                </div>
              </div>

              {/* Bayesian Network */}
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="text-slate-400 font-semibold text-[10px]">Bayesian Player Model (Unit 4):</div>
                <div className="text-slate-200">
                  P(StreakBreak): <span className="text-rose-400 font-bold">{telemetry.bayesian_model.streak_break_risk}</span> | 
                  Weakest: <span className="text-indigo-300 font-bold uppercase">{telemetry.bayesian_model.weakest_pillar}</span>
                </div>
              </div>

              {/* Fuzzy Controller */}
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="text-slate-400 font-semibold text-[10px]">Fuzzy Difficulty Controller (Unit 5):</div>
                <div className="text-slate-200">
                  Regime: <span className="text-indigo-400 font-bold uppercase">{telemetry.fuzzy_difficulty_controller.regime}</span> ({telemetry.fuzzy_difficulty_controller.target_multiplier}x targets)
                </div>
              </div>

              {/* Readiness Classifier */}
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="text-slate-400 font-semibold text-[10px]">Supervised Readiness (Unit 1 & 4):</div>
                <div className="text-slate-200">
                  Drop-off Prob: <span className="text-amber-400 font-bold">{telemetry.readiness_predictor.drop_off_risk}</span> | 
                  Non-Monotonic Override: <span className="text-white font-bold">{String(telemetry.readiness_predictor.non_monotonic_override)}</span>
                </div>
              </div>

              {/* Forward Chaining Traces */}
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="text-slate-400 font-semibold text-[10px]">Rule Engine Traces (Unit 3 & 5):</div>
                <div className="text-[10px] text-slate-300">
                  {telemetry.forward_chaining_rule_trace.length > 0 ? (
                    telemetry.forward_chaining_rule_trace.map((r, i) => (
                      <div key={i} className="text-emerald-400">✓ {r}</div>
                    ))
                  ) : (
                    <div className="text-slate-500">No active rule firings</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-900 text-center text-slate-500 text-[10px]">
          Quest Coach Verification Harness · Course 25AM2304
        </div>
      </div>
    </div>
  );
}
