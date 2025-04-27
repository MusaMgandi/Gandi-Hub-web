import { NotificationSystem } from './notifications.js';
import { ActivityTracker } from './activityTracker.js';
import { SearchSystem } from './search.js';
import { Analytics } from './analytics.js';
import { Toast } from './components/Toast.js';
import { getAuth } from 'firebase/auth';

class FeatureManager {
    constructor() {
        this.auth = getAuth();
        this.notifications = null;
        this.activityTracker = null;
        this.search = null;
        this.analytics = new Analytics();
    }

    async initialize() {
        // Initialize features when user is authenticated
        this.auth.onAuthStateChanged(user => {
            if (user) {
                this.initializeFeatures(user.uid);
            }
        });

        // Initialize search
        this.search = new SearchSystem();
        await this.search.initializeSearch();
        
        // Setup search listener
        document.getElementById('globalSearch')?.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // Setup preferences
        this.initializePreferences();
    }

    initializeFeatures(userId) {
        // Initialize notifications
        this.notifications = new NotificationSystem(userId);
        this.notifications.startListening();

        // Initialize activity tracker
        this.activityTracker = new ActivityTracker(userId);
        
        // Track initialization
        this.analytics.trackEvent('features_initialized', { userId });
    }

    async handleSearch(query) {
        if (query.length < 2) return;
        
        const results = await this.search.search(query);
        this.displaySearchResults(results);
    }

    displaySearchResults(results) {
        const container = document.getElementById('searchResults');
        if (!container) return;

        container.innerHTML = results.map(result => `
            <div class="search-result">
                <h4>${result.title}</h4>
                <p>${result.description}</p>
            </div>
        `).join('');
    }

    initializePreferences() {
        const form = document.getElementById('preferencesForm');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.savePreferences();
        });
    }

    async savePreferences() {
        const prefs = {
            emailNotifs: document.getElementById('emailNotifs').checked,
            pushNotifs: document.getElementById('pushNotifs').checked
        };

        try {
            // Save to user document
            await this.activityTracker.logActivity('preferences_updated', prefs);
            Toast.show('Preferences saved!', 'success');
        } catch (error) {
            Toast.show('Failed to save preferences', 'error');
        }
    }
}

// Initialize features
const featureManager = new FeatureManager();
featureManager.initialize();
