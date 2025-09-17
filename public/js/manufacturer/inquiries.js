
window.InquiriesPage = {
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
    priority: '',
    dateFrom: '',
    dateTo: '',
    budget: '',
    category: ''
  },
  sorting: {
    field: 'createdAt',
    direction: 'desc'
  }
};

// Initialize inquiries page functionality
document.addEventListener('DOMContentLoaded', function() {
  
  try {
    // Verify modal elements exist
    const responseModal = document.getElementById('inquiryResponseModal');
    const quickQuoteModal = document.getElementById('quickQuoteModal');
    
    // Initialize components first
    initializeInquiriesPage();
    initializeFilters();
    initializeModals();
    
    // Initialize form submissions with delay to ensure DOM is ready
    setTimeout(() => {
      initializeFormSubmissions();
    }, 100);
    
    // Load initial data
    setTimeout(() => {
      loadInquiries();
      loadInquiriesKPIs();
    }, 10);
    
  } catch (error) {
    console.error('❌ Error initializing inquiries page:', error);
  }
});

function initializeInquiriesPage() {
  // Sorting functionality
  document.querySelectorAll('.sortable').forEach(th => {
    th.addEventListener('click', function() {
      const sortField = this.dataset.sort;
      if (window.InquiriesPage.sorting.field === sortField) {
        window.InquiriesPage.sorting.direction = window.InquiriesPage.sorting.direction === 'asc' ? 'desc' : 'asc';
      } else {
        window.InquiriesPage.sorting.field = sortField;
        window.InquiriesPage.sorting.direction = 'desc';
      }
      loadInquiries();
    });
  });
  
  // Bulk actions
  document.getElementById('selectAllInquiries')?.addEventListener('change', handleSelectAll);
  document.getElementById('bulkInquiriesActionsBtn')?.addEventListener('click', showBulkActions);
  
  // Refresh button functionality
  document.getElementById('refreshInquiriesBtn2')?.addEventListener('click', function() {
    loadInquiries();
    loadInquiriesKPIs();
  });
  
  // Auto-refresh every 2 minutes for new inquiries
  setInterval(() => {
    loadInquiries(true);
    loadInquiriesKPIs();
  }, 120000);
}

// 📡 LOAD INQUIRIES FROM API
async function loadInquiries(silent = false) {
  try {
    
    if (!silent) {
      showLoadingState();
    }
    
    // Build query parameters
    const params = new URLSearchParams({
      page: window.InquiriesPage.pagination.page,
      limit: window.InquiriesPage.pagination.limit
    });

    // Get filter values from form
    const form = document.getElementById('inquiriesFiltersForm');
    if (form) {
      const formData = new FormData(form);
      
      for (const [key, value] of formData.entries()) {
        if (value && value.trim() !== '') {
          params.append(key, value);
        }
      }
    }
    
    // Add cache-busting for fresh data
    params.append('_t', Date.now());
    
    const apiUrl = `/manufacturer/inquiries/api/list?${params}`;
    
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
      const inquiries = data.inquiries || [];
      const pagination = data.pagination || {};
      
      displayInquiries(inquiries);
      updatePagination(pagination);
      updateInquiriesCount(pagination.total || 0);
      hideLoadingState();
    } else {
      throw new Error(data.message || 'Failed to load inquiries');
    }
    
  } catch (error) {
    console.error('❌ Error loading inquiries:', error);
    
    let errorMessage = window.t?.('manufacturer.orders.detail.inquiries.javascript.load_error_general') || 'So\'rovlarni yuklashda xatolik yuz berdi';
    if (error.message.includes('HTTP')) {
      errorMessage = (window.t?.('manufacturer.orders.detail.inquiries.javascript.server_connection_error') || 'Server bilan bog\'lanishda muammo: ') + error.message;
    } else {
      errorMessage = (window.t?.('manufacturer.orders.detail.inquiries.javascript.load_error_specific') || 'So\'rovlarni yuklashda xatolik: ') + error.message;
    }
    
    showErrorState(errorMessage);
    if (!silent && window.showToast) {
      window.showToast(errorMessage, 'error');
    }
  }
}

