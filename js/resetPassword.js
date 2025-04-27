import { getAuth, sendPasswordResetEmail } from "firebase/auth";

export async function handlePasswordReset(email) {
    const auth = getAuth();
    try {
        await sendPasswordResetEmail(auth, email);
        showNotification('Password reset email sent!', 'success');
    } catch (error) {
        showNotification('Failed to send reset email', 'error');
        console.error(error);
    }
}

function showNotification(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
