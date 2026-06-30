@echo off
cd /d "%~dp0"
echo Starting Global Backend on 0.0.0.0:8000...
call venv\Scripts\activate
uvicorn main:app --host 0.0.0.0 --port 8000
pause