// 📊 DISPLAY INQUIRIES IN TABLE
function displayInquiries(inquiries) {
  
  const tbody = document.getElementById('inquiriesTableBody');
  if (!tbody) {
    return;
  }
  
  if (!inquiries || inquiries.length === 0) {
    showEmptyState();
    return;
  }
  
  tbody.innerHTML = inquiries.map(inquiry => `
    <tr class="table-row priority-${inquiry.priority || 'medium'}" data-inquiry-id="${inquiry._id}">
      <td class="table-checkbox-col">
        <input type="checkbox" class="table-checkbox inquiry-checkbox" data-inquiry-id="${inquiry._id}">
      </td>
      
      <!-- Inquiry ID Column -->
      <td class="inquiry-id-cell">
        <div class="inquiry-id-content">
          <span class="inquiry-number">#${inquiry.inquiryNumber || inquiry._id.toString().slice(-8).toUpperCase()}</span>
          <div class="inquiry-meta">
            <span class="inquiry-type badge-sm">${getInquiryTypeText(inquiry.type)}</span>
            ${inquiry.isUrgent ? '<span class="urgent-badge">' + (window.t?.('manufacturer.orders.detail.inquiries.priority_options.urgent') || 'Shoshilinch') + '</span>' : ''}
          </div>
        </div>
      </td>
      
      <!-- Customer Column -->
      <td>
        <div class="customer-cell">
          <div class="customer-info">
            <h4 class="customer-name">${inquiry.inquirer?.companyName || inquiry.inquirer?.name || (window.t?.('manufacturer.orders.detail.inquiries.javascript.not_available_short') || 'N/A')}</h4>
            <p class="customer-contact">${inquiry.inquirer?.email || (window.t?.('manufacturer.orders.detail.inquiries.javascript.email_not_available') || 'Email mavjud emas')}</p>
            ${inquiry.inquirer?.phone ? `<p class="customer-phone">${inquiry.inquirer.phone}</p>` : ''}
          </div>
        </div>
      </td>
      
      <!-- Product Column -->
      <td class="product-name-cell">
        <div class="product-name-content">
          <span class="product-name" title="${inquiry.product?.title || inquiry.subject || (window.t?.('manufacturer.orders.detail.inquiries.javascript.general_request') || 'Umumiy so\'rov')}">
            ${truncateText(inquiry.product?.title || inquiry.subject || (window.t?.('manufacturer.orders.detail.inquiries.javascript.general_request') || 'Umumiy so\'rov'), 40)}
          </span>
          <span class="product-category">
            <i class="fas fa-tag"></i>
            ${inquiry.product?.category || (window.t?.('manufacturer.orders.detail.inquiries.javascript.general') || 'Umumiy')}
          </span>
        </div>
      </td>
      
      <!-- Quantity Column -->
      <td class="quantity-cell">
        <div class="quantity-content">
          <span class="quantity-value">${inquiry.requestedQuantity !== null && inquiry.requestedQuantity !== undefined ? inquiry.requestedQuantity : (window.t?.('manufacturer.orders.detail.inquiries.javascript.not_available_short') || 'N/A')}</span>
          <span class="quantity-unit">${inquiry.unit || (window.t?.('manufacturer.orders.detail.inquiries.javascript.unit_piece') || 'dona')}</span>
        </div>
      </td>
      
      <!-- Budget Column -->
      <td class="budget-cell">
        <div class="budget-content">
          ${inquiry.budgetRange ? 
            `<span class="budget-range">$${inquiry.budgetRange.min?.toLocaleString() || '0'} - $${inquiry.budgetRange.max?.toLocaleString() || '0'}</span>` :
            '<span class="budget-unknown">' + (window.t?.('manufacturer.orders.detail.inquiries.javascript.discussion') || 'Muhokama') + '</span>'
          }
          <span class="budget-currency">${inquiry.budgetRange?.currency || (window.t?.('manufacturer.orders.detail.inquiries.javascript.currency_usd') || 'USD')}</span>
        </div>
      </td>
      
      <!-- Date Column -->
      <td>
        <div class="date-cell">
          <span class="inquiry-date">${formatDateUz(inquiry.createdAt)}</span>
          <span class="inquiry-time">${formatTimeUz(inquiry.createdAt)}</span>
          ${isRecentInquiry(inquiry.createdAt) ? '<span class="new-indicator">' + (window.t?.('manufacturer.orders.detail.inquiries.javascript.new') || 'New') + '</span>' : ''}
        </div>
      </td>
      
      <!-- Status Column -->
      <td>
        <span class="status-badge status-${inquiry.status || 'open'}">
          ${getStatusTextUz(inquiry.status)}
        </span>
      </td>
      
      <!-- Priority Column -->
      <td>
        <span class="priority-badge priority-${inquiry.priority || 'medium'}">
          ${getPriorityTextUz(inquiry.priority)}
        </span>
      </td>
      
      <!-- Actions Column -->
      <td class="actions-cell">
        <div class="simple-table-actions">
          <button class="simple-action-btn primary" data-action="respond" data-inquiry-id="${inquiry._id}" title="${window.t?.('manufacturer.orders.detail.inquiries.table.actions.respond') || 'Javob berish'}" onclick="respondToInquiry('${inquiry._id}')">
            <i class="fas fa-reply"></i>
          </button>
          <button class="simple-action-btn success" data-action="quick-quote" data-inquiry-id="${inquiry._id}" title="${window.t?.('manufacturer.orders.detail.inquiries.table.actions.quick_quote') || 'Tezkor taklif'}" onclick="sendQuickQuote('${inquiry._id}')">
            <i class="fas fa-bolt"></i>
          </button>
          <button class="simple-action-btn info" data-action="start-chat" data-inquiry-id="${inquiry._id}" title="${window.t?.('manufacturer.orders.detail.inquiries.table.actions.start_chat') || 'Chat boshlash'}" onclick="startChat('${inquiry._id}')">
            <i class="fas fa-comments"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
  
  // Initialize table interactions
  initializeInquiriesTableInteractions();
}

// Load KPIs
async function loadInquiriesKPIs() {
  try {
    const response = await fetch('/manufacturer/inquiries/api/stats', {
      method: 'GET',
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      updateInquiriesKPIs(data);
    }
  } catch (error) {
    console.error('❌ Error loading inquiries KPIs:', error);
  }
}

function updateInquiriesKPIs(data) {
  const elements = {
    totalInquiriesValue: data.totalInquiries || 0,
    newInquiriesValue: data.newInquiries || 0,
    responseRateValue: (data.responseRate || 0) + '%',
    conversionRateValue: (data.conversionRate || 0) + '%'
  };
  
  Object.entries(elements).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) {
      element.innerHTML = value;
    }
  });
}

// Utility Functions
function getInquiryTypeText(type) {
  const typeMap = {
    'product_inquiry': window.t?.('manufacturer.orders.detail.inquiries.javascript.inquiry_type_labels.product_inquiry') || 'Product',
    'quote_request': window.t?.('manufacturer.orders.detail.inquiries.javascript.inquiry_type_labels.quote_request') || 'Quote',
    'bulk_order': window.t?.('manufacturer.orders.detail.inquiries.javascript.inquiry_type_labels.bulk_order') || 'Wholesale',
    'custom_order': window.t?.('manufacturer.orders.detail.inquiries.javascript.inquiry_type_labels.custom_order') || 'Custom',
    'partnership': window.t?.('manufacturer.orders.detail.inquiries.javascript.inquiry_type_labels.partnership') || 'Partnership'
  };
  return typeMap[type] || (window.t?.('manufacturer.orders.detail.inquiries.javascript.general') || 'General');
}

function getStatusTextUz(status) {
  const statusMap = {
    'open': window.t?.('manufacturer.orders.detail.inquiries.status_options.open') || 'Open',
    'responded': window.t?.('manufacturer.orders.detail.inquiries.status_options.responded') || 'Responded',
    'negotiating': window.t?.('manufacturer.orders.detail.inquiries.status_options.negotiating') || 'Negotiating',
    'quoted': window.t?.('manufacturer.orders.detail.inquiries.status_options.quoted') || 'Quoted',
    'accepted': window.t?.('manufacturer.orders.detail.inquiries.status_options.accepted') || 'Accepted',
    'rejected': window.t?.('manufacturer.orders.detail.inquiries.status_options.rejected') || 'Rejected',
    'expired': window.t?.('manufacturer.orders.detail.inquiries.status_options.expired') || 'Expired',
    'converted': window.t?.('manufacturer.orders.detail.inquiries.status_options.converted') || 'Converted'
  };
  return statusMap[status] || (window.t?.('manufacturer.orders.detail.inquiries.javascript.unknown') || 'Unknown');
}

function getPriorityTextUz(priority) {
  const priorityMap = {
    'urgent': window.t?.('manufacturer.orders.detail.inquiries.priority_options.urgent') || 'Urgent',
    'high': window.t?.('manufacturer.orders.detail.inquiries.priority_options.high') || 'High',
    'medium': window.t?.('manufacturer.orders.detail.inquiries.priority_options.medium') || 'Medium',
    'low': window.t?.('manufacturer.orders.detail.inquiries.priority_options.low') || 'Low'
  };
  return priorityMap[priority] || (window.t?.('manufacturer.orders.detail.inquiries.priority_options.medium') || 'Medium');
}

function formatDateUz(dateString) {
  if (!dateString) return (window.t?.('manufacturer.orders.detail.inquiries.javascript.not_available_short') || 'N/A');
  return new Date(dateString).toLocaleDateString('uz-UZ');
}

function formatTimeUz(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleTimeString('uz-UZ', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

function truncateText(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

function isRecentInquiry(dateString) {
  if (!dateString) return false;
  const date = new Date(dateString);
  const now = new Date();
  const diffHours = (now - date) / (1000 * 60 * 60);
  return diffHours < 24; // Less than 24 hours
}

function updateInquiriesCount(total) {
  const countElement = document.getElementById('inquiriesCountText');
  if (countElement) {
    countElement.textContent = total;
  }
}

// UI State Management
function showLoadingState() {
  const tbody = document.getElementById('inquiriesTableBody');
  if (!tbody) return;
  
  tbody.innerHTML = `
    <tr class="table-row">
      <td colspan="10" class="loading-state-cell">
        <div class="professional-loading-state">
          <div class="professional-loading-icon">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
          <h3 class="professional-loading-title">${window.t?.('manufacturer.orders.detail.inquiries.javascript.loading_title') || 'Yuklanmoqda...'}</h3>
          <p class="professional-loading-text">${window.t?.('manufacturer.orders.detail.inquiries.javascript.loading_text') || 'So\'rovlar ro\'yxati yuklanmoqda, iltimos kuting'}</p>
          <div class="professional-loading-progress">
            <div class="professional-loading-bar"></div>
          </div>
        </div>
      </td>
    </tr>
  `;
}

function hideLoadingState() {
}

function showEmptyState() {
  const tbody = document.getElementById('inquiriesTableBody');
  if (!tbody) return;
  
  tbody.innerHTML = `
    <tr class="table-row">
      <td colspan="10" class="empty-state-cell">
        <div class="professional-empty-state">
          <div class="professional-empty-icon">
            <i class="fas fa-envelope-open"></i>
          </div>
          <h3 class="professional-empty-title">${window.t?.('manufacturer.orders.detail.inquiries.javascript.empty_title') || 'Hali so\'rovlar yo\'q'}</h3>
          <p class="professional-empty-text">
            ${window.t?.('manufacturer.orders.detail.inquiries.javascript.empty_description') || 'Mijozlar sizning mahsulotlaringizga qiziqib so\'rov yuborgan vaqtda, ular shu yerda ko\'rinadi. Professional javoblar bering va biznesingizni rivojlantiring.'}
          </p>
          <div class="professional-empty-actions">
            <a href="/manufacturer/marketplace" class="professional-empty-btn professional-empty-btn-primary">
              <i class="fas fa-store"></i>
              ${window.t?.('manufacturer.orders.detail.inquiries.javascript.marketplace_redirect') || 'Marketplace ga o\'tish'}
            </a>
            <button class="professional-empty-btn professional-empty-btn-secondary" onclick="loadInquiries()">
              <i class="fas fa-refresh"></i>
              ${window.t?.('manufacturer.orders.detail.inquiries.javascript.refresh') || 'Yangilash'}
            </button>
          </div>
        </div>
      </td>
    </tr>
  `;
}

function showErrorState(errorMessage) {
  const tbody = document.getElementById('inquiriesTableBody');
  if (!tbody) return;
  
  tbody.innerHTML = `
    <tr class="table-row">
      <td colspan="10" class="empty-state-cell">
        <div class="professional-empty-state">
          <div class="professional-error-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <h3 class="professional-empty-title">${window.t?.('manufacturer.orders.detail.inquiries.javascript.error_title') || 'Xatolik yuz berdi'}</h3>
          <p class="professional-empty-text">
            ${errorMessage}. ${window.t?.('manufacturer.orders.detail.inquiries.javascript.error_description') || 'Iltimos, qayta urinib ko\'ring yoki tizim administratori bilan bog\'laning.'}
          </p>
          <div class="professional-empty-actions">
            <button class="professional-empty-btn professional-empty-btn-primary" onclick="loadInquiries()">
              <i class="fas fa-refresh"></i>
              ${window.t?.('manufacturer.orders.detail.inquiries.javascript.reload') || 'Qayta yuklash'}
            </button>
          </div>
        </div>
      </td>
    </tr>
  `;
}

// Action Functions - Real API Integration (GLOBAL SCOPE)
window.respondToInquiry = function(inquiryId) {
  openInquiryResponseModal(inquiryId);
};

window.sendQuickQuote = function(inquiryId) {
  openQuickQuoteModal(inquiryId);
};

window.viewInquiryDetails = function(inquiryId) {
  window.location.href = `/manufacturer/inquiries/${inquiryId}`;
};

// Dropdown Menu Actions - Messages Table Style (GLOBAL SCOPE)
window.changeInquiryStatus = async function(inquiryId) {
  
  const statusOptions = [
    { value: 'open', label: window.t?.('manufacturer.orders.detail.inquiries.status_options.open') || 'Ochiq' },
    { value: 'responded', label: window.t?.('manufacturer.orders.detail.inquiries.status_options.responded') || 'Javob berilgan' },
    { value: 'negotiating', label: window.t?.('manufacturer.orders.detail.inquiries.status_options.negotiating') || 'Muzokaralar' },
    { value: 'quoted', label: window.t?.('manufacturer.orders.detail.inquiries.status_options.quoted') || 'Taklif yuborilgan' },
    { value: 'accepted', label: window.t?.('manufacturer.orders.detail.inquiries.status_options.accepted') || 'Qabul qilingan' },
    { value: 'rejected', label: window.t?.('manufacturer.orders.detail.inquiries.status_options.rejected') || 'Rad etilgan' },
    { value: 'expired', label: window.t?.('manufacturer.orders.detail.inquiries.status_options.expired') || 'Muddati tugagan' },
    { value: 'converted', label: window.t?.('manufacturer.orders.detail.inquiries.status_options.converted') || 'Buyurtmaga aylandi' }
  ];
  
  const selectedStatus = await showSelectModal(window.t?.('manufacturer.orders.detail.inquiries.javascript.change_status_title') || 'So\'rov holatini o\'zgartirish', window.t?.('manufacturer.orders.detail.inquiries.javascript.select_new_status') || 'Yangi holatni tanlang:', statusOptions);
  
  if (selectedStatus) {
    await makeInquiryApiRequest(`/manufacturer/inquiries/${inquiryId}/status`, 'PATCH', { status: selectedStatus }, window.t?.('manufacturer.orders.detail.inquiries.javascript.status_change_success') || 'So\'rov holati muvaffaqiyatli o\'zgartirildi');
  }
}

window.setPriority = async function(inquiryId) {
  
  const priorityOptions = [
    { value: 'low', label: window.t?.('manufacturer.orders.detail.inquiries.priority_options.low') || 'Past' },
    { value: 'medium', label: window.t?.('manufacturer.orders.detail.inquiries.priority_options.medium') || 'O\'rta' },
    { value: 'high', label: window.t?.('manufacturer.orders.detail.inquiries.priority_options.high') || 'Yuqori' },
    { value: 'urgent', label: window.t?.('manufacturer.orders.detail.inquiries.priority_options.urgent') || 'Shoshilinch' }
  ];
  
  const selectedPriority = await showSelectModal(window.t?.('manufacturer.orders.detail.inquiries.javascript.set_priority_title') || 'So\'rov muhimligini belgilash', window.t?.('manufacturer.orders.detail.inquiries.javascript.select_priority') || 'Muhimlik darajasini tanlang:', priorityOptions);
  
  if (selectedPriority) {
    await makeInquiryApiRequest(`/manufacturer/inquiries/${inquiryId}/priority`, 'PATCH', { priority: selectedPriority }, window.t?.('manufacturer.orders.detail.inquiries.javascript.priority_change_success') || 'So\'rov muhimligi muvaffaqiyatli belgilandi');
  }
}

window.scheduleFollowUp = async function(inquiryId) {
  
  const days = await showPromptModal(
    window.t?.('manufacturer.orders.detail.inquiries.javascript.schedule_followup_title') || 'Kuzatuvni rejalashtirish', 
    window.t?.('manufacturer.orders.detail.inquiries.javascript.schedule_followup_message') || 'Necha kun ichida kuzatuv qilish kerak?', 
    '7'
  );
  
  if (days && !isNaN(days)) {
    try {
      const inquiry = await fetch(`/manufacturer/inquiries/api/${inquiryId}`, { credentials: 'include' });
      const data = await inquiry.json();
      
      if (data.success) {
        await data.inquiry.scheduleFollowUp(parseInt(days));
        showToastMessage(window.t?.('manufacturer.orders.detail.inquiries.javascript.followup_scheduled_success') || 'Kuzatuv muvaffaqiyatli rejalashtirildi', 'success');
        loadInquiries();
      }
    } catch (error) {
      showToastMessage((window.t?.('manufacturer.orders.detail.inquiries.javascript.followup_schedule_error') || 'Kuzatuvni rejalashtirishda xatolik') + ': ' + error.message, 'error');
    }
  }
}

window.startChat = async function(inquiryId) {
  
  try {
    // Loading state
    const chatBtn = document.querySelector(`[onclick="startChat('${inquiryId}')"]`);
    if (chatBtn) {
      chatBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      chatBtn.disabled = true;
    }
    
    // Inquiry ma'lumotlarini olish
    const response = await fetch(`/manufacturer/inquiries/api/${inquiryId}`, { 
      credentials: 'include' 
    });
    const data = await response.json();
    
    // Restore button state
    if (chatBtn) {
      chatBtn.innerHTML = '<i class="fas fa-comments"></i>';
      chatBtn.disabled = false;
    }
    
    if (data.success && data.inquiry) {
      const inquiry = data.inquiry;
      
      // Customer contact modal ko'rsatish
      showCustomerContactModal(inquiry);
      
    } else {
      showToastMessage(window.t?.('manufacturer.orders.detail.inquiries.javascript.inquiry_data_not_found') || 'So\'rov ma\'lumotlari topilmadi', 'error');
    }
    
  } catch (error) {
    console.error('Ma\'lumotlarni yuklashda xatolik:', error);
    showToastMessage(window.t?.('manufacturer.orders.detail.inquiries.javascript.data_load_error') || 'Ma\'lumotlarni yuklashda xatolik', 'error');
    
    // Restore button state
    const chatBtn = document.querySelector(`[onclick="startChat('${inquiryId}')"]`);
    if (chatBtn) {
      chatBtn.innerHTML = '<i class="fas fa-comments"></i>';
      chatBtn.disabled = false;
    }
  }
}

// Customer contact modal
function showCustomerContactModal(inquiry) {
  const modal = document.createElement('div');
  modal.className = 'customer-contact-modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">
          <i class="fas fa-user-tie"></i>
          ${window.t?.('manufacturer.orders.detail.inquiries.javascript.contact_customer_title') || 'Mijoz bilan bog\'lanish'}
        </h3>
        <button class="modal-close" onclick="this.closest('.customer-contact-modal-overlay').remove();">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-body">
        <div class="customer-info-card">
          <div class="customer-header">
            <div class="customer-avatar">
              <i class="fas fa-building"></i>
            </div>
            <div class="customer-details">
              <h4>${inquiry.inquirer?.companyName || inquiry.inquirer?.name || (window.t?.('manufacturer.orders.detail.inquiries.javascript.customer') || 'Mijoz')}</h4>
              <p class="customer-type">${window.t?.('manufacturer.orders.detail.inquiries.javascript.business_partner') || 'Biznes hamkor'}</p>
            </div>
          </div>
          
          <div class="inquiry-summary">
            <h5>${window.t?.('manufacturer.orders.detail.inquiries.javascript.about_inquiry') || 'About inquiry'}:</h5>
            <p><strong>${window.t?.('manufacturer.orders.detail.inquiries.javascript.subject_label') || 'Subject'}:</strong> ${inquiry.subject || (window.t?.('manufacturer.orders.detail.inquiries.javascript.general_request') || 'Umumiy so\'rov')}</p>
            <p><strong>${window.t?.('manufacturer.orders.detail.inquiries.javascript.product_label') || 'Product'}:</strong> ${inquiry.product?.title || (window.t?.('manufacturer.orders.detail.inquiries.javascript.not_available_short') || 'N/A')}</p>
            <p><strong>${window.t?.('manufacturer.orders.detail.inquiries.javascript.quantity_label') || 'Quantity'}:</strong> ${inquiry.requestedQuantity || (window.t?.('manufacturer.orders.detail.inquiries.javascript.not_available_short') || 'N/A')} ${inquiry.unit || (window.t?.('manufacturer.orders.detail.inquiries.javascript.unit_piece') || 'dona')}</p>
            ${inquiry.budgetRange ? 
              `<p><strong>${window.t?.('manufacturer.orders.detail.inquiries.javascript.budget_label') || 'Budget'}:</strong> $${inquiry.budgetRange.min?.toLocaleString() || '0'} - $${inquiry.budgetRange.max?.toLocaleString() || '0'}</p>` : 
              ''
            }
          </div>
          
          <div class="contact-options">
            <h5>${window.t?.('manufacturer.orders.detail.inquiries.javascript.contact_methods') || 'Contact methods'}:</h5>
            ${inquiry.inquirer?.email ? 
              `<button class="contact-btn email-btn" onclick="window.open('mailto:${inquiry.inquirer.email}?subject=Re: ${inquiry.subject || (window.t?.('manufacturer.orders.detail.inquiries.javascript.inquiry_subject_fallback') || 'So\'rov')}')">
                <i class="fas fa-envelope"></i>
                <span>${window.t?.('manufacturer.orders.detail.inquiries.javascript.send_email') || 'Send email'}</span>
                <small>${inquiry.inquirer.email}</small>
              </button>` : ''
            }
            ${inquiry.inquirer?.phone ? 
              `<button class="contact-btn phone-btn" onclick="window.open('tel:${inquiry.inquirer.phone}')">
                <i class="fas fa-phone"></i>
                <span>${window.t?.('manufacturer.orders.detail.inquiries.javascript.make_call') || 'Make call'}</span>
                <small>${inquiry.inquirer.phone}</small>
              </button>` : ''
            }
            <button class="contact-btn message-btn" onclick="sendMessage('${inquiry._id}'); this.closest('.customer-contact-modal-overlay').remove();">
              <i class="fas fa-comment-dots"></i>
              <span>${window.t?.('manufacturer.orders.detail.inquiries.javascript.system_message') || 'System message'}</span>
              <small>${window.t?.('manufacturer.orders.detail.inquiries.javascript.send_response') || 'Send response'}</small>
            </button>
          </div>
        </div>
      </div>
      <div class="modal-actions">
        <button class="orders-btn orders-btn-secondary" onclick="this.closest('.customer-contact-modal-overlay').remove();">
          ${window.t?.('manufacturer.orders.detail.inquiries.javascript.close_button') || 'Close'}
        </button>
        <button class="orders-btn orders-btn-primary" onclick="respondToInquiry('${inquiry._id}'); this.closest('.customer-contact-modal-overlay').remove();">
          <i class="fas fa-reply"></i>
          ${window.t?.('manufacturer.orders.detail.inquiries.javascript.respond_button') || 'Respond'}
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Force modal visibility with styles
  modal.style.display = 'flex';
  modal.style.opacity = '1';
  modal.style.visibility = 'visible';
  modal.style.zIndex = '99999';
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100vw';
  modal.style.height = '100vh';
  modal.style.background = 'rgba(0, 0, 0, 0.8)';
  
  // Force modal content visibility
  const modalContent = modal.querySelector('.modal-content');
  if (modalContent) {
    modalContent.style.background = '#ffffff';
    modalContent.style.maxWidth = '600px';
    modalContent.style.margin = 'auto';
    modalContent.style.borderRadius = '16px';
    modalContent.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.3)';
  }
  
  // Handle Escape key
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      modal.remove();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
}

window.sendMessage = async function(inquiryId) {
  
  const message = await showTextareaModal('Xabar yuborish', 'Xabar matnini kiriting:', 'Sizning so\'rovingiz bo\'yicha...');
  
  if (message && message.trim()) {
    await makeInquiryApiRequest(`/manufacturer/inquiries/${inquiryId}/respond`, 'POST', {
      responseType: 'quick_response',
      message: message.trim()
    }, 'Xabar muvaffaqiyatli yuborildi');
  }
}

window.addNote = async function(inquiryId) {
  
  const note = await showTextareaModal('Izoh qo\'shish', 'Ichki izoh matnini kiriting:', 'Eslatma: ');
  
  if (note && note.trim()) {
    await makeInquiryApiRequest(`/manufacturer/inquiries/${inquiryId}/note`, 'POST', { note: note.trim() }, 'Izoh muvaffaqiyatli qo\'shildi');
  }
}

window.duplicateInquiry = async function(inquiryId) {
  
  const confirmed = await showConfirmModal(
    window.t?.('manufacturer.orders.detail.inquiries.javascript.copy_inquiry_title') || 'So\'rovni nusxalash', 
    window.t?.('manufacturer.orders.detail.inquiries.javascript.copy_inquiry_confirm') || 'Haqiqatan ham ushbu so\'rovni nusxalashni xohlaysizmi?'
  );
  
  if (confirmed) {
    await makeInquiryApiRequest(`/manufacturer/inquiries/${inquiryId}/duplicate`, 'POST', {}, 'So\'rov muvaffaqiyatli nusxalandi');
  }
}

window.exportInquiry = async function(inquiryId) {
  
  try {
    const response = await fetch(`/manufacturer/inquiries/${inquiryId}/export`, {
      method: 'GET',
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Download as JSON file
      const blob = new Blob([JSON.stringify(data.exportData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inquiry-${data.exportData.inquiryNumber || inquiryId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      showToastMessage(window.t?.('manufacturer.orders.detail.inquiries.javascript.export_success') || 'So\'rov ma\'lumotlari muvaffaqiyatli eksport qilindi', 'success');
    } else {
      throw new Error(data.message || 'Export failed');
    }
  } catch (error) {
    showToastMessage((window.t?.('manufacturer.orders.detail.inquiries.javascript.export_error') || 'Eksport qilishda xatolik') + ': ' + error.message, 'error');
  }
}

window.shareInquiry = async function(inquiryId) {
  
  const inquiryUrl = `${window.location.origin}/manufacturer/inquiries/${inquiryId}`;
  
  if (navigator.share) {
    try {
      await navigator.share({
        title: window.t?.('manufacturer.orders.detail.inquiries.javascript.business_inquiry') || 'Biznes So\'rovi',
        text: window.t?.('manufacturer.orders.detail.inquiries.javascript.inquiry_data') || 'So\'rov ma\'lumotlari',
        url: inquiryUrl
      });
      showToastMessage(window.t?.('manufacturer.orders.detail.inquiries.javascript.share_success') || 'So\'rov muvaffaqiyatli ulashildi', 'success');
    } catch (error) {
      if (error.name !== 'AbortError') {
        showToastMessage((window.t?.('manufacturer.orders.detail.inquiries.javascript.share_error') || 'Ulashishda xatolik') + ': ' + error.message, 'error');
      }
    }
  } else {
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(inquiryUrl);
      showToastMessage(window.t?.('manufacturer.orders.detail.inquiries.javascript.link_copied') || 'Havola nusxalandi', 'success');
    } catch (error) {
      showToastMessage(window.t?.('manufacturer.orders.detail.inquiries.javascript.link_copy_error') || 'Havolani nusxalashda xatolik', 'error');
    }
  }
}

window.archiveInquiry = async function(inquiryId) {

  const confirmed = await showConfirmModal(window.t?.('manufacturer.orders.detail.inquiries.javascript.archive_inquiry') || 'So\'rovni arxivlash', window.t?.('manufacturer.orders.detail.inquiries.javascript.archive_confirm') || 'Haqiqatan ham ushbu so\'rovni arxivlashni xohlaysizmi? Arxivlangan so\'rovlar alohida ro\'yxatda ko\'rsatiladi.');
  
  if (confirmed) {
    await makeInquiryApiRequest(`/manufacturer/inquiries/${inquiryId}/archive`, 'POST', {}, window.t?.('manufacturer.orders.detail.inquiries.javascript.archive_success') || 'So\'rov muvaffaqiyatli arxivlandi');
  }
}

window.deleteInquiry = async function(inquiryId) {
  const confirmed = await showConfirmModal(window.t?.('manufacturer.orders.detail.inquiries.javascript.delete_inquiry') || 'So\'rovni o\'chirish', window.t?.('manufacturer.orders.detail.inquiries.javascript.delete_confirm') || 'Diqqat! Ushbu so\'rovni o\'chirishni xohlaysizmi? Bu amalni bekor qilib bo\'lmaydi.', 'danger');
  
  if (confirmed) {
    await makeInquiryApiRequest(`/manufacturer/inquiries/${inquiryId}`, 'DELETE', {}, window.t?.('manufacturer.orders.detail.inquiries.javascript.delete_success') || 'So\'rov muvaffaqiyatli o\'chirildi');
  }
}

// Initialize other functionality
function initializeFilters() {
  const form = document.getElementById('inquiriesFiltersForm');
  const searchBtn = document.getElementById('searchInquiriesFiltersBtn');
  const clearBtn = document.getElementById('clearInquiriesFiltersBtn');
  
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      window.InquiriesPage.pagination.page = 1;
      loadInquiries();
    });
  }
  
  if (searchBtn) {
    searchBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.InquiriesPage.pagination.page = 1;
      loadInquiries();
    });
  }
  
  if (clearBtn) {
    clearBtn.addEventListener('click', (e) => {
      e.preventDefault();
      clearFilters();
      window.InquiriesPage.pagination.page = 1;
      loadInquiries();
    });
  }
}

function clearFilters() {
  const form = document.getElementById('inquiriesFiltersForm');
  if (form) {
    form.reset();
  }
}

function initializeModals() {
  // Initialize response modal functionality
  initializeResponseModal();
  initializeQuickQuoteModal();
  
  // Modal close functionality
  initializeModalCloseEvents();
}

function initializeModalCloseEvents() {
  // Close modal when clicking on overlay
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('show');
      }
    });
  });
  
  // Close modal when clicking close button
  document.querySelectorAll('.modal-close').forEach(closeBtn => {
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const modal = closeBtn.closest('.modal-overlay');
      if (modal) {
        modal.classList.remove('show');
      }
    });
  });
  
  // Close modal when pressing Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.show').forEach(modal => {
        modal.classList.remove('show');
      });
    }
  });
  
  // Cancel buttons functionality
  document.getElementById('cancelInquiryResponse')?.addEventListener('click', () => {
    document.getElementById('inquiryResponseModal').classList.remove('show');
  });
  
  document.getElementById('cancelQuickQuote')?.addEventListener('click', () => {
    document.getElementById('quickQuoteModal').classList.remove('show');
  });
}

function initializeResponseModal() {
  // Response type selector with professional switching
  document.querySelectorAll('input[name="responseType"]').forEach(radio => {
    radio.addEventListener('change', function() {
      // Hide all sections first
      const sections = document.querySelectorAll('.response-section');
      sections.forEach(section => {
        section.classList.add('hidden');
        section.style.display = 'none';
      });
      
      // Show target section based on selection
      let targetSectionId;
      switch(this.value) {
        case 'quick_response':
          targetSectionId = 'quickResponseSection';
          break;
        case 'detailed_quote':
          targetSectionId = 'detailedQuoteSection';
          break;
        case 'custom_proposal':
          targetSectionId = 'customProposalSection';
          break;
        default:
          targetSectionId = 'quickResponseSection';
      }
      
      const targetSection = document.getElementById(targetSectionId);
      if (targetSection) {
        targetSection.classList.remove('hidden');
        targetSection.style.display = 'block';
        
        // Initialize specific functionality for each section
        if (this.value === 'detailed_quote') {
          initializeQuoteCalculator();
        }
      }
    });
  });
  
  // Initialize file upload functionality
  initializeFileUpload();
  
}

function initializeQuickQuoteModal() {
  // Auto-calculate total in quick quote
  const unitPriceInput = document.getElementById('quickUnitPrice');
  const totalPriceInput = document.getElementById('quickTotalPrice');
  
  if (unitPriceInput && totalPriceInput) {
    unitPriceInput.addEventListener('input', function() {
      // Auto-calculate based on requested quantity if available
      const unitPrice = parseFloat(this.value) || 0;
      const quantity = window.currentInquiryQuantity || 1;
      const totalPrice = unitPrice * quantity;
      totalPriceInput.value = totalPrice.toFixed(2);
    });
  }
  
  // Detailed quote calculator
  initializeQuoteCalculator();
}

function initializeQuoteCalculator() {
  const unitPriceInput = document.getElementById('unitPrice');
  const minimumQuantityInput = document.getElementById('minimumQuantity');
  const shippingCostInput = document.getElementById('shippingCost');
  const validitySelect = document.getElementById('quoteValidityDays');
  
  const calculatedProductPrice = document.getElementById('calculatedProductPrice');
  const calculatedShippingPrice = document.getElementById('calculatedShippingPrice');
  const calculatedTotalPrice = document.getElementById('calculatedTotalPrice');
  
  function updateCalculations() {
    const unitPrice = parseFloat(unitPriceInput?.value) || 0;
    const quantity = parseFloat(minimumQuantityInput?.value) || window.currentInquiryQuantity || 1;
    const shipping = parseFloat(shippingCostInput?.value) || 0;
    
    const productTotal = unitPrice * quantity;
    const grandTotal = productTotal + shipping;
    
    // Professional formatting with currency
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    };
    
    if (calculatedProductPrice) {
      calculatedProductPrice.textContent = formatCurrency(productTotal);
      calculatedProductPrice.style.color = productTotal > 0 ? '#52C41A' : '#999';
    }
    if (calculatedShippingPrice) {
      calculatedShippingPrice.textContent = formatCurrency(shipping);
      calculatedShippingPrice.style.color = shipping > 0 ? '#FA8C16' : '#999';
    }
    if (calculatedTotalPrice) {
      calculatedTotalPrice.textContent = formatCurrency(grandTotal);
      calculatedTotalPrice.style.color = grandTotal > 0 ? '#1890FF' : '#999';
      calculatedTotalPrice.style.fontWeight = 'bold';
      calculatedTotalPrice.style.fontSize = '1.1em';
    }
    
    // Visual feedback for valid calculations
    if (grandTotal > 0) {
      const quoteSummary = document.querySelector('.quote-summary');
      if (quoteSummary) {
        quoteSummary.style.border = '2px solid #52C41A';
        quoteSummary.style.backgroundColor = 'rgba(82, 196, 26, 0.05)';
      }
    }
    
  }
  
  // Professional input validation
  const validateNumericInput = (input, min = 0, max = 999999999) => {
    input.addEventListener('input', function() {
      let value = parseFloat(this.value);
      if (isNaN(value) || value < min) {
        this.style.borderColor = '#FF4D4F';
        this.style.backgroundColor = 'rgba(255, 77, 79, 0.1)';
      } else if (value > max) {
        this.style.borderColor = '#FA8C16';
        this.style.backgroundColor = 'rgba(250, 140, 22, 0.1)';
      } else {
        this.style.borderColor = '#52C41A';
        this.style.backgroundColor = 'rgba(82, 196, 26, 0.1)';
      }
    });
    
    input.addEventListener('blur', function() {
      this.style.borderColor = '';
      this.style.backgroundColor = '';
    });
  };
  
  // Add event listeners for real-time calculation with validation
  if (unitPriceInput) {
    validateNumericInput(unitPriceInput, 0.01, 999999);
    unitPriceInput.addEventListener('input', updateCalculations);
  }
  
  if (minimumQuantityInput) {
    validateNumericInput(minimumQuantityInput, 1, 999999);
    minimumQuantityInput.addEventListener('input', updateCalculations);
  }
  
  if (shippingCostInput) {
    validateNumericInput(shippingCostInput, 0, 999999);
    shippingCostInput.addEventListener('input', updateCalculations);
  }
  
  if (validitySelect) {
    validitySelect.addEventListener('change', () => {
    });
  }
  
  // Initialize calculations
  updateCalculations();
  
}

// File upload functionality
function initializeFileUpload() {
  const fileInput = document.getElementById('responseAttachments');
  const dropZone = document.getElementById('fileDropZone');
  const fileList = document.getElementById('attachmentsList');
  
  if (!fileInput || !dropZone || !fileList) {
   return;
  }
  
  let selectedFiles = [];
  
  // Drag and drop functionality
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
    dropZone.style.borderColor = '#1890FF';
    dropZone.style.backgroundColor = 'rgba(24, 144, 255, 0.1)';
  });
  
  dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    dropZone.style.borderColor = '';
    dropZone.style.backgroundColor = '';
  });
  
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    dropZone.style.borderColor = '';
    dropZone.style.backgroundColor = '';
    
    const files = Array.from(e.dataTransfer.files);
    handleFileSelection(files);
  });
  
  // Click to upload
  dropZone.addEventListener('click', () => {
    fileInput.click();
  });
  
  fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    handleFileSelection(files);
  });
  
  function handleFileSelection(files) {
    
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv'
    ];
    
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const maxFiles = 5;
    
    files.forEach(file => {
      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        if (window.showToast) {
          window.showToast((window.t?.('manufacturer.orders.detail.inquiries.javascript.file_type_error') || 'Fayl turi qo\'llab-quvvatlanmaydi: ') + file.name, 'error');
        }
        return;
      }
      
      // Validate file size
      if (file.size > maxFileSize) {
        if (window.showToast) {
          window.showToast((window.t?.('manufacturer.orders.detail.inquiries.javascript.file_size_error') || 'Fayl hajmi 10MB dan oshmasligi kerak: ') + file.name, 'error');
        }
        return;
      }
      
      // Check total files limit
      if (selectedFiles.length >= maxFiles) {
        if (window.showToast) {
          window.showToast((window.t?.('manufacturer.orders.detail.inquiries.javascript.max_files_error') || 'Maksimal ') + maxFiles + (window.t?.('manufacturer.orders.detail.inquiries.javascript.max_files_suffix') || ' ta fayl yuklash mumkin'), 'warning');
        }
        return;
      }
      
      // Check for duplicates
      if (selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
        if (window.showToast) {
          window.showToast((window.t?.('manufacturer.orders.detail.inquiries.javascript.file_already_selected') || 'Fayl allaqachon tanlangan: ') + file.name, 'warning');
        }
        return;
      }
      
      selectedFiles.push(file);
      addFileToList(file);
    });
    
    updateFileCounter();
  }
  
  function addFileToList(file) {
    const fileItem = document.createElement('div');
    fileItem.className = 'attachment-item';
    fileItem.innerHTML = `
      <div class="attachment-info">
        <i class="fas ${getFileIcon(file.type)}"></i>
        <div class="attachment-details">
          <span class="attachment-name" title="${file.name}">${truncateFileName(file.name, 30)}</span>
          <span class="attachment-size">${formatFileSize(file.size)}</span>
        </div>
      </div>
      <button type="button" class="attachment-remove" onclick="removeFile('${file.name}')">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    fileList.appendChild(fileItem);
  }
  
  window.removeFile = function(fileName) {
    selectedFiles = selectedFiles.filter(f => f.name !== fileName);
    const fileItems = fileList.querySelectorAll('.attachment-item');
    fileItems.forEach(item => {
      if (item.querySelector('.attachment-name').textContent.includes(fileName)) {
        item.remove();
      }
    });
    updateFileCounter();
  };
  
  function updateFileCounter() {
    const counter = document.getElementById('fileCounter');
    if (counter) {
      counter.textContent = selectedFiles.length > 0 ? 
        `${selectedFiles.length}${window.t?.('manufacturer.orders.detail.inquiries.javascript.files_selected') || ' ta fayl tanlandi'}` : 
        (window.t?.('manufacturer.orders.detail.inquiries.javascript.no_file_selected') || 'Fayl tanlanmagan');
    }
  }
  
  function getFileIcon(mimeType) {
    if (mimeType.startsWith('image/')) return 'fa-image';
    if (mimeType === 'application/pdf') return 'fa-file-pdf';
    if (mimeType.includes('word')) return 'fa-file-word';
    if (mimeType.includes('excel') || mimeType.includes('sheet')) return 'fa-file-excel';
    return 'fa-file';
  }
  
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  function truncateFileName(name, maxLength) {
    if (name.length <= maxLength) return name;
    const ext = name.substring(name.lastIndexOf('.'));
    const baseName = name.substring(0, name.lastIndexOf('.'));
    const truncated = baseName.substring(0, maxLength - ext.length - 3) + '...';
    return truncated + ext;
  }
  
  // Make selected files accessible globally for form submission
  window.getSelectedFiles = () => selectedFiles;
  
  
}

