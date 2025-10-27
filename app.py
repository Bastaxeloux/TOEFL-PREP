#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TOEFL Independent Speaking Question Practice Tool
Adapted by Le Guillouzic Maël from : Lennart Rikk
Available for personal and educational use only.
"""

from flask import Flask, render_template, request, jsonify, send_file
from gtts import gTTS
import whisper
import io
import os
import base64
import tempfile
import subprocess
import warnings
import platform
import sys
import json
from pathlib import Path
from shutil import which

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024
PROMPTS_FILE = Path(__file__).parent / 'prompts.txt'
VOCABULARY_FILE = Path(__file__).parent / 'vocabulary_cards.json'
CONFIG_FILE = Path(__file__).parent / 'config.json'

def find_ffmpeg():
    """
    Find ffmpeg executable on any platform (Windows, macOS, Linux)
    Returns the path to ffmpeg or None if not found
    """
    # First, check if ffmpeg is in PATH
    ffmpeg_path = which('ffmpeg')
    if ffmpeg_path:
        return ffmpeg_path

    # Platform-specific search paths
    system = platform.system()

    if system == 'Darwin':  # macOS
        possible_paths = [
            '/opt/homebrew/bin/ffmpeg',      # Apple Silicon Homebrew
            '/usr/local/bin/ffmpeg',          # Intel Mac Homebrew
            '/opt/local/bin/ffmpeg',          # MacPorts
        ]
    elif system == 'Windows':
        possible_paths = [
            r'C:\Program Files\ffmpeg\bin\ffmpeg.exe',
            r'C:\ffmpeg\bin\ffmpeg.exe',
            os.path.join(os.getenv('PROGRAMFILES', 'C:\\Program Files'), 'ffmpeg', 'bin', 'ffmpeg.exe'),
            os.path.join(os.getenv('LOCALAPPDATA', ''), 'ffmpeg', 'bin', 'ffmpeg.exe'),
        ]
    else:  # Linux and others
        possible_paths = [
            '/usr/bin/ffmpeg',
            '/usr/local/bin/ffmpeg',
            '/snap/bin/ffmpeg',
        ]

    # Check each possible path
    for path in possible_paths:
        if os.path.exists(path):
            return path

    return None

def check_ffmpeg_installed():
    """Check if ffmpeg is installed and provide installation instructions if not"""
    ffmpeg_path = find_ffmpeg()

    if ffmpeg_path:
        print(f"✓ FFmpeg found: {ffmpeg_path}")
        return True
    else:
        system = platform.system()
        print("\n" + "="*60)
        print("⚠ FFmpeg NOT FOUND - Audio conversion will not work!")
        print("="*60)

        if system == 'Darwin':  # macOS
            print("\nTo install ffmpeg on macOS, run:")
            print("  brew install ffmpeg")
            print("\nIf you don't have Homebrew, install it first:")
            print("  /bin/bash -c \"$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\"")

        elif system == 'Windows':
            print("\nTo install ffmpeg on Windows:")
            print("  1. Download from: https://www.gyan.dev/ffmpeg/builds/")
            print("  2. Extract to C:\\ffmpeg")
            print("  3. Add C:\\ffmpeg\\bin to your PATH")
            print("\nOr use Chocolatey:")
            print("  choco install ffmpeg")

        else:  # Linux
            print("\nTo install ffmpeg on Linux:")
            print("  Ubuntu/Debian: sudo apt-get install ffmpeg")
            print("  Fedora: sudo dnf install ffmpeg")
            print("  Arch: sudo pacman -S ffmpeg")

        print("\n" + "="*60)
        print("The app will still work, but MP3 download will be disabled.")
        print("="*60 + "\n")

        return False

# Initialize Whisper model
print("Loading Whisper model (this may take a minute)...")
whisper_model = whisper.load_model("base")
print("Whisper model loaded!")

# Check ffmpeg availability
FFMPEG_AVAILABLE = check_ffmpeg_installed()
FFMPEG_PATH = find_ffmpeg()

def load_prompts():
    """Load prompts from file"""
    try:
        if PROMPTS_FILE.exists():
            with open(PROMPTS_FILE, 'r', encoding='utf-8') as f:
                return f.read().strip()
    except Exception as e:
        print(f"Error loading prompts: {e}")
    return ""

def load_vocabulary_cards():
    """Load vocabulary cards from file"""
    try:
        if VOCABULARY_FILE.exists():
            with open(VOCABULARY_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
    except Exception as e:
        print(f"Error loading vocabulary cards: {e}")
    return []

def save_vocabulary_cards(cards):
    """Save vocabulary cards to file"""
    try:
        with open(VOCABULARY_FILE, 'w', encoding='utf-8') as f:
            json.dump(cards, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error saving vocabulary cards: {e}")
        return False

def load_config():
    """Load config from file"""
    try:
        if CONFIG_FILE.exists():
            with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
    except Exception as e:
        print(f"Error loading config: {e}")
    return {}

def save_config(config):
    """Save config to file"""
    try:
        with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error saving config: {e}")
        return False

@app.route('/')
def index():
    """Render the main page"""
    prompts = load_prompts()
    config = load_config()
    return render_template('index.html', default_prompts=prompts, api_key=config.get('api_key', ''))

@app.route('/vocabulary')
def vocabulary():
    """Vocabulary flashcards page"""
    return render_template('vocabulary.html')

@app.route('/save_prompts', methods=['POST'])
def save_prompts():
    """Save prompts to file"""
    try:
        data = request.get_json()
        prompts = data.get('prompts', '')
        with open(PROMPTS_FILE, 'w', encoding='utf-8') as f:
            f.write(prompts)
        return jsonify({'success': True, 'message': 'Prompts saved successfully!'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/save_config', methods=['POST'])
def save_config_route():
    """Save config (API key) to file"""
    try:
        data = request.get_json()
        config = load_config()
        config['api_key'] = data.get('api_key', '')
        if save_config(config):
            return jsonify({'success': True, 'message': 'Config saved successfully!'})
        else:
            return jsonify({'success': False, 'error': 'Failed to save config'}), 500
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/vocabulary_cards', methods=['GET'])
def get_vocabulary_cards():
    """Get all vocabulary cards"""
    try:
        cards = load_vocabulary_cards()
        return jsonify({'cards': cards})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/vocabulary_cards', methods=['POST'])
def add_vocabulary_card():
    """Add a new vocabulary card"""
    try:
        data = request.get_json()
        cards = load_vocabulary_cards()

        new_card = {
            'date': data.get('date'),
            'question': data.get('question'),
            'title': data.get('title'),
            'content': data.get('content')
        }

        cards.append(new_card)

        if save_vocabulary_cards(cards):
            return jsonify({'success': True, 'message': 'Vocabulary card saved!'})
        else:
            return jsonify({'success': False, 'error': 'Failed to save'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/vocabulary_cards/<int:index>', methods=['DELETE'])
def delete_vocabulary_card(index):
    """Delete a vocabulary card by index"""
    try:
        cards = load_vocabulary_cards()

        if 0 <= index < len(cards):
            cards.pop(index)
            if save_vocabulary_cards(cards):
                return jsonify({'success': True, 'message': 'Card deleted!'})
            else:
                return jsonify({'success': False, 'error': 'Failed to save'}), 500
        else:
            return jsonify({'error': 'Invalid index'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/create_audio', methods=['POST'])
def create_audio():
    """Create audio from text using gTTS"""
    try:
        data = request.get_json()
        text = data.get('text', '')

        if not text:
            return jsonify({'error': 'No text provided'}), 400

        # Create audio
        tts = gTTS(text=text, lang='en')
        mp3_fp = io.BytesIO()
        tts.write_to_fp(mp3_fp)
        mp3_fp.seek(0)

        # Convert to base64
        audio_b64 = base64.b64encode(mp3_fp.read()).decode()

        return jsonify({'audio': audio_b64})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/transcribe', methods=['POST'])
def transcribe():
    """Transcribe audio using Whisper"""
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400

        audio_file = request.files['audio']

        # Save to temporary file
        with tempfile.NamedTemporaryFile(suffix='.webm', delete=False) as temp_audio:
            audio_file.save(temp_audio.name)
            temp_path = temp_audio.name
        try:
            with warnings.catch_warnings():
                warnings.filterwarnings("ignore", message="FP16 is not supported on CPU; using FP32 instead")
                result = whisper_model.transcribe(
                    temp_path,
                    verbose=False,
                    language="en",
                    task="transcribe"
                )

            formatted_transcript = ""
            word_count = 0

            for segment in result["segments"]:
                start_time = segment["start"]
                text = segment["text"].strip()
                word_count += len(text.split())
                formatted_transcript += f"[{start_time:.1f}s] {text}\n"

            return jsonify({
                'transcript': formatted_transcript,
                'word_count': word_count
            })

        finally:
            # Clean up temporary file
            if os.path.exists(temp_path):
                os.unlink(temp_path)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/evaluate', methods=['POST'])
def evaluate():
    """Evaluate speaking response using OpenAI GPT"""
    try:
        from openai import OpenAI

        data = request.get_json()
        api_key = data.get('api_key', '')
        question = data.get('question', '')
        transcript = data.get('transcript', '')
        word_count = data.get('word_count', 0)
        speaking_time = data.get('speaking_time', 45)

        if not api_key:
            return jsonify({'error': 'No API key provided'}), 400

        # Initialize OpenAI client
        client = OpenAI(api_key=api_key)

        # Create evaluation prompt
        wpm = (word_count / speaking_time * 60) if speaking_time > 0 else 0

        prompt = f"""You are an experienced TOEFL speaking evaluator. Evaluate this TOEFL Independent Speaking response.

