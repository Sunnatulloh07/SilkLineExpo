/**
 * Global Header Dropdown Functionality
 * Handles user menu dropdown for all pages
 */

document.addEventListener('DOMContentLoaded', function() {
    // Desktop user menu
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    
    // Mobile user menu 
    const userMenuBtnMobile = document.getElementById('userMenuBtnMobile');
    const userDropdownMobile = document.getElementById('userDropdownMobile');

    // Function to toggle dropdown
    function toggleDropdown(dropdown) {
        if (!dropdown) return;
        
        // Close all other dropdowns first
        document.querySelectorAll('.user-dropdown').forEach(menu => {
            if (menu !== dropdown) {
                menu.classList.add('user-dropdown-hidden');
            }
        });
        
        // Toggle current dropdown
        dropdown.classList.toggle('user-dropdown-hidden');
    }

    // Desktop user menu click handler - Remove any existing listeners
    if (userMenuBtn && userDropdown) {
        // Clone node to remove all existing event listeners
        const newUserMenuBtn = userMenuBtn.cloneNode(true);
        userMenuBtn.parentNode.replaceChild(newUserMenuBtn, userMenuBtn);
        
        newUserMenuBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleDropdown(userDropdown);
        });
    }

    // Mobile user menu click handler - Remove any existing listeners  
    if (userMenuBtnMobile && userDropdownMobile) {
        // Clone node to remove all existing event listeners
        const newUserMenuBtnMobile = userMenuBtnMobile.cloneNode(true);
        userMenuBtnMobile.parentNode.replaceChild(newUserMenuBtnMobile, userMenuBtnMobile);
        
        newUserMenuBtnMobile.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleDropdown(userDropdownMobile);
        });
    }

    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        // Check if click is outside any dropdown
        if (!e.target.closest('.user-menu') && 
            !e.target.closest('.user-dropdown') &&
            !e.target.closest('.custom-lang-selector')) {
            
            document.querySelectorAll('.user-dropdown').forEach(menu => {
                menu.classList.add('user-dropdown-hidden');
            });
        }
    });

    // Prevent dropdown from closing when clicking inside
    document.querySelectorAll('.user-dropdown').forEach(dropdown => {
        dropdown.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    });

    // Handle avatar image load errors
    document.querySelectorAll('.user-avatar').forEach(img => {
        img.addEventListener('error', function() {
            this.style.display = 'none';
            const textAvatar = this.nextElementSibling;
            if (textAvatar && textAvatar.classList.contains('user-avatar-text')) {
                textAvatar.style.display = 'flex';
            }
        });
    });

    // Handle logout clicks
    const logoutLinks = document.querySelectorAll('a[href="/auth/logout"]');
    logoutLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Check if buyer token manager is available
            if (typeof window.buyerTokenManager !== 'undefined') {
                window.buyerTokenManager.logout();
            } else {
                // Fallback to regular logout
                window.location.href = '/auth/logout';
            }
        });
    });
});
