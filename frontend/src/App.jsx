import React, { useState, useEffect } from 'react';
import { fetchProfile, fetchCatalogue } from './api';
import LoadingScreen from './screens/LoadingScreen';
import ProfileSetupScreen from './screens/ProfileSetupScreen';
import LevelPathwayScreen from './screens/LevelPathwayScreen';
import LevelScreen from './screens/LevelScreen';
import ExerciseLoggerScreen from './screens/ExerciseLoggerScreen';
import MacroFoodLoggerScreen from './screens/MacroFoodLoggerScreen';
import MindfulLoggerScreen from './screens/MindfulLoggerScreen';
import { ShieldCheck, MapPin, Activity, User, Home, ArrowLeft } from 'lucide-react';

export default function App() {
  const [profile, setProfile] = useState(null);
  const [catalogue, setCatalogue] = useState({ foods: [], exercises: [], mindful: [] });
  const [loading, setLoading] = useState(true);

  // Active view state: 'pathway' | 'level' | 'logger_exercise' | 'logger_food' | 'logger_mindful'
  const [currentScreen, setCurrentScreen] = useState('pathway');

  const refreshState = async () => {
    try {
      const [profData, catData] = await Promise.all([
        fetchProfile().catch(() => null),
        fetchCatalogue().catch(() => ({ foods: [], exercises: [], mindful: [] }))
      ]);
      setProfile(profData);
      setCatalogue(catData);
    } catch (err) {
      console.error('Initialization error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshState();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-full max-w-[390px] min-h-[844px] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-center">
          <LoadingScreen />
        </div>
      </div>
    );
  }

  // If no profile exists, show Screen 2 Profile Setup
  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-2">
        <div className="w-full max-w-[390px] min-h-[844px] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <ProfileSetupScreen
            onProfileCreated={(newProfile) => {
              setProfile(newProfile);
              setCurrentScreen('pathway');
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-0 sm:p-4">
      {/* 390x844px Mobile-First Frame */}
      <div className="w-full max-w-[390px] min-h-[844px] h-[844px] bg-slate-900 border border-slate-800 sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between relative">
        
        {/* Top App Header */}
        <header className="px-4 py-3 bg-slate-900/90 backdrop-blur border-b border-slate-800/80 flex items-center justify-between z-20">
          <div className="flex items-center gap-2">
            {currentScreen !== 'pathway' && (
              <button
                onClick={() => setCurrentScreen('pathway')}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <span className="font-extrabold text-sm tracking-tight bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
              QUEST COACH
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-semibold">
              R{profile.rank || 1}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold">
              🪙 {profile.tokens ?? 5}
            </span>
          </div>
        </header>

        {/* Scrollable Viewport Content */}
        <main className="flex-1 overflow-y-auto">
          {currentScreen === 'pathway' && (
            <LevelPathwayScreen
              profileData={profile}
              onSelectLevel={() => setCurrentScreen('level')}
            />
          )}

          {currentScreen === 'level' && (
            <LevelScreen
              onOpenLogger={(type) => {
                if (type === 'exercise') setCurrentScreen('logger_exercise');
                if (type === 'food') setCurrentScreen('logger_food');
                if (type === 'mindful') setCurrentScreen('logger_mindful');
              }}
              onRefreshState={refreshState}
            />
          )}

          {currentScreen === 'logger_exercise' && (
            <ExerciseLoggerScreen
              catalogue={catalogue}
              onClose={() => setCurrentScreen('level')}
              onLogged={refreshState}
            />
          )}

          {currentScreen === 'logger_food' && (
            <MacroFoodLoggerScreen
              catalogue={catalogue}
              onClose={() => setCurrentScreen('level')}
              onLogged={refreshState}
            />
          )}

          {currentScreen === 'logger_mindful' && (
            <MindfulLoggerScreen
              catalogue={catalogue}
              onClose={() => setCurrentScreen('level')}
              onLogged={refreshState}
            />
          )}
        </main>

        {/* Bottom Navigation */}
        <nav className="px-4 py-2 bg-slate-900/90 backdrop-blur border-t border-slate-800/80 flex items-center justify-around z-20">
          <button
            onClick={() => setCurrentScreen('pathway')}
            className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
              currentScreen === 'pathway' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Pathway</span>
          </button>

          <button
            onClick={() => setCurrentScreen('level')}
            className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
              currentScreen === 'level' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Today's Quest</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
