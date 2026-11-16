"""
FastAPI Entrypoint & REST API for Quest Coach
Spec compliant with /api/v1 endpoints, atomic JSON storage, Target Calculator,
and Phase 1 & 2 logging & pathway routes.
"""
import os
import uuid
from datetime import datetime, date
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.storage import KB_STORE, USER_STORE
from app.target_calculator import TargetCalculator
from app.rule_engine import RULE_ENGINE
from app.utility_and_ga import UtilityAgent, GeneticAlgorithmMealOptimizer
from app.ai_core import AI_ESTIMATOR, BAYES_MODEL, READINESS_PREDICTOR, FUZZY_CONTROLLER
from app.boss_engine import BOSS_ENGINE
from app.schemas import (
    ProfileSetupRequest,
    ExerciseLogRequest,
    FoodLogRequest,
    CustomMealRequest,
    MindfulLogRequest,
    TokenSkipRequest
)

app = FastAPI(
    title="Quest Coach API",
    version="1.2.0",
    description="Intelligent AI & Expert Systems Health & Fitness Companion (Zero SQLite)"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def _get_today_str(state: Dict[str, Any]) -> str:
    simulated_date = state.get("simulated_date")
    if simulated_date:
        return simulated_date
    return date.today().isoformat()

def _ensure_daily_log(state: Dict[str, Any], today_str: str) -> Dict[str, Any]:
    daily_logs = state.setdefault("daily_logs", {})
    if today_str not in daily_logs:
        daily_logs[today_str] = {
            "date": today_str,
            "exercise_completed": False,
            "mindful_completed": False,
            "nutrition_completed": False,
            "calories_logged": 0.0,
            "protein_logged": 0.0,
            "carbs_logged": 0.0,
            "fat_logged": 0.0,
            "fibre_logged": 0.0,
            "exercise_logs": [],
            "food_logs": [],
            "mindful_logs": [],
            "tokens_spent_today": 0,
            "is_planned_rest": False,
            "xp_earned_today": 0
        }
    return daily_logs[today_str]

def _calculate_passive_states(state: Dict[str, Any]) -> Dict[str, float]:
    """Passively infer mood & fatigue from logged behavior (Zero sliders)"""
    profile = state.get("profile")
    if not profile:
        return {"inferred_mood": 0.75, "inferred_fatigue": 0.25}

    daily_logs = state.get("daily_logs", {})
    today_str = _get_today_str(state)
    today_log = daily_logs.get(today_str, {})
    
    # Adherence to target calories
    targets = profile.get("daily_targets", {})
    cal_target = targets.get("calories", 2000)
    cals = today_log.get("calories_logged", 0)
    prot = today_log.get("protein_logged", 0)
    prot_target = targets.get("protein_g", 120)

    # Mood factors: base 0.7
    mood = 0.70
    if cal_target > 0 and cals > 0:
        ratio = min(cals / cal_target, 1.2)
        if ratio < 0.6:
            mood -= 0.15 # severe deficit lowers mood
        elif 0.8 <= ratio <= 1.1:
            mood += 0.10
    if prot_target > 0 and prot >= prot_target * 0.8:
        mood += 0.05
    if today_log.get("mindful_completed"):
        mood += 0.10
    mood = max(0.05, min(0.99, mood))

    # Fatigue factors: base 0.2
    fatigue = 0.20
    ex_logs = today_log.get("exercise_logs", [])
    total_duration = sum(e.get("duration_min", 0) for e in ex_logs)
    if total_duration > 45:
        fatigue += 0.25
    elif total_duration > 20:
        fatigue += 0.15

    # Check recent 3 days volume
    fatigue = max(0.05, min(0.99, fatigue))
    return {
        "inferred_mood": round(mood, 2),
        "inferred_fatigue": round(fatigue, 2)
    }

# ----------------- ROUTES -----------------

@app.get("/")
def root():
    return {
        "app": "Quest Coach API",
        "status": "online",
        "version": "1.2.0",
        "disclaimer": "General guidance only, not medical advice"
    }

@app.get("/api/v1/profile")
def get_profile():
    state = USER_STORE.read()
    profile = state.get("profile")
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not configured yet")
    
    passive = _calculate_passive_states(state)
    return {
        "profile": profile,
        "rank": state.get("rank", 1),
        "level": state.get("level", 1),
        "tokens": state.get("tokens", 5),
        "xp": state.get("xp", 0),
        "inferred_mood": passive["inferred_mood"],
        "inferred_fatigue": passive["inferred_fatigue"],
        "weakest_pillar": state.get("weakest_pillar", "exercise"),
        "boss_wins": state.get("boss_wins", 0),
        "cycle_completed_days": state.get("cycle_completed_days", 0),
        "simulated_date": _get_today_str(state),
        "disclaimer": "General guidance only, not medical advice"
    }

@app.post("/api/v1/profile/setup")
def setup_profile(req: ProfileSetupRequest):
    targets_result = TargetCalculator.calculate_targets(
        age=req.age,
        weight_kg=req.weight_kg,
        height_cm=req.height_cm,
        gender=req.gender,
        gym_experience=req.gym_experience,
        requested_goal=req.requested_goal
    )

    state = USER_STORE.read()
    profile_data = {
        "age": req.age,
        "weight_kg": req.weight_kg,
        "height_cm": req.height_cm,
        "gender": req.gender,
        "gym_experience": req.gym_experience,
        "preferred_region": req.preferred_region,
        "goal": targets_result["goal"],
        "bmi": targets_result["bmi"],
        "bmr": targets_result["bmr"],
        "tdee": targets_result["tdee"],
        "daily_targets": targets_result["daily_targets"],
        "refusal_explanation": targets_result["refusal_explanation"],
        "nearest_safe_target": targets_result["nearest_safe_target"],
        "created_at": datetime.now().isoformat()
    }

    state["profile"] = profile_data
    state.setdefault("rank", 1)
    state.setdefault("level", 1)
    state.setdefault("current_day", 1)
    state.setdefault("tokens", 5) # starting bonus
    state.setdefault("xp", 0)
    state.setdefault("cycle_completed_days", 0)
    state.setdefault("boss_wins", 0)
    state.setdefault("consecutive_unexcused_misses", 0)
    state.setdefault("re_entry_mode", False)
    state.setdefault("exercise_personal_records", {})
    state.setdefault("daily_logs", {})
    state.setdefault("simulated_date", date.today().isoformat())

    USER_STORE.write(state)

    return {
        "status": "success",
        "profile": profile_data,
        "disclaimer": "General guidance only, not medical advice"
    }

@app.get("/api/v1/pathway")
def get_pathway():
    state = USER_STORE.read()
    current_level = state.get("level", 1)
    current_day = state.get("current_day", 1)
    cycle_days = state.get("cycle_completed_days", 0)
    boss_wins = state.get("boss_wins", 0)

    # 15 nodes pathway representation (3 full cycles)
    nodes = []
    for i in range(1, 16):
        is_boss = (i % 5 == 0)
        is_completed = (i < current_level)
        is_current = (i == current_level)
        is_locked = (i > current_level)

        nodes.append({
            "level": i,
            "title": f"Boss Challenge {i // 5}" if is_boss else f"Quest Day {i}",
            "is_boss": is_boss,
            "status": "completed" if is_completed else ("current" if is_current else "locked")
        })

    return {
        "current_level": current_level,
        "current_day": current_day,
        "cycle_progress": f"Day {current_day} of 5",
        "tokens": state.get("tokens", 0),
        "rank": state.get("rank", 1),
        "boss_wins": boss_wins,
        "re_entry_mode": state.get("re_entry_mode", False),
        "nodes": nodes
    }


@app.get("/api/v1/level/today")
def get_level_today():
    state = USER_STORE.read()
    profile = state.get("profile")
    if not profile:
        raise HTTPException(status_code=400, detail="Profile not setup")

    today_str = _get_today_str(state)
    daily_log = _ensure_daily_log(state, today_str)
    targets = profile.get("daily_targets", {})
    
    current_level = state.get("level", 1)
    current_day = state.get("current_day", 1)
    is_boss_day = (current_day == 5)

    # 1. Passively infer state
    states = AI_ESTIMATOR.estimate(state)
    mood = states["inferred_mood"]
    fatigue = states["inferred_fatigue"]

    # 2. Bayesian player model
    consistency = 0.8
    risk, weakest_pillar = BAYES_MODEL.infer_risk_and_pillar(mood, fatigue, consistency, state.get("daily_logs", {}))
    state["weakest_pillar"] = weakest_pillar

    # 3. Fuzzy difficulty controller (Unit 5)
    fuzzy_result = FUZZY_CONTROLLER.evaluate(fatigue, mood, risk)
    multiplier = fuzzy_result["target_multiplier"]
    regime = fuzzy_result["regime"]

    # Scale daily targets by fuzzy multiplier
    cal_target = round(targets.get("calories", 2000) * multiplier)
    prot_target = round(targets.get("protein_g", 120) * multiplier)
    ex_target_min = round(25 * multiplier)
    mindful_target_min = round(7 * multiplier)

    # Day 5 Boss Challenge (Unit 3 Targeted Search)
    boss_challenge = None
    if is_boss_day:
        boss_challenge = BOSS_ENGINE.generate_boss_challenge(
            weakest_pillar=weakest_pillar,
            rank=state.get("rank", 1),
            targets={"calories": cal_target, "protein_g": prot_target}
        )

    # 3 Quests: Nutrition, Exercise, Mindful
    quests = [
        {
            "id": "quest_macros",
            "pillar": "nutrition",
            "title": "Macro Nutrition Adherence",
            "description": f"Hit daily calorie & protein target: {cal_target} kcal, {prot_target}g protein (Regime: {regime})",
            "current_value": round(daily_log.get("calories_logged", 0)),
            "target_value": cal_target,
            "unit": "kcal",
            "completed": daily_log.get("nutrition_completed", False),
            "xp_reward": 50
        },
        {
            "id": "quest_exercise",
            "pillar": "exercise",
            "title": "Daily Movement / Gym Training",
            "description": f"Log at least {ex_target_min} min of exercise or progressive strength workout",
            "current_value": sum(e.get("duration_min", 0) for e in daily_log.get("exercise_logs", [])),
            "target_value": ex_target_min,
            "unit": "min",
            "completed": daily_log.get("exercise_completed", False),
            "xp_reward": 50
        },
        {
            "id": "quest_mindful",
            "pillar": "mindful",
            "title": "Mindful Restoration",
            "description": f"Log at least {mindful_target_min} min of breathing, meditation, or mobility stretching",
            "current_value": sum(m.get("duration_min", 0) for m in daily_log.get("mindful_logs", [])),
            "target_value": mindful_target_min,
            "unit": "min",
            "completed": daily_log.get("mindful_completed", False),
            "xp_reward": 50
        }
    ]

    all_completed = (
        daily_log.get("nutrition_completed", False) and
        daily_log.get("exercise_completed", False) and
        daily_log.get("mindful_completed", False)
    )

    return {
        "level": current_level,
        "current_day": current_day,
        "is_boss_day": is_boss_day,
        "boss_challenge": boss_challenge,
        "date": today_str,
        "quests": quests,
        "fuzzy_regime": regime,
        "fuzzy_multiplier": multiplier,
        "inferred_mood": mood,
        "inferred_fatigue": fatigue,
        "weakest_pillar": weakest_pillar,
        "streak_break_risk": risk,
        "is_planned_rest": daily_log.get("is_planned_rest", False),
        "tokens": state.get("tokens", 0),
        "re_entry_mode": state.get("re_entry_mode", False),
        "all_completed": all_completed,
        "food_logs": daily_log.get("food_logs", []),
        "exercise_logs": daily_log.get("exercise_logs", []),
        "mindful_logs": daily_log.get("mindful_logs", []),
        "calories_logged": daily_log.get("calories_logged", 0.0),
        "protein_logged": daily_log.get("protein_logged", 0.0),
        "carbs_logged": daily_log.get("carbs_logged", 0.0),
        "fat_logged": daily_log.get("fat_logged", 0.0),
        "fibre_logged": daily_log.get("fibre_logged", 0.0)
    }

@app.get("/api/v1/catalogue")
def get_catalogue():
    kb = KB_STORE.read()

    # Smart meal pairings (co-occurrence / complementary nutrition)
    pairings = kb.get("pairings", [
        {"food_id": "food_whey_isolate",        "pairs_well_with": ["food_toned_milk", "food_banana"],         "reason": "Fast protein + carbs: ideal post-workout shake"},
        {"food_id": "food_chicken_breast_raw",   "pairs_well_with": ["food_steamed_rice", "food_roti_wheat"],   "reason": "Complete protein + complex carbs for muscle repair"},
        {"food_id": "food_chicken_breast_boiled","pairs_well_with": ["food_steamed_rice", "food_roti_wheat"],   "reason": "High-protein lean meal with energy carbs"},
        {"food_id": "food_dal_tadka",            "pairs_well_with": ["food_steamed_rice", "food_roti_wheat"],   "reason": "Dal Chawal / Dal Roti — complete amino acid profile"},
        {"food_id": "food_dal_makhani",          "pairs_well_with": ["food_steamed_rice", "food_roti_wheat"],   "reason": "Creamy dal with rice or roti for a balanced meal"},
        {"food_id": "food_rajma_curry",          "pairs_well_with": ["food_steamed_rice", "food_jeera_rice"],   "reason": "Rajma Chawal — classic high-fibre protein combo"},
        {"food_id": "food_chole_masala",         "pairs_well_with": ["food_roti_wheat", "food_steamed_rice"],   "reason": "Chickpeas + roti/rice: fibre-rich balanced meal"},
        {"food_id": "food_palak_paneer",         "pairs_well_with": ["food_roti_wheat", "food_roti_ghee"],      "reason": "Paneer protein + roti carbs + iron from spinach"},
        {"food_id": "food_idli_steamed",         "pairs_well_with": ["food_sambar", "food_coconut_chutney"],    "reason": "Classic South Indian — fermented protein + lentil broth"},
        {"food_id": "food_plain_dosa",           "pairs_well_with": ["food_sambar", "food_coconut_chutney"],    "reason": "Dosa + sambar: low-fat, high-fibre breakfast combo"},
        {"food_id": "food_oats_rolled",          "pairs_well_with": ["food_toned_milk", "food_banana"],         "reason": "Slow carbs + dairy protein + potassium: pre-workout"},
        {"food_id": "food_paneer_raw",           "pairs_well_with": ["food_roti_wheat", "food_broccoli_steamed"], "reason": "High-protein dairy with complex carbs and veg"},
        {"food_id": "food_egg_white",            "pairs_well_with": ["food_oats_cooked", "food_banana"],        "reason": "Lean protein + slow carbs: breakfast of champions"},
        {"food_id": "food_brown_rice_cooked",    "pairs_well_with": ["food_dal_tadka", "food_chicken_curry_homestyle"], "reason": "Complex carbs + protein: ideal pre-training meal"},
        {"food_id": "food_poha_vegetable",       "pairs_well_with": ["food_curd_dahi", "food_banana"],          "reason": "Light carbs + probiotic curd: easy digestive breakfast"},
        {"food_id": "food_suji_upma",            "pairs_well_with": ["food_curd_dahi", "food_coconut_chutney"], "reason": "Semolina + curd: quick energy with probiotics"},
        {"food_id": "food_sambar",               "pairs_well_with": ["food_idli_steamed", "food_steamed_rice"], "reason": "Lentil broth pairs with any South Indian staple"},
    ])

    # Exercise presets / variety groupings
    exercises = kb.get("exercises", [])
    exercise_presets = {
        "push": [e["id"] for e in exercises if any(h in e.get("isa_hierarchy", []) for h in ["chest_workout", "shoulder_workout", "tricep_workout"])],
        "pull": [e["id"] for e in exercises if any(h in e.get("isa_hierarchy", []) for h in ["back_workout", "bicep_workout"])],
        "legs": [e["id"] for e in exercises if any(h in e.get("isa_hierarchy", []) for h in ["leg_workout", "glute_workout"])],
        "cardio": [e["id"] for e in exercises if e.get("category") == "cardio"],
        "calisthenics": [e["id"] for e in exercises if e.get("category") == "calisthenics"],
    }

    return {
        "foods": kb.get("foods", []),
        "exercises": exercises,
        "mindful": kb.get("mindful", []),
        "pairings": pairings,
        "exercise_presets": exercise_presets
    }

@app.post("/api/v1/log/exercise")
def log_exercise(req: ExerciseLogRequest):
    state = USER_STORE.read()
    today_str = _get_today_str(state)
    daily_log = _ensure_daily_log(state, today_str)
    
    # 1RM Calculation (Epley formula: weight * (1 + reps / 30))
    epley_1rm = None
    if req.category == "weightlifting" and req.weight_kg and req.reps:
        epley_1rm = round(req.weight_kg * (1.0 + (req.reps / 30.0)), 1)
        prs = state.setdefault("exercise_personal_records", {})
        current_pr = prs.get(req.exercise_id, 0.0)
        if epley_1rm > current_pr:
            prs[req.exercise_id] = epley_1rm

    exercise_entry = {
        "id": str(uuid.uuid4())[:8],
        "category": req.category,
        "exercise_id": req.exercise_id,
        "exercise_name": req.exercise_name,
        "duration_min": req.duration_min,
        "weight_kg": req.weight_kg,
        "reps": req.reps,
        "sets": req.sets,
        "steps_count": req.steps_count,
        "calisthenics_reps": req.calisthenics_reps,
        "epley_1rm": epley_1rm,
        "timestamp": datetime.now().isoformat()
    }

    daily_log["exercise_logs"].append(exercise_entry)
    total_dur = sum(e.get("duration_min", 0) for e in daily_log["exercise_logs"])

    xp_delta = 0
    if not daily_log.get("exercise_completed") and total_dur >= 25:
        daily_log["exercise_completed"] = True
        xp_delta = 50
        state["xp"] = state.get("xp", 0) + xp_delta

    # Variety check: if the same exercise logged 3+ times today, suggest alternatives
    variety_tip = None
    same_count = sum(1 for e in daily_log["exercise_logs"] if e.get("exercise_id") == req.exercise_id)
    if same_count >= 3:
        kb = KB_STORE.read()
        exercises = kb.get("exercises", [])
        ex_map = {e["id"]: e for e in exercises}
        this_ex = ex_map.get(req.exercise_id, {})
        this_hierarchy = set(this_ex.get("isa_hierarchy", []))
        # Find exercises sharing a muscle-group tag but are different
        muscle_tags = {"chest_workout", "back_workout", "leg_workout", "shoulder_workout",
                       "bicep_workout", "tricep_workout", "glute_workout", "core_workout",
                       "cardio", "calisthenics"}
        shared_tags = this_hierarchy & muscle_tags
        alternatives = [
            e["name"] for e in exercises
            if e["id"] != req.exercise_id and set(e.get("isa_hierarchy", [])) & shared_tags
        ][:3]
        if alternatives:
            variety_tip = (
                f"Great effort! You've done {req.exercise_name} {same_count}x today. "
                f"Consider mixing in: {', '.join(alternatives)} for more variety."
            )

    USER_STORE.write(state)
    return {
        "status": "success",
        "xp_delta": xp_delta,
        "total_xp": state.get("xp", 0),
        "epley_1rm": epley_1rm,
        "exercise_completed": daily_log.get("exercise_completed", False),
        "variety_tip": variety_tip
    }

@app.post("/api/v1/log/food")
def log_food(req: FoodLogRequest):
    kb = KB_STORE.read()
    foods = {f["id"]: f for f in kb.get("foods", [])}
    food_item = foods.get(req.food_id)
    if not food_item:
        raise HTTPException(status_code=404, detail="Food item not found in catalogue")

    factor = req.portion_g / float(food_item["standard_portion_g"])
    cal = round(food_item["calories"] * factor, 1)
    prot = round(food_item["protein_g"] * factor, 1)
    carbs = round(food_item["carbs_g"] * factor, 1)
    fat = round(food_item["fat_g"] * factor, 1)
    fibre = round(food_item["fibre_g"] * factor, 1)

    state = USER_STORE.read()
    today_str = _get_today_str(state)
    daily_log = _ensure_daily_log(state, today_str)

    food_entry = {
        "id": str(uuid.uuid4())[:8],
        "food_id": req.food_id,
        "name": food_item["name"],
        "portion_g": req.portion_g,
        "calories": cal,
        "protein_g": prot,
        "carbs_g": carbs,
        "fat_g": fat,
        "fibre_g": fibre,
        "timestamp": datetime.now().isoformat()
    }

    daily_log["food_logs"].append(food_entry)
    daily_log["calories_logged"] = round(daily_log["calories_logged"] + cal, 1)
    daily_log["protein_logged"] = round(daily_log["protein_logged"] + prot, 1)
    daily_log["carbs_logged"] = round(daily_log["carbs_logged"] + carbs, 1)
    daily_log["fat_logged"] = round(daily_log["fat_logged"] + fat, 1)
    daily_log["fibre_logged"] = round(daily_log["fibre_logged"] + fibre, 1)

    # Check nutrition requirement (reached within 85% of target calories)
    profile = state.get("profile", {})
    target_cals = profile.get("daily_targets", {}).get("calories", 2000)
    xp_delta = 0
    if not daily_log.get("nutrition_completed") and daily_log["calories_logged"] >= (target_cals * 0.85):
        daily_log["nutrition_completed"] = True
        xp_delta = 50
        state["xp"] = state.get("xp", 0) + xp_delta

    USER_STORE.write(state)
    return {
        "status": "success",
        "logged_item": food_entry,
        "daily_macros": {
            "calories": daily_log["calories_logged"],
            "protein_g": daily_log["protein_logged"],
            "carbs_g": daily_log["carbs_logged"],
            "fat_g": daily_log["fat_logged"],
            "fibre_g": daily_log["fibre_logged"]
        },
        "xp_delta": xp_delta,
        "total_xp": state.get("xp", 0),
        "nutrition_completed": daily_log.get("nutrition_completed", False)
    }

@app.post("/api/v1/log/custom-meal")
def log_custom_meal(req: CustomMealRequest):
    # Sum ingredients + oil/ghee
    total_g = sum(i.portion_g for i in req.ingredients) + req.oil_ghee_g
    total_cal = sum(i.calories for i in req.ingredients) + (req.oil_ghee_g * 9.0)
    total_prot = sum(i.protein_g for i in req.ingredients)
    total_carbs = sum(i.carbs_g for i in req.ingredients)
    total_fat = sum(i.fat_g for i in req.ingredients) + req.oil_ghee_g
    total_fibre = sum(i.fibre_g for i in req.ingredients)

    servings = max(1, req.servings_count)
    per_serving_g = round(total_g / servings, 1)
    per_cal = round(total_cal / servings, 1)
    per_prot = round(total_prot / servings, 1)
    per_carbs = round(total_carbs / servings, 1)
    per_fat = round(total_fat / servings, 1)
    per_fibre = round(total_fibre / servings, 1)

    meal_id = f"custom_{uuid.uuid4().hex[:8]}"
    new_food = {
        "id": meal_id,
        "name": req.name,
        "standard_portion_g": per_serving_g,
        "calories": per_cal,
        "protein_g": per_prot,
        "carbs_g": per_carbs,
        "fat_g": per_fat,
        "fibre_g": per_fibre,
        "isa_hierarchy": ["custom_meal", "home_cooked", "food"],
        "region": req.region,
        "preparation_state": req.preparation_state,
        "is_verified": False # Custom user meals marked unverified per SPEC
    }

    # Append to knowledge_base.json
    kb = KB_STORE.read()
    foods = kb.setdefault("foods", [])
    foods.append(new_food)
    KB_STORE.write(kb)

    # Immediately log 1 serving for the user today
    state = USER_STORE.read()
    today_str = _get_today_str(state)
    daily_log = _ensure_daily_log(state, today_str)
    
    daily_log["food_logs"].append({
        "id": str(uuid.uuid4())[:8],
        "food_id": meal_id,
        "name": req.name,
        "portion_g": per_serving_g,
        "calories": per_cal,
        "protein_g": per_prot,
        "carbs_g": per_carbs,
        "fat_g": per_fat,
        "fibre_g": per_fibre,
        "timestamp": datetime.now().isoformat()
    })
    daily_log["calories_logged"] = round(daily_log["calories_logged"] + per_cal, 1)
    daily_log["protein_logged"] = round(daily_log["protein_logged"] + per_prot, 1)
    daily_log["carbs_logged"] = round(daily_log["carbs_logged"] + per_carbs, 1)
    daily_log["fat_logged"] = round(daily_log["fat_logged"] + per_fat, 1)
    daily_log["fibre_logged"] = round(daily_log["fibre_logged"] + per_fibre, 1)

    USER_STORE.write(state)
    return {
        "status": "success",
        "custom_food": new_food,
        "message": f"Saved {req.name} to knowledge base and logged 1 serving today."
    }

@app.post("/api/v1/log/mindful")
def log_mindful(req: MindfulLogRequest):
    kb = KB_STORE.read()
    mindful_map = {m["id"]: m for m in kb.get("mindful", [])}
    act = mindful_map.get(req.activity_id, {"name": "Mindful Activity"})

    state = USER_STORE.read()
    today_str = _get_today_str(state)
    daily_log = _ensure_daily_log(state, today_str)

    daily_log["mindful_logs"].append({
        "id": str(uuid.uuid4())[:8],
        "activity_id": req.activity_id,
        "name": act["name"],
        "duration_min": req.duration_min,
        "timestamp": datetime.now().isoformat()
    })

    total_dur = sum(m.get("duration_min", 0) for m in daily_log["mindful_logs"])
    xp_delta = 0
    if not daily_log.get("mindful_completed") and total_dur >= 7:
        daily_log["mindful_completed"] = True
        xp_delta = 50
        state["xp"] = state.get("xp", 0) + xp_delta

    USER_STORE.write(state)
    return {
        "status": "success",
        "xp_delta": xp_delta,
        "total_xp": state.get("xp", 0),
        "mindful_completed": daily_log.get("mindful_completed", False)
    }

# ---- DELETE log endpoints ----

def _recalc_daily_totals(daily_log: dict) -> None:
    """Recalculate food macros and quest completion flags from scratch after a delete."""
    food_logs = daily_log.get("food_logs", [])
    daily_log["calories_logged"] = round(sum(e.get("calories", 0) for e in food_logs), 1)
    daily_log["protein_logged"] = round(sum(e.get("protein_g", 0) for e in food_logs), 1)
    daily_log["carbs_logged"] = round(sum(e.get("carbs_g", 0) for e in food_logs), 1)
    daily_log["fat_logged"] = round(sum(e.get("fat_g", 0) for e in food_logs), 1)
    daily_log["fibre_logged"] = round(sum(e.get("fibre_g", 0) for e in food_logs), 1)

def _recalc_quest_completion(state: dict, daily_log: dict) -> None:
    """Re-evaluate quest completion flags + XP after a log entry is deleted."""
    profile = state.get("profile", {})
    targets = profile.get("daily_targets", {})

    # Nutrition
    target_cals = targets.get("calories", 2000)
    daily_log["nutrition_completed"] = (
        daily_log.get("calories_logged", 0) >= target_cals * 0.85
    )

    # Exercise
    total_ex = sum(e.get("duration_min", 0) for e in daily_log.get("exercise_logs", []))
    daily_log["exercise_completed"] = total_ex >= 25

    # Mindful
    total_mind = sum(m.get("duration_min", 0) for m in daily_log.get("mindful_logs", []))
    daily_log["mindful_completed"] = total_mind >= 7

@app.delete("/api/v1/log/food/{entry_id}")
def delete_food_log(entry_id: str):
    state = USER_STORE.read()
    today_str = _get_today_str(state)
    daily_log = _ensure_daily_log(state, today_str)
    food_logs = daily_log.get("food_logs", [])

    # Try match by UUID id; fallback to list index if entry_id is numeric
    new_logs = [e for e in food_logs if e.get("id") != entry_id]
    if len(new_logs) == len(food_logs):
        # Try index fallback
        try:
            idx = int(entry_id)
            if 0 <= idx < len(food_logs):
                new_logs = food_logs[:idx] + food_logs[idx + 1:]
            else:
                raise HTTPException(status_code=404, detail="Food log entry not found")
        except (ValueError, TypeError):
            raise HTTPException(status_code=404, detail="Food log entry not found")

    daily_log["food_logs"] = new_logs
    _recalc_daily_totals(daily_log)
    _recalc_quest_completion(state, daily_log)
    USER_STORE.write(state)
    return {
        "status": "deleted",
        "daily_macros": {
            "calories": daily_log["calories_logged"],
            "protein_g": daily_log["protein_logged"],
            "carbs_g": daily_log["carbs_logged"],
            "fat_g": daily_log["fat_logged"],
            "fibre_g": daily_log["fibre_logged"]
        },
        "nutrition_completed": daily_log["nutrition_completed"]
    }

@app.delete("/api/v1/log/exercise/{entry_id}")
def delete_exercise_log(entry_id: str):
    state = USER_STORE.read()
    today_str = _get_today_str(state)
    daily_log = _ensure_daily_log(state, today_str)
    ex_logs = daily_log.get("exercise_logs", [])

    new_logs = [e for e in ex_logs if e.get("id") != entry_id]
    if len(new_logs) == len(ex_logs):
        try:
            idx = int(entry_id)
            if 0 <= idx < len(ex_logs):
                new_logs = ex_logs[:idx] + ex_logs[idx + 1:]
            else:
                raise HTTPException(status_code=404, detail="Exercise log entry not found")
        except (ValueError, TypeError):
            raise HTTPException(status_code=404, detail="Exercise log entry not found")

    daily_log["exercise_logs"] = new_logs
    _recalc_quest_completion(state, daily_log)
    USER_STORE.write(state)
    total_dur = sum(e.get("duration_min", 0) for e in new_logs)
    return {
        "status": "deleted",
        "total_exercise_min": total_dur,
        "exercise_completed": daily_log["exercise_completed"]
    }

@app.delete("/api/v1/log/mindful/{entry_id}")
def delete_mindful_log(entry_id: str):
    state = USER_STORE.read()
    today_str = _get_today_str(state)
    daily_log = _ensure_daily_log(state, today_str)
    mind_logs = daily_log.get("mindful_logs", [])

    new_logs = [m for m in mind_logs if m.get("id") != entry_id]
    if len(new_logs) == len(mind_logs):
        try:
            idx = int(entry_id)
            if 0 <= idx < len(mind_logs):
                new_logs = mind_logs[:idx] + mind_logs[idx + 1:]
            else:
                raise HTTPException(status_code=404, detail="Mindful log entry not found")
        except (ValueError, TypeError):
            raise HTTPException(status_code=404, detail="Mindful log entry not found")

    daily_log["mindful_logs"] = new_logs
    _recalc_quest_completion(state, daily_log)
    USER_STORE.write(state)
    total_dur = sum(m.get("duration_min", 0) for m in new_logs)
    return {
        "status": "deleted",
        "total_mindful_min": total_dur,
        "mindful_completed": daily_log["mindful_completed"]
    }

# ---- Profile Reset ----

@app.post("/api/v1/profile/reset")
def reset_profile():
    """
    Reset logs, streaks, and current cycle back to Day 1 Level 1 while
    keeping the user's profile data, rank, boss_wins, and XP intact.
    """
    state = USER_STORE.read()
    if not state.get("profile"):
        raise HTTPException(status_code=404, detail="No profile found — set up a profile first.")

    # Preserve identity fields
    preserved = {
        "profile": state["profile"],
        "rank": state.get("rank", 1),
        "boss_wins": state.get("boss_wins", 0),
        "xp": state.get("xp", 0),
        "exercise_personal_records": state.get("exercise_personal_records", {}),
    }

    # Reset everything else
    today_str = date.today().isoformat()
    new_state = {
        **preserved,
        "level": 1,
        "current_day": 1,
        "tokens": 5,
        "cycle_completed_days": 0,
        "consecutive_unexcused_misses": 0,
        "re_entry_mode": False,
        "simulated_date": today_str,
        "daily_logs": {},
        "weakest_pillar": "exercise",
    }
    _ensure_daily_log(new_state, today_str)
    USER_STORE.write(new_state)

    return {
        "status": "reset",
        "message": "Profile reset to Day 1 Level 1. Your rank, boss wins, XP, and PRs are preserved.",
        "level": new_state["level"],
        "tokens": new_state["tokens"],
        "rank": new_state["rank"],
        "boss_wins": new_state["boss_wins"]
    }

@app.post("/api/v1/tokens/skip-task")
def skip_task(req: TokenSkipRequest):
    state = USER_STORE.read()
    today_str = _get_today_str(state)
    daily_log = _ensure_daily_log(state, today_str)

    current_level = state.get("level", 1)
    current_day = state.get("current_day", 1)
    if current_day == 5:
        raise HTTPException(
            status_code=400,
            detail="Boss Level cannot be skipped — face the challenge and earn your rank!"
        )

    # Base cost: 2 tokens; discounted to 1 once at least 1 Boss is defeated
    boss_wins = state.get("boss_wins", 0)
    skip_cost = 1 if boss_wins >= 1 else 2

    if state.get("tokens", 0) < skip_cost:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient tokens. Skipping a task costs {skip_cost} token(s)."
        )

    if daily_log.get("tokens_spent_today", 0) >= 3:
        raise HTTPException(status_code=400, detail="Daily token spending limit reached (max 3 token actions per day).")

    pillar = req.task_pillar
    if pillar == "exercise":
        daily_log["exercise_completed"] = True
    elif pillar == "mindful":
        daily_log["mindful_completed"] = True
    elif pillar == "nutrition":
        daily_log["nutrition_completed"] = True

    state["tokens"] = state.get("tokens", 0) - skip_cost
    daily_log["tokens_spent_today"] = daily_log.get("tokens_spent_today", 0) + skip_cost
    USER_STORE.write(state)

    return {
        "status": "success",
        "remaining_tokens": state["tokens"],
        "task_skipped": pillar,
        "tokens_spent": skip_cost,
        "skip_discount_active": boss_wins >= 1
    }

