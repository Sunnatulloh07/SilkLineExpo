/**
 * Multi-Step Registration Form Handler
 * Professional step-by-step registration with validation
 */

class MultiStepRegistration {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 4;
    this.form = document.getElementById('multiStepForm');
    this.isSubmitting = false;
    this.formData = {};
    
    this.init();
  }

  init() {
    if (!this.form) return;
    
    this.setupStepNavigation();
    this.setupFormValidation();
    this.setupPasswordFeatures();
    this.setupFileUpload();
    this.updateStepDescription();
    
  }

  setupStepNavigation() {
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    const submitBtn = document.getElementById('submitBtn');

    nextBtn.addEventListener('click', () => this.nextStep());
    prevBtn.addEventListener('click', () => this.prevStep());
    
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
  }

  setupFormValidation() {
    // Real-time validation for all inputs
    const inputs = this.form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.addEventListener('blur', () => this.validateField(input));
      input.addEventListener('input', () => {
        this.clearFieldError(input);
        if (input.type === 'password') {
          this.updatePasswordStrength();
          this.checkPasswordRequirements();
        }
      });
    });

    // Phone number formatting
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
      phoneInput.addEventListener('input', (e) => this.formatPhoneNumber(e));
    }

    // Tax number formatting
    const taxInput = document.getElementById('taxNumber');
    if (taxInput) {
      taxInput.addEventListener('input', (e) => this.formatTaxNumber(e));
    }
  }

  setupPasswordFeatures() {
    // Password toggle functionality
    const toggleButtons = document.querySelectorAll('.toggle-password');
    toggleButtons.forEach(button => {
      button.addEventListener('click', (e) => this.togglePassword(e));
    });

    // Password confirmation matching
    const confirmPassword = document.getElementById('confirmPassword');
    if (confirmPassword) {
      confirmPassword.addEventListener('input', () => this.validatePasswordMatch());
    }
  }

  setupFileUpload() {
    const logoInput = document.getElementById('companyLogo');
    if (logoInput) {
      logoInput.addEventListener('change', (e) => this.handleLogoUpload(e));
    }
  }

  nextStep() {
    if (!this.validateCurrentStep()) {
      this.showToast('Please fill in all required fields correctly', 'error');
      return;
    }

    this.saveCurrentStepData();

    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.updateStepDisplay();
      
      if (this.currentStep === 4) {
        this.updateSummary();
      }
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateStepDisplay();
    }
  }

  updateStepDisplay() {
    // Update step items
    const stepItems = document.querySelectorAll('.step-item');
    const stepBar = document.querySelector('.step-progress__bar');
    
    stepItems.forEach((item, index) => {
      const stepNumber = index + 1;
      item.classList.remove('active', 'completed');
      
      if (stepNumber < this.currentStep) {
        item.classList.add('completed');
      } else if (stepNumber === this.currentStep) {
        item.classList.add('active');
      }
    });

    // Update progress bar
    stepBar.className = `step-progress__bar step-${this.currentStep}`;

    // Update form steps
    const formSteps = document.querySelectorAll('.form-step');
    formSteps.forEach((step, index) => {
      step.classList.remove('active');
      if (index + 1 === this.currentStep) {
        step.classList.add('active');
      }
    });

    // Update navigation buttons
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    const submitBtn = document.getElementById('submitBtn');

    prevBtn.style.display = this.currentStep === 1 ? 'none' : 'block';
    
    if (this.currentStep === this.totalSteps) {
      nextBtn.style.display = 'none';
      submitBtn.style.display = 'block';
    } else {
      nextBtn.style.display = 'block';
      submitBtn.style.display = 'none';
    }

    // Update step description
    this.updateStepDescription();

    // Scroll to top of form
    document.querySelector('.account-content').scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
  }

  updateStepDescription() {
    const descriptions = {
      1: 'Enter your company information and business details',
      2: 'Provide your location and company logo',
      3: 'Create a secure password for your account',
      4: 'Review and confirm your registration details'
    };

    const descriptionElement = document.querySelector('.step-description');
    if (descriptionElement) {
      descriptionElement.textContent = descriptions[this.currentStep] || '';
    }
  }

  validateCurrentStep() {
    const currentStepElement = document.querySelector(`.form-step[data-step="${this.currentStep}"]`);
    const requiredFields = currentStepElement.querySelectorAll('input[required], select[required], textarea[required]');
    
    let isValid = true;

    requiredFields.forEach(field => {
      if (!this.validateField(field)) {
        isValid = false;
      }
    });

    // Additional validation for step 3 (passwords)
    if (this.currentStep === 3) {
      if (!this.validatePasswordMatch()) {
        isValid = false;
      }
      if (!this.validatePasswordStrength()) {
        isValid = false;
      }
    }

    return isValid;
  }

  validateField(field) {
    const value = field.value.trim();
    const fieldName = field.name;

    // Required field validation
    if (field.hasAttribute('required') && !value) {
      this.showFieldError(field, `${this.getFieldLabel(field)} is required`);
      return false;
    }

    if (!value && !field.hasAttribute('required')) {
      this.clearFieldError(field);
      return true;
    }

    // Specific field validation
    switch (fieldName) {
      case 'email':
        return this.validateEmail(field);
      case 'phone':
        return this.validatePhone(field);
      case 'taxNumber':
        return this.validateTaxNumber(field);
      case 'companyName':
        return this.validateCompanyName(field);
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
    const email = field.value.trim().toLowerCase();
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
    const phoneRegex = /^\+[1-9]\d{6,14}$/;
    
    if (!phoneRegex.test(phone)) {
      this.showFieldError(field, 'Please enter a valid phone number (e.g., +998901234567)');
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
    
    if (taxNumber.length > 20) {
      this.showFieldError(field, 'Tax number must not exceed 20 characters');
      return false;
    }
    
    this.clearFieldError(field);
    return true;
  }

  validateCompanyName(field) {
    const companyName = field.value.trim();
    
    if (companyName.length < 2) {
      this.showFieldError(field, 'Company name must be at least 2 characters');
      return false;
    }
    
    if (companyName.length > 200) {
      this.showFieldError(field, 'Company name must not exceed 200 characters');
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

  validatePasswordStrength() {
    const password = document.getElementById('password').value;
    const requirements = this.getPasswordRequirements(password);
    
    return requirements.filter(req => req.valid).length >= 2; // At least 2 requirements met
  }

  formatPhoneNumber(e) {
    let value = e.target.value.replace(/\D/g, '');
    
    // Auto-format for different countries
    if (value.startsWith('998')) {
      value = '+' + value;
    } else if (!value.startsWith('+')) {
      if (value.length > 0) {
        value = '+' + value;
      }
    }
    
    e.target.value = value;
  }

  formatTaxNumber(e) {
    // Remove any non-alphanumeric characters and convert to uppercase
    let value = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    e.target.value = value;
  }

  togglePassword(e) {
    const button = e.currentTarget;
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
  }

  updatePasswordStrength() {
    const password = document.getElementById('password').value;
    const strengthFill = document.querySelector('.strength-fill');
    const strengthText = document.querySelector('.strength-text');
    
    if (!strengthFill || !strengthText) return;

    const strength = this.calculatePasswordStrength(password);
    
    strengthFill.className = `strength-fill ${strength.class}`;
    strengthText.textContent = strength.text;
  }

  calculatePasswordStrength(password) {
    if (password.length === 0) {
      return { class: '', text: '' };
    }
    
    let score = 0;
    const requirements = this.getPasswordRequirements(password);
    
    requirements.forEach(req => {
      if (req.valid) score++;
    });

    if (score === 1) {
      return { class: 'weak', text: 'Weak password' };
    } else if (score === 2) {
      return { class: 'fair', text: 'Fair password' };
    } else if (score === 3) {
      return { class: 'good', text: 'Good password' };
    } else if (score === 4) {
      return { class: 'strong', text: 'Strong password' };
    }
    
    return { class: 'weak', text: 'Very weak password' };
  }

  checkPasswordRequirements() {
    const password = document.getElementById('password').value;
    const requirements = this.getPasswordRequirements(password);
    
    requirements.forEach((req, index) => {
      const element = document.querySelector(`.requirement[data-requirement="${req.type}"]`);
      if (element) {
        element.classList.toggle('valid', req.valid);
      }
    });
  }

  getPasswordRequirements(password) {
    return [
      {
        type: 'length',
        valid: password.length >= 6
      },
      {
        type: 'lowercase',
        valid: /[a-z]/.test(password)
      },
      {
        type: 'uppercase',
        valid: /[A-Z]/.test(password)
      },
      {
        type: 'number',
        valid: /\d/.test(password)
      }
    ];
  }

  handleLogoUpload(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('logoPreview');
    const previewImage = document.getElementById('logoPreviewImage');
    
    if (file) {
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.showFieldError(e.target, 'File size must be less than 5MB');
        e.target.value = '';
        preview.style.display = 'none';
        return;
      }
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        this.showFieldError(e.target, 'Only JPG and PNG files are allowed');
        e.target.value = '';
        preview.style.display = 'none';
        return;
      }
      
      // Show preview
      const reader = new FileReader();
      reader.onload = (event) => {
        previewImage.src = event.target.result;
        preview.style.display = 'block';
      };
      reader.readAsDataURL(file);
      
      this.clearFieldError(e.target);
    } else {
      preview.style.display = 'none';
    }
  }

  saveCurrentStepData() {
    const currentStepElement = document.querySelector(`.form-step[data-step="${this.currentStep}"]`);
    const inputs = currentStepElement.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
      this.formData[input.name] = input.value;
    });
  }

  updateSummary() {
    const summaryElements = {
      'summaryCompanyName': 'companyName',
      'summaryEmail': 'email',
      'summaryPhone': 'phone',
      'summaryTaxNumber': 'taxNumber',
      'summaryActivityType': 'activityType',
      'summaryCountry': 'country',
      'summaryCity': 'city'
    };

    Object.keys(summaryElements).forEach(elementId => {
      const element = document.getElementById(elementId);
      const fieldName = summaryElements[elementId];
      
      if (element) {
        let value = this.formData[fieldName] || document.querySelector(`[name="${fieldName}"]`)?.value || '-';
        
        // Format activity type display
        if (fieldName === 'activityType' && value !== '-') {
          const option = document.querySelector(`option[value="${value}"]`);
          value = option ? option.textContent : value;
        }
        
        element.textContent = value;
      }
    });
  }

  async handleSubmit(e) {
    e.preventDefault();
    
    if (this.isSubmitting) return;
    
    // Final validation
    if (!this.validateCurrentStep()) {
      this.showToast('Please review and fix the errors in the form', 'error');
      return;
    }

    // Check terms agreement
    const agreeTerms = document.getElementById('agreeTerms');
    if (!agreeTerms.checked) {
      this.showFieldError(agreeTerms, 'You must agree to the Terms of Service and Privacy Policy');
      this.showToast('Please agree to the terms and conditions', 'error');
      return;
    }
    
    this.isSubmitting = true;
    this.showLoadingState();
    
    try {
      const formData = new FormData(this.form);
      
      const response = await fetch('/auth/register', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (response.ok) {
        this.showSuccessModal(result);
      } else {
        this.handleRegistrationError(result, response.status);
      }
    } catch (error) {
      // console.error('Registration error:', error);
      this.showToast('Network error. Please check your connection and try again.', 'error');
    } finally {
      this.isSubmitting = false;
      this.hideLoadingState();
    }
  }

  handleRegistrationError(result, status) {
    if (status === 400) {
      // Validation errors
      if (result.errors) {
        result.errors.forEach(error => {
          this.showToast(error, 'error');
        });
      } else {
        this.showToast(result.message || 'Registration failed. Please check your information.', 'error');
      }
    } else if (status === 503) {
      // Service unavailable (database not connected)
      this.showServiceUnavailableModal();
    } else {
      this.showToast(result.message || 'Registration failed. Please try again.', 'error');
    }
  }

  showSuccessModal(result) {
    const modal = this.createModal({
      title: 'Registration Successful!',
      icon: 'las la-check-circle',
      iconColor: '#28a745',
      content: `
        <div class="success-content">
          <p class="mb-3">Your company registration has been submitted successfully!</p>
          <div class="info-grid">
            <div class="info-item">
              <strong>Company:</strong> ${result.data.companyName}
            </div>
            <div class="info-item">
              <strong>Status:</strong> <span class="text-warning">Pending Admin Approval</span>
            </div>
          </div>
          <div class="alert alert-info mt-4">
            <i class="las la-info-circle"></i>
            <div>
              <strong>What happens next?</strong>
              <ul class="mb-0 mt-2">
                <li>Our admin team will review your registration</li>
                <li>You'll receive an email notification once approved</li>
                <li>Approval typically takes 1-3 business days</li>
              </ul>
            </div>
          </div>
        </div>
      `,
      primaryButton: {
        text: 'Go to Login',
        action: () => {
          window.location.href = '/login';
        }
      },
      secondaryButton: {
        text: 'Back to Home',
        action: () => {
          window.location.href = '/';
        }
      }
    });
    
    this.showModal(modal);
  }

  showServiceUnavailableModal() {
    const modal = this.createModal({
      title: 'Service Temporarily Unavailable',
      icon: 'las la-exclamation-triangle',
      iconColor: '#ffc107',
      content: `
        <div class="service-unavailable-content">
          <p class="mb-3">Registration service is temporarily unavailable due to database maintenance.</p>
          <div class="alert alert-warning">
            <i class="las la-tools"></i>
            <div>
              <strong>We're working on it!</strong><br>
              Please try again in a few minutes or contact support.
            </div>
          </div>
        </div>
      `,
      primaryButton: {
        text: 'Try Again',
        action: () => {
          this.closeModal();
          location.reload();
        }
      },
      secondaryButton: {
        text: 'Contact Support',
        action: () => {
          window.location.href = '/contact';
        }
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
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    
    submitBtn.disabled = true;
    btnText.classList.add('d-none');
    btnLoading.classList.remove('d-none');
  }

  hideLoadingState() {
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    
    submitBtn.disabled = false;
    btnText.classList.remove('d-none');
    btnLoading.classList.add('d-none');
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
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
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
  new MultiStepRegistration();
});
