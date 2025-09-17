/**
 * Professional Supplier Profile JavaScript
 * Alibaba-style B2B Marketplace Functionality
 * Production-Ready Interactive Features
 */

'use strict';

// Supplier Profile Management Class
class SupplierProfileManager {
    constructor() {
        this.supplierId = null;
        this.inquiryList = new Set();
        this.favoriteSuppliers = new Set();
        this.chatSocket = null;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.loadUserPreferences();
        this.initializeTooltips();
        this.setupImageLazyLoading();
        this.initializeCharts();
        this.initializeProductCarousel();
    }
    
    bindEvents() {
        // Contact and inquiry events
        document.addEventListener('click', this.handleButtonClicks.bind(this));
        
        // Form submission events
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', this.handleContactSubmit.bind(this));
        }
        
        // Search and filter events
        const productFilters = document.querySelectorAll('.product-filter');
        productFilters.forEach(filter => {
            filter.addEventListener('change', this.handleProductFilter.bind(this));
        });
        
        // Scroll events for sticky elements
        window.addEventListener('scroll', this.handleScroll.bind(this));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
    }
    
    handleButtonClicks(event) {
        const target = event.target;
        const action = target.getAttribute('onclick') || target.getAttribute('data-action');
        
        if (!action) return;
        
        event.preventDefault();
        
        // Extract action and parameters
        if (action.includes('openContactModal')) {
            this.openContactModal();
        } else if (action.includes('startChat')) {
            // Disabled to prevent conflicts with main page chat handler
            return; // Don't handle startChat here
        } else if (action.includes('requestQuote')) {
            this.requestQuote();
        } else if (action.includes('contactSupplier')) {
            const productId = this.extractParameter(action, 'contactSupplier');
            this.contactSupplier(productId);
        } else if (action.includes('addToInquiry')) {
            const productId = this.extractParameter(action, 'addToInquiry');
            this.addToInquiry(productId);
        } else if (action.includes('saveSupplier')) {
            const supplierId = this.extractParameter(action, 'saveSupplier');
            this.saveSupplier(supplierId);
        } else if (action.includes('shareSupplier')) {
            const supplierId = this.extractParameter(action, 'shareSupplier');
            this.shareSupplier(supplierId);
        } else if (action.includes('reportSupplier')) {
            const supplierId = this.extractParameter(action, 'reportSupplier');
            this.reportSupplier(supplierId);
        }
    }
    
    extractParameter(actionString, functionName) {
        const regex = new RegExp(functionName + "\\('([^']+)'\\)");
        const match = actionString.match(regex);
        return match ? match[1] : null;
    }
    
    // Contact Modal Management
    openContactModal() {
        const contactModal = document.getElementById('contactModal');
        if (contactModal && typeof bootstrap !== 'undefined') {
            const modal = new bootstrap.Modal(contactModal);
            modal.show();
            
            // Focus on first input
            setTimeout(() => {
                const firstInput = contactModal.querySelector('input[type="text"]');
                if (firstInput) firstInput.focus();
            }, 300);
        }
    }
    
    // Communication Features
    async startChat(supplierId) {
        try {
            this.showLoading('Starting chat...');
            
            // Check if user is authenticated
            if (!this.isUserAuthenticated()) {
                this.showLoginPrompt();
                return;
            }
            
            // Initialize chat functionality
            const response = await fetch(`/api/chat/initiate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': this.getCSRFToken()
                },
                body: JSON.stringify({ supplierId })
            });
            
            if (response.ok) {
                const chatData = await response.json();
                this.openChatWindow(chatData);
            } else {
                throw new Error('Failed to start chat');
            }
        } catch (error) {
            // console.error('Chat error:', error);
            this.showNotification('Chat service is temporarily unavailable', 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    openChatWindow(chatData) {
        // Create chat window
        const chatWindow = window.open(
            `/chat/${chatData.chatId}`,
            'supplierChat',
            'width=400,height=600,resizable=yes,scrollbars=yes'
        );
        
        if (!chatWindow) {
            this.showNotification('Please allow popups to use chat feature', 'warning');
        }
    }
    
    // Quote Request Management
    async requestQuote() {
        try {
            const quoteModal = this.createQuoteModal();
            document.body.appendChild(quoteModal);
            
            if (typeof bootstrap !== 'undefined') {
                const modal = new bootstrap.Modal(quoteModal);
                modal.show();
            }
        } catch (error) {
            // console.error('Quote request error:', error);
            this.showNotification('Failed to open quote request form', 'error');
        }
    }
    
    createQuoteModal() {
        const modalHTML = `
            <div class="modal fade" id="quoteModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="las la-file-alt text-main me-2"></i>
                                Request Custom Quote
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="quoteForm">
                                <div class="row g-3">
                                    <div class="col-md-6">
                                        <label class="form-label">Product/Service</label>
                                        <input type="text" class="form-control" name="product" required>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Quantity</label>
                                        <input type="number" class="form-control" name="quantity" required>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Target Price Range</label>
                                        <input type="text" class="form-control" name="priceRange" placeholder="e.g., $10-15 per unit">
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Delivery Timeline</label>
                                        <select class="form-select" name="timeline" required>
                                            <option value="">Select timeline</option>
                                            <option value="1-2 weeks">1-2 weeks</option>
                                            <option value="2-4 weeks">2-4 weeks</option>
                                            <option value="1-2 months">1-2 months</option>
                                            <option value="2-3 months">2-3 months</option>
                                            <option value="flexible">Flexible</option>
                                        </select>
                                    </div>
                                    <div class="col-12">
                                        <label class="form-label">Detailed Requirements</label>
                                        <textarea class="form-control" name="requirements" rows="4" 
                                                  placeholder="Please provide detailed specifications, quality requirements, packaging needs, etc."></textarea>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" onclick="supplierProfile.submitQuoteRequest()">
                                <i class="las la-paper-plane me-2"></i>Submit Quote Request
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = modalHTML;
        return tempDiv.firstElementChild;
    }
    
    async submitQuoteRequest() {
        try {
            const form = document.getElementById('quoteForm');
            const formData = new FormData(form);
            
            this.showLoading('Submitting quote request...');
            
            const response = await fetch('/api/quotes/request', {
                method: 'POST',
                headers: {
                    'X-CSRF-Token': this.getCSRFToken()
                },
                body: formData
            });
            
            if (response.ok) {
                this.showNotification('Quote request submitted successfully!', 'success');
                
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('quoteModal'));
                modal.hide();
                
                // Clean up
                setTimeout(() => {
                    document.getElementById('quoteModal').remove();
                }, 300);
            } else {
                throw new Error('Failed to submit quote request');
            }
        } catch (error) {
            // console.error('Quote submission error:', error);
            this.showNotification('Failed to submit quote request', 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    // Product Inquiry Management
    contactSupplier(productId) {
        // Pre-fill contact form with product information
        const productElement = document.querySelector(`[data-product-id="${productId}"]`);
        const productName = productElement ? 
            productElement.querySelector('.product-name')?.textContent?.trim() : 
            `Product ID: ${productId}`;
        
        document.getElementById('contactSubject').value = `Inquiry about ${productName}`;
        document.getElementById('contactMessage').value = 
            `I am interested in your product: ${productName}\n\nPlease provide more information about:\n- Pricing and minimum order quantity\n- Delivery terms and timeline\n- Product specifications\n- Sample availability\n\nThank you.`;
        
        this.openContactModal();
    }
    
    addToInquiry(productId) {
        if (this.inquiryList.has(productId)) {
            this.showNotification('Product already in inquiry list', 'info');
            return;
        }
        
        this.inquiryList.add(productId);
        this.updateInquiryBadge();
        this.saveInquiryList();
        
        // Visual feedback
        const button = document.querySelector(`[onclick*="addToInquiry('${productId}')"]`);
        if (button) {
            button.innerHTML = '<i class="las la-check me-1"></i>Added';
            button.disabled = true;
            button.classList.remove('btn-primary');
            button.classList.add('btn-success');
        }
        
        this.showNotification('Product added to inquiry list', 'success');
    }
    
    // Supplier Management
    async saveSupplier(supplierId) {
        try {
            if (this.favoriteSuppliers.has(supplierId)) {
                this.favoriteSuppliers.delete(supplierId);
                this.showNotification('Supplier removed from favorites', 'info');
            } else {
                this.favoriteSuppliers.add(supplierId);
                this.showNotification('Supplier saved to favorites', 'success');
            }
            
            this.saveFavoriteSuppliers();
            this.updateFavoriteButton(supplierId);
            
            // Sync with backend if user is authenticated
            if (this.isUserAuthenticated()) {
                await this.syncFavoritesWithBackend();
            }
        } catch (error) {
            // console.error('Save supplier error:', error);
            this.showNotification('Failed to save supplier', 'error');
        }
    }
    
    shareSupplier(supplierId) {
        const supplierName = document.querySelector('.supplier-name')?.textContent?.trim() || 'Supplier';
        const url = window.location.href;
        
        if (navigator.share) {
            navigator.share({
                title: `${supplierName} - Professional Supplier`,
                text: `Check out this verified supplier profile on our B2B marketplace`,
                url: url
            }).catch(error => {
                this.fallbackShare(url);
            });
        } else {
            this.fallbackShare(url);
        }
    }
    
    fallbackShare(url) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(url).then(() => {
                this.showNotification('Supplier profile link copied to clipboard!', 'success');
            }).catch(() => {
                this.showShareModal(url);
            });
        } else {
            this.showShareModal(url);
        }
    }
    
    showShareModal(url) {
        const shareModal = this.createShareModal(url);
        document.body.appendChild(shareModal);
        
        if (typeof bootstrap !== 'undefined') {
            const modal = new bootstrap.Modal(shareModal);
            modal.show();
        }
    }
    
    async reportSupplier(supplierId) {
        try {
            const reportModal = this.createReportModal();
            document.body.appendChild(reportModal);
            
            if (typeof bootstrap !== 'undefined') {
                const modal = new bootstrap.Modal(reportModal);
                modal.show();
            }
        } catch (error) {
            // console.error('Report supplier error:', error);
            this.showNotification('Failed to open report form', 'error');
        }
    }
    
    // Form Handling
    async handleContactSubmit(event) {
        event.preventDefault();
        
        try {
            this.showLoading('Sending inquiry...');
            
            const form = event.target;
            const formData = new FormData(form);
            
            // Add supplier ID
            const supplierId = this.getCurrentSupplierId();
            formData.append('supplierId', supplierId);
            
            const response = await fetch('/api/inquiries/submit', {
                method: 'POST',
                headers: {
                    'X-CSRF-Token': this.getCSRFToken()
                },
                body: formData
            });
            
            if (response.ok) {
                const result = await response.json();
                this.showNotification('Your inquiry has been sent successfully!', 'success');
                
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('contactModal'));
                modal.hide();
                
                // Reset form
                form.reset();
                
                // Track analytics
                this.trackEvent('inquiry_sent', { supplierId });
            } else {
                throw new Error('Failed to send inquiry');
            }
        } catch (error) {
            // console.error('Contact form error:', error);
            this.showNotification('Failed to send inquiry. Please try again.', 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    // Product Filtering and Search
    handleProductFilter(event) {
        const filterType = event.target.name;
        const filterValue = event.target.value;
        
        // Enhanced filtering with smart product selection
        if (filterType === 'sortBy') {
            this.updateProductSortDisplay(filterValue);
        }
        
        this.filterProducts(filterType, filterValue);
    }
    
    updateProductSortDisplay(sortType) {
        const productGrid = document.querySelector('.products-grid');
        const sortIndicator = document.querySelector('.sort-indicator');
        
        if (sortIndicator) {
            let sortText = 'Default';
            switch(sortType) {
                case 'top':
                case 'featured':
                    sortText = 'Top Products (Featured, High-rated, Popular)';
                    break;
                case 'latest':
                    sortText = 'Latest Products (Newest First)';
                    break;
                case 'rating':
                    sortText = 'Best Rated Products';
                    break;
                case 'popular':
                    sortText = 'Most Popular Products';
                    break;
                case 'price_low':
                    sortText = 'Price: Low to High';
                    break;
                case 'price_high':
                    sortText = 'Price: High to Low';
                    break;
            }
            sortIndicator.textContent = sortText;
        }
        
        // Add loading animation to product grid
        if (productGrid) {
            productGrid.classList.add('loading');
        }
    }
    
    filterProducts(filterType, filterValue) {
        const products = document.querySelectorAll('.product-item');
        
        products.forEach(product => {
            let shouldShow = true;
            
            switch (filterType) {
                case 'category':
                    shouldShow = filterValue === '' || 
                                product.dataset.category === filterValue;
                    break;
                case 'priceRange':
                    shouldShow = this.checkPriceRange(product, filterValue);
                    break;
                case 'rating':
                    shouldShow = this.checkRating(product, filterValue);
                    break;
            }
            
            product.style.display = shouldShow ? 'block' : 'none';
        });
        
        this.updateProductCount();
    }
    
    // Utility Functions
    getCurrentSupplierId() {
        // Extract supplier ID from URL or data attribute
        const urlMatch = window.location.pathname.match(/\/supplier\/([^\/]+)/);
        return urlMatch ? urlMatch[1] : null;
    }
    
    isUserAuthenticated() {
        // Check if user is logged in
        return document.querySelector('meta[name="user-authenticated"]')?.content === 'true';
    }
    
    getCSRFToken() {
        return document.querySelector('meta[name="csrf-token"]')?.content || '';
    }
    
    showLoading(message = 'Loading...') {
        // Create or show loading overlay
        let loader = document.getElementById('globalLoader');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'globalLoader';
            loader.className = 'global-loader';
            loader.innerHTML = `
                <div class="loader-content">
                    <div class="loader-spinner"></div>
                    <div class="loader-message">${message}</div>
                </div>
            `;
            document.body.appendChild(loader);
        }
        
        loader.querySelector('.loader-message').textContent = message;
        loader.style.display = 'flex';
    }
    
    hideLoading() {
        const loader = document.getElementById('globalLoader');
        if (loader) {
            loader.style.display = 'none';
        }
    }
    
    showNotification(message, type = 'info') {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="las la-${this.getToastIcon(type)} toast-icon"></i>
                <span class="toast-message">${message}</span>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="las la-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
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
    
    // Data Persistence
    loadUserPreferences() {
        // Load saved inquiry list
        const savedInquiries = localStorage.getItem('supplierInquiryList');
        if (savedInquiries) {
            this.inquiryList = new Set(JSON.parse(savedInquiries));
        }
        
        // Load favorite suppliers
        const savedFavorites = localStorage.getItem('favoriteSuppliers');
        if (savedFavorites) {
            this.favoriteSuppliers = new Set(JSON.parse(savedFavorites));
        }
        
        this.updateInquiryBadge();
        this.updateFavoriteButtons();
    }
    
    saveInquiryList() {
        localStorage.setItem('supplierInquiryList', JSON.stringify([...this.inquiryList]));
    }
    
    saveFavoriteSuppliers() {
        localStorage.setItem('favoriteSuppliers', JSON.stringify([...this.favoriteSuppliers]));
    }
    
    // UI Updates
    updateInquiryBadge() {
        const badges = document.querySelectorAll('.inquiry-badge');
        badges.forEach(badge => {
            badge.textContent = this.inquiryList.size;
            badge.style.display = this.inquiryList.size > 0 ? 'inline' : 'none';
        });
    }
    
    updateFavoriteButtons() {
        const supplierId = this.getCurrentSupplierId();
        if (supplierId) {
            this.updateFavoriteButton(supplierId);
        }
    }
    
    updateFavoriteButton(supplierId) {
        const buttons = document.querySelectorAll(`[onclick*="saveSupplier('${supplierId}')"]`);
        const isFavorite = this.favoriteSuppliers.has(supplierId);
        
        buttons.forEach(button => {
            const icon = button.querySelector('i');
            if (icon) {
                icon.className = isFavorite ? 'las la-bookmark' : 'las la-save';
            }
            button.title = isFavorite ? 'Remove from favorites' : 'Save to favorites';
        });
    }
    
    // Analytics and Tracking
    trackEvent(eventName, data = {}) {
        // Track user interactions for analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, data);
        }
        
        // Custom analytics implementation
    }
    
    // Keyboard Shortcuts
    handleKeyboardShortcuts(event) {
        if (event.ctrlKey || event.metaKey) {
            switch (event.key) {
                case 'k':
                    event.preventDefault();
                    this.focusSearch();
                    break;
                case 'Enter':
                    if (event.target.tagName === 'INPUT') {
                        event.preventDefault();
                        this.handleQuickAction(event.target);
                    }
                    break;
            }
        }
        
        // Escape key to close modals
        if (event.key === 'Escape') {
            this.closeTopModal();
        }
    }
    
    // Scroll Handling
    handleScroll() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Update sticky navigation
        const stickyElements = document.querySelectorAll('.sticky-top');
        stickyElements.forEach(element => {
            if (scrollTop > 100) {
                element.classList.add('scrolled');
            } else {
                element.classList.remove('scrolled');
            }
        });
        
        // Show/hide scroll to top button
        const scrollTopBtn = document.getElementById('scrollTopBtn');
        if (scrollTopBtn) {
            scrollTopBtn.style.display = scrollTop > 300 ? 'block' : 'none';
        }
    }
    
    // Initialize Features
    initializeTooltips() {
        if (typeof bootstrap !== 'undefined') {
            const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.map(function (tooltipTriggerEl) {
                return new bootstrap.Tooltip(tooltipTriggerEl);
            });
        }
    }
    
    setupImageLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        observer.unobserve(img);
                    }
                });
            });
            
            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }
    
    initializeCharts() {
        // Initialize any charts or data visualizations
        if (typeof Chart !== 'undefined') {
            this.initBusinessMetricsChart();
        }
    }
    
    initBusinessMetricsChart() {
        const chartElement = document.getElementById('businessMetricsChart');
        if (!chartElement) return;
        
        const ctx = chartElement.getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Completed Orders', 'Pending Orders', 'Cancelled Orders'],
                datasets: [{
                    data: [70, 20, 10],
                    backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    // Product Carousel Management
    initializeProductCarousel() {
        const carousel = document.getElementById('productsCarousel');
        const prevBtn = document.getElementById('prevProduct');
        const nextBtn = document.getElementById('nextProduct');
        
        if (!carousel || !prevBtn || !nextBtn) return;
        
        const items = carousel.querySelectorAll('.product-carousel-item');
        if (items.length <= this.getVisibleItemsCount()) {
            // Hide controls if not enough items
            const controls = document.querySelector('.carousel-controls');
            if (controls) controls.style.display = 'none';
            return;
        }
        
        let currentIndex = 0;
        
        // Professional responsive width calculation
        const getItemWidth = () => {
            const containerWidth = carousel.parentElement.clientWidth;
            const visibleItems = this.getVisibleItemsCount();
            const screenWidth = window.innerWidth;
            
            // Responsive gap calculation
            let gap = 32; // 2rem default
            if (screenWidth < 768) gap = 16; // 1rem on mobile
            else if (screenWidth < 992) gap = 24; // 1.5rem on tablet
            
            const totalGap = gap * (visibleItems - 1);
            return (containerWidth - totalGap) / visibleItems;
        };
        
        // Enhanced carousel update with responsive logic
        const updateCarousel = () => {
            const itemWidth = getItemWidth();
            const screenWidth = window.innerWidth;
            const visibleItems = this.getVisibleItemsCount();
            const maxIndex = Math.max(0, items.length - visibleItems);
            
            // Responsive gap
            let gap = 32;
            if (screenWidth < 768) gap = 16;
            else if (screenWidth < 992) gap = 24;
            
            const itemWidthWithGap = itemWidth + gap;
            
            // Ensure currentIndex is within bounds
            if (currentIndex > maxIndex) {
                currentIndex = maxIndex;
            }
            
            // Set responsive widths and ensure visibility
            items.forEach((item, index) => {
                item.style.width = `${itemWidth}px`;
                item.style.maxWidth = `${itemWidth}px`;
                item.style.minWidth = `${itemWidth}px`;
                item.style.flex = '0 0 auto';
                item.style.display = 'block';
                item.style.opacity = '1';
            });
            
            const translateX = -(currentIndex * itemWidthWithGap);
            carousel.style.transform = `translateX(${translateX}px)`;
            
            // Update button states with enhanced UX
            prevBtn.disabled = currentIndex === 0;
            nextBtn.disabled = currentIndex >= maxIndex;
            
            // Add visual feedback
            prevBtn.classList.toggle('disabled', currentIndex === 0);
            nextBtn.classList.toggle('disabled', currentIndex >= maxIndex);
        };
        
        // Previous button click
        prevBtn.addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
                updateCarousel();
                this.trackEvent('product_carousel_prev');
            }
        });
        
        // Next button click
        nextBtn.addEventListener('click', () => {
            const visibleItems = this.getVisibleItemsCount();
            const maxIndex = Math.max(0, items.length - visibleItems);
            if (currentIndex < maxIndex) {
                currentIndex++;
                updateCarousel();
                this.trackEvent('product_carousel_next');
            }
        });
        
        // Enhanced touch/swipe support for mobile
        let startX = 0;
        let startY = 0;
        let isDragging = false;
        
        carousel.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isDragging = true;
            carousel.style.transition = 'none';
        }, { passive: true });
        
        carousel.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            
            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            const diffX = startX - currentX;
            const diffY = startY - currentY;
            
            // Vertical scroll should take precedence
            if (Math.abs(diffY) > Math.abs(diffX)) {
                return;
            }
            
            e.preventDefault();
        }, { passive: false });
        
        carousel.addEventListener('touchend', (e) => {
            if (!isDragging) return;
            
            carousel.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            
            const endX = e.changedTouches[0].clientX;
            const diffX = startX - endX;
            const visibleItems = this.getVisibleItemsCount();
            const maxIndex = Math.max(0, items.length - visibleItems);
            
            // Minimum swipe distance (responsive)
            const minSwipeDistance = window.innerWidth < 768 ? 30 : 50;
            
            if (Math.abs(diffX) > minSwipeDistance) {
                if (diffX > 0 && currentIndex < maxIndex) {
                    // Swiped left - next
                    currentIndex++;
                    updateCarousel();
                    this.trackEvent('product_carousel_swipe_next');
                } else if (diffX < 0 && currentIndex > 0) {
                    // Swiped right - previous
                    currentIndex--;
                    updateCarousel();
                    this.trackEvent('product_carousel_swipe_prev');
                }
            }
            
            isDragging = false;
        }, { passive: true });
        
        // Keyboard navigation
        carousel.addEventListener('keydown', (e) => {
            const visibleItems = this.getVisibleItemsCount();
            const maxIndex = Math.max(0, items.length - visibleItems);
            
            if (e.key === 'ArrowLeft' && currentIndex > 0) {
                currentIndex--;
                updateCarousel();
                this.trackEvent('product_carousel_key_prev');
            } else if (e.key === 'ArrowRight' && currentIndex < maxIndex) {
                currentIndex++;
                updateCarousel();
                this.trackEvent('product_carousel_key_next');
            }
        });
        
        // Auto-play with pause on interaction
        let autoPlayInterval;
        let hasUserInteracted = false;
        
        const startAutoPlay = () => {
            if (hasUserInteracted) return; // Don't auto-play if user has interacted
            
            autoPlayInterval = setInterval(() => {
                const visibleItems = this.getVisibleItemsCount();
                const maxIndex = Math.max(0, items.length - visibleItems);
                
                if (currentIndex < maxIndex) {
                    currentIndex++;
                } else {
                    currentIndex = 0;
                }
                updateCarousel();
            }, 4000);
        };
        
        const stopAutoPlay = () => {
            if (autoPlayInterval) {
                clearInterval(autoPlayInterval);
                autoPlayInterval = null;
            }
        };
        
        // Stop auto-play on user interaction
        [prevBtn, nextBtn].forEach(btn => {
            btn.addEventListener('click', () => {
                hasUserInteracted = true;
                stopAutoPlay();
            });
        });
        
        carousel.addEventListener('touchstart', () => {
            hasUserInteracted = true;
            stopAutoPlay();
        });
        
        // Pause auto-play on hover
        carousel.addEventListener('mouseenter', stopAutoPlay);
        carousel.addEventListener('mouseleave', () => {
            if (!hasUserInteracted) startAutoPlay();
        });
        
        // Handle window resize
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                updateCarousel();
            }, 150);
        });
        
        // Initialize
        updateCarousel();
        
        // Start auto-play after a delay
        setTimeout(() => {
            if (!hasUserInteracted) startAutoPlay();
        }, 2000);
    }
    
    getVisibleItemsCount() {
        const screenWidth = window.innerWidth;
        if (screenWidth < 768) return 1; // Mobile: 1 column
        if (screenWidth < 992) return 2; // Tablet: 2 columns (md-6)
        if (screenWidth < 1200) return 3; // Large: 3 columns (lg-4)
        return 4; // Desktop XL: 4 columns (xl-3)
    }
    
    // Image Error Handling
    handleImageError(img) {
        if (img.dataset.fallback) {
            img.src = img.dataset.fallback;
        } else {
            img.src = '/assets/images/thumbs/default-product.jpg';
        }
        img.classList.add('image-error');
    }
    
    handleImageSuccess(img) {
        img.classList.add('image-loaded');
        img.classList.remove('loading');
    }
}

