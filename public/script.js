
// ==========================================
// STATE MANAGEMENT
// ==========================================

let currentDesigns = [];
let availableSizes = [];
let availableFlavors = [];
let cart = JSON.parse(
    sessionStorage.getItem('sweetCustomCart') || '[]'
);
let activeCake = null;


// ==========================================
// INITIAL DATA FETCHING
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {

    updateCartBadge();

    await fetchSizesAndFlavors();

    await fetchCakeDesigns();

});



// ==========================================
// FETCH SIZES AND FLAVORS
// ==========================================

async function fetchSizesAndFlavors() {

    availableSizes = [
        { id: 1, name: 'Round (6")', extraPrice: 0 },
        { id: 2, name: 'Round (8")', extraPrice: 150 },
        { id: 3, name: 'Tiered (2-Tier)', extraPrice: 500 }
    ];

    availableFlavors = [
        { id: 1, name: 'ube', extraPrice: 50 },
        { id: 2, name: 'mocha', extraPrice: 50 },
        { id: 3, name: 'chocolate', extraPrice: 0 },
        { id: 4, name: 'vanilla', extraPrice: 0 },
        { id: 5, name: 'strawberry', extraPrice: 75 }
    ];

    try {

        const [resSizes, resFlavors] = await Promise.all([
            fetch('/api/sizes').catch(() => null),
            fetch('/api/flavors').catch(() => null)
        ]);

        if (resSizes && resSizes.ok) {

            const sizesData = await resSizes.json();

            if (sizesData.data?.length) {
                availableSizes = sizesData.data.map(s => ({
                    ...s,
                    extraPrice: Number(s.extraPrice ?? s.price ?? 0)
                }));
            }
        }

        if (resFlavors && resFlavors.ok) {

            const flavorsData = await resFlavors.json();

            if (flavorsData.data?.length) {
                availableFlavors = flavorsData.data.map(f => ({
                    ...f,
                    extraPrice: Number(f.extraPrice ?? f.price_add ?? 0)
                }));
            }
        }

    } catch (err) {
        console.log('Using default sizes and flavors:', err);
    }
}


// ==========================================
// FETCH CAKE DESIGNS
// ==========================================

async function fetchCakeDesigns(categoryFilter = 'all') {

    try {

        let url = '/api/cake-designs';

        if (categoryFilter !== 'all') {
            url += `?category=${encodeURIComponent(categoryFilter)}`;
        }

        const res = await fetch(url);

        if (!res.ok) {
            throw new Error('Unable to fetch cake designs.');
        }

        const result = await res.json();

        if (result.success && result.data?.length > 0) {

            currentDesigns = result.data.map(cake => ({
                ...cake,
                id: Number(cake.id ?? cake.design_id),
                title: cake.title ?? cake.name,
                basePrice: Number(cake.basePrice ?? cake.base_price ?? 350),
                imageUrl: cake.imageUrl ??
                    (cake.image ? `images/${cake.image}` : 'images/minimalist.jpg')
            }));

        } else {

            currentDesigns = getMockDesigns();
        }

        renderCakeCards(currentDesigns);

    } catch (err) {

        console.error('API connection issue:', err);

        currentDesigns = getMockDesigns();

        renderCakeCards(currentDesigns);
    }
}


// ==========================================
// CATEGORY IMAGE HELPER
// ==========================================

function getCategoryJpgImage(category) {

    const cat = (category || '').toLowerCase();

    if (cat.includes('floral')) return 'images/floral.jpg';
    if (cat.includes('cartoon')) return 'images/cartoon.jpg';
    if (cat.includes('korean')) return 'images/korean.jpg';
    if (cat.includes('vintage')) return 'images/vintage.jpg';

    return 'images/minimalist.jpg';
}


// ==========================================
// RENDER CAKE CARDS
// IMAGE + NAME + CUSTOMIZE ONLY
// ==========================================

