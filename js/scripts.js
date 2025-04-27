// Header scroll effect
window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    if (window.scrollY > 100) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// Initialize hero slideshow
document.addEventListener('DOMContentLoaded', () => {
    const slides = document.querySelectorAll('.hero-slideshow .slide');
    let currentSlide = 0;
    const slideInterval = 6000; // 6 seconds per slide

    // Show first slide immediately
    if (slides.length > 0) {
        slides[0].classList.add('active');
    }

    // Start slideshow after first slide is shown
    setTimeout(() => {
        setInterval(() => {
            slides[currentSlide].classList.remove('active');
            currentSlide = (currentSlide + 1) % slides.length;
            slides[currentSlide].classList.add('active');
        }, slideInterval);
    }, slideInterval);
});

// AI Chatbot dialog functions
function tryAIChatbot() {
    document.getElementById('overlay').style.display = 'block';
    document.getElementById('customAlert').style.display = 'block';
}

function closeAlert() {
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('customAlert').style.display = 'none';
}

function proceedToLogin() {
    window.location.href = 'login.html';
}
