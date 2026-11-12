const express = require('express');
const router = express.Router();
const pool = require('../db');

// ==========================================
// GET ALL CUSTOMER ORDERS
// GET /api/orders
// ==========================================
router.get('/', async (req, res) => {
    try {
        const [orders] = await pool.execute(`
            SELECT
                co.order_id,
                co.customer_id,
                co.employee_id,
                co.order_date,
                co.delivery_date,
                co.status,
                co.total_amount,

                c.name AS customer_name,
                c.contact AS customer_contact,
                c.address AS customer_address,

                p.method AS payment_method,
                p.downpayment,
                (co.total_amount - COALESCE(p.downpayment, 0))
                    AS remaining_balance

            FROM custom_order co

            JOIN customer c
                ON co.customer_id = c.customer_id

            LEFT JOIN payment p
                ON co.order_id = p.order_id

            ORDER BY co.order_date DESC
        `);

        // Get cake details for all orders
        if (orders.length > 0) {
            const orderIds = orders.map(order => order.order_id);
            const placeholders = orderIds.map(() => '?').join(',');

            const [details] = await pool.execute(`
                SELECT
                    od.detail_id,
                    od.order_id,
                    od.design_id,
                    od.flavor_id,
                    od.size_id,
                    od.message_on_cake,
                    od.quantity,
                    od.unit_price,
                    od.subtotal,

                    cd.title AS cake_name,
                    f.name AS flavor_name,
                    s.name AS size_name

                FROM order_detail od

                JOIN cake_designs cd
                    ON od.design_id = cd.id

                JOIN flavors f
                    ON od.flavor_id = f.id

                JOIN sizes s
                    ON od.size_id = s.id

                WHERE od.order_id IN (${placeholders})

                ORDER BY od.detail_id ASC
            `, orderIds);

            orders.forEach(order => {
                order.items = details.filter(
                    item => item.order_id === order.order_id
                );
            });
        }

        res.json({
            success: true,
            count: orders.length,
            data: orders
        });

    } catch (error) {
        console.error('Fetch orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve customer orders.'
        });
    }
});


// ==========================================
// UPDATE ORDER STATUS
// PATCH /api/orders/:id/status
// ==========================================
router.patch('/:id/status', async (req, res) => {
    try {
        const orderId = Number(req.params.id);
        const { status } = req.body;

        const allowedStatuses = [
            'Pending',
            'Confirmed',
            'Preparing',
            'Ready',
            'Completed',
            'Cancelled'
        ];

        if (!Number.isInteger(orderId) || orderId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid order ID.'
            });
        }

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid order status.'
            });
        }

        const [result] = await pool.execute(`
            UPDATE custom_order
            SET status = ?
            WHERE order_id = ?
        `, [status, orderId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Order not found.'
            });
        }

        res.json({
            success: true,
            message: 'Order status updated successfully.',
            orderId,
            status
        });

    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update order status.'
        });
    }
});


