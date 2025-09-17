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
    } else {
      throw new Error(data.message || 'Failed to load conversations');
    }
    
  } catch (error) {
    console.error('❌ Error loading conversations:', error);
    
    let errorMessage = window.t?.('manufacturer.messages.errors.load_conversations_error', 'Error loading conversations');
    if (error.message.includes('HTTP')) {
      errorMessage = window.t?.('manufacturer.messages.errors.network_error', 'Network error') + ': ' + error.message;
    } else {
      errorMessage = window.t?.('manufacturer.messages.errors.load_conversations_error', 'Error loading conversations') + ': ' + error.message;
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
  
  tbody.innerHTML = conversations.map(conversation => {
    // Auto-detect conversation type
    let conversationType = conversation.conversationType;
    if (!conversationType) {
      if (conversation.inquiryId || conversation.inquiryNumber) {
        conversationType = 'inquiry';
      } else if (conversation.orderId || conversation.orderNumber) {
        conversationType = 'order';
      } else {
        conversationType = 'order'; // default
      }
    }
    
    return `
    <tr class="table-row ${conversation.unreadCount > 0 ? 'unread-conversation' : ''}" data-conversation-id="${conversation.conversationId || conversation.orderId || conversation.inquiryId}">
      <td class="table-checkbox-col">
        <input type="checkbox" class="table-checkbox conversation-checkbox" data-conversation-id="${conversation.conversationId || conversation.orderId || conversation.inquiryId}">
      </td>
      
      <!-- Partner Column - Orders Page Style -->
      <td>
        <div class="customer-cell">
          <div class="customer-info">
            <h4 class="customer-name">${conversation.partnerName}</h4>
            <p class="customer-contact">${conversation.partnerEmail || window.t?.('manufacturer.messages.errors.not_found', 'Not available')}</p>
            ${conversation.partnerPhone ? `<p class="customer-phone">${conversation.partnerPhone}</p>` : ''}
            ${conversation.isOnline ? `<span class="online-status-badge">${window.t?.('manufacturer.messages.chat.messages.online', 'Online')}</span>` : ''}
          </div>
        </div>
      </td>
      
      <!-- Order/Inquiry ID Column - Orders Page Style -->
      <td class="order-id-cell">
        <div class="order-id-content">
          <span class="order-number">#${conversation.orderNumber || conversation.inquiryNumber}</span>
          <div class="order-meta">
            <span class="order-type badge-sm">${conversationType === 'inquiry' ? window.t?.('manufacturer.messages.chat.chat_info.inquiry_number', 'Inquiry') : window.t?.('manufacturer.messages.chat.chat_info.order_number', 'Order')}</span>
            ${conversation.unreadCount > 0 ? `<span class="unread-badge">${conversation.unreadCount} ${window.t?.('manufacturer.messages.time.new', 'new')}</span>` : ''}
          </div>
        </div>
      </td>
      
      <!-- Message Column - Custom Design -->
      <td class="message-name-cell">
        <div class="message-name-content">
          <span class="message-text" title="${conversation.lastMessage || window.t?.('manufacturer.messages.chat.no_messages_started', 'No conversation started yet')}">
            ${conversation.status === 'no_messages' ? 
              `<span class="no-messages-text"><i class="fas fa-envelope-open"></i> ${window.t?.('manufacturer.messages.chat.no_messages_yet', 'No messages yet')}</span>` : 
              truncateMessage(conversation.lastMessage || window.t?.('manufacturer.messages.chat.order_created_no_messages', 'Order created - no messages yet'), 60)
            }
          </span>
          <span class="message-type">
            <i class="fas fa-comment"></i>
            ${conversation.status === 'no_messages' ? window.t?.('manufacturer.messages.chat.no_messages', 'No messages') : getMessageTypeText(conversation.lastMessage)}
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
        ${conversation.status === 'no_messages' ? `<div class="no-messages-indicator" title="${window.t?.('manufacturer.messages.chat.no_messages_yet', 'No messages yet')}"><i class="fas fa-envelope-open"></i></div>` : ''}
      </td>
      
      <!-- Actions Column - Orders Page Style -->
      <td class="actions-cell">
        <div class="table-actions">
           <a href="${conversationType === 'inquiry' ? `/manufacturer/messages/inquiry/${conversation.inquiryId}` : `/manufacturer/messages/order/${conversation.orderId}`}" class="table-action-btn primary" title="${window.t?.('manufacturer.messages.table.actions.start_chat', 'Start Chat')}">
            <i class="fas fa-comments"></i>
          </a>
          <div class="table-more-actions">
            <button class="table-action-btn dropdown-toggle" title="${window.t?.('manufacturer.messages.table.actions.more_actions', 'More actions')}">
              <i class="fas fa-ellipsis-v"></i>
            </button>
            <div class="table-more-menu hidden">
              <!-- Main Actions -->
              <div class="menu-section">
                <h6 class="menu-section-title">${window.t?.('manufacturer.messages.table.actions.main_actions', 'Main actions')}</h6>
                ${conversationType === 'order' ? 
                  `<button class="menu-item" onclick="viewOrder('${conversation.orderId}')">
                    <i class="fas fa-shopping-cart menu-icon"></i>
                    <span class="menu-text">${window.t?.('manufacturer.messages.table.actions.view_order', 'View order')}</span>
                  </button>` : ''
                }
                <button class="menu-item" onclick="markAsRead('${conversation.conversationId || conversation.orderId || conversation.inquiryId}', '${conversationType}')">
                  <i class="fas fa-check menu-icon"></i>
                  <span class="menu-text">${window.t?.('manufacturer.messages.table.actions.mark_as_read', 'Mark as read')}</span>
                </button>
              </div>
              
              <!-- Additional Actions -->
              <div class="menu-section">
                <h6 class="menu-section-title">${window.t?.('manufacturer.messages.table.actions.additional_actions', 'Additional actions')}</h6>
                <button class="menu-item" onclick="archiveConversation('${conversation.conversationId || conversation.orderId || conversation.inquiryId}')">
                  <i class="fas fa-archive menu-icon"></i>
                  <span class="menu-text">${window.t?.('manufacturer.messages.table.actions.archive', 'Archive')}</span>
                </button>
                <button class="menu-item" onclick="exportConversation('${conversation.conversationId || conversation.orderId || conversation.inquiryId}')">
                  <i class="fas fa-download menu-icon"></i>
                  <span class="menu-text">${window.t?.('manufacturer.messages.table.actions.export', 'Export')}</span>
                </button>
                <button class="menu-item" onclick="pinConversation('${conversation.conversationId || conversation.orderId || conversation.inquiryId}')">
                  <i class="fas fa-thumbtack menu-icon"></i>
                  <span class="menu-text">${window.t?.('manufacturer.messages.table.actions.pin', 'Pin')}</span>
                </button>
              </div>
              
              <!-- Dangerous Actions -->
              <div class="menu-section danger-section">
                <h6 class="menu-section-title">${window.t?.('manufacturer.messages.table.actions.dangerous_actions', 'Dangerous actions')}</h6>
                <button class="menu-item danger" onclick="deleteConversation('${conversation.conversationId || conversation.orderId || conversation.inquiryId}')">
                  <i class="fas fa-trash menu-icon"></i>
                  <span class="menu-text">${window.t?.('manufacturer.messages.table.actions.delete_conversation', 'Delete conversation')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </td>
    </tr>
  `;
  }).join('');
  
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
          <h3 class="professional-loading-title">${window.t?.('manufacturer.messages.loading_states.loading_conversations', 'Loading conversations...')}</h3>
          <p class="professional-loading-text">${window.t?.('manufacturer.messages.loading_states.loading_conversations', 'Loading conversations...')}</p>
          <div class="professional-loading-progress">
            <div class="professional-loading-bar"></div>
          </div>
        </div>
      </td>
    </tr>
  `;
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
          <h3 class="professional-empty-title">${window.t?.('manufacturer.messages.empty_states.no_conversations', 'No conversations yet')}</h3>
          <p class="professional-empty-text">
            ${window.t?.('manufacturer.messages.empty_states.no_conversations_desc', 'When customers contact you, conversations will appear here')}
          </p>
          <div class="professional-empty-actions">
            <a href="/manufacturer/orders" class="professional-empty-btn professional-empty-btn-primary">
              <i class="fas fa-shopping-cart"></i>
              ${window.t?.('manufacturer.messages.actions.go_to_orders', 'Go to Orders')}
            </a>
            <button class="professional-empty-btn professional-empty-btn-secondary" onclick="loadConversations()">
              <i class="fas fa-refresh"></i>
              ${window.t?.('manufacturer.messages.actions.refresh', 'Refresh')}
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
          <h3 class="professional-empty-title">${window.t?.('manufacturer.messages.errors.load_conversations_error', 'Error occurred')}</h3>
          <p class="professional-empty-text">
            ${errorMessage}. ${window.t?.('manufacturer.messages.errors.load_conversations_error', 'Please try again or contact system administrator.')}
          </p>
          <div class="professional-empty-actions">
            <button class="professional-empty-btn professional-empty-btn-primary" onclick="loadConversations()">
              <i class="fas fa-refresh"></i>
              ${window.t?.('manufacturer.messages.actions.refresh', 'Refresh')}
            </button>
            <a href="/manufacturer/orders" class="professional-empty-btn professional-empty-btn-secondary">
              <i class="fas fa-shopping-cart"></i>
              ${window.t?.('manufacturer.messages.actions.go_to_orders', 'Go to Orders')}
            </a>
          </div>
        </div>
      </td>
    </tr>
  `;
}

// 🔧 UTILITY FUNCTIONS


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
    'pending': window.t?.('manufacturer.messages.status.pending', 'Pending'),
    'confirmed': window.t?.('manufacturer.messages.status.confirmed', 'Confirmed'),
    'processing': window.t?.('manufacturer.messages.status.processing', 'Processing'),
    'manufacturing': window.t?.('manufacturer.messages.status.manufacturing', 'Manufacturing'),
    'ready_to_ship': window.t?.('manufacturer.messages.status.ready_to_ship', 'Ready to ship'),
    'shipped': window.t?.('manufacturer.messages.status.shipped', 'Shipped'),
    'delivered': window.t?.('manufacturer.messages.status.delivered', 'Delivered'),
    'completed': window.t?.('manufacturer.messages.status.completed', 'Completed'),
    'cancelled': window.t?.('manufacturer.messages.status.cancelled', 'Cancelled')
  };
  return statusMap[status] || window.t?.('manufacturer.messages.status.unknown', 'Unknown');
}

