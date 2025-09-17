/**
 * Register Form Validation
 * Professional form validation with real-time feedback
 */

class RegisterFormValidator {
  constructor() {
    this.form = document.getElementById('registerForm');
    this.isSubmitting = false;
    this.init();
  }

  init() {
    if (!this.form) return;
    
    this.setupFormValidation();
    this.setupPasswordToggle();
    this.setupPhoneFormatting();
    this.setupFileUpload();
    
  }

  setupFormValidation() {
    // Form submit handler
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    
    // Real-time validation
    const inputs = this.form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.addEventListener('blur', () => this.validateField(input));
      input.addEventListener('input', () => this.clearFieldError(input));
    });
    
    // Password confirmation
    const confirmPassword = document.getElementById('confirmPassword');
    if (confirmPassword) {
      confirmPassword.addEventListener('input', () => this.validatePasswordMatch());
    }
  }

  setupPasswordToggle() {
    const toggleButtons = document.querySelectorAll('.toggle-password');
    toggleButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const targetId = button.getAttribute('id').replace('#', '');
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

  setupPhoneFormatting() {
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
      phoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        
        // Auto-format for Uzbekistan numbers
        if (value.startsWith('998') || value.startsWith('+998')) {
          value = value.replace(/^\+?998/, '+998');
          if (value.length > 4) {
            value = value.substring(0, 4) + value.substring(4, 6) + value.substring(6, 9) + value.substring(9, 11) + value.substring(11, 13);
          }
        } else if (!value.startsWith('+')) {
          value = '+' + value;
        }
        
        e.target.value = value;
      });
    }
  }

  setupFileUpload() {
    const logoInput = document.getElementById('companyLogo');
    if (logoInput) {
      logoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          // Validate file size (5MB max)
          if (file.size > 5 * 1024 * 1024) {
            this.showFieldError(logoInput, 'File size must be less than 5MB');
            logoInput.value = '';
            return;
          }
          
          // Validate file type
          const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
          if (!validTypes.includes(file.type)) {
            this.showFieldError(logoInput, 'Only JPG and PNG files are allowed');
            logoInput.value = '';
            return;
          }
          
          this.clearFieldError(logoInput);
        }
      });
    }
  }

  validateField(field) {
    const value = field.value.trim();
    const fieldName = field.name;
    
    // Required field validation
    if (field.hasAttribute('required') && !value) {
      this.showFieldError(field, `${this.getFieldLabel(field)} is required`);
      return false;
    }
    
    // Specific field validation
    switch (fieldName) {
      case 'email':
        return this.validateEmail(field);
      case 'phone':
        return this.validatePhone(field);
      case 'taxNumber':
        return this.validateTaxNumber(field);
      case 'password':
        return this.validatePassword(field);
      case 'confirmPassword':
        return this.validatePasswordMatch();
      default:
        this.clearFieldError(field);
        return true;
    }
  }

  validateEmail(field) {
    const email = field.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
      this.showFieldError(field, 'Please enter a valid email address');
      return false;
    }
    
    this.clearFieldError(field);
    return true;
  }

  validatePhone(field) {
    const phone = field.value.trim();
    // Basic international phone validation
    const phoneRegex = /^\+[1-9]\d{6,14}$/;
    
    if (!phoneRegex.test(phone)) {
      this.showFieldError(field, 'Please enter a valid phone number');
      return false;
    }
    
    this.clearFieldError(field);
    return true;
  }

  validateTaxNumber(field) {
    const taxNumber = field.value.trim();
    
    if (taxNumber.length < 6) {
      this.showFieldError(field, 'Tax number must be at least 6 characters');
      return false;
    }
    
    this.clearFieldError(field);
    return true;
  }

  validatePassword(field) {
    const password = field.value;
    
    if (password.length < 6) {
      this.showFieldError(field, 'Password must be at least 6 characters');
      return false;
    }
    
    this.clearFieldError(field);
    return true;
  }

  validatePasswordMatch() {
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');
    
    if (!password || !confirmPassword) return true;
    
    if (password.value !== confirmPassword.value) {
      this.showFieldError(confirmPassword, 'Passwords do not match');
      return false;
    }
    
    this.clearFieldError(confirmPassword);
    return true;
  }

  showFieldError(field, message) {
    this.clearFieldError(field);
    
    field.classList.add('is-invalid');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'invalid-feedback d-block';
    errorDiv.textContent = message;
    
    field.parentNode.appendChild(errorDiv);
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
    
    // Validate all fields
    const inputs = this.form.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;
    
    inputs.forEach(input => {
      if (!this.validateField(input)) {
        isValid = false;
      }
    });
    
    // Check terms agreement
    const agreeTerms = document.getElementById('agreeTerms');
    if (!agreeTerms.checked) {
      this.showFieldError(agreeTerms, 'You must agree to the Terms of Service and Privacy Policy');
      isValid = false;
    }
    
    if (!isValid) {
      this.showToast('Please fix the errors in the form', 'error');
      return;
    }
    
    this.isSubmitting = true;
    this.showLoadingState();
    
    try {
      const formData = new FormData(this.form);
      
      const response = await fetch('/register', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (response.ok) {
        this.showToast('Registration successful! Please wait for admin approval.', 'success');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        this.showToast(result.message || 'Registration failed. Please try again.', 'error');
      }
    } catch (error) {
      // console.error('Registration error:', error);
      this.showToast('Network error. Please check your connection and try again.', 'error');
    } finally {
      this.isSubmitting = false;
      this.hideLoadingState();
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

  showToast(message, type = 'info') {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <i class="las la-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
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
    
    // Remove after 5 seconds
    setTimeout(() => {
      toast.style.animation = 'slideInRight 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new RegisterFormValidator();
});
