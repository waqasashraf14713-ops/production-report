-- ==========================================
-- DRYER SUMMARY REPORT QUERIES
-- ==========================================

-- 1. DAILY DRYER SUMMARY REPORT
-- Gives a complete summary of operations per day for each dryer
SELECT 
    log_date AS Date,
    dryer_id AS Dryer_Machine,
    COUNT(report_id) AS Total_Shifts_Run,
    
    -- Material Totals
    SUM(input_material_kg) AS Total_Raw_Material_In_Kg,
    SUM(output_material_kg) AS Total_Dried_Product_Out_Kg,
    
    -- Yield / Efficiency
    ROUND((SUM(output_material_kg) / NULLIF(SUM(input_material_kg), 0)) * 100, 2) AS Overall_Yield_Percentage,
    
    -- Moisture Analysis (Averages)
    ROUND(AVG(input_moisture_pct), 2) AS Avg_Moisture_In_Pct,
    ROUND(AVG(output_moisture_pct), 2) AS Avg_Moisture_Out_Pct,
    ROUND(AVG(input_moisture_pct) - AVG(output_moisture_pct), 2) AS Moisture_Reduction_Pct,
    
    -- Fuel and Operations
    SUM(running_hours) AS Total_Running_Hours,
    SUM(fuel_consumed_units) AS Total_Fuel_Consumed,
    ROUND(SUM(fuel_consumed_units) / NULLIF(SUM(running_hours), 0), 2) AS Fuel_Per_Hour,
    ROUND(SUM(fuel_consumed_units) / NULLIF(SUM(input_material_kg), 0) * 1000, 2) AS Fuel_Per_Ton_Input

FROM 
    dryer_side_report
GROUP BY 
    log_date, 
    dryer_id
ORDER BY 
    log_date DESC, 
    dryer_id;


-- ==========================================
-- 2. MONTHLY DRYER SUMMARY REPORT
-- Rolls up data by Month for higher-level management review
SELECT 
    DATE_TRUNC('month', log_date) AS Report_Month,
    dryer_id AS Dryer_Machine,
    
    SUM(input_material_kg) AS Monthly_Input_Kg,
    SUM(output_material_kg) AS Monthly_Output_Kg,
    
    ROUND((SUM(output_material_kg) / NULLIF(SUM(input_material_kg), 0)) * 100, 2) AS Monthly_Yield_Pct,
    ROUND(AVG(output_moisture_pct), 2) AS Avg_Output_Moisture_Pct,
    
    SUM(running_hours) AS Monthly_Running_Hours,
    SUM(fuel_consumed_units) AS Monthly_Fuel_Consumed

FROM 
    dryer_side_report
GROUP BY 
    DATE_TRUNC('month', log_date), 
    dryer_id
ORDER BY 
    Report_Month DESC, 
    dryer_id;
