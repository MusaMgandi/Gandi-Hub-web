# Email System Documentation

## Overview
The Gandi Hub Rugby website uses EmailJS to handle email notifications for event reminders. The system sends two types of emails:
1. Immediate confirmation when a user sets a reminder
2. Reminder notification one day before the event

## EmailJS Configuration

### Credentials
The following EmailJS credentials are used:
- **Public Key**: `zV_N744b4DBmaQV04`
- **Service ID**: `service_22fih5l`
- **Template ID**: `template_d9r347j`

### Email Template
The email template includes:
- Event title
- Event details (date, time, location)
- Professional formatting with Gandi Hub Rugby branding
- Contact information
- Responsive design for mobile devices

## Implementation Details

### Files
- `events.html`: Contains EmailJS initialization
- `events.js`: Contains email sending logic and reminder functionality

### Key Functions

#### 1. Email Initialization
```javascript
emailjs.init("zV_N744b4DBmaQV04");
```

#### 2. Sending Emails
```javascript
async function sendEmail(to, subject, message) {
    try {
        const response = await emailjs.send(
            'service_22fih5l',
            'template_d9r347j',
            {
                to_email: to,
                subject: subject,
                message: message,
                from_name: 'Gandi Hub Rugby',
                reply_to: 'gandihubgo@gmail.com'
            }
        );
        // ... error handling
    }
}
```

#### 3. Setting Reminders
```javascript
async function saveReminder() {
    // Collects user email
    // Sends confirmation email
    // Schedules reminder email
    // Stores reminder in localStorage
}
```

## User Flow
1. User clicks "Set Reminder" on an event
2. Enters their email address
3. Receives immediate confirmation email
4. Gets reminder email one day before event

## Maintenance

### Updating EmailJS Credentials
To update EmailJS credentials:
1. Log in to [EmailJS Dashboard](https://dashboard.emailjs.com/)
2. Get new credentials
3. Update in:
   - `events.html`: Public Key
   - `events.js`: Service ID and Template ID

### Email Template Customization
The email template can be customized in the EmailJS dashboard:
1. Go to Email Templates
2. Edit `template_d9r347j`
3. Modify HTML/CSS while maintaining variables:
   - `{{subject}}`
   - `{{message}}`
   - `{{from_name}}`
   - `{{reply_to}}`

## Troubleshooting

### Common Issues
1. Emails not sending:
   - Check EmailJS credentials
   - Verify Gmail service connection
   - Check browser console for errors

2. Template issues:
   - Verify template variables
   - Check template ID
   - Test template in EmailJS dashboard

### Error Handling
The system includes:
- Loading states during email sending
- Error notifications for failed attempts
- Console logging for debugging
- Fallback to local storage for reminders

## Security Considerations
- Public credentials are restricted to email sending only
- Rate limiting is handled by EmailJS
- User emails are stored only for reminder purposes
- No sensitive data is transmitted in emails
