import { validateSession, showToast } from '../training-utils.js';

export class SessionManager {
    constructor() {
        this.sessions = [];
        this.loadSessions();
        this.initializeEventListeners();
    }

    loadSessions() {
        const stored = localStorage.getItem('trainingSessions');
        this.sessions = stored ? JSON.parse(stored) : [];
    }

    saveSessions() {
        localStorage.setItem('trainingSessions', JSON.stringify(this.sessions));
    }

    addSession(session) {
        const errors = validateSession(session, this.sessions);
        if (errors.length > 0) {
            throw new Error(errors.join('\n'));
        }

        if (session.isRecurring) {
            const newSessions = this.createRecurringSessions(session);
            this.sessions.push(...newSessions);
            showToast(`Created ${newSessions.length} recurring sessions`, 'success');
        } else {
            this.sessions.push(session);
            showToast('Training session scheduled successfully', 'success');
        }

        this.saveSessions();
        return true;
    }

    editSession(sessionId, updatedSession) {
        const index = this.sessions.findIndex(s => s.id === sessionId);
        if (index === -1) return false;

        const errors = validateSession(updatedSession, this.sessions);
        if (errors.length > 0) {
            throw new Error(errors.join('\n'));
        }

        this.sessions[index] = updatedSession;
        this.saveSessions();
        return true;
    }

    deleteSession(sessionId) {
        const index = this.sessions.findIndex(s => s.id === sessionId);
        if (index === -1) return false;

        this.sessions.splice(index, 1);
        this.saveSessions();
        return true;
    }

    getUpcomingSessions() {
        const today = new Date();
        return this.sessions
            .filter(session => new Date(session.date) >= today)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    initializeEventListeners() {
        document.getElementById('trainingForm')?.addEventListener('submit', this.handleFormSubmit.bind(this));
    }

    handleFormSubmit(e) {
        // ... existing form submission code ...
    }

    createRecurringSessions(baseSession) {
        // ... existing recurring sessions code ...
    }
}