function truncateMessage(message, maxLength) {
  if (!message) return window.t?.('manufacturer.messages.chat.new_conversation', 'New conversation...');
  if (message.length <= maxLength) return message;
  return message.substring(0, maxLength) + '...';
}

function getMessageTypeText(message) {
  if (!message) return window.t?.('manufacturer.messages.chat.no_message', 'No message');
  
  // Check for system messages
  if (message.includes(window.t?.('manufacturer.messages.chat.order_created_no_messages', 'Order created - no messages yet'))) return window.t?.('manufacturer.messages.chat.system_message', 'System message');
  if (message.includes(window.t?.('manufacturer.messages.chat.no_messages_yet', 'No messages yet'))) return window.t?.('manufacturer.messages.chat.system_message', 'System message');
  
  // Check for file extensions
  if (message.includes('.pdf')) return window.t?.('manufacturer.messages.chat.pdf_file', 'PDF file');
  if (message.includes('.jpg') || message.includes('.png') || message.includes('.jpeg')) return window.t?.('manufacturer.messages.chat.image_file', 'Image');
  if (message.includes('.doc') || message.includes('.docx')) return window.t?.('manufacturer.messages.chat.document_file', 'Document');
  if (message.includes('.xls') || message.includes('.xlsx')) return window.t?.('manufacturer.messages.chat.excel_file', 'Excel file');
  if (message.length > 100) return window.t?.('manufacturer.messages.chat.long_message', 'Long message');
  
  return window.t?.('manufacturer.messages.chat.text_message', 'Text message');
}

