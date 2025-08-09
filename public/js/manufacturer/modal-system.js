/**
 * Modal System for Manufacturer Dashboard
 * Professional Implementation
 */

class ModalSystem {
    constructor() {
        this.activeModals = new Set();
        this.init();
    }

    init() {
        // Create modal overlay if it doesn't exist
        if (!document.getElementById('modal-overlay')) {
            this.createModalOverlay();
        }
        
        // Global event listeners
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeTopModal();
            }
        });
        
        // Click outside to close
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeModal(e.target.querySelector('.modal-container'));
            }
        });
    }

    createModalOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'modal-overlay';
        overlay.className = 'modal-overlay hidden';
        document.body.appendChild(overlay);
    }

    show(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.error(`Modal with ID ${modalId} not found`);
            return;
        }

        const overlay = document.getElementById('modal-overlay');
        overlay.innerHTML = '';
        overlay.appendChild(modal.cloneNode(true));
        overlay.classList.remove('hidden');
        this.activeModals.add(modalId);
        
        // Focus management
        const firstInput = overlay.querySelector('input, textarea, select, button');
        if (firstInput) {
            firstInput.focus();
        }
    }

    close(modalId) {
        const overlay = document.getElementById('modal-overlay');
        overlay.classList.add('hidden');
        this.activeModals.delete(modalId);
        
        setTimeout(() => {
            overlay.innerHTML = '';
        }, 300);
    }

    closeTopModal() {
        const overlay = document.getElementById('modal-overlay');
        if (!overlay.classList.contains('hidden')) {
            overlay.classList.add('hidden');
            setTimeout(() => {
                overlay.innerHTML = '';
            }, 300);
        }
    }

    confirm(title, message, onConfirm, onCancel) {
        const modalId = 'confirm-modal-' + Date.now();
        const modalHTML = `
            <div id="${modalId}" class="modal-container">
                <div class="modal-header">
                    <h3 class="modal-title">
                        <i class="fas fa-question-circle"></i>
                        ${title}
                    </h3>
                    <button class="modal-close" onclick="window.modalSystem.close('${modalId}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-content">
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    <button class="products-btn products-btn-secondary" onclick="window.modalSystem.close('${modalId}'); ${onCancel || ''}">
                        Bekor qilish
                    </button>
                    <button class="products-btn products-btn-primary" onclick="window.modalSystem.close('${modalId}'); ${onConfirm || ''}">
                        Tasdiqlash
                    </button>
                </div>
            </div>
        `;
        
        const overlay = document.getElementById('modal-overlay');
        overlay.innerHTML = modalHTML;
        overlay.classList.remove('hidden');
    }

    alert(title, message, onOk) {
        const modalId = 'alert-modal-' + Date.now();
        const modalHTML = `
            <div id="${modalId}" class="modal-container">
                <div class="modal-header">
                    <h3 class="modal-title">
                        <i class="fas fa-info-circle"></i>
                        ${title}
                    </h3>
                    <button class="modal-close" onclick="window.modalSystem.close('${modalId}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-content">
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    <button class="products-btn products-btn-primary" onclick="window.modalSystem.close('${modalId}'); ${onOk || ''}">
                        OK
                    </button>
                </div>
            </div>
        `;
        
        const overlay = document.getElementById('modal-overlay');
        overlay.innerHTML = modalHTML;
        overlay.classList.remove('hidden');
    }
}

// Initialize global modal system
window.modalSystem = new ModalSystem();

console.log('✅ Modal System initialized');
