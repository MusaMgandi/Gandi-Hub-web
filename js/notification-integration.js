/**
 * Notification Integration for Gandi-Hub
 * 
 * This module integrates the notification system with different content sections:
 * - Events
 * - Training sessions
 * - Education/Academics (grades, assignments)
 * - Tasks
 * 
 * It monitors for changes in these sections and triggers appropriate notifications.
 */

class NotificationIntegration {
    constructor() {
        this.initialized = false;
        this.lastCheck = {
            events: 0,
            training: 0,
            education: 0,
            tasks: 0
        };
        
        // Add welcome message flag
        this.welcomeShown = false;
        
        // Firebase references (will be initialized when Firebase is ready)
        this.db = null;
        this.eventsRef = null;
        this.trainingRef = null;
        this.educationRef = null;
        this.tasksRef = null;
        
        // User ID (will be set when user is authenticated)
        this.userId = null;
        
        // Flag to track if Firestore is enabled/available
        this.firestoreEnabled = false;
        
        // Add initialization checks
        this.firebaseReady = false;
        this.authReady = false;
        
        // Initialize Firebase watchers
        this.initializeFirebaseWatchers();
        
        this.maxInitAttempts = 3; // Add retry counter for full initialization
        this.currentInitAttempt = 0;
    }
    
    initializeFirebaseWatchers() {
        let retryCount = 0;
        const maxRetries = 120; // Increase to 30 seconds total wait time
        const checkInterval = 250;
        
        // Watch for Firebase SDK load
        const checkFirebase = setInterval(() => {
            if (typeof firebase !== 'undefined' && firebase.app && firebase.auth) {
                try {
                    // Get default app or create one if it doesn't exist
                    const app = firebase.app() || this.initializeFirebaseApp();
                    if (app) {
                        clearInterval(checkFirebase);
                        this.firebaseReady = true;
                        this.initAuth();
                        return;
                    }
                } catch (error) {
                    console.warn('Firebase app check failed, attempt ' + retryCount + ':', error);
                }
            }
            
            retryCount++;
            if (retryCount >= maxRetries) {
                clearInterval(checkFirebase);
                console.warn('Notification integration: Firebase initialization timeout, attempting fallback...');
                this.firebaseReady = false;
                // Try to initialize anyway
                this.attemptFallbackInit();
            }
        }, checkInterval);
    }

    attemptFallbackInit() {
        if (this.currentInitAttempt >= this.maxInitAttempts) {
            console.error('All Firebase initialization attempts failed. Switching to offline mode.');
            this.setupDemoChecks();
            return;
        }

        this.currentInitAttempt++;
        console.log(`Attempting Firebase initialization: Attempt ${this.currentInitAttempt}/${this.maxInitAttempts}`);

        // Wait a bit longer before retry
        setTimeout(() => {
            if (typeof firebase !== 'undefined') {
                this.initializeFirebaseWatchers();
            } else {
                this.attemptFallbackInit();
            }
        }, 2000 * this.currentInitAttempt); // Exponential backoff
    }

    initializeFirebaseApp() {
        try {
            // Check if we have config
            if (!window.firebaseConfig) {
                console.error('Firebase config not found');
                return null;
            }
            
            // Initialize app if not already done
            if (!firebase.apps.length) {
                return firebase.initializeApp(window.firebaseConfig);
            }
            
            return firebase.app();
        } catch (error) {
            console.error('Firebase app initialization failed:', error);
            return null;
        }
    }

    initAuth() {
        try {
            const app = window.firebase?.app?.();
            if (!app) {
                throw new Error('Firebase App not initialized');
            }

            // Get auth using initialized app
            const auth = app.auth?.() || window.firebase?.auth?.();
            
            if (!auth) {
                throw new Error('Auth not available');
            }

            auth.onAuthStateChanged((user) => {
                this.authReady = true;
                this.userId = user ? user.uid : null;
                if (user && !this.welcomeShown) {
                    this.showWelcomeNotification(user);
                    this.welcomeShown = true;
                }
                this.setupFirebaseListeners();
            });

        } catch (error) {
            console.warn('Notification integration: Auth initialization failed, continuing without auth', error);
            this.authReady = true;
            this.setupFirebaseListeners();
        }
    }

    initFirebase() {
        if (!this.firebaseReady) {
            console.warn('Notification integration: Firebase not ready');
            return;
        }

        try {
            this.db = firebase.firestore();
            this.firestoreEnabled = true;
            
            // Wait for auth to be ready before proceeding
            if (this.authReady) {
                this.setupFirebaseListeners();
            }
        } catch (error) {
            console.error('Notification integration: Firebase access error', error);
            this.firestoreEnabled = false;
        }
    }

    /**
     * Show welcome notification for new users
     * @param {Object} user - Firebase user object
     */
    showWelcomeNotification(user) {
        if (!window.notificationCenter) return;
        
        // Check if welcome message was already shown
        if (localStorage.getItem('welcomeNotificationShown')) {
            return;
        }
        
        const name = user.displayName || 'User';
        const message = `Welcome to Gandi-Hub, ${name}! We're glad to have you here.`;
        
        window.notificationCenter.addNotification(
            'welcome',
            'Welcome to Gandi-Hub',
            message,
            { 
                showToast: true,
                duration: 8000,
                priority: 'high'
            }
        );
        
        // Set flag in localStorage
        localStorage.setItem('welcomeNotificationShown', 'true');
        this.welcomeShown = true;
    }
    