// ==========================================
// CREATE CUSTOMER ORDER
// POST /api/orders
// ==========================================
router.post('/', async (req, res) => {
    let connection;

    try {
        const {
            customerName,
            contact,
            address,
            items,
            paymentMethod,
            downpayment
        } = req.body;

        // Validate customer information
        if (!customerName?.trim() || !contact?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Customer name and contact are required.'
            });
        }

        // Validate cart
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Your order must contain at least one cake.'
            });
        }

        if (items.length > 50) {
            return res.status(400).json({
                success: false,
                message: 'Too many items in one order.'
            });
        }

        // Validate item IDs and quantities
        for (const item of items) {
            if (
                !Number.isInteger(Number(item.designId)) ||
                !Number.isInteger(Number(item.flavorId)) ||
                !Number.isInteger(Number(item.sizeId)) ||
                !Number.isInteger(Number(item.quantity)) ||
                Number(item.designId) <= 0 ||
                Number(item.flavorId) <= 0 ||
                Number(item.sizeId) <= 0 ||
                Number(item.quantity) <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid cake, flavor, size, or quantity.'
                });
            }

            if (
                item.messageOnCake != null &&
                (
                    typeof item.messageOnCake !== 'string' ||
                    item.messageOnCake.length > 255
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'Cake message must not exceed 255 characters.'
                });
            }
        }

        const selectedDownpayment = Number(downpayment || 0);

        if (
            !Number.isFinite(selectedDownpayment) ||
            selectedDownpayment < 0
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid downpayment.'
            });
        }

        const method = paymentMethod || 'Cash';

        if (
            typeof method !== 'string' ||
            method.trim().length === 0 ||
            method.length > 50
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment method.'
            });
        }

        connection = await pool.getConnection();
        await connection.beginTransaction();

        // ======================================
        // CALCULATE PRICES USING MYSQL
        // ======================================
        let totalAmount = 0;
        const orderItems = [];

        for (const item of items) {
            const [rows] = await connection.execute(`
                SELECT
                    cd.id AS design_id,
                    cd.base_price,
                    s.id AS size_id,
                    s.base_price AS size_base_price,
                    s.extra_price AS size_extra_price,
                    f.id AS flavor_id,
                    f.extra_price AS flavor_extra_price

                FROM cake_designs cd

                JOIN sizes s ON s.id = ?
                JOIN flavors f ON f.id = ?

                WHERE cd.id = ?
            `, [
                Number(item.sizeId),
                Number(item.flavorId),
                Number(item.designId)
            ]);

            if (rows.length === 0) {
                throw new Error(
                    'One of your selected cakes, sizes, or flavors no longer exists.'
                );
            }

            const cake = rows[0];

            const unitPrice =
                Number(cake.base_price) +
                Number(cake.size_base_price) +
                Number(cake.size_extra_price) +
                Number(cake.flavor_extra_price);

            const quantity = Number(item.quantity);
            const subtotal = Number((unitPrice * quantity).toFixed(2));

            totalAmount += subtotal;

            orderItems.push({
                designId: cake.design_id,
                flavorId: cake.flavor_id,
                sizeId: cake.size_id,
                quantity,
                unitPrice,
                subtotal,
                messageOnCake: item.messageOnCake?.trim() || null
            });
        }

        totalAmount = Number(totalAmount.toFixed(2));

        if (selectedDownpayment > totalAmount) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: 'Downpayment cannot exceed the order total.'
            });
        }

        // ======================================
        // SAVE CUSTOMER
        // ======================================
        const [customerResult] = await connection.execute(`
            INSERT INTO customer
                (name, contact, address)
            VALUES (?, ?, ?)
        `, [
            customerName.trim(),
            contact.trim(),
            address?.trim() || null
        ]);

        const customerId = customerResult.insertId;

        // ======================================
        // CREATE MAIN ORDER
        // ======================================
        const [orderResult] = await connection.execute(`
            INSERT INTO custom_order
                (customer_id, total_amount, status)
            VALUES (?, ?, 'Pending')
        `, [
            customerId,
            totalAmount
        ]);

        const orderId = orderResult.insertId;

        
        // ======================================
        // SAVE ORDER DETAILS
        // ======================================
        for (const item of orderItems) {

            await connection.execute(`
                INSERT INTO order_detail
                    (
                        order_id,
                        design_id,
                        flavor_id,
                        size_id,
                        message_on_cake,
                        quantity,
                        unit_price
                    )
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                orderId,
                item.designId,
                item.flavorId,
                item.sizeId,
                item.messageOnCake,
                item.quantity,
                item.unitPrice
            ]);

        }

        // ======================================
        // SAVE PAYMENT
        // ======================================
        await connection.execute(`
            INSERT INTO payment
                (
                    order_id,
                    total_amount,
                    method,
                    downpayment
                )
            VALUES (?, ?, ?, ?)
        `, [
            orderId,
            totalAmount,
            method.trim(),
            selectedDownpayment
        ]);

        // ======================================
        // COMMIT TRANSACTION
        // ======================================
        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Order placed successfully!',
            orderId,
            customerId,
            totalAmount,
            downpayment: selectedDownpayment,
            remainingBalance: Number(
                (totalAmount - selectedDownpayment).toFixed(2)
            )
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        console.error('Order creation error:', error);

        res.status(500).json({
            success: false,
            message: error.message || 'Failed to place order.'
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
});


// ==========================================
// DELETE ORDER ROUTE
// DELETE /api/orders/:id
// ==========================================
router.delete('/:id', async (req, res) => {
    let connection;

    try {
        const orderId = Number(req.params.id);

        if (!Number.isInteger(orderId) || orderId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid order ID.'
            });
        }

        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 1. Delete related payment record first
        await connection.execute('DELETE FROM payment WHERE order_id = ?', [orderId]);

        // 2. Delete related order details (items)
        await connection.execute('DELETE FROM order_detail WHERE order_id = ?', [orderId]);

        // 3. Delete the main custom order
        const [result] = await connection.execute('DELETE FROM custom_order WHERE order_id = ?', [orderId]);

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Order not found.'
            });
        }

        await connection.commit();

        res.json({
            success: true,
            message: 'Order deleted successfully.'
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Delete order error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while deleting order.'
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

module.exports = router;