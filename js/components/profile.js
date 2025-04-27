export function initializeProfile() {
    // Toggle profile panel
    window.toggleProfile = () => {
        const overlay = document.getElementById('profileOverlay');
        overlay.classList.toggle('active');
    };

    // Handle profile image upload
    const profilePicture = document.getElementById('profile-picture');
    profilePicture.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const avatar = document.querySelector('.profile-avatar img');
                if (!avatar) {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    document.querySelector('.profile-avatar').appendChild(img);
                } else {
                    avatar.src = e.target.result;
                }
            };
            reader.readAsDataURL(file);
        }
    });

    // Handle profile edits
    let isEditing = false;
    const editButton = document.getElementById('edit-profile');
    editButton.addEventListener('click', () => {
        const fields = document.querySelectorAll('.profile-field input:not([readonly]), .profile-field select');
        if (!isEditing) {
            // Enable editing
            fields.forEach(field => field.removeAttribute('disabled'));
            editButton.textContent = 'Save Changes';
            isEditing = true;
        } else {
            // Save changes
            fields.forEach(field => field.setAttribute('disabled', ''));
            editButton.textContent = 'Edit Profile';
            isEditing = false;
            saveProfile();
        }
    });
}

function saveProfile() {
    // Get all form values
    const data = {
        fullName: document.getElementById('full-name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone-number').value,
        location: document.getElementById('location').value,
        club: document.getElementById('rugby-club').value
    };

    // Save to session storage
    Object.entries(data).forEach(([key, value]) => {
        sessionStorage.setItem(key, value);
    });

    // Show success message
    alert('Profile updated successfully!');
}
