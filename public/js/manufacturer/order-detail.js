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
        console.log('🚀 Initializing Order Detail Manager...');
        console.log('📦 Order Data:', this.originalOrderData);
        
        // Make this instance globally available for inter-component communication
        window.orderDetailManager = this;
        
        // Disable animation conflicts immediately
        this.disableConflictingAnimations();
        
        this.setupEventListeners();
        this.initializeModals();
        this.setupBeforeUnloadWarning();
        
        // Double-check after DOM is ready
        setTimeout(() => this.disableConflictingAnimations(), 100);
        
        console.log('✅ Order Detail Manager initialized successfully');
    }

    getOrderIdFromUrl() {
        const pathParts = window.location.pathname.split('/');
        return pathParts[pathParts.length - 1];
    }

    setupEventListeners() {
        console.log('🎧 Setting up event listeners...');
        
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
        document.getElementById('sendEmailBtn')?.addEventListener('click', () => this.sendEmail());
        
        // Item actions
        this.setupItemActions();

        // Item management
        document.addEventListener('change', (e) => this.handleItemChanges(e));
        document.addEventListener('click', (e) => this.handleItemActions(e));

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.table-more-actions')) {
                document.querySelectorAll('.table-more-menu').forEach(menu => {
                    menu.classList.add('hidden');
                });
            }
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
                e.returnValue = 'Saqlenmagan o\'zgarishlar mavjud. Sahifani tark etishga ishonchingiz komilmi?';
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

    setupItemActions() {
        console.log('🔧 Setting up item actions...');
        
        // Item status change buttons
        document.querySelectorAll('.item-status-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const itemId = btn.dataset.itemId;
                const newStatus = btn.dataset.status;
                this.updateItemStatus(itemId, newStatus);
            });
        });

        // Item action dropdowns
        document.querySelectorAll('.item-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const action = btn.dataset.action;
                const itemId = btn.dataset.itemId;
                this.handleItemAction(action, itemId);
            });
        });

        // Item quantity changes
        document.querySelectorAll('.item-quantity-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const itemId = input.dataset.itemId;
                const newQuantity = parseInt(input.value);
                this.updateItemQuantity(itemId, newQuantity);
            });
        });

        console.log('✅ Item actions setup complete');
    }

    // Preview status change
    previewStatusChange(newStatus) {
        const statusMap = {
            'pending': { text: '📋 Kutayotgan', color: '#f59e0b' },
            'confirmed': { text: '✅ Tasdiqlangan', color: '#22c55e' },
            'processing': { text: '⚙️ Jarayonda', color: '#3b82f6' },
            'manufacturing': { text: '🏭 Ishlab chiqarilmoqda', color: '#a855f7' },
            'quality_check': { text: '🔍 Sifat nazorati', color: '#06b6d4' },
            'ready_to_ship': { text: '📦 Yuborishga tayyor', color: '#10b981' },
            'shipped': { text: '🚚 Yo\'lda', color: '#f97316' },
            'out_for_delivery': { text: '🏃‍♂️ Yetkazib berishda', color: '#8b5cf6' },
            'delivered': { text: '🏆 Yetkazildi', color: '#16a34a' },
            'completed': { text: '💯 Yakunlandi', color: '#15803d' },
            'cancelled': { text: '❌ Bekor qilindi', color: '#ef4444' }
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
        console.log('🎧 Setting up advanced modal listeners...');
        
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
            'pending': '📋 Kutayotgan',
            'confirmed': '✅ Tasdiqlangan', 
            'processing': '⚙️ Jarayonda',
            'manufacturing': '🏭 Ishlab chiqarilmoqda',
            'quality_check': '🔍 Sifat nazorati',
            'ready_to_ship': '📦 Yuborishga tayyor',
            'shipped': '🚚 Yo\'lda',
            'out_for_delivery': '🏃‍♂️ Yetkazib berishda',
            'delivered': '🏆 Yetkazildi',
            'completed': '💯 Yakunlandi',
            'cancelled': '❌ Bekor qilindi'
        };
        return statusMap[status] || '❓ Noma\'lum';
    }

    // ENSURE NO ANIMATION INTERFERENCE
    disableConflictingAnimations() {
        console.log('🚫 Disabling conflicting animations...');
        const elementsToStabilize = [
            '.order-detail-content',
            '.order-kpi-cards', 
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
        console.log('✅ Animation conflicts disabled');
    }

    updateItemStatus(itemId, newStatus) {
        console.log(`📋 Updating item ${itemId} status to: ${newStatus}`);
        // Implementation for updating item status
        window.showToast(`Mahsulot holati "${newStatus}" ga o'zgartirildi`, 'success');
    }

    handleItemAction(action, itemId) {
        console.log(`🔧 Handling item action: ${action} for item: ${itemId}`);
        
        switch(action) {
            case 'view':
                this.viewItemDetails(itemId);
                break;
            case 'edit':
                this.editItemDetails(itemId);
                break;
            case 'remove':
                this.removeItem(itemId);
                break;
            case 'duplicate':
                this.duplicateItem(itemId);
                break;
            default:
                console.log('Unknown action:', action);
        }
    }

    updateItemQuantity(itemId, quantity) {
        console.log(`📊 Updating item ${itemId} quantity to: ${quantity}`);
        this.markAsChanged();
        window.showToast('Mahsulot miqdori o\'zgartirildi', 'info');
    }

    viewItemDetails(itemId) {
        console.log(`👁️ Viewing details for item: ${itemId}`);
        // Implementation for viewing item details
    }

    editItemDetails(itemId) {
        console.log(`✏️ Editing item: ${itemId}`);
        // Implementation for editing item
    }

    removeItem(itemId) {
        console.log(`🗑️ Removing item: ${itemId}`);
        if (confirm('Ushbu mahsulotni buyurtmadan olib tashlashni xohlaysizmi?')) {
            window.showToast('Mahsulot olib tashlandi', 'warning');
        }
    }

    duplicateItem(itemId) {
        console.log(`📋 Duplicating item: ${itemId}`);
        window.showToast('Mahsulot nusxalandi', 'success');
    }

    async loadOrderData() {
        try {
            this.showLoading('order-data');
            
            const response = await fetch(`/api/manufacturer/orders/${this.orderId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                this.originalOrderData = data.order;
                this.updateOrderDisplay(data.order);
                console.log('📋 Order data loaded successfully');
            } else {
                throw new Error(data.message || 'Failed to load order data');
            }
        } catch (error) {
            console.error('❌ Error loading order data:', error);
            window.showToast('Buyurtma ma\'lumotlarini yuklashda xatolik', 'error');
        } finally {
            this.hideLoading('order-data');
        }
    }

    updateOrderDisplay(order) {
        // Update dynamic content if needed
        this.updateItemTotals();
        this.updateOrderSummary(order);
    }

    updateItemTotals() {
        document.querySelectorAll('.quantity-input').forEach(input => {
            input.addEventListener('change', () => {
                this.calculateItemTotal(input);
                this.markAsChanged();
            });
        });
    }

    calculateItemTotal(quantityInput) {
        const row = quantityInput.closest('tr');
        if (!row) return;

        const quantity = parseFloat(quantityInput.value) || 0;
        const unitPriceElement = row.querySelector('.unit-price');
        const totalElement = row.querySelector('.item-total');

        if (unitPriceElement && totalElement) {
            const unitPrice = this.parsePrice(unitPriceElement.textContent);
            const total = quantity * unitPrice;
            
            totalElement.textContent = this.formatPrice(total);
        }

        this.updateOrderTotalSummary();
    }

    updateOrderTotalSummary() {
        let grandTotal = 0;
        
        document.querySelectorAll('.item-total').forEach(element => {
            const amount = this.parsePrice(element.textContent);
            grandTotal += amount;
        });

        // Update total display
        const totalElement = document.querySelector('.payment-value.total');
        if (totalElement) {
            totalElement.textContent = this.formatPrice(grandTotal);
        }
    }

    parsePrice(priceText) {
        return parseFloat(priceText.replace(/[$,]/g, '')) || 0;
    }

    formatPrice(amount) {
        return '$' + amount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
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
            window.showToast('Buyurtma holatini yangilashda xatolik', 'error');
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
        return statusMap[status] || 'Noma\'lum';
    }

    handleItemChanges(event) {
        if (event.target.matches('.quantity-input')) {
            this.calculateItemTotal(event.target);
        } else if (event.target.matches('.item-status-select')) {
            this.updateItemStatus(event.target);
        }
    }

    async updateItemStatus(selectElement) {
        const itemIndex = selectElement.dataset.itemIndex;
        const newStatus = selectElement.value;

        try {
            const response = await fetch(`/api/manufacturer/orders/${this.orderId}/items/${itemIndex}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            const data = await response.json();

            if (data.success) {
                this.markAsSaved();
                window.showToast('Mahsulot holati yangilandi', 'success');
            } else {
                throw new Error(data.message || 'Failed to update item status');
            }
        } catch (error) {
            console.error('❌ Error updating item status:', error);
            window.showToast('Mahsulot holatini yangilashda xatolik', 'error');
        }
    }

    handleItemActions(event) {
        const target = event.target.closest('[data-action]');
        if (!target) return;

        event.preventDefault();
        const action = target.dataset.action;

        switch (action) {
            case 'view-product':
                this.viewProduct(target.dataset.productId);
                break;
            case 'edit-item':
                this.editItem(target.dataset.itemIndex);
                break;
            case 'remove-item':
                this.removeItem(target.dataset.itemIndex);
                break;
            case 'duplicate-item':
                this.duplicateItem(target.dataset.itemIndex);
                break;
        }

        // Handle dropdown toggle
        if (target.classList.contains('dropdown-toggle')) {
            event.stopPropagation();
            this.toggleDropdown(target);
        }
    }

    toggleDropdown(toggleBtn) {
        const dropdown = toggleBtn.nextElementSibling;
        if (!dropdown) return;

        // Close all other dropdowns
        document.querySelectorAll('.table-more-menu').forEach(menu => {
            if (menu !== dropdown && !menu.classList.contains('hidden')) {
                menu.classList.add('hidden');
            }
        });

        // Toggle current dropdown
        dropdown.classList.toggle('hidden');
    }

    viewProduct(productId) {
        if (productId) {
            window.open(`/manufacturer/products/${productId}`, '_blank');
        }
    }

    editItem(itemIndex) {
        window.showToast('Mahsulot tahrirlash funksiyasi tez orada qo\'shiladi', 'info');
    }

    async removeItem(itemIndex) {
        if (!confirm('Ushbu mahsulotni buyurtmadan olib tashlashga ishonchingiz komilmi?')) {
            return;
        }

        try {
            const response = await fetch(`/api/manufacturer/orders/${this.orderId}/items/${itemIndex}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                location.reload(); // Reload to show updated items
            } else {
                throw new Error(data.message || 'Failed to remove item');
            }
        } catch (error) {
            console.error('❌ Error removing item:', error);
            window.showToast('Mahsulotni o\'chirishda xatolik', 'error');
        }
    }

    duplicateItem(itemIndex) {
        window.showToast('Mahsulot nusxalash funksiyasi tez orada qo\'shiladi', 'info');
    }

    // Communication Modal - Redirect to messaging page
    // Note: This method is superseded by the main openCommunicationModal method below

    closeCommunicationModal() {
        document.getElementById('communicationModal')?.classList.add('hidden');
        this.clearCommunicationForm();
    }

    clearCommunicationForm() {
        document.getElementById('messageType').value = 'status_update';
        document.getElementById('messageSubject').value = '';
        document.getElementById('messageContent').value = '';
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
            window.showToast('Xabar yuborishda xatolik', 'error');
        } finally {
            this.hideLoading('send-message');
        }
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
            const response = await fetch(`/api/orders/${this.orderId}/comments`, {
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
                window.showToast('Izoh muvaffaqiyatli qo\'shildi', 'success');
                
                // Refresh comments instead of full page reload
                if (window.orderComments && window.orderComments.refreshComments) {
                    window.orderComments.refreshComments();
                } else {
                    // Fallback to page reload if comments manager not available
                    setTimeout(() => location.reload(), 1000);
                }
            } else {
                throw new Error(data.message || 'Izohni saqlashda xatolik');
            }
        } catch (error) {
            console.error('❌ Error saving note:', error);
            window.showToast('Izoh saqlashda xatolik', 'error');
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
            window.showToast('Buyurtmani nusxalashda xatolik', 'error');
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
            window.showToast('Xabar yuborishda xatolik', 'error');
        } finally {
            this.hideLoading('send-message');
        }
    }

    // ADDITIONAL ACTION METHODS
    printOrder() {
        console.log('🖨️ Printing order...');
        window.print();
    }

    duplicateOrder() {
        console.log('📋 Duplicating order...');
        window.showToast('Buyurtma nusxalanmoqda...', 'info');
        // TODO: Implement order duplication logic
    }

    exportOrder() {
        console.log('📄 Exporting order...');
        window.showToast('Buyurtma export qilinmoqda...', 'info');
        // TODO: Implement order export logic
    }

    shareOrder() {
        console.log('🔗 Sharing order...');
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

    sendEmail() {
        console.log('📧 Opening email...');
        const customer = this.originalOrderData.buyer;
        const mailto = `mailto:${customer?.email || ''}?subject=Buyurtma #${this.orderId} haqida`;
        window.open(mailto);
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
            : `/api/orders/${this.orderId}/comments`;
        
        const successMessage = isEditing 
            ? 'Izoh muvaffaqiyatli yangilandi' 
            : 'Izoh muvaffaqiyatli qo\'shildi';

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
            window.showToast(`Izohni ${isEditing ? 'yangilashda' : 'saqlashda'} xatolik`, 'error');
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

    // ITEM MANAGEMENT METHODS
    setupItemActions() {
        console.log('🔧 Setting up item actions...');
        // Item action buttons are handled through event delegation
        // See handleItemActions and handleItemChanges methods
    }

    handleItemChanges(e) {
        // Handle quantity changes, item modifications, etc.
        if (e.target.classList.contains('item-quantity-input')) {
            this.markAsChanged();
            console.log('📝 Item quantity changed');
        }
    }

    handleItemActions(e) {
        const target = e.target.closest('[data-action]');
        if (!target) return;

        const action = target.dataset.action;
        const itemIndex = target.dataset.itemIndex;
        const productId = target.dataset.productId;

        console.log(`🎯 Item action: ${action}`, { itemIndex, productId });

        switch (action) {
            case 'view-product':
                this.viewProduct(productId);
                break;
            case 'edit-item':
                this.editItem(itemIndex);
                break;
            case 'remove-item':
                this.removeItem(itemIndex);
                break;
            case 'duplicate-item':
                this.duplicateItem(itemIndex);
                break;
        }
    }

    viewProduct(productId) {
        console.log('👁️ Viewing product:', productId);
        const url = `/marketplace/products/${productId}`;
        window.open(url, '_blank');
    }

    editItem(itemIndex) {
        console.log('✏️ Editing item:', itemIndex);
        window.showToast('Mahsulot tahrirlash funksiyasi tez orada qo\'shiladi', 'info');
        // TODO: Implement item editing
    }

    removeItem(itemIndex) {
        console.log('🗑️ Removing item:', itemIndex);
        if (confirm('Mahsulotni buyurtmadan olib tashlashni xohlaysizmi?')) {
            window.showToast('Mahsulot olib tashlash funksiyasi tez orada qo\'shiladi', 'info');
            // TODO: Implement item removal
        }
    }

    duplicateItem(itemIndex) {
        console.log('📋 Duplicating item:', itemIndex);
        window.showToast('Mahsulot nusxalash funksiyasi tez orada qo\'shiladi', 'info');
        // TODO: Implement item duplication
    }

    /**
     * Open modal in edit mode for existing comment
     */
    openEditCommentModal(commentId, commentData) {
        console.log('✏️ Opening edit modal for comment:', commentId);
        
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
                
                console.log('🔄 Edit modal setup complete: handlers -> fill form -> focus');
            }, 100);
        }
    }

    /**
     * Reset modal to add mode
     */
    resetModalToAddMode() {
        console.log('🔄 Resetting modal to add mode');
        
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
        console.log('📝 Filling edit form with data:', commentData);
        
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
            console.log('🔍 Before reset - checkbox checked:', notifyCustomer.checked);
            console.log('🔍 Checkbox element:', notifyCustomer);
            console.log('🔍 Checkbox parent element:', notifyCustomer.parentElement);
            
            notifyCustomer.checked = false;
            
            // Force visual update for custom checkbox
            const customCheckboxWrapper = notifyCustomer.closest('.custom-checkbox');
            const checkmark = customCheckboxWrapper?.querySelector('.checkmark');
            const checkboxLabel = customCheckboxWrapper?.querySelector('.checkbox-label');
            
            if (customCheckboxWrapper) {
                console.log('🎨 Updating custom checkbox visual state');
                
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
            
            // Update visual state using our method
            this.updateCustomCheckboxVisual(notifyCustomer);
            
            // Trigger change event
            notifyCustomer.dispatchEvent(new Event('change', { bubbles: true }));
            
            console.log('📧 After reset - checkbox checked:', notifyCustomer.checked);
            console.log('✅ Edit mode: Notification checkbox reset (user can choose to notify about update)');
        } else {
            console.log('❌ Notification checkbox element not found in edit mode');
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
        console.log('🗑️ Attempting to delete comment:', commentId);
        
        // Professional confirmation dialog
        const confirmed = await this.showDeleteConfirmation();
        if (!confirmed) {
            console.log('❌ Delete cancelled by user');
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
                window.showToast('Izoh muvaffaqiyatli o\'chirildi', 'success');
                
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
            window.showToast('Izohni o\'chirishda xatolik yuz berdi', 'error');
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
            notifyCheckbox.addEventListener('click', this.handleCheckboxClick.bind(this));
            notifyCheckbox.addEventListener('change', this.handleCheckboxChange.bind(this));
            
            console.log('✅ Checkbox handlers setup complete');
        } else {
            console.warn('⚠️ notifyCustomer checkbox not found');
        }

        // Also handle label clicks
        const notifyLabel = document.querySelector('label[for="notifyCustomer"]');
        if (notifyLabel) {
            notifyLabel.addEventListener('click', (e) => {
                // Let the browser handle the natural label->checkbox interaction
                console.log('🏷️ Label clicked, checkbox should toggle');
            });
        }
    }

    /**
     * Handle checkbox click events
     */
    handleCheckboxClick(event) {
        const checkbox = event.target;
        console.log('🖱️ Checkbox clicked:', {
            id: checkbox.id,
            checked: checkbox.checked,
            disabled: checkbox.disabled
        });
        
        // Ensure the checkbox state is properly set
        if (!checkbox.disabled) {
            // Force the checked state to be explicit
            setTimeout(() => {
                console.log('✅ Checkbox state after click:', checkbox.checked);
            }, 10);
        }
    }

    /**
     * Handle checkbox change events
     */
    handleCheckboxChange(event) {
        const checkbox = event.target;
        console.log('🔄 Checkbox changed:', {
            id: checkbox.id,
            checked: checkbox.checked,
            value: checkbox.value
        });
        
        // Update custom checkbox visual state
        this.updateCustomCheckboxVisual(checkbox);
        
        // Visual feedback
        if (checkbox.checked) {
            console.log('🔔 Customer notification enabled');
        } else {
            console.log('🔕 Customer notification disabled');
        }
    }

    /**
     * Update custom checkbox visual state
     */
    updateCustomCheckboxVisual(checkbox) {
        const customCheckboxWrapper = checkbox.closest('.custom-checkbox');
        const checkmark = customCheckboxWrapper?.querySelector('.checkmark');
        const checkboxLabel = customCheckboxWrapper?.querySelector('.checkbox-label');
        
        if (customCheckboxWrapper && checkmark) {
            console.log('🎨 Updating custom checkbox visual for:', checkbox.id, 'checked:', checkbox.checked);
            
            if (checkbox.checked) {
                // Checked state
                checkmark.style.backgroundColor = '#007bff';
                checkmark.style.borderColor = '#007bff';
                if (checkboxLabel) {
                    checkboxLabel.style.color = '#007bff';
                    checkboxLabel.style.fontWeight = '500';
                }
                console.log('✅ Applied checked styling');
            } else {
                // Unchecked state
                checkmark.style.backgroundColor = '#fff';
                checkmark.style.borderColor = '#ddd';
                if (checkboxLabel) {
                    checkboxLabel.style.color = '#333';
                    checkboxLabel.style.fontWeight = 'normal';
                }
                console.log('❌ Applied unchecked styling');
            }
        } else {
            console.warn('⚠️ Custom checkbox elements not found for visual update');
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
});

// Export for external use
window.OrderDetailManager = OrderDetailManager;
