
const API_URL = '/api/suppliers';

// =====================================
// API REQUEST
// =====================================

async function fetchSuppliers() {
    const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
            Accept: 'application/json'
        }
    });

    const responseText = await response.text();

    let result;

    try {
        result = responseText ? JSON.parse(responseText) : [];
    } catch {
        throw new Error('Invalid response received from the supplier server.');
    }

    if (!response.ok) {
        throw new Error(
            result.message ||
            result.error ||
            `Unable to load suppliers. Status: ${response.status}`
        );
    }

    if (Array.isArray(result)) {
        return result;
    }

    if (result && Array.isArray(result.data)) {
        return result.data;
    }

    throw new Error('Invalid supplier data received from the server.');
}

// =====================================
// LOAD SUPPLIERS
// =====================================

async function loadSuppliers() {
    const supplierList = document.getElementById('supplierList');
    const message = document.getElementById('message');

    if (!supplierList) {
        console.error('Supplier table body #supplierList was not found.');
        return;
    }

    supplierList.innerHTML =
        '<tr><td colspan="5">Loading suppliers...</td></tr>';

    if (message) message.textContent = '';

    try {
        const suppliers = await fetchSuppliers();

        supplierList.innerHTML = '';

        if (suppliers.length === 0) {
            supplierList.innerHTML =
                '<tr><td colspan="5">No suppliers found.</td></tr>';
            return;
        }

        suppliers.forEach(supplier => {
            const row = document.createElement('tr');

            const values = [
                supplier.supplier_id ?? supplier.id ?? '',
                supplier.supplier_name ?? supplier.name ?? '',
                supplier.contact_person ?? '',
                supplier.phone ?? supplier.contact_number ?? '',
                supplier.email ?? ''
            ];

            values.forEach(value => {
                const cell = document.createElement('td');
                cell.textContent = value ?? '';
                row.appendChild(cell);
            });

            supplierList.appendChild(row);
        });

        console.log(`${suppliers.length} suppliers loaded successfully.`);

    } catch (error) {
        console.error('Supplier loading error:', error);

        supplierList.innerHTML =
            '<tr><td colspan="5">Failed to load suppliers.</td></tr>';

        if (message) {
            message.textContent = error.message;
        }
    }
}

// =====================================
// REFRESH SUPPLIERS
// =====================================

async function refreshSuppliers() {
    await loadSuppliers();
}

// =====================================
// INITIALIZE PAGE
// =====================================

document.addEventListener('DOMContentLoaded', () => {
    const refreshButton =
        document.getElementById('refreshSuppliers');

    if (refreshButton) {
        refreshButton.addEventListener('click', refreshSuppliers);
    }

    loadSuppliers();
});
