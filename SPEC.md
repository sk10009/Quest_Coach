# Quest Coach — Complete Master Specification & Build Instructions (`SPEC.md`)

**Author:** Shubham  
**Version:** 1.2.0  
**Course Mapping:** 25AM2304 (AI & Expert Systems — Units 1 to 5)  
**Target Architecture:** Mobile-First PWA/Web App (`390×844px` frame on desktop, full-bleed on mobile) + Desktop Test Mode Drawer  
**Protocol & Persistence:** HTTP/HTTPS JSON REST API + Atomic JSON File Storage (**Zero SQLite**)

---

## 0. Required Vercel Agent Skills & Environment Setup

Before generating code, install and follow these Vercel Agent Skills in the repository root so frontend performance, mobile UI accessibility, and Vercel FastAPI deployment rules are enforced automatically:

```bash
npx skills add vercel-labs/agent-skills --skill react-best-practices
npx skills add vercel-labs/agent-skills --skill web-design-guidelines
npx skills add vercel-labs/agent-skills --skill vercel-composition-patterns
```

### Vercel Deployment & Routing Rules
- **FastAPI Entrypoint:** Define the FastAPI `app` instance at `api/index.py` or `app/main.py` (supported Vercel Python runtime entrypoints). Do **not** mount `public/` inside FastAPI.
- **Fluid Compute Timeout:** Configure `vercel.json` with `maxDuration: 60` on the Python entrypoint function so Genetic Algorithm meal optimization and Bayesian/scikit-learn updates never hit a 10s timeout.
- **Stateless Serverless Storage Warning:** Vercel functions use an ephemeral filesystem. In local dev, read/write directly to `data/knowledge_base.json` and `data/user_state.json`. When `VERCEL=1` is detected in environment variables, route the storage adapter to **Vercel Blob** (or a configurable remote HTTPS JSON endpoint via `REMOTE_JSON_STORE_URL`) so user progress persists across deployments and cold starts.

---

## 1. Core Design Rules & Hard Constraints

1. **No Chat Interface:** Users never talk to an AI agent directly. Every interaction happens through mobile-first buttons, swipeable cards, search bars, progress bars, and animated XP feedback.
2. **Zero SQLite / Zero SQL:** All persistence uses atomic JSON file read/write (`os.replace` temp-file swaps locally; HTTPS JSON blob adapter in production).
3. **No Manual Mood/Sleep/Effort Sliders:** Removed completely from the UI. The backend passively calculates `inferred_mood` and `inferred_fatigue` from macro/calorie adherence, missed quests, exercise volume/1RM load, and mindful habit streaks.
4. **No Connect-4 Mini-Game:** Explicitly removed. Unit 3 Adversarial/Targeted Search is fulfilled by the **Weakness-Targeted Boss Engine** + **Genetic Algorithm** + **Forward/Backward Chaining Rule Engine**.
5. **Medical Disclaimer:** Display `"General guidance only, not medical advice"` visibly on Profile Setup, Goal Assignment, and Profile screens.

---

## 2. Tech Stack

- **Frontend:** React + Vite + Tailwind CSS (`frontend/`), communicating strictly via JSON over `/api/v1/*`.
- **Backend:** Python 3.11+ + FastAPI + Uvicorn (`app/`), using `numpy`, `scipy`, `scikit-learn`, and clean modular Python classes for the AI subsystems.
- **Data Store (`data/`):**
  - `data/knowledge_base.json`: Foods, Exercises, and Mindful Activities with `isa` hierarchies and `region` tags.
  - `data/user_state.json`: User profile, custom meals, daily logs, level/cycle progress, token ledger, and live AI model state.

---

## 3. AI Modules & Syllabus Mapping (Course 25AM2304)

### 3.1 Target Calculator (Deterministic Supporting Module)
- Computes `BMI = weight_kg / (height_m ** 2)`, BMR (Mifflin-St Jeor), and TDEE (scaled by `beginner` / `intermediate` / `pro` experience).
- **Hard Safety Locks:**
  - `age < 18`: Strictly prohibited from weight-loss plans.
  - `BMI < 18.5` (Underweight): Locked to `gain`.
  - `BMI >= 25.0` (Overweight/Obese): Locked to `lose`.
  - `18.5 <= BMI < 25.0` (Normal): User chooses `gain`, `lose`, or `maintain`.
