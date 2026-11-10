
const API_URL = '/api/suppliers';

// =====================================
// GET AUTH HEADERS
// =====================================

function getHeaders() {
    const headers = {
        'Content-Type': 'application/json'
    };

    const token = sessionStorage.getItem('employeeToken');

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return headers;
}


// =====================================
// FETCH JSON RESPONSE
// =====================================

async function fetchJSON(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            ...getHeaders(),
            ...(options.headers || {})
        }
    });

    const contentType = response.headers.get('content-type') || '';

    let result = {};

    if (contentType.includes('application/json')) {
        result = await response.json();
    } else {
        const text = await response.text();

        if (!response.ok) {
            throw new Error(text || `Request failed (${response.status}).`);
        }

        throw new Error('The server did not return JSON. Check your API route.');
    }

    if (!response.ok) {
        throw new Error(
            result.message || `Request failed (${response.status}).`
        );
    }

    return result;
}


// =====================================
// LOAD ALL SUPPLIERS
// =====================================

async function loadSuppliers() {
    const supplierList = document.getElementById('supplierList');
    const message = document.getElementById('message');

    supplierList.innerHTML = `
        <tr>
            <td colspan="6">Loading suppliers...</td>
        </tr>
    `;

    message.textContent = 'Loading suppliers...';

    try {
        const result = await fetchJSON(API_URL);

        if (!Array.isArray(result)) {
            throw new Error('Invalid supplier data received from the server.');
        }

        supplierList.replaceChildren();

        if (result.length === 0) {
            supplierList.innerHTML = `
                <tr>
                    <td colspan="6">No suppliers found.</td>
                </tr>
            `;

            message.textContent = 'No supplier records available.';
            return;
        }

        result.forEach(supplier => {
            const row = document.createElement('tr');

            const values = [
                supplier.supplier_id,
                supplier.supplier_name,
                supplier.contact,
                supplier.email,
                supplier.address
            ];

            values.forEach(value => {
                const cell = document.createElement('td');
                cell.textContent = value ?? '—';
                row.appendChild(cell);
            });

            // EDIT BUTTON
            const actionCell = document.createElement('td');

            const editButton = document.createElement('button');
            editButton.type = 'button';
            editButton.textContent = 'Edit';
            editButton.className = 'edit-btn';

            editButton.addEventListener('click', () => {
                editSupplier(supplier);
            });

            // DELETE BUTTON
            const deleteButton = document.createElement('button');
            deleteButton.type = 'button';
            deleteButton.textContent = 'Delete';
            deleteButton.className = 'delete-btn';

            deleteButton.addEventListener('click', () => {
                deleteSupplier(supplier.supplier_id);
            });

            actionCell.append(editButton, deleteButton);
            row.appendChild(actionCell);

            supplierList.appendChild(row);
        });

        message.textContent = `Total suppliers: ${result.length}`;

    } catch (error) {
        console.error('Supplier loading error:', error);

        supplierList.innerHTML = `
            <tr>
                <td colspan="6">Failed to load suppliers.</td>
            </tr>
        `;

        message.textContent = error.message;
    }
}


// =====================================
// ADD OR UPDATE SUPPLIER
// =====================================

async function saveSupplier(event) {
    event.preventDefault();

    const supplierId = document.getElementById('supplierId').value;

    const supplierName = document.getElementById('supplierName').value.trim();
    const contact = document.getElementById('supplierContact').value.trim();
    const email = document.getElementById('supplierEmail').value.trim();
    const address = document.getElementById('supplierAddress').value.trim();

    const message = document.getElementById('message');
    const submitButton = document.getElementById('submitBtn');

    if (!supplierName) {
        message.textContent = 'Supplier name is required.';
        return;
    }

    const supplierData = {
        supplier_name: supplierName,
        contact,
        email,
        address
    };

    const isEditing = Boolean(supplierId);

    const url = isEditing
        ? `${API_URL}/${encodeURIComponent(supplierId)}`
        : API_URL;

    submitButton.disabled = true;
    submitButton.textContent = isEditing ? 'Updating...' : 'Saving...';

    try {
        await fetchJSON(url, {
            method: isEditing ? 'PUT' : 'POST',
            body: JSON.stringify(supplierData)
        });

        alert(
            isEditing
                ? 'Supplier updated successfully!'
                : 'Supplier added successfully!'
        );

        resetSupplierForm();
        await loadSuppliers();

    } catch (error) {
        console.error('Supplier save error:', error);
        message.textContent = error.message;

    } finally {
        submitButton.disabled = false;

        submitButton.textContent =
            document.getElementById('supplierId').value
                ? 'Update Supplier'
                : 'Add Supplier';
    }
}


// =====================================
// EDIT SUPPLIER
// =====================================

function editSupplier(supplier) {
    document.getElementById('supplierId').value =
        supplier.supplier_id;

    document.getElementById('supplierName').value =
        supplier.supplier_name || '';

    document.getElementById('supplierContact').value =
        supplier.contact || '';

    document.getElementById('supplierEmail').value =
        supplier.email || '';

    document.getElementById('supplierAddress').value =
        supplier.address || '';

    document.getElementById('formTitle').textContent =
        'Update Supplier';

    document.getElementById('submitBtn').textContent =
        'Update Supplier';

    document.getElementById('cancelBtn').hidden = false;

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}


// =====================================
// DELETE SUPPLIER
// =====================================

async function deleteSupplier(supplierId) {
    const confirmed = confirm(
        'Are you sure you want to delete this supplier?'
    );

    if (!confirmed) return;

    const message = document.getElementById('message');

    try {
        await fetchJSON(
            `${API_URL}/${encodeURIComponent(supplierId)}`,
            {
                method: 'DELETE'
            }
        );

        alert('Supplier deleted successfully!');

        resetSupplierForm();
        await loadSuppliers();

    } catch (error) {
        console.error('Supplier deletion error:', error);
        message.textContent = error.message;
    }
}


// =====================================
// RESET SUPPLIER FORM
// =====================================

function resetSupplierForm() {
    const form = document.getElementById('supplierForm');

    form.reset();

    document.getElementById('supplierId').value = '';

    document.getElementById('formTitle').textContent =
        'Add New Supplier';

    document.getElementById('submitBtn').textContent =
        'Add Supplier';

    document.getElementById('cancelBtn').hidden = true;
}


// =====================================
// INITIALIZE SUPPLIER MANAGEMENT
// =====================================

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('supplierForm')
        .addEventListener('submit', saveSupplier);

    document.getElementById('cancelBtn')
        .addEventListener('click', resetSupplierForm);

    loadSuppliers();
});
