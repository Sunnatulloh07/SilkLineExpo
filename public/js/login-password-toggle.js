/*
Login Password Toggle Handler
Professional password visibility toggle functionality
*/

(function() {
    'use strict';

    class LoginPasswordToggle {
        constructor() {
            this.init();
        }

        init() {
            this.setupPasswordToggle();
        }

        setupPasswordToggle() {
            const toggleBtn = document.querySelector('.password-toggle-btn');
            const passwordInput = document.getElementById('password');
            const toggleIcon = document.getElementById('passwordToggleIcon');

            if (toggleBtn && passwordInput && toggleIcon) {
                toggleBtn.addEventListener('click', () => {
                    this.togglePasswordVisibility(passwordInput, toggleIcon);
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
            toggleBtn.style.color = isPassword ? 'var(--main-color, #007bff)' : '#6c757d';
            
            // Brief animation
            toggleIcon.style.transform = 'scale(0.8)';
            setTimeout(() => {
                toggleIcon.style.transform = 'scale(1)';
            }, 150);
        }
    }

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        new LoginPasswordToggle();
    });

})();