- Outputs daily targets: `calories`, `protein_g`, `carbs_g`, `fat_g`, `fibre_g`.

### 3.2 Knowledge Base (`data/knowledge_base.json`) — Units 3 & 4
- **Declarative Knowledge & First-Order Predicate Logic (`isa` hierarchies):**
  - Every record includes an `isa_hierarchy` list (e.g., `["paneer", "dairy", "protein_food", "food"]` or `["squat", "leg_workout", "weightlifting", "exercise"]`) driving category filters and inference.
- **Food Catalogue (Seed 100+ items on first boot, expandable to 300):**
  - Mix of everyday Indian foods (*roti, rice, dal, sabzi, paneer, curd, idli, dosa, poha, upma, sambar, chole, rajma, eggs, chicken*) and gym staples (*whey protein, oats, bananas, peanut butter, chicken breast, egg whites, Greek yogurt, soya chunks, sweet potato, milk*).
  - **Fields:** `id`, `name`, `standard_portion_g`, `calories`, `protein_g`, `carbs_g`, `fat_g`, `fibre_g`, `isa_hierarchy`, `region` (`North Indian`, `South Indian`, `Pan-Indian`, `Gym Staple`), `preparation_state` (`raw`, `cooked`, `ready_to_eat`), `is_verified` (`bool`).
- **Exercise Catalogue:**
  - **Fields:** `id`, `name`, `category` (`weightlifting`, `steps`, `calisthenics`), `intensity`, `met_value`, `difficulty_tier`, `required_equipment`, `isa_hierarchy`.
  - **Calorie Burn Formula:** `MET * body_weight_kg * (duration_minutes / 60.0)`.
- **Mindful Catalogue:**
  - **Fields:** `id`, `name`, `type` (`meditation`, `breathing`, `journaling`, `stretching`), `default_duration_min`, `isa_hierarchy`.

### 3.3 Forward & Backward Chaining Rule Engine — Units 3 & 5
- **Forward Chaining:**
  - Enforces weekly weight-change caps (`gain`: `0.25–0.5 kg/week`; `loss`: `0.5–1.0 kg/week`).
  - Enforces calorie floors (`>= 1500 kcal` male, `>= 1200 kcal` female) and gradual protein/fibre ramp-up across levels to prevent digestive discomfort.
  - Evaluates daily requirement completion and `N = 4` of `M = 5` cycle progression.
- **Backward Chaining:**
  - Fires when a user requests an unsafe/aggressive rate or forbidden goal (e.g., under-18 weight loss).
  - Traces backward through violated rule premises, returns a clear human-readable refusal explanation, and proposes the nearest safe target.

### 3.4 Passive Latent State Estimator & Bayesian Player Model — Unit 4
- **Passive State Inference (No Sliders):**
  - `inferred_mood` (`0.0–1.0`): Calculated dynamically from calorie/macro adherence (e.g., severe carb/calorie deficit or missed protein lowers mood), missed daily quests/streaks, and recent mindful completions.
  - `inferred_fatigue` (`0.0–1.0`): Calculated from cumulative weightlifting 1RM volume, exercise MET-minutes, consecutive active days without a rest-day pass, and caloric deficit severity.
- **Bayesian Network:** Computes posterior `streak_break_risk` conditioned on `inferred_mood`, `inferred_fatigue`, and historical completion consistency, and identifies the user's weakest habit pillar (`mindful`, `exercise`, or `nutrition`).

### 3.5 Supervised Readiness Predictor — Unit 1 (& Unit 4 Non-Monotonic Reasoning)
- Trains/runs a `scikit-learn` Logistic Regression / Decision Tree classifier on behavioral trajectory features (`consecutive_unexcused_misses`, `inferred_fatigue`, `recent_adherence_rate`) to predict drop-off risk.
- **Rest-Day Exemption:** Days marked `planned_rest` (via a 3-token Rest-Day Pass) incur **zero** drop-off penalty.
- **Non-Monotonic Override:** After `3+` consecutive unexcused missed days, triggers a level-down or temporary `Re-Entry` override.

