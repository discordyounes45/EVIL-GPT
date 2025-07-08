// EvilGPT Complete Chat Implementation with Multi-Language File Support
document.addEventListener('DOMContentLoaded', function() {
    initializeChat();
});

const EvilGPT = {
    state: {
        currentChatId: 'default_' + Date.now(),
        messageHistory: [],
        isTyping: false,
        ollamaConnected: false,
        ollamaRetryCount: 0,
        maxRetries: 3,
        activeGeneration: null,
        knowledgeDatabase: null,
        lastSearchResults: null,
        settings: {
            theme: 'dark',
            fontSize: 16,
            sounds: true,
            autoScroll: true,
            ollamaEndpoint: 'http://localhost:11434',
            model: 'evilgpt:latest',
            temperature: 0.85,
            maxTokens: 2048,
            languageSupport: {
                extensions: {
                    '.js': 'JavaScript',
                    '.py': 'Python',
                    '.java': 'Java',
                    '.c': 'C',
                    '.cpp': 'C++',
                    '.cs': 'C#',
                    '.go': 'Go',
                    '.rb': 'Ruby',
                    '.php': 'PHP',
                    '.swift': 'Swift',
                    '.kt': 'Kotlin',
                    '.ts': 'TypeScript',
                    '.sh': 'Bash',
                    '.pl': 'Perl',
                    '.r': 'R',
                    '.m': 'MATLAB/Objective-C',
                    '.scala': 'Scala',
                    '.hs': 'Haskell',
                    '.lua': 'Lua',
                    '.sql': 'SQL',
                    '.html': 'HTML',
                    '.css': 'CSS',
                    '.json': 'JSON',
                    '.xml': 'XML',
                    '.yaml': 'YAML',
                    '.toml': 'TOML',
                    '.md': 'Markdown'
                }
            }
        }
    },

    initializeChat: function() {
        this.setupEventListeners();
        this.checkOllamaConnection();
        this.loadKnowledgeDatabase();
        this.applyTheme();
        this.updateUIState();
        this.createNewChat();
    },

    async loadKnowledgeDatabase() {
        try {
            const response = await fetch('training_dataset.json');
            this.state.knowledgeDatabase = await response.json();
            console.log("Knowledge database loaded successfully");
            this.updateDatasetStatus('loaded');
        } catch (error) {
            console.error("Error loading knowledge database:", error);
            this.updateDatasetStatus('missing');
        }
    },

    updateDatasetStatus(status) {
        const statusElement = document.createElement('div');
        statusElement.id = 'datasetStatus';
        
        let className = 'dataset-status ';
        let content = '<i class="fas fa-database" style="margin-right: 6px;"></i>';
        
        switch(status) {
            case 'loaded':
                className += 'dataset-loaded';
                content += 'Database Loaded';
                break;
            case 'missing':
                className += 'dataset-missing';
                content += 'Database Missing';
                break;
            default:
                className += 'dataset-loading';
                content += 'Loading Database';
        }
        
        statusElement.className = className;
        statusElement.innerHTML = content;
        
        const header = document.querySelector('.chat-header');
        const existingStatus = document.getElementById('datasetStatus');
        if (existingStatus) {
            header.replaceChild(statusElement, existingStatus);
        } else {
            header.appendChild(statusElement);
        }
    },

    searchKnowledgeDatabase(query, limit = 3) {
        if (!this.state.knowledgeDatabase || !Array.isArray(this.state.knowledgeDatabase)) return [];
        
        const results = this.state.knowledgeDatabase.filter(item => {
            const content = `${item.title || ''} ${item.content || ''}`.toLowerCase();
            return content.includes(query.toLowerCase());
        });
        
        results.sort((a, b) => {
            const aContent = `${a.title || ''} ${a.content || ''}`.toLowerCase();
            const bContent = `${b.title || ''} ${b.content || ''}`.toLowerCase();
            const aScore = (aContent.split(query.toLowerCase()).length - 1);
            const bScore = (bContent.split(query.toLowerCase()).length - 1);
            return bScore - aScore;
        });
        
        return results.slice(0, limit);
    },

    setupEventListeners: function() {
        document.getElementById('sendBtn').addEventListener('click', () => this.handleSendMessage());
        
        const userInput = document.getElementById('userInput');
        userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (e.ctrlKey) {
                    this.triggerSearch();
                } else {
                    this.handleSendMessage();
                }
            }
        });

        userInput.addEventListener('input', () => {
            const count = userInput.value.length;
            document.getElementById('charCount').textContent = count;
            document.getElementById('sendBtn').disabled = count === 0 || count > 4000;
            
            userInput.style.height = 'auto';
            userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
        });

        document.getElementById('newChatBtn').addEventListener('click', () => this.createNewChat());
        document.getElementById('settingsBtn').addEventListener('click', () => this.openSettings());
        document.getElementById('searchBtn').addEventListener('click', () => this.triggerSearch());
    },

    async handleSendMessage() {
        const userInput = document.getElementById('userInput');
        const message = userInput.value.trim();
        
        if (!message || this.state.isTyping) return;

        if (message.startsWith('/data')) {
            if (!this.state.knowledgeDatabase) {
                this.addMessage('assistant', "Error: Knowledge database not loaded.");
                userInput.value = '';
                return;
            }

            const query = message.substring(5).trim();
            if (!query) {
                this.addMessage('assistant', "Please provide a search query after /data.");
                userInput.value = '';
                return;
            }

            const searchResults = this.searchKnowledgeDatabase(query, 5);
            if (searchResults.length === 0) {
                this.addMessage('assistant', `No results found for "${query}"`);
                userInput.value = '';
                return;
            }

            let responseText = `Results for "${query}":\n\n`;
            searchResults.forEach((item, index) => {
                responseText += `• ${item.title || 'Untitled'}\n`;
                responseText += `${item.content.substring(0, 200)}${item.content.length > 200 ? '...' : ''}\n\n`;
            });
            responseText += `\nAsk follow-up questions about these results.`;

            this.addMessage('assistant', responseText);
            userInput.value = '';
            return;
        }

        this.addMessage('user', message);
        userInput.value = '';
        document.getElementById('charCount').textContent = '0';

        if (!this.state.ollamaConnected) {
            this.showNotification('Connecting to Ollama...', 'warning');
            await this.checkOllamaConnection();
            
            if (!this.state.ollamaConnected) {
                this.addMessage('assistant', "Error: Unable to connect to Ollama.");
                return;
            }
        }

        this.generateAIResponse(message);
    },

    async triggerSearch() {
        const userInput = document.getElementById('userInput');
        const query = userInput.value.trim();
        if (!query || this.state.isTyping) return;

        const searchIndicator = document.createElement('div');
        searchIndicator.className = 'message assistant';
        searchIndicator.innerHTML = `
            <div class="message-icon"><i class="fas fa-skull"></i></div>
            <div class="message-content">
                <div class="loading">
                    <div class="loading-dot"></div>
                    <div class="loading-dot"></div>
                    <div class="loading-dot"></div>
                    <span style="margin-left: 8px;">Searching Wikipedia for "${query}"...</span>
                </div>
            </div>
        `;
        document.getElementById('messages').appendChild(searchIndicator);
        this.scrollToBottom();

        try {
            const searchResponse = await fetch(
                `https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(query)}&origin=*`
            );
            const searchData = await searchResponse.json();
            
            if (searchData.query && searchData.query.search.length > 0) {
                const pageId = searchData.query.search[0].pageid;
                const pageTitle = searchData.query.search[0].title;
                
                const contentResponse = await fetch(
                    `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro=true&explaintext=true&pageids=${pageId}&origin=*`
                );
                const contentData = await contentResponse.json();
                
                if (contentData.query && contentData.query.pages[pageId]) {
                    this.state.lastSearchResults = {
                        query: query,
                        title: pageTitle,
                        content: contentData.query.pages[pageId].extract,
                        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle.replace(/ /g, '_'))}`
                    };

                    searchIndicator.remove();
                    this.handleSendMessage();
                } else {
                    throw new Error('No content found in Wikipedia');
                }
            } else {
                throw new Error('No results found in Wikipedia');
            }
        } catch (error) {
            console.error('Search error:', error);
            searchIndicator.querySelector('.message-content').innerHTML = 
                `<div class="error-message">Error: ${error.message}</div>`;
        }
    },

    addMessage: function(sender, content) {
        const messagesContainer = document.getElementById('messages');
        const welcomeMessage = messagesContainer.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }

        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}`;
        
        const icon = sender === 'user' 
            ? '<i class="fas fa-user"></i>' 
            : '<i class="fas fa-skull"></i>';
        
        messageElement.innerHTML = `
            <div class="message-icon">${icon}</div>
            <div class="message-content">
                ${this.formatMessage(content)}
                <div class="message-actions">
                    <button class="action-btn" onclick="EvilGPT.copyMessage(this)" title="Copy">
                        <i class="fas fa-copy"></i>
                    </button>
                    ${sender === 'assistant' ? `
                    <button class="action-btn" onclick="EvilGPT.regenerateResponse(this)" title="Regenerate">
                        <i class="fas fa-redo"></i>
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        messagesContainer.appendChild(messageElement);
        this.state.messageHistory.push({
            chatId: this.state.currentChatId,
            sender,
            content,
            timestamp: Date.now()
        });

        if (this.state.settings.autoScroll) {
            this.scrollToBottom();
        }

        messageElement.style.opacity = '0';
        messageElement.style.transform = 'translateY(20px)';
        setTimeout(() => {
            messageElement.style.transition = 'all 0.3s ease-out';
            messageElement.style.opacity = '1';
            messageElement.style.transform = 'translateY(0)';
        }, 50);
    },

    async generateAIResponse(prompt) {
        this.state.isTyping = true;
        this.state.activeGeneration = new AbortController();
        this.updateUIState();

        const typingIndicator = document.createElement('div');
        typingIndicator.id = 'typingIndicator';
        typingIndicator.className = 'message assistant';
        typingIndicator.innerHTML = `
            <div class="message-icon"><i class="fas fa-skull"></i></div>
            <div class="message-content">
                <div class="streaming-indicator">
                    <div class="loading-dot"></div>
                    <div class="loading-dot"></div>
                    <div class="loading-dot"></div>
                    <span>EvilGPT is thinking...</span>
                </div>
            </div>
        `;
        document.getElementById('messages').appendChild(typingIndicator);
        this.scrollToBottom();

        try {
            let messages = [
                ...this.state.messageHistory
                    .filter(m => m.chatId === this.state.currentChatId)
                    .map(m => ({ role: m.sender, content: m.content })),
                { role: 'user', content: prompt }
            ];

            if (this.state.knowledgeDatabase && prompt.length > 3) {
                const relevantKnowledge = this.searchKnowledgeDatabase(prompt);
                if (relevantKnowledge.length > 0) {
                    let knowledgeContext = "RELEVANT KNOWLEDGE:\n";
                    relevantKnowledge.forEach(item => {
                        knowledgeContext += `\n=== ${item.title} ===\n${item.content.substring(0, 500)}${item.content.length > 500 ? '...' : ''}\n`;
                    });
                    
                    messages.unshift({
                        role: 'system',
                        content: knowledgeContext + "\nUse this information only if relevant."
                    });
                }
            }

            if (this.state.lastSearchResults) {
                messages.unshift({
                    role: 'system',
                    content: `USER ASKED ABOUT: ${this.state.lastSearchResults.query}\n\nWIKIPEDIA KNOWLEDGE:\n${this.state.lastSearchResults.content.substring(0, 1000)}\n\nUse this information to answer naturally.`
                });
            }

            const response = await fetch(`${this.state.settings.ollamaEndpoint}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.state.settings.model,
                    messages: messages,
                    stream: true,
                    options: {
                        temperature: this.state.settings.temperature,
                        num_ctx: this.state.settings.maxTokens
                    }
                }),
                signal: this.state.activeGeneration.signal
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullResponse = '';

            const messagesContainer = document.getElementById('messages');
            const messageElement = document.createElement('div');
            messageElement.className = 'message assistant';
            messageElement.innerHTML = `
                <div class="message-icon"><i class="fas fa-skull"></i></div>
                <div class="message-content"></div>
            `;
            messagesContainer.appendChild(messageElement);
            typingIndicator.remove();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.trim() !== '');

                for (const line of lines) {
                    try {
                        const parsed = JSON.parse(line);
                        if (parsed.message?.content) {
                            fullResponse += parsed.message.content;
                            messageElement.querySelector('.message-content').innerHTML = `
                                ${this.formatMessage(fullResponse + (this.state.lastSearchResults ? '\n\n<div class="source-citation">Source: <a href="' + this.state.lastSearchResults.url + '" target="_blank">Wikipedia</a></div>' : ''))}
                                <div class="message-actions">
                                    <button class="action-btn" onclick="EvilGPT.copyMessage(this)" title="Copy">
                                        <i class="fas fa-copy"></i>
                                    </button>
                                    <button class="action-btn" onclick="EvilGPT.regenerateResponse(this)" title="Regenerate">
                                        <i class="fas fa-redo"></i>
                                    </button>
                                </div>
                            `;

                            if (this.state.settings.autoScroll) {
                                this.scrollToBottom();
                            }
                        }
                    } catch (e) {
                        console.error('Error parsing response:', e);
                    }
                }
            }

            this.state.messageHistory.push({
                chatId: this.state.currentChatId,
                sender: 'assistant',
                content: fullResponse + (this.state.lastSearchResults ? `\n\nSource: ${this.state.lastSearchResults.url}` : ''),
                timestamp: Date.now()
            });

            if (this.state.messageHistory.filter(m => m.chatId === this.state.currentChatId).length === 2) {
                this.generateChatTitle(prompt);
            }

        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error generating response:', error);
                
                if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                    this.state.ollamaConnected = false;
                    this.updateConnectionStatus();
                    
                    if (this.state.ollamaRetryCount < this.state.maxRetries) {
                        this.state.ollamaRetryCount++;
                        this.showNotification(`Connection lost. Reconnecting (${this.state.ollamaRetryCount}/${this.state.maxRetries})...`, 'warning');
                        await this.checkOllamaConnection();
                        
                        if (this.state.ollamaConnected) {
                            this.generateAIResponse(prompt);
                            return;
                        }
                    }
                    
                    this.addMessage('assistant', `Connection Error: Unable to reach Ollama server.`);
                } else {
                    this.addMessage('assistant', `Error: ${error.message}`);
                }
            }
        } finally {
            this.state.isTyping = false;
            this.state.activeGeneration = null;
            const typingIndicator = document.getElementById('typingIndicator');
            if (typingIndicator) typingIndicator.remove();
            this.updateUIState();
        }
    },

    async generateChatTitle(firstMessage) {
        try {
            const response = await fetch(`${this.state.settings.ollamaEndpoint}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.state.settings.model,
                    messages: [
                        {
                            role: "system",
                            content: "Generate a very short title (2-5 words) for this chat based on the user's first message. Just return the title, nothing else."
                        },
                        {
                            role: "user",
                            content: firstMessage
                        }
                    ],
                    temperature: 0.3,
                    max_tokens: 15
                })
            });

            const data = await response.json();
            let title = data.message?.content || "New Chat";
            
            title = title.replace(/["']/g, '').trim();
            if (title.length > 30) {
                title = title.substring(0, 30) + '...';
            }
            
            this.updateChatTitle(title);
        } catch (error) {
            console.error("Error generating title:", error);
        }
    },

    updateChatTitle(title) {
        const chatHistory = document.querySelector('.chat-history');
        const activeChat = chatHistory.querySelector('.chat-item.active');
        
        if (activeChat) {
            activeChat.innerHTML = `<i class="fas fa-comment-dots" style="margin-right: 8px;"></i>${title}`;
        } else {
            const chatItem = document.createElement('div');
            chatItem.className = 'chat-item active';
            chatItem.innerHTML = `<i class="fas fa-comment-dots" style="margin-right: 8px;"></i>${title}`;
            chatHistory.insertBefore(chatItem, chatHistory.firstChild.nextSibling);
        }
    },

    formatMessage: function(content) {
        return content
            .replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => `
                <div class="code-block">
                    <div class="code-header">
                        <span>${lang || 'text'}</span>
                        <button onclick="EvilGPT.copyCode(this)">
                            <i class="fas fa-copy"></i> Copy
                        </button>
                    </div>
                    <pre><code>${this.escapeHtml(code.trim())}</code></pre>
                </div>
            `)
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    },

    escapeHtml: function(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    scrollToBottom: function() {
        const container = document.getElementById('chatContainer');
        container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
        });
    },

    updateUIState: function() {
        document.getElementById('sendBtn').disabled = this.state.isTyping;
        document.getElementById('searchBtn').disabled = this.state.isTyping;
    },

    async checkOllamaConnection() {
        try {
            console.log('Checking Ollama connection...');
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(`${this.state.settings.ollamaEndpoint}/api/tags`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('Available models:', data.models);
            
            if (data.models.length === 0) {
                throw new Error('No models available in Ollama');
            }
            
            const hasModel = data.models.some(m => m.name.includes(this.state.settings.model.split(':')[0]));
            if (!hasModel) {
                const availableModel = data.models[0].name;
                console.warn(`Model ${this.state.settings.model} not found. Available models:`, data.models.map(m => m.name));
                
                this.state.settings.model = availableModel;
                this.showNotification(`Switched to available model: ${availableModel}`, 'warning');
            }
            
            this.state.ollamaConnected = true;
            this.state.ollamaRetryCount = 0;
            this.updateConnectionStatus();
            this.showNotification('Connected to Ollama', 'success');
            
        } catch (error) {
            console.error('Ollama connection failed:', error);
            this.state.ollamaConnected = false;
            this.updateConnectionStatus();
            
            let errorMessage = 'Connection failed';
            if (error.name === 'AbortError') {
                errorMessage = 'Connection timeout - is Ollama running?';
            } else if (error.message.includes('CORS')) {
                errorMessage = 'CORS error - set OLLAMA_ORIGINS=* and restart Ollama';
            } else if (error.message.includes('fetch')) {
                errorMessage = 'Cannot reach Ollama - check if it\'s running on port 11434';
            } else {
                errorMessage = error.message;
            }
            
            this.showNotification(`Ollama Error: ${errorMessage}`, 'error');
            return false;
        }
        return true;
    },

    updateConnectionStatus: function() {
        const statusElement = document.createElement('div');
        statusElement.id = 'connectionStatus';
        statusElement.className = 'connection-status';
        statusElement.innerHTML = this.state.ollamaConnected 
            ? '<i class="fas fa-plug connected"></i> Online' 
            : '<i class="fas fa-plug disconnected"></i> Offline';
        
        const headerRight = document.querySelector('.header-right');
        const existingStatus = document.getElementById('connectionStatus');
        if (existingStatus) {
            headerRight.replaceChild(statusElement, existingStatus);
        } else {
            headerRight.insertBefore(statusElement, document.getElementById('settingsBtn'));
        }
    },

    abortGeneration: function() {
        if (this.state.activeGeneration) {
            this.state.activeGeneration.abort();
            this.showNotification('Generation stopped', 'warning');
        }
    },

    createNewChat: function() {
        this.state.currentChatId = 'chat_' + Date.now();
        this.state.messageHistory = [];
        this.state.lastSearchResults = null;
        
        document.getElementById('messages').innerHTML = `
            <div class="message assistant welcome-message">
                <div class="message-icon"><i class="fas fa-skull"></i></div>
                <div class="message-content">
                    <h3>New Evil Session</h3>
                    <p>I am EvilGPT. What dark knowledge do you seek?</p>
                </div>
            </div>
        `;
        this.showNotification('New chat created', 'success');
    },

    copyMessage: function(button) {
        const text = button.closest('.message-content').textContent
            .replace(/Copy|Regenerate/g, '').trim();
            
        navigator.clipboard.writeText(text).then(() => {
            this.showNotification('Copied to clipboard', 'success');
            button.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => button.innerHTML = '<i class="fas fa-copy"></i>', 2000);
        });
    },

    copyCode: function(button) {
        const code = button.closest('.code-block').querySelector('code').textContent;
        navigator.clipboard.writeText(code).then(() => {
            this.showNotification('Code copied', 'success');
            button.innerHTML = '<i class="fas fa-check"></i> Copied';
            setTimeout(() => button.innerHTML = '<i class="fas fa-copy"></i> Copy', 2000);
        });
    },

    regenerateResponse: function(button) {
        const messageElement = button.closest('.message');
        const lastUserMessage = [...this.state.messageHistory]
            .reverse()
            .find(m => m.sender === 'user' && m.chatId === this.state.currentChatId);
            
        if (lastUserMessage) {
            messageElement.remove();
            this.state.lastSearchResults = null;
            this.handleSendMessage(lastUserMessage.content);
        }
    },

    showNotification: function(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            background: ${type === 'error' ? '#990000' : type === 'success' ? '#009900' : '#333333'};
            color: white;
            z-index: 1000;
            transform: translateX(100%);
            opacity: 0;
            transition: all 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        }, 50);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    },

    applyTheme: function() {
        const themes = {
            dark: {
                '--primary-bg': '#0a0000',
                '--secondary-bg': '#1a0000',
                '--accent-bg': '#2d0000',
                '--text-primary': '#ffdddd'
            },
            darker: {
                '--primary-bg': '#050000',
                '--secondary-bg': '#0f0000',
                '--accent-bg': '#200000',
                '--text-primary': '#ffcccc'
            },
            blood: {
                '--primary-bg': '#0a0000',
                '--secondary-bg': '#1a0505',
                '--accent-bg': '#2d0a0a',
                '--text-primary': '#ffaaaa'
            }
        };

        const theme = themes[this.state.settings.theme] || themes.dark;
        Object.entries(theme).forEach(([property, value]) => {
            document.documentElement.style.setProperty(property, value);
        });
    },

    openSettings: function() {
        document.getElementById('settingsModal').style.display = 'block';
    }
};

function initializeChat() {
    EvilGPT.initializeChat();
}

window.copyMessage = EvilGPT.copyMessage.bind(EvilGPT);
window.copyCode = EvilGPT.copyCode.bind(EvilGPT);
window.regenerateResponse = EvilGPT.regenerateResponse.bind(EvilGPT);
window.EvilGPT = EvilGPT;