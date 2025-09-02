// 🌐 PROFESSIONAL MESSAGES PAGE - REAL API INTEGRATION
window.MessagesPage = {
  currentUser: {
    id: '<%= user.id %>',
    company: '<%= user.company || user.companyName %>',
    companyType: '<%= user.companyType %>'
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  },
  filters: {
    search: '',
    status: '',
    orderStatus: '',
    dateFrom: '',
    dateTo: ''
  },
  sorting: {
    field: 'time',
    direction: 'desc'
  }
};

// Initialize messages page functionality
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Messages page initializing...');
  
  try {
    // Initialize components first
    initializeMessagesPage();
    initializeFilters();
    
    // Minimal delay to ensure DOM is fully ready 
    setTimeout(() => {

      loadConversations();
    }, 10);
    
  } catch (error) {
    console.error('❌ Error initializing messages page:', error);
  }
});

function initializeMessagesPage() {
  // Sorting functionality
  document.querySelectorAll('.sortable').forEach(th => {
    th.addEventListener('click', function() {
      const sortField = this.dataset.sort;
      if (window.MessagesPage.sorting.field === sortField) {
        window.MessagesPage.sorting.direction = window.MessagesPage.sorting.direction === 'asc' ? 'desc' : 'asc';
      } else {
        window.MessagesPage.sorting.field = sortField;
        window.MessagesPage.sorting.direction = 'desc';
      }
      loadConversations();
    });
  });
  
  // Bulk actions
  document.getElementById('selectAllConversations')?.addEventListener('change', handleSelectAll);
  document.getElementById('bulkConversationsActionsBtn')?.addEventListener('click', showBulkActions);
  
  // Smart auto-refresh - only when page is visible and user is active
  let isPageVisible = !document.hidden;
  let lastActivity = Date.now();
  
  // Track page visibility
  document.addEventListener('visibilitychange', () => {
    isPageVisible = !document.hidden;
    if (isPageVisible) {
      lastActivity = Date.now();
      // Refresh immediately when page becomes visible
      loadConversations(true);
    }
  });
  
  // Track user activity
  ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(name => {
    document.addEventListener(name, () => {
      lastActivity = Date.now();
    });
  });
  
  // Smart auto-refresh every 2 minutes (only if page visible and user active in last 5 minutes)
  setInterval(() => {
    const timeSinceActivity = Date.now() - lastActivity;
    const fiveMinutes = 5 * 60 * 1000;
    
    if (isPageVisible && timeSinceActivity < fiveMinutes) {
      
      loadConversations(true);
    }
  }, 120000); // 2 minutes = 120000 milliseconds
}

// 📡 LOAD CONVERSATIONS FROM API
async function loadConversations(silent = false) {
  try {

    
    
    if (!silent) {
      
      showLoadingState();
    }
    
    // Build query parameters - Orders page style
    const params = new URLSearchParams({
      page: window.MessagesPage.pagination.page,
      limit: window.MessagesPage.pagination.limit
    });

    // Get filter values from form - Orders page style  
    const form = document.getElementById('messagesFiltersForm');
    if (form) {
      const formData = new FormData(form);
      
      // Add each filter to params if it has a value
      for (const [key, value] of formData.entries()) {
        if (value && value.trim() !== '') {
          params.append(key, value);
        }
      }
    }
    
    // Remove empty parameters
    for (let [key, value] of params.entries()) {
      if (!value || value.trim() === '') {
        params.delete(key);
      }
    }
    
    // Add cache-busting for fresh data
    params.append('_t', Date.now());
    
    const apiUrl = `/manufacturer/messages/api/conversations?${params}`;
    
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    
    if (data.success) {
      const conversations = data.conversations || [];
      const pagination = data.pagination || {};
      
      displayConversations(conversations);
      updatePagination(pagination);
      updateConversationCount(pagination.total || 0);
      hideLoadingState();
    } else {
      throw new Error(data.message || 'Failed to load conversations');
    }
    
  } catch (error) {
    console.error('❌ Error loading conversations:', error);
    
    let errorMessage = 'Xabarlarni yuklashda xatolik yuz berdi';
    if (error.message.includes('HTTP')) {
      errorMessage = 'Server bilan bog\'lanishda muammo: ' + error.message;
    } else {
      errorMessage = 'Xabarlarni yuklashda xatolik: ' + error.message;
    }
    
    showErrorState(errorMessage);
    if (!silent && window.showToast) {
      window.showToast(errorMessage, 'error');
    }
  }
}

