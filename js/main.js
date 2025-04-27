import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore, collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDb7Rw9gf3k3OqUjpImv03oBJbDdAzsGpM",
    authDomain: "gandi-hub-474d2.firebaseapp.com",
    projectId: "gandi-hub-474d2",
    storageBucket: "gandi-hub-474d2.appspot.com",
    messagingSenderId: "877278458127",
    appId: "1:877278458127:web:22728337144c770a4b8e7a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Test Firebase connections
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log('Firebase connected, user logged in:', user.email);
    } else {
        console.log('Firebase connected, no user logged in');
    }
});

// Test database connection
const testCollection = collection(db, 'test');
getDocs(testCollection)
    .then(() => {
        console.log('Firestore connection successful');
    })
    .catch(error => {
        console.error('Firestore connection error:', error);
    });

// Mobile menu functionality
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const nav = document.querySelector('.nav');
const header = document.querySelector('.header');

// Handle mobile menu toggle
mobileMenuToggle?.addEventListener('click', () => {
    mobileMenuToggle.classList.toggle('active');
    nav.classList.toggle('active');
    document.body.classList.toggle('menu-open');
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (nav?.classList.contains('active') && 
        !e.target.closest('.nav') && 
        !e.target.closest('.mobile-menu-toggle')) {
        mobileMenuToggle.classList.remove('active');
        nav.classList.remove('active');
        document.body.classList.remove('menu-open');
    }
});

// Handle scroll behavior
let lastScroll = 0;
window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > lastScroll && currentScroll > 100) {
        // Scrolling down & past header
        header.classList.add('header-hidden');
    } else {
        // Scrolling up
        header.classList.remove('header-hidden');
    }
    
    if (currentScroll > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
    
    lastScroll = currentScroll;
});

// Prevent iOS bounce effect while menu is open
document.body.addEventListener('touchmove', (e) => {
    if (document.body.classList.contains('menu-open')) {
        e.preventDefault();
    }
}, { passive: false });

// Add smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            // Close mobile menu if open
            if (nav?.classList.contains('active')) {
                mobileMenuToggle.classList.remove('active');
                nav.classList.remove('active');
                document.body.classList.remove('menu-open');
            }
            
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Updated Smooth Scroll for Navigation Links
document.querySelectorAll('.nav a').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        // Only prevent default for hash links (internal navigation)
        if (this.getAttribute('href').startsWith('#')) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        }
        // External links will work normally
    });
});

// Function to handle chatbot button clicks
function tryAIChatbot() {
    document.getElementById('overlay').style.display = 'block';
    document.getElementById('customAlert').style.display = 'block';
}

function proceedToLogin() {
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('customAlert').style.display = 'none';
    window.location.href = 'login.html';
}

function closeAlert() {
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('customAlert').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', function() {
    // Smooth scroll functionality
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            // Get the target section
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.querySelector(`section[id="${targetId}"]`);
            
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Add IDs to sections
    const aboutSection = document.querySelector('.about');
    const featuresSection = document.querySelector('.features');
    const testimonialsSection = document.querySelector('.testimonials');
    
    aboutSection.id = 'about';
    featuresSection.id = 'features';
    testimonialsSection.id = 'reviews';

    const images = [
        'images/rugbyai.png',
        'images/rugbyai1.png',
        'images/rugbyai2.png',
        'images/rugbyai3.png',
        'images/rugbyai4.png',
        'images/rugbyai5.png'
    ];

    const hero = document.querySelector('.hero');
    const slideshow = document.createElement('div');
    slideshow.className = 'hero-slideshow';

    // Create slides
    images.forEach((img, index) => {
        const slide = document.createElement('div');
        slide.className = `hero-slide ${index === 0 ? 'active' : ''}`;
        slide.style.backgroundImage = `url(${img})`;
        slideshow.appendChild(slide);
    });

    hero.insertBefore(slideshow, hero.firstChild);

    // Rotate slides
    let currentSlide = 0;
    setInterval(() => {
        const slides = document.querySelectorAll('.hero-slide');
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }, 5000); // Change slide every 5 seconds
});
