from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime, timedelta, date, timezone
from passlib.context import CryptContext
from jose import JWTError, jwt
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from decimal import Decimal
import logging

# Load environment variables
load_dotenv()

# Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

# Initialize Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security
security = HTTPBearer()

# FastAPI app
app = FastAPI(title="Farm Management System", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    name: Optional[str] = None
    role: str = Field(default="subscriber", pattern="^(owner|farmer|subscriber)$")

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str]
    role: str

class FarmCreate(BaseModel):
    name: str
    location: Optional[str] = None
    description: Optional[str] = None

class FarmResponse(BaseModel):
    id: str
    name: str
    owner_id: str
    location: Optional[str]
    description: Optional[str]
    created_at: str

class PlotCreate(BaseModel):
    farm_id: str
    name: str
    area_sqm: Optional[float] = None
    soil_type: Optional[str] = None

class PlotResponse(BaseModel):
    id: str
    farm_id: str
    name: str
    area_sqm: Optional[float]
    soil_type: Optional[str]
    created_at: str

class GrowthCycleCreate(BaseModel):
    germination_days: int
    vegetative_days: int
    flowering_days: int
    fruiting_days: int
    total_growth_days: int

class GrowthCycleResponse(BaseModel):
    id: str
    germination_days: int
    vegetative_days: int
    flowering_days: int
    fruiting_days: int
    total_growth_days: int

class PlantRequirementCreate(BaseModel):
    water_min_ml: Optional[float] = None
    water_max_ml: Optional[float] = None
    panchagavya_l_per_month: Optional[float] = None
    dashagavya_l_per_month: Optional[float] = None
    jeevamrutha_l_per_month: Optional[float] = None
    go_krupa_ml_weekly: Optional[float] = None
    vermicompost_ml_monthly: Optional[float] = None
    cowpat_kg_monthly: Optional[float] = None
    spray_3g_g_monthly: Optional[float] = None
    mustard_g_monthly: Optional[float] = None
    pulse_l_monthly: Optional[float] = None
    buttermilk_ml_monthly: Optional[float] = None
    bo_ml_monthly: Optional[float] = None
    faa_ml_monthly: Optional[float] = None
    em_ml_monthly: Optional[float] = None

class PlantRequirementResponse(PlantRequirementCreate):
    id: str

class PlantCreate(BaseModel):
    name: str
    scientific_name: Optional[str] = None
    requirement_id: Optional[str] = None
    growth_cycle_id: Optional[str] = None
    notes: Optional[str] = None

class PlantResponse(BaseModel):
    id: str
    name: str
    scientific_name: Optional[str]
    requirement_id: Optional[str]
    growth_cycle_id: Optional[str]
    notes: Optional[str]

class PlantInstanceCreate(BaseModel):
    plot_id: str
    plant_id: str
    planted_on: date
    count: int = 1

class PlantInstanceResponse(BaseModel):
    id: str
    plot_id: str
    plant_id: str
    planted_on: date
    count: int
    status: str
    current_growth_stage: Optional[str]
    days_since_planting: Optional[int]
    expected_harvest_date: Optional[date]

class InventoryCreate(BaseModel):
    name: str
    unit: str
    quantity: float
    reorder_level: Optional[float] = 0

class InventoryResponse(BaseModel):
    id: str
    name: str
    unit: str
    quantity: float
    reorder_level: float

class ScheduleResponse(BaseModel):
    id: str
    plant_instance_id: str
    task_type: str
    scheduled_for: date
    status: str
    quantity_required: Optional[float]
    unit: Optional[str]

class TaskCompleteRequest(BaseModel):
    notes: Optional[str] = None

class HarvestCreate(BaseModel):
    plant_instance_id: str
    harvest_date: date
    weight_kg: float
    notes: Optional[str] = None

class HarvestResponse(BaseModel):
    id: str
    plant_instance_id: str
    harvest_date: date
    weight_kg: float
    notes: Optional[str]

class SubscriptionCreate(BaseModel):
    plot_id: str

class SubscriptionResponse(BaseModel):
    id: str
    subscriber_id: str
    plot_id: str
    status: str

class FarmerAssignmentCreate(BaseModel):
    farmer_id: str
    plot_id: str