function renderCakeCards(designs) {

    const container = document.getElementById('cakeGridContainer');

    if (!container) return;

    container.innerHTML = '';

    designs.forEach(cake => {

        const card = document.createElement('div');

        card.className = 'cake-card';

        card.innerHTML = `

            <div class="image-container">

                <span class="badge-new">New!</span>

                <img src="${cake.imageUrl || getCategoryJpgImage(cake.category)}"
                     alt="${cake.title}"
                     onerror="this.src='images/minimalist.jpg'">

            </div>

            <h3>${cake.title}</h3>

            <div class="card-actions">

                <button class="btn-edit"
                    onclick="openCustomizerModal(${cake.id})">

                    Customize

                </button>

            </div>

        `;

        container.appendChild(card);
    });
}


// ==========================================
// QUICK ORDER HANDLER
// ==========================================

function orderCakeDirect(cakeId) {

    const cake = currentDesigns.find(c => c.id === cakeId);

    if (!cake) return;

    alert(`Selected ${cake.title}! Please customize your cake.`);
}


// ==========================================
// MOCK FALLBACK DESIGNS
// ==========================================

function getMockDesigns() {

    return [

        {
            id: 1,
            title: 'Minimalist Cake',
            basePrice: 350,
            category: 'minimalist',
            flavor: 'vanilla',
            size: 'Round (6")',
            design: {
                color: 'White',
                pattern: 'Solid',
                shape: 'Round',
                texture: 'Smooth',
                icing: 'Buttercream'
            },
            imageUrl: 'images/minimalist.jpg'
        },

        {
            id: 2,
            title: 'Floral Cake',
            basePrice: 1200,
            category: 'floral',
            flavor: 'strawberry',
            size: 'Tiered (2-Tier)',
            design: {
                color: 'White',
                pattern: 'Floral',
                shape: 'Round',
                texture: 'Smooth',
                icing: 'Fondant'
            },
            imageUrl: 'images/floral.jpg'
        },

        {
            id: 3,
            title: 'Cartoon Cake',
            basePrice: 500,
            category: 'cartoon',
            flavor: 'chocolate',
            size: 'Round (6")',
            design: {
                color: 'Blue',
                pattern: 'Character',
                shape: 'Round',
                texture: 'Smooth',
                icing: 'Buttercream'
            },
            imageUrl: 'images/cartoon.jpg'
        },

        {
            id: 4,
            title: 'Korean Cake',
            basePrice: 450,
            category: 'korean',
            flavor: 'ube',
            size: 'Round (6")',
            design: {
                color: 'Pink',
                pattern: 'Minimal',
                shape: 'Round',
                texture: 'Smooth',
                icing: 'Buttercream'
            },
            imageUrl: 'images/korean.jpg'
        },

        {
            id: 5,
            title: 'Vintage Cake',
            basePrice: 850,
            category: 'vintage',
            flavor: 'mocha',
            size: 'Round (8")',
            design: {
                color: 'Brown',
                pattern: 'Floral',
                shape: 'Round',
                texture: 'Ruffled',
                icing: 'Buttercream'
            },
            imageUrl: 'images/vintage.jpg'
        }

    ];
}


// ==========================================
// CREATE DROPDOWN OPTIONS
// ==========================================

function createOptions(items, selected) {

    return items.map(item => `

        <option value="${item}"
            ${selected === item ? 'selected' : ''}>

            ${item}

        </option>

    `).join('');
}


// ==========================================
// OPEN CUSTOMIZATION MODAL
// ==========================================