// 📊 DISPLAY CONVERSATIONS IN TABLE - ORDERS PAGE EXACT STYLE
function displayConversations(conversations) {

  
  const tbody = document.getElementById('conversationsTableBody');
  if (!tbody) {
    console.error('❌ Table tbody not found!');
    return;
  }
  
  if (!conversations || conversations.length === 0) {
    
    showEmptyState();
    return;
  }
  
  tbody.innerHTML = conversations.map(conversation => `
    <tr class="table-row ${conversation.unreadCount > 0 ? 'unread-conversation' : ''}" data-conversation-id="${conversation.conversationId || conversation.orderId || conversation.inquiryId}">
      <td class="table-checkbox-col">
        <input type="checkbox" class="table-checkbox conversation-checkbox" data-conversation-id="${conversation.conversationId || conversation.orderId || conversation.inquiryId}">
      </td>
      
      <!-- Partner Column - Orders Page Style -->
      <td>
        <div class="customer-cell">
          <div class="customer-info">
            <h4 class="customer-name">${conversation.partnerName}</h4>
            <p class="customer-contact">${conversation.partnerEmail || 'Email mavjud emas'}</p>
            ${conversation.partnerPhone ? `<p class="customer-phone">${conversation.partnerPhone}</p>` : ''}
            ${conversation.isOnline ? '<span class="online-status-badge">Online</span>' : ''}
          </div>
        </div>
      </td>
      
      <!-- Order/Inquiry ID Column - Orders Page Style -->
      <td class="order-id-cell">
        <div class="order-id-content">
          <span class="order-number">#${conversation.orderNumber || conversation.inquiryNumber}</span>
          <div class="order-meta">
            <span class="order-type badge-sm">${conversation.conversationType === 'inquiry' ? 'So\'rov' : 'Buyurtma'}</span>
            ${conversation.unreadCount > 0 ? `<span class="unread-badge">${conversation.unreadCount} yangi</span>` : ''}
          </div>
        </div>
      </td>
      
      <!-- Message Column - Custom Design -->
      <td class="message-name-cell">
        <div class="message-name-content">
          <span class="message-text" title="${conversation.lastMessage || 'Hali yozishma boshlanmagan'}">
            ${conversation.status === 'no_messages' ? 
              '<span class="no-messages-text"><i class="fas fa-envelope-open"></i> Hali yozishma yo\'q</span>' : 
              truncateMessage(conversation.lastMessage || 'Buyurtma yaratildi - hali yozishma yo\'q', 60)
            }
          </span>
          <span class="message-type">
            <i class="fas fa-comment"></i>
            ${conversation.status === 'no_messages' ? 'Yozishma yo\'q' : getMessageTypeText(conversation.lastMessage)}
          </span>
        </div>
      </td>
      
      <!-- Date Column - Orders Page Style -->
      <td>
        <div class="date-cell">
          <span class="order-date">${formatDateUz(conversation.lastMessageAt)}</span>
          <span class="order-time">${formatTimeUz(conversation.lastMessageAt)}</span>
        </div>
      </td>
      
      <!-- Status Column - Orders Page Style -->
      <td>
        <span class="status-badge status-${conversation.orderStatus || conversation.inquiryStatus || 'pending'}">
          ${getOrderStatusTextUz(conversation.orderStatus || conversation.inquiryStatus)}
        </span>
        ${conversation.status === 'active' ? '<div class="conversation-active-indicator"></div>' : ''}
        ${conversation.status === 'no_messages' ? '<div class="no-messages-indicator" title="Hali yozishma yo\'q"><i class="fas fa-envelope-open"></i></div>' : ''}
      </td>
      
      <!-- Actions Column - Orders Page Style -->
      <td class="actions-cell">
        <div class="table-actions">
          <button class="table-action-btn primary" data-action="view" data-conversation-id="${conversation.conversationId || conversation.orderId || conversation.inquiryId}" title="Suhbatni ochish" onclick="openConversation('${conversation.conversationId || conversation.orderId || conversation.inquiryId}', '${conversation.conversationType || 'order'}')">
            <i class="fas fa-comments"></i>
          </button>
          <div class="table-more-actions">
            <button class="table-action-btn dropdown-toggle" title="Ko'proq amallar">
              <i class="fas fa-ellipsis-v"></i>
            </button>
            <div class="table-more-menu hidden">
              <!-- ASOSIY AMALLAR -->
              <div class="menu-section">
                <h6 class="menu-section-title">Asosiy amallar</h6>
                <button class="menu-item" onclick="openConversation('${conversation.conversationId || conversation.orderId || conversation.inquiryId}', '${conversation.conversationType || 'order'}')">
                  <i class="fas fa-comments menu-icon"></i>
                  <span class="menu-text">Suhbatni ochish</span>
                </button>
                ${conversation.conversationType === 'inquiry' ? 
                  `<button class="menu-item" onclick="viewInquiry('${conversation.inquiryId}')">
                    <i class="fas fa-question-circle menu-icon"></i>
                    <span class="menu-text">So'rovni ko'rish</span>
                  </button>` :
                  `<button class="menu-item" onclick="viewOrder('${conversation.orderId}')">
                    <i class="fas fa-shopping-cart menu-icon"></i>
                    <span class="menu-text">Buyurtmani ko'rish</span>
                  </button>`
                }
                <button class="menu-item" onclick="markAsRead('${conversation.conversationId || conversation.orderId || conversation.inquiryId}', '${conversation.conversationType || 'order'}')">
                  <i class="fas fa-check menu-icon"></i>
                  <span class="menu-text">O'qilgan deb belgilash</span>
                </button>
              </div>
              
              <!-- QOSHIMCHA AMALLAR -->
              <div class="menu-section">
                <h6 class="menu-section-title">Qo'shimcha</h6>
                <button class="menu-item" onclick="archiveConversation('${conversation.conversationId || conversation.orderId || conversation.inquiryId}')">
                  <i class="fas fa-archive menu-icon"></i>
                  <span class="menu-text">Arxivlash</span>
                </button>
                <button class="menu-item" onclick="exportConversation('${conversation.conversationId || conversation.orderId || conversation.inquiryId}')">
                  <i class="fas fa-download menu-icon"></i>
                  <span class="menu-text">Eksport qilish</span>
                </button>
                <button class="menu-item" onclick="pinConversation('${conversation.conversationId || conversation.orderId || conversation.inquiryId}')">
                  <i class="fas fa-thumbtack menu-icon"></i>
                  <span class="menu-text">Qadash</span>
                </button>
              </div>
              
              <!-- XAVFLI AMALLAR -->
              <div class="menu-section danger-section">
                <h6 class="menu-section-title">Xavfli amallar</h6>
                <button class="menu-item danger" onclick="deleteConversation('${conversation.conversationId || conversation.orderId || conversation.inquiryId}')">
                  <i class="fas fa-trash menu-icon"></i>
                  <span class="menu-text">Suhbatni o'chirish</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </td>
    </tr>
  `).join('');
  
  // Initialize table interactions - Orders page style
  initializeOrdersTableInteractions();
}

