export function showError(message, duration = 5000) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-toast';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.classList.add('fade-out');
        setTimeout(() => errorDiv.remove(), 300);
    }, duration);
}

export function handleApiError(error) {
    console.error('API Error:', error);
    let message = 'An unexpected error occurred';
    
    if (error.code === 'auth/user-not-found') {
        message = 'User not found. Please check your credentials.';
    } else if (error.code === 'auth/wrong-password') {
        message = 'Invalid password. Please try again.';
    }
    
    showError(message);
}
