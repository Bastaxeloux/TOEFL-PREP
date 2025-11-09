# Data Directory Structure

This directory contains all user data for the TOEFL practice application.

## Structure

```
data/
├── task2/
│   ├── prompts.json          # Campus Announcement prompts
│   └── audio/                # Uploaded conversation audios
├── task3/
│   ├── prompts.json          # Academic Concept prompts
│   └── audio/                # Uploaded lecture audios
├── task4/
│   ├── prompts.json          # Lecture Summary prompts
│   └── audio/                # Uploaded lecture audios
├── uploads/                  # General audio uploads directory
├── config.json               # App configuration (API key, etc.)
└── vocabulary_cards.json     # Saved vocabulary flashcards
```

**Note:** Task 1 (Independent Speaking) uses a plain text file `prompts.txt` in the root directory, with one prompt per line.

## JSON Format

### Task 2 (Campus Announcement)
```json
{
  "prompts": [
    {
      "id": 1,
      "reading": "The reading passage text.\nCan have multiple paragraphs.",
      "audio_file": "conversation1.mp3",
      "notes": "Optional notes about the audio"
    }
  ]
}
```

### Task 3 (Academic Concept)
```json
{
  "prompts": [
    {
      "id": 1,
      "reading": "Academic concept definition.\nMultiple paragraphs allowed.",
      "audio_file": "lecture1.mp3",
      "notes": "Optional notes about the lecture"
    }
  ]
}
```

### Task 4 (Lecture Summary)
```json
{
  "prompts": [
    {
      "id": 1,
      "audio_file": "lecture1.mp3",
      "notes": "Optional notes about lecture content",
      "topic": "Lecture topic"
    }
  ]
}
```

## Adding New Prompts

1. Open the appropriate `prompts.json` file
2. Add a new object to the `prompts` array
3. Give it a unique `id`
4. Fill in the required fields
5. For audio files, place them in the corresponding `audio/` directory
6. Reference the audio filename in the `audio_file` field

## Audio Files

- Supported formats: MP3, WAV, M4A
- Place files in the task-specific `audio/` directory
- Reference the filename (not full path) in the JSON

Example:
- File location: `data/task2/audio/conversation1.mp3`
- JSON reference: `"audio_file": "conversation1.mp3"`