// 📄 PROFESSIONAL PAGINATION MANAGEMENT - PRODUCTS PAGE STYLE
function updatePagination(pagination) {
  window.MessagesPage.pagination = pagination;
  
  const paginationContainer = document.getElementById('messagesPagination');
  const paginationInfo = document.getElementById('paginationInfo');
  const paginationControls = document.getElementById('paginationControls');
  
  if (!paginationContainer || !pagination) return;
  
  // Show/hide pagination
  if (pagination.total > 0 && pagination.totalPages > 1) {
    
    paginationContainer.style.display = 'flex';
    
    // Update info text - Products page style
    const start = ((pagination.page - 1) * pagination.limit) + 1;
    const end = Math.min(pagination.page * pagination.limit, pagination.total);
    paginationInfo.innerHTML = `<span>${start}-${end}</span> dan <span>${pagination.total}</span> ta ko'rsatilmoqda`;
    
    // Generate pagination controls - Products page exact style
    let paginationHTML = '';
    
    // Previous button
    if (pagination.hasPrev) {
      paginationHTML += `
        <button class="table-pagination-btn" onclick="loadConversations(${pagination.page - 1})" title="Oldingi sahifa">
          <i class="fas fa-chevron-left"></i>
        </button>
      `;
    }
    
    // Page numbers - Products page logic
    const startPage = Math.max(1, pagination.page - 2);
    const endPage = Math.min(pagination.totalPages, pagination.page + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      paginationHTML += `
        <button class="table-pagination-btn ${i === pagination.page ? 'active' : ''}" 
                onclick="loadConversations(${i})" 
                title="Sahifa ${i}">
          ${i}
        </button>
      `;
    }
    
    // Next button
    if (pagination.hasNext) {
      paginationHTML += `
        <button class="table-pagination-btn" onclick="loadConversations(${pagination.page + 1})" title="Keyingi sahifa">
          <i class="fas fa-chevron-right"></i>
        </button>
      `;
    }
    
    paginationControls.innerHTML = paginationHTML;
    
  } else {
    paginationContainer.style.display = 'none';
  }
}



