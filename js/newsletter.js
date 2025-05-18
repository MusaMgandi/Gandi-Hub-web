// Handle newsletter subscription
async function subscribeToNewsletter(event) {
    event.preventDefault();
    
    const form = event.target.closest('form');
    if (!form) return;

    const emailInput = form.querySelector('input[type="email"]');
    if (!emailInput) return;

    const email = emailInput.value.trim();
    if (!email || !email.includes('@')) {
        showNotification('Please enter a valid email address', 'error');
        emailInput.focus();
        return;
    }

    const subscribeBtn = form.querySelector('button[type="submit"]');
    const originalText = subscribeBtn?.innerHTML || 'Subscribe';
    if (subscribeBtn) {
        subscribeBtn.disabled = true;
        subscribeBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Subscribing...';
    }

    try {
        const response = await emailjs.send(
            'service_22fih5l',
            'template_7dek9js',
            {
                email: email,
                to_email: email,
                from_name: 'Gandi-Hub Dev Team',
                reply_to: 'gandihubgo@gmail.com',
                subject: 'Gandi-Hub Rugby',
                message: `Welcome to Gandi-Hub Rugby!

Thank you for subscribing to our newsletter. You'll be the first to know about:
• Latest rugby matches and scores
• Upcoming tournaments and events
• Team updates and player profiles
• Special community events

Stay connected with the rugby community!

Best regards,
Gandi-Hub Rugby Team`
            }
        );

        console.log('Newsletter subscription successful:', response);
        showNotification('Successfully subscribed to newsletter!', 'success');
        form.reset();

    } catch (error) {
        console.error('Newsletter subscription failed:', error);
        showNotification('Failed to subscribe. Please try again.', 'error');
    } finally {
        if (subscribeBtn) {
            subscribeBtn.disabled = false;
            subscribeBtn.innerHTML = originalText;
        }
    }
}

// Export the function
window.subscribeToNewsletter = subscribeToNewsletter;
