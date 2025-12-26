# Farm Management System - Setup Instructions

## Database Setup

### Step 1: Execute Database Schema

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/bzdrmvnsaijtvbhairkc
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire content from `/app/database_schema.sql`
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

Run the following command to install required Python packages:

```bash
cd /app/backend
pip install supabase postgrest-py && pip freeze > requirements.txt
```

### Step 4: Install Frontend Dependencies

No additional dependencies needed - already installed.

### Step 5: Start the Application

Restart both backend and frontend:

```bash
sudo supervisorctl restart backend frontend
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
