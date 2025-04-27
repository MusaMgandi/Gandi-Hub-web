import { formatDateForStorage } from '../training-utils.js';

export class CalendarManager {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = null;
        this.events = new Map();
        this.initializeEventListeners();
    }

    async initialize() {
        try {
            await this.loadEvents();
            this.renderCalendar();
            this.addDragAndDropHandlers();
            this.initializeResponsiveHandling();
            this.setupEventListeners();
            console.log('✅ Calendar initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Calendar initialization failed:', error);
            this.handleInitializationError(error);
            return false;
        }
    }

    handleInitializationError(error) {
        const errorMessage = document.createElement('div');
        errorMessage.className = 'alert alert-danger';
        errorMessage.textContent = 'Failed to initialize calendar. Please refresh the page.';
        
        const calendar = document.querySelector('.calendar-container');
        if (calendar) {
            calendar.prepend(errorMessage);
        }
    }

    setupEventListeners() {
        try {
            this.initializeBasicListeners();
            this.initializeTouchSupport();
            this.initializeKeyboardNavigation();
        } catch (error) {
            console.error('Failed to setup event listeners:', error);
        }
    }

    initializeEventListeners() {
        document.getElementById('prevMonth')?.addEventListener('click', () => this.navigateMonth(-1));
        document.getElementById('nextMonth')?.addEventListener('click', () => this.navigateMonth(1));
        document.getElementById('todayBtn')?.addEventListener('click', () => {
            this.currentDate = new Date();
            this.renderCalendar();
        });

        // Add touch support for mobile
        let touchStartX = 0;
        const calendar = document.querySelector('.calendar-body');
        if (calendar) {
            calendar.addEventListener('touchstart', (e) => {
                touchStartX = e.touches[0].clientX;
            }, { passive: true });

            calendar.addEventListener('touchend', (e) => {
                const touchEndX = e.changedTouches[0].clientX;
                const diff = touchStartX - touchEndX;
                if (Math.abs(diff) > 50) { // Minimum swipe distance
                    this.navigateMonth(diff > 0 ? 1 : -1);
                }
            }, { passive: true });
        }
    }

    initializeResponsiveHandling() {
        const mediaQuery = window.matchMedia('(max-width: 768px)');
        this.handleResponsiveLayout(mediaQuery);
        mediaQuery.addEventListener('change', (e) => this.handleResponsiveLayout(e));
    }

    handleResponsiveLayout(mediaQuery) {
        const calendar = document.querySelector('.calendar-container');
        if (calendar) {
            calendar.classList.toggle('mobile-view', mediaQuery.matches);
        }
    }

    renderCalendar() {
        // ... existing calendar rendering code ...
    }

    addDragAndDropHandlers() {
        // ... existing drag and drop handler code ...
    }

    navigateMonth(direction) {
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        this.renderCalendar();
    }

    async syncWithGoogleCalendar() {
        // Implement Google Calendar sync
    }

    handleEventConflicts() {
        // Add conflict detection
    }
}
