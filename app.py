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

# New data directory structure
DATA_DIR = Path(__file__).parent / 'data'
DATA_DIR.mkdir(exist_ok=True)

# Task directories (Task 1 uses plain text file, not directory)
TASK2_DIR = DATA_DIR / 'task2'
TASK3_DIR = DATA_DIR / 'task3'
TASK4_DIR = DATA_DIR / 'task4'

for task_dir in [TASK2_DIR, TASK3_DIR, TASK4_DIR]:
    task_dir.mkdir(exist_ok=True)
    (task_dir / 'audio').mkdir(exist_ok=True)

# File paths
PROMPTS_FILE = Path(__file__).parent / 'prompts.txt'  # Task 1 uses plain text
TASK2_PROMPTS = TASK2_DIR / 'prompts.json'
TASK3_PROMPTS = TASK3_DIR / 'prompts.json'
TASK4_PROMPTS = TASK4_DIR / 'prompts.json'

# Legacy aliases for task files
TASK2_FILE = TASK2_PROMPTS
TASK3_FILE = TASK3_PROMPTS
TASK4_FILE = TASK4_PROMPTS

# Other files
VOCABULARY_FILE = DATA_DIR / 'vocabulary_cards.json'
CONFIG_FILE = DATA_DIR / 'config.json'
UPLOADS_DIR = DATA_DIR / 'uploads'
UPLOADS_DIR.mkdir(exist_ok=True)

# Helper functions for JSON prompt management (Tasks 2, 3, 4 only)
def load_task_prompts(task_num):
    """Load prompts for a specific task from JSON (Task 2, 3, 4 only)"""
    if task_num == 1:
        # Task 1 uses plain text file
        return {"prompts": []}

    prompt_files = {
        2: TASK2_PROMPTS,
        3: TASK3_PROMPTS,
        4: TASK4_PROMPTS
    }

    file_path = prompt_files.get(task_num)
    if not file_path or not file_path.exists():
        return {"prompts": []}

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading Task {task_num} prompts: {e}")
        return {"prompts": []}

def save_task_prompts(task_num, data):
    """Save prompts for a specific task to JSON (Task 2, 3, 4 only)"""
    if task_num == 1:
        # Task 1 uses plain text file
        return False

    prompt_files = {
        2: TASK2_PROMPTS,
        3: TASK3_PROMPTS,
        4: TASK4_PROMPTS
    }

    file_path = prompt_files.get(task_num)
    if not file_path:
        return False

    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error saving Task {task_num} prompts: {e}")
        return False

