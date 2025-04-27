class EventManager {
    constructor() {
        this.events = [];
        this.calendarManager = null;
        this.init();
    }

    init() {
        this.loadEvents();
        // We'll bind event listeners after DOM is fully loaded
        document.addEventListener('DOMContentLoaded', () => {
            this.bindEventListeners();
        });
    }

    bindEventListeners() {
        // We'll check if CalendarManager is already handling this button
        const saveEventBtn = document.getElementById('saveEventBtn');
        if (saveEventBtn && !saveEventBtn._hasCalendarListener) {
            saveEventBtn.addEventListener('click', () => this.saveEvent());
            saveEventBtn._hasEventManagerListener = true;
        }
        
        // Calendar day click listeners will be added by CalendarManager
    }

    saveEvent() {
        const form = document.getElementById('addEventForm');
        
        // Validate form
        if (!form.eventTitle.value) {
            if (typeof showToast === 'function') {
                showToast('Please enter an event title', 'warning');
            } else {
                alert('Please enter an event title');
            }
            return;
        }

        if (!form.eventDate.value) {
            if (typeof showToast === 'function') {
                showToast('Please select a date for the event', 'warning');
            } else {
                alert('Please select a date for the event');
            }
            return;
        }
        
        // Create new event object
        const newEvent = {
            id: Date.now(),
            title: form.eventTitle.value,
            date: new Date(`${form.eventDate.value}${form.eventTime.value ? 'T' + form.eventTime.value : ''}`),
            location: form.eventLocation.value || '',
            description: form.eventDescription.value || '',
            className: 'calendar-event',
            createdAt: new Date()
        };

        // Add event to the list
        this.events.push(newEvent);
        
        // Save events
        this.persistEvents();
        
        // Update calendar if CalendarManager exists
        if (window.calendarManager) {
            window.calendarManager.addEvent(newEvent);
        } else {
            this.updateCalendarDisplay();
        }
        
        // Show success notification
        if (typeof showToast === 'function') {
            showToast(`Event "${newEvent.title}" added to calendar`, 'success', 5000);
        }
        
        // Close modal and reset form
        const modal = bootstrap.Modal.getInstance(document.getElementById('addEventModal'));
        modal.hide();
        form.reset();
        
        // Add notification for the event if available
        if (typeof addEventNotification === 'function') {
            const formattedDate = new Date(form.eventDate.value).toLocaleDateString();
            const formattedTime = form.eventTime.value || 'All day';
            addEventNotification(newEvent.title, formattedDate, formattedTime);
        }
    }

    getEventColor() {
        const colors = ['#0d6efd', '#198754', '#dc3545', '#ffc107'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    getEventsForDate(date) {
        const dateStr = date.toISOString().split('T')[0];
        return this.events.filter(event => event.date.toISOString().split('T')[0] === dateStr);
    }

    updateCalendarDisplay() {
        const days = document.querySelectorAll('.calendar-day:not(.inactive)');
        days.forEach(day => {
            const date = new Date(day.dataset.date);
            const events = this.getEventsForDate(date);
            
            // Clear existing indicators
            const existingIndicators = day.querySelector('.event-indicators');
            if (existingIndicators) {
                existingIndicators.remove();
            }

            // Add new indicators if there are events
            if (events.length > 0) {
                const indicators = document.createElement('div');
                indicators.className = 'event-indicators';
                indicators.innerHTML = events.slice(0, 3).map(event => `
                    <div class="event-indicator" style="background-color: ${this.getEventColor()}"
                         title="${event.title}"></div>
                `).join('') + (events.length > 3 ? `<span class="more-events">+${events.length - 3}</span>` : '');
                
                day.appendChild(indicators);
            }
        });
    }

    loadEvents() {
        this.events = JSON.parse(localStorage.getItem('calendarEvents')) || [];
        this.updateCalendarDisplay();
    }

    persistEvents() {
        localStorage.setItem('calendarEvents', JSON.stringify(this.events));
    }

    showDayEvents(date) {
        const events = this.getEventsForDate(new Date(date));
        const modalBody = document.querySelector('#dayEventsModal .modal-body');
        
        modalBody.innerHTML = events.length ? events.map(event => `
            <div class="day-event-item p-3 mb-2 rounded border">
                <div class="d-flex justify-content-between align-items-start">
                    <h6 class="mb-1">${event.title}</h6>
                    <span class="badge" style="background-color: ${this.getEventColor()}">
                        ${event.date.toLocaleTimeString() || 'All Day'}
                    </span>
                </div>
                ${event.location ? `<div class="small text-muted mb-1">
                    <i class="bi bi-geo-alt"></i> ${event.location}
                </div>` : ''}
                ${event.description ? `<div class="small">${event.description}</div>` : ''}
            </div>
        `).join('') : '<div class="text-center text-muted py-4">No events scheduled for this day</div>';

        const modal = new bootstrap.Modal(document.getElementById('dayEventsModal'));
        modal.show();
    }
}
