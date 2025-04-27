/**
 * Notification Settings Panel for Gandi-Hub
 * 
 * This module provides a user interface for customizing notification preferences
 * including sound effects, display duration, and notification behavior.
 */

class NotificationSettings {
    constructor() {
        this.form = document.getElementById('notification-settings-form');
        if (this.form) {
            this.bindEvents();
        }
    }

    bindEvents() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSettings();
        });
    }

    saveSettings() {
        try {
            const formData = new FormData(this.form);
            if (window.notificationCenter) {
                window.notificationCenter.setMaxNotifications(formData.get('maxNotifications'));
                window.notificationCenter.setSetting('sound', formData.get('sound') === 'on');
                window.notificationCenter.setSetting('desktop', formData.get('desktop') === 'on');
                window.notificationCenter.setSetting('groupSimilar', formData.get('groupSimilar') === 'on');
                
                const saved = window.notificationCenter.saveSettings();
                
                if (saved && window.showToast) {
                    window.showToast('Settings saved successfully', 'success', 3000);
                }
            }
        } catch (e) {
            console.error('Error saving notification settings:', e);
            if (window.showToast) {
                window.showToast('Error saving settings', 'error', 3000);
            }
        }
    }
}

// Only create NotificationCenter if it doesn't exist
if (!window.notificationCenter) {
    class NotificationCenter {
        constructor() {
            if (window.notificationCenter) {
                return window.notificationCenter;
            }
            this.maxNotifications = 10;
            this.settings = this.loadSettings();
            window.notificationCenter = this;
        }

        loadSettings() {
            try {
                const saved = localStorage.getItem('notificationSettings');
                return saved ? JSON.parse(saved) : {
                    sound: true,
                    desktop: true,
                    maxNotifications: 10,
                    groupSimilar: true
                };
            } catch (e) {
                console.error('Error loading settings:', e);
                return {
                    sound: true,
                    desktop: true,
                    maxNotifications: 10,
                    groupSimilar: true
                };
            }
        }

        setMaxNotifications(max) {
            const numMax = parseInt(max) || 10;
            this.maxNotifications = numMax;
            this.settings.maxNotifications = numMax;
            return this;
        }

        saveSettings() {
            try {
                localStorage.setItem('notificationSettings', JSON.stringify(this.settings));
                return true;
            } catch (e) {
                console.error('Error saving settings:', e);
                return false;
            }
        }

        // Add get/set methods for other settings
        setSetting(key, value) {
            this.settings[key] = value;
            return this;
        }

        getSetting(key) {
            return this.settings[key];
        }
    }

    // Initialize singleton instance
    window.notificationCenter = new NotificationCenter();
}

// Initialize settings when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new NotificationSettings();
});
