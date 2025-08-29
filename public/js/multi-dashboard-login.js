/**
 * Multi-Dashboard Login Enhancement
 * Professional login form with enhanced UX and error handling
 * Supports role-based authentication and dashboard routing
 */

class MultiDashboardLogin {
    constructor() {
        this.loginForm = null;
        this.submitButton = null;
        this.errorContainer = null;
        this.successContainer = null;
        this.loadingState = false;
        
        // Error messages mapping
        this.errorMessages = {
            'validation_error': 'Please check your input and try again.',
            'invalid_credentials': 'Invalid email or password. Please try again.',
            'account_blocked': 'Your account has been blocked. Please contact support.',
            'account_locked': 'Account temporarily locked due to multiple failed attempts.',
            'account_pending': 'Your account is pending approval. Please wait for admin approval.',
            'account_suspended': 'Your account has been suspended. Please contact support.',
            'rate_limited': 'Too many login attempts. Please try again later.',
            'service_error': 'Authentication service temporarily unavailable. Please try again.',
            'session_expired': 'Your session has expired. Please login again.',
            'access_denied': 'Access denied. Please login with appropriate credentials.'
        };

        // Success messages mapping
        this.successMessages = {
            'logout': 'You have been successfully logged out.',
            'registered': 'Registration successful. Please wait for account approval.',
            'password_reset': 'Password reset successful. Please login with your new password.'
        };

        this.init();
    }

    /**
     * Initialize login form enhancements
     */
    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupElements();
            this.setupEventListeners();
            this.setupValidation();
            this.handleUrlParameters();
            this.setupPasswordToggle();
            this.setupFormAnimation();
            
