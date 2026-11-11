
const API_URL = '/api/suppliers';

// =====================================
// LOAD SUPPLIER INVENTORY
// =====================================

async function loadInventory() {
    const inventoryList = document.getElementById('inventoryList');
    const message = document.getElementById('message');

    inventoryList.innerHTML =
        '<tr><td colspan="5">Loading inventory...</td></tr>';

    try {
        const response = await fetch(API_URL);

        // Check if the server returned an error
        if (!response.ok) {
            throw new Error(
                `Server error: ${response.status} ${response.statusText}`
            );
        }

        // Verify that the response is JSON
        const contentType = response.headers.get('content-type') || '';

        if (!contentType.includes('application/json')) {
            const responseText = await response.text();

            console.error('Unexpected server response:', responseText);

            throw new Error(
                'The API returned HTML instead of JSON. ' +
                'Check the backend URL and server routes.'
            );
        }

        const inventory = await response.json();

        if (!Array.isArray(inventory)) {
            throw new Error('Invalid inventory data received.');
        }

        inventoryList.innerHTML = '';

        if (inventory.length === 0) {
            inventoryList.innerHTML =
                '<tr><td colspan="5">No inventory records found.</td></tr>';
            return;
        }

        inventory.forEach(item => {
            const row = document.createElement('tr');

            const values = [
                item.inventory_id,
                item.item_name,
                item.quantity,
                item.unit,
                item.supplier_name || 'Not assigned'
            ];

            values.forEach(value => {
                const cell = document.createElement('td');
                cell.textContent = value ?? '';
                row.appendChild(cell);
            });

            inventoryList.appendChild(row);
        });

        message.textContent = '';

    } catch (error) {
        console.error('Inventory loading error:', error);

        inventoryList.innerHTML =
            '<tr><td colspan="5">Failed to load inventory.</td></tr>';

        message.textContent = error.message;
    }
}

// =====================================
// INITIALIZE PAGE
// =====================================

document.addEventListener('DOMContentLoaded', () => {
    loadInventory();
});