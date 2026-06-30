@echo off
echo Starting ITLive QR Attendance System in LOCAL DEV MODE...
echo ======================================================
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo ======================================================

:: Start Backend
start "Backend API" cmd /c "cd backend && call venv\Scripts\activate && uvicorn main:app --host 0.0.0.0 --port 8000"

:: Start Frontend
start "Frontend Web" cmd /c "cd frontend && set VITE_API_URL=http://localhost:8000 && npm run dev"

echo Done. Both processes are starting in separate windows.
pause
