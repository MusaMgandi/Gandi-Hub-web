import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { doc, setDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { kenyaLocations } from '../data/kenya-locations.js';

document.addEventListener('DOMContentLoaded', function() {
    const countryInput = document.getElementById('country');
    const countySelect = document.getElementById('county');
    const constituencySelect = document.getElementById('constituency');
    const registrationForm = document.getElementById('registrationForm');
    const loader = document.getElementById('loader');
    const buttonText = document.getElementById('buttonText');

    // Enable/disable county select based on country input
    countryInput.addEventListener('input', function() {
        const isKenya = this.value.toLowerCase() === 'kenya';
        countySelect.disabled = !isKenya;
        constituencySelect.disabled = true;
        
        if (isKenya) {
            populateCounties();
        } else {
            countySelect.innerHTML = '<option value="">Select County</option>';
            constituencySelect.innerHTML = '<option value="">Select Constituency</option>';
        }
    });

    function populateCounties() {
        countySelect.innerHTML = '<option value="">Select County</option>';
        Object.keys(kenyaLocations).sort().forEach(county => {
            const option = document.createElement('option');
            option.value = county;
            option.textContent = county;
            countySelect.appendChild(option);
        });
    }

    // Handle county selection
    countySelect.addEventListener('change', function() {
        const selectedCounty = this.value;
        constituencySelect.innerHTML = '<option value="">Select Constituency</option>';
        
        if (selectedCounty && kenyaLocations[selectedCounty]) {
            kenyaLocations[selectedCounty].constituencies.sort().forEach(constituency => {
                const option = document.createElement('option');
                option.value = constituency;
                option.textContent = constituency;
                constituencySelect.appendChild(option);
            });
            constituencySelect.disabled = false;
        } else {
            constituencySelect.disabled = true;
        }
    });

    // Initialize location fields
    function initializeLocationFields() {
        // Set default country
        countryInput.value = 'Kenya';
        
        // Enable county and constituency selects
        countySelect.disabled = false;
        constituencySelect.disabled = false;
    }

    // Initialize location fields when page loads
    initializeLocationFields();

    // Form submission handler
    registrationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Show loader
        loader.style.display = 'block';
        buttonText.style.display = 'none';

        try {
            // Create user authentication
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                registrationForm.email.value,
                registrationForm.password.value
            );

            // Store additional user data in Firestore
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                firstName: registrationForm.firstName.value,
                lastName: registrationForm.lastName.value,
                dateOfBirth: registrationForm.dob.value,
                phone: `${registrationForm.countryCode.value}${registrationForm.phone.value}`,
                email: registrationForm.email.value,
                location: {
                    country: registrationForm.country.value,
                    county: registrationForm.county.value
                },
                occupation: registrationForm.occupation.value,
                club: registrationForm.club.value,
                createdAt: new Date().toISOString()
            });

            // Success - redirect to dashboard
            window.location.href = 'dashboard.html';

        } catch (error) {
            // Hide loader
            loader.style.display = 'none';
            buttonText.style.display = 'block';

            // Show error message
            alert(error.message);
            console.error('Registration error:', error);
        }
    });
});
