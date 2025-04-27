// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/html/service-worker.js')
      .then(registration => {
        console.log('ServiceWorker registration successful');
      })
      .catch(err => {
        console.log('ServiceWorker registration failed: ', err);
      });
  });
}

// Main application code
document.addEventListener('DOMContentLoaded', () => {
  // Your existing JavaScript functionality can be moved here
  console.log('Application initialized');
});
