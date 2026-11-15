"""
Target Calculator & Hard Safety Lock Engine (SPEC.md Section 3.1 & 3.3)
Computes BMI, BMR (Mifflin-St Jeor), TDEE, and daily macro targets.
Enforces hard safety locks and backward chaining refusal traces.
"""
from typing import Dict, Any, Tuple, Optional

class TargetCalculator:
    ACTIVITY_MULTIPLIERS = {
        "beginner": 1.25,      # sedentary to light
        "intermediate": 1.45,  # moderate gym training
        "pro": 1.65            # intense training / progressive overload
    }

    @staticmethod
    def calculate_bmi(weight_kg: float, height_cm: float) -> float:
        height_m = height_cm / 100.0
        if height_m <= 0:
            return 0.0
        return round(weight_kg / (height_m ** 2), 2)

    @staticmethod
    def calculate_bmr(weight_kg: float, height_cm: float, age: int, gender: str) -> float:
        """
        Mifflin-St Jeor Equation:
        Men: (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + 5
        Women: (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) - 161
        """
        base = (10.0 * weight_kg) + (6.25 * height_cm) - (5.0 * age)
        if gender.lower() == "male":
            return round(base + 5.0, 1)
        else:
            return round(base - 161.0, 1)

    @classmethod
    def evaluate_safety_and_goal(
        cls, age: int, bmi: float, requested_goal: Optional[str] = None
    ) -> Tuple[str, Optional[str], Optional[str]]:
        """
        Returns: (enforced_goal, refusal_explanation, nearest_safe_target)
        Hard Safety Locks:
        - age < 18: Strictly prohibited from weight-loss plans.
        - BMI < 18.5 (Underweight): Locked to 'gain'.
        - BMI >= 25.0 (Overweight/Obese): Locked to 'lose'.
        - 18.5 <= BMI < 25.0 (Normal): User chooses gain, lose, or maintain.
        """
        req = requested_goal.lower() if requested_goal else None

        # Lock 1: Under 18 safety lock
        if age < 18:
            if req == "lose":
                return (
                    "maintain",
                    "Backward Chaining Trace: Rule [RULE-SAFE-01] fired -> User age is under 18. Weight-loss caloric restrictions are strictly prohibited during growth phases.",
                    "Goal safely set to 'maintain' with nutrient-dense targets."
                )
            enforced = req if req in ["gain", "maintain"] else "maintain"
            return (enforced, None, None)

        # Lock 2: Underweight safety lock
        if bmi < 18.5:
            if req and req != "gain":
                return (
                    "gain",
                    f"Backward Chaining Trace: Rule [RULE-SAFE-02] fired -> Calculated BMI ({bmi}) is below 18.5 (Underweight threshold). Deficit or maintenance targets are disallowed.",
                    "Goal locked to healthy muscle & mass 'gain'."
                )
            return ("gain", None, None)

        # Lock 3: Overweight/Obese safety lock
        if bmi >= 25.0:
            if req and req != "lose":
                return (
                    "lose",
                    f"Backward Chaining Trace: Rule [RULE-SAFE-03] fired -> Calculated BMI ({bmi}) is 25.0 or above (Overweight/Obese threshold). Caloric surplus is disallowed.",
                    "Goal locked to safe progressive fat 'lose'."
                )
            return ("lose", None, None)

        # Normal weight: user choice or default maintain
        if req in ["gain", "lose", "maintain"]:
            return (req, None, None)
        return ("maintain", None, None)

    @classmethod
    def calculate_targets(
        cls,
        age: int,
        weight_kg: float,
        height_cm: float,
        gender: str,
        gym_experience: str,
        requested_goal: Optional[str] = None
    ) -> Dict[str, Any]:
        bmi = cls.calculate_bmi(weight_kg, height_cm)
        bmr = cls.calculate_bmr(weight_kg, height_cm, age, gender)
        
        mult = cls.ACTIVITY_MULTIPLIERS.get(gym_experience.lower(), 1.35)
        tdee = round(bmr * mult, 1)

        enforced_goal, refusal_explanation, nearest_safe = cls.evaluate_safety_and_goal(
            age, bmi, requested_goal
        )

        # Goal adjustments
        # Weekly rates: loss = ~500 kcal/day deficit (0.5kg/week); gain = ~350 kcal/day surplus (0.35kg/week)
        if enforced_goal == "lose":
            target_calories = tdee - 500.0
        elif enforced_goal == "gain":
            target_calories = tdee + 350.0
        else:
            target_calories = tdee

        # Enforce Forward Chaining Calorie Floors: >= 1500 kcal (male), >= 1200 kcal (female)
        calorie_floor = 1500.0 if gender.lower() == "male" else 1200.0
        if target_calories < calorie_floor:
            target_calories = calorie_floor

        # Macro split calculations
        # Protein: 1.6 - 2.2 g/kg based on experience and goal
        if enforced_goal in ["lose", "gain"] or gym_experience.lower() in ["intermediate", "pro"]:
            protein_g = round(weight_kg * 2.0, 1)
        else:
            protein_g = round(weight_kg * 1.6, 1)

        # Fat: 25% of daily calories
        fat_cals = target_calories * 0.25
        fat_g = round(fat_cals / 9.0, 1)

        # Carbs: Remaining calories
        protein_cals = protein_g * 4.0
        remaining_cals = max(0.0, target_calories - protein_cals - fat_cals)
        carbs_g = round(remaining_cals / 4.0, 1)

        # Fibre: ~14g per 1000 kcal (minimum 25g, standard 30-38g)
        fibre_g = round(max(25.0, (target_calories / 1000.0) * 14.0), 1)

        return {
            "bmi": bmi,
            "bmr": bmr,
            "tdee": tdee,
            "goal": enforced_goal,
            "refusal_explanation": refusal_explanation,
            "nearest_safe_target": nearest_safe,
            "daily_targets": {
                "calories": round(target_calories),
                "protein_g": protein_g,
                "carbs_g": carbs_g,
                "fat_g": fat_g,
                "fibre_g": fibre_g
            }
        }
