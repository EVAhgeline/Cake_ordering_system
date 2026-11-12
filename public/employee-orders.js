// ==========================================
// EMPLOYEE ORDER MANAGEMENT
// ==========================================

const ORDERS_API_URL = '/api/orders';

document.addEventListener('DOMContentLoaded', () => {

    document.getElementById('employeeName').textContent =
        sessionStorage.getItem('employeeName') || 'Employee';

    document.getElementById('refreshOrdersBtn')
        .addEventListener('click', loadOrders);

    if (!getEmployeeToken()) {

        alert('Please log in as an employee first.');

        window.location.href = './index.html';

        return;
    }

    loadOrders();

});


// ==========================================
// AUTHENTICATION
// ==========================================

function getEmployeeToken() {

    return sessionStorage.getItem('employeeToken');

}

function getAuthHeaders() {

    const token = getEmployeeToken();

    if (!token) {

        window.location.href = './index.html';

        return null;

    }

    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

}


// ==========================================
// LOGOUT
// ==========================================

function logout() {

    const confirmed = confirm('Are you sure you want to log out?');

    if (!confirmed) return;

    sessionStorage.removeItem('employeeToken');
    sessionStorage.removeItem('employeeName');
    sessionStorage.removeItem('employeeID');
    sessionStorage.removeItem('token');

    window.location.href = './index.html';

}


// ==========================================
// LOAD ALL ORDERS
// ==========================================

async function loadOrders() {

    const ordersList = document.getElementById('ordersList');
    const message = document.getElementById('ordersMessage');

    const headers = getAuthHeaders();

    if (!headers) return;

    message.textContent = 'Loading orders...';
    ordersList.innerHTML = '';

    try {

        const response = await fetch(ORDERS_API_URL, {
            method: 'GET',
            headers
        });

        const result = await response.json();

        if (response.status === 401 || response.status === 403) {

            sessionStorage.removeItem('employeeToken');
            sessionStorage.removeItem('employeeName');
            sessionStorage.removeItem('employeeID');

            alert('Your employee session has expired. Please log in again.');

            window.location.href = './index.html';

            return;

        }

        if (!response.ok || !result.success) {

            throw new Error(
                result.message || 'Unable to retrieve orders.'
            );

        }

        const orders = result.data || [];

        if (orders.length === 0) {

            message.textContent = '';

            ordersList.innerHTML = `
                <div class="empty-orders">
                    <h3>No Orders Yet</h3>
                    <p>Customer orders will appear here.</p>
                </div>
            `;

            return;

        }

        message.textContent =
            `Showing ${orders.length} customer order(s).`;

        ordersList.innerHTML = orders.map(order => {

            return renderOrder(order);

        }).join('');

    } catch (error) {

        console.error('Load orders error:', error);

        message.textContent = error.message;

    }

}


// ==========================================
// DISPLAY ORDER CARD
// ==========================================

function renderOrder(order) {

    const orderId = Number(order.order_id);

    const items = Array.isArray(order.items)
        ? order.items
        : [];

    const cakeItems = items.map(item => `

        <div class="cake-item">

            <strong>${escapeHtml(item.cake_name)}</strong>

            <p>
                Flavor: ${escapeHtml(item.flavor_name)}
            </p>

            <p>
                Size: ${escapeHtml(item.size_name)}
            </p>

            <p>
                Quantity: ${Number(item.quantity)}
            </p>

            <p>
                Unit Price: ${formatCurrency(item.unit_price)}
            </p>

            <p>
                Subtotal: ${formatCurrency(item.subtotal)}
            </p>

            <p>
                Cake Message:
                ${escapeHtml(item.message_on_cake || 'No message')}
            </p>

        </div>

    `).join('');

    return `

        <article class="order-card">

            <div class="order-top">

                <div>
                    <div class="order-id">
                        Order #${orderId}
                    </div>

                    <p>
                        ${formatDate(order.order_date)}
                    </p>
                </div>

                <div>
                    <span class="status-label">
                        ${escapeHtml(order.status)}
                    </span>
                </div>

            </div>

            <div class="order-details">

                <div class="detail-box">

                    <h3>Customer Information</h3>

                    <p>
                        <strong>Name:</strong>
                        ${escapeHtml(order.customer_name)}
                    </p>

                    <p>
                        <strong>Contact:</strong>
                        ${escapeHtml(order.customer_contact)}
                    </p>

                    <p>
                        <strong>Address:</strong>
                        ${escapeHtml(order.customer_address || 'Pickup / Not provided')}
                    </p>

                </div>

                <div class="detail-box">

                    <h3>Payment Information</h3>

                    <p>
                        <strong>Method:</strong>
                        ${escapeHtml(order.payment_method || 'Not specified')}
                    </p>

                    <p>
                        <strong>Status:</strong>
                        ${escapeHtml(order.status)}
                    </p>

                </div>

            </div>

            <div class="cake-list">

                <h3>Ordered Cakes</h3>

                ${cakeItems || '<p>No cake details available.</p>'}

            </div>

            <div class="payment-summary">

                <div>
                    Total:
                    <strong>${formatCurrency(order.total_amount)}</strong>
                </div>

                <div>
                    Downpayment:
                    <strong>${formatCurrency(order.downpayment)}</strong>
                </div>

                <div>
                    Balance:
                    <strong>${formatCurrency(order.remaining_balance)}</strong>
                </div>

            </div>

            <div class="status-controls">

                <label for="status-${orderId}">
                    Update Order Status:
                </label>

                <select id="status-${orderId}">

                    ${renderStatusOptions(order.status)}

                </select>

                <button
                    type="button"
                    class="update-btn"
                    onclick="updateOrderStatus(${orderId})">

                    Update Status

                </button>

                <button
                    type="button"
                    class="delete-btn"
                    style="background-color: #dc3545; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; margin-left: 8px;"
                    onclick="deleteOrder(${orderId})">

                    Delete Order

                </button>

            </div>

        </article>

    `;

}