// 🎛️ UI STATE MANAGEMENT
function showLoadingState() {
  const tableView = document.getElementById('messagesTableView');
  const pagination = document.getElementById('messagesPagination');
  
  if (tableView) tableView.style.display = 'block';
  if (pagination) pagination.style.display = 'none';
  
  const tbody = document.getElementById('conversationsTableBody');
  if (!tbody) {
    console.error('❌ conversationsTableBody not found in showLoadingState');
    return;
  }
  
  tbody.innerHTML = `
    <tr class="table-row">
      <td colspan="7" class="loading-state-cell">
        <div class="professional-loading-state">
          <div class="professional-loading-icon">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
          <h3 class="professional-loading-title">Yuklanmoqda...</h3>
          <p class="professional-loading-text">Xabarlar ro'yxati yuklanmoqda, iltimos kuting</p>
          <div class="professional-loading-progress">
            <div class="professional-loading-bar"></div>
          </div>
        </div>
      </td>
    </tr>
  `;
}

function hideLoadingState() {
  // Loading state is automatically hidden when displayConversations() runs
  // and replaces tbody content with actual conversation data
  
}

function showEmptyState() {
  // Keep table view visible but show empty state in tbody
  const tableView = document.getElementById('messagesTableView');
  const pagination = document.getElementById('messagesPagination');
  
  if (tableView) tableView.style.display = 'block';
  if (pagination) pagination.style.display = 'none';
  
  // Show professional empty state in table tbody
  const tbody = document.getElementById('conversationsTableBody');
  if (!tbody) {
    console.error('❌ conversationsTableBody not found in showEmptyState');
    return;
  }
  
  tbody.innerHTML = `
    <tr class="table-row">
      <td colspan="7" class="empty-state-cell">
        <div class="professional-empty-state">
          <div class="professional-empty-icon">
            <i class="fas fa-comments"></i>
          </div>
          <h3 class="professional-empty-title">Hali suhbatlar yo'q</h3>
          <p class="professional-empty-text">
            Hamkorlar bilan professional muloqot boshlash uchun buyurtmalar bo'limidan 
            "Mijoz bilan aloqa" tugmasini bosing yoki yangi so'rov kelishini kuting.
          </p>
          <div class="professional-empty-actions">
            <a href="/manufacturer/orders" class="professional-empty-btn professional-empty-btn-primary">
              <i class="fas fa-shopping-cart"></i>
              Buyurtmalarga o'tish
            </a>
            <button class="professional-empty-btn professional-empty-btn-secondary" onclick="loadConversations()">
              <i class="fas fa-refresh"></i>
              Yangilash
            </button>
          </div>
        </div>
      </td>
    </tr>
  `;
}

