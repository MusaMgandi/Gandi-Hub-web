export class LocalStorage {
    static saveActivity(activity) {
        const activities = this.getActivities();
        activities.push({
            ...activity,
            id: Date.now(),
            pendingSync: true
        });
        localStorage.setItem('activities', JSON.stringify(activities));
    }

    static getActivities() {
        return JSON.parse(localStorage.getItem('activities') || '[]');
    }

    static removeActivity(id) {
        const activities = this.getActivities();
        const filtered = activities.filter(a => a.id !== id);
        localStorage.setItem('activities', JSON.stringify(filtered));
    }

    static saveNote(note) {
        const notes = this.getNotes();
        notes.push({
            ...note,
            id: Date.now(),
            pendingSync: true
        });
        localStorage.setItem('notes', JSON.stringify(notes));
    }

    static getNotes() {
        return JSON.parse(localStorage.getItem('notes') || '[]');
    }

    static clearSynced(type) {
        const items = JSON.parse(localStorage.getItem(type.toLowerCase()) || '[]');
        const unsynced = items.filter(item => item.pendingSync);
        localStorage.setItem(type.toLowerCase(), JSON.stringify(unsynced));
    }
}
