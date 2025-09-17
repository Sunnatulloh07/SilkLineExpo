/**
 * Professional Shipping Page JavaScript
 * Interactive elements and animations for shipping under development page
 */

class ManufacturerShipping {
    constructor() {
        this.isLoaded = false;
        this.animationQueue = [];
        this.init();
    }

    /**
     * Initialize shipping page functionality
     */
    init() {
        // console.log('🚚 Initializing Manufacturer Shipping Page...');
        
        try {
            this.setupEventListeners();
            this.setupProgressAnimation();
            this.setupScrollAnimations();
            this.setupServiceCardAnimations();
            this.setupContactCardAnimations();
            this.isLoaded = true;
            
            // console.log('✅ Shipping page initialized successfully');
        } catch (error) {
            // console.error('❌ Error initializing shipping page:', error);
        }
    }

    /**
     * Setup event listeners for interactive elements
     */
    setupEventListeners() {
        try {
            // Subscribe to updates button
            const subscribeBtn = document.getElementById('subscribeUpdatesBtn');
            if (subscribeBtn) {
                subscribeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.handleSubscribeUpdates();
                });
                // Add keyboard accessibility
                subscribeBtn.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.handleSubscribeUpdates();
                    }
                });
            }

            // Contact shipping button
            const contactBtn = document.getElementById('contactShippingBtn');
            if (contactBtn) {
                contactBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.handleContactShipping();
                });
                // Add keyboard accessibility
                contactBtn.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.handleContactShipping();
                    }
                });
            }

            // Contact cards click events
            const contactCards = document.querySelectorAll('.contact-card');
            contactCards.forEach(card => {
                card.addEventListener('click', () => this.handleContactCardClick(card));
                // Add keyboard accessibility
                card.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.handleContactCardClick(card);
                    }
                });
            });

            // Service cards hover effects
            const serviceCards = document.querySelectorAll('.service-card');
            serviceCards.forEach(card => {
                card.addEventListener('mouseenter', () => this.handleServiceCardHover(card));
                card.addEventListener('mouseleave', () => this.handleServiceCardLeave(card));
                card.addEventListener('focus', () => this.handleServiceCardHover(card));
                card.addEventListener('blur', () => this.handleServiceCardLeave(card));
            });

            // Development stages click events
            const stages = document.querySelectorAll('.stage');
            stages.forEach((stage, index) => {
                stage.addEventListener('click', () => this.handleStageClick(stage, index));
                // Add keyboard accessibility
                stage.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.handleStageClick(stage, index);
                    }
                });
            });
        } catch (error) {
            // console.error('Error setting up event listeners:', error);
        }
    }

    /**
     * Setup progress bar animation
     */
    setupProgressAnimation() {
        try {
            const progressFill = document.querySelector('.progress-fill');
            const progressPercentage = document.querySelector('.progress-percentage');
            
            if (progressFill && progressPercentage) {
                setTimeout(() => {
                    const targetProgress = parseInt(progressFill.dataset.progress) || 85;
                    this.animateProgress(progressFill, progressPercentage, targetProgress);
                }, 1000);
            } else {
                console.warn('Progress elements not found');
            }
        } catch (error) {
            // console.error('Error setting up progress animation:', error);
        }
    }

    /**
     * Animate progress bar
     */
    animateProgress(fillElement, percentageElement, targetProgress) {
        try {
            if (!fillElement || !percentageElement) {
                // console.error('Progress elements not provided');
                return;
            }

            let currentProgress = 0;
            const increment = targetProgress / 100;
            const duration = 2000; // 2 seconds
            const intervalTime = duration / 100;

            const progressInterval = setInterval(() => {
                try {
                    currentProgress += increment;
                    
                    if (currentProgress >= targetProgress) {
                        currentProgress = targetProgress;
                        clearInterval(progressInterval);
                    }

                    fillElement.style.width = `${currentProgress}%`;
                    percentageElement.textContent = `${Math.round(currentProgress)}%`;
                    
                    // Update aria-valuenow for accessibility
                    const progressBar = document.querySelector('.progress-bar[role="progressbar"]');
                    if (progressBar) {
                        progressBar.setAttribute('aria-valuenow', Math.round(currentProgress));
                    }
                } catch (error) {
                    // console.error('Error in progress animation frame:', error);
                    clearInterval(progressInterval);
                }
            }, intervalTime);
        } catch (error) {
            // console.error('Error setting up progress animation:', error);
        }
    }

    /**
     * Setup scroll-based animations
     */
    setupScrollAnimations() {
        // Check if IntersectionObserver is supported
        if (!('IntersectionObserver' in window)) {
            console.warn('IntersectionObserver not supported, falling back to immediate animation');
            // Fallback: just show all elements immediately
            const animatedElements = document.querySelectorAll('.service-card, .contact-card, .stage');
            animatedElements.forEach(element => {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            });
            return;
        }

        try {
            const observerOptions = {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }
                });
            }, observerOptions);

            // Observe elements for scroll animations
            const animatedElements = document.querySelectorAll('.service-card, .contact-card, .stage');
            animatedElements.forEach(element => {
                observer.observe(element);
            });
        } catch (error) {
            // console.error('Error setting up scroll animations:', error);
            // Fallback: show elements immediately
            const animatedElements = document.querySelectorAll('.service-card, .contact-card, .stage');
            animatedElements.forEach(element => {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            });
        }
    }

    /**
     * Setup service card animations
     */
    setupServiceCardAnimations() {
        const serviceCards = document.querySelectorAll('.service-card');
        
        serviceCards.forEach((card, index) => {
            // Add staggered animation delay
            card.style.animationDelay = `${index * 0.1}s`;
            
            // Add hover effect enhancements
            card.addEventListener('mouseenter', () => {
                this.addCardGlow(card);
            });
            
            card.addEventListener('mouseleave', () => {
                this.removeCardGlow(card);
            });
        });
    }

    /**
     * Setup contact card animations
     */
    setupContactCardAnimations() {
        const contactCards = document.querySelectorAll('.contact-card');
        
        contactCards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
            
            // Add pulse effect on hover
            card.addEventListener('mouseenter', () => {
                const icon = card.querySelector('.contact-icon i');
                if (icon) {
                    icon.style.animation = 'pulse 1s ease-in-out infinite';
                }
            });
            
            card.addEventListener('mouseleave', () => {
                const icon = card.querySelector('.contact-icon i');
                if (icon) {
                    icon.style.animation = '';
                }
            });
        });
    }

    /**
     * Handle subscribe to updates button click
     */
    handleSubscribeUpdates() {
        // console.log('🔔 Subscribe to updates clicked');
        
        // Simulate subscription process
        const btn = document.getElementById('subscribeUpdatesBtn');
        const originalText = btn.innerHTML;
        
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Obuna bo\'lmoqda...';
        btn.disabled = true;
        
        setTimeout(() => {
            btn.innerHTML = '<i class="fas fa-check"></i> Obuna bo\'ldingiz!';
            btn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
            
            this.showToast('Muvaffaqiyatli obuna bo\'ldingiz! Yangilanishlar haqida xabar beramiz.', 'success');
            
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
                btn.style.background = '';
            }, 3000);
        }, 2000);
    }

    /**
     * Handle contact shipping button click
     */
    handleContactShipping() {
        // console.log('📞 Contact shipping clicked');
        
        this.showToast('Tez orada sizga aloqa markazi orqali bog\'lanamiz!', 'info');
        
        // Scroll to contact section
        const contactSection = document.querySelector('.contact-section');
        if (contactSection) {
            contactSection.scrollIntoView({ 
                behavior: 'smooth',
                block: 'center'
            });
        }
    }

    /**
     * Handle contact card click
     */
    handleContactCardClick(card) {
        const cardTitle = card.querySelector('h4').textContent;
        const cardContent = card.querySelector('p').textContent;
        
        // console.log(`📞 Contact card clicked: ${cardTitle}`);
        
        // Add click animation
        card.style.transform = 'scale(0.95)';
        setTimeout(() => {
            card.style.transform = '';
        }, 150);

        // Handle different contact types
        if (cardTitle.includes('Telefon')) {
            // Simulate phone call
            this.showToast(`Telefon raqami nusxalandi: ${cardContent}`, 'success');
            this.copyToClipboard(cardContent);
        } else if (cardTitle.includes('Email')) {
            // Simulate email
            this.showToast(`Email manzili nusxalandi: ${cardContent}`, 'success');
            this.copyToClipboard(cardContent);
        } else if (cardTitle.includes('chat')) {
            // Simulate chat
            this.showToast('Chat xizmati tez orada ishga tushadi!', 'info');
        }
    }

    /**
     * Handle service card hover
     */
    handleServiceCardHover(card) {
        const icon = card.querySelector('.service-icon i');
        if (icon) {
            icon.style.transform = 'scale(1.1) rotate(5deg)';
            icon.style.transition = 'all 0.3s ease';
        }
    }

    /**
     * Handle service card leave
     */
    handleServiceCardLeave(card) {
        const icon = card.querySelector('.service-icon i');
        if (icon) {
            icon.style.transform = 'scale(1) rotate(0deg)';
        }
    }

    /**
     * Handle development stage click
     */
    handleStageClick(stage, index) {
        // console.log(`🛤️ Stage ${index + 1} clicked`);
        
        const stageTitle = stage.querySelector('h4').textContent;
        const stageDesc = stage.querySelector('p').textContent;
        
        // Add click animation
        stage.style.transform = 'scale(0.98)';
        setTimeout(() => {
            stage.style.transform = '';
        }, 150);

        // Show stage details
        this.showToast(`${stageTitle}: ${stageDesc}`, 'info');
    }

    /**
     * Add glow effect to card
     */
    addCardGlow(card) {
        card.style.boxShadow = '0 0 30px rgba(124, 58, 237, 0.3), 0 8px 25px rgba(0, 0, 0, 0.1)';
        card.style.borderColor = 'rgba(124, 58, 237, 0.3)';
    }

    /**
     * Remove glow effect from card
     */
    removeCardGlow(card) {
        card.style.boxShadow = '';
        card.style.borderColor = '';
    }

    /**
     * Copy text to clipboard
     */
    async copyToClipboard(text) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'absolute';
                textArea.style.left = '-999999px';
                document.body.prepend(textArea);
                textArea.select();
                document.execCommand('copy');
                textArea.remove();
            }
            // console.log('✅ Text copied to clipboard:', text);
        } catch (error) {
            // console.error('❌ Failed to copy text:', error);
        }
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        // Remove existing toast
        const existingToast = document.querySelector('.shipping-toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = `shipping-toast shipping-toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas ${this.getToastIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add toast styles
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: this.getToastColor(type),
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            zIndex: '10000',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            maxWidth: '400px',
            animation: 'slideInRight 0.3s ease-out',
            fontSize: '0.9rem',
            fontWeight: '500'
        });

        document.body.appendChild(toast);

        // Close button functionality
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            toast.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        });

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'slideOutRight 0.3s ease-out';
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);

        // Add animations if not exist
        if (!document.querySelector('#toast-animations')) {
            const style = document.createElement('style');
            style.id = 'toast-animations';
            style.textContent = `
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
                .toast-content {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    flex: 1;
                }
                .toast-close {
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    padding: 0.25rem;
                    border-radius: 4px;
                    opacity: 0.8;
                    transition: opacity 0.2s ease;
                }
                .toast-close:hover {
                    opacity: 1;
                    background: rgba(255, 255, 255, 0.1);
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Get toast icon based on type
     */
    getToastIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    /**
     * Get toast color based on type
     */
    getToastColor(type) {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#7c3aed'
        };
        return colors[type] || colors.info;
    }

    /**
     * Get current shipping data (for future API integration)
     */
    getShippingData() {
        return {
            developmentProgress: 85,
            expectedLaunch: '2025-Q2',
            features: [
                'Real-time tracking',
                'Secure shipping',
                'Fast delivery',
                'Professional couriers',
                'Mobile apps',
                'Analytics and reports'
            ],
            services: [
                {
                    name: 'Express Delivery',
                    description: 'Fast delivery within city and regions',
                    features: ['Real-time GPS tracking', 'SMS and email notifications', 'Flexible time slots']
                },
                {
                    name: 'Warehouse Services',
                    description: 'Professional storage and inventory management',
                    features: ['Secure storage', 'Inventory management', 'Direct warehouse shipping']
                },
                {
                    name: 'International Shipping',
                    description: 'Secure shipping worldwide',
                    features: ['Customs clearance', 'Insurance protection', 'Tracking and monitoring']
                }
            ],
            contact: {
                phone: '+998 71 123 45 67',
                email: 'shipping@silkline.uz',
                workingHours: '9:00 - 18:00 (work days)'
            }
        };
    }

    /**
     * Destroy shipping page functionality
     */
    destroy() {
        // console.log('🚚 Destroying shipping page...');
        
        // Remove event listeners
        const buttons = document.querySelectorAll('.dev-btn, .contact-card, .service-card, .stage');
        buttons.forEach(btn => {
            btn.removeEventListener('click', () => {});
            btn.removeEventListener('mouseenter', () => {});
            btn.removeEventListener('mouseleave', () => {});
        });

        // Remove toasts
        const toasts = document.querySelectorAll('.shipping-toast');
        toasts.forEach(toast => toast.remove());

        this.isLoaded = false;
        // console.log('✅ Shipping page destroyed');
    }
}

// Initialize shipping page when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // console.log('🚚 DOM loaded, initializing Shipping Page...');
    window.manufacturerShipping = new ManufacturerShipping();
});

// Handle page unload
window.addEventListener('beforeunload', function() {
    if (window.manufacturerShipping && window.manufacturerShipping.isLoaded) {
        window.manufacturerShipping.destroy();
    }
});
