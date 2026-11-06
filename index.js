const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Import Routes (Make sure these match your actual file names)
const cakeDesignRoutes = require('./cake_design');
// const sizeRoutes = require('./Size');   // Uncomment if you have Size.js
// const flavorRoutes = require('./Flavor'); // Uncomment if you have Flavor.js

// Mount API Routes
app.use('/api/cake-designs', cakeDesignRoutes);
// app.use('/api/sizes', sizeRoutes);
// app.use('/api/flavors', flavorRoutes);

// Homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
const PORT = process.env.PORT || 12067;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});