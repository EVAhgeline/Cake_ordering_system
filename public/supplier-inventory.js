
const API_URL = '/api/suppliers/inventory';

async function loadInventory() {
    const inventoryList = document.getElementById('inventoryList');
    const message = document.getElementById('message');

    inventoryList.innerHTML =
        '<tr><td colspan="5">Loading inventory...</td></tr>';

    try {
        const response = await fetch(API_URL);
        const inventory = await response.json();

        if (!response.ok) {
            throw new Error(inventory.message || 'Unable to load inventory');
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
        console.error(error);

        inventoryList.innerHTML =
            '<tr><td colspan="5">Failed to load inventory.</td></tr>';

        message.textContent = error.message;
    }
}

document.addEventListener('DOMContentLoaded', loadInventory);