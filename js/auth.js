// Import Firebase modules
import { auth, db } from './firebase-init.js';
import { createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword, sendPasswordResetEmail, signOut, GoogleAuthProvider, signInWithPopup, FacebookAuthProvider, fetchSignInMethodsForEmail, updateProfile } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, setDoc, serverTimestamp, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Wait for Firebase to be ready
document.addEventListener('DOMContentLoaded', () => {
    
    // Initialize password strength meter
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('input', () => {
            const strength = calculatePasswordStrength(passwordInput.value);
            updatePasswordStrengthMeter(strength);
        });
    }

    // Initialize password toggle buttons
    const toggleButtons = document.querySelectorAll('.toggle-password');
    toggleButtons.forEach(button => {
        const input = button.previousElementSibling;
        if (input) {
            button.innerHTML = '<i class="bi bi-eye"></i>';
            button.addEventListener('click', () => togglePassword(input.id));
        }
    });

    // Check for email verification success
    if (window.location.href.includes('login.html') && window.location.search.includes('verified=true')) {
        displayMessage('success', 'Email verified successfully! You can now log in to your account.');
    }

    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitButton = signupForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            try {
                await handleSignup(e, submitButton);
            } catch (error) {
                console.error('Signup error:', error);
                submitButton.disabled = false;
            }
        });
    }

    async function handleSignup(e, submitButton) {
        e.preventDefault();
        
        // Clear any existing messages
        const errorDiv = document.getElementById('errorMessage');
        const successDiv = document.getElementById('successMessage');
        if (errorDiv) errorDiv.style.display = 'none';
        if (successDiv) successDiv.style.display = 'none';

        try {
            // Get form data
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
            const username = document.getElementById('username').value;
            const dateOfBirth = document.getElementById('dateOfBirth').value;
            const occupation = document.getElementById('occupation').value;
            const phone = document.getElementById('phone').value;
            const position = document.getElementById('position').value;
            const experience = document.getElementById('experience').value;

            // Validate date of birth
            if (!validateAge(dateOfBirth)) {
                showMessage('error', 'You must be at least 18 years old to register');
                submitButton.disabled = false;
                return;
            }

            // Validate passwords match
            if (password !== confirmPassword) {
                showMessage('error', 'Passwords do not match');
                submitButton.disabled = false;
                return;
            }

            // Validate password strength
            const strength = calculatePasswordStrength(password);
            if (strength < 75) {
                showMessage('error', 'Please use a stronger password');
                submitButton.disabled = false;
                return;
            }

            // Create user account
            console.log('Attempting to create user with email:', email);
            try {
                // First check if email exists
                const signInMethods = await fetchSignInMethodsForEmail(auth, email);
                if (signInMethods.length > 0) {
                    throw new Error('This email is already registered. Please try signing in.');
                }

                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                if (!user) {
                    throw new Error('Failed to create user account');
                }

                // Send email verification with actionCodeSettings
                const actionCodeSettings = {
                    url: window.location.origin + '/html/login.html?verified=true',
                    // This must be true for production apps after Dynamic Links sunset
                    handleCodeInApp: true
                };
                await sendEmailVerification(user, actionCodeSettings);

                // Update user profile
                await updateProfile(user, {
                    displayName: `${firstName} ${lastName}`
                });

                // Save user data to Firestore
                const userDocRef = doc(db, 'users', user.uid);
                await setDoc(userDocRef, {
                    firstName: firstName,
                    lastName: lastName,
                    username: username,
                    email: email,
                    dateOfBirth: dateOfBirth,
                    phone: phone,
                    occupation: occupation,
                    position: position,
                    experience: experience,
                    emailVerified: false,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });

                // Show verification modal
                showVerificationModal(email);
                
                // Reset form
                document.getElementById('signupForm').reset();
                
            } catch (error) {
                console.error('Error during signup:', error);
                showMessage('error', error.message || 'Failed to create account');
                submitButton.disabled = false;
                return;
            }
        } catch (error) {
            console.error('Form processing error:', error);
            showMessage('error', 'An error occurred while processing your registration');
            submitButton.disabled = false;
        }
    }

    // Display verification modal
    function showVerificationModal(email) {
        const modal = document.getElementById('successModal');
        const modalMessage = document.getElementById('modalMessage');
        
        if (modal && modalMessage) {
            modalMessage.innerHTML = `
                <h4 class="mb-3">Email Verification Required</h4>
                <p>We've sent a verification email to <strong>${email}</strong>.</p>
                <p>Please check your inbox and click the verification link to activate your account.</p>
                <p class="small text-muted">If you don't see the email, please check your spam folder.</p>
                <div class="mt-4">
                    <button class="btn btn-primary" onclick="resendVerificationEmail('${email}')">Resend Verification Email</button>
                </div>
                <div class="mt-3">
                    <p class="mb-1">Already verified your email?</p>
                    <a href="../html/login.html" class="btn btn-outline-success">Go to Login</a>
                </div>
            `;
            modal.style.display = 'flex';
            
            // Close modal when clicking outside
            modal.addEventListener('click', function(event) {
                if (event.target === modal) {
                    // Don't close the modal when clicking outside
                    // This ensures the user sees and acts on the verification message
                    // modal.style.display = 'none';
                    return;
                }
            });

            // Add close button functionality
            const closeBtn = modal.querySelector('.close-modal');
            if (closeBtn) {
                closeBtn.addEventListener('click', function() {
                    modal.style.display = 'none';
                });
            }
        }
    }

    // Resend verification email
    window.resendVerificationEmail = async function(email) {
        try {
            // Need to reauthenticate to get the current user
            const currentUser = auth.currentUser;
            
            if (currentUser) {
                // Send with actionCodeSettings
                const actionCodeSettings = {
                    url: window.location.origin + '/html/login.html?verified=true',
                    // This must be true for production apps after Dynamic Links sunset
                    handleCodeInApp: true
                };
                await sendEmailVerification(currentUser, actionCodeSettings);
                
                const modalMessage = document.getElementById('modalMessage');
                if (modalMessage) {
                    modalMessage.innerHTML = `
                        <div class="alert alert-success">
                            Verification email resent successfully!
                        </div>
                        <p>We've sent another verification email to <strong>${email}</strong>.</p>
                        <p>Please check your inbox and click the verification link to activate your account.</p>
                        <div class="mt-4">
                            <button class="btn btn-primary" onclick="resendVerificationEmail('${email}')">Resend Verification Email</button>
                            <a href="../html/login.html" class="btn btn-outline-secondary mt-2">Go to Login</a>
                        </div>
                    `;
                }
            } else {
                // If user is not available (e.g., page was refreshed), show error
                throw new Error('User session expired. Please try logging in again.');
            }
        } catch (error) {
            console.error('Error resending verification email:', error);
            const modalMessage = document.getElementById('modalMessage');
            if (modalMessage) {
                modalMessage.innerHTML = `
                    <div class="alert alert-danger">
                        ${error.message || 'Failed to resend verification email'}
                    </div>
                    <p>Please try again or contact support if the problem persists.</p>
                    <div class="mt-4">
                        <button class="btn btn-primary" onclick="resendVerificationEmail('${email}')">Try Again</button>
                        <a href="../html/login.html" class="btn btn-outline-secondary mt-2">Go to Login</a>
                    </div>
                `;
            }
        }
    };

    // Handle Logout
    window.handleLogout = async () => {
        try {
            await signOut(auth);
            window.location.href = '../html/login.html';
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    // Utility functions
    function getErrorMessage(code) {
        switch (code) {
            case 'auth/invalid-email': return 'Invalid email address';
            case 'auth/user-disabled': return 'Account has been disabled';
            case 'auth/user-not-found': return 'No account found with this email';
            case 'auth/wrong-password': return 'Incorrect password';
            case 'auth/email-already-in-use': return 'An account with this email already exists';
            case 'auth/weak-password': return 'Password is too weak';
            case 'auth/operation-not-allowed': return 'Email/password accounts are not enabled. Please contact support.';
            default: return 'An error occurred. Please try again.';
        }
    }

    // Handle Password Reset
    window.handlePasswordReset = async (event) => {
        event.preventDefault();
        const email = document.getElementById('email').value;
        
        try {
            // Use actionCodeSettings for password reset
            const actionCodeSettings = {
                url: window.location.origin + '/html/login.html',
                // This must be true for production apps after Dynamic Links sunset
                handleCodeInApp: true
            };
            await sendPasswordResetEmail(auth, email, actionCodeSettings);
            showSuccess('Password reset email sent!');
        } catch (error) {
            showError('Failed to send reset email');
        }
    };

    // Password toggle utility
    function togglePassword(inputId) {
        const input = document.getElementById(inputId);
        const button = input.nextElementSibling;
        if (button) {
            const icon = button.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                if (icon) icon.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                input.type = 'password';
                if (icon) icon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        }
    }

    // Handle Sign In
    async function handleSignIn(email, password) {
        try {
            // Attempt to sign in with email and password
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Check if email is verified
            if (!user.emailVerified) {
                // Show verification required message
                displayMessage('error', 'Please verify your email before logging in. Check your inbox for a verification link.');
                
                // Add a button to resend verification email
                const errorMessage = document.getElementById('errorMessage');
                if (errorMessage) {
                    const resendButton = document.createElement('button');
                    resendButton.className = 'btn btn-link p-0 text-primary';
                    resendButton.textContent = 'Resend verification email';
                    resendButton.onclick = async () => {
                        try {
                            // Send verification email with actionCodeSettings
                            const actionCodeSettings = {
                                url: window.location.origin + '/html/login.html?verified=true',
                                // This must be true for production apps after Dynamic Links sunset
                                handleCodeInApp: true
                            };
                            await sendEmailVerification(user, actionCodeSettings);
                            displayMessage('success', 'Verification email sent! Please check your inbox.');
                        } catch (err) {
                            displayMessage('error', 'Failed to send verification email. Please try again later.');
                        }
                    };
                    errorMessage.appendChild(resendButton);
                }
                
                // Sign out the user since they're not verified
                await signOut(auth);
                return false;
            }
            
            // Update user's emailVerified status in Firestore if needed
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists() && userDoc.data().emailVerified === false) {
                await updateDoc(userDocRef, {
                    emailVerified: true,
                    lastLogin: serverTimestamp()
                });
            }
            
            // Check if charts should be initialized
            if (userDoc.exists() && userDoc.data().preferences?.charts?.enabled) {
                window.dispatchEvent(new CustomEvent('chartInit', {
                    detail: userDoc.data().preferences.charts
                }));
            }
            
            return true;
        } catch (error) {
            displayMessage('error', getErrorMessage(error.code));
            return false;
        }
    }

    // Password strength calculator
    function calculatePasswordStrength(password) {
        let strength = 0;
        
        // Length check
        if (password.length >= 8) strength += 25;
        
        // Contains number
        if (/\d/.test(password)) strength += 25;
        
        // Contains lowercase
        if (/[a-z]/.test(password)) strength += 25;
        
        // Contains uppercase
        if (/[A-Z]/.test(password)) strength += 25;
        
        return strength;
    }

    // Update password strength meter
    function updatePasswordStrengthMeter(strength) {
        const meter = document.querySelector('.password-strength-meter');
        if (!meter) return;

        // Update the width of the strength bar
        meter.style.setProperty('--strength', `${strength}%`);
        
        // Update color based on strength
        let color = '#dc3545'; // red for weak
        if (strength >= 75) color = '#28a745'; // green for strong
        else if (strength >= 50) color = '#ffc107'; // yellow for medium
        
        meter.style.setProperty('--strength-color', color);
    }

    function showMessage(type, message) {
        if (type === 'success') {
            const modal = document.getElementById('successModal');
            const modalMessage = document.getElementById('modalMessage');
            if (modal && modalMessage) {
                modalMessage.textContent = message;
                modal.style.display = 'flex';
                // Modal will be automatically hidden by the redirect
            }
        } else {
            const messageDiv = document.getElementById(`${type}Message`);
            if (messageDiv) {
                messageDiv.style.display = 'block';
                messageDiv.style.opacity = '0';
                messageDiv.textContent = message;
                
                setTimeout(() => {
                    messageDiv.style.transition = 'opacity 0.5s ease-in';
                    messageDiv.style.opacity = '1';
                }, 10);

                setTimeout(() => {
                    messageDiv.style.opacity = '0';
                    setTimeout(() => {
                        messageDiv.style.display = 'none';
                    }, 500);
                }, 4500);
            }
        }
    }

    function displayMessage(type, message) {
        const messageElement = document.getElementById(`${type}Message`);
        if (messageElement) {
            messageElement.textContent = message;
            messageElement.style.display = 'block';
            setTimeout(() => {
                messageElement.style.display = 'none';
            }, 5000);
        }
    }

    function validateAge(dateString) {
        const today = new Date();
        const birthDate = new Date(dateString);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        // Adjust age if birthday hasn't occurred this year
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        return age >= 18;
    }

    function loginWithGoogle() {
        console.log('Attempting Google login...');
        const provider = new GoogleAuthProvider();
        showLoginLoader();
        
        signInWithPopup(auth, provider)
            .then((result) => {
                // This gives you a Google Access Token
                const credential = GoogleAuthProvider.credentialFromResult(result);
                const token = credential.accessToken;
                // The signed-in user info
                const user = result.user;
                window.location.href = 'dashboard.html';
            })
            .catch((error) => {
                console.error('Google login error:', error);
                // Handle Errors here
                const errorCode = error.code;
                const errorMessage = error.message;
                showMessage('error', errorMessage || 'Failed to login with Google');
            });
    }

    function loginWithFacebook() {
        console.log('Attempting Facebook login...');
        const provider = new FacebookAuthProvider();
        showLoginLoader();
        
        signInWithPopup(auth, provider)
            .then((result) => {
                // This gives you a Facebook Access Token
                const credential = FacebookAuthProvider.credentialFromResult(result);
                const token = credential.accessToken;
                // The signed-in user info
                const user = result.user;
                window.location.href = 'dashboard.html';
            })
            .catch((error) => {
                console.error('Facebook login error:', error);
                // Handle Errors here
                const errorCode = error.code;
                const errorMessage = error.message;
                showMessage('error', errorMessage || 'Failed to login with Facebook');
            });
    }

    function showLoginLoader() {
        const button = event.target;
        const originalText = button.innerHTML;
        button.innerHTML = '<span class="loader"></span>';
        button.disabled = true;
        
        // Reset button after loading
        setTimeout(() => {
            button.innerHTML = originalText;
            button.disabled = false;
        }, 1500);
    }
});