function showErrorState(errorMessage = 'Xabarlarni yuklashda xatolik yuz berdi') {
  // Keep table view visible but show error state in tbody
  const tableView = document.getElementById('messagesTableView');
  const pagination = document.getElementById('messagesPagination');
  
  if (tableView) tableView.style.display = 'block';
  if (pagination) pagination.style.display = 'none';
  
  // Show professional error state in table tbody
  const tbody = document.getElementById('conversationsTableBody');
  if (!tbody) {
    console.error('❌ conversationsTableBody not found in showErrorState');
    return;
  }
  
  tbody.innerHTML = `
    <tr class="table-row">
      <td colspan="7" class="empty-state-cell">
        <div class="professional-empty-state">
          <div class="professional-error-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <h3 class="professional-empty-title">Xatolik yuz berdi</h3>
          <p class="professional-empty-text">
            ${errorMessage}. Iltimos, qayta urinib ko'ring yoki tizim administratori bilan bog'laning.
          </p>
          <div class="professional-empty-actions">
            <button class="professional-empty-btn professional-empty-btn-primary" onclick="loadConversations()">
              <i class="fas fa-refresh"></i>
              Qayta yuklash
            </button>
            <a href="/manufacturer/orders" class="professional-empty-btn professional-empty-btn-secondary">
              <i class="fas fa-shopping-cart"></i>
              Buyurtmalarga o'tish
            </a>
          </div>
        </div>
      </td>
    </tr>
  `;
}

// 🔧 UTILITY FUNCTIONS
function getOrderStatusText(status) {
  const statusMap = {
    'pending': 'Kutilmoqda',
    'confirmed': 'Tasdiqlandi',
    'in_production': 'Ishlab chiqarilmoqda',
    'shipped': 'Yuborildi',
    'delivered': 'Yetkazildi',
    'completed': 'Tugallandi',
    'cancelled': 'Bekor qilindi'
  };
  return statusMap[status] || status || 'Noma\'lum';
}

