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
