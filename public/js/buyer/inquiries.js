/**
 * Buyer Inquiries JavaScript
 * Handles inquiries page interactions and RFQ functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize inquiries page
    initializeInquiriesPage();
});

/**
 * Initialize inquiries page
 */
function initializeInquiriesPage() {
    // Set up event listeners
    setupEventListeners();
    
    // Load inquiries
    loadInquiries();
}

/**
 * Load inquiries
 */
function loadInquiries() {
    fetch('/buyer/api/buyer-rfqs')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                renderInquiries(data.data);
            }
        })
        .catch(error => {
            // console.error('Error loading inquiries:', error);
        });
}

/**
 * Render inquiries list
 */
function renderInquiries(inquiries) {
    // In a real implementation, this would render the inquiries
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // New inquiry button
    const newInquiryBtn = document.getElementById('newInquiryBtn');
    if (newInquiryBtn) {
        newInquiryBtn.addEventListener('click', function() {
            openNewInquiryModal();
        });
    }
    
    // Modal close buttons
    const modalCloseButtons = document.querySelectorAll('.modal-close');
    modalCloseButtons.forEach(button => {
        button.addEventListener('click', function() {
            closeNewInquiryModal();
        });
    });
    
    // Submit inquiry button
    const submitInquiryBtn = document.getElementById('submitInquiryBtn');
    if (submitInquiryBtn) {
        submitInquiryBtn.addEventListener('click', submitInquiry);
    }
    
    // Tab switching
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            switchTab(this.dataset.tab);
        });
    });
}

/**
 * Open new inquiry modal
 */
function openNewInquiryModal() {
    const modal = document.getElementById('newInquiryModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

/**
 * Close new inquiry modal
 */
function closeNewInquiryModal() {
    const modal = document.getElementById('newInquiryModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Submit inquiry
 */
function submitInquiry() {
    const form = document.getElementById('newInquiryForm');
    if (form) {
        // In a real implementation, this would submit the form data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        
        // Close modal
        closeNewInquiryModal();
        
        // Show success message
        alert('RFQ submitted successfully!');
    }
}

/**
 * Switch tab
 */
function switchTab(tabName) {
    // Remove active class from all tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Add active class to selected tab
    document.querySelector(`.tab[data-tab="${tabName}"]`).classList.add('active');
    
    // In a real implementation, this would filter the inquiries
}
