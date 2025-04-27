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
