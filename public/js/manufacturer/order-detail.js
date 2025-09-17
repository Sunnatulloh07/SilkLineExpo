/**
 * Professional Order Detail Management JavaScript
 * Senior Software Engineer Level Implementation
 * B2B Marketplace Integration Standards
 */

class OrderDetailManager {
    constructor() {
        this.orderId = this.getOrderIdFromUrl();
        this.originalOrderData = window.orderData || {};
        this.hasUnsavedChanges = false;
        this.editingCommentId = null;  // Track editing state
        this.editingCommentData = null;  // Store original comment data
        
        this.init();
    }

    init() {
        // Make this instance globally available for inter-component communication
        window.orderDetailManager = this;
        
        // Disable animation conflicts immediately
        this.disableConflictingAnimations();
        
        this.setupEventListeners();
        this.initializeModals();
        this.setupBeforeUnloadWarning();
        
        // Double-check after DOM is ready
        setTimeout(() => this.disableConflictingAnimations(), 100);
    }

    getOrderIdFromUrl() {
        const pathParts = window.location.pathname.split('/');
        return pathParts[pathParts.length - 1];
    }

    setupEventListeners() {
        // Status management
        document.getElementById('updateStatusBtn')?.addEventListener('click', () => this.updateOrderStatus());
        document.getElementById('orderStatusSelect')?.addEventListener('change', () => this.markAsChanged());

        // Communication - multiple buttons
        document.getElementById('contactCustomerBtn')?.addEventListener('click', () => this.openCommunicationModal());
        document.getElementById('contactCustomerBtn2')?.addEventListener('click', () => this.openCommunicationModal());
        document.getElementById('sendMessage')?.addEventListener('click', () => this.sendCustomerMessage());
        document.getElementById('cancelCommunication')?.addEventListener('click', () => this.closeCommunicationModal());
        document.getElementById('closeCommunicationModal')?.addEventListener('click', () => this.closeCommunicationModal());

        // Notes - multiple buttons
        document.getElementById('addNoteBtn')?.addEventListener('click', () => this.openNoteModal());
        document.getElementById('addFirstComment')?.addEventListener('click', () => this.openNoteModal());
        document.getElementById('saveNote')?.addEventListener('click', () => this.saveOrderNote());
        document.getElementById('cancelNote')?.addEventListener('click', () => this.closeNoteModal());
        document.getElementById('closeNoteModal')?.addEventListener('click', () => this.closeNoteModal());
        
        // Character count for note content
        document.getElementById('noteContent')?.addEventListener('input', (e) => {
            const charCount = document.getElementById('charCount');
            if (charCount) {
                charCount.textContent = e.target.value.length;
            }
        });

        // Checkbox interaction handlers
        this.setupCheckboxHandlers();

        // Advanced Modal Event Listeners (Product Page Pattern)
        this.setupAdvancedModalListeners();

        // Order actions - multiple buttons
        document.getElementById('printOrderBtn')?.addEventListener('click', () => this.printOrder());
        document.getElementById('printOrderBtn2')?.addEventListener('click', () => this.printOrder());
        document.getElementById('duplicateOrderBtn')?.addEventListener('click', () => this.duplicateOrder());
        document.getElementById('duplicateOrderBtn2')?.addEventListener('click', () => this.duplicateOrder());
        
        // Additional quick actions
        document.getElementById('exportOrderBtn')?.addEventListener('click', () => this.exportOrder());
        document.getElementById('shareOrderBtn')?.addEventListener('click', () => this.shareOrder());
        document.getElementById('sendEmailBtn')?.addEventListener('click', () => {
            const customer = window.orderData?.buyer;
            const mailto = `mailto:${customer?.email || ''}?subject=Buyurtma #${this.orderId} haqida`;
            window.open(mailto);
        });
        


        // Modal close on overlay click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeAllModals();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    setupBeforeUnloadWarning() {
        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = window.t?.('manufacturer.orders.detail.javascript.unsaved_changes') || 'Saqlenmagan o\'zgarishlar mavjud. Sahifani tark etishga ishonchingiz komilmi?';
            }
        });
    }

    markAsChanged() {
        this.hasUnsavedChanges = true;
        this.showUnsavedChangesIndicator();
    }

    markAsSaved() {
        this.hasUnsavedChanges = false;
        this.hideUnsavedChangesIndicator();
    }

    showUnsavedChangesIndicator() {
        // Add visual indicator for unsaved changes
        document.body.classList.add('has-unsaved-changes');
    }

    hideUnsavedChangesIndicator() {
        document.body.classList.remove('has-unsaved-changes');
    }


    // Preview status change
    previewStatusChange(newStatus) {
        const statusMap = {
            'pending': { text: '📋 ' + (window.t?.('manufacturer.orders.detail.timeline.status_labels.pending') || 'Kutayotgan'), color: '#f59e0b' },
            'confirmed': { text: '✅ ' + (window.t?.('manufacturer.orders.detail.timeline.status_labels.confirmed') || 'Tasdiqlangan'), color: '#22c55e' },
            'processing': { text: '⚙️ ' + (window.t?.('manufacturer.orders.detail.timeline.status_labels.processing') || 'Jarayonda'), color: '#3b82f6' },
            'manufacturing': { text: '🏭 ' + (window.t?.('manufacturer.orders.detail.timeline.status_labels.manufacturing') || 'Ishlab chiqarilmoqda'), color: '#a855f7' },
            'quality_check': { text: '🔍 ' + (window.t?.('manufacturer.orders.detail.timeline.status_labels.quality_check') || 'Sifat nazorati'), color: '#06b6d4' },
            'ready_to_ship': { text: '📦 ' + (window.t?.('manufacturer.orders.detail.timeline.status_labels.ready_to_ship') || 'Yuborishga tayyor'), color: '#10b981' },
            'shipped': { text: '🚚 ' + (window.t?.('manufacturer.orders.detail.timeline.status_labels.shipped') || 'Yo\'lda'), color: '#f97316' },
            'out_for_delivery': { text: '🏃‍♂️ ' + (window.t?.('manufacturer.orders.detail.timeline.status_labels.out_for_delivery') || 'Yetkazib berishda'), color: '#8b5cf6' },
            'delivered': { text: '🏆 ' + (window.t?.('manufacturer.orders.detail.timeline.status_labels.delivered') || 'Yetkazildi'), color: '#16a34a' },
            'completed': { text: '💯 ' + (window.t?.('manufacturer.orders.detail.timeline.status_labels.completed') || 'Yakunlandi'), color: '#15803d' },
            'cancelled': { text: '❌ ' + (window.t?.('manufacturer.orders.detail.timeline.status_labels.cancelled') || 'Bekor qilindi'), color: '#ef4444' }
        };

        const status = statusMap[newStatus];
        if (status) {
            const currentStatusBadge = document.querySelector('.current-status-display .status-badge');
            if (currentStatusBadge) {
                currentStatusBadge.textContent = status.text;
                currentStatusBadge.style.backgroundColor = status.color + '20';
                currentStatusBadge.style.color = status.color;
                currentStatusBadge.style.borderColor = status.color + '40';
            }
        }
    }

    /**
     * Setup Advanced Modal Listeners (Product Page Pattern)
     */
    setupAdvancedModalListeners() {
        const modal = document.getElementById('addNoteModal');
        if (!modal) return;

        // Close modal on overlay click (Product Page Pattern)
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeNoteModal();
                console.log('✅ Modal closed via overlay click');
            }
        });

        // Close modal on Escape key (Product Page Pattern)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                this.closeNoteModal();
                console.log('✅ Modal closed via Escape key');
            }
        });
    }

    setupAdvancedModalListeners() {
        // Overlay click to close modals
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeAllModals();
                console.log('✅ Modal closed via overlay click');
            }
        });

        // Escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const activeModal = document.querySelector('.modal-overlay.active');
                if (activeModal) {
                    this.closeAllModals();
                    console.log('✅ Modal closed via Escape key');
                }
            }
        });
    }

    // Get status text with emoji
    getStatusText(status) {
        const statusMap = {
            'pending': '📋 ' + (window.t?.('manufacturer.orders.detail.timeline.status_labels.pending') || 'Kutayotgan'),
            'confirmed': '✅ ' + (window.t?.('manufacturer.orders.detail.timeline.status_labels.confirmed') || 'Tasdiqlangan'), 
            'processing': '⚙️ ' + (window.t?.('manufacturer.orders.detail.timeline.status_labels.processing') || 'Jarayonda'),
            'manufacturing': '🏭 ' + (window.t?.('manufacturer.orders.detail.timeline.status_labels.manufacturing') || 'Ishlab chiqarilmoqda'),
            'quality_check': '🔍 ' + (window.t?.('manufacturer.orders.detail.timeline.status_labels.quality_check') || 'Sifat nazorati'),
            'ready_to_ship': '📦 ' + (window.t?.('manufacturer.orders.detail.timeline.status_labels.ready_to_ship') || 'Yuborishga tayyor'),
            'shipped': '🚚 ' + (window.t?.('manufacturer.orders.detail.timeline.status_labels.shipped') || 'Yo\'lda'),
            'out_for_delivery': '🏃‍♂️ ' + (window.t?.('manufacturer.orders.detail.timeline.status_labels.out_for_delivery') || 'Yetkazib berishda'),
            'delivered': '🏆 ' + (window.t?.('manufacturer.orders.detail.timeline.status_labels.delivered') || 'Yetkazildi'),
            'completed': '💯 ' + (window.t?.('manufacturer.orders.detail.timeline.status_labels.completed') || 'Yakunlandi'),
            'cancelled': '❌ ' + (window.t?.('manufacturer.orders.detail.timeline.status_labels.cancelled') || 'Bekor qilindi')
        };
        return statusMap[status] || '❓ ' + (window.t?.('manufacturer.orders.detail.timeline.status_labels.unknown') || 'Noma\'lum');
    }

    // ENSURE NO ANIMATION INTERFERENCE
    disableConflictingAnimations() {
        const elementsToStabilize = [
            '.order-detail-content',
            '.order-main-grid',
            '.info-card',
            '.order-items-section',
            '.status-history-section',
            '.notes-section'
        ];

        elementsToStabilize.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (el) {
                    el.style.animation = 'none';
                    el.style.opacity = '1';
                    el.style.visibility = 'visible';
                    el.style.transform = 'none';
                }
            });
        });
    }





    async updateOrderStatus() {
        const statusSelect = document.getElementById('orderStatusSelect');
        if (!statusSelect) return;

        const newStatus = statusSelect.value;
        const currentStatus = statusSelect.dataset.currentStatus || statusSelect.querySelector('option[selected]')?.value;

        if (newStatus === currentStatus) {
            window.showToast('Holat o\'zgartirilmadi', 'info');
            return;
        }

        try {
            this.showLoading('status-update');

            const response = await fetch(`/api/manufacturer/orders/${this.orderId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            const data = await response.json();

            if (data.success) {
                statusSelect.dataset.currentStatus = newStatus;
                this.updateStatusBadges(newStatus);
                this.markAsSaved();
                window.showToast('Buyurtma holati muvaffaqiyatli yangilandi', 'success');
                console.log('✅ Order status updated successfully');
            } else {
                throw new Error(data.message || 'Failed to update status');
            }
        } catch (error) {
            console.error('❌ Error updating order status:', error);
            window.showToast(window.t?.('manufacturer.orders.detail.javascript.status_update_error') || 'Buyurtma holatini yangilashda xatolik', 'error');
            // Revert select value
            statusSelect.value = currentStatus;
        } finally {
            this.hideLoading('status-update');
        }
    }

    updateStatusBadges(newStatus) {
        document.querySelectorAll('.status-badge').forEach(badge => {
            badge.className = `status-badge status-${newStatus}`;
            badge.textContent = this.getStatusDisplayName(newStatus);
        });
    }

    getStatusDisplayName(status) {
        const statusMap = {
            'pending': window.t?.('manufacturer.orders.detail.timeline.status_labels.pending') || 'Kutayotgan',
            'confirmed': window.t?.('manufacturer.orders.detail.timeline.status_labels.confirmed') || 'Tasdiqlangan',
            'processing': window.t?.('manufacturer.orders.detail.timeline.status_labels.processing') || 'Jarayonda',
            'manufacturing': window.t?.('manufacturer.orders.detail.timeline.status_labels.manufacturing') || 'Ishlab chiqarilmoqda',
            'ready_to_ship': window.t?.('manufacturer.orders.detail.timeline.status_labels.ready_to_ship') || 'Jo\'natishga tayyor',
            'shipped': window.t?.('manufacturer.orders.detail.timeline.status_labels.shipped') || 'Jo\'natilgan',
            'delivered': window.t?.('manufacturer.orders.detail.timeline.status_labels.delivered') || 'Yetkazilgan',
            'completed': window.t?.('manufacturer.orders.detail.timeline.status_labels.completed') || 'Yakunlangan',
            'cancelled': window.t?.('manufacturer.orders.detail.timeline.status_labels.cancelled') || 'Bekor qilingan'
        };
        return statusMap[status] || window.t?.('manufacturer.orders.detail.timeline.status_labels.unknown') || 'Noma\'lum';
    }










    closeNoteModal() {
        const modal = document.getElementById('addNoteModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = ''; // Restore body scroll
            this.clearNoteForm();
            
            console.log('✅ Note modal closed');
        }
    }



    async saveOrderNote() {
        // Get form data from enhanced comment form
        const content = document.getElementById('noteContent')?.value?.trim();
        const type = document.getElementById('commentType')?.value || 'general';
        const visibility = document.getElementById('commentVisibility')?.value || 'public';
        const priority = document.getElementById('commentPriority')?.value || 'normal';
        const notifyCustomer = document.getElementById('notifyCustomer')?.checked || false;

        if (!content) {
            window.showToast('Izoh matnini kiriting', 'warning');
            return;
        }

        try {
            this.showLoading('save-note');

            // Use the correct order comments API endpoint
            const response = await fetch(`/api/order-comments/orders/${this.orderId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include', // Include JWT cookies
                body: JSON.stringify({ 
                    content: content,
                    type: type,
                    visibility: visibility,
                    priority: priority,
                    notifyCustomer: notifyCustomer
                })
            });

            const data = await response.json();

            if (data.success) {
                this.closeNoteModal();
                this.clearNoteForm();
                window.showToast(window.t?.('manufacturer.orders.detail.javascript.note_save_success') || 'Izoh muvaffaqiyatli qo\'shildi', 'success');
                
                // Refresh comments instead of full page reload
                if (window.orderComments && window.orderComments.refreshComments) {
                    window.orderComments.refreshComments();
                } else {
                    // Fallback to page reload if comments manager not available
                    setTimeout(() => location.reload(), 1000);
                }
            } else {
                throw new Error(data.message || window.t?.('manufacturer.orders.detail.javascript.note_save_error') || 'Izohni saqlashda xatolik');
            }
        } catch (error) {
            console.error('❌ Error saving note:', error);
            window.showToast(window.t?.('manufacturer.orders.detail.javascript.note_save_error') || 'Izoh saqlashda xatolik', 'error');
        } finally {
            this.hideLoading('save-note');
        }
    }

    closeAllModals() {
        this.closeCommunicationModal();
        this.closeNoteModal();
    }

    // Order Actions
    printOrder() {
        window.print();
    }

    async duplicateOrder() {
        if (!confirm('Ushbu buyurtmani nusxalashga ishonchingiz komilmi?')) {
            return;
        }

        try {
            this.showLoading('duplicate-order');

            const response = await fetch(`/api/manufacturer/orders/${this.orderId}/duplicate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                window.showToast('Buyurtma nusxalandi', 'success');
                // Redirect to new order
                window.location.href = `/manufacturer/orders/${data.newOrderId}`;
            } else {
                throw new Error(data.message || 'Failed to duplicate order');
            }
        } catch (error) {
            console.error('❌ Error duplicating order:', error);
            window.showToast(window.t?.('manufacturer.orders.detail.javascript.duplicate_error') || 'Buyurtmani nusxalashda xatolik', 'error');
        } finally {
            this.hideLoading('duplicate-order');
        }
    }

    // Keyboard Shortcuts
    handleKeyboardShortcuts(event) {
        // Ctrl+S to save changes
        if (event.ctrlKey && event.key === 's') {
            event.preventDefault();
            if (this.hasUnsavedChanges) {
                this.updateOrderStatus();
            }
        }

        // Ctrl+P to print
        if (event.ctrlKey && event.key === 'p') {
            event.preventDefault();
            this.printOrder();
        }

        // Escape to close modals
        if (event.key === 'Escape') {
            this.closeAllModals();
        }
    }

    // Utility Functions
    initializeModals() {
        // Set up modal animations and accessibility
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-modal', 'true');
        });
    }

    // Loading methods moved to bottom of class for consistency

    showToast(message, type = 'info') {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${this.getToastIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add to container
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        container.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.remove();
        }, 5000);

        // Manual close
        toast.querySelector('.toast-close')?.addEventListener('click', () => {
            toast.remove();
        });

        console.log(`📢 Toast: ${type} - ${message}`);
    }

    getToastIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    // COMMUNICATION METHODS
    openCommunicationModal() {
        console.log('💬 Redirecting to messaging page for order:', this.orderId);
        
        // Professional B2B messaging redirect
        window.location.href = `/manufacturer/messages/order/${this.orderId}`;
    }

    closeCommunicationModal() {
        console.log('📞 Closing communication modal...');
        const modal = document.getElementById('communicationModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            this.clearCommunicationForm();
        }
    }

    clearCommunicationForm() {
        const messageType = document.getElementById('messageType');
        const messageSubject = document.getElementById('messageSubject');
        const messageContent = document.getElementById('messageContent');
        
        if (messageType) messageType.value = 'status_update';
        if (messageSubject) messageSubject.value = '';
        if (messageContent) messageContent.value = '';
    }

    async sendCustomerMessage() {
        const messageType = document.getElementById('messageType')?.value;
        const subject = document.getElementById('messageSubject')?.value?.trim();
        const content = document.getElementById('messageContent')?.value?.trim();

        if (!subject || !content) {
            window.showToast('Mavzu va xabar matnini to\'ldiring', 'warning');
            return;
        }

        try {
            this.showLoading('send-message');

            const response = await fetch(`/api/manufacturer/orders/${this.orderId}/communication`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: messageType,
                    subject: subject,
                    content: content
                })
            });

            const data = await response.json();

            if (data.success) {
                this.closeCommunicationModal();
                window.showToast('Xabar muvaffaqiyatli yuborildi', 'success');
            } else {
                throw new Error(data.message || 'Failed to send message');
            }
        } catch (error) {
            console.error('❌ Error sending message:', error);
            window.showToast(window.t?.('manufacturer.orders.detail.javascript.message_send_error') || 'Xabar yuborishda xatolik', 'error');
        } finally {
            this.hideLoading('send-message');
        }
    }

    // ADDITIONAL ACTION METHODS
    printOrder() {
        window.print();
    }

    duplicateOrder() {
        window.showToast('Buyurtma nusxalanmoqda...', 'info');
        // TODO: Implement order duplication logic
    }

    exportOrder() {
        window.showToast('Buyurtma export qilinmoqda...', 'info');
        // TODO: Implement order export logic
    }

    shareOrder() {
        if (navigator.share) {
            navigator.share({
                title: `Buyurtma #${this.orderId}`,
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            window.showToast('Havola clipboard\'ga nusxalandi', 'success');
        }
    }


    // NOTES/COMMENTS MODAL METHODS
    openNoteModal() {
        console.log('📝 Opening note modal...');
        const modal = document.getElementById('addNoteModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Focus on content after modal is shown and setup checkbox handlers
            setTimeout(() => {
                this.setupCheckboxHandlers();
                document.getElementById('noteContent')?.focus();
            }, 100);
        } else {
            console.error('❌ Note modal not found');
            window.showToast('Izoh modal elementi topilmadi', 'error');
        }
    }

    closeNoteModal() {
        console.log('📝 Closing note modal...');
        const modal = document.getElementById('addNoteModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            this.clearNoteForm();
            this.resetModalToAddMode();
        }
    }

    clearNoteForm() {
        console.log('🧹 Clearing note form...');
        
        // Clear all form fields
        const noteContent = document.getElementById('noteContent');
        const commentType = document.getElementById('commentType');
        const commentVisibility = document.getElementById('commentVisibility');
        const commentPriority = document.getElementById('commentPriority');
        const notifyCustomer = document.getElementById('notifyCustomer');
        
        if (noteContent) noteContent.value = '';
        if (commentType) commentType.value = 'general';
        if (commentVisibility) commentVisibility.value = 'public';
        if (commentPriority) commentPriority.value = 'normal';
        if (notifyCustomer) notifyCustomer.checked = false;
        
        const charCount = document.getElementById('charCount');
        if (charCount) { 
            charCount.textContent = '0'; 
        }
    }

    async saveOrderNote() {
        const content = document.getElementById('noteContent')?.value?.trim();
        const type = document.getElementById('commentType')?.value || 'general';
        const visibility = document.getElementById('commentVisibility')?.value || 'public';
        const priority = document.getElementById('commentPriority')?.value || 'normal';
        const notifyCustomer = document.getElementById('notifyCustomer')?.checked || false;
        const editingCommentId = document.getElementById('editingCommentId')?.value;

        // Enhanced content validation
        if (!content) {
            window.showToast('Izoh matnini kiriting', 'warning');
            document.getElementById('noteContent')?.focus();
            return;
        }

        if (content.length > 2000) {
            window.showToast('Izoh matni 2000 belgidan oshmasligi kerak', 'warning');
            document.getElementById('noteContent')?.focus();
            return;
        }

        if (content.length < 5) {
            window.showToast('Izoh matni kamida 5 belgidan iborat bo\'lishi kerak', 'warning');
            document.getElementById('noteContent')?.focus();
            return;
        }

        // Determine if this is edit or create operation
        const isEditing = editingCommentId && editingCommentId.trim() !== '';
        const method = isEditing ? 'PUT' : 'POST';
        const url = isEditing 
            ? `/api/order-comments/${editingCommentId}` 
            : `/api/order-comments/orders/${this.orderId}/comments`;
        
        const successMessage = isEditing 
            ? (window.t?.('manufacturer.orders.detail.javascript.note_update_success') || 'Izoh muvaffaqiyatli yangilandi')
            : (window.t?.('manufacturer.orders.detail.javascript.note_save_success') || 'Izoh muvaffaqiyatli qo\'shildi');

        console.log(isEditing ? '✏️ Updating comment...' : '💾 Creating new comment...', {
            method,
            url,
            commentId: editingCommentId
        });

        try {
            this.showLoading('save-note');
            
            // Update loading text
            const loadingText = document.getElementById('saveLoadingText');
            if (loadingText) {
                loadingText.textContent = isEditing ? 'Yangilanmoqda...' : 'Saqlanmoqda...';
            }

            const requestData = {
                content,
                type,
                visibility,
                priority
            };

            // Include notifyCustomer for both new and edited comments
            requestData.notifyCustomer = notifyCustomer;

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(requestData)
            });

            const data = await response.json();

            if (data.success) {
                this.closeNoteModal();
                window.showToast(successMessage, 'success');
                
                // Reset modal state
                this.resetModalToAddMode();
                
                // Refresh comments if order-comments manager exists
                if (window.orderComments && window.orderComments.refreshComments) {
                    window.orderComments.refreshComments();
                } else {
                    // Fallback - reload after short delay
                    setTimeout(() => location.reload(), 1000);
                }
            } else {
                throw new Error(data.message || `Failed to ${isEditing ? 'update' : 'save'} note`);
            }
        } catch (error) {
            console.error(`❌ Error ${isEditing ? 'updating' : 'saving'} note:`, error);
            window.showToast(isEditing ? 
                (window.t?.('manufacturer.orders.detail.javascript.note_update_error') || 'Izohni yangilashda xatolik') :
                (window.t?.('manufacturer.orders.detail.javascript.note_save_error') || 'Izohni saqlashda xatolik'), 'error');
        } finally {
            this.hideLoading('save-note');
        }
    }

    // UTILITY METHODS
    showLoading(type) {
        console.log(`⏳ Showing loading for: ${type}`);
        const elements = document.querySelectorAll(`[data-loading="${type}"]`);
        elements.forEach(el => el.classList.add('loading'));
    }

    hideLoading(type) {
        console.log(`✅ Hiding loading for: ${type}`);
        const elements = document.querySelectorAll(`[data-loading="${type}"]`);
        elements.forEach(el => el.classList.remove('loading'));
    }

    closeAllModals() {
        document.querySelectorAll('.modal-overlay.active').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = '';
    }

    handleKeyboardShortcuts(e) {
        // Escape key - close modals
        if (e.key === 'Escape') {
            this.closeAllModals();
        }
        // Ctrl+S - save (prevent default)
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            if (this.hasUnsavedChanges) {
                this.updateOrderStatus();
            }
        }
    }



    /**
     * Open modal in edit mode for existing comment
     */
    openEditCommentModal(commentId, commentData) {
        
        this.editingCommentId = commentId;
        this.editingCommentData = { ...commentData };
        
        // Update modal title and button text
        const modalTitle = document.getElementById('noteModalTitleText');
        const saveIcon = document.getElementById('saveNoteIcon');
        const saveText = document.getElementById('saveNoteText');
        const editingField = document.getElementById('editingCommentId');
        
        if (modalTitle) modalTitle.textContent = 'Izohni Tahrirlash';
        if (saveIcon) {
            saveIcon.className = 'fas fa-edit';
        }
        if (saveText) saveText.textContent = 'Yangilash';
        if (editingField) editingField.value = commentId;
        
        // Open modal first
        const modal = document.getElementById('addNoteModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            setTimeout(() => {
                // Setup checkbox handlers first
                this.setupCheckboxHandlers();
                
                // Then fill form with existing data
                this.fillEditForm(commentData);
                
                // Focus on content
                document.getElementById('noteContent')?.focus();
                
            }, 100);
        }
    }

    /**
     * Reset modal to add mode
     */
    resetModalToAddMode() {
        
        this.editingCommentId = null;
        this.editingCommentData = null;
        
        // Update modal title and button text
        const modalTitle = document.getElementById('noteModalTitleText');
        const saveIcon = document.getElementById('saveNoteIcon');
        const saveText = document.getElementById('saveNoteText');
        const editingField = document.getElementById('editingCommentId');
        
        if (modalTitle) modalTitle.textContent = 'Buyurtmaga Izoh Qo\'shish';
        if (saveIcon) {
            saveIcon.className = 'fas fa-save';
        }
        if (saveText) saveText.textContent = 'Saqlash';
        if (editingField) editingField.value = '';
    }

    /**
     * Fill form with comment data for editing
     */
    fillEditForm(commentData) {
        
        const noteContent = document.getElementById('noteContent');
        const commentType = document.getElementById('commentType');
        const commentVisibility = document.getElementById('commentVisibility');
        const commentPriority = document.getElementById('commentPriority');
        const notifyCustomer = document.getElementById('notifyCustomer');
        
        if (noteContent) noteContent.value = commentData.content || '';
        if (commentType) commentType.value = commentData.type || 'general';
        if (commentVisibility) commentVisibility.value = commentData.visibility || 'public';
        if (commentPriority) commentPriority.value = commentData.priority || 'normal';
        
        // For edit mode, set notification checkbox to unchecked by default
        // This allows user to decide whether to notify customer about the update
        if (notifyCustomer) {
            
            notifyCustomer.checked = false;
            
            // Force visual update for custom checkbox
            const customCheckboxWrapper = notifyCustomer.closest('.custom-checkbox');
            const checkmark = customCheckboxWrapper?.querySelector('.checkmark');
            const checkboxLabel = customCheckboxWrapper?.querySelector('.checkbox-label');
            
            if (customCheckboxWrapper) {
                
                // Remove checked styling
                customCheckboxWrapper.classList.remove('checked');
                if (checkmark) {
                    checkmark.style.backgroundColor = '#fff';
                    checkmark.style.borderColor = '#ddd';
                }
                if (checkboxLabel) {
                    checkboxLabel.style.color = '#333';
                    checkboxLabel.style.fontWeight = 'normal';
                }
            }
            
            this.updateCustomCheckboxVisual(notifyCustomer);
            
            // Trigger change event
            notifyCustomer.dispatchEvent(new Event('change', { bubbles: true }));
            
        }
        
        // Update character count
        const charCount = document.getElementById('charCount');
        if (charCount && noteContent) {
            charCount.textContent = noteContent.value.length;
        }
    }

    /**
     * Professional comment deletion with confirmation
     */
    async deleteComment(commentId) {
        
        // Professional confirmation dialog
        const confirmed = await this.showDeleteConfirmation();
        if (!confirmed) {
            return;
        }
        
        try {
            this.showLoading('delete-comment');
            
            const response = await fetch(`/api/order-comments/${commentId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (data.success) {
                window.showToast(window.t?.('manufacturer.orders.detail.javascript.note_delete_success') || 'Izoh muvaffaqiyatli o\'chirildi', 'success');
                
                // Refresh comments
                if (window.orderComments && window.orderComments.refreshComments) {
                    window.orderComments.refreshComments();
                } else {
                    setTimeout(() => location.reload(), 1000);
                }
            } else {
                throw new Error(data.message || 'Failed to delete comment');
            }
            
        } catch (error) {
            console.error('❌ Error deleting comment:', error);
            window.showToast(window.t?.('manufacturer.orders.detail.javascript.note_delete_error') || 'Izohni o\'chirishda xatolik yuz berdi', 'error');
        } finally {
            this.hideLoading('delete-comment');
        }
    }

    /**
     * Show professional delete confirmation modal
     */
    async showDeleteConfirmation() {
        return new Promise((resolve) => {
            // Create custom confirmation modal
            const confirmHtml = `
                <div class="modal-overlay active" id="deleteConfirmModal" style="z-index: 1000000;">
                    <div class="modal-content" style="max-width: 400px;">
                        <div class="modal-header">
                            <h3 class="modal-title">
                                <i class="fas fa-exclamation-triangle" style="color: #dc3545;"></i>
                                Izohni O'chirish
                            </h3>
                        </div>
                        <div class="modal-body">
                            <p>Haqiqatan ham bu izohni o'chirmoqchimisiz?</p>
                            <p><small style="color: #666;">Bu amal qaytarib bo'lmaydi.</small></p>
                        </div>
                        <div class="modal-footer">
                            <button class="products-btn products-btn-secondary" id="cancelDelete">
                                <i class="fas fa-times"></i>
                                Bekor qilish
                            </button>
                            <button class="products-btn products-btn-danger" id="confirmDelete">
                                <i class="fas fa-trash"></i>
                                Ha, O'chirish
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            // Add to DOM
            document.body.insertAdjacentHTML('beforeend', confirmHtml);
            
            const modal = document.getElementById('deleteConfirmModal');
            const confirmBtn = document.getElementById('confirmDelete');
            const cancelBtn = document.getElementById('cancelDelete');
            
            const cleanup = () => {
                if (modal) modal.remove();
            };
            
            confirmBtn.addEventListener('click', () => {
                cleanup();
                resolve(true);
            });
            
            cancelBtn.addEventListener('click', () => {
                cleanup();
                resolve(false);
            });
            
            // Close on overlay click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    cleanup();
                    resolve(false);
                }
            });
        });
    }

    /**
     * Setup checkbox event handlers
     */
    setupCheckboxHandlers() {
        // Direct checkbox handling
        const notifyCheckbox = document.getElementById('notifyCustomer');
        if (notifyCheckbox) {
            // Remove any existing listeners
            notifyCheckbox.removeEventListener('click', this.handleCheckboxClick);
            notifyCheckbox.removeEventListener('change', this.handleCheckboxChange);
            
            // Add fresh listeners
            notifyCheckbox.addEventListener('change', this.handleCheckboxChange.bind(this));
            
        }

        // Also handle label clicks
        const notifyLabel = document.querySelector('label[for="notifyCustomer"]');
        if (notifyLabel) {
            notifyLabel.addEventListener('click', (e) => {
                // Let the browser handle the natural label->checkbox interaction
            });
        }
    }


    /**
     * Handle checkbox change events
     */
    handleCheckboxChange(event) {
        const checkbox = event.target;

        
        // Update custom checkbox visual state
        this.updateCustomCheckboxVisual(checkbox);
    }

    /**
     * Update custom checkbox visual state
     */
    updateCustomCheckboxVisual(checkbox) {
        const customCheckboxWrapper = checkbox.closest('.custom-checkbox');
        const checkmark = customCheckboxWrapper?.querySelector('.checkmark');
        const checkboxLabel = customCheckboxWrapper?.querySelector('.checkbox-label');
        
        if (customCheckboxWrapper && checkmark) {
            
            if (checkbox.checked) {
                // Checked state
                checkmark.style.backgroundColor = '#007bff';
                checkmark.style.borderColor = '#007bff';
                if (checkboxLabel) {
                    checkboxLabel.style.color = '#007bff';
                    checkboxLabel.style.fontWeight = '500';
                }
                
            } else {
                // Unchecked state
                checkmark.style.backgroundColor = '#fff';
                checkmark.style.borderColor = '#ddd';
                if (checkboxLabel) {
                    checkboxLabel.style.color = '#333';
                    checkboxLabel.style.fontWeight = 'normal';
                }
             
            }
        } else {
         
        }
    }
}

