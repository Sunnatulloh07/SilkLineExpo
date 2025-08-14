/**
 * Alibaba-Style B2B E-commerce JavaScript
 * Professional Product Details Page
 * Senior Software Engineer Implementation
 */

// ========================================
// Global State Management
// ========================================

let currentTab = 'description';
let selectedQuantity = 1;
let currentImageIndex = 0;
let productImages = [];

// Get analytics data from server-side (already initialized in EJS template)
// No need to declare - window.window.analyticsData is set by the template

// ========================================
// Utility Functions
// ========================================

/**
 * Professional debounce function for performance optimization
 */
function debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
}

/**
 * Professional throttle function for scroll/resize events
 */
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

/**
 * Validate email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Format currency display
 */
function formatCurrency(amount, currency = 'USD') {
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    } catch (error) {
        return `$${parseFloat(amount).toFixed(2)}`;
    }
}

/**
 * Show professional notifications
 */
function showNotification(message, type = 'info', duration = 5000) {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.alibaba-notification');
    existingNotifications.forEach(notification => notification.remove());

    const notification = document.createElement('div');
    notification.className = `alibaba-notification alibaba-notification-${type}`;
    
    const icons = {
        success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"/>
        </svg>`,
        error: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"/>
        </svg>`,
        warning: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"/>
        </svg>`,
        info: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 16H12V12H11M12 8H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"/>
        </svg>`
    };

    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-icon">${icons[type] || icons.info}</div>
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2"/>
                </svg>
            </button>
        </div>
    `;

    // Add notification styles if not already present
    if (!document.querySelector('#alibaba-notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'alibaba-notification-styles';
        styles.textContent = `
            .alibaba-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
                padding: 16px;
                border-radius: 8px;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                animation: slideInRight 0.3s ease-out;
            }
            .alibaba-notification-success { background-color: #10B981; color: white; }
            .alibaba-notification-error { background-color: #EF4444; color: white; }
            .alibaba-notification-warning { background-color: #F59E0B; color: white; }
            .alibaba-notification-info { background-color: #3B82F6; color: white; }
            .notification-content {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .notification-icon { flex-shrink: 0; }
            .notification-message { flex: 1; font-weight: 500; }
            .notification-close {
                background: none;
                border: none;
                color: currentColor;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                opacity: 0.8;
                transition: opacity 0.2s;
            }
            .notification-close:hover { opacity: 1; }
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(styles);
    }

    document.body.appendChild(notification);

    // Auto remove after duration
    if (duration > 0) {
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideInRight 0.3s ease-out reverse';
                setTimeout(() => notification.remove(), 300);
            }
        }, duration);
    }
}

// ========================================
// Analytics & Tracking
// ========================================

/**
 * Professional analytics tracking
 */
function trackEvent(action, data = {}) {
    try {
        const eventData = {
            action,
            timestamp: new Date().toISOString(),
            page: 'product-details',
            ...window.analyticsData,
            ...data
        };

        // Google Analytics 4
        if (typeof gtag !== 'undefined') {
            gtag('event', action, {
                event_category: 'product',
                event_label: window.analyticsData.productName,
                value: data.value || window.analyticsData.price,
                currency: window.analyticsData.currency,
                custom_parameters: data
            });
        }

        // Custom analytics endpoint (B2B specific)
        fetch('/api/analytics/track', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(eventData)
        }).catch(error => {
            console.debug('Analytics tracking failed:', error);
        });

        console.log('📊 Event tracked:', action, eventData);
    } catch (error) {
        console.warn('Analytics tracking error:', error);
    }
}

/**
 * Track page engagement metrics
 */
function initializeEngagementTracking() {
    const startTime = Date.now();
    let maxScrollDepth = 0;
    let hasScrolled = false;

    // Track scroll depth
    const trackScrollDepth = throttle(() => {
        const scrollDepth = Math.round(
            (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
        );
        
        if (scrollDepth > maxScrollDepth) {
            maxScrollDepth = scrollDepth;
            hasScrolled = true;
            
            // Track milestone scroll depths
            if (maxScrollDepth >= 25 && maxScrollDepth % 25 === 0) {
                trackEvent('scroll_depth', {
                    depth_percentage: maxScrollDepth
                });
            }
        }
    }, 1000);

    window.addEventListener('scroll', trackScrollDepth);

    // Track time on page
    window.addEventListener('beforeunload', () => {
        const timeOnPage = Math.round((Date.now() - startTime) / 1000);
        trackEvent('page_engagement', {
            time_on_page: timeOnPage,
            max_scroll_depth: maxScrollDepth,
            has_scrolled: hasScrolled
        });
    });

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            trackEvent('page_hidden');
        } else {
            trackEvent('page_visible');
        }
    });
}