// Initialize Supplier Profile Manager
let supplierProfile;

document.addEventListener('DOMContentLoaded', function() {
    supplierProfile = new SupplierProfileManager();
    // Global functions for backward compatibility
    window.openContactModal = () => supplierProfile.openContactModal();
    window.requestQuote = () => supplierProfile.requestQuote();
    window.contactSupplier = (id) => supplierProfile.contactSupplier(id);
    
    window.addToInquiry = (id) => supplierProfile.addToInquiry(id);
    window.saveSupplier = (id) => supplierProfile.saveSupplier(id);
    window.shareSupplier = (id) => supplierProfile.shareSupplier(id);
    window.reportSupplier = (id) => supplierProfile.reportSupplier(id);
    window.submitInquiry = () => supplierProfile.handleContactSubmit(new Event('submit'));
    window.handleImageError = (img) => supplierProfile.handleImageError(img);
    window.handleImageSuccess = (img) => supplierProfile.handleImageSuccess(img);
    window.showAllProducts = () => {
        const supplierId = supplierProfile.getCurrentSupplierId();
        if (supplierId) {
            window.location.href = `/all-product?manufacturer=${supplierId}`;
        } else {
            // Fallback - try to get supplier ID from page data
            const supplierIdEl = document.querySelector('[data-supplier-id]');
            if (supplierIdEl) {
                const id = supplierIdEl.getAttribute('data-supplier-id');
                window.location.href = `/all-product?manufacturer=${id}`;
            } else {
                window.location.href = '/all-product';
            }
        }
    };
});

// Professional product navigation function
function navigateToProduct(productUrl) {
    if (productUrl && productUrl.trim() !== '') {
        // Add loading state to card
        const clickedCard = event?.currentTarget;
        if (clickedCard) {
            clickedCard.style.opacity = '0.7';
            clickedCard.style.transform = 'scale(0.98)';
        }
        
        // Navigate with a slight delay for visual feedback
        setTimeout(() => {
            window.location.href = productUrl;
        }, 150);
    } else {
        // console.error('❌ Invalid product URL provided');
    }
}

// Initialize Supplier Profile Manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the supplier profile manager
    window.supplierProfile = new SupplierProfileManager();
    
    // Debug log for carousel
    const carousel = document.getElementById('productsCarousel');
    const items = carousel?.querySelectorAll('.product-carousel-item');
    
    if (carousel && items) {
        
        // Add additional click handlers for accessibility
        items.forEach((item, index) => {
            const card = item.querySelector('.product-item');
            if (card) {
                // Add keyboard support
                card.setAttribute('tabindex', '0');
                card.setAttribute('role', 'button');
                card.setAttribute('aria-label', `View product details`);
                
                // Keyboard navigation
                card.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        card.click();
                    }
                });
                
            }
        });
    } else {
    }
});
