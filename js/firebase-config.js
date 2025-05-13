const firebaseConfig = {
    apiKey: "AIzaSyDb7Rw9gf3k3OqUjpImv03oBJbDdAzsGpM",
    authDomain: "gandi-hub-474d2.firebaseapp.com",
    projectId: "gandi-hub-474d2",
    storageBucket: "gandi-hub-474d2.appspot.com",
    messagingSenderId: "877278458127",
    appId: "1:877278458127:web:22728337144c770a4b8e7a"
};

try {
    // Initialize Firebase
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        
        // Configure Firestore with cache settings
        const db = firebase.firestore();
        db.settings({
            cache: {
                enabled: true,
                persistenceEnabled: true,
                tabSynchronization: false // Set to false to avoid multi-tab issues
            },
            merge: true // Prevent overriding original host settings
        });
        console.log('Firestore cache settings configured');
    }
    console.log('Firebase initialized successfully');
} catch (error) {
    console.error('Firebase initialization error:', error);
}

// Add connection state monitoring
firebase.firestore().enableNetwork()
    .then(() => {
        console.log('Firestore network enabled');
    })
    .catch(err => {
        console.warn('Firestore network error:', err);
    });

window.firebaseConfig = firebaseConfig;