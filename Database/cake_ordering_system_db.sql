
-- ==========================================
-- CAKE ORDERING SYSTEM DATABASE
-- ==========================================

CREATE DATABASE cake_ordering_system;

USE cake_ordering_system;


-- ==========================================
-- 1. MASTER TABLES
-- ==========================================

CREATE TABLE categories (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE flavors (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    extra_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    PRIMARY KEY (id)
);

CREATE TABLE sizes (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    base_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    extra_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    PRIMARY KEY (id)
);

CREATE TABLE design_specs (
    id INT NOT NULL AUTO_INCREMENT,
    color VARCHAR(100) DEFAULT NULL,
    texture VARCHAR(100) DEFAULT NULL,
    shapes VARCHAR(255) DEFAULT NULL,
    icing VARCHAR(100) DEFAULT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE customer (
    customer_id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    contact VARCHAR(20) NOT NULL,
    address VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (customer_id)
);

CREATE TABLE employee (
    employee_id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    contact VARCHAR(20) DEFAULT NULL,
    email VARCHAR(100) DEFAULT NULL,
    address VARCHAR(255) DEFAULT NULL,
    hire_date DATE DEFAULT NULL,
    status ENUM('Active','Inactive') DEFAULT 'Active',
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (employee_id)
);

CREATE TABLE supplier (
    supplier_id INT NOT NULL AUTO_INCREMENT,
    supplier_name VARCHAR(100) NOT NULL,
    contact VARCHAR(20) DEFAULT NULL,
    email VARCHAR(100) DEFAULT NULL,
    address VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (supplier_id)
);


-- ==========================================
-- 2. CAKE DESIGN TABLES
-- ==========================================

CREATE TABLE cake_designs (
    id INT NOT NULL AUTO_INCREMENT,
    title VARCHAR(150) NOT NULL,
    category_id INT NOT NULL,
    flavor_id INT NOT NULL,
    size_id INT NOT NULL,
    spec_id INT NOT NULL,
    base_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    imageUrl VARCHAR(500) DEFAULT NULL,
    createdAt TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY category_id (category_id),
    KEY flavor_id (flavor_id),
    KEY size_id (size_id),
    KEY spec_id (spec_id),
    CONSTRAINT cake_designs_ibfk_1
        FOREIGN KEY (category_id) REFERENCES categories(id),
    CONSTRAINT cake_designs_ibfk_2
        FOREIGN KEY (flavor_id) REFERENCES flavors(id),
    CONSTRAINT cake_designs_ibfk_3
        FOREIGN KEY (size_id) REFERENCES sizes(id),
    CONSTRAINT cake_designs_ibfk_4
        FOREIGN KEY (spec_id) REFERENCES design_specs(id)
);

CREATE TABLE employeeaccount (
    account_id INT NOT NULL AUTO_INCREMENT,
    employee_id INT NOT NULL,
    login_id VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (account_id),
    UNIQUE KEY employee_id (employee_id),
    UNIQUE KEY login_id (login_id),
    CONSTRAINT fk_employee_account
        FOREIGN KEY (employee_id)
        REFERENCES employee(employee_id)
        ON DELETE CASCADE
);


-- ==========================================
-- 3. INVENTORY TABLES
-- ==========================================

CREATE TABLE inventory (
    inventory_id INT NOT NULL AUTO_INCREMENT,
    item_name VARCHAR(100) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    unit VARCHAR(30) NOT NULL,
    reorder_level DECIMAL(10,2) DEFAULT 5.00,
    unit_cost DECIMAL(10,2) DEFAULT 0.00,
    supplier_id INT DEFAULT NULL,
    employee_id INT DEFAULT NULL,
    last_updated TIMESTAMP NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (inventory_id),
    KEY supplier_id (supplier_id),
    KEY employee_id (employee_id),
    CONSTRAINT inventory_ibfk_1
        FOREIGN KEY (supplier_id) REFERENCES supplier(supplier_id),
    CONSTRAINT inventory_ibfk_2
        FOREIGN KEY (employee_id) REFERENCES employee(employee_id)
);

CREATE TABLE cake_design_ingredient (
    id INT NOT NULL AUTO_INCREMENT,
    design_id INT NOT NULL,
    inventory_id INT NOT NULL,
    quantity_required DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY design_id (design_id, inventory_id),
    KEY inventory_id (inventory_id),
    CONSTRAINT cake_design_ingredient_ibfk_1
        FOREIGN KEY (inventory_id)
        REFERENCES inventory(inventory_id)
);

CREATE TABLE inventory_usage (
    usage_id INT NOT NULL AUTO_INCREMENT,
    order_id INT NOT NULL,
    inventory_id INT NOT NULL,
    quantity_used DECIMAL(10,2) NOT NULL,
    used_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usage_id),
    KEY inventory_id (inventory_id),
    CONSTRAINT inventory_usage_ibfk_1
        FOREIGN KEY (inventory_id)
        REFERENCES inventory(inventory_id)
);


-- ==========================================
-- 4. ORDER TABLES
-- ==========================================

CREATE TABLE custom_order (
    order_id INT NOT NULL AUTO_INCREMENT,
    customer_id INT NOT NULL,
    employee_id INT DEFAULT NULL,
    order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    delivery_date DATETIME DEFAULT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    PRIMARY KEY (order_id),
    KEY fk_custom_order_customer (customer_id),
    KEY fk_custom_order_employee (employee_id),
    CONSTRAINT fk_custom_order_customer
        FOREIGN KEY (customer_id)
        REFERENCES customer(customer_id),
    CONSTRAINT fk_custom_order_employee
        FOREIGN KEY (employee_id)
        REFERENCES employee(employee_id)
        ON DELETE SET NULL
);

CREATE TABLE order_detail (
    detail_id INT NOT NULL AUTO_INCREMENT,
    order_id INT NOT NULL,
    design_id INT NOT NULL,
    flavor_id INT NOT NULL,
    size_id INT NOT NULL,
    message_on_cake VARCHAR(255) DEFAULT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2)
        GENERATED ALWAYS AS (quantity * unit_price) STORED,
    PRIMARY KEY (detail_id),
    KEY fk_order_detail_order (order_id),
    KEY fk_order_detail_design (design_id),
    KEY fk_order_detail_flavor (flavor_id),
    KEY fk_order_detail_size (size_id),
    CONSTRAINT fk_order_detail_design
        FOREIGN KEY (design_id) REFERENCES cake_designs(id),
    CONSTRAINT fk_order_detail_flavor
        FOREIGN KEY (flavor_id) REFERENCES flavors(id),
    CONSTRAINT fk_order_detail_order
        FOREIGN KEY (order_id)
        REFERENCES custom_order(order_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_order_detail_size
        FOREIGN KEY (size_id) REFERENCES sizes(id)
);

CREATE TABLE payment (
    payment_id INT NOT NULL AUTO_INCREMENT,
    order_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    method VARCHAR(50) DEFAULT 'Cash',
    downpayment DECIMAL(10,2) DEFAULT 0.00,
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (payment_id),
    KEY fk_payment_order (order_id),
    CONSTRAINT fk_payment_order
        FOREIGN KEY (order_id)
        REFERENCES custom_order(order_id)
        ON DELETE CASCADE
);


-- ==========================================
-- 5. PURCHASE ORDER TABLES
-- ==========================================

CREATE TABLE purchase_order (
    purchase_order_id INT NOT NULL AUTO_INCREMENT,
    supplier_id INT NOT NULL,
    employee_id INT NOT NULL,
    order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    expected_delivery_date DATE DEFAULT NULL,
    total_amount DECIMAL(10,2) DEFAULT 0.00,
    status ENUM('Pending','Approved','Received','Cancelled')
        DEFAULT 'Pending',
    PRIMARY KEY (purchase_order_id),
    KEY fk_po_supplier (supplier_id),
    KEY fk_po_employee (employee_id),
    CONSTRAINT fk_po_employee
        FOREIGN KEY (employee_id)
        REFERENCES employee(employee_id),
    CONSTRAINT fk_po_supplier
        FOREIGN KEY (supplier_id)
        REFERENCES supplier(supplier_id)
);

CREATE TABLE purchase_order_detail (
    purchase_order_detail_id INT NOT NULL AUTO_INCREMENT,
    purchase_order_id INT NOT NULL,
    inventory_id INT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2)
        GENERATED ALWAYS AS (quantity * unit_price) STORED,
    PRIMARY KEY (purchase_order_detail_id),
    KEY fk_pod_purchase_order (purchase_order_id),
    KEY fk_pod_inventory (inventory_id),
    CONSTRAINT fk_pod_inventory
        FOREIGN KEY (inventory_id)
        REFERENCES inventory(inventory_id),
    CONSTRAINT fk_pod_purchase_order
        FOREIGN KEY (purchase_order_id)
        REFERENCES purchase_order(purchase_order_id)
        ON DELETE CASCADE
);

