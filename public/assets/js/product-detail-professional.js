/**
 * PROFESSIONAL B2B PRODUCT DETAIL - ALIBABA STYLE
 * Senior Software Engineer Implementation
 * Advanced JavaScript with Modern ES6+ Features
 */

class ProfessionalProductDetail {
  constructor() {
    this.logger = console;
    this.isInitialized = false;
    this.currentImageIndex = 0;
    this.currentTab = 'description';
    this.quantity = 1;
    this.favoritesList = this.getFavorites();
    this.compareList = this.getCompareList();
    
    // Professional configuration
    this.config = {
      maxQuantity: 999999,
      minQuantity: 1,
      debounceDelay: 300,
      animationDuration: 300,
      toastDuration: 5000,
      apiEndpoints: {
        inquiry: '/api/inquiries',
        analytics: '/api/analytics/track',
        favorite: '/api/favorites',
        compare: '/api/compare'
      }
    };

    // Modern event controllers for cleanup
    this.controllers = {
      scroll: new AbortController(),
      resize: new AbortController(),
      main: new AbortController()
    };

    this.init();
  }

  /**
   * Initialize all professional functionality
   */
  async init() {
    try {
    
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        await new Promise(resolve => {
          document.addEventListener('DOMContentLoaded', resolve, { once: true });
        });
      }

      // Initialize core modules
      await this.initializeModules();
      
      // Track page analytics
      this.trackPageView();
      
      this.isInitialized = true;
       
    } catch (error) {
      this.logger.error('❌ Failed to initialize Product Detail:', error);
      this.showErrorToast('Failed to initialize page. Please refresh.');
    }
  }

  /**
   * Initialize all modules
   */
  async initializeModules() {
    const modules = [
      this.initializeImageGallery.bind(this),
      this.initializeQuantityControls.bind(this),
      this.initializeTabs.bind(this),
      this.initializeModals.bind(this),
      this.initializeForms.bind(this),
      this.initializeActions.bind(this),
      this.initializeKeyboardShortcuts.bind(this),
      this.initializeResponsiveFeatures.bind(this)
    ];

    // Initialize modules in parallel for better performance
    await Promise.allSettled(modules.map(module => module()));
  }

  /**
   * Professional Image Gallery with advanced features
   */
  initializeImageGallery() {
    const mainImage = document.getElementById('mainProductImage');
    const thumbnails = document.querySelectorAll('.thumbnail-item');
    const imageTools = document.querySelectorAll('.image-tool-btn');

    if (!mainImage || thumbnails.length === 0) return;

    // Thumbnail click handlers
    thumbnails.forEach((thumbnail, index) => {
      thumbnail.addEventListener('click', () => {
        this.switchImage(index);
      }, { signal: this.controllers.main.signal });
    });

    // Image tool handlers
    imageTools.forEach(tool => {
      if (tool.classList.contains('zoom-btn')) {
        tool.addEventListener('click', this.zoomImage.bind(this), 
          { signal: this.controllers.main.signal });
      } else if (tool.classList.contains('favorite-btn')) {
        tool.addEventListener('click', this.toggleFavorite.bind(this), 
          { signal: this.controllers.main.signal });
      } else if (tool.classList.contains('share-btn')) {
        tool.addEventListener('click', this.shareProduct.bind(this), 
          { signal: this.controllers.main.signal });
      }
    });

    // Keyboard navigation for gallery
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName.toLowerCase() === 'input') return;
      
      if (e.key === 'ArrowLeft') {
        this.previousImage();
      } else if (e.key === 'ArrowRight') {
        this.nextImage();
      }
    }, { signal: this.controllers.main.signal });

    // Touch/swipe support for mobile
    this.initializeTouchGallery(mainImage);
  }

  /**
   * Switch to specific image
   */
  switchImage(index) {
    const mainImage = document.getElementById('mainProductImage');
    const thumbnails = document.querySelectorAll('.thumbnail-item');
    
    if (!mainImage || index < 0 || index >= thumbnails.length) return;

    const thumbnail = thumbnails[index];
    const newImageUrl = thumbnail.dataset.image;

    // Update main image with smooth transition
    mainImage.style.opacity = '0.5';
    setTimeout(() => {
      mainImage.src = newImageUrl;
      mainImage.style.opacity = '1';
    }, 150);

    // Update thumbnails
    thumbnails.forEach(thumb => thumb.classList.remove('active'));
    thumbnail.classList.add('active');

    this.currentImageIndex = index;

    // Track analytics
    this.trackEvent('image_view', {
      imageIndex: index,
      imageUrl: newImageUrl
    });
  }

  /**
   * Navigate to previous image
   */
  previousImage() {
    const thumbnails = document.querySelectorAll('.thumbnail-item');
    const prevIndex = this.currentImageIndex > 0 ? 
      this.currentImageIndex - 1 : thumbnails.length - 1;
    this.switchImage(prevIndex);
  }

  /**
   * Navigate to next image
   */
  nextImage() {
    const thumbnails = document.querySelectorAll('.thumbnail-item');
    const nextIndex = this.currentImageIndex < thumbnails.length - 1 ? 
      this.currentImageIndex + 1 : 0;
    this.switchImage(nextIndex);
  }

  /**
   * Initialize touch gestures for mobile gallery
   */
  initializeTouchGallery(element) {
    let startX = 0;
    let startY = 0;
    let threshold = 50;

    element.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true, signal: this.controllers.main.signal });

    element.addEventListener('touchmove', (e) => {
      e.preventDefault();
    }, { signal: this.controllers.main.signal });

    element.addEventListener('touchend', (e) => {
      if (!startX || !startY) return;

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      
      const diffX = startX - endX;
      const diffY = startY - endY;

      // Determine if horizontal swipe
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > threshold) {
        if (diffX > 0) {
          this.nextImage();
        } else {
          this.previousImage();
        }
      }

      startX = 0;
      startY = 0;
    }, { signal: this.controllers.main.signal });
  }

  /**
   * Zoom image functionality
   */
  zoomImage() {
    const mainImage = document.getElementById('mainProductImage');
    if (!mainImage) return;

    // Create zoom modal
    const modal = document.createElement('div');
    modal.className = 'zoom-modal';
    modal.innerHTML = `
      <div class="zoom-overlay">
        <button class="zoom-close" aria-label="Close zoom">
          <i class="fas fa-times"></i>
        </button>
        <img src="${mainImage.src}" alt="${mainImage.alt}" class="zoom-image">
        <div class="zoom-controls">
          <button class="zoom-out" title="Zoom Out">
            <i class="fas fa-search-minus"></i>
          </button>
          <button class="zoom-in" title="Zoom In">
            <i class="fas fa-search-plus"></i>
          </button>
          <button class="zoom-reset" title="Reset Zoom">
            <i class="fas fa-expand-arrows-alt"></i>
          </button>
        </div>
      </div>
    `;

    // Add zoom modal styles
    const style = document.createElement('style');
    style.textContent = `
      .zoom-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.95);
        z-index: 2000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease;
      }
      
      .zoom-overlay {
        position: relative;
        max-width: 90vw;
        max-height: 90vh;
        overflow: hidden;
      }
      
      .zoom-image {
        max-width: 100%;
        max-height: 90vh;
        object-fit: contain;
        transition: transform 0.3s ease;
        cursor: move;
      }
      
      .zoom-close {
        position: absolute;
        top: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        border: none;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 50%;
        color: #333;
        cursor: pointer;
        font-size: 1.25rem;
        z-index: 2001;
      }
      
      .zoom-controls {
        position: absolute;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 10px;
        z-index: 2001;
      }
      
      .zoom-controls button {
        width: 50px;
        height: 50px;
        border: none;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 50%;
        color: #333;
        cursor: pointer;
        font-size: 1.1rem;
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(modal);

    // Initialize zoom functionality
    let scale = 1;
    const zoomImage = modal.querySelector('.zoom-image');
    const zoomIn = modal.querySelector('.zoom-in');
    const zoomOut = modal.querySelector('.zoom-out');
    const zoomReset = modal.querySelector('.zoom-reset');
    const zoomClose = modal.querySelector('.zoom-close');

    // Zoom controls
    zoomIn.onclick = () => {
      scale = Math.min(scale * 1.2, 3);
      zoomImage.style.transform = `scale(${scale})`;
    };

    zoomOut.onclick = () => {
      scale = Math.max(scale / 1.2, 0.5);
      zoomImage.style.transform = `scale(${scale})`;
    };

    zoomReset.onclick = () => {
      scale = 1;
      zoomImage.style.transform = `scale(${scale})`;
    };

    // Close modal
    const closeModal = () => {
      modal.remove();
      style.remove();
    };

    zoomClose.onclick = closeModal;
    modal.onclick = (e) => {
      if (e.target === modal) closeModal();
    };

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    }, { once: true });

    this.trackEvent('image_zoom', { imageUrl: mainImage.src });
  }

  /**
   * Professional quantity controls
   */
  initializeQuantityControls() {
    const quantityInput = document.getElementById('productQuantity');
    const decreaseBtn = document.querySelector('.quantity-btn.decrease');
    const increaseBtn = document.querySelector('.quantity-btn.increase');

    if (!quantityInput) return;

    // Get product constraints
    const minQty = parseInt(quantityInput.min) || this.config.minQuantity;
    const maxQty = parseInt(quantityInput.max) || this.config.maxQuantity;
    
    this.quantity = parseInt(quantityInput.value) || minQty;

    // Decrease quantity
    decreaseBtn?.addEventListener('click', () => {
      if (this.quantity > minQty) {
        this.quantity--;
        this.updateQuantity();
      }
    }, { signal: this.controllers.main.signal });

    // Increase quantity
    increaseBtn?.addEventListener('click', () => {
      if (this.quantity < maxQty) {
        this.quantity++;
        this.updateQuantity();
      }
    }, { signal: this.controllers.main.signal });

    // Direct input with validation
    quantityInput.addEventListener('input', this.debounce((e) => {
      const value = parseInt(e.target.value);
      if (!isNaN(value) && value >= minQty && value <= maxQty) {
        this.quantity = value;
        this.updateQuantity();
      }
    }, this.config.debounceDelay), { signal: this.controllers.main.signal });

    // Keyboard shortcuts
    quantityInput.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        increaseBtn?.click();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        decreaseBtn?.click();
      }
    }, { signal: this.controllers.main.signal });
  }

  /**
   * Update quantity display and related prices
   */
  updateQuantity() {
    const quantityInput = document.getElementById('productQuantity');
    if (quantityInput) {
      quantityInput.value = this.quantity;
    }

    // Update bulk pricing highlight
    this.updateBulkPricingHighlight();

    // Track quantity change
    this.trackEvent('quantity_change', { 
      quantity: this.quantity,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Highlight applicable bulk pricing tier
   */
  updateBulkPricingHighlight() {
    const bulkTiers = document.querySelectorAll('.bulk-tier');
    
    bulkTiers.forEach(tier => {
      tier.classList.remove('highlighted');
      
      // Check if current quantity falls in this tier
      const tierText = tier.querySelector('.tier-quantity').textContent;
      const match = tierText.match(/(\d+)\s*(?:-\s*(\d+))?/);
      
      if (match) {
        const minQty = parseInt(match[1]);
        const maxQty = match[2] ? parseInt(match[2]) : Infinity;
        
        if (this.quantity >= minQty && this.quantity <= maxQty) {
          tier.classList.add('highlighted');
        }
      }
    });
  }

  /**
   * Initialize professional tabs system
   */
  initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tabId = button.dataset.tab;
        this.switchTab(tabId);
      }, { signal: this.controllers.main.signal });
    });

    // Initialize first tab
    if (tabButtons.length > 0) {
      this.switchTab(tabButtons[0].dataset.tab);
    }
  }

  /**
   * Switch to specific tab
   */
  switchTab(tabId) {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    // Update buttons
    tabButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    // Update content
    tabContents.forEach(content => {
      content.classList.toggle('active', content.id === `${tabId}-tab`);
    });

    this.currentTab = tabId;

    // Load tab-specific content if needed
    if (tabId === 'reviews') {
      this.loadReviews();
    }

    // Track tab view
    this.trackEvent('tab_view', { 
      tab: tabId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Initialize modal system
   */
  initializeModals() {
    // Modal triggers
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-modal]');
      if (trigger) {
        e.preventDefault();
        const modalId = trigger.dataset.modal;
        this.openModal(modalId);
      }

      // Modal close buttons
      const closeBtn = e.target.closest('.modal-close');
      if (closeBtn) {
        e.preventDefault();
        const modal = closeBtn.closest('.modal-overlay');
        if (modal) {
          this.closeModal(modal.id);
        }
      }
    }, { signal: this.controllers.main.signal });

    // Close modal on overlay click
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay')) {
        this.closeModal(e.target.id);
      }
    }, { signal: this.controllers.main.signal });

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal-overlay.active');
        if (activeModal) {
          this.closeModal(activeModal.id);
        }
      }
    }, { signal: this.controllers.main.signal });
  }

  /**
   * Open modal with professional animations
   */
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Focus management
    const firstFocusable = modal.querySelector('input, button, textarea, select');
    if (firstFocusable) {
      setTimeout(() => firstFocusable.focus(), 100);
    }

    this.trackEvent('modal_open', { modalId });
  }

  /**
   * Close modal with cleanup
   */
  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.classList.remove('active');
    document.body.style.overflow = '';

    this.trackEvent('modal_close', { modalId });
  }

  /**
   * Initialize professional forms
   */
  initializeForms() {
    const forms = document.querySelectorAll('.professional-form');
    
    forms.forEach(form => {
      form.addEventListener('submit', this.handleFormSubmit.bind(this), 
        { signal: this.controllers.main.signal });
      
      // Real-time validation
      const inputs = form.querySelectorAll('input, textarea, select');
      inputs.forEach(input => {
        input.addEventListener('blur', this.validateField.bind(this), 
          { signal: this.controllers.main.signal });
      });
    });
  }

  /**
   * Handle form submission with professional validation
   */
  async handleFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Validate all fields
    const isValid = this.validateForm(form);
    if (!isValid) {
      this.showErrorToast('Please fix the errors before submitting.');
      return;
    }

    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    submitBtn.disabled = true;

    try {
      // Submit form based on type
      if (form.id === 'inquiryForm') {
        await this.submitInquiry(data);
      }
      
      this.showSuccessToast('Your inquiry has been sent successfully!');
      this.closeModal('inquiryModal');
      form.reset();
      
    } catch (error) {
      this.logger.error('Form submission error:', error);
      this.showErrorToast('Failed to send inquiry. Please try again.');
    } finally {
      // Restore button state
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  }

  /**
   * Validate individual form field
   */
  validateField(e) {
    const field = e.target;
    const value = field.value.trim();
    let isValid = true;
    let message = '';

    // Remove existing error state
    this.clearFieldError(field);

    // Required field validation
    if (field.required && !value) {
      isValid = false;
      message = 'This field is required.';
    }
    
    // Email validation
    else if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        isValid = false;
        message = 'Please enter a valid email address.';
      }
    }
    
    // Phone validation
    else if (field.type === 'tel' && value) {
      const phoneRegex = /^\+?[\d\s\-\(\)]{7,}$/;
      if (!phoneRegex.test(value)) {
        isValid = false;
        message = 'Please enter a valid phone number.';
      }
    }
    
    // Number validation
    else if (field.type === 'number' && value) {
      const num = parseFloat(value);
      const min = parseFloat(field.min);
      const max = parseFloat(field.max);
      
      if (isNaN(num)) {
        isValid = false;
        message = 'Please enter a valid number.';
      } else if (min !== null && num < min) {
        isValid = false;
        message = `Value must be at least ${min}.`;
      } else if (max !== null && num > max) {
        isValid = false;
        message = `Value must be at most ${max}.`;
      }
    }

    if (!isValid) {
      this.showFieldError(field, message);
    }

    return isValid;
  }

  /**
   * Validate entire form
   */
  validateForm(form) {
    const fields = form.querySelectorAll('input, textarea, select');
    let isValid = true;

    fields.forEach(field => {
      const fieldValid = this.validateField({ target: field });
      if (!fieldValid) isValid = false;
    });

    return isValid;
  }

  /**
   * Show field error state
   */
  showFieldError(field, message) {
    field.classList.add('error');
    
    // Remove existing error message
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
      existingError.remove();
    }

    // Add error message
    const errorElement = document.createElement('span');
    errorElement.className = 'field-error';
    errorElement.textContent = message;
    errorElement.style.cssText = `
      color: var(--danger-600);
      font-size: var(--text-sm);
      margin-top: var(--space-1);
      display: block;
    `;
    
    field.parentNode.appendChild(errorElement);
  }

  /**
   * Clear field error state
   */
  clearFieldError(field) {
    field.classList.remove('error');
    const errorElement = field.parentNode.querySelector('.field-error');
    if (errorElement) {
      errorElement.remove();
    }
  }

  /**
   * Submit inquiry form
   */
  async submitInquiry(data) {
    // Add additional data
    data.productId = this.getProductId();
    data.quantity = this.quantity;
    data.timestamp = new Date().toISOString();
    data.userAgent = navigator.userAgent;
    data.pageUrl = window.location.href;

    const response = await fetch(this.config.apiEndpoints.inquiry, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Track inquiry submission
    this.trackEvent('inquiry_submit', {
      productId: data.productId,
      quantity: data.quantity,
      company: data.company,
      inquiryId: result.inquiryId
    });

    return result;
  }

  /**
   * Initialize action buttons
   */
  initializeActions() {
    // Inquiry button
    const inquiryBtn = document.querySelector('.inquiry-btn');
    inquiryBtn?.addEventListener('click', () => {
      this.openModal('inquiryModal');
      this.prefillInquiryForm();
    }, { signal: this.controllers.main.signal });

    // Chat button - disabled to prevent conflicts with main page handler
    // const chatBtn = document.querySelector('.chat-btn');
    // chatBtn?.addEventListener('click', this.startChat.bind(this), 
    //   { signal: this.controllers.main.signal });
    // Sample request button
   
    const sampleBtn = document.querySelector('.sample-btn');
    sampleBtn?.addEventListener('click', this.requestSample.bind(this), 
      { signal: this.controllers.main.signal });

    // Favorite toggle
    const favoriteToggles = document.querySelectorAll('.favorite-toggle, .favorite-btn');
    favoriteToggles.forEach(btn => {
      btn.addEventListener('click', this.toggleFavorite.bind(this), 
        { signal: this.controllers.main.signal });
    });

    // Compare toggle
    const compareToggle = document.querySelector('.compare-toggle');
    compareToggle?.addEventListener('click', this.toggleCompare.bind(this), 
      { signal: this.controllers.main.signal });

    // Share product
    const shareButtons = document.querySelectorAll('.share-product, .share-btn');
    shareButtons.forEach(btn => {
      btn.addEventListener('click', this.shareProduct.bind(this), 
        { signal: this.controllers.main.signal });
    });

    // Contact supplier
    const contactBtn = document.querySelector('.contact-supplier-btn');
    contactBtn?.addEventListener('click', this.contactSupplier.bind(this), 
      { signal: this.controllers.main.signal });

    // Write review
    const writeReviewBtn = document.querySelector('.write-review-btn');
    writeReviewBtn?.addEventListener('click', this.writeReview.bind(this), 
      { signal: this.controllers.main.signal });
  }

  /**
   * Prefill inquiry form with product data
   */
  prefillInquiryForm() {
    const form = document.getElementById('inquiryForm');
    if (!form) return;

    // Set quantity
    const quantityInput = form.querySelector('input[name="quantity"]');
    if (quantityInput) {
      quantityInput.value = this.quantity;
    }

    // Set product ID
    const productIdInput = form.querySelector('input[name="productId"]');
    if (productIdInput) {
      productIdInput.value = this.getProductId();
    }

    // Set supplier ID
    const supplierIdInput = form.querySelector('input[name="supplierId"]');
    if (supplierIdInput) {
      supplierIdInput.value = this.getSupplierId();
    }

    // Generate default message
    const messageTextarea = form.querySelector('textarea[name="message"]');
    if (messageTextarea && !messageTextarea.value) {
      const productName = this.getProductName();
      messageTextarea.value = `I am interested in your ${productName}. Please provide me with:

1. Detailed quotation for ${this.quantity} units
2. Minimum order quantity and lead time
3. Available payment terms
4. Shipping options to my location
5. Product samples if available

Looking forward to your response.`;
    }
  }

  /**
   * Start chat with supplier - Updated for distributor messages
   */
  startChat() {
    const supplierId = this.getSupplierId();
    if (!supplierId) {
      this.showErrorToast('Unable to start chat. Supplier information not available.');
      return;
    }

    // Track chat initiation
    this.trackEvent('chat_start', {
      supplierId: supplierId,
      productId: this.getProductId()
    });

    // Redirect to buyer messages page with manufacturer parameter
    window.location.href = `/buyer/messages?manufacturer=${supplierId}`;
  }

  /**
   * Request product sample
   */
  requestSample() {
    this.showInfoToast('Sample request feature will be available soon!');
    
    this.trackEvent('sample_request', {
      productId: this.getProductId(),
      quantity: this.quantity
    });
  }

  /**
   * Toggle favorite status
   */
  toggleFavorite() {
    const productId = this.getProductId();
    const isFavorite = this.favoritesList.includes(productId);

    if (isFavorite) {
      this.favoritesList = this.favoritesList.filter(id => id !== productId);
      this.showInfoToast('Removed from favorites');
    } else {
      this.favoritesList.push(productId);
      this.showSuccessToast('Added to favorites');
    }

    this.saveFavorites();
    this.updateFavoriteButtons();

    this.trackEvent('favorite_toggle', {
      productId: productId,
      action: isFavorite ? 'remove' : 'add'
    });
  }

  /**
   * Toggle compare status
   */
  toggleCompare() {
    const productId = this.getProductId();
    const isInCompare = this.compareList.includes(productId);

    if (isInCompare) {
      this.compareList = this.compareList.filter(id => id !== productId);
      this.showInfoToast('Removed from comparison');
    } else {
      if (this.compareList.length >= 3) {
        this.showErrorToast('You can compare maximum 3 products');
        return;
      }
      this.compareList.push(productId);
      this.showSuccessToast('Added to comparison');
    }

    this.saveCompareList();
    this.updateCompareButtons();

    this.trackEvent('compare_toggle', {
      productId: productId,
      action: isInCompare ? 'remove' : 'add',
      compareCount: this.compareList.length
    });
  }

  /**
   * Share product
   */
  async shareProduct() {
    const productName = this.getProductName();
    const productUrl = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: productName,
          text: `Check out this product: ${productName}`,
          url: productUrl
        });
        
        this.trackEvent('product_share', {
          productId: this.getProductId(),
          method: 'native'
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          this.fallbackShare(productName, productUrl);
        }
      }
    } else {
      this.fallbackShare(productName, productUrl);
    }
  }

  /**
   * Fallback share options
   */
  fallbackShare(productName, productUrl) {
    // Copy to clipboard
    navigator.clipboard.writeText(productUrl).then(() => {
      this.showSuccessToast('Product link copied to clipboard!');
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = productUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      this.showSuccessToast('Product link copied to clipboard!');
    });

    this.trackEvent('product_share', {
      productId: this.getProductId(),
      method: 'clipboard'
    });
  }

  /**
   * Contact supplier
   */
  contactSupplier() {
    const supplierId = this.getSupplierId();
    if (!supplierId) {
      this.showErrorToast('Supplier information not available.');
      return;
    }

    this.openModal('inquiryModal');
    this.prefillInquiryForm();

    this.trackEvent('contact_supplier', {
      supplierId: supplierId,
      productId: this.getProductId()
    });
  }

  /**
   * Write review
   */
  writeReview() {
    this.showInfoToast('Review system will be available soon!');
    
    this.trackEvent('write_review_click', {
      productId: this.getProductId()
    });
  }

  /**
   * Load product reviews
   */
  async loadReviews() {
    const reviewsList = document.querySelector('.reviews-list');
    if (!reviewsList || reviewsList.dataset.loaded) return;

    try {
      // Show loading state
      reviewsList.innerHTML = `
        <div class="reviews-loading">
          <i class="fas fa-spinner fa-spin"></i>
          <span>Loading reviews...</span>
        </div>
      `;

      // Simulate API call (replace with actual endpoint)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // For now, show no reviews message
      reviewsList.innerHTML = `
        <div class="no-reviews">
          <i class="fas fa-star"></i>
          <p>No reviews yet</p>
          <p>Be the first to review this product</p>
        </div>
      `;

      reviewsList.dataset.loaded = 'true';

    } catch (error) {
      this.logger.error('Failed to load reviews:', error);
      reviewsList.innerHTML = `
        <div class="reviews-error">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Failed to load reviews</p>
        </div>
      `;
    }
  }



  /**
   * Initialize keyboard shortcuts
   */
  initializeKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ignore if user is typing in an input
      if (e.target.tagName.toLowerCase() === 'input' || 
          e.target.tagName.toLowerCase() === 'textarea') {
        return;
      }

      // Shortcuts
      switch (e.key.toLowerCase()) {
        case 'i':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            this.openModal('inquiryModal');
          }
          break;
        case 'f':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            this.toggleFavorite();
          }
          break;
        case 'c':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            this.toggleCompare();
          }
          break;
        case 's':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            this.shareProduct();
          }
          break;
      }
    }, { signal: this.controllers.main.signal });
  }

  /**
   * Initialize responsive features
   */
  initializeResponsiveFeatures() {
    // Mobile-specific features
    if (this.isMobile()) {
      this.initializeMobileFeatures();
    }

    // Handle viewport changes
    window.addEventListener('resize', this.debounce(() => {
      this.handleViewportChange();
    }, 250), { signal: this.controllers.resize.signal });
  }

  /**
   * Initialize mobile-specific features
   */
  initializeMobileFeatures() {
    // Add mobile class
    document.body.classList.add('mobile-device');

    // Mobile-optimized quantity controls
    const quantityInput = document.getElementById('productQuantity');
    if (quantityInput) {
      quantityInput.addEventListener('focus', () => {
        quantityInput.select();
      });
    }

    // Prevent zoom on form inputs
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.addEventListener('focus', () => {
        if (input.type !== 'range') {
          input.style.fontSize = '16px';
        }
      });
    });
  }

  /**
   * Handle viewport changes
   */
  handleViewportChange() {
    // Update mobile state
    const isMobile = this.isMobile();
    document.body.classList.toggle('mobile-device', isMobile);

    // Adjust gallery for mobile
    if (isMobile) {
      this.adjustMobileGallery();
    }
  }

  /**
   * Adjust gallery for mobile viewport
   */
  adjustMobileGallery() {
    const thumbnailGallery = document.querySelector('.thumbnail-gallery');
    if (!thumbnailGallery) return;

    // Ensure horizontal scrolling works on mobile
    thumbnailGallery.style.overflowX = 'auto';
    thumbnailGallery.style.scrollBehavior = 'smooth';
  }

  /**
   * Professional toast notifications
   */
  showToast(message, type = 'info', duration = this.config.toastDuration) {
    const toastContainer = document.getElementById('toastContainer') || this.createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = this.getToastIcon(type);
    toast.innerHTML = `
      <i class="${icon}"></i>
      <span>${message}</span>
    `;

    toastContainer.appendChild(toast);

    // Auto remove
    setTimeout(() => {
      toast.remove();
    }, duration);

    // Remove on click
    toast.addEventListener('click', () => toast.remove());
  }

  showSuccessToast(message) {
    this.showToast(message, 'success');
  }

  showErrorToast(message) {
    this.showToast(message, 'error');
  }

  showInfoToast(message) {
    this.showToast(message, 'info');
  }

  /**
   * Create toast container if it doesn't exist
   */
  createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
  }

  /**
   * Get appropriate icon for toast type
   */
  getToastIcon(type) {
    const icons = {
      success: 'fas fa-check-circle',
      error: 'fas fa-exclamation-circle',
      info: 'fas fa-info-circle',
      warning: 'fas fa-exclamation-triangle'
    };
    return icons[type] || icons.info;
  }

  /**
   * Professional analytics tracking
   */
  trackEvent(action, data = {}) {
    try {
      const eventData = {
        action,
        timestamp: new Date().toISOString(),
        page: 'product-details',
        productId: this.getProductId(),
        sessionId: this.getSessionId(),
        ...data
      };

      // Send to analytics endpoint
      fetch(this.config.apiEndpoints.analytics, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(eventData)
      }).catch(error => {
        this.logger.warn('Analytics tracking failed:', error);
      });

      // Google Analytics 4 integration
      if (typeof gtag !== 'undefined') {
        gtag('event', action, {
          event_category: 'product_details',
          event_label: data.productId || this.getProductId(),
          custom_parameters: data
        });
      }


    } catch (error) {
      this.logger.warn('Failed to track event:', error);
    }
  }

  /**
   * Track page view
   */
  trackPageView() {
    this.trackEvent('page_view', {
      productName: this.getProductName(),
      productCategory: this.getProductCategory(),
      price: this.getProductPrice(),
      currency: this.getProductCurrency(),
      supplierId: this.getSupplierId(),
      supplierName: this.getSupplierName()
    });
  }

  /**
   * Utility functions
   */
  debounce(func, delay) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  throttle(func, limit) {
    let inThrottle;
    return (...args) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  isMobile() {
    return window.innerWidth <= 768;
  }

  getProductId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id') || document.querySelector('[data-product-id]')?.dataset.productId;
  }

  getSupplierId() {
    return document.querySelector('[data-supplier-id]')?.dataset.supplierId ||
           document.querySelector('[data-manufacturer-id]')?.dataset.manufacturerId;
  }

  getProductName() {
    return document.querySelector('.product-title')?.textContent?.trim() || 'Unknown Product';
  }

  getProductCategory() {
    return document.querySelector('.breadcrumb-item:nth-last-child(2)')?.textContent?.trim() || 'Unknown Category';
  }

  getProductPrice() {
    const priceElement = document.querySelector('.price-amount');
    return priceElement ? parseFloat(priceElement.textContent.replace(/[^0-9.]/g, '')) : 0;
  }

  getProductCurrency() {
    return document.querySelector('.price-currency')?.textContent?.trim() || 'USD';
  }

  getSupplierName() {
    return document.querySelector('.supplier-name')?.textContent?.trim() || 'Unknown Supplier';
  }

  getSessionId() {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  /**
   * Local storage helpers
   */
  getFavorites() {
    try {
      return JSON.parse(localStorage.getItem('favorites') || '[]');
    } catch {
      return [];
    }
  }

  saveFavorites() {
    localStorage.setItem('favorites', JSON.stringify(this.favoritesList));
  }

  getCompareList() {
    try {
      return JSON.parse(localStorage.getItem('compareList') || '[]');
    } catch {
      return [];
    }
  }

  saveCompareList() {
    localStorage.setItem('compareList', JSON.stringify(this.compareList));
  }

  /**
   * Update UI elements
   */
  updateFavoriteButtons() {
    const productId = this.getProductId();
    const isFavorite = this.favoritesList.includes(productId);
    
    const favoriteButtons = document.querySelectorAll('.favorite-toggle, .favorite-btn');
    favoriteButtons.forEach(btn => {
      const icon = btn.querySelector('i');
      if (icon) {
        icon.className = isFavorite ? 'fas fa-heart' : 'far fa-heart';
      }
      btn.style.color = isFavorite ? 'var(--danger-500)' : '';
    });
  }

  updateCompareButtons() {
    const productId = this.getProductId();
    const isInCompare = this.compareList.includes(productId);
    
    const compareButtons = document.querySelectorAll('.compare-toggle');
    compareButtons.forEach(btn => {
      btn.style.color = isInCompare ? 'var(--info-500)' : '';
      const text = btn.querySelector('span');
      if (text) {
        text.textContent = isInCompare ? 'Remove from Compare' : 'Add to Compare';
      }
    });
  }

  /**
   * Cleanup when page unloads
   */
  destroy() {
    // Abort all event listeners
    Object.values(this.controllers).forEach(controller => {
      controller.abort();
    });

    this.logger.log('🧹 Professional Product Detail cleaned up');
  }
}

// Initialize when DOM is ready
const productDetail = new ProfessionalProductDetail();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (productDetail) {
    productDetail.destroy();
  }
});

// Global access for debugging
window.productDetail = productDetail;
