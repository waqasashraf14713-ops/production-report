-- Oil Audit Sample Schema and Queries

-- 1. Create Tables
CREATE TABLE oil_wells (
    well_id INT PRIMARY KEY,
    well_name VARCHAR(100),
    location VARCHAR(100),
    status VARCHAR(50) -- e.g., Active, Inactive, Maintenance
);

CREATE TABLE daily_production (
    production_id INT PRIMARY KEY,
    well_id INT,
    production_date DATE,
    volume_barrels DECIMAL(10, 2),
    FOREIGN KEY (well_id) REFERENCES oil_wells(well_id)
);

CREATE TABLE oil_sales (
    sale_id INT PRIMARY KEY,
    sale_date DATE,
    volume_barrels DECIMAL(10, 2),
    price_per_barrel DECIMAL(10, 2),
    buyer_name VARCHAR(100)
);

CREATE TABLE inventory (
    inventory_date DATE PRIMARY KEY,
    opening_balance_barrels DECIMAL(10, 2),
    closing_balance_barrels DECIMAL(10, 2)
);

-- 2. Audit Queries

-- A. Reconcile Production vs Sales vs Inventory (Mass Balance)
-- This query checks if the total production matches sales and inventory changes for a given month.
WITH MonthlyStats AS (
    SELECT 
        DATE_TRUNC('month', p.production_date) as audit_month,
        SUM(p.volume_barrels) as total_produced,
        (SELECT SUM(volume_barrels) FROM oil_sales WHERE DATE_TRUNC('month', sale_date) = DATE_TRUNC('month', p.production_date)) as total_sold,
        (SELECT closing_balance_barrels - opening_balance_barrels 
         FROM inventory 
         WHERE DATE_TRUNC('month', inventory_date) = DATE_TRUNC('month', p.production_date)
         -- Assuming taking end of month difference for simplicity in this example
         LIMIT 1) as inventory_change
    FROM daily_production p
    GROUP BY DATE_TRUNC('month', p.production_date)
)
SELECT 
    audit_month,
    total_produced,
    total_sold,
    inventory_change,
    (total_produced - total_sold - COALESCE(inventory_change, 0)) as discrepancy
FROM MonthlyStats;

-- B. Identify Wells with Drastic Production Drops (Potential Leak/Theft/Meter Issue)
-- Compares average production of last 7 days vs previous 30 days.
WITH WellAverages AS (
    SELECT 
        well_id,
        AVG(CASE WHEN production_date >= CURRENT_DATE - INTERVAL '7 days' THEN volume_barrels END) as avg_last_7_days,
        AVG(CASE WHEN production_date >= CURRENT_DATE - INTERVAL '37 days' AND production_date < CURRENT_DATE - INTERVAL '7 days' THEN volume_barrels END) as avg_prev_30_days
    FROM daily_production
    GROUP BY well_id
)
SELECT 
    w.well_name,
    wa.avg_last_7_days,
    wa.avg_prev_30_days,
    (wa.avg_last_7_days - wa.avg_prev_30_days) / NULLIF(wa.avg_prev_30_days, 0) * 100 as percentage_change
FROM WellAverages wa
JOIN oil_wells w ON wa.well_id = w.well_id
WHERE (wa.avg_last_7_days - wa.avg_prev_30_days) / NULLIF(wa.avg_prev_30_days, 0) < -0.20; -- Flag if drop is > 20%
