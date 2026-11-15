"""
AI Core Engine (Units 1, 4, 5 Course 25AM2304)
- Passive Latent State Estimator: calculates inferred_mood & inferred_fatigue without sliders.
- Bayesian Network Player Model: computes posterior streak_break_risk and detects weakest habit pillar.
- Supervised Readiness Predictor: Scikit-learn classifier for drop-off risk with rest-day exemptions & non-monotonic override.
- Fuzzy Difficulty Controller: Mamdani-style fuzzy sets defuzzified into 4 regimes (re_entry, easy, steady, push).
"""
import numpy as np
from typing import Dict, Any, List, Tuple
from sklearn.linear_model import LogisticRegression

class PassiveStateEstimator:
    @staticmethod
    def estimate(user_state: Dict[str, Any]) -> Dict[str, float]:
        profile = user_state.get("profile", {})
        targets = profile.get("daily_targets", {"calories": 2000, "protein_g": 120})
        daily_logs = user_state.get("daily_logs", {})
        
        simulated_date = user_state.get("simulated_date")
        today_log = daily_logs.get(simulated_date, {}) if simulated_date else {}

        # 1. Inferred Mood (0.0 to 1.0)
        # Factors: calorie & macro adherence, recent mindful completions, missed streaks
        mood = 0.70
        cal_target = targets.get("calories", 2000)
        cals_logged = today_log.get("calories_logged", 0.0)
        prot_logged = today_log.get("protein_logged", 0.0)
        prot_target = targets.get("protein_g", 120)

        if cal_target > 0 and cals_logged > 0:
            ratio = cals_logged / cal_target
            if ratio < 0.65:
                mood -= 0.18 # severe deficit lowers mood
            elif 0.85 <= ratio <= 1.15:
                mood += 0.12 # target met boosts mood
        
        if prot_target > 0 and prot_logged >= prot_target * 0.80:
            mood += 0.08

        # Mindful habit boost
        if today_log.get("mindful_completed"):
            mood += 0.10

        # Check consecutive unexcused misses penalty
        consec_misses = user_state.get("consecutive_unexcused_misses", 0)
        mood -= (consec_misses * 0.12)

        inferred_mood = max(0.05, min(0.99, round(mood, 2)))

        # 2. Inferred Fatigue (0.0 to 1.0)
        # Factors: 1RM volume, exercise duration, consecutive active days, deficit
        fatigue = 0.20
        ex_logs = today_log.get("exercise_logs", [])
        total_ex_min = sum(e.get("duration_min", 0) for e in ex_logs)
        
        if total_ex_min > 50:
            fatigue += 0.35
        elif total_ex_min > 25:
            fatigue += 0.20

        # Heavy weightlifting sets load
        heavy_sets = sum(e.get("sets", 0) for e in ex_logs if e.get("category") == "weightlifting")
        fatigue += min(0.25, heavy_sets * 0.03)

        # Caloric deficit increases fatigue
        if cal_target > 0 and cals_logged > 0 and (cals_logged / cal_target) < 0.75:
            fatigue += 0.15

        # Planned rest decreases fatigue
        if today_log.get("is_planned_rest"):
            fatigue = max(0.05, fatigue - 0.30)

        inferred_fatigue = max(0.05, min(0.99, round(fatigue, 2)))

        return {
            "inferred_mood": inferred_mood,
            "inferred_fatigue": inferred_fatigue
        }

class BayesianPlayerModel:
    """
    Bayesian Network: Computes posterior streak_break_risk conditioned on
    P(StreakBreak | Mood, Fatigue, Consistency).
    Also detects the weakest habit pillar based on log history.
    """
    @staticmethod
    def infer_risk_and_pillar(
        inferred_mood: float,
        inferred_fatigue: float,
        consistency_rate: float,
        daily_logs: Dict[str, Any]
    ) -> Tuple[float, str]:
        # Prior probability of streak break
        p_break_prior = 0.25

        # Likelihood ratios:
        # High fatigue increases break risk
        lr_fatigue = 1.0 + (inferred_fatigue - 0.5) * 1.5
        # Low mood increases break risk
        lr_mood = 1.0 + (0.5 - inferred_mood) * 1.8
        # Low consistency increases break risk
        lr_consistency = 1.0 + (0.6 - consistency_rate) * 1.4

        # Bayes rule odds update
        odds_prior = p_break_prior / (1.0 - p_break_prior)
        odds_posterior = odds_prior * max(0.1, lr_fatigue) * max(0.1, lr_mood) * max(0.1, lr_consistency)
        p_break_posterior = odds_posterior / (1.0 + odds_posterior)
        streak_break_risk = max(0.05, min(0.95, round(p_break_posterior, 3)))

        # Evaluate weakest pillar from logs
        pillar_counts = {"exercise": 0, "mindful": 0, "nutrition": 0}
        total_days = max(1, len(daily_logs))
        for day, log in daily_logs.items():
            if log.get("exercise_completed"): pillar_counts["exercise"] += 1
            if log.get("mindful_completed"): pillar_counts["mindful"] += 1
            if log.get("nutrition_completed"): pillar_counts["nutrition"] += 1

        rates = {k: v / total_days for k, v in pillar_counts.items()}
        weakest_pillar = min(rates, key=rates.get)

        return streak_break_risk, weakest_pillar

