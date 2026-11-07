const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET cake sizes
router.get('/sizes', async (req, res) => {
    try {
        // Replace these sample values with your actual sizes
        const sizes = [
            { id: 1, name: '6 inches', extraPrice: 0 },
            { id: 2, name: '8 inches', extraPrice: 150 },
            { id: 3, name: '10 inches', extraPrice: 300 }
        ];

        res.json({
            success: true,
            data: sizes
        });
    } catch (err) {
        console.error('Error loading cake sizes:', err);
        res.status(500).json({ success: false, message: 'Failed to load sizes' });
    }
});

// GET cake flavors
router.get('/flavors', async (req, res) => {
    try {
        const flavors = [
            { id: 3, name: 'chocolate', extraPrice: 0 },
            { id: 4, name: 'vanilla', extraPrice: 0 },
            { id: 5, name: 'strawberry', extraPrice: 75 }
        ];

        res.json({
            success: true,
            data: flavors
        });
    } catch (err) {
        console.error('Error loading cake flavors:', err);
        res.status(500).json({ success: false, message: 'Failed to load flavors' });
    }
});


// ==========================================
// GET ALL CAKE DESIGNS FROM MYSQL
// ==========================================

router.get('/', async (req, res) => {

    try {

        const query = `
            SELECT
                cd.id,
                cd.title,
                cat.name AS category,
                f.name AS flavor,
                s.name AS size,
                cd.base_price,
                ds.color,
                ds.texture,
                ds.shapes,
                ds.icing,
                cd.imageUrl,
                cd.createdAt

            FROM cake_designs cd

            JOIN categories cat
                ON cd.category_id = cat.id

            JOIN flavors f
                ON cd.flavor_id = f.id

            JOIN sizes s
                ON cd.size_id = s.id

            JOIN design_specs ds
                ON cd.spec_id = ds.id

            ORDER BY cd.createdAt DESC
        `;

        const [rows] = await pool.execute(query);

        const designs = rows.map(item => ({

            id: item.id,
            title: item.title,
            category: item.category,
            flavor: item.flavor,
            size: item.size,

            basePrice: Number(item.base_price) || 350,

            design: {
                color: item.color,
                texture: item.texture,
                shapes: item.shapes,
                icing: item.icing
            },

            imageUrl: item.imageUrl || 'images/minimalist.jpg',

            createdAt: item.createdAt

        }));

        res.status(200).json({
            success: true,
            count: designs.length,
            data: designs
        });

    } catch (error) {

        console.error('Error retrieving cake designs:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve cake designs.',
            error: error.message
        });

    }

});


module.exports = router;
