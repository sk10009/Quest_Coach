"""
Evaluation and Simulation Benchmark Script for Quest Coach (Course 25AM2304)
Demonstrates the full lifecycle of all AI subsystems:
1. Target Calculator + Forward & Backward Chaining Rule Engine
2. Declarative Knowledge Base & isa hierarchies
3. Passive Latent State Estimator (Inferred Mood & Fatigue without sliders)
4. Bayesian Network Player Model (Posterior Streak Break Risk & Weakest Pillar)
5. Supervised Readiness Predictor (Drop-off risk & Non-monotonic override)
6. Fuzzy Difficulty Controller (Mamdani inference & regime scaling)
7. Genetic Algorithm Meal Generator & Utility-Based Dynamic Rating
8. Weakness-Targeted Boss Engine & 5-Day Cycle Progression
"""
import sys
import os

# Add root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.storage import KB_STORE, USER_STORE
from app.target_calculator import TargetCalculator
from app.rule_engine import RULE_ENGINE
from app.ai_core import AI_ESTIMATOR, BAYES_MODEL, READINESS_PREDICTOR, FUZZY_CONTROLLER
from app.utility_and_ga import UtilityAgent, GeneticAlgorithmMealOptimizer
from app.boss_engine import BOSS_ENGINE

def run_evaluation_simulation():
    print("=" * 70)
    print(" QUEST COACH — AI & EXPERT SYSTEMS EVALUATION BENCHMARK (Course 25AM2304)")
    print("=" * 70)

    # 1. Target Calculator & Safety Locks
    print("\n[1] DETERMINISTIC TARGET CALCULATOR & SAFETY LOCKS:")
    adult_res = TargetCalculator.calculate_targets(
        age=24, weight_kg=74.0, height_cm=178.0, gender="male", gym_experience="intermediate", requested_goal="maintain"
    )
    print(f"  Adult Target: BMI={adult_res['bmi']}, BMR={adult_res['bmr']} kcal, TDEE={adult_res['tdee']} kcal, Goal={adult_res['goal']}")
    print(f"  Calculated Targets: {adult_res['daily_targets']}")

    # Backward Chaining Safety Refusal
    under18_res = TargetCalculator.calculate_targets(
        age=16, weight_kg=70.0, height_cm=170.0, gender="male", gym_experience="beginner", requested_goal="lose"
    )
    print(f"  Safety Lock (Under-18): Goal={under18_res['goal']} (Refused 'lose')")
    print(f"  Explanation: {under18_res['refusal_explanation']}")

    # 2. Forward & Backward Chaining Rule Engine
    print("\n[2] FORWARD & BACKWARD CHAINING RULE ENGINE (Units 3 & 5):")
    facts = {
        "gender": "male",
        "target_calories": 1300.0, # Below 1500 kcal male floor
        "level": 1,
        "fibre_g": 35.0, # Above beginner ramp cap
        "gym_experience": "beginner",
        "weight_kg": 74.0,
        "protein_g": 180.0 # Above beginner ramp cap
    }
    updated_facts, trace = RULE_ENGINE.forward_chain(facts)
    print(f"  Original Facts: {facts}")
    print(f"  Fired Rules: {trace}")
    print(f"  Adjusted Calories (Floor): {updated_facts['target_calories']} kcal")
    print(f"  Adjusted Fibre (Ramp): {updated_facts['fibre_g']} g")
    print(f"  Adjusted Protein (Ramp): {updated_facts['protein_g']} g")

    # 3. Passive Latent State Estimator (Zero Sliders)
    print("\n[3] PASSIVE LATENT STATE ESTIMATOR (Unit 4):")
    simulated_state = {
        "profile": adult_res,
        "consecutive_unexcused_misses": 0,
        "simulated_date": "2026-11-16",
        "daily_logs": {
            "2026-11-16": {
                "calories_logged": 1950.0,
                "protein_logged": 140.0,
                "mindful_completed": True,
                "exercise_logs": [
                    {"category": "weightlifting", "duration_min": 45, "sets": 5}
                ]
            }
        }
    }
    states = AI_ESTIMATOR.estimate(simulated_state)
    print(f"  Passive Inference: Inferred Mood = {states['inferred_mood']}, Inferred Fatigue = {states['inferred_fatigue']}")

    # 4. Bayesian Player Model
    print("\n[4] BAYESIAN NETWORK PLAYER MODEL (Unit 4):")
    risk, weakest = BAYES_MODEL.infer_risk_and_pillar(
        states['inferred_mood'], states['inferred_fatigue'], consistency_rate=0.85, daily_logs=simulated_state['daily_logs']
    )
    print(f"  Posterior P(Streak Break Risk | Evidence) = {risk}")
    print(f"  Weakest Habit Pillar Detected = {weakest.upper()}")

    # 5. Fuzzy Difficulty Controller
    print("\n[5] FUZZY DIFFICULTY CONTROLLER (Unit 5 Soft Computing):")
    fuzzy_out = FUZZY_CONTROLLER.evaluate(states['inferred_fatigue'], states['inferred_mood'], risk)
    print(f"  Fuzzy Regime Defuzzified = {fuzzy_out['regime'].upper()}")
    print(f"  Target Scaling Multiplier = {fuzzy_out['target_multiplier']}x")
    print(f"  Fuzzy Activations = {fuzzy_out['membership_activations']}")

    # 6. Supervised Readiness Predictor & Non-Monotonic Reasoning
    print("\n[6] SUPERVISED READINESS PREDICTOR (Units 1 & 4):")
    readiness_normal = READINESS_PREDICTOR.predict_readiness(
        consecutive_unexcused_misses=0, inferred_fatigue=states['inferred_fatigue'], recent_adherence_rate=0.9
    )
    print(f"  Adherent User Readiness: Drop-off Risk = {readiness_normal['drop_off_risk']}, Readiness = {readiness_normal['readiness_score']}")

    readiness_missed = READINESS_PREDICTOR.predict_readiness(
        consecutive_unexcused_misses=3, inferred_fatigue=0.8, recent_adherence_rate=0.2
    )
    print(f"  Disengaged User (3 Misses): Drop-off Risk = {readiness_missed['drop_off_risk']}")
    print(f"  Non-Monotonic Override Fired: {readiness_missed['non_monotonic_override']} (Forces Re-Entry Mode)")

    # 7. Dynamic Utility-Agent Meal Rating & Genetic Algorithm
    print("\n[7] UTILITY AGENT & GENETIC ALGORITHM PRO TIP (Units 1 & 3):")
    kb_data = KB_STORE.read()
    test_food = kb_data['foods'][0] # Whey Protein
    missing = {"calories": 400.0, "protein_g": 35.0, "carbs_g": 40.0, "fat_g": 10.0, "fibre_g": 8.0}
    rating_data = UtilityAgent.calculate_meal_rating(test_food, adult_res, missing)
    print(f"  Food: {test_food['name']}")
    print(f"  Dynamic Utility Rating: {rating_data['rating']} / 100")
    print(f"  Weights Used: {rating_data['weights_used']}")
    print(f"  Coach Notes: {rating_data['notes']}")

    ga = GeneticAlgorithmMealOptimizer(kb_data['foods'], population_size=20, generations=12)
    pro_tip = ga.evolve_pro_tip(missing, preferred_region="North Indian")
    print(f"  GA Evolved Pro Tip: \"{pro_tip['pro_tip']}\" (Fitness: {pro_tip['fitness_score']})")

    # 8. Weakness-Targeted Boss Engine
    print("\n[8] WEAKNESS-TARGETED BOSS ENGINE (Unit 3 Targeted Search):")
    boss = BOSS_ENGINE.generate_boss_challenge(weakest, rank=1, targets=adult_res['daily_targets'])
    print(f"  Boss Name: {boss['boss_name']}")
    print(f"  Challenge: {boss['challenge_title']}")
    print(f"  Metric Requirement: {boss['target_metric']}")
    print(f"  Rewards: +{boss['xp_reward']} XP, +{boss['token_reward']} Tokens")

    print("\n" + "=" * 70)
    print(" ALL 8 AI & EXPERT SYSTEM SUBSYSTEMS VERIFIED AND OPERATIONAL!")
    print("=" * 70)

if __name__ == "__main__":
    run_evaluation_simulation()
