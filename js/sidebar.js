document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    function toggleSidebar() {
        sidebar?.classList.toggle('active');
        overlay?.classList.toggle('active');
        document.body.style.overflow = sidebar?.classList.contains('active') ? 'hidden' : '';
    }

    overlay?.addEventListener('click', toggleSidebar);

    // Close sidebar on window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            sidebar?.classList.remove('active');
            overlay?.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
});
