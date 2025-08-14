/**
 * Manufacturer Settings Page JavaScript
 * Professional B2B Settings Management System
 */

// ====================================
// 🎯 SETTINGS PAGE CONTROLLER
// ====================================

class ManufacturerSettings {
  constructor() {
    this.currentTab = 'company';
    this.isDirty = false;
    this.autoSaveTimer = null;
    
    this.init();
  }

  init() {
    this.initializeThemeSync();
    this.initializeTabs();
    this.initializeFormValidation();
    this.initializeFileUploads();
    this.initializeFormSubmissions();
    this.initializeAutoSave();
    this.loadInitialData();
    
    console.log('✅ Manufacturer Settings initialized');
  }

  // ====================================
  // 🎨 THEME MANAGEMENT
  // ====================================

  initializeThemeSync() {
    // Sync themes on page load
    this.syncAllThemes();
    
    // Override header theme toggle to work with settings page
    this.setupHeaderThemeToggle();
    
    // Listen for theme changes from other tabs/pages
    window.addEventListener('storage', (e) => {
      if (e.key === 'dashboard-theme' || e.key === 'dashboard-theme' || e.key === 'dashboard-theme') {
        this.syncAllThemes();
      }
    });
    
    // Listen for theme change events
    window.addEventListener('themeChanged', (e) => {
      console.log('🎨 Settings: Received theme change event', e.detail.theme);
      this.updateThemeUI(e.detail.theme);
    });
    
    console.log('🎨 Theme sync initialized');
  }
  
  syncAllThemes() {
    // Get theme from any available source
    const slexTheme = localStorage.getItem('dashboard-theme');
    const theme = localStorage.getItem('dashboard-theme');
    const manufacturerTheme = localStorage.getItem('dashboard-theme');
    
    // Priority: slex_theme > theme > manufacturer-theme > default
    const activeTheme = slexTheme || theme || manufacturerTheme || 'light';
    
    console.log('🎨 Settings: Syncing themes', {
      slex_theme: slexTheme,
      theme: theme,
      manufacturer_theme: manufacturerTheme,
      active: activeTheme
    });
    
    // Sync all keys
    localStorage.setItem('dashboard-theme', activeTheme);
    
    // Apply to DOM
    document.documentElement.setAttribute('data-theme', activeTheme);
    
    // Update UI
    this.updateThemeUI(activeTheme);
  }
  
  updateThemeUI(theme) {
    // Update theme radio buttons
    const themeRadio = document.querySelector(`input[name="dashboard-theme"][value="${theme}"]`);
    if (themeRadio) {
      themeRadio.checked = true;
    }
    
    // Update header theme toggle icon
    const headerToggle = document.getElementById('themeToggle');
    if (headerToggle) {
      const icon = headerToggle.querySelector('i');
      if (icon) {
        icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
      }
    }
  }
  
  setupHeaderThemeToggle() {
    // No need to override - Universal Theme Manager handles this
    console.log('🎨 Settings: Using Universal Theme Manager for header toggle');
    
    // Just ensure we sync with universal theme on settings page load
    if (window.UniversalTheme) {
      window.UniversalTheme.syncAllThemes();
    }
  }

  // ====================================
  // 📋 TAB MANAGEMENT
  // ====================================

