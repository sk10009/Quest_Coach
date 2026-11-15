"""
Pydantic Schemas for Quest Coach REST API
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ProfileSetupRequest(BaseModel):
    age: int = Field(..., ge=10, le=100)
    weight_kg: float = Field(..., ge=30.0, le=250.0)
    height_cm: float = Field(..., ge=100.0, le=240.0)
    gender: str = Field(..., pattern="^(male|female|other)$")
    gym_experience: str = Field(..., pattern="^(beginner|intermediate|pro)$")
    preferred_region: str = Field("Pan-Indian", pattern="^(North Indian|South Indian|Pan-Indian|Gym Staple)$")
    requested_goal: Optional[str] = Field(None, pattern="^(gain|lose|maintain)$")

class ExerciseLogRequest(BaseModel):
    category: str = Field(..., pattern="^(weightlifting|steps|calisthenics)$")
    exercise_id: str
    exercise_name: str
    duration_min: float = Field(..., gt=0)
    # Weightlifting details
    weight_kg: Optional[float] = None
    reps: Optional[int] = None
    sets: Optional[int] = None
    # Steps details
    steps_count: Optional[int] = None
    # Calisthenics details
    calisthenics_reps: Optional[int] = None

class FoodLogRequest(BaseModel):
    food_id: str
    portion_g: float = Field(..., gt=0)

class CustomIngredientItem(BaseModel):
    name: str
    portion_g: float = Field(..., gt=0)
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    fibre_g: float
    is_verified: bool = True

class CustomMealRequest(BaseModel):
    name: str
    region: str = "Pan-Indian"
    preparation_state: str = "cooked"
    servings_count: int = Field(1, ge=1)
    oil_ghee_g: float = Field(0.0, ge=0.0)
    ingredients: List[CustomIngredientItem]

class MindfulLogRequest(BaseModel):
    activity_id: str
    duration_min: int = Field(..., ge=1)

class TokenSkipRequest(BaseModel):
    task_pillar: str = Field(..., pattern="^(exercise|mindful|nutrition)$")
