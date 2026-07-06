CREATE TABLE raw_material_unloading_check (
    id SERIAL PRIMARY KEY,
    check_date DATE NOT NULL,              
    shift VARCHAR(50),                     
    vehicle_number VARCHAR(50) NOT NULL,   
    location VARCHAR(150),                 
    moisture DECIMAL(5, 2),                
    staff_present VARCHAR(255),            
    quality VARCHAR(100),                  
    remarks TEXT,                          
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE daily_performas_checklist (
    id SERIAL PRIMARY KEY,
    check_date DATE NOT NULL,              
    manager_sign VARCHAR(150),             
    remarks TEXT,                          
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE batching_scale (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    shift VARCHAR(50),
    recipe_product VARCHAR(150),
    target_weight DECIMAL(18, 2),
    actual_weight DECIMAL(18, 2),
    variance DECIMAL(18, 2) GENERATED ALWAYS AS (actual_weight - target_weight) STORED,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for Batching Scale Calibration Checking (JSONB format for scale grids)
CREATE TABLE batching_scale_calibration (
    id BIGINT PRIMARY KEY,
    date DATE NOT NULL,
    officer_name VARCHAR(150),
    operators VARCHAR(255),
    recal_big BOOLEAN DEFAULT FALSE,
    recal_small BOOLEAN DEFAULT FALSE,
    recal_premix BOOLEAN DEFAULT FALSE,
    recal_oil_wt BOOLEAN DEFAULT FALSE,
    recal_oil_ds BOOLEAN DEFAULT FALSE,
    big_scale JSONB,         -- Array of targets with PLC and HMI values
    small_scale JSONB,       -- Array of targets with PLC and HMI values
    premix_scale JSONB,      -- Array of targets with PLC and HMI values
    oil_wt_scale JSONB,      -- Array of targets with PLC and HMI values
    oil_ds_scale JSONB,      -- Array of targets with PLC and HMI values
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pellet_efficiency (
    id BIGINT PRIMARY KEY,
    date DATE NOT NULL,
    shift VARCHAR(50),
    officer_name VARCHAR(150),
    rows JSONB,              -- Array of objects representing each pellet mill's efficiency details
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for Dryer Side Shift Report
CREATE TABLE dryer_side_report (
    id BIGINT PRIMARY KEY,
    date DATE NOT NULL,
    shift VARCHAR(50),
    operator_name VARCHAR(150),
    material_dumping JSONB,        -- Array of { material, onTime, offTime, siloWetBin, remarks }
    material_discharge JSONB,      -- Array of { material, siloNo, onTime, offTime, remarks }
    silos_discharge_gates JSONB,   -- Array of { conveyor, silo, gate, isOpen, remarks }
    silo_status JSONB,             -- Object { silo09: {onTime, offTime}, silo10: {onTime, offTime}, silo11: {onTime, offTime}, silo12: {onTime, offTime} }
    faults_and_causes TEXT,
    cleaning JSONB,                -- Object with boolean flags for drum_cleaner, chamber_section, sieves_box_1, etc.
    under_process_work TEXT,
    general TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for Silo Filling & Discharge Performa Logs
CREATE TABLE silo_logs (
    id BIGINT PRIMARY KEY,
    date DATE NOT NULL,
    shift VARCHAR(50),
    silo_number VARCHAR(50),
    operation_type VARCHAR(50),
    material_name VARCHAR(150),
    moisture DECIMAL(5, 2) DEFAULT 0,
    net_qty DECIMAL(18, 2) DEFAULT 0,
    temperature DECIMAL(5, 2) DEFAULT 0,
    performed_by VARCHAR(150),
    remarks TEXT,
    seal_no VARCHAR(50),
    supervisor VARCHAR(150),
    inspection JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Disable Row Level Security (RLS) to ensure data can be saved/synced via Anon key
ALTER TABLE raw_material_unloading_check DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_performas_checklist DISABLE ROW LEVEL SECURITY;
ALTER TABLE batching_scale DISABLE ROW LEVEL SECURITY;
ALTER TABLE batching_scale_calibration DISABLE ROW LEVEL SECURITY;
ALTER TABLE pellet_efficiency DISABLE ROW LEVEL SECURITY;
ALTER TABLE dryer_side_report DISABLE ROW LEVEL SECURITY;
ALTER TABLE silo_logs DISABLE ROW LEVEL SECURITY;