function formatDateTime(dateString) {
  if (!dateString) return 'Yangi';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Hozir';
  if (diffMins < 60) return `${diffMins} daqiqa oldin`;
  if (diffHours < 24) return `${diffHours} soat oldin`;
  if (diffDays < 7) return `${diffDays} kun oldin`;
  
  return date.toLocaleDateString('uz-UZ', { 
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function formatDate(dateString) {
  if (!dateString) return 'Yangi';
  return new Date(dateString).toLocaleDateString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function formatTime(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleTimeString('uz-UZ', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

// 🛠️ ORDERS PAGE STYLE UTILITY FUNCTIONS
function formatDateUz(dateString) {
  if (!dateString) return 'Yangi';
  return new Date(dateString).toLocaleDateString('uz-UZ');
}

function formatTimeUz(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleTimeString('uz-UZ', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

function getOrderStatusTextUz(status) {
  const statusMap = {
    'pending': 'Kutayotgan',
    'confirmed': 'Tasdiqlangan',
    'processing': 'Jarayonda',
    'manufacturing': 'Ishlab chiqarilmoqda',
    'ready_to_ship': 'Jo\'natishga tayyor',
    'shipped': 'Jo\'natilgan',
    'delivered': 'Yetkazilgan',
    'completed': 'Yakunlangan',
    'cancelled': 'Bekor qilingan'
  };
  return statusMap[status] || 'Noma\'lum holat';
}

function truncateMessage(message, maxLength) {
  if (!message) return 'Yangi suhbat...';
  if (message.length <= maxLength) return message;
  return message.substring(0, maxLength) + '...';
}

function getMessageTypeText(message) {
  if (!message) return 'Xabar yo\'q';
  
  // Check for system messages
  if (message.includes('Buyurtma yaratildi - hali yozishma yo\'q')) return 'Sistema xabari';
  if (message.includes('Hali yozishma yo\'q')) return 'Sistema xabari';
  
  // Check for file extensions
  if (message.includes('.pdf')) return 'PDF fayl';
  if (message.includes('.jpg') || message.includes('.png') || message.includes('.jpeg')) return 'Rasm';
  if (message.includes('.doc') || message.includes('.docx')) return 'Hujjat';
  if (message.includes('.xls') || message.includes('.xlsx')) return 'Excel fayl';
  if (message.length > 100) return 'Uzun xabar';
  
  return 'Matn xabar';
}

function updateConversationCount(total) {
  const countElement = document.getElementById('conversationsCountText');
  if (countElement) {
    countElement.textContent = total;
  }
}

// 🎯 ACTION FUNCTIONS
function openConversation(orderId, type) {
  if (orderId) {
    window.location.href = `/manufacturer/messages/${type}/${orderId}`;
  }
}

function viewOrder(orderId) {
  if (orderId) {
    window.location.href = `/manufacturer/orders/${orderId}`;
  }
}

async function markAsRead(orderId, type) {
  try {
    const response = await fetch(`/manufacturer/messages/api/${type}/${orderId}/mark-read`, {
      method: 'POST',
      credentials: 'include'
    });
    
    if (response.ok) {
      loadConversations(true);
      if (window.showToast) {
        window.showToast('O\'qilgan deb belgilandi', 'success');
      }
    }
  } catch (error) {
    console.error('Error marking as read:', error);
    if (window.showToast) {
      window.showToast('Xatolik yuz berdi', 'error');
    }
  }
}

function resetFilters() {
  window.MessagesPage.filters = {
    search: '',
    status: '',
    orderStatus: '',
    dateFrom: '',
    dateTo: ''
  };
  
  // Reset form
  document.getElementById('messagesFiltersForm').reset();
  window.MessagesPage.pagination.page = 1;
  loadConversations();
}

// 📦 BULK ACTIONS
function handleSelectAll() {
  const selectAll = document.getElementById('selectAllCheckbox');
  const checkboxes = document.querySelectorAll('.conversation-checkbox');
  
  checkboxes.forEach(checkbox => {
    checkbox.checked = selectAll.checked;
  });
  
  updateBulkActions();
}

function updateBulkActions() {
  const checkedBoxes = document.querySelectorAll('.conversation-checkbox:checked');
  const bulkBtn = document.getElementById('bulkConversationsActionsBtn');
  
  if (bulkBtn) {
    bulkBtn.style.display = checkedBoxes.length > 0 ? 'block' : 'none';
  }
}

function showBulkActions() {
  const checkedBoxes = document.querySelectorAll('.conversation-checkbox:checked');
  const orderIds = Array.from(checkedBoxes).map(cb => cb.value);
  
  if (window.showToast) {
    window.showToast(`${orderIds.length} ta suhbat tanlandi`, 'info');
  }
}

function exportConversation(orderId) {
  if (window.showToast) {
    window.showToast('Eksport funksiyasi tez orada qo\'shiladi', 'info');
  }
}

// 📍 SMART DROPDOWN POSITIONING FUNCTION
function positionDropdownMenu(toggle, menu) {
  // Get toggle button position and dimensions
  const toggleRect = toggle.getBoundingClientRect();
  const menuRect = menu.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  
  // Calculate available space above and below
  const spaceAbove = toggleRect.top;
  const spaceBelow = viewportHeight - toggleRect.bottom;
  const menuHeight = Math.min(400, menuRect.height || 300); // Max height set in CSS
  
  // Determine if we should position above or below
  const shouldPositionAbove = spaceBelow < menuHeight && spaceAbove > spaceBelow;
  
  // Calculate horizontal position (prefer right-aligned to button)
  let left = toggleRect.right - 220; // Menu width is 220px
  
  // Ensure menu doesn't go off screen horizontally
  if (left < 10) {
    left = 10; // Minimum 10px from left edge
  } else if (left + 220 > viewportWidth - 10) {
    left = viewportWidth - 230; // Minimum 10px from right edge
  }
  
  // Calculate vertical position
  let top;
  if (shouldPositionAbove) {
    top = toggleRect.top - menuHeight - 8; // 8px gap above button
    menu.style.transformOrigin = 'bottom right';
  } else {
    top = toggleRect.bottom + 8; // 8px gap below button
    menu.style.transformOrigin = 'top right';
  }
  
  // Ensure menu doesn't go off screen vertically
  if (top < 10) {
    top = 10;
  } else if (top + menuHeight > viewportHeight - 10) {
    top = viewportHeight - menuHeight - 10;
  }
  
  // Apply positioning
  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;
  
  // Add animation classes for direction
  menu.classList.remove('position-above', 'position-below');
  menu.classList.add(shouldPositionAbove ? 'position-above' : 'position-below');
  
  console.log('🎯 Dropdown positioned:', {
    togglePosition: { top: toggleRect.top, left: toggleRect.left, right: toggleRect.right, bottom: toggleRect.bottom },
    menuPosition: { left, top },
    direction: shouldPositionAbove ? 'above' : 'below',
    spaceAbove,
    spaceBelow,
    viewportHeight
  });
}

// 🎛️ TABLE INTERACTIONS - ORDERS PAGE EXACT STYLE
function initializeOrdersTableInteractions() {
  // Checkbox interactions - Orders page style
  document.querySelectorAll('.conversation-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', updateBulkActions);
  });
  
  // Dropdown interactions - Smart positioning
  document.querySelectorAll('.table-more-actions').forEach(moreActions => {
    const toggle = moreActions.querySelector('.dropdown-toggle');
    const menu = moreActions.querySelector('.table-more-menu');
    
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      
      // Close other menus
      document.querySelectorAll('.table-more-menu').forEach(otherMenu => {
        if (otherMenu !== menu) {
          otherMenu.classList.add('hidden');
        }
      });
      
      // Smart positioning logic
      if (menu.classList.contains('hidden')) {
        positionDropdownMenu(toggle, menu);
        menu.classList.remove('hidden');
      } else {
        menu.classList.add('hidden');
      }
    });
  });
  
  // Close menus when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.table-more-actions')) {
      document.querySelectorAll('.table-more-menu').forEach(menu => {
        menu.classList.add('hidden');
      });
    }
  });
  
  // Close and reposition menus on scroll and resize
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    // Hide all open dropdowns on scroll for better UX
    document.querySelectorAll('.table-more-menu:not(.hidden)').forEach(menu => {
      menu.classList.add('hidden');
    });
  }, { passive: true });
  
  window.addEventListener('resize', () => {
    // Hide all open dropdowns on resize
    document.querySelectorAll('.table-more-menu:not(.hidden)').forEach(menu => {
      menu.classList.add('hidden');
    });
  });
  
  // Row click disabled - only action buttons work
  // No row click functionality - users must click action buttons
  
  // Action button clicks
  document.querySelectorAll('.table-action-btn[data-action="view"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const conversationId = btn.dataset.conversationId;
      if (conversationId) {
        openConversation(conversationId, 'order'); // Assuming it's an order conversation
      }
    });
  });
}