  initializeTabs() {
    const tabs = document.querySelectorAll('.settings-tab');
    const tabContents = document.querySelectorAll('.settings-tab-content');

    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        const tabId = tab.dataset.tab;
        this.switchTab(tabId, tabs, tabContents);
      });
    });
  }

  switchTab(tabId, tabs, tabContents) {
    // Update active tab
    tabs.forEach(t => t.classList.remove('active'));
    tabContents.forEach(tc => tc.classList.remove('active'));

    const activeTab = document.querySelector(`[data-tab="${tabId}"]`);
    const activeContent = document.getElementById(`${tabId}-tab`);

    if (activeTab && activeContent) {
      activeTab.classList.add('active');
      activeContent.classList.add('active');
      this.currentTab = tabId;

      // Track tab change
      this.trackTabChange(tabId);
    }
  }

  trackTabChange(tabId) {
    // Analytics tracking
    if (typeof gtag !== 'undefined') {
      gtag('event', 'settings_tab_change', {
        tab_name: tabId,
        event_category: 'settings'
      });
    }
  }

  // ====================================
  // 📝 FORM VALIDATION
  // ====================================

  initializeFormValidation() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
      const inputs = form.querySelectorAll('input, select, textarea');
      
      inputs.forEach(input => {
        input.addEventListener('blur', () => this.validateField(input));
        input.addEventListener('input', () => {
          this.markAsDirty();
          this.clearFieldError(input);
        });
      });
    });
  }

  validateField(field) {
    const fieldName = field.name;
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';

    // Clear previous error
    this.clearFieldError(field);

    // Required field validation
    if (field.hasAttribute('required') && !value) {
      isValid = false;
      errorMessage = 'Bu maydon majburiy';
    }

    // Email validation
    if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        isValid = false;
        errorMessage = 'Email manzil noto\'g\'ri formatda';
      }
    }

    // Phone validation - Global format
    if (field.type === 'tel' && value) {
      // More flexible international phone validation
      const phoneRegex = /^\+\d{1,4}\d{6,14}$/;
      if (!phoneRegex.test(value)) {
        isValid = false;
        errorMessage = 'Telefon raqam xalqaro formatda bo\'lishi kerak (+1234567890 dan +12345678901234 gacha)';
      }
    }

    // URL validation
    if (field.type === 'url' && value) {
      try {
        new URL(value);
      } catch {
        isValid = false;
        errorMessage = 'Website manzil noto\'g\'ri formatda';
      }
    }

    // Tax number validation
    if (fieldName === 'taxNumber' && value) {
      if (value.length < 6 || value.length > 20) {
        isValid = false;
        errorMessage = 'Soliq raqami 6-20 belgi orasida bo\'lishi kerak';
      }
    }

    // Password validation
    if (field.type === 'password' && fieldName === 'newPassword' && value) {
      if (value.length < 8) {
        isValid = false;
        errorMessage = 'Parol kamida 8 belgi bo\'lishi kerak';
      }
      
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
        isValid = false;
        errorMessage = 'Parol katta harf, kichik harf va raqam bo\'lishi kerak';
      }
    }

    // Confirm password validation
    if (fieldName === 'confirmPassword' && value) {
      const newPassword = document.getElementById('newPassword')?.value;
      if (value !== newPassword) {
        isValid = false;
        errorMessage = 'Parollar mos kelmaydi';
      }
    }

    // Real-time confirm password validation
    if (fieldName === 'newPassword' && value) {
      const confirmPassword = document.getElementById('confirmPassword');
      if (confirmPassword && confirmPassword.value && confirmPassword.value !== value) {
        this.showFieldError(confirmPassword, 'Parollar mos kelmaydi');
      } else if (confirmPassword && confirmPassword.value === value) {
        this.clearFieldError(confirmPassword);
      }
    }

    if (!isValid) {
      this.showFieldError(field, errorMessage);
    }

    return isValid;
  }

  showFieldError(field, message) {
    field.classList.add('error');
    
    // Remove existing error message
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
      existingError.remove();
    }

    // Add new error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
    field.parentNode.appendChild(errorDiv);
  }

  clearFieldError(field) {
    field.classList.remove('error');
    const errorDiv = field.parentNode.querySelector('.field-error');
    if (errorDiv) {
      errorDiv.remove();
    }
  }

  // ====================================
  // 📁 FILE UPLOAD HANDLING
  // ====================================

  initializeFileUploads() {
    const logoUpload = document.getElementById('logoUpload');
    const logoUploadBtn = document.getElementById('logoUploadBtn');

    if (logoUpload) {
      logoUpload.addEventListener('change', (e) => this.handleLogoUpload(e));
    }

    if (logoUploadBtn) {
      logoUploadBtn.addEventListener('click', () => {
        logoUpload?.click();
      });
    }
  }

  async handleLogoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    console.log('📤 Logo upload started:', file.name, file.size, file.type);

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      this.showToast('Faqat rasm fayllari (JPEG, PNG, GIF, WebP) qo\'llaniladi', 'error');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.showToast('Rasm hajmi 5MB dan oshmasligi kerak', 'error');
      return;
    }

    try {
      this.showLoading('Logo yuklanmoqda va yangilanmoqda...');

      // Create FormData
      const formData = new FormData();
      formData.append('logo', file);

      console.log('📤 Sending logo to server...');

      // Upload file
      const response = await fetch('/manufacturer/settings/upload-logo', {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-Token': this.getCSRFToken()
        },
        body: formData
      });

      const data = await response.json();
      console.log('📥 Server response:', data);

      if (data.success) {
        // Update logo preview immediately
        const logoPreview = document.getElementById('currentLogoPreview');
        if (logoPreview && data.data && data.data.logoUrl) {
          // Add timestamp to prevent caching
          const logoUrl = data.data.logoUrl + '?t=' + Date.now();
          logoPreview.src = logoUrl;
          
          console.log('✅ Logo preview updated:', logoUrl);
          
          // Add a subtle animation to show the change
          logoPreview.style.opacity = '0.5';
          setTimeout(() => {
            logoPreview.style.opacity = '1';
          }, 300);
        }

        this.showToast('Logo muvaffaqiyatli yangilandi! 🎉', 'success');
        
        // Clear the file input to allow re-uploading the same file
        event.target.value = '';
        
        // Mark form as changed
        this.markAsDirty();
        
      } else {
        throw new Error(data.error || data.message || 'Logo yuklashda xatolik');
      }
    } catch (error) {
      console.error('❌ Logo upload error:', error);
      
      let errorMessage = 'Logo yuklashda xatolik';
      if (error.message.includes('File too large')) {
        errorMessage = 'Fayl hajmi juda katta (max 5MB)';
      } else if (error.message.includes('Invalid file type')) {
        errorMessage = 'Noto\'g\'ri fayl turi';
      } else {
        errorMessage = error.message;
      }
      
      this.showToast(errorMessage, 'error');
      
      // Clear the file input on error
      event.target.value = '';
    } finally {
      this.hideLoading();
    }
  }



  // ====================================
  // 💾 FORM SUBMISSIONS
  // ====================================

  initializeFormSubmissions() {
    // Company info form
    const companyForm = document.getElementById('companyInfoForm');
    if (companyForm) {
      companyForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveCompanyInfo();
      });
    }

    // Contact info form
    const contactForm = document.getElementById('contactInfoForm');
    if (contactForm) {
      contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveContactInfo();
      });
    }

    // Business info form
    const saveBusinessBtn = document.getElementById('saveBusinessInfo');
    if (saveBusinessBtn) {
      saveBusinessBtn.addEventListener('click', () => this.saveBusinessInfo());
    }

    // Password change
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    if (changePasswordBtn) {
      changePasswordBtn.addEventListener('click', () => this.changePassword());
    }

    // Preferences
    const savePreferencesBtn = document.getElementById('savePreferences');
    if (savePreferencesBtn) {
      savePreferencesBtn.addEventListener('click', () => this.savePreferences());
    }

    // Integrations
    const saveIntegrationsBtn = document.getElementById('saveIntegrations');
    if (saveIntegrationsBtn) {
      saveIntegrationsBtn.addEventListener('click', () => this.saveIntegrations());
    }

    // Global actions
    const saveAllBtn = document.getElementById('saveAllSettingsBtn');
    if (saveAllBtn) {
      saveAllBtn.addEventListener('click', () => this.saveAllSettings());
    }

    // Reset settings
    const resetBtn = document.getElementById('resetSettingsBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetSettings());
    }

    // 2FA toggles
    const sms2faToggle = document.getElementById('sms2fa');
    if (sms2faToggle) {
      sms2faToggle.addEventListener('change', (e) => this.toggle2FA('sms', e.target.checked));
    }

    const email2faToggle = document.getElementById('email2fa');
    if (email2faToggle) {
      email2faToggle.addEventListener('change', (e) => this.toggle2FA('email', e.target.checked));
    }

    // Session management
    const logoutAllBtn = document.getElementById('logoutAllSessionsBtn');
    if (logoutAllBtn) {
      logoutAllBtn.addEventListener('click', () => this.logoutAllSessions());
    }

    // API key management
    const regenerateApiBtn = document.getElementById('regenerateApiKey');
    if (regenerateApiBtn) {
      regenerateApiBtn.addEventListener('click', () => this.regenerateApiKey());
    }

    const copyApiBtn = document.getElementById('copyApiKey');
    if (copyApiBtn) {
      copyApiBtn.addEventListener('click', () => this.copyApiKey());
    }

    // Password toggle buttons
    const passwordToggleBtns = document.querySelectorAll('.password-toggle-btn');
    passwordToggleBtns.forEach(btn => {
      btn.addEventListener('click', (e) => this.togglePasswordVisibility(e.target.closest('button').dataset.target));
    });

    // Password generator buttons
    const passwordGeneratorBtns = document.querySelectorAll('.password-generator-btn');
    passwordGeneratorBtns.forEach(btn => {
      btn.addEventListener('click', (e) => this.generatePassword(e.target.closest('button').dataset.target));
    });

    // Password strength checker
    const newPasswordInput = document.getElementById('newPassword');
    if (newPasswordInput) {
      newPasswordInput.addEventListener('input', () => this.checkPasswordStrength(newPasswordInput.value));
    }
  }

  async saveCompanyInfo() {
    const formData = this.getFormData('company-tab');
    
    console.log('📤 Company form data being sent:', formData);
    
    if (!this.validateTab('company-tab')) {
      this.showToast('Iltimos, xatoliklarni tuzating', 'error');
      return;
    }

    // Validate required fields on frontend
    const requiredFields = ['companyName', 'activityType', 'taxNumber'];
    for (const field of requiredFields) {
      if (!formData[field] || formData[field].trim() === '') {
        this.showToast(`${field} majburiy maydon`, 'error');
        return;
      }
    }

    try {
      this.showLoading('Kompaniya ma\'lumotlari saqlanmoqda...');

      const response = await this.makeApiRequest('/manufacturer/settings/company', 'PUT', formData);
      
      console.log('📥 Server response:', response);

      if (response.success) {
        this.showToast('Kompaniya ma\'lumotlari muvaffaqiyatli saqlandi', 'success');
        this.markAsClean();
        
        // Update form with saved data
        if (response.data) {
          this.updateFormWithSavedData(response.data);
        }
      } else {
        throw new Error(response.error || response.message || 'Saqlashda xatolik');
      }
    } catch (error) {
      console.error('❌ Save company info error:', error);
      
      // Show specific error messages
      let errorMessage = 'Saqlashda xatolik';
      if (error.message.includes('Company name must be')) {
        errorMessage = 'Kompaniya nomi kamida 2 belgi bo\'lishi kerak';
      } else if (error.message.includes('Tax number must be')) {
        errorMessage = 'Soliq raqami 6-20 raqamdan iborat bo\'lishi kerak';
      } else if (error.message.includes('Established year')) {
        errorMessage = 'Tashkil etilgan yil 1900 dan hozirgi yilgacha bo\'lishi kerak';
      } else if (error.message.includes('Company description')) {
        errorMessage = 'Kompaniya tavsifi 500 belgidan oshmasligi kerak';
      } else if (error.message.includes('required')) {
        errorMessage = 'Majburiy maydonlarni to\'ldiring';
      } else {
        errorMessage = error.message;
      }
      
      this.showToast(errorMessage, 'error');
    } finally {
      this.hideLoading();
    }
  }

  updateFormWithSavedData(data) {
    // Update form fields with saved data to reflect any server-side changes
    if (data.companyName) {
      const companyNameField = document.getElementById('companyName');
      if (companyNameField) companyNameField.value = data.companyName;
    }
    
    if (data.establishedYear) {
      const yearField = document.getElementById('establishedYear');
      if (yearField) yearField.value = data.establishedYear;
    }
    
    // Add more field updates as needed
    console.log('✅ Form updated with saved data:', data);
  }

  async saveContactInfo() {
    const formData = this.getFormData('contact-tab');
    
    if (!this.validateTab('contact-tab')) {
      this.showToast('Iltimos, xatoliklarni tuzating', 'error');
      return;
    }

    try {
      this.showLoading('Aloqa ma\'lumotlari saqlanmoqda...');

      const response = await this.makeApiRequest('/manufacturer/settings/contact', 'PUT', formData);

      if (response.success) {
        this.showToast('Aloqa ma\'lumotlari muvaffaqiyatli saqlandi', 'success');
        this.markAsClean();
      } else {
        throw new Error(response.message || 'Saqlashda xatolik');
      }
    } catch (error) {
      console.error('Save contact info error:', error);
      this.showToast('Saqlashda xatolik: ' + error.message, 'error');
    } finally {
      this.hideLoading();
    }
  }

  async saveBusinessInfo() {
    const formData = this.getFormData('business-tab');
    
    try {
      this.showLoading('Biznes ma\'lumotlari saqlanmoqda...');

      const response = await this.makeApiRequest('/manufacturer/settings/business', 'PUT', formData);

      if (response.success) {
        this.showToast('Biznes ma\'lumotlari muvaffaqiyatli saqlandi', 'success');
        this.markAsClean();
      } else {
        throw new Error(response.message || 'Saqlashda xatolik');
      }
    } catch (error) {
      console.error('Save business info error:', error);
      this.showToast('Saqlashda xatolik: ' + error.message, 'error');
    } finally {
      this.hideLoading();
    }
  }

  async changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validate passwords
    if (!currentPassword || !newPassword || !confirmPassword) {
      this.showToast('Barcha maydonlarni to\'ldiring', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      this.showToast('Yangi parollar mos kelmaydi', 'error');
      return;
    }

    if (newPassword.length < 8) {
      this.showToast('Yangi parol kamida 8 belgi bo\'lishi kerak', 'error');
      return;
    }

    try {
      this.showLoading('Parol o\'zgartirilmoqda...');

      const response = await this.makeApiRequest('/manufacturer/settings/change-password', 'PUT', {
        currentPassword,
        newPassword
      });

      if (response.success) {
        this.showToast('Parol muvaffaqiyatli o\'zgartirildi', 'success');
        
        // Clear password fields
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
      } else {
        throw new Error(response.message || 'Parol o\'zgartirishda xatolik');
      }
    } catch (error) {
      console.error('Change password error:', error);
      this.showToast('Parol o\'zgartirishda xatolik: ' + error.message, 'error');
    } finally {
      this.hideLoading();
    }
  }

  async savePreferences() {
    const formData = this.getFormData('preferences-tab');
    
    try {
      this.showLoading('Sozlamalar saqlanmoqda...');

      const response = await this.makeApiRequest('/manufacturer/settings/preferences', 'PUT', formData);

      if (response.success) {
        this.showToast('Sozlamalar muvaffaqiyatli saqlandi', 'success');
        this.markAsClean();
        
        // Apply theme change if needed
        if (formData.theme) {
          this.applyThemeChange(formData.theme);
        }
      } else {
        throw new Error(response.message || 'Saqlashda xatolik');
      }
    } catch (error) {
      console.error('Save preferences error:', error);
      this.showToast('Saqlashda xatolik: ' + error.message, 'error');
    } finally {
      this.hideLoading();
    }
  }

  async saveIntegrations() {
    const formData = this.getFormData('integrations-tab');
    
    try {
      this.showLoading('Integratsiyalar saqlanmoqda...');

      const response = await this.makeApiRequest('/manufacturer/settings/integrations', 'PUT', formData);

      if (response.success) {
        this.showToast('Integratsiyalar muvaffaqiyatli saqlandi', 'success');
        this.markAsClean();
      } else {
        throw new Error(response.message || 'Saqlashda xatolik');
      }
    } catch (error) {
      console.error('Save integrations error:', error);
      this.showToast('Saqlashda xatolik: ' + error.message, 'error');
    } finally {
      this.hideLoading();
    }
  }

  async saveAllSettings() {
    if (!confirm('Barcha sozlamalarni saqlashni tasdiqlaysizmi?')) {
      return;
    }

    try {
      this.showLoading('Barcha sozlamalar saqlanmoqda...');

      // Collect all form data
      const allData = {
        company: this.getFormData('company-tab'),
        contact: this.getFormData('contact-tab'),
        business: this.getFormData('business-tab'),
        preferences: this.getFormData('preferences-tab'),
        integrations: this.getFormData('integrations-tab')
      };

      const response = await this.makeApiRequest('/manufacturer/settings/save-all', 'PUT', allData);

      if (response.success) {
        this.showToast('Barcha sozlamalar muvaffaqiyatli saqlandi', 'success');
        this.markAsClean();
      } else {
        throw new Error(response.message || 'Saqlashda xatolik');
      }
    } catch (error) {
      console.error('Save all settings error:', error);
      this.showToast('Saqlashda xatolik: ' + error.message, 'error');
    } finally {
      this.hideLoading();
    }
  }

  async resetSettings() {
    if (!confirm('Barcha sozlamalarni qayta tiklamoqchimisiz? Bu amalni bekor qilib bo\'lmaydi.')) {
      return;
    }

    try {
      this.showLoading('Sozlamalar qayta tiklanmoqda...');

      const response = await this.makeApiRequest('/manufacturer/settings/reset', 'POST');

      if (response.success) {
        this.showToast('Sozlamalar muvaffaqiyatli qayta tiklandi', 'success');
        
        // Reload page to show reset data
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        throw new Error(response.message || 'Qayta tiklashda xatolik');
      }
    } catch (error) {
      console.error('Reset settings error:', error);
      this.showToast('Qayta tiklashda xatolik: ' + error.message, 'error');
    } finally {
      this.hideLoading();
    }
  }

  async regenerateApiKey() {
    if (!confirm('Yangi API kalitini yaratmoqchimisiz? Eski kalit ishlamay qoladi.')) {
      return;
    }

    try {
      this.showLoading('Yangi API kalit yaratilmoqda...');

      const response = await this.makeApiRequest('/manufacturer/settings/regenerate-api-key', 'POST');

      if (response.success) {
        // Update API key display
        const apiKeyDisplay = document.querySelector('code');
        if (apiKeyDisplay) {
          apiKeyDisplay.textContent = response.apiKey;
        }

        this.showToast('Yangi API kalit yaratildi', 'success');
      } else {
        throw new Error(response.message || 'API kalit yaratishda xatolik');
      }
    } catch (error) {
      console.error('Regenerate API key error:', error);
      this.showToast('API kalit yaratishda xatolik: ' + error.message, 'error');
    } finally {
      this.hideLoading();
    }
  }

  copyApiKey() {
    const apiKeyElement = document.querySelector('code');
    if (!apiKeyElement) return;

    const apiKey = apiKeyElement.textContent;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(apiKey).then(() => {
        this.showToast('API kalit nusxalandi', 'success');
      }).catch(() => {
        this.fallbackCopyText(apiKey);
      });
    } else {
      this.fallbackCopyText(apiKey);
    }
  }

  fallbackCopyText(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
      document.execCommand('copy');
      this.showToast('API kalit nusxalandi', 'success');
    } catch (err) {
      this.showToast('Nusxalashda xatolik', 'error');
    }
    
    document.body.removeChild(textarea);
  }

  // ====================================
  // 💾 AUTO-SAVE FUNCTIONALITY
  // ====================================

  initializeAutoSave() {
    // Auto-save every 30 seconds if there are changes
    setInterval(() => {
      if (this.isDirty) {
        this.autoSave();
      }
    }, 30000);

    // Save on page unload
    window.addEventListener('beforeunload', (e) => {
      if (this.isDirty) {
        e.preventDefault();
        e.returnValue = 'Saqlanmagan o\'zgarishlar bor. Sahifani tark etmoqchimisiz?';
      }
    });
  }

  async autoSave() {
    try {
      const currentTabData = this.getFormData(`${this.currentTab}-tab`);
      
      const response = await this.makeApiRequest('/manufacturer/settings/auto-save', 'PUT', {
        tab: this.currentTab,
        data: currentTabData
      });

      if (response.success) {
        console.log('✅ Auto-saved successfully');
        this.markAsClean();
      }
    } catch (error) {
      console.error('Auto-save error:', error);
    }
  }

  markAsDirty() {
    this.isDirty = true;
    
    // Visual indicator
    const saveButtons = document.querySelectorAll('[id*="save"]');
    saveButtons.forEach(btn => {
      if (!btn.classList.contains('pulse')) {
        btn.classList.add('pulse');
      }
    });
  }

  markAsClean() {
    this.isDirty = false;
    
    // Remove visual indicator
    const saveButtons = document.querySelectorAll('[id*="save"]');
    saveButtons.forEach(btn => {
      btn.classList.remove('pulse');
    });
  }

  // ====================================
  // 🔧 UTILITY METHODS
  // ====================================

  getFormData(tabId) {
    const tab = document.getElementById(tabId);
    if (!tab) return {};

    const formData = {};
    const inputs = tab.querySelectorAll('input, select, textarea');

    inputs.forEach(input => {
      const name = input.name;
      if (!name) return;

      if (input.type === 'checkbox') {
        if (!formData[name]) formData[name] = [];
        if (input.checked) {
          formData[name].push(input.value);
        }
      } else if (input.type === 'radio') {
        if (input.checked) {
          formData[name] = input.value;
        }
      } else {
        formData[name] = input.value;
      }
    });

    return formData;
  }

  validateTab(tabId) {
    const tab = document.getElementById(tabId);
    if (!tab) return true;

    const inputs = tab.querySelectorAll('input, select, textarea');
    let isValid = true;

    inputs.forEach(input => {
      if (!this.validateField(input)) {
        isValid = false;
      }
    });

    return isValid;
  }

  async loadInitialData() {
    try {
      const response = await this.makeApiRequest('/manufacturer/settings/load', 'GET');
      
      if (response.success) {
        this.populateFormData(response.data);
      }
    } catch (error) {
      console.error('Load initial data error:', error);
    }
  }

  populateFormData(data) {
    Object.keys(data).forEach(key => {
      const input = document.querySelector(`[name="${key}"]`);
      if (input) {
        if (input.type === 'checkbox') {
          input.checked = Array.isArray(data[key]) ? data[key].includes(input.value) : data[key];
        } else if (input.type === 'radio') {
          input.checked = input.value === data[key];
        } else {
          input.value = data[key] || '';
        }
      }
    });
  }

  applyThemeChange(theme) {
    // Use Universal Theme Manager if available
    if (window.UniversalTheme) {
      window.UniversalTheme.setTheme(theme);
      console.log('🎨 Settings: Using Universal Theme Manager to set theme:', theme);
    } else {
      // Fallback to manual implementation
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('dashboard-theme', theme);
      localStorage.setItem('dashboard-theme', theme);
      localStorage.setItem('dashboard-theme', theme);
      
      window.dispatchEvent(new CustomEvent('themeChanged', {
        detail: { theme: theme }
      }));
      
      console.log('🎨 Settings: Fallback theme change to', theme);
    }
  }

  getCSRFToken() {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
  }

  async makeApiRequest(url, method, data = null) {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-Token': this.getCSRFToken()
      }
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  getCSRFToken() {
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    return metaTag ? metaTag.getAttribute('content') : '';
  }

  showLoading(message = 'Yuklanmoqda...') {
    // Show loading overlay
    const overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
      <div class="loading-content">
        <div class="loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
        </div>
        <div class="loading-message">${message}</div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.remove();
    }
  }

  showToast(message, type = 'info') {
    // Use existing toast system if available
    if (window.showToast) {
      window.showToast(message, type);
    } else if (window.showToastMessage) {
      window.showToastMessage(message, type);
    } else {
      // Fallback alert
      alert(message);
    }
  }

  // ====================================
  // 🔐 SECURITY & 2FA METHODS
  // ====================================

  async toggle2FA(type, enabled) {
    try {
      this.showLoading(`${type.toUpperCase()} tasdiqlash ${enabled ? 'yoqilmoqda' : 'o\'chirilmoqda'}...`);

      const response = await this.makeApiRequest('/manufacturer/settings/2fa', 'PUT', {
        type: type,
        enabled: enabled
      });

      if (response.success) {
        this.showToast(`${type.toUpperCase()} tasdiqlash ${enabled ? 'yoqildi' : 'o\'chirildi'}`, 'success');
      } else {
        throw new Error(response.message || '2FA sozlashda xatolik');
      }
    } catch (error) {
      console.error('2FA toggle error:', error);
      this.showToast('2FA sozlashda xatolik: ' + error.message, 'error');
      
      // Revert toggle state
      const toggle = document.getElementById(`${type}2fa`);
      if (toggle) {
        toggle.checked = !enabled;
      }
    } finally {
      this.hideLoading();
    }
  }

  async logoutAllSessions() {
    if (!confirm('Barcha qurilmalardan chiqishni xohlaysizmi?')) {
      return;
    }

    try {
      this.showLoading('Barcha sessiyalar tugatilmoqda...');

      const response = await this.makeApiRequest('/manufacturer/settings/logout-all', 'POST');

      if (response.success) {
        this.showToast('Barcha sessiyalar tugatildi', 'success');
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          window.location.href = '/auth/login';
        }, 2000);
      } else {
        throw new Error(response.message || 'Sessiyalarni tugatishda xatolik');
      }
    } catch (error) {
      console.error('Logout all sessions error:', error);
      this.showToast('Sessiyalarni tugatishda xatolik: ' + error.message, 'error');
    } finally {
      this.hideLoading();
    }
  }

  // ====================================
  // 🔐 PASSWORD UTILITIES
  // ====================================

  togglePasswordVisibility(targetId) {
    const input = document.getElementById(targetId);
    const button = document.querySelector(`[data-target="${targetId}"].password-toggle-btn`);
    const icon = button.querySelector('i');

    if (input.type === 'password') {
      input.type = 'text';
      icon.classList.remove('fa-eye');
      icon.classList.add('fa-eye-slash');
      button.classList.add('active');
    } else {
      input.type = 'password';
      icon.classList.remove('fa-eye-slash');
      icon.classList.add('fa-eye');
      button.classList.remove('active');
    }
  }

  generatePassword(targetId) {
    const input = document.getElementById(targetId);
    const confirmInput = document.getElementById('confirmPassword');
    
    // Generate strong password
    const newPassword = this.createStrongPassword();
    
    // Set the generated password
    input.value = newPassword;
    
    // If this is the new password field, also set confirm password
    if (targetId === 'newPassword' && confirmInput) {
      confirmInput.value = newPassword;
    }
    
    // Show password temporarily
    this.showPasswordTemporarily(targetId);
    
    // Trigger validation
    this.validateField(input);
    if (confirmInput && targetId === 'newPassword') {
      this.validateField(confirmInput);
    }
    
    // Show success message
    this.showToast('Kuchli parol yaratildi va kiritildi!', 'success');
    
    // Mark as dirty
    this.markAsDirty();
  }

  createStrongPassword(length = 16) {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    let password = '';
    
    // Ensure at least one character from each type
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill the rest randomly
    const allChars = lowercase + uppercase + numbers + symbols;
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  showPasswordTemporarily(targetId) {
    const input = document.getElementById(targetId);
    const button = document.querySelector(`[data-target="${targetId}"].password-toggle-btn`);
    const icon = button?.querySelector('i');
    
    if (!button || !icon) return;
    
    // Show password
    const originalType = input.type;
    input.type = 'text';
    icon.classList.remove('fa-eye');
    icon.classList.add('fa-eye-slash');
    button.classList.add('active');
    
    // Hide password after 3 seconds
    setTimeout(() => {
      input.type = 'password';
      icon.classList.remove('fa-eye-slash');
      icon.classList.add('fa-eye');
      button.classList.remove('active');
    }, 3000);
  }

  checkPasswordStrength(password) {
    const strengthIndicator = document.getElementById('passwordStrength');
    const strengthBar = strengthIndicator.querySelector('.password-strength-bar');
    
    if (!password) {
      strengthIndicator.style.display = 'none';
      return;
    }
    
    strengthIndicator.style.display = 'block';
    
    let score = 0;
    let strength = 'weak';
    
    // Length check
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    
    // Character variety checks
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    // Determine strength
    if (score >= 6) {
      strength = 'strong';
    } else if (score >= 4) {
      strength = 'good';
    } else if (score >= 3) {
      strength = 'fair';
    } else {
      strength = 'weak';
    }
    
    // Update visual indicator
    strengthBar.className = `password-strength-bar ${strength}`;
    
    // Update help text
    const helpText = strengthIndicator.parentNode.querySelector('.settings-help');
    const strengthMessages = {
      weak: 'Zaif parol - ko\'proq belgi va xilma-xil harflar qo\'shing',
      fair: 'O\'rtacha parol - katta harflar va belgilar qo\'shing',
      good: 'Yaxshi parol - yana bir nechta belgi qo\'shing',
      strong: 'Juda kuchli parol! 🛡️'
    };
    
    if (helpText) {
      const originalText = "Kamida 8 belgi, katta va kichik harflar, raqam yoki <strong>Magic button</strong> ni bosing";
      const strengthText = `<span style="color: ${strength === 'strong' ? '#059669' : strength === 'good' ? '#10b981' : strength === 'fair' ? '#f59e0b' : '#ef4444'}">${strengthMessages[strength]}</span>`;
      helpText.innerHTML = `${originalText}<br>${strengthText}`;
    }
  }
}

