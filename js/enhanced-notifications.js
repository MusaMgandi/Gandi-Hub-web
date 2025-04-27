/**
 * Enhanced Notification System for Gandi-Hub
 * Features:
 * - Toast notifications with sound effects
 * - Interactive notification center
 * - Notification badges with animations
 * - Local storage integration
 * - Accessibility support
 */

// The notification sound system is now handled by notification-sounds.js
// This file will use the global notificationSounds object

// Toast notification system
function showToast(type, message, duration = 5000) {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // Limit the number of toasts to 3 at a time
    const existingToasts = toastContainer.querySelectorAll('.toast');
    if (existingToasts.length >= 3) {
        // Remove the oldest toast
        removeToast(existingToasts[0]);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    
    // Create toast content
    const toastContent = document.createElement('div');
    toastContent.className = 'toast-content';
    
    // Add appropriate icon based on type
    const icon = document.createElement('span');
    icon.className = 'toast-icon fas';
    switch (type) {
        case 'success':
            icon.classList.add('fa-check-circle');
            toast.setAttribute('aria-label', 'Success notification');
            break;
        case 'error':
            icon.classList.add('fa-exclamation-triangle');
            toast.setAttribute('aria-label', 'Error notification');
            break;
        case 'info':
            icon.classList.add('fa-info-circle');
            toast.setAttribute('aria-label', 'Information notification');
            break;
        case 'warning':
            icon.classList.add('fa-exclamation-circle');
            toast.setAttribute('aria-label', 'Warning notification');
            break;
        default:
            icon.classList.add('fa-bell');
            toast.setAttribute('aria-label', 'Notification');
    }
    
    // Create message element
    const messageEl = document.createElement('span');
    messageEl.className = 'toast-message';
    messageEl.textContent = message;
    
    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.setAttribute('aria-label', 'Close notification');
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeToast(toast);
    });
    
    // Create progress bar
    const progressBar = document.createElement('div');
    progressBar.className = 'toast-progress';
    progressBar.style.animationDuration = `${duration}ms`;
    
    // Assemble toast
    toastContent.appendChild(icon);
    toastContent.appendChild(messageEl);
    toast.appendChild(toastContent);
    toast.appendChild(closeBtn);
    toast.appendChild(progressBar);
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Play notification sound using the notification sounds module
    if (window.notificationSounds) {
        window.notificationSounds.play(type);
    }
    
    // Auto-remove after duration
    const timeoutId = setTimeout(() => {
        removeToast(toast);
    }, duration);
    
    // Store the timeout ID on the toast element
    toast._timeoutId = timeoutId;
    
    // Pause the progress bar and timeout on hover
    toast.addEventListener('mouseenter', () => {
        progressBar.style.animationPlayState = 'paused';
        clearTimeout(toast._timeoutId);
    });
    
    // Resume the progress bar and set a new timeout on mouse leave
    toast.addEventListener('mouseleave', () => {
        progressBar.style.animationPlayState = 'running';
        toast._timeoutId = setTimeout(() => removeToast(toast), 2000);
    });
    
    // Click to dismiss
    toast.addEventListener('click', (e) => {
        if (e.target !== closeBtn) {
            removeToast(toast);
        }
    });
    
    return toast;
}

function removeToast(toast) {
    if (!toast || !toast.parentNode) return;
    
    // Clear any existing timeout
    if (toast._timeoutId) {
        clearTimeout(toast._timeoutId);
    }
    
    // Add the removing class for animation
    toast.classList.add('removing');
    
    // Remove after animation completes
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 300);
}

// Sound functionality has been moved to notification-sounds.js

// Enhanced notification center
class NotificationCenter {
    constructor() {
        this.notifications = [];
        this.maxNotifications = 50; // Maximum number of notifications to store
        this.unreadCount = 0;
        this.initialized = false;
        
        // DOM elements
        this.notificationIcon = null;
        this.notificationBadge = null;
        this.notificationModal = null;
        this.notificationList = null;
        this.notificationEmpty = null;
        
        // Load notifications from localStorage
        this.loadFromStorage();
    }
    
    init() {
        if (this.initialized) return;
        
        // Get DOM elements
        this.notificationIcon = document.querySelector('.notification-icon');
        this.notificationBadge = document.querySelector('.notification-badge');
        this.notificationModal = document.querySelector('.notification-modal');
        this.notificationList = document.querySelector('.notification-list');
        this.notificationEmpty = document.querySelector('.notification-empty');
        
        // Setup event listeners if notification elements exist
        if (this.notificationIcon && this.notificationModal) {
            this.setupEventListeners();
            
            // Render notifications
            this.renderNotifications();
            
            // Update badge count
            this.updateBadgeCount();
        } else {
            console.log('Some notification UI elements not found - toast-only mode enabled');
        }
        
        this.initialized = true;
    }
    
