# Farm Management System - Setup Instructions

## Database Setup

### Step 1: Execute Database Schema

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/bzdrmvnsaijtvbhairkc
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire content from `./database_schema.sql` (project root)
5. Paste it into the SQL editor
6. Click **Run** to execute the schema

This will create all required tables, indexes, triggers, and functions.

### Step 2: Verify Tables Created

Go to **Table Editor** in Supabase Dashboard and verify that all these tables exist:
- users
- farms
- plots
- subscriptions
- farmer_assignments
- growth_cycles
- plant_requirements
- plants
- plant_instances
- schedule_templates
- schedules
- checklist_entries
- inventory
- inventory_transactions
- harvest_records

### Step 3: Install Backend Dependencies

On Debian/Ubuntu, first ensure venv support:

```bash
sudo apt update
sudo apt install python3.12-venv
```

Then install backend dependencies in a virtual environment:

```bash
cd ./backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 4: Install Frontend Dependencies

Install Node dependencies (requires Node 18+ and Yarn):

```bash
cd ./frontend
yarn install
```

### Step 5: Start the Application

Use the provided quick-start script from project root:

```bash
chmod +x start.sh
./start.sh
```

Or start manually:

```bash
# Backend
cd ./backend
source venv/bin/activate
python -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Frontend (new terminal)
cd ./frontend
yarn start
```

## Default Accounts

No default accounts are created. You will need to register through the application.

## Testing the System

1. Register as an Owner
2. Create farms and plots
3. Add plant master data
4. Create plant instances
5. Register farmers and assign to plots
6. Manage inventory
7. Complete tasks

## Important Notes

- All passwords are securely hashed with bcrypt
- JWT tokens expire after 30 minutes
- Inventory is automatically deducted when tasks are completed
- Growth stages are calculated based on planted_on date and growth cycles
