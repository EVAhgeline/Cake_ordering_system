const express = require('express');
const router = express.Router();
const pool = require('./db'); // Import connection pool from db.js
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// 1. Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'cake-designs',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
        transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
    }
});
const upload = multer({ storage: storage });

// 2. POST /api/cake-designs - Create a new cake design with transactional safety
router.post('/', upload.single('referencePhoto'), async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        let designData = req.body.design;
        if (typeof designData === 'string') {
            designData = JSON.parse(designData);
        }

        const { title, category, flavor, size, basePrice } = req.body;
        const { color, texture, shapes, icing } = designData || {};
        const imageUrl = req.file ? req.file.path : (req.body.imageUrl || 'minimalist.jpg');
        const parsedBasePrice = basePrice ? parseFloat(basePrice) : 350.00;

        // Step 1: Validate Category lookup
        const [catRows] = await connection.execute(
            'SELECT id FROM categories WHERE name = ?', 
            [category.toLowerCase()]
        );
        if (catRows.length === 0) throw new Error(`Invalid category: ${category}`);
        const categoryId = catRows[0].id;

        // Step 2: Validate Flavor lookup (ube, mocha, chocolate, vanilla, strawberry)
        const [flavRows] = await connection.execute(
            'SELECT id FROM flavors WHERE name = ?', 
            [flavor.toLowerCase()]
        );
        if (flavRows.length === 0) throw new Error(`Invalid flavor: ${flavor}`);
        const flavorId = flavRows[0].id;

        // Step 3: Find or Insert Size lookup
        let sizeId;
        const [sizeRows] = await connection.execute(
            'SELECT id FROM sizes WHERE name = ?', 
            [size.trim()]
        );
        if (sizeRows.length > 0) {
            sizeId = sizeRows[0].id;
        } else {
            const [newSizeResult] = await connection.execute(
                'INSERT INTO sizes (name) VALUES (?)', 
                [size.trim()]
            );
            sizeId = newSizeResult.insertId;
        }

        // Step 4: Insert design specifications (color, texture, shapes, icing)
        const [specResult] = await connection.execute(
            'INSERT INTO design_specs (color, texture, shapes, icing) VALUES (?, ?, ?, ?)',
            [color || 'Standard', texture || 'Smooth', shapes || 'Solid', icing || 'Buttercream']
        );
        const specId = specResult.insertId;

        // Step 5: Insert main record into cake_designs with base_price and image reference
        const [designResult] = await connection.execute(
            `INSERT INTO cake_designs (title, category_id, flavor_id, size_id, spec_id, base_price, imageUrl) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [title, categoryId, flavorId, sizeId, specId, parsedBasePrice, imageUrl]
        );

        await connection.commit();
        connection.release();

        res.status(201).json({
            success: true,
            message: 'Cake design created successfully!',
            data: {
                id: designResult.insertId,
                title,
                category: category.toLowerCase(),
                flavor: flavor.toLowerCase(),
                size: size.trim(),
                basePrice: parsedBasePrice,
                design: { color, texture, shapes, icing },
                imageUrl
            }
        });
    } catch (error) {
        await connection.rollback();
        connection.release();
        res.status(400).json({ success: false, error: error.message });
    }
});

// 3. GET /api/cake-designs - Retrieve all cake designs using SQL JOINs across normalized tables
router.get('/', async (req, res) => {
    try {
        const { category, flavor, size } = req.query;
        let query = `
            SELECT cd.id, cd.title, cat.name AS category, f.name AS flavor, s.name AS size,
                   cd.base_price, ds.color, ds.texture, ds.shapes, ds.icing, cd.imageUrl, cd.createdAt
            FROM cake_designs cd
            JOIN categories cat ON cd.category_id = cat.id
            JOIN flavors f ON cd.flavor_id = f.id
            JOIN sizes s ON cd.size_id = s.id
            JOIN design_specs ds ON cd.spec_id = ds.id
            WHERE 1=1
        `;
        let params = [];

        if (category && category !== 'all') {
            query += ' AND cat.name = ?';
            params.push(category.toLowerCase());
        }
        if (flavor) {
            query += ' AND f.name = ?';
            params.push(flavor.toLowerCase());
        }
        if (size) {
            query += ' AND s.name = ?';
            params.push(size);
        }

        query += ' ORDER BY cd.createdAt DESC';

        const [rows] = await pool.execute(query, params);

        const formattedDesigns = rows.map(item => ({
            id: item.id,
            title: item.title,
            category: item.category,
            flavor: item.flavor,
            size: item.size,
            basePrice: parseFloat(item.base_price) || 350.00,
            design: {
                color: item.color,
                texture: item.texture,
                shapes: item.shapes,
                icing: item.icing
            },
            imageUrl: item.imageUrl || 'minimalist.jpg',
            createdAt: item.createdAt
        }));

        res.status(200).json({ success: true, count: formattedDesigns.length, data: formattedDesigns });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 4. GET /api/cake-designs/:id - Retrieve a single design by ID
router.get('/:id', async (req, res) => {
    try {
        const query = `
            SELECT cd.id, cd.title, cat.name AS category, f.name AS flavor, s.name AS size,
                   cd.base_price, ds.color, ds.texture, ds.shapes, ds.icing, cd.imageUrl, cd.createdAt
            FROM cake_designs cd
            JOIN categories cat ON cd.category_id = cat.id
            JOIN flavors f ON cd.flavor_id = f.id
            JOIN sizes s ON cd.size_id = s.id
            JOIN design_specs ds ON cd.spec_id = ds.id
            WHERE cd.id = ?
        `;
        const [rows] = await pool.execute(query, [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Design not found' });
        }

        const item = rows[0];
        res.status(200).json({
            success: true,
            data: {
                id: item.id,
                title: item.title,
                category: item.category,
                flavor: item.flavor,
                size: item.size,
                basePrice: parseFloat(item.base_price) || 350.00,
                design: {
                    color: item.color,
                    texture: item.texture,
                    shapes: item.shapes,
                    icing: item.icing
                },
                imageUrl: item.imageUrl || 'minimalist.jpg',
                createdAt: item.createdAt
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 5. DELETE /api/cake-designs/:id - Remove a cake design
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await pool.execute('DELETE FROM cake_designs WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Design not found' });
        }
        res.status(200).json({ success: true, message: 'Cake design deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;