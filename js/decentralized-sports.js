// Decentralized Sports Ecosystem JavaScript

document.addEventListener('DOMContentLoaded', function() {
    console.log('Decentralized Sports Ecosystem JS loaded');
    
    // Initialize Firebase references
    const db = firebase.firestore();
    const auth = firebase.auth();
    
    // AI Chat Preview Functionality
    initAIChatPreview();
    
    // Initialize navigation
    initNavigation();
    
    // Check if user is logged in
    checkAuthState();
    
    /**
     * Initialize the AI Chat Preview
     */
    function initAIChatPreview() {
        const previewChatInput = document.getElementById('previewChatInput');
        const previewSendButton = document.getElementById('previewSendButton');
        const previewChatMessages = document.getElementById('previewChatMessages');
        
        if (!previewChatInput || !previewSendButton || !previewChatMessages) {
            console.warn('AI Chat Preview elements not found');
            return;
        }
        
        // Sample responses for the preview
        const sampleResponses = {
            'training': [
                "Based on your recent performance data, I recommend focusing on explosive power exercises. Here's a personalized program to improve your acceleration and sprint speed.",
                "Your tackling technique could be improved by focusing on your body position. I've analyzed your recent matches and noticed you tend to go too high in contact situations."
            ],
            'nutrition': [
                "For optimal recovery after intense training sessions, aim for a meal with a 3:1 carb-to-protein ratio within 30 minutes of finishing. This helps replenish glycogen stores faster.",
                "Hydration is key for rugby players. You should aim to drink at least 500ml of water 2 hours before training, and continue hydrating during and after sessions."
            ],
            'academic': [
                "I've analyzed your study patterns and training schedule. Here's a personalized study plan that works around your rugby commitments, focusing on spaced repetition for better retention.",
                "To balance academics and sports, try the Pomodoro technique: 25 minutes of focused study followed by a 5-minute break. This can help maximize your concentration during limited study time."
            ],
            'default': [
                "I can help with training plans, nutrition advice, academic balance, and more. What specific area would you like assistance with?",
                "As your AI assistant, I can provide personalized advice based on your performance data and academic needs. Could you tell me more about what you're looking for help with?"
            ]
        };
        
        // Send button click event
        previewSendButton.addEventListener('click', function() {
            sendPreviewMessage();
        });
        
        // Enter key press event
        previewChatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendPreviewMessage();
            }
        });
        
        /**
         * Send a message in the preview chat
         */
        function sendPreviewMessage() {
            const message = previewChatInput.value.trim();
            if (!message) return;
            
            // Add user message to chat
            addPreviewMessage(message, 'user');
            previewChatInput.value = '';
            
            // Determine response category based on message content
            let category = 'default';
            const lowerMessage = message.toLowerCase();
            
            if (lowerMessage.includes('train') || lowerMessage.includes('workout') || 
                lowerMessage.includes('exercise') || lowerMessage.includes('rugby') ||
                lowerMessage.includes('sprint') || lowerMessage.includes('strength')) {
                category = 'training';
            } else if (lowerMessage.includes('eat') || lowerMessage.includes('food') || 
                      lowerMessage.includes('nutrition') || lowerMessage.includes('diet') ||
                      lowerMessage.includes('protein') || lowerMessage.includes('meal')) {
                category = 'nutrition';
            } else if (lowerMessage.includes('study') || lowerMessage.includes('school') || 
                      lowerMessage.includes('class') || lowerMessage.includes('exam') ||
                      lowerMessage.includes('grade') || lowerMessage.includes('academic')) {
                category = 'academic';
            }
            
            // Get random response from appropriate category
            const responses = sampleResponses[category];
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            
            // Simulate AI thinking
            setTimeout(() => {
                addPreviewMessage(randomResponse, 'ai');
                
                // Add link to full AI chat after response
                const linkMessage = "For more detailed assistance, please visit our <a href='ai-chat.html'>full AI assistant</a>.";
                setTimeout(() => {
                    addPreviewMessage(linkMessage, 'ai');
                }, 1000);
            }, 1500);
        }
        
        /**
         * Add a message to the preview chat
         */
        function addPreviewMessage(content, sender) {
            const messageDiv = document.createElement('div');
            messageDiv.className = sender === 'user' ? 'user-message' : 'ai-message';
            
            if (sender === 'user') {
                messageDiv.innerHTML = `
                    <div class="message-content">
                        <p>${content}</p>
                    </div>
                `;
            } else {
                messageDiv.innerHTML = `
                    <div class="message-avatar">
                        <i class="bi bi-robot"></i>
                    </div>
                    <div class="message-content">
                        <p>${content}</p>
                    </div>
                `;
            }
            
            previewChatMessages.appendChild(messageDiv);
            previewChatMessages.scrollTop = previewChatMessages.scrollHeight;
        }
    }
    
    /**
     * Initialize navigation functionality
     */
    function initNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        const contentSections = document.querySelectorAll('.content-section');
        
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                const targetSection = this.getAttribute('data-section');
                
                // Update active nav link
                navLinks.forEach(navLink => {
                    navLink.classList.remove('active');
                });
                this.classList.add('active');
                
                // Show target section
                contentSections.forEach(section => {
                    section.classList.remove('active');
                });
                document.getElementById(`${targetSection}-content`).classList.add('active');
                
                // Close mobile sidebar if open
                const mobileSidebar = document.getElementById('mobileSidebar');
                const mobileOverlay = document.getElementById('mobileOverlay');
                if (window.innerWidth < 768 && mobileSidebar) {
                    mobileSidebar.style.left = '-250px';
                    if (mobileOverlay) mobileOverlay.style.display = 'none';
                }
            });
        });
    }
    
    /**
     * Check if user is authenticated
     */
    function checkAuthState() {
        auth.onAuthStateChanged(user => {
            if (user) {
                console.log('User is logged in:', user.uid);
                // You could load user-specific data here
                loadUserData(user.uid);
            } else {
                console.log('User is not logged in');
                // Handle not logged in state
            }
        });
    }
    
    /**
     * Load user-specific data
     */
    function loadUserData(userId) {
        // Example: Load user preferences or saved tokens
        db.collection('users').doc(userId).get()
            .then(doc => {
                if (doc.exists) {
                    const userData = doc.data();
                    console.log('User data loaded:', userData);
                    // Update UI with user data if needed
                } else {
                    console.log('No user data found');
                }
            })
            .catch(error => {
                console.error('Error loading user data:', error);
            });
    }
    
    /**
     * Utility function to show notifications
     */
    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="bi ${getIconForType(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="close-btn"><i class="bi bi-x"></i></button>
        `;
        
        // Add to document
        document.body.appendChild(notification);
        
        // Show with animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
        
        // Close button functionality
        const closeBtn = notification.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                notification.classList.remove('show');
                setTimeout(() => {
                    notification.remove();
                }, 300);
            });
        }
    }
    
    /**
     * Get icon class based on notification type
     */
    function getIconForType(type) {
        switch (type) {
            case 'success': return 'bi-check-circle-fill';
            case 'error': return 'bi-exclamation-triangle-fill';
            case 'warning': return 'bi-exclamation-circle-fill';
            case 'info':
            default: return 'bi-info-circle-fill';
        }
    }
});
