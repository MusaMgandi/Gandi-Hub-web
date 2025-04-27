/**
 * Notification Sound Effects for Gandi-Hub
 * 
 * This module provides audio feedback for different types of notifications
 * using the Web Audio API for better performance and control.
 */

class NotificationSounds {
    constructor() {
        this.audioContext = null;
        this.initialized = false;
        this.soundEnabled = localStorage.getItem('notification_sound_enabled') !== 'false';
    }

    /**
     * Initialize the audio context (must be called after user interaction)
     */
    init() {
        if (this.initialized) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
            console.log('Notification sounds initialized');
        } catch (e) {
            console.warn('Web Audio API not supported', e);
        }
    }

    /**
     * Toggle sound effects on/off
     * @param {boolean} enabled - Whether sound is enabled
     */
    toggleSound(enabled) {
        this.soundEnabled = enabled;
        localStorage.setItem('notification_sound_enabled', enabled);
    }

    /**
     * Play a notification sound based on type
     * @param {string} type - Notification type (success, error, warning, info, etc.)
     */
    play(type) {
        if (!this.initialized || !this.soundEnabled) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            // Configure sound based on notification type
            switch (type) {
                case 'success':
                    this.playSuccessSound(oscillator, gainNode);
                    break;
                case 'error':
                    this.playErrorSound(oscillator, gainNode);
                    break;
                case 'warning':
                    this.playWarningSound(oscillator, gainNode);
                    break;
                case 'achievement':
                    this.playAchievementSound(oscillator, gainNode);
                    break;
                case 'training':
                    this.playTrainingSound(oscillator, gainNode);
                    break;
                case 'event':
                    this.playEventSound(oscillator, gainNode);
                    break;
                case 'academic':
                    this.playAcademicSound(oscillator, gainNode);
                    break;
                case 'assignment':
                    this.playAssignmentSound(oscillator, gainNode);
                    break;
                case 'profile':
                    this.playProfileSound(oscillator, gainNode);
                    break;
                default:
                    this.playDefaultSound(oscillator, gainNode);
            }
            
            // Connect nodes and play
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.7);
        } catch (e) {
            console.warn('Error playing notification sound', e);
        }
    }

    /**
     * Play a success notification sound (pleasant, uplifting)
     */
    playSuccessSound(oscillator, gainNode) {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523.25, this.audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, this.audioContext.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, this.audioContext.currentTime + 0.2); // G5
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.5);
    }

    /**
     * Play an error notification sound (attention-grabbing)
     */
    playErrorSound(oscillator, gainNode) {
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(293.66, this.audioContext.currentTime); // D4
        oscillator.frequency.setValueAtTime(277.18, this.audioContext.currentTime + 0.2); // C#4
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.6);
    }

    /**
     * Play a warning notification sound (cautionary)
     */
    playWarningSound(oscillator, gainNode) {
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(369.99, this.audioContext.currentTime); // F#4
        oscillator.frequency.setValueAtTime(369.99, this.audioContext.currentTime + 0.2); // F#4 again
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.7);
    }

    /**
     * Play an achievement notification sound (celebratory)
     */
    playAchievementSound(oscillator, gainNode) {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(587.33, this.audioContext.currentTime); // D5
        oscillator.frequency.setValueAtTime(783.99, this.audioContext.currentTime + 0.1); // G5
        oscillator.frequency.setValueAtTime(1046.50, this.audioContext.currentTime + 0.2); // C6
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.6);
    }

    /**
     * Play a training notification sound (energetic)
     */
    playTrainingSound(oscillator, gainNode) {
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(440.00, this.audioContext.currentTime); // A4
        oscillator.frequency.setValueAtTime(493.88, this.audioContext.currentTime + 0.15); // B4
        gainNode.gain.setValueAtTime(0.07, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.4);
    }

    /**
     * Play an event notification sound (calendar-like)
     */
    playEventSound(oscillator, gainNode) {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(659.25, this.audioContext.currentTime); // E5
        oscillator.frequency.setValueAtTime(587.33, this.audioContext.currentTime + 0.1); // D5
        gainNode.gain.setValueAtTime(0.08, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.4);
    }

    /**
     * Play an academic notification sound (scholarly)
     */
    playAcademicSound(oscillator, gainNode) {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(392.00, this.audioContext.currentTime); // G4
        oscillator.frequency.setValueAtTime(493.88, this.audioContext.currentTime + 0.15); // B4
        oscillator.frequency.setValueAtTime(587.33, this.audioContext.currentTime + 0.3); // D5
        gainNode.gain.setValueAtTime(0.08, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.5);
    }

    /**
     * Play an assignment notification sound (task-like)
     */
    playAssignmentSound(oscillator, gainNode) {
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(523.25, this.audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(587.33, this.audioContext.currentTime + 0.2); // D5
        gainNode.gain.setValueAtTime(0.09, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.5);
    }

    /**
     * Play a profile notification sound (personal)
     */
    playProfileSound(oscillator, gainNode) {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(329.63, this.audioContext.currentTime); // E4
        oscillator.frequency.setValueAtTime(392.00, this.audioContext.currentTime + 0.15); // G4
        gainNode.gain.setValueAtTime(0.08, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.4);
    }

    /**
     * Play a default notification sound
     */
    playDefaultSound(oscillator, gainNode) {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime); // A4
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
    }
}

// Create and export the notification sounds instance
const notificationSounds = new NotificationSounds();

// Initialize on first user interaction
document.addEventListener('click', () => {
    notificationSounds.init();
}, { once: true });

// Export for global use
window.notificationSounds = notificationSounds;