// ========================================
// Image Gallery Functions
// ========================================

/**
 * Change main product image
 */
function changeMainImage(imageUrl, thumbnailElement) {
    try {
        const mainImage = document.getElementById('mainProductImage');
        if (!mainImage) return;

        // Update main image
        mainImage.src = imageUrl;
        
        // Update active thumbnail
        document.querySelectorAll('.thumbnail').forEach(thumb => {
            thumb.classList.remove('active');
        });
        
        if (thumbnailElement) {
            thumbnailElement.classList.add('active');
        }

        // Track image view
        trackEvent('image_view', {
            image_url: imageUrl
        });

    } catch (error) {
        console.error('Error changing main image:', error);
        showNotification('Failed to load image', 'error');
    }
}

/**
 * Open image zoom modal
 */
function openImageZoom() {
    try {
        const mainImage = document.getElementById('mainProductImage');
        if (!mainImage) return;

        const modal = createImageZoomModal(mainImage.src);
        document.body.appendChild(modal);
        
        setTimeout(() => modal.classList.add('active'), 10);
        document.body.style.overflow = 'hidden';

        trackEvent('image_zoom_open');
    } catch (error) {
        console.error('Error opening image zoom:', error);
        showNotification('Failed to open image zoom', 'error');
    }
}

/**
 * Create image zoom modal
 */
function createImageZoomModal(imageUrl) {
    const modal = document.createElement('div');
    modal.className = 'image-zoom-modal';
    modal.innerHTML = `
        <div class="zoom-modal-content">
            <div class="zoom-modal-header">
                <h3>Product Image</h3>
                <button class="modal-close-btn" onclick="closeImageZoom()">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2"/>
                    </svg>
                </button>
            </div>
            <div class="zoom-modal-body">
                <img src="${imageUrl}" alt="Product Image" class="zoom-image" 
                     onerror="this.src='/assets/images/placeholder-product.svg'">
            </div>
        </div>
    `;

    // Add modal styles if not present
    if (!document.querySelector('#image-zoom-styles')) {
        const styles = document.createElement('style');
        styles.id = 'image-zoom-styles';
        styles.textContent = `
            .image-zoom-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.9);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            }
            .image-zoom-modal.active {
                opacity: 1;
                visibility: visible;
            }
            .zoom-modal-content {
                max-width: 90vw;
                max-height: 90vh;
                background: white;
                border-radius: 8px;
                overflow: hidden;
                transform: scale(0.9);
                transition: transform 0.3s ease;
            }
            .image-zoom-modal.active .zoom-modal-content {
                transform: scale(1);
            }
            .zoom-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 24px;
                border-bottom: 1px solid #e0e0e0;
            }
            .zoom-modal-header h3 {
                margin: 0;
                color: #333;
            }
            .modal-close-btn {
                background: none;
                border: none;
                cursor: pointer;
                padding: 8px;
                border-radius: 4px;
                transition: background-color 0.2s;
            }
            .modal-close-btn:hover {
                background-color: #f5f5f5;
            }
            .zoom-modal-body {
                padding: 24px;
                text-align: center;
            }
            .zoom-image {
                max-width: 100%;
                max-height: 70vh;
                object-fit: contain;
            }
        `;
        document.head.appendChild(styles);
    }

    // Close on click outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeImageZoom();
        }
    });

    // Close on escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeImageZoom();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);

    return modal;
}

/**
 * Close image zoom modal
 */
