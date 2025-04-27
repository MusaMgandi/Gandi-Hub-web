export class StateManager {
    constructor() {
        this.state = {
            grades: [],
            assignments: new Map(),
            events: new Map(),
            currentView: 'overview',
            settings: this._loadSettings()
        };
        this.subscribers = new Map();
        this.version = 1;
    }

    subscribe(key, callback) {
        if (!this.subscribers.has(key)) {
            this.subscribers.set(key, new Set());
        }
        this.subscribers.get(key).add(callback);
        return () => this.unsubscribe(key, callback);
    }

    notify(key) {
        const callbacks = this.subscribers.get(key);
        if (callbacks) {
            callbacks.forEach(callback => callback(this.state[key]));
        }
    }

    async updateState(key, value) {
        try {
            this.state[key] = value;
            this.notify(key);
            await this._persistState();
            return true;
        } catch (error) {
            console.error('State update failed:', error);
            return false;
        }
    }

    // "Private" methods prefixed with underscore
    _loadSettings() {
        try {
            const stored = localStorage.getItem('academic_settings');
            return stored ? JSON.parse(stored) : this._getDefaultSettings();
        } catch (error) {
            console.error('Failed to load settings:', error);
            return this._getDefaultSettings();
        }
    }

    _getDefaultSettings() {
        return {
            theme: 'light',
            notifications: true,
            calendarView: 'month',
            language: 'en'
        };
    }

    async _persistState() {
        try {
            const persistData = {
                grades: this.state.grades,
                assignments: Array.from(this.state.assignments.entries()),
                events: Array.from(this.state.events.entries()),
                settings: this.state.settings,
                version: this.version
            };
            localStorage.setItem('academic_state', JSON.stringify(persistData));
        } catch (error) {
            console.error('Failed to persist state:', error);
            throw error;
        }
    }

    // Add IndexedDB support
    async initializeDB() {
        const request = indexedDB.open('academicsDB', 1);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('assignments')) {
                db.createObjectStore('assignments', { keyPath: 'id' });
            }
            // Add other stores
        };
    }
}
