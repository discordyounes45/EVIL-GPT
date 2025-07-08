// export.js - Conversation Export Functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeExport();
});

const ConversationExporter = {
    init: function() {
        // Add export button to the UI
        const exportBtn = document.createElement('button');
        exportBtn.className = 'action-button export-button';
        exportBtn.id = 'exportBtn';
        exportBtn.title = 'Export conversation';
        exportBtn.innerHTML = '<i class="fas fa-file-export"></i>';
        
        const headerRight = document.querySelector('.header-right');
        headerRight.insertBefore(exportBtn, document.getElementById('settingsBtn'));
        
        exportBtn.addEventListener('click', () => this.showExportMenu());
    },

    showExportMenu: function() {
        const menu = document.createElement('div');
        menu.className = 'export-menu';
        menu.innerHTML = `
            <div class="export-option" data-format="pdf">
                <i class="fas fa-file-pdf"></i>
                <span>Export as PDF</span>
            </div>
            <div class="export-option" data-format="html">
                <i class="fas fa-file-code"></i>
                <span>Export as HTML</span>
            </div>
            <div class="export-option" data-format="text">
                <i class="fas fa-file-alt"></i>
                <span>Export as Text</span>
            </div>
        `;
        
        menu.style.cssText = `
            position: absolute;
            right: 50px;
            top: 60px;
            background: var(--secondary-bg);
            border-radius: 8px;
            padding: 8px 0;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 100;
            min-width: 180px;
        `;
        
        document.querySelector('.app-container').appendChild(menu);
        
        // Handle clicks
        menu.querySelectorAll('.export-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const format = e.currentTarget.getAttribute('data-format');
                this.exportConversation(format);
                menu.remove();
            });
        });
        
        // Close menu when clicking outside
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!menu.contains(e.target)) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 10);
    },

    exportConversation: function(format) {
        const messages = document.querySelectorAll('.message:not(.welcome-message)');
        let content = '';
        
        messages.forEach(msg => {
            const sender = msg.classList.contains('user') ? 'You' : 'EvilGPT';
            const text = msg.querySelector('.message-content').textContent
                .replace(/Copy|Regenerate/g, '').trim();
            
            content += `[${sender}]\n${text}\n\n`;
        });
        
        switch(format) {
            case 'pdf':
                this.exportAsPDF(content);
                break;
            case 'html':
                this.exportAsHTML(content);
                break;
            case 'text':
                this.exportAsText(content);
                break;
        }
    },

    exportAsPDF: function(content) {
        EvilGPT.showNotification('PDF export requires a library like jsPDF', 'warning');
        // In a real implementation, you would use jsPDF or similar here
    },

    exportAsHTML: function(content) {
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>EvilGPT Conversation</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; }
                    .user { color: #ff5555; }
                    .assistant { color: #55aaff; }
                </style>
            </head>
            <body>
                <h1>EvilGPT Conversation</h1>
                <div>${content.replace(/\n/g, '<br>').replace(/\[(.*?)\]/g, '<div class="$1">$1:</div>')}</div>
            </body>
            </html>
        `;
        
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `evilgpt-conversation-${new Date().toISOString().slice(0,10)}.html`;
        a.click();
    },

    exportAsText: function(content) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `evilgpt-conversation-${new Date().toISOString().slice(0,10)}.txt`;
        a.click();
    }
};

function initializeExport() {
    ConversationExporter.init();
}

window.ConversationExporter = ConversationExporter;