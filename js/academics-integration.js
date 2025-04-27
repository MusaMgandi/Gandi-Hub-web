/**
 * Academics Integration Module
 * 
 * This module integrates the academics page with the notification system and
 * ensures real-time updates of the overview section when assignments are added
 * and upcoming sessions when events are added to the calendar.
 */

class AcademicsIntegration {
    constructor() {
        this.initialized = false;
        this.assignmentCount = 0;
        this.upcomingSessions = [];
        
        // Firebase references (will be initialized when Firebase is ready)
        this.db = null;
        this.assignmentsRef = null;
        this.eventsRef = null;
        
        // User ID (will be set when user is authenticated)
        this.userId = null;
        
        // Flag to track if Firestore is enabled/available
        this.firestoreEnabled = false;
    }
    
    /**
     * Initialize the integration
     */
    init() {
        if (this.initialized) return;
        
        console.log('Initializing academics integration...');
        
        // Initialize Firebase if it exists
        this.initFirebase();
        
        this.initialized = true;
    }
    
    /**
     * Initialize Firebase if available
     */
    initFirebase() {
        try {
            if (typeof firebase !== 'undefined' && firebase.firestore) {
                this.db = firebase.firestore();
                
                // Generate a temporary user ID if not authenticated
                this.userId = 'user_' + new Date().getTime();
                
                // Check if we have permission to access Firestore
                this.db.collection('permission_test').doc('test').get()
                    .then(() => {
                        this.firestoreEnabled = true;
                        console.log('Academics integration: Firestore access confirmed');
                        
                        // Set up listeners for assignment changes
                        this.setupAssignmentListeners();
                        
                        // Set up listeners for event changes
                        this.setupEventListeners();
                    })
                    .catch(error => {
                        if (error.code === 'permission-denied') {
                            console.warn('Academics integration: Firestore permission denied, using local storage only');
                            if (window.showToast) {
                                window.showToast('Academic data using local storage (Firestore permissions needed for cloud sync)', 'warning', 5000);
                            }
                            this.firestoreEnabled = false;
                        } else {
                            console.error('Academics integration: Firestore error:', error);
                        }
                    });
            } else {
                console.warn('Academics integration: Firebase not available');
                this.firestoreEnabled = false;
            }
        } catch (error) {
            console.error('Academics integration: Error initializing Firebase', error);
            this.firestoreEnabled = false;
        }
    }
    
    /**
     * Set up listeners for assignment changes
     */
    setupAssignmentListeners() {
        if (!this.db || !this.firestoreEnabled) {
            console.log('Academics integration: Firestore not available, skipping assignment listeners');
            return;
        }
        
        try {
            // Listen for assignment changes
            this.assignmentsRef = this.db.collection('assignments');
            this.assignmentsRef
                .where('userId', '==', this.userId)
                .where('status', 'in', ['todo', 'inProgress'])
                .onSnapshot(snapshot => {
                    // Update assignment count
                    this.assignmentCount = snapshot.docs.length;
                    
                    // Update overview section
                    this.updateAssignmentCount();
                    
                    // Notify about new assignments
                    snapshot.docChanges().forEach(change => {
                        if (change.type === 'added') {
                            const assignmentData = change.doc.data();
                            // Only notify for new assignments (created in the last hour)
                            const oneHourAgo = Date.now() - (60 * 60 * 1000);
                            if (assignmentData.createdAt && assignmentData.createdAt.toMillis() > oneHourAgo) {
                                this.notifyNewAssignment(assignmentData);
                            }
                        }
                    });
                }, error => {
                    if (error.code === 'permission-denied') {
                        console.warn('Academics integration: Firestore permission denied for assignments, using local storage only');
                        this.firestoreEnabled = false;
                    } else {
                        console.error('Academics integration: Error listening for assignments', error);
                    }
                });
        } catch (error) {
            console.error('Academics integration: Error setting up assignment listeners', error);
        }
    }
    
