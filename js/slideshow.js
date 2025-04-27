document.addEventListener('DOMContentLoaded', function() {
    const slides = [
        'images/rugbyai.png',
        'images/rugbyai1.png',
        'images/rugbyai2.png',
        'images/rugbyai3.png',
        'images/rugbyai4.png',
        'images/rugbyai5.png'
    ];
    
    const heroSection = document.querySelector('.hero-slideshow');
    let currentSlide = 0;
    
    // Create initial slides
    slides.forEach((slide, index) => {
        const div = document.createElement('div');
        div.className = `hero-slide ${index === 0 ? 'active' : ''}`;
        div.style.backgroundImage = `url(${slide})`;
        heroSection.appendChild(div);
    });
    
    // Rotate slides
    setInterval(() => {
        const slideElements = document.querySelectorAll('.hero-slide');
        slideElements[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slideElements[currentSlide].classList.add('active');
    }, 6000); // Change slide every 6 seconds
});