function openInquiryResponseModal(inquiryId) {
  const modal = document.getElementById('inquiryResponseModal');
  if (modal) {
    // Store inquiry ID in modal for form submission
    modal.setAttribute('data-inquiry-id', inquiryId);
    
    // Debug: Check current modal styles
    
    
    // Show modal with force styles
    modal.classList.add('show');
    
    // FORCE MODAL VISIBILITY - Inline styles override
    modal.style.display = 'flex';
    modal.style.opacity = '1';
    modal.style.visibility = 'visible';
    modal.style.zIndex = '99999';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.right = '0';
    modal.style.bottom = '0';
    modal.style.background = 'rgba(0, 0, 0, 0.5)';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    
    
    
    // Load inquiry data and populate modal
    loadInquiryDataForModal(inquiryId);
    
    // Re-initialize form submissions for this modal
    setTimeout(() => {
      initializeModalFormHandlers();
    }, 200);
    
  } else {
    console.error('❌ inquiryResponseModal not found!');
  }
}

function openQuickQuoteModal(inquiryId) {
  const modal = document.getElementById('quickQuoteModal');
  if (modal) {
    // Store inquiry ID for form submission
    modal.setAttribute('data-inquiry-id', inquiryId);
    
   
    modal.classList.add('show');
    
    // FORCE MODAL VISIBILITY - Inline styles override
    modal.style.display = 'flex';
    modal.style.opacity = '1';
    modal.style.visibility = 'visible';
    modal.style.zIndex = '99999';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.right = '0';
    modal.style.bottom = '0';
    modal.style.background = 'rgba(0, 0, 0, 0.5)';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    
    
    
    // Re-initialize quick quote form handlers for this modal
    setTimeout(() => {
      initializeQuickQuoteModalHandlers();
    }, 200);

  } else {
    console.error('❌ quickQuoteModal not found!');
  }
}

