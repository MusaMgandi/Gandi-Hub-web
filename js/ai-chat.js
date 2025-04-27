import { rugbyKnowledgeBase } from './ai-knowledge.js';
import { WELCOME_MESSAGE, responseEnhancers } from './chat-responses.js';

class SportMindAI {
    constructor() {
        // DOM Elements
        this.sidebar = document.querySelector('.sidebar');
        this.sidebarOverlay = document.querySelector('.sidebar-overlay');
        this.menuButton = document.querySelector('.menu-button');
        this.newChatButton = document.querySelector('.new-chat-button');
        this.newChatBtn = document.querySelector('.new-chat-btn');
        this.chatContainer = document.getElementById('chatContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.saveChatBtn = document.getElementById('saveChatBtn');
        this.clearChatBtn = document.getElementById('clearChatBtn');
        this.chatHistory = document.getElementById('chatHistory');
        this.savedChats = document.getElementById('savedChats');
        this.sidebarSections = document.querySelectorAll('.sidebar-section h3');
        
        // State
        this.currentChat = [];
        this.isProcessing = false;
        this.isListening = false;
        this.speechRecognition = null;
        this.recentChats = [];
        this.conversationContext = {
            userPreferences: {},
            recentTopics: [],
            sessionStartTime: new Date(),
            messageCount: 0,
            lastInteractionTime: new Date()
        };
        
        // Initialize Firestore
        this.initFirestore();
        
        // Initialize speech recognition
        this.initSpeechRecognition();
        
        // Add Gemini API configuration
        this.GEMINI_API_KEY = 'AIzaSyAzdC0e5zl99HCQ6VGsWzEm61V_ef3VZJI';
        this.GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
        
        // Initialize
        this.initEventListeners();
        this.initSidebarSections();
        this.loadChatHistory();
        this.setupTextareaResize();
        this.fixMobileInput();
        this.initSettingsToggle();
        
        // Add welcome message
        if (this.chatContainer && this.chatContainer.children.length === 0) {
            this.addMessage(this.getWelcomeMessage(), 'ai');
        }

        this.db = firebase.firestore();
        this.loadRecentChats();
    }
    
    initSidebarSections() {
        // Set up collapsible sidebar sections
        this.sidebarSections.forEach(heading => {
            const sectionId = heading.textContent.trim().toLowerCase().replace(/\s+/g, '-');
            const contentContainer = heading.nextElementSibling;
            
            // Show settings by default, collapse others
            if (heading.textContent.includes('Settings')) {
                contentContainer.classList.add('show');
            } else {
                heading.classList.add('collapsed');
            }
            
            // Add click event to toggle section
            heading.addEventListener('click', () => {
                heading.classList.toggle('collapsed');
                contentContainer.classList.toggle('show');
            });
        });
    }
    
    initFirestore() {
        try {
            // Check if Firebase is initialized
            if (typeof firebase !== 'undefined' && firebase.apps.length) {
                this.db = firebase.firestore();
                console.log('Firestore initialized successfully');
            } else {
                console.error('Firebase is not initialized');
                this.showToast('Could not connect to the database. Some features may not work.', 'error');
            }
        } catch (error) {
            console.error('Firestore initialization error:', error);
            this.showToast('Database connection error. Using local storage instead.', 'warning');
        }
    }
    
    initSpeechRecognition() {
        if ('webkitSpeechRecognition' in window) {
            this.speechRecognition = new webkitSpeechRecognition();
            this.speechRecognition.continuous = false;
            this.speechRecognition.interimResults = false;
            this.speechRecognition.lang = 'en-US';
            
            this.speechRecognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                if (this.messageInput) {
                    this.messageInput.value = transcript;
                    this.resizeTextarea(this.messageInput);
                }
            };
            
            this.speechRecognition.onend = () => {
                this.isListening = false;
                if (this.voiceButton) {
                    this.voiceButton.classList.remove('listening');
                    this.voiceButton.innerHTML = '<i class="bi bi-mic"></i>';
                    this.voiceButton.style.animation = '';
                }
            };
            
            this.speechRecognition.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                this.isListening = false;
                if (this.voiceButton) {
                    this.voiceButton.classList.remove('listening');
                    this.voiceButton.innerHTML = '<i class="bi bi-mic"></i>';
                    this.voiceButton.style.animation = '';
                    
                    // Show error message and provide help for common errors
                    if (event.error === 'not-allowed') {
                        this.showToast('Microphone access denied. To fix this:<br>1. Click the lock/info icon in your address bar<br>2. Allow microphone access<br>3. Refresh the page', 'error', 6000);
                    } else if (event.error === 'no-speech') {
                        this.showToast('No speech detected. Please try speaking louder or check your microphone.', 'warning');
                    } else if (event.error === 'network') {
                        this.showToast('Network error. Please check your internet connection.', 'error');
                    } else {
                        this.showToast(`Speech recognition error: ${event.error}. Please try again.`, 'error');
                    }
                }
            };
        } else {
            console.warn('Speech Recognition not supported in this browser');
        }
    }
    
    addVoiceInputButton() {
        // Use the existing voice button in the HTML
        this.voiceButton = document.querySelector('.voice-input-button');
        
        if (this.voiceButton) {
            // Add click event listener
            this.voiceButton.addEventListener('click', () => this.toggleVoiceInput());
            
            // Add hover effect
            this.voiceButton.addEventListener('mouseover', () => {
                this.voiceButton.style.transform = 'scale(1.1)';
            });
            this.voiceButton.addEventListener('mouseout', () => {
                this.voiceButton.style.transform = 'scale(1)';
            });
        }
    }
    
    toggleVoiceInput() {
        if (!this.speechRecognition) {
            this.showToast('Speech recognition is not supported in your browser.', 'error');
            return;
        }
        
        if (this.isListening) {
            this.speechRecognition.stop();
            this.isListening = false;
            this.voiceButton.classList.remove('listening');
            this.voiceButton.innerHTML = '<i class="bi bi-mic"></i>';
            this.voiceButton.style.animation = '';
        } else {
            // Request microphone permission first
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(() => {
                    // Permission granted, proceed with speech recognition
                    this.startSpeechRecognition();
                })
                .catch(error => {
                    console.error('Microphone permission denied:', error);
                    this.showToast('Microphone access denied. To fix this:<br>1. Click the lock/info icon in your address bar<br>2. Allow microphone access<br>3. Refresh the page', 'error', 6000);
                });
        }
    }
    
    startSpeechRecognition() {
        // Show listening animation
        this.voiceButton.classList.add('listening');
        this.voiceButton.innerHTML = '<i class="bi bi-mic-fill"></i>';
        
        // Add pulsing animation
        this.voiceButton.style.animation = 'pulse 1.5s infinite';
        
        // Show toast notification
        this.showToast('Listening... Speak now.', 'info');
        
        // Start listening
        try {
            this.speechRecognition.start();
            this.isListening = true;
            
            // Auto-send after speech recognition if enabled
            if (this.conversationContext.userPreferences.autoSendVoice) {
                this.speechRecognition.onend = () => {
                    this.isListening = false;
                    this.voiceButton.classList.remove('listening');
                    this.voiceButton.innerHTML = '<i class="bi bi-mic"></i>';
                    this.voiceButton.style.animation = '';
                    
                    // Auto-send if there's content and it's not too short
                    if (this.messageInput && this.messageInput.value.trim().length > 3) {
                        setTimeout(() => this.sendMessage(), 500);
                    }
                };
            }
        } catch (error) {
            console.error('Speech recognition error', error);
            this.showToast('Could not start speech recognition. Please try again.', 'error');
            this.isListening = false;
            this.voiceButton.classList.remove('listening');
            this.voiceButton.innerHTML = '<i class="bi bi-mic"></i>';
            this.voiceButton.style.animation = '';
        }
    }
    
    sendMessage() {
        if (this.isProcessing) return;
        
        // Make sure we have the message input element
        if (!this.messageInput) {
            this.messageInput = document.getElementById('messageInput');
            if (!this.messageInput) return;
        }
        
        const message = this.messageInput.value.trim();
        if (!message) return;
        
        // Update conversation context
        this.updateConversationContext(message);
        
        // Add user message to chat
        this.addMessage(message, 'user');
        
        // Clear input and resize
        this.messageInput.value = '';
        this.resizeTextarea(this.messageInput);
        this.messageInput.focus();
        
        // Show typing indicator
        this.showTypingIndicator();
        
        // Set processing flag
        this.isProcessing = true;
        
        // Process the message and get AI response
        this.generateResponse(message);
        
        // Scroll to bottom
        this.scrollToBottom('smooth');
    }
    
    updateConversationContext(message) {
        // Update message count and last interaction time
        this.conversationContext.messageCount++;
        this.conversationContext.lastInteractionTime = new Date();
        
        // Extract topic from message (simple implementation)
        const topics = {
            training: ['train', 'workout', 'exercise', 'fitness', 'strength', 'cardio'],
            nutrition: ['food', 'eat', 'diet', 'nutrition', 'meal', 'protein'],
            recovery: ['recover', 'rest', 'sleep', 'injury', 'sore', 'pain'],
            technique: ['technique', 'skill', 'form', 'drill', 'practice'],
            competition: ['game', 'match', 'competition', 'tournament', 'play'],
            mental: ['mental', 'focus', 'psychology', 'mindset', 'stress', 'anxiety']
        };
        
        const lowerMessage = message.toLowerCase();
        let context = { topic: 'general' };
        
        // Check if message contains any topic keywords
        for (const [topic, keywords] of Object.entries(topics)) {
            if (keywords.some(keyword => lowerMessage.includes(keyword))) {
                context.topic = topic;
                break;
            }
        }
        
        // Add to recent topics (max 5, most recent first)
        this.conversationContext.recentTopics.unshift(context.topic);
        this.conversationContext.recentTopics = [...new Set(this.conversationContext.recentTopics)].slice(0, 5);
        
        // Extract potential preferences
        this.extractUserPreferences(message);
        
        // Create a chat message object
        const chatMessage = {
            text: message,
            type: 'user',
            timestamp: new Date().toISOString()
        };
        
        // Add to current chat
        this.currentChat.push(chatMessage);
        
        // Save current chat to localStorage
        localStorage.setItem('currentChat', JSON.stringify(this.currentChat));
        
        // Update recent chats
        this.updateRecentChats();
    }
    
    extractUserPreferences(message) {
        const lowerMessage = message.toLowerCase();
        
        // Extract position preference
        const positionMatches = lowerMessage.match(/\b(prop|hooker|lock|flanker|number 8|scrum half|fly half|center|wing|fullback)\b/i);
        if (positionMatches) {
            this.conversationContext.userPreferences.position = positionMatches[0];
        }
        
        // Extract training preference
        if (lowerMessage.includes('prefer') || lowerMessage.includes('like') || lowerMessage.includes('enjoy')) {
            if (lowerMessage.includes('morning')) {
                this.conversationContext.userPreferences.trainingTime = 'morning';
            } else if (lowerMessage.includes('evening') || lowerMessage.includes('night')) {
                this.conversationContext.userPreferences.trainingTime = 'evening';
            }
            
            if (lowerMessage.includes('strength') || lowerMessage.includes('weights')) {
                this.conversationContext.userPreferences.trainingType = 'strength';
            } else if (lowerMessage.includes('cardio') || lowerMessage.includes('running')) {
                this.conversationContext.userPreferences.trainingType = 'cardio';
            } else if (lowerMessage.includes('skills') || lowerMessage.includes('technique')) {
                this.conversationContext.userPreferences.trainingType = 'skills';
            }
        }
        
        // Save preferences
        localStorage.setItem('userPreferences', JSON.stringify(this.conversationContext.userPreferences));
    }
    
    loadUserPreferences() {
        // Try to load from Firestore first
        if (this.db) {
            this.db.collection('userPreferences').doc('current').get()
                .then(doc => {
                    if (doc.exists) {
                        this.conversationContext.userPreferences = doc.data();
                        this.updateSettingsUI();
                    } else {
                        // Fallback to localStorage
                        this.loadPreferencesFromLocalStorage();
                    }
                })
                .catch(error => {
                    console.error('Error loading preferences from Firestore:', error);
                    // Fallback to localStorage
                    this.loadPreferencesFromLocalStorage();
                });
        } else {
            // Fallback to localStorage
            this.loadPreferencesFromLocalStorage();
        }
        
        // Load current chat if exists
        const currentChat = localStorage.getItem('currentChat');
        if (currentChat) {
            this.currentChat = JSON.parse(currentChat);
            
            // Render the chat
            this.renderChat();
        }
    }
    
    loadPreferencesFromLocalStorage() {
        const savedPreferences = localStorage.getItem('userPreferences');
        if (savedPreferences) {
            this.conversationContext.userPreferences = JSON.parse(savedPreferences);
            this.updateSettingsUI();
        }
    }
    
    updateSettingsUI() {
        // Update UI elements with loaded preferences
        const textToSpeechCheckbox = document.getElementById('textToSpeech');
        const autoSendVoiceCheckbox = document.getElementById('autoSendVoice');
        const positionSelect = document.getElementById('position');
        
        if (textToSpeechCheckbox) {
            textToSpeechCheckbox.checked = this.conversationContext.userPreferences.textToSpeech || false;
        }
        
        if (autoSendVoiceCheckbox) {
            autoSendVoiceCheckbox.checked = this.conversationContext.userPreferences.autoSendVoice || false;
        }
        
        if (positionSelect && this.conversationContext.userPreferences.position) {
            positionSelect.value = this.conversationContext.userPreferences.position;
        }
    }
    
    toggleSidebar() {
        if (this.sidebar) {
            this.sidebar.classList.toggle('show');
        }
        if (this.sidebarOverlay) {
            this.sidebarOverlay.classList.toggle('show');
        }
    }
    
    async startNewChat() {
        if (this.currentChat.length > 0) {
            // Save current chat to Firestore
            try {
                const chatPreview = this.currentChat[0]?.text?.slice(0, 30) || 'New Chat';
                await this.db.collection('recentChats').add({
                    preview: chatPreview + '...',
                    messages: this.currentChat,
                    date: new Date().toISOString(),
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                // Remove oldest chat if more than 5 exist
                const snapshots = await this.db.collection('recentChats')
                    .orderBy('timestamp', 'desc')
                    .get();
                
                if (snapshots.size > 5) {
                    const lastDoc = snapshots.docs[snapshots.size - 1];
                    await this.db.collection('recentChats').doc(lastDoc.id).delete();
                }
            } catch (error) {
                console.error('Error saving chat:', error);
            }
        }

        this.currentChat = [];
        if (this.chatContainer) {
            this.chatContainer.innerHTML = '';
        }
        this.addMessage(this.getWelcomeMessage(), 'ai');
        this.loadRecentChats(); // Refresh the recent chats list
    }

    async loadRecentChats() {
        try {
            const chatHistory = document.getElementById('chatHistory');
            if (!chatHistory) return;

            const snapshot = await this.db.collection('recentChats')
                .orderBy('timestamp', 'desc')
                .limit(5)
                .get();

            chatHistory.innerHTML = '';
            
            snapshot.forEach(doc => {
                const chat = doc.data();
                const div = document.createElement('div');
                div.className = 'chat-item';
                div.innerHTML = `
                    <i class="bi bi-chat-text"></i>
                    <span>${chat.preview}</span>
                    <small>${new Date(chat.date).toLocaleDateString()}</small>
                `;
                div.addEventListener('click', () => this.loadChat(doc.id, chat.messages));
                chatHistory.appendChild(div);
            });

        } catch (error) {
            console.error('Error loading recent chats:', error);
        }
    }

    async loadChat(chatId, messages) {
        this.currentChat = messages;
        this.renderChat();
    }

    renderChat() {
        if (this.chatContainer) {
            this.chatContainer.innerHTML = ''; // Clear existing messages
        }
        
        // Add welcome message if chat is empty
        if (this.currentChat.length === 0) {
            this.addMessage(this.getWelcomeMessage(), 'ai');
            return;
        }
        
        // Render all messages in current chat
        this.currentChat.forEach(message => {
            this.renderMessage(message);
        });
        
        this.scrollToBottom();
    }
    
    scrollToBottom(behavior = 'auto') {
        const lastMessage = this.chatContainer.lastElementChild;
        if (lastMessage) {
            setTimeout(() => {
                lastMessage.scrollIntoView({
                    behavior: 'smooth',
                    block: 'end'
                });
            }, 100); // Small delay to ensure content is rendered
        }
    }

    addMessage(text, sender) {
        this.removeTypingIndicator();
        
        const message = {
            id: Date.now(),
            text,
            sender,
            timestamp: new Date().toISOString()
        };
        
        this.currentChat.push(message);
        this.renderMessage(message);
        
        // Enhanced scrolling for new messages
        if (sender === 'ai') {
            this.scrollToBottom();
            // Highlight new message briefly
            const lastMessage = this.chatContainer.lastElementChild;
            lastMessage.style.transition = 'background-color 0.5s ease';
            lastMessage.style.backgroundColor = 'rgba(0, 119, 190, 0.1)';
            setTimeout(() => {
                lastMessage.style.backgroundColor = 'transparent';
            }, 1000);
        }
    }

    renderMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.sender}-message`;
        
        const timeString = new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        messageDiv.innerHTML = `
            <div class="avatar ${message.sender}-avatar">
                ${message.sender === 'ai' ? 
                    '<i class="bi bi-robot"></i>' : 
                    '<img src="/images/rugby16.jpg?v=1" alt="User">'}
            </div>
            <div class="message-content">
                <div class="message-text">${this.formatMessage(message.text)}</div>
                <div class="message-time">${timeString}</div>
            </div>
        `;
        
        if (this.chatContainer) {
            this.chatContainer.appendChild(messageDiv);
        }
    }
    
    formatMessage(text) {
        // Convert markdown-like formatting to HTML
        let formatted = text
            .replace(/```([a-z]*)\n([\s\S]*?)\n```/g, '<pre><code class="$1">$2</code></pre>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^*]+)\*/g, '<em>$1</em>')
            .replace(/- (.*)/g, '<li>$1</li>')
            .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>')
            .replace(/\n/g, '<br>');
        
        // If we have list items, wrap them in a ul
        if (formatted.includes('<li>')) {
            formatted = formatted.replace(/<li>.*<\/li>/g, match => {
                return `<ul>${match}</ul>`;
            });
        }
        
        return formatted;
    }
    
    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message ai-message typing-indicator';
        typingDiv.innerHTML = `
            <div class="avatar ai-avatar">
                <i class="bi bi-robot"></i>
            </div>
            <div class="message-content">
                <div class="message-text">
                    <div class="typing-animation" role="status" aria-label="AI is typing">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        `;
        
        this.removeTypingIndicator();
        if (this.chatContainer) {
            this.chatContainer.appendChild(typingDiv);
        }
        this.scrollToBottom();

        // Remove typing indicator after maximum time
        setTimeout(() => this.removeTypingIndicator(), 10000);
        return typingDiv;
    }
    
    removeTypingIndicator() {
        const typingIndicator = document.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    async generateResponse(userMessage) {
        try {
            const response = await fetch(`${this.GEMINI_API_URL}?key=${this.GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `You are SportMindAI, an AI assistant specialized in rugby and sports training. 
                                  Consider this user message and respond appropriately: ${userMessage}`
                        }]
                    }]
                })
            });

            if (!response.ok) {
                throw new Error('Gemini API request failed');
            }

            const data = await response.json();
            let aiResponse = data.candidates[0].content.parts[0].text;

            // Format and enhance the response
            aiResponse = responseEnhancers.enhanceResponse(userMessage, aiResponse);

            // Remove typing indicator and add AI response
            setTimeout(() => {
                this.removeTypingIndicator();
                this.addMessage(aiResponse, 'ai');
                this.scrollToBottom('smooth');
                this.isProcessing = false;

                // Speak response if text-to-speech is enabled
                if (this.conversationContext.userPreferences.textToSpeech) {
                    this.speakResponse(this.stripHtmlTags(aiResponse));
                }
            }, 800);

        } catch (error) {
            console.error('Error generating response:', error);
            this.removeTypingIndicator();
            this.addMessage("I apologize, but I'm having trouble connecting right now. Please try again later.", 'ai');
            this.isProcessing = false;
        }
    }
    
    setupTextareaResize() {
        if (this.messageInput) {
            const textarea = this.messageInput;
            
            // Initial resize
            this.resizeTextarea(textarea);
            
            // Add event listeners for resize
            textarea.addEventListener('input', () => this.resizeTextarea(textarea));
            textarea.addEventListener('focus', () => this.resizeTextarea(textarea));
            textarea.addEventListener('change', () => this.resizeTextarea(textarea));
        }
    }
    
    resizeTextarea(textarea) {
        if (!textarea) textarea = this.messageInput;
        if (!textarea) return;
        
        // Reset height to calculate proper scrollHeight
        textarea.style.height = 'auto';
        
        // Set to scrollHeight
        textarea.style.height = textarea.scrollHeight + 'px';
        
        // Limit max height
        const maxHeight = 120; // pixels
        if (textarea.scrollHeight > maxHeight) {
            textarea.style.height = maxHeight + 'px';
            textarea.style.overflowY = 'auto';
        } else {
            textarea.style.overflowY = 'hidden';
        }
    }

    fixMobileInput() {
        // We're now using CSS for styling the input
        // This method is kept for backward compatibility
        if (this.messageInput) {
            this.messageInput.style.fontSize = '16px'; // Prevents iOS zoom
            this.messageInput.style.maxHeight = '120px';
            this.messageInput.style.overflowY = 'auto';
        }
    }

    updateRecentChats() {
        const chatHistory = document.getElementById('chatHistory');
        if (!chatHistory) return;

        const recentChats = JSON.parse(localStorage.getItem('recentChats') || '[]');
        
        chatHistory.innerHTML = recentChats.map(chat => `
            <div class="chat-item" data-chat-id="${chat.id}">
                <i class="bi bi-chat-text"></i>
                <span>${chat.preview}</span>
                <small>${new Date(chat.date).toLocaleDateString()}</small>
            </div>
        `).join('');

        // Add click handlers for recent chats
        chatHistory.querySelectorAll('.chat-item').forEach(item => {
            item.addEventListener('click', () => {
                const chatId = item.dataset.chatId;
                const chat = recentChats.find(c => c.id === parseInt(chatId));
                if (chat) {
                    this.loadChat(chat.messages);
                }
            });
        });
    }

    confirmClearChat() {
        if (this.currentChat.length === 0) return;
        
        if (confirm('Are you sure you want to clear this chat?')) {
            this.currentChat = [];
            if (this.chatContainer) {
                this.chatContainer.innerHTML = '';
            }
            // Re-add welcome message
            this.addMessage(this.getWelcomeMessage(), 'ai');
        }
    }

    getWelcomeMessage() {
        return WELCOME_MESSAGE.text;
    }

    loadChatHistory() {
        // Load recent chats
        this.recentChats = JSON.parse(localStorage.getItem('recentChats') || '[]');
        this.updateRecentChatsUI();
        
        // Try to load saved chats from Firestore first
        if (this.db) {
            this.db.collection('chats')
                .orderBy('lastUpdated', 'desc')
                .limit(20)
                .get()
                .then(snapshot => {
                    if (snapshot.empty) {
                        console.log('No saved chats found in Firestore');
                        // Fallback to localStorage if no chats in Firestore
                        const savedChats = JSON.parse(localStorage.getItem('savedChats') || '[]');
                        this.updateSavedChats(savedChats);
                    } else {
                        const chats = [];
                        snapshot.forEach(doc => {
                            chats.push(doc.data());
                        });
                        this.updateSavedChats(chats);
                    }
                })
                .catch(error => {
                    console.error('Error loading chats from Firestore:', error);
                    // Fallback to localStorage
                    const savedChats = JSON.parse(localStorage.getItem('savedChats') || '[]');
                    this.updateSavedChats(savedChats);
                });
        } else {
            // Fallback to localStorage
            const savedChats = JSON.parse(localStorage.getItem('savedChats') || '[]');
            this.updateSavedChats(savedChats);
        }
    }
    
    updateRecentChatsUI() {
        if (!this.chatHistory) return;
        
        if (!this.recentChats || this.recentChats.length === 0) {
            this.chatHistory.innerHTML = `<div class="no-chats">No recent chats</div>`;
            return;
        }
        
        this.chatHistory.innerHTML = this.recentChats
            .map(chat => {
                const date = new Date(chat.date);
                const formattedDate = date.toLocaleDateString(undefined, { 
                    month: 'short', 
                    day: 'numeric'
                });
                
                return `
                    <div class="chat-item" data-chat-id="${chat.id}">
                        <div class="chat-item-content">
                            <i class="bi bi-chat-dots"></i>
                            <span class="chat-title">${chat.title}</span>
                        </div>
                        <div class="chat-item-date">${formattedDate}</div>
                    </div>
                `;
            })
            .join('');
        
        // Add event listeners to chat items
        const chatItems = this.chatHistory.querySelectorAll('.chat-item');
        chatItems.forEach(item => {
            item.addEventListener('click', () => {
                const chatId = item.getAttribute('data-chat-id');
                this.loadRecentChat(chatId);
            });
        });
    }
    
    loadRecentChat(chatId) {
        const chat = this.recentChats.find(c => c.id === chatId);
        if (!chat) {
            this.showToast('Chat not found', 'error');
            return;
        }
        
        // Clear current chat
        this.currentChat = [];
        this.chatContainer.innerHTML = '';
        
        // Load messages
        chat.messages.forEach(message => {
            this.addMessage(message.text, message.type || message.sender);
        });
        
        // Close sidebar on mobile
        if (window.innerWidth < 992) {
            this.toggleSidebar();
        }
        
        this.showToast(`Loaded chat: ${chat.title}`, 'success');
    }

    updateSavedChats(chats) {
        if (!this.savedChats) return;
        
        if (!chats || chats.length === 0) {
            this.savedChats.innerHTML = `<div class="no-chats">No saved chats yet</div>`;
            return;
        }
        
        // Sort chats by date (newest first)
        chats.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        this.savedChats.innerHTML = chats
            .map(chat => {
                const date = new Date(chat.date);
                const formattedDate = date.toLocaleDateString(undefined, { 
                    month: 'short', 
                    day: 'numeric',
                    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                });
                
                return `
                    <div class="chat-item" data-chat-id="${chat.id}">
                        <div class="chat-item-content">
                            <i class="bi bi-chat-text"></i>
                            <span class="chat-title">${chat.title}</span>
                        </div>
                        <div class="chat-item-date">${formattedDate}</div>
                    </div>
                `;
            })
            .join('');
        
        // Add event listeners to chat items
        const chatItems = this.savedChats.querySelectorAll('.chat-item');
        chatItems.forEach(item => {
            item.addEventListener('click', () => {
                const chatId = item.getAttribute('data-chat-id');
                this.loadSavedChat(chatId, chats);
            });
        });
    }
    
    loadSavedChat(chatId, chats) {
        // Find the chat in the provided chats array or fetch from storage
        let chat;
        
        if (chats) {
            chat = chats.find(c => c.id == chatId);
        }
        
        if (!chat && this.db) {
            // Try to load from Firestore
            this.showToast('Loading chat...', 'info');
            
            this.db.collection('chats').doc(chatId).get()
                .then(doc => {
                    if (doc.exists) {
                        this.displaySavedChat(doc.data());
                    } else {
                        this.showToast('Chat not found', 'error');
                    }
                })
                .catch(error => {
                    console.error('Error loading chat from Firestore:', error);
                    this.showToast('Failed to load chat', 'error');
                    
                    // Try localStorage as fallback
                    const savedChats = JSON.parse(localStorage.getItem('savedChats') || '[]');
                    const localChat = savedChats.find(c => c.id == chatId);
                    if (localChat) {
                        this.displaySavedChat(localChat);
                    }
                });
        } else if (chat) {
            this.displaySavedChat(chat);
        } else {
            // Try localStorage as last resort
            const savedChats = JSON.parse(localStorage.getItem('savedChats') || '[]');
            const localChat = savedChats.find(c => c.id == chatId);
            if (localChat) {
                this.displaySavedChat(localChat);
            } else {
                this.showToast('Chat not found', 'error');
            }
        }
    }
    
    displaySavedChat(chat) {
        if (!chat || !chat.messages || !this.chatContainer) return;
        
        // Clear current chat
        this.currentChat = [];
        this.chatContainer.innerHTML = '';
        
        // Load messages
        chat.messages.forEach(message => {
            this.addMessage(message.text, message.sender || message.type);
        });
        
        // Close sidebar on mobile
        if (window.innerWidth < 992) {
            this.toggleSidebar();
        }
        
        this.showToast(`Loaded chat: ${chat.title}`, 'success');
    }

    handleResize() {
        if (window.innerWidth >= 992) {
            if (this.sidebar) {
                this.sidebar.classList.remove('show');
            }
            if (this.sidebarOverlay) {
                this.sidebarOverlay.classList.remove('show');
            }
        }
    }
    
    speakResponse(text) {
        if (!('speechSynthesis' in window)) {
            console.warn('Text-to-speech not supported in this browser');
            return;
        }
        
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        // Create a new speech synthesis utterance
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Set voice preferences
        utterance.rate = 1.0; // Speed of speech (0.1 to 10)
        utterance.pitch = 1.0; // Pitch of speech (0 to 2)
        utterance.volume = 1.0; // Volume (0 to 1)
        
        // Get available voices and set a good English voice if available
        let voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) {
            // Voice list might not be loaded yet, wait and try again
            window.speechSynthesis.onvoiceschanged = () => {
                voices = window.speechSynthesis.getVoices();
                this.setPreferredVoice(utterance, voices);
                window.speechSynthesis.speak(utterance);
            };
        } else {
            this.setPreferredVoice(utterance, voices);
            window.speechSynthesis.speak(utterance);
        }
    }
    
    setPreferredVoice(utterance, voices) {
        // Try to find a good English voice
        const preferredVoices = [
            'Google UK English Male',
            'Google UK English Female',
            'Microsoft David - English (United States)',
            'Microsoft Zira - English (United States)',
            'Alex'  // macOS voice
        ];
        
        // Try to match preferred voices
        for (const preferredVoice of preferredVoices) {
            const voice = voices.find(v => v.name === preferredVoice);
            if (voice) {
                utterance.voice = voice;
                return;
            }
        }
        
        // Fallback to any English voice
        const englishVoice = voices.find(v => v.lang.includes('en-'));
        if (englishVoice) {
            utterance.voice = englishVoice;
        }
    }
    
    stripHtmlTags(html) {
        // Create a temporary element
        const tempElement = document.createElement('div');
        tempElement.innerHTML = html;
        
        // Get text content
        return tempElement.textContent || tempElement.innerText || '';
    }
    
    showToast(message, type = 'info', duration = 3000) {
        // Create toast container if it doesn't exist
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            toastContainer.style.position = 'fixed';
            toastContainer.style.bottom = '20px';
            toastContainer.style.right = '20px';
            toastContainer.style.zIndex = '9999';
            document.body.appendChild(toastContainer);
        }
        
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = message;
        
        // Style the toast
        toast.style.backgroundColor = type === 'error' ? '#f44336' : 
                                     type === 'success' ? '#4CAF50' : 
                                     type === 'warning' ? '#ff9800' : '#2196F3';
        toast.style.color = '#fff';
        toast.style.padding = '12px 20px';
        toast.style.marginBottom = '10px';
        toast.style.borderRadius = '4px';
        toast.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        
        // Add progress bar
        const progressBar = document.createElement('div');
        progressBar.className = 'toast-progress';
        progressBar.style.position = 'absolute';
        progressBar.style.bottom = '0';
        progressBar.style.left = '0';
        progressBar.style.height = '3px';
        progressBar.style.width = '0%';
        progressBar.style.backgroundColor = 'rgba(255,255,255,0.7)';
        progressBar.style.transition = `width ${duration}ms linear`;
        toast.style.position = 'relative';
        toast.appendChild(progressBar);
        
        // Add to container
        toastContainer.appendChild(toast);
        
        // Show the toast with animation
        setTimeout(() => {
            toast.style.opacity = '1';
            progressBar.style.width = '100%';
        }, 10);
        
        // Remove after duration
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, duration);
    }
    
    initSettings() {
        // Load user preferences
        this.loadUserPreferences();
        
        // Set up settings in the sidebar
        const saveSettingsBtn = document.getElementById('saveSettings');
        const textToSpeechCheckbox = document.getElementById('textToSpeech');
        const autoSendVoiceCheckbox = document.getElementById('autoSendVoice');
        const positionSelect = document.getElementById('position');
        
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        }
        
        // Set initial values based on saved preferences
        if (textToSpeechCheckbox) {
            textToSpeechCheckbox.checked = this.conversationContext.userPreferences.textToSpeech || false;
        }
        
        if (autoSendVoiceCheckbox) {
            autoSendVoiceCheckbox.checked = this.conversationContext.userPreferences.autoSendVoice || false;
        }
        
        if (positionSelect && this.conversationContext.userPreferences.position) {
            positionSelect.value = this.conversationContext.userPreferences.position;
        }
    }
    
    saveSettings() {
        // Get settings values from the sidebar
        const textToSpeech = document.getElementById('textToSpeech')?.checked || false;
        const autoSendVoice = document.getElementById('autoSendVoice')?.checked || false;
        const position = document.getElementById('position')?.value || '';
        
        // Update conversation context
        this.conversationContext.userPreferences.textToSpeech = textToSpeech;
        this.conversationContext.userPreferences.autoSendVoice = autoSendVoice;
        if (position) {
            this.conversationContext.userPreferences.position = position;
        }
        
        // Save to localStorage
        localStorage.setItem('userPreferences', JSON.stringify(this.conversationContext.userPreferences));
        
        // Save to Firestore if available
        if (this.db) {
            this.db.collection('userPreferences').doc('current')
                .set(this.conversationContext.userPreferences)
                .then(() => {
                    console.log('Settings saved to Firestore');
                })
                .catch(error => {
                    console.error('Error saving settings to Firestore:', error);
                });
        }
        
        // Show confirmation
        this.showToast('Settings saved successfully', 'success');
        
        // Close sidebar on mobile
        if (window.innerWidth < 992) {
            this.toggleSidebar();
        }
    }
    
    initSettingsToggle() {
        const settingsHeader = document.querySelector('.sidebar-section h3:has(i.bi-gear)');
        const settingsContainer = document.querySelector('.settings-container');
        
        if (settingsHeader && settingsContainer) {
            // Hide settings initially
            settingsContainer.classList.remove('show');
            
            settingsHeader.addEventListener('click', () => {
                settingsContainer.classList.toggle('show');
                settingsHeader.classList.toggle('collapsed');
            });
        }
    }
    
    initEventListeners() {
        // Mobile menu toggle
        if (this.menuButton) {
            this.menuButton.addEventListener('click', () => this.toggleSidebar());
        }
        if (this.sidebarOverlay) {
            this.sidebarOverlay.addEventListener('click', () => this.toggleSidebar());
        }
        
        // New chat buttons
        if (this.newChatButton) {
            this.newChatButton.addEventListener('click', () => this.startNewChat());
        }
        if (this.newChatBtn) {
            this.newChatBtn.addEventListener('click', () => this.startNewChat());
        }
        
        // Message input
        if (this.messageInput) {
            this.messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
            
            // Add voice input button
            this.addVoiceInputButton();
        }
        
        if (this.sendButton) {
            this.sendButton.addEventListener('click', () => this.sendMessage());
        }
        
        // Chat actions
        if (this.clearChatBtn) {
            this.clearChatBtn.addEventListener('click', () => this.confirmClearChat());
        }
        
        // Initialize settings in sidebar
        this.initSettings();
        
        // Add window resize handler
        window.addEventListener('resize', () => this.handleResize());
        
        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+/ to focus on message input
            if (e.ctrlKey && e.key === '/') {
                e.preventDefault();
                if (this.messageInput) {
                    this.messageInput.focus();
                }
            }
            
            // Ctrl+Shift+V to toggle voice input
            if (e.ctrlKey && e.shiftKey && e.key === 'V') {
                e.preventDefault();
                this.toggleVoiceInput();
            }
        });
        
        // Add collapsible functionality
        document.querySelectorAll('.sidebar-section h3').forEach(header => {
            const content = header.nextElementSibling;
            if (content && content.classList.contains('collapsible')) {
                header.addEventListener('click', () => {
                    // Close other sections
                    document.querySelectorAll('.collapsible.show').forEach(openSection => {
                        if (openSection !== content) {
                            openSection.classList.remove('show');
                            openSection.previousElementSibling.classList.add('collapsed');
                        }
                    });
                    
                    // Toggle current section
                    content.classList.toggle('show');
                    header.classList.toggle('collapsed');
                });
            }
        });
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    window.sportMindAI = new SportMindAI();
});