function closeImageZoom() {
    const modal = document.querySelector('.image-zoom-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
    document.body.style.overflow = '';
}

// ========================================
// Quantity & Pricing Functions
// ========================================

/**
 * Adjust product quantity
 */
function adjustQuantity(change) {
    try {
        const quantityInput = document.getElementById('quantity');
        if (!quantityInput) return;

        const currentValue = parseInt(quantityInput.value) || 1;
        const minValue = parseInt(quantityInput.min) || 1;
        const maxValue = parseInt(quantityInput.max) || Infinity;
        
        const newValue = Math.max(minValue, Math.min(maxValue, currentValue + change));
        
        quantityInput.value = newValue;
        selectedQuantity = newValue;
        
        updatePricing();
        
        trackEvent('quantity_change', {
            new_quantity: newValue,
            change_amount: change
        });
    } catch (error) {
        console.error('Error adjusting quantity:', error);
    }
}

/**
 * Update pricing based on quantity and selection
 */
function updatePricing() {
    try {
        const quantityInput = document.getElementById('quantity');
        if (!quantityInput) return;

        const quantity = parseInt(quantityInput.value) || 1;
        const basePrice = window.analyticsData.price || 0;
        
        // Calculate total price (implement bulk pricing logic here)
        const totalPrice = basePrice * quantity;
        
        // Update price display if elements exist
        const totalPriceElement = document.querySelector('.total-price-display');
        if (totalPriceElement) {
            totalPriceElement.textContent = formatCurrency(totalPrice, window.analyticsData.currency);
        }
        
        // Update shipping cost based on location
        updateShippingCost();
        
    } catch (error) {
        console.error('Error updating pricing:', error);
    }
}

/**
 * Update shipping cost based on selected location
 */
function updateShippingCost() {
    try {
        const locationSelect = document.querySelector('.location-select');
        if (!locationSelect) return;

        const selectedLocation = locationSelect.value;
        const quantity = parseInt(document.getElementById('quantity')?.value) || 1;
        
        // Implement shipping cost calculation logic here
        // This would typically call an API endpoint
        
        trackEvent('shipping_location_change', {
            location: selectedLocation,
            quantity: quantity
        });
        
    } catch (error) {
        console.error('Error updating shipping cost:', error);
    }
}

// ========================================
// Tab Management
// ========================================

/**
 * Switch between product detail tabs
 */
function switchTab(tabName) {
    try {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeTabBtn = document.querySelector(`[onclick="switchTab('${tabName}')"]`);
        if (activeTabBtn) {
            activeTabBtn.classList.add('active');
        }
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        const activeTabContent = document.getElementById(`${tabName}-tab`);
        if (activeTabContent) {
            activeTabContent.classList.add('active');
        }
        
        currentTab = tabName;
        
        trackEvent('tab_switch', {
            tab_name: tabName
        });
        
    } catch (error) {
        console.error('Error switching tab:', error);
    }
}

// ========================================
// Business Actions
// ========================================

/**
 * Send inquiry to supplier
 */
function sendInquiry() {
    try {
        const modal = createInquiryModal();
        document.body.appendChild(modal);
        
        setTimeout(() => modal.classList.add('active'), 10);
        document.body.style.overflow = 'hidden';
        
        trackEvent('inquiry_modal_open');
    } catch (error) {
        console.error('Error opening inquiry modal:', error);
        showNotification('Failed to open inquiry form', 'error');
    }
}

/**
 * Create professional inquiry modal
 */
function createInquiryModal() {
    const modal = document.createElement('div');
    modal.className = 'inquiry-modal';
    modal.innerHTML = `
        <div class="inquiry-modal-content">
            <div class="inquiry-modal-header">
                <h3>Send Inquiry</h3>
                <button class="modal-close-btn" onclick="closeInquiryModal()">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2"/>
                    </svg>
                </button>
            </div>
            <div class="inquiry-modal-body">
                <form id="inquiryForm" onsubmit="submitInquiry(event)">
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="inquiry-name">Your Name *</label>
                            <input type="text" id="inquiry-name" name="name" required>
                        </div>
                        <div class="form-group">
                            <label for="inquiry-email">Email Address *</label>
                            <input type="email" id="inquiry-email" name="email" required>
                        </div>
                        <div class="form-group">
                            <label for="inquiry-company">Company Name</label>
                            <input type="text" id="inquiry-company" name="company">
                        </div>
                        <div class="form-group">
                            <label for="inquiry-phone">Phone Number</label>
                            <input type="tel" id="inquiry-phone" name="phone">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="inquiry-subject">Inquiry Type *</label>
                        <select id="inquiry-subject" name="subject" required>
                            <option value="">Select inquiry type</option>
                            <option value="product_details">Product Details</option>
                            <option value="pricing">Pricing & MOQ</option>
                            <option value="samples">Sample Request</option>
                            <option value="bulk_order">Bulk Order</option>
                            <option value="customization">Product Customization</option>
                            <option value="shipping">Shipping & Logistics</option>
                            <option value="partnership">Partnership</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="inquiry-quantity">Expected Quantity</label>
                        <input type="number" id="inquiry-quantity" name="quantity" 
                               value="${selectedQuantity}" min="1">
                        <small>Estimated quantity you're interested in</small>
                    </div>
                    <div class="form-group">
                        <label for="inquiry-message">Message *</label>
                        <textarea id="inquiry-message" name="message" rows="5" required 
                                  placeholder="Please provide details about your inquiry, requirements, or questions..."></textarea>
                    </div>
                    <input type="hidden" name="productId" value="${window.analyticsData.productId}">
                    <input type="hidden" name="supplierId" value="${window.analyticsData.supplierId}">
                </form>
            </div>
            <div class="inquiry-modal-footer">
                <button type="button" class="btn-outline" onclick="closeInquiryModal()">Cancel</button>
                <button type="submit" form="inquiryForm" class="btn-primary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z"/>
                        <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    Send Inquiry
                </button>
            </div>
        </div>
    `;

    // Add modal styles
    addModalStyles();

    // Close on click outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeInquiryModal();
        }
    });

    return modal;
}

