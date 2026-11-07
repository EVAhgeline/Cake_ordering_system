
const API_URL = 'http://localhost:12067/api';

let employees = [];

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('employeeForm')
        .addEventListener('submit', saveEmployee);

    document.getElementById('employeeSearch')
        .addEventListener('input', searchEmployees);

    document.getElementById('cancelEmployee')
        .addEventListener('click', resetEmployeeForm);

    loadEmployees();
});

// ==========================================
// API RESPONSE HELPER
// ==========================================

async function readResponse(response) {
    const text = await response.text();

    let result;

    try {
        result = text ? JSON.parse(text) : {};
    } catch {
        throw new Error(
            'The server did not return JSON. Check your API route.'
        );
    }

    if (!response.ok) {
        throw new Error(result.message || 'Request failed.');
    }

    return result;
}

// ==========================================
// LOAD EMPLOYEES
// ==========================================

async function loadEmployees() {
    const table = document.getElementById('employeeTableBody');

    try {
        table.innerHTML = `
            <tr>
                <td colspan="8">Loading employees...</td>
            </tr>
        `;

        const response = await fetch(`${API_URL}/employees`);
        const result = await readResponse(response);

        employees = Array.isArray(result)
            ? result
            : result.data || [];

        displayEmployees(employees);

    } catch (error) {
        console.error('Employee loading error:', error);

        table.innerHTML = `
            <tr>
                <td colspan="8">${escapeHTML(error.message)}</td>
            </tr>
        `;
    }
}

// ==========================================
// DISPLAY EMPLOYEES
// ==========================================

function displayEmployees(data) {
    const table = document.getElementById('employeeTableBody');

    if (!data.length) {
        table.innerHTML = `
            <tr>
                <td colspan="8">No employee records found.</td>
            </tr>
        `;
        return;
    }

    table.innerHTML = data.map(employee => `
        <tr>
            <td>${escapeHTML(employee.employee_id)}</td>
            <td>${escapeHTML(employee.name)}</td>
            <td>${escapeHTML(employee.role)}</td>
            <td>${escapeHTML(employee.contact || '-')}</td>
            <td>${escapeHTML(employee.email || '-')}</td>
            <td>${escapeHTML(employee.hire_date || '-')}</td>
            <td>${escapeHTML(employee.status || '-')}</td>
            <td>
                <button
                    type="button"
                    class="edit-btn"
                    onclick="editEmployee(${Number(employee.employee_id)})">
                    Edit
                </button>

                <button
                    type="button"
                    class="delete-btn"
                    onclick="deleteEmployee(${Number(employee.employee_id)})">
                    Delete
                </button>
            </td>
        </tr>
    `).join('');
}

// ==========================================
// ADD / UPDATE EMPLOYEE
// ==========================================

async function saveEmployee(event) {
    event.preventDefault();

    const employeeId =
        document.getElementById('employeeId').value;

    const employee = {
        name: document.getElementById('name').value.trim(),
        role: document.getElementById('role').value.trim(),
        contact: document.getElementById('contact').value.trim(),
        email: document.getElementById('email').value.trim(),
        address: document.getElementById('address').value.trim(),
        hire_date: document.getElementById('hire_date').value || null,
        status: document.getElementById('status').value
    };

    const message = document.getElementById('formMessage');

    if (!employee.name || !employee.role) {
        message.textContent =
            'Please enter the employee name and role.';
        return;
    }

    try {
        const url = employeeId
            ? `${API_URL}/employees/${employeeId}`
            : `${API_URL}/employees`;

        const response = await fetch(url, {
            method: employeeId ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(employee)
        });

        const result = await readResponse(response);

        message.textContent =
            result.message || 'Employee saved successfully!';

        resetEmployeeForm();
        await loadEmployees();

    } catch (error) {
        console.error('Save employee error:', error);
        message.textContent = error.message;
    }
}

// ==========================================
// EDIT EMPLOYEE
// ==========================================

function editEmployee(id) {
    const employee = employees.find(
        item => Number(item.employee_id) === Number(id)
    );

    if (!employee) {
        alert('Employee not found.');
        return;
    }

    document.getElementById('employeeId').value =
        employee.employee_id;

    document.getElementById('name').value =
        employee.name || '';

    document.getElementById('role').value =
        employee.role || '';

    document.getElementById('contact').value =
        employee.contact || '';

    document.getElementById('email').value =
        employee.email || '';

    document.getElementById('address').value =
        employee.address || '';

    document.getElementById('hire_date').value =
        employee.hire_date
            ? String(employee.hire_date).substring(0, 10)
            : '';

    document.getElementById('status').value =
        employee.status || 'Active';

    document.getElementById('formTitle').textContent =
        'Update Employee';

    document.getElementById('saveBtn').textContent =
        'Save Changes';

    document.getElementById('formMessage').textContent = '';

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// ==========================================
// DELETE EMPLOYEE
// ==========================================

async function deleteEmployee(id) {
    if (!confirm('Are you sure you want to delete this employee?')) {
        return;
    }

    try {
        const response = await fetch(
            `${API_URL}/employees/${id}`,
            { method: 'DELETE' }
        );

        const result = await readResponse(response);

        alert(result.message || 'Employee deleted successfully!');

        resetEmployeeForm();
        await loadEmployees();

    } catch (error) {
        console.error('Delete employee error:', error);
        alert(error.message);
    }
}

// ==========================================
// SEARCH EMPLOYEES
// ==========================================

function searchEmployees() {
    const search = document.getElementById('employeeSearch')
        .value.toLowerCase();

    const filtered = employees.filter(employee =>
        String(employee.employee_id).includes(search) ||
        (employee.name || '').toLowerCase().includes(search) ||
        (employee.role || '').toLowerCase().includes(search) ||
        (employee.email || '').toLowerCase().includes(search) ||
        (employee.contact || '').toLowerCase().includes(search)
    );

    displayEmployees(filtered);
}

// ==========================================
// RESET FORM
// ==========================================

function resetEmployeeForm() {
    document.getElementById('employeeForm').reset();

    document.getElementById('employeeId').value = '';

    document.getElementById('formTitle').textContent =
        'Add New Employee';

    document.getElementById('saveBtn').textContent =
        'Add Employee';

    document.getElementById('formMessage').textContent = '';
}

// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[char]);
}
