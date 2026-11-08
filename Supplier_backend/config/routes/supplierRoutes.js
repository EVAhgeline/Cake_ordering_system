const express = require('express');
const router = express.Router();
const db = require('../db');

// =====================================
// GET ALL SUPPLIERS
// =====================================
router.get('/', async (req, res) => {
    try {
        const [results] = await db.query(
            'SELECT * FROM Supplier ORDER BY supplier_id DESC'
        );

        res.json(results);

    } catch (error) {
        console.error('Error fetching suppliers:', error);

        res.status(500).json({
            message: 'Failed to fetch suppliers'
        });
    }
});

// =====================================
// GET INVENTORY WITH SUPPLIER NAMES
// =====================================
router.get('/inventory', async (req, res) => {
    try {
        const [results] = await db.query(`
            SELECT
                i.inventory_id,
                i.item_name,
                i.quantity,
                i.unit,
                i.supplier_id,
                s.supplier_name
            FROM Inventory i
            LEFT JOIN Supplier s
                ON i.supplier_id = s.supplier_id
            ORDER BY i.inventory_id DESC
        `);

        res.json(results);

    } catch (error) {
        console.error('Error loading inventory:', error);

        res.status(500).json({
            message: error.message
        });
    }
});
// =====================================
// ADD NEW SUPPLIER
// =====================================
router.post('/', async (req, res) => {
    try {
        const { supplier_name, contact, email, address } = req.body;

        if (!supplier_name || !supplier_name.trim()) {
            return res.status(400).json({
                message: 'Supplier name is required'
            });
        }

        const [result] = await db.query(
            `INSERT INTO Supplier
            (supplier_name, contact, email, address)
            VALUES (?, ?, ?, ?)`,
            [
                supplier_name.trim(),
                contact?.trim() || null,
                email?.trim() || null,
                address?.trim() || null
            ]
        );

        res.status(201).json({
            message: 'Supplier added successfully!',
            supplier_id: result.insertId
        });

    } catch (error) {
        console.error('Error adding supplier:', error);

        res.status(500).json({
            message: 'Failed to add supplier'
        });
    }
});

// =====================================
// UPDATE SUPPLIER
// =====================================
router.put('/:id', async (req, res) => {
    try {
        const supplierId = Number(req.params.id);
        const { supplier_name, contact, email, address } = req.body;

        if (!Number.isSafeInteger(supplierId) || supplierId <= 0) {
            return res.status(400).json({
                message: 'Invalid supplier ID'
            });
        }

        if (!supplier_name || !supplier_name.trim()) {
            return res.status(400).json({
                message: 'Supplier name is required'
            });
        }

        const [result] = await db.query(
            `UPDATE Supplier
             SET supplier_name = ?,
                 contact = ?,
                 email = ?,
                 address = ?
             WHERE supplier_id = ?`,
            [
                supplier_name.trim(),
                contact?.trim() || null,
                email?.trim() || null,
                address?.trim() || null,
                supplierId
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Supplier not found'
            });
        }

        res.json({
            message: 'Supplier updated successfully!'
        });

    } catch (error) {
        console.error('Error updating supplier:', error);

        res.status(500).json({
            message: 'Failed to update supplier'
        });
    }
});

// =====================================
// DELETE SUPPLIER
// =====================================
router.delete('/:id', async (req, res) => {
    try {
        const supplierId = Number(req.params.id);

        if (!Number.isSafeInteger(supplierId) || supplierId <= 0) {
            return res.status(400).json({
                message: 'Invalid supplier ID'
            });
        }

        // Check if supplier exists
        const [suppliers] = await db.query(
            'SELECT supplier_id FROM Supplier WHERE supplier_id = ?',
            [supplierId]
        );

        if (suppliers.length === 0) {
            return res.status(404).json({
                message: 'Supplier not found'
            });
        }

        // Check whether inventory is assigned to this supplier
        const [inventory] = await db.query(
            'SELECT COUNT(*) AS total FROM Inventory WHERE supplier_id = ?',
            [supplierId]
        );

        if (inventory[0].total > 0) {
            return res.status(409).json({
                message: 'Cannot delete this supplier because inventory items are assigned to them. Reassign those items first.'
            });
        }

        await db.query(
            'DELETE FROM Supplier WHERE supplier_id = ?',
            [supplierId]
        );

        res.json({
            message: 'Supplier deleted successfully!'
        });

    } catch (error) {
        console.error('Error deleting supplier:', error);

        res.status(500).json({
            message: 'Failed to delete supplier'
        });
    }
});

module.exports = router;