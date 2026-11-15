import React from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-6 space-y-6">
      <div className="relative">
        <div className="w-20 h-20 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-pulse" />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
          QUEST COACH
        </h2>
        <p className="text-sm text-slate-400">
          Initializing Expert AI Systems & Knowledge Base...
        </p>
      </div>

      <div className="mt-8 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-400">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span>General guidance only, not medical advice</span>
      </div>
    </div>
  );
}
