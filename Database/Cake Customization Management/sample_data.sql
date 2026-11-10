--  Insert categories (IDs match the cake design records below)
INSERT INTO categories (id, name) VALUES
(1, 'minimalist'),
(2, 'floral'),
(3, 'cartoon'),
(4, 'korean'),
(5, 'vintage');

--  Insert flavors and additional prices
INSERT INTO flavors (id, name, extra_price) VALUES
(1, 'ube', 50.00),
(2, 'mocha', 50.00),
(3, 'chocolate', 0.00),
(4, 'vanilla', 0.00),
(5, 'strawberry', 75.00);

--  Insert sizes and additional prices
INSERT INTO sizes (id, name, extra_price) VALUES
(1, 'Round (6")', 0.00),
(2, 'Round (8")', 150.00),
(3, 'Tiered (2-Tier)', 500.00);

--  Insert design specifications
INSERT INTO design_specs (id, color, texture, shapes, icing) VALUES
(1, 'Pastel', 'Smooth', 'Solid', 'Buttercream'),
(2, 'White', 'Smooth', 'Floral', 'Fondant'),
(3, 'Bright', 'Smooth', 'Illustrated', 'Buttercream'),
(4, 'Pastel Pink', 'Smooth', 'Minimal', 'Buttercream'),
(5, 'Antique Cream', 'Vintage Ruffled', 'Scalloped', 'Buttercream');

--  Insert sample cake designs
INSERT INTO cake_designs
    (id, title, category_id, flavor_id, size_id, spec_id, base_price, imageUrl)
VALUES
(1, 'Minimalist Cake', 1, 4, 1, 1, 350.00, 'images/minimalist.jpg'),
(2, 'Floral Cake',     2, 5, 3, 2, 1200.00, 'images/floral.jpg'),
(3, 'Cartoon Cake',    3, 3, 1, 3, 500.00, 'images/cartoon.jpg'),
(4, 'Korean Cake',     4, 1, 1, 4, 450.00, 'images/korean.jpg'),
(5, 'Vintage Cake',    5, 2, 2, 5, 850.00, 'images/vintage.jpg');
