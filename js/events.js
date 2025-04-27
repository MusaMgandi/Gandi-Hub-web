// Event handling functions
document.addEventListener('DOMContentLoaded', function() {
    // Initialize modal
    const modalElement = document.getElementById('mainModal');
    if (modalElement) {
        const modal = new bootstrap.Modal(modalElement, {
            backdrop: true,
            keyboard: true,
            focus: true
        });
        
        // Store modal instance globally if needed
        window.mainModal = modal;
    }
    
    // Add scroll effect for header
    window.addEventListener('scroll', () => {
        const header = document.querySelector('header');
        if (window.scrollY > 50) {
            header.classList.remove('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Ensure header is initially styled based on scroll position
    const header = document.querySelector('header');
    if (window.scrollY > 50) {
        header.classList.remove('scrolled');
    } else {
        header.classList.remove('scrolled');
    }

    // Handle fan registration form
    const fanRegistrationForm = document.getElementById('fanRegistrationForm');
    if (fanRegistrationForm) {
        fanRegistrationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(fanRegistrationForm);
            registerFan(Object.fromEntries(formData));
        });
    }

    // Handle newsletter form
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = newsletterForm.querySelector('input[type="email"]').value;
            subscribeToNewsletter(email);
        });
    }

    // Update all event elements on page load
    const eventElements = document.querySelectorAll('.event-item');
    eventElements.forEach(eventElement => {
        const eventDateTime = eventElement.dataset.eventDateTime;
        updateEventUI(eventElement, eventDateTime);
    });

    // Event search functionality
    const searchInput = document.getElementById('eventSearch');
    
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const eventCards = document.querySelectorAll('.event-card');
        let hasResults = false;

        eventCards.forEach(card => {
            const title = card.querySelector('.event-title').textContent.toLowerCase();
            const description = card.querySelector('.event-description').textContent.toLowerCase();
            const location = card.querySelector('.bi-geo-alt').parentElement.textContent.toLowerCase();
            const date = card.querySelector('.bi-calendar').parentElement.textContent.toLowerCase();

            if (title.includes(searchTerm) || 
                description.includes(searchTerm) || 
                location.includes(searchTerm) ||
                date.includes(searchTerm)) {
                card.style.display = 'block';
                hasResults = true;
            } else {
                card.style.display = 'none';
            }
        });

        // Show/hide no results message
        let noResults = document.querySelector('.no-results');
        if (!hasResults) {
            if (!noResults) {
                noResults = document.createElement('p');
                noResults.className = 'no-results';
                noResults.textContent = 'No events found';
                document.querySelector('.event-cards').appendChild(noResults);
            }
        } else if (noResults) {
            noResults.remove();
        }
    });
});

// Function to check if event has passed
function hasEventPassed(eventDateTime) {
    const now = new Date();
    const eventDate = new Date(eventDateTime);
    return eventDate < now;
}

// Buy ticket function
function buyTicket(eventName, eventDateTime) {
    if (hasEventPassed(eventDateTime)) {
        showNotification('This event has already passed', 'error');
        return;
    }
    // Here you would integrate with your ticket booking system
    console.log(`Initiating ticket purchase for: ${eventName}`);
    // Redirect to TikoHub booking page
    window.open('https://www.tikohub.co.ke/events.php', '_blank');
}

// Set reminder function
function setReminder(eventName, eventDateTime) {
    if (hasEventPassed(eventDateTime)) {
        showNotification('This event has already passed', 'error');
        return;
    }
    // Store event details in the modal
    const modal = document.getElementById('reminderModal');
    modal.dataset.eventName = eventName;
    modal.dataset.eventDateTime = eventDateTime;
    
    // Show the modal
    const reminderModal = new bootstrap.Modal(modal);
    reminderModal.show();
}

// Save reminder function
function saveReminder() {
    const modal = document.getElementById('reminderModal');
    const email = document.getElementById('reminderEmail').value;
    const phone = document.getElementById('reminderPhone').value;
    const eventName = modal.dataset.eventName;
    const eventDateTime = modal.dataset.eventDateTime;

    // Here you would integrate with your reminder service
    console.log('Saving reminder:', {
        eventName,
        eventDateTime,
        email,
        phone
    });

    // Close the modal
    const reminderModal = bootstrap.Modal.getInstance(modal);
    reminderModal.hide();

    // Show success message
    showNotification('Reminder set successfully!', 'success');
}

// Register for event function
function register(eventName) {
    // Here you would integrate with your registration system
    console.log(`Registering for: ${eventName}`);
    showNotification('Registration successful!', 'success');
}

// Fan registration function
async function registerFan(data) {
    try {
        // Here you would integrate with your backend
        console.log('Registering fan:', data);
        
        // Show success message
        showNotification('Registration successful! Welcome to the team!', 'success');
        
        // Reset form
        document.getElementById('fanRegistrationForm').reset();
    } catch (error) {
        console.error('Error registering fan:', error);
        showNotification('Registration failed. Please try again.', 'error');
    }
}

// Newsletter subscription function
async function subscribeToNewsletter(email) {
    try {
        // Here you would integrate with your newsletter service
        console.log('Subscribing to newsletter:', email);
        
        // Show success message
        showNotification('Thanks for subscribing!', 'success');
        
        // Reset form
        document.querySelector('.newsletter-form').reset();
    } catch (error) {
        console.error('Error subscribing to newsletter:', error);
        showNotification('Subscription failed. Please try again.', 'error');
    }
}

// Notification function
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.setAttribute('role', 'alert');
    
    // Add icon based on type
    const icon = document.createElement('i');
    icon.className = `bi bi-${type === 'success' ? 'check-circle' : 'info-circle'}`;
    notification.appendChild(icon);
    
    // Add message
    const text = document.createElement('span');
    text.textContent = message;
    notification.appendChild(text);
    
    // Add to document
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Update UI based on event status
function updateEventUI(eventElement, eventDateTime) {
    if (hasEventPassed(eventDateTime)) {
        // Add 'past-event' class to event container
        eventElement.classList.add('past-event');
        
        // Hide buttons for past events
        const buttons = eventElement.querySelectorAll('.buy-ticket-btn, .set-reminder-btn');
        buttons.forEach(button => button.style.display = 'none');
        
        // Add past event indicator
        const statusBadge = document.createElement('div');
        statusBadge.className = 'event-status';
        statusBadge.textContent = 'Event Passed';
        eventElement.appendChild(statusBadge);
    }
}