**Question:** {question}

**Student's Response (transcribed):**
{transcript}

**Statistics:**
- Total words: {word_count}
- Words per minute: {wpm:.1f}

**Your task:**
Provide a detailed evaluation following this structure:

1. **Overall Score** (0-4 scale):
   - Give a score from 0 to 4 (TOEFL scale)
   - Briefly explain the score

2. **Strengths** (What was done well):
   - List 2-3 specific positive points
   - Quote examples from the response

3. **Areas for Improvement** (What needs work):
   - List 2-3 specific issues
   - Quote examples and explain why they're problematic

4. **Content & Development**:
   - Was the question answered directly?
   - Were ideas developed with examples/reasons?
   - Suggest what additional ideas/examples could have been included

5. **Language & Vocabulary**:
   - Identify any repetitive or basic words/phrases used
   - For EACH word/phrase identified, suggest 3-5 alternative advanced synonyms
   - Example format: "Instead of 'good', try: beneficial, advantageous, favorable"
   - Also provide 2-3 REPHRASING examples: show how they could have expressed their ideas better
   - Format rephrasing as: "You said: '[quote from transcript]' → You could say: '[improved version]'"
   - Focus on vocabulary that would improve their TOEFL score

6. **Grammar & Fluency**:
   - Note any grammatical errors (with corrections)
   - Comment on sentence variety and complexity