@app.post("/api/v1/tokens/rest-day")
def take_rest_day():
    state = USER_STORE.read()
    today_str = _get_today_str(state)
    daily_log = _ensure_daily_log(state, today_str)

    current_level = state.get("level", 1)
    current_day = state.get("current_day", 1)
    if current_day == 5:
        raise HTTPException(
            status_code=400,
            detail="Boss Level cannot be a Rest Day — the Boss waits for no one!"
        )

    if state.get("tokens", 0) < 3:
        raise HTTPException(status_code=400, detail="Insufficient tokens. Full Rest-Day Pass costs 3 tokens.")

    state["tokens"] = state.get("tokens", 0) - 3
    daily_log["is_planned_rest"] = True
    daily_log["exercise_completed"] = True
    daily_log["mindful_completed"] = True
    daily_log["nutrition_completed"] = True
    daily_log["tokens_spent_today"] = daily_log.get("tokens_spent_today", 0) + 3

    # Agent-generated recovery message based on current state
    rank = state.get("rank", 1)
    boss_wins = state.get("boss_wins", 0)
    recovery_tips = [
        "Hydrate well — 2.5L of water will accelerate your recovery.",
        "Light walking or gentle stretching still counts as active recovery.",
        "Use this rest period to prep your meals for tomorrow.",
        "Quality sleep tonight will accelerate muscular repair.",
        "Mental reset: visualise your next training session going perfectly."
    ]
    # Cycle through tips based on rank so the message feels personalised
    tip = recovery_tips[(rank - 1) % len(recovery_tips)]
    boss_note = f" You have {boss_wins} Boss victory/victories behind you — rest is earned." if boss_wins > 0 else " Every champion needs rest. Tomorrow you come back stronger."
    recovery_message = f"Rest-Day Pass activated for Rank {rank} Athlete! {tip}{boss_note}"

    USER_STORE.write(state)
    return {
        "status": "success",
        "remaining_tokens": state["tokens"],
        "message": recovery_message
    }


