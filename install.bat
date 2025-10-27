@echo off
REM TOEFL Speaking Practice Tool - Windows Installation Script
echo ============================================================
echo TOEFL Speaking Practice Tool - Installation
echo ============================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed!
    echo Please download and install Python from: https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation.
    pause
    exit /b 1
)

echo [1/4] Python found
echo.

REM Create virtual environment
echo [2/4] Creating virtual environment...
if not exist venv (
    python -m venv venv
    echo Virtual environment created.
) else (
    echo Virtual environment already exists.
)
echo.

REM Activate virtual environment and install dependencies
echo [3/4] Installing dependencies...
call venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r requirements.txt
echo.

REM Check for ffmpeg
echo [4/4] Checking for FFmpeg...
where ffmpeg >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo WARNING: FFmpeg not found!
    echo MP3 conversion will not work without FFmpeg.
    echo.
    echo To install FFmpeg on Windows:
    echo   1. Download from: https://www.gyan.dev/ffmpeg/builds/
    echo   2. Extract to C:\ffmpeg
    echo   3. Add C:\ffmpeg\bin to your PATH
    echo.
    echo Or use Chocolatey: choco install ffmpeg
    echo.
) else (
    echo FFmpeg found!
)

echo.
echo ============================================================
echo Installation complete!
echo ============================================================
echo.
echo To start the application, double-click: start.bat
echo Or run: start.bat
echo.
pause