function updateConversationCount(total) {
  const countElement = document.getElementById('conversationsCountText');
  if (countElement) {
    countElement.textContent = total;
  }
}


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


// 📦 BULK ACTIONS
function handleSelectAll() {
  const selectAll = document.getElementById('selectAllCheckbox');
  const checkboxes = document.querySelectorAll('.conversation-checkbox');
  
  checkboxes.forEach(checkbox => {
    checkbox.checked = selectAll.checked;
  });
  
}


function exportConversation(orderId) {
  if (window.showToast) {
    window.showToast(window.t?.('manufacturer.messages.notifications.new_message', 'Export function will be added soon'), 'info');
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
  
  
}

// 🎛️ TABLE INTERACTIONS - ORDERS PAGE EXACT STYLE
function initializeOrdersTableInteractions() {

  // Checkbox interactions - Orders page style
  document.querySelectorAll('.conversation-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      const checkedBoxes = document.querySelectorAll('.conversation-checkbox:checked');
      const bulkBtn = document.getElementById('bulkConversationsActionsBtn');
      
      if (bulkBtn) {
        bulkBtn.style.display = checkedBoxes.length > 0 ? 'block' : 'none';
      }
    });
  });
  
  // Dropdown interactions - Smart positioning
  document.querySelectorAll('.table-more-actions').forEach(moreActions => {
    const toggle = moreActions.querySelector('.dropdown-toggle');
    const menu = moreActions.querySelector('.table-more-menu');
    
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      
      document.querySelectorAll('.table-more-menu').forEach(otherMenu => {
        if (otherMenu !== menu) {
          otherMenu.classList.add('hidden');
        }
      });
      
      if (menu.classList.contains('hidden')) {
        positionDropdownMenu(toggle, menu);
        menu.classList.remove('hidden');
      } else {
        menu.classList.add('hidden');
      }
    });
  });
  
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.table-more-actions')) {
      document.querySelectorAll('.table-more-menu').forEach(menu => {
        menu.classList.add('hidden');
      });
    }
  });
  
  window.addEventListener('scroll', () => {
    document.querySelectorAll('.table-more-menu:not(.hidden)').forEach(menu => {
      menu.classList.add('hidden');
    });
  }, { passive: true });
  
  window.addEventListener('resize', () => {
    document.querySelectorAll('.table-more-menu:not(.hidden)').forEach(menu => {
      menu.classList.add('hidden');
    });
  });
  
  
  document.querySelectorAll('.table-action-btn[data-action="view"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const conversationId = btn.dataset.conversationId;
      if (conversationId) {
        openConversation(conversationId, 'order');
      }
    });
  });
}

// 📦 ADDITIONAL ACTION FUNCTIONS
function archiveConversation(orderId) {
  if (window.showToast) {
    window.showToast(window.t?.('manufacturer.messages.notifications.new_message', 'Archive function will be added soon'), 'info');
  }
}

function deleteConversation(orderId) {
  if (confirm(window.t?.('manufacturer.messages.confirm.delete_conversation', 'Are you sure you want to delete this conversation? This action cannot be undone.'))) {
    if (window.showToast) {
      window.showToast(window.t?.('manufacturer.messages.notifications.delete_coming_soon', 'Delete function will be added soon'), 'info');
    }
  }
}

function pinConversation(orderId) {
  if (window.showToast) {
    window.showToast(window.t?.('manufacturer.messages.notifications.pin_coming_soon', 'Pin function will be added soon'), 'info');
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