function loadInquiryDataForModal(inquiryId) {
  // This would fetch inquiry details and populate the modal
  
  // Set global inquiry data for calculations
  fetch(`/manufacturer/inquiries/api/${inquiryId}`)
    .then(response => response.json())
    .then(data => {
      if (data.success && data.inquiry) {
        const inquiry = data.inquiry;
        window.currentInquiryQuantity = inquiry.requestedQuantity || 1;
        
        // Populate modal fields
        document.getElementById('modalInquiryId').textContent = inquiry.inquiryNumber;
        document.getElementById('modalCustomerName').textContent = inquiry.inquirer?.companyName || inquiry.inquirer?.name;
        document.getElementById('modalProductName').textContent = inquiry.product?.title || inquiry.subject;
        document.getElementById('modalQuantity').textContent = `${inquiry.requestedQuantity || (window.t?.('manufacturer.orders.detail.inquiries.javascript.not_available_short') || 'N/A')} ${inquiry.unit || (window.t?.('manufacturer.orders.detail.inquiries.javascript.unit_piece') || 'dona')}`;
        document.getElementById('modalBudget').textContent = inquiry.budgetRange 
          ? `$${inquiry.budgetRange.min?.toLocaleString() || '0'} - $${inquiry.budgetRange.max?.toLocaleString() || '0'}`
          : 'Muhokama';
      }
    })
    .catch(error => {
      console.error('Error loading inquiry data:', error);
    });
}

