/**
 * Calendar Fix - Direct solution for calendar event display issues
 * This script ensures events appear on the calendar and in the upcoming events section
 */

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Calendar fix initializing...');
    
    // Set up the Save Event button with a direct approach
    setupSaveEventButton();
    
    // Set up the Add Training button
    setupAddTrainingButton();
    
    // Initialize calendar with empty events first
    displayEventsOnCalendar([]);
    displayUpcomingEvents([]);
    
    // Then load events asynchronously
    loadEvents()
        .then(events => {
            console.log(`Loaded ${events.length} events`);
            displayEventsOnCalendar(events);
            displayUpcomingEvents(events);
        })
        .catch(error => {
            console.error('Failed to load events:', error);
            // Already initialized with empty arrays, so no further action needed
        });
    
    console.log('Calendar fix initialized');
});

// Set up the Save Event button
function setupSaveEventButton() {
    const saveEventBtn = document.getElementById('saveEventBtn');
    if (saveEventBtn) {
        console.log('Found Save Event button, setting up direct handler');
        
        // Remove any existing listeners to avoid conflicts
        const newSaveEventBtn = saveEventBtn.cloneNode(true);
        saveEventBtn.parentNode.replaceChild(newSaveEventBtn, saveEventBtn);
        
        // Add direct click handler
        newSaveEventBtn.addEventListener('click', handleSaveEvent);
        console.log('Direct event handler attached to Save Event button');
    } else {
        console.warn('Save Event button not found on initial load');
        
        // Try again after a short delay (in case of dynamic loading)
        setTimeout(() => {
            const delayedSaveBtn = document.getElementById('saveEventBtn');
            if (delayedSaveBtn) {
                console.log('Found Save Event button after delay');
                delayedSaveBtn.addEventListener('click', handleSaveEvent);
            }
        }, 1000);
    }
    
    // Add a global click handler as a fallback
    document.addEventListener('click', function(event) {
        if (event.target && (
            event.target.id === 'saveEventBtn' || 
            (event.target.parentElement && event.target.parentElement.id === 'saveEventBtn')
        )) {
            console.log('Save button clicked via global handler');
            handleSaveEvent(event);
        }
    });
}

// Load all events from storage and Firestore
function loadEvents() {
    return new Promise((resolve, reject) => {
        try {
            // First try to get events from localStorage
            const localEvents = JSON.parse(localStorage.getItem('calendarEvents') || '[]');
            
            if (localEvents.length > 0) {
                console.log(`Found ${localEvents.length} events in localStorage`);
                resolve(localEvents);
                return;
            }
            
            // If no local events, try Firestore
            console.log('No local events, checking Firestore');
            
            // Check if Firebase is available
            if (typeof firebase === 'undefined' || !firebase.firestore) {
                console.warn('Firebase not available, using empty events array');
                resolve([]);
                return;
            }
            
            // Try to load from Firestore
            const db = firebase.firestore();
            const userId = getUserId();
            
            // First load regular events
            const eventsPromise = db.collection('events')
                .where('userId', '==', userId)
                .get()
                .then(snapshot => {
                    const events = [];
                    snapshot.forEach(doc => {
                        events.push(doc.data());
                    });
                    return events;
                })
                .catch(error => {
                    console.error('Error loading events from Firestore:', error);
                    return [];
                });
                
            // Then load training sessions
            const trainingPromise = db.collection('training')
                .where('userId', '==', userId)
                .get()
                .then(snapshot => {
                    const trainings = [];
                    snapshot.forEach(doc => {
                        trainings.push(doc.data());
                    });
                    return trainings;
                })
                .catch(error => {
                    console.error('Error loading training from Firestore:', error);
                    return [];
                });
                
            // Combine both types of events
            Promise.all([eventsPromise, trainingPromise])
                .then(([events, trainings]) => {
                    const allEvents = [...events, ...trainings];
                    console.log(`Loaded ${allEvents.length} events from Firestore`);
                    
                    // Save to localStorage for next time
                    if (allEvents.length > 0) {
                        localStorage.setItem('calendarEvents', JSON.stringify(allEvents));
                    }
                    
                    resolve(allEvents);
                })
                .catch(error => {
                    console.error('Error loading events:', error);
                    resolve([]);
                });
                
        } catch (error) {
            console.error('Unexpected error loading events:', error);
            resolve([]);
        }
    });
}

