"""
Weakness-Targeted Boss Engine & 5-Day Progression Manager (SPEC.md Section 3.9 & 4)
Course Mapping: 25AM2304 (AI & Expert Systems - Unit 3)

- 5-Day Cycle Manager:
  - Days 1 to 4: Standard Fuzzy-adjusted daily quests.
  - Day 5 (M = 5): Replaces standard quests with a single Boss Level weighted toward the user's weakest habit pillar.
  - Completing Day 5 Boss increments user Rank (+5 tokens, next level unlocks).
  - Failing repeats safely without penalty.
"""
from typing import Dict, Any

class BossEngine:
    @staticmethod
    def generate_boss_challenge(weakest_pillar: str, rank: int, targets: Dict[str, Any]) -> Dict[str, Any]:
        """
        Creates a Boss Encounter weighted specifically toward the player model's detected weakness.
        Strictly bounded by safety caps.
        """
        if weakest_pillar == "nutrition":
            cal = targets.get("calories", 2000)
            prot = targets.get("protein_g", 120)
            return {
                "boss_name": f"The Caloric Titan (Rank {rank})",
                "weakest_pillar": "nutrition",
                "challenge_title": "Grand Macro Feast & Satiety Lockdown",
                "description": f"Hit exact macronutrient goals within 95% precision: {cal} kcal and {prot}g protein with zero skipped meals.",
                "target_metric": f"{prot}g Protein / {cal} kcal",
                "xp_reward": 150,
                "token_reward": 5,
                "health_points": 100,
                "icon": "Apple"
            }
        elif weakest_pillar == "mindful":
            return {
                "boss_name": f"The Mindstorm Chimera (Rank {rank})",
                "weakest_pillar": "mindful",
                "challenge_title": "Deep Parasympathetic Breakthrough",
                "description": "Engage in an unbroken 20-minute dual breathwork and mindfulness protocol (Anulom Vilom + Body Scan).",
                "target_metric": "20 minutes mindfulness",
                "xp_reward": 150,
                "token_reward": 5,
                "health_points": 100,
                "icon": "Brain"
            }
        else: # exercise
            return {
                "boss_name": f"The Iron Colossus (Rank {rank})",
                "weakest_pillar": "exercise",
                "challenge_title": "Progressive Overload Citadel",
                "description": "Complete a high-volume compound session (45+ active min or at least 4 progressive overload sets).",
                "target_metric": "45 min / 4 Overload Sets",
                "xp_reward": 150,
                "token_reward": 5,
                "health_points": 100,
                "icon": "Dumbbell"
            }

BOSS_ENGINE = BossEngine()
