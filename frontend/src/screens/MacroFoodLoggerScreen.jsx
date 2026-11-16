import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Apple, Sparkles, Filter, Check, AlertCircle, Trash2, Layers, Cpu } from 'lucide-react';
import { logFood, logCustomMeal, fetchLevelToday, deleteFoodLog, fetchCatalogue } from '../api';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';

export default function MacroFoodLoggerScreen({ catalogue, onClose, onLogged, onOpenOverview }) {
  const [activeTab, setActiveTab] = useState('catalogue'); // 'catalogue' | 'tray' | 'custom'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [selectedIsa, setSelectedIsa] = useState('All');

  // Portion modal state
  const [selectedFood, setSelectedFood] = useState(null);
  const [portionGrams, setPortionGrams] = useState(100);
  const [submitting, setSubmitting] = useState(false);

  // Multi-item Meal Tray batching state
  const [mealTray, setMealTray] = useState([]);

  // Logged today items
  const [loggedTodayList, setLoggedTodayList] = useState([]);

  // Custom meal builder state
  const [mealName, setMealName] = useState('');
  const [mealRegion, setMealRegion] = useState('Pan-Indian');
  const [servingsCount, setServingsCount] = useState(1);
  const [oilGheeGrams, setOilGheeGrams] = useState(10);
  const [prepState, setPrepState] = useState('cooked');
  const [customIngredients, setCustomIngredients] = useState([]);

  // Ingredient search inside builder
  const [ingSearch, setIngSearch] = useState('');
  const [customIngName, setCustomIngName] = useState('');
  const [customIngGrams, setCustomIngGrams] = useState(100);
  const [customIngCal, setCustomIngCal] = useState(150);
  const [customIngProt, setCustomIngProt] = useState(10);
  const [customIngCarb, setCustomIngCarb] = useState(15);
  const [customIngFat, setCustomIngFat] = useState(5);
  const [customIngFibre, setCustomIngFibre] = useState(2);

  const foods = catalogue.foods || [];
  const pairings = catalogue.pairings || [];

  const loadTodayData = async () => {
    try {
      const data = await fetchLevelToday();
      setLoggedTodayList(data.food_logs || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadTodayData();
  }, []);

  // Filtered foods for catalogue
  const filteredFoods = useMemo(() => {
    return foods.filter((f) => {
      const matchSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.isa_hierarchy.some(h => h.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchRegion = selectedRegion === 'All' || f.region === selectedRegion;
      const matchIsa = selectedIsa === 'All' || f.isa_hierarchy.includes(selectedIsa);
      return matchSearch && matchRegion && matchIsa;
    });
  }, [foods, searchQuery, selectedRegion, selectedIsa]);

  // Handle standard food logging immediately
  const handleLogCatalogueFood = async (foodItem, grams) => {
    setSubmitting(true);
    try {
      await logFood({
        food_id: foodItem.id,
        portion_g: Number(grams)
      });
      confetti({ particleCount: 40, spread: 60, colors: ['#76B900', '#00A4EF'] });
      if (onLogged) onLogged();
      await loadTodayData();
      setSelectedFood(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Add to multi-item meal tray
  const handleAddToTray = (foodItem, grams) => {
    const factor = Number(grams) / float(foodItem.standard_portion_g || 100);
    const trayItem = {
      id: foodItem.id,
      name: foodItem.name,
      portion_g: Number(grams),
      calories: Math.round(foodItem.calories * factor * 10) / 10,
      protein_g: Math.round(foodItem.protein_g * factor * 10) / 10,
      carbs_g: Math.round(foodItem.carbs_g * factor * 10) / 10,
      fat_g: Math.round(foodItem.fat_g * factor * 10) / 10,
      fibre_g: Math.round(foodItem.fibre_g * factor * 10) / 10,
    };
    setMealTray([...mealTray, trayItem]);
    setSelectedFood(null);
  };

  const handleBatchLogTray = async () => {
    if (mealTray.length === 0) return;
    setSubmitting(true);
    try {
      for (const item of mealTray) {
        await logFood({ food_id: item.id, portion_g: item.portion_g });
      }
      confetti({ particleCount: 60, spread: 80, colors: ['#76B900', '#FFB900'] });
      setMealTray([]);
      if (onLogged) onLogged();
      await loadTodayData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Smart pairings suggestion for selected food
  const smartPairingSuggestions = useMemo(() => {
    if (!selectedFood) return [];
    const match = pairings.find(p => p.food_id === selectedFood.id);
    if (!match) return [];
    return foods.filter(f => match.pairs_well_with.includes(f.id));
  }, [selectedFood, pairings, foods]);

  // Add ingredient from catalogue match
  const handleAddMatchingIngredient = (f) => {
    setCustomIngredients([
      ...customIngredients,
      {
        name: f.name,
        portion_g: f.standard_portion_g || 100,
        calories: f.calories,
        protein_g: f.protein_g,
        carbs_g: f.carbs_g,
        fat_g: f.fat_g,
        fibre_g: f.fibre_g,
        is_verified: true
      }
    ]);
    setIngSearch('');
  };

  // Add manual unverified ingredient
  const handleAddManualIngredient = () => {
    if (!customIngName) return;
    setCustomIngredients([
      ...customIngredients,
      {
        name: customIngName,
        portion_g: Number(customIngGrams),
        calories: Number(customIngCal),
        protein_g: Number(customIngProt),
        carbs_g: Number(customIngCarb),
        fat_g: Number(customIngFat),
        fibre_g: Number(customIngFibre),
        is_verified: false
      }
    ]);
    setCustomIngName('');
  };

  // Save custom meal
  const handleSaveCustomMeal = async () => {
    if (!mealName || customIngredients.length === 0) return;
    setSubmitting(true);
    try {
      await logCustomMeal({
        name: mealName,
        region: mealRegion,
        preparation_state: prepState,
        servings_count: Number(servingsCount),
        oil_ghee_g: Number(oilGheeGrams),
        ingredients: customIngredients
      });
      confetti({ particleCount: 70, spread: 80, colors: ['#76B900', '#00A4EF'] });
      if (onLogged) onLogged();
      await loadTodayData();
      setCustomIngredients([]);
      setMealName('');
      setActiveTab('catalogue');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFoodLog = async (id) => {
    try {
      await deleteFoodLog(id);
      await loadTodayData();
      if (onLogged) onLogged();
    } catch (err) {
      console.error(err);
    }
  };

  // Calculate tray totals for segmented macro bar
  const trayTotals = useMemo(() => {
    return mealTray.reduce((acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein_g,
      carbs: acc.carbs + item.carbs_g,
      fat: acc.fat + item.fat_g,
      fibre: acc.fibre + item.fibre_g,
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 });
  }, [mealTray]);

  return (
    <div className="p-4 space-y-4 max-h-[760px] overflow-y-auto">
      {/* Tab Switcher */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900/80 rounded-2xl border border-white/20">
        <button
          onClick={() => setActiveTab('catalogue')}
          className={`py-2 text-[11px] font-bold rounded-xl transition-all ${
            activeTab === 'catalogue' ? 'bg-gradient-to-r from-lime-600 to-emerald-500 text-white shadow glow-xbox' : 'text-slate-400 hover:text-white'
          }`}
        >
          Catalogue ({foods.length})
        </button>
        <button
          onClick={() => setActiveTab('tray')}
          className={`py-2 text-[11px] font-bold rounded-xl transition-all relative ${
            activeTab === 'tray' ? 'bg-gradient-to-r from-lime-600 to-emerald-500 text-white shadow glow-xbox' : 'text-slate-400 hover:text-white'
          }`}
        >
          Meal Tray ({mealTray.length})
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          className={`py-2 text-[11px] font-bold rounded-xl transition-all ${
            activeTab === 'custom' ? 'bg-gradient-to-r from-lime-600 to-emerald-500 text-white shadow glow-xbox' : 'text-slate-400 hover:text-white'
          }`}
        >
          Custom Builder
        </button>
      </div>

      {/* Tab 1: Catalogue */}
      {activeTab === 'catalogue' && (
        <div className="space-y-3">
          {/* Search & Filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search food items (e.g. whey, chicken, dal)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/80 border border-white/20 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-lime-400"
              />
            </div>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="bg-slate-900/80 border border-white/20 rounded-xl px-2.5 py-2 text-xs text-slate-200"
            >
              <option value="All">All Regions</option>
              <option value="Pan-Indian">Pan-Indian</option>
              <option value="South Indian">South Indian</option>
              <option value="Global">Global</option>
            </select>
          </div>

          {/* Food Grid / List */}
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {filteredFoods.map((f) => (
              <motion.div
                whileHover={{ scale: 1.01 }}
                key={f.id}
                className="p-3 rounded-2xl border border-white/15 bg-slate-900/60 flex items-center justify-between gap-3 glass-aero"
              >
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>{f.name}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                      {f.calories} kcal / {f.standard_portion_g}g
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    P: <span className="text-white font-semibold">{f.protein_g}g</span> · 
                    C: <span className="text-white font-semibold"> {f.carbs_g}g</span> · 
                    F: <span className="text-white font-semibold"> {f.fat_g}g</span> · 
                    Fibre: <span className="text-white font-semibold"> {f.fibre_g}g</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onOpenOverview && onOpenOverview(f.id)}
                    className="px-2.5 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-[10px] font-bold"
                  >
                    AI Overview
                  </button>
                  <button
                    onClick={() => setSelectedFood(f)}
                    className="p-2 rounded-xl bg-gradient-to-r from-lime-600 to-emerald-500 hover:from-lime-500 hover:to-emerald-400 text-white font-bold text-xs glow-xbox shadow"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Meal Tray Batching */}
      {activeTab === 'tray' && (
        <div className="space-y-4 glass-aero p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-lime-400" />
              <span>Multi-Item Meal Tray Batching</span>
            </h3>
            <span className="text-xs text-lime-400 font-bold">{mealTray.length} items</span>
          </div>

          {mealTray.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              Your meal tray is empty. Add food items from the Catalogue tab.
            </div>
          ) : (
            <div className="space-y-2 max-h-[240px] overflow-y-auto">
              {mealTray.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-xs">
                  <div>
                    <div className="font-bold text-white">{item.name} ({item.portion_g}g)</div>
                    <div className="text-[10px] text-slate-400">
                      {item.calories} kcal · P: {item.protein_g}g · C: {item.carbs_g}g · F: {item.fat_g}g
                    </div>
                  </div>
                  <button
                    onClick={() => setMealTray(mealTray.filter((_, i) => i !== idx))}
                    className="p-1 rounded-lg bg-rose-500/20 text-rose-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Real-Time Segmented Macro Bar */}
          {mealTray.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="flex justify-between text-xs font-bold text-slate-200">
                <span>Tray Total Macros</span>
                <span className="text-lime-400">{Math.round(trayTotals.calories)} kcal</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-950 flex overflow-hidden border border-white/20">
                <div className="bg-emerald-500 h-full" style={{ width: `${Math.min(100, trayTotals.protein * 2)}%` }} title="Protein" />
                <div className="bg-sky-400 h-full" style={{ width: `${Math.min(100, trayTotals.carbs * 1.5)}%` }} title="Carbs" />
                <div className="bg-amber-400 h-full" style={{ width: `${Math.min(100, trayTotals.fat * 3)}%` }} title="Fat" />
                <div className="bg-teal-400 h-full" style={{ width: `${Math.min(100, trayTotals.fibre * 4)}%` }} title="Fibre" />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>Protein: {Math.round(trayTotals.protein)}g</span>
                <span>Carbs: {Math.round(trayTotals.carbs)}g</span>
                <span>Fat: {Math.round(trayTotals.fat)}g</span>
                <span>Fibre: {Math.round(trayTotals.fibre)}g</span>
              </div>

              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handleBatchLogTray}
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-lime-600 to-emerald-500 text-white font-extrabold text-xs shadow-lg glow-xbox"
              >
                {submitting ? 'Logging Tray...' : 'Log Entire Meal Tray Now'}
              </motion.button>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Custom Meal Node Graph Builder */}
      {activeTab === 'custom' && (
        <div className="space-y-4 glass-aero p-4 rounded-2xl">
          <div className="flex items-center gap-1.5 text-xs font-bold text-lime-400">
            <Cpu className="w-4 h-4 text-lime-400 animate-pulse" />
            <span>Custom Meal Node Graph & Ingredient Builder</span>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Custom Meal Name (e.g. Muscle Bowl)..."
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                className="w-full bg-slate-900 border border-white/20 rounded-xl px-3 py-2 text-xs text-white"
              />
              <select
                value={mealRegion}
                onChange={(e) => setMealRegion(e.target.value)}
                className="w-full bg-slate-900 border border-white/20 rounded-xl px-2.5 py-2 text-xs text-slate-200"
              >
                <option value="Pan-Indian">Pan-Indian</option>
                <option value="South Indian">South Indian</option>
                <option value="Global">Global</option>
              </select>
            </div>

            {/* Ingredient Search / Add */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <label className="text-xs font-bold text-slate-200">Add Ingredients to Node Graph</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search catalogue ingredient..."
                  value={ingSearch}
                  onChange={(e) => setIngSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-white/20 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white"
                />
              </div>

              {ingSearch && (
                <div className="max-h-28 overflow-y-auto space-y-1 bg-slate-950 p-2 rounded-xl border border-white/10">
                  {foods.filter(f => f.name.toLowerCase().includes(ingSearch.toLowerCase())).slice(0, 5).map(f => (
                    <div
                      key={f.id}
                      onClick={() => handleAddMatchingIngredient(f)}
                      className="flex justify-between items-center p-1.5 rounded hover:bg-slate-900 cursor-pointer text-xs text-slate-200"
                    >
                      <span>{f.name} ({f.calories} kcal/{f.standard_portion_g}g)</span>
                      <Plus className="w-3.5 h-3.5 text-lime-400" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Connected SVG Ingredient Node Diagram */}
            {customIngredients.length > 0 && (
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/15 space-y-2">
                <div className="text-[11px] font-bold text-lime-400">Connected Ingredient Node Diagram</div>
                
                {/* SVG Node Graph Visualization */}
                <div className="relative w-full h-24 bg-slate-900 rounded-xl overflow-hidden flex items-center justify-around px-2">
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                    <line x1="20%" y1="50%" x2="80%" y2="50%" stroke="#76B900" strokeWidth="2" strokeDasharray="4" />
                  </svg>
                  {customIngredients.map((ing, idx) => (
                    <div
                      key={idx}
                      className="relative z-10 p-2 rounded-xl bg-slate-800 border border-lime-400/60 text-center shadow-lg"
                      style={{ transform: `scale(${Math.min(1.2, Math.max(0.8, ing.portion_g / 100))})` }}
                    >
                      <div className="text-[10px] font-bold text-white truncate max-w-[70px]">{ing.name}</div>
                      <div className="text-[9px] text-lime-300 font-mono">{ing.portion_g}g ({(ing.calories).toFixed(0)} kcal)</div>
                    </div>
                  ))}
                </div>

                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {customIngredients.map((ing, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs text-slate-300 bg-slate-900 px-2 py-1 rounded-lg">
                      <span>{ing.name} — <strong className="text-lime-400">{ing.portion_g}g</strong> (in grams)</span>
                      <button onClick={() => setCustomIngredients(customIngredients.filter((_, i) => i !== idx))} className="text-rose-400">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleSaveCustomMeal}
              disabled={submitting || !mealName || customIngredients.length === 0}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-lime-600 to-emerald-500 text-white font-extrabold text-xs shadow-lg glow-xbox disabled:opacity-50"
            >
              {submitting ? 'Saving Custom Meal...' : 'Save & Log Custom Meal'}
            </motion.button>
          </div>
        </div>
      )}

      {/* Logged Today List with Delete Buttons */}
      {loggedTodayList.length > 0 && (
        <div className="p-4 rounded-2xl glass-aero space-y-2">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Foods Logged Today</h3>
          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {loggedTodayList.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-white/10 text-xs">
                <div>
                  <span className="font-bold text-white">{item.name}</span> ({item.portion_g}g) · <span className="text-emerald-400">{item.calories} kcal</span>
                </div>
                <button
                  onClick={() => handleDeleteFoodLog(item.id)}
                  className="p-1 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Portion Modal Popup */}
      {selectedFood && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-[340px] glass-aero p-5 rounded-3xl space-y-4 border border-white/30 shadow-2xl"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-black text-white">{selectedFood.name}</h3>
                <div className="text-[11px] text-slate-400">
                  Standard: {selectedFood.standard_portion_g}g · {selectedFood.calories} kcal
                </div>
              </div>
              <button onClick={() => setSelectedFood(null)} className="text-slate-400 hover:text-white font-bold">×</button>
            </div>

            {/* Portion Grams Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200">Portion Size (in grams)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="10"
                  max="1000"
                  step="5"
                  value={portionGrams}
                  onChange={(e) => setPortionGrams(e.target.value)}
                  className="w-full bg-slate-900 border border-white/20 rounded-xl px-3 py-2 text-sm text-white font-bold"
                />
                <span className="text-xs font-bold text-lime-400">grams</span>
              </div>
              <div className="flex gap-2 pt-1">
                {[50, 100, 150, 200, 250].map((g) => (
                  <button
                    key={g}
                    onClick={() => setPortionGrams(g)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                      Number(portionGrams) === g ? 'bg-lime-600 border-lime-400 text-white' : 'bg-slate-900 border-white/20 text-slate-300'
                    }`}
                  >
                    {g}g
                  </button>
                ))}
              </div>
            </div>

            {/* One-Tap Smart Pairing Chips ("Did you pair it with...") */}
            {smartPairingSuggestions.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-white/10">
                <div className="text-[11px] font-bold text-lime-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-lime-400" />
                  <span>Did you pair it with... (Smart Pairing)</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {smartPairingSuggestions.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleAddToTray(p, p.standard_portion_g || 100)}
                      className="px-2.5 py-1 rounded-full bg-lime-500/20 border border-lime-500/40 text-[10px] text-lime-300 font-bold hover:bg-lime-500/30"
                    >
                      + {p.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2">
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => handleAddToTray(selectedFood, portionGrams)}
                className="py-2.5 rounded-xl bg-sky-500/20 border border-sky-500/40 text-sky-300 text-xs font-bold glow-aero-blue"
              >
                Add to Meal Tray
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => handleLogCatalogueFood(selectedFood, portionGrams)}
                disabled={submitting}
                className="py-2.5 rounded-xl bg-gradient-to-r from-lime-600 to-emerald-500 text-white text-xs font-extrabold glow-xbox"
              >
                {submitting ? 'Logging...' : 'Log Instantly'}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
