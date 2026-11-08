
const express = require('express');
const router = express.Router();
const pool = require('../db');

// ==========================================
// GET CAKE SIZES FROM MYSQL
// ==========================================

router.get('/sizes', async (req, res) => {
    try {
        const [sizes] = await pool.execute(`
            SELECT
                id,
                name,
                base_price,
                extra_price
            FROM sizes
            ORDER BY id ASC
        `);

        res.json({
            success: true,
            data: sizes.map(size => ({
                id: size.id,
                name: size.name,
                basePrice: Number(size.base_price),
                extraPrice: Number(size.extra_price)
            }))
        });

    } catch (error) {
        console.error('Error loading cake sizes:', error.message);

        res.status(500).json({
            success: false,
            message: 'Failed to load cake sizes.'
        });
    }
});


// ==========================================
// GET CAKE FLAVORS FROM MYSQL
// ==========================================

router.get('/flavors', async (req, res) => {
    try {
        const [flavors] = await pool.execute(`
            SELECT id, name, extra_price
            FROM flavors
            ORDER BY id ASC
        `);

        res.json({
            success: true,
            data: flavors.map(flavor => ({
                id: flavor.id,
                name: flavor.name,
                extraPrice: Number(flavor.extra_price)
            }))
        });

    } catch (error) {
        console.error('Error loading cake flavors:', error.message);

        res.status(500).json({
            success: false,
            message: 'Failed to load cake flavors.'
        });
    }
});


// ==========================================
// GET ALL CAKE DESIGNS
// ==========================================

router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT
                cd.id,
                cd.title,
                cd.category_id,
                cd.flavor_id,
                cd.size_id,
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

            categoryId: item.category_id,
            category: item.category,

            flavorId: item.flavor_id,
            flavor: item.flavor,

            sizeId: item.size_id,
            size: item.size,

            basePrice: Number(item.base_price),

            design: {
                color: item.color,
                texture: item.texture,
                shape: item.shapes,
                pattern: item.texture,
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
