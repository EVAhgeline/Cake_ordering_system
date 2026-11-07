
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(express.json());
app.use(cors());

// Serve frontend files
app.use(express.static(path.join(__dirname, 'public')));

// MySQL Database Connection Pool
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '4321dekay',
    database: 'custom_cake_ordering_system', 
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test Database Connection
db.getConnection((err, connection) => {
    if (err) {
        console.error('Database connection failed:', err.message);
    } else {
        console.log('Connected to MySQL Database successfully!');
        connection.release();
    }
});

// ==================== API ENDPOINTS ====================

// 1. Get All Cake Designs
app.get('/api/cake-designs', (req, res) => {

    const categoryFilter = req.query.category;

    let query = `
        SELECT
            d.design_id AS id,
            d.title,
            d.base_price AS basePrice,
            d.image_url AS imageUrl,
            c.category_name AS category,
            f.flavor_name AS flavor,
            s.size_name AS size,
            ds.color,
            ds.texture,
            ds.shapes,
            ds.icing
        FROM Cake_Design d
        LEFT JOIN Category c
            ON d.category_id = c.category_id
        LEFT JOIN Flavor f
            ON d.flavor_id = f.flavor_id
        LEFT JOIN Size s
            ON d.size_id = s.size_id
        LEFT JOIN Design_Specs ds
            ON d.spec_id = ds.spec_id
    `;

    let queryParams = [];

    if (categoryFilter && categoryFilter !== 'all') {
        query += ` WHERE c.category_name LIKE ?`;
        queryParams.push(`%${categoryFilter}%`);
    }

    db.query(query, queryParams, (err, results) => {

        if (err) {
            console.error('Error fetching designs:', err);
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        const formattedData = results.map(row => ({
            id: row.id,
            title: row.title,
            basePrice: parseFloat(row.basePrice || 350),
            category: row.category || 'minimalist',
            flavor: row.flavor || 'vanilla',
            size: row.size || 'Round (6")',
            imageUrl: row.imageUrl || 'images/minimalist.jpg',

            design: {
                color: row.color || 'Pastel',
                texture: row.texture || 'Smooth',
                shapes: row.shapes || 'Solid',
                icing: row.icing || 'Buttercream'
            }
        }));

        res.json({
            success: true,
            data: formattedData
        });
    });
});

// 2. Get Sizes
app.get('/api/sizes', (req, res) => {

    db.query(
        'SELECT size_id AS id, size_name AS name, extra_price AS extraPrice FROM Size',
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            res.json({
                success: true,
                data: results
            });
        }
    );
});

// 3. Get Flavors
app.get('/api/flavors', (req, res) => {

    db.query(
        'SELECT flavor_id AS id, flavor_name AS name, extra_price AS extraPrice FROM Flavor',
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            res.json({
                success: true,
                data: results
            });
        }
    );
});


// ==========================================
// 4. CREATE CUSTOMER ORDER
// ==========================================

