
// ==========================================
// CHECKOUT PAGE
// ==========================================

const CART_KEY = 'sweetCustomCart';

let checkoutCart = [];

document.addEventListener('DOMContentLoaded', () => {

    loadCheckoutData();

    document.getElementById('placeOrderBtn')
        .addEventListener('click', placeOrder);

});


// ==========================================
// LOAD CUSTOMER AND CART INFORMATION
// ==========================================

function loadCheckoutData() {

    const customerName = sessionStorage.getItem('customerName');
    const customerPhone = sessionStorage.getItem('customerPhone');

    try {

        checkoutCart = JSON.parse(
            sessionStorage.getItem(CART_KEY) || '[]'
        );

        if (!Array.isArray(checkoutCart)) {
            checkoutCart = [];
        }

    } catch (error) {

        console.error('Cart loading error:', error);
        checkoutCart = [];

    }

    if (!customerName || !customerPhone) {

        showMessage(
            'Customer information is missing. Please return to the welcome form.'
        );

        document.getElementById('placeOrderBtn').disabled = true;
        return;

    }

    if (checkoutCart.length === 0) {

        showMessage(
            'Your cart is empty. Please select a cake first.'
        );

        document.getElementById('placeOrderBtn').disabled = true;
        return;

    }

    document.getElementById('customerName').value = customerName;
    document.getElementById('customerPhone').value = customerPhone;

    renderCheckoutItems();

}


// ==========================================
// DISPLAY ORDER SUMMARY
// ==========================================

function renderCheckoutItems() {

    const container = document.getElementById('checkoutItems');

    container.innerHTML = checkoutCart.map((item, index) => `

        <div class="checkout-item">

            <div class="checkout-item-top">

                <span>${escapeHtml(item.title || 'Custom Cake')}</span>

                <span>${formatCurrency(Number(item.price) || 0)}</span>

            </div>

            <div class="checkout-item-details">

                Size: ${escapeHtml(item.size || 'Not specified')}<br>

                Flavor: ${escapeHtml(item.flavor || 'Not specified')}<br>

                Color: ${escapeHtml(item.design?.color || 'Not specified')}<br>

                Pattern: ${escapeHtml(item.design?.pattern || 'Not specified')}<br>

                Shape: ${escapeHtml(item.design?.shape || 'Not specified')}<br>

                Texture: ${escapeHtml(item.design?.texture || 'Not specified')}<br>

                Icing: ${escapeHtml(item.design?.icing || 'Not specified')}<br>

                Quantity: ${Number(item.quantity) || 1}

            </div>

            <div class="form-group" style="margin-top: 10px;">

                <label for="cakeMessage${index}">
                    Message on Cake (Optional)
                </label>

                <input
                    type="text"
                    id="cakeMessage${index}"
                    maxlength="255"
                    placeholder="Enter a short message">

            </div>

        </div>

    `).join('');

    calculateTotal();

}


// ==========================================
// CALCULATE TOTAL
// ==========================================

function calculateTotal() {

    return checkoutCart.reduce((sum, item) => {

        return sum +
            (Number(item.price) * (Number(item.quantity) || 1));

    }, 0);

}


// ==========================================
// PLACE ORDER
// ==========================================

async function placeOrder(event) {

    if (event) event.preventDefault();

    const placeOrderBtn = document.getElementById('placeOrderBtn');

    // Prevent duplicate submissions
    if (placeOrderBtn.disabled) return;

    const customerName = document.getElementById('customerName').value.trim();

    const customerPhone = document.getElementById('customerPhone').value.trim();

    const address = document.getElementById('orderAddress').value.trim();

    const paymentMethod = document.getElementById('paymentMethod').value;

    const downpayment = Number(
        document.getElementById('downpayment').value
    );

    const total = calculateTotal();

    // ======================================
    // VALIDATION
    // ======================================

    if (!customerName || !customerPhone) {

        alert('Customer information is missing.');
        return;

    }

    if (checkoutCart.length === 0) {

        alert('Your cart is empty.');
        return;

    }

    if (!Number.isFinite(downpayment) || downpayment < 0) {

        alert('Please enter a valid downpayment.');
        return;

    }

    if (downpayment > total) {

        alert('Downpayment cannot exceed the total amount.');
        return;

    }

    // ======================================
    // COLLECT ORDER ITEMS
    // ======================================

    const itemsList = checkoutCart.map((item, index) => {

        const messageInput = document.getElementById(
            `cakeMessage${index}`
        );

        return {

            designId: item.designId || item.id,
            flavorId: item.flavorId,
            sizeId: item.sizeId,

            quantity: Number(item.quantity) || 1,

            messageOnCake: messageInput
                ? messageInput.value.trim() || null
                : null

        };

    });

    // ======================================
    // SEND ORDER TO BACKEND
    // ======================================

    try {

        placeOrderBtn.disabled = true;
        placeOrderBtn.textContent = 'Processing Order...';

        const response = await fetch('/api/orders', {

            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({

                customerName,
                contact: customerPhone,

                address: address || 'Pickup',

                items: itemsList,

                paymentMethod,

                downpayment

            })

        });

        const result = await response.json();

        if (!response.ok || !result.success) {

            throw new Error(
                result.message || 'Failed to place order.'
            );

        }

        // ==================================
        // DISPLAY CONFIRMATION
        // ==================================

        displayOrderConfirmation(
            result,
            total,
            downpayment
        );

        // Clear cart after successful order
        sessionStorage.removeItem(CART_KEY);

        document.getElementById('checkoutItems').innerHTML = '';

        showMessage('');

    } catch (error) {

        console.error('Place order error:', error);

        alert(error.message);

        placeOrderBtn.disabled = false;
        placeOrderBtn.textContent = 'Place Order';

    }

}


// ==========================================
// DISPLAY ORDER CONFIRMATION
// ==========================================

function displayOrderConfirmation(result, total, downpayment) {

    const confirmationPanel = document.getElementById(
        'confirmationPanel'
    );

    const orderId =
        result.orderId ||
        result.id ||
        result.order?.orderId ||
        result.order?.id ||
        'Pending';

    document.getElementById('confirmationOrderId').textContent =
        orderId;

    document.getElementById('confirmationTotal').textContent =
        formatCurrency(total);

    document.getElementById('confirmationDownpayment').textContent =
        formatCurrency(downpayment);

    document.getElementById('confirmationBalance').textContent =
        formatCurrency(total - downpayment);

    confirmationPanel.hidden = false;

    document.getElementById('placeOrderBtn').hidden = true;

    confirmationPanel.scrollIntoView({
        behavior: 'smooth'
    });

}


// ==========================================
// HELPER FUNCTIONS
// ==========================================

function showMessage(message) {

    document.getElementById('pageMessage').textContent = message;

}

function formatCurrency(amount) {

    return new Intl.NumberFormat('en-PH', {

        style: 'currency',

        currency: 'PHP'

    }).format(Number(amount) || 0);

}

function escapeHtml(value) {

    return String(value).replace(/[&<>"']/g, character => ({

        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'

    })[character]);

}
