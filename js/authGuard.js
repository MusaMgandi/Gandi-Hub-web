import { auth } from './firebase-config.js';

export function protectRoute(options = {}) {
    const {
        requireAuth = true,
        requireVerified = false,
        redirectTo = '/login.html',
        verifyRedirect = '/verify-email.html'
    } = options;
    
    return new Promise((resolve) => {
        // Use imported auth instance
        onAuthStateChanged(auth, (user) => {
            // Allow public routes to pass through
            if (!requireAuth) {
                resolve({ user, isAuthenticated: !!user });
                return;
            }

            // Handle authentication check
            if (!user) {
                if (requireAuth) {
                    window.location.href = redirectTo;
                }
                resolve({ user: null, isAuthenticated: false });
                return;
            }

            // Handle email verification check
            if (requireVerified && !user.emailVerified) {
                window.location.href = verifyRedirect;
                resolve({ user, isAuthenticated: true, needsVerification: true });
                return;
            }

            // User is authenticated and meets all requirements
            resolve({ user, isAuthenticated: true });
        });
    });
}

// Usage example:
// await protectRoute({ requireAuth: true, requireVerified: true });
// await protectRoute({ requireAuth: false }); // Public routes
