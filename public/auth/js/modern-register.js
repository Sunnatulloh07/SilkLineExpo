/*
SLEX Modern Registration - Multi-step Form Handler
Professional form validation and user experience
*/

(function() {
    'use strict';

    class ModernRegister {
        constructor() {
            this.currentStep = 1;
            this.totalSteps = 4;
            this.formData = {};
            this.isSubmitting = false;
            
            this.init();
        }

        init() {
            this.bindEvents();
            this.updateProgress();
            this.initializeValidation();
            this.setupFileUpload();
            this.setupPasswordToggles();
        }

        bindEvents() {
            // Navigation buttons
            document.getElementById('nextBtn')?.addEventListener('click', (e) => {
                e.preventDefault();
                this.nextStep();
            });

            document.getElementById('prevBtn')?.addEventListener('click', (e) => {
                e.preventDefault();
                this.prevStep();
            });

            // Form submission
            document.getElementById('registrationForm')?.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSubmit();
            });

            // Real-time validation
            this.setupRealTimeValidation();

            // Password strength checking
            this.setupPasswordStrength();
        }

        setupRealTimeValidation() {
            const inputs = document.querySelectorAll('.form-input, .form-select, .form-textarea');
            
            inputs.forEach(input => {
                input.addEventListener('blur', () => {
                    this.validateField(input);
                });

                input.addEventListener('input', () => {
                    this.clearFieldError(input);
                });
            });

            // Special validation for email
            const emailInput = document.getElementById('email');
            if (emailInput) {
                emailInput.addEventListener('blur', () => {
                    this.validateEmailAvailability(emailInput);
                });
            }

            // Phone number formatting
            const phoneInput = document.getElementById('phone');
            if (phoneInput) {
                phoneInput.addEventListener('input', () => {
                    this.formatPhoneNumber(phoneInput);
                });
            }
        }

        setupPasswordStrength() {
            const passwordInput = document.getElementById('password');
            const confirmPasswordInput = document.getElementById('confirmPassword');
            
            if (passwordInput) {
                passwordInput.addEventListener('input', () => {
                    this.checkPasswordStrength(passwordInput.value);
                    this.updatePasswordRequirements(passwordInput.value);
                });
            }

            if (confirmPasswordInput) {
                confirmPasswordInput.addEventListener('input', () => {
                    this.validatePasswordMatch();
                });
            }
        }

        setupPasswordToggles() {
            const toggles = document.querySelectorAll('.password-toggle');
            
            toggles.forEach(toggle => {
                toggle.addEventListener('click', () => {
                    const input = toggle.parentElement.querySelector('input');
                    const icon = toggle.querySelector('i');
                    
                    if (input.type === 'password') {
                        input.type = 'text';
                        icon.className = 'las la-eye-slash';
                    } else {
                        input.type = 'password';
                        icon.className = 'las la-eye';
                    }
                });
            });
        }

        setupFileUpload() {
            const fileUploadArea = document.getElementById('fileUploadArea');
            const fileInput = document.getElementById('companyLogo');
            const uploadPreview = document.getElementById('uploadPreview');
            const previewImage = document.getElementById('previewImage');
            const removeUpload = document.getElementById('removeUpload');

            if (!fileUploadArea || !fileInput) return;

            // Click to upload
            fileUploadArea.addEventListener('click', () => {
                fileInput.click();
            });

            // Drag and drop
            fileUploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                fileUploadArea.classList.add('dragover');
            });

            fileUploadArea.addEventListener('dragleave', () => {
                fileUploadArea.classList.remove('dragover');
            });

            fileUploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                fileUploadArea.classList.remove('dragover');
                
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handleFileUpload(files[0]);
                }
            });

            // File input change
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.handleFileUpload(e.target.files[0]);
                }
            });

            // Remove upload
            if (removeUpload) {
                removeUpload.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.removeFileUpload();
                });
            }
        }

        handleFileUpload(file) {
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
            if (!allowedTypes.includes(file.type)) {
                this.showAlert('Please upload a valid image file (JPG, PNG).', 'error');
                return;
            }

            // Validate file size (2MB)
            if (file.size > 2 * 1024 * 1024) {
                this.showAlert('File size must be less than 2MB.', 'error');
                return;
            }

            // Show preview
            const reader = new FileReader();
            reader.onload = (e) => {
                const previewImage = document.getElementById('previewImage');
                const uploadPreview = document.getElementById('uploadPreview');
                const uploadContent = document.querySelector('.upload-content');
                
                if (previewImage && uploadPreview) {
                    previewImage.src = e.target.result;
                    uploadPreview.style.display = 'block';
                    uploadContent.style.display = 'none';
                }
            };
            reader.readAsDataURL(file);
        }

        removeFileUpload() {
            const fileInput = document.getElementById('companyLogo');
            const uploadPreview = document.getElementById('uploadPreview');
            const uploadContent = document.querySelector('.upload-content');
            
            if (fileInput) fileInput.value = '';
            if (uploadPreview) uploadPreview.style.display = 'none';
            if (uploadContent) uploadContent.style.display = 'flex';
        }

        validateField(field) {
            const value = field.value.trim();
            const fieldName = field.name;
            let isValid = true;
            let message = '';

            // Clear previous feedback
            this.clearFieldError(field);

            // Required field validation
            if (field.hasAttribute('required') && !value) {
                isValid = false;
                message = 'This field is required.';
            }

            // Specific field validations
            if (value && isValid) {
                switch (fieldName) {
                    case 'email':
                        if (!this.isValidEmail(value)) {
                            isValid = false;
                            message = 'Please enter a valid email address.';
                        }
                        break;

                    case 'phone':
                        if (!this.isValidPhone(value)) {
                            isValid = false;
                            message = 'Please enter a valid phone number.';
                        }
                        break;

                    case 'taxNumber':
                        if (value.length < 6) {
                            isValid = false;
                            message = 'Tax number must be at least 6 characters.';
                        }
                        break;

                    case 'companyName':
                        if (value.length < 2) {
                            isValid = false;
                            message = 'Company name must be at least 2 characters.';
                        }
                        break;

                    case 'password':
                        if (!this.isStrongPassword(value)) {
                            isValid = false;
                            message = 'Password does not meet requirements.';
                        }
                        break;

                    case 'confirmPassword':
                        const password = document.getElementById('password').value;
                        if (value !== password) {
                            isValid = false;
                            message = 'Passwords do not match.';
                        }
                        break;
                }
            }

            // Show feedback
            if (!isValid) {
                this.showFieldError(field, message);
            } else {
                this.showFieldSuccess(field);
            }

            return isValid;
        }

        async validateEmailAvailability(emailField) {
            const email = emailField.value.trim();
            
            if (!email || !this.isValidEmail(email)) return;

            try {
                const response = await fetch('/auth/check-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': this.getCSRFToken()
                    },
                    body: JSON.stringify({ email })
                });

                const data = await response.json();
                
                if (data.exists) {
                    this.showFieldError(emailField, 'This email is already registered.');
                } else {
                    this.showFieldSuccess(emailField);
                }
            } catch (error) {
                console.error('Email validation error:', error);
            }
        }

        checkPasswordStrength(password) {
            const strengthFill = document.getElementById('strengthFill');
            const strengthText = document.getElementById('strengthText');
            
            if (!strengthFill || !strengthText) return;

            const score = this.calculatePasswordStrength(password);
            let strength = 'weak';
            let text = 'Weak';

            if (score >= 4) {
                strength = 'strong';
                text = 'Strong';
            } else if (score >= 3) {
                strength = 'good';
                text = 'Good';
            } else if (score >= 2) {
                strength = 'fair';
                text = 'Fair';
            }

            strengthFill.className = `strength-fill ${strength}`;
            strengthText.className = `strength-text ${strength}`;
            strengthText.textContent = text;
        }

        updatePasswordRequirements(password) {
            const requirements = {
                length: password.length >= 8,
                lowercase: /[a-z]/.test(password),
                uppercase: /[A-Z]/.test(password),
                number: /\d/.test(password)
            };

            Object.keys(requirements).forEach(req => {
                const element = document.querySelector(`[data-requirement="${req}"]`);
                const icon = element?.querySelector('i');
                
                if (element && icon) {
                    if (requirements[req]) {
                        element.classList.add('valid');
                        icon.className = 'las la-check';
                    } else {
                        element.classList.remove('valid');
                        icon.className = 'las la-times';
                    }
                }
            });
        }

        calculatePasswordStrength(password) {
            let score = 0;
            
            if (password.length >= 8) score++;
            if (/[a-z]/.test(password)) score++;
            if (/[A-Z]/.test(password)) score++;
            if (/\d/.test(password)) score++;
            if (/[^a-zA-Z0-9]/.test(password)) score++;
            
            return score;
        }

        validatePasswordMatch() {
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const feedback = document.getElementById('confirmPasswordFeedback');
            
            if (confirmPassword && password !== confirmPassword) {
                this.showFieldError(document.getElementById('confirmPassword'), 'Passwords do not match.');
            } else if (confirmPassword) {
                this.showFieldSuccess(document.getElementById('confirmPassword'));
            }
        }

        formatPhoneNumber(phoneInput) {
            let value = phoneInput.value.replace(/\D/g, '');
            
            // Add + if not present
            if (value && !phoneInput.value.startsWith('+')) {
                value = '+' + value;
            }
            
            phoneInput.value = value;
        }

        showFieldError(field, message) {
            field.classList.remove('success');
            field.classList.add('error');
            
            const feedback = document.getElementById(field.name + 'Feedback');
            if (feedback) {
                feedback.textContent = message;
                feedback.className = 'input-feedback error show';
            }
        }

        showFieldSuccess(field) {
            field.classList.remove('error');
            field.classList.add('success');
            
            const feedback = document.getElementById(field.name + 'Feedback');
            if (feedback) {
                feedback.textContent = '';
                feedback.className = 'input-feedback success';
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

        validateCurrentStep() {
            const currentStepElement = document.querySelector(`.form-step[data-step="${this.currentStep}"]`);
            const inputs = currentStepElement.querySelectorAll('.form-input, .form-select, .form-textarea');
            let isValid = true;

            inputs.forEach(input => {
                if (!this.validateField(input)) {
                    isValid = false;
                }
            });

            // Special validation for step 4 (terms checkbox)
            if (this.currentStep === 4) {
                const agreeTerms = document.getElementById('agreeTerms');
                if (agreeTerms && !agreeTerms.checked) {
                    this.showAlert('Please agree to the Terms of Service and Privacy Policy.', 'error');
                    isValid = false;
                }
            }

            return isValid;
        }

        nextStep() {
            if (!this.validateCurrentStep()) {
                return;
            }

            if (this.currentStep < this.totalSteps) {
                this.currentStep++;
                this.updateStepDisplay();
                this.updateProgress();
                this.updateSummary();
            }
        }

        prevStep() {
            if (this.currentStep > 1) {
                this.currentStep--;
                this.updateStepDisplay();
                this.updateProgress();
            }
        }

        updateStepDisplay() {
            // Hide all steps
            document.querySelectorAll('.form-step').forEach(step => {
                step.classList.remove('active');
            });

            // Show current step
            const currentStepElement = document.querySelector(`.form-step[data-step="${this.currentStep}"]`);
            if (currentStepElement) {
                currentStepElement.classList.add('active');
            }

            // Update navigation buttons
            const prevBtn = document.getElementById('prevBtn');
            const nextBtn = document.getElementById('nextBtn');
            const submitBtn = document.getElementById('submitBtn');

            if (prevBtn) {
                prevBtn.style.display = this.currentStep === 1 ? 'none' : 'flex';
            }

            if (nextBtn && submitBtn) {
                if (this.currentStep === this.totalSteps) {
                    nextBtn.style.display = 'none';
                    submitBtn.style.display = 'flex';
                } else {
                    nextBtn.style.display = 'flex';
                    submitBtn.style.display = 'none';
                }
            }
        }

        updateProgress() {
            // Update progress steps
            document.querySelectorAll('.progress-step').forEach((step, index) => {
                const stepNumber = index + 1;
                
                if (stepNumber < this.currentStep) {
                    step.classList.add('completed');
                    step.classList.remove('active');
                } else if (stepNumber === this.currentStep) {
                    step.classList.add('active');
                    step.classList.remove('completed');
                } else {
                    step.classList.remove('active', 'completed');
                }
            });

            // Update progress bar
            const progressFill = document.getElementById('progressFill');
            if (progressFill) {
                const percentage = (this.currentStep / this.totalSteps) * 100;
                progressFill.style.width = percentage + '%';
            }
        }

        updateSummary() {
            if (this.currentStep !== 4) return;

            // Update summary with form data
            const formData = new FormData(document.getElementById('registrationForm'));
            
            const summaryFields = {
                'summaryCompanyName': formData.get('companyName'),
                'summaryEmail': formData.get('email'),
                'summaryPhone': formData.get('phone'),
                'summaryTaxNumber': formData.get('taxNumber'),
                'summaryActivity': this.getActivityTypeText(formData.get('activityType')),
                'summaryCountry': formData.get('country'),
                'summaryCity': formData.get('city'),
                'summaryAddress': formData.get('address')
            };

            Object.keys(summaryFields).forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.textContent = summaryFields[id] || '-';
                }
            });
        }

        getActivityTypeText(value) {
            const activities = {
                'food_beverages': 'Food & Beverages',
                'textiles_clothing': 'Textiles & Clothing',
                'electronics': 'Electronics',
                'machinery_equipment': 'Machinery & Equipment',
                'chemicals': 'Chemicals',
                'agriculture': 'Agriculture',
                'construction_materials': 'Construction Materials',
                'automotive': 'Automotive',
                'pharmaceuticals': 'Pharmaceuticals',
                'other': 'Other'
            };
            
            return activities[value] || value;
        }

        async handleSubmit() {
            if (this.isSubmitting) return;

            if (!this.validateCurrentStep()) {
                return;
            }

            this.isSubmitting = true;
            this.showSubmitLoading(true);

            try {
                const formData = new FormData(document.getElementById('registrationForm'));
                
                const response = await fetch('/auth/register', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-CSRF-Token': this.getCSRFToken()
                    }
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    this.showAlert('Account created successfully! Please check your email for verification.', 'success');
                    
                    // Redirect after delay
                    setTimeout(() => {
                        window.location.href = data.redirectUrl || '/auth/login';
                    }, 2000);
                } else {
                    this.showAlert(data.message || 'Registration failed. Please try again.', 'error');
                }
            } catch (error) {
                console.error('Registration error:', error);
                this.showAlert('Network error. Please check your connection and try again.', 'error');
            } finally {
                this.isSubmitting = false;
                this.showSubmitLoading(false);
            }
        }

        showSubmitLoading(show) {
            const submitBtn = document.getElementById('submitBtn');
            const btnText = submitBtn?.querySelector('.btn-text');
            const btnLoader = submitBtn?.querySelector('.btn-loader');

            if (submitBtn && btnText && btnLoader) {
                if (show) {
                    btnText.style.display = 'none';
                    btnLoader.style.display = 'flex';
                    submitBtn.disabled = true;
                } else {
                    btnText.style.display = 'flex';
                    btnLoader.style.display = 'none';
                    submitBtn.disabled = false;
                }
            }
        }

        showAlert(message, type = 'info') {
            const alertContainer = document.getElementById('alertContainer');
            if (!alertContainer) return;

            // Remove existing alerts
            alertContainer.innerHTML = '';

            const alert = document.createElement('div');
            alert.className = `alert alert-${type} alert-dismissible`;
            
            const icon = type === 'error' ? 'las la-exclamation-triangle' : 
                        type === 'success' ? 'las la-check-circle' : 'las la-info-circle';
            
            alert.innerHTML = `
                <i class="${icon}"></i>
                <span>${message}</span>
                <button type="button" class="alert-close" onclick="this.parentElement.remove()">
                    <i class="las la-times"></i>
                </button>
            `;

            alertContainer.appendChild(alert);

            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (alert.parentElement) {
                    alert.remove();
                }
            }, 5000);
        }

        // Utility functions
        isValidEmail(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        }

        isValidPhone(phone) {
            const phoneRegex = /^\+?[\d\s\-\(\)]{8,}$/;
            return phoneRegex.test(phone);
        }

        isStrongPassword(password) {
            return password.length >= 8 &&
                   /[a-z]/.test(password) &&
                   /[A-Z]/.test(password) &&
                   /\d/.test(password);
        }

        getCSRFToken() {
            return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
        }

        initializeValidation() {
            // Set up form validation
            const form = document.getElementById('registrationForm');
            if (form) {
                form.setAttribute('novalidate', 'true');
            }
        }
    }

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        new ModernRegister();
    });

})();