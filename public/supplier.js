
const API_URL = '/api/suppliers/inventory';

// =====================================
// FETCH SUPPLIER INVENTORY
// =====================================

async function fetchSupplierInventory() {
    // 1. Retrieve the auth token from session storage
    const token = sessionStorage.getItem('employeeToken') || sessionStorage.getItem('token');

    const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            // 2. Include the Authorization header so the backend allows the request
            'Authorization': token ? `Bearer ${token}` : ''
        }
    });

    const responseText = await response.text();

    let result;

    try {
        result = responseText ? JSON.parse(responseText) : [];
    } catch {
        throw new Error('Invalid response received from the server.');
    }

    // Handle expired or unauthorized sessions
    if (response.status === 401 || response.status === 403) {
        sessionStorage.clear();
        alert('Your session has expired. Please log in again.');
        window.location.href = '/index.html';
        throw new Error('Authentication required.');
    }

    if (!response.ok) {
        throw new Error(
            result.message ||
            result.error ||
            `Unable to load inventory. Status: ${response.status}`
        );
    }

    if (Array.isArray(result)) {
        return result;
    }

    if (result && Array.isArray(result.data)) {
        return result.data;
    }

    throw new Error('Invalid inventory data received from the server.');
}

// =====================================
// LOAD INVENTORY
// =====================================

async function loadSupplierInventory() {
    const inventoryList = document.getElementById('inventoryList');
    const message = document.getElementById('message');

    if (!inventoryList) {
        console.error('Inventory table body not found.');
        return;
    }

    inventoryList.innerHTML =
        '<tr><td colspan="5">Loading inventory...</td></tr>';

    if (message) {
        message.textContent = '';
    }

    try {
        const inventory = await fetchSupplierInventory();

        inventoryList.innerHTML = '';

        if (inventory.length === 0) {
            inventoryList.innerHTML =
                '<tr><td colspan="5">No inventory records found.</td></tr>';
            return;
        }

        inventory.forEach(item => {
            const row = document.createElement('tr');

            const values = [
                item.inventory_id ?? '',
                item.item_name ?? '',
                item.quantity ?? 0,
                item.unit ?? '',
                item.supplier_name ?? ''
            ];

            values.forEach(value => {
                const cell = document.createElement('td');
                cell.textContent = value;
                row.appendChild(cell);
            });

            inventoryList.appendChild(row);
        });

        console.log(
            `${inventory.length} inventory records loaded successfully.`
        );

    } catch (error) {
        console.error('Inventory loading error:', error);

        inventoryList.innerHTML =
            '<tr><td colspan="5">Failed to load inventory.</td></tr>';

        if (message) {
            message.textContent = error.message;
        }
    }
}

// =====================================
// INITIALIZE PAGE
// =====================================

document.addEventListener('DOMContentLoaded', () => {
    loadSupplierInventory();
});
