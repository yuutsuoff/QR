@echo off
set /p SUBDOMAIN="Enter a unique subdomain name (e.g. my-attendance-system): "

set BACKEND_SUBDOMAIN=%SUBDOMAIN%-api
set FRONTEND_SUBDOMAIN=%SUBDOMAIN%-web

echo ======================================================
echo ITLive QR Attendance System - GLOBAL CONFIG
echo ======================================================
echo Backend URL:  https://%BACKEND_SUBDOMAIN%.loca.lt
echo Frontend URL: https://%FRONTEND_SUBDOMAIN%.loca.lt
echo ======================================================

:: Start Backend
echo Launching Backend...
start "Backend API" cmd /c "cd backend && call venv\Scripts\activate && uvicorn main:app --host 0.0.0.0 --port 8000"

:: Start Frontend with the Backend Tunnel URL
echo Launching Frontend...
start "Frontend Web" cmd /c "cd frontend && set VITE_API_URL=https://%BACKEND_SUBDOMAIN%.loca.lt && npm run dev"

:: Space out the tunnel starts
timeout /t 5

:: Start Tunnels
echo Launching Tunnels...
start "API Tunnel" cmd /c "npx localtunnel --port 8000 --subdomain %BACKEND_SUBDOMAIN%"
start "Web Tunnel" cmd /c "npx localtunnel --port 5173 --subdomain %FRONTEND_SUBDOMAIN%"

echo.
echo All processes launched. 
echo 1. Wait for the Frontend and Backend to initialize.
echo 2. Check the tunnel windows for any "Password/IP" prompts.
echo 3. Access your app globally at: https://%FRONTEND_SUBDOMAIN%.loca.lt
echo.
pause
