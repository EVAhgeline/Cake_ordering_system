
const express = require('express');
const router = express.Router();
const db = require('./employeeDb');

// ==========================================
// EMPLOYEE MANAGEMENT
// ==========================================

// GET ALL EMPLOYEES
router.get('/employees', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM Employee ORDER BY employee_id DESC'
        );

        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET EMPLOYEE BY ID
router.get('/employees/:id', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM Employee WHERE employee_id = ?',
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: 'Employee not found'
            });
        }

        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ADD EMPLOYEE
router.post('/employees', async (req, res) => {
    try {
        const { name, role, contact, email } = req.body;

        if (!name || !role) {
            return res.status(400).json({
                message: 'Name and role are required'
            });
        }

        const [result] = await db.query(
            `INSERT INTO Employee
            (name, role, contact, email)
            VALUES (?, ?, ?, ?)`,
            [name, role, contact || null, email || null]
        );

        res.status(201).json({
            message: 'Employee added successfully',
            employee_id: result.insertId
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// UPDATE EMPLOYEE
router.put('/employees/:id', async (req, res) => {
    try {
        const { name, role, contact, email } = req.body;

        const [result] = await db.query(
            `UPDATE Employee
            SET name = ?, role = ?, contact = ?, email = ?
            WHERE employee_id = ?`,
            [name, role, contact, email, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Employee not found'
            });
        }

        res.json({
            message: 'Employee updated successfully'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE EMPLOYEE
router.delete('/employees/:id', async (req, res) => {
    try {
        const [result] = await db.query(
            'DELETE FROM Employee WHERE employee_id = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Employee not found'
            });
        }

        res.json({
            message: 'Employee deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// ==========================================
// INVENTORY MANAGEMENT
// ==========================================

// GET ALL INVENTORY
router.get('/inventory', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                i.inventory_id,
                i.item_name,
                i.quantity,
                i.unit,
                i.reorder_level,
                i.supplier_id,
                s.supplier_name AS supplier_name,
                i.employee_id,
                e.name AS employee_name
            FROM Inventory i
            LEFT JOIN Supplier s
                ON i.supplier_id = s.supplier_id
            LEFT JOIN Employee e
                ON i.employee_id = e.employee_id
            ORDER BY i.inventory_id DESC
        `);

        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET INVENTORY BY ID
router.get('/inventory/:id', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM Inventory WHERE inventory_id = ?',
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: 'Inventory item not found'
            });
        }

        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ADD INVENTORY ITEM
router.post('/inventory', async (req, res) => {
    try {
        const {
            item_name,
            quantity,
            unit,
            reorder_level,
            supplier_id,
            employee_id
        } = req.body;

        if (!item_name || !unit || quantity == null) {
            return res.status(400).json({
                message: 'Item name, quantity, and unit are required'
            });
        }

        if (Number(quantity) < 0) {
            return res.status(400).json({
                message: 'Quantity cannot be negative'
            });
        }

        const [result] = await db.query(
            `INSERT INTO Inventory
            (item_name, quantity, unit, reorder_level,
             supplier_id, employee_id)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                item_name,
                quantity,
                unit,
                reorder_level ?? 5,
                supplier_id || null,
                employee_id || null
            ]
        );

        res.status(201).json({
            message: 'Inventory item added successfully',
            inventory_id: result.insertId
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// UPDATE INVENTORY ITEM
router.put('/inventory/:id', async (req, res) => {
    try {
        const {
            item_name,
            quantity,
            unit,
            reorder_level,
            supplier_id,
            employee_id
        } = req.body;

        const [result] = await db.query(
            `UPDATE Inventory
            SET item_name = ?,
                quantity = ?,
                unit = ?,
                reorder_level = ?,
                supplier_id = ?,
                employee_id = ?
            WHERE inventory_id = ?`,
            [
                item_name,
                quantity,
                unit,
                reorder_level,
                supplier_id || null,
                employee_id || null,
                req.params.id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Inventory item not found'
            });
        }

        res.json({
            message: 'Inventory updated successfully'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE INVENTORY ITEM
router.delete('/inventory/:id', async (req, res) => {
    try {
        const [result] = await db.query(
            'DELETE FROM Inventory WHERE inventory_id = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Inventory item not found'
            });
        }

        res.json({
            message: 'Inventory item deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// ==========================================
// INVENTORY STATUS
// ==========================================

// GET LOW STOCK ITEMS
router.get('/inventory-low-stock', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT *
            FROM Inventory
            WHERE quantity <= reorder_level
            ORDER BY quantity ASC
        `);

        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
