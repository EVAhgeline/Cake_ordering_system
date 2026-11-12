
-- ==========================================
-- 1. CUSTOMER TABLE
-- ==========================================

CREATE TABLE Customer (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact VARCHAR(20),
    address VARCHAR(255)
);


-- ==========================================
-- 2. CUSTOM ORDER TABLE
-- ==========================================

CREATE TABLE Custom_Order (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    employee_id INT,
    order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    delivery_date DATETIME,
    status VARCHAR(50) DEFAULT 'Pending',

    FOREIGN KEY (customer_id)
        REFERENCES Customer(customer_id),

    FOREIGN KEY (employee_id)
        REFERENCES Employee(employee_id)
);


-- ==========================================
-- 3. ORDER DETAIL TABLE
-- ==========================================

CREATE TABLE Order_Detail (
    detail_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    design_id INT NOT NULL,
    flavor_id INT NOT NULL,
    size_id INT NOT NULL,
    message_on_cake VARCHAR(255),
    quantity INT NOT NULL DEFAULT 1,

    FOREIGN KEY (order_id)
        REFERENCES Custom_Order(order_id),

    FOREIGN KEY (design_id)
        REFERENCES Cake_Design(design_id),

    FOREIGN KEY (flavor_id)
        REFERENCES Flavor(flavor_id),

    FOREIGN KEY (size_id)
        REFERENCES Size(size_id),

    CHECK (quantity > 0)
);


-- ==========================================
-- 4. PAYMENT TABLE
-- ==========================================

CREATE TABLE Payment (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    method VARCHAR(50) DEFAULT 'Cash',
    downpayment DECIMAL(10,2) DEFAULT 0.00,
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (order_id)
        REFERENCES Custom_Order(order_id),

    CHECK (total_amount >= 0),
    CHECK (downpayment >= 0)
);
