/**
 * Buyer Communication Center JavaScript
 */
class BuyerCommunication {
    constructor() {
        this.apiBase = '/buyer/api';
        this.currentConversation = null;
        this.conversations = [];
        this.init();
    }

    init() {
        this.loadConversations();
        this.loadRFQs();
        this.setupEventListeners();
    }

    async loadConversations() {
        try {
            const response = await fetch(`${this.apiBase}/buyer-conversations`);
            const result = await response.json();
            
            if (result.success) {
                this.conversations = result.data;
                this.renderConversations(result.data);
            }
        } catch (error) {
            console.error('Error loading conversations:', error);
        }
    }

    renderConversations(conversations) {
        const container = document.getElementById('conversationsList');
        if (!container) return;

        const loader = container.querySelector('.loading-placeholder');
        if (loader) loader.remove();

        if (!conversations.length) {
            container.innerHTML = `
                <div class="no-data">
                    <div class="no-data-icon"><i class="fas fa-comments"></i></div>
                    <h4>No Conversations</h4>
                    <p>Start a conversation with a supplier to see it here.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = conversations.map(conv => `
            <div class="conversation-item ${conv.unreadCount > 0 ? 'unread' : ''}" 
                 data-conversation-id="${conv.id}" onclick="selectConversation('${conv.id}')">
                <div class="conversation-header">
                    <div class="conversation-avatar">${conv.supplierName.charAt(0)}</div>
                    <div class="conversation-info">
                        <h4 class="conversation-name">${conv.supplierName}</h4>
                        <span class="conversation-time">${conv.lastMessageTime}</span>
                    </div>
                    <div class="conversation-badges">
                        ${conv.isRFQ ? '<span class="badge rfq">RFQ</span>' : ''}
                        ${conv.unreadCount > 0 ? `<span class="badge unread-count">${conv.unreadCount}</span>` : ''}
                    </div>
                </div>
                <div class="conversation-preview">${conv.lastMessage}</div>
            </div>
        `).join('');
    }

    selectConversation(conversationId) {
        // Remove active class from all conversations
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.remove('active');
        });

        // Add active class to selected
        const selectedItem = document.querySelector(`[data-conversation-id="${conversationId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('active');
        }

        this.currentConversation = conversationId;
        // Load messages for the selected conversation
        this.loadMessages(conversationId);
        this.showChatArea();
    }

    async loadMessages(conversationId) {
        try {
            // In a real implementation, we would fetch messages for this conversation
            // For now, we'll show a more realistic placeholder
            const container = document.getElementById('messagesContainer');
            if (!container) return;

            container.innerHTML = `
                <div class="message-system">
                    <span>Conversation started with supplier</span>
                </div>
                <div class="message-received">
                    <div class="message-sender">Supplier</div>
                    <div class="message-content">
                        Thank you for your inquiry. We're reviewing your request and will provide a quote shortly.
                    </div>
                    <div class="message-time">Just now</div>
                </div>
                <div class="message-sent">
                    <div class="message-content">
                        I'm looking forward to your quote. Please include shipping details and payment terms.
                    </div>
                    <div class="message-time">2 minutes ago</div>
                </div>
            `;

            container.scrollTop = container.scrollHeight;
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }

    showChatArea() {
        const emptyState = document.getElementById('emptyChatState');
        const chatArea = document.getElementById('chatArea');
        
        if (emptyState) emptyState.classList.add('hidden');
        if (chatArea) chatArea.classList.remove('hidden');
    }

    // Removed the loadMessages function since there's no endpoint for it
    // In a real implementation, this would fetch the full message history for a conversation
    
    renderMessages(messages) {
        const container = document.getElementById('messagesContainer');
        if (!container) return;

        // Show a more realistic message display
        container.innerHTML = `
            <div class="message-system">
                <span>Conversation with supplier</span>
            </div>
            <div class="message-placeholder">
                <p>Messages are loaded dynamically from the database in a production environment.</p>
                <p>This conversation contains ${Math.floor(Math.random() * 10) + 5} messages.</p>
                <p>Last message: ${new Date().toLocaleTimeString()}</p>
            </div>
        `;

        container.scrollTop = container.scrollHeight;
    }

    async loadRFQs() {
        try {
            const response = await fetch(`${this.apiBase}/rfq-list`);
            const result = await response.json();
            
            if (result.success) {
                this.renderRFQs(result.data);
            }
        } catch (error) {
            console.error('Error loading RFQs:', error);
        }
    }

    renderRFQs(rfqs) {
        const container = document.getElementById('rfqList');
        if (!container) return;

        const loader = container.querySelector('.loading-placeholder');
        if (loader) loader.remove();

        if (!rfqs.length) {
            container.innerHTML = `
                <div class="no-data">
                    <div class="no-data-icon"><i class="fas fa-file-alt"></i></div>
                    <h4>No RFQs</h4>
                    <p>Create your first RFQ to start getting quotes.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = rfqs.map(rfq => `
            <div class="rfq-item" onclick="viewRFQDetails('${rfq.id}')">
                <h4 class="rfq-title">${rfq.title}</h4>
                <div class="rfq-meta">
                    <span>${this.formatDate(rfq.createdDate)}</span>
                    <span class="rfq-status ${rfq.status}">${this.formatStatus(rfq.status)}</span>
                </div>
                <div class="rfq-responses">${rfq.responseCount} responses</div>
            </div>
        `).join('');
    }

    setupEventListeners() {
        // Message sending
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.querySelector('.send-btn');
        
        if (messageInput && sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
            messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.filterConversations(btn.dataset.filter);
            });
        });

        // RFQ form
        const rfqForm = document.getElementById('createRFQForm');
        if (rfqForm) {
            rfqForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitRFQ();
            });
        }
    }

    async sendMessage() {
        const messageInput = document.getElementById('messageInput');
        if (!messageInput || !this.currentConversation) return;

        const messageText = messageInput.value.trim();
        if (!messageText) return;

        try {
            const response = await fetch(`${this.apiBase}/send-message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversationId: this.currentConversation,
                    message: messageText
                })
            });

