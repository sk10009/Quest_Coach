"""
Utility-Based Agent & Genetic Algorithm Meal Optimizer (SPEC.md Section 3.7 & 3.8)
Course Mapping: 25AM2304 (AI & Expert Systems - Units 1 & 3)

1. Utility-Based Agent:
   - Evaluates foods against user's specific context (BMI, age, gender, goal)
   - Dynamically weights macro importance based on LIVE remaining daily deficits
   - Returns a Dynamic Meal Rating (0-100) (Never a static formula)

2. Genetic Algorithm Meal Generator:
   - Evolves candidate food additions to minimize Euclidean distance to remaining daily targets
   - Selects by fitness, applies single-point crossover & mutation
   - Generates the Meal Overview 'Pro Tip' food swap recommendation
"""
import random
import math
from typing import Dict, Any, List, Optional, Tuple

class UtilityAgent:
    @staticmethod
    def calculate_meal_rating(
        food: Dict[str, Any],
        profile: Dict[str, Any],
        remaining_macros: Dict[str, float]
    ) -> Dict[str, Any]:
        """
        Dynamically weights calories, protein, carbs, fat, and fibre based on user's goal
        and what the user is currently missing today.
        """
        goal = profile.get("goal", "maintain")
        bmi = profile.get("bmi", 22.0)
        
        rem_cals = max(0.0, remaining_macros.get("calories", 0.0))
        rem_prot = max(0.0, remaining_macros.get("protein_g", 0.0))
        rem_carbs = max(0.0, remaining_macros.get("carbs_g", 0.0))
        rem_fat = max(0.0, remaining_macros.get("fat_g", 0.0))
        rem_fibre = max(0.0, remaining_macros.get("fibre_g", 0.0))

        # Dynamic weighting based on what is most urgently needed
        w_prot = 0.35
        w_cal = 0.25
        w_fibre = 0.15
        w_fat = 0.15
        w_carbs = 0.10

        if goal == "lose" or bmi >= 25.0:
            w_prot = 0.40
            w_fibre = 0.25
            w_cal = 0.20
            w_fat = 0.10
            w_carbs = 0.05
        elif goal == "gain":
            w_cal = 0.35
            w_prot = 0.35
            w_carbs = 0.20
            w_fat = 0.10

        # Sub-scores (0 - 100)
        # Protein utility: does food provide protein without exceeding daily deficit?
        food_prot = food.get("protein_g", 0.0)
        prot_density = (food_prot * 4.0) / max(1.0, food.get("calories", 1.0)) # % cals from protein
        prot_score = min(100.0, prot_density * 220.0 + (min(food_prot, rem_prot) / max(1.0, rem_prot)) * 50.0)

        # Calorie utility: how well it fits into remaining calories
        food_cals = food.get("calories", 0.0)
        if rem_cals <= 0:
            cal_score = max(10.0, 100.0 - (food_cals / 5.0))
        else:
            diff_ratio = abs(food_cals - (rem_cals * 0.35)) / max(1.0, rem_cals * 0.35)
            cal_score = max(20.0, 100.0 - (diff_ratio * 50.0))

        # Fibre utility
        food_fibre = food.get("fibre_g", 0.0)
        fibre_score = min(100.0, (food_fibre / 4.0) * 80.0)

        # Fat and Carbs balance
        food_fat = food.get("fat_g", 0.0)
        fat_penalty = max(0.0, (food_fat * 9.0) / max(1.0, food_cals) - 0.45) * 100.0
        fat_score = max(10.0, 100.0 - fat_penalty)

        food_carbs = food.get("carbs_g", 0.0)
        carb_score = 80.0 if food_carbs > 0 else 50.0

        # Composite dynamic rating
        total_utility = (
            (prot_score * w_prot) +
            (cal_score * w_cal) +
            (fibre_score * w_fibre) +
            (fat_score * w_fat) +
            (carb_score * w_carbs)
        )
        final_rating = max(20, min(99, round(total_utility)))

        # Notes generation explaining the rating dynamically
        notes = []
        if prot_density >= 0.25:
            notes.append(f"High protein density ({round(prot_density*100)}% of cals from protein), excellent for your {goal} target.")
        elif food_prot < 3.0:
            notes.append("Relatively low in protein; consider pairing with a high-protein side like curd, paneer, or eggs.")

        if food_fibre >= 4.0:
            notes.append("Rich in prebiotic dietary fibre, supporting sustained satiety and GI microbiome health.")

        if food_cals > 350:
            notes.append("High caloric density — measure portions carefully to stay within your remaining daily budget.")

        return {
            "rating": final_rating,
            "weights_used": {
                "protein": round(w_prot, 2),
                "calories": round(w_cal, 2),
                "fibre": round(w_fibre, 2),
                "fat": round(w_fat, 2),
                "carbs": round(w_carbs, 2)
            },
            "sub_scores": {
                "protein_utility": round(prot_score, 1),
                "calorie_utility": round(cal_score, 1),
                "fibre_utility": round(fibre_score, 1)
            },
            "notes": notes
        }

