
require('dotenv').config();

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const employeeDb = require('./employeeDb');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is missing from .env');
}

// ==========================================
// EMPLOYEE REGISTRATION
// ==========================================

router.post('/register', async (req, res) => {
    let connection;

    try {
        const { name, employee_id, password } = req.body;

        if (!name?.trim() || !employee_id || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, Employee ID and password are required.'
            });
        }

        if (String(password).length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must contain at least 8 characters.'
            });
        }

        connection = await employeeDb.getConnection();
        await connection.beginTransaction();

        const [existing] = await connection.query(
            'SELECT account_id FROM EmployeeAccount WHERE login_id = ?',
            [String(employee_id).trim()]
        );

        if (existing.length) {
            await connection.rollback();
            return res.status(409).json({
                success: false,
                message: 'Employee ID is already registered.'
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const [employee] = await connection.query(
            `INSERT INTO Employee (name, role, status)
             VALUES (?, 'Employee', 'Active')`,
            [name.trim()]
        );

        await connection.query(
            `INSERT INTO EmployeeAccount
             (employee_id, login_id, password_hash)
             VALUES (?, ?, ?)`,
            [
                employee.insertId,
                String(employee_id).trim(),
                passwordHash
            ]
        );

        await connection.commit();

        return res.status(201).json({
            success: true,
            message: 'Employee registered successfully!'
        });

    } catch (error) {
        if (connection) await connection.rollback();

        console.error('Registration error:', error);

        return res.status(500).json({
            success: false,
            message: 'Registration failed. Check server console.'
        });

    } finally {
        if (connection) connection.release();
    }
});

// ==========================================
// EMPLOYEE LOGIN
// ==========================================

router.post('/login', async (req, res) => {
    try {
        const { employee_id, password } = req.body;

        if (!employee_id || !password) {
            return res.status(400).json({
                success: false,
                message: 'Employee ID and password are required.'
            });
        }

        const [rows] = await employeeDb.query(
            `SELECT
                ea.login_id,
                ea.password_hash,
                e.employee_id,
                e.name,
                e.role,
                e.status
             FROM EmployeeAccount ea
             INNER JOIN Employee e
                ON e.employee_id = ea.employee_id
             WHERE ea.login_id = ?
             LIMIT 1`,
            [String(employee_id).trim()]
        );

        if (!rows.length) {
            return res.status(401).json({
                success: false,
                message: 'Invalid Employee ID or password.'
            });
        }

        const employee = rows[0];

        if (employee.status !== 'Active') {
            return res.status(403).json({
                success: false,
                message: 'Employee account is inactive.'
            });
        }

        const validPassword = await bcrypt.compare(
            String(password),
            employee.password_hash
        );

        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid Employee ID or password.'
            });
        }

        const token = jwt.sign(
            {
                employee_id: employee.employee_id,
                login_id: employee.login_id,
                role: employee.role
            },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        return res.json({
            success: true,
            message: 'Login successful!',
            token,
            name: employee.name,
            employee_id: employee.employee_id,
            redirectUrl: '/employee-inventory.html'
        });

    } catch (error) {
        console.error('Login error:', error);

        return res.status(500).json({
            success: false,
            message: 'Server error during login.'
        });
    }
});

// ==========================================
// VERIFY EMPLOYEE TOKEN
// ==========================================

function verifyEmployeeToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Please log in first.'
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        req.employee = jwt.verify(token, JWT_SECRET);
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired login session.'
        });
    }
}

// ==========================================
// CHECK EMPLOYEE SESSION
// ==========================================

router.get('/me', verifyEmployeeToken, async (req, res) => {
    try {
        const [rows] = await employeeDb.query(
            `SELECT employee_id, name, role, status
             FROM Employee
             WHERE employee_id = ?`,
            [req.employee.employee_id]
        );

        if (!rows.length || rows[0].status !== 'Active') {
            return res.status(401).json({
                success: false,
                message: 'Employee account unavailable.'
            });
        }

        res.json({
            success: true,
            employee: rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Unable to verify session.'
        });
    }
});

// ==========================================
// PROTECT MANAGEMENT ROUTES
// ==========================================

router.use(verifyEmployeeToken);

// ==========================================
// GET ALL EMPLOYEES
// ==========================================

router.get('/employees', async (req, res) => {
    try {
        const [rows] = await employeeDb.query(
            `SELECT employee_id, name, role, contact,
                    email, address, hire_date, status, created_at
             FROM Employee
             ORDER BY employee_id DESC`
        );

        res.json(rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Unable to load employees.'
        });
    }
});

// ==========================================
// GET EMPLOYEE BY ID
// ==========================================

