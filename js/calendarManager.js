class CalendarManager {
    constructor() {
        this.currentDate = new Date();
        this.today = new Date();
        this.events = [];
        this.initializeCalendar();
        this.setupEventListeners();
        
        // Make calendar manager globally accessible
        window.calendarManager = this;
    }

    setupEventListeners() {
        document.getElementById('prevMonthBtn').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.updateCalendarDisplay();
        });

        document.getElementById('nextMonthBtn').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.updateCalendarDisplay();
        });

        document.getElementById('todayBtn').addEventListener('click', () => {
            this.currentDate = new Date(this.today);
            this.updateCalendarDisplay();
        });
    }

    updateCalendarDisplay() {
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"];
        
        document.getElementById('currentMonthText').textContent = monthNames[this.currentDate.getMonth()];
        document.getElementById('currentYearText').textContent = this.currentDate.getFullYear();
        
        this.renderCalendarDays();
    }

    initializeCalendar() {
        this.loadEvents();
        this.render();
        this.bindEvents();
    }

    bindEvents() {
        const prevBtn = document.getElementById('prevMonth');
        const nextBtn = document.getElementById('nextMonth');
        
        if (prevBtn) prevBtn.addEventListener('click', () => this.previousMonth());
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextMonth());
        
        // Initialize calendar day clicks
        this.initializeCalendarDayEvents();
    }

    initializeCalendarDayEvents() {
        const calendarDays = document.querySelectorAll('.calendar-day');
        calendarDays.forEach(day => {
            day.addEventListener('click', () => {
                const dayNumber = day.querySelector('.day-number').textContent;
                const selectedDate = new Date(this.currentDate);
                selectedDate.setDate(parseInt(dayNumber));
                this.showDayEvents(selectedDate);
            });
        });
    }

    showDayEvents(date) {
        const modal = document.getElementById('dayEventsModal');
        const mainContent = document.getElementById('main-content');
        if (!modal) return;

        // Store last focused element
        this.lastFocusedElement = document.activeElement;

        // Show modal with backdrop click enabled
        const modalInstance = new bootstrap.Modal(modal, {
            backdrop: true,
            keyboard: true
        });
        modalInstance.show();

        // Set focus to modal
        modal.focus();

        // Restore focus and remove inert when modal closes
        modal.addEventListener('hidden.bs.modal', () => {
            if (mainContent) {
                mainContent.inert = false;
            }
            if (this.lastFocusedElement) {
                this.lastFocusedElement.focus();
            }
        }, { once: true });

        // Update modal content
        const modalTitle = modal.querySelector('.modal-title');
        const modalBody = modal.querySelector('.modal-body');

        modalTitle.textContent = date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const dayEvents = this.getEventsForDate(date);
        
        if (dayEvents.length === 0) {
            modalBody.innerHTML = '<p class="text-center text-muted my-3">No events or tasks scheduled for this day</p>';
        } else {
            const tasks = dayEvents.filter(e => e.eventType === 'task');
            const events = dayEvents.filter(e => e.eventType !== 'task');
            
            let content = '';
            
            if (tasks.length > 0) {
                content += `
                    <div class="tasks-section mb-4">
                        <h6 class="mb-3">Tasks</h6>
                        ${tasks.map(task => `
                            <div class="task-item ${task.className} mb-2 p-2 rounded">
                                <h6 class="mb-1">${task.title}</h6>
                                <div class="small">Priority: ${task.priority}</div>
                                ${task.notes ? `<div class="small text-muted mt-1">${task.notes}</div>` : ''}
                            </div>
                        `).join('')}
                    </div>
                `;
            }
            
            if (events.length > 0) {
                content += `
                    <div class="events-section">
                        <h6 class="mb-3">Events</h6>
                        ${events.map(event => `
                            <div class="event-item mb-2 p-2 rounded bg-light">
                                <h6 class="mb-1">${event.title}</h6>
                                ${event.notes ? `<div class="small text-muted">${event.notes}</div>` : ''}
                            </div>
                        `).join('')}
                    </div>
                `;
            }
            
            modalBody.innerHTML = content;
        }
    }

    getEventsForDate(date) {
        return this.events.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate.getDate() === date.getDate() &&
                   eventDate.getMonth() === date.getMonth() &&
                   eventDate.getFullYear() === date.getFullYear();
        });
    }

    createEventElement(event) {
        return `
            <div class="event-item ${event.className || ''} mb-2">
                <div class="event-title fw-bold">${event.title}</div>
                ${event.notes ? `<div class="event-notes small text-muted mt-1">${event.notes}</div>` : ''}
            </div>
        `;
    }

    render() {
        const calendarGrid = document.getElementById('calendarGrid');
        if (!calendarGrid) return;

        calendarGrid.innerHTML = '';
        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);

        // Update month displays
        this.updateMonthDisplay();

        // Create calendar days
        let currentDay = new Date(firstDay);
        currentDay.setDate(currentDay.getDate() - firstDay.getDay()); // Start from last month if necessary

        for (let i = 0; i < 42; i++) {
            const dayElement = this.createDayElement(currentDay);
            calendarGrid.appendChild(dayElement);
            currentDay.setDate(currentDay.getDate() + 1);
        }

        // Rebind events after rendering
        this.initializeCalendarDayEvents();
    }

    createDayElement(date) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        const isCurrentMonth = date.getMonth() === this.currentDate.getMonth();
        if (!isCurrentMonth) dayElement.classList.add('other-month');
        
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = date.getDate();
        dayElement.appendChild(dayNumber);
        
        // Get events for this day
        const events = this.getEventsForDate(date);
        if (events.length > 0) {
            dayElement.classList.add('has-events');
            const previewContainer = document.createElement('div');
            previewContainer.className = 'events-preview';
            
            // Show up to 2 event previews
            events.slice(0, 2).forEach(event => {
                const preview = document.createElement('div');
                preview.className = `event-preview-item ${event.className || ''}`;
                preview.textContent = event.title;
                previewContainer.appendChild(preview);
            });
            
            // If there are more events, show count
            if (events.length > 2) {
                const more = document.createElement('div');
                more.className = 'more-events';
                more.textContent = `+${events.length - 2} more`;
                previewContainer.appendChild(more);
            }
            
            dayElement.appendChild(previewContainer);
        }
        
        // Add click handler for showing events
        dayElement.addEventListener('click', () => {
            this.showDayEvents(date);
        });

        return dayElement;
    }

    createEventsPreview(events) {
        const container = document.createElement('div');
        container.className = 'events-preview';
        events.slice(0, 2).forEach(event => {
            const eventDot = document.createElement('div');
            eventDot.className = `event-dot ${event.className || ''}`;
            container.appendChild(eventDot);
        });
        return container;
    }

    showAddEventModal(date) {
        const modal = document.getElementById('addEventModal');
        const eventDateInput = document.getElementById('eventDate');
        const saveEventBtn = document.getElementById('saveEventBtn');
        
        // Set the date if provided
        if (date) {
            const formattedDate = date.toISOString().split('T')[0];
            eventDateInput.value = formattedDate;
        }

        // Remove any existing event listeners and create a new button
        const newSaveEventBtn = saveEventBtn.cloneNode(true);
        saveEventBtn.parentNode.replaceChild(newSaveEventBtn, saveEventBtn);

        // Add new event listener
        newSaveEventBtn.addEventListener('click', () => {
            const title = document.getElementById('eventTitle').value;
            const date = document.getElementById('eventDate').value;
            const time = document.getElementById('eventTime').value;
            const location = document.getElementById('eventLocation').value;
            const description = document.getElementById('eventDescription').value;

            if (!title) {
                if (typeof showToast === 'function') {
                    showToast('Please enter an event title', 'warning');
                } else {
                    alert('Please enter an event title');
                }
                return;
            }

            if (!date) {
                if (typeof showToast === 'function') {
                    showToast('Please select a date for the event', 'warning');
                } else {
                    alert('Please select a date for the event');
                }
                return;
            }

            // Create new event object
            const newEvent = {
                title,
                date: new Date(`${date}${time ? 'T' + time : ''}`),
                location,
                description,
                className: 'calendar-event',
                createdAt: new Date()
            };

            // Add event to calendar
            this.events.push(newEvent);
            
            // Save events to localStorage and Firestore
            this.saveEvents();
            
            // Ensure the calendar is immediately updated
            this.render();
            
            // Show success notification with the advanced toast system
            if (typeof showToast === 'function') {
                showToast(`Event "${title}" added to calendar`, 'success', 5000);
            }

            // Close modal and reset form
            const bsModal = bootstrap.Modal.getInstance(modal);
            bsModal.hide();
            document.getElementById('addEventForm').reset();
            
            // Add notification for the event if available
            if (typeof addEventNotification === 'function') {
                const formattedDate = new Date(date).toLocaleDateString();
                const formattedTime = time || 'All day';
                addEventNotification(title, formattedDate, formattedTime);
            }
        });
        
        // Mark the button as having a calendar listener
        newSaveEventBtn._hasCalendarListener = true;

        // Show modal
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }

    addEvent(event) {
        // Add new event to events array
        this.events.push(event);
        
        // Save events to localStorage and Firestore
        this.saveEvents();
        
        // Render calendar to show new event
        this.render();
        
        // Show success notification
        if (typeof showToast === 'function') {
            showToast(`Event "${event.title}" added to calendar`, 'success');
        }
        
        return event;
    }

    saveEvents() {
        // Convert dates to strings for storage
        const eventsToSave = this.events.map(event => ({
            ...event,
            date: event.date instanceof Date ? event.date.toISOString() : event.date
        }));
        
        // Save events to localStorage
        localStorage.setItem('calendarEvents', JSON.stringify(eventsToSave));
        
        // If Firestore is available, save events to cloud
        if (typeof saveEventsToFirestore === 'function') {
            saveEventsToFirestore(this.events)
                .then(() => {
                    console.log('Calendar events saved to Firestore');
                })
                .catch(error => {
                    console.error('Error saving events to Firestore:', error);
                    
                    // Show error notification if available
                    if (typeof showToast === 'function') {
                        showToast('Events saved locally (cloud sync unavailable)', 'info', 3000);
                    }
                });
        }
    }

    loadEvents() {
        // Try to load from Firestore first if available
        if (typeof loadEventsFromFirestore === 'function') {
            loadEventsFromFirestore()
                .then(events => {
                    if (events && events.length > 0) {
                        // Convert date strings back to Date objects
                        this.events = events.map(event => ({
                            ...event,
                            date: new Date(event.date)
                        }));
                        this.render();
                        console.log('Calendar events loaded from Firestore');
                    } else {
                        // Fall back to localStorage if no events in Firestore
                        this.loadEventsFromLocalStorage();
                    }
                })
                .catch(error => {
                    console.error('Error loading events from Firestore:', error);
                    // Fall back to localStorage
                    this.loadEventsFromLocalStorage();
                });
        } else {
            // If Firestore functions not available, use localStorage
            this.loadEventsFromLocalStorage();
        }
    }

    loadEventsFromLocalStorage() {
        try {
            const savedEvents = localStorage.getItem('calendarEvents');
            if (savedEvents) {
                // Convert date strings back to Date objects
                this.events = JSON.parse(savedEvents).map(event => ({
                    ...event,
                    date: new Date(event.date)
                }));
                this.render();
                console.log('Calendar events loaded from localStorage');
            } else {
                this.events = [];
            }
        } catch (error) {
            console.error('Error loading events from localStorage:', error);
            this.events = [];
        }
    }

    getEventsForDate(date) {
        // Ensure date is a Date object
        const targetDate = date instanceof Date ? date : new Date(date);
        
        // Reset time part for comparison
        targetDate.setHours(0, 0, 0, 0);
        
        return this.events.filter(event => {
            // Ensure event.date is a Date object
            const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
            
            // Reset time part for comparison
            const compareDate = new Date(eventDate);
            compareDate.setHours(0, 0, 0, 0);
            
            return compareDate.getTime() === targetDate.getTime();
        });
    }

    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.render();
    }

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.render();
    }

    updateMonthDisplay() {
        const monthFormat = this.currentDate.toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric' 
        });
        
        // Update both month displays
        const displays = document.querySelectorAll('#currentMonth');
        displays.forEach(display => {
            display.textContent = monthFormat;
        });
    }

    renderCalendarDays() {
        const grid = document.getElementById('calendarGrid');
        grid.innerHTML = ''; // Clear existing calendar

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        // First day of the month
        const firstDay = new Date(year, month, 1);
        // Last day of the month
        const lastDay = new Date(year, month + 1, 0);
        
        // Get the day of week for the first day (0-6)
        const firstDayIndex = firstDay.getDay();
        
        // Previous month's days
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = firstDayIndex - 1; i >= 0; i--) {
            const dayElement = this.createDayElement(prevMonthLastDay - i, 'other-month');
            grid.appendChild(dayElement);
        }

        // Current month's days
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const isToday = this.isToday(year, month, day);
            const dayElement = this.createDayElement(day, isToday ? 'today' : '');
            grid.appendChild(dayElement);
        }

        // Next month's days
        const daysNeeded = 42 - grid.children.length; // Always show 6 weeks
        for (let day = 1; day <= daysNeeded; day++) {
            const dayElement = this.createDayElement(day, 'other-month');
            grid.appendChild(dayElement);
        }
    }

    createDayElement(day, className = '') {
        const dayElement = document.createElement('div');
        dayElement.className = `calendar-day ${className}`;
        
        const dayNumber = document.createElement('span');
        dayNumber.className = 'day-number';
        // Ensure we only display the date number
        dayNumber.textContent = typeof day === 'number' ? day : new Date(day).getDate();
        
        dayElement.appendChild(dayNumber);
        
        // Add click event listener
        dayElement.addEventListener('click', () => this.handleDayClick(day));
        
        return dayElement;
    }

    isToday(year, month, day) {
        const today = new Date();
        return today.getDate() === day && 
               today.getMonth() === month && 
               today.getFullYear() === year;
    }

    handleDayClick(day) {
        // Handle day click events
        console.log(`Clicked day: ${day}`);
        // You can implement modal opening or event adding logic here
    }
}

// Initialize calendar manager
window.addEventListener('DOMContentLoaded', () => {
    window.calendarManager = new CalendarManager();
});
