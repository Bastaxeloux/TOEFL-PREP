class TOEFLPracticeTool {
    constructor() {
        this.prompts = [];
        this.allPrompts = [];
        this.currentPromptIndex = 0;
        this.preparationTime = 15;
        this.speakingTime = 45;
        this.timerInterval = null;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.recording = false;
        this.apiKey = '';
        this.currentTranscript = '';
        this.currentPromptText = '';

        // Beep sound (base64 encoded WAV)
        this.beepSound = 'UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YWoGAACBhYqFho2RkYiJio2Qj4WIjY+UkYqJi4yNlJKQkZKYl5KQj4yLjIqKiouKiYyNjZKVlZmYl46KiYiFhYSGjIyRlpiZk5CNioiFg4GDgoGHjI+WmpyalI+Ih4GAfXt9goaLlJyjopuWhYF9eXVzcXR3foaRm6GknpKGfHNtaGVrbXJ5gIeOlJqem4+DdmxkYmBnanF6go2WnJ+bl4p7b2NYVVVZYmt2gI+Zn6CblId5aWBWTk5QV2JveIaRm6ChnJeNfnBdT0dDRk1WZnWDkJqioZ+YjX1sV0c8ODxBSVlqfYuXn6KinpOCcl1IOS8uMztIWnB/j5mhpKKckH5rUj8vKCgvPU9hc4STnKWmo5mMdmFKNyssLzU8SmN2iJWepqajl4lyWkEvLzI2PEJTaXqMmqSnpZ+ThHFaQzQ0NztCSlxxgpGdpaiin5GBakU5Njg9Q0lcb4CQm6SlpaCTg2tOPDk5PUVNYnSCkZulpaWdkH9oTjs4OT5GTmV3hJObpaWkmY58ZUs5Njk/R1BneYaUnaWmo5eMeGJJOjY4P0hTan2Kl5+mpqGViXReTz04O0FKWGyAjpiipaSdkYBsVEQ8PD5GUmF0hJOdpaWimI56Z1BBOzxBSlVsfo2Zn6WkoZaJeGROQTs8QktYboGQmqKlpJ2RgW5XRz89P0dRYXKCkpuipKGYjnxrUkQ+PUBIVGl8i5iepKSgl4t6aVJCPT5CSFZrfY6YoKWkoJWIeGZPQT0/Q0tZboCPmqKkpJ6SgW1WRT4+QEhTZXWFk56kpKGZjnxoUkI+PkFKV2x+jJigpKSglol4Z1FCPj9CS1htgI+aoqSknpKBbVZFPj5ASFNldoWTnqSkoZmNfGhRQj4+QUpXbH6MmKCkpKCWiXhmUEI+P0JLWGyAj5qipKSekoBtVkU+PkBIU2V2hZOepKShmY18aFFCPj5BSldsfoyYoKSkoJaJeGZQQj4/QktYbICPmqKkpJ6SgG1WRT4+QEhTZXaFk56kpKGZjXxoUUI+PkFKV2x+jJigpKSglol4ZlBCPj9CS1hsgI+aoqSknpKAbVZFPj5ASFNldoWTnqSkoZmNfGhRQj4+QUpXbH6MmKCkpKCWiXhmUEI+P0JLWGyAj5qipKSekoBtVkU+PkBIU2V2hZOepKShmY18aFFCPj5BSldsfoyYoKSkoJaJeGZQQj4/QktYbICPmqKkpJ6SgG1WRT4+QEhTZXaFk56kpKGZjXxoUUI+PkFKV2x+jJigpKSglol4ZlBCPj9CS1hsgI+aoqSknpKAbVZFPj5ASFNldoWTnqSkoZmNfGhRQj4+QUpXbH6MmKCkpKCWiXhmUEI+P0JLWGyAj5qipKSekoBtVkU+PkBIU2V2hZOepKShmY18aFFCPj5BSldsfoyYoKSkoJaJeGZQQj4/QktYbICPmqKkpJ6SgG1WRT4+QEhTZXaFk56kpKGZjXxoUUI+PkFKV2x+jJigpKSglol4ZlBCPj9CS1hsgI+aoqSknpKAbVZFPj5ASFNldoWTnqSkoZmNfGhRQj4+QUpXbH6MmKCkpKCWiXhmUEI+P0JLWGyAj5qipKSekoA=';

        this.instructionText = "You will now give your opinion about a familiar topic. After you hear the question, you will have 15 seconds to prepare and 45 seconds to speak.";

        this.initializeEventListeners();
        this.requestMicrophonePermission();
        this.updateTotalPromptsCount();
    }

    initializeEventListeners() {
        document.getElementById('saveButton').addEventListener('click', () => this.handleSave());
        document.getElementById('startButton').addEventListener('click', () => this.handleStart());
        document.getElementById('backToMainButton').addEventListener('click', () => this.handleBackToMain());
        document.getElementById('skipInstructionButton').addEventListener('click', () => this.showPracticeScreen());
        document.getElementById('nextButton').addEventListener('click', () => this.handleNext());
        document.getElementById('prevButton').addEventListener('click', () => this.handlePrev());
        document.getElementById('restartButton').addEventListener('click', () => this.handleRestart());
        document.getElementById('resetButton').addEventListener('click', () => this.handleReset());

        // Update total prompts count when textarea changes
        document.getElementById('promptInput').addEventListener('input', () => this.updateTotalPromptsCount());

        // Audio ended event listeners
        document.getElementById('instructionAudio').addEventListener('ended', () => this.showPracticeScreen());
        document.getElementById('promptAudio').addEventListener('ended', () => this.startPreparationPhase());
    }

    handleBackToMain() {
        // Clean up audio state
        this.cleanupAudioState();
        // Return to input screen
        this.showScreen('inputScreen');
    }

    async handleSave() {
        const prompts = document.getElementById('promptInput').value;
        const saveMessage = document.getElementById('saveMessage');

        try {
            const response = await fetch('/save_prompts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompts: prompts })
            });

            const data = await response.json();

            if (data.success) {
                saveMessage.textContent = data.message;
                saveMessage.className = 'save-message success';
            } else {
                saveMessage.textContent = 'Error: ' + data.error;
                saveMessage.className = 'save-message error';
            }

            // Clear message after 3 seconds
            setTimeout(() => {
                saveMessage.textContent = '';
                saveMessage.className = 'save-message';
            }, 3000);

        } catch (error) {
            saveMessage.textContent = 'Error saving prompts: ' + error;
            saveMessage.className = 'save-message error';
        }
    }

    updateTotalPromptsCount() {
        const text = document.getElementById('promptInput').value.trim();
        const prompts = text.split('\n').filter(p => p.trim());
        document.getElementById('totalPrompts').textContent = prompts.length;
    }

    selectRandomPrompts(allPrompts, numToSelect) {
        // Shuffle array and select first N items
        const shuffled = [...allPrompts].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, Math.min(numToSelect, allPrompts.length));
    }

    async requestMicrophonePermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log('Microphone permission granted');
            stream.getTracks().forEach(track => track.stop());
        } catch (err) {
            console.error('Error accessing microphone:', err);
            alert('Microphone access is required for this tool. Please grant permission when prompted.');
        }
    }

    async createAudio(text) {
        try {
            const response = await fetch('/create_audio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: text })
            });

            const data = await response.json();
            if (data.error) {
                console.error('Error creating audio:', data.error);
                return null;
            }

            return 'data:audio/mp3;base64,' + data.audio;
        } catch (error) {
            console.error('Error creating audio:', error);
            return null;
        }
    }

    playBeep() {
        const audio = new Audio('data:audio/wav;base64,' + this.beepSound);
        audio.play();
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.style.display = 'none';
        });
        document.getElementById(screenId).style.display = 'block';
    }

    handleStart() {
        const text = document.getElementById('promptInput').value.trim();
        if (text) {
            // Get all prompts
            this.allPrompts = text.split('\n').filter(p => p.trim()).map(p => p.trim());

            if (this.allPrompts.length > 0) {
                // Get number of questions to practice
                const numPrompts = parseInt(document.getElementById('numPrompts').value);

                // Select random prompts
                this.prompts = this.selectRandomPrompts(this.allPrompts, numPrompts);

                // Get API key if provided
                this.apiKey = document.getElementById('apiKey').value.trim();

                this.currentPromptIndex = 0;
                this.showInstructionScreen();
            } else {
                alert('Please enter at least one prompt.');
            }
        }
    }

    async showInstructionScreen() {
        this.showScreen('instructionScreen');

        // Show warning if no API key provided
        const warningDiv = document.getElementById('noApiWarning');
        if (!this.apiKey || this.apiKey.trim() === '') {
            warningDiv.style.display = 'block';
        } else {
            warningDiv.style.display = 'none';
        }

        const audioSrc = await this.createAudio(this.instructionText);
        if (audioSrc) {
            document.getElementById('instructionAudio').src = audioSrc;
        }
    }

    async showPracticeScreen() {
        this.cleanupAudioState();
        this.showScreen('practiceScreen');

        // Update prompt display
        document.getElementById('currentPromptNumber').textContent = this.currentPromptIndex + 1;
        document.getElementById('totalSelectedPrompts').textContent = this.prompts.length;
        document.getElementById('currentPrompt').textContent = this.prompts[this.currentPromptIndex];

        // Hide timer and phase indicator initially
        document.getElementById('timerContainer').style.display = 'none';
        document.getElementById('phaseIndicator').style.display = 'none';
        document.getElementById('recordingIndicator').classList.remove('active');

        // Update button states
        document.getElementById('prevButton').disabled = this.currentPromptIndex === 0;
        document.getElementById('nextButton').disabled = this.currentPromptIndex === this.prompts.length - 1;
        document.getElementById('resetButton').disabled = false;
        document.getElementById('restartButton').disabled = false;

        // Clear previous recordings
        document.getElementById('recordedAudioContainer').innerHTML = '';
        document.getElementById('transcriptionResults').innerHTML = '';

        // Play prompt audio
        const audioSrc = await this.createAudio(this.prompts[this.currentPromptIndex]);
        if (audioSrc) {
            document.getElementById('promptAudio').src = audioSrc;
        }
    }

    startPreparationPhase() {
        this.playBeep();
        document.getElementById('timerContainer').style.display = 'flex';
        document.getElementById('timerLabel').textContent = 'Preparation Time';
        this.startTimer(this.preparationTime, () => this.startSpeakingPhase());
    }

    startSpeakingPhase() {
        this.playBeep();
        document.getElementById('timerLabel').textContent = 'Speaking Time';
        this.startRecording();
        this.startTimer(this.speakingTime, () => this.endSpeakingPhase());
    }

    endSpeakingPhase() {
        this.playBeep();
        this.stopRecording();
    }

    startTimer(duration, callback) {
        let timeLeft = duration;
        document.getElementById('timerValue').textContent = timeLeft;

        this.timerInterval = setInterval(() => {
            timeLeft--;
            document.getElementById('timerValue').textContent = timeLeft;

            if (timeLeft <= 0) {
                clearInterval(this.timerInterval);
                callback();
            }
        }, 1000);
    }

    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.onstop = () => {
                this.handleRecordingStopped();
            };

            this.mediaRecorder.start();
            this.recording = true;
            document.getElementById('recordingIndicator').classList.add('active');

        } catch (err) {
            console.error('Error starting recording:', err);
            alert('Error accessing microphone. Please ensure microphone permissions are granted.');
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
            this.recording = false;
            document.getElementById('recordingIndicator').classList.remove('active');

            // Stop all tracks
            if (this.mediaRecorder.stream) {
                this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
            }
        }
    }

    async handleRecordingStopped() {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });

        // Create container for audio player and download button
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.gap = '10px';
        container.style.justifyContent = 'center';
        container.style.marginTop = '20px';

        // Create audio player
        const audioPlayer = document.createElement('audio');
        audioPlayer.src = URL.createObjectURL(audioBlob);
        audioPlayer.controls = true;
        container.appendChild(audioPlayer);

        // Create download section
        const downloadSection = document.createElement('div');
        downloadSection.id = 'downloadSection';
        downloadSection.innerHTML = '<div class="progress-status processing">Converting to MP3...</div>';
        container.appendChild(downloadSection);

        document.getElementById('recordedAudioContainer').innerHTML = '';
        document.getElementById('recordedAudioContainer').appendChild(container);

        // Show transcription progress
        const transcriptionDiv = document.getElementById('transcriptionResults');
        transcriptionDiv.className = 'progress-container';
        transcriptionDiv.innerHTML = '<div class="progress-status processing">Preparing audio for transcription...</div>';

        // Convert to MP3 and transcribe
        await this.convertToMP3(audioBlob);
        await this.transcribeAudio(audioBlob);
    }

    async convertToMP3(audioBlob) {
        try {
            const formData = new FormData();
            formData.append('audio', audioBlob);

            const response = await fetch('/convert_to_mp3', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            if (data.error) {
                document.getElementById('downloadSection').innerHTML =
                    `<div style="color: red;">Error converting audio: ${data.error}</div>`;
                return;
            }

            // Create download button
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'download-btn';
            downloadBtn.textContent = 'Download MP3';
            downloadBtn.onclick = () => {
                const link = document.createElement('a');
                link.href = 'data:audio/mp3;base64,' + data.mp3;
                link.download = 'recording.mp3';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            };

            document.getElementById('downloadSection').innerHTML = '';
            document.getElementById('downloadSection').appendChild(downloadBtn);

        } catch (error) {
            console.error('Error converting to MP3:', error);
            document.getElementById('downloadSection').innerHTML =
                `<div style="color: red;">Error converting audio: ${error}</div>`;
        }
    }

    async transcribeAudio(audioBlob) {
        try {
            const transcriptionDiv = document.getElementById('transcriptionResults');
            transcriptionDiv.innerHTML = '<div class="progress-status processing">Performing transcription in English...</div>';

            const formData = new FormData();
            formData.append('audio', audioBlob);

            const response = await fetch('/transcribe', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            if (data.error) {
                transcriptionDiv.innerHTML =
                    `<div class="transcription-container"><p style="color: red;">Error during transcription: ${data.error}</p></div>`;
                return;
            }

            const wpm = (data.word_count / this.speakingTime * 60).toFixed(1);

            // Store transcript for LLM evaluation
            this.currentTranscript = data.transcript;
            this.currentPromptText = this.prompts[this.currentPromptIndex];

            transcriptionDiv.innerHTML = `
                <div class="transcription-container">
                    <h3>Transcription Results</h3>
                    <div class="transcript-text">${data.transcript}</div>
                    <div class="transcript-stats">
                        Total words: ${data.word_count}<br>
                        Average words per minute: ${wpm}
                    </div>
                </div>
            `;

            // If API key is provided, request AI feedback
            if (this.apiKey) {
                await this.getAIFeedback(this.currentPromptText, data.transcript, data.word_count);
            }

        } catch (error) {
            console.error('Error transcribing audio:', error);
            document.getElementById('transcriptionResults').innerHTML =
                `<div class="transcription-container"><p style="color: red;">Error processing audio: ${error}</p></div>`;
        }
    }

    formatFeedbackIntoCards(feedbackHtml) {
        // Parse HTML and split into sections based on h4 tags
        const parser = new DOMParser();
        const doc = parser.parseFromString(feedbackHtml, 'text/html');

        // Get all h4 elements (section titles)
        const headers = doc.querySelectorAll('h4');

        if (headers.length === 0) {
            // If no h4 headers, return as is wrapped in a single card
            return `<div class="feedback-card">${feedbackHtml}</div>`;
        }

        let cards = '';
        let cardIndex = 0;
        headers.forEach(header => {
            const cardTitle = header.textContent;
            let cardContent = '';

            // Collect all content after this h4 until the next h4
            let nextElement = header.nextElementSibling;
            while (nextElement && nextElement.tagName !== 'H4') {
                cardContent += nextElement.outerHTML;
                nextElement = nextElement.nextElementSibling;
            }

            // Add "Save to Vocabulary" button for Language & Vocabulary section
            let extraButton = '';
            if (cardTitle.toLowerCase().includes('vocabulary') || cardTitle.toLowerCase().includes('language')) {
                extraButton = `<button class="btn btn-success save-vocab-btn" data-card-index="${cardIndex}" style="margin-top: 15px; width: 100%;">Save to Vocabulary Flashcards</button>`;
            }

            cards += `
                <div class="feedback-card" data-section="${cardTitle}" data-card-index="${cardIndex}">
                    <h4>${cardTitle}</h4>
                    ${cardContent}
                    ${extraButton}
                </div>
            `;
            cardIndex++;
        });

        return cards;
    }

    async saveVocabularyCard(cardElement) {
        // Get the card content (without the button)
        const cardTitle = cardElement.querySelector('h4').textContent;
        const contentElements = Array.from(cardElement.childNodes).filter(
            node => node.tagName !== 'H4' && !node.classList?.contains('save-vocab-btn')
        );

        let content = '';
        contentElements.forEach(node => {
            if (node.outerHTML) content += node.outerHTML;
            else if (node.textContent?.trim()) content += node.textContent;
        });

        const button = cardElement.querySelector('.save-vocab-btn');
        button.textContent = 'Saving...';
        button.disabled = true;

        try {
            // Save to server
            const response = await fetch('/api/vocabulary_cards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: new Date().toISOString(),
                    question: this.currentPromptText,
                    title: cardTitle,
                    content: content
                })
            });

            const data = await response.json();

            if (data.success) {
                button.textContent = 'Saved!';
                setTimeout(() => {
                    button.textContent = 'Save to Vocabulary Flashcards';
                    button.disabled = false;
                }, 2000);
            } else {
                button.textContent = 'Error!';
                setTimeout(() => {
                    button.textContent = 'Save to Vocabulary Flashcards';
                    button.disabled = false;
                }, 2000);
            }
        } catch (error) {
            console.error('Error saving vocabulary card:', error);
            button.textContent = 'Error!';
            setTimeout(() => {
                button.textContent = 'Save to Vocabulary Flashcards';
                button.disabled = false;
            }, 2000);
        }
    }

    async getAIFeedback(question, transcript, wordCount) {
        try {
            const transcriptionDiv = document.getElementById('transcriptionResults');

            // Add elegant loading indicator for AI feedback
            transcriptionDiv.innerHTML += `
                <div class="ai-loading">
                    <div class="ai-loading-content">
                        <div class="ai-loading-text">Analyzing your response...</div>
                        <div class="loading-dots">
                            <div class="loading-dot"></div>
                            <div class="loading-dot"></div>
                            <div class="loading-dot"></div>
                        </div>
                    </div>
                </div>
            `;

            const response = await fetch('/evaluate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    api_key: this.apiKey,
                    question: question,
                    transcript: transcript,
                    word_count: wordCount,
                    speaking_time: this.speakingTime
                })
            });

            const data = await response.json();

            if (data.error) {
                transcriptionDiv.innerHTML += `<div class="ai-feedback"><p style="color: red;">AI Feedback Error: ${data.error}</p></div>`;
                return;
            }

            // Remove loading indicator and display AI feedback
            const loadingIndicator = transcriptionDiv.querySelector('.ai-loading');
            if (loadingIndicator) loadingIndicator.remove();

            // Parse the feedback and wrap sections in cards
            const formattedFeedback = this.formatFeedbackIntoCards(data.feedback);

            transcriptionDiv.innerHTML += `
                <div class="ai-feedback">
                    <h3>AI Feedback & Evaluation</h3>
                    <div class="ai-feedback-content">
                        ${formattedFeedback}
                    </div>
                </div>
            `;

            // Add event listeners to save vocabulary buttons
            const saveButtons = transcriptionDiv.querySelectorAll('.save-vocab-btn');
            saveButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const card = button.closest('.feedback-card');
                    this.saveVocabularyCard(card);
                });
            });

        } catch (error) {
            console.error('Error getting AI feedback:', error);
            const transcriptionDiv = document.getElementById('transcriptionResults');
            transcriptionDiv.innerHTML += `<div class="ai-feedback"><p style="color: red;">Error getting AI feedback: ${error}</p></div>`;
        }
    }

    handleNext() {
        if (this.currentPromptIndex < this.prompts.length - 1) {
            this.cleanupAudioState();
            this.currentPromptIndex++;
            this.showPracticeScreen();
        }
    }

    handlePrev() {
        if (this.currentPromptIndex > 0) {
            this.cleanupAudioState();
            this.currentPromptIndex--;
            this.showPracticeScreen();
        }
    }

    handleRestart() {
        this.cleanupAudioState();
        this.showPracticeScreen();
    }

    handleReset() {
        this.cleanupAudioState();
        this.prompts = [];
        this.currentPromptIndex = 0;
        this.showScreen('inputScreen');
    }

    cleanupAudioState() {
        // Stop and clear all audio
        document.querySelectorAll('audio').forEach(audio => {
            audio.pause();
            audio.src = '';
        });

        // Stop recording if active
        this.stopRecording();

        // Clear timer
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        // Clear recording indicator
        document.getElementById('recordingIndicator').classList.remove('active');

        // Reset recorder
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.recording = false;
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TOEFLPracticeTool();
});