@app.get("/api/v1/meal/{food_id}/overview")
def get_meal_overview(food_id: str):
    kb = KB_STORE.read()
    foods = {f["id"]: f for f in kb.get("foods", [])}
    food = foods.get(food_id)
    if not food:
        raise HTTPException(status_code=404, detail="Food item not found")

    state = USER_STORE.read()
    profile = state.get("profile", {})
    daily_targets = profile.get("daily_targets", {
        "calories": 2000, "protein_g": 120, "carbs_g": 220, "fat_g": 55, "fibre_g": 28
    })

    today_str = _get_today_str(state)
    daily_log = _ensure_daily_log(state, today_str)

    # 1. Missing Macros FIRST (SPEC 3.8 & Screen 7)
    missing_macros = {
        "calories": max(0.0, round(daily_targets["calories"] - daily_log.get("calories_logged", 0.0), 1)),
        "protein_g": max(0.0, round(daily_targets["protein_g"] - daily_log.get("protein_logged", 0.0), 1)),
        "carbs_g": max(0.0, round(daily_targets["carbs_g"] - daily_log.get("carbs_logged", 0.0), 1)),
        "fat_g": max(0.0, round(daily_targets["fat_g"] - daily_log.get("fat_logged", 0.0), 1)),
        "fibre_g": max(0.0, round(daily_targets["fibre_g"] - daily_log.get("fibre_logged", 0.0), 1))
    }

    # 2. Dynamic Utility-Agent Rating (0-100) (SPEC 3.8)
    rating_data = UtilityAgent.calculate_meal_rating(
        food=food,
        profile=profile,
        remaining_macros=missing_macros
    )

    # 3. Genetic Algorithm Quest & Meal Generator Pro Tip (SPEC 3.7)
    all_foods = kb.get("foods", [])
    ga_optimizer = GeneticAlgorithmMealOptimizer(all_foods, population_size=20, generations=12)
    pro_tip_data = ga_optimizer.evolve_pro_tip(
        remaining_macros=missing_macros,
        preferred_region=profile.get("preferred_region")
    )

    return {
        "food": food,
        "missing_macros_first": missing_macros,
        "utility_rating": rating_data["rating"],
        "weights_used": rating_data["weights_used"],
        "sub_scores": rating_data["sub_scores"],
        "user_improvement_notes": rating_data["notes"],
        "region_badge": food.get("region", "Pan-Indian"),
        "pro_tip": pro_tip_data["pro_tip"],
        "ga_recommendation": pro_tip_data.get("recommended_food"),
        "disclaimer": "General guidance only, not medical advice"
    }