router.get('/employees/:id', async (req, res) => {
    try {
        const [rows] = await employeeDb.query(
            'SELECT * FROM Employee WHERE employee_id = ?',
            [req.params.id]
        );

        if (!rows.length) {
            return res.status(404).json({
                message: 'Employee not found.'
            });
        }

        res.json(rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Unable to retrieve employee.'
        });
    }
});

// ==========================================
// ADD EMPLOYEE
// ==========================================

router.post('/employees', async (req, res) => {
    try {
        const {
            name, role, contact, email,
            address, hire_date, status
        } = req.body;

        if (!name?.trim() || !role?.trim()) {
            return res.status(400).json({
                message: 'Name and role are required.'
            });
        }

        const [result] = await employeeDb.query(
            `INSERT INTO Employee
             (name, role, contact, email, address,
              hire_date, status)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                name.trim(),
                role.trim(),
                contact || null,
                email || null,
                address || null,
                hire_date || null,
                status || 'Active'
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Employee added successfully!',
            employee_id: result.insertId
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Unable to add employee.'
        });
    }
});

// ==========================================
// UPDATE EMPLOYEE
// ==========================================

router.put('/employees/:id', async (req, res) => {
    try {
        const {
            name, role, contact, email,
            address, hire_date, status
        } = req.body;

        if (!name?.trim() || !role?.trim()) {
            return res.status(400).json({
                message: 'Name and role are required.'
            });
        }

        const [result] = await employeeDb.query(
            `UPDATE Employee
             SET name = ?, role = ?, contact = ?,
                 email = ?, address = ?, hire_date = ?,
                 status = ?
             WHERE employee_id = ?`,
            [
                name.trim(),
                role.trim(),
                contact || null,
                email || null,
                address || null,
                hire_date || null,
                status || 'Active',
                req.params.id
            ]
        );

        if (!result.affectedRows) {
            return res.status(404).json({
                message: 'Employee not found.'
            });
        }

        res.json({
            success: true,
            message: 'Employee updated successfully!'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Unable to update employee.'
        });
    }
});

// ==========================================
// DELETE EMPLOYEE
// ==========================================

router.delete('/employees/:id', async (req, res) => {
    try {
        const [result] = await employeeDb.query(
            'DELETE FROM Employee WHERE employee_id = ?',
            [req.params.id]
        );

        if (!result.affectedRows) {
            return res.status(404).json({
                message: 'Employee not found.'
            });
        }

        res.json({
            success: true,
            message: 'Employee deleted successfully!'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Unable to delete employee. Check related inventory records.'
        });
    }
});


// ==========================================
// INVENTORY VALIDATION HELPER
// ==========================================

function validateInventoryData(body) {
    const item_name = String(body.item_name || '').trim();
    const unit = String(body.unit || '').trim();

    const quantity = Number(body.quantity);

    const reorder_level =
        body.reorder_level === undefined || body.reorder_level === ''
            ? 5
            : Number(body.reorder_level);

    const unit_cost =
        body.unit_cost === undefined || body.unit_cost === ''
            ? 0
            : Number(body.unit_cost);

    function optionalId(value, fieldName) {
        if (value === undefined || value === null || value === '') {
            return null;
        }

        const id = Number(value);

        if (!Number.isSafeInteger(id) || id <= 0) {
            const error = new Error(`${fieldName} must be a valid positive ID.`);
            error.statusCode = 400;
            throw error;
        }

        return id;
    }

    if (!item_name || !unit) {
        const error = new Error('Item name and unit are required.');
        error.statusCode = 400;
        throw error;
    }

    if (
        !Number.isFinite(quantity) || quantity < 0 ||
        !Number.isFinite(reorder_level) || reorder_level < 0 ||
        !Number.isFinite(unit_cost) || unit_cost < 0
    ) {
        const error = new Error(
            'Quantity, reorder level, and unit cost must be valid non-negative numbers.'
        );
        error.statusCode = 400;
        throw error;
    }

    return {
        item_name,
        quantity,
        unit,
        reorder_level,
        unit_cost,
        supplier_id: optionalId(body.supplier_id, 'Supplier ID'),
        employee_id: optionalId(body.employee_id, 'Employee ID')
    };
}


// ==========================================
// GET ALL INVENTORY
// ==========================================

router.get('/inventory', async (req, res) => {
    try {
        const [rows] = await employeeDb.query(`
            SELECT
                i.inventory_id,
                i.item_name,
                i.quantity,
                i.unit,
                i.reorder_level,
                i.unit_cost,
                i.supplier_id,
                i.employee_id,
                i.last_updated,
                s.supplier_name,
                e.name AS employee_name
            FROM inventory i
            LEFT JOIN supplier s
                ON i.supplier_id = s.supplier_id
            LEFT JOIN employee e
                ON i.employee_id = e.employee_id
            ORDER BY i.inventory_id DESC
        `);

        res.json(rows);

    } catch (error) {
        console.error('Get inventory error:', error);

        res.status(500).json({
            success: false,
            message: 'Unable to load inventory.',
            error: error.message
        });
    }
});


// ==========================================
// GET LOW STOCK INVENTORY
// ==========================================

router.get('/inventory-low-stock', async (req, res) => {
    try {
        const [rows] = await employeeDb.query(`
            SELECT
                i.inventory_id,
                i.item_name,
                i.quantity,
                i.unit,
                i.reorder_level,
                i.unit_cost,
                i.supplier_id,
                i.employee_id,
                s.supplier_name,
                e.name AS employee_name
            FROM inventory i
            LEFT JOIN supplier s
                ON i.supplier_id = s.supplier_id
            LEFT JOIN employee e
                ON i.employee_id = e.employee_id
            WHERE i.quantity <= i.reorder_level
            ORDER BY i.inventory_id DESC
        `);

        res.json(rows);

    } catch (error) {
        console.error('Low stock error:', error);

        res.status(500).json({
            success: false,
            message: 'Unable to load low stock inventory.',
            error: error.message
        });
    }
});


// ==========================================
// ADD INVENTORY
// ==========================================

router.post('/inventory', async (req, res) => {
    try {
        const item = validateInventoryData(req.body);

        const [result] = await employeeDb.query(
            `INSERT INTO inventory
                (item_name, quantity, unit, reorder_level,
                 unit_cost, supplier_id, employee_id)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                item.item_name,
                item.quantity,
                item.unit,
                item.reorder_level,
                item.unit_cost,
                item.supplier_id,
                item.employee_id
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Inventory item added successfully!',
            inventory_id: result.insertId
        });

    } catch (error) {
        console.error('Add inventory error:', error);

        const status = error.statusCode ||
            (error.code === 'ER_NO_REFERENCED_ROW_2' ? 400 : 500);

        res.status(status).json({
            success: false,
            message: error.code === 'ER_NO_REFERENCED_ROW_2'
                ? 'The selected supplier or employee does not exist.'
                : error.message
        });
    }
});


