/**
 * SLEX JWT Login Handler
 * Modern authentication with JWT tokens, CSRF protection,
 * and professional UX/UI interactions
 */

class JWTLoginHandler {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.loginBtn = document.getElementById('loginBtn');
        this.passwordToggle = document.getElementById('passwordToggle');
        this.rememberMe = document.getElementById('rememberMe');
        this.alertContainer = document.getElementById('alertContainer');
        
        this.isSubmitting = false;
        this.validationRules = this.initializeValidationRules();
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.initializeFormValidation();
        this.setupSecurityFeatures();
        this.checkSavedCredentials();
    }

    bindEvents() {
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Real-time validation
        this.emailInput.addEventListener('input', () => this.validateField('email'));
        this.emailInput.addEventListener('blur', () => this.validateField('email'));
        
        this.passwordInput.addEventListener('input', () => this.validateField('password'));
        this.passwordInput.addEventListener('blur', () => this.validateField('password'));
        
        // Password visibility toggle
        this.passwordToggle.addEventListener('click', () => this.togglePasswordVisibility());
        
        // Remember me functionality
        this.rememberMe.addEventListener('change', () => this.handleRememberMe());
        
        // Form state changes
        this.form.addEventListener('input', () => this.updateFormState());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
        
        // Security: Prevent form tampering
        this.form.addEventListener('focusin', () => this.checkFormIntegrity());
    }

    initializeValidationRules() {
        return {
            email: {
                required: true,
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                minLength: 5,
                maxLength: 254,
                message: {
                    required: 'Email address is required',
                    pattern: 'Please enter a valid email address',
                    minLength: 'Email must be at least 5 characters',
                    maxLength: 'Email must not exceed 254 characters'
                }
            },
            password: {
                required: true,
                minLength: 6,
                maxLength: 128,
                message: {
                    required: 'Password is required',
                    minLength: 'Password must be at least 6 characters',
                    maxLength: 'Password must not exceed 128 characters'
                }
            }
        };
    }

    initializeFormValidation() {
        // Add visual feedback for form fields
        [this.emailInput, this.passwordInput].forEach(input => {
            input.addEventListener('input', () => {
                this.clearFieldError(input);
            });
        });
    }

    setupSecurityFeatures() {
        // Disable autocomplete for sensitive fields in production
        if (window.location.protocol === 'https:') {
            this.passwordInput.setAttribute('autocomplete', 'current-password');
        }
        
        // Add hidden honeypot field to catch bots
        this.addHoneypotField();
        
        // Monitor for suspicious activity
        this.monitorSuspiciousActivity();
    }

    addHoneypotField() {
        const honeypot = document.createElement('input');
        honeypot.type = 'text';
        honeypot.name = 'website';
        honeypot.style.display = 'none';
        honeypot.tabIndex = -1;
        honeypot.autocomplete = 'off';
        this.form.appendChild(honeypot);
    }

    monitorSuspiciousActivity() {
        let rapidSubmissions = 0;
        const maxRapidSubmissions = 3;
        const timeWindow = 30000; // 30 seconds
        
        this.form.addEventListener('submit', () => {
            rapidSubmissions++;
            
            if (rapidSubmissions >= maxRapidSubmissions) {
                this.showAlert('Too many login attempts. Please wait before trying again.', 'warning');
                this.disableForm(30); // Disable for 30 seconds
            }
            
            setTimeout(() => {
                rapidSubmissions = Math.max(0, rapidSubmissions - 1);
            }, timeWindow);
        });
    }

    checkSavedCredentials() {
        // Check if user has saved credentials
        const savedEmail = localStorage.getItem('slex_saved_email');
        const rememberMeState = localStorage.getItem('slex_remember_me') === 'true';
        
        if (savedEmail && rememberMeState) {
            this.emailInput.value = savedEmail;
            this.rememberMe.checked = true;
            this.validateField('email');
            this.passwordInput.focus();
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        if (this.isSubmitting) return;
        
        // Clear previous alerts
        this.clearAlerts();
        
        // Validate all fields
        const isValid = this.validateAllFields();
        if (!isValid) {
            this.showAlert('Please correct the errors below and try again.', 'danger');
            return;
        }
        
        // Check honeypot
        if (this.form.website && this.form.website.value) {
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
            this.handleLoginError({
                message: 'Network error. Please check your connection and try again.',
                code: 'NETWORK_ERROR'
            });
        } finally {
            this.isSubmitting = false;
            this.setLoadingState(false);
        }
    }

    getFormData() {
        return {
            email: this.emailInput.value.trim(),
            password: this.passwordInput.value,
            rememberMe: this.rememberMe.checked,
            csrfToken: document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
            clientInfo: {
                userAgent: navigator.userAgent,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                language: navigator.language,
                timestamp: new Date().toISOString()
            }
        };
    }

    async submitLogin(formData) {
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
            throw new Error(data.message || 'Login failed');
        }
        
        return data;
    }

    async handleLoginSuccess(response) {
        // Save email if remember me is checked
        if (this.rememberMe.checked) {
            localStorage.setItem('slex_saved_email', this.emailInput.value.trim());
            localStorage.setItem('slex_remember_me', 'true');
        } else {
            localStorage.removeItem('slex_saved_email');
            localStorage.removeItem('slex_remember_me');
        }
        
        // Show success message
        this.showAlert('Login successful! Redirecting...', 'success');
        
        // Add visual feedback
        this.loginBtn.innerHTML = `
            <span class="btn-loader">
                <i class="las la-check-circle"></i>
                Success! Redirecting...
            </span>
        `;
        
        // Wait a moment before redirect for UX
        setTimeout(() => {
            if (response.data?.redirectUrl) {
                window.location.href = response.data.redirectUrl;
            } else {
                // Fallback redirect based on user type
                const userType = response.data?.user?.userType;
                window.location.href = userType === 'admin' ? '/admin/dashboard' : '/dashboard';
            }
        }, 1500);
    }

    handleLoginError(response) {
        let message = response.message || 'Login failed. Please try again.';
        let alertType = 'danger';
        
        // Handle specific error codes
        switch (response.meta?.code) {
            case 'INVALID_CREDENTIALS':
                message = 'Invalid email or password. Please check your credentials.';
                this.addFieldError(this.emailInput, 'Invalid credentials');
                this.addFieldError(this.passwordInput, 'Invalid credentials');
                break;
                
            case 'ACCOUNT_LOCKED':
                message = `Account locked due to too many failed attempts. ${response.meta.lockTimeRemaining ? `Try again in ${response.meta.lockTimeRemaining} minutes.` : ''}`;
                alertType = 'warning';
                break;
                
            case 'ACCOUNT_INACTIVE':
                message = 'Your account is not active. Please contact support.';
                alertType = 'warning';
                break;
                
            case 'RATE_LIMIT_EXCEEDED':
            case 'LOGIN_RATE_LIMIT':
                message = 'Too many login attempts. Please wait before trying again.';
                alertType = 'warning';
                this.disableForm(60); // Disable for 1 minute
                break;
                
            case 'CSRF_INVALID':
                message = 'Security validation failed. Please refresh the page and try again.';
                setTimeout(() => window.location.reload(), 2000);
                break;
                
            case 'IP_BLOCKED':
                message = 'Your IP address has been temporarily blocked due to suspicious activity.';
                alertType = 'warning';
                break;
        }
        
        this.showAlert(message, alertType);
        
        // Focus appropriate field based on error
        if (response.meta?.field === 'email') {
            this.emailInput.focus();
        } else if (response.meta?.field === 'password') {
            this.passwordInput.focus();
        }
    }

    validateAllFields() {
        let isValid = true;
        
        if (!this.validateField('email')) isValid = false;
        if (!this.validateField('password')) isValid = false;
        
        return isValid;
    }

    validateField(fieldName) {
        const input = fieldName === 'email' ? this.emailInput : this.passwordInput;
        const value = input.value.trim();
        const rules = this.validationRules[fieldName];
        
        // Clear previous validation state
        this.clearFieldError(input);
        
        // Required validation
        if (rules.required && !value) {
            this.addFieldError(input, rules.message.required);
            return false;
        }
        
        if (value) {
            // Length validation
            if (rules.minLength && value.length < rules.minLength) {
                this.addFieldError(input, rules.message.minLength);
                return false;
            }
            
            if (rules.maxLength && value.length > rules.maxLength) {
                this.addFieldError(input, rules.message.maxLength);
                return false;
            }
            
            // Pattern validation
            if (rules.pattern && !rules.pattern.test(value)) {
                this.addFieldError(input, rules.message.pattern);
                return false;
            }
        }
        
        // Field is valid
        this.addFieldSuccess(input);
        return true;
    }

    addFieldError(input, message) {
        input.classList.remove('success');
        input.classList.add('error');
        
        const feedback = input.parentElement.querySelector('.input-feedback');
        if (feedback) {
            feedback.textContent = message;
            feedback.className = 'input-feedback error show';
        }
    }

    addFieldSuccess(input) {
        input.classList.remove('error');
        input.classList.add('success');
        
        const feedback = input.parentElement.querySelector('.input-feedback');
        if (feedback) {
            feedback.className = 'input-feedback success';
            feedback.textContent = '';
        }
    }

    clearFieldError(input) {
        input.classList.remove('error', 'success');
        
        const feedback = input.parentElement.querySelector('.input-feedback');
        if (feedback) {
            feedback.className = 'input-feedback';
            feedback.textContent = '';
        }
    }

    updateFormState() {
        const email = this.emailInput.value.trim();
        const password = this.passwordInput.value;
        
        // Enable submit button only if both fields have content
        const canSubmit = email.length > 0 && password.length > 0 && !this.isSubmitting;
        this.loginBtn.disabled = !canSubmit;
    }

    togglePasswordVisibility() {
        const isPassword = this.passwordInput.type === 'password';
        this.passwordInput.type = isPassword ? 'text' : 'password';
        
        const icon = this.passwordToggle.querySelector('i');
        icon.className = isPassword ? 'las la-eye-slash' : 'las la-eye';
        
        // Maintain focus on password input
        this.passwordInput.focus();
    }

    handleRememberMe() {
        const isChecked = this.rememberMe.checked;
        localStorage.setItem('slex_remember_me', isChecked.toString());
        
        if (!isChecked) {
            localStorage.removeItem('slex_saved_email');
        }
    }

    setLoadingState(loading) {
        const btnText = this.loginBtn.querySelector('.btn-text');
        const btnLoader = this.loginBtn.querySelector('.btn-loader');
        
        if (loading) {
            btnText.style.display = 'none';
            btnLoader.style.display = 'flex';
            this.loginBtn.disabled = true;
            this.form.style.pointerEvents = 'none';
        } else {
            btnText.style.display = 'block';
            btnLoader.style.display = 'none';
            this.form.style.pointerEvents = 'auto';
            this.updateFormState();
        }
    }

    disableForm(seconds) {
        this.loginBtn.disabled = true;
        this.emailInput.disabled = true;
        this.passwordInput.disabled = true;
        
        let remaining = seconds;
        const originalText = this.loginBtn.querySelector('.btn-text').textContent;
        
        const countdown = setInterval(() => {
            this.loginBtn.querySelector('.btn-text').textContent = `Wait ${remaining}s`;
            remaining--;
            
            if (remaining < 0) {
                clearInterval(countdown);
                this.loginBtn.querySelector('.btn-text').textContent = originalText;
                this.emailInput.disabled = false;
                this.passwordInput.disabled = false;
                this.updateFormState();
            }
        }, 1000);
    }

    showAlert(message, type = 'info') {
        const alertHtml = `
            <div class="alert alert-${type} alert-dismissible">
                <i class="las ${this.getAlertIcon(type)}"></i>
                <span>${message}</span>
                <button type="button" class="alert-close" onclick="this.parentElement.remove()">
                    <i class="las la-times"></i>
                </button>
            </div>
        `;
        
        this.alertContainer.insertAdjacentHTML('beforeend', alertHtml);
        
        // Auto-remove after 5 seconds for non-critical alerts
        if (type === 'info' || type === 'success') {
            setTimeout(() => {
                const alerts = this.alertContainer.querySelectorAll('.alert');
                if (alerts.length > 0) {
                    alerts[alerts.length - 1].remove();
                }
            }, 5000);
        }
    }

    clearAlerts() {
        this.alertContainer.innerHTML = '';
    }

    getAlertIcon(type) {
        const icons = {
            success: 'la-check-circle',
            danger: 'la-exclamation-triangle',
            warning: 'la-exclamation-triangle',
            info: 'la-info-circle'
        };
        return icons[type] || icons.info;
    }

    handleKeyboardShortcuts(e) {
        // Enter key to submit form
        if (e.key === 'Enter' && (e.target === this.emailInput || e.target === this.passwordInput)) {
            e.preventDefault();
            if (!this.loginBtn.disabled) {
                this.handleSubmit(e);
            }
        }
        
        // Escape key to clear form
        if (e.key === 'Escape') {
            this.clearAlerts();
        }
    }

    checkFormIntegrity() {
        // Verify CSRF token is still present
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (!csrfToken) {
            this.showAlert('Security token missing. Please refresh the page.', 'warning');
            setTimeout(() => window.location.reload(), 2000);
        }
    }

    // Public methods for external use
    reset() {
        this.form.reset();
        this.clearAlerts();
        this.clearFieldError(this.emailInput);
        this.clearFieldError(this.passwordInput);
        this.updateFormState();
    }

    focus() {
        if (this.emailInput.value.trim()) {
            this.passwordInput.focus();
        } else {
            this.emailInput.focus();
        }
    }
}