@app.post("/api/v1/boss/defeat")
def defeat_boss():
    """Defeating the Day 5 Boss increments Rank, awards 5 tokens, advances Level."""
    state = USER_STORE.read()
    current_level = state.get("level", 1)
    current_day = state.get("current_day", 1)
    if current_day != 5:
        raise HTTPException(status_code=400, detail="Not on Boss Day (Day 5). Cannot defeat boss.")

    new_boss_wins = state.get("boss_wins", 0) + 1
    state["rank"] = state.get("rank", 1) + 1
    state["boss_wins"] = new_boss_wins
    state["tokens"] = state.get("tokens", 0) + 5
    state["xp"] = state.get("xp", 0) + 150
    state["level"] = current_level + 1
    state["current_day"] = 1  # start new cycle at Day 1
    state["cycle_completed_days"] = 0  # reset cycle counter
    state["re_entry_mode"] = False

    USER_STORE.write(state)
    return {
        "status": "victory",
        "new_rank": state["rank"],
        "new_level": state["level"],
        "new_boss_wins": state["boss_wins"],
        "tokens": state["tokens"],
        "message": f"Boss Defeated! Rank {state['rank']} unlocked — +5 tokens awarded!"
    }

@app.post("/api/v1/test/advance-day")
def test_advance_day():
    """Desktop Test Mode: Advances simulated calendar day by 1 with clean level/day progression."""
    from datetime import timedelta
    state = USER_STORE.read()
    curr_date_str = _get_today_str(state)
    try:
        curr_d = date.fromisoformat(curr_date_str)
        next_d = curr_d + timedelta(days=1)
        next_date_str = next_d.isoformat()
    except Exception:
        next_date_str = date.today().isoformat()

    state["simulated_date"] = next_date_str

    # Check if yesterday was completed (all 3 quests or planned rest)
    yesterday_log = state.get("daily_logs", {}).get(curr_date_str, {})
    all_met = (
        yesterday_log.get("exercise_completed") and
        yesterday_log.get("mindful_completed") and
        yesterday_log.get("nutrition_completed")
    )
    was_rest = yesterday_log.get("is_planned_rest", False)

    re_entry_triggered = False

    if all_met or was_rest:
        state["consecutive_unexcused_misses"] = 0
        state["re_entry_mode"] = False
        state["tokens"] = state.get("tokens", 0) + 1

        current_level = state.get("level", 1)
        # current_day is position within the 5-day cycle (1 = first quest day, 5 = boss)
        current_day = state.get("current_day", 1)

        if current_day < 5:
            # Advance within cycle
            state["current_day"] = current_day + 1
            state["level"] = current_level + 1
        else:
            # On day 5 (Boss) — boss must be manually defeated via /boss/defeat
            # advance-day just moves the calendar forward; leave level at boss level
            pass

        state["cycle_completed_days"] = state.get("cycle_completed_days", 0) + 1
    else:
        # Unexcused miss
        misses = state.get("consecutive_unexcused_misses", 0) + 1
        state["consecutive_unexcused_misses"] = misses

        if misses >= 3:
            # Reset to Level 1 of the CURRENT cycle (right after last beaten Boss)
            # Formula: cycle_start_level = boss_wins * 5 + 1
            boss_wins = state.get("boss_wins", 0)
            cycle_start_level = boss_wins * 5 + 1
            state["level"] = cycle_start_level
            state["current_day"] = 1
            state["cycle_completed_days"] = 0
            state["consecutive_unexcused_misses"] = 0
            state["re_entry_mode"] = True
            re_entry_triggered = True

    _ensure_daily_log(state, next_date_str)
    USER_STORE.write(state)

    return {
        "status": "success",
        "simulated_date": next_date_str,
        "current_level": state.get("level", 1),
        "current_day": state.get("current_day", 1),
        "cycle_completed_days": state.get("cycle_completed_days", 0),
        "tokens": state.get("tokens", 0),
        "consecutive_unexcused_misses": state.get("consecutive_unexcused_misses", 0),
        "re_entry_mode": state.get("re_entry_mode", False),
        "re_entry_triggered": re_entry_triggered
    }


