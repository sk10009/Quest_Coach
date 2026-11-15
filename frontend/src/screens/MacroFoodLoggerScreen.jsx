import React, { useState, useMemo } from 'react';
import { Search, Plus, Apple, Sparkles, Filter, Check, AlertCircle } from 'lucide-react';
import { logFood, logCustomMeal } from '../api';
import confetti from 'canvas-confetti';

export default function MacroFoodLoggerScreen({ catalogue, onClose, onLogged, onOpenOverview }) {
  const [activeTab, setActiveTab] = useState('catalogue'); // 'catalogue' | 'custom'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [selectedIsa, setSelectedIsa] = useState('All');

  // Portion modal state
  const [selectedFood, setSelectedFood] = useState(null);
  const [portionGrams, setPortionGrams] = useState(100);
  const [submitting, setSubmitting] = useState(false);

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

  // Handle standard food logging
  const handleLogCatalogueFood = async () => {
    if (!selectedFood) return;
    setSubmitting(true);
    try {
      await logFood({
        food_id: selectedFood.id,
        portion_g: Number(portionGrams)
      });
      confetti({ particleCount: 40, spread: 60 });
      if (onLogged) onLogged();
      setSelectedFood(null);
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Add ingredient from catalogue match
  const handleAddMatchingIngredient = (f) => {
    setCustomIngredients([
      ...customIngredients,
      {
        name: f.name,
        portion_g: f.standard_portion_g,
        calories: f.calories,
        protein_g: f.protein_g,
        carbs_g: f.carbs_g,
        fat_g: f.fat_g,
        fibre_g: f.fibre_g,
        is_verified: f.is_verified ?? true
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
      confetti({ particleCount: 60, spread: 70 });
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
      {/* Tab Switcher */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900/80 rounded-2xl border border-slate-800">
        <button
          onClick={() => setActiveTab('catalogue')}
          className={`py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'catalogue' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Food Catalogue ({foods.length})
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          className={`py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'custom' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          "Other Foods" Custom Builder
        </button>
      </div>

      {activeTab === 'catalogue' && (
        <div className="space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search foods, dal, chicken, roti, paneer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Filters: Region & ISA */}
          <div className="flex gap-2 text-xs">
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-300"
            >
              <option value="All">All Regions</option>
              <option value="North Indian">North Indian</option>
              <option value="South Indian">South Indian</option>
              <option value="Pan-Indian">Pan-Indian</option>
              <option value="Gym Staple">Gym Staple</option>
            </select>

            <select
              value={selectedIsa}
              onChange={(e) => setSelectedIsa(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-300"
            >
              <option value="All">All Categories (isa)</option>
              <option value="protein_food">Protein Foods</option>
              <option value="dairy">Dairy</option>
              <option value="lentils">Lentils & Dals</option>
              <option value="cereal_grain">Rice & Grains</option>
              <option value="flatbread">Roti & Breads</option>
              <option value="fruit">Fruits</option>
            </select>
          </div>

          {/* Food List */}
          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {filteredFoods.map((f) => (
              <div
                key={f.id}
                onClick={() => {
                  setSelectedFood(f);
                  setPortionGrams(f.standard_portion_g);
                }}
                className="p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 rounded-xl cursor-pointer flex items-center justify-between transition-all"
              >
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>{f.name}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                      {f.region}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {f.calories} kcal · P: {f.protein_g}g · C: {f.carbs_g}g · F: {f.fat_g}g ({f.standard_portion_g}g)
                  </div>
                </div>
                <button className="px-2.5 py-1 rounded-lg bg-emerald-600/20 text-emerald-300 text-xs font-semibold border border-emerald-500/40">
                  Select
                </button>
              </div>
            ))}
          </div>

          {/* Portion Confirmation Drawer / Modal */}
          {selectedFood && (
            <div className="p-4 bg-slate-900 border border-emerald-500/50 rounded-2xl space-y-3 mt-2 shadow-xl">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-white">{selectedFood.name}</span>
                <span className="text-xs text-emerald-400">
                  {Math.round((selectedFood.calories * portionGrams) / selectedFood.standard_portion_g)} kcal
                </span>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs text-slate-400">Portion (grams):</label>
                <input
                  type="number"
                  value={portionGrams}
                  onChange={(e) => setPortionGrams(e.target.value)}
                  className="w-24 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedFood(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogCatalogueFood}
                  disabled={submitting}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                >
                  {submitting ? 'Logging...' : 'Confirm & Log'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Custom Meal Builder ("Other Foods") */}
      {activeTab === 'custom' && (
        <div className="space-y-3 bg-slate-800/40 border border-slate-700/60 p-4 rounded-2xl text-xs max-h-[460px] overflow-y-auto">
          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Custom Meal / Recipe Name</label>
            <input
              type="text"
              placeholder="e.g., Mom's Special Soya Matar Curry"
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-slate-400">Region</label>
              <select
                value={mealRegion}
                onChange={(e) => setMealRegion(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-1.5 text-slate-300"
              >
                <option value="Pan-Indian">Pan-Indian</option>
                <option value="North Indian">North Indian</option>
                <option value="South Indian">South Indian</option>
              </select>
            </div>
            <div>
              <label className="text-slate-400">Makes N Servings</label>
              <input
                type="number"
                min="1"
                value={servingsCount}
                onChange={(e) => setServingsCount(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-1.5 text-white"
              />
            </div>
            <div>
              <label className="text-slate-400">Oil/Ghee Added (g)</label>
              <input
                type="number"
                min="0"
                value={oilGheeGrams}
                onChange={(e) => setOilGheeGrams(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-1.5 text-white"
              />
            </div>
          </div>

          {/* Search & Add Catalogue Ingredient */}
          <div className="pt-2 border-t border-slate-700/50 space-y-1.5">
            <label className="font-semibold text-slate-300">Search Catalogue Ingredient</label>
            <input
              type="text"
              placeholder="Type to find ingredient (e.g. paneer, rice)..."
              value={ingSearch}
              onChange={(e) => setIngSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white"
            />
            {ingSearch && (
              <div className="max-h-28 overflow-y-auto bg-slate-900 border border-slate-800 rounded-xl p-1 space-y-1">
                {foods
                  .filter((f) => f.name.toLowerCase().includes(ingSearch.toLowerCase()))
                  .slice(0, 5)
                  .map((f) => (
                    <div
                      key={f.id}
                      onClick={() => handleAddMatchingIngredient(f)}
                      className="p-1.5 hover:bg-slate-800 rounded-lg flex items-center justify-between cursor-pointer"
                    >
                      <span className="text-[11px] text-white">{f.name}</span>
                      <span className="text-[10px] text-emerald-400">Add</span>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Manual Ingredient Fallback */}
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-amber-400 text-[11px]">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Or Add Unverified Manual Ingredient</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Ingredient"
                value={customIngName}
                onChange={(e) => setCustomIngName(e.target.value)}
                className="col-span-2 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white"
              />
              <input
                type="number"
                placeholder="Grams"
                value={customIngGrams}
                onChange={(e) => setCustomIngGrams(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white"
              />
            </div>
            <div className="grid grid-cols-4 gap-1.5 text-[10px]">
              <input
                type="number"
                placeholder="Cals"
                value={customIngCal}
                onChange={(e) => setCustomIngCal(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-1.5 py-1 text-white"
              />
              <input
                type="number"
                placeholder="Prot"
                value={customIngProt}
                onChange={(e) => setCustomIngProt(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-1.5 py-1 text-white"
              />
              <input
                type="number"
                placeholder="Carb"
                value={customIngCarb}
                onChange={(e) => setCustomIngCarb(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-1.5 py-1 text-white"
              />
              <input
                type="number"
                placeholder="Fat"
                value={customIngFat}
                onChange={(e) => setCustomIngFat(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-1.5 py-1 text-white"
              />
            </div>
            <button
              onClick={handleAddManualIngredient}
              className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-[11px]"
            >
              Add Unverified Ingredient
            </button>
          </div>

          {/* Ingredients Added List */}
          <div className="space-y-1">
            <span className="font-semibold text-slate-300">
              Recipe Ingredients ({customIngredients.length})
            </span>
            {customIngredients.map((ing, i) => (
              <div
                key={i}
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px]"
              >
                <span>
                  {ing.name} ({ing.portion_g}g)
                  {!ing.is_verified && (
                    <span className="ml-1 text-[9px] text-amber-400">(unverified)</span>
                  )}
                </span>
                <span className="text-slate-400">{ing.calories} kcal</span>
              </div>
            ))}
          </div>

          <button
            onClick={handleSaveCustomMeal}
            disabled={submitting || !mealName || customIngredients.length === 0}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs disabled:opacity-50"
          >
            {submitting ? 'Saving to Knowledge Base...' : 'Save & Log Custom Meal'}
          </button>
        </div>
      )}
    </div>
  );
}
