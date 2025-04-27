document.addEventListener('DOMContentLoaded', function() {
    // Make sure Firebase is initialized before proceeding
    if (!firebase || !firebase.apps || !firebase.apps.length) {
        console.error('Firebase is not initialized!');
        showToast('error', 'Firebase is not initialized properly. Please refresh the page.');
        return;
    }
    
    // Initialize Firebase Auth and Firestore
    const auth = firebase.auth();
    const db = firebase.firestore();
    const loadingOverlay = document.getElementById('loadingOverlay');
    
    // Show loading overlay
    if (loadingOverlay) loadingOverlay.classList.add('active');
    
    // Check authentication state
    auth.onAuthStateChanged(function(user) {
        if (user) {
            // User is signed in, load data from Firestore
            console.log('User is signed in:', user.uid);
            loadUserDataFromFirestore(user.uid);
            
            // Check if this is a new login session
            const lastLoginTime = localStorage.getItem('lastLoginTime');
            const currentTime = Date.now();
            const showRatingThreshold = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
            
            if (!lastLoginTime || (currentTime - parseInt(lastLoginTime) > showRatingThreshold)) {
                // Update last login time
                localStorage.setItem('lastLoginTime', currentTime.toString());
                
                // Show rating modal after a short delay
                setTimeout(() => {
                    showRatingModal();
                }, 2000); // Show after 2 seconds
            }
        } else {
            // User is signed out, redirect to login page
            console.log('No user is signed in');
            window.location.href = '../html/login.html';
        }
    });
    
    // Function to load user data from Firestore
    async function loadUserDataFromFirestore(userId) {
        try {
            const userDoc = await db.collection('users').doc(userId).get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                
                // Check if we have a locally stored profile image
                if (localStorage.getItem('tempProfileImage_' + userId)) {
                    console.log('Found locally stored profile image');
                    userData.localProfileImage = localStorage.getItem('tempProfileImage_' + userId);
                }
                
                displayUserData(userData);
            } else {
                console.error('User document does not exist');
                // Handle case where user document doesn't exist
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            // Handle error loading user data
        }
        
        if (loadingOverlay) loadingOverlay.classList.remove('active');
    }
    
    // Function to display user data on the profile page
    function displayUserData(userData) {
        // Set player name and tagline
        const playerName = document.getElementById('player-name');
        const playerTagline = document.getElementById('player-tagline');
        const profileImg = document.getElementById('profile-img');
        
        if (playerName && userData.firstName) {
            playerName.textContent = userData.firstName;
        }
        
        if (playerTagline && userData.username) {
            playerTagline.textContent = `@${userData.username}`;
        }
        
        // Handle profile image with local storage fallback
        if (profileImg) {
            if (userData.localProfileImage) {
                // Use locally stored image if available
                profileImg.src = userData.localProfileImage;
                console.log('Using locally stored profile image');
            } else if (userData.profileImageURL && userData.profileImageURL !== 'local-image') {
                // Use Firebase Storage image if available
                profileImg.src = userData.profileImageURL;
            } else {
                // Fall back to default image
                profileImg.src = '../img/default-profile.png';
            }
        }
        
        // Basic Information
        if (userData.firstName) document.getElementById('first-name').textContent = userData.firstName;
        if (userData.lastName) document.getElementById('last-name').textContent = userData.lastName;
        if (userData.username) document.getElementById('username').textContent = userData.username;
        if (userData.dateOfBirth) document.getElementById('date-of-birth').textContent = formatDate(userData.dateOfBirth);
        if (userData.occupation) document.getElementById('occupation').textContent = userData.occupation;
        if (userData.email) document.getElementById('email').textContent = userData.email;
        if (userData.phone) document.getElementById('phone').textContent = userData.phone;
        
        // Player Details
        if (userData.rugbyPosition) document.getElementById('position').textContent = formatPosition(userData.rugbyPosition);
        
        // Experience
        if (userData.experienceLevel) document.getElementById('experience-level').textContent = formatExperience(userData.experienceLevel);
        
        // Set form values for edit mode
        setEditFormValues(userData);
        
        // Hide loading overlay
        if (loadingOverlay) loadingOverlay.classList.remove('active');
    }
    
    // Function to set edit form values
    function setEditFormValues(userData) {
        // Personal Information
        if (userData.firstName) document.getElementById('edit-first-name').value = userData.firstName;
        if (userData.lastName) document.getElementById('edit-last-name').value = userData.lastName;
        if (userData.username) document.getElementById('edit-username').value = userData.username;
        if (userData.dateOfBirth) document.getElementById('edit-date-of-birth').value = userData.dateOfBirth;
        if (userData.occupation) document.getElementById('edit-occupation').value = userData.occupation;
        if (userData.email) document.getElementById('edit-email').value = userData.email;
        if (userData.phone) document.getElementById('edit-phone').value = userData.phone;
        
        // Rugby Details
        if (userData.rugbyPosition) document.getElementById('edit-position').value = userData.rugbyPosition;
        
        // Experience
        if (userData.experienceLevel) document.getElementById('edit-experience-level').value = userData.experienceLevel;
    }
    
    // Setup edit functionality
    setupEditFunctionality();
    
    // Function to setup edit functionality
    function setupEditFunctionality() {
        // Add data validation for forms
        const emailInputs = document.querySelectorAll('input[type="email"]');
        emailInputs.forEach(input => {
            input.addEventListener('blur', () => {
                validateEmail(input);
            });
        });
        
        const phoneInputs = document.querySelectorAll('input[type="tel"]');
        phoneInputs.forEach(input => {
            input.addEventListener('input', () => {
                formatPhoneNumber(input);
            });
            input.addEventListener('blur', () => {
                validatePhoneNumber(input);
            });
        });
        
        // Personal Information Edit
        const editPersonalInfoBtn = document.getElementById('edit-personal-info');
        const personalInfoView = document.getElementById('personal-info-view');
        const personalInfoEdit = document.getElementById('personal-info-edit');
        const personalInfoForm = document.getElementById('personal-info-form');
        const cancelPersonalInfoBtn = personalInfoEdit.querySelector('.cancel-edit-btn');
        
        editPersonalInfoBtn.addEventListener('click', () => {
            personalInfoView.style.display = 'none';
            personalInfoEdit.style.display = 'block';
        });
        
        cancelPersonalInfoBtn.addEventListener('click', () => {
            personalInfoView.style.display = 'grid';
            personalInfoEdit.style.display = 'none';
        });
        
        personalInfoForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await updateUserData('personal-info', personalInfoForm);
            personalInfoView.style.display = 'grid';
            personalInfoEdit.style.display = 'none';
        });
        
        // Rugby Details Edit
        const editRugbyDetailsBtn = document.getElementById('edit-rugby-details');
        const rugbyDetailsView = document.getElementById('rugby-details-view');
        const rugbyDetailsEdit = document.getElementById('rugby-details-edit');
        const rugbyDetailsForm = document.getElementById('rugby-details-form');
        const cancelRugbyDetailsBtn = rugbyDetailsEdit.querySelector('.cancel-edit-btn');
        
        editRugbyDetailsBtn.addEventListener('click', () => {
            rugbyDetailsView.style.display = 'none';
            rugbyDetailsEdit.style.display = 'block';
        });
        
        cancelRugbyDetailsBtn.addEventListener('click', () => {
            rugbyDetailsView.style.display = 'grid';
            rugbyDetailsEdit.style.display = 'none';
        });
        
        rugbyDetailsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await updateUserData('rugby-details', rugbyDetailsForm);
            rugbyDetailsView.style.display = 'grid';
            rugbyDetailsEdit.style.display = 'none';
        });
        
        // Experience Edit
        const editExperienceBtn = document.getElementById('edit-experience');
        const experienceView = document.getElementById('experience-view');
        const experienceEdit = document.getElementById('experience-edit');
        const experienceForm = document.getElementById('experience-form');
        const cancelExperienceBtn = experienceEdit.querySelector('.cancel-edit-btn');
        
        editExperienceBtn.addEventListener('click', () => {
            experienceView.style.display = 'none';
            experienceEdit.style.display = 'block';
        });
        
        cancelExperienceBtn.addEventListener('click', () => {
            experienceView.style.display = 'grid';
            experienceEdit.style.display = 'none';
        });
        
        experienceForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await updateUserData('experience', experienceForm);
            experienceView.style.display = 'grid';
            experienceEdit.style.display = 'none';
        });
    }
    
    // Function to update user data in Firestore
    async function updateUserData(section, form) {
        const currentUser = firebase.auth().currentUser;
        if (!currentUser) {
            showToast('error', 'You must be logged in to update your profile');
            return;
        }
        
        try {
            // Show loading overlay
            if (loadingOverlay) loadingOverlay.classList.add('active');
            
            const formData = new FormData(form);
            const updateData = {};
            
            // Convert FormData to object
            for (const [key, value] of formData.entries()) {
                updateData[key] = value;
            }
            
            // Check if the document exists first
            const docRef = db.collection('users').doc(currentUser.uid);
            const docSnapshot = await docRef.get();
            
            if (docSnapshot.exists) {
                // Document exists, update it
                await docRef.update(updateData);
            } else {
                // Document doesn't exist, create it
                await docRef.set(updateData);
                showToast('info', 'Created new profile for user');
            }
            
            // Refresh user data
            await loadUserDataFromFirestore(currentUser.uid);
            
            // Show success message
            showToast('success', 'Profile updated successfully');
            
        } catch (error) {
            console.error('Error updating profile:', error);
            showToast('error', 'Error updating profile: ' + error.message);
        } finally {
            // Hide loading overlay
            if (loadingOverlay) loadingOverlay.classList.remove('active');
        }
    }
    // Tab switching functionality
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Mobile menu toggle functionality
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => {
            mobileMenuToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
        
        // Close mobile menu when clicking a link
        const navLinksItems = navLinks.querySelectorAll('a:not(.logout-btn)');
        navLinksItems.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenuToggle.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', (event) => {
            if (!event.target.closest('.nav-links') && 
                !event.target.closest('.mobile-menu-toggle') && 
                navLinks.classList.contains('active')) {
                mobileMenuToggle.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });
    }
    
    // Logout confirmation modal functionality
    const logoutBtn = document.querySelector('.logout-btn');
    const logoutModal = document.getElementById('logoutModal');
    const cancelLogoutBtn = document.getElementById('cancelLogout');
    const confirmLogoutBtn = document.getElementById('confirmLogout');
    
    if (logoutBtn && logoutModal) {
        // Show modal when logout button is clicked
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logoutModal.classList.add('active');
            // Close mobile menu if open
            if (mobileMenuToggle && mobileMenuToggle.classList.contains('active')) {
                mobileMenuToggle.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });
        
        // Hide modal when cancel button is clicked
        if (cancelLogoutBtn) {
            cancelLogoutBtn.addEventListener('click', function() {
                if (logoutModal) logoutModal.classList.remove('active');
            });
        }
        
        // Modal functionality
        const ratingModal = document.getElementById('ratingModal');
        const closeRatingModal = document.getElementById('closeRatingModal');
        const skipRating = document.getElementById('skipRating');
        const submitRating = document.getElementById('submitRating');
        const stars = document.querySelectorAll('.stars i');
        
        // Close modals when clicking the X button
        if (cancelLogoutBtn) {
            cancelLogoutBtn.addEventListener('click', function() {
                if (logoutModal) logoutModal.classList.remove('active');
            });
        }
        
        // Close rating modal
        if (closeRatingModal) {
            closeRatingModal.addEventListener('click', function() {
                if (ratingModal) {
                    ratingModal.classList.remove('active');
                    document.body.style.overflow = ''; // Restore scrolling
                }
            });
        }
        
        // Skip rating
        if (skipRating) {
            skipRating.addEventListener('click', function() {
                if (ratingModal) {
                    ratingModal.classList.remove('active');
                    document.body.style.overflow = ''; // Restore scrolling
                }
            });
        }
        
        // Star rating functionality
        let currentRating = 0;
        if (stars) {
            stars.forEach(star => {
                star.addEventListener('click', function() {
                    const rating = parseInt(this.getAttribute('data-rating'));
                    currentRating = rating;
                    
                    // Update stars display
                    stars.forEach(s => {
                        const starRating = parseInt(s.getAttribute('data-rating'));
                        s.classList.remove('fas', 'far', 'selected');
                        if (starRating <= rating) {
                            s.classList.add('fas', 'selected');
                        } else {
                            s.classList.add('far');
                        }
                    });
                    
                    // Update rating text
                    const ratingText = document.querySelector('.rating-text');
                    if (ratingText) {
                        const ratingMessages = [
                            '',
                            'Poor',
                            'Fair',
                            'Good',
                            'Very Good',
                            'Excellent'
                        ];
                        ratingText.textContent = ratingMessages[rating];
                    }
                    
                    // Enable submit button
                    if (submitRating) submitRating.disabled = false;
                });
            });
        }
        
        // Submit rating
        if (submitRating) {
            submitRating.addEventListener('click', async function() {
                const currentUser = firebase.auth().currentUser;
                if (!currentUser) return;
                
                const comment = document.getElementById('rating-comment').value.trim();
                
                try {
                    // Show loading overlay
                    if (loadingOverlay) loadingOverlay.classList.add('active');
                    
                    // Get user data for the review
                    const userDoc = await db.collection('users').doc(currentUser.uid).get();
                    const userData = userDoc.exists ? userDoc.data() : {};
                    
                    // Create review object
                    const review = {
                        userId: currentUser.uid,
                        userName: userData.firstName && userData.lastName ? 
                                  `${userData.firstName} ${userData.lastName}` : 
                                  (userData.username || 'Anonymous User'),
                        userRole: userData.rugbyPosition || 'Rugby Player',
                        rating: currentRating,
                        comment: comment || `Rated ${currentRating} stars`,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                        profileImageURL: userData.profileImageURL || ''
                    };
                    
                    // Save to Firestore
                    await db.collection('reviews').add(review);
                    // Show success message
                    showToast('success', 'Thank you for your feedback!');
                    
                    // Close the modal
                    if (ratingModal) {
                        ratingModal.classList.remove('active');
                        document.body.style.overflow = ''; // Restore scrolling
                    }
                } catch (error) {
                    console.error('Error submitting review:', error);
                    showToast('error', 'Error submitting review: ' + error.message);
                } finally {
                    // Hide loading overlay
                    if (loadingOverlay) loadingOverlay.classList.remove('active');
                }
            });
        }
        
        // Close modals when clicking outside
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (event) => {
                if (event.target === modal) {
                    modal.classList.remove('active');
                    document.body.style.overflow = ''; // Restore scrolling
                }
            });
        });
        
        // Close modal on escape key press
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && logoutModal.classList.contains('active')) {
                logoutModal.classList.remove('active');
            }
        });
    }
    
    // Profile image upload functionality
    const profileImage = document.querySelector('.profile-image');
    const editOverlay = document.querySelector('.edit-overlay');
    const profileImg = document.getElementById('profile-img');
    
    // Profile image upload functionality will be updated to use Firebase Storage
    if (editOverlay) {
        editOverlay.addEventListener('click', () => {
            const currentUser = firebase.auth().currentUser;
            if (!currentUser) {
                alert('You must be logged in to update your profile image');
                return;
            }
            
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (file) {
                    try {
                        // Show loading overlay
                        if (loadingOverlay) loadingOverlay.classList.add('active');
                        
                        // Create a FileReader for local preview
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            // Update the profile image with local preview immediately
                            profileImg.src = e.target.result;
                            
                            // Store in localStorage as fallback
                            try {
                                localStorage.setItem('tempProfileImage_' + currentUser.uid, e.target.result);
                                // Also store the filename for reference
                                localStorage.setItem('tempProfileImageName_' + currentUser.uid, file.name);
                                showToast('success', 'Profile image updated locally');
                            } catch (e) {
                                console.warn('Could not save to localStorage:', e);
                            }
                        };
                        reader.readAsDataURL(file);
                        
                        // Check if we're running locally
                        const isLocalhost = window.location.hostname === 'localhost' || 
                                          window.location.hostname === '127.0.0.1' ||
                                          window.location.hostname.includes('192.168.');
                        
                        if (isLocalhost) {
                            console.log('Running locally - skipping Firebase Storage upload to avoid CORS issues');
                            // Still update Firestore with a placeholder URL
                            try {
                                await db.collection('users').doc(currentUser.uid).update({
                                    profileImageURL: 'local-image',
                                    localImageTimestamp: Date.now() // Add timestamp to track local images
                                });
                                console.log('Updated Firestore with local image placeholder');
                            } catch (firestoreError) {
                                console.warn('Could not update Firestore:', firestoreError);
                            }
                            
                            // Hide loading overlay after local operations
                            if (loadingOverlay) loadingOverlay.classList.remove('active');
                            return; // Skip Firebase Storage operations
                        }
                        
                        // Only proceed with Firebase Storage if not on localhost
                        // Check if Firebase Storage is available
                        if (!firebase.storage) {
                            throw new Error('Firebase Storage is not initialized');
                        }
                        
                        // Create a reference to Firebase Storage
                        const storageRef = firebase.storage().ref();
                        const fileRef = storageRef.child(`profile_images/${currentUser.uid}/${file.name}`);
                        
                        try {
                            // Upload the file
                            await fileRef.put(file);
                            
                            // Get the download URL
                            const downloadURL = await fileRef.getDownloadURL();
                            
                            // Update the user's profile in Firestore
                            await db.collection('users').doc(currentUser.uid).update({
                                profileImageURL: downloadURL
                            });
                            
                            console.log('Profile image updated successfully');
                            showToast('success', 'Profile image updated successfully');
                        } catch (storageError) {
                            console.error('Firebase Storage error:', storageError);
                            showToast('error', 'Could not upload to Firebase Storage. Using local image instead.');
                            // We already have the local preview working, so just continue
                        }
                        
                        // Hide loading overlay
                        if (loadingOverlay) loadingOverlay.classList.remove('active');
                    } catch (error) {
                        console.error('Error uploading image:', error);
                        showToast('error', 'Error uploading image: ' + error.message);
                        // Hide loading overlay
                        if (loadingOverlay) loadingOverlay.classList.remove('active');
                    }
                }
            };
            
            input.click();
        });
    }
});