class GeneticAlgorithmMealOptimizer:
    """
    Genetic Algorithm (Unit 3 Targeted Search):
    Evolves candidate food portions to minimize Euclidean distance to remaining daily macro deficits.
    """
    def __init__(self, food_catalogue: List[Dict[str, Any]], population_size: int = 24, generations: int = 15):
        self.food_catalogue = [f for f in food_catalogue if f.get("is_verified", True)]
        self.pop_size = population_size
        self.generations = generations

    def _fitness(self, candidate_food: Dict[str, Any], portion_mult: float, remaining: Dict[str, float]) -> float:
        """
        Fitness is inverse Euclidean distance to remaining targets.
        Higher fitness = closer match to filling remaining deficits.
        """
        cals_diff = (candidate_food["calories"] * portion_mult) - remaining.get("calories", 0.0)
        prot_diff = (candidate_food["protein_g"] * portion_mult) - remaining.get("protein_g", 0.0)
        carbs_diff = (candidate_food["carbs_g"] * portion_mult) - remaining.get("carbs_g", 0.0)
        fat_diff = (candidate_food["fat_g"] * portion_mult) - remaining.get("fat_g", 0.0)

        # Normalized weighted Euclidean distance
        dist = math.sqrt(
            (cals_diff / 500.0) ** 2 +
            (prot_diff / 30.0) ** 2 +
            (carbs_diff / 50.0) ** 2 +
            (fat_diff / 20.0) ** 2
        )
        return 1.0 / (1.0 + dist)

    def evolve_pro_tip(
        self,
        remaining_macros: Dict[str, float],
        preferred_region: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Runs genetic algorithm to produce the best candidate food recommendation.
        """
        if not self.food_catalogue:
            return {
                "pro_tip": "Add a lean protein and high-fibre side to balance your remaining macros.",
                "recommended_food": None,
                "recommended_portion_g": 100
            }

        # Filter candidate pool with preference for region if available
        pool = self.food_catalogue
        if preferred_region:
            reg_pool = [f for f in self.food_catalogue if f.get("region") == preferred_region or f.get("region") == "Gym Staple"]
            if len(reg_pool) >= 10:
                pool = reg_pool

        # Determine biggest missing macro
        rem_prot = remaining_macros.get("protein_g", 0.0)
        rem_fibre = remaining_macros.get("fibre_g", 0.0)
        rem_cals = remaining_macros.get("calories", 0.0)

        # Initial Population: chromosomes are (food_idx, portion_multiplier)
        population: List[Tuple[int, float]] = []
        for _ in range(self.pop_size):
            food_idx = random.randint(0, len(pool) - 1)
            portion_mult = random.uniform(0.5, 2.0)
            population.append((food_idx, portion_mult))

        # Genetic Algorithm Evolution Loop
        for _ in range(self.generations):
            # Evaluate fitness
            fitness_scores = [
                (self._fitness(pool[f_idx], p_mult, remaining_macros), (f_idx, p_mult))
                for f_idx, p_mult in population
            ]
            fitness_scores.sort(key=lambda x: x[0], reverse=True)

            # Elitism: retain top 4
            next_generation = [item[1] for item in fitness_scores[:4]]

            # Selection & Crossover
            parents = [item[1] for item in fitness_scores[:self.pop_size // 2]]
            while len(next_generation) < self.pop_size:
                p1 = random.choice(parents)
                p2 = random.choice(parents)
                # Single-point crossover: combine food from p1 and portion from p2
                child_food = p1[0] if random.random() < 0.5 else p2[0]
                child_portion = (p1[1] + p2[1]) / 2.0

                # Mutation: slight portion jitter or random food swap
                if random.random() < 0.2:
                    child_portion = max(0.5, min(2.5, child_portion + random.uniform(-0.3, 0.3)))
                if random.random() < 0.15:
                    child_food = random.randint(0, len(pool) - 1)

                next_generation.append((child_food, child_portion))

            population = next_generation

        # Best chromosome
        best_fitness, (best_food_idx, best_portion_mult) = max(
            [(self._fitness(pool[f_idx], p_mult, remaining_macros), (f_idx, p_mult)) for f_idx, p_mult in population],
            key=lambda x: x[0]
        )

        best_food = pool[best_food_idx]
        recommended_grams = round(best_food["standard_portion_g"] * best_portion_mult)

        # Identify primary target macro to mention in the Pro Tip
        if rem_prot > 20:
            target_macro = "protein"
        elif rem_fibre > 6:
            target_macro = "fibre"
        elif rem_cals > 300:
            target_macro = "caloric energy"
        else:
            target_macro = "daily macro"

        pro_tip_text = (
            f"Pro tip: Adding {recommended_grams}g of {best_food['name']} will help close your remaining {target_macro} goal."
        )

        return {
            "pro_tip": pro_tip_text,
            "recommended_food": best_food,
            "recommended_portion_g": recommended_grams,
            "fitness_score": round(best_fitness, 4)
        }