// 📦 ADDITIONAL ACTION FUNCTIONS
function archiveConversation(orderId) {
  if (window.showToast) {
    window.showToast('Arxivlash funksiyasi tez orada qo\'shiladi', 'info');
  }
}

function deleteConversation(orderId) {
  if (confirm('Suhbatni o\'chirishni xohlaysizmi? Bu amal bekor qilinmaydi.')) {
    if (window.showToast) {
      window.showToast('O\'chirish funksiyasi tez orada qo\'shiladi', 'info');
    }
  }
}

function pinConversation(orderId) {
  if (window.showToast) {
    window.showToast('Qadash funksiyasi tez orada qo\'shiladi', 'info');
  }
}

function viewInquiry(inquiryId) {
  if (inquiryId) {
    window.location.href = `/manufacturer/inquiries/${inquiryId}`;
  }
}

// 🔄 REFRESH FUNCTIONALITY
function refreshConversations() {
  const refreshBtn = document.getElementById('refreshConversationsBtn');
  if (refreshBtn) {
    const icon = refreshBtn.querySelector('i');
    if (icon) {
      icon.classList.add('fa-spin');
    }
    refreshBtn.disabled = true;
  }
  
  // Reload conversations
  loadConversations().finally(() => {
    if (refreshBtn) {
      const icon = refreshBtn.querySelector('i');
      if (icon) {
        icon.classList.remove('fa-spin');
      }
      refreshBtn.disabled = false;
    }
  });
}

