
// ==========================================
// WELCOME POPUP NAVIGATION
// ==========================================

function hideAllWelcomeModals() {
    document.getElementById('welcomeModal').classList.add('hidden');
    document.getElementById('customerModal').classList.add('hidden');
    document.getElementById('employeeModal').classList.add('hidden');
    document.getElementById('employeeSignupModal').classList.add('hidden');
}

function showCustomerForm() {
    hideAllWelcomeModals();

    document.getElementById('customerModal')
        .classList.remove('hidden');
}

function showEmployeeLogin() {
    hideAllWelcomeModals();

    document.getElementById('employeeModal')
        .classList.remove('hidden');
}

function showEmployeeSignup() {
    hideAllWelcomeModals();

    document.getElementById('employeeSignupModal')
        .classList.remove('hidden');
}

function backToWelcome() {
    hideAllWelcomeModals();

    document.getElementById('welcomeModal')
        .classList.remove('hidden');
}


// ==========================================
// CUSTOMER INFORMATION
// ==========================================

document.getElementById('customerForm')
    .addEventListener('submit', function(event) {

        event.preventDefault();

        const name = document.getElementById('customerName')
            .value.trim();

        const phone = document.getElementById('customerPhone')
            .value.trim();

        if (!name || !/^09\d{9}$/.test(phone)) {
            alert('Please enter a valid name and Philippine mobile number.');
            return;
        }

        // Store customer information for this browser session
        sessionStorage.setItem('customerName', name);
        sessionStorage.setItem('customerPhone', phone);

        // Close popup and display the cake gallery
        hideAllWelcomeModals();

        alert('Welcome, ' + name + '! Enjoy choosing your cake.');

    });


// ==========================================
// EMPLOYEE LOGIN
// ==========================================

// This requires a real backend login endpoint.
// Employee passwords must be verified by the server.

document.getElementById('employeeLoginForm')
    .addEventListener('submit', async function(event) {

        event.preventDefault();

        const employeeID = document.getElementById('employeeID')
            .value.trim();

        const password = document.getElementById('employeePassword')
            .value;

        try {
            const response = await fetch(
                'http://localhost:12067/api/auth/login',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        employee_id: employeeID,
                        password: password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed.');
            }

            // Save the authentication token, not the password
            sessionStorage.setItem('employeeToken', data.token);

            alert('Welcome, ' + (data.name || 'Employee') + '!');

            // Change this to your actual employee dashboard page
            window.location.href =
                data.redirectUrl || 'employee-dashboard.html';

        } catch (error) {
            alert(error.message);
        }
    });


// ==========================================
// EMPLOYEE SIGN UP
// ==========================================

document.getElementById('employeeSignupForm')
    .addEventListener('submit', async function(event) {

        event.preventDefault();

        const name = document.getElementById('signupName')
            .value.trim();

        const employeeID = document.getElementById('signupEmployeeID')
            .value.trim();

        const password = document.getElementById('signupPassword')
            .value;

        const confirmPassword = document.getElementById('confirmPassword')
            .value;

        if (password.length < 8) {
            alert('Password must contain at least 8 characters.');
            return;
        }

        if (password !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }

        try {
            const response = await fetch(
                'http://localhost:12067/api/auth/register',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: name,
                        employee_id: employeeID,
                        password: password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed.');
            }

            alert('Employee account created successfully! Please log in.');

            document.getElementById('employeeSignupForm').reset();

            showEmployeeLogin();

        } catch (error) {
            alert(error.message);
        }
    });
