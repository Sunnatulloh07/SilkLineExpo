/**
 * Product Edit Manager
 * Professional B2B Marketplace Integration
 * Senior Software Engineer Level Implementation
 * SLEX Platform - Product Edit Management Module
 */

(function() {
    'use strict';

    // Global state management
    let productData = {};
    let analyticsData = {};
    let isLoading = false;
    let currentStep = 1;
    let totalSteps = 5;

    // DOM Cache
    const DOM = {
        // Main containers
        productEditForm: null,
        analyticsCard: null,
        sidebarContainer: null,
        
        // Analytics elements
        analyticsGrid: null,
        viewsValue: null,
        ordersValue: null,
        revenueValue: null,
        conversionValue: null,
        
        // Form elements
        stepIndicators: null,
        formSteps: null,
        nextBtn: null,
        prevBtn: null,
        saveBtn: null,
        publishBtn: null,
        
        // Toast container
        toastContainer: null
    };

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        initializeProductEditManager();
    });


    /**
     * Main initialization function
     */
    function initializeProductEditManager() {
        try {
            
            // Load server data
            loadServerData();
            
            // Cache DOM elements
            cacheDOMElements();
            
            // Setup event listeners
            setupEventListeners();
            
            // Initialize components
            initializeComponents();
            
            // Load product analytics
            loadProductAnalytics();
            
            
        } catch (error) {
            showToast('System initialization failed', 'error');
        }
    }

    /**
     * Decode HTML entities
     */
    function decodeHtmlEntities(text) {
        const textarea = document.createElement('textarea');
        textarea.innerHTML = text;
        return textarea.value;
    }

    /**
     * Load data from server-side rendered JSON
     */
    function loadServerData() {
        try {
            // Load product data
            const productScript = document.getElementById('product-data');
            if (productScript && productScript.textContent.trim()) {
                try {
                    const decodedContent = decodeHtmlEntities(productScript.textContent);
                    productData = JSON.parse(decodedContent);
                } catch (parseError) {
                    productData = {};
                }
            } else {
                productData = {};
            }

            // Load analytics data
            const analyticsScript = document.getElementById('analytics-data');
            if (analyticsScript && analyticsScript.textContent.trim()) {
                try {
                    const decodedContent = decodeHtmlEntities(analyticsScript.textContent);
                    analyticsData = JSON.parse(decodedContent);
                } catch (parseError) {
                    analyticsData = {};
                }
            } else {
                analyticsData = {};
            }

        } catch (error) {
            productData = {};
            analyticsData = {};
        }
    }

    /**
     * Cache frequently used DOM elements
     */
    function cacheDOMElements() {
        // Main containers
        DOM.productEditForm = document.getElementById('productEditForm');
        DOM.analyticsCard = document.querySelector('.analytics-card');
        DOM.sidebarContainer = document.querySelector('.sidebar-container');
        
        // Analytics elements
        DOM.analyticsGrid = document.querySelector('.analytics-grid');
        DOM.viewsValue = document.querySelector('.analytics-item .analytics-value');
        DOM.ordersValue = document.querySelectorAll('.analytics-item .analytics-value')[1];
        DOM.revenueValue = document.querySelectorAll('.analytics-item .analytics-value')[2];
        DOM.conversionValue = document.querySelectorAll('.analytics-item .analytics-value')[3];
        
        // Form elements
        DOM.stepIndicators = document.querySelectorAll('.step-indicator');
        DOM.formSteps = document.querySelectorAll('.form-step');
        DOM.nextBtn = document.getElementById('nextBtn');
        DOM.prevBtn = document.getElementById('prevBtn');
        DOM.saveBtn = document.getElementById('saveAsDraftBtn');
        DOM.publishBtn = document.getElementById('publishBtn');
        
        // Toast container
        DOM.toastContainer = document.getElementById('toastContainer');
    }

    /**
     * Setup all event listeners
     */
    function setupEventListeners() {
        // Form navigation
        if (DOM.nextBtn) {
            DOM.nextBtn.addEventListener('click', handleNextStep);
        }

        if (DOM.prevBtn) {
            DOM.prevBtn.addEventListener('click', handlePrevStep);
        }

        // Form submission
        if (DOM.saveBtn) {
            DOM.saveBtn.addEventListener('click', handleSaveAsDraft);
        }

        if (DOM.publishBtn) {
            DOM.publishBtn.addEventListener('click', handlePublish);
        }

        // Form validation
        if (DOM.productEditForm) {
            DOM.productEditForm.addEventListener('input', debounce(handleFormValidation, 500));
        }

        // Analytics refresh
        const refreshBtn = document.getElementById('refreshAnalyticsBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', handleRefreshAnalytics);
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', handleKeyboardShortcuts);
    }

    /**
     * Initialize additional components
     */
    function initializeComponents() {
        // Initialize step indicators
        updateStepIndicators();
        
        // Initialize form validation
        initializeFormValidation();
        
        // Initialize auto-save
        initializeAutoSave();
        
        // Initialize tooltips
        if (typeof initializeTooltips === 'function') {
            initializeTooltips();
        }

        // Initialize shipping methods after a delay
        setTimeout(() => {
            forceInitializeShippingMethods();
        }, 1000);
    }

    /**
     * Initialize shipping methods
     */
    async function forceInitializeShippingMethods() {
        try {
            // Check if shipping methods exist, if not, try to migrate them
            if (productData && productData.shipping && !productData.shipping.methods) {
                try {
                    const response = await fetch(`/api/manufacturer/products/${productData._id}/migrate-shipping-methods`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest'
                        }
                    });
                    
                    const result = await response.json();
                    if (result.success) {
                        productData.shipping.methods = result.data.shippingMethods;
                        forceSetShippingMethods(result.data.shippingMethods);
                    }
                } catch (error) {
                    // Migration error handled silently
                }
            } else if (productData && productData.shipping && productData.shipping.methods) {
                forceSetShippingMethods(productData.shipping.methods);
            }
            
        } catch (error) {
            // Error handled silently
        }
    }
    
    /**
     * Set shipping methods checkboxes
     */
    function forceSetShippingMethods(shippingMethods) {
        const methodCheckboxes = document.querySelectorAll('input[name="shipping.methods"]');
        
        methodCheckboxes.forEach(checkbox => {
            const shouldBeChecked = shippingMethods.includes(checkbox.value);
            checkbox.checked = shouldBeChecked;
            checkbox.dispatchEvent(new Event('change', { bubbles: true }));
        });
    }

    /**
     * Load product analytics from backend
     */
    async function loadProductAnalytics() {
        try {
            if (isLoading) return;
            
            isLoading = true;
            showAnalyticsLoading(true);
            
            const productId = productData._id;
            if (!productId) {
                showFallbackAnalytics();
                return;
            }

            const response = await fetch(`/api/manufacturer/products/${productId}/analytics`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            const result = await response.json();
            
            if (result.success && result.data) {
                analyticsData = result.data;
                updateAnalyticsDisplay(analyticsData);
            } else {
                throw new Error(result.message || 'Failed to load analytics');
            }
            
        } catch (error) {
            showToast('Failed to load product analytics', 'error');
            
            // Show fallback data
            showFallbackAnalytics();
            
        } finally {
            isLoading = false;
            showAnalyticsLoading(false);
        }
    }

    /**
     * Update analytics display with real data
     */
    function updateAnalyticsDisplay(data) {
        try {
            // Update views
            const viewsElement = document.querySelector('.analytics-item:nth-child(1) .analytics-value');
            if (viewsElement) {
                viewsElement.textContent = formatNumber(data.views?.total || 0);
            }

            // Update orders
            const ordersElement = document.querySelector('.analytics-item:nth-child(2) .analytics-value');
            if (ordersElement) {
                ordersElement.textContent = formatNumber(data.orders?.total || 0);
            }

            // Update revenue
            const revenueElement = document.querySelector('.analytics-item:nth-child(3) .analytics-value');
            if (revenueElement) {
                const revenue = data.revenue?.total || 0;
                revenueElement.textContent = `$${formatCurrency(revenue)}`;
            }

            // Update conversion rate
            const conversionElement = document.querySelector('.analytics-item:nth-child(4) .analytics-value');
            if (conversionElement) {
                const conversionRate = data.conversion?.rate || 0;
                conversionElement.textContent = `${conversionRate.toFixed(2)}%`;
            }

            // Add trend indicators if available
            updateTrendIndicators(data);

        } catch (error) {
            // Error handled silently
        }
    }

    /**
     * Update trend indicators for analytics
     */
    function updateTrendIndicators(data) {
        try {
            // Views trend
            if (data.views?.trend) {
                updateTrendIndicator('.analytics-item:nth-child(1)', data.views.trend);
            }

            // Orders trend
            if (data.orders?.trend) {
                updateTrendIndicator('.analytics-item:nth-child(2)', data.orders.trend);
            }

            // Revenue trend
            if (data.orders?.revenueTrend) {
                updateTrendIndicator('.analytics-item:nth-child(3)', data.orders.revenueTrend);
            }

            // Conversion trend
            if (data.performance?.conversionTrend) {
                updateTrendIndicator('.analytics-item:nth-child(4)', data.performance.conversionTrend);
            }

        } catch (error) {
            // Error handled silently
        }
    }

    /**
     * Update individual trend indicator
     */
    function updateTrendIndicator(selector, trendData) {
        try {
            const item = document.querySelector(selector);
            if (!item) return;

            // Remove existing trend indicator
            const existingTrend = item.querySelector('.trend-indicator');
            if (existingTrend) {
                existingTrend.remove();
            }

            // Calculate trend
            let trendClass = 'neutral';
            let trendIcon = 'fas fa-minus';
            let trendText = '0%';

            if (typeof trendData === 'number') {
                if (trendData > 0) {
                    trendClass = 'positive';
                    trendIcon = 'fas fa-arrow-up';
                    trendText = `+${trendData}%`;
                } else if (trendData < 0) {
                    trendClass = 'negative';
                    trendIcon = 'fas fa-arrow-down';
                    trendText = `${trendData}%`;
                }
            }

            // Create trend indicator
            const trendIndicator = document.createElement('div');
            trendIndicator.className = `trend-indicator ${trendClass}`;
            trendIndicator.innerHTML = `
                <i class="${trendIcon}"></i>
                <span>${trendText}</span>
            `;

            // Add to analytics item
            const analyticsInfo = item.querySelector('.analytics-info');
            if (analyticsInfo) {
                analyticsInfo.appendChild(trendIndicator);
            }

        } catch (error) {
            // Error handled silently
        }
    }

    /**
     * Show fallback analytics when API fails
     */
    function showFallbackAnalytics() {
        try {
            // Use server-side rendered data as fallback
            if (analyticsData && Object.keys(analyticsData).length > 0) {
                updateAnalyticsDisplay(analyticsData);
            } else {
                // Show zero values
                updateAnalyticsDisplay({
                    views: { total: 0 },
                    orders: { totalOrders: 0, totalRevenue: 0 },
                    performance: { conversionRate: 0 }
                });
            }

        } catch (error) {
            // Error handled silently
        }
    }

    /**
     * Show/hide analytics loading state
     */
    function showAnalyticsLoading(show) {
        try {
            const analyticsCard = document.querySelector('.analytics-card');
            if (!analyticsCard) return;

            if (show) {
                analyticsCard.classList.add('loading');
                const loadingHtml = `
                    <div class="loading-overlay">
                        <div class="loading-spinner"></div>
                        <p>Loading analytics...</p>
                    </div>
                `;
                analyticsCard.insertAdjacentHTML('beforeend', loadingHtml);
            } else {
                analyticsCard.classList.remove('loading');
                const loadingOverlay = analyticsCard.querySelector('.loading-overlay');
                if (loadingOverlay) {
                    loadingOverlay.remove();
                }
            }

        } catch (error) {
            // Error handled silently
        }
    }

    /**
     * Handle refresh analytics button click
     */
    async function handleRefreshAnalytics() {
        try {
            // Refreshing analytics...
            await loadProductAnalytics();
            showToast('Analytics refreshed successfully', 'success');
            
        } catch (error) {
            showToast('Failed to refresh analytics', 'error');
        }
    }

    /**
     * Handle next step button click
     */
    function handleNextStep() {
        try {
            if (currentStep < totalSteps) {
                if (validateCurrentStep()) {
                    currentStep++;
                    updateStepDisplay();
                    updateStepIndicators();
                }
            }
            
        } catch (error) {
            // Error handled silently
        }
    }

    /**
     * Handle previous step button click
     */
    function handlePrevStep() {
        try {
            if (currentStep > 1) {
                currentStep--;
                updateStepDisplay();
                updateStepIndicators();
            }
            
        } catch (error) {
            // Error handled silently
        }
    }

    /**
     * Handle save as draft button click
     */
    async function handleSaveAsDraft() {
        try {
            if (isLoading) return;
            
            isLoading = true;
            showToast('Saving as draft...', 'info');
            
            // Collect form data with proper shipping data handling
            const formData = collectFormData();
            
            const response = await fetch(`/api/manufacturer/products/${formData._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    ...formData,
                    status: 'draft'
                })
            });

            const result = await response.json();
            
            if (result.success) {
                showToast('Product saved as draft successfully', 'success');
                // Update local product data
                productData = { ...productData, ...formData };
            } else {
                throw new Error(result.message || 'Failed to save product');
            }
            
        } catch (error) {
            showToast('Failed to save product', 'error');
        } finally {
            isLoading = false;
        }
    }

    /**
     * Handle publish button click
     */
    async function handlePublish() {
        try {
            if (isLoading) return;
            
            if (!validateAllSteps()) {
                showToast('Please complete all required fields', 'warning');
                return;
            }
            
            isLoading = true;
            showToast('Publishing product...', 'info');
            
            // Collect form data with proper shipping data handling
            const formData = collectFormData();
            
            const response = await fetch(`/api/manufacturer/products/${formData._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    ...formData,
                    status: 'active',
                    visibility: 'public'
                })
            });

            const result = await response.json();
            
            if (result.success) {
                showToast('Product published successfully', 'success');
                // Update local product data
                productData = { ...productData, ...formData };
                // Redirect to products list
                setTimeout(() => {
                    window.location.href = '/manufacturer/products';
                }, 2000);
            } else {
                throw new Error(result.message || 'Failed to publish product');
            }
            
        } catch (error) {
            showToast('Failed to publish product', 'error');
        } finally {
            isLoading = false;
        }
    }

    /**
     * Handle form validation
     */
    function handleFormValidation() {
        try {
            validateCurrentStep();
            
        } catch (error) {
            // Error handled silently
        }
    }

    /**
     * Validate current step
     */
    function validateCurrentStep() {
        try {
            const currentStepElement = document.querySelector(`.form-step[data-step="${currentStep}"]`);
            if (!currentStepElement) return true;

            const requiredFields = currentStepElement.querySelectorAll('[required]');
            let isValid = true;

            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    field.classList.add('error');
                    isValid = false;
                } else {
                    field.classList.remove('error');
                }
            });

            return isValid;
            
        } catch (error) {
            return false;
        }
    }

    /**
     * Validate all steps
     */
    function validateAllSteps() {
        try {
            for (let step = 1; step <= totalSteps; step++) {
                const stepElement = document.querySelector(`.form-step[data-step="${step}"]`);
                if (!stepElement) continue;

                const requiredFields = stepElement.querySelectorAll('[required]');
                for (let field of requiredFields) {
                    if (!field.value.trim()) {
                        return false;
                    }
                }
            }
            return true;
            
        } catch (error) {
            return false;
        }
    }

    /**
     * Update step display
     */
    function updateStepDisplay() {
        try {
            DOM.formSteps.forEach((step, index) => {
                if (index + 1 === currentStep) {
                    step.classList.add('active');
                } else {
                    step.classList.remove('active');
                }
            });

            // Update navigation buttons
            if (DOM.prevBtn) {
                DOM.prevBtn.disabled = currentStep === 1;
            }

            if (DOM.nextBtn) {
                DOM.nextBtn.disabled = currentStep === totalSteps;
                DOM.nextBtn.textContent = currentStep === totalSteps ? 'Complete' : 'Next';
            }
            
        } catch (error) {
            // Error handled silently
        }
    }

    /**
     * Update step indicators
     */
    function updateStepIndicators() {
        try {
            DOM.stepIndicators.forEach((indicator, index) => {
                if (index + 1 < currentStep) {
                    indicator.classList.add('completed');
                } else if (index + 1 === currentStep) {
                    indicator.classList.add('active');
                } else {
                    indicator.classList.remove('active', 'completed');
                }
            });
            
        } catch (error) {
            // Error handled silently
        }
    }

    /**
     * Initialize form validation
     */
    function initializeFormValidation() {
        try {
            // Add real-time validation to all form fields
            const formFields = document.querySelectorAll('input, select, textarea');
            formFields.forEach(field => {
                field.addEventListener('blur', () => {
                    validateField(field);
                });
            });

            // Initialize shipping tab specific validation
            initializeShippingValidation();
            
        } catch (error) {
            // Error handled silently
        }
    }

    /**
     * Initialize shipping tab validation and functionality
     */
    function initializeShippingValidation() {
        try {
            // Lead time custom input handling
            const leadTimeSelect = document.getElementById('leadTime');
            if (leadTimeSelect) {
                leadTimeSelect.addEventListener('change', handleLeadTimeChange);
            }

            // Shipping methods checkbox handling
            const shippingMethodCheckboxes = document.querySelectorAll('input[name="shipping.methods"]');
            shippingMethodCheckboxes.forEach((checkbox, index) => {
                checkbox.addEventListener('change', handleShippingMethodChange);
            });

            // Dimensions validation
            const dimensionInputs = document.querySelectorAll('input[name^="shipping.dimensions"]');
            dimensionInputs.forEach(input => {
                input.addEventListener('input', validateDimensionInput);
            });

            // Weight validation
            const weightInput = document.getElementById('shippingWeight');
            if (weightInput) {
                weightInput.addEventListener('input', validateWeightInput);
            }

            // Initialize default values from backend with delay
            setTimeout(() => {
                initializeShippingDefaultValues();
            }, 500);
            
        } catch (error) {
            // Error handled silently
        }
    }

    /**
     * Initialize shipping default values from backend data
     */
    function initializeShippingDefaultValues() {
        try {
            if (!productData || !productData.shipping) {
                return;
            }

            const shipping = productData.shipping;

            // Set lead time
            if (shipping.leadTime) {
                const leadTimeSelect = document.getElementById('leadTime');
                if (leadTimeSelect) {
                    let leadTimeValue = '3-7'; // default
                    
                    if (typeof shipping.leadTime === 'object') {
                        const { min, max } = shipping.leadTime;
                        if (min === 1 && max === 3) leadTimeValue = '1-3';
                        else if (min === 3 && max === 7) leadTimeValue = '3-7';
                        else if (min === 7 && max === 15) leadTimeValue = '7-15';
                        else if (min === 15 && max === 30) leadTimeValue = '15-30';
                        else leadTimeValue = 'custom';
                    } else if (typeof shipping.leadTime === 'string') {
                        leadTimeValue = shipping.leadTime;
                    }
                    
                    leadTimeSelect.value = leadTimeValue;
                }
            }

            // Set weight
            if (shipping.weight) {
                const weightInput = document.getElementById('shippingWeight');
                if (weightInput) {
                    weightInput.value = shipping.weight;
                }
            }

            // Set dimensions
            if (shipping.dimensions) {
                const { length, width, height, unit } = shipping.dimensions;
                
                const lengthInput = document.querySelector('input[name="shipping.dimensions.length"]');
                const widthInput = document.querySelector('input[name="shipping.dimensions.width"]');
                const heightInput = document.querySelector('input[name="shipping.dimensions.height"]');
                const unitSelect = document.querySelector('select[name="shipping.dimensions.unit"]');
                
                if (lengthInput && length) lengthInput.value = length;
                if (widthInput && width) widthInput.value = width;
                if (heightInput && height) heightInput.value = height;
                if (unitSelect && unit) unitSelect.value = unit;
                
            }

            // Set packaging type
            if (shipping.packagingType) {
                const packagingSelect = document.getElementById('packagingType');
                if (packagingSelect) {
                    packagingSelect.value = shipping.packagingType;
                }
            }

            // Set shipping class
            if (shipping.shippingClass) {
                const shippingClassSelect = document.getElementById('shippingClass');
                if (shippingClassSelect) {
                    shippingClassSelect.value = shipping.shippingClass;
                }
            }

            // Set shipping methods - CRITICAL FIX
            if (shipping.methods && Array.isArray(shipping.methods)) {
                const methodCheckboxes = document.querySelectorAll('input[name="shipping.methods"]');
                
                methodCheckboxes.forEach(checkbox => {
                    const isChecked = shipping.methods.includes(checkbox.value);
                    checkbox.checked = isChecked;
                    
                    // Force trigger change event
                    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                });
            }
            
        } catch (error) {
            // Error handled silently
        }
    }

    /**
     * Handle lead time change
     */
    function handleLeadTimeChange(event) {
        try {
            const value = event.target.value;
            
            if (value === 'custom') {
                // Show custom lead time inputs
                showCustomLeadTimeInputs();
            } else {
                // Hide custom lead time inputs
                hideCustomLeadTimeInputs();
            }
            
        } catch (error) {
            // Error handled silently
        }
    }

    /**
     * Show custom lead time inputs
     */
    function showCustomLeadTimeInputs() {
        try {
            // Check if custom inputs already exist
            let customContainer = document.getElementById('customLeadTimeContainer');
            
            if (!customContainer) {
                // Create custom lead time inputs
                customContainer = document.createElement('div');
                customContainer.id = 'customLeadTimeContainer';
                customContainer.className = 'form-group custom-lead-time';
                customContainer.innerHTML = `
                    <label class="form-label">
                        <i class="fas fa-calendar-alt"></i>
                        Custom Lead Time (Days)
                    </label>
                    <div class="custom-lead-time-inputs">
                        <input 
                            type="number" 
                            name="shipping.leadTime.min" 
                            class="form-input small" 
                            placeholder="Min days"
                            min="1"
                            value="${productData?.shipping?.leadTime?.min || ''}"
                        >
                        <span>to</span>
                        <input 
                            type="number" 
                            name="shipping.leadTime.max" 
                            class="form-input small" 
                            placeholder="Max days"
                            min="1"
                            value="${productData?.shipping?.leadTime?.max || ''}"
                        >
                    </div>
                `;
                
                // Insert after lead time select
                const leadTimeSelect = document.getElementById('leadTime');
                if (leadTimeSelect) {
                    leadTimeSelect.parentElement.insertAdjacentElement('afterend', customContainer);
                }
            }
            
            customContainer.style.display = 'block';
            
        } catch (error) {
            // Error handled silently
        }
    }

    /**
     * Hide custom lead time inputs
     */
    function hideCustomLeadTimeInputs() {
        try {
            const customContainer = document.getElementById('customLeadTimeContainer');
            if (customContainer) {
                customContainer.style.display = 'none';
            }
        } catch (error) {
            // Error handled silently
        }
    }

    /**
     * Handle shipping method change
     */
    function handleShippingMethodChange(event) {
        try {
            const checkbox = event.target;
            const method = checkbox.value;
            const isChecked = checkbox.checked;
            
            
            // Update shipping methods array
            if (!productData.shipping) {
                productData.shipping = {};
            }
            if (!productData.shipping.methods) {
                productData.shipping.methods = [];
            }
            
            if (isChecked) {
                if (!productData.shipping.methods.includes(method)) {
                    productData.shipping.methods.push(method);
                }
            } else {
                productData.shipping.methods = productData.shipping.methods.filter(m => m !== method);
            }
            
            
            // Visual feedback
            const label = checkbox.closest('.checkbox-label');
            if (label) {
                if (isChecked) {
                    label.classList.add('selected');
                } else {
                    label.classList.remove('selected');
                }
            }
            
        } catch (error) {
            // Error handled silently
        }
    }

    /**
     * Validate dimension input
     */
    function validateDimensionInput(event) {
        try {
            const input = event.target;
            const value = parseFloat(input.value);
            
            if (value < 0) {
                input.value = 0;
                showFieldError(input, 'Dimensions cannot be negative');
            } else if (value > 1000) {
                input.value = 1000;
                showFieldError(input, 'Dimensions cannot exceed 1000');
            } else {
                hideFieldError(input);
            }
            
        } catch (error) {
            // Error handled silently
        }
    }

    /**
     * Validate weight input
     */
    function validateWeightInput(event) {
        try {
            const input = event.target;
            const value = parseFloat(input.value);
            
            if (value < 0) {
                input.value = 0;
                showFieldError(input, 'Weight cannot be negative');
            } else if (value > 10000) {
                input.value = 10000;
                showFieldError(input, 'Weight cannot exceed 10000 kg');
            } else {
                hideFieldError(input);
            }
            
        } catch (error) {
            // Error handled silently
        }
    }

    /**
     * Validate individual field
     */
    function validateField(field) {
        try {
            const value = field.value.trim();
            const isRequired = field.hasAttribute('required');
            
            if (isRequired && !value) {
                field.classList.add('error');
                showFieldError(field, 'This field is required');
                return false;
            } else {
                field.classList.remove('error');
                hideFieldError(field);
                return true;
            }
            
        } catch (error) {
            return false;
        }
    }

    /**
     * Show field error
     */
    function showFieldError(field, message) {
        try {
            hideFieldError(field);
            
            const errorElement = document.createElement('div');
            errorElement.className = 'field-error';
            errorElement.textContent = message;
            
            field.parentNode.appendChild(errorElement);
            
        } catch (error) {
            // Error handled silently
        }
    }

    /**
     * Hide field error
     */
    function hideFieldError(field) {
        try {
            const existingError = field.parentNode.querySelector('.field-error');
            if (existingError) {
                existingError.remove();
            }
            
        } catch (error) {
            // Error handled silently
        }
    }

    /**
     * Initialize auto-save functionality
     */
    function initializeAutoSave() {
        try {
            // Auto-save every 30 seconds
            setInterval(() => {
                if (DOM.productEditForm && !isLoading) {
                    autoSaveDraft();
                }
            }, 30000);
            
        } catch (error) {
            // Error handled silently
        }
    }

    /**
     * Auto-save draft
     */
    async function autoSaveDraft() {
        try {
            // Use the global productData._id instead of form data
            if (!productData || !productData._id) {
                return;
            }
            
            const formData = new FormData(DOM.productEditForm);
            const formProductData = Object.fromEntries(formData.entries());
            
            await fetch(`/api/manufacturer/products/${productData._id}/autosave`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(formProductData)
            });
            
            
        } catch (error) {
            // Auto-save failed silently
        }
    }

    /**
     * Handle keyboard shortcuts
     */
    function handleKeyboardShortcuts(event) {
        try {
            // Ctrl/Cmd + S for save
            if ((event.ctrlKey || event.metaKey) && event.key === 's') {
                event.preventDefault();
                handleSaveAsDraft();
            }
            
            // Ctrl/Cmd + Enter for publish
            if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                event.preventDefault();
                handlePublish();
            }
            
            // Escape to cancel
            if (event.key === 'Escape') {
                if (confirm('Are you sure you want to leave? Unsaved changes will be lost.')) {
                    window.location.href = '/manufacturer/products';
                }
            }
            
        } catch (error) {
            // Error handled silently
        }
    }

    /**
     * Format number with locale
     */
    function formatNumber(number) {
        try {
            return new Intl.NumberFormat('en-US').format(number);
        } catch (error) {
            return number.toString();
        }
    }

    /**
     * Format currency
     */
    function formatCurrency(amount) {
        try {
            return new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(amount);
        } catch (error) {
            return amount.toFixed(2);
        }
    }

    /**
     * Show toast notification
     */
    function showToast(message, type = 'info', duration = 5000) {
        try {
            if (!DOM.toastContainer) {
                createToastContainer();
            }
            
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            
            const icon = getToastIcon(type);
            toast.innerHTML = `
                <i class="fas ${icon}"></i>
                <span>${message}</span>
            `;
            
            DOM.toastContainer.appendChild(toast);
            
            // Auto remove
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
            }, duration);
            
        } catch (error) {
            // Error handled silently
        }
    }

    /**
     * Create toast container if not exists
     */
    function createToastContainer() {
        try {
            DOM.toastContainer = document.createElement('div');
            DOM.toastContainer.id = 'toastContainer';
            DOM.toastContainer.className = 'toast-container';
            document.body.appendChild(DOM.toastContainer);
            
        } catch (error) {
            // Error handled silently
        }
    }

    /**
     * Get toast icon based on type
     */
    function getToastIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    /**
     * Collect form data with proper shipping data handling
     */
    function collectFormData() {
        try {
            const formData = new FormData(DOM.productEditForm);
            const data = Object.fromEntries(formData.entries());
            
            // Handle shipping data properly
            if (data['shipping.leadTime']) {
                data.shipping = data.shipping || {};
                data.shipping.leadTime = data['shipping.leadTime'];
                delete data['shipping.leadTime'];
            }

            if (data['shipping.weight']) {
                data.shipping = data.shipping || {};
                data.shipping.weight = parseFloat(data['shipping.weight']) || 0;
                delete data['shipping.weight'];
            }

            if (data['shipping.packagingType']) {
                data.shipping = data.shipping || {};
                data.shipping.packagingType = data['shipping.packagingType'];
                delete data['shipping.packagingType'];
            }

            if (data['shipping.shippingClass']) {
                data.shipping = data.shipping || {};
                data.shipping.shippingClass = data['shipping.shippingClass'];
                delete data['shipping.shippingClass'];
            }

            // Handle dimensions
            if (data['shipping.dimensions.length'] || data['shipping.dimensions.width'] || data['shipping.dimensions.height']) {
                data.shipping = data.shipping || {};
                data.shipping.dimensions = {
                    length: parseFloat(data['shipping.dimensions.length']) || 0,
                    width: parseFloat(data['shipping.dimensions.width']) || 0,
                    height: parseFloat(data['shipping.dimensions.height']) || 0,
                    unit: data['shipping.dimensions.unit'] || 'cm'
                };
                delete data['shipping.dimensions.length'];
                delete data['shipping.dimensions.width'];
                delete data['shipping.dimensions.height'];
                delete data['shipping.dimensions.unit'];
            }

            // Handle custom lead time
            if (data['shipping.leadTime.min'] && data['shipping.leadTime.max']) {
                data.shipping = data.shipping || {};
                data.shipping.leadTime = {
                    min: parseInt(data['shipping.leadTime.min']) || 1,
                    max: parseInt(data['shipping.leadTime.max']) || 7
                };
                delete data['shipping.leadTime.min'];
                delete data['shipping.leadTime.max'];
            }

            // Handle shipping methods (checkboxes)
            const shippingMethods = [];
            const methodCheckboxes = document.querySelectorAll('input[name="shipping.methods"]:checked');
            methodCheckboxes.forEach(checkbox => {
                shippingMethods.push(checkbox.value);
            });
            
            if (shippingMethods.length > 0) {
                data.shipping = data.shipping || {};
                data.shipping.methods = shippingMethods;
            }

            // Clean up any remaining shipping.* keys
            Object.keys(data).forEach(key => {
                if (key.startsWith('shipping.')) {
                    delete data[key];
                }
            });

            // Handle other nested data
            if (data['pricing.basePrice']) {
                data.pricing = data.pricing || {};
                data.pricing.basePrice = parseFloat(data['pricing.basePrice']) || 0;
                delete data['pricing.basePrice'];
            }

            if (data['pricing.minimumOrderQuantity']) {
                data.pricing = data.pricing || {};
                data.pricing.minimumOrderQuantity = parseInt(data['pricing.minimumOrderQuantity']) || 1;
                delete data['pricing.minimumOrderQuantity'];
            }

            if (data['pricing.currency']) {
                data.pricing = data.pricing || {};
                data.pricing.currency = data['pricing.currency'];
                delete data['pricing.currency'];
            }

            if (data['inventory.totalStock']) {
                data.inventory = data.inventory || {};
                data.inventory.totalStock = parseInt(data['inventory.totalStock']) || 0;
                delete data['inventory.totalStock'];
            }

            if (data['inventory.unit']) {
                data.inventory = data.inventory || {};
                data.inventory.unit = data['inventory.unit'];
                delete data['inventory.unit'];
            }

            // Clean up any remaining nested keys
            Object.keys(data).forEach(key => {
                if (key.includes('.')) {
                    delete data[key];
                }
            });

            return data;
            
        } catch (error) {
            return {};
        }
    }

    /**
     * Debounce utility function
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Export for global access if needed
    window.ProductEditManager = {
        loadProductAnalytics,
        updateAnalyticsDisplay,
        handleRefreshAnalytics,
        showToast
    };

})();
