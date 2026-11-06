-- =========================================================
-- CAKE DESIGN & ORDERING SYSTEM
-- Database: cake_design_db
-- IMPORTANT: This clean setup DROPS and recreates the project
-- tables. Existing data in those tables will be erased.
-- =========================================================

CREATE DATABASE IF NOT EXISTS cake_design_db;
USE cake_design_db;

-- 1. Drop child table first, then its parent tables
DROP TABLE IF EXISTS cake_designs;
DROP TABLE IF EXISTS design_specs;
DROP TABLE IF EXISTS sizes;
DROP TABLE IF EXISTS flavors;
DROP TABLE IF EXISTS categories;

-- 2. Create lookup tables
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE flavors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    extra_price DECIMAL(10,2) NOT NULL DEFAULT 0.00
);

CREATE TABLE sizes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    extra_price DECIMAL(10,2) NOT NULL DEFAULT 0.00
);

-- 3. Create design specifications
CREATE TABLE design_specs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    color VARCHAR(255) NOT NULL,
    texture VARCHAR(255) NOT NULL,
    shapes VARCHAR(255) NOT NULL,
    icing VARCHAR(255) NOT NULL
);

-- 4. Create the main cake designs table
CREATE TABLE cake_designs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    base_price DECIMAL(10,2) NOT NULL DEFAULT 350.00,
    category_id INT NOT NULL,
    flavor_id INT NOT NULL,
    size_id INT NOT NULL,
    spec_id INT NOT NULL,
    imageUrl VARCHAR(500),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_cake_category
        FOREIGN KEY (category_id) REFERENCES categories(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_cake_flavor
        FOREIGN KEY (flavor_id) REFERENCES flavors(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_cake_size
        FOREIGN KEY (size_id) REFERENCES sizes(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_cake_design_spec
        FOREIGN KEY (spec_id) REFERENCES design_specs(id)
        ON DELETE CASCADE
);

-- 5. Insert categories (IDs match the cake design records below)
INSERT INTO categories (id, name) VALUES
(1, 'minimalist'),
(2, 'floral'),
(3, 'cartoon'),
(4, 'korean'),
(5, 'vintage');

-- 6. Insert flavors and additional prices
INSERT INTO flavors (id, name, extra_price) VALUES
(1, 'ube', 50.00),
(2, 'mocha', 50.00),
(3, 'chocolate', 0.00),
(4, 'vanilla', 0.00),
(5, 'strawberry', 75.00);

-- 7. Insert sizes and additional prices
INSERT INTO sizes (id, name, extra_price) VALUES
(1, 'Round (6")', 0.00),
(2, 'Round (8")', 150.00),
(3, 'Tiered (2-Tier)', 500.00);

-- 8. Insert design specifications
INSERT INTO design_specs (id, color, texture, shapes, icing) VALUES
(1, 'Pastel', 'Smooth', 'Solid', 'Buttercream'),
(2, 'White', 'Smooth', 'Floral', 'Fondant'),
(3, 'Bright', 'Smooth', 'Illustrated', 'Buttercream'),
(4, 'Pastel Pink', 'Smooth', 'Minimal', 'Buttercream'),
(5, 'Antique Cream', 'Vintage Ruffled', 'Scalloped', 'Buttercream');

-- 9. Insert sample cake designs
INSERT INTO cake_designs
    (id, title, category_id, flavor_id, size_id, spec_id, base_price, imageUrl)
VALUES
(1, 'Minimalist Cake', 1, 4, 1, 1, 350.00, 'images/minimalist.jpg'),
(2, 'Floral Cake',     2, 5, 3, 2, 1200.00, 'images/floral.jpg'),
(3, 'Cartoon Cake',    3, 3, 1, 3, 500.00, 'images/cartoon.jpg'),
(4, 'Korean Cake',     4, 1, 1, 4, 450.00, 'images/korean.jpg'),
(5, 'Vintage Cake',    5, 2, 2, 5, 850.00, 'images/vintage.jpg');

-- 10. Verify the tables and joined cake data
SHOW TABLES;

SELECT * FROM categories ORDER BY id;
SELECT * FROM flavors ORDER BY id;
SELECT * FROM sizes ORDER BY id;
SELECT * FROM design_specs ORDER BY id;

SELECT
    cd.id,
    cd.title,
    cd.base_price,
    c.name AS category,
    f.name AS flavor,
    s.name AS size,
    ds.color,
    ds.texture,
    ds.shapes,
    ds.icing,
    cd.imageUrl,
    cd.createdAt
FROM cake_designs AS cd
JOIN categories AS c ON cd.category_id = c.id
JOIN flavors AS f ON cd.flavor_id = f.id
JOIN sizes AS s ON cd.size_id = s.id
JOIN design_specs AS ds ON cd.spec_id = ds.id
ORDER BY cd.id;
