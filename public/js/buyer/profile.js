/**
 * Buyer Profile JavaScript
 * Handles profile page interactions and data loading
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize profile page
    initializeProfilePage();
});

/**
 * Initialize profile page
 */
function initializeProfilePage() {
    // Load profile statistics
    loadProfileStats();
    
    // Set up event listeners
    setupEventListeners();
}

/**
 * Load profile statistics
 */
function loadProfileStats() {
    fetch('/buyer/api/profile-stats')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateProfileStats(data.data);
            }
        })
        .catch(error => {
            // console.error('Error loading profile stats:', error);
        });
}

/**
 * Update profile statistics display
 */
function updateProfileStats(stats) {
    document.getElementById('totalOrders').textContent = stats.totalOrders || 0;
    document.getElementById('activeOrders').textContent = stats.activeOrders || 0;
    document.getElementById('totalSpent').textContent = `$${(stats.totalSpent || 0).toLocaleString()}`;
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Edit profile button
    const editProfileBtn = document.getElementById('editProfileBtn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', function() {
            // In a real implementation, this would open a modal or redirect to edit page
            alert('Edit profile functionality would be implemented here');
        });
    }
}