    /**
     * Set up listeners for event changes
     */
    setupEventListeners() {
        if (!this.db || !this.firestoreEnabled) {
            console.log('Academics integration: Firestore not available, skipping event listeners');
            return;
        }
        
        try {
            // Listen for event changes
            this.eventsRef = this.db.collection('events');
            this.eventsRef
                .where('userId', '==', this.userId)
                .where('date', '>=', new Date())
                .orderBy('date', 'asc')
                .limit(5)
                .onSnapshot(snapshot => {
                    // Update upcoming sessions
                    this.upcomingSessions = snapshot.docs.map(doc => {
                        const data = doc.data();
                        return {
                            id: doc.id,
                            title: data.title,
                            date: data.date.toDate(),
                            time: this.formatTime(data.date.toDate()),
                            type: data.type || 'event',
                            location: data.location || ''
                        };
                    });
                    
                    // Update upcoming sessions section
                    this.updateUpcomingSessions();
                }, error => {
                    if (error.code === 'permission-denied') {
                        console.warn('Academics integration: Firestore permission denied for events, using local storage only');
                        this.firestoreEnabled = false;
                    } else if (error.code === 'failed-precondition') {
                        console.warn('Academics integration: This query requires an index. Check Firebase console for the link to create it.');
                        if (window.showToast) {
                            window.showToast('Calendar events require a Firestore index. Using local storage for now.', 'warning', 5000);
                        }
                        this.firestoreEnabled = false;
                    } else {
                        console.error('Academics integration: Error listening for events', error);
                    }
                });
        } catch (error) {
            console.error('Academics integration: Error setting up event listeners', error);
        }
    }
    
    /**
     * Set up listeners for local storage changes (when Firebase is not available)
     */
    setupLocalStorageListeners() {
        // Listen for storage events
        window.addEventListener('storage', (event) => {
            if (event.key === 'academicAssignments') {
                this.handleAssignmentsChange();
            } else if (event.key === 'academicEvents') {
                this.handleEventsChange();
            }
        });
        
        // Initial load
        this.handleAssignmentsChange();
        this.handleEventsChange();
    }
    
    /**
     * Handle changes to assignments in local storage
     */
    handleAssignmentsChange() {
        try {
            const assignments = JSON.parse(localStorage.getItem('academicAssignments')) || [];
            
            // Count active assignments (todo and in progress)
            this.assignmentCount = assignments.filter(a => 
                a.status === 'todo' || a.status === 'inProgress'
            ).length;
            
            // Update UI
            this.updateAssignmentCount();
        } catch (e) {
            console.error('Error handling assignments change', e);
        }
    }
    
    /**
     * Handle changes to events in local storage
     */
    handleEventsChange() {
        try {
            const events = JSON.parse(localStorage.getItem('academicEvents')) || [];
            const now = new Date();
            
            // Get upcoming events
            this.upcomingSessions = events
                .filter(e => new Date(e.date) >= now)
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .slice(0, 5)
                .map(e => ({
                    id: e.id,
                    title: e.title,
                    date: new Date(e.date),
                    time: this.formatTime(new Date(e.date)),
                    type: e.type || 'event',
                    location: e.location || ''
                }));
            
            // Update UI
            this.updateUpcomingSessions();
        } catch (e) {
            console.error('Error handling events change', e);
        }
    }
    
    /**
     * Set up listeners for assignment changes in the DOM
     */
    setupAssignmentListeners() {
        // Listen for assignment form submissions
        document.addEventListener('submit', (event) => {
            const form = event.target;
            
            // Quick add task form
            if (form.id === 'quickAddTaskForm' || form.id === 'mobileAddTaskForm') {
                event.preventDefault();
                
                // Get form data
                const prefix = form.id === 'quickAddTaskForm' ? 'quick' : 'mobile';
                const title = document.getElementById(`${prefix}TaskTitle`).value;
                const dueDate = document.getElementById(`${prefix}TaskDue`).value;
                const priority = document.getElementById(`${prefix}TaskPriority`).value;
                
                // Update assignment count
                this.assignmentCount++;
                this.updateAssignmentCount();
                
                // Create notification
                this.createAssignmentNotification(title, dueDate, priority);
            }
        });
        
        // Listen for assignment added via JavaScript
        const originalAddNewTask = window.addNewTask;
        if (typeof originalAddNewTask === 'function') {
            window.addNewTask = (title, dueDate, priority, notes) => {
                // Call original function
                originalAddNewTask(title, dueDate, priority, notes);
                
                // Update assignment count
                this.assignmentCount++;
                this.updateAssignmentCount();
                
                // Create notification
                this.createAssignmentNotification(title, dueDate, priority);
            };
        }
    }
    
