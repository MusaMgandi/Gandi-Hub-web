import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyDb7Rw9gf3k3OqUjpImv03oBJbDdAzsGpM",
    authDomain: "gandi-hub-474d2.firebaseapp.com",
    projectId: "gandi-hub-474d2",
    storageBucket: "gandi-hub-474d2.appspot.com",
    messagingSenderId: "877278458127",
    appId: "1:877278458127:web:22728337144c770a4b8e7a"
};

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

document.addEventListener('DOMContentLoaded', function() {
    // Auth state observer
    onAuthStateChanged(auth, async (user) => {
        // Maintain session
        // Load user data
        // Handle unauthorized access
        const authCheckOverlay = document.getElementById('authCheckOverlay');
        const mainContent = document.getElementById('mainContent');
        
        if (user) {
            try {
                // Get user data from Firestore
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    // Store user data in session
                    sessionStorage.setItem('userId', user.uid);
                    sessionStorage.setItem('userEmail', user.email);
                    sessionStorage.setItem('username', userData.username || '');
                    sessionStorage.setItem('fullName', userData.fullName || '');
                    sessionStorage.setItem('isAuthenticated', 'true');
                    
                    // Show main content
                    authCheckOverlay.style.display = 'none';
                    mainContent.style.display = 'block';
                    
                    // Initialize profile data
                    loadUserProfile();
                    
                    // Check if user is new and show welcome notification
                    checkNewUserAndShowWelcomeNotification(userData);
                } else {
                    console.log("No user data found!");
                    window.location.href = 'login.html';
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
                window.location.href = 'login.html';
            }
        } else {
            // No user is signed in
            window.location.href = 'login.html';
        }
    });

    const categories = document.querySelectorAll('.category');
    const SLIDE_DURATION = 6000; // 11 seconds total duration
    let currentCategory = 0;
    
    // Set initial slides visible
    categories.forEach(category => {
        const slides = category.querySelectorAll('.slide');
        slides[0].style.opacity = '1';
    });

    // Sequential category transitions
    setInterval(() => {
        const currentSlides = categories[currentCategory].querySelectorAll('.slide');
        let currentSlideIndex = Array.from(currentSlides).findIndex(slide => slide.style.opacity === '1');
        
        // Fade out current slide
        currentSlides[currentSlideIndex].style.opacity = '0';
        
        // Calculate next slide index
        let nextSlideIndex = (currentSlideIndex + 1) % currentSlides.length;
        
        // Fade in next slide
        currentSlides[nextSlideIndex].style.opacity = '1';
        
        // Move to next category
        currentCategory = (currentCategory + 1) % categories.length;
    }, SLIDE_DURATION);

    // Smooth scroll for footer links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Newsletter form enhancement
    
    // Function to check if user is new and show welcome notification
    function checkNewUserAndShowWelcomeNotification(userData) {
        // Check if the user was created recently (within the last 24 hours)
        const creationDate = userData.createdAt ? new Date(userData.createdAt) : null;
        if (!creationDate) return; // No creation date available
        
        const now = new Date();
        const timeDifference = now - creationDate; // Difference in milliseconds
        const daysDifference = timeDifference / (1000 * 3600 * 24);
        
        // If user was created within the last day, show welcome notification
        if (daysDifference <= 1) {
            // Add the welcome notification to the notification list
            const notificationList = document.querySelector('.notification-list');
            const welcomeNotification = document.createElement('li');
            welcomeNotification.className = 'notification-item unread';
            welcomeNotification.innerHTML = `
                <div class="notification-info">
                    <div class="notification-icon-wrapper" style="background-color: rgba(46, 204, 113, 0.2);">
                        <i class="fas fa-coins" style="color: #2ecc71;"></i>
                    </div>
                    <div class="notification-content">
                        <div class="notification-title">Welcome Bonus: 50 GHUB Tokens!</div>
                        <div class="notification-text">As a new member, you've received 50 GHUB tokens in your wallet. Check your wallet in the profile section to see your balance.</div>
                        <div class="notification-time">Just now</div>
                        <div class="notification-actions">
                            <a href="profile.html" class="notification-action-btn">View Wallet</a>
                        </div>
                    </div>
                </div>
            `;
            
            // Add to notification list
            if (notificationList) {
                notificationList.prepend(welcomeNotification);
                
                // Update notification badge
                const notificationBadge = document.querySelector('.notification-badge');
                if (notificationBadge) {
                    const currentCount = parseInt(notificationBadge.textContent);
                    notificationBadge.textContent = currentCount + 1;
                }
                
                // Show a toast notification
                showWelcomeToast();
            }
        }
    }
    
    // Function to show welcome toast notification
    function showWelcomeToast() {
        const toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) return;
        
        const toast = document.createElement('div');
        toast.className = 'toast-notification show';
        toast.innerHTML = `
            <div class="toast-icon" style="background-color: rgba(46, 204, 113, 0.2);">
                <i class="fas fa-coins" style="color: #2ecc71;"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">Welcome Bonus!</div>
                <div class="toast-message">You've received 50 GHUB tokens in your wallet.</div>
            </div>
            <button class="toast-close"><i class="fas fa-times"></i></button>
        `;
        
        toastContainer.appendChild(toast);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
        
        // Close button functionality
        const closeBtn = toast.querySelector('.toast-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            });
        }
    }
    
    // Toggle notification panel
    const notificationIcon = document.querySelector('.notification-icon');
    const notificationModal = document.querySelector('.notification-modal');
    const closeNotificationBtn = document.querySelector('.close-notification');
    
    if (notificationIcon && notificationModal) {
        notificationIcon.addEventListener('click', (e) => {
            e.preventDefault();
            notificationModal.classList.add('active');
        });
    }
    
    if (closeNotificationBtn && notificationModal) {
        closeNotificationBtn.addEventListener('click', () => {
            notificationModal.classList.remove('active');
        });
        
        // Close when clicking outside
        notificationModal.addEventListener('click', (e) => {
            if (e.target === notificationModal) {
                notificationModal.classList.remove('active');
            }
        });
    }
    const form = document.querySelector('.newsletter-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const button = form.querySelector('button');
        const input = form.querySelector('input');
        
        button.textContent = 'Sending...';
        button.disabled = true;
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        button.textContent = 'Joined!';
        input.value = '';
        
        setTimeout(() => {
            button.textContent = 'Join';
            button.disabled = false;
        }, 2000);
    });

    // Intersection Observer for animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.category').forEach(el => observer.observe(el));

    // Logo scroll behavior
    let lastScrollPosition = 0;
    const logo = document.querySelector('.logo-container');
    const scrollThreshold = 100; // Amount of scroll before hiding logo

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > scrollThreshold) {
            // Scrolling down
            if (currentScroll > lastScrollPosition) {
                logo.classList.add('hidden');
            } else {
                // Scrolling up
                logo.classList.remove('hidden');
            }
        } else {
            // At top of page
            logo.classList.remove('hidden');
        }
        
        lastScrollPosition = currentScroll;
    });

    // Add authentication check
    if (localStorage.getItem('isAuthenticated') !== 'true') {
        window.location.href = '/index.html';
        return;
    }
    
    // Load user data (replace with actual API call)
    const userData = {
        name: 'John Doe',
        avatar: 'images/default-avatar.png'
    };
    
    // Update UI with user data
    document.querySelector('.username').textContent = userData.name;
    document.querySelector('.profile-image').src = userData.avatar;
});

