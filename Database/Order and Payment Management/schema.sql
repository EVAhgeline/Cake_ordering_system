
CREATE TABLE Employee (
    employee_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'Baker'
);

-- 2. CATEGORY
CREATE TABLE Category (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL UNIQUE
);


CREATE TABLE Flavor (
    flavor_id INT AUTO_INCREMENT PRIMARY KEY,
    flavor_name VARCHAR(50) NOT NULL UNIQUE,
    extra_price DECIMAL(10,2) DEFAULT 0.00
);

CREATE TABLE Size (
    size_id INT AUTO_INCREMENT PRIMARY KEY,
    size_name VARCHAR(50) NOT NULL UNIQUE,
    extra_price DECIMAL(10,2) DEFAULT 0.00
);

CREATE TABLE Design_Specs (
    spec_id INT AUTO_INCREMENT PRIMARY KEY,
    color VARCHAR(50),
    texture VARCHAR(50),
    shapes VARCHAR(50),
    icing VARCHAR(50)
);

CREATE TABLE Cake_Design (
    design_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    category_id INT NOT NULL,
    flavor_id INT NOT NULL,
    size_id INT NOT NULL,
    spec_id INT NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(255) NOT NULL,

    CONSTRAINT fk_cake_category FOREIGN KEY (category_id) REFERENCES Category(category_id),
    CONSTRAINT fk_cake_flavor FOREIGN KEY (flavor_id) REFERENCES Flavor(flavor_id),
    CONSTRAINT fk_cake_size FOREIGN KEY (size_id) REFERENCES Size(size_id),
    CONSTRAINT fk_cake_spec FOREIGN KEY (spec_id) REFERENCES Design_Specs(spec_id)
);

CREATE TABLE Customer (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact VARCHAR(20),
    address VARCHAR(255)
);



CREATE TABLE Custom_Order (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    employee_id INT,
    order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    delivery_date DATETIME,
    status VARCHAR(50) DEFAULT 'Pending',

    CONSTRAINT fk_order_customer FOREIGN KEY (customer_id) REFERENCES Customer(customer_id),
    CONSTRAINT fk_order_employee FOREIGN KEY (employee_id) REFERENCES Employee(employee_id)
);

CREATE TABLE Order_Detail (
    detail_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    design_id INT NOT NULL,
    flavor_id INT NOT NULL,
    size_id INT NOT NULL,
    message_on_cake VARCHAR(255),
    quantity INT NOT NULL DEFAULT 1,

    CONSTRAINT fk_detail_order FOREIGN KEY (order_id) REFERENCES Custom_Order(order_id),
    CONSTRAINT fk_detail_design FOREIGN KEY (design_id) REFERENCES Cake_Design(design_id),
    CONSTRAINT fk_detail_flavor FOREIGN KEY (flavor_id) REFERENCES Flavor(flavor_id),
    CONSTRAINT fk_detail_size FOREIGN KEY (size_id) REFERENCES Size(size_id),
    CONSTRAINT chk_quantity CHECK (quantity > 0)
);

CREATE TABLE Payment (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    method VARCHAR(50) DEFAULT 'Cash',
    downpayment DECIMAL(10,2) DEFAULT 0.00,
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_payment_order FOREIGN KEY (order_id) REFERENCES Custom_Order(order_id),
    CONSTRAINT chk_total_amount CHECK (total_amount >= 0),
    CONSTRAINT chk_downpayment CHECK (downpayment >= 0)
);