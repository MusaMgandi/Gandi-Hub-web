// Event Data
window.events = window.events || [
    {
        id: 1,
        title: 'Kenya Cup Semi Finals 2025',
        date: '2025-03-30',
        time: '14:00',
        location: 'RFUEA Grounds, Nairobi',
        description: 'KCB Rugby vs Kabras Sugar - The battle for Kenya Cup final spot.',
        image: '../images/kenya-cup.jpg'
    },
    {
        id: 2,
        title: 'Safari Sevens 2025',
        date: '2025-08-03',
        time: '09:00',
        location: 'RFUEA Grounds, Nairobi',
        description: 'Annual international rugby sevens tournament featuring teams from around the world.',
        image: '../images/sevens.jpg'
    },
    {
        id: 3,
        title: 'Enterprise Cup Quarter Finals',
        date: '2025-04-06',
        time: '14:00',
        location: 'Impala Club, Nairobi',
        description: 'Experience the intensity of Enterprise Cup knockout stages.',
        image: '../images/enterprise-cup.jpg'
    },
    {
        id: 4,
        title: 'Bingwa Fest 2025 By Betika',
        date: '2025-04-20',
        time: '10:00',
        location: 'Kisumu ASK Showground',
        description: 'Join us for the ultimate rugby festival powered by Betika. Experience thrilling matches, entertainment, and more!',
        image: '../images/BINGWA.jpg'
    },
    {
        id: 5,
        title: 'JINJA FUN RUGBY',
        date: '2025-06-30',
        time: '09:00',
        location: 'Uganda',
        description: 'Join us for an exciting rugby event in the heart of Uganda!',
        image: '../images/rugby2.jpg'
    },
    {
        id: 6,
        title: 'Driftwood Seven',
        date: '2025-07-26',
        time: '09:00',
        location: 'Mombasa Sports Club',
        description: 'Experience the thrill of rugby sevens at the beautiful Mombasa Sports Club.',
        image: '../images/driftwood.png'
    }
];

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    // Load events
    loadEvents();

    // Initialize Bootstrap components
    initializeBootstrapComponents();

    // Add scroll effect for navbar
    handleNavbarScroll();

    // Initialize newsletter form
    initializeNewsletterForm();
});

// Load events into the container
function loadEvents() {
    const container = document.getElementById('eventsContainer');
    const currentDate = new Date();
    
    // Sort events by date
    const sortedEvents = [...events].sort((a, b) => {
        const dateA = new Date(a.date + 'T' + a.time);
        const dateB = new Date(b.date + 'T' + b.time);
        return dateA - dateB;
    });

    // Separate future and past events
    const futureEvents = [];
    const pastEvents = [];
    
    sortedEvents.forEach(event => {
        const eventDate = new Date(event.date + 'T' + event.time);
        if (eventDate > currentDate) {
            futureEvents.push(event);
        } else {
            pastEvents.push(event);
        }
    });

    // Clear container
    container.innerHTML = '';

    // Add future events first
    futureEvents.forEach(event => {
        const eventCard = createEventCard(event);
        container.appendChild(eventCard);
    });

    // Add past events
    pastEvents.forEach(event => {
        const eventCard = createEventCard(event);
        container.appendChild(eventCard);
    });
}

// Create event card element
function createEventCard(event) {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4';
    
    const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const eventDate = new Date(event.date + 'T' + event.time);
    const currentDate = new Date();
    const isPastEvent = eventDate < currentDate;

    col.innerHTML = `
        <div class="event-card${isPastEvent ? ' past-event' : ''}">
            <img src="${event.image}" alt="${event.title}" class="event-image">
            <div class="event-content">
                <h3 class="event-title">${event.title}</h3>
                <div class="event-details">
                    <p><i class="bi bi-calendar"></i> ${formattedDate}</p>
                    <p><i class="bi bi-clock"></i> ${event.time}</p>
                    <p><i class="bi bi-geo-alt"></i> ${event.location}</p>
                    <p class="event-description">${event.description}</p>
                </div>
                <div class="event-actions">
                    ${isPastEvent ? `
                        <p class="text-muted mb-0"><i class="bi bi-clock-history"></i> Event has already passed</p>
                    ` : `
                        <button onclick="buyTicket(${event.id})" class="btn btn-primary">
                            <i class="bi bi-ticket-perforated"></i> Buy Tickets
                        </button>
                        <button onclick="setReminder(${event.id})" class="btn btn-outline-primary">
                            <i class="bi bi-bell"></i> Set Reminder
                        </button>
                    `}
                </div>
            </div>
        </div>
    `;
    
    return col;
}

// Initialize Bootstrap components
function initializeBootstrapComponents() {
    // Initialize all tooltips
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltip => new bootstrap.Tooltip(tooltip));

    // Initialize reminder modal
    window.reminderModal = new bootstrap.Modal(document.getElementById('reminderModal'));
}

// Handle navbar scroll effect
function handleNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('navbar-scrolled');
        } else {
            navbar.classList.remove('navbar-scrolled');
        }
    });
}

// Initialize newsletter form
function initializeNewsletterForm() {
    const form = document.querySelector('.newsletter-form');
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = form.querySelector('input[type="email"]').value;
        
        if (email) {
            showNotification('Thank you for subscribing!', 'success');
            form.reset();
        }
    });
}

// Buy ticket function
function buyTicket(eventId) {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    // Redirect to TikoHub events page
    window.open('https://www.tikohub.co.ke/events.php', '_blank');
}