### 3.6 Fuzzy Difficulty Controller — Unit 5
- Crisp inputs: `inferred_fatigue`, `inferred_mood`, `streak_break_risk`.
- Fuzzy membership sets (`Low`, `Medium`, `High`) defuzzified into 4 difficulty regimes scaling daily quest targets:
  - `re_entry` (`0.65x` targets)
  - `easy` (`0.80x` targets)
  - `steady` (`1.00x` targets)
  - `push` (`1.15x` targets)

### 3.7 Genetic Algorithm Quest & Meal Generator — Unit 3
- Evolves candidate meal additions and daily quest combinations to minimize Euclidean distance to remaining daily macro targets while matching user `region` preference and available gym equipment.
- Powers the **"Pro Tip"** on the Meal Overview screen: *"Pro tip: Adding [portion] of [recommended food] will help close your remaining [macro] goal."*

### 3.8 Utility-Based Agent (Dynamic Meal Rating & Daily Offer) — Unit 1
- Orchestrates daily quest offers and computes **Dynamic Meal Ratings (`0–100`)**:
  - Dynamically weights `calories`, `protein_g`, `carbs_g`, `fat_g`, and `fibre_g` using the user's profile attributes (`BMI`, `goal`, `age`, `gender`) and live remaining daily macro deficits (never a static hardcoded formula).

### 3.9 Weakness-Targeted Boss Engine & Strength Tracker — Unit 3
- **Boss Engine:** On Day 5 (`M = 5`) of every cycle, replaces standard quests with a single Boss Level weighted toward the user's weakest habit pillar from the Player Model, bounded strictly by safety caps.
- **Strength Tracker (Weightlifting Only):** Computes Epley estimated `1RM = weight * (1 + reps / 30)` per logged set and tracks progressive overload against the user's personal historical maxes.

---

## 4. Progression, 5-Day Cycle (`N=4, M=5`) & Two-Tier Token Economy

- **5-Day Cycle:**
  - **Days 1–4:** Complete all 3 daily requirements on at least `N = 4` days to unlock the Boss Level.
  - **Day 5 (`M`-th day):** Boss Level. Beating the Boss increments the user's **Rank** and awards **5 tokens**. Failing repeats the level safely.
  - **Unlock Cooldown:** Next level unlocks the following calendar day (bypassed instantly when Desktop Test Mode is active).
- **Two-Tier Token Spending (Daily Cap: max `2–3` token actions per day):**
  - **Earning:** `+1 token` per completed normal day; `+5 tokens` per Boss victory.
  - **Tier 1 — Single-Task Skip (`1 token`):** Clears one specific daily requirement (e.g., Mindful or Exercise) so the user can preserve `N-of-M` progress while completing the other tasks.
  - **Tier 2 — Full Rest-Day Pass (`3 tokens`):** Skips the entire day without breaking the streak, pauses the level timer by 1 day, and logs `planned_rest` in `user_state.json`.

---

## 5. Frontend Screens (`390×844px` Mobile-First Viewport)

1. **Loading Screen:** Initializes backend agents, loads `knowledge_base.json` and `user_state.json`, routes first-time users to Profile Setup.
2. **Profile Setup (First Launch):** Inputs for `age`, `weight_kg`, `height_cm`, `gender`, `gym_experience`, and `preferred_region`. Shows calculated BMI, assigned/chosen goal, backward-chaining refusal explanation if triggered, and medical disclaimer.
3. **Level Pathway:** Scrollable vertical path of level nodes (finished levels locked, every 5th node marked as a Boss Level). Top bar shows Rank, Token balance, Profile button, and Desktop Test Drawer button.
4. **Level Screen:** Displays the 3 Fuzzy-adjusted daily quests, animated completion bars, Token Skip (`1 token`) / Full Rest-Day (`3 tokens`) actions, and 3 bottom log buttons (`Exercise`, `Mindful`, `Macros`). Includes animated XP pop-out particles on task completion.
5. **Exercise Logging (3 Swipeable Cards, Setup Remembered):**
   - *Weightlifting:* Select gym machines, log weight & reps (`1RM` tracked).
   - *Steps:* Set/log daily step count.
   - *Calisthenics:* Auto-picked by `gym_experience` tier with easier/harder toggle.
