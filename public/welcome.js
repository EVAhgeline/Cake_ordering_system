
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

        // Store customer information
        sessionStorage.setItem('customerName', name);
        sessionStorage.setItem('customerPhone', phone);

        // Close popup
        hideAllWelcomeModals();

        alert('Welcome, ' + name + '! Enjoy choosing your cake.');
    });


// ==========================================
// EMPLOYEE LOGIN
// ==========================================

document.getElementById('employeeLoginForm')
    .addEventListener('submit', async function(event) {

        event.preventDefault();

        const employeeID = document.getElementById('employeeID')
            .value.trim();

        const password = document.getElementById('employeePassword')
            .value;

        if (!employeeID || !password) {
            alert('Please enter your Employee ID and password.');
            return;
        }

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    employee_id: employeeID,
                    password: password
                })
            });

            const data = await response.json().catch(() => ({
                success: false,
                message: 'Invalid server response. Please check your backend.'
            }));

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Login failed.');
            }

            if (!data.token) {
                throw new Error('Login token was not provided by the server.');
            }

            // Save authentication token
            sessionStorage.setItem('employeeToken', data.token);

            // Save employee information
            sessionStorage.setItem(
                'employeeName',
                data.name || 'Employee'
            );

            sessionStorage.setItem(
                'employeeID',
                employeeID
            );

            alert('Welcome, ' + (data.name || 'Employee') + '!');

            // Redirect to Employee and Inventory Management
            window.location.href = '/employee-inventory.html';

        } catch (error) {
            console.error('Employee login error:', error);

            alert(
                error.message || 'Unable to log in. Please try again.'
            );
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

        // Validate registration information
        if (!name || !employeeID || !password || !confirmPassword) {
            alert('Please complete all registration fields.');
            return;
        }

        if (password.length < 8) {
            alert('Password must contain at least 8 characters.');
            return;
        }

        if (password !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: name,
                    employee_id: employeeID,
                    password: password
                })
            });

            const data = await response.json().catch(() => ({
                success: false,
                message: 'Invalid server response. Please check your backend.'
            }));

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || 'Employee registration failed.'
                );
            }

            alert(
                'Employee account created successfully! Please log in.'
            );

            // Clear registration form
            document.getElementById('employeeSignupForm').reset();

            // Return to employee login
            showEmployeeLogin();

        } catch (error) {
            console.error('Employee registration error:', error);

            alert(
                error.message || 'Unable to register. Please try again.'
            );
        }
    });
