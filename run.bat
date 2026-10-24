@echo off
set "PATH=C:\Program Files\nodejs;C:\Users\manas\AppData\Roaming\npm;%PATH%"
cd /d "%~dp0"
echo ========================================================
echo   Starting GreenRoute Karnataka AI Travel Planner
echo   API Server: http://localhost:5000
echo   Web App:    http://localhost:3000
echo ========================================================
pnpm dev
pause
