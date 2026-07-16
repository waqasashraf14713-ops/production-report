import pandas as pd
import sqlite3
import os

# Define file paths
EXCEL_FILE = 'silo_status.xlsx'
DB_FILE = 'oil_audit.db'
OUTPUT_EXCEL = 'silo_audit_report.xlsx'

def create_sample_excel():
    """Creates a sample Excel file if it doesn't exist to demonstrate how it works."""
    if not os.path.exists(EXCEL_FILE):
        data = {
            'Silo_ID': [1, 2, 3],
            'Silo_Name': ['Silo A', 'Silo B', 'Silo C'],
            'Capacity_Barrels': [5000, 5000, 10000],
            'Current_Volume': [4500, 1200, 8000],
            'Last_Updated': ['2023-10-25', '2023-10-25', '2023-10-25']
        }
        df = pd.DataFrame(data)
        df.to_excel(EXCEL_FILE, index=False)
        print(f"Created sample Excel file: {EXCEL_FILE}")

def link_excel_to_sql():
    """Reads Silo Status from Excel and loads it into a SQL Database."""
    print(f"Reading data from {EXCEL_FILE}...")
    # 1. Read the Excel file using pandas
    df = pd.read_excel(EXCEL_FILE)
    
    # 2. Connect to SQL Database (using SQLite for this example)
    conn = sqlite3.connect(DB_FILE)
    
    # 3. Load Excel data into a SQL table named 'silo_status'
    # if_exists='replace' will overwrite the table with new Excel data. 
    # Use 'append' to keep history.
    df.to_sql('silo_status', conn, if_exists='replace', index=False)
    print("Successfully linked Excel data to SQL database!")
    
    # 4. Run an Audit Query on the SQL data
    # Example: Find silos that are over 85% full (potential overflow risk)
    audit_query = """
        SELECT 
            Silo_Name, 
            Capacity_Barrels, 
            Current_Volume,
            (Current_Volume * 100.0 / Capacity_Barrels) as Fill_Percentage
        FROM silo_status
        WHERE (Current_Volume * 100.0 / Capacity_Barrels) > 85.0
    """
    
    audit_results = pd.read_sql_query(audit_query, conn)
    
    # 5. Export the audit results back to a new Excel Report
    audit_results.to_excel(OUTPUT_EXCEL, index=False)
    print(f"Audit completed. Results saved to {OUTPUT_EXCEL}")
    
    conn.close()

if __name__ == "__main__":
    # Make sure pandas and openpyxl are installed: 
    # pip install pandas openpyxl
    create_sample_excel()
    link_excel_to_sql()