// Enhanced Logger
const logger = {
    log: (message) => console.log(`🔧 OrderDetail: ${message}`),
    error: (message) => console.error(`❌ OrderDetail: ${message}`),
    warn: (message) => console.warn(`⚠️ OrderDetail: ${message}`)
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.orderDetailManager = new OrderDetailManager();
    
    // Export functionality
    initializeExportButtons();
});

// Export functionality
function initializeExportButtons() {
    // Export Button Click Handler (Simple)
    const exportOrderBtn = document.getElementById('exportOrderBtn');
    if (exportOrderBtn) {
        exportOrderBtn.addEventListener('click', (e) => {
            e.preventDefault();
            exportOrderData('full');
        });
    }
    
    // Export Items Button (Products Table)
    const exportItemsBtn = document.getElementById('exportItemsBtn');
    if (exportItemsBtn) {
        exportItemsBtn.addEventListener('click', () => {
            exportOrderData('items');
        });
    }
}

// Export Order Data Function
function exportOrderData(type = 'full') {
    try {
        const orderData = extractOrderData();
        
        if (type === 'items') {
            exportItemsToExcel(orderData);
        } else {
            exportFullOrderToPDF(orderData);
        }
        
        showToast('Export muvaffaqiyatli bajarildi!', 'success');
        
    } catch (error) {
        showToast(window.t?.('manufacturer.orders.detail.javascript.export_error') || 'Export da xatolik yuz berdi!', 'error');
    }
}

