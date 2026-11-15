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
    state.setdefault("tokens", 5) # starting bonus
    state.setdefault("xp", 0)
    state.setdefault("cycle_completed_days", 0)
    state.setdefault("boss_wins", 0)
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
    cycle_days = state.get("cycle_completed_days", 0)

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
        "cycle_progress": f"{cycle_days} / 4 days to Boss",
        "tokens": state.get("tokens", 0),
        "rank": state.get("rank", 1),
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
    is_boss_day = (current_level % 5 == 0)

    # 3 Quests: Nutrition, Exercise, Mindful
    quests = [
        {
            "id": "quest_macros",
            "pillar": "nutrition",
            "title": "Macro Nutrition Adherence",
            "description": f"Hit daily calorie & protein target: {targets.get('calories', 2000)} kcal, {targets.get('protein_g', 120)}g protein",
            "current_value": round(daily_log.get("calories_logged", 0)),
            "target_value": targets.get("calories", 2000),
            "unit": "kcal",
            "completed": daily_log.get("nutrition_completed", False),
            "xp_reward": 50
        },
        {
            "id": "quest_exercise",
            "pillar": "exercise",
            "title": "Daily Movement / Gym Training",
            "description": "Log at least 25 min of exercise or progressive strength workout",
            "current_value": sum(e.get("duration_min", 0) for e in daily_log.get("exercise_logs", [])),
            "target_value": 25,
            "unit": "min",
            "completed": daily_log.get("exercise_completed", False),
            "xp_reward": 50
        },
        {
            "id": "quest_mindful",
            "pillar": "mindful",
            "title": "Mindful Restoration",
            "description": "Log at least 7 min of breathing, meditation, or mobility stretching",
            "current_value": sum(m.get("duration_min", 0) for m in daily_log.get("mindful_logs", [])),
            "target_value": 7,
            "unit": "min",
            "completed": daily_log.get("mindful_completed", False),
            "xp_reward": 50
        }
    ]

    return {
        "level": current_level,
        "is_boss_day": is_boss_day,
        "date": today_str,
        "quests": quests,
        "is_planned_rest": daily_log.get("is_planned_rest", False),
        "tokens": state.get("tokens", 0),
        "all_completed": (
            daily_log.get("nutrition_completed", False) and
            daily_log.get("exercise_completed", False) and
            daily_log.get("mindful_completed", False)
        )
    }

@app.get("/api/v1/catalogue")
def get_catalogue():
    kb = KB_STORE.read()
    return {
        "foods": kb.get("foods", []),
        "exercises": kb.get("exercises", []),
        "mindful": kb.get("mindful", [])
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

    USER_STORE.write(state)
    return {
        "status": "success",
        "xp_delta": xp_delta,
        "total_xp": state.get("xp", 0),
        "epley_1rm": epley_1rm,
        "exercise_completed": daily_log.get("exercise_completed", False)
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

@app.post("/api/v1/tokens/skip-task")
def skip_task(req: TokenSkipRequest):
    state = USER_STORE.read()
    today_str = _get_today_str(state)
    daily_log = _ensure_daily_log(state, today_str)

    if state.get("tokens", 0) < 1:
        raise HTTPException(status_code=400, detail="Insufficient tokens. You need 1 token to skip a task.")
    
    if daily_log.get("tokens_spent_today", 0) >= 3:
        raise HTTPException(status_code=400, detail="Daily token spending limit reached (max 3 token actions per day).")

    pillar = req.task_pillar
    if pillar == "exercise":
        daily_log["exercise_completed"] = True
    elif pillar == "mindful":
        daily_log["mindful_completed"] = True
    elif pillar == "nutrition":
        daily_log["nutrition_completed"] = True

    state["tokens"] = state.get("tokens", 0) - 1
    daily_log["tokens_spent_today"] = daily_log.get("tokens_spent_today", 0) + 1
    USER_STORE.write(state)

    return {
        "status": "success",
        "remaining_tokens": state["tokens"],
        "task_skipped": pillar
    }

@app.post("/api/v1/tokens/rest-day")
def take_rest_day():
    state = USER_STORE.read()
    today_str = _get_today_str(state)
    daily_log = _ensure_daily_log(state, today_str)

    if state.get("tokens", 0) < 3:
        raise HTTPException(status_code=400, detail="Insufficient tokens. Full Rest-Day Pass costs 3 tokens.")

    state["tokens"] = state.get("tokens", 0) - 3
    daily_log["is_planned_rest"] = True
    daily_log["exercise_completed"] = True
    daily_log["mindful_completed"] = True
    daily_log["nutrition_completed"] = True
    daily_log["tokens_spent_today"] = daily_log.get("tokens_spent_today", 0) + 3

    USER_STORE.write(state)
    return {
        "status": "success",
        "remaining_tokens": state["tokens"],
        "message": "Rest-day pass activated! Zero penalty incurred and streak preserved."
    }
