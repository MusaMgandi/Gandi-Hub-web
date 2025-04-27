import { getFirestore, collection, onSnapshot } from "firebase/firestore";

export class NotificationSystem {
    constructor(userId) {
        this.db = getFirestore();
        this.userId = userId;
        this.unsubscribe = null;
    }

    startListening() {
        const notificationsRef = collection(this.db, `users/${this.userId}/notifications`);
        this.unsubscribe = onSnapshot(notificationsRef, (snapshot) => {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    this.showNotification(change.doc.data());
                }
            });
        });
    }

    showNotification(data) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <i class="fas ${data.icon}"></i>
            <p>${data.message}</p>
        `;
        document.getElementById('notifications-container').appendChild(notification);
        setTimeout(() => notification.remove(), 5000);
    }

    stopListening() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }
}