// Save event to storage
function saveEvent(event) {
    return new Promise((resolve, reject) => {
        try {
            // Get existing events
            let events = JSON.parse(localStorage.getItem('calendarEvents') || '[]');
            
            // Add new event
            events.push(event);
            
            // Save to localStorage
            localStorage.setItem('calendarEvents', JSON.stringify(events));
            
            // Save to appropriate Firestore collection based on event type
            if (typeof firebase !== 'undefined' && firebase.firestore) {
                const db = firebase.firestore();
                const collectionName = event.type === 'training' ? 'training' : 'events';
                
                db.collection(collectionName).doc(event.id.toString()).set(event)
                    .then(() => {
                        console.log(`Event saved to Firestore ${collectionName} collection`);
                    })
                    .catch(error => {
                        console.error(`Error saving to Firestore ${collectionName}:`, error);
                    });
            }
            
            // Update displays
            displayEventsOnCalendar(events);
            displayUpcomingEvents(events);
            
            resolve(event);
        } catch (error) {
            console.error('Error saving event:', error);
            reject(error);
        }
    });
}

// Get user ID for storing data
function getUserId() {
    // Check if we have a user ID in localStorage
    let userId = localStorage.getItem('userId');
    
    // If not, generate a new one
    if (!userId) {
        userId = 'user_' + new Date().getTime();
        localStorage.setItem('userId', userId);
    }
    
    return userId;
}

// Display events on the calendar
function displayEventsOnCalendar(events) {
    if (!Array.isArray(events)) {
        console.error('Invalid events array:', events);
        events = [];
    }
    
    // Clear existing event indicators
    document.querySelectorAll('.calendar-day .events-preview').forEach(el => el.remove());
    document.querySelectorAll('.calendar-day.has-events').forEach(el => el.classList.remove('has-events'));
    
    // Group events by date
    const eventsByDate = {};
    events.forEach(event => {
        const dateKey = event.date;
        if (!eventsByDate[dateKey]) {
            eventsByDate[dateKey] = [];
        }
        eventsByDate[dateKey].push(event);
    });
    
    // Add event indicators to calendar days
    Object.keys(eventsByDate).forEach(dateKey => {
        const dateEvents = eventsByDate[dateKey];
        const dateCell = document.querySelector(`.calendar-day[data-date="${dateKey}"]`);
        
        if (dateCell) {
            dateCell.classList.add('has-events');
            
            const eventsPreview = document.createElement('div');
            eventsPreview.className = 'events-preview';
            
            // Show up to 3 event indicators
            const eventsToShow = Math.min(dateEvents.length, 3);
            for (let i = 0; i < eventsToShow; i++) {
                const eventDot = document.createElement('div');
                eventDot.className = 'event-dot';
                
                // Set color based on event type
                if (dateEvents[i].type === 'training') {
                    eventDot.classList.add('training-event');
                } else if (dateEvents[i].type === 'study') {
                    eventDot.classList.add('study-event');
                } else if (dateEvents[i].type === 'exam') {
                    eventDot.classList.add('exam-event');
                }
                
                eventsPreview.appendChild(eventDot);
            }
            
            // If there are more events, add a "more" indicator
            if (dateEvents.length > 3) {
                const moreIndicator = document.createElement('div');
                moreIndicator.className = 'more-events';
                moreIndicator.textContent = '+' + (dateEvents.length - 3);
                eventsPreview.appendChild(moreIndicator);
            }
            
            dateCell.appendChild(eventsPreview);
            
            // Add click event to show event details
            dateCell.addEventListener('click', () => {
                showEventsForDate(dateKey, dateEvents);
            });
        }
    });
}

