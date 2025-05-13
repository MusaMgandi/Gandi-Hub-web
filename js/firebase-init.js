// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, enableIndexedDbPersistence, enableNetwork } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDb7Rw9gf3k3OqUjpImv03oBJbDdAzsGpM",
    authDomain: "gandi-hub-474d2.firebaseapp.com",
    projectId: "gandi-hub-474d2",
    storageBucket: "gandi-hub-474d2.appspot.com",
    messagingSenderId: "877278458127",
    appId: "1:877278458127:web:22728337144c770a4b8e7a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable offline persistence
try {
    enableIndexedDbPersistence(db)
        .then(() => {
            console.log('Firestore persistence enabled');
        })
        .catch((err) => {
            if (err.code === 'failed-precondition') {
                console.warn('Firestore persistence unavailable: multiple tabs open');
            } else if (err.code === 'unimplemented') {
                console.warn('Firestore persistence unavailable: unsupported browser');
            }
        });
    
    // Add connection state monitoring
    enableNetwork(db)
        .then(() => {
            console.log('Firestore network enabled');
        })
        .catch(err => {
            console.warn('Firestore network error:', err);
        });
} catch (error) {
    console.error('Firebase initialization error:', error);
}

export default app;
