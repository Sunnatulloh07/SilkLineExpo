
// 🎯 PROFESSIONAL B2B CHAT APPLICATION
// Note: window.B2BChat is initialized from EJS data in HTML
window.B2BChat = window.B2BChat || {
    // Fallback values if not initialized from EJS
    currentUser: { id: '', type: '', company: '' },
    orderData: { id: '', number: '', status: '', totalAmount: 0 },
    partnerData: { id: '', name: 'Business Partner', email: '' },
    
    // UI State
    sidebarCollapsed: false,
    sectionsCollapsed: { products: false, history: false },
    isTyping: false,
    typingTimeout: null,
    lastActivity: Date.now()
};

// 🚀 INITIALIZE PROFESSIONAL SYSTEM
document.addEventListener('DOMContentLoaded', function() {
    // Wait for dashboard-init.js to load first
    setTimeout(function() {
        // Dashboard-init.js handles dark mode and main sidebar
        // Only initialize chat-specific features
        
        // Initialize chat sidebar toggle (Order Information panel only)
        initializeSidebarToggle();
        
        // Initialize Telegram-style attachment menu
        initializeTelegramAttachmentMenu();
        
        // Listen for main dashboard sidebar toggle events
        initializeDashboardSidebarSync();
        
        // Initialize professional chat features
        initializeProfessionalChat();
        initializeMessageInput();
        initializeScrollBehavior();
        initializeRealTimeFeatures();
        initializeNotificationSystem();
        loadSavedPreferences();
        loadOrderMessages(); // Load existing messages
    }, 200); // Wait for dashboard-init.js to complete
});

function initializeProfessionalChat() {
    const messageInput = document.getElementById('messageInput');
    if (messageInput && !messageInput.disabled) {
        messageInput.focus();
    }
    setInterval(() => { window.B2BChat.lastActivity = Date.now(); }, 30000);
}