/**
 * Submit inquiry form
 */
function submitInquiry(event) {
    event.preventDefault();
    
    try {
        const form = event.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Validate form
        if (!validateInquiryForm(data)) {
            return;
        }
        
        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<div class="spinner"></div> Sending...';
        
        // Submit inquiry
        fetch('/api/inquiries', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                showNotification('Inquiry sent successfully! The supplier will contact you soon.', 'success');
                closeInquiryModal();
                form.reset();
                
                trackEvent('inquiry_submitted', {
                    inquiry_type: data.subject,
                    expected_quantity: data.quantity
                });
            } else {
                throw new Error(result.message || 'Failed to send inquiry');
            }
        })
        .catch(error => {
            console.error('Inquiry submission error:', error);
            showNotification(error.message || 'Failed to send inquiry', 'error');
        })
        .finally(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        });
        
    } catch (error) {
        console.error('Error submitting inquiry:', error);
        showNotification('Failed to submit inquiry', 'error');
    }
}

/**
 * Validate inquiry form
 */
function validateInquiryForm(data) {
    const errors = [];
    
    if (!data.name || data.name.trim().length < 2) {
        errors.push('Name is required and must be at least 2 characters');
    }
    
    if (!data.email || !isValidEmail(data.email)) {
        errors.push('Valid email address is required');
    }
    
    if (!data.subject) {
        errors.push('Please select an inquiry type');
    }
    
    if (!data.message || data.message.trim().length < 10) {
        errors.push('Message is required and must be at least 10 characters');
    }
    
    if (errors.length > 0) {
        showNotification(errors.join('. '), 'error');
        return false;
    }
    
    return true;
}

/**
 * Close inquiry modal
 */