// Language Selector Handler
class LanguageSelector {
    constructor() {
        this.toggle = document.getElementById('languageToggle');
        this.panel = document.getElementById('languagePanel');
        this.init();
    }

    init() {
        if (!this.toggle || !this.panel) return;
        
        this.toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePanel();
        });
        
        document.addEventListener('click', () => {
            this.closePanel();
        });
        
        this.panel.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    togglePanel() {
        this.panel.classList.toggle('active');
    }

    closePanel() {
        this.panel.classList.remove('active');
    }
}

// Theme Handler
class AuthThemeHandler {
    constructor() {
        this.toggle = document.getElementById('themeToggle');
        this.currentTheme = localStorage.getItem('dashboard-theme') || 'light';
        this.init();
    }

    init() {
        if (!this.toggle) return;
        
        this.applyTheme();
        this.toggle.addEventListener('click', () => this.toggleTheme());
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        localStorage.setItem('dashboard-theme', this.currentTheme);
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        
        if (this.toggle) {
            const icon = this.toggle.querySelector('i');
            if (icon) {
                icon.className = this.currentTheme === 'light' ? 'las la-moon' : 'las la-sun';
            }
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize main login handler
    window.loginHandler = new JWTLoginHandler();
    
    // Initialize language selector
    window.languageSelector = new LanguageSelector();
    
    // Initialize theme handler
    window.themeHandler = new AuthThemeHandler();
    
    // Focus email field initially
    setTimeout(() => {
        window.loginHandler.focus();
    }, 100);
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { JWTLoginHandler, LanguageSelector, AuthThemeHandler };
}