// ==========================================
// ORDER STATUS OPTIONS
// ==========================================

function renderStatusOptions(currentStatus) {

    const statuses = [
        'Pending',
        'Confirmed',
        'Preparing',
        'Ready',
        'Completed',
        'Cancelled'
    ];

    return statuses.map(status => `

        <option
            value="${status}"
            ${status === currentStatus ? 'selected' : ''}>

            ${status}

        </option>

    `).join('');

}


// ==========================================
// UPDATE ORDER STATUS
// ==========================================

async function updateOrderStatus(orderId) {

    const headers = getAuthHeaders();

    if (!headers) return;

    const select = document.getElementById(`status-${orderId}`);

    const newStatus = select.value;

    const confirmed = confirm(
        `Change Order #${orderId} status to ${newStatus}?`
    );

    if (!confirmed) return;

    try {

        const response = await fetch(
            `${ORDERS_API_URL}/${orderId}/status`,
            {
                method: 'PATCH',
                headers,
                body: JSON.stringify({
                    status: newStatus
                })
            }
        );

        const result = await response.json();

        if (response.status === 401 || response.status === 403) {

            sessionStorage.removeItem('employeeToken');

            alert('Your employee session has expired. Please log in again.');

            window.location.href = './index.html';

            return;

        }

        if (!response.ok || !result.success) {

            throw new Error(
                result.message || 'Unable to update order status.'
            );

        }

        alert('Order status updated successfully!');

        loadOrders();

    } catch (error) {

        console.error('Update status error:', error);

        alert(error.message);

    }

}


// ==========================================
// DELETE ORDER
// ==========================================


// ==========================================
// DELETE CUSTOMER ORDER
// ==========================================

async function deleteOrder(orderId) {

    if (!orderId) {
        alert('Invalid order ID.');
        return;
    }

    const confirmed = confirm(
        'Are you sure you want to delete this order? This action cannot be undone.'
    );

    if (!confirmed) return;

    try {

        const response = await fetch(`/api/orders/${orderId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.message || 'Failed to delete order.'
            );
        }

        alert('Order deleted successfully!');

        // Refresh the employee orders table
        loadOrders();

    } catch (error) {

        console.error('Delete order error:', error);

        alert(error.message || 'Unable to delete order.');

    }

}


// ==========================================
// HELPER FUNCTIONS
// ==========================================

function formatCurrency(amount) {

    return new Intl.NumberFormat('en-PH', {

        style: 'currency',

        currency: 'PHP'

    }).format(Number(amount) || 0);

}


function formatDate(dateValue) {

    if (!dateValue) return 'Date unavailable';

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return 'Date unavailable';
    }

    return date.toLocaleString('en-PH', {
        dateStyle: 'medium',
        timeStyle: 'short'
    });

}


function escapeHtml(value) {

    return String(value ?? '').replace(/[&<>"']/g, character => ({

        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'

    })[character]);

}