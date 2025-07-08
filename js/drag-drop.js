// drag-drop.js - Drag and Drop File Upload Functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeDragDrop();
});

const DragDropUploader = {
    init: function() {
        const dropArea = document.querySelector('.input-area');
        
        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, preventDefaults, false);
        });

        // Highlight drop area when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, unhighlight, false);
        });

        // Handle dropped files
        dropArea.addEventListener('drop', handleDrop, false);

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        function highlight() {
            dropArea.classList.add('drag-over');
        }

        function unhighlight() {
            dropArea.classList.remove('drag-over');
        }

        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            
            if (files.length) {
                const fileInput = document.getElementById('fileInput');
                fileInput.files = files;
                
                // Trigger the file processing
                const event = new Event('change');
                fileInput.dispatchEvent(event);
            }
        }
    }
};

function initializeDragDrop() {
    DragDropUploader.init();
}

window.DragDropUploader = DragDropUploader;