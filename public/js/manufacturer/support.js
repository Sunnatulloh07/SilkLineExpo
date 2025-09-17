/**
 * Professional Support Page JavaScript
 * Handles interactions and animations for the support page
 */

class ManufacturerSupport {
  constructor() {
    this.init();
  }

  init() {
    this.initializeEventListeners();
    this.startAnimations();
    this.setupProgressAnimation();
    
    // console.log('✅ Manufacturer Support initialized');
  }

  // ====================================
  // 🎬 EVENT LISTENERS
  // ====================================

  initializeEventListeners() {
    // Contact support button
    const contactSupportBtn = document.getElementById('contactSupportBtn');
    if (contactSupportBtn) {
      contactSupportBtn.addEventListener('click', () => this.handleContactSupport());
    }

    // FAQ button
    const faqBtn = document.getElementById('faqBtn');
    if (faqBtn) {
      faqBtn.addEventListener('click', () => this.handleFAQ());
    }

    // Subscribe updates button
    const subscribeUpdatesBtn = document.getElementById('subscribeUpdatesBtn');
    if (subscribeUpdatesBtn) {
      subscribeUpdatesBtn.addEventListener('click', () => this.handleSubscribeUpdates());
    }

    // Temporary contact button
    const temporaryContactBtn = document.getElementById('temporaryContactBtn');
    if (temporaryContactBtn) {
      temporaryContactBtn.addEventListener('click', () => this.handleTemporaryContact());
    }

    // Contact cards click events
    const contactCards = document.querySelectorAll('.contact-card');
    contactCards.forEach(card => {
      card.addEventListener('click', () => this.handleContactCardClick(card));
    });
  }

  // ====================================
  // 🎯 ACTION HANDLERS
  // ====================================

  handleContactSupport() {
    this.showToast('Bog\'lanish formasi tez orada ishga tushadi!', 'info');
  }

  handleFAQ() {
    this.showToast('Savol-Javob bo\'limi ishlab chiqilmoqda!', 'info');
  }

