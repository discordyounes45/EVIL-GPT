// bookmark.js - Message Bookmarking Functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeBookmarking();
});

const MessageBookmarker = {
    state: {
        bookmarks: JSON.parse(localStorage.getItem('evilgpt-bookmarks')) || []
    },

    init: function() {
        // Add bookmark button to message actions
        document.addEventListener('click', (e) => {
            if (e.target.closest('.message-content')) {
                const message = e.target.closest('.message');
                if (!message.querySelector('.bookmark-btn')) {
                    this.addBookmarkButton(message);
                }
            }
        });

        // Add bookmarks section to sidebar
        this.addBookmarksSection();
    },

    addBookmarkButton: function(message) {
        const actions = message.querySelector('.message-actions');
        if (!actions) return;
        
        const isBookmarked = this.state.bookmarks.some(b => b.id === message.dataset.id);
        
        const btn = document.createElement('button');
        btn.className = `action-btn bookmark-btn ${isBookmarked ? 'bookmarked' : ''}`;
        btn.title = isBookmarked ? 'Remove bookmark' : 'Bookmark this message';
        btn.innerHTML = '<i class="fas fa-bookmark"></i>';
        
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleBookmark(message);
        });
        
        actions.appendChild(btn);
    },

    toggleBookmark: function(message) {
        if (!message.dataset.id) {
            message.dataset.id = 'msg_' + Date.now();
        }
        
        const index = this.state.bookmarks.findIndex(b => b.id === message.dataset.id);
        const btn = message.querySelector('.bookmark-btn');
        
        if (index > -1) {
            // Remove bookmark
            this.state.bookmarks.splice(index, 1);
            btn.classList.remove('bookmarked');
            btn.title = 'Bookmark this message';
            EvilGPT.showNotification('Bookmark removed', 'warning');
        } else {
            // Add bookmark
            const content = message.querySelector('.message-content').textContent
                .replace(/Copy|Regenerate|Bookmark/g, '').trim();
            
            this.state.bookmarks.push({
                id: message.dataset.id,
                content: content.length > 100 ? content.substring(0, 100) + '...' : content,
                timestamp: Date.now(),
                chatId: EvilGPT.state.currentChatId
            });
            
            btn.classList.add('bookmarked');
            btn.title = 'Remove bookmark';
            EvilGPT.showNotification('Message bookmarked', 'success');
        }
        
        this.saveBookmarks();
        this.updateBookmarksList();
    },

    saveBookmarks: function() {
        localStorage.setItem('evilgpt-bookmarks', JSON.stringify(this.state.bookmarks));
    },

    addBookmarksSection: function() {
        const sidebar = document.querySelector('.sidebar');
        const bookmarksSection = document.createElement('div');
        bookmarksSection.className = 'bookmarks-section';
        bookmarksSection.innerHTML = `
            <div class="sidebar-section-header">
                <i class="fas fa-bookmark"></i>
                <span>Bookmarks</span>
            </div>
            <div class="bookmarks-list" id="bookmarksList"></div>
        `;
        
        sidebar.insertBefore(bookmarksSection, document.querySelector('.sidebar-footer'));
        this.updateBookmarksList();
    },

    updateBookmarksList: function() {
        const list = document.getElementById('bookmarksList');
        if (!list) return;
        
        list.innerHTML = '';
        
        if (this.state.bookmarks.length === 0) {
            list.innerHTML = '<div class="empty-state">No bookmarks yet</div>';
            return;
        }
        
        this.state.bookmarks.forEach(bookmark => {
            const item = document.createElement('div');
            item.className = 'bookmark-item';
            item.innerHTML = `
                <div class="bookmark-content">${bookmark.content}</div>
                <div class="bookmark-actions">
                    <button class="action-btn" title="Jump to message">
                        <i class="fas fa-arrow-up"></i>
                    </button>
                    <button class="action-btn" title="Delete bookmark">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            list.appendChild(item);
        });
    }
};

function initializeBookmarking() {
    MessageBookmarker.init();
}

window.MessageBookmarker = MessageBookmarker;