// Extract order data from page
function extractOrderData() {
    const orderNumber = document.querySelector('.order-number')?.textContent || 'N/A';
    const orderStatus = document.querySelector('.status-badge')?.textContent || 'N/A';
    const orderDate = document.querySelector('.order-detail-id')?.textContent || 'N/A';
    const totalAmount = document.querySelector('.total-summary')?.textContent || '$0.00';
    
    // Extract customer info
    const customerName = document.querySelector('.customer-contact-person')?.textContent || 'N/A';
    const customerCompany = document.querySelector('.customer-company')?.textContent || 'N/A';
    const customerEmail = document.querySelector('.customer-email')?.textContent || 'N/A';
    
    // Extract items
    const items = [];
    const itemRows = document.querySelectorAll('.products-table tbody tr:not(.empty-row)');
    
    itemRows.forEach((row, index) => {
        const productName = row.querySelector('.product-title')?.textContent || 'N/A';
        const quantity = row.querySelector('.quantity-value')?.textContent || '0';
        const unitPrice = row.querySelector('.unit-price')?.textContent || '$0.00';
        const totalPrice = row.querySelector('.total-amount')?.textContent || '$0.00';
        
        items.push({
            no: index + 1,
            product: productName,
            quantity: quantity,
            unitPrice: unitPrice,
            totalPrice: totalPrice
        });
    });
    
    return {
        orderNumber,
        orderStatus,
        orderDate,
        totalAmount,
        customer: {
            name: customerName,
            company: customerCompany,
            email: customerEmail
        },
        items: items
    };
}

