/**
 * Professional Inventory Page JavaScript
 * Interactive elements and animations for inventory under development page
 */

class ManufacturerInventory {
    constructor() {
        this.isLoaded = false;
        this.animationQueue = [];
        this.init();
    }

    /**
     * Initialize inventory page functionality
     */
    init() {
        console.log('🏭 Initializing Manufacturer Inventory Page...');
        
        try {
            this.setupEventListeners();
            this.setupProgressAnimation();
            this.setupScrollAnimations();
            this.setupFeatureCardAnimations();
            this.setupBenefitCardAnimations();
            this.setupContactCardAnimations();
            this.isLoaded = true;
            
            console.log('✅ Inventory page initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing inventory page:', error);
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

            // Contact inventory button
            const contactBtn = document.getElementById('contactInventoryBtn');
            if (contactBtn) {
                contactBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.handleContactInventory();
                });
                // Add keyboard accessibility
                contactBtn.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.handleContactInventory();
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

            // Feature cards hover effects
            const featureCards = document.querySelectorAll('.feature-card');
            featureCards.forEach(card => {
                card.addEventListener('mouseenter', () => this.handleFeatureCardHover(card));
                card.addEventListener('mouseleave', () => this.handleFeatureCardLeave(card));
                card.addEventListener('focus', () => this.handleFeatureCardHover(card));
                card.addEventListener('blur', () => this.handleFeatureCardLeave(card));
            });

            // Benefit cards hover effects
            const benefitItems = document.querySelectorAll('.benefit-item');
            benefitItems.forEach(item => {
                item.addEventListener('mouseenter', () => this.handleBenefitHover(item));
                item.addEventListener('mouseleave', () => this.handleBenefitLeave(item));
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

            // Feature items click events
            const featureItems = document.querySelectorAll('.feature-item');
            featureItems.forEach((item, index) => {
                item.addEventListener('click', () => this.handleFeatureItemClick(item, index));
                item.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.handleFeatureItemClick(item, index);
                    }
                });
            });
        } catch (error) {
            console.error('Error setting up event listeners:', error);
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
                    const targetProgress = parseInt(progressFill.dataset.progress) || 78;
                    this.animateProgress(progressFill, progressPercentage, targetProgress);
                }, 1000);
            } else {
                console.warn('Progress elements not found');
            }
        } catch (error) {
            console.error('Error setting up progress animation:', error);
        }
    }

    /**
     * Animate progress bar
     */
    animateProgress(fillElement, percentageElement, targetProgress) {
        try {
            if (!fillElement || !percentageElement) {
                console.error('Progress elements not provided');
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
                    console.error('Error in progress animation frame:', error);
                    clearInterval(progressInterval);
                }
            }, intervalTime);
        } catch (error) {
            console.error('Error setting up progress animation:', error);
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
            const animatedElements = document.querySelectorAll('.feature-card, .benefit-item, .contact-card, .stage');
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
            const animatedElements = document.querySelectorAll('.feature-card, .benefit-item, .contact-card, .stage');
            animatedElements.forEach(element => {
                observer.observe(element);
            });
        } catch (error) {
            console.error('Error setting up scroll animations:', error);
            // Fallback: show elements immediately
            const animatedElements = document.querySelectorAll('.feature-card, .benefit-item, .contact-card, .stage');
            animatedElements.forEach(element => {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            });
        }
    }

    /**
     * Setup feature card animations
     */
    setupFeatureCardAnimations() {
        const featureCards = document.querySelectorAll('.feature-card');
        
        featureCards.forEach((card, index) => {
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
     * Setup benefit card animations
     */
    setupBenefitCardAnimations() {
        const benefitItems = document.querySelectorAll('.benefit-item');
        
        benefitItems.forEach((item, index) => {
            item.style.animationDelay = `${index * 0.1}s`;
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
        console.log('🔔 Subscribe to inventory updates clicked');
        
        // Simulate subscription process
        const btn = document.getElementById('subscribeUpdatesBtn');
        const originalText = btn.innerHTML;
        
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Obuna bo\'lmoqda...';
        btn.disabled = true;
        
        setTimeout(() => {
            btn.innerHTML = '<i class="fas fa-check"></i> Obuna bo\'ldingiz!';
            btn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
            
            this.showToast('Muvaffaqiyatli obuna bo\'ldingiz! Ombor tizimi yangilanishlari haqida xabar beramiz.', 'success');
            
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
                btn.style.background = '';
            }, 3000);
        }, 2000);
    }

    /**
     * Handle contact inventory button click
     */
    handleContactInventory() {
        console.log('📞 Contact inventory clicked');
        
        this.showToast('Tez orada sizga ombor tizimi bo\'yicha aloqa markazi orqali bog\'lanamiz!', 'info');
        
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
        
        console.log(`📞 Contact card clicked: ${cardTitle}`);
        
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
        } else if (cardTitle.includes('yordam')) {
            // Simulate support
            this.showToast('Texnik yordam xizmati tez orada ishga tushadi!', 'info');
        }
    }

    /**
     * Handle feature card hover
     */
    handleFeatureCardHover(card) {
        const icon = card.querySelector('.feature-icon i');
        if (icon) {
            icon.style.transform = 'scale(1.1) rotate(5deg)';
            icon.style.transition = 'all 0.3s ease';
        }
    }

    /**
     * Handle feature card leave
     */
    handleFeatureCardLeave(card) {
        const icon = card.querySelector('.feature-icon i');
        if (icon) {
            icon.style.transform = 'scale(1) rotate(0deg)';
        }
    }

    /**
     * Handle benefit item hover
     */
    handleBenefitHover(item) {
        const icon = item.querySelector('.benefit-icon i');
        if (icon) {
            icon.style.transform = 'scale(1.1)';
        }
    }

    /**
     * Handle benefit item leave
     */
    handleBenefitLeave(item) {
        const icon = item.querySelector('.benefit-icon i');
        if (icon) {
            icon.style.transform = 'scale(1)';
        }
    }

    /**
     * Handle development stage click
     */
    handleStageClick(stage, index) {
        console.log(`🛤️ Stage ${index + 1} clicked`);
        
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
     * Handle feature item click
     */
    handleFeatureItemClick(item, index) {
        console.log(`🔧 Feature ${index + 1} clicked`);
        
        const featureText = item.querySelector('span').textContent;
        
        // Add click animation
        item.style.transform = 'scale(0.98)';
        setTimeout(() => {
            item.style.transform = '';
        }, 150);

        // Show feature details
        this.showToast(`${featureText} - Bu funksiya tez orada qo'shiladi!`, 'info');
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
            console.log('✅ Text copied to clipboard:', text);
        } catch (error) {
            console.error('❌ Failed to copy text:', error);
        }
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        // Remove existing toast
        const existingToast = document.querySelector('.inventory-toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = `inventory-toast inventory-toast-${type}`;
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
     * Get current inventory data (for future API integration)
     */
    getInventoryData() {
        return {
            developmentProgress: 78,
            expectedLaunch: '2025-Q2',
            features: [
                'Real-time inventarizatsiya',
                'Statistika va hisobotlar',
                'QR/Barcode skanerlash',
                'Avtomatik ogohlantirishlar',
                'Mobil ilovalar',
                'Tahlil va prognozlash'
            ],
            benefits: [
                {
                    name: 'Vaqt tejash',
                    description: 'Avtomatik tizim orqali 60% gacha vaqt tejash',
                    percentage: 60
                },
                {
                    name: 'Xarajat kamaytirish',
                    description: 'Samarali boshqaruv orqali 30% xarajat kamaytirish',
                    percentage: 30
                },
                {
                    name: 'Xatolarni kamaytirish',
                    description: 'Avtomatik tizim orqali inson xatolarini minimallash',
                    percentage: 90
                },
                {
                    name: 'To\'liq nazorat',
                    description: 'Barcha jarayonlar ustidan to\'liq nazorat va kuzatuv',
                    percentage: 100
                }
            ],
            modules: [
                {
                    name: 'Real-time Monitoring',
                    description: 'Ombordagi mahsulotlarni real-time kuzatuv va holat tahlili',
                    features: ['Mahsulot miqdorini kuzatuv', 'Avtomatik ogohlantirishlar', 'Holat indikatorlari']
                },
                {
                    name: 'Smart Inventarizatsiya',
                    description: 'QR/Barcode texnologiyasi bilan avtomatik inventarizatsiya',
                    features: ['QR kod generatsiyasi', 'Mobil skaner ilovasi', 'Avtomatik hisobotlar']
                },
                {
                    name: 'Analitika va Prognozlash',
                    description: 'Ma\'lumotlar tahlili va kelajak uchun prognozlar',
                    features: ['Statistik tahlillar', 'Trend analizi', 'AI yordamida prognozlash']
                }
            ],
            contact: {
                phone: '+998 71 123 45 67',
                email: 'inventory@silkline.uz',
                workingHours: '9:00 - 18:00 (ish kunlari)'
            }
        };
    }

    /**
     * Destroy inventory page functionality
     */
    destroy() {
        console.log('🏭 Destroying inventory page...');
        
        // Remove event listeners
        const buttons = document.querySelectorAll('.dev-btn, .contact-card, .feature-card, .benefit-item, .stage, .feature-item');
        buttons.forEach(btn => {
            btn.removeEventListener('click', () => {});
            btn.removeEventListener('mouseenter', () => {});
            btn.removeEventListener('mouseleave', () => {});
            btn.removeEventListener('keydown', () => {});
        });

        // Remove toasts
        const toasts = document.querySelectorAll('.inventory-toast');
        toasts.forEach(toast => toast.remove());

        this.isLoaded = false;
        console.log('✅ Inventory page destroyed');
    }
}

// Initialize inventory page when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏭 DOM loaded, initializing Inventory Page...');
    window.manufacturerInventory = new ManufacturerInventory();
});

// Handle page unload
window.addEventListener('beforeunload', function() {
    if (window.manufacturerInventory && window.manufacturerInventory.isLoaded) {
        window.manufacturerInventory.destroy();
    }
});
