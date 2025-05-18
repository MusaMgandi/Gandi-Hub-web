/**
 * Email Service Module
 * Handles all email-related functionality using EmailJS
 */

class EmailService {
    constructor() {
        this.serviceId = 'service_22fih5l';
        this.templateId = 'template_d9r347j';
        this.initialized = false;
    }

    /**
     * Initialize EmailJS with configuration
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.initialized) return;

        try {
            // Check if EmailJS is available
            if (typeof window === 'undefined' || !window.emailjs) {
                throw new Error('EmailJS not loaded');
            }

            this.initialized = true;
            console.log('Email service ready');
        } catch (error) {
            console.error('Email service initialization failed:', error);
            throw new Error('Failed to initialize email service');
        }
    }

    /**
     * Validate email address format
     * @param {string} email - Email address to validate
     * @returns {boolean}
     */
    validateEmail(email) {
        if (!email || typeof email !== 'string') return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email.trim());
    }

    /**
     * Send an email using EmailJS
     * @param {Object} params - Email parameters
     * @param {string} params.to - Recipient email address
     * @param {string} params.subject - Email subject
     * @param {string} params.message - Email message
     * @param {string} [params.templateId='template_d9r347j'] - EmailJS template ID
     * @returns {Promise<boolean>}
     */
    async sendEmail({ to, subject, message }) {
        console.log('sendEmail called with:', { to, subject, message });
        try {
            // Ensure service is initialized
            if (!this.initialized) {
                await this.initialize();
            }

            // Validate and clean email
            if (!to || typeof to !== 'string') {
                console.error('Invalid email type:', typeof to);
                throw new Error('Invalid email address');
            }

            const recipientEmail = to.trim();
            if (!recipientEmail || !this.validateEmail(recipientEmail)) {
                console.error('Invalid email format:', recipientEmail);
                throw new Error('Invalid email format');
            }

            console.log('Sending email to:', recipientEmail);

            // Prepare template parameters
            const templateParams = {
                to_email: recipientEmail,
                to_name: 'Rugby Fan',
                subject: subject || 'Gandi Hub Rugby Notification',
                message: message || '',
                from_name: 'Gandi Hub Rugby',
                reply_to: 'gandihubgo@gmail.com'
            };

            console.log('Template parameters:', templateParams);

            // Log template parameters
            console.log('Email template parameters:', templateParams);

            // Send email
            const response = await window.emailjs.send(
                this.serviceId,
                this.templateId,
                templateParams
            );

            console.log('EmailJS response:', response);

            // Log response
            console.log('EmailJS response:', response);

            // Validate response
            if (response.status !== 200) {
                throw new Error(`Email sending failed with status: ${response.status}`);
            }

            return true;

        } catch (error) {
            console.error('Email sending failed:', error);
            throw new Error(error.text || error.message || 'Failed to send email');
        }
    }

    /**
     * Send a reminder email for an event
     * @param {Object} params - Reminder parameters
     * @param {string} params.email - Recipient email address
     * @param {Object} params.event - Event details
     * @param {Date} params.reminderDate - Date to send reminder
     * @returns {Promise<boolean>}
     */
    async sendEventReminder({ email, event, reminderDate }) {
        if (!email || typeof email !== 'string') {
            console.error('Invalid email in sendEventReminder:', email);
            throw new Error('Invalid email address');
        }

        const trimmedEmail = email.trim();
        console.log('sendEventReminder processing email:', {
            original: email,
            trimmed: trimmedEmail
        });

        const formattedDate = event.date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        return this.sendEmail({
            to: trimmedEmail,
            subject: `Reminder Set: ${event.title}`,
            message: `Hello Rugby Fan!

Your reminder has been set for ${event.title}.

Event Details:
- Date: ${formattedDate}
- Time: ${event.time}
- Location: ${event.location}

We'll send you another reminder email one day before the event.

Best regards,
Gandi Hub Rugby Team`
        });
    }
}

// Create and export a singleton instance
const emailService = new EmailService();

// For non-module environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = emailService;
} else if (typeof window !== 'undefined') {
    window.emailService = emailService;
}
