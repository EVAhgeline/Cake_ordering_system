
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
// LOAD ALL SUPPLIERS
// =====================================

async function loadSuppliers() {

    const supplierList = document.getElementById('supplierList');
    const message = document.getElementById('message');

    supplierList.innerHTML =
        '<tr><td colspan="6">Loading suppliers...</td></tr>';

    try {

        const response = await fetch(API_URL, {
            method: 'GET',
            headers: getHeaders()
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to load suppliers.');
        }

        if (!Array.isArray(result)) {
            throw new Error('Invalid supplier data received.');
        }

        supplierList.innerHTML = '';

        if (result.length === 0) {

            supplierList.innerHTML =
                '<tr><td colspan="6">No suppliers found.</td></tr>';

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

                cell.textContent = value ?? '';

                row.appendChild(cell);
            });

            // ACTIONS
            const actionCell = document.createElement('td');

            const editButton = document.createElement('button');

            editButton.type = 'button';
            editButton.textContent = 'Edit';
            editButton.className = 'edit-btn';

            editButton.addEventListener('click', () => {
                editSupplier(supplier);
            });

            const deleteButton = document.createElement('button');

            deleteButton.type = 'button';
            deleteButton.textContent = 'Delete';
            deleteButton.className = 'delete-btn';

            deleteButton.addEventListener('click', () => {
                deleteSupplier(supplier.supplier_id);
            });

            actionCell.appendChild(editButton);
            actionCell.appendChild(deleteButton);

            row.appendChild(actionCell);

            supplierList.appendChild(row);
        });

        message.textContent = `Total suppliers: ${result.length}`;

    } catch (error) {

        console.error('Supplier loading error:', error);

        supplierList.innerHTML =
            '<tr><td colspan="6">Failed to load suppliers.</td></tr>';

        message.textContent = error.message;
    }
}

// =====================================
// ADD OR UPDATE SUPPLIER
// =====================================

document.getElementById('supplierForm')
    .addEventListener('submit', async function(event) {

        event.preventDefault();

        const supplierId =
            document.getElementById('supplierId').value;

        const supplierName =
            document.getElementById('supplierName').value.trim();

        const contact =
            document.getElementById('supplierContact').value.trim();

        const email =
            document.getElementById('supplierEmail').value.trim();

        const address =
            document.getElementById('supplierAddress').value.trim();

        const message = document.getElementById('message');

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

        try {

            const response = await fetch(url, {

                method: isEditing ? 'PUT' : 'POST',

                headers: getHeaders(),

                body: JSON.stringify(supplierData)

            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || 'Unable to save supplier.'
                );
            }

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
        }
    });

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

    if (!confirmed) {
        return;
    }

    const message = document.getElementById('message');

    try {

        const response = await fetch(
            `${API_URL}/${encodeURIComponent(supplierId)}`,
            {
                method: 'DELETE',
                headers: getHeaders()
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || 'Unable to delete supplier.'
            );
        }

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

    document.getElementById('supplierForm').reset();

    document.getElementById('supplierId').value = '';

    document.getElementById('formTitle').textContent =
        'Add New Supplier';

    document.getElementById('submitBtn').textContent =
        'Add Supplier';

    document.getElementById('cancelBtn').hidden = true;
}

// =====================================
// CANCEL EDIT
// =====================================

document.getElementById('cancelBtn')
    .addEventListener('click', resetSupplierForm);

// =====================================
// INITIALIZE PAGE
// =====================================

document.addEventListener('DOMContentLoaded', () => {
    loadSuppliers();
});