6. **Macro Logging & Custom Meal Builder:**
   - Scrollable food list with substring search bar + `isa` category & `region` filters.
   - **"Other Foods" Custom Builder:** Fuzzy/token ingredient search, gram/unit entry (including oil/ghee), `"makes N servings"` divider, raw/cooked labels, manual entry with `"unverified"` flag when no match exists, and saving back into `knowledge_base.json`.
7. **Meal Overview:** Displays **(1) Missing macros/nutrients FIRST**, **(2) Dynamic Utility-Agent Rating (`0–100`)**, **(3) Region badge**, **(4) User improvement notes**, and **(5) Agent "Pro Tip"** food swap recommendation.
8. **Mindful Logging:** Searchable list with `isa` category filters and duration logging.
9. **Boss Level Screen:** Replaces Level Screen on Day 5 with the weakness-targeted challenge.
10. **Profile Screen:** Shows Rank, Boss wins, Agent-detected Strengths & Weaknesses, passively inferred Mood & Fatigue status, Token balance, Rest-Day history, and medical disclaimer.

---

## 6. REST API Contract (`/api/v1`)

- `POST /api/v1/profile/setup` — Create profile, run Target Calculator + Rule Engine validation.
- `GET /api/v1/profile` — Return profile, Rank, strengths/weaknesses, inferred mood/fatigue, and tokens.
- `GET /api/v1/pathway` — Return level nodes, lock states, and current `N-of-M` cycle progress.
- `GET /api/v1/level/today` — Run Fuzzy Controller + Utility Agent and return today's 3 quests (or Day 5 Boss challenge).
- `POST /api/v1/log/exercise` — Log weightlifting/steps/calisthenics, update `1RM` & fatigue, return XP delta.
- `POST /api/v1/log/food` — Log catalogue/custom food portion, update macro totals & inferred mood, return XP delta.
- `POST /api/v1/log/custom-meal` — Create multi-ingredient meal (`makes N servings`), append to `knowledge_base.json`.
- `POST /api/v1/log/mindful` — Log mindful minutes, update mood/fatigue, return XP delta.
- `GET /api/v1/meal/{food_id}/overview` — Return missing macros first, dynamic Utility Rating, region, notes, and GA Pro Tip.
- `POST /api/v1/tokens/skip-task` — Spend `1 token` to clear one daily requirement (enforces daily cap).
- `POST /api/v1/tokens/rest-day` — Spend `3 tokens` to log `planned_rest` and pause timer.
- `POST /api/v1/test/advance-day` — *(Test Mode)* Advance simulated clock by 1 day.
- `POST /api/v1/test/simulate-missed-day` — *(Test Mode)* Simulate unexcused missed day and trigger Readiness Predictor.
- `GET /api/v1/test/agent-telemetry` — *(Test Mode)* Return raw Bayesian probabilities, Fuzzy outputs, Rule traces, and full JSON state.

---

## 7. Phased Build Plan (Execute in Order)

- **Phase 1:** Scaffold `frontend/` (Vite + React + Tailwind) and `app/` (FastAPI), implement atomic JSON persistence (`data/knowledge_base.json` & `data/user_state.json` + Vercel Blob adapter), seed 100+ Indian/gym foods, exercises, and mindful activities, and build Target Calculator + Profile Setup UI.
- **Phase 2:** Build Level Pathway, Level Screen with XP pop animations, 3-way Swipeable Exercise Logger, Searchable Food/Mindful Loggers, and Custom Meal Builder.
- **Phase 3:** Implement Forward/Backward Rule Engine, Meal Overview screen (missing macros first + Dynamic Utility Rating + Genetic Algorithm Pro Tip).
- **Phase 4:** Implement Passive Latent State Estimator (mood & fatigue), Bayesian Network Player Model, Supervised Readiness Predictor, and Fuzzy Difficulty Controller.
- **Phase 5:** Implement 5-Day Cycle (`N=4, M=5`), Weakness-Targeted Boss Engine, Two-Tier Token Skip / Rest-Day System, and Rank progression.
- **Phase 6:** Build Desktop Test Mode Drawer (instant level unlock, advance day, simulate missed day, live AI telemetry & JSON inspector), `vercel.json` deployment config, and evaluation simulation script.
