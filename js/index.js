// Slideshow functionality
function initSlideshow() {
    const slides = document.querySelectorAll('.hero-slide');
    let currentSlide = 0;
    
    function showSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        slides[index].classList.add('active');
    }
    
    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }
    
    // Change slide every 4 seconds with a 2-second transition
    setInterval(nextSlide, 4000);
}

// Mobile menu functionality
document.addEventListener('DOMContentLoaded', () => {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navWrapper = document.querySelector('.nav-wrapper');
    const header = document.querySelector('.header');
    let lastScrollTop = 0;

    if (mobileMenuToggle && navWrapper) {
        mobileMenuToggle.addEventListener('click', () => {
            navWrapper.classList.toggle('active');
            document.body.style.overflow = navWrapper.classList.contains('active') ? 'hidden' : '';
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (navWrapper.classList.contains('active') &&
                !navWrapper.contains(e.target) &&
                !mobileMenuToggle.contains(e.target)) {
                navWrapper.classList.remove('active');
                document.body.style.overflow = '';
            }
        });

        // Close menu on window resize if it goes above mobile breakpoint
        window.addEventListener('resize', () => {
            if (window.innerWidth > 1024 && navWrapper.classList.contains('active')) {
                navWrapper.classList.remove('active');
                document.body.style.overflow = '';
            }
        });

        // Handle header visibility on scroll
        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            if (scrollTop > lastScrollTop && scrollTop > 100) {
                header.style.transform = 'translateY(-100%)';
            } else {
                header.style.transform = 'translateY(0)';
            }
            
            lastScrollTop = scrollTop;
        });
    }

    initSlideshow();
});