// Form submission handlers
function initializeFormSubmissions() {
  
  // Inquiry response form
  const responseForm = document.getElementById('inquiryResponseForm');
  
  if (responseForm) {
    responseForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await handleInquiryResponse();
    });
    
  } else {
    console.warn('⚠️ Response form not found!');
  }
  
  // Quick quote form
  const quickQuoteForm = document.getElementById('quickQuoteForm');
  
  if (quickQuoteForm) {
    quickQuoteForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await handleQuickQuote();
    });
    
  } else {
    console.warn('⚠️ Quick quote form not found!');
  }
  
  // Also add button click handlers as backup
  initializeButtonHandlers();
}

// Backup button click handlers
function initializeButtonHandlers() {
  
  // Response form submit button
  const responseSubmitBtn = document.querySelector('#inquiryResponseForm button[type="submit"]');
  if (responseSubmitBtn) {
    responseSubmitBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await handleInquiryResponse();
    });

  }
  
  // Draft save button
  const draftBtn = document.getElementById('saveAsDraft');
  if (draftBtn) {
    draftBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await handleSaveAsDraft();
    });
  }
  
  // Quick quote submit button
  const quickQuoteSubmitBtn = document.querySelector('#quickQuoteForm button[type="submit"]');
  if (quickQuoteSubmitBtn) {
    quickQuoteSubmitBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await handleQuickQuote();
    });
  }
}

// Modal-specific form handlers (for when modal is opened)
function initializeModalFormHandlers() {
  
  // Response form submit button
  const responseSubmitBtn = document.querySelector('#inquiryResponseForm button[type="submit"]');
  
  if (responseSubmitBtn) {
    // Remove existing listeners and add fresh one
    const newBtn = responseSubmitBtn.cloneNode(true);
    responseSubmitBtn.parentNode.replaceChild(newBtn, responseSubmitBtn);
    
    newBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await handleInquiryResponse();
    });
  }
  
  // Draft save button
  const draftBtn = document.getElementById('saveAsDraft');
  
  if (draftBtn) {
    // Remove existing listeners and add fresh one
    const newDraftBtn = draftBtn.cloneNode(true);
    draftBtn.parentNode.replaceChild(newDraftBtn, draftBtn);
    
    newDraftBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await handleSaveAsDraft();
    });
  }
  
  // Cancel button
  const cancelBtn = document.getElementById('cancelInquiryResponse');
  if (cancelBtn) {
    const newCancelBtn = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
    
    newCancelBtn.addEventListener('click', () => {
            document.getElementById('inquiryResponseModal').classList.remove('show');
    });
  }
  
}

// Quick Quote modal-specific handlers
function initializeQuickQuoteModalHandlers() {
  
  // Quick quote form submit button
  const quickQuoteSubmitBtn = document.querySelector('#quickQuoteForm button[type="submit"]');
  
  if (quickQuoteSubmitBtn) {
    // Remove existing listeners and add fresh one
    const newBtn = quickQuoteSubmitBtn.cloneNode(true);
    quickQuoteSubmitBtn.parentNode.replaceChild(newBtn, quickQuoteSubmitBtn);
    
    newBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await handleQuickQuote();
    });
  }
  
  // Quick quote form handler
  const quickQuoteForm = document.getElementById('quickQuoteForm');
  
  if (quickQuoteForm) {
    // Remove existing listeners and add fresh one
    const newForm = quickQuoteForm.cloneNode(true);
    quickQuoteForm.parentNode.replaceChild(newForm, quickQuoteForm);
    
    const finalForm = document.getElementById('quickQuoteForm');
    finalForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await handleQuickQuote();
    });
  }
  
  // Cancel button
  const cancelBtn = document.getElementById('cancelQuickQuote');
  if (cancelBtn) {
    const newCancelBtn = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
    
    newCancelBtn.addEventListener('click', () => {
      document.getElementById('quickQuoteModal').classList.remove('show');
    });
  }
  
  // Unit price auto-calculation
  const unitPriceInput = document.getElementById('quickUnitPrice');
  const totalPriceInput = document.getElementById('quickTotalPrice');
  
  if (unitPriceInput && totalPriceInput) {
    unitPriceInput.addEventListener('input', () => {
      const unitPrice = parseFloat(unitPriceInput.value) || 0;
      const quantity = window.currentInquiryQuantity || 1;
      const totalPrice = unitPrice * quantity;
      totalPriceInput.value = totalPrice.toFixed(2);
    });
  }
  
}

// Draft save handler
async function handleSaveAsDraft() {
    
  try {
    const form = document.getElementById('inquiryResponseForm');
    const inquiryId = document.getElementById('inquiryResponseModal').dataset.inquiryId;
    
    if (!inquiryId) {
      throw new Error('No inquiry ID found');
    }
    
    // Show loading state
    const draftBtn = document.getElementById('saveAsDraft');
    const originalText = draftBtn.textContent;
    draftBtn.disabled = true;
    draftBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + (window.t?.('manufacturer.orders.detail.inquiries.javascript.saving') || 'Saqlanmoqda...');
    
    // Collect form data
    const formData = new FormData(form);
    const responseType = formData.get('responseType');
    
    // Get message based on response type
    let message = '';
    if (responseType === 'quick_response') {
      message = formData.get('quickResponseMessage') || '';
    } else if (responseType === 'custom_proposal') {
      message = formData.get('customProposalMessage') || '';
    } else if (responseType === 'detailed_quote') {
      message = window.t?.('manufacturer.orders.detail.inquiries.javascript.detailed_quote_draft') || 'Batafsil narx taklifi (Draft)';
    }
    
    const draftData = {
      responseType: responseType,
      message: message.trim() || 'Draft saqlandi',
      isDraft: true,
      savedAt: new Date().toISOString()
    };
    
    // Add quote details if applicable
    if (responseType === 'detailed_quote') {
      draftData.quoteDetails = {
        unitPrice: parseFloat(formData.get('unitPrice')) || 0,
        minimumQuantity: parseInt(formData.get('minimumQuantity')) || 1,
        shippingCost: parseFloat(formData.get('shippingCost')) || 0,
        validityDays: parseInt(formData.get('quoteValidityDays')) || 14,
        terms: formData.get('quoteTerms') || ''
      };
    }
    
    
    
    // For now, save to localStorage (in production, save to server)
    const draftsKey = `inquiry_drafts_${inquiryId}`;
    localStorage.setItem(draftsKey, JSON.stringify(draftData));
    
    // Success animation
    draftBtn.innerHTML = '<i class="fas fa-check"></i> Saqlandi!';
    draftBtn.style.background = '#52C41A';
    
    setTimeout(() => {
      draftBtn.disabled = false;
      draftBtn.textContent = originalText;
      draftBtn.style.background = '';
      
      if (window.showToast) {
        window.showToast(window.t?.('manufacturer.orders.detail.inquiries.javascript.draft_saved') || 'Draft muvaffaqiyatli saqlandi!', 'success');
      }
    }, 2000);
    
  } catch (error) {
    console.error('❌ Error saving draft:', error);
    
    // Reset button state
    const draftBtn = document.getElementById('saveAsDraft');
    draftBtn.disabled = false;
    draftBtn.textContent = 'Draft saqlaش';
    draftBtn.style.background = '';
    
    if (window.showToast) {
      window.showToast('Draft saqlashda xatolik: ' + error.message, 'error');
    }
  }
}

