
const express = require('express');
const router = express.Router();
const db = require('../db');

// =====================================
// HELPER: CLEAN INPUT
// =====================================

function cleanString(value) {
    if (typeof value !== 'string') {
        return null;
    }

    const cleaned = value.trim();
    return cleaned || null;
}

// =====================================
// HELPER: VALIDATE SUPPLIER ID
// =====================================

function validateSupplierId(id) {
    const supplierId = Number(id);

    if (!Number.isSafeInteger(supplierId) || supplierId <= 0) {
        return null;
    }

    return supplierId;
}

// =====================================
// HELPER: VALIDATE SUPPLIER DATA
// =====================================

function validateSupplierData(body) {
    const supplier_name = cleanString(body?.supplier_name);

    if (!supplier_name) {
        return {
            error: 'Supplier name is required.'
        };
    }

    if (supplier_name.length > 150) {
        return {
            error: 'Supplier name must not exceed 150 characters.'
        };
    }

    const contact = cleanString(body?.contact);
    const email = cleanString(body?.email);
    const address = cleanString(body?.address);

    if (contact && contact.length > 50) {
        return {
            error: 'Contact number must not exceed 50 characters.'
        };
    }

    if (email && email.length > 150) {
        return {
            error: 'Email must not exceed 150 characters.'
        };
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return {
            error: 'Please enter a valid email address.'
        };
    }

    if (address && address.length > 255) {
        return {
            error: 'Address must not exceed 255 characters.'
        };
    }

    return {
        data: {
            supplier_name,
            contact,
            email,
            address
        }
    };
}


// =====================================
// GET ALL SUPPLIERS
// GET /api/suppliers
// =====================================

router.get('/', async (req, res) => {
    try {
        const [suppliers] = await db.query(`
            SELECT
                supplier_id,
                supplier_name,
                contact,
                email,
                address
            FROM Supplier
            ORDER BY supplier_id DESC
        `);

        return res.status(200).json(suppliers);

    } catch (error) {
        console.error('Error fetching suppliers:', error);

        return res.status(500).json({
            message: 'Failed to fetch suppliers.'
        });
    }
});


// =====================================
// GET INVENTORY WITH SUPPLIER NAMES
// GET /api/suppliers/inventory
// =====================================

router.get('/inventory', async (req, res) => {
    try {
        const [inventory] = await db.query(`
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

        return res.status(200).json(inventory);

    } catch (error) {
        console.error('Error fetching supplier inventory:', error);

        return res.status(500).json({
            message: 'Failed to fetch supplier inventory.'
        });
    }
});


// =====================================
// ADD NEW SUPPLIER
// POST /api/suppliers
// =====================================

router.post('/', async (req, res) => {
    try {
        const validation = validateSupplierData(req.body);

        if (validation.error) {
            return res.status(400).json({
                message: validation.error
            });
        }

        const {
            supplier_name,
            contact,
            email,
            address
        } = validation.data;

        const [result] = await db.query(`
            INSERT INTO Supplier
                (supplier_name, contact, email, address)
            VALUES (?, ?, ?, ?)
        `, [
            supplier_name,
            contact,
            email,
            address
        ]);

        return res.status(201).json({
            message: 'Supplier added successfully!',
            supplier_id: result.insertId
        });

    } catch (error) {
        console.error('Error adding supplier:', error);

        return res.status(500).json({
            message: 'Failed to add supplier.'
        });
    }
});


// =====================================
// UPDATE SUPPLIER
// PUT /api/suppliers/:id
// =====================================

router.put('/:id', async (req, res) => {
    try {
        const supplierId = validateSupplierId(req.params.id);

        if (!supplierId) {
            return res.status(400).json({
                message: 'Invalid supplier ID.'
            });
        }

        const validation = validateSupplierData(req.body);

        if (validation.error) {
            return res.status(400).json({
                message: validation.error
            });
        }

        const {
            supplier_name,
            contact,
            email,
            address
        } = validation.data;

        // Check if supplier exists first.
        const [existing] = await db.query(
            'SELECT supplier_id FROM Supplier WHERE supplier_id = ?',
            [supplierId]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                message: 'Supplier not found.'
            });
        }

        await db.query(`
            UPDATE Supplier
            SET
                supplier_name = ?,
                contact = ?,
                email = ?,
                address = ?
            WHERE supplier_id = ?
        `, [
            supplier_name,
            contact,
            email,
            address,
            supplierId
        ]);

        return res.status(200).json({
            message: 'Supplier updated successfully!'
        });

    } catch (error) {
        console.error('Error updating supplier:', error);

        return res.status(500).json({
            message: 'Failed to update supplier.'
        });
    }
});


// =====================================
// DELETE SUPPLIER
// DELETE /api/suppliers/:id
// =====================================

router.delete('/:id', async (req, res) => {
    try {
        const supplierId = validateSupplierId(req.params.id);

        if (!supplierId) {
            return res.status(400).json({
                message: 'Invalid supplier ID.'
            });
        }

        // Check if supplier exists.
        const [suppliers] = await db.query(
            'SELECT supplier_id FROM Supplier WHERE supplier_id = ?',
            [supplierId]
        );

        if (suppliers.length === 0) {
            return res.status(404).json({
                message: 'Supplier not found.'
            });
        }

        // Check assigned inventory.
        const [inventory] = await db.query(`
            SELECT COUNT(*) AS total
            FROM Inventory
            WHERE supplier_id = ?
        `, [supplierId]);

        if (Number(inventory[0].total) > 0) {
            return res.status(409).json({
                message: 'Cannot delete this supplier because inventory items are assigned to them. Reassign those items first.'
            });
        }

        // Delete supplier.
        const [result] = await db.query(
            'DELETE FROM Supplier WHERE supplier_id = ?',
            [supplierId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Supplier not found.'
            });
        }

        return res.status(200).json({
            message: 'Supplier deleted successfully!'
        });

    } catch (error) {
        console.error('Error deleting supplier:', error);

        return res.status(500).json({
            message: 'Failed to delete supplier.'
        });
    }
});


// =====================================
// EXPORT ROUTER
// =====================================

module.exports = router;