// Export to Excel (CSV format)
function exportItemsToExcel(orderData) {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Header
    csvContent += "№,Mahsulot nomi,Miqdor,Birlik narxi,Jami narx\n";
    
    // Items
    orderData.items.forEach(item => {
        csvContent += `${item.no},"${item.product}",${item.quantity},"${item.unitPrice}","${item.totalPrice}"\n`;
    });
    
    // Summary
    csvContent += `\n\nJami: ${orderData.totalAmount}`;
    
    // Download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `buyurtma_${orderData.orderNumber}_mahsulotlar.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Export to PDF (HTML to PDF)
function exportFullOrderToPDF(orderData) {
    // Create print-friendly HTML
    const printContent = generatePrintHTML(orderData);
    
    // Open in new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.onload = function() {
        printWindow.print();
        printWindow.close();
    };
}

// Generate print-friendly HTML
function generatePrintHTML(orderData) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Buyurtma ${orderData.orderNumber}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .order-info { margin-bottom: 20px; }
            .customer-info { margin-bottom: 20px; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .items-table th { background-color: #f2f2f2; }
            .summary { text-align: right; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Buyurtma ${orderData.orderNumber}</h1>
            <p>SLEX B2B Platform</p>
        </div>
        
        <div class="order-info">
            <h3>Buyurtma Ma'lumotlari</h3>
            <p><strong>Raqam:</strong> ${orderData.orderNumber}</p>
            <p><strong>Holat:</strong> ${orderData.orderStatus}</p>
            <p><strong>Sana:</strong> ${orderData.orderDate}</p>
            <p><strong>Jami:</strong> ${orderData.totalAmount}</p>
        </div>
        
        <div class="customer-info">
            <h3>Mijoz Ma'lumotlari</h3>
            <p><strong>Ism:</strong> ${orderData.customer.name}</p>
            <p><strong>Kompaniya:</strong> ${orderData.customer.company}</p>
            <p><strong>Email:</strong> ${orderData.customer.email}</p>
        </div>
        
        <table class="items-table">
            <thead>
                <tr>
                    <th>№</th>
                    <th>Mahsulot</th>
                    <th>Miqdor</th>
                    <th>Birlik narxi</th>
                    <th>Jami</th>
                </tr>
            </thead>
            <tbody>
                ${orderData.items.map(item => `
                    <tr>
                        <td>${item.no}</td>
                        <td>${item.product}</td>
                        <td>${item.quantity}</td>
                        <td>${item.unitPrice}</td>
                        <td>${item.totalPrice}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <div class="summary">
            <p>Jami: ${orderData.totalAmount}</p>
        </div>
    </body>
    </html>
    `;
}

// Simple toast notification
function showToast(message, type = 'info') {
    // Use existing toast system if available
    if (window.showToast) {
        window.showToast(message, type);
        return;
    }
    
    // Fallback toast
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        ${type === 'success' ? 'background: #10b981;' : 'background: #ef4444;'}
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        document.body.removeChild(toast);
    }, 3000);
}

// Export for external use
window.OrderDetailManager = OrderDetailManager;
