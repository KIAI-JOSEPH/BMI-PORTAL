@echo off
echo ========================================
echo BMI UMS - Starting All Services
echo ========================================

echo.
echo [1/3] Starting PocketBase Database...
start "PocketBase" /D "bin" pocketbase serve --dir=pb_data

echo Waiting for PocketBase to start...
timeout /t 3 /nobreak >nul

echo.
echo [2/3] Starting Backend API...
start "Backend API" /D "backend" cmd /k "npm run dev"

echo Waiting for Backend to start...
timeout /t 5 /nobreak >nul

echo.
echo [3/3] Starting Frontend...
start "Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo All services are starting!
echo ========================================
echo.
echo Access URLs:
echo - Frontend:    http://localhost:3000
echo - Backend API: http://localhost:3001
echo - PocketBase:  http://localhost:8090
echo - PB Admin:    http://localhost:8090/_/
echo.
echo Press any key to close this window...
pause >nul