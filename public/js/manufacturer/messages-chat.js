
// 🎯 PROFESSIONAL B2B CHAT APPLICATION
// Note: window.B2BChat is initialized from EJS data in HTML

// Global translation function for JavaScript
window.getTranslation = function(key, fallback = '') {
  if (typeof window.i18next !== 'undefined' && window.i18next.t) {
    return window.i18next.t(key);
  }
  if (typeof window.t !== 'undefined') {
    return window.t(key);
  }
  return fallback || key;
};

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
        loadConversationMessages(); // Load existing messages
    }, 200); // Wait for dashboard-init.js to complete
});

function initializeProfessionalChat() {
    const messageInput = document.getElementById('messageInput');
    if (messageInput && !messageInput.disabled) {
        messageInput.focus();
    }
    setInterval(() => { window.B2BChat.lastActivity = Date.now(); }, 30000);
}

// 📨 LOAD CONVERSATION MESSAGES FROM API (Order or Inquiry)
async function loadConversationMessages(page = 1, limit = 50) {
    try {
        const conversationType = window.B2BChat.conversationType;
        const conversationId = conversationType === 'inquiry' ? 
            window.B2BChat.inquiryData?.id : 
            window.B2BChat.orderData?.id;
        
        
        if (!conversationId || conversationId === 'null') {
            throw new Error('Conversation ID not found');
        }
        
        const response = await fetch(`/manufacturer/messages/api/${conversationType}/${conversationId}/messages?page=${page}&limit=${limit}`, {
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
                    
                    // Get sender name from conversation data
                    if (conversationType === 'order' && result.data.order) {
                        if (senderId === result.data.order.seller._id) {
                            senderName = result.data.order.seller.companyName;
                        } else if (senderId === result.data.order.buyer._id) {
                            senderName = result.data.order.buyer.companyName;
                        }
                    } else if (conversationType === 'inquiry' && result.data.inquiry) {
                        if (senderId === result.data.inquiry.supplier._id) {
                            senderName = result.data.inquiry.supplier.companyName;
                        } else if (senderId === result.data.inquiry.inquirer._id) {
                            senderName = result.data.inquiry.inquirer.companyName;
                        }
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
                    
                    if (conversationType === 'order' && result.data.order) {
                        if (recipientId === result.data.order.seller._id) {
                            recipientName = result.data.order.seller.companyName;
                        } else if (recipientId === result.data.order.buyer._id) {
                            recipientName = result.data.order.buyer.companyName;
                        }
                    } else if (conversationType === 'inquiry' && result.data.inquiry) {
                        if (recipientId === result.data.inquiry.supplier._id) {
                            recipientName = result.data.inquiry.supplier.companyName;
                        } else if (recipientId === result.data.inquiry.inquirer._id) {
                            recipientName = result.data.inquiry.inquirer.companyName;
                        }
                    }
                    
                    message.recipientId = {
                        _id: recipientId,
                        companyName: recipientName
                    };
                }
            });
            
            // Display messages in the chat - PRESERVE MIXED CONTENT
            smartDisplayMessages(messages);
            
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
                    <button class="b2b-retry-btn" onclick="loadConversationMessages()">
                        <i class="fas fa-redo"></i> Qayta urinish
                    </button>
                </div>
            `;
        }
    }
}

// 💬 SMART DISPLAY MESSAGES - PRESERVES MIXED CONTENT
function smartDisplayMessages(messages) {
    const messagesList = document.getElementById('messagesList');
    if (!messagesList) return;
    
    // Check if messages are already displayed
    const existingMessages = messagesList.querySelectorAll('.b2b-message-group');
    
    if (existingMessages.length === 0) {
        // First load - display all messages with mixed content
        displayMessages(messages);
    } else {
        // Subsequent loads - only add new messages
        const currentCount = existingMessages.length;
        if (messages.length > currentCount) {
            const newMessages = messages.slice(currentCount);
            newMessages.forEach(message => {
                const isOwn = message.senderId?._id === window.B2BChat.currentUser.id;
                const messageElement = createMessageElement(message, isOwn);
                messagesList.appendChild(messageElement);
            });
            scrollToBottom();
        }
    }
}

// 💬 DISPLAY MESSAGES IN CHAT (ORIGINAL FUNCTION)
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
    const hasFile = selectedFileForUpload !== null;
    
    sendButton.disabled = !(hasContent || hasFile);
    sendButton.className = `b2b-send-button ${(hasContent || hasFile) ? 'active' : ''}`;
}

async function sendProfessionalMessage(event) {
    event.preventDefault();
    
    const messageInput = document.getElementById('messageInput');
    const content = messageInput.value.trim();
    
    // Check if there's a selected file for upload
    const hasFile = selectedFileForUpload !== null;
    
    if (!content && !hasFile) {
        showProfessionalToast('Xabar yoki fayl tanlanishi kerak', 'error');
        return;
    }
    
    const sendButton = document.getElementById('sendButton');
    const originalContent = sendButton.innerHTML;
    
    try {
        messageInput.disabled = true;
        sendButton.disabled = true;
        sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        // Determine the conversation context for sending message
        const conversationType = window.B2BChat.conversationType;
        const conversationId = conversationType === 'inquiry' ? 
            window.B2BChat.inquiryData?.id : 
            window.B2BChat.orderData?.id;
        
        if (!conversationId || conversationId === 'null') {
            throw new Error('Conversation ID not found');
        }
        
        let messageData = {
            content: content || '',
            type: hasFile ? (selectedFileForUpload.type === 'image' ? 'image' : 'file') : 'text'
        };
        
        // Add the appropriate ID field based on conversation type
        if (conversationType === 'inquiry') {
            messageData.inquiryId = conversationId;
        } else {
            messageData.orderId = conversationId;
        }
        
        // If there's a file, upload it first
        if (hasFile) {
            const formData = new FormData();
            formData.append('file', selectedFileForUpload.file);
            
            const uploadResponse = await fetch('/manufacturer/messages/api/upload', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });
            
            if (!uploadResponse.ok) {
                throw new Error('File upload failed');
            }
            
            const uploadResult = await uploadResponse.json();
            
            // Add attachment data to message
            messageData.attachments = [{
                originalName: selectedFileForUpload.file.name,
                filename: uploadResult.data.attachment.fileName,
                url: uploadResult.data.attachment.url,
                size: selectedFileForUpload.file.size,
                mimetype: selectedFileForUpload.file.type
            }];
        }
        
        
        
        const response = await fetch('/manufacturer/messages/api/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(messageData)
        });
        
        
        const result = await response.json();
        
        
        if (result.success) {
            messageInput.value = '';
            messageInput.style.height = 'auto';
            document.getElementById('charCount').textContent = '0';
            
            // Clear file preview and selected file
            closeFilePreview();
            selectedFileForUpload = null;
            
            // Add new message to chat without reloading all messages
            addNewMessageToChat(result.data.message);
            
            scrollToBottom();
            showProfessionalToast(getTranslation('manufacturer.messages.chat.messages.message_sent', 'Message sent successfully'), 'success');
        } else {
            throw new Error(result.message || getTranslation('manufacturer.messages.errors.send_message_error', 'Error sending message'));
        }
    } catch (error) {
        console.error('❌ Error sending message:', error);
        showProfessionalToast(getTranslation('manufacturer.messages.errors.send_message_error', 'Error sending message') + ': ' + error.message, 'error');
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
        // Enhanced image detection - check mimetype, mimeType, and file extension
        const isImage = (attachment.mimetype && attachment.mimetype.startsWith('image/')) || 
                       (attachment.mimeType && attachment.mimeType.startsWith('image/')) ||
                       (attachment.originalName && /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(attachment.originalName));
        
        const attachmentHTML = `
            <div class="b2b-message-group ${isOwn ? 'own' : 'partner'}">
                <div class="b2b-message-content">
                    <div class="b2b-message-bubble b2b-attachment-message">
                        ${isImage ? 
                            `<div class="b2b-image-attachment">
                                <img src="${attachment.url}" alt="${attachment.originalName}" onclick="openImageModal('${attachment.url}', '${attachment.originalName}')" onerror="handleChatImageError(this, '${attachment.url}', '${attachment.originalName}')">
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
                            ${isOwn ? `<div class="b2b-message-status"><i class="fas fa-check status-sent" title="${getTranslation('manufacturer.messages.chat.messages.message_sent', 'Sent')}"></i></div>` : ''}
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
                            ${isOwn ? `<div class="b2b-message-status"><i class="fas fa-check status-sent" title="${getTranslation('manufacturer.messages.chat.messages.message_sent', 'Sent')}"></i></div>` : ''}
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
    if (typeof io !== 'undefined') {
        window.B2BChat.socket = io();
        window.B2BChat.socket.on('message', handleIncomingMessage);
        window.B2BChat.socket.on('typing', showTypingIndicator);
        window.B2BChat.socket.on('stop-typing', hideTypingIndicator);
        window.B2BChat.socket.on('message-read', updateMessageStatus);
    }
    
    // Real-time features
    
    // Auto-refresh messages every 30 seconds (ONLY for order conversations)
    // For inquiry chats, disable auto-refresh to preserve mixed content
    if (window.B2BChat.conversationType === 'order') {
    setInterval(refreshMessages, 30000);
    }
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
            `${getTranslation('manufacturer.messages.notifications.new_message', 'New message')} ${message.senderId?.companyName || getTranslation('manufacturer.messages.chat.header.partner_info', 'Business Partner')} ${getTranslation('manufacturer.messages.notifications.from', 'from')}`,
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
                         alt="${getTranslation('manufacturer.messages.chat.header.partner_info', 'Business Partner')}" 
                         onerror="this.src='/assets/images/avatars/default.png'">
                </div>
                <div class="b2b-typing-content">
                    <span>${window.B2BChat.partnerData.name} ${getTranslation('manufacturer.messages.chat.messages.typing', 'typing...')}</span>
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
    }
}

async function refreshMessages() {
    try {
        // Only refresh for order conversations, not inquiries
        if (window.B2BChat.conversationType !== 'order') {
            return;
        }
        
        const conversationId = window.B2BChat.orderData?.id;
        
        if (!conversationId || conversationId === 'null') {
            return;
        }
        
        const response = await fetch(`/manufacturer/messages/api/order/${conversationId}/messages?page=1&limit=50`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.data && data.data.messages) {
                // FIX: Use smart update that preserves mixed content
                smartUpdateMessagesDisplay(data.data.messages);
            }
        }
    } catch (error) {
        console.error('❌ Error refreshing messages:', error);
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

// 🎯 SMART UPDATE FUNCTION - PRESERVES MIXED CONTENT
function smartUpdateMessagesDisplay(newMessages) {
    const currentMessages = document.querySelectorAll('.b2b-message-group');
    const currentCount = currentMessages.length;
    
    if (newMessages.length > currentCount) {
        // Only add NEW messages, don't re-render existing ones
        const messagesToAdd = newMessages.slice(currentCount);
        
        messagesToAdd.forEach(message => {
            const isOwn = message.senderId?._id === window.B2BChat.currentUser.id;
            
            // Create new message element with mixed content support
            const messageElement = createMessageElement(message, isOwn);
            
            // Add to messages list
            const messagesList = document.getElementById('messagesList');
            if (messagesList) {
                messagesList.appendChild(messageElement);
            }
        });
        
        // Smooth scroll to bottom
        scrollToBottom();
        
        // Log for debugging
        console.log(`✅ Added ${messagesToAdd.length} new messages, preserved ${currentCount} existing messages`);
        
        // Visual indicator for mixed content preservation
        if (messagesToAdd.length > 0) {
            showProfessionalToast(`✅ Added ${messagesToAdd.length} new messages, mixed content preserved`, 'success');
        }
    } else {
        // No new messages, preserve existing mixed content
        console.log('✅ No new messages, mixed content preserved');
    }
}

// 🎯 CREATE MESSAGE ELEMENT WITH MIXED CONTENT SUPPORT
function createMessageElement(message, isOwn) {
    const messageGroup = document.createElement('div');
    messageGroup.className = `b2b-message-group ${isOwn ? 'own' : 'partner'}`;
    
    // Get message content and attachments
    const messageContent = message.content || '';
    const hasContent = messageContent && messageContent.trim().length > 0;
    const hasAttachments = message.attachments && message.attachments.length > 0;
    const isMixedMessage = hasContent && hasAttachments;
    
    let messageHTML = '';
    
    if (isMixedMessage) {
        // MIXED CONTENT MESSAGE
        messageHTML = `
            <div class="b2b-message-content">
                <div class="b2b-message-bubble">
                    <div class="b2b-mixed-message">
                        ${hasContent ? `
                            <div class="b2b-message-text-section">
                                <div class="b2b-message-text">
                                    ${messageContent.replace(/\n/g, '<br>')}
                                </div>
                            </div>
                        ` : ''}
                        ${hasAttachments ? `
                            <div class="b2b-attachments-grid">
                                ${createAttachmentsHTML(message.attachments)}
                            </div>
                        ` : ''}
                    </div>
                    <div class="b2b-message-footer">
                        <div class="b2b-message-time">
                            <i class="fas fa-clock"></i>
                            <span>${new Date(message.createdAt).toLocaleString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                day: '2-digit',
                                month: '2-digit'
                            })}</span>
                        </div>
                        ${isOwn ? `
                            <div class="b2b-message-status">
                                <i class="fas fa-check-double status-read" title="Read"></i>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    } else if (hasAttachments) {
        // ATTACHMENT ONLY MESSAGE
        messageHTML = `
            <div class="b2b-message-content">
                <div class="b2b-message-bubble">
                    <div class="b2b-attachments-grid">
                        ${createAttachmentsHTML(message.attachments)}
                    </div>
                    <div class="b2b-message-footer">
                        <div class="b2b-message-time">
                            <i class="fas fa-clock"></i>
                            <span>${new Date(message.createdAt).toLocaleString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                day: '2-digit',
                                month: '2-digit'
                            })}</span>
                        </div>
                        ${isOwn ? `
                            <div class="b2b-message-status">
                                <i class="fas fa-check-double status-read" title="Read"></i>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    } else {
        // TEXT ONLY MESSAGE
        messageHTML = `
            <div class="b2b-message-content">
                <div class="b2b-message-bubble">
                    <div class="b2b-message-text">
                        ${messageContent.replace(/\n/g, '<br>')}
                    </div>
                    <div class="b2b-message-footer">
                        <div class="b2b-message-time">
                            <i class="fas fa-clock"></i>
                            <span>${new Date(message.createdAt).toLocaleString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                day: '2-digit',
                                month: '2-digit'
                            })}</span>
                        </div>
                        ${isOwn ? `
                            <div class="b2b-message-status">
                                <i class="fas fa-check-double status-read" title="Read"></i>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }
    
    messageGroup.innerHTML = messageHTML;
    return messageGroup;
}

// 🎯 CREATE ATTACHMENTS HTML
function createAttachmentsHTML(attachments) {
    if (!attachments || attachments.length === 0) return '';
    
    const images = attachments.filter(att => {
        const isImage = (att.mimetype && att.mimetype.startsWith('image/')) || 
                       (att.mimeType && att.mimeType.startsWith('image/')) || 
                       (att.originalName && /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(att.originalName));
        return isImage;
    });
    
    const files = attachments.filter(att => {
        const isImage = (att.mimetype && att.mimetype.startsWith('image/')) || 
                       (att.mimeType && att.mimeType.startsWith('image/')) || 
                       (att.originalName && /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(att.originalName));
        return !isImage;
    });
    
    let html = '';
    
    // Images Grid
    if (images.length > 0) {
        html += '<div class="b2b-images-grid">';
        images.forEach(image => {
            html += `
                <div class="b2b-image-attachment-grid">
                    <img src="${image.url}" 
                         alt="${image.originalName}" 
                         onclick="openImageModal('${image.url}', '${image.originalName}')"
                         onerror="handleChatImageError(this, '${image.url}', '${image.originalName}')">
                    <div class="b2b-image-overlay">
                        <i class="fas fa-search-plus"></i>
                    </div>
                </div>
            `;
        });
        html += '</div>';
    }
    
    // Files List
    if (files.length > 0) {
        html += '<div class="b2b-files-list">';
        files.forEach(file => {
            const fileExt = file.originalName.split('.').pop().toLowerCase();
            let iconClass = 'fas fa-file-alt';
            if (fileExt === 'pdf') iconClass = 'fas fa-file-pdf';
            else if (['doc', 'docx'].includes(fileExt)) iconClass = 'fas fa-file-word';
            else if (['xls', 'xlsx'].includes(fileExt)) iconClass = 'fas fa-file-excel';
            else if (['zip', 'rar', '7z'].includes(fileExt)) iconClass = 'fas fa-file-archive';
            else if (['mp4', 'avi', 'mov'].includes(fileExt)) iconClass = 'fas fa-file-video';
            else if (['mp3', 'wav', 'flac'].includes(fileExt)) iconClass = 'fas fa-file-audio';
            
            html += `
                <div class="b2b-file-attachment-grid">
                    <div class="b2b-file-icon">
                        <i class="${iconClass}"></i>
                    </div>
                    <div class="b2b-file-details">
                        <h6>${file.originalName}</h6>
                        <p>${(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <div class="b2b-file-actions">
                        <a href="${file.url}" download="${file.originalName}" class="b2b-file-download">
                            <i class="fas fa-download"></i>
                        </a>
                    </div>
                </div>
            `;
        });
        html += '</div>';
    }
    
    return html;
}

// 🎯 ADD NEW MESSAGE TO CHAT WITHOUT RELOADING
function addNewMessageToChat(message) {
    const messagesList = document.getElementById('messagesList');
    if (!messagesList) return;
    
    const isOwn = message.senderId?._id === window.B2BChat.currentUser.id;
    const messageElement = createMessageElement(message, isOwn);
    
    messagesList.appendChild(messageElement);
    scrollToBottom();
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
    

    
    // Create blob URL
    let blobUrl = '';
    try {
        blobUrl = URL.createObjectURL(file);
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

            // Force reload if not loaded
            if (!img.complete || img.naturalWidth === 0) {
                const currentSrc = img.src;
                img.src = '';
                img.src = currentSrc;
                
                // If still fails after 2 seconds, try FileReader
                setTimeout(() => {
                    if (!img.complete || img.naturalWidth === 0) {
                        showImagePreviewWithFileReader(selectedFileForUpload.file);
                    }
                }, 2000);
            }
        }
    }, 100);
}

function showImageError(imgElement) {
    imgElement.style.display = 'none';
    const errorDiv = document.getElementById('imageError');
    if (errorDiv) {
        errorDiv.style.display = 'block';
    }
}

// Alternative method using FileReader (backup)
function showImagePreviewWithFileReader(file) {
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = document.getElementById('previewImage');
        if (img) {
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
        
        // Upload the file first
        const uploadResult = await uploadDirectly(file, type);
        
        // Create message with attachment after upload
        await createMessageWithAttachment(uploadResult, file, type);
        
        // Show success message
        showProfessionalToast(`${type === 'image' ? 'Rasm' : 'Fayl'} "${file.name}" muvaffaqiyatli yuklandi va yuborildi`, 'success');
        
        // Clear file input
        document.getElementById(type === 'image' ? 'imageInput' : 'fileInput').value = '';
        
    } catch (error) {
        console.error('Upload error:', error);
        showProfessionalToast(`"${file.name}" yuklashda xatolik: ${error.message}`, 'error');
    }
}

// Upload file directly without creating message
async function uploadDirectly(file, type) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('orderId', window.B2BChat.orderData?.id || 'null');
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
    
    return result;
}

// Create message with attachment data
async function createMessageWithAttachment(uploadResult, file, type) {
    const conversationType = window.B2BChat.conversationType;
    const conversationId = conversationType === 'inquiry' ? 
        window.B2BChat.inquiryData?.id : 
        window.B2BChat.orderData?.id;
        
    if (!conversationId || conversationId === 'null') {
        throw new Error('Conversation ID not found');
    }
    
    let messageData = {
        content: '',
        type: type === 'image' ? 'image' : 'file',
        attachments: [{
            originalName: file.name,
            filename: uploadResult.data.attachment.fileName,
            url: uploadResult.data.attachment.url,
            size: file.size,
            mimetype: file.type
        }]
    };
    
    // Add the appropriate ID field based on conversation type
    if (conversationType === 'inquiry') {
        messageData.inquiryId = conversationId;
    } else {
        messageData.orderId = conversationId;
    }
    
    
    const response = await fetch('/manufacturer/messages/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(messageData)
    });
    
    if (!response.ok) {
        throw new Error('Message creation failed');
    }
    
    const result = await response.json();
    if (!result.success) {
        throw new Error(result.message || 'Message creation failed');
    }
    
    // Add new message to chat without reloading
    addNewMessageToChat(result.data.message);
    
    return result;
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
    
    // Enhanced image detection for dynamic messages
    const isImage = message.type === 'image' || 
                   (message.attachments && message.attachments.length > 0 && 
                    ((message.attachments[0].mimetype && message.attachments[0].mimetype.startsWith('image/')) ||
                     (message.attachments[0].mimeType && message.attachments[0].mimeType.startsWith('image/')) ||
                     (message.attachments[0].originalName && /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(message.attachments[0].originalName))));
    
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
                            <img src="${attachmentInfo.url}" alt="${attachmentInfo.name}" onclick="openImageModal('${attachmentInfo.url}', '${attachmentInfo.name}')" onerror="handleChatImageError(this, '${attachmentInfo.url}', '${attachmentInfo.name}')">
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

// Make function globally accessible
window.openImageModal = function(src, fileName) {
    
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
                    <div class="b2b-image-container">
                        <img src="${src}" alt="${fileName}" onerror="handleImageModalError(this, '${src}', '${fileName}')">
                    </div>
                    <div class="b2b-image-modal-footer">
                        <a href="${src}" download="${fileName}" class="b2b-download-btn" id="downloadLink">
                            <i class="fas fa-download"></i> Download Image
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    try {
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = document.getElementById('imageModal');
        if (modal) {
            // Add keyboard support
            const handleKeyPress = (event) => {
                if (event.key === 'Escape') {
                    closeImageModal();
                    document.removeEventListener('keydown', handleKeyPress);
                }
            };
            document.addEventListener('keydown', handleKeyPress);
            
        } else {
            console.error('❌ Modal not found in DOM after insertion');
        }
    } catch (error) {
        console.error('❌ Error inserting modal HTML:', error);
    }
}

// Enhanced image error handler for modals - handles buyer vs manufacturer paths
function handleImageModalError(img, originalSrc, fileName) {
    // Prevent infinite loops
    if (img.dataset.errorHandled) {
        console.warn('❌ Image modal: All fallback attempts failed');
        img.src = '/assets/images/no-image.png';
        img.alt = 'Image unavailable';
        return;
    }
    
    img.dataset.errorHandled = 'true';
    
    // Try alternative paths for buyer/manufacturer images
    let fallbackSrc = null;
    
    if (originalSrc.includes('/uploads/attachments/')) {
        // Manufacturer image failed, try buyer path
        fallbackSrc = originalSrc.replace('/uploads/attachments/', '/uploads/messages/');
    } else if (originalSrc.includes('/uploads/messages/')) {
        // Buyer image failed, try manufacturer path  
        fallbackSrc = originalSrc.replace('/uploads/messages/', '/uploads/attachments/');

    } else {
        console.warn('⚠️ Unknown image path format:', originalSrc);
    }
    
    if (fallbackSrc) {
        // Update modal image and download link
        img.src = fallbackSrc;
        
        const downloadLink = document.getElementById('downloadLink');
        if (downloadLink) {
            downloadLink.href = fallbackSrc;
        }
        
        // Set onerror for final fallback
        img.onerror = function() {
            console.warn('❌ Fallback image also failed:', fallbackSrc);
            this.src = '/assets/images/no-image.png';
            this.alt = 'Image unavailable';
            this.onerror = null;
        };
    } else {
        // No fallback available, use default image
        img.src = '/assets/images/no-image.png';
        img.alt = 'Image unavailable';
    }
}

// Make function globally accessible
window.closeImageModal = function() {
    console.log('🚪 Closing image modal');
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.remove();
        console.log('✅ Modal removed successfully');
    } else {
        console.warn('⚠️ Modal not found for removal');
    }
}

// Enhanced image error handler for chat images - handles buyer vs manufacturer paths
function handleChatImageError(img, originalSrc, fileName) {
    // Prevent infinite loops
    if (img.dataset.errorHandled) {
        img.src = '/assets/images/no-image.png';
        img.alt = 'Image unavailable';
        img.onclick = function() {
            showProfessionalToast('Bu rasm mavjud emas', 'error');
        };
        return;
    }
    
    img.dataset.errorHandled = 'true';
    
    // Try alternative paths for buyer/manufacturer images
    let fallbackSrc = null;
    
    if (originalSrc.includes('/uploads/attachments/')) {
        // Manufacturer image failed, try buyer path
        fallbackSrc = originalSrc.replace('/uploads/attachments/', '/uploads/messages/');
    } else if (originalSrc.includes('/uploads/messages/')) {
        // Buyer image failed, try manufacturer path  
        fallbackSrc = originalSrc.replace('/uploads/messages/', '/uploads/attachments/');
    }
    
    if (fallbackSrc) {
        // Test if fallback path exists first
        const testImg = new Image();
        testImg.onload = function() {
            img.src = fallbackSrc;
            img.onclick = function() {
                openImageModal(fallbackSrc, fileName);
            };
        };
        
        testImg.onerror = function() {
            img.src = '/assets/images/no-image.png';
            img.alt = 'Image unavailable';
            img.onclick = function() {
                showProfessionalToast('Bu rasm mavjud emas', 'error');
            };
        };
        
        testImg.src = fallbackSrc;
        
    } else {
        // No fallback available, use default image
        img.src = '/assets/images/no-image.png';
        img.alt = 'Image unavailable';
        img.onclick = function() {
            showProfessionalToast('Bu rasm mavjud emas', 'error');
        };
    }
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

function showTemplates() { showProfessionalToast('Advanced template tanlash keladi', 'info'); }

// 🚀 BUSINESS ACTIONS
function viewOrderDetails() { 
    if (window.B2BChat.orderData?.id) {
        window.open(`/manufacturer/orders/${window.B2BChat.orderData.id}`, '_blank'); 
    } else {
        showProfessionalToast('Buyurtma ma\'lumotlari topilmadi', 'warning');
    }
}

function viewInquiryDetails() { 
    if (window.B2BChat.inquiryData?.id) {
        window.open(`/manufacturer/inquiries/${window.B2BChat.inquiryData.id}`, '_blank'); 
    } else {
        showProfessionalToast('So\'rov ma\'lumotlari topilmadi', 'warning');
    }
}

function updateOrderStatus() { 
    if (window.B2BChat.orderData?.id) {
        window.open(`/manufacturer/orders/${window.B2BChat.orderData.id}`, '_blank'); 
    } else {
        showProfessionalToast('Buyurtma ma\'lumotlari topilmadi', 'warning');
    }
}

function generateQuote() { showProfessionalToast('Professional quote generation coming soon', 'info'); }
function scheduleVideoCall() { showProfessionalToast('Video conferencing integration coming soon', 'info'); }
function exportChatHistory() { showProfessionalToast('Professional chat export coming soon', 'info'); }
function viewProfile() { showProfessionalToast('Hamkor profili keladi', 'info'); }

// 📞 CALL FUNCTIONALITY
function initiateCall(phoneNumber) {
    if (!phoneNumber) {
        showProfessionalToast(window.t?.('manufacturer.messages.chat.no_phone_number', 'Phone number not available'), 'error');
        return;
    }
    
    // Clean phone number (remove spaces, dashes, etc.)
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // Try to initiate call using tel: protocol
    try {
        window.location.href = `tel:${cleanPhone}`;
        showProfessionalToast(window.t?.('manufacturer.messages.chat.calling', 'Initiating call...'), 'info');
    } catch (error) {
        console.error('Call initiation failed:', error);
        showProfessionalToast(window.t?.('manufacturer.messages.chat.call_failed', 'Call initiation failed'), 'error');
    }
}

// 📧 EMAIL FUNCTIONALITY  
function sendEmail(emailAddress) {
    if (!emailAddress) {
        showProfessionalToast(window.t?.('manufacturer.messages.chat.no_email_address', 'Email address not available'), 'error');
        return;
    }
    
    try {
        // Try to open default email client
        window.location.href = `mailto:${emailAddress}`;
        showProfessionalToast(window.t?.('manufacturer.messages.chat.opening_email', 'Opening email client...'), 'info');
    } catch (error) {
        console.error('Email initiation failed:', error);
        showProfessionalToast(window.t?.('manufacturer.messages.chat.email_failed', 'Email initiation failed'), 'error');
    }
}

// 📦 SEND SAMPLE FUNCTIONALITY
function sendSample() {
    const messageInput = document.getElementById('messageInput');
    
    // Get current language from window or detect from document
    const currentLang = window.i18next?.language || 
                       (document.documentElement.lang) || 
                       'uz';
    
    let sampleTemplate;
    if (currentLang === 'en') {
        sampleTemplate = 'Hello! In response to your inquiry, we would like to offer to send you a sample of our product. After reviewing the sample quality, you can place a full order. If you need additional information for sample delivery, please let us know. Thank you!';
    } else {
        sampleTemplate = 'Assalomu alaykum! Sizning so\'rovingizga javoban, biz mahsulotimizning namunasini yuborishni taklif qilmoqdamiz. Namuna sifatini ko\'rib chiqgandan so\'ng, to\'liq buyurtma berishingiz mumkin. Namuna yuborish uchun qo\'shimcha ma\'lumotlar kerak bo\'lsa, bizga xabar bering. Rahmat!';
    }
    
    messageInput.value = sampleTemplate;
    messageInput.focus();
    handleProfessionalInputChange();
    
    const successMessage = currentLang === 'en' ? 'Sample template added' : 'Namuna shablon qo\'shildi';
    showProfessionalToast(successMessage, 'success');
}

// 💰 REQUEST PAYMENT FUNCTIONALITY
function requestPayment() {
    const messageInput = document.getElementById('messageInput');
    
    // Get current language from window or detect from document
    const currentLang = window.i18next?.language || 
                       (document.documentElement.lang) || 
                       'uz';
    
    let paymentTemplate;
    if (currentLang === 'en') {
        paymentTemplate = 'Hello! Your order is ready. To process payment, we are sending the following information:\n\n• Order Number: [ORDER_NUMBER]\n• Payment Amount: [AMOUNT]\n• Payment Method: [PAYMENT_METHOD]\n\nPlease review the payment details and confirm. If you have any questions, please contact us. Thank you!';
    } else {
        paymentTemplate = 'Assalomu alaykum! Buyurtmangiz tayyor bo\'ldi. To\'lovni amalga oshirish uchun quyidagi ma\'lumotlarni yuboramiz:\n\n• Buyurtma raqami: [ORDER_NUMBER]\n• To\'lov summasi: [AMOUNT]\n• To\'lov usuli: [PAYMENT_METHOD]\n\nTo\'lov ma\'lumotlarini tekshirib, tasdiqlashni so\'raymiz. Savollar bo\'lsa, bizga murojaat qiling. Rahmat!';
    }
    
    messageInput.value = paymentTemplate;
    messageInput.focus();
    handleProfessionalInputChange();
    
    const successMessage = currentLang === 'en' ? 'Payment template added' : 'To\'lov shablon qo\'shildi';
    showProfessionalToast(successMessage, 'success');
}

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

function loadSavedPreferences() {
    // Load sidebar collapse state
    if (localStorage.getItem('b2b-sidebar-collapsed') === 'true') toggleSidebar();
    
    // Load section collapse states
    ['products', 'history'].forEach(section => {
        if (localStorage.getItem(`b2b-section-${section}-collapsed`) === 'true') toggleSection(section);
    });
}
