// Standalone mobile menu toggle script
document.addEventListener('DOMContentLoaded', function() {
    console.log('Mobile menu script loaded');
    
    // Get elements
    const menuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    console.log('Mobile menu elements:', { 
        menuToggle: menuToggle, 
        sidebar: sidebar, 
        overlay: overlay 
    });
    
    // Add toggle functionality
    if (menuToggle && sidebar && overlay) {
        menuToggle.addEventListener('click', function() {
            console.log('Mobile menu toggle clicked');
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
            document.body.classList.toggle('sidebar-open');
            
            // Debug
            console.log('Sidebar classes after toggle:', sidebar.className);
            console.log('Overlay classes after toggle:', overlay.className);
        });
        
        // Close sidebar when overlay is clicked
        overlay.addEventListener('click', function() {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            document.body.classList.remove('sidebar-open');
        });
        
        // Close sidebar when a nav link is clicked
        const navLinks = sidebar.querySelectorAll('.nav-link');
        navLinks.forEach(function(link) {
            link.addEventListener('click', function() {
                if (window.innerWidth < 768) {
                    sidebar.classList.remove('active');
                    overlay.classList.remove('active');
                    document.body.classList.remove('sidebar-open');
                }
            });
        });
    } else {
        console.error('Mobile menu elements not found');
    }
});