async function handleInquiryResponse() {
  
  
  try {
    const form = document.getElementById('inquiryResponseForm');
    const inquiryId = document.getElementById('inquiryResponseModal').dataset.inquiryId;
    
    
    
    if (!form) {
      throw new Error('Form not found');
    }
    
    if (!inquiryId) {
      throw new Error('No inquiry ID found');
    }
    
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]') || document.querySelector('#inquiryResponseForm button[type="submit"]');
    
    
    if (!submitBtn) {
      throw new Error('Submit button not found');
    }
    
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + (window.t?.('manufacturer.orders.detail.inquiries.javascript.sending') || 'Yuborilmoqda...');
    
    // Collect form data professionally
    const formData = new FormData(form);
    const responseType = formData.get('responseType');
    
    // Get message based on response type
    let message = '';
    if (responseType === 'quick_response') {
      message = formData.get('quickResponseMessage') || '';
    } else if (responseType === 'custom_proposal') {
      message = formData.get('customProposalMessage') || '';
    } else if (responseType === 'detailed_quote') {
      message = window.t?.('manufacturer.orders.detail.inquiries.javascript.detailed_quote') || 'Batafsil narx taklifi'; // Default message for detailed quotes
    }
    
    // Validate message
    if (!message.trim()) {
      throw new Error(window.t?.('manufacturer.orders.detail.inquiries.javascript.response_required') || 'Javob matni kiritilishi shart');
    }
    
    const responseData = {
      responseType: responseType,
      message: message.trim(),
      attachments: []
    };
    
    // Add detailed quote data if selected
    if (formData.get('responseType') === 'detailed_quote') {
      responseData.quoteDetails = {
        unitPrice: parseFloat(formData.get('unitPrice')) || 0,
        minimumQuantity: parseInt(formData.get('minimumQuantity')) || 1,
        shippingCost: parseFloat(formData.get('shippingCost')) || 0,
        validityDays: parseInt(formData.get('quoteValidityDays')) || 14,
        terms: formData.get('quoteTerms') || ''
      };
      
      // Calculate totals
      const quantity = Math.max(window.currentInquiryQuantity || 1, responseData.quoteDetails.minimumQuantity);
      responseData.quoteDetails.totalPrice = (responseData.quoteDetails.unitPrice * quantity) + responseData.quoteDetails.shippingCost;
    }
    
    // Handle file attachments if any
    const selectedFiles = window.getSelectedFiles ? window.getSelectedFiles() : [];
    
    
    
    // Create FormData for file upload
    const submitFormData = new FormData();
    
    // Add text data
    submitFormData.append('responseType', responseData.responseType);
    submitFormData.append('message', responseData.message);
    
    // Add quote details if applicable
    if (responseData.quoteDetails) {
      submitFormData.append('quoteDetails', JSON.stringify(responseData.quoteDetails));
    }
    
    // Add files
    selectedFiles.forEach((file, index) => {
      submitFormData.append('attachments', file);
    });
    
    const response = await fetch(`/manufacturer/inquiries/${inquiryId}/respond`, {
      method: 'POST',
      body: submitFormData, // Use FormData instead of JSON
      credentials: 'include'
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Success animation
      submitBtn.innerHTML = '<i class="fas fa-check"></i> ' + (window.t?.('manufacturer.orders.detail.inquiries.javascript.success') || 'Muvaffaqiyatli!');
      submitBtn.style.background = '#52C41A';
      
      setTimeout(() => {
        document.getElementById('inquiryResponseModal').classList.remove('show');
        if (window.showToast) {
          window.showToast(window.t?.('manufacturer.orders.detail.inquiries.javascript.response_sent') || 'Javob muvaffaqiyatli yuborildi!', 'success');
        }
        loadInquiries(); // Refresh the list
        
        // Reset form
        form.reset();
        if (window.getSelectedFiles) {
          window.getSelectedFiles().length = 0; // Clear selected files
        }
      }, 1500);
      
    } else {
      throw new Error(result.message || 'Response submission failed');
    }
    
  } catch (error) {
    console.error('❌ Error submitting response:', error);
    
    // Reset button state
    const form = document.getElementById('inquiryResponseForm');
    const submitBtn = form?.querySelector('button[type="submit"]') || document.querySelector('#inquiryResponseForm button[type="submit"]');
    
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Javob yuborish';
      submitBtn.style.background = '';
    }
    
    if (window.showToast) {
      window.showToast('Javob yuborishda xatolik: ' + error.message, 'error');
    } else {
      alert('Javob yuborishda xatolik: ' + error.message);
    }
  }
}

async function handleQuickQuote() {
  
  try {
    const form = document.getElementById('quickQuoteForm');
    const inquiryId = document.getElementById('quickQuoteModal').dataset.inquiryId;
    
    
    if (!form) {
      throw new Error('Quick quote form not found');
    }
    
    if (!inquiryId) {
      throw new Error('No inquiry ID found');
    }
    
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]') || document.querySelector('#quickQuoteForm button[type="submit"]');
    
    if (!submitBtn) {
      throw new Error('Submit button not found');
    }
    
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + (window.t?.('manufacturer.orders.detail.inquiries.javascript.sending') || 'Yuborilmoqda...');
    
    // Collect form data professionally
    const formData = new FormData(form);
    const unitPrice = parseFloat(formData.get('quickUnitPrice')) || 0;
    const validityDays = parseInt(formData.get('quickValidityDays')) || 30;
    const note = formData.get('quickNote') || '';
    
    
    
    // Calculate total based on current inquiry quantity
    const quantity = window.currentInquiryQuantity || 1;
    const totalPrice = unitPrice * quantity;
    
    // Backend expects specific field names
    const quoteData = {
      unitPrice: unitPrice,
      totalPrice: totalPrice,
      note: note
    };
    
    
    // Validation
    if (unitPrice <= 0) {
      throw new Error(window.t?.('manufacturer.orders.detail.inquiries.javascript.unit_price_error') || 'Birlik narxi 0 dan katta bo\'lishi kerak');
    }
    
    
    const response = await fetch(`/manufacturer/inquiries/${inquiryId}/quick-quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(quoteData),
      credentials: 'include'
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Success animation
      submitBtn.innerHTML = '<i class="fas fa-check"></i> Yuborildi!';
      submitBtn.style.background = '#52C41A';
      
      setTimeout(() => {
        document.getElementById('quickQuoteModal').classList.remove('show');
        if (window.showToast) {
          window.showToast((window.t?.('manufacturer.orders.detail.inquiries.javascript.quick_quote_sent') || 'Tezkor taklif yuborildi: $') + totalPrice.toLocaleString(), 'success');
        }
        loadInquiries(); // Refresh the list
        
        // Reset form
        form.reset();
      }, 1500);
      
    } else {
      throw new Error(result.message || 'Quick quote submission failed');
    }
    
  } catch (error) {
    console.error('❌ Error submitting quick quote:', error);
    
    // Reset button state
    const form = document.getElementById('quickQuoteForm');
    const submitBtn = form?.querySelector('button[type="submit"]') || document.querySelector('#quickQuoteForm button[type="submit"]');
    
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Yuborish';
      submitBtn.style.background = '';
    }
    
    if (window.showToast) {
      window.showToast('Tezkor taklif yuborishda xatolik: ' + error.message, 'error');
    } else {
      alert('Tezkor taklif yuborishda xatolik: ' + error.message);
    }
  }
}



// Simple table interactions - NO DROPDOWN
function initializeInquiriesTableInteractions() {
  
  // Checkbox interactions
  document.querySelectorAll('.inquiry-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', updateBulkActions);
  });
  
  // Simple action button clicks - no additional handling needed as onclick is already in HTML
}





function handleSelectAll() {
  const selectAll = document.getElementById('selectAllInquiries');
  const checkboxes = document.querySelectorAll('.inquiry-checkbox');
  
  if (selectAll && checkboxes.length > 0) {
    checkboxes.forEach(checkbox => {
      checkbox.checked = selectAll.checked;
    });
    updateBulkActions();
  }
}

function updateBulkActions() {
  const checkedBoxes = document.querySelectorAll('.inquiry-checkbox:checked');
  const bulkBtn = document.getElementById('bulkInquiriesActionsBtn');
  
  if (bulkBtn) {
    bulkBtn.style.display = checkedBoxes.length > 0 ? 'block' : 'none';
  }
}

function showBulkActions() {
  const checkedBoxes = document.querySelectorAll('.inquiry-checkbox:checked');
  const inquiryIds = Array.from(checkedBoxes).map(cb => cb.dataset.inquiryId);
  
  if (window.showToast) {
    window.showToast(`${inquiryIds.length} ta so'rov tanlandi`, 'info');
  }
}

// Pagination
function updatePagination(pagination) {
  window.InquiriesPage.pagination = pagination;
  
  const paginationContainer = document.getElementById('inquiriesPagination');
  const paginationInfo = document.getElementById('inquiriesPaginationInfo');
  const paginationControls = document.getElementById('inquiriesPaginationControls');
  
  if (!paginationContainer || !pagination) return;
  
  if (pagination.total > 0 && pagination.totalPages > 1) {
    paginationContainer.style.display = 'flex';
    
    const start = ((pagination.page - 1) * pagination.limit) + 1;
    const end = Math.min(pagination.page * pagination.limit, pagination.total);
    paginationInfo.innerHTML = `<span>${start}-${end}</span> dan <span>${pagination.total}</span> ta ko'rsatilmoqda`;
    
    let paginationHTML = '';
    
    if (pagination.hasPrev) {
      paginationHTML += `
        <button class="table-pagination-btn" onclick="changePage(${pagination.page - 1})" title="Oldingi sahifa">
          <i class="fas fa-chevron-left"></i>
        </button>
      `;
    }
    
    const startPage = Math.max(1, pagination.page - 2);
    const endPage = Math.min(pagination.totalPages, pagination.page + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      paginationHTML += `
        <button class="table-pagination-btn ${i === pagination.page ? 'active' : ''}" 
                onclick="changePage(${i})" 
                title="Sahifa ${i}">
          ${i}
        </button>
      `;
    }
    
    if (pagination.hasNext) {
      paginationHTML += `
        <button class="table-pagination-btn" onclick="changePage(${pagination.page + 1})" title="Keyingi sahifa">
          <i class="fas fa-chevron-right"></i>
        </button>
      `;
    }
    
    paginationControls.innerHTML = paginationHTML;
  } else {
    paginationContainer.style.display = 'none';
  }
}

function changePage(page) {
  window.InquiriesPage.pagination.page = page;
  loadInquiries();
}

// 🔧 DEBUG FUNCTION - Test Modal
window.testModal = function() {
  const modal = document.getElementById('inquiryResponseModal');
  if (modal) {
    modal.classList.add('show');
    modal.style.display = 'flex';
    modal.style.opacity = '1';
    modal.style.visibility = 'visible';
    modal.style.zIndex = '99999';   
  } else {
    console.error('Modal not found');
  }
};

// 🛠️ UTILITY FUNCTIONS - Messages Table Style
async function makeInquiryApiRequest(url, method, data, successMessage) {
  try {
    const options = {
      method,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (data && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(url, options);
    const result = await response.json();
    
    if (result.success) {
      showToastMessage(successMessage, 'success');
      loadInquiries(); // Refresh the list
      return result;
    } else {
      throw new Error(result.message || result.error || 'Operation failed');
    }
  } catch (error) {
    console.error('API request error:', error);
    showToastMessage((window.t?.('manufacturer.orders.detail.inquiries.javascript.error_prefix') || 'Xatolik: ') + error.message, 'error');
    throw error;
  }
}

function showToastMessage(message, type = 'info') {
  if (window.showToast) {
    window.showToast(message, type);
  } else {
    // Fallback to alert if toast system not available
    alert(message);
  }
}

async function showConfirmModal(title, message, type = 'warning') {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay show';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">
            <i class="fas fa-${type === 'danger' ? 'exclamation-triangle' : 'question-circle'}"></i>
            ${title}
          </h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove(); resolve(false);">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p style="margin: 0; font-size: 1rem; line-height: 1.5;">${message}</p>
        </div>
        <div class="modal-actions">
          <button class="orders-btn orders-btn-secondary" onclick="this.closest('.modal-overlay').remove(); resolve(false);">
            ${window.t?.('manufacturer.orders.detail.inquiries.javascript.cancel') || 'Bekor qilish'}
          </button>
          <button class="orders-btn orders-btn-${type === 'danger' ? 'danger' : 'primary'}" onclick="this.closest('.modal-overlay').remove(); resolve(true);">
            ${type === 'danger' ? (window.t?.('manufacturer.orders.detail.inquiries.javascript.delete') || 'O\'chirish') : (window.t?.('manufacturer.orders.detail.inquiries.javascript.confirm') || 'Tasdiqlash')}
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle button clicks
    modal.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const isConfirm = btn.textContent.trim() !== (window.t?.('manufacturer.orders.detail.inquiries.javascript.cancel') || 'Bekor qilish');
        modal.remove();
        resolve(isConfirm);
      });
    });
    
    // Handle Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        modal.remove();
        resolve(false);
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  });
}