// 📨 LOAD ORDER MESSAGES FROM API
async function loadOrderMessages(page = 1, limit = 50) {
    try {
        const response = await fetch(`/manufacturer/messages/api/order/${window.B2BChat.orderData.id}/messages?page=${page}&limit=${limit}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            const { messages, pagination } = result.data;
            
            // FIX: Manually populate senderId if backend didn't do it
            messages.forEach(message => {
                if (typeof message.senderId === 'string') {
                    const senderId = message.senderId;
                    let senderName = 'Unknown User';
                    
                    // Get sender name from order data
                    if (senderId === result.data.order.seller._id) {
                        senderName = result.data.order.seller.companyName;
                    } else if (senderId === result.data.order.buyer._id) {
                        senderName = result.data.order.buyer.companyName;
                    }
                    
                    // Replace string with object
                    message.senderId = {
                        _id: senderId,
                        companyName: senderName
                    };
                }
                
                // Same for recipientId
                if (typeof message.recipientId === 'string') {
                    const recipientId = message.recipientId;
                    let recipientName = 'Unknown User';
                    
                    if (recipientId === result.data.order.seller._id) {
                        recipientName = result.data.order.seller.companyName;
                    } else if (recipientId === result.data.order.buyer._id) {
                        recipientName = result.data.order.buyer.companyName;
                    }
                    
                    message.recipientId = {
                        _id: recipientId,
                        companyName: recipientName
                    };
                }
            });
            
            // Display messages in the chat
            displayMessages(messages);
            
            // Store pagination info for potential infinite scroll
            window.B2BChat.pagination = pagination;
            
        } else {
            throw new Error(result.message || 'Failed to load messages');
        }
        
    } catch (error) {
        console.error('❌ Error loading messages:', error);
        
        // Show error message in chat
        const messagesArea = document.getElementById('messagesArea');
        if (messagesArea) {
            messagesArea.innerHTML = `
                <div class="b2b-error-state">
                    <div class="b2b-error-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h3>Xabarlar yuklanmadi</h3>
                    <p>${error.message}</p>
                    <button class="b2b-retry-btn" onclick="loadOrderMessages()">
                        <i class="fas fa-redo"></i> Qayta urinish
                    </button>
                </div>
            `;
        }
    }
}

// 💬 DISPLAY MESSAGES IN CHAT
function displayMessages(messages) {
    const messagesArea = document.getElementById('messagesArea');
    const emptyState = messagesArea.querySelector('.b2b-empty-state');
    
    if (emptyState) {
        emptyState.remove();
    }
    
    let messagesList = messagesArea.querySelector('.b2b-messages-list');
    if (!messagesList) {
        messagesList = document.createElement('div');
        messagesList.className = 'b2b-messages-list';
        messagesList.id = 'messagesList';
        messagesArea.appendChild(messagesList);
    }
    
    // Clear existing messages
    messagesList.innerHTML = '';
    
    if (messages.length === 0) {
        messagesArea.innerHTML = `
            <div class="b2b-empty-state">
                <div class="b2b-empty-icon">
                    <i class="fas fa-comments"></i>
                </div>
                <h3>Xabarlar mavjud emas</h3>
                <p>Boshlash uchun xabarlar yozing</p>
            </div>
        `;
        return;
    }
    
    // Display each message
    messages.forEach(message => {
        const isOwn = message.senderId._id === window.B2BChat.currentUser.id;
        
        // 🔍 DEBUG: Log message with attachments
        if (message.attachments && message.attachments.length > 0) {
            console.log('📎 Message with attachments:', {
                messageId: message._id,
                content: message.content,
                type: message.type,
                attachments: message.attachments,
                isOwn: isOwn
            });
        }

        addProfessionalMessageToUI(message, isOwn);
    });
    
    // Scroll to bottom
    setTimeout(scrollToBottom, 100);
}

function initializeMessageInput() {
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const charCount = document.getElementById('charCount');
    
    if (!messageInput || !sendButton || !charCount) return;
    
    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 160) + 'px';
        
        const length = this.value.length;
        charCount.textContent = length;
        
        const counter = charCount.parentElement;
        counter.className = 'b2b-char-counter';
        if (length > 8000) counter.classList.add('warning');
        if (length > 9500) counter.classList.add('error');
        
        const hasContent = this.value.trim().length > 0;
        sendButton.disabled = !hasContent;
        sendButton.className = `b2b-send-button ${hasContent ? 'active' : ''}`;
        
        handleTypingIndicator();
    });
}

function initializeScrollBehavior() {
    const messagesArea = document.getElementById('messagesArea');
    if (messagesArea) {
        scrollToBottom();
        messagesArea.style.scrollBehavior = 'smooth';
    }
}

// 📝 PROFESSIONAL MESSAGE HANDLING
function handleProfessionalKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        if (!document.getElementById('sendButton').disabled) {
            sendProfessionalMessage(event);
        }
    }
    if (event.ctrlKey || event.metaKey) {
        if (event.key === 'b') { event.preventDefault(); formatText('bold'); }
        if (event.key === 'i') { event.preventDefault(); formatText('italic'); }
    }
}

function handleProfessionalInputChange() {
    const input = document.getElementById('messageInput');
    const length = input.value.length;
    
    if (length > 10000) {
        input.value = input.value.substring(0, 10000);
        showProfessionalToast('Xabar uzunligi 10,000 ta belgidan oshmasligi kerak', 'warning');
        return;
    }
    
    document.getElementById('charCount').textContent = length;
    const sendButton = document.getElementById('sendButton');
    const hasContent = input.value.trim().length > 0;
    sendButton.disabled = !hasContent;
    sendButton.className = `b2b-send-button ${hasContent ? 'active' : ''}`;
}

async function sendProfessionalMessage(event) {
    event.preventDefault();
    
    const messageInput = document.getElementById('messageInput');
    const content = messageInput.value.trim();
    
    if (!content) {
        showProfessionalToast('Xabar bo\'sh bo\'lishi mumkin emas', 'error');
        return;
    }
    
    const sendButton = document.getElementById('sendButton');
    const originalContent = sendButton.innerHTML;
    
    try {
        messageInput.disabled = true;
        sendButton.disabled = true;
        sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        const response = await fetch('/manufacturer/messages/api/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                orderId: window.B2BChat.orderData.id,
                content: content,
                type: 'text'
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            messageInput.value = '';
            messageInput.style.height = 'auto';
            document.getElementById('charCount').textContent = '0';
            
            addProfessionalMessageToUI({
                _id: result.messageId || Date.now(),
                content: content,
                senderId: {
                    _id: window.B2BChat.currentUser.id,
                    companyName: window.B2BChat.currentUser.company
                },
                createdAt: new Date(),
                type: 'text',
                status: 'sent'
            }, true);
            
            scrollToBottom();
            showProfessionalToast('Xabar muvaffaqiyatli yuborildi', 'success');
        } else {
            throw new Error(result.message || 'Xabar yuborishda xatolik');
        }
    } catch (error) {
        console.error('❌ Error sending message:', error);
        showProfessionalToast('Failed to send message: ' + error.message, 'error');
    } finally {
        messageInput.disabled = false;
        sendButton.innerHTML = originalContent;
        messageInput.focus();
        handleProfessionalInputChange();
    }
}

function addProfessionalMessageToUI(message, isOwn) {
    const messagesArea = document.getElementById('messagesArea');
    const emptyState = messagesArea.querySelector('.b2b-empty-state');
    
    if (emptyState) {
        emptyState.remove();
        const messagesList = document.createElement('div');
        messagesList.className = 'b2b-messages-list';
        messagesList.id = 'messagesList';
        messagesArea.appendChild(messagesList);
    }
    
    const messagesList = messagesArea.querySelector('.b2b-messages-list');
    if (!messagesList) return;
    
    const messageTime = new Date(message.createdAt);
    
    // Check if message has attachments
    if (message.attachments && message.attachments.length > 0) {
        // Render as attachment message
        const attachment = message.attachments[0]; // Use first attachment
        const isImage = attachment.mimetype && attachment.mimetype.startsWith('image/');
        
        const attachmentHTML = `
            <div class="b2b-message-group ${isOwn ? 'own' : 'partner'}">
                <div class="b2b-message-content">
                    <div class="b2b-message-bubble b2b-attachment-message">
                        ${isImage ? 
                            `<div class="b2b-image-attachment">
                                <img src="${attachment.url}" alt="${attachment.originalName}" onclick="openImageModal('${attachment.url}', '${attachment.originalName}')" onerror="this.src='/assets/images/no-image.png'; this.onerror=null;">
                                <div class="b2b-image-overlay">
                                    <i class="fas fa-search-plus"></i>
                                </div>
                            </div>` :
                            `<div class="b2b-file-attachment">
                                <div class="b2b-file-icon">
                                    <i class="fas fa-file-alt"></i>
                                </div>
                                <div class="b2b-file-details">
                                    <h6>${attachment.originalName}</h6>
                                    <p>${formatFileSize(attachment.size)}</p>
                                </div>
                                <div class="b2b-file-actions">
                                    <a href="${attachment.url}" download="${attachment.originalName}" class="b2b-file-download">
                                        <i class="fas fa-download"></i>
                                    </a>
                                </div>
                            </div>`
                        }
                        <div class="b2b-message-footer">
                            <div class="b2b-message-time">
                                <i class="fas fa-clock"></i>
                                <span>${messageTime.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</span>
                            </div>
                            ${isOwn ? '<div class="b2b-message-status"><i class="fas fa-check status-sent" title="Sent"></i></div>' : ''}
                        </div>
                    </div>
                </div>
                ${isOwn ? `<div class="b2b-message-avatar"><img src="/assets/images/avatars/manufacturer-avatar.png" alt="${window.B2BChat.currentUser.company}" onerror="this.src='/assets/images/avatars/default.png'"></div>` : ''}
            </div>
        `;
        messagesList.insertAdjacentHTML('beforeend', attachmentHTML);
    } else {
        // Render as regular text message
        const messageHTML = `
            <div class="b2b-message-group ${isOwn ? 'own' : 'partner'}">
                <div class="b2b-message-content">
                    <div class="b2b-message-bubble">
                        <div class="b2b-message-text">${escapeHtml(message.content).replace(/\n/g, '<br>')}</div>
                        <div class="b2b-message-footer">
                            <div class="b2b-message-time">
                                <i class="fas fa-clock"></i>
                                <span>${messageTime.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</span>
                            </div>
                            ${isOwn ? '<div class="b2b-message-status"><i class="fas fa-check status-sent" title="Sent"></i></div>' : ''}
                        </div>
                    </div>
                </div>
                ${isOwn ? `<div class="b2b-message-avatar"><img src="/assets/images/avatars/manufacturer-avatar.png" alt="${window.B2BChat.currentUser.company}" onerror="this.src='/assets/images/avatars/default.png'"></div>` : ''}
            </div>
        `;
        messagesList.insertAdjacentHTML('beforeend', messageHTML);
    }
}

// 🎨 PROFESSIONAL BUSINESS TEMPLATES
function useBusinessTemplate(type) {
    const templates = {
        welcome: 'Salom ' + window.B2BChat.partner.companyName + ',\n\n' +
            'Bizning ' + window.B2BChat.currentUser.company + ' dan xabar!\n\n' +
            'Sizning buyurtmangiz #' + window.B2BChat.orderData.orderNumber + ' qabul qilindi. Bizning profesional jamoa sizning talablaringizni to\'liq ko\'rib chiqmoqda.\n\n' +
            'Sizga to\'liq yangilanishlar tez orada beriladi.\n\n' +
            'Rahmat,\n' + window.B2BChat.currentUser.company + '\nBiznes rivojlanish jamoa',

        status: 'Buyurtma yangilanishi - #' + window.B2BChat.orderData.orderNumber + '\n\n' +
            '📋 Joriy holat: ' + window.B2BChat.orderData.status + '\n' +
            '💰 Umumiy qiymat: $' + parseFloat(window.B2BChat.orderData.totalAmount || 0).toLocaleString() + '\n' +
            '⏱️ Estimatetimeline: 7-10 biznes kunlar\n\n' +
            'Bizning ishlab chiqarish jamoa sizga eng yaxshi xizmatni taqdim etishga tayyor. Ixtiyoriy savolingiz bo\'lsa, bizga murojaat qiling.\n\n' +
            'Rahmat,\n' + window.B2BChat.currentUser.company,

        pricing: 'Narxlarini o\'zlashtirish\n\n' +
            'Bizning mahsulotlarimizga qiziqishni bildirganingiz uchun rahmat. Biz sizga qiymatli biznes hamkorlarimiz uchun qiyosiy narxlar va fleksible shartlar taqdim etamiz.\n\n' +
            'Bizning qiymat ta\'minotimiz:\n' +
            '• Haqiqiy narxlar mavjud\n' + 
            '• Fleksible to\'lov shartlari\n' +
            '• Sifat nazorat mavjud\n' +
            '• Professional qadoqlash va himoya\n\n' +
            'Rahmat,\n' + window.B2BChat.currentUser.company,

        quality: 'Sifat nazorat\n\n' +
            'Bizning sifat standartlari:\n' +
            '✅ ISO 9001:2015 sertifikatlangan ishlab chiqarish\n' +
            '✅ Xalqaro muvofiqlash shartlari\n' +
            '✅ Mahsulotlarga individual sifat nazorat\n' +
            '✅ Professional qadoqlash va himoya\n' +
            '✅ 100% sifat nazorat\n\n' +
            'Sizning tavakkaliga bizning mahsulotlarimizni yetkazib berishga tayyorimiz. Biz har bir mahsulotimizni qo\'llab-quvvatlaymiz.\n\n' +
            'Sifat jamoa,\n' + window.B2BChat.currentUser.company
    };
    
    const template = templates[type] || '';
    if (template) {
        const input = document.getElementById('messageInput');
        input.value = template;
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 160) + 'px';
        input.focus();
        handleProfessionalInputChange();
        showProfessionalToast(`Professional ${type} template yuklandi`, 'success');
    }
}

// 🔧 SIDEBAR & UI CONTROLS - FULLY COLLAPSIBLE WITH PROPER EVENT HANDLING
function initializeSidebarToggle() {
    const sidebar = document.querySelector('.b2b-order-sidebar');
    const chatLayout = document.querySelector('.b2b-chat-layout');
    const toggleButton = document.getElementById('chatSidebarToggle');
    
    if (!sidebar || !chatLayout || !toggleButton) {
        return;
    }
    
    // Add event listener to the button
    toggleButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        toggleSidebar();
    });
}

// 🔄 DASHBOARD SIDEBAR SYNCHRONIZATION
function initializeDashboardSidebarSync() {
    // Listen for dashboard sidebar toggle events
    window.addEventListener('sidebarToggled', function(event) {
        const mainElement = document.querySelector('.admin-main');
        if (mainElement && event.detail) {
            const { collapsed } = event.detail;
            
            if (collapsed) {
                mainElement.classList.add('sidebar-collapsed');
            } else {
                mainElement.classList.remove('sidebar-collapsed');
            }
        }
    });
    
    // Also check current sidebar state on load
    const currentSidebarState = localStorage.getItem('sidebarCollapsed') === 'true';
    const mainElement = document.querySelector('.admin-main');
    
    if (mainElement && currentSidebarState) {
        mainElement.classList.add('sidebar-collapsed');
    }
}

// 📎 TELEGRAM-STYLE ATTACHMENT MENU
function initializeTelegramAttachmentMenu() {
    const attachmentBtn = document.getElementById('attachmentBtn');
    const attachmentMenu = document.getElementById('attachmentMenu');
    
    if (!attachmentBtn || !attachmentMenu) {
        console.warn('⚠️ Fayl elementlari topilmadi');
        return;
    }
    
    // Toggle menu on button click
    attachmentBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const isMenuOpen = attachmentMenu.classList.contains('show');
        
        if (isMenuOpen) {
            closeTelegramMenu();
        } else {
            openTelegramMenu();
        }
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!attachmentBtn.contains(e.target) && !attachmentMenu.contains(e.target)) {
            closeTelegramMenu();
        }
    });
    
    // Close menu on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && attachmentMenu.classList.contains('show')) {
            closeTelegramMenu();
        }
    });
}

function openTelegramMenu() {
    const attachmentBtn = document.getElementById('attachmentBtn');
    const attachmentMenu = document.getElementById('attachmentMenu');
    
    attachmentBtn.classList.add('active');
    attachmentMenu.classList.add('show');
    
    // Add subtle animation
    setTimeout(() => {
        attachmentMenu.style.transform = 'translateY(0) scale(1)';
    }, 10);
}

function closeTelegramMenu() {
    const attachmentBtn = document.getElementById('attachmentBtn');
    const attachmentMenu = document.getElementById('attachmentMenu');
    
    attachmentBtn.classList.remove('active');
    attachmentMenu.classList.remove('show');
}

function toggleSidebar() {
    const sidebar = document.querySelector('.b2b-order-sidebar');
    const chatLayout = document.querySelector('.b2b-chat-layout');
    const toggle = document.querySelector('.b2b-sidebar-toggle i');
    
    if (!sidebar || !chatLayout) {
        return;
    }
    
    window.B2BChat.sidebarCollapsed = !window.B2BChat.sidebarCollapsed;
    
    if (window.B2BChat.sidebarCollapsed) {
        sidebar.classList.add('collapsed');
        // Fully collapsed - only toggle button visible
        chatLayout.style.gridTemplateColumns = '1fr 50px';
        
        // Add smooth animation
        sidebar.style.transition = 'all 0.3s ease';
        setTimeout(() => {
            sidebar.style.transition = '';
        }, 300);
    } else {
        sidebar.classList.remove('collapsed');
        // Fully expanded
        chatLayout.style.gridTemplateColumns = '1fr 380px';
        
        // Add smooth animation
        sidebar.style.transition = 'all 0.3s ease';
        setTimeout(() => {
            sidebar.style.transition = '';
        }, 300);
    }
    
    localStorage.setItem('b2b-sidebar-collapsed', window.B2BChat.sidebarCollapsed);
}

function toggleSection(sectionName) {
    const section = document.getElementById(`${sectionName}Section`);
    const toggle = document.querySelector(`button[onclick="toggleSection('${sectionName}')"] i`);
    
    if (!section || !toggle) return;
    
    window.B2BChat.sectionsCollapsed[sectionName] = !window.B2BChat.sectionsCollapsed[sectionName];
    
    if (window.B2BChat.sectionsCollapsed[sectionName]) {
        section.style.display = 'none';
        toggle.style.transform = 'rotate(-90deg)';
    } else {
        section.style.display = 'flex';
        toggle.style.transform = 'rotate(0deg)';
    }
    
    localStorage.setItem(`b2b-section-${sectionName}-collapsed`, window.B2BChat.sectionsCollapsed[sectionName]);
}

// 🎯 UTILITY FUNCTIONS
function scrollToBottom() {
    const container = document.getElementById('messagesArea');
    if (container) container.scrollTop = container.scrollHeight;
}

function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// 🌐 PROFESSIONAL REAL-TIME FEATURES
function initializeRealTimeFeatures() {
    // WebSocket connection for real-time messaging (placeholder)
    if (typeof io !== 'undefined') {
        window.B2BChat.socket = io();
        window.B2BChat.socket.on('message', handleIncomingMessage);
        window.B2BChat.socket.on('typing', showTypingIndicator);
        window.B2BChat.socket.on('stop-typing', hideTypingIndicator);
        window.B2BChat.socket.on('message-read', updateMessageStatus);
    }
    
    // Simulate real-time features for demo
    setInterval(simulatePartnerActivity, 30000);
    
    // Auto-refresh messages every 30 seconds
    setInterval(refreshMessages, 30000);
}

function initializeNotificationSystem() {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
    
    // Initialize browser visibility API for read receipts
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Initialize service worker for push notifications (if available)
    if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
        fetch('/sw.js')
            .then(() => navigator.serviceWorker.register('/sw.js'))
            .then(() => {})
            .catch(() => {})
    }
}

function handleIncomingMessage(message) {
    addProfessionalMessageToUI(message, false);
    scrollToBottom();
    
    // Show notification if page is not visible
    if (document.hidden) {
        showDesktopNotification(
            `Yangi xabar ${message.senderId?.companyName || 'Biznes hamkor'} dan`,
            message.content.substring(0, 100)
        );
    }
    
    // Play notification sound
    playNotificationSound();
    
    // Update unread count
    updateUnreadCount();
}

function handleTypingIndicator() {
    if (window.B2BChat.typingTimeout) clearTimeout(window.B2BChat.typingTimeout);
    
    if (!window.B2BChat.isTyping) {
        window.B2BChat.isTyping = true;
        // Emit typing event to socket
        if (window.B2BChat.socket) {
            window.B2BChat.socket.emit('typing', {
                orderId: window.B2BChat.orderData.id,
                userId: window.B2BChat.currentUser.id
            });
        }
    }
    
    window.B2BChat.typingTimeout = setTimeout(() => { 
        window.B2BChat.isTyping = false;
        if (window.B2BChat.socket) {
            window.B2BChat.socket.emit('stop-typing', {
                orderId: window.B2BChat.orderData.id,
                userId: window.B2BChat.currentUser.id
            });
        }
    }, 2000);
}

function showTypingIndicator(data) {
    const messagesArea = document.getElementById('messagesArea');
    const existingIndicator = messagesArea.querySelector('.b2b-typing-indicator');
    
    if (!existingIndicator) {
        const typingHTML = `
            <div class="b2b-typing-indicator">
                <div class="b2b-message-avatar">
                    <img src="/assets/images/avatars/default-company.png" 
                         alt="Partner" 
                         onerror="this.src='/assets/images/avatars/default.png'">
                </div>
                <div class="b2b-typing-content">
                    <span>${window.B2BChat.partnerData.name} yozmoqda</span>
                    <div class="b2b-typing-dots">
                        <div class="b2b-typing-dot"></div>
                        <div class="b2b-typing-dot"></div>
                        <div class="b2b-typing-dot"></div>
                    </div>
                </div>
            </div>
        `;
        messagesArea.insertAdjacentHTML('beforeend', typingHTML);
        scrollToBottom();
    }
}

function hideTypingIndicator() {
    const indicator = document.querySelector('.b2b-typing-indicator');
    if (indicator) indicator.remove();
}

function handleVisibilityChange() {
    if (!document.hidden) {
        // Mark messages as read when user returns to page
        // (API automatically marks messages as read when loaded)
        
        // Clear notification badge
        if (typeof clearNotificationBadge === 'function') {
            clearNotificationBadge();
        }
    }
}

function showDesktopNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(title, {
            body: body,
            icon: '/assets/images/logo-icon.png',
            badge: '/assets/images/logo-icon.png',
            tag: 'b2b-chat',
            requireInteraction: false
        });
        
        notification.onclick = function() {
            window.focus();
            notification.close();
        };
        
        setTimeout(() => notification.close(), 5000);
    }
}

function playNotificationSound() {
    try {
        const audio = new Audio('/assets/sounds/notification.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => {}); // Ignore autoplay restrictions
    } catch (error) {
        console.log('E\'lon qo\'shilmasa');
    }
}

async function refreshMessages() {
    try {
        const response = await fetch(`/manufacturer/messages/api/order/${window.B2BChat.orderData.id}/messages`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.messages) {
                updateMessagesDisplay(data.messages);
            }
        }
    } catch (error) {
        console.log('Avtomatik yangilashda xatolik:', error);
    }
}

function updateMessagesDisplay(newMessages) {
    const currentMessages = document.querySelectorAll('.b2b-message-group').length;
    if (newMessages.length > currentMessages) {
        // Add new messages
        const messagesToAdd = newMessages.slice(currentMessages);
        messagesToAdd.forEach(message => {
            const isOwn = message.senderId?._id === window.B2BChat.currentUser.id;
            addProfessionalMessageToUI(message, isOwn);
        });
        scrollToBottom();
    }
}

function simulatePartnerActivity() {
    // Simulate partner online status updates
    const partnerAvatar = document.querySelector('.b2b-partner-avatar::after');
    if (partnerAvatar && Math.random() > 0.7) {
        // Randomly show partner as active
        console.log('Hamkor faoliyati simulyatsiyasi');
    }
}

// 📎 TELEGRAM-STYLE FILE & ATTACHMENT SYSTEM
function attachFile() { 
    closeTelegramMenu(); // Close menu first
    document.getElementById('fileInput').click(); 
}

function attachImage() { 
    closeTelegramMenu(); // Close menu first
    document.getElementById('imageInput').click(); 
}

function insertEmoji() {
    closeTelegramMenu(); // Close menu first
    showProfessionalToast('Emoji tanlash keladi', 'info');
}

async function handleFileSelect(event) { 
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
        showProfessionalToast('Fayl hajmi 50MB dan oshmasligi kerak', 'error');
        return;
    }
    
    // Show file preview ONLY - don't upload yet
    showFilePreview(file, 'document');
}

async function handleImageSelect(event) { 
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate image file
    if (!file.type.startsWith('image/')) {
        showProfessionalToast('Iltimos, to\'g\'ri rasm faylini tanlang', 'error');
        return;
    }
    
    // Validate file size (max 10MB for images)
    if (file.size > 10 * 1024 * 1024) {
        showProfessionalToast('Rasm hajmi 10MB dan oshmasligi kerak', 'error');
        return;
    }
    
    // Show image preview ONLY - don't upload yet
    showFilePreview(file, 'image');
}

// Global variable to store selected file
let selectedFileForUpload = null;

function showFilePreview(file, type) {
    // Store file globally for later upload
    selectedFileForUpload = { file, type };
    
    console.log('🖼️ Creating file preview:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        type: type
    });
    
    // Create blob URL
    let blobUrl = '';
    try {
        blobUrl = URL.createObjectURL(file);
        console.log('✅ Blob URL created:', blobUrl);
    } catch (error) {
        console.error('❌ Failed to create blob URL:', error);
        showProfessionalToast('Fayl ko\'rishini yaratishda xatolik', 'error');
        return;
    }
    
    const previewHTML = `
        <div class="b2b-file-preview" id="filePreview" onclick="closeFilePreview()">
            <div class="b2b-modal-container" onclick="event.stopPropagation()">
                <div class="b2b-modal-header">
                    <div class="b2b-modal-title">
                        <div class="b2b-modal-icon">
                            <i class="fas fa-${type === 'image' ? 'image' : 'file'}"></i>
                        </div>
                        <span class="b2b-modal-text">${type === 'image' ? 'Rasm ko\'rish' : 'Fayl ko\'rish'}</span>
                    </div>
                    <button class="b2b-modal-close" onclick="closeFilePreview()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="b2b-modal-body">
                    ${type === 'image' ? 
                        `<div class="b2b-image-preview-area">
                            <img id="previewImage" 
                                 src="${blobUrl}" 
                                 alt="${file.name}" 
                                 onload="this.style.opacity='1';" 
                                 class="b2b-preview-image"
                                 style="opacity: 0; transition: opacity 0.3s ease;">
                            <div id="imageError" class="b2b-error-fallback" style="display: none;">
                                <div class="b2b-error-icon">
                                    <i class="fas fa-exclamation-triangle"></i>
                                </div>
                                <div class="b2b-error-title">Rasm ko\'rishini yuklashda xatolik</div>
                                <div class="b2b-error-filename">${file.name}</div>
                                <div class="b2b-error-details">${formatFileSize(file.size)} • ${file.type}</div>
                                <div class="b2b-error-note">Rasm ko\'rishini yuklashda xatolik</div>
                            </div>
                        </div>` :
                        `<div class="b2b-image-preview-area">
                            <div class="b2b-file-icon-display">
                                <i class="fas fa-file-alt"></i>
                            </div>
                        </div>`
                    }
                    <div class="b2b-file-metadata">
                        <div class="b2b-file-details">
                            <div class="b2b-detail-item">
                                <span class="b2b-detail-label">Fayl nomi</span>
                                <span class="b2b-detail-value">${file.name}</span>
                            </div>
                            <div class="b2b-detail-item">
                                <span class="b2b-detail-label">Fayl hajmi</span>
                                <span class="b2b-detail-value">${formatFileSize(file.size)}</span>
                            </div>
                            <div class="b2b-detail-item">
                                <span class="b2b-detail-label">Fayl turi</span>
                                <span class="b2b-detail-value">${file.type || 'Noma\'lum'}</span>
                            </div>
                            <div class="b2b-detail-item">
                                <span class="b2b-detail-label">Oxirgi o'zgarish</span>
                                <span class="b2b-detail-value">${new Date(file.lastModified).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="b2b-modal-footer">
                    <button class="b2b-modal-btn b2b-modal-btn-secondary" onclick="closeFilePreview()">
                        <i class="fas fa-times"></i> Bekor qilish
                    </button>
                    <button class="b2b-modal-btn b2b-modal-btn-primary" onclick="confirmFileUpload()">
                        <i class="fas fa-upload"></i> Fayl yuklash
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', previewHTML);
    
    // Force re-render and debug
    setTimeout(() => {
        const img = document.getElementById('previewImage');
        if (img) {
            console.log('🔄 Image element created:', {
                src: img.src,
                complete: img.complete,
                naturalWidth: img.naturalWidth,
                naturalHeight: img.naturalHeight,
                offsetWidth: img.offsetWidth,
                offsetHeight: img.offsetHeight,
                style: img.style.cssText
            });
            
            // Force reload if not loaded
            if (!img.complete || img.naturalWidth === 0) {
                console.log('🔄 Force reloading image...');
                const currentSrc = img.src;
                img.src = '';
                img.src = currentSrc;
                
                // If still fails after 2 seconds, try FileReader
                setTimeout(() => {
                    if (!img.complete || img.naturalWidth === 0) {
                        console.log('🔄 Switching to FileReader method...');
                        showImagePreviewWithFileReader(selectedFileForUpload.file);
                    }
                }, 2000);
            }
        }
    }, 100);
}

function showImageError(imgElement) {
    console.log('🚨 Showing image error fallback');
    imgElement.style.display = 'none';
    const errorDiv = document.getElementById('imageError');
    if (errorDiv) {
        errorDiv.style.display = 'block';
    }
}

// Alternative method using FileReader (backup)
function showImagePreviewWithFileReader(file) {
    console.log('📖 Using FileReader as backup method');
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = document.getElementById('previewImage');
        if (img) {
            console.log('✅ FileReader loaded successfully');
            img.src = e.target.result;
            img.style.opacity = '1';
        }
    };
    
    reader.onerror = function(e) {
        console.error('❌ FileReader failed:', e);
        const img = document.getElementById('previewImage');
        if (img) {
            showImageError(img);
        }
    };
    
    reader.readAsDataURL(file);
}

function closeFilePreview() {
    const preview = document.getElementById('filePreview');
    const overlay = document.querySelector('.b2b-preview-overlay');
    
    // Clean up blob URL to prevent memory leaks
    const img = document.getElementById('previewImage');
    if (img && img.src && img.src.startsWith('blob:')) {
        console.log('🧹 Cleaning up blob URL:', img.src);
        URL.revokeObjectURL(img.src);
    }
    
    if (preview) preview.remove();
    if (overlay) overlay.remove();
    
    // Clear selected file
    selectedFileForUpload = null;
}

async function confirmFileUpload() {
    if (!selectedFileForUpload) {
        showProfessionalToast('Fayl tanlanmadi', 'error');
        return;
    }
    
    const { file, type } = selectedFileForUpload;
    
    try {
        // Close preview modal first
        closeFilePreview();
        
        // Show uploading toast
        showProfessionalToast(`Uploading "${file.name}"...`, 'info');
        
        // Upload the file
        await uploadAttachment(file, type);
        
        // Show success message
        showProfessionalToast(`${type === 'image' ? 'Rasm' : 'Fayl'} "${file.name}" muvaffaqiyatli yuklandi`, 'success');
        
        // Clear file input
        document.getElementById(type === 'image' ? 'imageInput' : 'fileInput').value = '';
        
    } catch (error) {
        console.error('Upload error:', error);
        showProfessionalToast(`"${file.name}" yuklashda xatolik: ${error.message}`, 'error');
    }
}

async function uploadAttachment(file, type) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('orderId', window.B2BChat.orderData.id);
    formData.append('type', type);
    
    const response = await fetch('/manufacturer/messages/api/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
    }
    
    const result = await response.json();
    if (!result.success) {
        throw new Error(result.message || 'Upload failed');
    }
    
    // Add attachment message to UI using backend response
    const attachmentData = result.data?.attachment;
    if (attachmentData) {
        addAttachmentMessageToUI({
            _id: attachmentData.id || Date.now(),
            content: attachmentData.originalName || file.name,
            type: attachmentData.type?.startsWith('image/') ? 'image' : 'file',
            attachments: [{
                url: attachmentData.url,
                originalName: attachmentData.originalName || file.name,
                mimetype: attachmentData.type || file.type,
                size: attachmentData.size || file.size
            }],
            senderId: {
                _id: window.B2BChat.currentUser.id,
                companyName: window.B2BChat.currentUser.company
            },
            createdAt: new Date()
        }, true);
    }
    
    closeFilePreview();
    scrollToBottom();
    
    return result;
}

function addAttachmentMessageToUI(message, isOwn) {
    const messagesArea = document.getElementById('messagesArea');
    const emptyState = messagesArea.querySelector('.b2b-empty-state');
    
    if (emptyState) {
        emptyState.remove();
        const messagesList = document.createElement('div');
        messagesList.className = 'b2b-messages-list';
        messagesList.id = 'messagesList';
        messagesArea.appendChild(messagesList);
    }
    
    const messagesList = messagesArea.querySelector('.b2b-messages-list');
    if (!messagesList) return;
    
    const messageTime = new Date(message.createdAt);
    
    // Determine if this is an image based on message type or attachment info
    const isImage = message.type === 'image' || 
                   (message.attachments && message.attachments.length > 0 && 
                    message.attachments[0].mimetype && message.attachments[0].mimetype.startsWith('image/'));
    
    // Get attachment info
    let attachmentInfo = {};
    if (message.attachments && message.attachments.length > 0) {
        // Use attachment data
        const attachment = message.attachments[0];
        attachmentInfo = {
            url: attachment.url,
            name: attachment.originalName,
            size: attachment.size
        };
    } else {
        // Fallback to message properties (for newly uploaded files)
        attachmentInfo = {
            url: message.attachmentUrl || message.content,
            name: message.fileName || message.originalName || 'File',
            size: message.fileSize || 0
        };
    }
    
    const attachmentHTML = `
        <div class="b2b-message-group ${isOwn ? 'own' : 'partner'}">
            <div class="b2b-message-content">
                <div class="b2b-message-bubble b2b-attachment-message">
                    ${isImage ? 
                        `<div class="b2b-image-attachment">
                            <img src="${attachmentInfo.url}" alt="${attachmentInfo.name}" onclick="openImageModal('${attachmentInfo.url}', '${attachmentInfo.name}')" onerror="this.src='/assets/images/no-image.png'; this.onerror=null;">
                            <div class="b2b-image-overlay">
                                <i class="fas fa-search-plus"></i>
                            </div>
                        </div>` :
                        `<div class="b2b-file-attachment">
                            <div class="b2b-file-icon">
                                <i class="fas fa-file-alt"></i>
                            </div>
                            <div class="b2b-file-details">
                                <h6>${attachmentInfo.name}</h6>
                                <p>${formatFileSize(attachmentInfo.size)}</p>
                            </div>
                            <div class="b2b-file-actions">
                                <a href="${attachmentInfo.url}" download="${attachmentInfo.name}" class="b2b-file-download">
                                    <i class="fas fa-download"></i>
                                </a>
                            </div>
                        </div>`
                    }
                    <div class="b2b-message-footer">
                        <div class="b2b-message-time">
                            <i class="fas fa-clock"></i>
                            <span>${messageTime.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</span>
                        </div>
                        ${isOwn ? '<div class="b2b-message-status"><i class="fas fa-check status-sent" title="Sent"></i></div>' : ''}
                    </div>
                </div>
            </div>
            ${isOwn ? `<div class="b2b-message-avatar"><img src="/assets/images/avatars/manufacturer-avatar.png" alt="${window.B2BChat.currentUser.company}" onerror="this.src='/assets/images/avatars/default.png'"></div>` : ''}
        </div>
    `;
    
    messagesList.insertAdjacentHTML('beforeend', attachmentHTML);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function openImageModal(src, fileName) {
    const modalHTML = `
        <div class="b2b-image-modal" id="imageModal" onclick="closeImageModal()">
            <div class="b2b-image-modal-content" onclick="event.stopPropagation()">
                <div class="b2b-image-modal-header">
                    <h4>${fileName}</h4>
                    <button class="b2b-modal-close" onclick="closeImageModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="b2b-image-modal-body">
                    <img src="${src}" alt="${fileName}">
                </div>
                <div class="b2b-image-modal-footer">
                    <a href="${src}" download="${fileName}" class="b2b-action-btn primary">
                        <i class="fas fa-download"></i> Download
                    </a>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeImageModal() {
    const modal = document.getElementById('imageModal');
    if (modal) modal.remove();
}

function formatText(format) {
    const input = document.getElementById('messageInput');
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const selectedText = input.value.substring(start, end);
    
    if (!selectedText) {
        showProfessionalToast('Iltimos, formatlash uchun matnni tanlang', 'warning');
        return;
    }
    
    let formattedText = selectedText;
    if (format === 'bold') formattedText = `**${selectedText}**`;
    if (format === 'italic') formattedText = `*${selectedText}*`;
    
    input.value = input.value.substring(0, start) + formattedText + input.value.substring(end);
    input.focus();
    input.setSelectionRange(start, start + formattedText.length);
    handleProfessionalInputChange();
}

function insertEmoji() { showProfessionalToast('Emoji tanlash keladi', 'info'); }
function showTemplates() { showProfessionalToast('Advanced template tanlash keladi', 'info'); }

// 🚀 BUSINESS ACTIONS
function viewOrderDetails() { window.open(`/manufacturer/orders/${window.B2BChat.orderData.id}`, '_blank'); }
function updateOrderStatus() { window.open(`/manufacturer/orders/${window.B2BChat.orderData.id}`, '_blank'); }
function generateQuote() { showProfessionalToast('Professional quote generation coming soon', 'info'); }
function scheduleVideoCall() { showProfessionalToast('Video conferencing integration coming soon', 'info'); }
function sendSample() { showProfessionalToast('Sample request system coming soon', 'info'); }
function requestPayment() { showProfessionalToast('Payment request system coming soon', 'info'); }
function exportChatHistory() { showProfessionalToast('Professional chat export coming soon', 'info'); }
function initiateCall() { showProfessionalToast('Voice calling integration coming soon', 'info'); }
function sendEmail() {
    if (window.B2BChat.partner.email) {
        window.open(`mailto:${window.B2BChat.partner.email}?subject=Regarding Order #${window.B2BChat.orderData.orderNumber}`);
    } else {
        showProfessionalToast('Hamkor elektron pochta mavjud emas', 'warning');
    }
}
function viewProfile() { showProfessionalToast('Hamkor profili keladi', 'info'); }

// 🎯 PROFESSIONAL TOAST SYSTEM
function showProfessionalToast(message, type = 'info') {
    if (window.showToast) { window.showToast(message, type); return; }
    
    const toast = document.createElement('div');
    toast.innerHTML = `<div><i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i><span>${message}</span></div>`;
    toast.style.cssText = 'position:fixed;top:20px;right:20px;background:var(--b2b-bg-elevated);border:1px solid var(--b2b-border);border-radius:var(--b2b-radius-lg);padding:var(--b2b-space-md) var(--b2b-space-lg);box-shadow:var(--b2b-shadow-lg);z-index:9999;opacity:0;transform:translateX(100%);transition:all 0.3s ease;font-family:var(--b2b-font-family);font-size:var(--b2b-font-size-sm);color:var(--b2b-text-primary);max-width:400px;';
    
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '1'; toast.style.transform = 'translateX(0)'; }, 100);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
    }, 3000);
}

// 🔄 LOAD PREFERENCES
// 🌙 DARK MODE - LET DASHBOARD-INIT.JS HANDLE IT
function initializeDarkModeSupport() {
    // Dashboard-init.js handles all theme functionality
    // This function exists for compatibility but does nothing
    // Theme is managed by the main dashboard system
}

function loadSavedPreferences() {
    // Load sidebar collapse state
    if (localStorage.getItem('b2b-sidebar-collapsed') === 'true') toggleSidebar();
    
    // Load section collapse states
    ['products', 'history'].forEach(section => {
        if (localStorage.getItem(`b2b-section-${section}-collapsed`) === 'true') toggleSection(section);
    });
}

