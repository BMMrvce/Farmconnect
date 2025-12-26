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

@app.delete(\"/api/plots/{plot_id}\")\nasync def delete_plot(plot_id: str, current_user: dict = Depends(require_role([\"owner\"]))):\n    plot = supabase.table(\"plots\").select(\"farm_id\").eq(\"id\", plot_id).execute()\n    if not plot.data:\n        raise HTTPException(status_code=404, detail=\"Plot not found\")\n    \n    farm = supabase.table(\"farms\").select(\"owner_id\").eq(\"id\", plot.data[0][\"farm_id\"]).execute()\n    if not farm.data or farm.data[0][\"owner_id\"] != current_user[\"id\"]:\n        raise HTTPException(status_code=403, detail=\"Not authorized\")\n    \n    supabase.table(\"plots\").delete().eq(\"id\", plot_id).execute()\n    return {\"message\": \"Plot deleted successfully\"}\n\n# ==================== GROWTH CYCLE ENDPOINTS ====================\n\n@app.post(\"/api/growth-cycles\", response_model=GrowthCycleResponse)\nasync def create_growth_cycle(cycle: GrowthCycleCreate, current_user: dict = Depends(require_role([\"owner\"]))):\n    response = supabase.table(\"growth_cycles\").insert(cycle.model_dump()).execute()\n    return response.data[0]\n\n@app.get(\"/api/growth-cycles\", response_model=List[GrowthCycleResponse])\nasync def list_growth_cycles(current_user: dict = Depends(get_current_user)):\n    response = supabase.table(\"growth_cycles\").select(\"*\").execute()\n    return response.data\n\n# ==================== PLANT REQUIREMENT ENDPOINTS ====================\n\n@app.post(\"/api/plant-requirements\", response_model=PlantRequirementResponse)\nasync def create_requirement(req: PlantRequirementCreate, current_user: dict = Depends(require_role([\"owner\"]))):\n    response = supabase.table(\"plant_requirements\").insert(req.model_dump()).execute()\n    return response.data[0]\n\n@app.get(\"/api/plant-requirements\", response_model=List[PlantRequirementResponse])\nasync def list_requirements(current_user: dict = Depends(get_current_user)):\n    response = supabase.table(\"plant_requirements\").select(\"*\").execute()\n    return response.data\n\n# ==================== PLANT ENDPOINTS ====================\n\n@app.post(\"/api/plants\", response_model=PlantResponse)\nasync def create_plant(plant: PlantCreate, current_user: dict = Depends(require_role([\"owner\"]))):\n    response = supabase.table(\"plants\").insert(plant.model_dump()).execute()\n    return response.data[0]\n\n@app.get(\"/api/plants\", response_model=List[PlantResponse])\nasync def list_plants(current_user: dict = Depends(get_current_user)):\n    response = supabase.table(\"plants\").select(\"*\").execute()\n    return response.data\n\n@app.get(\"/api/plants/{plant_id}\", response_model=PlantResponse)\nasync def get_plant(plant_id: str, current_user: dict = Depends(get_current_user)):\n    response = supabase.table(\"plants\").select(\"*\").eq(\"id\", plant_id).execute()\n    if not response.data:\n        raise HTTPException(status_code=404, detail=\"Plant not found\")\n    return response.data[0]\n\n# ==================== PLANT INSTANCE ENDPOINTS ====================\n\ndef calculate_growth_status(planted_on: date, growth_cycle_id: str):\n    \"\"\"Calculate current growth stage and days since planting\"\"\"\n    if not growth_cycle_id:\n        return None, None, None\n    \n    # Get growth cycle\n    cycle_response = supabase.table(\"growth_cycles\").select(\"*\").eq(\"id\", growth_cycle_id).execute()\n    if not cycle_response.data:\n        return None, None, None\n    \n    cycle = cycle_response.data[0]\n    days_since = (date.today() - planted_on).days\n    \n    # Determine stage\n    if days_since <= cycle[\"germination_days\"]:\n        stage = \"germination\"\n    elif days_since <= cycle[\"germination_days\"] + cycle[\"vegetative_days\"]:\n        stage = \"vegetative\"\n    elif days_since <= cycle[\"germination_days\"] + cycle[\"vegetative_days\"] + cycle[\"flowering_days\"]:\n        stage = \"flowering\"\n    else:\n        stage = \"fruiting\"\n    \n    expected_harvest = planted_on + timedelta(days=cycle[\"total_growth_days\"])\n    \n    return stage, days_since, expected_harvest\n\n@app.post(\"/api/plant-instances\", response_model=PlantInstanceResponse)\nasync def create_plant_instance(instance: PlantInstanceCreate, current_user: dict = Depends(require_role([\"owner\"]))):\n    # Verify plot access\n    plot = supabase.table(\"plots\").select(\"farm_id\").eq(\"id\", instance.plot_id).execute()\n    if not plot.data:\n        raise HTTPException(status_code=404, detail=\"Plot not found\")\n    \n    # Get plant and calculate growth status\n    plant = supabase.table(\"plants\").select(\"*\").eq(\"id\", instance.plant_id).execute()\n    if not plant.data:\n        raise HTTPException(status_code=404, detail=\"Plant not found\")\n    \n    growth_cycle_id = plant.data[0].get(\"growth_cycle_id\")\n    stage, days_since, expected_harvest = calculate_growth_status(instance.planted_on, growth_cycle_id)\n    \n    new_instance = {\n        \"plot_id\": instance.plot_id,\n        \"plant_id\": instance.plant_id,\n        \"planted_on\": str(instance.planted_on),\n        \"count\": instance.count,\n        \"status\": \"active\",\n        \"current_growth_stage\": stage,\n        \"days_since_planting\": days_since,\n        \"expected_harvest_date\": str(expected_harvest) if expected_harvest else None\n    }\n    \n    response = supabase.table(\"plant_instances\").insert(new_instance).execute()\n    created_instance = response.data[0]\n    \n    # Auto-generate schedules if plant has requirements\n    if plant.data[0].get(\"requirement_id\"):\n        await generate_schedules_for_instance(created_instance[\"id\"])\n    \n    return created_instance\n\nasync def generate_schedules_for_instance(instance_id: str):\n    \"\"\"Generate automated schedules for a plant instance\"\"\"\n    try:\n        # Get instance and plant details\n        instance = supabase.table(\"plant_instances\").select(\"*\").eq(\"id\", instance_id).execute()\n        if not instance.data:\n            return\n        \n        instance_data = instance.data[0]\n        plant_id = instance_data[\"plant_id\"]\n        planted_on = datetime.strptime(instance_data[\"planted_on\"], \"%Y-%m-%d\").date()\n        \n        # Get plant and requirements\n        plant = supabase.table(\"plants\").select(\"*\").eq(\"id\", plant_id).execute()\n        if not plant.data or not plant.data[0].get(\"requirement_id\"):\n            return\n        \n        requirements = supabase.table(\"plant_requirements\").select(\"*\").eq(\"id\", plant.data[0][\"requirement_id\"]).execute()\n        if not requirements.data:\n            return\n        \n        req = requirements.data[0]\n        schedules = []\n        \n        # Generate daily water tasks for 30 days\n        if req.get(\"water_min_ml\"):\n            for i in range(30):\n                schedules.append({\n                    \"plant_instance_id\": instance_id,\n                    \"task_type\": \"water\",\n                    \"scheduled_for\": str(planted_on + timedelta(days=i)),\n                    \"status\": \"pending\",\n                    \"quantity_required\": req[\"water_min_ml\"],\n                    \"unit\": \"ml\"\n                })\n        \n        # Generate weekly tasks\n        if req.get(\"go_krupa_ml_weekly\"):\n            for i in range(0, 30, 7):\n                schedules.append({\n                    \"plant_instance_id\": instance_id,\n                    \"task_type\": \"fertilizer\",\n                    \"scheduled_for\": str(planted_on + timedelta(days=i)),\n                    \"status\": \"pending\",\n                    \"quantity_required\": req[\"go_krupa_ml_weekly\"],\n                    \"unit\": \"ml\"\n                })\n        \n        # Generate monthly tasks\n        if req.get(\"panchagavya_l_per_month\"):\n            schedules.append({\n                \"plant_instance_id\": instance_id,\n                \"task_type\": \"spray\",\n                \"scheduled_for\": str(planted_on + timedelta(days=30)),\n                \"status\": \"pending\",\n                \"quantity_required\": req[\"panchagavya_l_per_month\"],\n                \"unit\": \"l\"\n            })\n        \n        if schedules:\n            supabase.table(\"schedules\").insert(schedules).execute()\n    except Exception as e:\n        logger.error(f\"Error generating schedules: {str(e)}\")\n\n@app.get(\"/api/plant-instances\", response_model=List[PlantInstanceResponse])\nasync def list_plant_instances(plot_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):\n    query = supabase.table(\"plant_instances\").select(\"*\")\n    if plot_id:\n        query = query.eq(\"plot_id\", plot_id)\n    response = query.execute()\n    \n    # Update growth status for each instance\n    for instance in response.data:\n        if instance.get(\"planted_on\"):\n            planted_date = datetime.strptime(instance[\"planted_on\"], \"%Y-%m-%d\").date()\n            plant = supabase.table(\"plants\").select(\"growth_cycle_id\").eq(\"id\", instance[\"plant_id\"]).execute()\n            if plant.data and plant.data[0].get(\"growth_cycle_id\"):\n                stage, days_since, expected_harvest = calculate_growth_status(\n                    planted_date, \n                    plant.data[0][\"growth_cycle_id\"]\n                )\n                instance[\"current_growth_stage\"] = stage\n                instance[\"days_since_planting\"] = days_since\n                instance[\"expected_harvest_date\"] = str(expected_harvest) if expected_harvest else None\n    \n    return response.data\n\n@app.get(\"/api/plant-instances/{instance_id}\", response_model=PlantInstanceResponse)\nasync def get_plant_instance(instance_id: str, current_user: dict = Depends(get_current_user)):\n    response = supabase.table(\"plant_instances\").select(\"*\").eq(\"id\", instance_id).execute()\n    if not response.data:\n        raise HTTPException(status_code=404, detail=\"Plant instance not found\")\n    return response.data[0]\n\n# ==================== INVENTORY ENDPOINTS ====================\n\n@app.post(\"/api/inventory\", response_model=InventoryResponse)\nasync def create_inventory(item: InventoryCreate, current_user: dict = Depends(require_role([\"owner\"]))):\n    response = supabase.table(\"inventory\").insert(item.model_dump()).execute()\n    return response.data[0]\n\n@app.get(\"/api/inventory\", response_model=List[InventoryResponse])\nasync def list_inventory(current_user: dict = Depends(get_current_user)):\n    response = supabase.table(\"inventory\").select(\"*\").execute()\n    return response.data\n\n@app.put(\"/api/inventory/{inventory_id}\")\nasync def update_inventory(inventory_id: str, quantity: float, reason: str, current_user: dict = Depends(require_role([\"owner\"]))):\n    # Get current inventory\n    inv = supabase.table(\"inventory\").select(\"*\").eq(\"id\", inventory_id).execute()\n    if not inv.data:\n        raise HTTPException(status_code=404, detail=\"Inventory item not found\")\n    \n    current_qty = float(inv.data[0][\"quantity\"])\n    new_qty = current_qty + quantity\n    \n    if new_qty < 0:\n        raise HTTPException(status_code=400, detail=\"Insufficient inventory\")\n    \n    # Update inventory\n    supabase.table(\"inventory\").update({\"quantity\": new_qty}).eq(\"id\", inventory_id).execute()\n    \n    # Log transaction\n    supabase.table(\"inventory_transactions\").insert({\n        \"inventory_id\": inventory_id,\n        \"change\": quantity,\n        \"reason\": reason\n    }).execute()\n    \n    return {\"message\": \"Inventory updated\", \"new_quantity\": new_qty}\n\n@app.get(\"/api/inventory/low-stock\", response_model=List[InventoryResponse])\nasync def get_low_stock(current_user: dict = Depends(require_role([\"owner\"]))):\n    response = supabase.table(\"inventory\").select(\"*\").execute()\n    low_stock = [item for item in response.data if item[\"quantity\"] <= item[\"reorder_level\"]]\n    return low_stock\n\n# ==================== SCHEDULE/TASK ENDPOINTS ====================\n\n@app.get(\"/api/schedules\", response_model=List[ScheduleResponse])\nasync def list_schedules(\n    plot_id: Optional[str] = None,\n    status: Optional[str] = None,\n    current_user: dict = Depends(get_current_user)\n):\n    if current_user[\"role\"] == \"farmer\":\n        # Get schedules for assigned plots\n        assignments = supabase.table(\"farmer_assignments\").select(\"plot_id\").eq(\"farmer_id\", current_user[\"id\"]).execute()\n        if not assignments.data:\n            return []\n        \n        plot_ids = [a[\"plot_id\"] for a in assignments.data]\n        instances = supabase.table(\"plant_instances\").select(\"id\").in_(\"plot_id\", plot_ids).execute()\n        if not instances.data:\n            return []\n        \n        instance_ids = [i[\"id\"] for i in instances.data]\n        query = supabase.table(\"schedules\").select(\"*\").in_(\"plant_instance_id\", instance_ids)\n    else:\n        query = supabase.table(\"schedules\").select(\"*\")\n        if plot_id:\n            instances = supabase.table(\"plant_instances\").select(\"id\").eq(\"plot_id\", plot_id).execute()\n            if instances.data:\n                instance_ids = [i[\"id\"] for i in instances.data]\n                query = query.in_(\"plant_instance_id\", instance_ids)\n    \n    if status:\n        query = query.eq(\"status\", status)\n    \n    response = query.execute()\n    return response.data\n\n@app.get(\"/api/schedules/today\", response_model=List[ScheduleResponse])\nasync def get_today_tasks(current_user: dict = Depends(require_role([\"farmer\"]))):\n    # Get farmer's assigned plots\n    assignments = supabase.table(\"farmer_assignments\").select(\"plot_id\").eq(\"farmer_id\", current_user[\"id\"]).execute()\n    if not assignments.data:\n        return []\n    \n    plot_ids = [a[\"plot_id\"] for a in assignments.data]\n    instances = supabase.table(\"plant_instances\").select(\"id\").in_(\"plot_id\", plot_ids).execute()\n    if not instances.data:\n        return []\n    \n    instance_ids = [i[\"id\"] for i in instances.data]\n    today = str(date.today())\n    \n    response = supabase.table(\"schedules\").select(\"*\").in_(\"plant_instance_id\", instance_ids).eq(\"scheduled_for\", today).eq(\"status\", \"pending\").execute()\n    return response.data\n\n@app.post(\"/api/schedules/{schedule_id}/complete\")\nasync def complete_task(schedule_id: str, task_data: TaskCompleteRequest, current_user: dict = Depends(require_role([\"farmer\"]))):\n    # Get schedule\n    schedule = supabase.table(\"schedules\").select(\"*\").eq(\"id\", schedule_id).execute()\n    if not schedule.data:\n        raise HTTPException(status_code=404, detail=\"Schedule not found\")\n    \n    schedule_data = schedule.data[0]\n    \n    # CRITICAL: Auto-deduct inventory (atomic transaction)\n    if schedule_data.get(\"quantity_required\") and schedule_data.get(\"unit\"):\n        # Find matching inventory item\n        inv_response = supabase.table(\"inventory\").select(\"*\").eq(\"unit\", schedule_data[\"unit\"]).execute()\n        \n        if inv_response.data:\n            inventory_item = inv_response.data[0]\n            current_qty = float(inventory_item[\"quantity\"])\n            required_qty = float(schedule_data[\"quantity_required\"])\n            \n            if current_qty < required_qty:\n                raise HTTPException(\n                    status_code=400,\n                    detail=f\"Insufficient inventory. Available: {current_qty}, Required: {required_qty}\"\n                )\n            \n            # Deduct inventory\n            new_qty = current_qty - required_qty\n            supabase.table(\"inventory\").update({\"quantity\": new_qty}).eq(\"id\", inventory_item[\"id\"]).execute()\n            \n            # Log transaction\n            supabase.table(\"inventory_transactions\").insert({\n                \"inventory_id\": inventory_item[\"id\"],\n                \"related_schedule_id\": schedule_id,\n                \"change\": -required_qty,\n                \"reason\": f\"Task completion: {schedule_data['task_type']}\"\n            }).execute()\n    \n    # Update schedule status\n    supabase.table(\"schedules\").update({\"status\": \"done\"}).eq(\"id\", schedule_id).execute()\n    \n    # Create checklist entry\n    supabase.table(\"checklist_entries\").insert({\n        \"schedule_id\": schedule_id,\n        \"performed_by\": current_user[\"id\"],\n        \"notes\": task_data.notes\n    }).execute()\n    \n    return {\"message\": \"Task completed successfully\"}\n\n# ==================== HARVEST ENDPOINTS ====================\n\n@app.post(\"/api/harvests\", response_model=HarvestResponse)\nasync def record_harvest(harvest: HarvestCreate, current_user: dict = Depends(require_role([\"owner\", \"farmer\"]))):\n    response = supabase.table(\"harvest_records\").insert(harvest.model_dump()).execute()\n    return response.data[0]\n\n@app.get(\"/api/harvests\", response_model=List[HarvestResponse])\nasync def list_harvests(plant_instance_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):\n    query = supabase.table(\"harvest_records\").select(\"*\")\n    if plant_instance_id:\n        query = query.eq(\"plant_instance_id\", plant_instance_id)\n    response = query.execute()\n    return response.data\n\n# ==================== SUBSCRIPTION ENDPOINTS ====================\n\n@app.post(\"/api/subscriptions\", response_model=SubscriptionResponse)\nasync def create_subscription(sub: SubscriptionCreate, current_user: dict = Depends(require_role([\"subscriber\"]))):\n    new_sub = {\n        \"subscriber_id\": current_user[\"id\"],\n        \"plot_id\": sub.plot_id,\n        \"status\": \"active\"\n    }\n    response = supabase.table(\"subscriptions\").insert(new_sub).execute()\n    return response.data[0]\n\n@app.get(\"/api/subscriptions\", response_model=List[SubscriptionResponse])\nasync def list_subscriptions(current_user: dict = Depends(get_current_user)):\n    if current_user[\"role\"] == \"subscriber\":\n        response = supabase.table(\"subscriptions\").select(\"*\").eq(\"subscriber_id\", current_user[\"id\"]).execute()\n    else:\n        response = supabase.table(\"subscriptions\").select(\"*\").execute()\n    return response.data\n\n@app.delete(\"/api/subscriptions/{subscription_id}\")\nasync def cancel_subscription(subscription_id: str, current_user: dict = Depends(get_current_user)):\n    sub = supabase.table(\"subscriptions\").select(\"*\").eq(\"id\", subscription_id).execute()\n    if not sub.data:\n        raise HTTPException(status_code=404, detail=\"Subscription not found\")\n    \n    if sub.data[0][\"subscriber_id\"] != current_user[\"id\"]:\n        raise HTTPException(status_code=403, detail=\"Not authorized\")\n    \n    supabase.table(\"subscriptions\").update({\"status\": \"cancelled\"}).eq(\"id\", subscription_id).execute()\n    return {\"message\": \"Subscription cancelled\"}\n\n# ==================== FARMER ASSIGNMENT ENDPOINTS ====================\n\n@app.post(\"/api/farmer-assignments\")\nasync def assign_farmer(assignment: FarmerAssignmentCreate, current_user: dict = Depends(require_role([\"owner\"]))):\n    # Verify user is a farmer\n    user = supabase.table(\"users\").select(\"role\").eq(\"id\", assignment.farmer_id).execute()\n    if not user.data or user.data[0][\"role\"] != \"farmer\":\n        raise HTTPException(status_code=400, detail=\"User is not a farmer\")\n    \n    response = supabase.table(\"farmer_assignments\").insert(assignment.model_dump()).execute()\n    return response.data[0]\n\n@app.get(\"/api/farmer-assignments\")\nasync def list_farmer_assignments(plot_id: Optional[str] = None, current_user: dict = Depends(require_role([\"owner\"]))):\n    query = supabase.table(\"farmer_assignments\").select(\"*\")\n    if plot_id:\n        query = query.eq(\"plot_id\", plot_id)\n    response = query.execute()\n    return response.data\n\n@app.delete(\"/api/farmer-assignments/{assignment_id}\")\nasync def remove_farmer_assignment(assignment_id: str, current_user: dict = Depends(require_role([\"owner\"]))):\n    supabase.table(\"farmer_assignments\").delete().eq(\"id\", assignment_id).execute()\n    return {\"message\": \"Assignment removed\"}\n\n# ==================== REPORTS & DASHBOARD ====================\n\n@app.get(\"/api/dashboard/stats\")\nasync def get_dashboard_stats(current_user: dict = Depends(get_current_user)):\n    stats = {}\n    \n    if current_user[\"role\"] == \"owner\":\n        farms = supabase.table(\"farms\").select(\"id\", count=\"exact\").eq(\"owner_id\", current_user[\"id\"]).execute()\n        stats[\"total_farms\"] = farms.count\n        \n        plots = supabase.table(\"plots\").select(\"id\", count=\"exact\").execute()\n        stats[\"total_plots\"] = plots.count\n        \n        instances = supabase.table(\"plant_instances\").select(\"id\", count=\"exact\").eq(\"status\", \"active\").execute()\n        stats[\"active_plantings\"] = instances.count\n        \n        inventory = supabase.table(\"inventory\").select(\"*\").execute()\n        low_stock = [i for i in inventory.data if i[\"quantity\"] <= i[\"reorder_level\"]]\n        stats[\"low_stock_items\"] = len(low_stock)\n    \n    elif current_user[\"role\"] == \"farmer\":\n        assignments = supabase.table(\"farmer_assignments\").select(\"plot_id\", count=\"exact\").eq(\"farmer_id\", current_user[\"id\"]).execute()\n        stats[\"assigned_plots\"] = assignments.count\n        \n        if assignments.data:\n            plot_ids = [a[\"plot_id\"] for a in assignments.data]\n            instances = supabase.table(\"plant_instances\").select(\"id\").in_(\"plot_id\", plot_ids).execute()\n            if instances.data:\n                instance_ids = [i[\"id\"] for i in instances.data]\n                today = str(date.today())\n                tasks = supabase.table(\"schedules\").select(\"id\", count=\"exact\").in_(\"plant_instance_id\", instance_ids).eq(\"scheduled_for\", today).eq(\"status\", \"pending\").execute()\n                stats[\"tasks_today\"] = tasks.count\n    \n    elif current_user[\"role\"] == \"subscriber\":\n        subs = supabase.table(\"subscriptions\").select(\"plot_id\", count=\"exact\").eq(\"subscriber_id\", current_user[\"id\"]).eq(\"status\", \"active\").execute()\n        stats[\"active_subscriptions\"] = subs.count\n    \n    return stats\n\n# ==================== HEALTH CHECK ====================\n\n@app.get(\"/api/health\")\nasync def health_check():\n    return {\"status\": \"healthy\", \"service\": \"Farm Management System\"}\n\n@app.get(\"/api/\")\nasync def root():\n    return {\"message\": \"Farm Management System API\"}
