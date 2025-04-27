class ModalManager {
    constructor() {
        this.activeModal = null;
        this.touchStart = null;
        this.touchY = null;
        this.isMobile = window.innerWidth <= 768;
        this.init();
    }

    init() {
        // Replace Bootstrap modal triggers with vanilla JS
        document.addEventListener('click', (e) => {
            const trigger = e.target.closest('[data-modal-target]');
            if (trigger) {
                e.preventDefault();
                const targetId = trigger.getAttribute('data-modal-target');
                this.openModal(targetId);
            }

            if (e.target.hasAttribute('data-modal-close') || 
                e.target.classList.contains('modal-backdrop')) {
                this.closeModal();
            }
        });

        // Add touch event listeners for mobile
        if (this.isMobile) {
            document.addEventListener('touchstart', (e) => this.handleTouchStart(e));
            document.addEventListener('touchmove', (e) => this.handleTouchMove(e));
            document.addEventListener('touchend', () => this.handleTouchEnd());
        }
    }

    handleTouchStart(e) {
        if (!this.activeModal) return;
        const touch = e.touches[0];
        this.touchStart = touch.clientY;
        this.touchY = touch.clientY;
        this.activeModal.style.transition = 'none';
    }

    handleTouchMove(e) {
        if (!this.touchStart || !this.activeModal) return;

        const touch = e.touches[0];
        const deltaY = touch.clientY - this.touchStart;
        this.touchY = touch.clientY;

        // Only allow dragging down
        if (deltaY > 0) {
            this.activeModal.style.transform = `translateY(${deltaY}px)`;
            this.activeModal.style.opacity = 1 - (deltaY / window.innerHeight);
        }
    }

    handleTouchEnd() {
        if (!this.activeModal || !this.touchStart) return;

        const deltaY = this.touchY - this.touchStart;
        this.activeModal.style.transition = 'all 0.3s ease';

        if (deltaY > 100) {
            // Swipe threshold met - dismiss modal
            this.activeModal.style.transform = `translateY(${window.innerHeight}px)`;
            this.activeModal.style.opacity = '0';
            setTimeout(() => this.closeModal(), 300);
        } else {
            // Reset position
            this.activeModal.style.transform = '';
            this.activeModal.style.opacity = '';
        }

        this.touchStart = null;
        this.touchY = null;
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';
        document.body.appendChild(backdrop);

        modal.style.display = 'block';
        document.body.classList.add('modal-open');

        // Use RAF for smooth animation
        requestAnimationFrame(() => {
            backdrop.classList.add('show');
            modal.classList.add('show');
            this.activeModal = modal;
        });
    }

    closeModal() {
        if (!this.activeModal) return;

        const backdrop = document.querySelector('.modal-backdrop');
        this.activeModal.classList.remove('show');
        backdrop?.classList.remove('show');

        setTimeout(() => {
            this.activeModal.style.display = 'none';
            backdrop?.remove();
            document.body.classList.remove('modal-open');
            this.activeModal = null;
        }, 300);
    }
}

// Initialize
window.modalManager = new ModalManager();