// ====================================
// 🚀 INITIALIZE SETTINGS PAGE
// ====================================

document.addEventListener('DOMContentLoaded', function() {
  window.manufacturerSettings = new ManufacturerSettings();
});

// ====================================
// 📱 ADDITIONAL UTILITY FUNCTIONS
// ====================================

// Theme toggle functionality - delegated to Universal Theme Manager
function toggleTheme() {
  if (window.UniversalTheme) {
    window.UniversalTheme.toggleTheme();
  } else {
    // Fallback implementation
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('dashboard-theme', newTheme);
    localStorage.setItem('dashboard-theme', newTheme);
    localStorage.setItem('dashboard-theme', newTheme);
    
    const themeRadio = document.querySelector(`input[name="dashboard-theme"][value="${newTheme}"]`);
    if (themeRadio) {
      themeRadio.checked = true;
    }
    
    const headerToggle = document.getElementById('themeToggle');
    if (headerToggle) {
      const icon = headerToggle.querySelector('i');
      if (icon) {
        icon.className = newTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
      }
    }
    
    window.dispatchEvent(new CustomEvent('themeChanged', {
      detail: { theme: newTheme }
    }));
    
    console.log('🎨 Settings: Fallback theme toggle to', newTheme);
  }
}

// Export settings to JSON
function exportSettings() {
  if (!window.manufacturerSettings) return;
  
  const allData = {
    company: window.manufacturerSettings.getFormData('company-tab'),
    contact: window.manufacturerSettings.getFormData('contact-tab'),
    business: window.manufacturerSettings.getFormData('business-tab'),
    preferences: window.manufacturerSettings.getFormData('preferences-tab'),
    integrations: window.manufacturerSettings.getFormData('integrations-tab'),
    exportDate: new Date().toISOString()
  };

  const dataStr = JSON.stringify(allData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `manufacturer-settings-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  window.manufacturerSettings.showToast('Sozlamalar fayl sifatida yuklab olindi', 'success');
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
  // Ctrl+S to save current tab
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault();
    
    if (window.manufacturerSettings) {
      const currentTab = window.manufacturerSettings.currentTab;
      const saveButton = document.getElementById(`save${currentTab.charAt(0).toUpperCase() + currentTab.slice(1)}Info`);
      if (saveButton) {
        saveButton.click();
      }
    }
  }
});

// CSS for loading overlay and animations
const style = document.createElement('style');
style.textContent = `
  .loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99999;
    backdrop-filter: blur(4px);
  }

  .loading-content {
    background: var(--bg-primary, #ffffff);
    padding: 2rem;
    border-radius: 12px;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }

  .loading-spinner {
    font-size: 2rem;
    color: var(--primary-color, #FF6A00);
    margin-bottom: 1rem;
  }

  .loading-message {
    color: var(--text-primary, #1e293b);
    font-weight: 600;
  }

  .pulse {
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(255, 106, 0, 0.7); }
    70% { box-shadow: 0 0 0 10px rgba(255, 106, 0, 0); }
    100% { box-shadow: 0 0 0 0 rgba(255, 106, 0, 0); }
  }

  .field-error {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
    color: #ef4444;
    font-size: 0.85rem;
    font-weight: 500;
  }

  .settings-input.error,
  .settings-select.error,
  .settings-textarea.error {
    border-color: #ef4444 !important;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
  }

  [data-theme="dark"] .loading-content {
    background: var(--bg-primary-dark, #1e1e3f);
  }

  [data-theme="dark"] .loading-message {
    color: var(--text-primary-dark, #f1f5f9);
  }
`;
document.head.appendChild(style);
