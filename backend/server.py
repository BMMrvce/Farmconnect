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

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

security = HTTPBearer()

app = FastAPI(title="Farm Management System", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

@app.post("/api/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing = supabase.table("users").select("*").eq("email", user_data.email).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = hash_password(user_data.password)
    new_user = {
        "email": user_data.email,
        "password_hash": hashed_password,
        "name": user_data.name,
        "role": user_data.role
    }
    
    response = supabase.table("users").insert(new_user).execute()
    user = response.data[0]
    
    access_token = create_access_token(data={"sub": user["id"], "role": user["role"]})
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    response = supabase.table("users").select("*").eq("email", credentials.email).execute()
    if not response.data:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    user = response.data[0]
    
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
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
        subs = supabase.table("subscriptions").select("plot_id").eq("subscriber_id", current_user["id"]).execute()
        if subs.data:
            plot_ids = [s["plot_id"] for s in subs.data]
            plots = supabase.table("plots").select("farm_id").in_("id", plot_ids).execute()
            farm_ids = list(set([p["farm_id"] for p in plots.data]))
            response = supabase.table("farms").select("*").in_("id", farm_ids).execute()
        else:
            response = supabase.table("farms").select("*").limit(0).execute()
    else:
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
    farm = supabase.table("farms").select("*").eq("id", farm_id).execute()
    if not farm.data:
        raise HTTPException(status_code=404, detail="Farm not found")
    if farm.data[0]["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    supabase.table("farms").delete().eq("id", farm_id).execute()
    return {"message": "Farm deleted successfully"}

@app.post("/api/plots", response_model=PlotResponse)
async def create_plot(plot: PlotCreate, current_user: dict = Depends(require_role(["owner"]))):
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

@app.delete("/api/plots/{plot_id}")
async def delete_plot(plot_id: str, current_user: dict = Depends(require_role(["owner"]))):
    plot = supabase.table("plots").select("farm_id").eq("id", plot_id).execute()
    if not plot.data:
        raise HTTPException(status_code=404, detail="Plot not found")
    
    farm = supabase.table("farms").select("owner_id").eq("id", plot.data[0]["farm_id"]).execute()
    if not farm.data or farm.data[0]["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    supabase.table("plots").delete().eq("id", plot_id).execute()
    return {"message": "Plot deleted successfully"}

@app.post("/api/growth-cycles", response_model=GrowthCycleResponse)
async def create_growth_cycle(cycle: GrowthCycleCreate, current_user: dict = Depends(require_role(["owner"]))):
    response = supabase.table("growth_cycles").insert(cycle.model_dump()).execute()
    return response.data[0]

@app.get("/api/growth-cycles", response_model=List[GrowthCycleResponse])
async def list_growth_cycles(current_user: dict = Depends(get_current_user)):
    response = supabase.table("growth_cycles").select("*").execute()
    return response.data

@app.post("/api/plant-requirements", response_model=PlantRequirementResponse)
async def create_requirement(req: PlantRequirementCreate, current_user: dict = Depends(require_role(["owner"]))):
    response = supabase.table("plant_requirements").insert(req.model_dump()).execute()
    return response.data[0]

@app.get("/api/plant-requirements", response_model=List[PlantRequirementResponse])
async def list_requirements(current_user: dict = Depends(get_current_user)):
    response = supabase.table("plant_requirements").select("*").execute()
    return response.data

@app.post("/api/plants", response_model=PlantResponse)
async def create_plant(plant: PlantCreate, current_user: dict = Depends(require_role(["owner"]))):
    response = supabase.table("plants").insert(plant.model_dump()).execute()
    return response.data[0]

@app.get("/api/plants", response_model=List[PlantResponse])
async def list_plants(current_user: dict = Depends(get_current_user)):
    response = supabase.table("plants").select("*").execute()
    return response.data

@app.get("/api/plants/{plant_id}", response_model=PlantResponse)
async def get_plant(plant_id: str, current_user: dict = Depends(get_current_user)):
    response = supabase.table("plants").select("*").eq("id", plant_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Plant not found")
    return response.data[0]

# ==================== PLANT INSTANCES ====================

def calculate_growth_status(planted_on: date, growth_cycle_id: str):
    """Calculate current growth stage and days since planting"""
    if not growth_cycle_id:
        return None, None, None
    
    cycle_response = supabase.table("growth_cycles").select("*").eq("id", growth_cycle_id).execute()
    if not cycle_response.data:
        return None, None, None
    
    cycle = cycle_response.data[0]
    days_since = (date.today() - planted_on).days
    
    if days_since <= cycle["germination_days"]:
        stage = "germination"
    elif days_since <= cycle["germination_days"] + cycle["vegetative_days"]:
        stage = "vegetative"
    elif days_since <= cycle["germination_days"] + cycle["vegetative_days"] + cycle["flowering_days"]:
        stage = "flowering"
    else:
        stage = "fruiting"
    
    expected_harvest = planted_on + timedelta(days=cycle["total_growth_days"])
    
    return stage, days_since, expected_harvest

@app.post("/api/plant-instances", response_model=PlantInstanceResponse)
async def create_plant_instance(instance: PlantInstanceCreate, current_user: dict = Depends(require_role(["owner"]))):
    plot = supabase.table("plots").select("farm_id").eq("id", instance.plot_id).execute()
    if not plot.data:
        raise HTTPException(status_code=404, detail="Plot not found")
    
    plant = supabase.table("plants").select("*").eq("id", instance.plant_id).execute()
    if not plant.data:
        raise HTTPException(status_code=404, detail="Plant not found")
    
    growth_cycle_id = plant.data[0].get("growth_cycle_id")
    stage, days_since, expected_harvest = calculate_growth_status(instance.planted_on, growth_cycle_id)
    
    new_instance = {
        "plot_id": instance.plot_id,
        "plant_id": instance.plant_id,
        "planted_on": str(instance.planted_on),
        "count": instance.count,
        "status": "active",
        "current_growth_stage": stage,
        "days_since_planting": days_since,
        "expected_harvest_date": str(expected_harvest) if expected_harvest else None
    }
    
    response = supabase.table("plant_instances").insert(new_instance).execute()
    created_instance = response.data[0]
    
    logger.info(f"Plant instance created: {created_instance['id']}")
    
    return created_instance

@app.get("/api/plant-instances", response_model=List[PlantInstanceResponse])
async def list_plant_instances(plot_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = supabase.table("plant_instances").select("*")
    if plot_id:
        query = query.eq("plot_id", plot_id)
    response = query.execute()
    
    for instance in response.data:
        if instance.get("planted_on"):
            planted_date = datetime.strptime(instance["planted_on"], "%Y-%m-%d").date()
            plant = supabase.table("plants").select("growth_cycle_id").eq("id", instance["plant_id"]).execute()
            if plant.data and plant.data[0].get("growth_cycle_id"):
                stage, days_since, expected_harvest = calculate_growth_status(
                    planted_date, 
                    plant.data[0]["growth_cycle_id"]
                )
                instance["current_growth_stage"] = stage
                instance["days_since_planting"] = days_since
                instance["expected_harvest_date"] = str(expected_harvest) if expected_harvest else None
    
    return response.data

@app.get("/api/plant-instances/{instance_id}", response_model=PlantInstanceResponse)
async def get_plant_instance(instance_id: str, current_user: dict = Depends(get_current_user)):
    response = supabase.table("plant_instances").select("*").eq("id", instance_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Plant instance not found")
    return response.data[0]

# ==================== INVENTORY ====================

@app.post("/api/inventory", response_model=InventoryResponse)
async def create_inventory(item: InventoryCreate, current_user: dict = Depends(require_role(["owner"]))):
    response = supabase.table("inventory").insert(item.model_dump()).execute()
    return response.data[0]

@app.get("/api/inventory", response_model=List[InventoryResponse])
async def list_inventory(current_user: dict = Depends(get_current_user)):
    response = supabase.table("inventory").select("*").execute()
    return response.data

@app.put("/api/inventory/{inventory_id}")
async def update_inventory(inventory_id: str, quantity: float, reason: str, current_user: dict = Depends(require_role(["owner"]))):
    inv = supabase.table("inventory").select("*").eq("id", inventory_id).execute()
    if not inv.data:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    
    current_qty = float(inv.data[0]["quantity"])
    new_qty = current_qty + quantity
    
    if new_qty < 0:
        raise HTTPException(status_code=400, detail="Insufficient inventory")
    
    supabase.table("inventory").update({"quantity": new_qty}).eq("id", inventory_id).execute()
    
    supabase.table("inventory_transactions").insert({
        "inventory_id": inventory_id,
        "change": quantity,
        "reason": reason
    }).execute()
    
    return {"message": "Inventory updated", "new_quantity": new_qty}

@app.get("/api/inventory/low-stock", response_model=List[InventoryResponse])
async def get_low_stock(current_user: dict = Depends(require_role(["owner"]))):
    response = supabase.table("inventory").select("*").execute()
    low_stock = [item for item in response.data if item["quantity"] <= item["reorder_level"]]
    return low_stock

@app.get("/api/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    stats = {}
    
    if current_user["role"] == "owner":
        farms = supabase.table("farms").select("id", count="exact").eq("owner_id", current_user["id"]).execute()
        stats["total_farms"] = farms.count or 0
        
        plots = supabase.table("plots").select("id", count="exact").execute()
        stats["total_plots"] = plots.count or 0
        
        instances = supabase.table("plant_instances").select("id", count="exact").eq("status", "active").execute()
        stats["active_plantings"] = instances.count or 0
        
        inventory = supabase.table("inventory").select("*").execute()
        if inventory.data:
            low_stock = [i for i in inventory.data if i["quantity"] <= i["reorder_level"]]
            stats["low_stock_items"] = len(low_stock)
        else:
            stats["low_stock_items"] = 0
    
    elif current_user["role"] == "farmer":
        assignments = supabase.table("farmer_assignments").select("plot_id", count="exact").eq("farmer_id", current_user["id"]).execute()
        stats["assigned_plots"] = assignments.count or 0
        
        if assignments.data:
            plot_ids = [a["plot_id"] for a in assignments.data]
            instances = supabase.table("plant_instances").select("id").in_("plot_id", plot_ids).execute()
            if instances.data:
                instance_ids = [i["id"] for i in instances.data]
                today = str(date.today())
                tasks = supabase.table("schedules").select("id", count="exact").in_("plant_instance_id", instance_ids).eq("scheduled_for", today).eq("status", "pending").execute()
                stats["tasks_today"] = tasks.count or 0
            else:
                stats["tasks_today"] = 0
        else:
            stats["tasks_today"] = 0
    
    elif current_user["role"] == "subscriber":
        subs = supabase.table("subscriptions").select("plot_id", count="exact").eq("subscriber_id", current_user["id"]).eq("status", "active").execute()
        stats["active_subscriptions"] = subs.count or 0
    
    return stats

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "Farm Management System"}

@app.get("/api/")
async def root():
    return {"message": "Farm Management System API"}
