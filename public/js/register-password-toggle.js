/*
Register Password Toggle Handler
Professional password visibility toggle functionality for register page
Senior Software Engineer Clean Code Implementation
*/

(function() {
    'use strict';

    class RegisterPasswordToggle {
        constructor() {
            this.init();
        }

        init() {
            this.setupPasswordToggle();
        }

        setupPasswordToggle() {
            // Setup for main password field
            const passwordToggleBtn = document.querySelector('.password-toggle-btn[data-target="password"]');
            const passwordInput = document.getElementById('password');
            const passwordToggleIcon = document.getElementById('passwordToggleIcon');

            if (passwordToggleBtn && passwordInput && passwordToggleIcon) {
                passwordToggleBtn.addEventListener('click', () => {
                    this.togglePasswordVisibility(passwordInput, passwordToggleIcon);
                });
            }

            // Setup for confirm password field
            const confirmPasswordToggleBtn = document.querySelector('.password-toggle-btn[data-target="confirmPassword"]');
            const confirmPasswordInput = document.getElementById('confirmPassword');
            const confirmPasswordToggleIcon = document.getElementById('confirmPasswordToggleIcon');

            if (confirmPasswordToggleBtn && confirmPasswordInput && confirmPasswordToggleIcon) {
                confirmPasswordToggleBtn.addEventListener('click', () => {
                    this.togglePasswordVisibility(confirmPasswordInput, confirmPasswordToggleIcon);
                });
            }
        }

        togglePasswordVisibility(passwordInput, toggleIcon) {
            const isPassword = passwordInput.type === 'password';
            
            // Toggle input type
            passwordInput.type = isPassword ? 'text' : 'password';
            
            // Toggle icon
            if (isPassword) {
                toggleIcon.className = 'las la-eye-slash';
                passwordInput.setAttribute('data-visible', 'true');
            } else {
                toggleIcon.className = 'las la-eye';
                passwordInput.removeAttribute('data-visible');
            }

            // Add visual feedback
            const toggleBtn = toggleIcon.closest('.password-toggle-btn');
            if (toggleBtn) {
                // Update button color
                toggleBtn.style.color = isPassword ? 'var(--main-color, #007bff)' : '';
                
                // Brief animation for better UX
                toggleIcon.style.transform = 'scale(0.8)';
                setTimeout(() => {
                    toggleIcon.style.transform = 'scale(1)';
                }, 150);
            }

            // Add accessibility announcement
            this.announcePasswordVisibility(isPassword, passwordInput.id);
        }

        announcePasswordVisibility(isVisible, fieldId) {
            const announcement = isVisible ? 'Password is now visible' : 'Password is now hidden';
            const fieldName = fieldId === 'confirmPassword' ? 'Confirm password' : 'Password';
            
            // Create temporary announcement for screen readers
            const announcementElement = document.createElement('div');
            announcementElement.setAttribute('aria-live', 'polite');
            announcementElement.setAttribute('aria-atomic', 'true');
            announcementElement.className = 'sr-only';
            announcementElement.textContent = `${fieldName} ${announcement.toLowerCase()}`;
            
            document.body.appendChild(announcementElement);
            
            // Remove after announcement
            setTimeout(() => {
                if (document.body.contains(announcementElement)) {
                    document.body.removeChild(announcementElement);
                }
            }, 1000);
        }

        // Dark mode color adjustment
        adjustForTheme() {
            const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark' ||
                             document.body.classList.contains('dark-version');
            
            const toggleButtons = document.querySelectorAll('.password-toggle-btn');
            toggleButtons.forEach(btn => {
                if (isDarkMode) {
                    btn.style.setProperty('--toggle-color', '#a0aec0');
                    btn.style.setProperty('--toggle-hover-bg', 'rgba(255, 255, 255, 0.1)');
                } else {
                    btn.style.removeProperty('--toggle-color');
                    btn.style.removeProperty('--toggle-hover-bg');
                }
            });
        }
    }

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        const passwordToggle = new RegisterPasswordToggle();

        // Watch for theme changes
        const observer = new MutationObserver(() => {
            passwordToggle.adjustForTheme();
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        });

        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['class']
        });

        // Initial theme adjustment
        passwordToggle.adjustForTheme();
    });

})(); 
