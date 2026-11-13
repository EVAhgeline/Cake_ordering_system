
CREATE DATABASE cake_ordering_system;

USE cake_ordering_system;


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



 


     



