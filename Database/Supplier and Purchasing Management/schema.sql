

CREATE TABLE supplier (
    supplier_id INT NOT NULL AUTO_INCREMENT,
    supplier_name VARCHAR(100) NOT NULL,
    contact VARCHAR(20) DEFAULT NULL,
    email VARCHAR(100) DEFAULT NULL,
    address VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (supplier_id)
);

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