// Function to show rating modal
function showRatingModal() {
    const ratingModal = document.getElementById('ratingModal');
    if (ratingModal) {
        // Reset the modal state
        const stars = document.querySelectorAll('.stars i');
        stars.forEach(star => {
            star.classList.remove('fas', 'selected');
            star.classList.add('far');
        });
        
        document.getElementById('rating-comment').value = '';
        document.getElementById('submitRating').disabled = true;
        document.querySelector('.rating-text').textContent = 'Click to rate';
        
        // Show the modal
        ratingModal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
        
        console.log('Rating modal activated');
    } else {
        console.error('Rating modal element not found');
    }
}

// Toast notification system
function showToast(type, message) {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Create toast content
    const toastContent = document.createElement('div');
    toastContent.className = 'toast-content';
    
    // Add appropriate icon based on type
    const icon = document.createElement('span');
    icon.className = 'toast-icon bi';
    switch (type) {
        case 'success':
            icon.classList.add('bi-check-circle-fill');
            break;
        case 'error':
            icon.classList.add('bi-exclamation-triangle-fill');
            break;
        case 'info':
            icon.classList.add('bi-info-circle-fill');
            break;
        default:
            icon.classList.add('bi-bell-fill');
    }
    
    // Create message element
    const messageEl = document.createElement('span');
    messageEl.className = 'toast-message';
    messageEl.textContent = message;
    
    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeToast(toast);
    });
    
    // Assemble toast
    toastContent.appendChild(icon);
    toastContent.appendChild(messageEl);
    toast.appendChild(toastContent);
    toast.appendChild(closeBtn);
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        removeToast(toast);
    }, 5000);
    
    // Click to dismiss
    toast.addEventListener('click', () => {
        removeToast(toast);
    });
}

