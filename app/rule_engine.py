"""
Forward & Backward Chaining Rule Engine (SPEC.md Section 3.3)
Course Mapping: 25AM2304 (AI & Expert Systems - Units 3 & 5)

Rules defined declaratively with premise predicates and consequence actions.
Forward Chaining:
- Enforces weekly weight change caps (gain: 0.25-0.5 kg/week, loss: 0.5-1.0 kg/week)
- Enforces gender calorie floors (>= 1500 kcal male, >= 1200 kcal female)
- Gradual protein/fibre ramp-up across levels to avoid digestive distress
- Evaluates N = 4 of M = 5 cycle progression

Backward Chaining:
- Traces violated rules when unsafe goals, rates, or restrictions are detected
- Explains why the request was refused and recommends nearest safe target
"""
from typing import Dict, Any, List, Optional, Tuple

class Rule:
    def __init__(self, rule_id: str, name: str, premise_fn, consequence_fn, explanation: str):
        self.rule_id = rule_id
        self.name = name
        self.premise_fn = premise_fn
        self.consequence_fn = consequence_fn
        self.explanation = explanation

    def check(self, facts: Dict[str, Any]) -> bool:
        return self.premise_fn(facts)

    def execute(self, facts: Dict[str, Any]) -> Dict[str, Any]:
        return self.consequence_fn(facts)

class RuleEngine:
    def __init__(self):
        self.forward_rules: List[Rule] = [
            Rule(
                rule_id="RULE-FWD-FLOOR-MALE",
                name="Male Calorie Floor Enforcement",
                premise_fn=lambda f: f.get("gender") == "male" and f.get("target_calories", 0) < 1500,
                consequence_fn=lambda f: {**f, "target_calories": 1500.0, "floor_applied": True},
                explanation="Forward Chaining: Adjusted target calories up to 1500 kcal male physiological floor to prevent metabolic suppression."
            ),
            Rule(
                rule_id="RULE-FWD-FLOOR-FEMALE",
                name="Female Calorie Floor Enforcement",
                premise_fn=lambda f: f.get("gender") == "female" and f.get("target_calories", 0) < 1200,
                consequence_fn=lambda f: {**f, "target_calories": 1200.0, "floor_applied": True},
                explanation="Forward Chaining: Adjusted target calories up to 1200 kcal female physiological floor to protect hormonal balance."
            ),
            Rule(
                rule_id="RULE-FWD-FIBRE-RAMP",
                name="Fibre Gradual Ramp-Up",
                premise_fn=lambda f: f.get("level", 1) < 3 and f.get("fibre_g", 0) > 30,
                consequence_fn=lambda f: {**f, "fibre_g": 25.0, "ramp_applied": True},
                explanation="Forward Chaining: Capped fibre at 25g during initial levels (< 3) to prevent sudden GI distress."
            ),
            Rule(
                rule_id="RULE-FWD-PROTEIN-RAMP",
                name="Beginner Protein Ramp-Up",
                premise_fn=lambda f: f.get("gym_experience") == "beginner" and (f.get("protein_g", 0) / max(1, f.get("weight_kg", 70))) > 1.8,
                consequence_fn=lambda f: {**f, "protein_g": round(f.get("weight_kg", 70) * 1.6, 1), "ramp_applied": True},
                explanation="Forward Chaining: Scaled beginner protein to 1.6 g/kg to allow enzymatic digestive adaptation."
            ),
            Rule(
                rule_id="RULE-FWD-CYCLE-PROGRESS",
                name="Cycle Progression Rule",
                premise_fn=lambda f: f.get("completed_pillars_count", 0) == 3,
                consequence_fn=lambda f: {**f, "day_passed": True, "token_reward": 1},
                explanation="Forward Chaining: All 3 pillars met today -> Day marked passed and 1 token awarded."
            )
        ]

        self.backward_rules: List[Rule] = [
            Rule(
                rule_id="RULE-BC-AGE-LOCK",
                name="Minor Caloric Restriction Prohibition",
                premise_fn=lambda f: f.get("age", 25) < 18 and f.get("goal") == "lose",
                consequence_fn=lambda f: {
                    "valid": False,
                    "safe_goal": "maintain",
                    "reason": "Age is below 18. Medical and nutritional safety protocols prohibit caloric deficit regimes during adolescent physical maturation."
                },
                explanation="Goal 'lose' refused because premise [age < 18] is TRUE."
            ),
            Rule(
                rule_id="RULE-BC-UNDERWEIGHT-LOCK",
                name="Underweight Caloric Deficit Prohibition",
                premise_fn=lambda f: f.get("bmi", 22) < 18.5 and f.get("goal") in ["lose", "maintain"],
                consequence_fn=lambda f: {
                    "valid": False,
                    "safe_goal": "gain",
                    "reason": f"Current BMI ({f.get('bmi')}) is in the Underweight range (< 18.5). Deficit or maintenance targets risk immune suppression."
                },
                explanation="Goal refused because premise [BMI < 18.5] is TRUE."
            ),
            Rule(
                rule_id="RULE-BC-OVERWEIGHT-LOCK",
                name="Overweight Caloric Surplus Prohibition",
                premise_fn=lambda f: f.get("bmi", 22) >= 25.0 and f.get("goal") in ["gain"],
                consequence_fn=lambda f: {
                    "valid": False,
                    "safe_goal": "lose",
                    "reason": f"Current BMI ({f.get('bmi')}) is in the Overweight/Obese range (>= 25.0). Caloric surplus is contraindicated."
                },
                explanation="Goal 'gain' refused because premise [BMI >= 25.0] is TRUE."
            ),
            Rule(
                rule_id="RULE-BC-EXCESS-RATE",
                name="Excessive Weekly Rate Prohibition",
                premise_fn=lambda f: f.get("weekly_rate_kg", 0.5) > (1.0 if f.get("goal") == "lose" else 0.5),
                consequence_fn=lambda f: {
                    "valid": False,
                    "safe_rate": 0.75 if f.get("goal") == "lose" else 0.35,
                    "reason": f"Requested weekly rate ({f.get('weekly_rate_kg')} kg/week) exceeds evidence-based safe physiological bounds."
                },
                explanation="Rate refused because premise [weekly_rate > max_safe_cap] is TRUE."
            )
        ]

    def forward_chain(self, facts: Dict[str, Any]) -> Tuple[Dict[str, Any], List[str]]:
        """Executes forward chaining until no more rules fire (fixed point)."""
        current_facts = dict(facts)
        firing_trace: List[str] = []
        changed = True

        while changed:
            changed = False
            for rule in self.forward_rules:
                if rule.rule_id not in firing_trace and rule.check(current_facts):
                    current_facts = rule.execute(current_facts)
                    firing_trace.append(rule.rule_id)
                    changed = True

        return current_facts, firing_trace

    def backward_chain_validate(self, goal_request: Dict[str, Any]) -> Dict[str, Any]:
        """
        Traces backward through safety constraints. If any rule premise fires,
        unravels the reason and yields the nearest safe target.
        """
        for rule in self.backward_rules:
            if rule.check(goal_request):
                outcome = rule.execute(goal_request)
                return {
                    "is_safe": False,
                    "rule_fired": rule.rule_id,
                    "refusal_explanation": f"Backward Chaining Trace: {rule.explanation} -> {outcome['reason']}",
                    "nearest_safe_target": outcome.get("safe_goal") or outcome.get("safe_rate")
                }

        return {
            "is_safe": True,
            "rule_fired": None,
            "refusal_explanation": None,
            "nearest_safe_target": goal_request.get("goal")
        }

RULE_ENGINE = RuleEngine()