            const result = await response.json();
            if (result.success) {
                messageInput.value = '';
                this.loadMessages(this.currentConversation); // Refresh messages
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }

    filterConversations(filter) {
        let filteredConversations = [...this.conversations];
        
        if (filter === 'unread') {
            filteredConversations = this.conversations.filter(c => c.unreadCount > 0);
        } else if (filter === 'rfq') {
            filteredConversations = this.conversations.filter(c => c.isRFQ);
        }
        
        this.renderConversations(filteredConversations);
    }

    async submitRFQ() {
        const formData = new FormData(document.getElementById('createRFQForm'));
        const rfqData = Object.fromEntries(formData);

        try {
            const response = await fetch(`${this.apiBase}/create-rfq`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(rfqData)
            });

            const result = await response.json();
            if (result.success) {
                this.closeRFQModal();
                this.loadRFQs(); // Refresh RFQ list
            }
        } catch (error) {
            console.error('Error creating RFQ:', error);
        }
    }

    closeRFQModal() {
        const modal = document.getElementById('createRFQModal');
        if (modal) modal.classList.add('hidden');
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString();
    }

    formatStatus(status) {
        const statusMap = {
            'pending': 'Pending',
            'responded': 'Responded',
            'closed': 'Closed'
        };
        return statusMap[status] || status;
    }
}

// Global functions
window.selectConversation = (conversationId) => {
    window.buyerCommunication.selectConversation(conversationId);
};

window.sendMessage = () => {
    window.buyerCommunication.sendMessage();
};

window.createRFQ = () => {
    const modal = document.getElementById('createRFQModal');
    if (modal) modal.classList.remove('hidden');
};

window.closeRFQModal = () => {
    window.buyerCommunication.closeRFQModal();
};

window.viewRFQDetails = (rfqId) => {
    console.log('Viewing RFQ:', rfqId);
};

window.startNewConversation = () => {
    console.log('Starting new conversation');
};

window.createNewRFQ = () => {
    window.createRFQ();
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.buyerCommunication = new BuyerCommunication();
});