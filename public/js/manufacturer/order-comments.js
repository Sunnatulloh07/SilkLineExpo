/**
 * Order Comments Manager
 * Professional order comment system with real-time API integration
 */

class OrderCommentsManager {
    constructor() {
        this.orderId = this.getOrderIdFromUrl();
        this.currentPage = 1;
        this.totalPages = 1;
        this.loading = false;
        
        // DOM elements
        this.modal = document.getElementById('addNoteModal');
        this.form = document.getElementById('noteForm');
        this.content = document.getElementById('noteContent');
        this.charCount = document.getElementById('charCount');
        this.saveBtn = document.getElementById('saveNote');
        this.cancelBtn = document.getElementById('cancelNote');
        this.closeBtn = document.getElementById('closeNoteModal');
        
        // Initialize
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupFormValidation();
        this.loadCommentsOnPageLoad();
    }

    getOrderIdFromUrl() {
        const pathParts = window.location.pathname.split('/');
        return pathParts[pathParts.length - 1];
    }

    setupEventListeners() {
        // Modal triggers - DO NOT interfere with order-detail.js buttons
        // order-detail.js handles addNoteBtn and addFirstComment
        // This class only handles comment display and API calls

        // Modal controls
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.closeModal());
        }
        
        if (this.cancelBtn) {
            this.cancelBtn.addEventListener('click', () => this.closeModal());
        }

        // Form submission
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Character counter
        if (this.content && this.charCount) {
            this.content.addEventListener('input', () => this.updateCharCount());
        }

        // Filters
        const typeFilter = document.getElementById('filterByType');
        const priorityFilter = document.getElementById('filterByPriority');
        
        if (typeFilter) {
            typeFilter.addEventListener('change', () => this.filterComments());
        }
        
        if (priorityFilter) {
            priorityFilter.addEventListener('change', () => this.filterComments());
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshCommentsBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshComments());
        }

        // Load more button
        const loadMoreBtn = document.getElementById('loadMoreComments');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => this.loadMoreComments());
        }

        // Modal overlay click to close
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.closeModal();
                }
            });
        }

        // ESC key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
                this.closeModal();
            }
        });
    }

    setupFormValidation() {
        if (!this.content) return;

        // Real-time validation
        this.content.addEventListener('input', () => {
            this.validateForm();
        });

        // Validate other fields
        const selects = this.form.querySelectorAll('select');
        selects.forEach(select => {
            select.addEventListener('change', () => this.validateForm());
        });
    }

    validateForm() {
        const content = this.content.value.trim();
        const isValid = content.length > 0 && content.length <= 2000;
        
        if (this.saveBtn) {
            this.saveBtn.disabled = !isValid;
        }

        // Update character count
        this.updateCharCount();

        return isValid;
    }

    updateCharCount() {
        if (!this.content || !this.charCount) return;
        
        const count = this.content.value.length;
        this.charCount.textContent = count;
        
        // Visual feedback
        if (count > 1800) {
            this.charCount.style.color = '#ef4444';
        } else if (count > 1500) {
            this.charCount.style.color = '#f59e0b';
        } else {
            this.charCount.style.color = '#64748b';
        }
    }

    openModal() {
        // This method is deprecated - order-detail.js handles modal opening
        // But we can still reset the form if needed
        this.resetForm();
    }

    closeModal() {
        // This handles closing from within comment-specific actions
        const modal = document.getElementById('addNoteModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
        
        this.resetForm();
    }

    resetForm() {
        if (!this.form) return;
        
        this.form.reset();
        this.updateCharCount();
        this.hideLoading();
        
        if (this.saveBtn) {
            this.saveBtn.disabled = true;
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        if (!this.validateForm()) {
            this.showError(window.t?.('manufacturer.orders.detail.javascript.form_validation_error') || 'Iltimos, barcha majburiy maydonlarni to\'ldiring');
            return;
        }

        const formData = new FormData(this.form);
        const commentData = {
            content: formData.get('noteContent') || this.content.value.trim(),
            type: document.getElementById('commentType')?.value || 'general',
            visibility: document.getElementById('commentVisibility')?.value || 'public',
            priority: document.getElementById('commentPriority')?.value || 'normal'
        };

        try {
            this.showLoading();
            
            const response = await fetch(`/api/order-comments/orders/${this.orderId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(commentData)
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess(window.t?.('manufacturer.orders.detail.javascript.note_save_success') || 'Izoh muvaffaqiyatli qo\'shildi');
                this.closeModal();
                this.refreshComments();
                
                // Show comments section if hidden
                this.showCommentsSection();
            } else {
                throw new Error(result.message || window.t?.('manufacturer.orders.detail.javascript.comment_add_error') || 'Izoh qo\'shishda xatolik yuz berdi');
            }

        } catch (error) {
            console.error('Error submitting comment:', error);
            this.showError(error.message || window.t?.('manufacturer.orders.detail.javascript.comment_add_error') || 'Izoh qo\'shishda xatolik yuz berdi');
        } finally {
            this.hideLoading();
        }
    }

    async loadCommentsOnPageLoad() {
        // Check if we should load comments initially
        const commentsSection = document.getElementById('orderCommentsSection');
        if (commentsSection) {
            await this.loadComments();
        }
    }

    async loadComments(page = 1) {
        if (this.loading) return;
        
        try {
            this.loading = true;
            this.showCommentsLoading();

            const url = new URL(`/api/order-comments/orders/${this.orderId}/comments`, window.location.origin);
            url.searchParams.set('page', page);
            url.searchParams.set('limit', 10);
            url.searchParams.set('includeReplies', 'true');

            // Add filters
            const typeFilter = document.getElementById('filterByType')?.value;
            const priorityFilter = document.getElementById('filterByPriority')?.value;
            
            if (typeFilter) url.searchParams.set('type', typeFilter);
            if (priorityFilter) url.searchParams.set('priority', priorityFilter);

            const response = await fetch(url, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'include'
            });

            const result = await response.json();

           if (result.success) {
                if (page === 1) {
                    this.displayComments(result.data.comments);
                } else {
                    this.appendComments(result.data.comments);
                }
                
                this.updatePagination(result.data.pagination);
                
                // Fix: Use correct statistics path
                const totalComments = result.data.statistics?.totalComments || result.data.pagination?.total || 0;
                this.updateCommentsCount(totalComments);
                
                // Show/hide comments section
                if (result.data.comments.length > 0) {
                    this.showCommentsSection();
                } else if (page === 1) {
                    this.showEmptyState();
                }
            } else {
                throw new Error(result.message || window.t?.('manufacturer.orders.detail.javascript.comment_load_error') || 'Izohlarni yuklashda xatolik');
            }

        } catch (error) {
            this.showError(window.t?.('manufacturer.orders.detail.javascript.comment_load_error') || 'Izohlarni yuklashda xatolik yuz berdi');
        } finally {
            this.loading = false;
            this.hideCommentsLoading();
        }
    }

    async refreshComments() {
        // Reset pagination and reload comments
        this.currentPage = 1;
        await this.loadComments(1);
    }

    displayComments(comments) {
        const commentsList = document.getElementById('commentsList');
        if (!commentsList) return;

        // Clear existing comments
        const existingComments = commentsList.querySelectorAll('.comment-item');
        existingComments.forEach(item => item.remove());

        // Add new comments
        comments.forEach(comment => {
            const commentElement = this.createCommentElement(comment);
            commentsList.appendChild(commentElement);
        });
    }

    appendComments(comments) {
        const commentsList = document.getElementById('commentsList');
        if (!commentsList) return;

        comments.forEach(comment => {
            const commentElement = this.createCommentElement(comment);
            commentsList.appendChild(commentElement);
        });
    }

    createCommentElement(comment) {
        const div = document.createElement('div');
        div.className = 'comment-item';
        div.setAttribute('data-comment-id', comment._id);
        div.dataset.commentId = comment._id;

        const typeLabels = {
            general: 'Umumiy',
            status_update: 'Holat yangilanishi',
            quality_note: 'Sifat haqida',
            delivery_note: 'Yetkazib berish',
            payment_note: 'To\'lov haqida',
            internal_note: 'Ichki izoh',
            customer_note: 'Mijoz uchun'
        };

        const priorityClasses = {
            low: 'priority-low',
            normal: 'priority-normal',
            high: 'priority-high',
            urgent: 'priority-urgent'
        };

        const visibilityIcons = {
            public: 'fas fa-globe',
            internal: 'fas fa-users',
            customer: 'fas fa-user',
            admin: 'fas fa-shield-alt'
        };

        div.innerHTML = `
            <div class="comment-header">
                <div class="comment-author">
                    ${comment.author?.companyLogo?.url ? 
                        `<img src="${comment.author.companyLogo.url}" alt="${comment.author?.companyName || 'Company Logo'}" class="author-avatar author-logo">` :
                        `<div class="author-avatar author-initial">${(comment.author?.companyName || comment.author?.name || 'U').charAt(0).toUpperCase()}</div>`
                    }
                    <div class="author-info">
                        <span class="author-name">${this.escapeHtml(comment.author?.name || comment.author?.companyName || 'Unknown')}</span>
                        <span class="comment-time">${this.formatDate(comment.createdAt)}</span>
                    </div>
                </div>
                <div class="comment-badges">
                    <span class="comment-type-badge ${comment.type}">${typeLabels[comment.type] || comment.type}</span>
                    <span class="comment-priority-badge ${priorityClasses[comment.priority]}">${comment.priority}</span>
                    <i class="${visibilityIcons[comment.visibility]} comment-visibility-icon" title="${comment.visibility}"></i>
                </div>
            </div>
            <div class="comment-content">
                <p>${this.escapeHtml(comment.content).replace(/\n/g, '<br>')}</p>
            </div>
            ${comment.replies && comment.replies.length > 0 ? `
                <div class="comment-replies">
                    ${comment.replies.map(reply => this.createReplyHtml(reply)).join('')}
                </div>
            ` : ''}
            <div class="comment-actions">
                <button class="comment-action-btn" onclick="orderComments.replyToComment('${comment._id}')">
                    <i class="fas fa-reply"></i> Javob berish
                </button>
                ${this.canEditComment(comment) ? `
                    <button class="comment-action-btn" onclick="orderComments.editComment('${comment._id}')">
                        <i class="fas fa-edit"></i> Tahrirlash
                    </button>
                ` : ''}
                ${this.canDeleteComment(comment) ? `
                    <button class="comment-action-btn text-danger" onclick="orderComments.deleteComment('${comment._id}')">
                        <i class="fas fa-trash"></i> O'chirish
                    </button>
                ` : ''}
            </div>
        `;

        return div;
    }

    createReplyHtml(reply) {
        return `
            <div class="comment-reply" data-reply-id="${reply._id}">
                <div class="reply-author">
                    ${reply.author?.companyLogo?.url ? 
                        `<img src="${reply.author.companyLogo.url}" alt="${reply.author?.companyName || 'Company Logo'}" class="reply-avatar reply-logo">` :
                        `<div class="reply-avatar reply-initial">${(reply.author?.companyName || reply.author?.name || 'U').charAt(0).toUpperCase()}</div>`
                    }
                    <div class="reply-author-info">
                        <span class="author-name">${this.escapeHtml(reply.author?.name || reply.author?.companyName || 'Unknown')}</span>
                        <span class="reply-time">${this.formatDate(reply.createdAt)}</span>
                    </div>
                </div>
                <div class="reply-content">
                    <p>${this.escapeHtml(reply.content).replace(/\n/g, '<br>')}</p>
                </div>
            </div>
        `;
    }

    canEditComment(comment) {
        // Professional permission check - only allow editing own comments
        const currentUser = window.currentUser || {};
        const authorId = comment.author?._id || comment.author?.id;
        const currentUserId = currentUser.userId || currentUser._id;
        
        // Admin can edit all comments regardless of time
        if (currentUser.userType === 'admin') return true;
        
        // Check if user is the author
        const isAuthor = authorId && currentUserId && (authorId === currentUserId);
        if (!isAuthor) return false;
        
        // For non-admin authors: check time restriction (24 hours)
        if (comment.createdAt) {
            const commentDate = new Date(comment.createdAt);
            const now = new Date();
            const hoursSinceCreated = (now - commentDate) / (1000 * 60 * 60);
            
            // Only allow editing within 24 hours for non-admin users
            return hoursSinceCreated <= 24;
        }
        
        // If no creation date available, allow edit (fallback)
        return true;
    }

    canDeleteComment(comment) {
        // Professional permission check - only allow deleting own comments or admin
        const currentUser = window.currentUser || {};
        const authorId = comment.author?._id || comment.author?.id;
        const currentUserId = currentUser.userId || currentUser._id;
        
        // Admin can delete all, user can only delete their own
        if (currentUser.userType === 'admin') return true;
        if (authorId && currentUserId && authorId === currentUserId) return true;
        
        return false;
    }

    // Old editComment method removed - using the improved async version below

    /**
     * Delete comment with confirmation
     */
    deleteComment(commentId) {
        // Use OrderDetailManager's delete method if available
        if (window.orderDetailManager && window.orderDetailManager.deleteComment) {
            window.orderDetailManager.deleteComment(commentId);
        } else {
            // Fallback to direct delete method
            this.directDeleteComment(commentId);
        }
    }

    /**
     * Direct delete method as fallback
     */
    async directDeleteComment(commentId) {
        if (!confirm('Izohni o\'chirishga ishonchingiz komilmi?')) {
            return;
        }

        try {
            const response = await fetch(`/api/order-comments/${commentId}`, {
                method: 'DELETE',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'include'
            });

            const result = await response.json();

            if (result.success) {
                window.showToast(window.t?.('manufacturer.orders.detail.javascript.note_delete_success') || 'Izoh muvaffaqiyatli o\'chirildi', 'success');
                // Refresh comments
                this.loadComments();
            } else {
                window.showToast(result.message || window.t?.('manufacturer.orders.detail.javascript.note_delete_error') || 'Izohni o\'chirishda xatolik', 'error');
            }
        } catch (error) {
            console.error('❌ Error deleting comment:', error);
            window.showToast(window.t?.('manufacturer.orders.detail.javascript.network_error') || 'Tarmoq xatoligi', 'error');
        }
    }

    /**
     * Fetch comment data for editing
     */
    async fetchCommentData(commentId) {
        try {
            // Validate commentId
            if (!commentId || typeof commentId !== 'string') {
                throw new Error('Invalid comment ID');
            }

            // First try to find in current comments list
            const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
            if (commentElement) {
                // Extract data from DOM (if available)
                const content = commentElement.querySelector('.comment-content p')?.textContent?.trim();
                const typeBadge = commentElement.querySelector('.comment-type-badge');
                const priorityBadge = commentElement.querySelector('.comment-priority-badge');
                const visibilityIcon = commentElement.querySelector('.comment-visibility-icon');
                
                if (content && content.length > 0) {
                    const extractedData = {
                        _id: commentId,
                        content: content,
                        type: typeBadge?.classList[1] || 'general',
                        priority: priorityBadge?.classList[1]?.replace('priority-', '') || 'normal',
                        visibility: this.extractVisibilityFromIcon(visibilityIcon) || 'public'
                    };
                    return extractedData;
                }
            }
            
            // Fallback: Fetch from API
            const response = await fetch(`/api/order-comments/${commentId}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Comment not found');
                } else if (response.status === 403) {
                    throw new Error('Access denied to this comment');
                } else {
                    throw new Error(`Server error: ${response.status}`);
                }
            }
            
            const data = await response.json();
            
            if (data.success && data.data && data.data.comment) {
                return data.data.comment;
            } else {
                throw new Error(data.message || 'Invalid response format');
            }
            
        } catch (error) {
            // Show user-friendly error message
            if (error.message.includes('not found')) {
                window.showToast(window.t?.('manufacturer.orders.detail.javascript.comment_not_found') || 'Izoh topilmadi', 'error');
            } else if (error.message.includes('Access denied')) {
                window.showToast(window.t?.('manufacturer.orders.detail.javascript.comment_access_error') || 'Bu izohga ruxsat yo\'q', 'error');
            } else {
                window.showToast(window.t?.('manufacturer.orders.detail.javascript.comment_get_error') || 'Izoh ma\'lumotlarini olishda xatolik', 'error');
            }
            
            return null;
        }
    }

    /**
     * Extract visibility from icon classes
     */
    extractVisibilityFromIcon(iconElement) {
        if (!iconElement) return 'public';
        
        const classes = iconElement.className;
        if (classes.includes('fa-lock')) return 'private';
        if (classes.includes('fa-eye-slash')) return 'internal';
        if (classes.includes('fa-shield')) return 'admin';
        return 'public';
    }

    updatePagination(pagination) {
        this.currentPage = pagination.page;
        this.totalPages = pagination.pages;

        const loadMoreBtn = document.getElementById('loadMoreComments');
        const paginationDiv = document.getElementById('commentsPagination');

        if (loadMoreBtn && paginationDiv) {
            if (this.currentPage < this.totalPages) {
                paginationDiv.classList.remove('hidden');
                loadMoreBtn.textContent = `Ko'proq yuklash (${pagination.total - (pagination.page * pagination.limit)} qoldi)`;
            } else {
                paginationDiv.classList.add('hidden');
            }
        }
    }

    updateCommentsCount(count) {
        const commentsCount = document.getElementById('commentsCount');
        if (commentsCount) {
            commentsCount.textContent = `(${count})`;
        }
    }

    showCommentsSection() {
        const section = document.getElementById('orderCommentsSection');
        if (section) {
            section.classList.remove('hidden');
        }
        
        const emptyState = document.getElementById('commentsEmpty');
        if (emptyState) {
            emptyState.classList.add('hidden');
        }
    }

    showEmptyState() {
        const emptyState = document.getElementById('commentsEmpty');
        if (emptyState) {
            emptyState.classList.remove('hidden');
        }
    }

    showCommentsLoading() {
        const loading = document.getElementById('commentsLoading');
        if (loading) {
            loading.classList.remove('hidden');
        }
    }

    hideCommentsLoading() {
        const loading = document.getElementById('commentsLoading');
        if (loading) {
            loading.classList.add('hidden');
        }
    }

    showLoading() {
        if (this.saveBtn) {
            const btnText = this.saveBtn.querySelector('.btn-text');
            const btnLoading = this.saveBtn.querySelector('.btn-loading');
            
            if (btnText) btnText.classList.add('hidden');
            if (btnLoading) btnLoading.classList.remove('hidden');
            
            this.saveBtn.disabled = true;
        }
    }

    hideLoading() {
        if (this.saveBtn) {
            const btnText = this.saveBtn.querySelector('.btn-text');
            const btnLoading = this.saveBtn.querySelector('.btn-loading');
            
            if (btnText) btnText.classList.remove('hidden');
            if (btnLoading) btnLoading.classList.add('hidden');
            
            this.saveBtn.disabled = false;
        }
    }


    async loadMoreComments() {
        if (this.currentPage < this.totalPages) {
            await this.loadComments(this.currentPage + 1);
        }
    }

    async filterComments() {
        this.currentPage = 1;
        await this.loadComments(1);
    }

    // Utility methods
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatDate(dateString) {
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
        
        return date.toLocaleDateString('uz-UZ');
    }

    showSuccess(message) {
        // Use existing toast system
        if (window.showToast) {
            window.showToast(message, 'success');
        } else {
            alert(message);
        }
    }

    showError(message) {
        // Use existing toast system
        if (window.showToast) {
            window.showToast(message, 'error');
        } else {
            alert(message);
        }
    }

    // Public methods for external calls
    async replyToComment(commentId) {
        // Implementation for reply functionality
    }

    async editComment(commentId) {
          // Find comment data
        const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
        
        if (!commentElement) {
            window.showToast(window.t?.('manufacturer.orders.detail.javascript.comment_not_found') || 'Izoh topilmadi', 'error');
            return;
        }
        
        try {
            const commentData = await this.fetchCommentData(commentId);
            
            if (commentData) {
                // Use OrderDetailManager's edit modal
                if (window.orderDetailManager && window.orderDetailManager.openEditCommentModal) {
                    window.orderDetailManager.openEditCommentModal(commentId, commentData);
                } else {
                    this.openFallbackEditModal(commentId, commentData);
                }
            } else {
                window.showToast(window.t?.('manufacturer.orders.detail.javascript.comment_data_not_retrieved') || 'Izoh ma\'lumotlari olinmadi', 'error');
            }
        } catch (error) {
            console.error('❌ Error in editComment:', error);
            window.showToast(window.t?.('manufacturer.orders.detail.javascript.comment_edit_error') || 'Izohni tahrirlashda xatolik', 'error');
        }
    }

    /**
     * Fallback edit modal if OrderDetailManager not available
     */
    openFallbackEditModal(commentId, commentData) {
        
        // Try to find and use the existing modal
        const modal = document.getElementById('addNoteModal');
        if (modal) {
            // Update modal for edit mode
            const modalTitle = document.getElementById('noteModalTitleText');
            const editingField = document.getElementById('editingCommentId');
            
            if (modalTitle) modalTitle.textContent = 'Izohni Tahrirlash';
            if (editingField) editingField.value = commentId;
            
            // Fill form
            this.fillModalForm(commentData);
            
            // Show modal
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
        } else {
            window.showToast('Tahrirlash modal topilmadi', 'error');
        }
    }

    /**
     * Fill modal form with comment data
     */
    fillModalForm(commentData) {
        
        const noteContent = document.getElementById('noteContent');
        const commentType = document.getElementById('commentType');
        const commentVisibility = document.getElementById('commentVisibility');
        const commentPriority = document.getElementById('commentPriority');
        const notifyCustomer = document.getElementById('notifyCustomer');
        
        if (noteContent) noteContent.value = commentData.content || '';
        if (commentType) commentType.value = commentData.type || 'general';
        if (commentVisibility) commentVisibility.value = commentData.visibility || 'public';
        if (commentPriority) commentPriority.value = commentData.priority || 'normal';
        
        // For edit mode, notification checkbox should be unchecked by default
        // User can decide to notify customer about the update
        if (notifyCustomer) {
            notifyCustomer.checked = false;
        }
        
        // Update character count if available
        const charCount = document.getElementById('charCount');
        if (charCount && noteContent) {
            charCount.textContent = noteContent.value.length;
        }
        
        // Setup checkbox handlers for edit mode
        this.setupEditModeCheckboxHandlers();
    }

    /**
     * Setup checkbox handlers for edit mode
     */
    setupEditModeCheckboxHandlers() {
        const notifyCheckbox = document.getElementById('notifyCustomer');
        if (notifyCheckbox) {
            // Remove existing listeners to prevent duplicates
            notifyCheckbox.removeEventListener('change', this.handleEditModeCheckboxChange);
            
            // Add event listener for edit mode
            this.handleEditModeCheckboxChange = (e) => {
                // You can add additional logic here if needed
            };
            
            notifyCheckbox.addEventListener('change', this.handleEditModeCheckboxChange);
        }
    }

    // Duplicate deleteComment method removed - using the one above with proper delegation
}

// Initialize when DOM is ready - ONLY on manufacturer order detail pages
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on a manufacturer order detail page
    const isManufacturerOrderPage = window.location.pathname.includes('/manufacturer/orders/') && 
                                   document.getElementById('addNoteModal');
    
    // Only initialize if on correct page and required elements exist
    if (isManufacturerOrderPage) {
        window.orderComments = new OrderCommentsManager();
    }
});
