// Enhanced upload.js - File Upload with Visual File Cards
document.addEventListener('DOMContentLoaded', function() {
    initializeFileUpload();
});

const FileUploader = {
    state: {
        currentFiles: [],
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: [
            'text/plain',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/csv',
            'application/json',
            'text/html',
            'application/rtf',
            'text/markdown',
            'text/javascript',
            'text/x-python',
            'text/x-java-source',
            'text/x-csrc',
            'text/x-c++src',
            'text/x-csharp',
            'text/x-go',
            'text/x-ruby',
            'text/x-php',
            'text/x-swift',
            'text/x-kotlin',
            'application/typescript',
            'text/x-shellscript',
            'text/x-perl',
            'text/x-rsrc',
            'text/x-scala',
            'text/x-haskell',
            'text/x-lua',
            'application/sql',
            'text/x-yaml',
            'text/x-toml'
        ],
        languageMap: {
            '.js': 'javascript',
            '.py': 'python',
            '.java': 'java',
            '.c': 'c',
            '.cpp': 'cpp',
            '.cs': 'csharp',
            '.go': 'go',
            '.rb': 'ruby',
            '.php': 'php',
            '.swift': 'swift',
            '.kt': 'kotlin',
            '.ts': 'typescript',
            '.sh': 'bash',
            '.pl': 'perl',
            '.r': 'r',
            '.m': 'matlab',
            '.scala': 'scala',
            '.hs': 'haskell',
            '.lua': 'lua',
            '.sql': 'sql',
            '.html': 'html',
            '.css': 'css',
            '.json': 'json',
            '.xml': 'xml',
            '.yaml': 'yaml',
            '.toml': 'toml',
            '.md': 'markdown',
            '.pdf': 'pdf',
            '.doc': 'document',
            '.docx': 'document',
            '.xls': 'spreadsheet',
            '.xlsx': 'spreadsheet',
            '.ppt': 'presentation',
            '.pptx': 'presentation'
        },
        fileIcons: {
            'javascript': 'fab fa-js-square',
            'python': 'fab fa-python',
            'java': 'fab fa-java',
            'html': 'fab fa-html5',
            'css': 'fab fa-css3-alt',
            'json': 'fas fa-code',
            'markdown': 'fab fa-markdown',
            'pdf': 'fas fa-file-pdf',
            'document': 'fas fa-file-word',
            'spreadsheet': 'fas fa-file-excel',
            'presentation': 'fas fa-file-powerpoint',
            'text': 'fas fa-file-alt',
            'default': 'fas fa-file'
        }
    },

    initializeFileUpload: function() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'fileInput';
        fileInput.multiple = true;
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);

        document.getElementById('attachmentBtn').addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => this.handleFileSelection(e));
        
        // Add CSS for file cards
        this.addFileCardStyles();
    },

    addFileCardStyles: function() {
        const style = document.createElement('style');
        style.textContent = `
            .file-upload-container {
                background: rgba(139, 0, 0, 0.1);
                border-radius: 8px;
                padding: 16px;
                margin: 12px 0;
                border: 1px solid rgba(139, 0, 0, 0.3);
            }
            
            .file-cards-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                gap: 12px;
                margin-top: 12px;
            }
            
            .file-card {
                background: rgba(20, 20, 20, 0.8);
                border: 1px solid rgba(139, 0, 0, 0.4);
                border-radius: 8px;
                padding: 12px;
                text-align: center;
                transition: all 0.3s ease;
                position: relative;
                min-height: 100px;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
            }
            
            .file-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(139, 0, 0, 0.3);
                border-color: rgba(139, 0, 0, 0.6);
            }
            
            .file-icon {
                font-size: 28px;
                margin-bottom: 8px;
                color: #ffd700;
            }
            
            .file-name {
                font-size: 12px;
                color: #fff;
                margin-bottom: 4px;
                word-break: break-word;
                line-height: 1.2;
                height: 24px;
                overflow: hidden;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
            }
            
            .file-size {
                font-size: 10px;
                color: #999;
                margin-top: auto;
            }
            
            .file-language {
                font-size: 10px;
                color: #8b0000;
                background: rgba(139, 0, 0, 0.2);
                padding: 2px 6px;
                border-radius: 4px;
                margin-top: 4px;
                text-transform: uppercase;
            }
            
            .upload-header {
                display: flex;
                align-items: center;
                gap: 8px;
                color: #fff;
                font-size: 14px;
                font-weight: 500;
            }
            
            .upload-header i {
                color: #8b0000;
            }
            
            .processing-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #fff;
                font-size: 12px;
            }
            
            .spinner {
                border: 2px solid rgba(139, 0, 0, 0.3);
                border-top: 2px solid #8b0000;
                border-radius: 50%;
                width: 16px;
                height: 16px;
                animation: spin 1s linear infinite;
                margin-right: 8px;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    },

    handleFileSelection: function(event) {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        this.state.currentFiles = [];

        for (const file of files) {
            if (file.size > this.state.maxFileSize) {
                EvilGPT.showNotification(`File ${file.name} exceeds 10MB limit`, 'error');
                continue;
            }

            if (!this.isFileSupported(file)) {
                EvilGPT.showNotification(`File type not supported: ${file.name}`, 'error');
                continue;
            }

            this.state.currentFiles.push(file);
        }

        if (this.state.currentFiles.length > 0) {
            this.displayFileCards();
            this.processFiles();
        }
    },

    isFileSupported: function(file) {
        if (this.state.allowedTypes.includes(file.type)) {
            return true;
        }
        
        const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        return this.state.languageMap[extension] !== undefined;
    },

    displayFileCards: function() {
        const fileCardsHtml = this.generateFileCardsHtml();
        
        // Add file cards to chat
        const fileUploadMessage = document.createElement('div');
        fileUploadMessage.className = 'message user';
        fileUploadMessage.innerHTML = `
            <div class="message-icon"><i class="fas fa-user"></i></div>
            <div class="message-content">
                <div class="file-upload-container">
                    <div class="upload-header">
                        <i class="fas fa-paperclip"></i>
                        <span>Uploaded ${this.state.currentFiles.length} file(s)</span>
                    </div>
                    <div class="file-cards-grid">
                        ${fileCardsHtml}
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('messages').appendChild(fileUploadMessage);
        EvilGPT.scrollToBottom();
    },

    generateFileCardsHtml: function() {
        return this.state.currentFiles.map(file => {
            const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
            const language = this.state.languageMap[extension] || 'default';
            const icon = this.state.fileIcons[language] || this.state.fileIcons.default;
            const fileSize = this.formatFileSize(file.size);
            const fileName = file.name.length > 20 ? file.name.substring(0, 17) + '...' : file.name;
            
            return `
                <div class="file-card" data-filename="${file.name}">
                    <div class="processing-overlay" style="display: none;">
                        <div class="spinner"></div>
                        Processing...
                    </div>
                    <div class="file-icon">
                        <i class="${icon}"></i>
                    </div>
                    <div class="file-name" title="${file.name}">${fileName}</div>
                    <div class="file-size">${fileSize}</div>
                    ${language !== 'default' ? `<div class="file-language">${language}</div>` : ''}
                </div>
            `;
        }).join('');
    },

    formatFileSize: function(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    },

    processFiles: async function() {
        // Show processing state on file cards
        const fileCards = document.querySelectorAll('.file-card');
        fileCards.forEach(card => {
            const overlay = card.querySelector('.processing-overlay');
            if (overlay) overlay.style.display = 'flex';
        });

        try {
            let extractedContent = '';
            let fileAnalysis = [];

            for (const file of this.state.currentFiles) {
                const fileContent = await this.extractFileContent(file);
                const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
                const language = this.state.languageMap[extension] || 'text';
                
                fileAnalysis.push({
                    name: file.name,
                    size: this.formatFileSize(file.size),
                    language: language,
                    content: fileContent,
                    preview: fileContent.substring(0, 300)
                });
            }

            // Generate response content
            extractedContent = this.generateAnalysisResponse(fileAnalysis);

            // Hide processing overlays
            fileCards.forEach(card => {
                const overlay = card.querySelector('.processing-overlay');
                if (overlay) overlay.style.display = 'none';
            });

            // Add assistant response
            EvilGPT.addMessage('assistant', extractedContent);

            // Add to knowledge database
            if (!EvilGPT.state.knowledgeDatabase) {
                EvilGPT.state.knowledgeDatabase = [];
            }

            EvilGPT.state.knowledgeDatabase.push({
                title: `File Upload - ${new Date().toLocaleString()}`,
                content: extractedContent,
                files: fileAnalysis
            });

            EvilGPT.showNotification('Files processed successfully', 'success');

        } catch (error) {
            console.error('Error processing files:', error);
            
            // Hide processing overlays on error
            fileCards.forEach(card => {
                const overlay = card.querySelector('.processing-overlay');
                if (overlay) overlay.style.display = 'none';
            });

            EvilGPT.addMessage('assistant', `Error processing files: ${error.message}`);
        }
    },

    generateAnalysisResponse: function(fileAnalysis) {
        let response = `## File Analysis Complete\n\n`;
        response += `Successfully processed **${fileAnalysis.length}** file(s):\n\n`;

        fileAnalysis.forEach((file, index) => {
            response += `### ${index + 1}. ${file.name}\n`;
            response += `**Type:** ${file.language} | **Size:** ${file.size}\n\n`;
            
            if (file.content && file.content.length > 0) {
                response += `**Content Preview:**\n\`\`\`${file.language}\n${file.preview}${file.content.length > 300 ? '...' : ''}\n\`\`\`\n\n`;
            }

            // Add analysis options for code files
            if (this.isCodeFile(file.language)) {
                response += `**Available Actions:**\n`;
                response += `- Explain code functionality\n`;
                response += `- Review for bugs/vulnerabilities\n`;
                response += `- Suggest improvements\n`;
                response += `- Add error handling\n`;
                response += `- Generate documentation\n\n`;
            }
        });

        response += `---\n\n`;
        response += `💡 **What would you like me to do with these files?** I can analyze, explain, improve, or help you work with the uploaded content.`;

        return response;
    },

    isCodeFile: function(language) {
        const codeLanguages = ['javascript', 'python', 'java', 'c', 'cpp', 'csharp', 'go', 'ruby', 'php', 'swift', 'kotlin', 'typescript'];
        return codeLanguages.includes(language);
    },

    extractFileContent: async function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

            reader.onload = (e) => {
                try {
                    const content = e.target.result;
                    
                    if (file.type === 'application/pdf') {
                        resolve(`[PDF File - ${file.name}]\nContent extraction requires PDF processing library.`);
                    } else if (file.type.includes('wordprocessingml') || 
                               file.type.includes('spreadsheetml') || 
                               file.type.includes('presentationml')) {
                        resolve(`[Office Document - ${file.name}]\nContent extraction requires specialized library.`);
                    } else {
                        resolve(content);
                    }
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = (error) => reject(error);

            // Handle different file types
            if (file.type.startsWith('text/') || this.state.languageMap[extension]) {
                reader.readAsText(file);
            } else {
                resolve(`[Binary File - ${file.name}]\nContent not displayed for binary files.`);
            }
        });
    }
};

function initializeFileUpload() {
    FileUploader.initializeFileUpload();
}

window.FileUploader = FileUploader;