    /**
     * Set up Firebase listeners for various collections
     */
    setupFirebaseListeners() {
        if (!this.db || !this.firestoreEnabled) {
            console.log('Notification integration: Firestore not available, skipping listeners');
            return;
        }
        
        try {
            // Add connection state listener
            this.db.enableNetwork()
                .then(() => {
                    console.log('Notification integration: Network connection established');
                    this.setupCollectionListeners();
                })
                .catch(error => {
                    console.warn('Notification integration: Operating in offline mode');
                    // Still try to set up listeners for when we're back online
                    this.setupCollectionListeners();
                });
        } catch (error) {
            console.error('Notification integration: Error setting up Firebase listeners', error);
            this.firestoreEnabled = false;
        }
    }

    setupCollectionListeners() {
        // Listen for new events
        this.eventsRef = this.db.collection('events');
        this.eventsRef
            .where('userId', '==', this.userId)
            .orderBy('createdAt', 'desc')
            .limit(10)
            .onSnapshot(snapshot => {
                snapshot.docChanges().forEach(change => {
                    if (change.type === 'added') {
                        const eventData = change.doc.data();
                        // Only notify for new events (created in the last hour)
                        const oneHourAgo = Date.now() - (60 * 60 * 1000);
                        if (eventData.createdAt && eventData.createdAt.toMillis() > oneHourAgo) {
                            this.notifyNewEvent(eventData);
                        }
                    }
                });
            }, error => {
                if (error.code === 'permission-denied') {
                    console.warn('Notification integration: Firestore permission denied for events, using local storage only');
                    this.firestoreEnabled = false;
                } else {
                    console.error('Notification integration: Error listening for events', error);
                }
            });
            
        // Listen for new training sessions
        this.trainingRef = this.db.collection('training');
        this.trainingRef
            .where('participants', 'array-contains', this.userId)
            .orderBy('createdAt', 'desc')
            .limit(10)
            .onSnapshot(snapshot => {
                snapshot.docChanges().forEach(change => {
                    if (change.type === 'added') {
                        const trainingData = change.doc.data();
                        // Only notify for new training sessions (created in the last hour)
                        const oneHourAgo = Date.now() - (60 * 60 * 1000);
                        if (trainingData.createdAt && trainingData.createdAt.toMillis() > oneHourAgo) {
                            this.notifyNewTraining(trainingData);
                        }
                    }
                });
            }, error => {
                if (error.code === 'permission-denied') {
                    console.warn('Notification integration: Firestore permission denied for training sessions, using local storage only');
                    this.firestoreEnabled = false;
                } else {
                    console.error('Notification integration: Error listening for training sessions', error);
                }
            });
            
        // Listen for new grades/assignments in education
        this.educationRef = this.db.collection('education');
        this.educationRef
            .where('studentId', '==', this.userId)
            .orderBy('updatedAt', 'desc')
            .limit(10)
            .onSnapshot(snapshot => {
                snapshot.docChanges().forEach(change => {
                    if (change.type === 'added' || change.type === 'modified') {
                        const educationData = change.doc.data();
                        // Check if this is a new grade
                        if (educationData.type === 'grade' && change.type === 'modified') {
                            this.notifyNewGrade(educationData);
                        }
                        // Check if this is a new assignment
                        else if (educationData.type === 'assignment' && change.type === 'added') {
                            this.notifyNewAssignment(educationData);
                        }
                    }
                });
            }, error => {
                if (error.code === 'permission-denied') {
                    console.warn('Notification integration: Firestore permission denied for education updates, using local storage only');
                    this.firestoreEnabled = false;
                } else {
                    console.error('Notification integration: Error listening for education updates', error);
                }
            });
            
        // Listen for new tasks
        this.tasksRef = this.db.collection('tasks');
        this.tasksRef
            .where('assignedTo', '==', this.userId)
            .orderBy('createdAt', 'desc')
            .limit(10)
            .onSnapshot(snapshot => {
                snapshot.docChanges().forEach(change => {
                    if (change.type === 'added') {
                        const taskData = change.doc.data();
                        // Only notify for new tasks (created in the last hour)
                        const oneHourAgo = Date.now() - (60 * 60 * 1000);
                        if (taskData.createdAt && taskData.createdAt.toMillis() > oneHourAgo) {
                            this.notifyNewTask(taskData);
                        }
                    }
                });
            }, error => {
                if (error.code === 'permission-denied') {
                    console.warn('Notification integration: Firestore permission denied for tasks, using local storage only');
                    this.firestoreEnabled = false;
                } else {
                    console.error('Notification integration: Error listening for tasks', error);
                }
            });
    }
    
