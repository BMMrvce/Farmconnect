# 📚 Complete Setup Documentation

## Quick Links

- [README.md](README.md) - Complete setup guide with detailed instructions
- [ENDPOINT_VERIFICATION_REPORT.md](ENDPOINT_VERIFICATION_REPORT.md) - API testing and verification
- [database_schema.sql](database_schema.sql) - PostgreSQL database schema
- [start.sh](start.sh) - Quick start script
- [stop.sh](stop.sh) - Stop services script

---

## 🚀 Super Quick Start (3 Steps)

### 1. Setup Supabase Database

1. Create account at https://supabase.com
2. Create new project
3. Go to SQL Editor → New Query
4. Copy content from `database_schema.sql` → Run
5. Get credentials from Settings → API

### 2. Configure Environment

```bash
# Backend
cd backend
cat > .env << 'EOF'
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
CORS_ORIGINS="*"
EOF

# Frontend
cd ../frontend
echo "REACT_APP_BACKEND_URL=http://localhost:8001" > .env
```

### 3. Run the Application

```bash
# From project root
./start.sh
```

That's it! Open http://localhost:3000

---

## 📖 Available Scripts

### Start Services
```bash
./start.sh
```
- Checks all prerequisites
- Sets up virtual environment (if needed)
- Installs dependencies (if needed)
- Starts both backend and frontend
- Shows access URLs and PIDs
- Press Ctrl+C to stop

### Stop Services
```bash
./stop.sh
```
- Stops both backend and frontend
- Cleans up PID files
- Optionally deletes log files

### Manual Start (Development)

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
yarn start
```

---

## 🔧 Common Commands

### Check Service Status
```bash
# Check if backend is running
curl http://localhost:8001/api/health

# Check if frontend is running
curl -I http://localhost:3000

# Check what's on ports
lsof -i :8001  # Backend
lsof -i :3000  # Frontend
```

### View Logs
```bash
# If using start.sh script
tail -f backend.log
tail -f frontend.log

# If using supervisor
sudo supervisorctl tail -f backend
sudo supervisorctl tail -f frontend
```

### Install New Packages
```bash
# Backend
cd backend
source venv/bin/activate
pip install <package-name>
pip freeze > requirements.txt

# Frontend
cd frontend
yarn add <package-name>
```

### Database Operations
```bash
# Connect to database
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Common queries
SELECT * FROM users;
SELECT * FROM farms;
SELECT * FROM plots;
\dt  # List all tables
\q   # Quit
```

---

## 🧪 Quick Testing

### Test API
```bash
# Health check
curl http://localhost:8001/api/health

# Register user
curl -X POST http://localhost:8001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123","name":"Test User","role":"owner"}'

# Login and get token
TOKEN=$(curl -s -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# Test authenticated endpoint
curl -H "Authorization: Bearer $TOKEN" http://localhost:8001/api/farms
```

### Test Frontend
```bash
# Open in browser
open http://localhost:3000

# Or test with curl
curl -I http://localhost:3000
```

---

## 🐛 Troubleshooting Quick Fixes

### Backend won't start
```bash
# Check Python version (need 3.11+)
python3 --version

# Reinstall dependencies
cd backend
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Frontend won't start
```bash
# Check Node version (need 18+)
node --version

# Reinstall dependencies
cd frontend
rm -rf node_modules yarn.lock
yarn install
```

### Database connection issues
```bash
# Verify Supabase credentials in backend/.env
cat backend/.env | grep SUPABASE

# Test connection
python3 << EOF
from supabase import create_client
import os
from dotenv import load_dotenv
load_dotenv('backend/.env')
client = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))
print('✓ Connection successful!')
EOF
```

### Port already in use
```bash
# Kill process on port 8001 (backend)
kill -9 $(lsof -t -i:8001)

# Kill process on port 3000 (frontend)
kill -9 $(lsof -t -i:3000)
```

### Can't see my data
```bash
# Each user only sees their own data
# Make sure you're logged in with the account that created the data
```

---

## 📁 Project Structure

```
farm-management-system/
├── backend/
│   ├── server.py          # FastAPI application
│   ├── requirements.txt   # Python dependencies
│   ├── .env              # Configuration (create this)
│   └── venv/             # Virtual environment (auto-created)
├── frontend/
│   ├── src/
│   │   ├── pages/        # Page components
│   │   ├── components/   # Reusable components
│   │   ├── contexts/     # React contexts
│   │   └── App.js        # Main app
│   ├── package.json      # Node dependencies
│   ├── .env             # Configuration (create this)
│   └── node_modules/    # Dependencies (auto-created)
├── database_schema.sql   # Database schema
├── README.md            # Complete documentation
├── start.sh             # Quick start script
├── stop.sh              # Stop script
├── backend.log          # Backend logs (created by start.sh)
└── frontend.log         # Frontend logs (created by start.sh)
```

---

## 🎯 First Time Setup Checklist

- [ ] Python 3.11+ installed
- [ ] Node.js 18+ installed
- [ ] Yarn installed (`npm install -g yarn`)
- [ ] Supabase account created
- [ ] Supabase project created
- [ ] Database schema executed in Supabase
- [ ] Backend .env file configured
- [ ] Frontend .env file configured
- [ ] Backend dependencies installed (`pip install -r requirements.txt`)
- [ ] Frontend dependencies installed (`yarn install`)
- [ ] Services started (via `./start.sh` or manually)
- [ ] Health check passes (`curl http://localhost:8001/api/health`)
- [ ] Frontend loads (`http://localhost:3000`)
- [ ] Can register and login
- [ ] Can create farm and plot

---

## 🔗 Useful URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | React application |
| Backend API | http://localhost:8001 | FastAPI server |
| API Docs (Swagger) | http://localhost:8001/docs | Interactive API docs |
| API Docs (ReDoc) | http://localhost:8001/redoc | Alternative API docs |
| Health Check | http://localhost:8001/api/health | Backend health status |
| Supabase Dashboard | https://supabase.com/dashboard | Database management |

---

## 💡 Tips

1. **Always use the scripts** - `./start.sh` handles all setup automatically
2. **Check logs** - If something fails, check `backend.log` and `frontend.log`
3. **Use API docs** - Visit http://localhost:8001/docs to explore all endpoints
4. **Test as you go** - Register → Create Farm → Create Plot → Create Plant
5. **Each user sees their own data** - Owner sees only their farms/plots
6. **Growth stages calculate automatically** - When you create plant instances
7. **Inventory tracks automatically** - Will deduct when tasks are completed (future feature)

---

## 📞 Getting Help

1. **Check README.md** - Comprehensive setup guide
2. **Check ENDPOINT_VERIFICATION_REPORT.md** - API testing details
3. **Check logs** - `backend.log` and `frontend.log`
4. **Check browser console** - Press F12 in browser
5. **Check Supabase dashboard** - Verify tables exist
6. **Check supervisor status** - `sudo supervisorctl status` (if using supervisor)

---

## 🎓 Learning Resources

- **FastAPI Tutorial**: https://fastapi.tiangolo.com/tutorial/
- **React Tutorial**: https://react.dev/learn
- **Supabase Docs**: https://supabase.com/docs
- **PostgreSQL Tutorial**: https://www.postgresql.org/docs/
- **Tailwind CSS**: https://tailwindcss.com/docs

---

**Ready to start farming? Run `./start.sh` and visit http://localhost:3000** 🌾
