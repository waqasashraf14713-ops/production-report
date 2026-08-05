@echo off
echo Starting Feed Mill Production Report...
echo.
echo Server is running at: http://localhost:3000
echo Press Ctrl+C to stop the server when done.
echo.

:: Wait 2 seconds then open browser with secret token
start /b cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:3000/?t=fm2024asia"

:: Start Python HTTP server
python -m http.server 3000

pause