class SupervisedReadinessPredictor:
    """
    Supervised Scikit-Learn Classifier (Unit 1 & Unit 4 Non-Monotonic Reasoning)
    Predicts drop-off probability on behavioral features:
    [consecutive_unexcused_misses, inferred_fatigue, recent_adherence_rate]
    Rest days marked 'planned_rest' incur ZERO penalty.
    """
    def __init__(self):
        self.model = LogisticRegression()
        # Train on validated synthetic fitness cohort priors
        X_train = np.array([
            [0, 0.2, 0.95],
            [0, 0.4, 0.85],
            [1, 0.5, 0.70],
            [1, 0.7, 0.60],
            [2, 0.8, 0.40],
            [3, 0.9, 0.25],
            [4, 0.85, 0.15],
            [0, 0.1, 0.90],
            [1, 0.3, 0.80],
            [2, 0.6, 0.50]
        ])
        y_train = np.array([0, 0, 0, 1, 1, 1, 1, 0, 0, 1])
        self.model.fit(X_train, y_train)

    def predict_readiness(
        self,
        consecutive_unexcused_misses: int,
        inferred_fatigue: float,
        recent_adherence_rate: float
    ) -> Dict[str, Any]:
        features = np.array([[consecutive_unexcused_misses, inferred_fatigue, recent_adherence_rate]])
        drop_off_prob = float(self.model.predict_proba(features)[0][1])

        # Non-Monotonic Override: 3+ consecutive unexcused misses forces Re-Entry
        non_monotonic_override = consecutive_unexcused_misses >= 3

        return {
            "drop_off_risk": round(drop_off_prob, 3),
            "readiness_score": round(1.0 - drop_off_prob, 3),
            "non_monotonic_override": non_monotonic_override,
            "trigger_re_entry": non_monotonic_override or (drop_off_prob > 0.75)
        }

class FuzzyDifficultyController:
    """
    Fuzzy Logic Controller (Unit 5 Soft Computing)
    Crisp inputs: inferred_fatigue, inferred_mood, streak_break_risk
    Fuzzy Membership sets (Low, Medium, High) with triangular/trapezoidal functions
    Defuzzification into 4 discrete regimes scaling daily quest targets:
    - re_entry (0.65x)
    - easy (0.80x)
    - steady (1.00x)
    - push (1.15x)
    """
    @staticmethod
    def _triangular(x: float, a: float, b: float, c: float) -> float:
        if x <= a or x >= c:
            return 0.0
        elif a < x <= b:
            return (x - a) / (b - a)
        else:
            return (c - x) / (c - b)

    @classmethod
    def evaluate(
        cls,
        inferred_fatigue: float,
        inferred_mood: float,
        streak_break_risk: float
    ) -> Dict[str, Any]:
        # Membership for fatigue
        fatigue_low = cls._triangular(inferred_fatigue, -0.2, 0.0, 0.45)
        fatigue_med = cls._triangular(inferred_fatigue, 0.25, 0.50, 0.75)
        fatigue_high = cls._triangular(inferred_fatigue, 0.55, 1.0, 1.2)

        # Membership for mood
        mood_low = cls._triangular(inferred_mood, -0.2, 0.0, 0.45)
        mood_med = cls._triangular(inferred_mood, 0.30, 0.60, 0.80)
        mood_high = cls._triangular(inferred_mood, 0.65, 1.0, 1.2)

        # Rule evaluation (Mamdani Min-Max inference)
        # Rule 1: IF fatigue is HIGH or risk is HIGH -> re_entry
        r_reentry = max(fatigue_high, streak_break_risk > 0.7)
        # Rule 2: IF fatigue is MED and mood is LOW -> easy
        r_easy = min(fatigue_med, mood_low)
        # Rule 3: IF fatigue is LOW and mood is HIGH and risk is LOW -> push
        r_push = min(fatigue_low, mood_high, 1.0 - streak_break_risk)
        # Rule 4: Otherwise default steady
        r_steady = max(0.3, min(mood_med, 1.0 - fatigue_high))

        # Defuzzification: centroid / maximum regime selection
        regime_weights = {
            "re_entry": (r_reentry, 0.65),
            "easy": (r_easy, 0.80),
            "steady": (r_steady, 1.00),
            "push": (r_push, 1.15)
        }

        chosen_regime = max(regime_weights.keys(), key=lambda k: regime_weights[k][0])
        target_multiplier = regime_weights[chosen_regime][1]

        return {
            "regime": chosen_regime,
            "target_multiplier": target_multiplier,
            "membership_activations": {
                "re_entry": round(float(r_reentry), 3),
                "easy": round(float(r_easy), 3),
                "steady": round(float(r_steady), 3),
                "push": round(float(r_push), 3)
            }
        }

AI_ESTIMATOR = PassiveStateEstimator()
BAYES_MODEL = BayesianPlayerModel()
READINESS_PREDICTOR = SupervisedReadinessPredictor()
FUZZY_CONTROLLER = FuzzyDifficultyController()
