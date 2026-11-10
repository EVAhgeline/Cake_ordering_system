
const API_URL = '/api/auth';

let inventory = [];
let showLowStockOnly = false;

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('inventoryForm')
        .addEventListener('submit', saveInventory);

    document.getElementById('inventorySearch')
        .addEventListener('input', searchInventory);

    document.getElementById('cancelInventory')
        .addEventListener('click', resetForm);

    document.getElementById('showAllStock')
        .addEventListener('click', () => {
            showLowStockOnly = false;
            searchInventory();
        });

    document.getElementById('showLowStock')
        .addEventListener('click', () => {
            showLowStockOnly = true;
            searchInventory();
        });

    loadInventory();
});

// ==========================================
// API RESPONSE HELPER
// ==========================================

async function readResponse(response) {
    const text = await response.text();

    let data;

    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        throw new Error(
            'The server did not return JSON. Check your API route and server.'
        );
    }

    if (!response.ok) {
        throw new Error(data.message || 'Request failed.');
    }

    return data;
}

// ==========================================
// LOAD INVENTORY FROM MYSQL
// ==========================================

async function loadInventory() {
    const table = document.getElementById('inventoryTableBody');

    try {
        table.innerHTML = `
            <tr>
                <td colspan="10">Loading inventory...</td>
            </tr>
        `;

        const response = await fetch(`${API_URL}/inventory`);
        const result = await readResponse(response);

        inventory = Array.isArray(result)
            ? result
            : result.data || [];

        updateStatistics();
        searchInventory();

    } catch (error) {
        console.error('Inventory loading error:', error);

        table.innerHTML = `
            <tr>
                <td colspan="10">${escapeHTML(error.message)}</td>
            </tr>
        `;

        document.getElementById('totalItems').textContent = '0';
        document.getElementById('lowStockItems').textContent = '0';
    }
}

// ==========================================
// UPDATE DASHBOARD STATISTICS
// ==========================================

function updateStatistics() {
    const lowStock = inventory.filter(item =>
        Number(item.quantity) <= Number(item.reorder_level)
    );

    document.getElementById('totalItems').textContent =
        inventory.length;

    document.getElementById('lowStockItems').textContent =
        lowStock.length;
}

// ==========================================
// DISPLAY INVENTORY
// ==========================================

