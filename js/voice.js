// voice.js - Voice Input/Output Functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeVoice();
});

const VoiceController = {
    state: {
        recognition: null,
        synthesis: window.speechSynthesis,
        isListening: false,
        isSpeaking: false
    },

    init: function() {
        // Add voice button to input area
        const voiceBtn = document.createElement('button');
        voiceBtn.className = 'action-button voice-btn';
        voiceBtn.id = 'voiceBtn';
        voiceBtn.title = 'Voice input';
        voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        
        const inputActions = document.querySelector('.input-actions');
        inputActions.insertBefore(voiceBtn, document.getElementById('sendBtn'));
        
        // Add voice output toggle to settings
        this.addVoiceSettings();
        
        // Initialize Web Speech API
        this.initSpeechRecognition();
        
        // Set up event listeners
        voiceBtn.addEventListener('click', () => this.toggleVoiceInput());
    },

    initSpeechRecognition: function() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn('Speech recognition not supported');
            return;
        }
        
        this.state.recognition = new SpeechRecognition();
        this.state.recognition.continuous = false;
        this.state.recognition.interimResults = false;
        this.state.recognition.maxAlternatives = 1;
        
        this.state.recognition.onstart = () => {
            this.state.isListening = true;
            document.getElementById('voiceBtn').classList.add('listening');
            EvilGPT.showNotification('Listening...', 'info');
        };
        
        this.state.recognition.onend = () => {
            this.state.isListening = false;
            document.getElementById('voiceBtn').classList.remove('listening');
        };
        
        this.state.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            document.getElementById('userInput').value = transcript;
            document.getElementById('charCount').textContent = transcript.length;
        };
        
        this.state.recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            EvilGPT.showNotification(`Voice error: ${event.error}`, 'error');
        };
    },

    toggleVoiceInput: function() {
        if (!this.state.recognition) {
            EvilGPT.showNotification('Speech recognition not supported in your browser', 'error');
            return;
        }
        
        if (this.state.isListening) {
            this.state.recognition.stop();
        } else {
            this.state.recognition.start();
        }
    },

    speak: function(text) {
        if (!this.state.synthesis || !window.speechSynthesisUtterance) {
            return;
        }
        
        // Cancel any ongoing speech
        this.state.synthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        utterance.onstart = () => {
            this.state.isSpeaking = true;
        };
        
        utterance.onend = () => {
            this.state.isSpeaking = false;
        };
        
        this.state.synthesis.speak(utterance);
    },

    addVoiceSettings: function() {
        const settingsModal = document.getElementById('settingsModal');
        if (!settingsModal) return;
        
        const settingGroup = document.createElement('div');
        settingGroup.className = 'setting-group';
        settingGroup.innerHTML = `
            <label>
                <input type="checkbox" id="voiceOutputEnabled">
                Enable Voice Output
            </label>
            <div class="voice-test hidden" id="voiceTest">
                <button class="test-btn" id="testVoiceBtn">Test Voice</button>
                <select id="voiceSelect"></select>
            </div>
        `;
        
        settingsModal.querySelector('.modal-body').appendChild(settingGroup);
        
        // Populate voices
        this.populateVoices();
        
        // Voice changes
        this.state.synthesis.onvoiceschanged = () => this.populateVoices();
        
        // Test button
        document.getElementById('testVoiceBtn')?.addEventListener('click', () => {
            this.speak('This is a test of the EvilGPT voice system.');
        });
    },

    populateVoices: function() {
        const voiceSelect = document.getElementById('voiceSelect');
        if (!voiceSelect) return;
        
        voiceSelect.innerHTML = '';
        const voices = this.state.synthesis.getVoices();
        
        voices.forEach(voice => {
            const option = document.createElement('option');
            option.value = voice.name;
            option.textContent = `${voice.name} (${voice.lang})${voice.default ? ' - DEFAULT' : ''}`;
            voiceSelect.appendChild(option);
        });
    }
};

function initializeVoice() {
    VoiceController.init();
}

window.VoiceController = VoiceController;