function closeInquiryModal() {
    const modal = document.querySelector('.inquiry-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
    document.body.style.overflow = '';
}

/**
 * Start chat with supplier
 */
function startChat() {
    try {
        // Implement chat functionality or redirect to chat platform
        trackEvent('chat_initiated');
        showNotification('Chat feature coming soon! Please use the inquiry form for now.', 'info');
    } catch (error) {
        console.error('Error starting chat:', error);
        showNotification('Failed to start chat', 'error');
    }
}

/**
 * Request product sample
 */
function requestSample() {
    try {
        // Pre-fill inquiry form with sample request
        sendInquiry();
        
        // Auto-select sample request type
        setTimeout(() => {
            const subjectSelect = document.getElementById('inquiry-subject');
            if (subjectSelect) {
                subjectSelect.value = 'samples';
            }
            
            const messageArea = document.getElementById('inquiry-message');
            if (messageArea) {
                messageArea.value = `I would like to request a sample of ${window.analyticsData.productName}. Please provide information about sample availability, cost, and shipping details.`;
            }
        }, 100);
        
        trackEvent('sample_request_initiated');
    } catch (error) {
        console.error('Error requesting sample:', error);
        showNotification('Failed to open sample request form', 'error');
    }
}

/**
 * Contact supplier directly
 */
function contactSupplier(supplierId) {
    try {
        if (!supplierId) {
            showNotification('Invalid supplier information', 'error');
            return;
        }
        
        // For now, open inquiry modal
        sendInquiry();
        
        trackEvent('contact_supplier_direct', {
            supplier_id: supplierId
        });
    } catch (error) {
        console.error('Error contacting supplier:', error);
        showNotification('Failed to contact supplier', 'error');
    }
}

/**
 * View company profile
 */
function viewCompanyProfile(companyId) {
    try {
        if (!companyId) {
            showNotification('Invalid company information', 'error');
            return;
        }
        
        trackEvent('company_profile_view', {
            company_id: companyId
        });
        
        // Open company profile in new tab
        window.open(`/company/${companyId}`, '_blank');
    } catch (error) {
        console.error('Error viewing company profile:', error);
        showNotification('Failed to open company profile', 'error');
    }
}

/**
 * Share product functionality
 */
function shareProduct() {
    try {
        const shareData = {
            title: window.analyticsData.productName,
            text: `Check out this product: ${window.analyticsData.productName}`,
            url: window.location.href
        };

        // Use Web Share API if available
        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
            navigator.share(shareData)
                .then(() => {
                    trackEvent('native_share_success');
                    showNotification('Product shared successfully!', 'success');
                })
                .catch(error => {
                    console.log('Share cancelled or failed:', error);
                    fallbackShare();
                });
        } else {
            fallbackShare();
        }

        trackEvent('share_product_initiated');
    } catch (error) {
        console.error('Error sharing product:', error);
        fallbackShare();
    }
}

/**
 * Fallback share functionality
 */
function fallbackShare() {
    try {
        // Copy URL to clipboard
        navigator.clipboard.writeText(window.location.href)
            .then(() => {
                showNotification('Product link copied to clipboard!', 'success');
                trackEvent('clipboard_share_success');
            })
            .catch(() => {
                // Fallback to manual copy
                const textArea = document.createElement('textarea');
                textArea.value = window.location.href;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                showNotification('Product link copied to clipboard!', 'success');
                trackEvent('manual_share_success');
            });
    } catch (error) {
        console.error('Fallback share error:', error);
        showNotification('Unable to share. Please copy the URL manually.', 'error');
    }
}

/**
 * Add to favorites
 */
function addToFavorites() {
    try {
        const favoriteBtn = document.querySelector('.add-to-favorites');
        if (!favoriteBtn) return;
        
        // Toggle favorite state
        favoriteBtn.classList.toggle('active');
        
        const isActive = favoriteBtn.classList.contains('active');
        const message = isActive ? 'Added to favorites' : 'Removed from favorites';
        
        showNotification(message, 'success');
        
        trackEvent(isActive ? 'add_to_favorites' : 'remove_from_favorites');
        
        // Store in localStorage for persistence
        const favorites = JSON.parse(localStorage.getItem('productFavorites') || '[]');
        if (isActive) {
            if (!favorites.includes(window.analyticsData.productId)) {
                favorites.push(window.analyticsData.productId);
            }
        } else {
            const index = favorites.indexOf(window.analyticsData.productId);
            if (index > -1) {
                favorites.splice(index, 1);
            }
        }
        localStorage.setItem('productFavorites', JSON.stringify(favorites));
        
    } catch (error) {
        console.error('Error managing favorites:', error);
        showNotification('Failed to update favorites', 'error');
    }
}

/**
 * Write product review
 */
function writeReview() {
    try {
        // Implement review modal or redirect to review page
        trackEvent('write_review_initiated');
        showNotification('Review feature coming soon!', 'info');
    } catch (error) {
        console.error('Error opening review form:', error);
        showNotification('Failed to open review form', 'error');
    }
}

// ========================================
// Modal Styles
// ========================================

/**
 * Add common modal styles
 */
