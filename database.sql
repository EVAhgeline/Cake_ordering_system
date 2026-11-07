
-- ==========================================
-- SWEET CUSTOM - CAKE ORDERING SYSTEM
-- DATABASE SETUP
-- ==========================================

CREATE DATABASE IF NOT EXISTS cake_ordering_system;

USE cake_ordering_system;


-- ==========================================
-- 1. EMPLOYEE TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS employee (
    employee_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    contact VARCHAR(20),
    email VARCHAR(100),
    address VARCHAR(255),
    hire_date DATE,
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ==========================================
-- 2. SUPPLIER TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS supplier (
    supplier_id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_name VARCHAR(100) NOT NULL,
    contact VARCHAR(20),
    email VARCHAR(100),
    address VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ==========================================
-- 3. INVENTORY TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS inventory (
    inventory_id INT AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(100) NOT NULL,
    quantity DECIMAL(10,2) DEFAULT 0,
    unit VARCHAR(30) NOT NULL,
    reorder_level DECIMAL(10,2) DEFAULT 5,
    unit_cost DECIMAL(10,2) DEFAULT 0,
    supplier_id INT NULL,
    employee_id INT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (supplier_id)
        REFERENCES supplier(supplier_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    FOREIGN KEY (employee_id)
        REFERENCES employee(employee_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);


-- ==========================================
-- 4. INVENTORY USAGE TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS inventory_usage (
    usage_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    inventory_id INT NOT NULL,
    quantity_used DECIMAL(10,2) NOT NULL,
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (inventory_id)
        REFERENCES inventory(inventory_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);


-- ==========================================
-- 5. CAKE DESIGN INGREDIENT TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS cake_design_ingredient (
    id INT AUTO_INCREMENT PRIMARY KEY,
    design_id INT NOT NULL,
    inventory_id INT NOT NULL,
    quantity_required DECIMAL(10,2) NOT NULL,

    FOREIGN KEY (inventory_id)
        REFERENCES inventory(inventory_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);


-- ==========================================
-- DISPLAY DATABASE TABLES
-- ==========================================

SHOW TABLES;


-- ==========================================
-- CHECK TABLE STRUCTURES
-- ==========================================

DESCRIBE employee;
DESCRIBE supplier;
DESCRIBE inventory;
DESCRIBE inventory_usage;
DESCRIBE cake_design_ingredient;
