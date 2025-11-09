class Task6Manager {
    constructor() {
        this.taskNumber = 6;
        this.apiKey = '';
        this.discussionData = null;
        this.writtenText = '';
        this.currentPhase = 'setup';
        this.readingTimeLeft = 180; // 3 minutes
        this.writingTimeLeft = 600; // 10 minutes
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

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('promptModal');
            if (e.target === modal) {
                this.closeModal();
            }
            const discussionModal = document.getElementById('discussionModal');
            if (e.target === discussionModal) {
                discussionModal.style.display = 'none';
            }
        });

        // Close discussion modal button
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
        const resetBtn = document.getElementById('resetButton');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.reset());
        }

        // Show discussion button during writing
        const showDiscussionBtn = document.getElementById('showDiscussionBtn');
        if (showDiscussionBtn) {
            showDiscussionBtn.addEventListener('click', () => this.showDiscussion());
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

        // Load prompts
        this.loadPromptsList();
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
                // Create a short preview of the professor's question
                const preview = prompt.professor_question ? prompt.professor_question.substring(0, 50).replace(/\n/g, ' ') : 'Untitled';
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
                this.discussionData = prompt;

                // Display discussion in readonly div
                const discussionDisplay = document.getElementById('discussionDisplay');
                discussionDisplay.innerHTML = this.formatDiscussionHTML(prompt);
                discussionDisplay.style.color = '#333';
            }
        } else {
            // Random mode - hide displays
            this.currentPromptId = null;
            this.discussionData = null;
            const discussionDisplay = document.getElementById('discussionDisplay');
            discussionDisplay.innerHTML = '<em style="color: #999;">Random mode - content will be selected when you start the task</em>';
        }
    }

    formatDiscussionHTML(data) {
        return `
            <div style="margin-bottom: 20px;">
                <p style="font-weight: bold; color: #2c5282; margin-bottom: 10px;">${data.professor_name || 'Professor'}:</p>
                <p style="margin-left: 20px; line-height: 1.6;">${data.professor_question || ''}</p>
            </div>
            <div style="margin-bottom: 15px;">
                <p style="font-weight: bold; color: #3d6ba8; margin-bottom: 8px;">${data.student1_name || 'Student 1'}:</p>
                <p style="margin-left: 20px; line-height: 1.6; color: #555;">${data.student1_response || ''}</p>
            </div>
            <div>
                <p style="font-weight: bold; color: #3d6ba8; margin-bottom: 8px;">${data.student2_name || 'Student 2'}:</p>
                <p style="margin-left: 20px; line-height: 1.6; color: #555;">${data.student2_response || ''}</p>
            </div>
        `;
    }

    openModalForNew() {
        // Clear the modal form
        this.currentPromptId = null;
        document.getElementById('modalTitle').textContent = 'New Prompt';
        document.getElementById('modalProfessorName').value = '';
        document.getElementById('modalProfessorQuestion').value = '';
        document.getElementById('modalStudent1Name').value = '';
        document.getElementById('modalStudent1Response').value = '';
        document.getElementById('modalStudent2Name').value = '';
        document.getElementById('modalStudent2Response').value = '';

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
        document.getElementById('modalProfessorName').value = prompt.professor_name || '';
        document.getElementById('modalProfessorQuestion').value = prompt.professor_question || '';
        document.getElementById('modalStudent1Name').value = prompt.student1_name || '';
        document.getElementById('modalStudent1Response').value = prompt.student1_response || '';
        document.getElementById('modalStudent2Name').value = prompt.student2_name || '';
        document.getElementById('modalStudent2Response').value = prompt.student2_response || '';

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
            const professorName = document.getElementById('modalProfessorName').value;
            const professorQuestion = document.getElementById('modalProfessorQuestion').value;
            const student1Name = document.getElementById('modalStudent1Name').value;
            const student1Response = document.getElementById('modalStudent1Response').value;
            const student2Name = document.getElementById('modalStudent2Name').value;
            const student2Response = document.getElementById('modalStudent2Response').value;

            if (!professorQuestion.trim()) {
                alert('Please enter the professor\'s question');
                button.textContent = originalText;
                button.disabled = false;
                return;
            }

            const promptData = {
                professor_name: professorName || 'Professor',
                professor_question: professorQuestion,
                student1_name: student1Name || 'Student 1',
                student1_response: student1Response,
                student2_name: student2Name || 'Student 2',
                student2_response: student2Response
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
            this.discussionData = randomPrompt;
        }

        if (!this.discussionData || !this.discussionData.professor_question) {
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

        const discussionContent = document.getElementById('discussionContent');
        discussionContent.innerHTML = this.formatDiscussionHTML(this.discussionData);

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

        // Start writing immediately
        this.startWriting();
    }

    startWriting() {
        this.currentPhase = 'writing';
        this.writingTimeLeft = 600; // 10 minutes

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

    showDiscussion() {
        // Show the discussion in a modal
        const modal = document.getElementById('discussionModal');
        const content = document.getElementById('modalDiscussionContent');
        content.innerHTML = this.formatDiscussionHTML(this.discussionData);
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
                    discussion_data: this.discussionData,
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
                        <p><em>Minimum: 100 words</em></p>
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
        document.getElementById('writingPhase').style.display = 'none';
        document.getElementById('resultsPhase').style.display = 'none';

        // Reset timers
        this.readingTimeLeft = 180;
        this.writingTimeLeft = 600;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new Task6Manager();
});