    setupEventListeners() {
        // Toggle notification modal
        this.notificationIcon.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleNotificationModal();
        });
        
        // Close button
        const closeBtn = this.notificationModal.querySelector('.close-notification');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeNotificationModal();
            });
        }
        
        // Close when clicking outside
        this.notificationModal.addEventListener('click', (e) => {
            if (e.target === this.notificationModal) {
                this.closeNotificationModal();
            }
        });
        
        // Mark all as read button
        const markAllReadBtn = document.createElement('button');
        markAllReadBtn.className = 'mark-all-read';
        markAllReadBtn.textContent = 'Mark all as read';
        markAllReadBtn.addEventListener('click', () => {
            this.markAllAsRead();
        });
        
        // Clear all button
        const clearAllBtn = document.createElement('button');
        clearAllBtn.className = 'clear-all';
        clearAllBtn.textContent = 'Clear all';
        clearAllBtn.addEventListener('click', () => {
            this.clearAll();
        });
        
        // Add action buttons
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'notification-actions';
        actionsDiv.appendChild(markAllReadBtn);
        actionsDiv.appendChild(clearAllBtn);
        
        // Add to notification content
        const notificationContent = this.notificationModal.querySelector('.notification-content');
        notificationContent.appendChild(actionsDiv);
        
        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.notificationModal.classList.contains('active')) {
                this.closeNotificationModal();
            }
        });
    }
    
    toggleNotificationModal() {
        this.notificationModal.classList.toggle('active');
        
        // If opening, mark notifications as seen
        if (this.notificationModal.classList.contains('active')) {
            this.markAllAsSeen();
        }
    }
    
    closeNotificationModal() {
        this.notificationModal.classList.remove('active');
    }
    
    addNotification(type, title, message, options = {}) {
        const now = new Date();
        const time = options.time || this.formatTime(now);
        
        const notification = {
            id: Date.now().toString(),
            type,
            title,
            message,
            time,
            timestamp: now.getTime(),
            read: false,
            seen: false
        };
        
        // Add to beginning of array
        this.notifications.unshift(notification);
        
        // Limit the number of notifications
        if (this.notifications.length > this.maxNotifications) {
            this.notifications = this.notifications.slice(0, this.maxNotifications);
        }
        
        // Save to storage
        this.saveToStorage();
        
        // Only update UI if the notification elements exist
        if (this.notificationList) {
            // Update UI
            this.renderNotification(notification);
            this.updateBadgeCount();
            
            // Show empty state if needed
            if (this.notificationEmpty) {
                this.notificationEmpty.style.display = 'none';
            }
        }
        
        // Show toast if option is enabled
        if (options.showToast !== false) {
            showToast(type, title + ': ' + message);
        }
        
        return notification;
    }
    
    renderNotification(notification) {
        if (!this.notificationList) return;
        
        // Create notification item
        const notificationItem = document.createElement('li');
        notificationItem.className = 'notification-item';
        notificationItem.dataset.id = notification.id;
        
        if (!notification.read) {
            notificationItem.classList.add('unread');
        }
        
        // Create notification info
        const notificationInfo = document.createElement('div');
        notificationInfo.className = 'notification-info';
        
        // Create icon wrapper
        const iconWrapper = document.createElement('div');
        iconWrapper.className = `notification-icon-wrapper ${notification.type}`;
        
        // Create icon
        const icon = document.createElement('i');
        
        // Set icon based on notification type
        switch(notification.type) {
            case 'academic':
                icon.className = 'fas fa-graduation-cap';
                break;
            case 'training':
                icon.className = 'fas fa-dumbbell';
                break;
            case 'event':
                icon.className = 'fas fa-calendar-alt';
                break;
            case 'assignment':
                icon.className = 'fas fa-tasks';
                break;
            case 'profile':
                icon.className = 'fas fa-user-edit';
                break;
            case 'achievement':
                icon.className = 'fas fa-trophy';
                break;
            default:
                icon.className = 'fas fa-bell';
        }
        
        iconWrapper.appendChild(icon);
        
        // Create content wrapper
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'notification-content-wrapper';
        
        // Create title
        const titleElement = document.createElement('h4');
        titleElement.className = 'notification-title';
        titleElement.textContent = notification.title;
        
        // Create message
        const messageElement = document.createElement('p');
        messageElement.className = 'notification-message';
        messageElement.textContent = notification.message;
        
        // Create time
        const timeElement = document.createElement('p');
        timeElement.className = 'notification-time';
        timeElement.textContent = notification.time;
        
        // Assemble notification
        contentWrapper.appendChild(titleElement);
        contentWrapper.appendChild(messageElement);
        contentWrapper.appendChild(timeElement);
        
        notificationInfo.appendChild(iconWrapper);
        notificationInfo.appendChild(contentWrapper);
        
        notificationItem.appendChild(notificationInfo);
        
        // Add click event to mark as read
        notificationItem.addEventListener('click', () => {
            this.markAsRead(notification.id);
        });
        
        // Add to list
        if (this.notificationList.firstChild) {
            this.notificationList.insertBefore(notificationItem, this.notificationList.firstChild);
        } else {
            this.notificationList.appendChild(notificationItem);
        }
    }
    
    renderNotifications() {
        if (!this.notificationList) return;
        
        // Clear existing notifications
        while (this.notificationList.firstChild) {
            this.notificationList.removeChild(this.notificationList.firstChild);
        }
        
        // Render each notification
        this.notifications.forEach(notification => {
            this.renderNotification(notification);
        });
        
        // Show empty state if needed
        if (this.notificationEmpty) {
            this.notificationEmpty.style.display = this.notifications.length === 0 ? 'flex' : 'none';
        }
    }
    
    markAsRead(id) {
        const notification = this.notifications.find(n => n.id === id);
        if (!notification) return;
        
        notification.read = true;
        
        // Update UI
        const notificationItem = this.notificationList.querySelector(`[data-id="${id}"]`);
        if (notificationItem) {
            notificationItem.classList.remove('unread');
        }
        
        // Save to storage
        this.saveToStorage();
        
        // Update badge count
        this.updateBadgeCount();
    }
    
    markAllAsRead() {
        this.notifications.forEach(notification => {
            notification.read = true;
        });
        
        // Update UI
        const unreadItems = this.notificationList.querySelectorAll('.notification-item.unread');
        unreadItems.forEach(item => {
            item.classList.remove('unread');
        });
        
        // Save to storage
        this.saveToStorage();
        
        // Update badge count
        this.updateBadgeCount();
        
        // Show toast
        showToast('success', 'All notifications marked as read');
    }
    
    markAllAsSeen() {
        this.notifications.forEach(notification => {
            notification.seen = true;
        });
        
        // Save to storage
        this.saveToStorage();
        
        // Update badge animation
        if (this.notificationBadge) {
            this.notificationBadge.classList.remove('pulse');
        }
    }
    
    clearAll() {
        // Clear notifications
        this.notifications = [];
        
        // Save to storage
        this.saveToStorage();
        
        // Update UI
        this.renderNotifications();
        this.updateBadgeCount();
        
        // Show toast
        showToast('info', 'All notifications cleared');
    }
    
    updateBadgeCount() {
        if (!this.notificationBadge) return;
        
        // Count unread notifications
        const unreadCount = this.notifications.filter(n => !n.read).length;
        
        // Update badge
        this.notificationBadge.textContent = unreadCount;
        
        // Show/hide badge
        if (unreadCount > 0) {
            this.notificationBadge.style.display = 'flex';
            
            // Add pulse animation for new notifications
            const unseenCount = this.notifications.filter(n => !n.seen).length;
            if (unseenCount > 0) {
                this.notificationBadge.classList.add('pulse');
            }
        } else {
            this.notificationBadge.style.display = 'none';
        }
    }
    
    loadFromStorage() {
        try {
            const storedNotifications = localStorage.getItem('gandi_notifications');
            if (storedNotifications) {
                this.notifications = JSON.parse(storedNotifications);
            }
        } catch (e) {
            console.error('Error loading notifications from storage', e);
            this.notifications = [];
        }
    }
    
    saveToStorage() {
        try {
            localStorage.setItem('gandi_notifications', JSON.stringify(this.notifications));
        } catch (e) {
            console.error('Error saving notifications to storage', e);
        }
    }
    
    formatTime(date) {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        
        // Less than a minute
        if (diff < 60 * 1000) {
            return 'Just now';
        }
        
        // Less than an hour
        if (diff < 60 * 60 * 1000) {
            const minutes = Math.floor(diff / (60 * 1000));
            return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        }
        
        // Less than a day
        if (diff < 24 * 60 * 60 * 1000) {
            const hours = Math.floor(diff / (60 * 60 * 1000));
            return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        }
        
        // Less than a week
        if (diff < 7 * 24 * 60 * 60 * 1000) {
            const days = Math.floor(diff / (24 * 60 * 60 * 1000));
            return `${days} day${days !== 1 ? 's' : ''} ago`;
        }
        
        // Format as date
        return date.toLocaleDateString();
    }
}

// Create global notification center instance
const notificationCenter = new NotificationCenter();

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
    notificationCenter.init();
    
    // Add welcome notification if first visit
    if (!localStorage.getItem('gandi_visited')) {
        localStorage.setItem('gandi_visited', 'true');
        
        // Add with a slight delay for better UX
        setTimeout(() => {
            notificationCenter.addNotification(
                'achievement',
                'Welcome to Gandi-Hub',
                'We\'re excited to have you join our community. Explore all our features!',
                { showToast: true }
            );
        }, 1500);
    } else {
        // For returning users, load their existing notifications from storage
        // but don't add any new ones automatically
        console.log('Welcome back! Your notification history has been loaded.');
    }
});

// Export functions and objects
window.showToast = showToast;
window.notificationCenter = notificationCenter;
