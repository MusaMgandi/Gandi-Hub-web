// Event Data
const events = [
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
        date: '2025-07-26',
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

// Save reminder function
async function saveReminder() {
    const modal = document.getElementById('reminderModal');
    const eventId = parseInt(modal.dataset.eventId);
    const event = events.find(e => e.id === eventId);
    
    const email = document.getElementById('reminderEmail').value;

    if (!email) {
        showNotification('Please enter your email address', 'error');
        return;
    }

    // Show loading state
    const submitBtn = modal.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Setting reminder...';

    try {
        // Send confirmation email to user
        const eventDate = new Date(event.date);
        const reminderDate = new Date(eventDate);
        reminderDate.setDate(reminderDate.getDate() - 1); // Day before the event

        const formattedDate = eventDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const emailSent = await sendEmail(
            email,
            `Reminder Set: ${event.title}`,
            `Hello Rugby Fan!

Your reminder has been set for ${event.title}.

Event Details:
- Date: ${formattedDate}
- Time: ${event.time}
- Location: ${event.location}

We'll send you another reminder email one day before the event.

Best regards,
Gandi Hub Rugby Team`
        );

        if (emailSent) {
            // Store reminder in localStorage for demonstration
            const reminders = JSON.parse(localStorage.getItem('eventReminders') || '[]');
            reminders.push({
                email,
                eventId,
                eventDate: event.date,
                reminderDate: reminderDate.toISOString()
            });
            localStorage.setItem('eventReminders', JSON.stringify(reminders));

            showNotification('Reminder set successfully! Check your email for confirmation.', 'success');
            window.reminderModal.hide();
            document.getElementById('reminderForm').reset();
        }
    } catch (error) {
        console.error('Failed to set reminder:', error);
        showNotification('Failed to set reminder. Please try again.', 'error');
    } finally {
        // Restore button state
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// Function to send emails using EmailJS
async function sendEmail(to, subject, message) {
    try {
        const response = await emailjs.send(
            'service_22fih5l', // Service ID from EmailJS
            'template_d9r347j', // Template ID from EmailJS
            {
                to_email: to,
                subject: subject,
                message: message,
                from_name: 'Gandi Hub Rugby',
                reply_to: 'gandihubgo@gmail.com'
            }
        );

        if (response.status === 200) {
            console.log('Email sent successfully!');
            return true;
        } else {
            throw new Error('Failed to send email');
        }
    } catch (error) {
        console.error('Email sending failed:', error);
        showNotification('Failed to send email. Please try again.', 'error');
        return false;
    }
}

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