async function showSelectModal(title, message, options) {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay show';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">
            <i class="fas fa-list"></i>
            ${title}
          </h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove(); resolve(null);">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p style="margin: 0 0 1rem; font-size: 1rem;">${message}</p>
          <select class="form-control" id="modalSelect" style="width: 100%; padding: 0.75rem;">
            <option value="">${window.t?.('manufacturer.orders.detail.inquiries.javascript.select_option') || 'Tanlang...'}</option>
            ${options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
          </select>
        </div>
        <div class="modal-actions">
          <button class="orders-btn orders-btn-secondary" onclick="this.closest('.modal-overlay').remove(); resolve(null);">
            ${window.t?.('manufacturer.orders.detail.inquiries.javascript.cancel') || 'Bekor qilish'}
          </button>
          <button class="orders-btn orders-btn-primary" onclick="
            const value = this.closest('.modal-overlay').querySelector('#modalSelect').value;
            this.closest('.modal-overlay').remove();
            resolve(value || null);
          ">
            ${window.t?.('manufacturer.orders.detail.inquiries.javascript.confirm') || 'Tasdiqlash'}
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Focus on select
    setTimeout(() => {
      modal.querySelector('#modalSelect').focus();
    }, 100);
    
    // Handle Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        modal.remove();
        resolve(null);
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  });
}

// Professional Product Name Truncation Function
function truncateProductName(name, maxLength = 30) {
  if (!name || typeof name !== 'string') {
    return 'N/A';
  }
  
  if (name.length <= maxLength) {
    return name;
  }
  
  return name.substring(0, maxLength - 3) + '...';
}

// Update Modal Product Information
function updateModalProductInfo(inquiry) {
  try {
    // Update customer name
    const customerName = inquiry.inquirer?.companyName || inquiry.inquirer?.name || 'Unknown Customer';
    document.getElementById('modalCustomerName').textContent = customerName;
    
    // Update product name with truncation and full title
    const productName = inquiry.product?.name || 'Unknown Product';
    const productNameElement = document.getElementById('modalProductName');
    productNameElement.textContent = truncateProductName(productName);
    productNameElement.title = productName; // Full name in tooltip
    
    // Update quantity
    const quantity = inquiry.quantity || inquiry.quantityRequested || 0;
    const unit = inquiry.unit || inquiry.product?.inventory?.unit || 'pieces';
    document.getElementById('modalQuantity').textContent = `${quantity} ${unit}`;
    
    // Update budget
    const budgetMin = inquiry.budgetMin || inquiry.budgetRange?.min || 0;
    const budgetMax = inquiry.budgetMax || inquiry.budgetRange?.max || 0;
    const currency = inquiry.budgetCurrency || inquiry.currency || 'USD';
    const budgetText = budgetMin && budgetMax ? 
      `${currency} ${budgetMin.toLocaleString()} - ${budgetMax.toLocaleString()}` :
      budgetMin ? `${currency} ${budgetMin.toLocaleString()}+` :
      'Not specified';
    document.getElementById('modalBudget').textContent = budgetText;
    
    // Update inquiry date
    const inquiryDate = inquiry.createdAt ? 
      new Date(inquiry.createdAt).toLocaleDateString() : 
      'Unknown';
    document.getElementById('modalInquiryDate').textContent = inquiryDate;
    
    // Update priority
    const priority = inquiry.priority || 'medium';
    const priorityElement = document.getElementById('modalPriority');
    priorityElement.innerHTML = `<span class="priority-badge priority-${priority}">${priority.charAt(0).toUpperCase() + priority.slice(1)}</span>`;
    
    // Update status
    const status = inquiry.status || 'open';
    const statusElement = document.getElementById('modalStatus');
    statusElement.innerHTML = `<span class="status-badge status-${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>`;
    
    // Update inquiry ID
    const inquiryId = inquiry.inquiryId || inquiry._id || 'Unknown';
    document.getElementById('modalInquiryId').textContent = `#INQ-${inquiryId}`;
    
  } catch (error) {
    console.error('❌ Error updating modal product information:', error);
  }
}

// Global function to respond to inquiry
async function respondToInquiry(inquiryId) {
  try {
    // Get inquiry details first
    const inquiryResponse = await fetch(`/manufacturer/inquiries/api/${inquiryId}`, {
      method: 'GET',
      credentials: 'include'
    });
    
    if (!inquiryResponse.ok) {
      throw new Error(`Failed to fetch inquiry details: ${inquiryResponse.status}`);
    }
    
    const inquiryData = await inquiryResponse.json();
    if (!inquiryData.success) {
      throw new Error(inquiryData.message || 'Failed to load inquiry details');
    }
    
    const inquiry = inquiryData.inquiry;
    
    // Update modal with inquiry data
    updateModalProductInfo(inquiry);
    
    // Show the modal
    const modal = document.getElementById('inquiryResponseModal');
    if (modal) {
      modal.style.display = 'block';
      modal.classList.add('active');
      
      // Add escape key listener
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          closeInquiryResponseModal();
          document.removeEventListener('keydown', handleEscape);
        }
      };
      document.addEventListener('keydown', handleEscape);
      
    } else {
      throw new Error('Response modal not found');
    }
    
  } catch (error) {
    console.error('❌ Error opening response modal:', error);
    alert('So\'rovga javob berish modalini ochishda xatolik yuz berdi. Sahifani qayta yuklang.');
  }
}

// Global function to close response modal
function closeInquiryResponseModal() {
  const modal = document.getElementById('inquiryResponseModal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('active');
  }
}

// Global function for quick quote
async function sendQuickQuote(inquiryId) {
  try {
    // Get inquiry details first
    const inquiryResponse = await fetch(`/manufacturer/inquiries/api/${inquiryId}`, {
      method: 'GET',
      credentials: 'include'
    });
    
    if (!inquiryResponse.ok) {
      throw new Error(`Failed to fetch inquiry details: ${inquiryResponse.status}`);
    }
    
    const inquiryData = await inquiryResponse.json();
    if (!inquiryData.success) {
      throw new Error(inquiryData.message || 'Failed to load inquiry details');
    }
    
    const inquiry = inquiryData.inquiry;
    
    // Update modal with inquiry data
    updateModalProductInfo(inquiry);
    
    // Show quick quote modal
    const modal = document.getElementById('quickQuoteModal');
    if (modal) {
      modal.style.display = 'block';
      modal.classList.add('active');
    } else {
      throw new Error('Quick quote modal not found');
    }
    
  } catch (error) {
    console.error('❌ Error opening quick quote modal:', error);
    alert('Tezkor taklif modalini ochishda xatolik yuz berdi. Sahifani qayta yuklang.');
  }
}

// Global function to start chat
async function startChat(inquiryId) {
  try {
    // Get inquiry details first
    const inquiryResponse = await fetch(`/manufacturer/inquiries/api/${inquiryId}`, {
      method: 'GET',
      credentials: 'include'
    });
    
    if (!inquiryResponse.ok) {
      throw new Error(`Failed to fetch inquiry details: ${inquiryResponse.status}`);
    }
    
    const inquiryData = await inquiryResponse.json();
    if (!inquiryData.success) {
      throw new Error(inquiryData.message || 'Failed to load inquiry details');
    }
    
    const inquiry = inquiryData.inquiry;
    
    // Redirect to messages page with inquiry context
    const inquirerId = inquiry.inquirer?._id || inquiry.inquirer?.id;
    if (inquirerId) {
      window.location.href = `/manufacturer/messages?inquiry=${inquiryId}&manufacturer=${inquirerId}`;
    } else {
      throw new Error('Inquirer information not available');
    }
    
  } catch (error) {
    console.error('❌ Error starting chat:', error);
    alert('Chat boshlashda xatolik yuz berdi. Sahifani qayta yuklang.');
  }
}

async function showTextareaModal(title, message, placeholder = '') {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay show';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">
            <i class="fas fa-edit"></i>
            ${title}
          </h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove(); resolve(null);">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p style="margin: 0 0 1rem; font-size: 1rem;">${message}</p>
          <textarea class="form-control" id="modalTextarea" rows="4" placeholder="${placeholder}" style="width: 100%; padding: 0.75rem; resize: vertical;"></textarea>
        </div>
        <div class="modal-actions">
          <button class="orders-btn orders-btn-secondary" onclick="this.closest('.modal-overlay').remove(); resolve(null);">
            ${window.t?.('manufacturer.orders.detail.inquiries.javascript.cancel') || 'Bekor qilish'}
          </button>
          <button class="orders-btn orders-btn-primary" onclick="
            const value = this.closest('.modal-overlay').querySelector('#modalTextarea').value;
            this.closest('.modal-overlay').remove();
            resolve(value || null);
          ">
            ${window.t?.('manufacturer.orders.detail.inquiries.javascript.confirm') || 'Tasdiqlash'}
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Focus on textarea
    setTimeout(() => {
      modal.querySelector('#modalTextarea').focus();
    }, 100);
    
    // Handle Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        modal.remove();
        resolve(null);
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  });
}

// Professional Product Name Truncation Function
function truncateProductName(name, maxLength = 30) {
  if (!name || typeof name !== 'string') {
    return 'N/A';
  }
  
  if (name.length <= maxLength) {
    return name;
  }
  
  return name.substring(0, maxLength - 3) + '...';
}

// Update Modal Product Information
function updateModalProductInfo(inquiry) {
  try {
    // Update customer name
    const customerName = inquiry.inquirer?.companyName || inquiry.inquirer?.name || 'Unknown Customer';
    document.getElementById('modalCustomerName').textContent = customerName;
    
    // Update product name with truncation and full title
    const productName = inquiry.product?.name || 'Unknown Product';
    const productNameElement = document.getElementById('modalProductName');
    productNameElement.textContent = truncateProductName(productName);
    productNameElement.title = productName; // Full name in tooltip
    
    // Update quantity
    const quantity = inquiry.quantity || inquiry.quantityRequested || 0;
    const unit = inquiry.unit || inquiry.product?.inventory?.unit || 'pieces';
    document.getElementById('modalQuantity').textContent = `${quantity} ${unit}`;
    
    // Update budget
    const budgetMin = inquiry.budgetMin || inquiry.budgetRange?.min || 0;
    const budgetMax = inquiry.budgetMax || inquiry.budgetRange?.max || 0;
    const currency = inquiry.budgetCurrency || inquiry.currency || 'USD';
    const budgetText = budgetMin && budgetMax ? 
      `${currency} ${budgetMin.toLocaleString()} - ${budgetMax.toLocaleString()}` :
      budgetMin ? `${currency} ${budgetMin.toLocaleString()}+` :
      'Not specified';
    document.getElementById('modalBudget').textContent = budgetText;
    
    // Update inquiry date
    const inquiryDate = inquiry.createdAt ? 
      new Date(inquiry.createdAt).toLocaleDateString() : 
      'Unknown';
    document.getElementById('modalInquiryDate').textContent = inquiryDate;
    
    // Update priority
    const priority = inquiry.priority || 'medium';
    const priorityElement = document.getElementById('modalPriority');
    priorityElement.innerHTML = `<span class="priority-badge priority-${priority}">${priority.charAt(0).toUpperCase() + priority.slice(1)}</span>`;
    
    // Update status
    const status = inquiry.status || 'open';
    const statusElement = document.getElementById('modalStatus');
    statusElement.innerHTML = `<span class="status-badge status-${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>`;
    
    // Update inquiry ID
    const inquiryId = inquiry.inquiryId || inquiry._id || 'Unknown';
    document.getElementById('modalInquiryId').textContent = `#INQ-${inquiryId}`;
    
  } catch (error) {
    console.error('❌ Error updating modal product information:', error);
  }
}

