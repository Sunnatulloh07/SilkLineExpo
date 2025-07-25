/**
 * Enhanced Multi-Step Registration Form Handler
 * Professional step-by-step registration with fixed button positioning and beautiful step design
 * Senior Software Engineer Clean Code Implementation
 */

class EnhancedMultiStepRegistration {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 4;
    this.form = document.getElementById('multiStepForm');
    this.isSubmitting = false;
    this.formData = {};
    this.originalStepIcons = {
      1: 'las la-building',
      2: 'las la-map-marker',
      3: 'las la-user-shield', 
      4: 'las la-check'
    };
    
    this.init();
  }

  init() {
    if (!this.form) return;
    
    this.setupStepNavigation();
    this.setupFormValidation();
    this.setupPasswordFeatures();
    this.setupFileUpload();
    this.updateStepDescription();
    this.fixInitialDisplay();
    
    console.log('Enhanced Multi-step registration initialized');
  }

  fixInitialDisplay() {
    // Ensure proper initial state
    this.updateNavigationButtons();
    this.updateStepDisplay();
  }

  setupStepNavigation() {
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');

    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.nextStep();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.prevStep();
      });
    }
    
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
    // Update step items with enhanced animations
    const stepItems = document.querySelectorAll('.step-item');
    const stepBar = document.querySelector('.step-progress__bar');
    
    stepItems.forEach((item, index) => {
      const stepNumber = index + 1;
      const stepCircle = item.querySelector('.step-circle');
      const stepIcon = stepCircle?.querySelector('i');
      
      // Remove all classes first
      item.classList.remove('active', 'completed');
      
      if (stepNumber < this.currentStep) {
        item.classList.add('completed');
        // Change icon to checkmark for completed steps
        if (stepIcon) {
          stepIcon.className = 'las la-check';
        }
      } else if (stepNumber === this.currentStep) {
        item.classList.add('active');
        // Keep original icon for active step
        this.setOriginalStepIcon(stepIcon, stepNumber);
      } else {
        // Keep original icon for future steps
        this.setOriginalStepIcon(stepIcon, stepNumber);
      }
    });

    // Update progress bar with smooth transition
    if (stepBar) {
      stepBar.className = `step-progress__bar step-${this.currentStep}`;
    }

    // Update form steps with fade animation
    const formSteps = document.querySelectorAll('.form-step');
    formSteps.forEach((step, index) => {
      step.classList.remove('active');
      if (index + 1 === this.currentStep) {
        step.classList.add('active');
      }
    });

    // Update navigation buttons with proper positioning
    this.updateNavigationButtons();

    // Update step description
    this.updateStepDescription();

    // Smooth scroll to form top
    this.smoothScrollToForm();
  }

  setOriginalStepIcon(iconElement, stepNumber) {
    if (iconElement && this.originalStepIcons[stepNumber]) {
      iconElement.className = this.originalStepIcons[stepNumber];
    }
  }

  updateNavigationButtons() {
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    const submitBtn = document.getElementById('submitBtn');

    // Show/hide previous button
    if (prevBtn) {
      prevBtn.style.display = this.currentStep === 1 ? 'none' : 'flex';
    }
    
    // Show/hide next and submit buttons
    if (this.currentStep === this.totalSteps) {
      if (nextBtn) nextBtn.style.display = 'none';
      if (submitBtn) submitBtn.style.display = 'flex';
    } else {
      if (nextBtn) nextBtn.style.display = 'flex';
      if (submitBtn) submitBtn.style.display = 'none';
    }
  }

  smoothScrollToForm() {
    const accountContent = document.querySelector('.account-content');
    if (accountContent) {
      accountContent.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }

  updateStepDescription() {
    const descriptions = {
      1: 'Enter your company information and business details',
      2: 'Provide your location and upload company logo',
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
    if (!currentStepElement) return false;
    
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

    // Additional validation for step 4 (terms)
    if (this.currentStep === 4) {
      const agreeTerms = document.getElementById('agreeTerms');
      if (agreeTerms && !agreeTerms.checked) {
        this.showFieldError(agreeTerms, 'You must agree to the Terms of Service and Privacy Policy');
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
    const password = document.getElementById('password')?.value || '';
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
    const password = document.getElementById('password')?.value || '';
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
    const password = document.getElementById('password')?.value || '';
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
        if (preview) preview.style.display = 'none';
        return;
      }
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        this.showFieldError(e.target, 'Only JPG and PNG files are allowed');
        e.target.value = '';
        if (preview) preview.style.display = 'none';
        return;
      }
      
      // Show preview
      const reader = new FileReader();
      reader.onload = (event) => {
        if (previewImage) {
          previewImage.src = event.target.result;
        }
        if (preview) {
          preview.style.display = 'block';
        }
      };
      reader.readAsDataURL(file);
      
      this.clearFieldError(e.target);
    } else {
      if (preview) preview.style.display = 'none';
    }
  }

  saveCurrentStepData() {
    const currentStepElement = document.querySelector(`.form-step[data-step="${this.currentStep}"]`);
    if (!currentStepElement) return;
    
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
        this.showSuccessMessage(result);
      } else {
        this.handleRegistrationError(result, response.status);
      }
    } catch (error) {
      console.error('Registration error:', error);
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
      // Service unavailable
      this.showToast('Service temporarily unavailable. Please try again later.', 'error');
    } else {
      this.showToast(result.message || 'Registration failed. Please try again.', 'error');
    }
  }

  showSuccessMessage(result) {
    this.showToast('Registration successful! Redirecting to login...', 'success');
    
    setTimeout(() => {
      window.location.href = '/login';
    }, 2000);
  }

  showLoadingState() {
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn?.querySelector('.btn-text');
    const btnLoading = submitBtn?.querySelector('.btn-loading');
    
    if (submitBtn) {
      submitBtn.disabled = true;
    }
    if (btnText) {
      btnText.classList.add('d-none');
    }
    if (btnLoading) {
      btnLoading.classList.remove('d-none');
    }
  }

  hideLoadingState() {
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn?.querySelector('.btn-text');
    const btnLoading = submitBtn?.querySelector('.btn-loading');
    
    if (submitBtn) {
      submitBtn.disabled = false;
    }
    if (btnText) {
      btnText.classList.remove('d-none');
    }
    if (btnLoading) {
      btnLoading.classList.add('d-none');
    }
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
    // Remove existing toasts
    const existingToasts = document.querySelectorAll('.toast-notification');
    existingToasts.forEach(toast => toast.remove());

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
          border-radius: 12px;
          color: white;
          font-weight: 600;
          z-index: 10000;
          animation: slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          max-width: 400px;
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
          backdrop-filter: blur(10px);
        }
        .toast-success { background: linear-gradient(135deg, #28a745, #20c997); }
        .toast-error { background: linear-gradient(135deg, #dc3545, #e74c3c); }
        .toast-warning { background: linear-gradient(135deg, #ffc107, #f39c12); color: #212529; }
        .toast-info { background: linear-gradient(135deg, #17a2b8, #20c997); }
        .toast-content { display: flex; align-items: center; gap: 12px; }
        .toast-content i { font-size: 20px; }
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(styles);
    }
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1) reverse';
      setTimeout(() => toast.remove(), 400);
    }, duration);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Remove existing multi-step registration if it exists
  if (window.MultiStepRegistration) {
    delete window.MultiStepRegistration;
  }
  
  // Initialize enhanced version
  new EnhancedMultiStepRegistration();
});