// Set reminder function
function setReminder(eventId) {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    // Store event details in the modal
    const modal = document.getElementById('reminderModal');
    modal.dataset.eventId = eventId;
    
    // Show modal
    window.reminderModal.show();
}

async function saveReminder(event) {
    try {
        // Prevent the default form submission
        event.preventDefault();
        
        // Get form and validate
        const form = document.getElementById('reminderForm');
        if (!form || !form.checkValidity()) {
            throw new Error('Please fill in all required fields');
        }

        // Get modal and event data
        const modal = document.getElementById('reminderModal');
        const eventId = parseInt(modal.dataset.eventId);
        const eventData = events.find(e => e.id === eventId);
        if (!eventData) {
            throw new Error('Event not found');
        }

        // Get and validate email
        const emailInput = form.querySelector('input[type="email"]');
        if (!emailInput) {
            throw new Error('Email input not found');
        }

        const email = emailInput.value.trim();
        if (!email || !email.includes('@')) {
            throw new Error('Please enter a valid email address');
        }

        // Get submit button and store its original state
        const submitBtn = form.querySelector('button[type="submit"]');
        if (!submitBtn) {
            throw new Error('Submit button not found');
        }
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Setting reminder...';

        // Format date for the email
        const eventDate = new Date(eventData.date);
        const formattedDate = eventDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Send email using EmailJS with template variables
        console.log('Sending email to:', email);
        const response = await emailjs.send(
            'service_22fih5l',
            'template_d9r347j',
            {
                to_email: email,
                email: email,
                recipient: email,
                from_name: 'Gandi-Hub Rugby',
                reply_to: 'gandihubgo@gmail.com',
                subject: 'Gandi-Hub Rugby',
                message: `Event Details:
- Title: ${eventData.title}
- Date: ${formattedDate}
- Time: ${eventData.time || 'TBD'}
- Location: ${eventData.location || 'TBD'}`
            }
        );

        console.log('Email sent successfully:', response);

        // Store reminder in localStorage
        const reminders = JSON.parse(localStorage.getItem('eventReminders') || '[]');
        reminders.push({
            email,
            eventId,
            eventDate: eventData.date,
            reminderDate: new Date(eventDate.getTime() - 24 * 60 * 60 * 1000).toISOString()
        });
        localStorage.setItem('eventReminders', JSON.stringify(reminders));

        showNotification('Reminder set successfully! Check your email for confirmation.', 'success');
        const modalInstance = bootstrap.Modal.getInstance(modal);
        modalInstance.hide();
        form.reset();

    } catch (error) {
        console.error('Failed to set reminder:', error);
        showNotification(
            'Failed to send email. Please check your email address and try again.',
            'error'
        );
    } finally {
        const form = document.getElementById('reminderForm');
        const submitBtn = form?.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = submitBtn.dataset.originalText || 'Set Reminder';
        }
    }
}

// Update the email validation and sending functions
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

async function sendEmail(to, subject, message) {
    try {
        // Enhanced email validation
        if (!to || typeof to !== 'string' || !validateEmail(to)) {
            throw new Error('Invalid or empty email address');
        }

        // Ensure all required fields are properly formatted
        // Use the exact parameter names that match the template variables
        // The template likely uses {{to_email}}, {{to_name}}, etc.
        const templateParams = {
            to_email: to.trim(),
            to_name: 'Rugby Fan',
            from_name: 'Gandi Hub Rugby',
            subject: subject || 'Gandi Hub Rugby Notification',
            message: message || '',
            reply_to: 'gandihubgo@gmail.com'
        };
        
        console.log('Sending email with params:', JSON.stringify(templateParams));

        // Initialize EmailJS if not already done
        if (typeof emailjs !== 'undefined' && !emailjs.init._called) {
            emailjs.init('zV_N744b4DBmaQV04');
        }

        // Add a try-catch block specifically for the emailjs.send call
        try {
            const response = await emailjs.send(
                'service_22fih5l',
                'template_d9r347j',
                templateParams
            );
            
            // Log the successful response
            console.log('EmailJS response:', response);

            if (response.status === 200) {
                return true;
            }
            throw new Error(`Email sending failed with status: ${response.status}`);
        } catch (emailError) {
            console.error('EmailJS send error:', emailError);
            throw emailError;
        }
    } catch (error) {
        console.error('Email sending failed:', error);
        throw new Error('Failed to send email. Please check your email address and try again.');
    }
}

// Initialize email service
const initializeEmailService = async () => {
    try {
        await emailService.initialize();
        console.log('Email service initialized');
    } catch (error) {
        console.error('Failed to initialize email service:', error);
        showNotification('Email service initialization failed', 'error');
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeEmailService);

// Function to schedule reminder emails
function scheduleReminderEmail(email, event, reminderDate) {
    // This would be implemented with a backend scheduling system
    // For now, we'll just log the scheduled reminder
    console.log('Scheduled reminder email:', {
        to: email,
        event: event.title,
        reminderDate: reminderDate,
        message: `Reminder: ${event.title} is tomorrow at ${event.time} at ${event.location}. Don't miss it!`
    });
}

// Show notification function
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.setAttribute('role', 'alert');
    
    const icon = document.createElement('i');
    icon.className = `bi bi-${type === 'success' ? 'check-circle' : 'info-circle'}`;
    notification.appendChild(icon);
    
    const text = document.createElement('span');
    text.textContent = message;
    notification.appendChild(text);
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
