/**
 * SLEX Professional Authentication Handler
 * Modern, secure, and user-friendly authentication system
 */

class ProfessionalAuthHandler {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.loginBtn = this.form?.querySelector('button[type="submit"]');
        this.passwordToggle = document.getElementById('passwordToggle');
        this.rememberMe = document.getElementById('rememberMe');
        this.alertContainer = document.getElementById('alertContainer') || this.createAlertContainer();
        
        this.isSubmitting = false;
        this.maxRetries = 3;
        this.retryDelay = 1000;
        
        this.init();
    }

    init() {
        if (!this.form) {
            console.warn('Login form not found');
            return;
        }
        
        this.setupEventListeners();
        this.setupValidation();
        this.setupPasswordToggle();
        this.loadSavedCredentials();
        this.setupAutoSubmit();
    }

    setupEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Real-time validation
        this.emailInput?.addEventListener('input', () => this.validateEmail());
        this.emailInput?.addEventListener('blur', () => this.validateEmail());
        
        this.passwordInput?.addEventListener('input', () => this.validatePassword());
        this.passwordInput?.addEventListener('blur', () => this.validatePassword());
        
        // Remember me
        this.rememberMe?.addEventListener('change', () => this.handleRememberMe());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Form state updates
        this.form.addEventListener('input', () => this.updateFormState());
    }

    setupValidation() {
        // Add validation styling
        [this.emailInput, this.passwordInput].forEach(input => {
            if (input) {
                input.addEventListener('input', () => this.clearFieldError(input));
            }
        });
    }

    setupPasswordToggle() {
        if (this.passwordToggle && this.passwordInput) {
            this.passwordToggle.addEventListener('click', () => {
                const isPassword = this.passwordInput.type === 'password';
                this.passwordInput.type = isPassword ? 'text' : 'password';
                
                const icon = this.passwordToggle.querySelector('i');
                if (icon) {
                    icon.className = isPassword ? 'las la-eye-slash' : 'las la-eye';
                }
                
                this.passwordInput.focus();
            });
        }
    }

    setupAutoSubmit() {
        // Auto-submit on Enter key
        [this.emailInput, this.passwordInput].forEach(input => {
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && !this.loginBtn?.disabled) {
                        e.preventDefault();
                        this.handleSubmit(e);
                    }
                });
            }
        });
    }

    loadSavedCredentials() {
        try {
            const savedEmail = localStorage.getItem('slex_saved_email');
            const rememberMeState = localStorage.getItem('slex_remember_me') === 'true';
            
            if (savedEmail && rememberMeState && this.emailInput) {
                this.emailInput.value = savedEmail;
                if (this.rememberMe) {
                    this.rememberMe.checked = true;
                }
                this.validateEmail();
                if (this.passwordInput) {
                    this.passwordInput.focus();
                }
            }
        } catch (error) {
            console.warn('Failed to load saved credentials:', error);
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        if (this.isSubmitting) {
            return;
        }
        
        // Clear previous alerts
        this.clearAlerts();
        
        // Validate form
        if (!this.validateForm()) {
            this.showAlert('Please correct the errors below', 'error');
            return;
        }
        
        this.isSubmitting = true;
        this.setLoadingState(true);
        
        try {
            const formData = this.getFormData();
            const response = await this.submitLogin(formData);
            
            if (response.success) {
                await this.handleLoginSuccess(response);
            } else {
                this.handleLoginError(response);
            }
            
        } catch (error) {
            console.error('Login error:', error);
            this.handleNetworkError(error);
        } finally {
            this.isSubmitting = false;
            this.setLoadingState(false);
        }
    }

    getFormData() {
        return {
            email: this.emailInput?.value?.trim() || '',
            password: this.passwordInput?.value || '',
            rememberMe: this.rememberMe?.checked || false,
            clientInfo: {
                userAgent: navigator.userAgent,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                language: navigator.language,
                timestamp: new Date().toISOString()
            }
        };
    }

    async submitLogin(formData, retryCount = 0) {
        try {
            console.log(`🔐 Submitting login for: ${formData.email}`);
            
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(formData),
                credentials: 'same-origin'
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                // Handle specific HTTP errors
                if (response.status === 500 && retryCount < this.maxRetries) {
                    console.log(`🔄 Retrying login attempt ${retryCount + 1}/${this.maxRetries}`);
                    await this.delay(this.retryDelay * (retryCount + 1));
                    return this.submitLogin(formData, retryCount + 1);
                }
                
                throw new Error(data.message || `HTTP ${response.status}`);
            }
            
            return data;
            
        } catch (error) {
            if (retryCount < this.maxRetries && this.isRetryableError(error)) {
                console.log(`🔄 Retrying login due to error: ${error.message}`);
                await this.delay(this.retryDelay * (retryCount + 1));
                return this.submitLogin(formData, retryCount + 1);
            }
            throw error;
        }
    }

    async handleLoginSuccess(response) {
        console.log('✅ Login successful:', response.data?.user?.email);
        
        // Save credentials if remember me is checked
        if (this.rememberMe?.checked) {
            localStorage.setItem('slex_saved_email', this.emailInput?.value?.trim() || '');
            localStorage.setItem('slex_remember_me', 'true');
        } else {
            localStorage.removeItem('slex_saved_email');
            localStorage.removeItem('slex_remember_me');
        }
        
        // Save user data to localStorage for distributors
        if (response.data && response.data.companyType === 'distributor') {
            try {
                const userData = {
                    id: response.data.userId,
                    name: response.data.name,
                    email: response.data.email,
                    role: response.data.role,
                    userType: response.data.userType,
                    companyType: response.data.companyType,
                    companyName: response.data.companyName
                };
                localStorage.setItem('slex_buyer_user_data', JSON.stringify(userData));
                
            } catch (error) {
                console.warn('Failed to save user data to localStorage:', error);
            }
        }
        
        // Show success message
        this.showAlert('Login successful! Redirecting...', 'success');
        
        // Update login button
        if (this.loginBtn) {
            this.loginBtn.innerHTML = `
                <i class="las la-check-circle"></i>
                Success! Redirecting...
            `;
            this.loginBtn.classList.add('btn-success');
        }
        
        // Redirect after delay
        const redirectUrl = response.data?.redirectUrl || this.getDefaultRedirectUrl(response.data?.user);
        
        setTimeout(() => {
            console.log(`🔄 Redirecting to: ${redirectUrl}`);
            window.location.href = redirectUrl;
        }, 1500);
    }

    handleLoginError(response) {
        console.error('❌ Login failed:', response);
        
        let message = response.message || 'Login failed. Please try again.';
        let alertType = 'error';
        
        // Handle specific error codes
        const errorCode = response.meta?.code;
        
        switch (errorCode) {
            case 'INVALID_CREDENTIALS':
                message = 'Invalid email or password. Please check your credentials.';
                this.addFieldError(this.emailInput, 'Invalid credentials');
                this.addFieldError(this.passwordInput, 'Invalid credentials');
                break;
                
            case 'ACCOUNT_LOCKED':
                message = `Account locked due to too many failed attempts. Try again later.`;
                alertType = 'warning';
                this.disableFormTemporarily(300); // 5 minutes
                break;
                
            case 'ACCOUNT_INACTIVE':
                message = this.getAccountStatusMessage(response);
                alertType = 'warning';
                break;
                
            case 'RATE_LIMIT_EXCEEDED':
                message = 'Too many login attempts. Please wait before trying again.';
                alertType = 'warning';
                this.disableFormTemporarily(900); // 15 minutes
                break;
        }
        
        this.showAlert(message, alertType);
        
        // Focus appropriate field
        if (response.meta?.field === 'email' && this.emailInput) {
            this.emailInput.focus();
        } else if (response.meta?.field === 'password' && this.passwordInput) {
            this.passwordInput.focus();
        }
    }

    handleNetworkError(error) {
        console.error('🌐 Network error:', error);
        
        let message = 'Connection error. Please check your network and try again.';
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            message = 'Unable to connect to server. Please check your internet connection.';
        } else if (error.message.includes('timeout')) {
            message = 'Request timed out. Please try again.';
        }
        
        this.showAlert(message, 'error');
    }

    // Validation methods
    validateForm() {
        let isValid = true;
        
        if (!this.validateEmail()) isValid = false;
        if (!this.validatePassword()) isValid = false;
        
        return isValid;
    }

    validateEmail() {
        if (!this.emailInput) return true;
        
        const email = this.emailInput.value.trim();
        
        if (!email) {
            this.addFieldError(this.emailInput, 'Email is required');
            return false;
        }
        
        if (!this.isValidEmail(email)) {
            this.addFieldError(this.emailInput, 'Please enter a valid email address');
            return false;
        }
        
        this.clearFieldError(this.emailInput);
        return true;
    }

    validatePassword() {
        if (!this.passwordInput) return true;
        
        const password = this.passwordInput.value;
        
        if (!password) {
            this.addFieldError(this.passwordInput, 'Password is required');
            return false;
        }
        
        if (password.length < 6) {
            this.addFieldError(this.passwordInput, 'Password must be at least 6 characters');
            return false;
        }
        
        this.clearFieldError(this.passwordInput);
        return true;
    }

    // UI Helper methods
    addFieldError(field, message) {
        if (!field) return;
        
        field.classList.add('error');
        
        const wrapper = field.closest('.form-input-wrapper') || field.parentElement;
        let feedback = wrapper.querySelector('.input-feedback');
        
        if (!feedback) {
            feedback = document.createElement('div');
            feedback.className = 'input-feedback';
            wrapper.appendChild(feedback);
        }
        
        feedback.textContent = message;
        feedback.className = 'input-feedback error show';
    }

    clearFieldError(field) {
        if (!field) return;
        
        field.classList.remove('error');
        
        const wrapper = field.closest('.form-input-wrapper') || field.parentElement;
        const feedback = wrapper.querySelector('.input-feedback');
        
        if (feedback) {
            feedback.textContent = '';
            feedback.className = 'input-feedback';
        }
    }

    setLoadingState(loading) {
        if (!this.loginBtn) return;
        
        if (loading) {
            this.loginBtn.disabled = true;
            this.loginBtn.innerHTML = `
                <span class="spinner"></span>
                Signing in...
            `;
            this.form.style.pointerEvents = 'none';
        } else {
            this.loginBtn.disabled = false;
            this.loginBtn.innerHTML = `
                <i class="las la-sign-in-alt"></i>
                Sign In
            `;
            this.form.style.pointerEvents = 'auto';
            this.updateFormState();
        }
    }

    updateFormState() {
        if (!this.loginBtn) return;
        
        const email = this.emailInput?.value?.trim() || '';
        const password = this.passwordInput?.value || '';
        
        const canSubmit = email.length > 0 && password.length > 0 && !this.isSubmitting;
        this.loginBtn.disabled = !canSubmit;
    }

    disableFormTemporarily(seconds) {
        if (!this.loginBtn) return;
        
        let remaining = seconds;
        const originalText = this.loginBtn.textContent;
        
        const countdown = setInterval(() => {
            this.loginBtn.textContent = `Wait ${Math.ceil(remaining / 60)}m ${remaining % 60}s`;
            this.loginBtn.disabled = true;
            remaining--;
            
            if (remaining < 0) {
                clearInterval(countdown);
                this.loginBtn.textContent = originalText;
                this.updateFormState();
            }
        }, 1000);
    }

    // Alert system
    createAlertContainer() {
        const container = document.createElement('div');
        container.id = 'alertContainer';
        container.className = 'alert-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
        `;
        document.body.appendChild(container);
        return container;
    }

    showAlert(message, type = 'info') {
        const alertClass = `alert-${type}`;
        const iconClass = this.getAlertIcon(type);
        
        const alert = document.createElement('div');
        alert.className = `alert ${alertClass}`;
        alert.style.cssText = `
            padding: 12px 16px;
            margin-bottom: 10px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            gap: 8px;
            animation: slideInRight 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        `;
        
        alert.innerHTML = `
            <i class="las ${iconClass}"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" style="
                background: none;
                border: none;
                color: inherit;
                cursor: pointer;
                margin-left: auto;
                padding: 0;
                font-size: 18px;
            ">×</button>
        `;
        
        this.alertContainer.appendChild(alert);
        
        // Auto-remove after delay
        if (type === 'info' || type === 'success') {
            setTimeout(() => {
                if (alert.parentElement) {
                    alert.remove();
                }
            }, 5000);
        }
        
        // Add styles if not exist
        this.ensureAlertStyles();
    }

    clearAlerts() {
        this.alertContainer.innerHTML = '';
    }

    ensureAlertStyles() {
        if (document.getElementById('alert-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'alert-styles';
        styles.textContent = `
            .alert-success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
            .alert-error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
            .alert-warning { background: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
            .alert-info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
            
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            .spinner {
                display: inline-block;
                width: 16px;
                height: 16px;
                border: 2px solid #ffffff;
                border-radius: 50%;
                border-top-color: transparent;
                animation: spin 1s ease-in-out infinite;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            
            .form-input.error {
                border-color: #dc3545;
                box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
            }
            
            .input-feedback.error {
                color: #dc3545;
                font-size: 12px;
                margin-top: 4px;
                display: block;
            }
        `;
        document.head.appendChild(styles);
    }

    // Utility methods
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    isRetryableError(error) {
        const retryableErrors = ['NetworkError', 'TypeError', 'timeout'];
        return retryableErrors.some(errorType => 
            error.name.includes(errorType) || error.message.includes(errorType)
        );
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getAlertIcon(type) {
        const icons = {
            success: 'la-check-circle',
            error: 'la-exclamation-triangle',
            warning: 'la-exclamation-triangle',
            info: 'la-info-circle'
        };
        return icons[type] || icons.info;
    }

    getDefaultRedirectUrl(user) {
        if (!user) return '/';
        return user.userType === 'admin' ? '/admin/dashboard' : '/dashboard';
    }

    getAccountStatusMessage(response) {
        const status = response.accountStatus;
        const messages = {
            'pending': 'Your account is pending admin approval. Please wait for approval.',
            'blocked': 'Your account is pending admin approval. Please wait for approval.',
            'suspended': 'Your account has been suspended. Please contact support.',
            'rejected': 'Your account registration was rejected. Please contact support for assistance.'
        };
        return messages[status] || 'Your account is not active. Please contact support.';
    }

    handleRememberMe() {
        const isChecked = this.rememberMe?.checked || false;
        localStorage.setItem('slex_remember_me', isChecked.toString());
        
        if (!isChecked) {
            localStorage.removeItem('slex_saved_email');
        }
    }

    handleKeyboard(e) {
        // Escape to clear alerts
        if (e.key === 'Escape') {
            this.clearAlerts();
        }
    }

    // Public methods for external use
    reset() {
        if (this.form) {
            this.form.reset();
        }
        this.clearAlerts();
        this.clearFieldError(this.emailInput);
        this.clearFieldError(this.passwordInput);
        this.updateFormState();
    }

    focus() {
        if (this.emailInput?.value?.trim()) {
            this.passwordInput?.focus();
        } else {
            this.emailInput?.focus();
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.authHandler = new ProfessionalAuthHandler();
    
    // Focus email field initially
    setTimeout(() => {
        window.authHandler?.focus();
    }, 100);
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProfessionalAuthHandler;
}