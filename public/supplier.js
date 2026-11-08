
const SUPPLIER_API = '/api/suppliers';
const INVENTORY_API = '/api/suppliers/inventory';

let suppliersData = [];
let inventoryData = [];


// =====================================
// FETCH JSON
// =====================================

async function fetchJSON(url) {

    const response = await fetch(url);

    const contentType = response.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
        throw new Error('API returned HTML instead of JSON. Check index.js routes.');
    }

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || 'Unable to load data.');
    }

    return result;
}


// =====================================
// UPDATE STATISTICS
// =====================================

function updateStatistics() {

    const totalSuppliers = suppliersData.length;

    const assigned = inventoryData.filter(
        item => item.supplier_id !== null &&
                item.supplier_id !== undefined
    );

    const unassigned = inventoryData.length - assigned.length;

    const suppliersWithStock = suppliersData.filter(
        supplier => assigned.some(
            item => String(item.supplier_id) === String(supplier.supplier_id)
        )
    );

    const coverage = inventoryData.length
        ? (assigned.length / inventoryData.length) * 100
        : 0;

    document.getElementById('totalSuppliers').textContent =
        totalSuppliers;

    document.getElementById('totalInventory').textContent =
        inventoryData.length;

    document.getElementById('assignedItems').textContent =
        assigned.length;

    document.getElementById('unassignedItems').textContent =
        unassigned;

    document.getElementById('suppliersWithStock').textContent =
        suppliersWithStock.length;

    document.getElementById('coverageRate').textContent =
        coverage.toFixed(1) + '%';
}


// =====================================
// POPULATE SUPPLIER FILTER
// =====================================

function populateSupplierFilter() {

    const select = document.getElementById('supplierFilter');

    select.innerHTML = '<option value="all">All Suppliers</option>';

    suppliersData.forEach(supplier => {

        const option = document.createElement('option');

        option.value = supplier.supplier_id;
        option.textContent = supplier.supplier_name;

        select.appendChild(option);
    });
}


// =====================================
// LOAD SUPPLIER TABLE
// =====================================

function renderSuppliers() {

    const tableBody = document.getElementById('supplierTableBody');

    const supplierFilter =
        document.getElementById('supplierFilter').value;

    const statusFilter =
        document.getElementById('statusFilter').value;

    const search =
        document.getElementById('itemSearch').value.toLowerCase().trim();

    tableBody.replaceChildren();

    const filteredSuppliers = suppliersData.filter(supplier => {

        const items = inventoryData.filter(
            item => String(item.supplier_id) === String(supplier.supplier_id)
        );

        const assigned = items.length > 0;

        const matchesSupplier =
            supplierFilter === 'all' ||
            String(supplier.supplier_id) === supplierFilter;

        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'assigned' && assigned) ||
            (statusFilter === 'unassigned' && !assigned);

        const searchable = [
            supplier.supplier_name,
            supplier.contact,
            supplier.email,
            supplier.address,
            ...items.map(item => item.item_name)
        ].join(' ').toLowerCase();

        return matchesSupplier &&
               matchesStatus &&
               searchable.includes(search);
    });


    if (filteredSuppliers.length === 0) {

        const row = document.createElement('tr');
        const cell = document.createElement('td');

        cell.colSpan = 7;
        cell.textContent = 'No matching suppliers found.';

        row.appendChild(cell);
        tableBody.appendChild(row);

        document.getElementById('recordCount').textContent =
            '0 suppliers displayed';

        return;
    }


    filteredSuppliers.forEach(supplier => {

        const items = inventoryData.filter(
            item => String(item.supplier_id) === String(supplier.supplier_id)
        );

        const row = document.createElement('tr');

        const values = [
            supplier.supplier_name,
            supplier.contact || '—',
            supplier.email || '—',
            items.length,
            items.length
                ? items.map(item => item.item_name).join(', ')
                : 'No assigned ingredients'
        ];

        values.forEach(value => {

            const cell = document.createElement('td');

            cell.textContent = value;

            row.appendChild(cell);
        });


        // ASSIGNMENT STATUS

        const statusCell = document.createElement('td');

        const badge = document.createElement('span');

        badge.className = items.length
            ? 'status-badge status-assigned'
            : 'status-badge status-unassigned';

        badge.textContent = items.length
            ? 'Assigned'
            : 'No Inventory';

        statusCell.appendChild(badge);
        row.appendChild(statusCell);


        // ACTIONS

        const actionCell = document.createElement('td');

        const manageLink = document.createElement('a');

        manageLink.href = 'supplier.html';
        manageLink.className = 'view-btn';
        manageLink.textContent = 'Manage';

        const inventoryLink = document.createElement('a');

        inventoryLink.href = 'supplier-inventory.html';
        inventoryLink.className = 'view-btn';
        inventoryLink.textContent = 'View Items';

        inventoryLink.style.marginLeft = '5px';

        actionCell.append(manageLink, inventoryLink);

        row.appendChild(actionCell);

        tableBody.appendChild(row);
    });


    document.getElementById('recordCount').textContent =
        filteredSuppliers.length + ' suppliers displayed';
}


// =====================================
// LOAD DASHBOARD DATA
// =====================================

async function loadSupplierDashboard() {

    const message = document.getElementById('dashboardMessage');

    try {

        message.textContent = 'Loading supplier information...';

        const [suppliers, inventory] = await Promise.all([
            fetchJSON(SUPPLIER_API),
            fetchJSON(INVENTORY_API)
        ]);

        if (!Array.isArray(suppliers) || !Array.isArray(inventory)) {
            throw new Error('Invalid data received from the API.');
        }

        suppliersData = suppliers;
        inventoryData = inventory;

        updateStatistics();
        populateSupplierFilter();
        renderSuppliers();

        document.getElementById('lastUpdated').textContent =
            'Last Updated: ' + new Date().toLocaleString();

        message.textContent = '';

    } catch (error) {

        console.error('Supplier Error:', error);

        message.textContent = error.message;

        document.getElementById('supplierTableBody').innerHTML =
            '<tr><td colspan="7">Unable to load supplier data.</td></tr>';
    }
}


// =====================================
// RESET FILTERS
// =====================================

function resetFilters() {

    document.getElementById('supplierFilter').value = 'all';

    document.getElementById('statusFilter').value = 'all';

    document.getElementById('itemSearch').value = '';

    renderSuppliers();
}


// =====================================
// INITIALIZE
// =====================================

document.addEventListener('DOMContentLoaded', () => {

    document.getElementById('supplierFilter')
        .addEventListener('change', renderSuppliers);

    document.getElementById('statusFilter')
        .addEventListener('change', renderSuppliers);

    document.getElementById('itemSearch')
        .addEventListener('input', renderSuppliers);

    document.getElementById('resetBtn')
        .addEventListener('click', resetFilters);

    document.getElementById('logoutBtn')
        .addEventListener('click', () => {

            if (!confirm('Are you sure you want to log out?')) return;

            sessionStorage.clear();
            window.location.href = 'index.html';
        });

    loadSupplierDashboard();
});