app.post('/api/orders', async (req, res) => {

    const {
        customerName,
        contact,
        address,
        items,
        paymentMethod,
        downpayment
    } = req.body;

    // Validate customer information
    if (
        !customerName ||
        !contact ||
        !Array.isArray(items) ||
        items.length === 0
    ) {
        return res.status(400).json({
            success: false,
            message: 'Missing customer or order information.'
        });
    }

    // Validate Philippine mobile number
    if (!/^09\d{9}$/.test(contact)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid customer contact number.'
        });
    }

    // Validate payment method
    const allowedMethods = ['Cash', 'GCash'];

    if (!allowedMethods.includes(paymentMethod)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid payment method.'
        });
    }

    const validItems = items.every(item =>
        Number.isInteger(Number(item.designId)) &&
        Number(item.designId) > 0 &&
        Number.isInteger(Number(item.flavorId)) &&
        Number(item.flavorId) > 0 &&
        Number.isInteger(Number(item.sizeId)) &&
        Number(item.sizeId) > 0 &&
        Number.isInteger(Number(item.quantity)) &&
        Number(item.quantity) > 0
    );

    if (!validItems) {
        return res.status(400).json({
            success: false,
            message: 'Invalid cake order details.'
        });
    }

    const connection = await db.promise().getConnection();

    try {

        await connection.beginTransaction();

        // ======================================
        // STEP 1: FIND OR CREATE CUSTOMER
        // ======================================

        const [existingCustomers] = await connection.execute(
            `SELECT customer_id
             FROM Customer
             WHERE contact = ?
             LIMIT 1`,
            [contact]
        );

        let customerId;

        if (existingCustomers.length > 0) {

            customerId = existingCustomers[0].customer_id;

            await connection.execute(
                `UPDATE Customer
                 SET name = ?,
                     address = CASE
                         WHEN ? <> '' THEN ?
                         ELSE address
                     END
                 WHERE customer_id = ?`,
                [
                    customerName.trim(),
                    (address || '').trim(),
                    (address || '').trim(),
                    customerId
                ]
            );

        } else {

            const [customerResult] = await connection.execute(
                `INSERT INTO Customer (name, contact, address)
                 VALUES (?, ?, ?)`,
                [
                    customerName.trim(),
                    contact,
                    (address || '').trim() || null
                ]
            );

            customerId = customerResult.insertId;

        }

        // ======================================
        // STEP 2: CREATE CUSTOM ORDER
        // ======================================

        const [orderResult] = await connection.execute(
            `INSERT INTO Custom_Order (customer_id, status)
             VALUES (?, ?)`,
            [customerId, 'Pending']
        );

        const orderId = orderResult.insertId;

        // ======================================
        // STEP 3: INSERT ORDER DETAILS
        // ======================================

        let totalAmount = 0;

        for (const item of items) {

            const designId = Number(item.designId);
            const flavorId = Number(item.flavorId);
            const sizeId = Number(item.sizeId);
            const quantity = Number(item.quantity);

            // Get prices from the database
            const [priceRows] = await connection.execute(
                `SELECT
                    d.base_price,
                    f.extra_price AS flavor_extra,
                    s.extra_price AS size_extra
                 FROM Cake_Design d
                 CROSS JOIN Flavor f
                 CROSS JOIN Size s
                 WHERE d.design_id = ?
                 AND f.flavor_id = ?
                 AND s.size_id = ?`,
                [designId, flavorId, sizeId]
            );

            if (priceRows.length === 0) {

                throw new Error(
                    'Invalid cake design, flavor, or size selected.'
                );

            }

            const basePrice = Number(priceRows[0].base_price);
            const flavorExtra = Number(priceRows[0].flavor_extra);
            const sizeExtra = Number(priceRows[0].size_extra);

            const itemPrice =
                (basePrice + flavorExtra + sizeExtra) * quantity;

            totalAmount += itemPrice;

            await connection.execute(
                `INSERT INTO Order_Detail
                (
                    order_id,
                    design_id,
                    flavor_id,
                    size_id,
                    message_on_cake,
                    quantity
                )
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    orderId,
                    designId,
                    flavorId,
                    sizeId,
                    (item.messageOnCake || '').trim() || null,
                    quantity
                ]
            );

        }

        // ======================================
        // STEP 4: VALIDATE AND SAVE PAYMENT
        // ======================================

        const paymentDownpayment = Number(downpayment || 0);

        if (
            !Number.isFinite(paymentDownpayment) ||
            paymentDownpayment < 0 ||
            paymentDownpayment > totalAmount
        ) {
            throw new Error('Invalid downpayment amount.');
        }

        await connection.execute(
            `INSERT INTO Payment
            (
                order_id,
                total_amount,
                method,
                downpayment
            )
            VALUES (?, ?, ?, ?)`,
            [
                orderId,
                totalAmount.toFixed(2),
                paymentMethod,
                paymentDownpayment.toFixed(2)
            ]
        );

        // ======================================
        // STEP 5: COMMIT TRANSACTION
        // ======================================

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Order placed successfully!',
            orderId: orderId,
            totalAmount: Number(totalAmount.toFixed(2))
        });

    } catch (err) {

        await connection.rollback();

        console.error('Order creation failed:', err);

        res.status(500).json({
            success: false,
            message: err.message || 'Failed to place order.'
        });

    } finally {

        connection.release();

    }

});

             
// Start Server
const PORT = process.env.PORT || 12067;

app.listen(PORT, () => {
    console.log(`Cake System Server running at http://localhost:${PORT}`);
});



// CUSTOMER FORM SUBMISSION
document.getElementById("customerForm")
.addEventListener("submit", function(event) {

    event.preventDefault();

    const customer = {
        name: document.getElementById("customerName").value.trim(),
        contact: document.getElementById("customerContact").value.trim(),
        email: document.getElementById("customerEmail").value.trim()
    };

    // Save customer information temporarily
    sessionStorage.setItem(
        "customerInfo",
        JSON.stringify(customer)
    );

    // Close login window and continue to cake ordering
    document.getElementById("roleSelectionModal").style.display = "none";

});


document.getElementById("customerForm")
.addEventListener("submit", function(event) {

    event.preventDefault();

    const customer = {
        name: document.getElementById("customerName").value.trim(),
        contact: document.getElementById("customerContact").value.trim()
    };

    sessionStorage.setItem(
        "customerInfo",
        JSON.stringify(customer)
    );

    document.getElementById("roleSelectionModal").style.display = "none";
});s