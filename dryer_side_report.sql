-- ==========================================
-- DRYER SIDE REPORT - SQL SCHEMA & QUERIES
-- ==========================================

-- 1. Create Table for Dryer Side Log/Report
CREATE TABLE dryer_side_report (
    report_id INT PRIMARY KEY,           -- Unique ID for each record
    log_date DATE NOT NULL,              -- Date of the report
    shift VARCHAR(20) NOT NULL,          -- Shift (e.g., Morning, Evening, Night)
    dryer_id VARCHAR(50) NOT NULL,       -- Which dryer is being used (e.g., Dryer-A)
    
    -- Material details
    input_material_kg DECIMAL(10,2),     -- Raw material fed into the dryer
    input_moisture_pct DECIMAL(5,2),     -- Moisture % before drying
    output_material_kg DECIMAL(10,2),    -- Dried material coming out
    output_moisture_pct DECIMAL(5,2),    -- Moisture % after drying
    
    -- Operating Parameters
    inlet_temp_celsius DECIMAL(6,2),     -- Temperature going in
    outlet_temp_celsius DECIMAL(6,2),    -- Temperature coming out
    
    -- Consumption & Operation
    fuel_consumed_units DECIMAL(10,2),   -- Fuel/Gas used
    running_hours DECIMAL(5,2),          -- How long the dryer ran in this shift
    operator_name VARCHAR(100),          -- Name of the machine operator
    remarks TEXT                         -- Any issues or maintenance notes
);

-- ==========================================
-- SAMPLE QUERIES FOR DRYER SIDE REPORTING
-- ==========================================

-- A. Daily Summary Report (Total processed, Average Moisture)
-- This report shows daily totals and efficiency for each dryer.
SELECT 
    log_date,
    dryer_id,
    SUM(input_material_kg) AS total_input_kg,
    SUM(output_material_kg) AS total_output_kg,
    -- Moisture reduction calculation
    AVG(input_moisture_pct) AS avg_in_moisture,
    AVG(output_moisture_pct) AS avg_out_moisture,
    (AVG(input_moisture_pct) - AVG(output_moisture_pct)) AS avg_moisture_dropped,
    -- Efficiency/Yield (Output / Input)
    (SUM(output_material_kg) / NULLIF(SUM(input_material_kg), 0)) * 100 AS yield_percentage
FROM 
    dryer_side_report
WHERE 
    log_date >= CURRENT_DATE - INTERVAL '30 days' -- Last 30 days
GROUP BY 
    log_date, dryer_id
ORDER BY 
    log_date DESC, dryer_id;


-- B. Fuel Efficiency Report (Fuel used per 1000 Kg dried)
SELECT 
    dryer_id,
    SUM(fuel_consumed_units) AS total_fuel,
    SUM(input_material_kg) AS total_processed,
    (SUM(fuel_consumed_units) / NULLIF(SUM(input_material_kg), 0)) * 1000 AS fuel_per_1000_kg
FROM 
    dryer_side_report
WHERE 
    log_date = CURRENT_DATE -- Today's report
GROUP BY 
    dryer_id;


-- C. Anomaly Detection (Find logs where Output Moisture is too high)
-- Useful for Quality Control to flag improperly dried batches.
SELECT 
    report_id,
    log_date,
    shift,
    dryer_id,
    output_moisture_pct,
    operator_name
FROM 
    dryer_side_report
WHERE 
    output_moisture_pct > 12.00; -- Change 12.00 to your target maximum moisture limit
