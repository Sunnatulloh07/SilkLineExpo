/*
Modern Login Form Handler
Professional authentication with enhanced UX
Senior Software Engineer Clean Code Implementation
*/

(function() {
    'use strict';

    class ModernLogin {
        constructor() {
            this.form = document.getElementById('loginForm');
            this.isSubmitting = false;
            this.maxAttempts = 5;
            this.currentAttempts = 0;
            
            this.init();
        }

        init() {
            if (!this.form) return;
            
            this.setupPasswordToggle();
            this.setupFormValidation();
            this.setupFormSubmission();
            this.setupThemeManagement();
            this.setupLanguageManagement();
            
        }

        setupPasswordToggle() {
            const passwordToggle = document.getElementById('passwordToggle');
            const passwordInput = document.getElementById('password');
            
            if (passwordToggle && passwordInput) {
                passwordToggle.addEventListener('click', () => {
                    const isPassword = passwordInput.type === 'password';
                    const icon = passwordToggle.querySelector('i');
                    
                    // Toggle password visibility
                    passwordInput.type = isPassword ? 'text' : 'password';
                    
                    // Update icon
                    if (icon) {
                        icon.className = isPassword ? 'las la-eye-slash' : 'las la-eye';
                    }
                    
                    // Add visual feedback
                    passwordToggle.style.color = isPassword ? 'var(--primary-600)' : 'var(--text-secondary)';
                });
            }
        }

        setupFormValidation() {
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            
            if (emailInput) {
                emailInput.addEventListener('blur', () => this.validateEmail(emailInput));
                emailInput.addEventListener('input', () => this.clearFieldError(emailInput));
            }
            
            if (passwordInput) {
                passwordInput.addEventListener('blur', () => this.validatePassword(passwordInput));
                passwordInput.addEventListener('input', () => this.clearFieldError(passwordInput));
            }
        }

        setupFormSubmission() {
            this.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSubmit();
            });
        }

        setupThemeManagement() {
            const themeToggle = document.getElementById('themeToggle');
            
            if (themeToggle) {
                themeToggle.addEventListener('click', () => {
                    this.toggleTheme();
                });
            }
            
            // Initialize theme from localStorage
            this.initializeTheme();
        }

        setupLanguageManagement() {
            const languageToggle = document.getElementById('languageToggle');
            const languagePanel = document.getElementById('languagePanel');
            
            if (languageToggle && languagePanel) {
                languageToggle.addEventListener('click', (e) => {
                    e.stopPropagation();
                    languagePanel.classList.toggle('active');
                });
                
                // Close language panel when clicking outside
                document.addEventListener('click', () => {
                    languagePanel.classList.remove('active');
                });
            }
        }

        validateEmail(emailInput) {
            const email = emailInput.value.trim();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            
            if (!email) {
                this.showFieldError(emailInput, 'Email is required');
                return false;
            }
            
            if (!emailRegex.test(email)) {
                this.showFieldError(emailInput, 'Please enter a valid email address');
                return false;
            }
            
            this.clearFieldError(emailInput);
            return true;
        }

        validatePassword(passwordInput) {
            const password = passwordInput.value;
            
            if (!password) {
                this.showFieldError(passwordInput, 'Password is required');
                return false;
            }
            
            if (password.length < 6) {
                this.showFieldError(passwordInput, 'Password must be at least 6 characters');
                return false;
            }
            
            this.clearFieldError(passwordInput);
            return true;
        }

        showFieldError(field, message) {
            this.clearFieldError(field);
            
            field.classList.add('error');
            
            const feedback = document.getElementById(field.name + 'Feedback');
            if (feedback) {
                feedback.textContent = message;
                feedback.className = 'input-feedback error show';
            }
        }

        clearFieldError(field) {
            field.classList.remove('error', 'success');
            
            const feedback = document.getElementById(field.name + 'Feedback');
            if (feedback) {
                feedback.textContent = '';
                feedback.className = 'input-feedback';
            }
        }

        async handleSubmit() {
            if (this.isSubmitting) return;
            
            // Validate form
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            
            const isEmailValid = this.validateEmail(emailInput);
            const isPasswordValid = this.validatePassword(passwordInput);
            
            if (!isEmailValid || !isPasswordValid) {
                this.showAlert('Please correct the errors above', 'error');
                return;
            }
            
            // Check rate limiting
            if (this.currentAttempts >= this.maxAttempts) {
                this.showAlert('Too many failed attempts. Please try again later.', 'error');
                return;
            }
            
            this.isSubmitting = true;
            this.showLoadingState();
            
            try {
                const formData = new FormData(this.form);
                const data = {
                    email: formData.get('email'),
                    password: formData.get('password'),
                    csrfToken: formData.get('csrfToken')
                };
                
                const response = await fetch('/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': this.getCSRFToken()
                    },
                    body: JSON.stringify(data),
                    credentials: 'same-origin'  // CRITICAL: Enable cookies for JWT tokens
                });
                
                const result = await response.json();
                
                if (response.ok && result.success) {
                    console.log('🎉 Login successful - checking cookie setting...');
                    console.log('🍪 Cookies before:', document.cookie);
                    
                    // Check if accessToken cookie was set
                    setTimeout(() => {
                        console.log('🍪 Cookies after 100ms:', document.cookie);
                        const hasAccessToken = document.cookie.includes('accessToken');
                        const hasRefreshToken = document.cookie.includes('refreshToken');
                        
                        if (hasAccessToken && hasRefreshToken) {
                            console.log('✅ JWT cookies successfully set!');
                        } else {
                            console.warn('⚠️ JWT cookies not found - using session auth fallback');
                        }
                        
                        this.handleLoginSuccess(result);
                    }, 500);  // Increased timeout to ensure cookies are set
                } else {
                    this.handleLoginError(result, response.status);
                }
            } catch (error) {
                console.error('Login error:', error);
                this.showAlert('Network error. Please check your connection and try again.', 'error');
                this.currentAttempts++;
            } finally {
                this.isSubmitting = false;
                this.hideLoadingState();
            }
        }

        handleLoginSuccess(result) {
            this.showAlert('Login successful! Redirecting...', 'success');
            
            // Reset attempts counter
            this.currentAttempts = 0;
            
            // Redirect after short delay
            setTimeout(() => {
                window.location.href = result.redirectUrl || '/dashboard';
            }, 1500);
        }

        handleLoginError(result, status) {
            this.currentAttempts++;
            
            if (status === 401) {
                this.showAlert('Invalid email or password. Please try again.', 'error');
            } else if (status === 429) {
                this.showAlert('Too many login attempts. Please try again later.', 'error');
            } else if (status === 423) {
                this.showAlert('Account is locked. Please contact support.', 'error');
            } else {
                this.showAlert(result.message || 'Login failed. Please try again.', 'error');
            }
            
            // Clear password field on error
            const passwordInput = document.getElementById('password');
            if (passwordInput) {
                passwordInput.value = '';
                passwordInput.focus();
            }
        }

        showLoadingState() {
            const submitBtn = this.form.querySelector('button[type="submit"]');
            const btnText = submitBtn?.querySelector('.btn-text');
            const btnLoader = submitBtn?.querySelector('.btn-loader');
            
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.classList.add('loading');
            }
            
            if (btnText) btnText.style.display = 'none';
            if (btnLoader) btnLoader.style.display = 'flex';
        }

        hideLoadingState() {
            const submitBtn = this.form.querySelector('button[type="submit"]');
            const btnText = submitBtn?.querySelector('.btn-text');
            const btnLoader = submitBtn?.querySelector('.btn-loader');
            
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.classList.remove('loading');
            }
            
            if (btnText) btnText.style.display = 'flex';
            if (btnLoader) btnLoader.style.display = 'none';
        }

        initializeTheme() {
            const savedTheme = localStorage.getItem('theme') || 'light';
            const html = document.documentElement;
            const themeIcon = document.querySelector('#themeToggle i');
            
            html.setAttribute('data-theme', savedTheme);
            
            if (themeIcon) {
                themeIcon.className = savedTheme === 'dark' ? 'las la-sun' : 'las la-moon';
            }
        }

        toggleTheme() {
            const html = document.documentElement;
            const currentTheme = html.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            const themeIcon = document.querySelector('#themeToggle i');
            
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            if (themeIcon) {
                themeIcon.className = newTheme === 'dark' ? 'las la-sun' : 'las la-moon';
            }
            
            // Add smooth transition effect
            html.style.transition = 'background-color 0.3s ease, color 0.3s ease';
            setTimeout(() => {
                html.style.transition = '';
            }, 300);
        }

        showAlert(message, type = 'info') {
            // Remove existing alerts
            const existingAlerts = document.querySelectorAll('.alert-toast');
            existingAlerts.forEach(alert => alert.remove());
            
            const alert = document.createElement('div');
            alert.className = `alert-toast alert-${type}`;
            
            const icon = type === 'error' ? 'las la-exclamation-triangle' : 
                        type === 'success' ? 'las la-check-circle' : 'las la-info-circle';
            
            alert.innerHTML = `
                <div class="alert-content">
                    <i class="${icon}"></i>
                    <span>${message}</span>
                </div>
            `;
            
            document.body.appendChild(alert);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (alert.parentElement) {
                    alert.style.animation = 'slideOut 0.3s ease forwards';
                    setTimeout(() => alert.remove(), 300);
                }
            }, 5000);
        }

        getCSRFToken() {
            return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
        }
    }

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        new ModernLogin();
    });

    // Add required CSS for alerts if not present
    if (!document.querySelector('#login-alert-styles')) {
        const styles = document.createElement('style');
        styles.id = 'login-alert-styles';
        styles.textContent = `
            .alert-toast {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 16px 24px;
                border-radius: 12px;
                color: white;
                font-weight: 600;
                z-index: 10000;
                animation: slideIn 0.3s ease;
                max-width: 400px;
                box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                backdrop-filter: blur(10px);
            }
            .alert-success { 
                background: linear-gradient(135deg, #28a745, #20c997); 
            }
            .alert-error { 
                background: linear-gradient(135deg, #dc3545, #e74c3c); 
            }
            .alert-info { 
                background: linear-gradient(135deg, #17a2b8, #20c997); 
            }
            .alert-content { 
                display: flex; 
                align-items: center; 
                gap: 12px; 
            }
            .alert-content i { 
                font-size: 20px; 
            }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(styles);
    }

})();