function removeToast(toast) {
    if (!toast.parentNode) return;
    toast.classList.add('removing');
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 300);
}

// Add keyboard accessibility for form navigation
function setupKeyboardAccessibility() {
    // Add keyboard navigation for edit buttons
    const editButtons = document.querySelectorAll('.edit-btn');
    editButtons.forEach(button => {
        button.setAttribute('tabindex', '0');
        button.setAttribute('role', 'button');
        button.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                button.click();
            }
        });
    });
    
    // Add keyboard navigation for form buttons
    const formButtons = document.querySelectorAll('.form-buttons button');
    formButtons.forEach(button => {
        button.setAttribute('tabindex', '0');
    });
}

// Call setup function
setupKeyboardAccessibility();

// Helper functions for formatting data

// Helper function to format date
function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Return as is if invalid date
    
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Helper function to format position
function formatPosition(position) {
    if (!position) return '';
    
    const positions = {
        'prop': 'Prop',
        'hooker': 'Hooker',
        'lock': 'Lock',
        'flanker': 'Flanker',
        'number8': 'Number 8',
        'scrumhalf': 'Scrum-half',
        'flyhalf': 'Fly-half',
        'center': 'Center',
        'wing': 'Wing',
        'fullback': 'Fullback'
    };
    
    return positions[position] || position;
}