// Display upcoming events in the sidebar
function displayUpcomingEvents(events) {
    if (!Array.isArray(events)) {
        console.error('Invalid events array for upcoming events:', events);
        events = [];
    }
    
    const upcomingSessionsContainer = document.querySelector('.upcoming-sessions');
    if (!upcomingSessionsContainer) return;
    
    // Clear container
    upcomingSessionsContainer.innerHTML = '';
    
    // Filter for training events
    const trainingEvents = events.filter(event => event.type === 'training');
    
    // Sort events by date
    trainingEvents.sort((a, b) => {
        const dateA = new Date(a.date + (a.time ? 'T' + a.time : 'T00:00:00'));
        const dateB = new Date(b.date + (b.time ? 'T' + b.time : 'T00:00:00'));
        return dateA - dateB;
    });
    
    // Filter future events
    const now = new Date();
    const futureTrainings = trainingEvents.filter(event => {
        const eventDate = new Date(event.date + (event.time ? 'T' + event.time : 'T00:00:00'));
        return eventDate >= now;
    });
    
    // If no events, show empty state
    if (futureTrainings.length === 0) {
        upcomingSessionsContainer.innerHTML = `
            <div class="empty-state text-center py-3">
                <p class="text-muted mb-3">No upcoming training sessions</p>
                <div>
                    <button class="btn btn-success btn-sm" data-action="add-training">
                        <i class="bi bi-plus-lg me-1"></i> Add Training Session
                    </button>
                </div>
            </div>
        `;
        
        // Set up the Add Training button
        setupAddTrainingButton();
        return;
    }
    
    // Add training sessions
    futureTrainings.slice(0, 3).forEach(event => {
        const eventDate = new Date(event.date + (event.time ? 'T' + event.time : 'T00:00:00'));
        const isToday = eventDate.toDateString() === now.toDateString();
        const isTomorrow = new Date(now.getTime() + 86400000).toDateString() === eventDate.toDateString();
        
        let dateText = eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (isToday) dateText = 'Today';
        if (isTomorrow) dateText = 'Tomorrow';
        
        const timeText = event.time ? new Date(`2000-01-01T${event.time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'All day';
        
        // Generate random duration for demo purposes
        const durations = ['1h', '1h 30m', '45m', '2h', '30m'];
        const randomDuration = durations[Math.floor(Math.random() * durations.length)];
        
        const sessionItem = document.createElement('div');
        sessionItem.className = 'session-item d-flex align-items-center mb-3 p-2 rounded border';
        sessionItem.innerHTML = `
            <div class="session-icon me-3">
                <i class="bi bi-person-video3 text-success fs-4"></i>
            </div>
            <div class="session-info flex-grow-1">
                <h6 class="mb-0">${event.title}</h6>
                <small class="text-muted">${dateText}, ${timeText}</small>
            </div>
            <div class="session-duration">
                <span class="badge bg-light text-dark">${randomDuration}</span>
            </div>
        `;
        
        upcomingSessionsContainer.appendChild(sessionItem);
    });
    
    // Add buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'text-center mt-3';
    
    // Add "View All" button if there are more training sessions
    if (futureTrainings.length > 3) {
        const viewAllButton = document.createElement('button');
        viewAllButton.className = 'btn btn-sm btn-link text-decoration-none';
        viewAllButton.textContent = 'View All Training Sessions';
        buttonsContainer.appendChild(viewAllButton);
    }
    
    // Add "Add Training" button
    const addTrainingButton = document.createElement('button');
    addTrainingButton.className = 'btn btn-success btn-sm ms-2';
    addTrainingButton.setAttribute('data-action', 'add-training');
    addTrainingButton.innerHTML = '<i class="bi bi-plus-lg me-1"></i> Add Training Session';
    buttonsContainer.appendChild(addTrainingButton);
    
    upcomingSessionsContainer.appendChild(buttonsContainer);
    
    // Set up the Add Training button
    setupAddTrainingButton();
}

// Handle save event action
function handleSaveEvent(event) {
    console.log('Save event handler triggered');
    
    // Get form values
    const title = document.getElementById('eventTitle')?.value;
    const date = document.getElementById('eventDate')?.value;
    const time = document.getElementById('eventTime')?.value;
    const location = document.getElementById('eventLocation')?.value;
    const description = document.getElementById('eventDescription')?.value;
    
    // Get event type (if the select exists)
    let eventType = 'event'; // Default type
    const eventTypeSelect = document.getElementById('eventType');
    if (eventTypeSelect) {
        eventType = eventTypeSelect.value;
    }
    
    console.log(`Saving ${eventType} with title: ${title}`);
    
    // Validate required fields
    if (!title) {
        showEnhancedToast('Please enter a title', 'warning');
        return;
    }
    
    if (!date) {
        showEnhancedToast('Please select a date', 'warning');
        return;
    }
    
    // Create new event object
    const newEvent = {
        id: Date.now(),
        title: title,
        date: date,
        time: time || '',
        location: location || '',
        description: description || '',
        type: eventType,
        createdAt: new Date().toISOString()
    };
    
    // Save the event
    saveEvent(newEvent);
    
    // Show success notification with the advanced toast system
    const typeCapitalized = eventType.charAt(0).toUpperCase() + eventType.slice(1);
    showEnhancedToast(`${typeCapitalized} "${title}" added to calendar`, 'success', 5000);
    
    // Close modal and reset form
    try {
        const modal = bootstrap.Modal.getInstance(document.getElementById('addEventModal'));
        if (modal) {
            modal.hide();
        }
        
        const form = document.getElementById('addEventForm');
        if (form) {
            form.reset();
        }
    } catch (error) {
        console.error('Error closing modal:', error);
    }
    
    console.log('Event saved successfully');
}

// Set up the Add Training button
function setupAddTrainingButton() {
    // Check if we need to add the event type field to the form
    const eventForm = document.getElementById('addEventForm');
    const eventTypeField = document.getElementById('eventType');
    
    if (eventForm && !eventTypeField) {
        // Create event type field
        const typeFieldHTML = `
            <div class="mb-3">
                <label for="eventType" class="form-label">Event Type</label>
                <select class="form-select" id="eventType">
                    <option value="event">Regular Event</option>
                    <option value="training">Training Session</option>
                    <option value="study">Study Group</option>
                    <option value="exam">Exam</option>
                </select>
            </div>
        `;
        
        // Insert after the title field
        const titleField = eventForm.querySelector('.mb-3');
        if (titleField) {
            titleField.insertAdjacentHTML('afterend', typeFieldHTML);
        }
    }
    
    // Find any "Add Training" buttons
    const addTrainingButtons = document.querySelectorAll('[data-action="add-training"]');
    addTrainingButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Open the event modal
            const modal = new bootstrap.Modal(document.getElementById('addEventModal'));
            modal.show();
            
            // Set the event type to training if the select exists
            const eventTypeSelect = document.getElementById('eventType');
            if (eventTypeSelect) {
                eventTypeSelect.value = 'training';
            }
            
            // Set focus on the title field
            setTimeout(() => {
                document.getElementById('eventTitle').focus();
            }, 500);
        });
    });
    
    // Add a "Add Training" button to the training section if it doesn't exist
    const trainingSection = document.querySelector('.upcoming-sessions');
    if (trainingSection) {
        // Check if the button already exists
        const existingButton = trainingSection.querySelector('[data-action="add-training"]');
        if (!existingButton) {
            // Find the "View All" button container or create one
            let buttonContainer = trainingSection.querySelector('.text-center.mt-3');
            if (!buttonContainer) {
                buttonContainer = document.createElement('div');
                buttonContainer.className = 'text-center mt-3';
                trainingSection.appendChild(buttonContainer);
            }
            
            // Add the "Add Training" button
            const addTrainingButton = document.createElement('button');
            addTrainingButton.className = 'btn btn-primary btn-sm ms-2';
            addTrainingButton.setAttribute('data-action', 'add-training');
            addTrainingButton.innerHTML = '<i class="bi bi-plus-lg me-1"></i> Add Training';
            
            // Add event listener
            addTrainingButton.addEventListener('click', function() {
                // Open the event modal
                const modal = new bootstrap.Modal(document.getElementById('addEventModal'));
                modal.show();
                
                // Set the event type to training if the select exists
                const eventTypeSelect = document.getElementById('eventType');
                if (eventTypeSelect) {
                    eventTypeSelect.value = 'training';
                }
                
                // Set focus on the title field
                setTimeout(() => {
                    document.getElementById('eventTitle').focus();
                }, 500);
            });
            
            buttonContainer.appendChild(addTrainingButton);
        }
    }
}

// Show enhanced toast notification
function showEnhancedToast(message, type = 'info', duration = 5000) {
    // Check if the custom showToast function exists
    if (typeof showToast === 'function') {
        showToast(message, type, duration);
        return;
    }
    
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    // Generate a unique ID for this toast
    const toastId = 'toast-' + Date.now();
    
    // Determine toast color based on type
    const bgColor = type === 'success' ? '#28a745' : 
                   type === 'warning' ? '#ffc107' : 
                   type === 'danger' ? '#dc3545' : '#17a2b8';
    
    const textColor = type === 'warning' ? '#212529' : '#ffffff';
    const borderColor = type === 'success' ? '#1e7e34' : 
                       type === 'warning' ? '#d39e00' : 
                       type === 'danger' ? '#bd2130' : '#138496';
    
    // Create toast element with enhanced styling
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = 'toast show';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    toast.style.backgroundColor = bgColor + 'ee'; // Semi-transparent
    toast.style.color = textColor;
    toast.style.borderLeft = `4px solid ${borderColor}`;
    toast.style.boxShadow = '0 0.25rem 0.75rem rgba(0, 0, 0, 0.1)';
    toast.style.backdropFilter = 'blur(10px)';
    toast.style.transition = 'all 0.3s ease';
    
    // Add sound effect for important notifications
    if (type === 'success' || type === 'danger') {
        const audio = new Audio();
        audio.src = type === 'success' ? 
            'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAAwAAAbAAkJCQkJCQkJCQkJCQkJCQwMDAwMDAwMDAwMDAwMDAwMD4+Pj4+Pj4+Pj4+Pj4+Pj4//////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAYAAAAAAAAAAbA/HBzUAAAAAAAD//MUxAAQwsYIAANPScQAAAObmZoAEHDIzMzMzEKBgYGD/y4GBnJHGc3P/8ZyM5//+c5//5z//M5/w5nP/M5ubm5uQEBAQEAwAAAAA//MUxBUUUvH8AANPSWQAAAA5mZmZmZmQGZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZ//MUxBIAAANIAAAAADMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMz' :
            'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAAwAAAeAAXl5eXl5eXl5eXl5eXl5enp6enp6enp6enp6enp6ent7e3t7e3t7e3t7e3t7e3v////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAUAAAAAAAAAAdD5Ojm+AAAAAAAD//MUxAANwAYYAANPScQAAAObmZoAEHDIzMzMzEKBgYGD/y4GBnJHGc3P/8ZyM5//+c5//5z//M5/w5nP/M5ubm5uQEBAQEAwAAAAA//MUxBQT6vH4AANPSUQAAABmZmZmZmZAZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZ//MUxBYAAANIAAAAAGZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZm';
        audio.volume = 0.2;
        audio.play().catch(e => console.log('Audio play prevented by browser policy'));
    }
    
    // Create toast content with progress bar
    toast.innerHTML = `
        <div class="d-flex align-items-center p-3">
            <div class="me-auto">
                <i class="bi bi-${
                    type === 'success' ? 'check-circle' : 
                    type === 'warning' ? 'exclamation-triangle' : 
                    type === 'danger' ? 'x-circle' : 'info-circle'
                } me-2"></i>
                <span>${message}</span>
            </div>
            <button type="button" class="btn-close btn-close-white ms-2" aria-label="Close"></button>
        </div>
        <div class="toast-progress" style="height: 3px; background-color: rgba(255,255,255,0.3); width: 100%;">
            <div class="progress-bar" style="height: 100%; width: 100%; background-color: ${borderColor}; transition: width ${duration}ms linear;"></div>
        </div>
    `;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Start progress bar animation
    setTimeout(() => {
        const progressBar = toast.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.width = '0%';
        }
    }, 50);
    
    // Add hover pause functionality
    let timeLeft = duration;
    let timerId = null;
    
    const startTimer = () => {
        timerId = setTimeout(() => {
            removeToast();
        }, timeLeft);
    };
    
    const pauseTimer = () => {
        if (timerId) {
            clearTimeout(timerId);
            timerId = null;
            const progressBar = toast.querySelector('.progress-bar');
            if (progressBar) {
                const width = progressBar.getBoundingClientRect().width;
                const totalWidth = toast.querySelector('.toast-progress').getBoundingClientRect().width;
                timeLeft = Math.round((width / totalWidth) * duration);
                progressBar.style.transition = 'none';
            }
        }
    };
    
    const removeToast = () => {
        toast.classList.remove('show');
        toast.classList.add('hiding');
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    };
    
    // Add event listeners for hover pause
    toast.addEventListener('mouseenter', pauseTimer);
    toast.addEventListener('mouseleave', startTimer);
    
    // Add click handler for close button
    toast.querySelector('.btn-close').addEventListener('click', () => {
        pauseTimer();
        removeToast();
    });
    
    // Set accessibility attributes
    toast.setAttribute('aria-label', `${type} notification: ${message}`);
    
    // Start the timer
    startTimer();
}
