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
    
    // Authentication properties
    this.isAuthenticated = false;
    this.currentUser = null;
    this.userType = null;
    this.companyType = null;
    this.productData = null;
    
    // Cache for auth status to avoid repeated API calls
    this.authStatusCache = {
      lastChecked: 0,
      cacheDuration: 30000, // 30 seconds
      isChecking: false
    };
    
    // Cache for product status to avoid repeated API calls
    this.productStatusCache = {
      lastChecked: 0,
      cacheDuration: 15000, // 15 seconds
      isChecking: false,
      data: null
    };
    
    // Prevent duplicate favorite toggle requests
    this.isTogglingFavorite = false;
    
    // Prevent duplicate inquiry submissions
    this.isSubmittingInquiry = false;
    
    // Professional configuration
    this.config = {
      maxQuantity: 999999,
      minQuantity: 1,
      debounceDelay: 300,
      animationDuration: 300,
      toastDuration: 5000,
      apiEndpoints: {
        inquiry: '/buyer/api/inquiries',
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
      
      // Initialize UI with role-based button control (includes auth check and product status)
      await this.initializeUI();
      
      // Bind quantity control events
      this.bindQuantityEvents();
      
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
      this.initializeInquiry.bind(this),
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
    const forms = document.querySelectorAll('.professional-form:not(#inquiryForm)');
    
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

    // Check if user is logged in for inquiry form
    // Inquiry form is handled separately in handleInquiryFormSubmit
    if (form.id === 'inquiryForm') {
      return; // Skip handling here, let handleInquiryFormSubmit handle it
    }

    // Validate all fields
    const isValid = this.validateForm(form);
    if (!isValid) {
      this.showErrorToast('Please fix the errors before submitting.');
      return;
    }

    // Show loading state
    let submitBtn = form.querySelector('button[type="submit"]');
    
    // If not found in form, look in modal footer
    if (!submitBtn) {
      const modal = document.getElementById('inquiryModal');
      if (modal) {
        submitBtn = modal.querySelector('button[type="submit"]');
      }
    }
    
    if (!submitBtn) {
      this.showErrorToast('Submit button not found');
      return;
    }
    
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    submitBtn.disabled = true;

    try {
      // Submit form based on type (inquiry form is handled separately)
      if (form.id !== 'inquiryForm') {
        // Handle other forms here if needed
      }
      
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
    try {
      // Get product data from page
      const productData = this.getProductData();
      const supplierData = this.getSupplierData();
      
      // Get user data from current instance
      const userData = this.currentUser || window.currentUser;
      
      // Prepare comprehensive inquiry data
      const inquiryData = {
        // Basic information
        name: data.name || userData?.name || '',
        company: data.company || userData?.companyName || '',
        email: data.email || userData?.email || '',
        phone: data.phone || userData?.phone || '',
        
        // Product information
        productId: data.productId || productData?.id || this.getProductIdFromDOM() || null,
        productName: productData?.name || '',
        productCategory: productData?.category || '',
        productPrice: productData?.price || null,
        productImage: productData?.image || '',
        
        // Supplier information
        supplierId: data.supplierId || supplierData?.id || null,
        supplierName: supplierData?.name || '',
        supplierCountry: supplierData?.country || '',
        
        // Inquiry details
        subject: this.generateInquirySubject(productData, data.requestedQuantity),
        message: data.message || '',
        type: 'product_inquiry',
        
        // Quantity and specifications (matching schema field names)
        requestedQuantity: parseInt(data.requestedQuantity) || 1,
        unit: data.unit || 'pieces',
        customSpecifications: data.customSpecifications || '',
        
        // Budget (matching schema field names)
        budgetMin: data.budgetMin ? parseFloat(data.budgetMin) : null,
        budgetMax: data.budgetMax ? parseFloat(data.budgetMax) : null,
        budgetCurrency: data.budgetCurrency || 'USD',
        
        // Timeline (matching schema field names)
        urgency: data.urgency || 'flexible',
        requiredBy: data.requiredBy || null,
        
        // Shipping (matching schema field names)
        shippingMethod: data.shippingMethod || 'standard',
        incoterms: data.incoterms || null,
        deliveryAddress: data.deliveryAddress || '',
        
        // Inquiry type (matching schema field names)
        inquiryType: data.inquiryType || 'product_inquiry',
        
        // Additional data
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        pageUrl: window.location.href,
        source: 'product_details_page'
      };

      // Validate required fields
      if (!inquiryData.email || !inquiryData.message || !inquiryData.supplierId) {
        throw new Error('Email, message, and supplier information are required');
      }

      const response = await fetch(this.config.apiEndpoints.inquiry, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify(inquiryData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Track inquiry submission
      this.trackEvent('inquiry_submit', {
        productId: inquiryData.productId,
        quantity: inquiryData.requestedQuantity,
        company: inquiryData.company,
        inquiryId: result.inquiryId || result.inquiry?._id
      });

      return result;

    } catch (error) {
      this.logger.error('Submit inquiry error:', error);
      throw error;
    }
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
    const quantityInput = form.querySelector('input[name="requestedQuantity"]');
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

  /**
   * Get comprehensive product data from page
   */
  getProductData() {
    try {
      const productData = {
        id: this.getProductId(),
        name: this.getProductName(),
        category: this.getProductCategory(),
        price: this.getProductPrice(),
        currency: this.getProductCurrency(),
        image: document.querySelector('#mainProductImage')?.src ||
               document.querySelector('.product-image')?.src ||
               document.querySelector('img[alt*="product"]')?.src ||
               null,
        description: document.querySelector('#product-description')?.textContent?.trim() ||
                    document.querySelector('.product-description')?.textContent?.trim() ||
                    null
      };

      return productData;
    } catch (error) {
      this.logger.error('❌ Error getting product data:', error);
      return {};
    }
  }

  /**
   * Get supplier data from page
   */
  getSupplierData() {
    try {
      const supplierData = {
        id: this.getSupplierId(),
        name: this.getSupplierName(),
        country: document.querySelector('[data-country]')?.dataset.country ||
                document.querySelector('.supplier-country')?.textContent?.trim() ||
                null,
        city: document.querySelector('[data-city]')?.dataset.city ||
              document.querySelector('.supplier-city')?.textContent?.trim() ||
              null
      };

      return supplierData;
    } catch (error) {
      this.logger.error('❌ Error getting supplier data:', error);
      return {};
    }
  }

  /**
   * Generate professional inquiry subject
   */
  generateInquirySubject(productData, quantity = 1) {
    const productName = productData?.name || 'Product';
    const quantityText = quantity > 1 ? ` (${quantity} pieces)` : '';
    return `Inquiry about ${productName}${quantityText}`;
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
   * Handle inquiry button click
   */
  async handleInquiryClick(e) {
    e.preventDefault();
    
    // Re-check authentication status first
    await this.checkAuthStatus();
    
    // Get user data from current instance
    const userData = this.currentUser || window.currentUser;
    
    // Check if user is logged in - check for _id, id, or userId
    const userId = userData?._id || userData?.id || userData?.userId;
    if (!userData || !userId) {
      this.showErrorToast('Iltimos, inquiry yuborish uchun tizimga kiring!');
      setTimeout(() => {
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
      }, 2000);
      return;
    }
    
    // Check if user is distributor/buyer
    // Use companyName or userType to determine if user is distributor
    const isBuyer = userData.role === 'company_admin' && 
                   (userData.companyType === 'distributor' || 
                    userData.companyType === 'buyer' ||
                    userData.userType === 'user' ||
                    userData.companyName); // If has companyName, likely a distributor
    
    if (!isBuyer) {
      this.showErrorToast('Faqat distribyutor/haridor kompaniyalar inquiry yubora oladi!');
      return;
    }
    // Open inquiry modal
    this.openInquiryModal();
  }

  /**
   * Open inquiry modal
   */
  openInquiryModal() {
    // Use professional modal system
    this.openModal('inquiryModal');
      
      // Pre-fill form with user data
      this.prefillInquiryForm();
      
      // Focus on first input field
    const modal = document.getElementById('inquiryModal');
    if (modal) {
      const firstInput = modal.querySelector('input[name="name"]');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
    }
  }

  /**
   * Close inquiry modal
   */
  closeInquiryModal() {
    const modal = document.getElementById('inquiryModal');
    
    if (modal) {
      modal.style.display = 'none';
      // Use same overflow restoration as professional modal system
      document.body.style.overflow = '';
    }
  }

  /**
   * Pre-fill inquiry form with user data
   */
  prefillInquiryForm() {
    // Get user data from current instance
    const userData = this.currentUser || window.currentUser;
    if (!userData) return;
    
    const form = document.getElementById('inquiryForm');
    if (!form) return;
    
    // Pre-fill user information
    const nameField = form.querySelector('[name="name"]');
    const companyField = form.querySelector('[name="company"]');
    const emailField = form.querySelector('[name="email"]');
    const phoneField = form.querySelector('[name="phone"]');
    
    if (nameField && userData.name) {
      nameField.value = userData.name;
    }
    
    if (companyField && userData.companyName) {
      companyField.value = userData.companyName;
    }
    
    if (emailField && userData.email) {
      emailField.value = userData.email;
    }
    
    if (phoneField && userData.phone) {
      phoneField.value = userData.phone;
    }
  }

  /**
   * Handle inquiry form submission
   */
  async handleInquiryFormSubmit(e) {
    e.preventDefault();
    e.stopPropagation();
    
    
    // Prevent duplicate submissions - check multiple conditions
    if (this.isSubmittingInquiry) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return false;
    }
    
    // Check if form is already being submitted
    const form = e.target;
    if (form.dataset.submitting === 'true') {
      e.preventDefault();
      e.stopImmediatePropagation();
      return false;
    }
    
    // Mark form as submitting
    form.dataset.submitting = 'true';
    this.isSubmittingInquiry = true;
    
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Get user data from current instance
    const userData = this.currentUser || window.currentUser;

    // Check if user is logged in - check for _id, id, or userId
    const userId = userData?._id || userData?.id || userData?.userId;
    if (!userData || !userId) {
      this.showErrorToast('Iltimos, inquiry yuborish uchun tizimga kiring!');
      setTimeout(() => {
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
      }, 2000);
      return;
    }
    
    // Check if user is distributor/buyer
    // Use companyName or userType to determine if user is distributor
    const isBuyer = userData.role === 'company_admin' && 
                   (userData.companyType === 'distributor' || 
                    userData.companyType === 'buyer' ||
                    userData.userType === 'user' ||
                    userData.companyName); // If has companyName, likely a distributor
    
    if (!isBuyer) {
      this.showErrorToast('Faqat distribyutor/haridor kompaniyalar inquiry yubora oladi!');
      return;
    }

    // Show loading state
    let submitBtn = form.querySelector('button[type="submit"]');
    
    // If not found in form, look in modal footer
    if (!submitBtn) {
      const modal = document.getElementById('inquiryModal');
      if (modal) {
        submitBtn = modal.querySelector('button[type="submit"]');
      }
    }
    
    if (!submitBtn) {
      this.showErrorToast('Submit button not found');
      return;
    }
    
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Yuborilmoqda...';
    submitBtn.disabled = true;

    try {
      // Submit inquiry
      await this.submitInquiry(data);
      
      this.showSuccessToast('✅ So\'rov muvaffaqiyatli yuborildi!');
      this.closeModal('inquiryModal');
      form.reset();
      
    } catch (error) {
      this.logger.error('Form submission error:', error);
      this.showErrorToast('So\'rov yuborishda xatolik. Qaytadan urinib ko\'ring.');
    } finally {
      // Restore button state
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
      
      // Reset submission flags
      this.isSubmittingInquiry = false;
      if (form) {
        form.dataset.submitting = 'false';
      }
    }
  }

  /**
   * Initialize inquiry functionality
   */
  initializeInquiry() {
    // Add event listeners for inquiry buttons
    const inquiryBtns = document.querySelectorAll('.inquiry-btn');
    
    inquiryBtns.forEach((btn) => {
      btn.addEventListener('click', this.handleInquiryClick.bind(this), 
        { signal: this.controllers.main.signal });
    });
    
    // Use professional modal system for inquiry modal
    // Event listeners are already handled by the main modal system
    
    // Add event listener for inquiry form submission
    const inquiryForm = document.getElementById('inquiryForm');
    
    if (inquiryForm) {
      // Remove any existing listeners first
      inquiryForm.removeEventListener('submit', this.handleInquiryFormSubmit.bind(this));
      
      // Add new listener
      inquiryForm.addEventListener('submit', this.handleInquiryFormSubmit.bind(this), 
        { signal: this.controllers.main.signal });
    }
  }

  /**
   * Add product to cart
   */
  async addToCart() {
    
    // Re-check authentication on click (force check for fresh status)
    await this.checkAuthStatus(true);
    
    
    if (!this.isAuthenticated) {
      this.showToast(`⚠️ Please login to add products to cart`, 'warning');
      setTimeout(() => {
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
      }, 2000);
      return;
    }

    // Check if already in cart
    const addToCartBtn = document.getElementById('addToCartBtn');
    if (addToCartBtn && addToCartBtn.getAttribute('data-in-cart') === 'true') {
      this.showToast('✅ Product is already in your cart', 'info');
      return;
    }
    
    const quantityInput = document.getElementById('productQuantity');
    if (!quantityInput) {
      this.showToast('Quantity input not found', 'error');
      return;
    }

    const quantity = parseInt(quantityInput.value) || this.productData?.minQty || 1;

    // Fallback: Get product data from DOM if not initialized
    let productId = this.productData?.id;
    let manufacturerId = this.productData?.manufacturerId;
    let unitPrice = this.productData?.unitPrice;
    
    if (!productId && quantityInput) {
      productId = quantityInput.dataset.productId;
      manufacturerId = quantityInput.dataset.manufacturerId;
      unitPrice = parseFloat(quantityInput.dataset.unitPrice) || 0;
    }
    
    // Get from button if still not found
    if (!productId && addToCartBtn) {
      productId = addToCartBtn.dataset.productId;
      manufacturerId = addToCartBtn.dataset.manufacturerId;
    }

    try {
      // Show loading state
      this.setButtonLoading(addToCartBtn, true);

      const response = await this.fetchWithAuth('/buyer/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: productId || this.getProductIdFromDOM(),
          manufacturerId: manufacturerId,
          quantity: quantity,
          unitPrice: unitPrice,
          selectedSpecs: {},
          notes: ''
        })
      });

      const data = await response.json();

      if (data.success) {
        this.showToast(`✅ ${window.translations.productDetails.addedToCart}`, 'success');
        
        // Get the correct quantity from response
        const cartQuantity = data.data?.cartQuantity || data.data?.quantity || data.data?.totalQuantity || 1;
        const totalCartItems = data.data?.totalCartItems || data.data?.cartTotal || 1;
                
        // Update cart counter with total items
        this.updateCartCounter(totalCartItems);
        
        // Update button state directly (no need for additional API call)
        this.updateAddToCartButton(true, cartQuantity);
        
        // Invalidate product status cache since cart state changed
        this.productStatusCache.lastChecked = 0;
      } else {
        this.showToast(data.message || window.translations.productDetails.failedToAddCart, 'error');
      }

    } catch (error) {
      if (error.message.includes('Authentication failed')) {
        this.showToast(`⚠️ ${window.translations.auth.pleaseLoginAgain || 'Please login again to continue'}`, 'warning');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        this.showToast('Failed to add product to cart', 'error');
      }
    } finally {
      // Always disable loading state
      const addToCartBtn = document.getElementById('addToCartBtn');
      if (addToCartBtn) {
        this.setButtonLoading(addToCartBtn, false);
      }
    }
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(event) {
    // Prevent duplicate requests
    if (this.isTogglingFavorite) {
      return;
    }
    
    this.isTogglingFavorite = true;
    
    // Re-check authentication on click (force check for fresh status)
    await this.checkAuthStatus(true);
    
    if (!this.isAuthenticated) {
      this.showToast(`⚠️ Please login to manage favorites`, 'warning');
      setTimeout(() => {
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
      }, 2000);
      return;
    }

    // Determine which button was clicked
    let clickedButton = null;
    if (event && event.currentTarget) {
      clickedButton = event.currentTarget;
    } else {
      // Try to find the button that was clicked by checking both buttons
      const mainFavoriteBtn = document.getElementById('favoriteBtn');
      const imageFavoriteBtn = document.getElementById('imageFavoriteBtn');
      
      // Check if either button was recently clicked or has focus
      if (imageFavoriteBtn && document.activeElement === imageFavoriteBtn) {
        clickedButton = imageFavoriteBtn;
      } else if (mainFavoriteBtn && document.activeElement === mainFavoriteBtn) {
        clickedButton = mainFavoriteBtn;
      } else {
        // Default to main favorite button
        clickedButton = mainFavoriteBtn;
      }
    }
    
    if (!clickedButton) {
      return;
    }
    
    const isImageButton = clickedButton.id === 'imageFavoriteBtn';
    
    // Check current favorite state from the clicked button
    const isCurrentlyFavorite = clickedButton.getAttribute('data-favorited') === 'true';

    try {
      // Set loading state for the clicked button
      this.setButtonLoading(clickedButton, true);

      const productId = this.productData?.id || this.getProductIdFromDOM();

      const url = isCurrentlyFavorite ? 
        '/buyer/api/remove-from-favorites' :
        '/buyer/api/add-to-favorites';
      const response = await this.fetchWithAuth(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: productId
        })
      });

      const data = await response.json();

      if (data.success) {
        // Show success message
        if (isCurrentlyFavorite) {
          this.showToast(`❤️ ${window.translations.productDetails.removedFromFavorites}`, 'success');
        } else {
          this.showToast(`❤️ ${window.translations.productDetails.addedToFavorites}`, 'success');
        }
        
        // Update button state directly (no need for additional API call)
        this.updateFavoriteButton(!isCurrentlyFavorite);
        
        // Invalidate product status cache since favorite state changed
        this.productStatusCache.lastChecked = 0;
      } else {
        this.showToast(data.message || window.translations.productDetails.failedToUpdateFavorites, 'error');
      }

    } catch (error) {
      if (error.message.includes('Authentication failed')) {
        this.showToast(`⚠️ ${window.translations.productDetails.pleaseLoginAgain || 'Please login again to continue'}`, 'warning');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        this.showToast('Failed to update favorites', 'error');
      }
    } finally {
      // Remove loading state from the clicked button
      this.setButtonLoading(clickedButton, false);
      
      // Reset toggle flag
      this.isTogglingFavorite = false;
    }
  }

  /**
   * Set button loading state
   */
  setButtonLoading(button, loading) {
    if (!button) return;

    // Correct selectors based on actual HTML structure  
    const icon = button.querySelector('i:not(.fa-spinner)'); // Direct icon child (not loading spinner)
    const text = button.querySelector('.btn-text');
    const loadingSpinner = button.querySelector('.btn-loading');


    if (loading) {
      button.disabled = true;
      if (icon) icon.style.display = 'none';
      if (text) text.style.display = 'none';
      if (loadingSpinner) loadingSpinner.style.display = 'inline-block';
    } else {
      button.disabled = false;
      if (icon) icon.style.display = 'inline-block';
      if (text) text.style.display = 'inline-block';
      if (loadingSpinner) loadingSpinner.style.display = 'none';
    }
  }

  /**
   * Initialize product data
   */
  initProductData() {
    const quantityInput = document.getElementById('productQuantity');
    if (quantityInput) {
      this.productData = {
        id: quantityInput.dataset.productId,
        manufacturerId: quantityInput.dataset.manufacturerId,
        unitPrice: parseFloat(quantityInput.dataset.unitPrice) || 0,
        currency: quantityInput.dataset.currency || (window.translations?.common?.usd || 'USD'),
        minQty: parseInt(quantityInput.dataset.minQty) || 1,
        maxQty: parseInt(quantityInput.dataset.maxQty) || 999,
        stock: parseInt(quantityInput.dataset.stock) || 0
      };
      // Product data initialized successfully
    } else {
      // Product quantity input not found
    }
  }

  /**
   * Check authentication status
   */
  async checkAuthStatus(forceCheck = false) {
    try {
      // Check if we can use cached auth status
      const now = Date.now();
      if (!forceCheck && this.authStatusCache.isChecking) {
        return;
      }
      
      if (!forceCheck && (now - this.authStatusCache.lastChecked) < this.authStatusCache.cacheDuration) {
        return;
      }
      
      this.authStatusCache.isChecking = true;
      
      // Check if user has tokens (cookies)
      const refreshToken = this.getCookie('refreshToken');
      const accessToken = this.getCookie('accessToken');
      const hasTokens = !!(refreshToken && accessToken);
      
      // Token check completed
      
      if (!hasTokens) {
        // Check if we have refreshToken but no accessToken (token expired)
        if (refreshToken && !accessToken) {
          
          // Try to refresh tokens using BuyerTokenManager
          if (window.buyerTokenManager) {
            try {
              const refreshResult = await window.buyerTokenManager.refreshToken();
              
              if (refreshResult) {
                 // Try /auth/me again with new tokens
                const retryResponse = await fetch('/auth/me', {
                  method: 'GET',
                  credentials: 'include',
                  headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                  }
                });
                
                if (retryResponse.ok) {
                  const retryData = await retryResponse.json();
                  if (retryData.success && retryData.data && retryData.data.user) {
                    this.isAuthenticated = true;
                    this.currentUser = retryData.data.user;
                    this.userType = retryData.data.user.userType;
                    this.companyType = retryData.data.user.companyType;
                    
                    // Also set window.currentUser for compatibility
                    window.currentUser = retryData.data.user;
                    
                    // Update cache
                    this.authStatusCache.lastChecked = Date.now();
                    this.authStatusCache.isChecking = false;
                    return;
                  }
                }
              }
            } catch (refreshError) {
            }
          }
        }
        
        // No tokens = not logged in
        this.isAuthenticated = false;
        this.currentUser = null;
        this.userType = null;
        this.companyType = null;
        return;
      }
      
      // Validate access token by making a simple API call
      try {
        const response = await fetch('/auth/me', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'X-Requested-With': 'XMLHttpRequest'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.data && data.data.user) {
            this.isAuthenticated = true;
            this.currentUser = data.data.user;
            this.userType = data.data.user.userType;
            this.companyType = data.data.user.companyType;
      
            
            // Also set window.currentUser for compatibility
            window.currentUser = data.data.user;
            
            // Update cache
            this.authStatusCache.lastChecked = Date.now();
            this.authStatusCache.isChecking = false;
            return;
          }
        } else if (response.status === 401) {
          // Try to refresh tokens using BuyerTokenManager
          if (window.buyerTokenManager) {
            try {
              const refreshResult = await window.buyerTokenManager.refreshToken();
              
              if (refreshResult) {
                // Try /auth/me again with new tokens
                const retryResponse = await fetch('/auth/me', {
                  method: 'GET',
                  credentials: 'include',
                  headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                  }
                });
                
                if (retryResponse.ok) {
                  const retryData = await retryResponse.json();
                  if (retryData.success && retryData.data && retryData.data.user) {
                    this.isAuthenticated = true;
                    this.currentUser = retryData.data.user;
                    this.userType = retryData.data.user.userType;
                    this.companyType = retryData.data.user.companyType;
                    
                    // Also set window.currentUser for compatibility
                    window.currentUser = retryData.data.user;
                    return;
                  }
                }
              }
            } catch (refreshError) {
              // Token refresh failed
            }
          }
        }
      } catch (apiError) {
        // Auth API check failed
      }
      
      // Fallback to localStorage if API fails
      const userData = localStorage.getItem('slex_buyer_user_data');
      
      if (userData) {
        try {
          const parsedData = JSON.parse(userData);
         
          // If localStorage exists, set userType and companyType properly
          if (parsedData.companyType || parsedData.userType) {
            this.currentUser = parsedData;
            this.userType = parsedData.userType || 'user';
            this.companyType = parsedData.companyType || null;
            
            // Also set window.currentUser for compatibility
            window.currentUser = parsedData;
            return;
          }
        } catch (e) {
          // Parse error
        }
      }
      
      // If all checks fail, user is not authenticated
      this.isAuthenticated = false;
      this.currentUser = null;
      this.userType = null;
      this.companyType = null;
    } catch (error) {
      this.isAuthenticated = false;
      this.currentUser = null;
      this.userType = null;
      this.companyType = null;
      
      // Update cache even on error
      this.authStatusCache.lastChecked = Date.now();
      this.authStatusCache.isChecking = false;
    }
  }

  /**
   * Get cookie value
   */
  getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }

  /**
   * Get product ID from DOM
   */
  getProductIdFromDOM() {
    // Try to get from quantity input
    const quantityInput = document.getElementById('productQuantity');
    if (quantityInput && quantityInput.dataset.productId) {
      return quantityInput.dataset.productId;
    }
    
    // Try to get from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    if (productId) {
      return productId;
    }
    
    // Try to get from meta tag
    const metaProductId = document.querySelector('meta[name="product-id"]');
    if (metaProductId) {
      return metaProductId.getAttribute('content');
    }
    
    return null;
  }

  /**
   * Fetch with authentication
   */
  async fetchWithAuth(url, options = {}) {
    // Ensure we have fresh tokens
    if (window.buyerTokenManager) {
      const status = window.buyerTokenManager.getStatus();
      if (status.isExpired) {
        const refreshed = await window.buyerTokenManager.refreshToken();
        if (!refreshed) {
          throw new Error(window.translations.auth.authenticationFailed || 'Authentication failed');
        }
      }
    }

    const defaultOptions = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...options.headers
      }
    };

    const fetchOptions = { ...defaultOptions, ...options };

    try {
      const response = await fetch(url, fetchOptions);
      
      if (response.status === 401 && window.buyerTokenManager) {
        const refreshed = await window.buyerTokenManager.refreshToken();
        if (refreshed) {
          return await fetch(url, fetchOptions);
        } else {
          throw new Error(window.translations.auth.authenticationFailed || 'Authentication failed');
        }
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update cart counter
   */
  // updateCartCounter method moved to end of class

  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
      position: fixed !important;
      top: 20px !important;
      right: 20px !important;
      background: white !important;
      border-radius: 12px !important;
      padding: 16px 20px !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
      z-index: 10000 !important;
      max-width: 400px !important;
      font-size: 14px !important;
      color: #333 !important;
      border-left: 4px solid ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'} !important;
    `;
    toast.textContent = message;

    document.body.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 5000);
  }

  /**
   * Check product status (cart and favorite)
   */
  async checkProductStatus(forceCheck = false) {
    // Check if we can use cached product status
    const now = Date.now();
    if (!forceCheck && this.productStatusCache.isChecking) {
      return;
    }
    
    if (!forceCheck && this.productStatusCache.data && (now - this.productStatusCache.lastChecked) < this.productStatusCache.cacheDuration) {
      this.updateFavoriteButton(this.productStatusCache.data.isFavorite);
      this.updateAddToCartButton(this.productStatusCache.data.isInCart, this.productStatusCache.data.cartQuantity);
      return;
    }
    
    // Check if product data is available
    const productId = this.productData?.id || this.getProductIdFromDOM();
    if (!productId) {
     return;
    }

    // If user is not authenticated, show default button states
    if (!this.isAuthenticated) {
     
      this.updateFavoriteButton(false);
      this.updateAddToCartButton(false, 0);
      return;
    }

    // Check if user has proper role for product status (allow if companyType is undefined)
    if (this.userType !== 'user' && this.userType !== 'admin') {
      this.updateFavoriteButton(false);
      this.updateAddToCartButton(false, 0);
      return;
    }
    
    this.productStatusCache.isChecking = true;

    try {
      const apiUrl = `/buyer/api/product-status/${productId}`;
      
      const response = await this.fetchWithAuth(apiUrl);
      
      const data = await response.json();


      if (data.success) {
        // Update favorite button
        this.updateFavoriteButton(data.data.isFavorite);
        
        // Update add to cart button
        this.updateAddToCartButton(data.data.isInCart, data.data.cartQuantity);
        
        // Update cache
        this.productStatusCache.data = data.data;
        this.productStatusCache.lastChecked = Date.now();
        this.productStatusCache.isChecking = false;
      }
    } catch (error) {
      // On error, show default states
      this.updateFavoriteButton(false);
      this.updateAddToCartButton(false, 0);
      
      // Update cache even on error
      this.productStatusCache.lastChecked = Date.now();
      this.productStatusCache.isChecking = false;
    }
  }

  /**
   * Update favorite button state
   */
  updateFavoriteButton(isFavorite) {
    
    // Update main favorite button
    const favoriteBtn = document.getElementById('favoriteBtn');
    if (favoriteBtn) {
      const icon = favoriteBtn.querySelector('i:not(.fa-spinner)');
      const text = favoriteBtn.querySelector('.btn-text');

      if (isFavorite) {
        if (icon) icon.className = 'fas fa-heart';
        if (text) text.textContent = window.translations?.productDetails?.removeFromFavorites || 'Remove from Favorites';
        favoriteBtn.setAttribute('data-favorited', 'true');
      } else {
        if (icon) icon.className = 'far fa-heart';
        if (text) text.textContent = window.translations?.productDetails?.addToFavorites || 'Add to Favorites';
        favoriteBtn.setAttribute('data-favorited', 'false');
      }
    } else {
    }

    // Update image favorite button
    const imageFavoriteBtn = document.getElementById('imageFavoriteBtn');
    if (imageFavoriteBtn) {
      const icon = imageFavoriteBtn.querySelector('i');
      if (icon) {
        icon.className = isFavorite ? 'fas fa-heart' : 'far fa-heart';
      }
      imageFavoriteBtn.setAttribute('data-favorited', isFavorite.toString());
    } else {
    }
  }

  /**
   * Update add to cart button state
   */
  updateAddToCartButton(isInCart, cartQuantity) {
    
    const addToCartBtn = document.getElementById('addToCartBtn');
    if (!addToCartBtn) {
      return;
    }

    const text = addToCartBtn.querySelector('.btn-text');
    
    if (isInCart) {
      // Product already in cart - show quantity and disable
      const inCartText = window.translations?.productDetails?.inCart || window.translations?.common?.inCart || 'In Cart';
      if (text) text.textContent = `${inCartText} (${cartQuantity})`;
      addToCartBtn.disabled = true;
      addToCartBtn.style.opacity = '0.7';
      addToCartBtn.style.cursor = 'not-allowed';
      const titleText = window.translations?.productDetails?.alreadyInCart || 'This product is already in your cart';
      addToCartBtn.title = `${titleText} (${window.translations?.productDetails?.quantity || 'quantity'}: ${cartQuantity})`;
      addToCartBtn.setAttribute('data-in-cart', 'true');
    } else {
      // Product not in cart - normal state
      if (text) text.textContent = window.translations?.productDetails?.addToCart || 'Add to Cart';
      addToCartBtn.disabled = false;
      addToCartBtn.style.opacity = '1';
      addToCartBtn.style.cursor = 'pointer';
      addToCartBtn.removeAttribute('title');
      addToCartBtn.setAttribute('data-in-cart', 'false');
    }
  }

  /**
   * Quantity control methods
   */
  decreaseQuantity() {
    const quantityInput = document.getElementById('productQuantity');
    if (quantityInput) {
      const currentQty = parseInt(quantityInput.value) || this.productData?.minQty || 1;
      const newQty = Math.max(currentQty - 1, this.productData?.minQty || 1);
      quantityInput.value = newQty;
      this.validateQuantity();
    }
  }

  increaseQuantity() {
    const quantityInput = document.getElementById('productQuantity');
    if (quantityInput) {
      const currentQty = parseInt(quantityInput.value) || this.productData?.minQty || 1;
      const maxAllowed = Math.min(this.productData?.maxQty || 999, this.productData?.stock || 999);
      const newQty = Math.min(currentQty + 1, maxAllowed);
      quantityInput.value = newQty;
      this.validateQuantity();
    }
  }

  validateQuantity() {
    const quantityInput = document.getElementById('productQuantity');
    if (!quantityInput) return;

    const qty = parseInt(quantityInput.value) || this.productData?.minQty || 1;
    const maxAllowed = Math.min(this.productData?.maxQty || 999, this.productData?.stock || 999);

    if (qty < (this.productData?.minQty || 1)) {
      quantityInput.value = this.productData?.minQty || 1;
      this.showToast(`Minimum quantity is ${this.productData?.minQty || 1}`, 'warning');
    } else if (qty > maxAllowed) {
      quantityInput.value = maxAllowed;
      this.showToast(`Maximum available quantity is ${maxAllowed}`, 'warning');
    }

    // Update total price
    this.updateTotalPrice();
  }

  updateTotalPrice() {
    const quantityInput = document.getElementById('productQuantity');
    const totalPriceElement = document.getElementById('totalPrice');
    
    if (quantityInput && totalPriceElement && this.productData?.unitPrice) {
      const quantity = parseInt(quantityInput.value) || this.productData?.minQty || 1;
      const totalPrice = (this.productData.unitPrice * quantity).toFixed(2);
      totalPriceElement.textContent = `$${totalPrice}`;
    }
  }

  /**
   * Button control methods
   */
  enableButtons() {
    const addToCartBtn = document.getElementById('addToCartBtn');
    const favoriteBtn = document.getElementById('favoriteBtn');
    
    if (addToCartBtn) {
      addToCartBtn.disabled = false;
      addToCartBtn.classList.remove('disabled');
      addToCartBtn.style.opacity = '1';
      addToCartBtn.style.cursor = 'pointer';
      addToCartBtn.style.pointerEvents = 'auto';
      addToCartBtn.removeAttribute('title');
      
      // Ensure icon and text are visible
      const icon = addToCartBtn.querySelector('i:not(.fa-spinner)');
      const text = addToCartBtn.querySelector('.btn-text');
      if (icon) icon.style.display = 'inline-block';
      if (text) text.style.display = 'inline-block';
    }
    if (favoriteBtn) {
      favoriteBtn.disabled = false;
      favoriteBtn.classList.remove('disabled');
      favoriteBtn.style.opacity = '1';
      favoriteBtn.style.cursor = 'pointer';
      favoriteBtn.style.pointerEvents = 'auto';
      favoriteBtn.removeAttribute('title');
      
      // Ensure icon and text are visible
      const icon = favoriteBtn.querySelector('i:not(.fa-spinner)');
      const text = favoriteBtn.querySelector('.btn-text');
      if (icon) icon.style.display = 'inline-block';
      if (text) text.style.display = 'inline-block';
    }
  }
  
  disableButtons() {
    const addToCartBtn = document.getElementById('addToCartBtn');
    const favoriteBtn = document.getElementById('favoriteBtn');
    
    const userTypeText = this.companyType === 'manufacturer' ? 'manufacturer' : 'admin';
    const message = `This action is not available for ${userTypeText} accounts. Only distributors can add products to cart and favorites.`;
    
    if (addToCartBtn) {
      addToCartBtn.disabled = true;
      addToCartBtn.classList.add('disabled');
      addToCartBtn.style.opacity = '0.5';
      addToCartBtn.style.cursor = 'not-allowed';
      addToCartBtn.style.pointerEvents = 'none';
      addToCartBtn.title = message;
      
      // Keep icon and text visible but disabled
      const icon = addToCartBtn.querySelector('i:not(.fa-spinner)');
      const text = addToCartBtn.querySelector('.btn-text');
      if (icon) icon.style.display = 'inline-block';
      if (text) text.style.display = 'inline-block';
    }
    if (favoriteBtn) {
      favoriteBtn.disabled = true;
      favoriteBtn.classList.add('disabled');
      favoriteBtn.style.opacity = '0.5';
      favoriteBtn.style.cursor = 'not-allowed';
      favoriteBtn.style.pointerEvents = 'none';
      favoriteBtn.title = message;
      
      // Keep icon and text visible but disabled
      const icon = favoriteBtn.querySelector('i:not(.fa-spinner)');
      const text = favoriteBtn.querySelector('.btn-text');
      if (icon) icon.style.display = 'inline-block';
      if (text) text.style.display = 'inline-block';
    }
  }

  /**
   * Chat functionality - Professional implementation
   */
  openChat() {
    // Validate user authentication
    if (!window.currentUser) {
      this.showToast('⚠️ Chat uchun tizimga kiring', 'warning');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      return;
    }

    // Check user permissions for chat
    const user = window.currentUser;
    const isBuyer = user && 
                    user.role === 'company_admin' && 
                    (user.companyType === 'distributor' || 
                     user.companyType === 'buyer' ||
                     user.userType === 'user' ||
                     user.companyName);
    
    if (!isBuyer) {
      const errorMessages = {
        manufacturer: 'Ishlab chiqaruvchilar chat qila olmaydi',
        admin: 'Adminlar chat qila olmaydi',
        default: 'Faqat distribyutor/haridor kompanyalar chat qila oladi'
      };
      
      let message = errorMessages.default;
      if (user?.companyType === 'manufacturer') {
        message = errorMessages.manufacturer;
      } else if (user?.role === 'admin' || user?.role === 'super_admin') {
        message = errorMessages.admin;
      }
      
      this.showToast(`⚠️ ${message}`, 'warning');
      return;
    }

    // Get manufacturer ID and validate
    const chatBtn = document.querySelector('.chat-btn');
    const manufacturerId = chatBtn?.dataset.manufacturerId || this.productData?.manufacturerId;
    
    if (!manufacturerId) {
      this.showToast('⚠️ Ishlab chiqaruvchi ma\'lumotlari topilmadi', 'error');
      return;
    }

    // Redirect to chat with manufacturer
    const redirectUrl = `/buyer/messages?manufacturer=${manufacturerId}`;
    window.location.href = redirectUrl;
  }

  /**
   * Initialize UI with role-based button control
   */
  async initializeUI() {
    try {
      await this.checkAuthStatus();
       
      // Apply role-based button control following SLEX specification
      if (this.isAuthenticated && this.userType === 'user' && this.companyType === 'distributor') {
         this.enableButtons();
        // Check product status via API for distributor companies  
        await this.checkProductStatus();
      } else if (this.isAuthenticated && (this.companyType === 'manufacturer' || this.userType === 'admin')) {
        this.disableButtons();
      } else if (this.isAuthenticated && this.userType === 'user' && !this.companyType) {
       this.enableButtons();
        // Try to check product status even if companyType is undefined
        await this.checkProductStatus();
      } else if (!this.isAuthenticated) {
       this.enableButtons(); // Guest users can see buttons but will get login prompts
      } else {
        this.enableButtons();
      }
      
    } catch (error) {
      console.error('❌ Error in initializeUI:', error);
      // Enable buttons by default if initialization fails
      this.enableButtons();
    }
  }

  /**
   * Bind quantity control events
   */
  bindQuantityEvents() {
    try {
      // Quantity controls
      const decreaseBtn = document.getElementById('decreaseQty');
      const increaseBtn = document.getElementById('increaseQty');
      const quantityInput = document.getElementById('productQuantity');

      if (decreaseBtn) {
        decreaseBtn.addEventListener('click', () => {
          this.decreaseQuantity();
        });
      }
      
      if (increaseBtn) {
        increaseBtn.addEventListener('click', () => {
          this.increaseQuantity();
        });
      }
      
      if (quantityInput) {
        quantityInput.addEventListener('change', () => this.validateQuantity());
        quantityInput.addEventListener('input', () => this.updateTotalPrice());
      }

      // Action buttons
      const addToCartBtn = document.getElementById('addToCartBtn');
      const favoriteBtn = document.getElementById('favoriteBtn');

      if (addToCartBtn) {
        addToCartBtn.addEventListener('click', () => {
          this.addToCart();
        });
      }
      
      if (favoriteBtn) {
        favoriteBtn.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          this.toggleFavorite(event);
        });
      }

      // Image favorite button
      const imageFavoriteBtn = document.getElementById('imageFavoriteBtn');
      if (imageFavoriteBtn) {
        imageFavoriteBtn.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          this.toggleFavorite(event);
        });
      }
    } catch (error) {
      console.error('❌ Error binding events:', error);
    }
  }

  /**
   * Cleanup when page unloads
   */
  destroy() {
    // Abort all event listeners
    Object.values(this.controllers).forEach(controller => {
      controller.abort();
    });

  }

  /**
   * Get product ID from DOM elements (fallback method)
   */
  getProductIdFromDOM() {
    try {
      // Try from quantity input dataset
      const quantityInput = document.getElementById('productQuantity');
      if (quantityInput?.dataset?.productId) {
        return quantityInput.dataset.productId;
      }
      
      // Try from URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const productId = urlParams.get('id');
      if (productId) {
        return productId;
      }
      
      // Try from meta tag
      const metaProductId = document.querySelector('meta[name="product-id"]');
      if (metaProductId?.content) {
        return metaProductId.content;
      }
      
      console.warn('⚠️ Product ID not found in DOM');
      return null;
    } catch (error) {
      console.error('❌ Error getting product ID from DOM:', error);
      return null;
    }
  }

  /**
   * Helper function to decode HTML entities
   */
  decodeHtmlEntities(text) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
      position: fixed !important;
      top: 20px !important;
      right: 20px !important;
      background: white !important;
      border-radius: 12px !important;
      padding: 16px 20px !important;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15) !important;
      border-left: 4px solid ${type === 'warning' ? '#f59e0b' : type === 'error' ? '#ef4444' : type === 'success' ? '#22c55e' : '#3b82f6'} !important;
      z-index: 9999 !important;
      display: flex !important;
      align-items: center !important;
      gap: 12px !important;
      min-width: 300px !important;
      max-width: 500px !important;
      font-family: inherit !important;
      animation: slideInRight 0.3s ease-out !important;
    `;
    
    toast.innerHTML = `
      <div class="toast-content" style="display: flex; align-items: center; gap: 8px; flex: 1; font-weight: 500; color: #374151;">
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}" style="color: ${type === 'warning' ? '#f59e0b' : type === 'error' ? '#ef4444' : type === 'success' ? '#22c55e' : '#3b82f6'};"></i>
        <span>${message}</span>
      </div>
      <button class="toast-close" style="background: none; border: none; color: #9ca3af; cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center; border-radius: 4px; transition: all 0.2s ease;">
        <i class="fas fa-times"></i>
      </button>
    `;

    const container = document.getElementById('toastContainer') || document.body;
    container.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 5000);

    // Close button
    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => toast.remove());
    }
  }

  /**
   * Get cookie value
   */
  getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }

  /**
   * Initialize product data from DOM
   */
  initProductData() {
    try {
      const quantityInput = document.getElementById('productQuantity');
      if (quantityInput) {
        this.productData = {
          id: quantityInput.dataset.productId,
          manufacturerId: quantityInput.dataset.manufacturerId,
          unitPrice: parseFloat(quantityInput.dataset.unitPrice) || 0,
          currency: quantityInput.dataset.currency || (window.translations?.common?.usd || 'USD'),
          minQty: parseInt(quantityInput.dataset.minQty) || 1,
          maxQty: parseInt(quantityInput.dataset.maxQty) || 999,
          stock: parseInt(quantityInput.dataset.stock) || 0
        };
      } else {
        console.warn('⚠️ Quantity input not found for product data initialization');
      }
    } catch (error) {
      console.error('❌ Error initializing product data:', error);
    }
  }

  /**
   * Set button loading state
   */
  setButtonLoading(buttonId, isLoading) {
    const button = document.getElementById(buttonId);
    if (!button) return;

    const icon = button.querySelector('i:not(.fa-spinner)');
    const text = button.querySelector('.btn-text');

    if (isLoading) {
      button.disabled = true;
      button.classList.add('loading');
      
      // Hide original icon and text
      if (icon) icon.style.display = 'none';
      if (text) text.style.display = 'none';
      
      // Add spinner
      if (!button.querySelector('.fa-spinner')) {
        const spinner = document.createElement('i');
        spinner.className = 'fas fa-spinner fa-spin';
        spinner.style.marginRight = '8px';
        button.insertBefore(spinner, button.firstChild);
      }
    } else {
      button.disabled = false;
      button.classList.remove('loading');
      
      // Remove spinner
      const spinner = button.querySelector('.fa-spinner');
      if (spinner) spinner.remove();
      
      // Show original icon and text
      if (icon) icon.style.display = 'inline-block';
      if (text) text.style.display = 'inline-block';
    }
  }

  /**
   * Fetch with authentication headers
   */
  async fetchWithAuth(url, options = {}) {
    const defaultOptions = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...options.headers
      }
    };

    return fetch(url, { ...defaultOptions, ...options });
  }

  /**
   * Update cart counter in header
   */
  updateCartCounter(count) {
    const cartCounter = document.querySelector('.cart-counter');
    if (cartCounter) {
      cartCounter.textContent = count;
      cartCounter.style.display = count > 0 ? 'inline-block' : 'none';
    }
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
