const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1. Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// 2. Configure Multer Storage with Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'cake-designs', // Folder name in your Cloudinary account
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
        transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
    }
});

const upload = multer({ storage: storage });

// 3. Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cake_design_db')
    .then(() => console.log('Successfully connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// 4. Updated Cake Design Schema (Added imageUrl)
const cakeDesignSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true, 
        trim: true 
    },
    category: { 
        type: String, 
        enum: ['floral', 'korean', 'cartoon', 'minimalist', 'vintage'], 
        required: true,
        lowercase: true
    },
    flavor: { 
        type: String, 
        enum: ['ube', 'mocha', 'chocolate', 'vanilla', 'strawberry'], 
        required: true,
        lowercase: true
    },
    design: {
        color: { type: String, required: true },
        texture: { type: String, required: true },
        shapes: { type: String, required: true },
        icing: { type: String, required: true }
    },
    size: { 
        type: String, 
        required: true 
    },
    imageUrl: { 
        type: String // Stores the secure URL returned by Cloudinary
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

const CakeDesign = mongoose.model('CakeDesign', cakeDesignSchema);

// 5. API Routes

// CREATE a new cake design with an optional reference photo upload
app.post('/api/cakes', upload.single('referencePhoto'), async (req, res) => {
    try {
        // If design is sent as a string via form-data, parse it into an object
        let designData = req.body.design;
        if (typeof designData === 'string') {
            designData = JSON.parse(designData);
        }

        const newCake = new CakeDesign({
            title: req.body.title,
            category: req.body.category,
            flavor: req.body.flavor,
            design: designData,
            size: req.body.size,
            imageUrl: req.file ? req.file.path : null // req.file.path contains the Cloudinary secure URL
        });

        const savedCake = await newCake.save();
        res.status(201).json({
            success: true,
            message: 'Cake design created successfully with reference photo!',
            data: savedCake
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// GET all cake designs (with optional filtering)
app.get('/api/cakes', async (req, res) => {
    try {
        const { category, flavor } = req.query;
        let filter = {};
        
        if (category) filter.category = category.toLowerCase();
        if (flavor) filter.flavor = flavor.toLowerCase();

        const cakes = await CakeDesign.find(filter);
        res.status(200).json({
            success: true,
            count: cakes.length,
            data: cakes
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET a single cake design by ID
app.get('/api/cakes/:id', async (req, res) => {
    try {
        const cake = await CakeDesign.findById(req.params.id);
        if (!cake) {
            return res.status(404).json({ success: false, message: 'Cake design not found' });
        }
        res.status(200).json({ success: true, data: cake });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 6. Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});