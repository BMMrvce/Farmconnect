# 🌾 Farm Management System

A comprehensive full-stack web application for managing agricultural operations with role-based access control, automated scheduling, and inventory management.

![Agricultural Theme](https://img.shields.io/badge/Theme-Agricultural-green)
![Stack](https://img.shields.io/badge/Stack-FastAPI%20%2B%20React-blue)
![Database](https://img.shields.io/badge/Database-PostgreSQL%20(Supabase)-orange)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [User Roles](#user-roles)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)

---

## 🌱 Overview

The Farm Management System is designed to streamline agricultural operations by providing:
- **Farm & Plot Management** - Organize farms into manageable plots
- **Plant Catalog** - Track plant species with growth cycles and care requirements
- **Plant Instances** - Monitor actual plantings with automatic growth stage calculation
- **Inventory Management** - Track materials used for plant care
- **Role-Based Access** - Different interfaces for Owners, Farmers, and Subscribers
- **Growth Tracking** - Automatic calculation of growth stages and harvest dates

---

## ✨ Features

### For Farm Owners
- ✅ Create and manage multiple farms
- ✅ Divide farms into plots
- ✅ Define plant species with requirements and growth cycles
- ✅ Track plant instances with automatic growth calculations
- ✅ Manage inventory with stock level monitoring
- ✅ View comprehensive dashboard statistics

### For Farmers
- 🚧 View assigned plots
- 🚧 Complete daily tasks
- 🚧 Automatic inventory deduction on task completion

### For Subscribers
- 🚧 Subscribe to plots
- 🚧 View plant growth progress (read-only)
- 🚧 Track harvest records

**Legend:** ✅ Implemented | 🚧 Planned

---

## 🛠 Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **Supabase** - PostgreSQL database with authentication
- **Python 3.11+**
- **JWT** - Token-based authentication
- **Bcrypt** - Password hashing

### Frontend
- **React 18** - UI library
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Shadcn/UI** - Component library
- **Tailwind CSS** - Styling

### Database
- **PostgreSQL** via Supabase
- **UUID** primary keys
- **Foreign key relationships**
- **Row Level Security** (RLS) ready

---

## 📦 Prerequisites

Before you begin, ensure you have:

- **Python 3.11 or higher**
- **Node.js 18+ and Yarn**
- **Supabase Account** (free tier available)
- **Git** (optional, for cloning)

---

## 🚀 Installation

### 1. Clone or Download the Project

```bash
# If using git
git clone <repository-url>
cd farm-management-system

# Or download and extract the ZIP file
cd path/to/extracted/folder
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Verify installation
python -c "import fastapi; print('FastAPI installed successfully')"
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies using yarn
yarn install

# Verify installation
yarn --version

# Optional: Check for outdated packages
yarn outdated
```

---

## 🗄️ Database Setup

### Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click **"New Project"**
4. Fill in project details:
   - **Name:** Farm Management System
   - **Database Password:** (save this securely)
   - **Region:** Choose closest to you
5. Wait for project to be created (~2 minutes)

### Step 2: Get API Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following (you'll need these for .env configuration):
   
   ```bash
   # Note down these values:
   Project URL: https://xxxxx.supabase.co
   anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Step 3: Execute Database Schema

**Option A: Using Supabase Dashboard (Recommended)**

1. In Supabase dashboard, go to **SQL Editor**
2. Click **"New Query"**
3. Copy the entire content from `/database_schema.sql`
4. Paste into SQL Editor
5. Click **"Run"** or press `Ctrl+Enter`
6. Wait for success message

**Option B: Using Command Line (if you have psql installed)**

```bash
# From project root directory
cd /path/to/farm-management-system

# Connect to Supabase and execute schema
# Replace with your actual connection string from Supabase
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" -f database_schema.sql
```

### Step 4: Verify Tables Created

**Using Supabase Dashboard:**
1. Go to **Table Editor** in Supabase
2. Verify all 15 tables exist

**Using Command Line:**

```bash
# Connect to database
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# List all tables
\dt

# You should see:
# users, farms, plots, subscriptions, farmer_assignments,
# growth_cycles, plant_requirements, plants, plant_instances,
# schedule_templates, schedules, checklist_entries,
# inventory, inventory_transactions, harvest_records

# Exit psql
\q
```

---

## ⚙️ Configuration

### Backend Configuration

Edit `/backend/.env`:

```env
# Supabase Configuration (REQUIRED)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-key-here

# JWT Configuration (Can keep defaults)
JWT_SECRET_KEY=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# MongoDB (Not used, but kept for compatibility)
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"

# CORS (Keep as is for local development)
CORS_ORIGINS="*"
```

### Frontend Configuration

Edit `/frontend/.env`:

```env
# Backend API URL (Keep as is for local development)
REACT_APP_BACKEND_URL=http://localhost:8001

# Or use the production URL if deployed:
# REACT_APP_BACKEND_URL=https://your-app.preview.emergentagent.com
```

---

## 🏃 Running the Application

### Method 1: Using Supervisor (Recommended for Production)

If you have supervisor installed:

```bash
# Start both frontend and backend
sudo supervisorctl start backend frontend

# Check status
sudo supervisorctl status

# View logs
sudo supervisorctl tail -f backend
sudo supervisorctl tail -f frontend

# Stop services
sudo supervisorctl stop backend frontend
```

### Method 2: Manual Start (For Local Development)

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
yarn start
```

The application will be available at:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8001
- **API Docs:** http://localhost:8001/docs (Swagger UI)

---

## 📁 Project Structure

```
farm-management-system/
├── backend/
│   ├── server.py              # Main FastAPI application
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # Backend configuration
├── frontend/
│   ├── public/               # Static assets
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── ui/          # Shadcn UI components
│   │   │   ├── Navbar.js
│   │   │   ├── DashboardStats.js
│   │   │   └── ProtectedRoute.js
│   │   ├── contexts/        # React contexts
│   │   │   └── AuthContext.js
│   │   ├── pages/           # Page components
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── OwnerDashboard.js
│   │   │   ├── FarmerDashboard.js
│   │   │   └── SubscriberDashboard.js
│   │   ├── App.js           # Main app component
│   │   ├── App.css          # Global styles
│   │   └── index.js         # Entry point
│   ├── package.json         # Node dependencies
│   └── .env                 # Frontend configuration
├── database_schema.sql      # Complete database schema
├── README.md               # This file
└── ENDPOINT_VERIFICATION_REPORT.md
```

---

## 👥 User Roles

The system supports three distinct roles:

### 1. Owner 🏢
**Full system access:**
- Create and manage farms
- Create and manage plots
- Define plant species and requirements
- Create plant instances
- Manage inventory
- View all reports
- Assign farmers to plots

### 2. Farmer 👨‍🌾
**Task execution:**
- View assigned plots
- Complete daily tasks
- View plant growth status
- Inventory automatically deducted on task completion

### 3. Subscriber 📊
**Read-only monitoring:**
- Subscribe to plots
- View plant growth progress
- View harvest records
- Track plant health

---

## 🔐 Getting Started

### 1. Register Your First Account

1. Open http://localhost:3000
2. Click **"Register here"**
3. Fill in details:
   - Email: your@email.com
   - Password: (minimum 8 characters)
   - Name: Your Name
   - **Role: Farm Owner** (recommended for first account)
4. Click **"Create Account"**

### 2. Set Up Your Farm

1. After login, you'll see the Owner Dashboard
2. Go to **Farms** tab → Click **"Add Farm"**
3. Create your first farm
4. Go to **Plots** tab → Click **"Add Plot"**
5. Create plots for your farm

### 3. Set Up Master Data

1. Go to **Setup** tab
2. Create a **Growth Cycle**:
   - Germination: 7 days
   - Vegetative: 21 days
   - Flowering: 14 days
   - Fruiting: 28 days
   - Total: 70 days
3. Create **Plant Requirements** (optional, for automated scheduling)
4. Go to **Plants** tab → Create plant species (link to cycle)

### 4. Add Inventory

1. Go to **Inventory** tab → Click **"Add Item"**
2. Add items:
   - Water (ml)
   - Panchagavya (liters)
   - Vermicompost (kg)

### 5. Create Your First Planting

1. Go to **Plant Instances** tab → Click **"Plant Now"**
2. Select:
   - Plot
   - Plant species
   - Planted date
   - Count
3. Click **"Create Instance"**
4. Growth stage automatically calculated! 🌱

---

## 📡 API Documentation

### Authentication
```bash
# Register
POST /api/auth/register
Body: {"email", "password", "name", "role"}

# Login
POST /api/auth/login
Body: {"email", "password"}
Returns: {"access_token", "token_type"}

# Get current user
GET /api/auth/me
Headers: Authorization: Bearer <token>
```

### Farms
```bash
# Create farm
POST /api/farms
Headers: Authorization: Bearer <token>
Body: {"name", "location", "description"}

# List farms
GET /api/farms
Headers: Authorization: Bearer <token>

# Delete farm
DELETE /api/farms/{farm_id}
Headers: Authorization: Bearer <token>
```

### Complete API Documentation
Available at: http://localhost:8001/docs (when backend is running)

---

## 🐛 Troubleshooting

### Backend Issues

**Problem:** `ModuleNotFoundError: No module named 'supabase'`
```bash
# Solution: Install dependencies
cd backend
pip install -r requirements.txt
```

**Problem:** `Connection refused` to database
```bash
# Solution: Check Supabase credentials in .env
# Verify SUPABASE_URL and SUPABASE_SERVICE_KEY are correct
```

**Problem:** `Table 'users' doesn't exist`
```bash
# Solution: Execute database schema
# Go to Supabase SQL Editor and run database_schema.sql
```

### Frontend Issues

**Problem:** `Module not found` errors
```bash
# Solution: Reinstall dependencies
cd frontend
rm -rf node_modules
yarn install
```

**Problem:** API calls return 404
```bash
# Solution: Check REACT_APP_BACKEND_URL in frontend/.env
# Should be: http://localhost:8001 (no trailing slash)
```

**Problem:** CORS errors
```bash
# Solution: Ensure backend CORS is configured
# backend/.env should have: CORS_ORIGINS="*"
```

### Database Issues

**Problem:** "Invalid JWT" errors
```bash
# Solution: Regenerate JWT secret
# Edit backend/.env and change JWT_SECRET_KEY
```

**Problem:** Can't see created data
```bash
# Solution: Users only see their own data
# Each owner sees only their farms/plots
# Login with the account that created the data
```

---

## 🧪 Testing

### Test the Backend API

```bash
# Get token
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'

# Test endpoints (use token from above)
curl http://localhost:8001/api/farms \
  -H "Authorization: Bearer <your-token>"

# View API documentation
open http://localhost:8001/docs
```

### Test the Frontend

1. Register with different roles (Owner, Farmer, Subscriber)
2. Test each role's dashboard
3. Create test data in each tab
4. Verify data appears correctly

---

## 📝 Environment Variables Reference

### Backend (.env)
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| SUPABASE_URL | Yes | - | Your Supabase project URL |
| SUPABASE_ANON_KEY | Yes | - | Supabase anon key |
| SUPABASE_SERVICE_KEY | Yes | - | Supabase service role key |
| JWT_SECRET_KEY | Yes | - | Secret for JWT tokens |
| JWT_ALGORITHM | No | HS256 | JWT algorithm |
| ACCESS_TOKEN_EXPIRE_MINUTES | No | 30 | Token expiry time |

### Frontend (.env)
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| REACT_APP_BACKEND_URL | Yes | - | Backend API URL |

---

## 🎨 Design Theme

The application uses an **agricultural theme** with:
- **Primary Color:** Forest Green (#558b2f)
- **Secondary Color:** Light Green (#8bc34a)
- **Background:** Cream/Beige gradients (#f5f1e8, #e8f5e9, #f1f8e9)
- **Typography:** Inter font family
- **Components:** Shadcn/UI with Tailwind CSS

---

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [Shadcn/UI Documentation](https://ui.shadcn.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

---

## 🤝 Contributing

This is an academic project. For contributions or issues:
1. Document the issue/feature clearly
2. Test locally before submitting
3. Follow existing code style and structure

---

## 📄 License

This project is created for educational purposes.

---

## 👨‍💻 Development Status

**Current Version:** 1.0.0-beta

**Implemented Features:**
- ✅ Authentication & Authorization
- ✅ Farm & Plot Management
- ✅ Plant Catalog
- ✅ Growth Cycles & Requirements
- ✅ Plant Instances with Growth Tracking
- ✅ Inventory Management
- ✅ Dashboard Statistics

**Upcoming Features:**
- 🚧 Automated Task Scheduling
- 🚧 Task Completion with Auto-Inventory Deduction
- 🚧 Farmer Assignments
- 🚧 Subscriptions
- 🚧 Harvest Records
- 🚧 Reports & Analytics

---

## 📞 Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review the [ENDPOINT_VERIFICATION_REPORT.md](/ENDPOINT_VERIFICATION_REPORT.md)
3. Check Supabase dashboard for database issues
4. Review browser console for frontend errors
5. Check backend logs for API errors

---

**Happy Farming! 🌾**