            // Prevent duplicate validation from other scripts
            this.preventDuplicateValidation();
        });
    }

    /**
     * Setup DOM elements
     */
    setupElements() {
        this.loginForm = document.getElementById('loginForm') || document.querySelector('form[action*="login"]');
        this.submitButton = document.querySelector('button[type="submit"]') || document.querySelector('.btn-login');
        this.emailInput = document.querySelector('input[name="email"]') || document.querySelector('input[type="email"]');
        this.passwordInput = document.querySelector('input[name="password"]') || document.querySelector('input[type="password"]');
        
        // Create error/success containers if they don't exist
        this.createMessageContainers();
        
        // Log setup for debugging
        console.log('🔧 Login elements setup:', {
            form: !!this.loginForm,
            email: !!this.emailInput,
            password: !!this.passwordInput,
            submitBtn: !!this.submitButton
        });
    }

    /**
     * Create message containers for user feedback
     */
    createMessageContainers() {
        if (!this.errorContainer) {
            this.errorContainer = document.createElement('div');
            this.errorContainer.className = 'alert alert-danger login-error-alert';
            this.errorContainer.style.display = 'none';
            this.errorContainer.innerHTML = `
                <div class="d-flex align-items-center">
                    <i class="las la-exclamation-triangle me-2"></i>
                    <span class="error-message"></span>
                </div>
            `;
        }

        if (!this.successContainer) {
            this.successContainer = document.createElement('div');
            this.successContainer.className = 'alert alert-success login-success-alert';
            this.successContainer.style.display = 'none';
            this.successContainer.innerHTML = `
                <div class="d-flex align-items-center">
                    <i class="las la-check-circle me-2"></i>
                    <span class="success-message"></span>
                </div>
            `;
        }

        // Insert containers before the form
        if (this.loginForm) {
            this.loginForm.parentNode.insertBefore(this.errorContainer, this.loginForm);
            this.loginForm.parentNode.insertBefore(this.successContainer, this.loginForm);
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Clear messages when user starts typing
        document.addEventListener('input', (e) => {
            if (e.target.matches('input[name="email"], input[name="password"]')) {
                this.hideMessages();
            }
        });
    }

    /**
     * Handle form submit
     */
    handleSubmit(e) {
        const isEmailValid = this.validateEmail();
        const isPasswordValid = this.validatePassword();
        
        if (!isEmailValid || !isPasswordValid) {
            e.preventDefault();
            return false;
        }
        
        return true;
    }

    /**
     * Setup form validation
     */
    setupValidation() {
        // Setup form validation with event listeners
        if (this.loginForm) {
            this.setupFormValidation();
        }
    }

    /**
     * Setup form validation with event listeners
     */
    setupFormValidation() {
        // Add event listeners for real-time validation
        if (this.emailInput) {
            this.emailInput.addEventListener('blur', () => this.validateEmail());
            this.emailInput.addEventListener('input', () => this.clearFieldError('email'));
        }
        
        if (this.passwordInput) {
            this.passwordInput.addEventListener('blur', () => this.validatePassword());
            this.passwordInput.addEventListener('input', () => this.clearFieldError('password'));
        }
        
        // Form submit validation
        this.loginForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }

    /**
     * Validate email field
     */
    validateEmail() {
        const email = this.emailInput.value.trim();
        
        if (!email) {
            this.showFieldError('email', 'Email is required');
            return false;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showFieldError('email', 'Please enter a valid email address');
            return false;
        }
        
        this.clearFieldError('email');
        return true;
    }

    /**
     * Validate email field
     */
    validatePassword() {
        const password = this.passwordInput.value.trim();
        
        if (!password) {
            this.showFieldError('password', 'Password is required');
            return false;
        }
        
        if (password.length < 6) {
            this.showFieldError('password', 'Password must be at least 6 characters long');
            return false;
        }
        
        this.clearFieldError('password');
        return true;
    }

    /**
     * Handle form submit
     */
    handleFormSubmit(e) {
        const isEmailValid = this.validateEmail();
        const isPasswordValid = this.validatePassword();
        
        if (!isEmailValid || !isPasswordValid) {
            e.preventDefault();
            return false;
        }
        
        return true;
    }

    /**
     * Handle URL parameters for error/success messages
     */
    handleUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');
        const message = urlParams.get('message');
        const customMessage = urlParams.get('customMessage');

        if (error) {
            const errorMessage = customMessage || this.errorMessages[error] || 'Login failed. Please try again.';
            this.showError(errorMessage);
        }

        if (message) {
            const successMessage = this.successMessages[message] || 'Operation completed successfully.';
            this.showSuccess(successMessage);
        }

        // Clean URL after showing message
        if (error || message) {
            setTimeout(() => {
                const cleanUrl = window.location.pathname;
                window.history.replaceState({}, document.title, cleanUrl);
            }, 100);
        }
    }

    /**
     * Setup password toggle functionality
     */
    setupPasswordToggle() {
        const passwordToggleBtn = document.querySelector('.password-toggle-btn');
        const passwordToggleIcon = document.getElementById('passwordToggleIcon');
        
        if (passwordToggleBtn && this.passwordInput && passwordToggleIcon) {
            passwordToggleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.togglePasswordVisibility(passwordToggleIcon);
            });
        }
    }

    /**
     * Toggle password visibility with enhanced functionality
     */
    togglePasswordVisibility(toggleIcon) {
        if (!this.passwordInput) return;

        const isPassword = this.passwordInput.type === 'password';
        
        // Toggle input type
        this.passwordInput.type = isPassword ? 'text' : 'password';
        
        // Toggle icon with smooth animation
        if (isPassword) {
            toggleIcon.className = 'las la-eye-slash';
            toggleIcon.setAttribute('title', 'Hide Password');
            this.passwordInput.setAttribute('data-visible', 'true');
        } else {
            toggleIcon.className = 'las la-eye';
            toggleIcon.setAttribute('title', 'Show Password');
            this.passwordInput.removeAttribute('data-visible');
        }

        // Add visual feedback
        const toggleBtn = toggleIcon.closest('.password-toggle-btn');
        if (toggleBtn) {
            toggleBtn.style.color = isPassword ? 'var(--main-color, #007bff)' : '#6c757d';
        }

        // Smooth animation
        toggleIcon.style.transform = 'scale(0.8)';
        setTimeout(() => {
            toggleIcon.style.transform = 'scale(1)';
        }, 150);

        // Focus back to input for better UX
        this.passwordInput.focus();
    }

    /**
     * Prevent duplicate validation from other scripts
     */
    preventDuplicateValidation() {
        // Remove Bootstrap validation classes that might conflict
        if (this.loginForm) {
            this.loginForm.classList.remove('needs-validation');
            this.loginForm.noValidate = true;
        }
        
        // Disable other validation scripts
        this.disableOtherValidationScripts();
        
        // Clear any existing error messages
        this.clearAllFieldErrors();
    }

    /**
     * Disable other validation scripts
     */
    disableOtherValidationScripts() {
        // Remove event listeners from other validation scripts
        const emailInput = document.querySelector('input[name="email"]');
        const passwordInput = document.querySelector('input[name="password"]');
        
        if (emailInput) {
            // Clone and replace to remove all event listeners
            const newEmailInput = emailInput.cloneNode(true);
            emailInput.parentNode.replaceChild(newEmailInput, emailInput);
            this.emailInput = newEmailInput;
        }
        
        if (passwordInput) {
            // Clone and replace to remove all event listeners
            const newPasswordInput = passwordInput.cloneNode(true);
            passwordInput.parentNode.replaceChild(newPasswordInput, passwordInput);
            this.passwordInput = newPasswordInput;
        }
    }

    /**
     * Clear all existing field errors
     */
    clearAllFieldErrors() {
        // Remove all error messages
        const allErrorMessages = document.querySelectorAll('.invalid-feedback, .field-error');
        allErrorMessages.forEach(error => error.remove());
        
        // Remove error classes
        const allInputs = document.querySelectorAll('input');
        allInputs.forEach(input => {
            input.classList.remove('is-invalid');
        });
        
        // Remove error classes from containers
        const allContainers = document.querySelectorAll('.form-floating, .col-12');
        allContainers.forEach(container => {
            container.classList.remove('error', 'success');
        });
    }

    /**
     * Setup form animation
     */
    setupFormAnimation() {
        // Add loading animation styles
        const style = document.createElement('style');
        style.textContent = `
            .btn-loading {
                position: relative;
                pointer-events: none;
                opacity: 0.8;
            }
            
            .btn-loading::after {
                content: '';
                position: absolute;
                width: 20px;
                height: 20px;
                margin: auto;
                border: 2px solid transparent;
                border-top-color: #ffffff;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
            }
            
            @keyframes spin {
                0% { transform: translate(-50%, -50%) rotate(0deg); }
                100% { transform: translate(-50%, -50%) rotate(360deg); }
            }
            
            .form-floating.error .form-control {
                border-color: #dc3545;
                box-shadow: 0 0 0 0.25rem rgba(220, 53, 69, 0.25);
            }
            
            .form-floating.success .form-control {
                border-color: #198754;
                box-shadow: 0 0 0 0.25rem rgba(25, 135, 84, 0.25);
            }
            
            .login-error-alert, .login-success-alert {
                margin-bottom: 1.5rem;
                border-radius: 12px;
                border: none;
                font-weight: 500;
            }
            
            .login-error-alert {
                background: linear-gradient(135deg, #dc3545, #c82333);
                color: white;
            }
            
            .login-success-alert {
                background: linear-gradient(135deg, #198754, #157347);
                color: white;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Handle form submission
     */
    async handleSubmit(e) {
        e.preventDefault();
        
        if (this.loadingState) return;

        // Validate form
        if (!this.validateForm()) {
            return;
        }

        this.setLoadingState(true);
        this.hideMessages();

        try {
            const formData = new FormData(this.loginForm);
            const loginData = Object.fromEntries(formData.entries());

            // Add CSRF token if available
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            if (csrfToken) {
                loginData.csrfToken = csrfToken;
            }

            // Send AJAX request
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(loginData)
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess('Login successful! Redirecting to your dashboard...');
                
                // Save user data to localStorage for distributors
                if (result.companyType === 'distributor') {
                    try {
                        const userData = {
                            id: result.userId || result.user?.id,
                            name: result.name || result.user?.name,
                            email: result.email || result.user?.email,
                            role: result.role || result.user?.role,
                            userType: result.userType || result.user?.userType || "user",
                            companyType: result.companyType,
                            companyName: result.companyName || result.user?.companyName
                        };
                        localStorage.setItem('slex_buyer_user_data', JSON.stringify(userData));
                        
                    } catch (error) {
                        console.warn('❌ Multi-dashboard login: Failed to save user data to localStorage:', error);
                    }
                } else {
                    console.log('⚠️ Multi-dashboard login: User is not distributor, not saving to localStorage. companyType:', result.companyType);
                }
                
                // Redirect to dashboard
                setTimeout(() => {
                    window.location.href = result.redirectUrl || '/dashboard';
                }, 1000);
            } else {
                this.handleLoginError(result);
            }

        } catch (error) {
            console.error('Login error:', error);
            this.showError('Network error. Please check your connection and try again.');
        } finally {
            this.setLoadingState(false);
        }
    }

    /**
     * Handle login errors
     */
    handleLoginError(result) {
        const message = result.message || 'Login failed. Please try again.';
        this.showError(message);

        // Handle specific error types
        if (result.code === 'ACCOUNT_LOCKED') {
            this.disableForm(15 * 60 * 1000); // 15 minutes
        } else if (result.code === 'RATE_LIMITED') {
            this.disableForm(5 * 60 * 1000); // 5 minutes
        }

        // Show field-specific errors if available
        if (result.details && Array.isArray(result.details)) {
            result.details.forEach(detail => {
                this.showFieldError(detail.field, detail.message);
            });
        }
    }

    /**
     * Validate entire form
     */
    validateForm() {
        let isValid = true;

        // Validate email
        if (!this.validateEmail()) {
            isValid = false;
        }

        // Validate password
        if (!this.validatePassword()) {
            isValid = false;
        }

        return isValid;
    }

    /**
     * Validate email field
     */
    validateEmail() {
        if (!this.emailInput) return true;

        const email = this.emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email) {
            this.showFieldError('email', 'Email is required');
            return false;
        }

        if (!emailRegex.test(email)) {
            this.showFieldError('email', 'Please enter a valid email address');
            return false;
        }

        this.clearFieldError('email');
        return true;
    }

    /**
     * Validate password field
     */
    validatePassword() {
        if (!this.passwordInput) return true;

        const password = this.passwordInput.value;

        if (!password) {
            this.showFieldError('password', 'Password is required');
            return false;
        }

        if (password.length < 6) {
            this.showFieldError('password', 'Password must be at least 6 characters long');
            return false;
        }

        this.clearFieldError('password');
        return true;
    }

    /**
     * Show field-specific error
     */
    showFieldError(fieldName, message) {
        const field = document.querySelector(`input[name="${fieldName}"]`);
        if (field) {
            const container = field.closest('.form-floating') || field.parentNode;
            container.classList.add('error');
            container.classList.remove('success');

            // Create or update error message
            let errorElement = container.querySelector('.field-error');
            if (!errorElement) {
                errorElement = document.createElement('div');
                errorElement.className = 'field-error text-danger small mt-1';
                container.appendChild(errorElement);
            }
            
            // Get current language and show error in that language only
            const currentLang = this.getCurrentLanguage();
            const localizedMessage = this.getLocalizedErrorMessage(message, currentLang);
            
            errorElement.textContent = localizedMessage;
        }
    }

    /**
     * Get current language
     */
    getCurrentLanguage() {
        // Try to get language from various sources
        const htmlLang = document.documentElement.lang;
        const langFromUrl = window.location.pathname.includes('/language/') ? 
          window.location.pathname.split('/language/')[1]?.split('/')[0] : null;
        const langFromSelector = document.querySelector('.current-lang-text')?.textContent?.toLowerCase();
        
        return htmlLang || langFromUrl || langFromSelector || 'en';
    }

    /**
     * Get localized error message
     */
    getLocalizedErrorMessage(message, lang) {
        const errorMessages = {
            'en': {
                'is required': 'is required',
                'Email is required': 'Email is required',
                'Password is required': 'Password is required',
                'Please enter a valid email address': 'Please enter a valid email address',
                'Password must be at least 6 characters long': 'Password must be at least 6 characters long'
            },
            'uz': {
                'is required': 'majburiy',
                'Email is required': 'Email manzil majburiy',
                'Password is required': 'Parol majburiy',
                'Please enter a valid email address': 'To\'g\'ri email manzilni kiriting',
                'Password must be at least 6 characters long': 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak'
            },
            'ru': {
                'is required': 'обязательно',
                'Email is required': 'Email адрес обязателен',
                'Password is required': 'Пароль обязателен',
                'Please enter a valid email address': 'Введите корректный email адрес',
                'Password must be at least 6 characters long': 'Пароль должен содержать минимум 6 символов'
            }
        };

        // If language not found, return English
        if (!errorMessages[lang]) {
            return message;
        }

        // Find matching error message
        for (const [key, value] of Object.entries(errorMessages[lang])) {
            if (message.includes(key)) {
                return value;
            }
        }

        // If no match found, return original message
        return message;
    }

    /**
     * Clear field-specific error
     */
    clearFieldError(fieldName) {
        const field = document.querySelector(`input[name="${fieldName}"]`);
        if (field) {
            const container = field.closest('.form-floating') || field.parentNode;
            container.classList.remove('error');
            
            const errorElement = container.querySelector('.field-error');
            if (errorElement) {
                errorElement.remove();
            }

            // Add success state if field is valid
            if (field.value.trim()) {
                container.classList.add('success');
            }
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        this.hideMessages();
        if (this.errorContainer) {
            this.errorContainer.querySelector('.error-message').textContent = message;
            this.errorContainer.style.display = 'block';
            this.errorContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        this.hideMessages();
        if (this.successContainer) {
            this.successContainer.querySelector('.success-message').textContent = message;
            this.successContainer.style.display = 'block';
            this.successContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    /**
     * Hide all messages
     */
    hideMessages() {
        if (this.errorContainer) {
            this.errorContainer.style.display = 'none';
        }
        if (this.successContainer) {
            this.successContainer.style.display = 'none';
        }
    }

    /**
     * Set loading state
     */
    setLoadingState(loading) {
        this.loadingState = loading;
        
        if (this.submitButton) {
            if (loading) {
                this.submitButton.classList.add('btn-loading');
                this.submitButton.disabled = true;
                this.originalButtonText = this.submitButton.textContent;
                this.submitButton.textContent = 'Signing in...';
            } else {
                this.submitButton.classList.remove('btn-loading');
                this.submitButton.disabled = false;
                if (this.originalButtonText) {
                    this.submitButton.textContent = this.originalButtonText;
                }
            }
        }
    }

    /**
     * Disable form temporarily
     */
    disableForm(duration) {
        const formInputs = this.loginForm.querySelectorAll('input, button');
        formInputs.forEach(input => input.disabled = true);

        setTimeout(() => {
            formInputs.forEach(input => input.disabled = false);
        }, duration);
    }
}

// Initialize multi-dashboard login
new MultiDashboardLogin();