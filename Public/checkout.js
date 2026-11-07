
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

    const customerName =
        sessionStorage.getItem('customerName');

    const customerPhone =
        sessionStorage.getItem('customerPhone');

    try {

        checkoutCart = JSON.parse(
            sessionStorage.getItem(CART_KEY) || '[]'
        );

        if (!Array.isArray(checkoutCart)) {
            checkoutCart = [];
        }

    } catch (error) {

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

    document.getElementById('customerName').value =
        customerName;

    document.getElementById('customerPhone').value =
        customerPhone;

    renderCheckoutItems();

}


// ==========================================
// DISPLAY ORDER SUMMARY
// ==========================================

function renderCheckoutItems() {

    const container =
        document.getElementById('checkoutItems');

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

                Icing: ${escapeHtml(item.design?.icing || 'Not specified')}

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

    const total = checkoutCart.reduce(
        (sum, item) => sum + (Number(item.price) || 0),
        0
    );

    document.getElementById('checkoutTotal').textContent =
        formatCurrency(total);

}


// ==========================================
// PLACE ORDER
// ==========================================

async function placeOrder() {

    const customerName =
        sessionStorage.getItem('customerName');

    const customerPhone =
        sessionStorage.getItem('customerPhone');

    const address =
        document.getElementById('orderAddress').value.trim();

    const paymentMethod =
        document.getElementById('paymentMethod').value;

    const downpayment =
        Number(document.getElementById('downpayment').value || 0);

    const total = checkoutCart.reduce(
        (sum, item) => sum + (Number(item.price) || 0),
        0
    );

    if (!customerName || !customerPhone) {

        showMessage('Customer information is missing.');

        return;
    }

    if (checkoutCart.length === 0) {

        showMessage('Your cart is empty.');

        return;
    }

    if (
        !Number.isFinite(downpayment) ||
        downpayment < 0 ||
        downpayment > total
    ) {

        showMessage(
            'Please enter a valid downpayment that does not exceed the order total.'
        );

        return;
    }

    // Prepare database IDs and cake messages
    const items = checkoutCart.map((item, index) => ({

        designId: Number(item.designId),

        flavorId: Number(item.flavorId),

        sizeId: Number(item.sizeId),

        quantity: Number(item.quantity) || 1,

        messageOnCake:
            document.getElementById(`cakeMessage${index}`)?.value.trim() || ''

    }));

    // Validate required database IDs
    const invalidItem = items.some(item =>

        !Number.isInteger(item.designId) ||
        !Number.isInteger(item.flavorId) ||
        !Number.isInteger(item.sizeId) ||
        item.designId <= 0 ||
        item.flavorId <= 0 ||
        item.sizeId <= 0 ||
        item.quantity <= 0

    );

    if (invalidItem) {

        showMessage(
            'Some cart items are missing database IDs. Please return to the gallery and add them again.'
        );

        return;
    }

    const button =
        document.getElementById('placeOrderBtn');

    button.disabled = true;

    button.textContent = 'Placing Order...';

    showMessage('');

    try {

        const response = await fetch('/api/orders', {

            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({

                customerName,

                contact: customerPhone,

                address,

                items,

                paymentMethod,

                downpayment

            })

        });

        const result = await response.json();

        if (!response.ok || !result.success) {

            throw new Error(
                result.message ||
                result.error ||
                'Unable to place your order.'
            );

        }

        // Clear cart after successful database insertion
        sessionStorage.removeItem(CART_KEY);

        document.getElementById('confirmationOrderId')
            .textContent = `#${result.orderId}`;

        document.getElementById('confirmationPanel').hidden = false;

        document.querySelector('.checkout-layout').hidden = true;

        document.querySelector('.checkout-header').hidden = true;

        showMessage('');

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });

    } catch (error) {

        showMessage(
            error.message || 'An error occurred while placing your order.'
        );

        button.disabled = false;

        button.textContent = 'Place Order';

    }

}


// ==========================================
// HELPER FUNCTIONS
// ==========================================

function showMessage(message) {

    document.getElementById('pageMessage').textContent =
        message;

}

function formatCurrency(amount) {

    return new Intl.NumberFormat('en-PH', {

        style: 'currency',

        currency: 'PHP'

    }).format(amount);

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
