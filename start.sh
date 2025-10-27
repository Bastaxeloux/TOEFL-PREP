#!/bin/bash
# TOEFL Speaking Practice Tool - macOS/Linux Startup Script

echo "============================================================"
echo "TOEFL Speaking Practice Tool - Starting..."
echo "============================================================"
echo ""

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "ERROR: Virtual environment not found!"
    echo "Please run ./install.sh first."
    exit 1
fi

# Activate virtual environment
source venv/bin/activate

# Start the Flask application and open browser
echo "Starting server..."
echo ""
echo "Once the server is ready, your browser will open automatically."
echo "To stop the server, press Ctrl+C in this terminal."
echo ""

# Function to open browser after server starts
open_browser() {
    sleep 3
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        open http://localhost:5001
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command -v xdg-open &> /dev/null; then
            xdg-open http://localhost:5001
        elif command -v gnome-open &> /dev/null; then
            gnome-open http://localhost:5001
        fi
    fi
}

# Open browser in background
open_browser &

# Start Flask app
python app.py
