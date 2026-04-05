@echo off
echo ========================================
echo   Starting Academix ERP Application
echo ========================================
echo.

echo [1/2] Starting Backend Server (port 5005)...
start "Academix Backend" cmd /k "cd /d %~dp0 && node server/server.js"

echo [2/2] Starting Frontend Dev Server (port 5173)...
start "Academix Frontend" cmd /k "cd /d %~dp0client && npm run dev"

echo.
echo Both servers are starting in separate windows.
echo   Backend:  http://localhost:5005
echo   Frontend: http://localhost:5173
echo ========================================
