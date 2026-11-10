INSERT INTO Category (category_id, category_name) VALUES 
(1, 'minimalist'), (2, 'floral'), (3, 'cartoon'), (4, 'korean'), (5, 'vintage');

INSERT INTO Flavor (flavor_id, flavor_name, extra_price) VALUES 
(1, 'Vanilla', 0.00), (2, 'Chocolate', 0.00), (3, 'Strawberry', 30.00), (4, 'Ube', 50.00), (5, 'Mocha', 40.00);

INSERT INTO Size (size_id, size_name, extra_price) VALUES 
(1, 'Round (6")', 0.00), (2, 'Round (8")', 150.00), (3, 'Tiered (2-Tier)', 500.00);

INSERT INTO Design_Specs (spec_id, color, texture, shapes, icing) VALUES 
(1, 'Pastel', 'Smooth', 'Solid', 'Buttercream'),
(2, 'White', 'Smooth', 'Floral', 'Fondant'),
(3, 'Bright', 'Smooth', 'Illustrated', 'Buttercream'),
(4, 'Pastel Pink', 'Smooth', 'Minimal', 'Buttercream'),
(5, 'Antique Cream', 'Vintage Ruffled', 'Scalloped', 'Buttercream');

INSERT INTO Cake_Design (design_id, title, category_id, flavor_id, size_id, spec_id, base_price, image_url) VALUES 
(1, 'Minimalist Cake', 1, 1, 1, 1, 350.00, 'images/minimalist.jpg'),
(2, 'Floral Cake', 2, 3, 3, 2, 1200.00, 'images/floral.jpg'),
(3, 'Cartoon Cake', 3, 2, 1, 3, 500.00, 'images/cartoon.jpg'),
(4, 'Korean Cake', 4, 4, 1, 4, 450.00, 'images/korean.jpg'),
(5, 'Vintage Cake', 5, 5, 2, 5, 850.00, 'images/vintage.jpg');