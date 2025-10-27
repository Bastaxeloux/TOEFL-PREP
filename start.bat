@echo off
REM TOEFL Speaking Practice Tool - Windows Startup Script
echo ============================================================
echo TOEFL Speaking Practice Tool - Starting...
echo ============================================================
echo.

REM Check if venv exists
if not exist venv (
    echo ERROR: Virtual environment not found!
    echo Please run install.bat first.
    pause
    exit /b 1
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Start the Flask application and open browser
echo Starting server...
echo.
echo Once the server is ready, your browser will open automatically.
echo To stop the server, press Ctrl+C in this window.
echo.

REM Start server in background and wait for it to be ready
start /B python app.py

REM Wait 3 seconds for server to start
timeout /t 3 /nobreak >nul

REM Open browser
start http://localhost:5001

REM Keep window open to show server logs
python app.py
