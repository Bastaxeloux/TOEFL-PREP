#!/bin/bash
# TOEFL Speaking Practice Tool - macOS/Linux Installation Script

echo "============================================================"
echo "TOEFL Speaking Practice Tool - Installation"
echo "============================================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed!"
    echo "Please install Python 3 first:"
    echo "  macOS: brew install python3"
    echo "  Ubuntu/Debian: sudo apt-get install python3 python3-pip python3-venv"
    echo "  Fedora: sudo dnf install python3 python3-pip"
    exit 1
fi

echo "[1/4] Python found: $(python3 --version)"
echo ""

# Create virtual environment
echo "[2/4] Creating virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "Virtual environment created."
else
    echo "Virtual environment already exists."
fi
echo ""

# Activate virtual environment and install dependencies
echo "[3/4] Installing dependencies..."
source venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
echo ""

# Check for ffmpeg
echo "[4/4] Checking for FFmpeg..."
if ! command -v ffmpeg &> /dev/null; then
    echo ""
    echo "WARNING: FFmpeg not found!"
    echo "MP3 conversion will not work without FFmpeg."
    echo ""

    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        echo "To install FFmpeg on macOS:"
        echo "  brew install ffmpeg"
        echo ""
        echo "If you don't have Homebrew, install it first:"
        echo "  /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        echo "To install FFmpeg on Linux:"
        echo "  Ubuntu/Debian: sudo apt-get install ffmpeg"
        echo "  Fedora: sudo dnf install ffmpeg"
        echo "  Arch: sudo pacman -S ffmpeg"
    fi
    echo ""
else
    echo "FFmpeg found: $(which ffmpeg)"
fi

echo ""
echo "============================================================"
echo "Installation complete!"
echo "============================================================"
echo ""
echo "To start the application, run: ./start.sh"
echo "Or make it executable first: chmod +x start.sh"
echo ""