@app.post("/api/v1/test/simulate-missed-day")
def test_simulate_missed_day():
    """Desktop Test Mode: Simulates unexcused missed day triggering Readiness Predictor & Non-Monotonic Override."""
    state = USER_STORE.read()
    curr_date_str = _get_today_str(state)
    from datetime import timedelta
    try:
        curr_d = date.fromisoformat(curr_date_str)
        next_d = curr_d + timedelta(days=1)
        next_date_str = next_d.isoformat()
    except Exception:
        next_date_str = date.today().isoformat()

    state["simulated_date"] = next_date_str
    state["consecutive_unexcused_misses"] = state.get("consecutive_unexcused_misses", 0) + 1

    # Evaluate readiness predictor
    states = AI_ESTIMATOR.estimate(state)
    readiness = READINESS_PREDICTOR.predict_readiness(
        consecutive_unexcused_misses=state["consecutive_unexcused_misses"],
        inferred_fatigue=states["inferred_fatigue"],
        recent_adherence_rate=0.4
    )

    override_applied = False
    if readiness["non_monotonic_override"]:
        override_applied = True
        # Level down or reset cycle safely per SPEC 3.5
        state["level"] = max(1, state.get("level", 1) - 1)
        state["cycle_completed_days"] = max(0, state.get("cycle_completed_days", 0) - 1)

    _ensure_daily_log(state, next_date_str)
    USER_STORE.write(state)

    return {
        "status": "success",
        "simulated_date": next_date_str,
        "consecutive_unexcused_misses": state["consecutive_unexcused_misses"],
        "readiness_prediction": readiness,
        "non_monotonic_override_applied": override_applied,
        "current_level": state["level"]
    }