// Global function to respond to inquiry
async function respondToInquiry(inquiryId) {
  try {
    // Get inquiry details first
    const inquiryResponse = await fetch(`/manufacturer/inquiries/api/${inquiryId}`, {
      method: 'GET',
      credentials: 'include'
    });
    
    if (!inquiryResponse.ok) {
      throw new Error(`Failed to fetch inquiry details: ${inquiryResponse.status}`);
    }
    
    const inquiryData = await inquiryResponse.json();
    if (!inquiryData.success) {
      throw new Error(inquiryData.message || 'Failed to load inquiry details');
    }
    
    const inquiry = inquiryData.inquiry;
    
    // Update modal with inquiry data
    updateModalProductInfo(inquiry);
    
    // Show the modal
    const modal = document.getElementById('inquiryResponseModal');
    if (modal) {
      modal.style.display = 'block';
      modal.classList.add('active');
      
      // Add escape key listener
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          closeInquiryResponseModal();
          document.removeEventListener('keydown', handleEscape);
        }
      };
      document.addEventListener('keydown', handleEscape);
      
    } else {
      throw new Error('Response modal not found');
    }
    
  } catch (error) {
    console.error('❌ Error opening response modal:', error);
    alert('So\'rovga javob berish modalini ochishda xatolik yuz berdi. Sahifani qayta yuklang.');
  }
}

// Global function to close response modal
function closeInquiryResponseModal() {
  const modal = document.getElementById('inquiryResponseModal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('active');
  }
}

// Global function for quick quote
async function sendQuickQuote(inquiryId) {
  try {
    // Get inquiry details first
    const inquiryResponse = await fetch(`/manufacturer/inquiries/api/${inquiryId}`, {
      method: 'GET',
      credentials: 'include'
    });
    
    if (!inquiryResponse.ok) {
      throw new Error(`Failed to fetch inquiry details: ${inquiryResponse.status}`);
    }
    
    const inquiryData = await inquiryResponse.json();
    if (!inquiryData.success) {
      throw new Error(inquiryData.message || 'Failed to load inquiry details');
    }
    
    const inquiry = inquiryData.inquiry;
    
    // Update modal with inquiry data
    updateModalProductInfo(inquiry);
    
    // Show quick quote modal
    const modal = document.getElementById('quickQuoteModal');
    if (modal) {
      modal.style.display = 'block';
      modal.classList.add('active');
      
    } else {
      throw new Error('Quick quote modal not found');
    }
    
  } catch (error) {
    console.error('❌ Error opening quick quote modal:', error);
    alert('Tezkor taklif modalini ochishda xatolik yuz berdi. Sahifani qayta yuklang.');
  }
}

// Global function to start chat
async function startChat(inquiryId) {
  try {
    
    // Get inquiry details first
    const inquiryResponse = await fetch(`/manufacturer/inquiries/api/${inquiryId}`, {
      method: 'GET',
      credentials: 'include'
    });
    
    if (!inquiryResponse.ok) {
      throw new Error(`Failed to fetch inquiry details: ${inquiryResponse.status}`);
    }
    
    const inquiryData = await inquiryResponse.json();
    if (!inquiryData.success) {
      throw new Error(inquiryData.message || 'Failed to load inquiry details');
    }
    
    const inquiry = inquiryData.inquiry;
    
    // Redirect to messages page with inquiry context
    const inquirerId = inquiry.inquirer?._id || inquiry.inquirer?.id;
    if (inquirerId) {
      window.location.href = `/manufacturer/messages?inquiry=${inquiryId}&manufacturer=${inquirerId}`;
    } else {
      throw new Error('Inquirer information not available');
    }
    
  } catch (error) {
    console.error('❌ Error starting chat:', error);
    alert('Chat boshlashda xatolik yuz berdi. Sahifani qayta yuklang.');
  }
}

async function showPromptModal(title, message, defaultValue = '') {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay show';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">
            <i class="fas fa-keyboard"></i>
            ${title}
          </h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove(); resolve(null);">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p style="margin: 0 0 1rem; font-size: 1rem;">${message}</p>
          <input type="text" class="form-control" id="modalInput" value="${defaultValue}" style="width: 100%; padding: 0.75rem;">
        </div>
        <div class="modal-actions">
          <button class="orders-btn orders-btn-secondary" onclick="this.closest('.modal-overlay').remove(); resolve(null);">
            ${window.t?.('manufacturer.orders.detail.inquiries.javascript.cancel') || 'Bekor qilish'}
          </button>
          <button class="orders-btn orders-btn-primary" onclick="
            const value = this.closest('.modal-overlay').querySelector('#modalInput').value;
            this.closest('.modal-overlay').remove();
            resolve(value || null);
          ">
            ${window.t?.('manufacturer.orders.detail.inquiries.javascript.confirm') || 'Tasdiqlash'}
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Focus on input and select all text
    setTimeout(() => {
      const input = modal.querySelector('#modalInput');
      input.focus();
      input.select();
    }, 100);
    
    // Handle Enter key
    modal.querySelector('#modalInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const value = e.target.value;
        modal.remove();
        resolve(value || null);
      }
    });
    
    // Handle Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        modal.remove();
        resolve(null);
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  });
}

// Professional Product Name Truncation Function
function truncateProductName(name, maxLength = 30) {
  if (!name || typeof name !== 'string') {
    return 'N/A';
  }
  
  if (name.length <= maxLength) {
    return name;
  }
  
  return name.substring(0, maxLength - 3) + '...';
}

// Update Modal Product Information
function updateModalProductInfo(inquiry) {
  try {
    // Update customer name
    const customerName = inquiry.inquirer?.companyName || inquiry.inquirer?.name || 'Unknown Customer';
    document.getElementById('modalCustomerName').textContent = customerName;
    
    // Update product name with truncation and full title
    const productName = inquiry.product?.name || 'Unknown Product';
    const productNameElement = document.getElementById('modalProductName');
    productNameElement.textContent = truncateProductName(productName);
    productNameElement.title = productName; // Full name in tooltip
    
    // Update quantity
    const quantity = inquiry.quantity || inquiry.quantityRequested || 0;
    const unit = inquiry.unit || inquiry.product?.inventory?.unit || 'pieces';
    document.getElementById('modalQuantity').textContent = `${quantity} ${unit}`;
    
    // Update budget
    const budgetMin = inquiry.budgetMin || inquiry.budgetRange?.min || 0;
    const budgetMax = inquiry.budgetMax || inquiry.budgetRange?.max || 0;
    const currency = inquiry.budgetCurrency || inquiry.currency || 'USD';
    const budgetText = budgetMin && budgetMax ? 
      `${currency} ${budgetMin.toLocaleString()} - ${budgetMax.toLocaleString()}` :
      budgetMin ? `${currency} ${budgetMin.toLocaleString()}+` :
      'Not specified';
    document.getElementById('modalBudget').textContent = budgetText;
    
    // Update inquiry date
    const inquiryDate = inquiry.createdAt ? 
      new Date(inquiry.createdAt).toLocaleDateString() : 
      'Unknown';
    document.getElementById('modalInquiryDate').textContent = inquiryDate;
    
    // Update priority
    const priority = inquiry.priority || 'medium';
    const priorityElement = document.getElementById('modalPriority');
    priorityElement.innerHTML = `<span class="priority-badge priority-${priority}">${priority.charAt(0).toUpperCase() + priority.slice(1)}</span>`;
    
    // Update status
    const status = inquiry.status || 'open';
    const statusElement = document.getElementById('modalStatus');
    statusElement.innerHTML = `<span class="status-badge status-${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>`;
    
    // Update inquiry ID
    const inquiryId = inquiry.inquiryId || inquiry._id || 'Unknown';
    document.getElementById('modalInquiryId').textContent = `#INQ-${inquiryId}`;
    
  } catch (error) {
    console.error('❌ Error updating modal product information:', error);
  }
}

// Global function to respond to inquiry
async function respondToInquiry(inquiryId) {
  try {
    // Get inquiry details first
    const inquiryResponse = await fetch(`/manufacturer/inquiries/api/${inquiryId}`, {
      method: 'GET',
      credentials: 'include'
    });
    
    if (!inquiryResponse.ok) {
      throw new Error(`Failed to fetch inquiry details: ${inquiryResponse.status}`);
    }
    
    const inquiryData = await inquiryResponse.json();
    if (!inquiryData.success) {
      throw new Error(inquiryData.message || 'Failed to load inquiry details');
    }
    
    const inquiry = inquiryData.inquiry;
    
    // Update modal with inquiry data
    updateModalProductInfo(inquiry);
    
    // Show the modal
    const modal = document.getElementById('inquiryResponseModal');
    if (modal) {
      modal.style.display = 'block';
      modal.classList.add('active');
      
      // Add escape key listener
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          closeInquiryResponseModal();
          document.removeEventListener('keydown', handleEscape);
        }
      };
      document.addEventListener('keydown', handleEscape);
      
    } else {
      throw new Error('Response modal not found');
    }
    
  } catch (error) {
    console.error('❌ Error opening response modal:', error);
    alert('So\'rovga javob berish modalini ochishda xatolik yuz berdi. Sahifani qayta yuklang.');
  }
}

// Global function to close response modal
function closeInquiryResponseModal() {
  const modal = document.getElementById('inquiryResponseModal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('active');
  }
}

// Global function for quick quote
async function sendQuickQuote(inquiryId) {
  try {
    // Get inquiry details first
    const inquiryResponse = await fetch(`/manufacturer/inquiries/api/${inquiryId}`, {
      method: 'GET',
      credentials: 'include'
    });
    
    if (!inquiryResponse.ok) {
      throw new Error(`Failed to fetch inquiry details: ${inquiryResponse.status}`);
    }
    
    const inquiryData = await inquiryResponse.json();
    if (!inquiryData.success) {
      throw new Error(inquiryData.message || 'Failed to load inquiry details');
    }
    
    const inquiry = inquiryData.inquiry;
    
    // Update modal with inquiry data
    updateModalProductInfo(inquiry);
    
    // Show quick quote modal
    const modal = document.getElementById('quickQuoteModal');
    if (modal) {
      modal.style.display = 'block';
      modal.classList.add('active');
      
    } else {
      throw new Error('Quick quote modal not found');
    }
    
  } catch (error) {
    console.error('❌ Error opening quick quote modal:', error);
    alert('Tezkor taklif modalini ochishda xatolik yuz berdi. Sahifani qayta yuklang.');
  }
}

// Global function to start chat
async function startChat(inquiryId) {
  try {
    
    // Get inquiry details first
    const inquiryResponse = await fetch(`/manufacturer/inquiries/api/${inquiryId}`, {
      method: 'GET',
      credentials: 'include'
    });
    
    if (!inquiryResponse.ok) {
      throw new Error(`Failed to fetch inquiry details: ${inquiryResponse.status}`);
    }
    
    const inquiryData = await inquiryResponse.json();
    if (!inquiryData.success) {
      throw new Error(inquiryData.message || 'Failed to load inquiry details');
    }
    
    const inquiry = inquiryData.inquiry;
    
    // Redirect to messages page with inquiry context
    const inquirerId = inquiry.inquirer?._id || inquiry.inquirer?.id;
    if (inquirerId) {
      window.location.href = `/manufacturer/messages?inquiry=${inquiryId}&manufacturer=${inquirerId}`;
    } else {
      throw new Error('Inquirer information not available');
    }
    
  } catch (error) {
    console.error('❌ Error starting chat:', error);
    alert('Chat boshlashda xatolik yuz berdi. Sahifani qayta yuklang.');
  }
}