function displayInventory(data) {
    const table = document.getElementById('inventoryTableBody');

    if (data.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="10">No inventory records found.</td>
            </tr>
        `;
        return;
    }

    table.innerHTML = data.map(item => {
        const isLowStock =
            Number(item.quantity) <= Number(item.reorder_level);

        return `
            <tr>
                <td>${escapeHTML(item.inventory_id)}</td>

                <td>${escapeHTML(item.item_name)}</td>

                <td>${escapeHTML(item.quantity)}</td>

                <td>${escapeHTML(item.unit)}</td>

                <td>${escapeHTML(item.reorder_level)}</td>

                <td>₱${Number(item.unit_cost || 0).toFixed(2)}</td>

                <td>
                    ${escapeHTML(
                        item.supplier_name || item.supplier_id || '-'
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        item.employee_name || item.employee_id || '-'
                    )}
                </td>

                <td class="${isLowStock ? 'low-stock' : 'normal-stock'}">
                    ${isLowStock ? 'Low Stock' : 'In Stock'}
                </td>

                <td>
                    <button
                        type="button"
                        class="edit-btn"
                        onclick="editInventory(${Number(item.inventory_id)})">
                        Edit
                    </button>

                    <button
                        type="button"
                        class="delete-btn"
                        onclick="deleteInventory(${Number(item.inventory_id)})">
                        Delete
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// ==========================================
// SEARCH AND FILTER INVENTORY
// ==========================================

function searchInventory() {
    const search = document.getElementById('inventorySearch')
        .value.toLowerCase();

    let filtered = inventory.filter(item => {
        return (
            String(item.inventory_id).includes(search) ||
            String(item.item_name || '').toLowerCase().includes(search) ||
            String(item.unit || '').toLowerCase().includes(search) ||
            String(item.supplier_name || '').toLowerCase().includes(search) ||
            String(item.employee_name || '').toLowerCase().includes(search)
        );
    });

    if (showLowStockOnly) {
        filtered = filtered.filter(item =>
            Number(item.quantity) <= Number(item.reorder_level)
        );
    }

    displayInventory(filtered);
}

// ==========================================
// ADD OR UPDATE INVENTORY
// ==========================================

async function saveInventory(event) {
    event.preventDefault();

    const inventoryId =
        document.getElementById('inventoryId').value;

    const quantity = Number(
        document.getElementById('quantity').value
    );

    const reorderLevel = Number(
        document.getElementById('reorderLevel').value
    );

    const unitCost = Number(
        document.getElementById('unitCost').value
    );

    const supplierValue =
        document.getElementById('supplierID').value.trim();

    const employeeValue =
        document.getElementById('assignedEmployee').value.trim();

    const item = {
        item_name: document.getElementById('itemName').value.trim(),
        quantity: quantity,
        unit: document.getElementById('unit').value.trim(),
        reorder_level: reorderLevel,
        unit_cost: unitCost,
        supplier_id: supplierValue ? Number(supplierValue) : null,
        employee_id: employeeValue ? Number(employeeValue) : null
    };

    const message = document.getElementById('formMessage');

    if (!item.item_name || !item.unit) {
        message.textContent =
            'Please complete the item name and unit.';
        return;
    }

    if (
        !Number.isFinite(quantity) || quantity < 0 ||
        !Number.isFinite(reorderLevel) || reorderLevel < 0 ||
        !Number.isFinite(unitCost) || unitCost < 0
    ) {
        message.textContent =
            'Quantity, reorder level, and unit cost must be valid non-negative numbers.';
        return;
    }

    try {
        const url = inventoryId
            ? `${API_URL}/inventory/${inventoryId}`
            : `${API_URL}/inventory`;

        const response = await fetch(url, {
            method: inventoryId ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(item)
        });

        const result = await readResponse(response);

        message.textContent =
            result.message || 'Inventory item saved successfully!';

        resetForm();
        await loadInventory();

    } catch (error) {
        console.error('Save inventory error:', error);
        message.textContent = error.message;
    }
}

// ==========================================
// EDIT INVENTORY
// ==========================================

function editInventory(id) {
    const item = inventory.find(
        record => Number(record.inventory_id) === Number(id)
    );

    if (!item) {
        alert('Inventory item not found.');
        return;
    }

    document.getElementById('inventoryId').value =
        item.inventory_id;

    document.getElementById('itemName').value =
        item.item_name || '';

    document.getElementById('quantity').value =
        item.quantity ?? 0;

    document.getElementById('unit').value =
        item.unit || '';

    document.getElementById('reorderLevel').value =
        item.reorder_level ?? 5;

    document.getElementById('unitCost').value =
        item.unit_cost ?? 0;

    document.getElementById('supplierID').value =
        item.supplier_id || '';

    document.getElementById('assignedEmployee').value =
        item.employee_id || '';

    document.getElementById('formTitle').textContent =
        'Update Inventory Item';

    document.getElementById('saveBtn').textContent =
        'Save Changes';

    document.getElementById('formMessage').textContent = '';

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// ==========================================
// DELETE INVENTORY
// ==========================================

async function deleteInventory(id) {
    const confirmed = confirm(
        'Are you sure you want to delete this inventory item?'
    );

    if (!confirmed) return;

    try {
        const response = await fetch(
            `${API_URL}/inventory/${id}`,
            { method: 'DELETE' }
        );

        const result = await readResponse(response);

        alert(result.message || 'Inventory item deleted successfully!');

        resetForm();
        await loadInventory();

    } catch (error) {
        console.error('Delete inventory error:', error);
        alert(error.message);
    }
}

// ==========================================
// RESET FORM
// ==========================================

function resetForm() {
    document.getElementById('inventoryForm').reset();

    document.getElementById('inventoryId').value = '';

    document.getElementById('reorderLevel').value = 5;
    document.getElementById('unitCost').value = 0;

    document.getElementById('formTitle').textContent =
        'Add Inventory Item';

    document.getElementById('saveBtn').textContent =
        'Add Item';

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
