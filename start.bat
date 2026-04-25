@echo off
color 0b
echo ========================================================
echo    Starting Notify AI Lecture Recorder (Production)
echo ========================================================
echo.

:: 1. Check for Virtual Environment
echo [1/3] Checking Python Environment...
if exist "venv\Scripts\activate.bat" (
    echo Activating virtual environment...
    set "PYTHON_ENV=venv\Scripts\python.exe"
) else if exist ".venv\Scripts\activate.bat" (
    echo Activating virtual environment...
    set "PYTHON_ENV=.venv\Scripts\python.exe"
) else (
    echo No virtual environment found. Using global python...
    set "PYTHON_ENV=python"
)

:: Wait momentarily
timeout /t 1 >nul

:: 2. Start Backend API
echo [2/3] Starting Backend API (FastAPI) on Port 8099...
start "Notify Backend API" cmd /k "%PYTHON_ENV% -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8099"

:: Wait for backend to warm up
timeout /t 3 >nul

:: 3. Start Frontend UI
echo [3/3] Starting Frontend UI (Vite)...
if not exist "node_modules\" (
    echo [!] Node modules not found! Installing dependencies first...
    call npm install
)

start "Notify Frontend UI" cmd /k "npm run dev"

:: 4. Pop the UI in Default Browser
echo.
echo Launching Application in Browser...
timeout /t 2 >nul
start http://localhost:8080

echo.
echo ========================================================
echo Both servers are starting up in separate terminal windows.
echo - Backend swagger docs:  http://localhost:8099/docs
echo - Frontend Application:  http://localhost:8080
echo ========================================================
echo.
echo You may close this launcher window.
pause
