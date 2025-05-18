import { getFirestore, collection, onSnapshot, doc, getDoc, setDoc } from "firebase/firestore";

export class NotificationSystem {
    constructor(userId) {
        this.db = getFirestore();
        this.userId = userId;
        this.unsubscribe = null;
    }

    async checkAndShowWelcomeNotification() {
        const userRef = doc(this.db, 'users', this.userId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists() && !userDoc.data().welcomeNotificationShown) {
            this.showNotification({
                icon: 'fa-coins',
                message: 'Welcome! You have been awarded 50 GHub tokens! 🎉'
            });

            await setDoc(userRef, { 
                welcomeNotificationShown: true,
                tokens: (userDoc.data().tokens || 0) + 50
            }, { merge: true });
        }
    }

    async startListening() {
        // Check for welcome notification first
        await this.checkAndShowWelcomeNotification();

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
