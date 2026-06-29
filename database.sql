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
