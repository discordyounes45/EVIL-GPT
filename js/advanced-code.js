// advanced-code.js - Advanced Code Highlighting
document.addEventListener('DOMContentLoaded', function() {
    initializeAdvancedCode();
});

const AdvancedCodeHighlighter = {
    init: function() {
        // Observe new messages being added
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1 && node.classList && node.classList.contains('message')) {
                        this.processCodeBlocks(node);
                    }
                });
            });
        });

        observer.observe(document.getElementById('messages'), {
            childList: true,
            subtree: true
        });

        // Process existing code blocks
        document.querySelectorAll('.message').forEach(msg => {
            this.processCodeBlocks(msg);
        });
    },

    processCodeBlocks: function(messageElement) {
        const codeBlocks = messageElement.querySelectorAll('pre code');
        
        codeBlocks.forEach(block => {
            // Skip if already processed
            if (block.dataset.highlighted === 'true') return;
            
            const parent = block.closest('.code-block');
            if (!parent) return;
            
            // Add line numbers
            const lines = block.textContent.split('\n');
            const lineNumbers = document.createElement('div');
            lineNumbers.className = 'line-numbers';
            lineNumbers.innerHTML = lines.map((_, i) => `<span>${i + 1}</span>`).join('');
            
            parent.insertBefore(lineNumbers, block.parentNode);
            
            // Add copy button
            const copyBtn = parent.querySelector('button');
            if (copyBtn) {
                copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
                copyBtn.addEventListener('click', () => {
                    navigator.clipboard.writeText(block.textContent).then(() => {
                        copyBtn.innerHTML = '<i class="fas fa-check"></i>';
                        setTimeout(() => copyBtn.innerHTML = '<i class="fas fa-copy"></i>', 2000);
                    });
                });
            }
            
            // Highlight syntax
            hljs.highlightElement(block);
            block.dataset.highlighted = 'true';
        });
    }
};

function initializeAdvancedCode() {
    AdvancedCodeHighlighter.init();
}

window.AdvancedCodeHighlighter = AdvancedCodeHighlighter;