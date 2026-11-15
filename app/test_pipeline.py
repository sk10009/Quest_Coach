"""
End-to-end integration test verifying all Phase 1 & Phase 2 routes:
- Profile setup (TargetCalculator, Mifflin-St Jeor, safety locks)
- Profile read & passive state inference
- Pathway progression
- Daily level & 3-pillar quests
- 3-Way Exercise logging & 1RM Epley calculation
- Macro Food logging & Custom Meal builder saving to knowledge_base.json
- Mindful Activity logging
- Token single-task skip & 3-token full rest-day pass
"""
from fastapi.testclient import TestClient
from app.main import app
from app.storage import KB_STORE, USER_STORE

client = TestClient(app)

def test_full_pipeline():
    print("1. Testing GET / (root)...")
    r0 = client.get("/")
    assert r0.status_code == 200
    assert r0.json()["disclaimer"] == "General guidance only, not medical advice"

    print("2. Testing POST /api/v1/profile/setup (Normal Weight Adult)...")
    setup_payload = {
        "age": 22,
        "weight_kg": 70.0,
        "height_cm": 175.0,
        "gender": "male",
        "gym_experience": "intermediate",
        "preferred_region": "North Indian",
        "requested_goal": "maintain"
    }
    r1 = client.post("/api/v1/profile/setup", json=setup_payload)
    assert r1.status_code == 200, r1.text
    prof = r1.json()["profile"]
    assert prof["bmi"] == 22.86
    assert prof["goal"] == "maintain"
    assert prof["daily_targets"]["calories"] > 1800
    assert "General guidance only, not medical advice" in r1.json()["disclaimer"]

    print("3. Testing Safety Locks (Under-18 with 'lose' request)...")
    under18_payload = {
        "age": 16,
        "weight_kg": 65.0,
        "height_cm": 170.0,
        "gender": "male",
        "gym_experience": "beginner",
        "preferred_region": "Pan-Indian",
        "requested_goal": "lose"
    }
    r_safe = client.post("/api/v1/profile/setup", json=under18_payload)
    assert r_safe.status_code == 200
    p_safe = r_safe.json()["profile"]
    assert p_safe["goal"] == "maintain" # Backward chaining locked
    assert "Backward Chaining Trace" in p_safe["refusal_explanation"]

    # Re-setup valid adult profile
    client.post("/api/v1/profile/setup", json=setup_payload)

    print("4. Testing GET /api/v1/profile...")
    r2 = client.get("/api/v1/profile")
    assert r2.status_code == 200
    p_data = r2.json()
    assert p_data["rank"] == 1
    assert p_data["tokens"] == 5
    assert 0.0 <= p_data["inferred_mood"] <= 1.0
    assert 0.0 <= p_data["inferred_fatigue"] <= 1.0

    print("5. Testing GET /api/v1/catalogue (Foods, Exercises, Mindful)...")
    r_cat = client.get("/api/v1/catalogue")
    assert r_cat.status_code == 200
    cat = r_cat.json()
    assert len(cat["foods"]) >= 100
    assert len(cat["exercises"]) >= 25
    assert len(cat["mindful"]) >= 10

    print("6. Testing GET /api/v1/pathway...")
    r_path = client.get("/api/v1/pathway")
    assert r_path.status_code == 200
    path = r_path.json()
    assert len(path["nodes"]) == 15
    assert path["nodes"][4]["is_boss"] is True

    print("7. Testing GET /api/v1/level/today...")
    r_lvl = client.get("/api/v1/level/today")
    assert r_lvl.status_code == 200
    lvl = r_lvl.json()
    assert len(lvl["quests"]) == 3

    print("8. Testing POST /api/v1/log/exercise (Weightlifting + 1RM calculation)...")
    ex_payload = {
        "category": "weightlifting",
        "exercise_id": "ex_bench_press",
        "exercise_name": "Barbell Flat Bench Press",
        "duration_min": 35.0,
        "weight_kg": 80.0,
        "reps": 8,
        "sets": 3
    }
    r_ex = client.post("/api/v1/log/exercise", json=ex_payload)
    assert r_ex.status_code == 200
    # Epley: 80 * (1 + 8/30) = 80 * 1.2667 = 101.3
    assert r_ex.json()["epley_1rm"] == 101.3
    assert r_ex.json()["exercise_completed"] is True
    assert r_ex.json()["xp_delta"] == 50

    print("9. Testing POST /api/v1/log/food (Paneer)...")
    food_payload = {
        "food_id": "food_paneer_raw",
        "portion_g": 150.0
    }
    r_food = client.post("/api/v1/log/food", json=food_payload)
    assert r_food.status_code == 200
    assert r_food.json()["logged_item"]["calories"] > 0

    print("10. Testing POST /api/v1/log/custom-meal (saving to KB)...")
    custom_payload = {
        "name": "High Protein Moong Paneer Bowl",
        "region": "North Indian",
        "preparation_state": "cooked",
        "servings_count": 2,
        "oil_ghee_g": 10.0,
        "ingredients": [
            {
                "name": "Fresh Paneer",
                "portion_g": 100.0,
                "calories": 265.0,
                "protein_g": 18.3,
                "carbs_g": 3.4,
                "fat_g": 20.8,
                "fibre_g": 0.0,
                "is_verified": True
            },
            {
                "name": "Moong Sprouts",
                "portion_g": 100.0,
                "calories": 105.0,
                "protein_g": 7.0,
                "carbs_g": 19.0,
                "fat_g": 0.4,
                "fibre_g": 5.0,
                "is_verified": True
            }
        ]
    }
    r_custom = client.post("/api/v1/log/custom-meal", json=custom_payload)
    assert r_custom.status_code == 200
    custom_food = r_custom.json()["custom_food"]
    assert custom_food["is_verified"] is False
    assert "custom_" in custom_food["id"]

    # Verify that the custom food was appended into KB store
    kb_data = KB_STORE.read()
    assert any(f["id"] == custom_food["id"] for f in kb_data["foods"])

    print("11. Testing POST /api/v1/log/mindful...")
    mind_payload = {
        "activity_id": "mind_breath_box",
        "duration_min": 10
    }
    r_mind = client.post("/api/v1/log/mindful", json=mind_payload)
    assert r_mind.status_code == 200
    assert r_mind.json()["mindful_completed"] is True

    print("12. Testing Token Skip Task (1 token)...")
    r_skip = client.post("/api/v1/tokens/skip-task", json={"task_pillar": "nutrition"})
    assert r_skip.status_code == 200
    assert r_skip.json()["remaining_tokens"] == 4

    print("13. Testing Rest-Day Pass (3 tokens)...")
    r_rest = client.post("/api/v1/tokens/rest-day")
    assert r_rest.status_code == 200
    assert r_rest.json()["remaining_tokens"] == 1

    print("\nAll Phase 1 & Phase 2 Integration Tests PASSED!")

if __name__ == "__main__":
    test_full_pipeline()
