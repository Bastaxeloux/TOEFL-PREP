class Task5Manager {
    constructor() {
        this.taskNumber = 5;
        this.apiKey = '';
        this.readingText = '';
        this.audioFile = null;
        this.hasAudio = false;
        this.writtenText = '';
        this.currentPhase = 'setup';
        this.readingTimeLeft = 180; // 3 minutes
        this.writingTimeLeft = 1200; // 20 minutes
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
            const readingModal = document.getElementById('readingModal');
            if (e.target === readingModal) {
                readingModal.style.display = 'none';
            }
        });

        // Close reading modal button
        const closeButtons = document.querySelectorAll('.modal-close');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const modalId = this.getAttribute('data-modal');
                if (modalId) {
                    document.getElementById(modalId).style.display = 'none';
                }
            });
        });

        // Practice screen elements
        const continueBtn = document.getElementById('continueWithoutAudio');
        if (continueBtn) {
            continueBtn.addEventListener('click', () => this.startWriting());
        }

        const resetBtn = document.getElementById('resetButton');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.reset());
        }

        // Show reading button during writing
        const showReadingBtn = document.getElementById('showReadingBtn');
        if (showReadingBtn) {
            showReadingBtn.addEventListener('click', () => this.showReading());
        }

        // Submit writing button
        const submitBtn = document.getElementById('submitWritingBtn');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.submitWriting());
        }

        // Word count tracker
        const writingArea = document.getElementById('writingArea');
        if (writingArea) {
            writingArea.addEventListener('input', () => this.updateWordCount());
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
        this.readingTimeLeft = 180;

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
            const audio = document.getElementById('lectureAudio');

            // Use the selected audio file if available
            if (this.audioFile) {
                audio.src = `/api/task/${this.taskNumber}/audio/${this.audioFile}`;
            } else {
                audio.src = `/api/task/${this.taskNumber}/audio`;
            }

            // When audio ends, start writing
            audio.addEventListener('ended', () => {
                listeningPhase.style.display = 'none';
                this.startWriting();
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

    startWriting() {
        // Hide any previous phase
        document.getElementById('listeningPhase').style.display = 'none';
        document.getElementById('noAudioPhase').style.display = 'none';

        this.currentPhase = 'writing';
        this.writingTimeLeft = 1200; // 20 minutes

        // Show writing phase
        const writingPhase = document.getElementById('writingPhase');
        writingPhase.style.display = 'block';

        // Clear the textarea
        document.getElementById('writingArea').value = '';
        this.updateWordCount();

        // Start writing timer
        const writingTimerSpan = document.getElementById('writingTimer');
        const timerInterval = setInterval(() => {
            this.writingTimeLeft--;
            const minutes = Math.floor(this.writingTimeLeft / 60);
            const seconds = this.writingTimeLeft % 60;
            writingTimerSpan.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

            if (this.writingTimeLeft <= 0) {
                clearInterval(timerInterval);
                this.submitWriting();
            }
        }, 1000);

        this.timers.push(timerInterval);
    }

    updateWordCount() {
        const text = document.getElementById('writingArea').value;
        const words = text.trim().split(/\s+/).filter(w => w.length > 0);
        document.getElementById('wordCount').textContent = words.length;
    }

    showReading() {
        // Show the reading in a modal
        const modal = document.getElementById('readingModal');
        const content = document.getElementById('modalReadingContent');
        content.textContent = this.readingText;
        modal.style.display = 'flex';
    }

    async submitWriting() {
        // Stop all timers
        this.timers.forEach(timer => clearInterval(timer));
        this.timers = [];

        // Get the written text
        this.writtenText = document.getElementById('writingArea').value;

        if (!this.writtenText.trim()) {
            alert('Please write your response before submitting.');
            return;
        }

        // Hide writing phase, show results phase
        document.getElementById('writingPhase').style.display = 'none';
        const resultsPhase = document.getElementById('resultsPhase');
        resultsPhase.style.display = 'block';

        // Display the submitted text
        document.getElementById('submittedText').textContent = this.writtenText;

        // Show evaluation loading
        const evaluationDiv = document.getElementById('evaluationResults');
        evaluationDiv.innerHTML = '<div class="loading">Evaluating your response...</div>';

        // Start evaluation
        await this.evaluateWriting();
    }

    async evaluateWriting() {
        const evaluationDiv = document.getElementById('evaluationResults');

        try {
            // Count words
            const words = this.writtenText.trim().split(/\s+/).filter(w => w.length > 0);
            const wordCount = words.length;

            const response = await fetch(`/api/task/${this.taskNumber}/evaluate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: this.writtenText,
                    word_count: wordCount,
                    reading_text: this.readingText,
                    api_key: this.apiKey
                })
            });

            const data = await response.json();

            if (data.success) {
                // Display evaluation
                let html = `
                    <div class="stats-section">
                        <h3>Statistics</h3>
                        <p><strong>Word Count:</strong> ${wordCount} words</p>
                        <p><em>Target: 150-225 words</em></p>
                    </div>
                `;

                if (data.evaluation) {
                    html += `
                        <div class="evaluation-section">
                            <h3>AI Evaluation</h3>
                            ${this.formatEvaluation(data.evaluation)}
                        </div>
                    `;
                }

                evaluationDiv.innerHTML = html;
            } else {
                evaluationDiv.innerHTML = `
                    <div class="error-section">
                        <h3>Evaluation Error</h3>
                        <p>Could not evaluate your response. ${data.error || 'Please check your API key.'}</p>
                        <div class="stats-section">
                            <p><strong>Word Count:</strong> ${wordCount} words</p>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            evaluationDiv.innerHTML = `
                <div class="error-section">
                    <h3>Error</h3>
                    <p>An error occurred during evaluation: ${error.message}</p>
                </div>
            `;
        }
    }

    formatEvaluation(text) {
        // Convert markdown-style text to HTML
        let html = text;

        // Convert headers
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/^### (.+)$/gm, '<h4>$1</h4>');
        html = html.replace(/^## (.+)$/gm, '<h3>$1</h3>');

        // Convert bullet points
        const lines = html.split('\n');
        let inList = false;
        let formatted = [];

        for (let line of lines) {
            if (line.trim().startsWith('- ')) {
                if (!inList) {
                    formatted.push('<ul>');
                    inList = true;
                }
                formatted.push('<li>' + line.trim().substring(2) + '</li>');
            } else {
                if (inList) {
                    formatted.push('</ul>');
                    inList = false;
                }
                if (line.trim()) {
                    formatted.push('<p>' + line + '</p>');
                }
            }
        }

        if (inList) {
            formatted.push('</ul>');
        }

        return formatted.join('\n');
    }

    reset() {
        // Stop all timers
        this.timers.forEach(timer => clearInterval(timer));
        this.timers = [];

        // Reset state
        this.writtenText = '';
        this.currentPhase = 'setup';

        // Hide practice screen, show setup screen
        document.getElementById('practiceScreen').style.display = 'none';
        document.getElementById('setupScreen').style.display = 'block';

        // Hide all phases in practice screen
        document.getElementById('readingPhase').style.display = 'none';
        document.getElementById('listeningPhase').style.display = 'none';
        document.getElementById('noAudioPhase').style.display = 'none';
        document.getElementById('writingPhase').style.display = 'none';
        document.getElementById('resultsPhase').style.display = 'none';

        // Reset timers
        this.readingTimeLeft = 180;
        this.writingTimeLeft = 1200;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new Task5Manager();
});