    /**
     * Set up for when Firebase is not available
     * This no longer generates random demo notifications
     */
    setupDemoChecks() {
        // No random notifications will be generated
        console.log('Notification system ready - waiting for real content updates');
    }
    
    /**
     * Notify about a new event
     * @param {Object} eventData - Event data from Firebase
     */
    notifyNewEvent(eventData) {
        if (!window.notificationCenter) return;
        
        const title = eventData.title || 'New Event';
        const date = eventData.date ? new Date(eventData.date.toMillis()) : new Date();
        const formattedDate = this.formatDate(date);
        const message = `${title} scheduled for ${formattedDate}`;
        
        window.notificationCenter.addNotification(
            'event',
            'New Event Added',
            message,
            { showToast: true }
        );
    }
    
    /**
     * Notify about a new training session
     * @param {Object} trainingData - Training data from Firebase
     */
    notifyNewTraining(trainingData) {
        if (!window.notificationCenter) return;
        
        const title = trainingData.title || 'Training Session';
        const date = trainingData.date ? new Date(trainingData.date.toMillis()) : new Date();
        const formattedDate = this.formatDate(date);
        const location = trainingData.location || 'Main Field';
        const message = `${title} scheduled for ${formattedDate} at ${location}`;
        
        window.notificationCenter.addNotification(
            'training',
            'New Training Session',
            message,
            { showToast: true }
        );
    }
    
    /**
     * Notify about a new grade
     * @param {Object} educationData - Education data from Firebase
     */
    notifyNewGrade(educationData) {
        if (!window.notificationCenter) return;
        
        const subject = educationData.subject || 'Subject';
        const grade = educationData.grade || 'N/A';
        const message = `You received a grade of ${grade} in ${subject}`;
        
        window.notificationCenter.addNotification(
            'academic',
            'New Grade Posted',
            message,
            { showToast: true }
        );
    }
    
    /**
     * Notify about a new assignment
     * @param {Object} educationData - Education data from Firebase
     */
    notifyNewAssignment(educationData) {
        if (!window.notificationCenter) return;
        
        const title = educationData.title || 'New Assignment';
        const dueDate = educationData.dueDate ? new Date(educationData.dueDate.toMillis()) : new Date();
        const formattedDate = this.formatDate(dueDate);
        const message = `${title} due on ${formattedDate}`;
        
        window.notificationCenter.addNotification(
            'assignment',
            'New Assignment',
            message,
            { showToast: true }
        );
    }
    
    /**
     * Notify about a new task
     * @param {Object} taskData - Task data from Firebase
     */
    notifyNewTask(taskData) {
        if (!window.notificationCenter) return;
        
        const title = taskData.title || 'New Task';
        const dueDate = taskData.dueDate ? new Date(taskData.dueDate.toMillis()) : new Date();
        const formattedDate = this.formatDate(dueDate);
        const priority = taskData.priority || 'Normal';
        const message = `${title} (${priority} priority) due on ${formattedDate}`;
        
        window.notificationCenter.addNotification(
            'assignment',
            'New Task Assigned',
            message,
            { showToast: true }
        );
    }
    
    /**
     * Format a date for display
     * @param {Date} date - Date to format
     * @returns {string} - Formatted date string
     */
    formatDate(date) {
        if (!date) return 'Unknown date';
        
        const options = { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        };
        
        return date.toLocaleDateString('en-US', options);
    }
    
    /**
     * Get a random future date within the next 14 days
     * @returns {Date} - Random future date
     */
    getRandomFutureDate() {
        const now = new Date();
        // Random days in the future (0-14 days)
        const daysInFuture = Math.floor(Math.random() * 14);
        // Random hours (8am-8pm)
        const hours = Math.floor(Math.random() * 12) + 8;
        // Random minutes (0, 15, 30, 45)
        const minutes = Math.floor(Math.random() * 4) * 15;
        
        const futureDate = new Date(now);
        futureDate.setDate(now.getDate() + daysInFuture);
        futureDate.setHours(hours, minutes, 0, 0);
        
        return futureDate;
    }
    
    /**
     * Initialize the integration
     */
    init() {
        if (this.initialized) return;
        
        console.log('Initializing notification integration...');
        // Only initialize Firebase if not already trying
        if (!this.firebaseReady && !this.initialized) {
            this.initializeFirebaseWatchers();
        } else {
            this.initFirebase();
        }
        
        this.setupDemoChecks();
        this.initialized = true;
    }
}

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
    // Setup notification center
    if (!window.notificationCenter) {
        window.notificationCenter = {
            addNotification: function(type, title, message, options) {
                if (window.showToast) {
                    window.showToast(message, type === 'error' ? 'danger' : 'info', 5000);
                } else {
                    console.log(`Notification: [${type}] ${title} - ${message}`);
                }
            }
        };
    }

    // Wait for Firebase resources
    const waitForFirebase = () => {
        if (typeof firebase !== 'undefined' && window.firebaseConfig) {
            // Create and initialize instance
            window.notificationIntegration = new NotificationIntegration();
            window.notificationIntegration.init();
        } else {
            setTimeout(waitForFirebase, 500);
        }
    };

    // Start waiting for Firebase
    waitForFirebase();
});