    /**
     * Set up listeners for event changes in the DOM
     */
    setupEventListeners() {
        // Listen for event form submissions
        document.addEventListener('submit', (event) => {
            const form = event.target;
            
            // Add event form
            if (form.id === 'addEventForm' || form.id === 'mobileAddEventForm') {
                event.preventDefault();
                
                // Get form data
                const prefix = form.id === 'addEventForm' ? '' : 'mobile';
                const title = document.getElementById(`${prefix}EventTitle`).value;
                const date = document.getElementById(`${prefix}EventDate`).value;
                const time = document.getElementById(`${prefix}EventTime`).value;
                const category = document.getElementById(`${prefix}EventCategory`).value;
                const location = document.getElementById(`${prefix}EventLocation`).value;
                
                // Create event object
                const eventDate = new Date(`${date}T${time}`);
                const event = {
                    title,
                    date: eventDate,
                    time: this.formatTime(eventDate),
                    type: category,
                    location
                };
                
                // Add to upcoming sessions
                this.upcomingSessions.push(event);
                this.upcomingSessions.sort((a, b) => a.date - b.date);
                if (this.upcomingSessions.length > 5) {
                    this.upcomingSessions = this.upcomingSessions.slice(0, 5);
                }
                
                // Update UI
                this.updateUpcomingSessions();
                
                // Create notification
                this.createEventNotification(title, date, time, location);
            }
        });
        
        // Listen for addEventToList function calls
        if (typeof window.addEventToList === 'function') {
            const originalAddEventToList = window.addEventToList;
            window.addEventToList = (title, date, time, category, location) => {
                // Call original function
                originalAddEventToList(title, date, time, category, location);
                
                // Create event object
                const eventDate = new Date(`${date}T${time}`);
                const event = {
                    title,
                    date: eventDate,
                    time: this.formatTime(eventDate),
                    type: category,
                    location
                };
                
                // Add to upcoming sessions
                this.upcomingSessions.push(event);
                this.upcomingSessions.sort((a, b) => a.date - b.date);
                if (this.upcomingSessions.length > 5) {
                    this.upcomingSessions = this.upcomingSessions.slice(0, 5);
                }
                
                // Update UI
                this.updateUpcomingSessions();
                
                // Create notification
                this.createEventNotification(title, date, time, location);
            };
        }
    }
    
    /**
     * Update the assignment count in the overview section
     */
    updateAssignmentCount() {
        const assignmentCountElement = document.querySelector('[data-stat="assignmentCount"]');
        if (assignmentCountElement) {
            assignmentCountElement.textContent = this.assignmentCount;
        }
    }
    
    /**
     * Update the upcoming sessions in the overview section
     */
    updateUpcomingSessions() {
        const upcomingSessionsContainer = document.querySelector('.upcoming-sessions');
        if (!upcomingSessionsContainer) return;
        
        // Clear existing sessions
        upcomingSessionsContainer.innerHTML = '';
        
        if (this.upcomingSessions.length === 0) {
            // Show empty state
            const emptyState = document.createElement('div');
            emptyState.className = 'text-center p-4 text-muted';
            emptyState.innerHTML = '<i class="bi bi-calendar-x fs-1"></i><p class="mt-2">No upcoming sessions</p>';
            upcomingSessionsContainer.appendChild(emptyState);
            return;
        }
        
        // Add sessions
        this.upcomingSessions.forEach(session => {
            const sessionItem = this.createSessionElement(session);
            upcomingSessionsContainer.appendChild(sessionItem);
        });
    }
    
