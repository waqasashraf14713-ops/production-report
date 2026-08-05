@echo off
echo ============================================
echo   Feed Mill - Sync Files to Public Folder
echo ============================================
echo.

set SRC=d:\production report
set DST=d:\production report\public

:: List of files to sync
set FILES=dryer_report.js script.js styles.css index.html batching_audit.js batching_scale.js pellet_efficiency.js plant_report.js quality_standards.js shift_report_pdf.js silo_dump.js silo_moisture.js silo_performa.js less_excess_pdf.js env.js oil_audit.js oil_scada_3d.js silo_moisture.js executive_dashboard.js

for %%F in (%FILES%) do (
    if exist "%SRC%\%%F" (
        copy /Y "%SRC%\%%F" "%DST%\%%F" >nul
        echo [OK] Synced: %%F
    )
)

echo.
echo ============================================
echo   All files synced to public folder!
echo ============================================
echo.
pause