function openCustomizerModal(cakeId) {

    activeCake = currentDesigns.find(c => c.id === cakeId)
        || getMockDesigns().find(c => c.id === cakeId);

    if (!activeCake) return;

    document.getElementById('modalCakeTitle').innerText =
        activeCake.title;

    document.getElementById('modalCakeImg').src =
        activeCake.imageUrl || getCategoryJpgImage(activeCake.category);

    document.getElementById('modalCakeId').value =
        activeCake.id;


    // ======================================
    // SIZE OPTIONS
    // ======================================

    const sizeSelect = document.getElementById('sizeSelect');

    sizeSelect.innerHTML = availableSizes.map(s => `

        <option value="${s.name}"
            data-price="${s.extraPrice || 0}"
            ${s.name === activeCake.size ? 'selected' : ''}>

            ${s.name}
            ${s.extraPrice ? '(+₱' + s.extraPrice + ')' : ''}

        </option>

    `).join('');


    // ======================================
    // FLAVOR OPTIONS
    // ======================================

    const flavorSelect = document.getElementById('flavorSelect');

    flavorSelect.innerHTML = availableFlavors.map(f => `

        <option value="${f.name}"
            data-price="${f.extraPrice || 0}"
            ${f.name.toLowerCase() ===
                (activeCake.flavor || '').toLowerCase()
                ? 'selected' : ''}>

            ${f.name.toUpperCase()}
            ${f.extraPrice ? '(+₱' + f.extraPrice + ')' : ''}

        </option>

    `).join('');


    // ======================================
    // DESIGN SPECIFICATIONS
    // ======================================

    const specsContainer =
        document.getElementById('modalSpecsDetail');

    const design = activeCake.design || {};

    const colors = [
        'Pink',
        'Blue',
        'White',
        'Gold',
        'Red',
        'Purple',
        'Green',
        'Black',
        'Brown',
        'Yellow',
        'Mixed Colors'
    ];

    const patterns = [
        'Solid',
        'Floral',
        'Stripes',
        'Polka Dots',
        'Ombre',
        'Marble',
        'Geometric',
        'Character'
    ];

    const shapes = [
        'Round',
        'Square',
        'Rectangle',
        'Heart-shaped',
        'Number-shaped',
        'Custom Shape'
    ];

    const textures = [
        'Smooth',
        'Rough',
        'Ruffled',
        'Textured Frosting'
    ];

    const icingTypes = [
        'Buttercream',
        'Fondant',
        'Whipped Cream',
        'Cream Cheese',
        'Royal Icing'
    ];


    specsContainer.innerHTML = `

        <div class="custom-specs-grid">

            <!-- COLOR -->
            <div class="form-group">

                <label>🎨 Color:</label>

                <select id="specColor" class="form-control">

                    ${createOptions(colors, design.color || 'White')}

                </select>

            </div>


            <!-- PATTERN -->
            <div class="form-group">

                <label>🔶 Pattern:</label>

                <select id="specPattern" class="form-control">

                    ${createOptions(
                        patterns,
                        design.pattern || design.shapes || 'Solid'
                    )}

                </select>

            </div>


            <!-- SHAPE -->
            <div class="form-group">

                <label>🎂 Shape:</label>

                <select id="specShape" class="form-control">

                    ${createOptions(shapes, design.shape || 'Round')}

                </select>

            </div>


            <!-- TEXTURE -->
            <div class="form-group">

                <label>✨ Texture:</label>

                <select id="specTexture" class="form-control">

                    ${createOptions(textures, design.texture || 'Smooth')}

                </select>

            </div>


            <!-- ICING TYPE -->
            <div class="form-group">

                <label>🍰 Icing Type:</label>

                <select id="specIcing" class="form-control">

                    ${createOptions(
                        icingTypes,
                        design.icing || 'Buttercream'
                    )}

                </select>

            </div>

        </div>

    `;


    // ======================================
    // BASE PRICE DISPLAY
    // ======================================

    document.getElementById('basePriceDisplay').innerText =
        `₱${Number(activeCake.basePrice || 350).toFixed(2)}`;


    // ======================================
    // CALCULATE PRICE
    // ======================================

    calculateTotalPrice();

    document.getElementById('customizerModal').style.display = 'flex';
}


// ==========================================
// DYNAMIC PRICE CALCULATION
// ==========================================

function calculateTotalPrice() {

    if (!activeCake) return;

    const basePrice = Number(activeCake.basePrice) || 350;

    const sizeSelect = document.getElementById('sizeSelect');

    const flavorSelect = document.getElementById('flavorSelect');

    const sizeExtra = Number(
        sizeSelect.selectedOptions[0]?.dataset.price || 0
    );

    const flavorExtra = Number(
        flavorSelect.selectedOptions[0]?.dataset.price || 0
    );

    const totalPrice = basePrice + sizeExtra + flavorExtra;

    document.getElementById('dynamicPrice').innerText =
        `₱${totalPrice.toFixed(2)}`;
}


