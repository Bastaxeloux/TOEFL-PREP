class Task2Manager {
    constructor() {
        this.taskNumber = 2;
        this.apiKey = '';
        this.readingText = '';
        this.audioFile = null;
        this.hasAudio = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.recordedBlob = null;
        this.currentPhase = 'setup';
        this.readingTimeLeft = 50;
        this.prepTimeLeft = 30;
        this.speakingTimeLeft = 60;
        this.timers = [];
        this.currentPromptId = null;
        this.prompts = [];

        this.init();
    }

    init() {
        // Setup screen elements
        document.getElementById('startTaskButton').addEventListener('click', () => this.startTask());
        document.getElementById('saveApiKeyBtn').addEventListener('click', () => this.saveApiKey());
        document.getElementById('promptSelect').addEventListener('change', (e) => this.handlePromptSelect(e));
        document.getElementById('newPromptBtn').addEventListener('click', () => this.openModalForNew());
        document.getElementById('editPromptBtn').addEventListener('click', () => this.openModalForEdit());

        // Modal elements
        document.getElementById('modalSaveBtn').addEventListener('click', () => this.savePrompt());
        document.getElementById('modalCancelBtn').addEventListener('click', () => this.closeModal());
        document.getElementById('modalDeleteBtn').addEventListener('click', () => this.deletePrompt());
        document.querySelector('.modal-close').addEventListener('click', () => this.closeModal());
        document.getElementById('modalAudioUpload').addEventListener('change', (e) => this.handleModalAudioUpload(e));
        document.getElementById('modalAudioSelect').addEventListener('change', (e) => this.handleModalAudioSelect(e));

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('promptModal');
            if (e.target === modal) {
                this.closeModal();
            }
        });

        // Practice screen elements
        const continueBtn = document.getElementById('continueWithoutAudio');
        if (continueBtn) {
            continueBtn.addEventListener('click', () => this.startPreparation());
        }

        const resetBtn = document.getElementById('resetButton');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.reset());
        }

        // Load prompts and audio files
        this.loadPromptsList();
        this.loadModalAudioList();
    }

    async loadModalAudioList() {
        try {
            const response = await fetch(`/api/task/${this.taskNumber}/audio/list`);
            const data = await response.json();

            const select = document.getElementById('modalAudioSelect');

            if (data.audio_files && data.audio_files.length > 0) {
                data.audio_files.forEach(file => {
                    const option = document.createElement('option');
                    option.value = file.filename;
                    option.textContent = file.filename;
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.log('Error loading audio list:', error);
        }
    }

    handleModalAudioSelect(event) {
        const filename = event.target.value;
        if (filename) {
            this.audioFile = filename;
            this.hasAudio = true;
            const statusDiv = document.getElementById('modalAudioStatus');
            statusDiv.textContent = `Selected: ${filename}`;
            statusDiv.className = 'audio-status success';
        } else {
            this.audioFile = null;
            this.hasAudio = false;
            const statusDiv = document.getElementById('modalAudioStatus');
            statusDiv.textContent = '';
            statusDiv.className = 'audio-status';
        }
    }

    async loadPromptsList() {
        try {
            const response = await fetch(`/api/task/${this.taskNumber}/prompts/list`);
            const data = await response.json();
            this.prompts = data.prompts || [];

            const select = document.getElementById('promptSelect');
            select.innerHTML = '<option value="">-- Random Prompt --</option>';

            this.prompts.forEach(prompt => {
                const option = document.createElement('option');
                option.value = prompt.id;
                // Create a short preview of the reading text
                const preview = prompt.reading.substring(0, 50).replace(/\n/g, ' ');
                option.textContent = `#${prompt.id}: ${preview}...`;
                select.appendChild(option);
            });

            // Don't auto-select, stay on Random by default
        } catch (error) {
            console.log('Error loading prompts:', error);
        }
    }

    handlePromptSelect(event) {
        const promptId = parseInt(event.target.value);
        if (promptId) {
            const prompt = this.prompts.find(p => p.id === promptId);
            if (prompt) {
                this.currentPromptId = promptId;
                this.readingText = prompt.reading;

                // Display reading text in readonly div
                const readingDisplay = document.getElementById('readingDisplay');
                readingDisplay.textContent = prompt.reading;
                readingDisplay.style.color = '#333';

                // Display associated audio
                const audioDisplay = document.getElementById('audioDisplay');
                if (prompt.audio_file) {
                    audioDisplay.innerHTML = `<strong>Audio file:</strong> ${prompt.audio_file}`;
                    audioDisplay.style.color = '#333';
                    this.audioFile = prompt.audio_file;
                    this.hasAudio = true;
                } else {
                    audioDisplay.innerHTML = '<em>No audio associated with this prompt</em>';
                    audioDisplay.style.color = '#999';
                    this.audioFile = null;
                    this.hasAudio = false;
                }
            }
        } else {
            // Random mode - hide displays
            this.currentPromptId = null;
            this.readingText = '';
            const readingDisplay = document.getElementById('readingDisplay');
            readingDisplay.innerHTML = '<em style="color: #999;">Random mode - content will be selected when you start the task</em>';

            const audioDisplay = document.getElementById('audioDisplay');
            audioDisplay.innerHTML = '<em>Random mode</em>';
            audioDisplay.style.color = '#999';

            this.audioFile = null;
            this.hasAudio = false;
        }
    }

    openModalForNew() {
        // Clear the modal form
        this.currentPromptId = null;
        document.getElementById('modalTitle').textContent = 'New Prompt';
        document.getElementById('modalReadingText').value = '';
        document.getElementById('modalAudioSelect').value = '';
        this.audioFile = null;
        this.hasAudio = false;

        const statusDiv = document.getElementById('modalAudioStatus');
        statusDiv.textContent = '';
        statusDiv.className = 'audio-status';

        // Hide delete button for new prompts
        document.getElementById('modalDeleteBtn').style.display = 'none';

        // Show the modal
        document.getElementById('promptModal').style.display = 'flex';
    }

    openModalForEdit() {
        if (!this.currentPromptId) {
            alert('Please select a prompt to edit');
            return;
        }

        const prompt = this.prompts.find(p => p.id === this.currentPromptId);
        if (!prompt) return;

        // Fill the modal form with current prompt data
        document.getElementById('modalTitle').textContent = 'Edit Prompt';
        document.getElementById('modalReadingText').value = prompt.reading;
        document.getElementById('modalAudioSelect').value = prompt.audio_file || '';
        this.audioFile = prompt.audio_file;
        this.hasAudio = !!prompt.audio_file;

        const statusDiv = document.getElementById('modalAudioStatus');
        if (prompt.audio_file) {
            statusDiv.textContent = `Selected: ${prompt.audio_file}`;
            statusDiv.className = 'audio-status success';
        } else {
            statusDiv.textContent = '';
            statusDiv.className = 'audio-status';
        }

        // Show delete button for editing existing prompts
        document.getElementById('modalDeleteBtn').style.display = 'block';

        // Show the modal
        document.getElementById('promptModal').style.display = 'flex';
    }

    closeModal() {
        document.getElementById('promptModal').style.display = 'none';
    }

    async savePrompt() {
        const button = document.getElementById('modalSaveBtn');
        const originalText = button.textContent;

        button.textContent = 'Saving...';
        button.disabled = true;

        try {
            const readingText = document.getElementById('modalReadingText').value;

            if (!readingText.trim()) {
                alert('Please enter reading text');
                button.textContent = originalText;
                button.disabled = false;
                return;
            }

            const promptData = {
                reading: readingText,
                audio_file: this.audioFile,
                notes: ''
            };

            let response;
            if (this.currentPromptId) {
                // Update existing prompt
                response = await fetch(`/api/task/${this.taskNumber}/prompts/${this.currentPromptId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(promptData)
                });
            } else {
                // Create new prompt
                response = await fetch(`/api/task/${this.taskNumber}/prompts`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(promptData)
                });
            }

            const data = await response.json();

            if (data.success) {
                button.textContent = 'Saved!';

                // Reload the prompts list
                await this.loadPromptsList();

                // Select the saved prompt
                if (data.prompt) {
                    this.currentPromptId = data.prompt.id;
                    document.getElementById('promptSelect').value = data.prompt.id;
                    // Trigger the change event to update the display
                    this.handlePromptSelect({ target: document.getElementById('promptSelect') });
                }

                // Close the modal after a short delay
                setTimeout(() => {
                    this.closeModal();
                    button.textContent = originalText;
                    button.disabled = false;
                }, 1000);
            } else {
                alert('Failed to save prompt');
                button.textContent = originalText;
                button.disabled = false;
            }
        } catch (error) {
            alert(`Error: ${error.message}`);
            button.textContent = originalText;
            button.disabled = false;
        }
    }

    async deletePrompt() {
        if (!this.currentPromptId) {
            alert('Please select a prompt to delete');
            return;
        }

        if (!confirm('Are you sure you want to delete this prompt?')) {
            return;
        }

        try {
            const response = await fetch(`/api/task/${this.taskNumber}/prompts/${this.currentPromptId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                // Close the modal
                this.closeModal();

                // Reload the prompts list
                await this.loadPromptsList();

                // Reset to random mode
                document.getElementById('promptSelect').value = '';
                this.handlePromptSelect({ target: document.getElementById('promptSelect') });

                alert('Prompt deleted successfully!');
            } else {
                alert('Failed to delete prompt');
            }
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    }

    async handleModalAudioUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const statusDiv = document.getElementById('modalAudioStatus');
        statusDiv.textContent = 'Uploading...';
        statusDiv.className = 'audio-status';

        try {
            const formData = new FormData();
            formData.append('audio', file);

            const response = await fetch(`/api/task/${this.taskNumber}/upload_audio`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                statusDiv.textContent = `Upload successful: ${data.filename}`;
                statusDiv.className = 'audio-status success';
                this.audioFile = data.filename;
                this.hasAudio = true;

                // Reload the audio list to include the new file
                const select = document.getElementById('modalAudioSelect');
                select.innerHTML = '<option value="">-- Select existing audio or upload new --</option>';
                await this.loadModalAudioList();

                // Select the newly uploaded file
                select.value = data.filename;
            } else {
                statusDiv.textContent = `Upload failed: ${data.error}`;
                statusDiv.className = 'audio-status error';
            }
        } catch (error) {
            statusDiv.textContent = `Upload error: ${error.message}`;
            statusDiv.className = 'audio-status error';
        }
    }

    async saveApiKey() {
        const apiKey = document.getElementById('apiKey').value;
        const button = document.getElementById('saveApiKeyBtn');
        const originalText = button.textContent;

        button.textContent = 'Saving...';
        button.disabled = true;

        try {
            const response = await fetch('/save_config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ api_key: apiKey })
            });

            const data = await response.json();

            if (data.success) {
                button.textContent = 'Saved!';
                setTimeout(() => {
                    button.textContent = originalText;
                    button.disabled = false;
                }, 2000);
            }
        } catch (error) {
            console.error('Error saving API key:', error);
            button.textContent = 'Error!';
            setTimeout(() => {
                button.textContent = originalText;
                button.disabled = false;
            }, 2000);
        }
    }

    startTask() {
        this.apiKey = document.getElementById('apiKey').value;

        // If in random mode (no prompt selected), pick a random prompt
        if (!this.currentPromptId && this.prompts.length > 0) {
            const randomPrompt = this.prompts[Math.floor(Math.random() * this.prompts.length)];
            this.readingText = randomPrompt.reading;
            this.audioFile = randomPrompt.audio_file;
            this.hasAudio = !!randomPrompt.audio_file;
        }

        if (!this.readingText || !this.readingText.trim()) {
            alert('Please add at least one prompt before starting the task.');
            return;
        }

        // Hide setup screen, show practice screen
        document.getElementById('setupScreen').style.display = 'none';
        document.getElementById('practiceScreen').style.display = 'block';

        // Start with reading phase
        this.startReading();
    }

    startReading() {
        this.currentPhase = 'reading';
        this.readingTimeLeft = 50;

        // Show reading phase
        const readingPhase = document.getElementById('readingPhase');
        readingPhase.style.display = 'block';
        document.getElementById('readingPassage').textContent = this.readingText;

        // Start reading timer
        const readingTimerSpan = document.getElementById('readingTimer');
        const timerInterval = setInterval(() => {
            this.readingTimeLeft--;
            readingTimerSpan.textContent = this.readingTimeLeft;

            if (this.readingTimeLeft <= 0) {
                clearInterval(timerInterval);
                this.finishReading();
            }
        }, 1000);

        this.timers.push(timerInterval);
    }

    finishReading() {
        // Hide reading phase
        document.getElementById('readingPhase').style.display = 'none';

        // Check if audio exists
        if (this.hasAudio) {
            this.startListening();
        } else {
            this.showNoAudio();
        }
    }

    async startListening() {
        this.currentPhase = 'listening';

        // Show listening phase
        const listeningPhase = document.getElementById('listeningPhase');
        listeningPhase.style.display = 'block';

        try {
            // Load and play audio
            const audio = document.getElementById('conversationAudio');

            // Use the selected audio file if available
            if (this.audioFile) {
                audio.src = `/api/task/${this.taskNumber}/audio/${this.audioFile}`;
            } else {
                audio.src = `/api/task/${this.taskNumber}/audio`;
            }

            // When audio ends, start preparation
            audio.addEventListener('ended', () => {
                listeningPhase.style.display = 'none';
                this.startPreparation();
            }, { once: true });

        } catch (error) {
            console.error('Error loading audio:', error);
            this.showNoAudio();
        }
    }

    showNoAudio() {
        const noAudioPhase = document.getElementById('noAudioPhase');
        noAudioPhase.style.display = 'block';
    }

    startPreparation() {
        // Hide listening/no-audio phases
        document.getElementById('listeningPhase').style.display = 'none';
        document.getElementById('noAudioPhase').style.display = 'none';

        this.currentPhase = 'preparation';
        this.prepTimeLeft = 30;

        // Show preparation phase
        const prepPhase = document.getElementById('preparationPhase');
        prepPhase.style.display = 'block';

        // Start prep timer
        const prepTimerSpan = document.getElementById('prepTimer');
        const timerInterval = setInterval(() => {
            this.prepTimeLeft--;
            prepTimerSpan.textContent = this.prepTimeLeft;

            if (this.prepTimeLeft <= 0) {
                clearInterval(timerInterval);
                this.startRecording();
            }
        }, 1000);

        this.timers.push(timerInterval);
    }

    async startRecording() {
        // Hide preparation phase
        document.getElementById('preparationPhase').style.display = 'none';

        this.currentPhase = 'recording';
        this.speakingTimeLeft = 60;

        // Show recording phase
        const recordingPhase = document.getElementById('recordingPhase');
        recordingPhase.style.display = 'block';

        try {
            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.onstop = () => {
                this.recordedBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                this.processRecording();
            };

            this.mediaRecorder.start();

            // Start speaking timer
            const speakingTimerSpan = document.getElementById('speakingTimer');
            const timerInterval = setInterval(() => {
                this.speakingTimeLeft--;
                speakingTimerSpan.textContent = this.speakingTimeLeft;

                if (this.speakingTimeLeft <= 0) {
                    clearInterval(timerInterval);
                    this.stopRecording();
                }
            }, 1000);

            this.timers.push(timerInterval);

        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Error accessing microphone. Please check your permissions.');
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }

        // Hide recording phase
        document.getElementById('recordingPhase').style.display = 'none';
    }

    async processRecording() {
        // Show results phase
        const resultsPhase = document.getElementById('resultsPhase');
        resultsPhase.style.display = 'block';

        const resultsDiv = document.getElementById('transcriptionResults');
        resultsDiv.innerHTML = '<h3>Processing your response...</h3>';

        // Create audio player for recorded audio
        const audioURL = URL.createObjectURL(this.recordedBlob);
        const audioContainer = document.getElementById('recordedAudioContainer');
        audioContainer.innerHTML = `
            <h3>Your Recording</h3>
            <audio controls>
                <source src="${audioURL}" type="audio/webm">
            </audio>
        `;

        // Transcribe audio
        await this.transcribeAudio();
    }

    async transcribeAudio() {
        const resultsDiv = document.getElementById('transcriptionResults');
        resultsDiv.innerHTML = '<h3>Transcribing your response...</h3>';

        try {
            const formData = new FormData();
            formData.append('audio', this.recordedBlob);

            const response = await fetch('/transcribe', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.error) {
                resultsDiv.innerHTML = `<div class="alert alert-error">Transcription error: ${data.error}</div>`;
                return;
            }

            const transcript = data.text;
            const wordCount = transcript.split(/\s+/).filter(w => w.length > 0).length;
            const speakingTime = 60 - this.speakingTimeLeft;

            // Display transcript
            resultsDiv.innerHTML = `
                <div class="transcription-container">
                    <h3>Transcription</h3>
                    <div id="transcriptionText">${transcript}</div>
                    <div class="transcription-stats">
                        <p><strong>Word count:</strong> ${wordCount} words</p>
                        <p><strong>Speaking time:</strong> ${speakingTime} seconds</p>
                    </div>
                </div>
            `;

            // Get AI evaluation if API key is provided
            if (this.apiKey) {
                await this.getAIEvaluation(transcript, wordCount, speakingTime);
            } else {
                resultsDiv.innerHTML += `
                    <div class="alert alert-error">
                        No API key provided. Add your OpenAI API key to receive AI feedback.
                    </div>
                `;
            }

        } catch (error) {
            resultsDiv.innerHTML = `<div class="alert alert-error">Error: ${error.message}</div>`;
        }
    }

    async getAIEvaluation(transcript, wordCount, speakingTime) {
        const resultsDiv = document.getElementById('transcriptionResults');

        // Add loading indicator
        resultsDiv.innerHTML += `
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

        try {
            const response = await fetch(`/api/task/${this.taskNumber}/evaluate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    api_key: this.apiKey,
                    transcript: transcript,
                    word_count: wordCount,
                    speaking_time: speakingTime,
                    reading_text: this.readingText,
                    has_audio: this.hasAudio
                })
            });

            const data = await response.json();

            // Remove loading indicator
            const loadingIndicator = resultsDiv.querySelector('.ai-loading');
            if (loadingIndicator) loadingIndicator.remove();

            if (data.error) {
                resultsDiv.innerHTML += `<div class="alert alert-error">AI evaluation error: ${data.error}</div>`;
                return;
            }

            // Format and display feedback in cards
            const formattedFeedback = this.formatFeedbackIntoCards(data.feedback);
            resultsDiv.innerHTML += `
                <div class="ai-feedback">
                    <h3>AI Feedback & Evaluation</h3>
                    <div class="ai-feedback-content">
                        ${formattedFeedback}
                    </div>
                </div>
            `;

            // Add event listeners to save vocabulary buttons
            const saveButtons = resultsDiv.querySelectorAll('.save-vocab-btn');
            saveButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const card = button.closest('.feedback-card');
                    this.saveVocabularyCard(card);
                });
            });

        } catch (error) {
            const loadingIndicator = resultsDiv.querySelector('.ai-loading');
            if (loadingIndicator) loadingIndicator.remove();
            resultsDiv.innerHTML += `<div class="alert alert-error">Error: ${error.message}</div>`;
        }
    }

    formatFeedbackIntoCards(feedbackHtml) {
        // Parse HTML and split into sections based on h4 tags
        const parser = new DOMParser();
        const doc = parser.parseFromString(feedbackHtml, 'text/html');
        const headers = doc.querySelectorAll('h4');

        if (headers.length === 0) {
            return `<div class="feedback-card">${feedbackHtml}</div>`;
        }

        let cards = '';
        let cardIndex = 0;

        headers.forEach(header => {
            const cardTitle = header.textContent;
            let cardContent = '';

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
            const response = await fetch('/api/vocabulary_cards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: new Date().toISOString(),
                    question: `Task 2 - ${this.readingText.substring(0, 100)}...`,
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

    reset() {
        // Clear all timers
        this.timers.forEach(timer => clearInterval(timer));
        this.timers = [];

        // Reset state
        this.currentPhase = 'setup';
        this.audioChunks = [];
        this.recordedBlob = null;

        // Hide practice screen, show setup screen
        document.getElementById('practiceScreen').style.display = 'none';
        document.getElementById('setupScreen').style.display = 'block';

        // Hide all phases
        document.getElementById('readingPhase').style.display = 'none';
        document.getElementById('listeningPhase').style.display = 'none';
        document.getElementById('noAudioPhase').style.display = 'none';
        document.getElementById('preparationPhase').style.display = 'none';
        document.getElementById('recordingPhase').style.display = 'none';
        document.getElementById('resultsPhase').style.display = 'none';

        // Clear results
        document.getElementById('transcriptionResults').innerHTML = '';
        document.getElementById('recordedAudioContainer').innerHTML = '';
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    new Task2Manager();
});
