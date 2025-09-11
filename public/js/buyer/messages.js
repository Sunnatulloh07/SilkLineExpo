/**
 * Buyer Messages JavaScript
 * Handles messages page interactions and chat functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize messages page
    initializeMessagesPage();
});

/**
 * Initialize messages page
 */
function initializeMessagesPage() {
    // Set up event listeners
    setupEventListeners();
    
    // Load conversations
    loadConversations();
}

/**
 * Load conversations
 */
function loadConversations() {
    fetch('/buyer/api/conversations')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                renderConversations(data.data);
            }
        })
        .catch(error => {
            console.error('Error loading conversations:', error);
        });
}

/**
 * Render conversations list
 */
function renderConversations(conversations) {
    const conversationsList = document.getElementById('conversationsList');
    if (!conversationsList) return;
    
    conversationsList.innerHTML = '';
    
    conversations.forEach(conversation => {
        const conversationElement = createConversationElement(conversation);
        conversationsList.appendChild(conversationElement);
    });
}

/**
 * Create conversation element
 */
function createConversationElement(conversation) {
    const div = document.createElement('div');
    div.className = 'conversation-item';
    div.innerHTML = `
        <div class="conversation-avatar">
            <img src="/assets/images/avatars/default-company.png" alt="${conversation.supplierName}">
        </div>
        <div class="conversation-info">
            <h4>${conversation.supplierName}</h4>
            <p>${conversation.lastMessage}</p>
            <span class="conversation-time">${formatTimeAgo(conversation.lastMessageTime)}</span>
        </div>
        ${conversation.unreadCount > 0 ? `<div class="conversation-indicators">
            <span class="unread-badge">${conversation.unreadCount}</span>
        </div>` : ''}
    `;
    
    // Add click event to select conversation
    div.addEventListener('click', function() {
        selectConversation(conversation);
    });
    
    return div;
}

/**
 * Select conversation
 */
function selectConversation(conversation) {
    // Remove active class from all conversations
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to selected conversation
    event.currentTarget.classList.add('active');
    
    // Update chat header with supplier info
    updateChatHeader(conversation);
}

/**
 * Update chat header
 */
function updateChatHeader(conversation) {
    const chatParticipant = document.querySelector('.chat-participant');
    if (chatParticipant) {
        chatParticipant.innerHTML = `
            <div class="participant-avatar">
                <img src="/assets/images/avatars/default-company.png" alt="${conversation.supplierName}">
            </div>
            <div class="participant-info">
                <h3>${conversation.supplierName}</h3>
                <span class="participant-status online">Online</span>
            </div>
        `;
    }
}

/**
 * Format time ago
 */
function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
        return 'Just now';
    } else if (diffInHours < 24) {
        return `${diffInHours}h ago`;
    } else {
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d ago`;
    }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // New message button
    const newMessageBtn = document.getElementById('newMessageBtn');
    if (newMessageBtn) {
        newMessageBtn.addEventListener('click', function() {
            // In a real implementation, this would open a new message modal
            alert('New message functionality would be implemented here');
        });
    }
    
    // Send message button
    const sendBtn = document.querySelector('.send-btn');
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }
    
    // Enter key in message input
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
}

/**
 * Send message
 */
function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (message) {
        // In a real implementation, this would send the message to the server
        
        // Clear input
        messageInput.value = '';
        
        // Add message to chat (simulated)
        addMessageToChat(message, 'sent');
    }
}

/**
 * Add message to chat
 */
function addMessageToChat(message, type) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    
    if (type === 'received') {
        messageElement.innerHTML = `
            <div class="message-avatar">
                <img src="/assets/images/avatars/default-company.png" alt="Supplier">
            </div>
        `;
    }
    
    messageElement.innerHTML += `
        <div class="message-content">
            <div class="message-text">${message}</div>
            <span class="message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
        </div>
    `;
    
    chatMessages.appendChild(messageElement);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}