def get_audio_dir(task_num):
    """Get the audio directory for a specific task"""
    audio_dirs = {
        2: TASK2_DIR / 'audio',
        3: TASK3_DIR / 'audio',
        4: TASK4_DIR / 'audio'
    }
    return audio_dirs.get(task_num)

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
    """Render the main page (Complete Test)"""
    config = load_config()
    api_key = config.get('api_key', '')

    # Load saved content for all tasks
    task1_content = ''
    if PROMPTS_FILE.exists():
        try:
            with open(PROMPTS_FILE, 'r', encoding='utf-8') as f:
                task1_content = f.read()
        except Exception as e:
            print(f"Error loading Task 1 prompts: {e}")

    task2_content = ''
    if TASK2_FILE.exists():
        try:
            with open(TASK2_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                # Extract reading from first prompt in the prompts array
                if 'prompts' in data and len(data['prompts']) > 0:
                    task2_content = data['prompts'][0].get('reading', '')
        except Exception as e:
            print(f"Error loading Task 2 content: {e}")

    task3_content = ''
    if TASK3_FILE.exists():
        try:
            with open(TASK3_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                # Extract reading from first prompt in the prompts array
                if 'prompts' in data and len(data['prompts']) > 0:
                    task3_content = data['prompts'][0].get('reading', '')
        except Exception as e:
            print(f"Error loading Task 3 content: {e}")

    task4_content = ''
    if TASK4_FILE.exists():
        try:
            with open(TASK4_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                # Extract notes from first prompt in the prompts array
                if 'prompts' in data and len(data['prompts']) > 0:
                    task4_content = data['prompts'][0].get('notes', '')
        except Exception as e:
            print(f"Error loading Task 4 content: {e}")

    return render_template('index.html',
                         api_key=api_key,
                         task1_content=task1_content,
                         task2_content=task2_content,
                         task3_content=task3_content,
                         task4_content=task4_content)

@app.route('/task1')
def task1():
    """Render Task 1 (Independent Speaking) page"""
    prompts = load_prompts()
    config = load_config()
    return render_template('task1.html', default_prompts=prompts, api_key=config.get('api_key', ''))

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

# ============================================================================
# Routes for Other Tasks (Task 2, 3, 4)
# ============================================================================

@app.route('/other-tasks')
def other_tasks():
    """Render the Other Tasks menu page (individual task practice)"""
    return render_template('other_tasks.html')

@app.route('/task2')
def task2():
    """Render Task 2 (Campus Announcement) page"""
    config = load_config()
    api_key = config.get('api_key', '')

    # Load saved content from JSON structure
    saved_reading = ''
    if TASK2_FILE.exists():
        try:
            with open(TASK2_FILE, 'r', encoding='utf-8') as f:
                task_data = json.load(f)
                # Extract reading from first prompt in the prompts array
                if 'prompts' in task_data and len(task_data['prompts']) > 0:
                    saved_reading = task_data['prompts'][0].get('reading', '')
        except Exception as e:
            print(f"Error loading Task 2 content: {e}")

    return render_template('task2.html', api_key=api_key, saved_reading=saved_reading)

@app.route('/task3')
def task3():
    """Render Task 3 (Academic Concept) page"""
    config = load_config()
    api_key = config.get('api_key', '')

    # Load saved content from JSON structure
    saved_reading = ''
    if TASK3_FILE.exists():
        try:
            with open(TASK3_FILE, 'r', encoding='utf-8') as f:
                task_data = json.load(f)
                # Extract reading from first prompt in the prompts array
                if 'prompts' in task_data and len(task_data['prompts']) > 0:
                    saved_reading = task_data['prompts'][0].get('reading', '')
        except Exception as e:
            print(f"Error loading Task 3 content: {e}")

    return render_template('task3.html', api_key=api_key, saved_reading=saved_reading)

@app.route('/task4')
def task4():
    """Render Task 4 (Lecture Summary) page"""
    config = load_config()
    api_key = config.get('api_key', '')

    # Load saved notes from JSON structure
    saved_notes = ''
    if TASK4_FILE.exists():
        try:
            with open(TASK4_FILE, 'r', encoding='utf-8') as f:
                task_data = json.load(f)
                # Extract notes from first prompt in the prompts array
                if 'prompts' in task_data and len(task_data['prompts']) > 0:
                    saved_notes = task_data['prompts'][0].get('notes', '')
        except Exception as e:
            print(f"Error loading Task 4 content: {e}")

    return render_template('task4.html', api_key=api_key, saved_notes=saved_notes)

@app.route('/api/task/<int:task_num>/prompts/list')
def list_prompts(task_num):
    """List all prompts for a specific task"""
    if task_num not in [2, 3, 4]:
        return jsonify({'error': 'Invalid task number'}), 400

    try:
        data = load_task_prompts(task_num)
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/task/<int:task_num>/prompts/<int:prompt_id>')
def get_prompt(task_num, prompt_id):
    """Get a specific prompt by ID"""
    if task_num not in [2, 3, 4]:
        return jsonify({'error': 'Invalid task number'}), 400

    try:
        data = load_task_prompts(task_num)
        for prompt in data.get('prompts', []):
            if prompt['id'] == prompt_id:
                return jsonify(prompt)
        return jsonify({'error': 'Prompt not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/task/<int:task_num>/prompts', methods=['POST'])
def create_prompt(task_num):
    """Create a new prompt"""
    if task_num not in [2, 3, 4]:
        return jsonify({'error': 'Invalid task number'}), 400

    try:
        incoming_data = request.get_json()
        data = load_task_prompts(task_num)

        # Generate new ID
        new_id = max([p['id'] for p in data['prompts']], default=0) + 1

        # Create new prompt
        new_prompt = {'id': new_id}

        if task_num == 2:
            new_prompt['reading'] = incoming_data.get('reading', '')
            new_prompt['audio_file'] = incoming_data.get('audio_file')
            new_prompt['notes'] = incoming_data.get('notes', '')
        elif task_num == 3:
            new_prompt['reading'] = incoming_data.get('reading', '')
            new_prompt['question'] = incoming_data.get('question', '')
            new_prompt['audio_file'] = incoming_data.get('audio_file')
            new_prompt['notes'] = incoming_data.get('notes', '')
        elif task_num == 4:
            new_prompt['question'] = incoming_data.get('question', '')
            new_prompt['audio_file'] = incoming_data.get('audio_file')
            new_prompt['notes'] = incoming_data.get('notes', '')
            new_prompt['topic'] = incoming_data.get('topic', '')

        data['prompts'].append(new_prompt)

        if save_task_prompts(task_num, data):
            return jsonify({'success': True, 'prompt': new_prompt})
        else:
            return jsonify({'error': 'Failed to save prompt'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/task/<int:task_num>/prompts/<int:prompt_id>', methods=['PUT'])
def update_prompt(task_num, prompt_id):
    """Update an existing prompt"""
    if task_num not in [2, 3, 4]:
        return jsonify({'error': 'Invalid task number'}), 400

    try:
        incoming_data = request.get_json()
        data = load_task_prompts(task_num)

        # Find and update the prompt
        for i, prompt in enumerate(data['prompts']):
            if prompt['id'] == prompt_id:
                if task_num == 2:
                    if 'reading' in incoming_data:
                        prompt['reading'] = incoming_data['reading']
                    if 'audio_file' in incoming_data:
                        prompt['audio_file'] = incoming_data['audio_file']
                    if 'notes' in incoming_data:
                        prompt['notes'] = incoming_data['notes']
                elif task_num == 3:
                    if 'reading' in incoming_data:
                        prompt['reading'] = incoming_data['reading']
                    if 'question' in incoming_data:
                        prompt['question'] = incoming_data['question']
                    if 'audio_file' in incoming_data:
                        prompt['audio_file'] = incoming_data['audio_file']
                    if 'notes' in incoming_data:
                        prompt['notes'] = incoming_data['notes']
                elif task_num == 4:
                    if 'question' in incoming_data:
                        prompt['question'] = incoming_data['question']
                    if 'audio_file' in incoming_data:
                        prompt['audio_file'] = incoming_data['audio_file']
                    if 'notes' in incoming_data:
                        prompt['notes'] = incoming_data['notes']
                    if 'topic' in incoming_data:
                        prompt['topic'] = incoming_data['topic']

                data['prompts'][i] = prompt

                if save_task_prompts(task_num, data):
                    return jsonify({'success': True, 'prompt': prompt})
                else:
                    return jsonify({'error': 'Failed to save prompt'}), 500

        return jsonify({'error': 'Prompt not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/task/<int:task_num>/prompts/<int:prompt_id>', methods=['DELETE'])
def delete_prompt(task_num, prompt_id):
    """Delete a prompt"""
    if task_num not in [2, 3, 4]:
        return jsonify({'error': 'Invalid task number'}), 400

    try:
        data = load_task_prompts(task_num)

        # Find and remove the prompt
        data['prompts'] = [p for p in data['prompts'] if p['id'] != prompt_id]

        if save_task_prompts(task_num, data):
            return jsonify({'success': True, 'message': 'Prompt deleted'})
        else:
            return jsonify({'error': 'Failed to delete prompt'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/task/<int:task_num>/content', methods=['GET', 'POST'])
def task_content(task_num):
    """Get or save content for a specific task (legacy route)"""
    if task_num == 2:
        file_path = TASK2_FILE
    elif task_num == 3:
        file_path = TASK3_FILE
    elif task_num == 4:
        file_path = TASK4_FILE
    else:
        return jsonify({'error': 'Invalid task number'}), 400

    if request.method == 'GET':
        # Load content
        if file_path.exists():
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                return jsonify(data)
            except Exception as e:
                return jsonify({'error': str(e)}), 500
        return jsonify({})

    elif request.method == 'POST':
        # Save content - now creates a new prompt
        try:
            incoming_data = request.get_json()
            data = load_task_prompts(task_num)

            # Generate new ID
            new_id = max([p['id'] for p in data['prompts']], default=0) + 1

            # Create new prompt
            new_prompt = {'id': new_id}

            if task_num in [2, 3]:
                new_prompt['reading'] = incoming_data.get('reading', '')
                new_prompt['audio_file'] = None
                new_prompt['notes'] = ''
            elif task_num == 4:
                new_prompt['audio_file'] = None
                new_prompt['notes'] = incoming_data.get('notes', '')
                new_prompt['topic'] = ''

            data['prompts'].append(new_prompt)

            if save_task_prompts(task_num, data):
                return jsonify({'success': True, 'message': 'Content saved successfully!', 'prompt': new_prompt})
            else:
                return jsonify({'error': 'Failed to save'}), 500
        except Exception as e:
            return jsonify({'error': str(e)}), 500

@app.route('/api/task/<int:task_num>/upload_audio', methods=['POST'])
def upload_task_audio(task_num):
    """Upload audio file for a specific task"""
    if task_num not in [2, 3, 4]:
        return jsonify({'error': 'Invalid task number'}), 400

    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400

        audio_file = request.files['audio']
        if audio_file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        # Get the task-specific audio directory
        audio_dir = get_audio_dir(task_num)
        if not audio_dir:
            return jsonify({'error': 'Invalid task number'}), 400

        # Use original filename to preserve meaningful names
        original_filename = audio_file.filename
        saved_path = audio_dir / original_filename

        # If file exists, add a number suffix
        counter = 1
        while saved_path.exists():
            name_parts = os.path.splitext(original_filename)
            new_filename = f"{name_parts[0]}_{counter}{name_parts[1]}"
            saved_path = audio_dir / new_filename
            counter += 1

        # Save the file
        audio_file.save(saved_path)

        return jsonify({
            'success': True,
            'message': 'Audio uploaded successfully!',
            'filename': saved_path.name
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/task/<int:task_num>/audio/list')
def list_task_audio(task_num):
    """List all available audio files for a specific task"""
    if task_num not in [2, 3, 4]:
        return jsonify({'error': 'Invalid task number'}), 400

    try:
        # Get the audio directory for this task
        audio_dir = get_audio_dir(task_num)
        if not audio_dir or not audio_dir.exists():
            return jsonify({'audio_files': []})

        # List all audio files in the directory
        audio_extensions = {'.mp3', '.wav', '.m4a', '.ogg', '.webm'}
        audio_files = []

        for file_path in audio_dir.iterdir():
            if file_path.is_file() and file_path.suffix.lower() in audio_extensions:
                audio_files.append({
                    'filename': file_path.name,
                    'size': file_path.stat().st_size
                })

        # Sort by filename
        audio_files.sort(key=lambda x: x['filename'])

        return jsonify({'audio_files': audio_files})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/task/<int:task_num>/audio')
def get_task_audio(task_num):
    """Serve the audio file for a specific task"""
    if task_num not in [2, 3, 4]:
        return jsonify({'error': 'Invalid task number'}), 400

    try:
        # Get audio path from task file
        if task_num == 2:
            file_path = TASK2_FILE
        elif task_num == 3:
            file_path = TASK3_FILE
        else:
            file_path = TASK4_FILE

        if not file_path.exists():
            return jsonify({'error': 'No content saved for this task'}), 404

        with open(file_path, 'r', encoding='utf-8') as f:
            task_data = json.load(f)

        audio_filename = task_data.get('audio_path')
        if not audio_filename:
            return jsonify({'error': 'No audio file saved'}), 404

        audio_path = UPLOADS_DIR / audio_filename
        if not audio_path.exists():
            return jsonify({'error': 'Audio file not found'}), 404

        return send_file(audio_path)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/task/<int:task_num>/audio/<filename>')
def serve_task_audio_file(task_num, filename):
    """Serve a specific audio file from task's audio directory"""
    if task_num not in [2, 3, 4]:
        return jsonify({'error': 'Invalid task number'}), 400

    try:
        audio_dir = get_audio_dir(task_num)
        if not audio_dir:
            return jsonify({'error': 'Invalid task'}), 400

        audio_path = audio_dir / filename
        if not audio_path.exists():
            return jsonify({'error': 'Audio file not found'}), 404

        return send_file(audio_path)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/task/<int:task_num>/evaluate', methods=['POST'])
def evaluate_task(task_num):
    """Evaluate a task response using OpenAI"""
    if task_num not in [2, 3, 4]:
        return jsonify({'error': 'Invalid task number'}), 400

    try:
        from openai import OpenAI

        data = request.get_json()
        api_key = data.get('api_key')

        if not api_key:
            return jsonify({'error': 'API key is required'}), 400

        client = OpenAI(api_key=api_key)

        transcript = data.get('transcript', '')
        word_count = data.get('word_count', 0)
        speaking_time = data.get('speaking_time', 0)
        reading_text = data.get('reading_text', '')
        has_audio = data.get('has_audio', False)

        wpm = (word_count / speaking_time * 60) if speaking_time > 0 else 0

        # Task-specific prompts
        if task_num == 2:
            task_description = "Campus Announcement (Task 2)"
            task_context = "In this task, you read a campus announcement and listened to students discussing it. You needed to explain the students' opinion and their reasons."
        elif task_num == 3:
            task_description = "Academic Concept (Task 3)"
            task_context = "In this task, you read an academic article and listened to a lecture. You needed to explain how the lecture examples illustrate the concept from the reading."
        else:  # task_num == 4
            task_description = "Lecture Summary (Task 4)"
            task_context = "In this task, you listened to an academic lecture. You needed to summarize the main points presented."

        audio_note = ""
        if not has_audio:
            audio_note = "\n\n**NOTE:** The student did not have access to the audio portion. Focus evaluation on language quality (vocabulary, grammar, phrasing) rather than content accuracy."

        reading_context = ""
        if reading_text:
            reading_context = f"\n\n**Reading Passage:**\n{reading_text}"

        prompt = f"""You are an experienced TOEFL speaking evaluator. Evaluate this TOEFL {task_description} response.

**Task Context:** {task_context}{audio_note}{reading_context}

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
   - Was the task addressed appropriately?
   - Were ideas developed with sufficient detail?
   - Suggest what could have been improved

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
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert TOEFL speaking evaluator. Provide detailed, constructive feedback. Do not use any emojis. Return only HTML content without markdown code blocks."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1500
        )

        feedback = response.choices[0].message.content

        # Clean up the feedback
        import re
        feedback = re.sub(r'^```html\s*', '', feedback, flags=re.MULTILINE)
        feedback = re.sub(r'```\s*$', '', feedback, flags=re.MULTILINE)
        feedback = re.sub(r'[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF\U0001F680-\U0001F6FF\U0001F1E0-\U0001F1FF\U00002702-\U000027B0\U000024C2-\U0001F251]+', '', feedback)

        return jsonify({'feedback': feedback})

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