// ==========================================
// CLOSE CUSTOMIZATION MODAL
// ==========================================

function closeCustomizerModal() {

    document.getElementById('customizerModal').style.display = 'none';
}


// ==========================================
// ADD ITEM TO CART
// ==========================================


function addToCart() {

    if (!activeCake) return;

    const sizeElem = document.getElementById('sizeSelect');
    const flavorElem = document.getElementById('flavorSelect');

    const selectedSize = availableSizes.find(
        s => s.name === sizeElem.value
    );

    const selectedFlavor = availableFlavors.find(
        f => f.name === flavorElem.value
    );

    if (!selectedSize || !selectedFlavor) {
        alert('Please select a valid size and flavor.');
        return;
    }

    const finalPrice = parseFloat(
        document.getElementById('dynamicPrice')
            .innerText.replace('₱', '')
    );

    const selectedDesign = {

        color: document.getElementById('specColor').value,

        pattern: document.getElementById('specPattern').value,

        shape: document.getElementById('specShape').value,

        texture: document.getElementById('specTexture').value,

        icing: document.getElementById('specIcing').value

    };

    cart.push({

        designId: Number(activeCake.id),

        title: activeCake.title,

        flavorId: Number(selectedFlavor.id),
        flavor: selectedFlavor.name,

        sizeId: Number(selectedSize.id),
        size: selectedSize.name,

        design: selectedDesign,

        price: finalPrice,

        quantity: 1

    });

    sessionStorage.setItem(
        'sweetCustomCart',
        JSON.stringify(cart)
    );

    updateCartBadge();

    closeCustomizerModal();

    alert('Cake added to cart!');

} 
 
// ==========================================
// TOGGLE CART MODAL
// ==========================================

function toggleCartModal() {

    const modal = document.getElementById('cartModal');

    if (modal.style.display === 'flex') {

        modal.style.display = 'none';

    } else {

        renderCartItems();

        modal.style.display = 'flex';

    }
}


// ==========================================
// RENDER CART ITEMS
// ==========================================

function renderCartItems() {

    const cartContainer =
        document.getElementById('cartItemsList');

    const grandTotalElem =
        document.getElementById('cartGrandTotal');

    if (cart.length === 0) {

        cartContainer.innerHTML = `
            <p class="empty-msg">
                Your cart is currently empty.
            </p>
        `;

        grandTotalElem.innerText = '₱0.00';

        return;
    }

    let grandTotal = 0;

    cartContainer.innerHTML = cart.map(item => {

        grandTotal += item.price;

        return `

            <div class="cart-item">

                <div>

                    <strong>${item.title}</strong>

                    <div class="cart-item-details">

                        Size: ${item.size}<br>

                        Flavor: ${item.flavor}<br>

                        Color: ${item.design.color}<br>

                        Pattern: ${item.design.pattern}<br>

                        Shape: ${item.design.shape}<br>

                        Texture: ${item.design.texture}<br>

                        Icing: ${item.design.icing}

                    </div>

                </div>

                <strong>₱${item.price.toFixed(2)}</strong>

            </div>

        `;

    }).join('');

    grandTotalElem.innerText =
        `₱${grandTotal.toFixed(2)}`;
}


// ==========================================
// UPDATE CART BADGE
// ==========================================

function updateCartBadge() {

    document.getElementById('cartBadgeCount').innerText =
        cart.length;
}


// ==========================================
// CATEGORY FILTER
// ==========================================

function filterCategory(cat) {

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    if (window.event && window.event.target) {
        window.event.target.classList.add('active');
    }

    fetchCakeDesigns(cat);
}


// ==========================================
// CHECKOUT ORDER
// ==========================================


function checkoutOrder() {

    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    const customerName =
        sessionStorage.getItem('customerName');

    const customerPhone =
        sessionStorage.getItem('customerPhone');

    if (!customerName || !customerPhone) {
        alert('Please complete the customer information first.');
        return;
    }

    sessionStorage.setItem(
        'sweetCustomCart',
        JSON.stringify(cart)
    );

    window.location.href = 'checkout.html';

}

