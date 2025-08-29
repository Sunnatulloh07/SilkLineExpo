/**
 * Login Form Handler
 * Handles login form submission with blocked user notifications
 */

class LoginHandler {
  constructor() {
    this.form = document.getElementById('loginForm');
    this.isSubmitting = false;
    this.init();
  }

  init() {
    if (!this.form) return;
    
    this.setupFormValidation();
    this.setupPasswordToggle();
    
  }

  setupFormValidation() {
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    
    // Real-time validation
    const inputs = this.form.querySelectorAll('input[required]');
    inputs.forEach(input => {
      input.addEventListener('blur', () => this.validateField(input));
      input.addEventListener('input', () => this.clearFieldError(input));
    });
  }

  setupPasswordToggle() {
    const toggleButtons = document.querySelectorAll('.toggle-password');
    toggleButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const targetId = button.getAttribute('data-target');
        const passwordField = document.getElementById(targetId);
        
        if (passwordField) {
          const isPassword = passwordField.type === 'password';
          passwordField.type = isPassword ? 'text' : 'password';
          
          const icon = button.querySelector('img');
          if (icon) {
            icon.src = isPassword 
              ? '/assets/images/icons/eye-icon.svg' 
              : '/assets/images/icons/lock-icon.svg';
          }
        }
      });
    });
  }

  validateField(field) {
    const value = field.value.trim();
    
    if (field.hasAttribute('required') && !value) {
      this.showFieldError(field, `${this.getFieldLabel(field)} is required`);
      return false;
    }

    // Email validation
    if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        this.showFieldError(field, 'Please enter a valid email address');
        return false;
      }
    }
    
    this.clearFieldError(field);
    return true;
  }

  showFieldError(field, message) {
    this.clearFieldError(field);
    
    field.classList.add('is-invalid');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'invalid-feedback d-block';
    
    // Get current language and show error in that language only
    const currentLang = this.getCurrentLanguage();
    const localizedMessage = this.getLocalizedErrorMessage(message, currentLang);
    
    errorDiv.textContent = localizedMessage;
    
    field.parentNode.appendChild(errorDiv);
  }

  getCurrentLanguage() {
    // Try to get language from various sources
    const htmlLang = document.documentElement.lang;
    const langFromUrl = window.location.pathname.includes('/language/') ? 
      window.location.pathname.split('/language/')[1]?.split('/')[0] : null;
    const langFromSelector = document.querySelector('.current-lang-text')?.textContent?.toLowerCase();
    
    return htmlLang || langFromUrl || langFromSelector || 'en';
  }

  getLocalizedErrorMessage(message, lang) {
    const errorMessages = {
      'en': {
        'is required': 'is required',
        'Please enter a valid email address': 'Please enter a valid email address',
        'Password must be at least 6 characters': 'Password must be at least 6 characters'
      },
      'uz': {
        'is required': 'majburiy',
        'Please enter a valid email address': 'To\'g\'ri email manzilni kiriting',
        'Password must be at least 6 characters': 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak'
      },
      'ru': {
        'is required': 'обязательно',
        'Please enter a valid email address': 'Введите корректный email адрес',
        'Password must be at least 6 characters': 'Пароль должен содержать минимум 6 символов'
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

  clearFieldError(field) {
    field.classList.remove('is-invalid');
    
    const errorDiv = field.parentNode.querySelector('.invalid-feedback');
    if (errorDiv) {
      errorDiv.remove();
    }
  }

  getFieldLabel(field) {
    const label = field.parentNode.parentNode.querySelector('label');
    return label ? label.textContent.replace('*', '').trim() : field.name;
  }

  async handleSubmit(e) {
    e.preventDefault();
    
    if (this.isSubmitting) return;
    
    // Validate all required fields
    const inputs = this.form.querySelectorAll('input[required]');
    let isValid = true;
    
    inputs.forEach(input => {
      if (!this.validateField(input)) {
        isValid = false;
      }
    });
    
    if (!isValid) {
      this.showToast('Please fill in all required fields', 'error');
      return;
    }
    
    this.isSubmitting = true;
    this.showLoadingState();
    
    try {
      const formData = new FormData(this.form);
      
      // Convert FormData to JSON for better handling
      const loginData = {
        identifier: formData.get('identifier'),
        password: formData.get('password'),
        rememberMe: formData.get('rememberMe') === 'on',
        csrfToken: formData.get('csrfToken')
      };

      console.log('🔍 Submitting login with data:', {
        identifier: loginData.identifier,
        hasPassword: !!loginData.password,
        rememberMe: loginData.rememberMe,
        hasCsrfToken: !!loginData.csrfToken
      });
      
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(loginData),
        credentials: 'include' // Important for cookies
      });
      
      const result = await response.json();
      console.log('🔍 Login response:', result);
      
      if (result.success) {
        this.showToast('Login successful! Redirecting...', 'success');
        
        // Use the redirect URL from the response - check both data.redirectUrl and data.user structure
        const redirectUrl = result.data?.redirectUrl || 
                           (result.data?.user?.userType === 'admin' ? '/admin/dashboard' : '/dashboard');
        
        setTimeout(() => {
          console.log('🔄 Redirecting to:', redirectUrl);
          window.location.href = redirectUrl;
        }, 500);
      } else {
        this.handleLoginError(result, response.status);
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      this.showToast('Network error. Please check your connection and try again.', 'error');
    } finally {
      this.isSubmitting = false;
      this.hideLoadingState();
    }
  }

  handleLoginError(result, status) {
    switch (status) {
      case 401:
        this.showToast(result.message || 'Invalid credentials', 'error');
        if (result.attemptsRemaining !== undefined) {
          this.showToast(`Attempts remaining: ${result.attemptsRemaining}`, 'warning', 5000);
        }
        break;
      
      case 403:
        // Handle blocked/suspended accounts
        if (result.type === 'blocked') {
          this.showBlockedAccountDialog(result.data);
        } else if (result.type === 'suspended') {
          this.showSuspendedAccountDialog(result);
        } else {
          this.showToast(result.message || 'Account access denied', 'error');
        }
        break;
      
      case 423:
        // Account locked
        this.showLockedAccountDialog(result);
        break;
      
      default:
        this.showToast(result.message || 'Login failed. Please try again.', 'error');
    }
  }

  showBlockedAccountDialog(data) {
    const registrationDate = new Date(data.registrationDate).toLocaleDateString();
    
    const modal = this.createModal({
      title: 'Account Pending Approval',
      icon: 'las la-clock',
      iconColor: '#ffc107',
      content: `
        <div class="blocked-account-info">
          <p class="mb-3">Your company registration is currently under review by our administrators.</p>
          <div class="info-grid">
            <div class="info-item">
              <strong>Status:</strong> <span class="text-warning">Pending Approval</span>
            </div>
            <div class="info-item">
              <strong>Registration Date:</strong> ${registrationDate}
            </div>
          </div>
          <div class="alert alert-info mt-4">
            <i class="las la-info-circle"></i>
            <div>
              <strong>What happens next?</strong>
              <ul class="mb-0 mt-2">
                <li>Our team will review your company information</li>
                <li>You'll receive an email notification once approved</li>
                <li>Approval typically takes 1-3 business days</li>
              </ul>
            </div>
          </div>
          <div class="contact-admin mt-4">
            <p class="mb-2"><strong>Need urgent approval?</strong></p>
            <div class="contact-options">
              <a href="tel:+998771234567" class="btn btn-sm btn-outline-primary">
                <i class="las la-phone"></i> Call Admin
              </a>
              <a href="mailto:admin@slex.uz" class="btn btn-sm btn-outline-primary">
                <i class="las la-envelope"></i> Email Admin
              </a>
            </div>
          </div>
        </div>
      `,
      primaryButton: {
        text: 'Got it',
        action: () => this.closeModal()
      }
    });
    
    this.showModal(modal);
  }

  showSuspendedAccountDialog(result) {
    const modal = this.createModal({
      title: 'Account Suspended',
      icon: 'las la-ban',
      iconColor: '#dc3545',
      content: `
        <div class="suspended-account-info">
          <p class="mb-3">Your account has been suspended by an administrator.</p>
          <div class="alert alert-danger">
            <i class="las la-exclamation-triangle"></i>
            <div>
              <strong>Account Status:</strong> Suspended<br>
              <strong>Action Required:</strong> Contact administrator for reactivation
            </div>
          </div>
          <div class="contact-admin mt-4">
            <p class="mb-2"><strong>To reactivate your account:</strong></p>
            <div class="contact-options">
              <a href="tel:+998771234567" class="btn btn-sm btn-outline-danger">
                <i class="las la-phone"></i> Call Admin
              </a>
              <a href="mailto:admin@slex.uz" class="btn btn-sm btn-outline-danger">
                <i class="las la-envelope"></i> Email Admin
              </a>
            </div>
          </div>
        </div>
      `,
      primaryButton: {
        text: 'Contact Admin',
        action: () => window.location.href = 'mailto:admin@slex.uz'
      }
    });
    
    this.showModal(modal);
  }

  showLockedAccountDialog(result) {
    const unlockTime = new Date(result.lockedUntil).toLocaleString();
    
    const modal = this.createModal({
      title: 'Account Temporarily Locked',
      icon: 'las la-lock',
      iconColor: '#ffc107',
      content: `
        <div class="locked-account-info">
          <p class="mb-3">Your account has been temporarily locked due to multiple failed login attempts.</p>
          <div class="alert alert-warning">
            <i class="las la-clock"></i>
            <div>
              <strong>Account will be unlocked:</strong><br>
              ${unlockTime}
            </div>
          </div>
          <div class="help-section mt-4">
            <p class="mb-2"><strong>Forgot your password?</strong></p>
            <a href="/auth/forgot-password" class="btn btn-sm btn-outline-primary">
              <i class="las la-key"></i> Reset Password
            </a>
          </div>
        </div>
      `,
      primaryButton: {
        text: 'OK',
        action: () => this.closeModal()
      }
    });
    
    this.showModal(modal);
  }

  createModal({ title, icon, iconColor, content, primaryButton, secondaryButton }) {
    const modal = document.createElement('div');
    modal.className = 'custom-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.3s ease;
    `;
    
    modal.innerHTML = `
      <div class="modal-content" style="
        background: white;
        border-radius: 12px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        animation: slideIn 0.3s ease;
      ">
        <div class="modal-header" style="
          padding: 24px 24px 16px;
          border-bottom: 1px solid #eee;
          text-align: center;
        ">
          <div class="modal-icon" style="
            width: 64px;
            height: 64px;
            background: ${iconColor}20;
            border-radius: 50%;
            margin: 0 auto 16px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <i class="${icon}" style="font-size: 28px; color: ${iconColor};"></i>
          </div>
          <h5 class="modal-title" style="margin: 0; color: #333;">${title}</h5>
        </div>
        <div class="modal-body" style="padding: 20px 24px;">
          ${content}
        </div>
        <div class="modal-footer" style="
          padding: 16px 24px 24px;
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        ">
          ${secondaryButton ? `
            <button class="btn btn-outline-secondary btn-secondary-action">
              ${secondaryButton.text}
            </button>
          ` : ''}
          <button class="btn btn-primary btn-primary-action">
            ${primaryButton.text}
          </button>
        </div>
      </div>
    `;
    
    // Add event listeners
    const primaryBtn = modal.querySelector('.btn-primary-action');
    const secondaryBtn = modal.querySelector('.btn-secondary-action');
    
    if (primaryBtn) {
      primaryBtn.addEventListener('click', primaryButton.action);
    }
    
    if (secondaryBtn && secondaryButton) {
      secondaryBtn.addEventListener('click', secondaryButton.action);
    }
    
    // Close on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeModal();
      }
    });
    
    return modal;
  }

  showModal(modal) {
    document.body.appendChild(modal);
    this.currentModal = modal;
    
    // Add styles
    if (!document.querySelector('#modal-styles')) {
      const styles = document.createElement('style');
      styles.id = 'modal-styles';
      styles.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .custom-modal .info-grid {
          display: grid;
          gap: 8px;
          margin: 16px 0;
        }
        .custom-modal .info-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #f0f0f0;
        }
        .custom-modal .contact-options {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .custom-modal .alert {
          padding: 12px;
          border-radius: 6px;
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }
        .custom-modal .alert-info {
          background: #d1ecf1;
          color: #0c5460;
          border: 1px solid #bee5eb;
        }
        .custom-modal .alert-warning {
          background: #fff3cd;
          color: #856404;
          border: 1px solid #ffeaa7;
        }
        .custom-modal .alert-danger {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }
      `;
      document.head.appendChild(styles);
    }
  }

  closeModal() {
    if (this.currentModal) {
      this.currentModal.remove();
      this.currentModal = null;
    }
  }

  showLoadingState() {
    const submitBtn = this.form.querySelector('button[type="submit"]');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    
    submitBtn.disabled = true;
    btnText.classList.add('d-none');
    btnLoading.classList.remove('d-none');
  }

  hideLoadingState() {
    const submitBtn = this.form.querySelector('button[type="submit"]');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    
    submitBtn.disabled = false;
    btnText.classList.remove('d-none');
    btnLoading.classList.add('d-none');
  }

  showToast(message, type = 'info', duration = 5000) {
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <i class="las la-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span>${message}</span>
      </div>
    `;
    
    // Add styles if not exist
    if (!document.querySelector('#toast-styles')) {
      const styles = document.createElement('style');
      styles.id = 'toast-styles';
      styles.textContent = `
        .toast-notification {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 16px 24px;
          border-radius: 8px;
          color: white;
          font-weight: 500;
          z-index: 10000;
          animation: slideInRight 0.3s ease;
          max-width: 400px;
        }
        .toast-success { background: #28a745; }
        .toast-error { background: #dc3545; }
        .toast-warning { background: #ffc107; color: #212529; }
        .toast-info { background: #17a2b8; }
        .toast-content { display: flex; align-items: center; gap: 8px; }
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(styles);
    }
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideInRight 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new LoginHandler();
});