# ==================== AUTH UTILITIES ====================

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Get user from database
        response = supabase.table("users").select("*").eq("id", user_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        return response.data[0]
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def require_role(allowed_roles: List[str]):
    async def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Access denied. Required roles: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker

# ==================== AUTH ENDPOINTS ====================

@app.post("/api/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    # Check if user exists
    existing = supabase.table("users").select("*").eq("email", user_data.email).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password and create user
    hashed_password = hash_password(user_data.password)
    new_user = {
        "email": user_data.email,
        "password_hash": hashed_password,
        "name": user_data.name,
        "role": user_data.role
    }
    
    response = supabase.table("users").insert(new_user).execute()
    user = response.data[0]
    
    # Create access token
    access_token = create_access_token(data={"sub": user["id"], "role": user["role"]})
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    # Get user
    response = supabase.table("users").select("*").eq("email", credentials.email).execute()
    if not response.data:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    user = response.data[0]
    
    # Verify password
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create access token
    access_token = create_access_token(data={"sub": user["id"], "role": user["role"]})
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user.get("name"),
        role=current_user["role"]
    )

# ==================== FARM ENDPOINTS ====================

@app.post("/api/farms", response_model=FarmResponse)
async def create_farm(farm: FarmCreate, current_user: dict = Depends(require_role(["owner"]))):
    new_farm = {
        "name": farm.name,
        "owner_id": current_user["id"],
        "location": farm.location,
        "description": farm.description
    }
    response = supabase.table("farms").insert(new_farm).execute()
    return response.data[0]

@app.get("/api/farms", response_model=List[FarmResponse])
async def list_farms(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "owner":
        response = supabase.table("farms").select("*").eq("owner_id", current_user["id"]).execute()
    elif current_user["role"] == "subscriber":
        # Get farms through subscriptions
        subs = supabase.table("subscriptions").select("plot_id").eq("subscriber_id", current_user["id"]).execute()
        if subs.data:
            plot_ids = [s["plot_id"] for s in subs.data]
            plots = supabase.table("plots").select("farm_id").in_("id", plot_ids).execute()
            farm_ids = list(set([p["farm_id"] for p in plots.data]))
            response = supabase.table("farms").select("*").in_("id", farm_ids).execute()
        else:
            response = supabase.table("farms").select("*").limit(0).execute()
    else:
        # Farmer: get farms through plot assignments
        assignments = supabase.table("farmer_assignments").select("plot_id").eq("farmer_id", current_user["id"]).execute()
        if assignments.data:
            plot_ids = [a["plot_id"] for a in assignments.data]
            plots = supabase.table("plots").select("farm_id").in_("id", plot_ids).execute()
            farm_ids = list(set([p["farm_id"] for p in plots.data]))
            response = supabase.table("farms").select("*").in_("id", farm_ids).execute()
        else:
            response = supabase.table("farms").select("*").limit(0).execute()
    
    return response.data

@app.get("/api/farms/{farm_id}", response_model=FarmResponse)
async def get_farm(farm_id: str, current_user: dict = Depends(get_current_user)):
    response = supabase.table("farms").select("*").eq("id", farm_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Farm not found")
    return response.data[0]

@app.delete("/api/farms/{farm_id}")
async def delete_farm(farm_id: str, current_user: dict = Depends(require_role(["owner"]))):
    # Verify ownership
    farm = supabase.table("farms").select("*").eq("id", farm_id).execute()
    if not farm.data:
        raise HTTPException(status_code=404, detail="Farm not found")
    if farm.data[0]["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    supabase.table("farms").delete().eq("id", farm_id).execute()
    return {"message": "Farm deleted successfully"}

# ==================== PLOT ENDPOINTS ====================

@app.post("/api/plots", response_model=PlotResponse)
async def create_plot(plot: PlotCreate, current_user: dict = Depends(require_role(["owner"]))):
    # Verify farm ownership
    farm = supabase.table("farms").select("*").eq("id", plot.farm_id).execute()
    if not farm.data or farm.data[0]["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    new_plot = {
        "farm_id": plot.farm_id,
        "name": plot.name,
        "area_sqm": plot.area_sqm,
        "soil_type": plot.soil_type
    }
    response = supabase.table("plots").insert(new_plot).execute()
    return response.data[0]

@app.get("/api/plots", response_model=List[PlotResponse])
async def list_plots(farm_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = supabase.table("plots").select("*")
    if farm_id:
        query = query.eq("farm_id", farm_id)
    response = query.execute()
    return response.data

@app.get("/api/plots/{plot_id}", response_model=PlotResponse)
async def get_plot(plot_id: str, current_user: dict = Depends(get_current_user)):
    response = supabase.table("plots").select("*").eq("id", plot_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Plot not found")
    return response.data[0]

# Continue in next file due to length...
