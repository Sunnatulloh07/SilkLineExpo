/**
 * Buyer Settings JavaScript
 * Handles settings page interactions and form submissions
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize settings page
    initializeSettingsPage();
});

/**
 * Initialize settings page
 */
function initializeSettingsPage() {
    // Set up event listeners
    setupEventListeners();
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Settings navigation
    const navItems = document.querySelectorAll('.settings-nav .nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            switchSettingsSection(this.dataset.section);
        });
    });
    
    // Profile settings form
    const profileForm = document.getElementById('profileSettingsForm');
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveProfileSettings();
        });
    }
    
    // Account settings form
    const accountForm = document.getElementById('accountSettingsForm');
    if (accountForm) {
        accountForm.addEventListener('submit', function(e) {
            e.preventDefault();
            changePassword();
        });
    }
    
    // Language selection
    const languageSelect = document.getElementById('language');
    if (languageSelect) {
        languageSelect.addEventListener('change', function() {
            changeLanguage(this.value);
        });
    }
    
    // Theme selection
    const themeRadios = document.querySelectorAll('input[name="theme"]');
    themeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            changeTheme(this.value);
        });
    });
}

/**
 * Switch settings section
 */
function switchSettingsSection(sectionName) {
    // Remove active class from all nav items
    document.querySelectorAll('.settings-nav .nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to selected nav item
    document.querySelector(`.settings-nav .nav-item[data-section="${sectionName}"]`).classList.add('active');
    
    // Hide all sections
    document.querySelectorAll('.settings-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(`${sectionName}-section`).classList.add('active');
}

/**
 * Save profile settings
 */
function saveProfileSettings() {
    const form = document.getElementById('profileSettingsForm');
    if (form) {
        // In a real implementation, this would submit the form data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        console.log('Saving profile settings:', data);
        
        // Show success message
        alert('Profile settings saved successfully!');
    }
}

/**
 * Change password
 */
function changePassword() {
    const form = document.getElementById('accountSettingsForm');
    if (form) {
        const currentPassword = form.currentPassword.value;
        const newPassword = form.newPassword.value;
        const confirmPassword = form.confirmPassword.value;
        
        // Validate passwords
        if (newPassword !== confirmPassword) {
            alert('New passwords do not match!');
            return;
        }
        
        if (newPassword.length < 6) {
            alert('Password must be at least 6 characters long!');
            return;
        }
        
        // In a real implementation, this would submit the password change request
        console.log('Changing password');
        
        // Show success message
        alert('Password changed successfully!');
        
        // Reset form
        form.reset();
    }
}

/**
 * Change language
 */
function changeLanguage(language) {
    // In a real implementation, this would change the language
    console.log('Changing language to:', language);
    
    // This would typically involve:
    // 1. Setting a cookie or localStorage value
    // 2. Redirecting to refresh the page with the new language
    // 3. Or making an AJAX request to update the language
    
    alert(`Language changed to: ${language}`);
}

/**
 * Change theme
 */
function changeTheme(theme) {
    // In a real implementation, this would change the theme
    console.log('Changing theme to:', theme);
    
    // Set data-theme attribute on body
    document.body.setAttribute('data-theme', theme);
    
    // Save theme preference to localStorage
    localStorage.setItem('theme', theme);
}