    /**
     * Create a session element for the upcoming sessions list
     * @param {Object} session - Session data
     * @returns {HTMLElement} - Session element
     */
    createSessionElement(session) {
        const sessionItem = document.createElement('div');
        sessionItem.className = 'session-item d-flex align-items-center mb-3 p-2 rounded border';
        sessionItem.dataset.id = session.id;
        
        // Get icon based on session type
        let iconClass = 'bi-book text-primary';
        switch (session.type) {
            case 'study':
                iconClass = 'bi-book text-primary';
                break;
            case 'exam':
                iconClass = 'bi-pencil-square text-danger';
                break;
            case 'assignment':
                iconClass = 'bi-clipboard-check text-warning';
                break;
            case 'meeting':
                iconClass = 'bi-people text-success';
                break;
            case 'event':
                iconClass = 'bi-calendar-event text-info';
                break;
        }
        
        // Format date
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        let dateText = session.date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
        });
        
        if (session.date.toDateString() === today.toDateString()) {
            dateText = 'Today';
        } else if (session.date.toDateString() === tomorrow.toDateString()) {
            dateText = 'Tomorrow';
        }
        
        // Create session HTML
        sessionItem.innerHTML = `
            <div class="session-icon me-3">
                <i class="bi ${iconClass} fs-4"></i>
            </div>
            <div class="session-info flex-grow-1">
                <h6 class="mb-0">${session.title}</h6>
                <small class="text-muted">${dateText}, ${session.time}</small>
                ${session.location ? `<small class="d-block text-muted"><i class="bi bi-geo-alt me-1"></i>${session.location}</small>` : ''}
            </div>
            <div class="session-duration">
                <span class="badge bg-light text-dark">1h 30m</span>
            </div>
        `;
        
        return sessionItem;
    }
    
    /**
     * Create a notification for a new assignment
     * @param {string} title - Assignment title
     * @param {string} dueDate - Due date
     * @param {string} priority - Priority level
     */
    createAssignmentNotification(title, dueDate, priority) {
        if (!window.notificationCenter) return;
        
        const date = new Date(dueDate);
        const formattedDate = date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
        });
        
        const message = `"${title}" due on ${formattedDate} (${priority} priority)`;
        
        window.notificationCenter.addNotification(
            'assignment',
            'New Assignment Added',
            message,
            { showToast: true }
        );
    }
    
    /**
     * Create a notification for a new event
     * @param {string} title - Event title
     * @param {string} date - Event date
     * @param {string} time - Event time
     * @param {string} location - Event location
     */
    createEventNotification(title, date, time, location) {
        if (!window.notificationCenter) return;
        
        const eventDate = new Date(`${date}T${time}`);
        const formattedDate = eventDate.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
        });
        
        const formattedTime = this.formatTime(eventDate);
        const locationText = location ? ` at ${location}` : '';
        
        const message = `"${title}" scheduled for ${formattedDate}, ${formattedTime}${locationText}`;
        
        window.notificationCenter.addNotification(
            'event',
            'New Event Added',
            message,
            { showToast: true }
        );
    }
    
    /**
     * Notify about a new assignment from Firebase
     * @param {Object} assignmentData - Assignment data from Firebase
     */
    notifyNewAssignment(assignmentData) {
        if (!window.notificationCenter) return;
        
        const title = assignmentData.title || 'New Assignment';
        const dueDate = assignmentData.dueDate ? new Date(assignmentData.dueDate.toMillis()) : new Date();
        const formattedDate = dueDate.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
        });
        const priority = assignmentData.priority || 'medium';
        
        const message = `"${title}" due on ${formattedDate} (${priority} priority)`;
        
        window.notificationCenter.addNotification(
            'assignment',
            'New Assignment Added',
            message,
            { showToast: true }
        );
    }
    
    /**
     * Notify about a new event from Firebase
     * @param {Object} eventData - Event data from Firebase
     */
    notifyNewEvent(eventData) {
        if (!window.notificationCenter) return;
        
        const title = eventData.title || 'New Event';
        const date = eventData.date ? new Date(eventData.date.toMillis()) : new Date();
        const formattedDate = date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
        });
        const formattedTime = this.formatTime(date);
        const location = eventData.location ? ` at ${eventData.location}` : '';
        
        const message = `"${title}" scheduled for ${formattedDate}, ${formattedTime}${location}`;
        
        window.notificationCenter.addNotification(
            'event',
            'New Event Added',
            message,
            { showToast: true }
        );
    }
    
    /**
     * Format time for display
     * @param {Date} date - Date object
     * @returns {string} - Formatted time string
     */
    formatTime(date) {
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
    }
}

// Create global instance
const academicsIntegration = new AcademicsIntegration();

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize with a slight delay to ensure other components are loaded
    setTimeout(() => {
        academicsIntegration.init();
    }, 1000);
});

// Export for global use
window.academicsIntegration = academicsIntegration;