  handleSubscribeUpdates() {
    // Simulate subscription process
    const btn = document.getElementById('subscribeUpdatesBtn');
    const originalText = btn.innerHTML;
    
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Obuna bo\'lish...';
    btn.disabled = true;
    
    setTimeout(() => {
      btn.innerHTML = '<i class="fas fa-check"></i> Obuna bo\'ldingiz!';
      btn.className = 'dev-btn dev-btn-success';
      
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.className = 'dev-btn dev-btn-primary';
        btn.disabled = false;
      }, 3000);
      
      this.showToast('Yangiliklar uchun muvaffaqiyatli obuna bo\'ldingiz!', 'success');
    }, 2000);
  }

  handleTemporaryContact() {
    // Scroll to contact section
    const contactSection = document.querySelector('.temp-contact-section');
    if (contactSection) {
      contactSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
      });
      
      // Highlight contact cards
      const contactCards = document.querySelectorAll('.contact-card');
      contactCards.forEach((card, index) => {
        setTimeout(() => {
          card.style.transform = 'scale(1.05)';
          card.style.boxShadow = '0 12px 30px rgba(255, 106, 0, 0.2)';
          
          setTimeout(() => {
            card.style.transform = '';
            card.style.boxShadow = '';
          }, 1000);
        }, index * 200);
      });
    }
  }

  handleContactCardClick(card) {
    const contactInfo = card.querySelector('p').textContent;
    
    if (contactInfo.includes('@')) {
      // Email
      window.location.href = `mailto:${contactInfo}`;
    } else if (contactInfo.includes('+')) {
      // Phone
      window.location.href = `tel:${contactInfo}`;
    } else if (contactInfo.includes('@silkline_support')) {
      // Telegram
      window.open('https://t.me/silkline_support', '_blank');
    }
    
    this.showToast(`${contactInfo} ga yo\'naltirilmoqda...`, 'info');
  }

  // ====================================
  // ✨ ANIMATIONS
  // ====================================

  startAnimations() {
    // Animate feature items on scroll
    this.setupScrollAnimations();
    
    // Animate progress stages
    this.animateProgressStages();
    
    // Start contact card pulse animation
    this.setupContactCardAnimations();
  }

  setupScrollAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.animation = 'fadeInUp 0.6s ease-out forwards';
        }
      });
    }, observerOptions);

    // Observe feature items
    const featureItems = document.querySelectorAll('.feature-item');
    featureItems.forEach((item, index) => {
      item.style.opacity = '0';
      item.style.transform = 'translateY(30px)';
      item.style.animationDelay = `${index * 0.1}s`;
      observer.observe(item);
    });

    // Observe contact cards
    const contactCards = document.querySelectorAll('.contact-card');
    contactCards.forEach((card, index) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(30px)';
      card.style.animationDelay = `${index * 0.2}s`;
      observer.observe(card);
    });
  }

  setupProgressAnimation() {
    const progressFill = document.querySelector('.progress-fill');
    if (progressFill) {
      // Start with 0 width
      progressFill.style.width = '0%';
      
      // Animate to 75% after a delay
      setTimeout(() => {
        progressFill.style.width = '75%';
      }, 1000);
    }
  }

  animateProgressStages() {
    const stages = document.querySelectorAll('.stage');
    stages.forEach((stage, index) => {
      setTimeout(() => {
        stage.style.animation = 'fadeInUp 0.5s ease-out forwards';
      }, index * 300);
    });
  }

  setupContactCardAnimations() {
    const contactCards = document.querySelectorAll('.contact-card');
    
    contactCards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        const icon = card.querySelector('.contact-icon');
        if (icon) {
          icon.style.transform = 'scale(1.1) rotate(5deg)';
        }
      });
      
      card.addEventListener('mouseleave', () => {
        const icon = card.querySelector('.contact-icon');
        if (icon) {
          icon.style.transform = '';
        }
      });
    });
  }

  // ====================================
  // 🔧 UTILITY METHODS
  // ====================================

  showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `support-toast support-toast-${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <i class="fas ${this.getToastIcon(type)}"></i>
        <span>${message}</span>
      </div>
    `;

    // Add toast styles
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${this.getToastColor(type)};
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 12px;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
      z-index: 10000;
      animation: slideInRight 0.3s ease-out;
      max-width: 400px;
      font-weight: 600;
    `;

    // Add to body
    document.body.appendChild(toast);

    // Remove after 4 seconds
    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s ease-in';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 4000);
  }

  getToastIcon(type) {
    switch (type) {
      case 'success': return 'fa-check-circle';
      case 'error': return 'fa-exclamation-circle';
      case 'warning': return 'fa-exclamation-triangle';
      default: return 'fa-info-circle';
    }
  }

  getToastColor(type) {
    switch (type) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
      default: return '#3b82f6';
    }
  }
}

// ====================================
// 🚀 INITIALIZE SUPPORT PAGE
// ====================================

document.addEventListener('DOMContentLoaded', function() {
  window.manufacturerSupport = new ManufacturerSupport();
});

// ====================================
// 🎨 ADDITIONAL CSS ANIMATIONS
// ====================================

const style = document.createElement('style');
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

  .dev-btn-success {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
    color: white !important;
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3) !important;
  }

  .support-toast .toast-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .support-toast .toast-content i {
    font-size: 1.2rem;
  }

  .contact-card .contact-icon {
    transition: transform 0.3s ease !important;
  }

  .stage {
    opacity: 0;
    transform: translateY(20px);
  }

  .feature-item,
  .contact-card {
    transition: all 0.3s ease;
  }

  .feature-item {
    animation-fill-mode: forwards;
  }

  .contact-card {
    animation-fill-mode: forwards;
  }
`;

document.head.appendChild(style);