// 🔍 FILTER FUNCTIONALITY - ORDERS PAGE STYLE
function initializeFilters() {

  
  const form = document.getElementById('messagesFiltersForm');
  const searchBtn = document.getElementById('searchMessagesFiltersBtn');
  const clearBtn = document.getElementById('clearMessagesFiltersBtn');
  const resetBtn = document.getElementById('resetMessagesFiltersBtn');
  const refreshBtn = document.getElementById('refreshConversationsBtn');
  
  
  
  // Form submit - only search on button click (Orders page style)
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      window.MessagesPage.pagination.page = 1; // Reset to first page
      loadConversations();
    });
  }
  
  // Search button click
  if (searchBtn) {
    searchBtn.addEventListener('click', (e) => {
      e.preventDefault();

      window.MessagesPage.pagination.page = 1;
      loadConversations();
    });
  }
  
  // Clear button click
  if (clearBtn) {
    clearBtn.addEventListener('click', (e) => {
      e.preventDefault();

      clearMessagesFilters();
      window.MessagesPage.pagination.page = 1;
      loadConversations();
    });
  }
  
  // Reset button click
  if (resetBtn) {
    resetBtn.addEventListener('click', (e) => {
      e.preventDefault();
      resetMessagesFilters();
    });
  }
  
  // Refresh button click
  if (refreshBtn) {
    refreshBtn.addEventListener('click', (e) => {
      e.preventDefault();
      refreshConversations();
    });
  }
  
  // Advanced filters toggle
  const advancedBtn = document.getElementById('advancedMessagesFiltersBtn');
  if (advancedBtn) {
    advancedBtn.addEventListener('click', toggleAdvancedFilters);
  }
}

// 🧹 CLEAR FILTERS
function clearMessagesFilters() {
  const form = document.getElementById('messagesFiltersForm');
  if (form) {
    form.reset();
  }
  
  // Reset all filter values
  window.MessagesPage.filters = {
    search: '',
    status: '',
    orderStatus: '',
    dateRange: '',
    partner: '',
    sortBy: 'lastMessageAt',
    sortOrder: 'desc'
  };
  
  if (window.showToast) {
    window.showToast('Filtrlar tozalandi', 'success');
  }
}

// 🔄 RESET FILTERS  
function resetMessagesFilters() {
  clearMessagesFilters();
  window.MessagesPage.pagination.page = 1;
  loadConversations();
}

// ⚙️ TOGGLE ADVANCED FILTERS
function toggleAdvancedFilters() {
  const advancedBtn = document.getElementById('advancedMessagesFiltersBtn');
  const filtersBody = document.querySelector('.products-filters-body');
  
  if (filtersBody) {
    filtersBody.classList.toggle('expanded');
    
    if (advancedBtn) {
      const isExpanded = filtersBody.classList.contains('expanded');
      advancedBtn.innerHTML = isExpanded 
        ? '<i class="fas fa-cog"></i> Oddiy'
        : '<i class="fas fa-cog"></i> Kengaytirilgan';
    }
  }
}