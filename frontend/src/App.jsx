import React, { useState, useEffect } from 'react';
import { fetchProfile, fetchCatalogue } from './api';
import LoadingScreen from './screens/LoadingScreen';
import ProfileSetupScreen from './screens/ProfileSetupScreen';
import LevelPathwayScreen from './screens/LevelPathwayScreen';
import LevelScreen from './screens/LevelScreen';
import ExerciseLoggerScreen from './screens/ExerciseLoggerScreen';
import MacroFoodLoggerScreen from './screens/MacroFoodLoggerScreen';
import MindfulLoggerScreen from './screens/MindfulLoggerScreen';
import MealOverviewScreen from './screens/MealOverviewScreen';
import BossLevelScreen from './screens/BossLevelScreen';
import ProfileScreen from './screens/ProfileScreen';
import TestModeDrawer from './screens/TestModeDrawer';
import { ShieldCheck, MapPin, Activity, User, Home, ArrowLeft, Terminal, Sparkles, Coins } from 'lucide-react';
import { motion } from 'framer-motion';

export default function App() {
  const [profile, setProfile] = useState(null);
  const [catalogue, setCatalogue] = useState({ foods: [], exercises: [], mindful: [] });
  const [loading, setLoading] = useState(true);

  // Active view state: 'pathway' | 'level' | 'logger_exercise' | 'logger_food' | 'logger_mindful' | 'meal_overview' | 'boss' | 'profile'
  const [currentScreen, setCurrentScreen] = useState('pathway');
  const [overviewFoodId, setOverviewFoodId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeBossChallenge, setActiveBossChallenge] = useState(null);

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
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-[390px] min-h-[844px] glass-aero rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-center">
          <LoadingScreen />
        </div>
      </div>
    );
  }

  // If no profile exists, show Screen 2 Profile Setup
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-[390px] min-h-[844px] glass-aero rounded-3xl overflow-hidden shadow-2xl">
          <ProfileSetupScreen
            onProfileCreated={(newProfile) => {
              setProfile({ profile: newProfile, rank: 1, level: 1, tokens: 5, xp: 0 });
              setCurrentScreen('pathway');
            }}
          />
        </div>
      </div>
    );
  }

  const currentXp = profile.xp || 0;
  const xpNextLevel = 500;
  const xpPercent = Math.min(100, Math.round((currentXp % xpNextLevel) / xpNextLevel * 100));

  return (
    <div className="min-h-screen flex items-center justify-center p-0 sm:p-4">
      {/* 390x844px Mobile-First Xbox 360 NXE x Frutiger Aero Frame */}
      <div className="w-full max-w-[390px] min-h-[844px] h-[844px] glass-aero sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between relative border border-white/30">
        
        {/* Floating Bokeh Orbs Background Element */}
        <div className="absolute top-10 left-6 w-32 h-32 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none" />
        <div className="absolute bottom-20 right-6 w-40 h-40 rounded-full bg-sky-500/15 blur-2xl pointer-events-none" />

        {/* Top HUD */}
        <header className="px-4 py-3 bg-slate-900/70 backdrop-blur-md border-b border-white/20 flex items-center justify-between z-20">
          <div className="flex items-center gap-2">
            {currentScreen !== 'pathway' && (
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setCurrentScreen('pathway')}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20"
              >
                <ArrowLeft className="w-4 h-4" />
              </motion.button>
            )}
            <div className="flex items-center gap-1.5">
              {/* Glowing Xbox-sphere Tiered Rank Badge */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-lime-600 to-emerald-400 border border-white/50 flex items-center justify-center text-white font-black text-xs glow-xbox shadow-md">
                R{profile.rank || 1}
              </div>
              <div>
                <div className="text-[10px] text-lime-400 font-bold uppercase tracking-wider">Rank Tier</div>
                <div className="text-xs font-bold text-white">Lvl {profile.level || 1}</div>
              </div>
            </div>
          </div>

          {/* XP Bar & Token Counter */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <div className="text-[9px] text-slate-300 font-semibold">{currentXp} XP</div>
              <div className="w-16 h-1.5 rounded-full bg-slate-800 border border-white/20 overflow-hidden mt-0.5">
                <div className="h-full bg-gradient-to-r from-lime-500 to-emerald-400" style={{ width: `${xpPercent}%` }} />
              </div>
            </div>

            <motion.div
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-extrabold glow-gold"
            >
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>{profile.tokens ?? 5}</span>
            </motion.div>

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setIsDrawerOpen(true)}
              title="Open Test Mode Drawer"
              className="p-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 glow-aero-blue"
            >
              <Terminal className="w-4 h-4" />
            </motion.button>
          </div>
        </header>

        {/* Scrollable Viewport Content */}
        <main className="flex-1 overflow-y-auto z-10">
          {currentScreen === 'pathway' && (
            <LevelPathwayScreen
              profileData={profile}
              onSelectLevel={() => setCurrentScreen('level')}
              onOpenProfile={() => setCurrentScreen('profile')}
            />
          )}

          {currentScreen === 'level' && (
            <LevelScreen
              onOpenLogger={(type) => {
                if (type === 'exercise') setCurrentScreen('logger_exercise');
                if (type === 'food') setCurrentScreen('logger_food');
                if (type === 'mindful') setCurrentScreen('logger_mindful');
              }}
              onOpenBoss={(boss) => {
                setActiveBossChallenge(boss);
                setCurrentScreen('boss');
              }}
              onRefreshState={refreshState}
            />
          )}

          {currentScreen === 'boss' && (
            <BossLevelScreen
              bossChallenge={activeBossChallenge}
              onVictory={() => {
                refreshState();
                setCurrentScreen('pathway');
              }}
              onBack={() => setCurrentScreen('level')}
            />
          )}

          {currentScreen === 'profile' && (
            <ProfileScreen
              profile={profile}
              onClose={() => setCurrentScreen('pathway')}
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
              onOpenOverview={(foodId) => {
                setOverviewFoodId(foodId);
                setCurrentScreen('meal_overview');
              }}
            />
          )}

          {currentScreen === 'meal_overview' && (
            <MealOverviewScreen
              foodId={overviewFoodId}
              onClose={() => setCurrentScreen('logger_food')}
              onSelectPortionAndLog={(food) => {
                setCurrentScreen('logger_food');
              }}
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

        {/* Desktop Test Mode Drawer */}
        <TestModeDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onStateUpdated={refreshState}
        />

        {/* Bottom Navigation */}
        <nav className="px-4 py-2 bg-slate-900/80 backdrop-blur-md border-t border-white/20 flex items-center justify-around z-20">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setCurrentScreen('pathway')}
            className={`flex flex-col items-center gap-1 text-[11px] font-bold transition-colors ${
              currentScreen === 'pathway' ? 'text-lime-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Pathway</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setCurrentScreen('level')}
            className={`flex flex-col items-center gap-1 text-[11px] font-bold transition-colors ${
              currentScreen === 'level' ? 'text-lime-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Today's Quests</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setCurrentScreen('profile')}
            className={`flex flex-col items-center gap-1 text-[11px] font-bold transition-colors ${
              currentScreen === 'profile' ? 'text-lime-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile</span>
          </motion.button>
        </nav>
      </div>
    </div>
  );
}