function addModalStyles() {
    if (document.querySelector('#alibaba-modal-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'alibaba-modal-styles';
    styles.textContent = `
        .inquiry-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        }
        .inquiry-modal.active {
            opacity: 1;
            visibility: visible;
        }
        .inquiry-modal-content {
            max-width: 600px;
            width: 90%;
            max-height: 90vh;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            transform: scale(0.9);
            transition: transform 0.3s ease;
        }
        .inquiry-modal.active .inquiry-modal-content {
            transform: scale(1);
        }
        .inquiry-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 24px;
            border-bottom: 1px solid #e0e0e0;
            background-color: #fafafa;
        }
        .inquiry-modal-header h3 {
            margin: 0;
            color: #333;
            font-size: 20px;
        }
        .inquiry-modal-body {
            padding: 24px;
            max-height: 60vh;
            overflow-y: auto;
        }
        .inquiry-modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            padding: 20px 24px;
            border-top: 1px solid #e0e0e0;
            background-color: #fafafa;
        }
        .form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 16px;
        }
        .form-group {
            margin-bottom: 16px;
        }
        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #333;
        }
        .form-group input,
        .form-group select,
        .form-group textarea {
            width: 100%;
            padding: 12px;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            font-size: 16px;
            transition: border-color 0.2s;
        }
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
            outline: none;
            border-color: #ff6600;
            box-shadow: 0 0 0 3px rgba(255, 102, 0, 0.1);
        }
        .form-group small {
            display: block;
            margin-top: 4px;
            color: #666;
            font-size: 14px;
        }
        @media (max-width: 768px) {
            .form-grid {
                grid-template-columns: 1fr;
            }
            .inquiry-modal-content {
                width: 95%;
                margin: 20px;
            }
        }
    `;
    document.head.appendChild(styles);
}

// ========================================
// Initialization
// ========================================

/**
 * Initialize the Alibaba-style product details page
 */
function initializeProductDetails() {
    try {
        // Initialize analytics tracking
        initializeEngagementTracking();
        
        // Initialize quantity from URL or defaults
        const urlParams = new URLSearchParams(window.location.search);
        const quantityParam = urlParams.get('quantity');
        if (quantityParam) {
            const quantityInput = document.getElementById('quantity');
            if (quantityInput) {
                quantityInput.value = Math.max(1, parseInt(quantityParam));
                selectedQuantity = parseInt(quantityInput.value);
                updatePricing();
            }
        }
        
        // Initialize favorites state
        const favorites = JSON.parse(localStorage.getItem('productFavorites') || '[]');
        if (favorites.includes(window.analyticsData.productId)) {
            const favoriteBtn = document.querySelector('.favorite-btn');
            if (favoriteBtn) {
                favoriteBtn.classList.add('active');
            }
        }
        
        // Track page view
        trackEvent('page_view', {
            product_id: window.analyticsData.productId,
            product_name: window.analyticsData.productName,
            supplier_id: window.analyticsData.supplierId
        });
        
        console.log('🚀 Alibaba-style product details initialized');
        
    } catch (error) {
        console.error('Error initializing product details:', error);
    }
}

// ========================================
// Event Listeners
// ========================================

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeProductDetails);

// Handle quantity input changes
document.addEventListener('input', (e) => {
    if (e.target.id === 'quantity') {
        selectedQuantity = parseInt(e.target.value) || 1;
        updatePricing();
    }
});

// Handle form submissions
document.addEventListener('submit', (e) => {
    if (e.target.id === 'inquiryForm') {
        submitInquiry(e);
    }
});

// Global error handler
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    // Don't show error notifications for minor issues
});

// Export functions for global access
window.changeMainImage = changeMainImage;
window.openImageZoom = openImageZoom;
window.closeImageZoom = closeImageZoom;
window.adjustQuantity = adjustQuantity;
window.updatePricing = updatePricing;
window.updateShippingCost = updateShippingCost;
window.switchTab = switchTab;
window.sendInquiry = sendInquiry;
window.closeInquiryModal = closeInquiryModal;
window.startChat = startChat;
window.requestSample = requestSample;
window.contactSupplier = contactSupplier;
window.viewCompanyProfile = viewCompanyProfile;
window.addToFavorites = addToFavorites;
window.shareProduct = shareProduct;
window.writeReview = writeReview;

console.log('📦 Alibaba-style B2B product details JavaScript loaded successfully');
