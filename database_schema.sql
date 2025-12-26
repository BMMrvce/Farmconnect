-- Farm Management System Database Schema
-- PostgreSQL with UUID support

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) CHECK (role IN ('owner', 'farmer', 'subscriber')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- FARMS TABLE
CREATE TABLE IF NOT EXISTS farms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    location VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- PLOTS TABLE
CREATE TABLE IF NOT EXISTS plots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    area_sqm DECIMAL(10, 2),
    soil_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscriber_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plot_id UUID NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
    status VARCHAR(50) CHECK (status IN ('active', 'paused', 'cancelled')) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(subscriber_id, plot_id)
);

-- FARMER_ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS farmer_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plot_id UUID NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(farmer_id, plot_id)
);

-- GROWTH_CYCLES TABLE (Master data for plant lifecycle)
CREATE TABLE IF NOT EXISTS growth_cycles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    germination_days INTEGER NOT NULL,
    vegetative_days INTEGER NOT NULL,
    flowering_days INTEGER NOT NULL,
    fruiting_days INTEGER NOT NULL,
    total_growth_days INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- PLANT_REQUIREMENTS TABLE (All requirements for one plant in one row)
CREATE TABLE IF NOT EXISTS plant_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Water requirements
    water_min_ml DECIMAL(10, 2),
    water_max_ml DECIMAL(10, 2),
    -- Organic inputs (monthly)
    panchagavya_l_per_month DECIMAL(10, 2),
    dashagavya_l_per_month DECIMAL(10, 2),
    jeevamrutha_l_per_month DECIMAL(10, 2),
    -- Weekly inputs
    go_krupa_ml_weekly DECIMAL(10, 2),
    -- Soil & nutrients (monthly)
    vermicompost_ml_monthly DECIMAL(10, 2),
    cowpat_kg_monthly DECIMAL(10, 2),
    -- Sprays (monthly)
    spray_3g_g_monthly DECIMAL(10, 2),
    mustard_g_monthly DECIMAL(10, 2),
    pulse_l_monthly DECIMAL(10, 2),
    buttermilk_ml_monthly DECIMAL(10, 2),
    bo_ml_monthly DECIMAL(10, 2),
    faa_ml_monthly DECIMAL(10, 2),
    em_ml_monthly DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- PLANTS TABLE (Plant species master data)
CREATE TABLE IF NOT EXISTS plants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    scientific_name VARCHAR(255),
    requirement_id UUID REFERENCES plant_requirements(id) ON DELETE SET NULL,
    growth_cycle_id UUID REFERENCES growth_cycles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- PLANT_INSTANCES TABLE (Actual planting with growth status)
CREATE TABLE IF NOT EXISTS plant_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plot_id UUID NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
    plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
    planted_on DATE NOT NULL,
    count INTEGER DEFAULT 1,
    status VARCHAR(50) CHECK (status IN ('active', 'completed', 'failed')) DEFAULT 'active',
    -- Growth status (stored directly in this table)
    current_growth_stage VARCHAR(50) CHECK (current_growth_stage IN ('germination', 'vegetative', 'flowering', 'fruiting')),
    days_since_planting INTEGER,
    expected_harvest_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SCHEDULE_TEMPLATES TABLE (Reusable task definitions)
CREATE TABLE IF NOT EXISTS schedule_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
    task_type VARCHAR(50) CHECK (task_type IN ('water', 'spray', 'fertilizer')) NOT NULL,
    frequency VARCHAR(50) CHECK (frequency IN ('daily', 'weekly', 'monthly')) NOT NULL,
    requirement_field VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SCHEDULES TABLE (Auto-generated tasks)
CREATE TABLE IF NOT EXISTS schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plant_instance_id UUID NOT NULL REFERENCES plant_instances(id) ON DELETE CASCADE,
    template_id UUID REFERENCES schedule_templates(id) ON DELETE SET NULL,
    task_type VARCHAR(50) NOT NULL,
    scheduled_for DATE NOT NULL,
    status VARCHAR(50) CHECK (status IN ('pending', 'done', 'skipped')) DEFAULT 'pending',
    quantity_required DECIMAL(10, 2),
    unit VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CHECKLIST_ENTRIES TABLE (Task execution tracking)
CREATE TABLE IF NOT EXISTS checklist_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
    performed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- INVENTORY TABLE (Materials for plant care)
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
    reorder_level DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, unit)
);

-- INVENTORY_TRANSACTIONS TABLE (Audit log)
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
    related_schedule_id UUID REFERENCES schedules(id) ON DELETE SET NULL,
    change DECIMAL(10, 2) NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- HARVEST_RECORDS TABLE
CREATE TABLE IF NOT EXISTS harvest_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plant_instance_id UUID NOT NULL REFERENCES plant_instances(id) ON DELETE CASCADE,
    harvest_date DATE NOT NULL,
    weight_kg DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_farms_owner ON farms(owner_id);
CREATE INDEX IF NOT EXISTS idx_plots_farm ON plots(farm_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_subscriber ON subscriptions(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plot ON subscriptions(plot_id);
CREATE INDEX IF NOT EXISTS idx_farmer_assignments_farmer ON farmer_assignments(farmer_id);
CREATE INDEX IF NOT EXISTS idx_farmer_assignments_plot ON farmer_assignments(plot_id);
CREATE INDEX IF NOT EXISTS idx_plant_instances_plot ON plant_instances(plot_id);
CREATE INDEX IF NOT EXISTS idx_plant_instances_plant ON plant_instances(plant_id);
CREATE INDEX IF NOT EXISTS idx_schedules_instance ON schedules(plant_instance_id);
CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_checklist_schedule ON checklist_entries(schedule_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_inventory ON inventory_transactions(inventory_id);
CREATE INDEX IF NOT EXISTS idx_harvest_records_instance ON harvest_records(plant_instance_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_farms_updated_at BEFORE UPDATE ON farms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plots_updated_at BEFORE UPDATE ON plots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plants_updated_at BEFORE UPDATE ON plants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plant_instances_updated_at BEFORE UPDATE ON plant_instances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