7. **Recommendations**:
   - Give 2-3 specific actionable tips for next time

Format your response in clear HTML with the following EXACT structure:
- Use <h4> tags for EACH section title (Overall Score, Strengths, Areas for Improvement, Content & Development, Language & Vocabulary, Grammar & Fluency, Recommendations)
- After each <h4>, put the content in <p> tags or <ul> lists
- Use <strong> for emphasis, <ul> for lists
- Example structure:
  <h4>Overall Score</h4>
  <p>Score: X - explanation here</p>
  <h4>Strengths</h4>
  <ul><li>Point 1</li><li>Point 2</li></ul>

IMPORTANT:
- Do NOT use any emojis or special characters
- Do NOT wrap in markdown code blocks (no ```html or ```)
- MUST use <h4> for section titles
- Return only pure HTML content"""

        # Call OpenAI API
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # More affordable than gpt-4
            messages=[
                {"role": "system", "content": "You are an expert TOEFL speaking evaluator. Provide detailed, constructive feedback. Do not use any emojis. Return only HTML content without markdown code blocks."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1500
        )

        feedback = response.choices[0].message.content

        # Clean up the feedback: remove markdown code blocks and emojis
        import re
        # Remove ```html and ``` markers
        feedback = re.sub(r'^```html\s*', '', feedback, flags=re.MULTILINE)
        feedback = re.sub(r'```\s*$', '', feedback, flags=re.MULTILINE)
        # Remove emojis (basic emoji removal)
        feedback = re.sub(r'[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF\U0001F680-\U0001F6FF\U0001F1E0-\U0001F1FF\U00002702-\U000027B0\U000024C2-\U0001F251]+', '', feedback)

        return jsonify({'feedback': feedback})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/convert_to_mp3', methods=['POST'])
def convert_to_mp3():
    """Convert WebM audio to MP3"""
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400

        audio_file = request.files['audio']

        # Create temporary files
        with tempfile.NamedTemporaryFile(suffix='.webm', delete=False) as temp_webm:
            audio_file.save(temp_webm.name)
            webm_path = temp_webm.name

        mp3_path = webm_path.replace('.webm', '.mp3')

        try:
            # Check if ffmpeg is available
            if not FFMPEG_AVAILABLE or not FFMPEG_PATH:
                return jsonify({'error': 'FFmpeg not installed. Please install FFmpeg to enable MP3 conversion.'}), 400

            # Convert using ffmpeg
            subprocess.run([
                FFMPEG_PATH, '-i', webm_path,
                '-codec:a', 'libmp3lame',
                '-qscale:a', '2',
                mp3_path,
                '-y'
            ], check=True, stderr=subprocess.DEVNULL, stdout=subprocess.DEVNULL)
            with open(mp3_path, 'rb') as f:
                mp3_data = f.read()
            mp3_b64 = base64.b64encode(mp3_data).decode()

            return jsonify({'mp3': mp3_b64})

        finally:
            # Clean up temporary files
            if os.path.exists(webm_path):
                os.unlink(webm_path)
            if os.path.exists(mp3_path):
                os.unlink(mp3_path)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    Path('templates').mkdir(exist_ok=True)
    Path('static').mkdir(exist_ok=True)
    print("\n" + "="*60)
    print("TOEFL Speaking Practice Tool - Starting Server")
    print("="*60)
    print("\nOnce the server starts, open your browser and go to:")
    print("\n    http://localhost:5001\n")
    print("="*60 + "\n")

    app.run(debug=True, host='0.0.0.0', port=5001)
