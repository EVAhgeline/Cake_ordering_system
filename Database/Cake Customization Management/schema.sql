
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