@app.get("/api/v1/test/agent-telemetry")
def test_agent_telemetry():
    """Desktop Test Mode: Returns raw Bayesian probabilities, Fuzzy outputs, Rule traces, and full JSON state."""
    state = USER_STORE.read()
    profile = state.get("profile", {})
    daily_logs = state.get("daily_logs", {})

    states = AI_ESTIMATOR.estimate(state)
    risk, weakest_pillar = BAYES_MODEL.infer_risk_and_pillar(
        states["inferred_mood"], states["inferred_fatigue"], 0.75, daily_logs
    )
    fuzzy = FUZZY_CONTROLLER.evaluate(states["inferred_fatigue"], states["inferred_mood"], risk)
    readiness = READINESS_PREDICTOR.predict_readiness(
        consecutive_unexcused_misses=state.get("consecutive_unexcused_misses", 0),
        inferred_fatigue=states["inferred_fatigue"],
        recent_adherence_rate=0.75
    )
    forward_facts, rule_trace = RULE_ENGINE.forward_chain({
        "gender": profile.get("gender"),
        "target_calories": profile.get("daily_targets", {}).get("calories", 2000),
        "level": state.get("level", 1),
        "fibre_g": profile.get("daily_targets", {}).get("fibre_g", 28),
        "gym_experience": profile.get("gym_experience", "intermediate"),
        "completed_pillars_count": 3
    })

    return {
        "passive_states": states,
        "bayesian_model": {
            "streak_break_risk": risk,
            "weakest_pillar": weakest_pillar
        },
        "fuzzy_difficulty_controller": fuzzy,
        "readiness_predictor": readiness,
        "forward_chaining_rule_trace": rule_trace,
        "live_user_state": state
    }