// Helper function to format experience
function formatExperience(experience) {
    if (!experience) return '';
    
    const experiences = {
        'beginner': 'Beginner (0-2 years)',
        'intermediate': 'Intermediate (3-5 years)',
        'advanced': 'Advanced (5+ years)',
        'professional': 'Professional'
    };
    
    return experiences[experience] || experience;
}

// Form validation functions
function validateEmail(input) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(input.value);
    
    if (!isValid && input.value) {
        input.classList.add('invalid');
        if (!input.nextElementSibling || !input.nextElementSibling.classList.contains('error-message')) {
            const errorMsg = document.createElement('div');
            errorMsg.className = 'error-message';
            errorMsg.textContent = 'Please enter a valid email address';
            input.parentNode.insertBefore(errorMsg, input.nextSibling);
        }
        return false;
    } else {
        input.classList.remove('invalid');
        if (input.nextElementSibling && input.nextElementSibling.classList.contains('error-message')) {
            input.parentNode.removeChild(input.nextElementSibling);
        }
        return true;
    }
}

function formatPhoneNumber(input) {
    // Remove all non-digits
    let value = input.value.replace(/\D/g, '');
    
    // Format as XXX-XXX-XXXX
    if (value.length > 0) {
        if (value.length <= 3) {
            input.value = value;
        } else if (value.length <= 6) {
            input.value = `${value.slice(0, 3)}-${value.slice(3)}`;
        } else {
            input.value = `${value.slice(0, 3)}-${value.slice(3, 6)}-${value.slice(6, 10)}`;
        }
    }
}

function validatePhoneNumber(input) {
    const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;
    const isValid = phoneRegex.test(input.value);
    
    if (!isValid && input.value) {
        input.classList.add('invalid');
        if (!input.nextElementSibling || !input.nextElementSibling.classList.contains('error-message')) {
            const errorMsg = document.createElement('div');
            errorMsg.className = 'error-message';
            errorMsg.textContent = 'Please enter a valid phone number (XXX-XXX-XXXX)';
            input.parentNode.insertBefore(errorMsg, input.nextSibling);
        }
        return false;
    } else {
        input.classList.remove('invalid');
        if (input.nextElementSibling && input.nextElementSibling.classList.contains('error-message')) {
            input.parentNode.removeChild(input.nextElementSibling);
        }
        return true;
    }
}