async function loadUserProfile() {
    try {
        const userId = sessionStorage.getItem('userId');
        const userDoc = await getDoc(doc(db, "users", userId));
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Update profile elements with Firestore data
            document.getElementById('profileName').textContent = userData.username || 'User';
            document.getElementById('email').textContent = userData.email;
            document.getElementById('fullName').textContent = userData.fullName || 'Not set';
            document.getElementById('username').textContent = userData.username || 'User';
            document.getElementById('phoneNumber').textContent = userData.phone || 'Not set';
            document.getElementById('location').textContent = userData.location || 'Not set';
            document.getElementById('club').textContent = userData.club || 'Not set';
            
            // Load profile image if exists
            if (userData.profileImage) {
                const avatarImage = document.getElementById('avatarImage');
                const defaultAvatar = document.getElementById('defaultAvatarContainer');
                avatarImage.src = userData.profileImage;
                avatarImage.style.display = 'block';
                defaultAvatar.style.display = 'none';
            }
        }
    } catch (error) {
        console.error("Error loading user profile:", error);
    }
}

// Profile update handler
async function saveAllChanges() {
    try {
        const userId = auth.currentUser.uid;
        const updates = {
            fullName: document.getElementById('fullNameInput').value.trim(),
            username: document.getElementById('usernameInput').value.trim(),
            phone: document.getElementById('phoneInput').value.trim(),
            location: document.getElementById('locationInput').value.trim(),
            club: document.getElementById('clubInput').value
        };

        // Update Firestore
        await updateDoc(doc(db, "users", userId), updates);
        
        // Update UI
        updateUIWithUserData(updates);
        
        // Show success message
        alert('Profile updated successfully!');
    } catch (error) {
        console.error("Error updating profile:", error);
        alert('Failed to update profile. Please try again.');
    }
}

// Profile image upload handler
async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const userId = auth.currentUser.uid;
        const storageRef = ref(storage, `profileImages/${userId}`);
        
        // Upload file
        await uploadBytes(storageRef, file);
        
        // Get download URL
        const imageUrl = await getDownloadURL(storageRef);
        
        // Update user profile in Firestore
        await updateDoc(doc(db, "users", userId), {
            profileImage: imageUrl
        });

        // Update UI
        const avatarImage = document.getElementById('avatarImage');
        const defaultAvatar = document.getElementById('defaultAvatarContainer');
        avatarImage.src = imageUrl;
        avatarImage.style.display = 'block';
        defaultAvatar.style.display = 'none';

    } catch (error) {
        console.error("Error uploading image:", error);
        alert('Failed to upload image. Please try again.');
    }
}

// Logout handler
async function logout() {
    try {
        await signOut(auth);
        sessionStorage.clear();
        window.location.href = 'login.html';
    } catch (error) {
        console.error("Error signing out:", error);
    }
}

// Helper function to update UI
function updateUIWithUserData(userData) {
    document.getElementById('profileName').textContent = userData.username || 'User';
    document.getElementById('email').textContent = userData.email || '';
    document.getElementById('fullName').textContent = userData.fullName || 'Not set';
    document.getElementById('username').textContent = userData.username || 'User';
    document.getElementById('phoneNumber').textContent = userData.phone || 'Not set';
    document.getElementById('location').textContent = userData.location || 'Not set';
    document.getElementById('club').textContent = userData.club || 'Not set';

    if (userData.profileImage) {
        const avatarImage = document.getElementById('avatarImage');
        const defaultAvatar = document.getElementById('defaultAvatarContainer');
        avatarImage.src = userData.profileImage;
        avatarImage.style.display = 'block';
        defaultAvatar.style.display = 'none';
    }
}

// Export functions for use in HTML
window.handleImageUpload = handleImageUpload;
window.saveAllChanges = saveAllChanges;
window.logout = logout;

function handleLogout() {
    localStorage.removeItem('isAuthenticated');
    window.location.href = '/index.html';
}