// ==========================================
// UPDATE INVENTORY
// ==========================================

router.put('/inventory/:id', async (req, res) => {
    try {
        const inventoryId = Number(req.params.id);

        if (!Number.isSafeInteger(inventoryId) || inventoryId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid inventory ID.'
            });
        }

        const item = validateInventoryData(req.body);

        const [existing] = await employeeDb.query(
            'SELECT inventory_id FROM inventory WHERE inventory_id = ?',
            [inventoryId]
        );

        if (!existing.length) {
            return res.status(404).json({
                success: false,
                message: 'Inventory item not found.'
            });
        }

        await employeeDb.query(
            `UPDATE inventory
             SET item_name = ?,
                 quantity = ?,
                 unit = ?,
                 reorder_level = ?,
                 unit_cost = ?,
                 supplier_id = ?,
                 employee_id = ?
             WHERE inventory_id = ?`,
            [
                item.item_name,
                item.quantity,
                item.unit,
                item.reorder_level,
                item.unit_cost,
                item.supplier_id,
                item.employee_id,
                inventoryId
            ]
        );

        res.json({
            success: true,
            message: 'Inventory item updated successfully!'
        });

    } catch (error) {
        console.error('Update inventory error:', error);

        const status = error.statusCode ||
            (error.code === 'ER_NO_REFERENCED_ROW_2' ? 400 : 500);

        res.status(status).json({
            success: false,
            message: error.code === 'ER_NO_REFERENCED_ROW_2'
                ? 'The selected supplier or employee does not exist.'
                : error.message
        });
    }
});


// ==========================================
// DELETE INVENTORY
// ==========================================

router.delete('/inventory/:id', async (req, res) => {
    try {
        const inventoryId = Number(req.params.id);

        if (!Number.isSafeInteger(inventoryId) || inventoryId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid inventory ID.'
            });
        }

        const [result] = await employeeDb.query(
            'DELETE FROM inventory WHERE inventory_id = ?',
            [inventoryId]
        );

        if (!result.affectedRows) {
            return res.status(404).json({
                success: false,
                message: 'Inventory item not found.'
            });
        }

        res.json({
            success: true,
            message: 'Inventory item deleted successfully!'
        });

    } catch (error) {
        console.error('Delete inventory error:', error);

        res.status(500).json({
            success: false,
            message: 'Unable to delete inventory item.',
            error: error.message
        });
    }
});


module.exports = router;